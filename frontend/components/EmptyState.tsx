import Link from 'next/link';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  children: ReactNode;
  action?: { label: string; onClick?: () => void; href?: string };
}

/** Friendly placeholder for lists with nothing in them yet: says what goes here and offers the first step. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  const actionClass =
    'press mt-space-md inline-flex items-center gap-2 rounded-full bg-accent-lime px-space-lg py-space-sm font-label-md text-label-md font-bold text-text-primary hover:bg-accent-lime-dim';
  return (
    <div className="flex animate-scale-in flex-col items-center rounded-2xl bg-surface-card px-space-lg py-space-xl text-center shadow-soft">
      <span className="flex h-14 w-14 animate-float items-center justify-center rounded-full bg-accent-lavender text-accent-lavender-text">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          {icon}
        </span>
      </span>
      <h3 className="mt-space-md font-headline-sm text-headline-sm font-bold text-text-primary">{title}</h3>
      <p className="mt-1 max-w-[42ch] font-body-sm text-body-sm text-text-secondary">{children}</p>
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionClass}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClass}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
