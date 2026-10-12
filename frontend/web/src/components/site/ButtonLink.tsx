import Link from 'next/link';
import type { ReactNode } from 'react';

const VARIANTS = {
  primary: 'bg-brand-red text-white hover:brightness-110',
  'outline-light': 'border-2 border-white/60 text-white hover:bg-white/10',
  'outline-dark': 'border-2 border-brand-ink text-brand-ink hover:bg-brand-soft',
} as const;

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  children,
}: {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: 'md' | 'lg';
  children: ReactNode;
}) {
  const sizing = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base';
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-full font-extrabold no-underline transition ${sizing} ${VARIANTS[variant]}`}
    >
      {children}
    </Link>
  );
}
