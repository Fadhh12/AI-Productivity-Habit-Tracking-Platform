'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { upgradeReason, UpgradeReason } from '@/lib/premium';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import { usePlan } from '@/lib/plan';
import { useMascotError, useMascotWhile } from '@/lib/mascot';
import { ReactiveMascot } from '@/components/ReactiveMascot';

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
  useMascotWhile(sending, 'talk');
  useMascotError(error);
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
    <div className="mx-auto flex h-[calc(100dvh-10rem)] w-full max-w-4xl flex-col gap-space-md lg:h-[calc(100dvh-8rem)]">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex min-w-0 flex-col gap-space-xs">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">Coach AI</h1>
          <p className="text-[15px] leading-6 text-text-secondary sm:text-[16px] sm:leading-6">
            Tanya apa saja soal progres, habit, dan waktumu. Coach membaca datamu, tanpa menghakimi.
          </p>
        </div>
        <ReactiveMascot className="w-16 sm:w-24" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-space-sm overflow-y-auto rounded-2xl bg-surface-card p-space-md shadow-soft" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col items-start gap-space-sm">
            <p className="text-[14px] leading-5 text-text-muted sm:text-[15px] sm:leading-6">Mulai dari salah satu ini, atau tulis sendiri:</p>
            <div className="stagger flex flex-wrap gap-space-xs">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="press min-h-[44px] rounded-full bg-surface-container-low px-space-md py-space-xs text-left text-[14px] font-semibold leading-5 text-text-primary hover:bg-accent-lime sm:min-h-[40px] sm:text-[14px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex animate-slide-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-space-md py-space-sm text-[15px] leading-6 sm:max-w-[85%] sm:text-[15px] sm:leading-6 ${
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
            <div className="flex animate-fade-in items-center gap-2 rounded-2xl bg-surface-container-low px-space-md py-space-sm text-[14px] text-text-muted sm:text-[15px] sm:leading-6">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-float rounded-full bg-text-muted" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </span>
              Coach sedang berpikir…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="rounded-lg bg-error-container px-3 py-2 text-[14px] text-on-error-container">{error}</p>}
      {limitHit && <UpgradeNotice message={limitHit.message} />}

      <form onSubmit={onSubmit} className="flex items-center gap-space-sm">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Tulis pertanyaanmu…"
          className="min-w-0 flex-1 rounded-full border-0 bg-surface-card px-space-md py-3 text-[16px] shadow-soft transition-shadow sm:py-3 sm:text-[15px] sm:leading-6 duration-500 ease-spring focus:shadow-lift focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="rounded-full bg-accent-lime px-space-lg py-3 text-[14px] font-bold sm:py-3 sm:text-[15px] text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
      <p className="text-center text-[12px] leading-4 text-text-muted sm:text-[13px]">Jawaban dihasilkan AI dan bisa keliru. Cek lagi untuk keputusan penting.</p>
    </div>
  );
}
