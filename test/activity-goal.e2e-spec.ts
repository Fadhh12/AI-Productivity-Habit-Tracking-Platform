import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/db/prisma.service';

jest.setTimeout(30000);

describe('Categories, activities and goals (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `e2e-activity-goal-${Date.now()}@example.com`;
  const password = 'Passw0rd!';
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);
    userId = res.body.user.id;
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    await app.close();
  });

  let categoryId: string;

  it('creates a category', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Deep Work', color: '#336699' })
      .expect(201);

    expect(res.body.name).toBe('Deep Work');
    categoryId = res.body.id;
  });

  it('lists the category back for the owner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.some((c: { id: string }) => c.id === categoryId)).toBe(true);
  });

  let activityId: string;

  it('rejects an activity where endTime is before startTime', async () => {
    await request(app.getHttpServer())
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Invalid activity',
        startTime: '2026-01-01T10:00:00.000Z',
        endTime: '2026-01-01T09:00:00.000Z',
      })
      .expect(400);
  });

  it('logs an activity for the day', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Focused coding session',
        categoryId,
        startTime: '2026-01-01T09:00:00.000Z',
        endTime: '2026-01-01T11:00:00.000Z',
      })
      .expect(201);

    expect(res.body.data.title).toBe('Focused coding session');
    activityId = res.body.data.id;
  });

  it('lists activities for that date', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/activities')
      .query({ date: '2026-01-01' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.some((a: { id: string }) => a.id === activityId)).toBe(true);
  });

  it('updates the activity note', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/activities/${activityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ note: 'Shipped the e2e suite' })
      .expect(200);

    expect(res.body.data.note).toBe('Shipped the e2e suite');
  });

  it('deletes the activity', async () => {
    await request(app.getHttpServer())
      .delete(`/api/activities/${activityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  let goalId: string;

  it('rejects a yearly goal with a parent goal', async () => {
    await request(app.getHttpServer())
      .post('/api/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Invalid yearly goal', horizon: 'yearly', parentGoalId: 'not-a-real-uuid' })
      .expect(400);
  });

  it('creates a yearly goal', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Ship Continuum v1', horizon: 'yearly' })
      .expect(201);

    expect(res.body.title).toBe('Ship Continuum v1');
    goalId = res.body.id;
  });

  it('creates a monthly goal under the yearly goal', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Harden production readiness', horizon: 'monthly', parentGoalId: goalId })
      .expect(201);

    expect(res.body.parentGoalId).toBe(goalId);
  });

  it('returns the goal breakdown with its child goals', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/goals/${goalId}/breakdown`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(goalId);
  });

  it('updates the goal status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'completed' })
      .expect(200);

    expect(res.body.status).toBe('completed');
  });

  it("rejects access to another user's goal", async () => {
    const otherEmail = `e2e-other-${Date.now()}@example.com`;
    const otherRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: otherEmail, password })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
      .expect(404);

    await prisma.user.delete({ where: { id: otherRes.body.user.id } }).catch(() => undefined);
  });

  it('deletes the category', async () => {
    await request(app.getHttpServer())
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
