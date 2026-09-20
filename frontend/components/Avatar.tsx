import { CurrentUser } from '@/lib/auth';

const SIZES = {
  sm: 'h-8 w-8 text-label-md',
  md: 'h-11 w-11 text-label-lg',
  xl: 'h-24 w-24 text-headline-lg',
} as const;

export function displayNameOf(user: Pick<CurrentUser, 'email' | 'displayName'> | null): string {
  if (!user) return '';
  return user.displayName?.trim() || user.email.split('@')[0];
}

/** Profile photo, or the first letter of the name on a lavender circle when there is none. */
export function Avatar({
  user,
  size = 'md',
  className = '',
}: {
  user: Pick<CurrentUser, 'email' | 'displayName' | 'avatar'> | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const name = displayNameOf(user);
  const base = `${SIZES[size]} shrink-0 overflow-hidden rounded-full ${className}`;
  if (user?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt={`Foto profil ${name}`} className={`${base} object-cover`} />;
  }
  return (
    <div className={`${base} flex items-center justify-center bg-tertiary-container font-bold text-on-tertiary-container`} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
