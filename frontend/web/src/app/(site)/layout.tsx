import { Suspense } from 'react';
import { Barlow_Condensed, Manrope } from 'next/font/google';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { PromoCodeCapture } from '@/components/site/PromoCodeCapture';

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-barlow',
  display: 'swap',
});
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${barlow.variable} ${manrope.variable} font-ui min-h-screen bg-white text-base leading-relaxed text-brand-body`}>
      <Suspense fallback={null}>
        <PromoCodeCapture />
      </Suspense>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
