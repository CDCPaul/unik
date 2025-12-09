'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';
import { CompanyInfo } from '@unik/shared/types';
import { defaultSettings } from '@/lib/services/admin/settings';

interface SettingsContextType {
  settings: CompanyInfo | null;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for settings changes
    const docRef = doc(db, COLLECTIONS.settings, 'company');
    
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings({
            id: snapshot.id,
            ...data,
            updatedAt: data.updatedAt?.toDate(),
          } as CompanyInfo);
        } else {
          // Keep null if no data exists to prevent showing default data
          setSettings(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading settings:', error);
        // Keep null to prevent showing default data on initial load
        setSettings(null);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

