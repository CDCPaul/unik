'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { NAV_LINKS } from '@/content/site';

export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => ref.current?.removeAttribute('open');
  return (
    <details ref={ref} className="relative md:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-white/40 px-4 font-semibold">
        Menu
      </summary>
      <nav
        aria-label="Main mobile"
        className="absolute right-0 z-20 mt-2 flex w-60 flex-col gap-1 rounded-2xl bg-white p-3 text-brand-ink shadow-xl"
      >
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={close} className="rounded-lg px-3 py-3 font-semibold no-underline hover:bg-brand-soft">
            {l.label}
          </Link>
        ))}
        <Link href="/apply" onClick={close} className="mt-1 rounded-full bg-brand-red px-3 py-3 text-center font-extrabold text-white no-underline">
          Apply now
        </Link>
      </nav>
    </details>
  );
}
