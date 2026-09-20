'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { upgradeReason, UpgradeReason } from '@/lib/premium';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import { usePlan } from '@/lib/plan';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  aiGenerated?: boolean;
}

interface CoachResponse {
  reply: string;
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

const SUGGESTIONS = [
  'Gimana progres habit-ku minggu ini?',
  'Kenapa aku susah konsisten?',
  'Kasih 1 langkah kecil buat besok',
  'Ke mana waktuku paling banyak terpakai?',
];

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState<UpgradeReason | null>(null);
  const { refresh: refreshPlan } = usePlan();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setError(null);
    setSending(true);
    try {
      const res = await apiFetch<CoachResponse>('/api/ai/coach', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, aiGenerated: res.is_ai_generated }]);
      void refreshPlan();
    } catch (err) {
      const locked = upgradeReason(err);
      if (locked) setLimitHit(locked);
      else setError(err instanceof ApiError ? err.message : 'Coach tidak bisa dihubungi. Coba lagi.');
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col gap-space-md lg:h-[calc(100dvh-8rem)]">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">Coach AI</h1>
        <p className="font-body-md text-body-md text-text-secondary">
          Tanya apa saja soal progres, habit, dan waktumu. Coach membaca datamu, tanpa menghakimi.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-space-sm overflow-y-auto rounded-2xl bg-surface-card p-space-md shadow-sm" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col items-start gap-space-sm">
            <p className="font-body-sm text-body-sm text-text-muted">Mulai dari salah satu ini, atau tulis sendiri:</p>
            <div className="flex flex-wrap gap-space-xs">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-surface-container-low px-space-md py-space-xs font-label-sm text-label-sm text-text-primary hover:bg-surface-container"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-space-md py-space-sm font-body-sm text-body-sm ${
                m.role === 'user' ? 'bg-accent-lime text-text-primary' : 'bg-surface-container-low text-text-primary'
              }`}
            >
              {m.role === 'assistant' && (
                <span className={m.aiGenerated ? 'badge-ai mb-1 block w-fit' : 'mb-1 block w-fit rounded-full bg-surface-container px-2 py-0.5 text-xs text-text-secondary'}>
                  {m.aiGenerated ? '✨ AI' : 'Ringkasan dasar (AI belum tersedia)'}
                </span>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start" role="status" aria-label="Coach sedang mengetik">
            <div className="rounded-2xl bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-text-muted">Coach sedang berpikir…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}
      {limitHit && <UpgradeNotice message={limitHit.message} />}

      <form onSubmit={onSubmit} className="flex items-center gap-space-sm">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Tulis pertanyaanmu…"
          className="min-w-0 flex-1 rounded-full border-0 bg-surface-card px-space-md py-space-sm font-body-sm text-body-sm shadow-sm"
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="rounded-full bg-accent-lime px-space-lg py-space-sm font-label-md text-label-md font-bold text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
      <p className="text-center font-caption text-caption text-text-muted">Jawaban dihasilkan AI dan bisa keliru. Cek lagi untuk keputusan penting.</p>
    </div>
  );
}
