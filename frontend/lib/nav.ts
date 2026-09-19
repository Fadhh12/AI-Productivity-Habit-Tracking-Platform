/**
 * Single source of truth for the app's primary navigation: route, canonical
 * (Indonesian) label, and icon. Both the desktop Sidebar and the mobile
 * BottomNav derive their item lists from this array so labels can't drift
 * out of sync between the two surfaces again.
 *
 * `shortLabel`, when present, is used by compact surfaces (the bottom tab
 * bar) that don't have room for the full label; surfaces with more space
 * (the sidebar) use `label`.
 */
export interface NavItem {
  href: string;
  /** Material Symbols icon name. */
  icon: string;
  /** Full label, used where space allows (e.g. the desktop sidebar). */
  label: string;
  /** Shorter label for compact surfaces (e.g. the mobile bottom nav). Falls back to `label` when omitted. */
  shortLabel?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/today', icon: 'grid_view', label: 'Dashboard' },
  { href: '/habit-tracker', icon: 'check_circle', label: 'Habit Tracker', shortLabel: 'Habit' },
  { href: '/goals', icon: 'flag', label: 'Goals & Horizon', shortLabel: 'Goals' },
  { href: '/activity-logs', icon: 'history_toggle_off', label: 'Activity Logs', shortLabel: 'Logs' },
  { href: '/reports', icon: 'auto_awesome', label: 'AI Reports & Digest', shortLabel: 'AI' },
  { href: '/settings', icon: 'settings', label: 'Pengaturan' },
];
