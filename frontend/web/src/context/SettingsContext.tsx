'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanyInfo } from '@unik/shared/types';
import { getSettings, defaultSettings } from '@/lib/services/admin/settings';

interface SettingsContextType {
  settings: CompanyInfo;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanyInfo>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

