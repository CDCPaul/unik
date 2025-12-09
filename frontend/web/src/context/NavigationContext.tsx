'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import { defaultNavItems, type NavItem } from '@/lib/services/navigation';

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
    // Set up real-time listener for navigation changes
    const docRef = doc(db, COLLECTIONS.navigation, 'main');
    
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setNavItems(data.items as NavItem[]);
        } else {
          setNavItems(defaultNavItems);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading navigation:', error);
        setNavItems(defaultNavItems);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
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

