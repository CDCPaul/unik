import Link from 'next/link';
import { FOOTER_LINKS, SITE } from '@/content/site';

export function Footer() {
  return (
    <footer className="bg-[#0A0C10] text-sm text-white/75">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-6 px-4 py-10 sm:px-6">
        <div className="flex max-w-xl flex-col gap-1.5">
          <p className="font-race text-2xl font-extrabold tracking-[0.06em] text-white">
            UNIK <span className="font-ui text-[13px] font-semibold tracking-normal text-white/70">by {SITE.operator}</span>
          </p>
          <p>{SITE.address}</p>
          <p>
            {SITE.phone} · <a href={`mailto:${SITE.email}`} className="text-white/85">{SITE.email}</a>
          </p>
          <p>© {new Date().getFullYear()} CDC Travel. All rights reserved.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-5">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/85">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
