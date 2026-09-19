import { HTMLAttributes } from 'react';

type SkeletonBlockProps = HTMLAttributes<HTMLDivElement>;

/**
 * Generic pulsing placeholder block for building page-specific loading skeletons.
 * Compose several of these into a layout that mirrors the loaded page's shape
 * (same grid/columns/card counts) so there is no layout jump once real data arrives.
 *
 * On dark surfaces (e.g. bg-sidebar-dark cards) override the background with an
 * important utility, e.g. `<SkeletonBlock className="!bg-white/10 h-4 w-24" />`.
 */
export function SkeletonBlock({ className = '', ...props }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-surface-container ${className}`.trim()}
      {...props}
    />
  );
}
