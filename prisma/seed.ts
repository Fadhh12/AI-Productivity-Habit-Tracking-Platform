import { PrismaClient, GoalHorizon, GoalStatus, CheckinStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@continuum.app';
const DEMO_PASSWORD = 'Demo12345!';

/** Local (Asia/Jakarta) calendar dates for "today" back through 6 days ago, newest first. */
const LOCAL_TODAY = '2026-09-18';
const WEEK_DATES = ['2026-09-18', '2026-09-17', '2026-09-16', '2026-09-15', '2026-09-14', '2026-09-13', '2026-09-12'];

function midnightUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function atLocalTime(dateStr: string, hour: number, minute = 0): Date {
  // Stored as a literal UTC instant on `dateStr` — the app's own date-range queries
  // (e.g. GET /api/activities?date=) compare against UTC day boundaries too, so this
  // keeps seeded activities aligned with whichever calendar day the UI asks for.
  const d = midnightUtc(dateStr);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, passwordHash, timezone: 'Asia/Jakarta' },
  });

  const [techCat, designCat, kuliahCat, healthCat, personalCat] = await Promise.all([
    prisma.category.create({ data: { userId: user.id, name: 'Tech & Coding', color: '#047857' } }),
    prisma.category.create({ data: { userId: user.id, name: 'Desain Produk', color: '#6D28D9' } }),
    prisma.category.create({ data: { userId: user.id, name: 'Kuliah Akhir', color: '#2563EB' } }),
    prisma.category.create({ data: { userId: user.id, name: 'Health & Wellness', color: '#C2410C' } }),
    prisma.category.create({ data: { userId: user.id, name: 'Personal', color: '#71717A' } }),
  ]);

  const bukuGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Selesaikan 12 Buku Non-Fiksi',
      horizon: GoalHorizon.yearly,
      targetDate: new Date('2026-12-31'),
      status: GoalStatus.active,
    },
  });
  const mvpGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Launch MVP Continuum SaaS',
      horizon: GoalHorizon.yearly,
      targetDate: new Date('2026-11-30'),
      status: GoalStatus.active,
    },
  });
  const sehatGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Kesehatan Fisik & Pola Tidur Prima',
      horizon: GoalHorizon.yearly,
      targetDate: new Date('2026-12-31'),
      status: GoalStatus.active,
    },
  });

  const bukuOktober = await prisma.goal.create({
    data: {
      userId: user.id,
      parentGoalId: bukuGoal.id,
      title: 'Oktober: Selesaikan buku ke-8 "Atomic Habits"',
      horizon: GoalHorizon.monthly,
      targetDate: new Date('2026-10-31'),
      status: GoalStatus.active,
    },
  });
  const mvpOktober = await prisma.goal.create({
    data: {
      userId: user.id,
      parentGoalId: mvpGoal.id,
      title: 'Oktober: Deploy NestJS Core API & Auth Guard',
      horizon: GoalHorizon.monthly,
      targetDate: new Date('2026-10-31'),
      status: GoalStatus.completed,
    },
  });

  const habitDefs = [
    {
      name: 'Baca 20 Menit Tiap Pagi',
      frequency: 'daily',
      goalId: bukuOktober.id,
      pattern: ['done', 'done', 'done', 'done', 'done', 'skipped_forgiven', 'done'] as CheckinStatus[],
    },
    {
      name: 'Deep Work Coding 2 Jam',
      frequency: 'specific_days',
      goalId: mvpOktober.id,
      pattern: ['done', 'done', 'missed', 'done', 'done', 'done', 'done'] as CheckinStatus[],
    },
    {
      name: 'Olahraga & Stretching',
      frequency: 'weekly_count',
      goalId: sehatGoal.id,
      pattern: ['skipped_forgiven', 'done', 'done', 'skipped_forgiven', 'done', 'done', 'done'] as CheckinStatus[],
    },
    {
      name: 'Draft Skripsi Bab 3',
      frequency: 'weekly_count',
      goalId: null as string | null,
      pattern: ['done', 'missed', 'done', 'done', 'skipped_forgiven', 'done', 'done'] as CheckinStatus[],
    },
    {
      name: 'Journaling Malam',
      frequency: 'daily',
      goalId: null as string | null,
      pattern: ['done', 'done', 'done', 'done', 'done', 'done', 'skipped_forgiven'] as CheckinStatus[],
    },
  ];

  for (const def of habitDefs) {
    // pattern[0] = 6 days ago ... pattern[6] = today, matching WEEK_DATES which is newest-first.
    const chronological = [...def.pattern].reverse();
    let streak = 0;
    for (const status of chronological) {
      streak = status === 'done' ? streak + 1 : status === 'missed' ? 0 : streak;
    }
    const skipCountWindow = def.pattern.filter((s) => s === 'missed' || s === 'skipped_forgiven').length;

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        goalId: def.goalId,
        name: def.name,
        frequency: def.frequency,
        currentStreak: streak,
        skipCountWindow,
        createdAt: atLocalTime(WEEK_DATES[6], 6),
      },
    });

    await prisma.habitCheckin.createMany({
      data: WEEK_DATES.map((dateStr, i) => ({
        habitId: habit.id,
        checkinDate: midnightUtc(dateStr),
        status: def.pattern[i],
      })),
    });
  }

  const activityDefs: Array<{
    day: string;
    title: string;
    categoryId: string;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    note?: string;
  }> = [
    // WEEK_DATES is newest-first: index 0 = today, index 6 = 6 days ago.
    { day: WEEK_DATES[0], title: 'Baca "Atomic Habits"', categoryId: designCat.id, startHour: 6, startMinute: 30, endHour: 7, endMinute: 0 },
    { day: WEEK_DATES[0], title: 'Olahraga & Stretching', categoryId: healthCat.id, startHour: 7, startMinute: 30, endHour: 8, endMinute: 0 },
    { day: WEEK_DATES[0], title: 'Belajar NestJS & Prisma Schema', categoryId: techCat.id, startHour: 8, startMinute: 30, endHour: 10, endMinute: 30 },
    { day: WEEK_DATES[0], title: 'Riset UI/UX Benchmark', categoryId: designCat.id, startHour: 11, startMinute: 0, endHour: 12, endMinute: 30 },
    { day: WEEK_DATES[0], title: 'Draft Skripsi Bab 3 Metodologi', categoryId: kuliahCat.id, startHour: 13, startMinute: 30, endHour: 15, endMinute: 15 },
    { day: WEEK_DATES[0], title: 'Diskusi Tim Backend via Discord', categoryId: techCat.id, startHour: 16, startMinute: 0, endHour: 16, endMinute: 45 },

    { day: WEEK_DATES[1], title: 'Baca 20 Menit', categoryId: designCat.id, startHour: 6, startMinute: 30, endHour: 6, endMinute: 50 },
    { day: WEEK_DATES[1], title: 'Deep Work: Redis & BullMQ Queue', categoryId: techCat.id, startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
    { day: WEEK_DATES[1], title: 'Journaling Malam', categoryId: personalCat.id, startHour: 14, startMinute: 0, endHour: 14, endMinute: 20 },

    { day: WEEK_DATES[2], title: 'Deep Work Coding: Auth Guard', categoryId: techCat.id, startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
    { day: WEEK_DATES[2], title: 'Meeting Dosen Pembimbing', categoryId: kuliahCat.id, startHour: 14, startMinute: 0, endHour: 15, endMinute: 0 },

    { day: WEEK_DATES[3], title: 'Baca 20 Menit', categoryId: designCat.id, startHour: 6, startMinute: 30, endHour: 6, endMinute: 50 },
    { day: WEEK_DATES[3], title: 'Jogging Pagi', categoryId: healthCat.id, startHour: 7, startMinute: 0, endHour: 7, endMinute: 30 },
    { day: WEEK_DATES[3], title: 'Riset Kompetitor Produk', categoryId: designCat.id, startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },

    { day: WEEK_DATES[4], title: 'Deep Work Coding: NestJS Module', categoryId: techCat.id, startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
    { day: WEEK_DATES[4], title: 'Draft Skripsi Bab 2', categoryId: kuliahCat.id, startHour: 13, startMinute: 0, endHour: 14, endMinute: 30 },

    { day: WEEK_DATES[5], title: 'Baca 20 Menit', categoryId: designCat.id, startHour: 6, startMinute: 30, endHour: 6, endMinute: 50 },
    { day: WEEK_DATES[5], title: 'Stretching Sore', categoryId: healthCat.id, startHour: 10, startMinute: 0, endHour: 10, endMinute: 30 },

    { day: WEEK_DATES[6], title: 'Baca 20 Menit', categoryId: designCat.id, startHour: 6, startMinute: 30, endHour: 6, endMinute: 50 },
    { day: WEEK_DATES[6], title: 'Deep Work Coding: Redesign Frontend', categoryId: techCat.id, startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
  ];

  await prisma.activityLog.createMany({
    data: activityDefs.map((a) => ({
      userId: user.id,
      categoryId: a.categoryId,
      title: a.title,
      startTime: atLocalTime(a.day, a.startHour, a.startMinute),
      endTime: atLocalTime(a.day, a.endHour, a.endMinute),
      note: a.note ?? null,
    })),
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'ai_digest',
        message: 'AI Digest bulanan kamu sudah siap. Konsistensi membaca naik 12% minggu ini.',
        read: false,
      },
      {
        userId: user.id,
        type: 'streak',
        message: '"Baca 20 Menit Tiap Pagi" mencapai streak baru. Terus jaga ritme yang sehat.',
        read: false,
      },
      {
        userId: user.id,
        type: 'forgiveness',
        message: 'Satu hari "Olahraga & Stretching" ditandai sebagai jeda wajar — streak tetap aman.',
        read: true,
      },
    ],
  });

  console.log(`Seed selesai. Login pakai email="${DEMO_EMAIL}" password="${DEMO_PASSWORD}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
