'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthChange, isAuthorized } from '@/lib/auth';
import AdminSidebar from '@/components/admin/Sidebar';
import { Loader2 } from 'lucide-react';
import { loginUrlFor } from '@/lib/admin/loginRedirect';
import { AdminLocaleProvider } from '@/lib/admin/i18n/AdminLocaleProvider';
import '@/lib/admin/emulators';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocaleProvider>
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </AdminLocaleProvider>
  );
}

function AdminDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user && isAuthorized(user)) {
        setIsAuthenticated(true);
      } else {
        // 로그인 후 원래 보던 화면(경로+쿼리)으로 돌아오도록 next 를 붙인다
        router.push(loginUrlFor(pathname, window.location.search));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="min-w-0 flex-1 lg:ml-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

