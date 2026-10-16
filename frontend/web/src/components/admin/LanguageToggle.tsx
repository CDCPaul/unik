'use client';

import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import type { Locale } from '@/lib/admin/i18n/translate';

// 언어 이름은 어느 언어에서든 같은 표기로 보여준다
const OPTIONS: { locale: Locale; label: string; lang: string }[] = [
  { locale: 'en', label: 'EN', lang: 'en' },
  { locale: 'ko', label: '한국어', lang: 'ko' },
];

export function LanguageToggle({ tone = 'light', className = '' }: { tone?: 'light' | 'dark'; className?: string }) {
  const { t, locale, setLocale } = useAdminT();
  const idle = tone === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-800';
  const active = tone === 'dark' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white';
  const divider = tone === 'dark' ? 'text-slate-500' : 'text-slate-300';
  return (
    <div role="group" aria-label={t('locale.group')} className={`inline-flex items-center gap-1 text-sm font-semibold ${className}`}>
      {OPTIONS.map((o, i) => (
        <span key={o.locale} className="inline-flex items-center gap-1">
          {i > 0 ? <span aria-hidden="true" className={divider}>|</span> : null}
          <button
            type="button"
            lang={o.lang}
            aria-pressed={locale === o.locale}
            onClick={() => setLocale(o.locale)}
            className={`rounded-md px-2 py-1 transition-colors ${locale === o.locale ? active : idle}`}
          >
            {o.label}
          </button>
        </span>
      ))}
    </div>
  );
}
