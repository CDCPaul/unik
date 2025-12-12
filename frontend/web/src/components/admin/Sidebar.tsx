'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileText, Navigation, 
  Palette, Settings, LogOut, Menu, X, Home, LayoutTemplate, Type
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/auth';

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/registrations', icon: Users, label: 'Registrations' },
  { href: '/admin/home', icon: LayoutTemplate, label: 'Home' },
  { href: '/admin/navigation', icon: Navigation, label: 'Navigation' },
  { href: '/admin/content', icon: FileText, label: 'Content' },
  { href: '/admin/theme', icon: Palette, label: 'Theme' },
  { href: '/admin/ui-text', icon: Type, label: 'UI Text' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900">
            UNI<span className="text-blue-600">K</span>
          </span>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`admin-sidebar-link ${isActive ? 'admin-sidebar-link-active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* View Site Link */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <Link
            href="/"
            target="_blank"
            className="admin-sidebar-link text-slate-500 hover:text-slate-700"
          >
            <Home className="w-5 h-5" />
            <span>View Site</span>
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="admin-sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

