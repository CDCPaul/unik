import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingButton from '@/components/layout/FloatingButton';
import { ThemeProvider } from '@/context/ThemeContext';
import { NavigationProvider } from '@/context/NavigationContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <div className="min-h-screen flex flex-col bg-dark-900">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingButton />
        </div>
      </NavigationProvider>
    </ThemeProvider>
  );
}

