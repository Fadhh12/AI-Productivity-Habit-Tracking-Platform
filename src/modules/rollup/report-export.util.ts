import PDFDocument from 'pdfkit';
import { MonthlyRollupSummary } from './rollup.service';

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function csvRow(cells: Array<string | number>): string {
  return cells.map(csvCell).join(',');
}

export function buildReportCsv(summary: MonthlyRollupSummary): string {
  const lines: string[] = [];

  lines.push(csvRow(['Laporan Bulanan', summary.month]));
  lines.push(csvRow(['Dibuat pada', summary.generatedAt]));
  lines.push('');

  lines.push('Distribusi Kategori (menit)');
  lines.push(csvRow(['Kategori', 'Menit']));
  for (const [name, minutes] of Object.entries(summary.categoryDistributionMinutes)) {
    lines.push(csvRow([name, Math.round(minutes)]));
  }
  lines.push('');

  lines.push('Status Checkin Habit');
  lines.push(csvRow(['Status', 'Jumlah']));
  for (const [status, count] of Object.entries(summary.checkinStatusCounts)) {
    lines.push(csvRow([status, count]));
  }
  lines.push('');

  lines.push('Tren Streak Habit');
  lines.push(csvRow(['Nama Habit', 'Streak Saat Ini', 'Goal Terkait']));
  for (const h of summary.habitStreakTrend) {
    lines.push(csvRow([h.name, h.currentStreak, h.goalTitle ?? '-']));
  }
  lines.push('');

  lines.push('Progress Goal');
  lines.push(csvRow(['Goal', 'Habit Selesai', 'Total Habit', 'Persentase']));
  for (const g of summary.goalProgress) {
    const pct = g.habitCount === 0 ? 0 : Math.round((g.doneCount / g.habitCount) * 100);
    lines.push(csvRow([g.goalTitle, g.doneCount, g.habitCount, `${pct}%`]));
  }

  return lines.join('\r\n');
}

export function buildReportPdf(summary: MonthlyRollupSummary): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Continuum — Laporan Bulanan', { align: 'left' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#666').text(`Periode: ${summary.month}`);
    doc.text(`Dibuat pada: ${new Date(summary.generatedAt).toLocaleString('id-ID')}`);
    doc.fillColor('#000');
    doc.moveDown();

    const section = (title: string) => {
      doc.moveDown(0.5);
      doc.fontSize(14).text(title, { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11);
    };

    section('Distribusi Kategori (menit)');
    const distEntries = Object.entries(summary.categoryDistributionMinutes);
    if (distEntries.length === 0) doc.text('Belum ada data aktivitas.');
    for (const [name, minutes] of distEntries) doc.text(`${name}: ${Math.round(minutes)} menit`);

    section('Status Checkin Habit');
    const statusEntries = Object.entries(summary.checkinStatusCounts);
    if (statusEntries.length === 0) doc.text('Belum ada data checkin.');
    for (const [status, count] of statusEntries) doc.text(`${status.replace('_', ' ')}: ${count}`);

    section('Tren Streak Habit');
    if (summary.habitStreakTrend.length === 0) doc.text('Belum ada habit dengan streak.');
    for (const h of summary.habitStreakTrend) {
      doc.text(`${h.name} — streak ${h.currentStreak}${h.goalTitle ? ` (goal: ${h.goalTitle})` : ''}`);
    }

    section('Progress Goal');
    if (summary.goalProgress.length === 0) doc.text('Belum ada goal dengan habit terpaut.');
    for (const g of summary.goalProgress) {
      const pct = g.habitCount === 0 ? 0 : Math.round((g.doneCount / g.habitCount) * 100);
      doc.text(`${g.goalTitle}: ${g.doneCount}/${g.habitCount} habit (${pct}%)`);
    }

    doc.end();
  });
}
