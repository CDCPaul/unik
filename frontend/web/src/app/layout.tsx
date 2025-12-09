import type { Metadata } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { SettingsProvider } from '@/context/SettingsContext';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UNIK | KBL All-Star 2026 Tour - Experience Korean Basketball',
  description: 'Join the ultimate basketball tour from Philippines to Korea. Watch KBL All-Star 2026, meet Filipino players, and explore Korea. January 15-18, 2026.',
  keywords: ['KBL', 'All-Star', 'Basketball', 'Korea', 'Philippines', 'Tour', 'Travel'],
  openGraph: {
    title: 'UNIK | KBL All-Star 2026 Tour',
    description: 'Experience the KBL All-Star 2026 in Korea. The ultimate basketball tour for Filipino fans.',
    type: 'website',
    locale: 'en_PH',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="min-h-screen">
        <ThemeProvider>
          <SettingsProvider>
            <NavigationProvider>
              {children}
            </NavigationProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
