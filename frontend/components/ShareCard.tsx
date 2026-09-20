'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { GamificationSummary } from '@/lib/types';
import { displayNameOf } from '@/components/Avatar';
import { renderShareCard, ShareFormat } from '@/lib/shareCard';
import { SkeletonBlock } from '@/components/Skeleton';

const SHARE_TEXT = 'Aku lagi konsisten bangun kebiasaan di Continuum! 🔥 Yuk ikut coba.';

/** Builds a PNG progress card in the browser and shares it via the native share sheet (Instagram, WhatsApp, ...), or downloads it. */
export function ShareCard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [format, setFormat] = useState<ShareFormat>('post');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<GamificationSummary>('/api/gamification/summary')
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    if (!summary || !user) return;
    let cancelled = false;
    let url: string | null = null;
    setError(null);
    renderShareCard(
      {
        name: displayNameOf(user),
        avatar: user.avatar,
        streak: summary.stats.longestStreak,
        level: summary.level,
        checkins: summary.stats.doneCheckins,
      },
      format,
    )
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(url);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Gagal membuat kartu.'));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [summary, user, format]);

  if (!summary) return <SkeletonBlock className="h-64 rounded-2xl" />;

  const hasProgress = summary.stats.longestStreak > 0 || summary.stats.doneCheckins > 0;

  function file(): File | null {
    return blob ? new File([blob], `continuum-${format}.png`, { type: 'image/png' }) : null;
  }

  function download() {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `continuum-${format}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setNotice('Gambar tersimpan. Unggah ke Instagram atau WhatsApp dari galerimu.');
  }

  async function share() {
    const f = file();
    if (!f) return;
    setNotice(null);
    try {
      if (navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], text: SHARE_TEXT });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // user closed the sheet
    }
    // No file sharing (desktop browsers): save the image and offer the text via WhatsApp.
    download();
  }

  return (
    <section className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-md shadow-sm sm:p-space-lg">
      <div className="flex flex-col gap-1">
        <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Bagikan progresmu</h2>
        <p className="font-body-sm text-body-sm text-text-secondary">
          Kartu streak buat dipamerkan ke teman, gratis untuk semua. Pilih ukuran, lalu bagikan ke Instagram atau WhatsApp.
        </p>
      </div>

      {!hasProgress ? (
        <p className="rounded-xl bg-surface-container-low p-space-md font-body-sm text-body-sm text-text-secondary">
          Check-in habit pertamamu dulu, lalu kartu streakmu siap dibagikan.
        </p>
      ) : (
        <>
          <div className="flex gap-2" role="tablist" aria-label="Ukuran kartu">
            {(
              [
                ['post', 'Post 4:5'],
                ['story', 'Story 9:16'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={format === value}
                onClick={() => setFormat(value)}
                className={`min-h-[40px] rounded-full px-4 font-label-md text-label-md ${
                  format === value ? 'bg-sidebar-dark text-white' : 'bg-surface-container-low text-text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-[280px]">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Pratinjau kartu streak" className="w-full rounded-2xl shadow-md" />
            ) : (
              <SkeletonBlock className={`w-full rounded-2xl ${format === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`} />
            )}
          </div>

          <div className="flex flex-col gap-space-sm sm:flex-row">
            <button
              type="button"
              onClick={share}
              disabled={!blob}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-accent-lime font-label-lg text-label-lg font-bold text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                share
              </span>
              Bagikan
            </button>
            <button
              type="button"
              onClick={download}
              disabled={!blob}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-surface-container-low font-label-lg text-label-lg font-semibold text-text-primary hover:bg-surface-container disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                download
              </span>
              Unduh gambar
            </button>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`}
            target="_blank"
            rel="noreferrer"
            className="w-fit font-label-sm text-label-sm font-semibold text-tertiary hover:underline"
          >
            Kirim teks ajakan lewat WhatsApp
          </a>
        </>
      )}
      {notice && <p className="rounded-lg bg-accent-mint px-3 py-2 font-body-sm text-body-sm text-accent-mint-text">{notice}</p>}
      {error && <p className="rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">{error}</p>}
    </section>
  );
}
