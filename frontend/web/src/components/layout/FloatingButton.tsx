'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ChevronUp } from 'lucide-react';

export default function FloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pathname = usePathname();

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
                className="p-3 rounded-full bg-dark-700/80 backdrop-blur-sm border border-dark-600 
                           text-dark-300 hover:text-white hover:bg-dark-600 
                           shadow-lg transition-all duration-300"
                aria-label="Scroll to top"
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
              className="floating-btn group"
            >
              <Ticket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Register Now</span>
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

