'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getNavigation, defaultNavItems, type NavItem } from '@/lib/services/navigation';

interface NavigationContextType {
  navItems: NavItem[];
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType>({
  navItems: defaultNavItems,
  isLoading: true,
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const items = await getNavigation();
        setNavItems(items);
      } catch (error) {
        console.error('Error loading navigation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNavigation();
  }, []);

  return (
    <NavigationContext.Provider value={{ navItems, isLoading }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

