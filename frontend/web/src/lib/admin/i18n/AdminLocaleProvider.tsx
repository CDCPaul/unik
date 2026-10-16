'use client';

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { LOCALE_STORAGE_KEY, readStoredLocale, writeStoredLocale } from './storage';
import { DEFAULT_LOCALE, isLocale, makeT } from './translate';
import type { Locale, TFunction } from './translate';

// 탭 안의 모든 어드민 화면이 같은 언어를 쓰도록 모듈 단위로 보관한다.
// 서버 렌더·하이드레이션 중에는 항상 영어(getServerSnapshot), 그 직후 저장된 언어로 다시 그린다.
let current: Locale | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // 다른 탭에서 바꾼 언어도 따라간다
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LOCALE_STORAGE_KEY) return;
    current = isLocale(e.newValue) ? e.newValue : DEFAULT_LOCALE;
    onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Locale {
  if (current === null) current = readStoredLocale();
  return current;
}

const getServerSnapshot = (): Locale => DEFAULT_LOCALE;

function setLocale(locale: Locale): void {
  current = locale;
  writeStoredLocale(locale);
  listeners.forEach((fn) => fn());
}

interface AdminLocaleValue {
  locale: Locale;
  t: TFunction;
  setLocale: (locale: Locale) => void;
}

const fallback: AdminLocaleValue = { locale: DEFAULT_LOCALE, t: makeT(DEFAULT_LOCALE), setLocale: () => undefined };
const AdminLocaleContext = createContext<AdminLocaleValue>(fallback);

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 어드민에 있는 동안만 <html lang> 을 바꾸고, 떠나면 원래 값으로 돌려놓는다
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.lang;
    el.lang = locale;
    return () => {
      el.lang = prev;
    };
  }, [locale]);

  const value = useMemo<AdminLocaleValue>(() => ({ locale, t: makeT(locale), setLocale }), [locale]);
  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

/** 현재 어드민 언어와 번역 함수. Provider 밖에서는 영어로 동작한다. */
export function useAdminT(): AdminLocaleValue {
  return useContext(AdminLocaleContext);
}
