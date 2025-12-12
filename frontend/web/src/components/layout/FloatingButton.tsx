'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ChevronUp } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useUiText } from '@/context/UiTextContext';

export default function FloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();
  const { t, font } = useUiText();

  // Hide on register page
  const isRegisterPage = pathname === '/register';

  useEffect(() => {
    const handleScroll = () => {
      // Show floating button after scrolling 300px
      setIsVisible(window.scrollY > 300);
      // Show scroll to top after scrolling 600px
      setShowScrollTop(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isRegisterPage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
          {/* Scroll to Top */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={scrollToTop}
                className="p-3 rounded-full backdrop-blur-sm border shadow-lg transition-all duration-300"
                style={{
                  backgroundColor: `${theme.cardBg}cc`,
                  borderColor: theme.secondaryBtnBorder,
                  color: theme.mutedText,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.headingText;
                  e.currentTarget.style.backgroundColor = theme.secondaryBtnBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.mutedText;
                  e.currentTarget.style.backgroundColor = `${theme.cardBg}cc`;
                }}
                aria-label={t('floating.scrollTopAria', 'Scroll to top')}
              >
                <ChevronUp className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Register Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Link
              href="/register"
              className="flex items-center gap-2 px-5 py-3 rounded-full font-bold shadow-lg transition-all duration-300 transform hover:scale-105 group"
              style={{
                background: `linear-gradient(135deg, ${theme.goldColor}, ${theme.accentColor})`,
                color: theme.pageBg,
              }}
            >
              <Ticket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline" style={{ fontFamily: font('floating.registerNow') }}>
                {t('floating.registerNow', 'Register Now')}
              </span>
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
