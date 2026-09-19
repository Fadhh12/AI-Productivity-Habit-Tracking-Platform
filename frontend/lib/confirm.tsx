'use client';

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  message: string;
  resolve: (value: boolean) => void;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ message, resolve, ...options });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      request?.resolve(value);
      setRequest(null);
    },
    [request],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-space-md">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="w-full max-w-sm rounded-lg bg-surface-card p-space-lg shadow-lg"
          >
            <h2
              id="confirm-dialog-title"
              className="font-headline-sm text-headline-sm text-text-primary"
            >
              {request.title ?? 'Konfirmasi'}
            </h2>
            <p
              id="confirm-dialog-message"
              className="mt-space-sm whitespace-pre-line font-body-sm text-body-sm text-text-secondary"
            >
              {request.message}
            </p>
            <div className="mt-space-lg flex justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-full bg-surface-container px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-surface-container-high"
              >
                {request.cancelLabel ?? 'Batal'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={
                  request.destructive
                    ? 'rounded-full bg-accent-terracotta-text px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-white hover:opacity-90'
                    : 'rounded-full bg-accent-lime px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-accent-lime-dim'
                }
              >
                {request.confirmLabel ?? 'Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
