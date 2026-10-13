import type { ReactNode } from 'react';

const TONES = {
  white: 'bg-white text-brand-body',
  soft: 'bg-brand-soft text-brand-body',
  ink: 'bg-brand-ink text-white',
} as const;

export function Section({
  id,
  tone = 'white',
  width = 'wide',
  className = '',
  children,
}: {
  id?: string;
  tone?: keyof typeof TONES;
  /** wide = 1200px, narrow = 880px (FAQ·약관·완료 페이지처럼 글 위주) */
  width?: 'wide' | 'narrow';
  className?: string;
  children: ReactNode;
}) {
  const max = width === 'narrow' ? 'max-w-[880px]' : 'max-w-[1200px]';
  return (
    <section id={id} className={TONES[tone]}>
      <div className={`mx-auto ${max} px-4 py-16 sm:px-6 sm:py-24 ${className}`}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = 'light',
  as: Heading = 'h2',
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: 'light' | 'dark';
  /** 페이지의 주 제목이면 'h1' (페이지당 h1 은 하나) */
  as?: 'h1' | 'h2';
}) {
  return (
    <div className="flex max-w-[720px] flex-col gap-4">
      <p className={`text-[13px] font-extrabold tracking-[0.16em] ${tone === 'dark' ? 'text-brand-sun' : 'text-brand-red'}`}>
        {eyebrow}
      </p>
      <Heading
        className={`font-race text-5xl font-extrabold uppercase leading-none sm:text-[56px] ${tone === 'dark' ? 'text-white' : 'text-brand-ink'}`}
      >
        {title}
      </Heading>
      {intro ? <p className="text-lg">{intro}</p> : null}
    </div>
  );
}
