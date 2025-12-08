'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTheme, defaultTheme, type ThemeColors } from '@/lib/services/theme';

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
    const loadTheme = async () => {
      try {
        const savedTheme = await getTheme();
        setTheme(savedTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
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

