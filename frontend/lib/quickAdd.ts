'use client';

import { FormEvent, useState } from 'react';
import { apiFetch, ApiError } from './api';
import { Category, QuickAddDraft } from './types';

interface UseQuickAddOptions {
  categories: Category[];
  onSaved: () => void | Promise<void>;
  onError: (message: string) => void;
}

/** Shared state/logic behind every "Catat AI" quick-add bar: parse text via AI, preview a draft, confirm to save. */
export function useQuickAdd({ categories, onSaved, onError }: UseQuickAddOptions) {
  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [draft, setDraft] = useState<QuickAddDraft | null>(null);

  async function onQuickAdd(e: FormEvent) {
    e.preventDefault();
    if (!quickText.trim()) return;
    setQuickLoading(true);
    setDraft(null);
    try {
      const result = await apiFetch<QuickAddDraft>('/api/ai/quick-add', {
        method: 'POST',
        body: JSON.stringify({ text: quickText }),
      });
      setDraft(result);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Gagal memproses teks.');
    } finally {
      setQuickLoading(false);
    }
  }

  async function confirmDraft() {
    if (!draft) return;
    try {
      const category = categories.find(
        (c) => c.name.toLowerCase() === (draft.category_guess ?? '').toLowerCase(),
      );
      await apiFetch('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          title: draft.title,
          categoryId: category?.id,
          startTime: draft.start_time,
          endTime: draft.end_time,
        }),
      });
      setDraft(null);
      setQuickText('');
      await onSaved();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Gagal menyimpan aktivitas.');
    }
  }

  return { quickText, setQuickText, quickLoading, draft, setDraft, onQuickAdd, confirmDraft };
}
