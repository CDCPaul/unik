'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@unik/shared/firebase/config';

type UiTextValues = Record<string, string>;
type UiTextFonts = Record<string, 'inherit' | 'display' | 'sans-serif' | 'serif' | 'monospace' | 'korean-sans'>;

interface UiTextContextType {
  values: UiTextValues;
  fonts: UiTextFonts;
  isLoading: boolean;
  t: (key: string, fallback?: string) => string;
  font: (key: string) => string | undefined;
}

const UiTextContext = createContext<UiTextContextType>({
  values: {},
  fonts: {},
  isLoading: true,
  t: (key, fallback) => fallback ?? key,
  font: () => undefined,
});

const UI_TEXT_DOC_ID = 'uiText';

export function UiTextProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<UiTextValues>({});
  const [fonts, setFonts] = useState<UiTextFonts>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, COLLECTIONS.settings, UI_TEXT_DOC_ID);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          setValues((data?.values || {}) as UiTextValues);
          setFonts((data?.fonts || {}) as UiTextFonts);
        } else {
          setValues({});
          setFonts({});
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading uiText:', err);
        setValues({});
        setFonts({});
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const t = useMemo(() => {
    return (key: string, fallback?: string) => {
      const v = values[key];
      if (typeof v === 'string' && v.trim().length > 0) return v;
      return fallback ?? key;
    };
  }, [values]);

  const font = useMemo(() => {
    return (key: string) => {
      const f = fonts[key];
      if (!f || f === 'inherit') return undefined;
      if (f === 'display') return 'var(--font-playfair), serif';
      if (f === 'sans-serif') return 'var(--font-outfit), sans-serif';
      if (f === 'korean-sans') return 'var(--font-noto-kr), "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif';
      if (f === 'serif') return 'serif';
      if (f === 'monospace') return 'monospace';
      return undefined;
    };
  }, [fonts]);

  return (
    <UiTextContext.Provider value={{ values, fonts, isLoading, t, font }}>
      {children}
    </UiTextContext.Provider>
  );
}

export function useUiText() {
  return useContext(UiTextContext);
}


