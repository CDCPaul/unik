'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import { defaultTheme, type ThemeColors } from '@/lib/services/theme';

interface ThemeContextType {
  theme: ThemeColors;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isLoading: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for theme changes
    const docRef = doc(db, COLLECTIONS.theme, 'current');
    
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setTheme({ ...defaultTheme, ...data } as ThemeColors);
        } else {
          setTheme(defaultTheme);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading theme:', error);
        setTheme(defaultTheme);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Apply CSS variables when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Set CSS variables
      root.style.setProperty('--theme-page-bg', theme.pageBg);
      root.style.setProperty('--theme-navbar-bg', theme.navbarBg);
      root.style.setProperty('--theme-card-bg', theme.cardBg);
      root.style.setProperty('--theme-footer-bg', theme.footerBg);
      root.style.setProperty('--theme-heading-text', theme.headingText);
      root.style.setProperty('--theme-body-text', theme.bodyText);
      root.style.setProperty('--theme-muted-text', theme.mutedText);
      root.style.setProperty('--theme-primary-btn-bg', theme.primaryBtnBg);
      root.style.setProperty('--theme-primary-btn-text', theme.primaryBtnText);
      root.style.setProperty('--theme-primary-btn-hover-bg', theme.primaryBtnHoverBg);
      root.style.setProperty('--theme-secondary-btn-bg', theme.secondaryBtnBg);
      root.style.setProperty('--theme-secondary-btn-text', theme.secondaryBtnText);
      root.style.setProperty('--theme-secondary-btn-border', theme.secondaryBtnBorder);
      root.style.setProperty('--theme-accent-color', theme.accentColor);
      root.style.setProperty('--theme-gold-color', theme.goldColor);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

