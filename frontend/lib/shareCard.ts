export type ShareFormat = 'post' | 'story';

export interface ShareCardData {
  name: string;
  avatar?: string | null;
  streak: number;
  level: number;
  checkins: number;
}

const WIDTH = 1080;
const HEIGHTS: Record<ShareFormat, number> = { post: 1350, story: 1920 };
const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
const LIME = '#CCFF00';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Short, positive headline that scales with the streak; never guilt-based. */
export function streakHeadline(streak: number): string {
  if (streak >= 30) return 'Konsisten sebulan penuh!';
  if (streak >= 14) return 'Dua minggu tanpa putus!';
  if (streak >= 7) return 'Seminggu penuh konsisten!';
  if (streak >= 3) return 'Api konsistensi menyala!';
  return 'Langkah kecil, dampak besar.';
}

/** Draws the shareable progress card on a canvas (no network needed) and returns it as a PNG. */
export async function renderShareCard(data: ShareCardData, format: ShareFormat): Promise<Blob> {
  const height = HEIGHTS[format];
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser tidak mendukung pembuatan gambar.');

  try {
    await Promise.all([document.fonts.load(`800 120px ${FONT}`), document.fonts.load(`500 40px ${FONT}`)]);
  } catch {
    // Fall back to the system font; the card still renders.
  }

  // Background
  ctx.fillStyle = '#16171D';
  ctx.fillRect(0, 0, WIDTH, height);
  const glow = ctx.createRadialGradient(WIDTH * 0.85, height * 0.15, 20, WIDTH * 0.85, height * 0.15, 700);
  glow.addColorStop(0, 'rgba(204,255,0,0.28)');
  glow.addColorStop(1, 'rgba(204,255,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, height);
  const glow2 = ctx.createRadialGradient(WIDTH * 0.1, height * 0.95, 20, WIDTH * 0.1, height * 0.95, 650);
  glow2.addColorStop(0, 'rgba(124,77,255,0.35)');
  glow2.addColorStop(1, 'rgba(124,77,255,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.textBaseline = 'alphabetic';
  const top = format === 'story' ? 260 : 110;

  // Brand
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.arc(120, top, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16171D';
  ctx.font = `800 40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('C', 120, top + 14);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText('Continuum', 174, top + 15);

  // Profile row
  const profileY = top + 150;
  const avatarImg = data.avatar ? await loadImage(data.avatar) : null;
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, profileY, 70, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, 80, profileY - 70, 140, 140);
  } else {
    ctx.fillStyle = '#EDE9FE';
    ctx.fillRect(80, profileY - 70, 140, 140);
    ctx.fillStyle = '#6D28D9';
    ctx.font = `800 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText((data.name.slice(0, 1) || '?').toUpperCase(), 150, profileY + 22);
    ctx.textAlign = 'left';
  }
  ctx.restore();
  ctx.lineWidth = 6;
  ctx.strokeStyle = LIME;
  ctx.beginPath();
  ctx.arc(150, profileY, 73, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 54px ${FONT}`;
  let name = data.name;
  while (ctx.measureText(name).width > WIDTH - 320 && name.length > 1) name = name.slice(0, -1);
  ctx.fillText(name === data.name ? name : `${name}…`, 250, profileY + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText('sedang membangun kebiasaan baik', 250, profileY + 52);

  // Streak hero
  const heroY = format === 'story' ? height * 0.5 : height * 0.47;
  ctx.textAlign = 'center';
  ctx.font = `400 150px ${FONT}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('🔥', WIDTH / 2, heroY - 180);
  ctx.fillStyle = LIME;
  ctx.font = `800 300px ${FONT}`;
  ctx.fillText(String(data.streak), WIDTH / 2, heroY + 90);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 60px ${FONT}`;
  ctx.fillText(data.streak === 1 ? 'hari streak' : 'hari streak berturut-turut', WIDTH / 2, heroY + 175);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 44px ${FONT}`;
  ctx.fillText(streakHeadline(data.streak), WIDTH / 2, heroY + 250);

  // Stat pills
  const pillY = heroY + 340;
  const pills: Array<[string, string]> = [
    [String(data.level), 'Level'],
    [String(data.checkins), 'Total check-in'],
  ];
  const pillW = 400;
  const gap = 40;
  const startX = (WIDTH - (pillW * pills.length + gap * (pills.length - 1))) / 2;
  pills.forEach(([value, label], i) => {
    const x = startX + i * (pillW + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, x, pillY, pillW, 190, 40);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 84px ${FONT}`;
    ctx.fillText(value, x + pillW / 2, pillY + 100);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `500 34px ${FONT}`;
    ctx.fillText(label, x + pillW / 2, pillY + 152);
  });

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `600 38px ${FONT}`;
  ctx.fillText('Bangun kebiasaan produktif tanpa takut gagal.', WIDTH / 2, height - (format === 'story' ? 200 : 100));
  ctx.fillStyle = LIME;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText('Coba Continuum', WIDTH / 2, height - (format === 'story' ? 140 : 42));

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat gambar.'))), 'image/png');
  });
}
