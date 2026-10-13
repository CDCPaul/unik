import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://unik.ph'),
  title: {
    default: 'UNIK | Seoul Marathon 2027 Tour with Artjoy Torregosa',
    template: '%s | UNIK',
  },
  description:
    'Run the 2027 Seoul Marathon (March 21, 2027) with Artjoy Torregosa. Flights, hotel, race entry and race-weekend support from the Philippines.',
  openGraph: {
    title: 'UNIK | Seoul Marathon 2027 Tour',
    description: 'Run Seoul with Artjoy Torregosa. March 21, 2027.',
    type: 'website',
    locale: 'en_PH',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0B1F4D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
