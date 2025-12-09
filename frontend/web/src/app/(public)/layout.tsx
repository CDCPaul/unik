'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingButton from '@/components/layout/FloatingButton';
import { useTheme } from '@/context/ThemeContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.pageBg }}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingButton />
    </div>
  );
}

