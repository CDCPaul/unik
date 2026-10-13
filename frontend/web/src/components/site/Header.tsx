import Link from 'next/link';
import { NAV_LINKS } from '@/content/site';
import { ButtonLink } from './ButtonLink';
import { MobileMenu } from './MobileMenu';

export function Header() {
  return (
    <header className="bg-brand-ink text-white">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2.5 no-underline">
          <span className="font-race text-3xl font-extrabold tracking-[0.06em]">UNIK</span>
          <span className="text-xs text-white/75">by CDC Travel</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-[15px] font-semibold md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white no-underline hover:text-brand-sun">
              {l.label}
            </Link>
          ))}
          <ButtonLink href="/apply">Apply now</ButtonLink>
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
