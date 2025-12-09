'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import Image from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { navItems, isLoading } = useNavigation();
  const { theme } = useTheme();
  const { settings } = useSettings();

  // Filter and sort visible nav items
  const visibleNavItems = navItems
    .filter(item => item.isVisible)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href;
  const hasActiveChild = (item: any) => {
    return item.children?.some((child: any) => pathname === child.href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
      style={{
        backgroundColor: isScrolled ? `${theme.navbarBg}f2` : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
      }}
    >
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {settings.logoUrl ? (
              <div className="relative h-24 w-auto">
                <Image
                  src={settings.logoUrl}
                  alt={settings.brandName || 'UNIK'}
                  width={300}
                  height={100}
                  className="h-24 w-auto object-contain"
                  priority
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Sparkles className="w-16 h-16 group-hover:opacity-80 transition-colors" style={{ color: theme.goldColor }} />
                  <div className="absolute inset-0 blur-lg opacity-30" style={{ backgroundColor: theme.goldColor }} />
                </div>
                <span className="text-3xl font-display font-bold tracking-tight">
                  <span style={{ color: theme.headingText }}>{settings.brandName || 'UNIK'}</span>
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {!isLoading && visibleNavItems.map((link) => (
              <div 
                key={link.id} 
                className="relative"
                onMouseEnter={() => link.children && setOpenDropdown(link.id)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {link.children ? (
                  <>
                    <button
                      className={`relative text-sm font-medium uppercase tracking-wider flex items-center gap-1 transition-colors duration-300 ${
                        hasActiveChild(link) ? '' : ''
                      }`}
                      style={{
                        color: hasActiveChild(link) || openDropdown === link.id ? theme.headingText : theme.mutedText,
                      }}
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === link.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {openDropdown === link.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 py-2 rounded-lg shadow-xl border min-w-[200px]"
                          style={{
                            backgroundColor: theme.navbarBg,
                            borderColor: theme.cardBg,
                          }}
                        >
                          {link.children
                            .filter(child => child.isVisible)
                            .sort((a, b) => a.order - b.order)
                            .map((child) => (
                              <Link
                                key={child.id}
                                href={child.href}
                                className="block px-4 py-2 text-sm transition-colors"
                                style={{
                                  color: isActive(child.href) ? theme.goldColor : theme.mutedText,
                                  backgroundColor: isActive(child.href) ? `${theme.goldColor}10` : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = theme.headingText;
                                  if (!isActive(child.href)) {
                                    e.currentTarget.style.backgroundColor = `${theme.cardBg}80`;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = isActive(child.href) ? theme.goldColor : theme.mutedText;
                                  if (!isActive(child.href)) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                {child.label}
                              </Link>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className={`nav-link text-sm font-medium uppercase tracking-wider ${
                      isActive(link.href) ? 'nav-link-active' : ''
                    }`}
                    style={{
                      color: isActive(link.href) ? theme.headingText : theme.mutedText,
                    }}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link 
              href="/register" 
              className="btn-gold text-sm"
              style={{
                backgroundColor: theme.goldColor,
                color: theme.pageBg,
              }}
            >
              Book Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 transition-colors"
            style={{ color: theme.headingText }}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden backdrop-blur-xl border-t"
            style={{ 
              backgroundColor: `${theme.navbarBg}f8`,
              borderColor: theme.cardBg,
            }}
          >
            <div className="container-custom py-6 space-y-4">
              {!isLoading && visibleNavItems.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {link.children ? (
                    <div>
                      <div className="font-medium text-lg mb-2" style={{ color: theme.mutedText }}>
                        {link.label}
                      </div>
                      <div className="pl-4 space-y-2">
                        {link.children
                          .filter(child => child.isVisible)
                          .sort((a, b) => a.order - b.order)
                          .map((child) => (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className="block py-1 transition-colors"
                              style={{
                                color: isActive(child.href) ? theme.goldColor : theme.mutedText,
                              }}
                            >
                              {child.label}
                            </Link>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 text-lg font-medium transition-colors"
                      style={{
                        color: isActive(link.href) ? theme.goldColor : theme.mutedText,
                      }}
                    >
                      {link.label}
                    </Link>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4"
              >
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="btn-gold w-full text-center"
                  style={{
                    backgroundColor: theme.goldColor,
                    color: theme.pageBg,
                  }}
                >
                  Book Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
