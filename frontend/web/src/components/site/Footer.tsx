import Link from 'next/link';
import { FOOTER_LINKS, SITE } from '@/content/site';

export function Footer() {
  return (
    <footer className="bg-[#0A0C10] text-sm text-white/75">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-6 px-4 py-10 sm:px-6">
        <div className="flex max-w-xl flex-col gap-1.5">
          <p className="font-race text-2xl font-extrabold tracking-[0.06em] text-white">
            UNIK
          </p>
          <p>{SITE.address}</p>
          <p>
            {SITE.phone} · <a href={`mailto:${SITE.email}`} className="-my-3 inline-block py-3 text-white/85">{SITE.email}</a>
          </p>
          <p>© {new Date().getFullYear()} UNIK. All rights reserved.</p>
        </div>
        {/* 글자 크기는 그대로, 누르는 영역만 44px 가까이 */}
        <nav aria-label="Footer" className="-my-3 flex flex-wrap items-start gap-x-5">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="inline-block py-3 text-white/85">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
