'use client';

import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-slate-100 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, error, children, className = '' }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {children}
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}

export function SaveError({ show }: { show: boolean }) {
  const { t } = useAdminT();
  return show ? <p role="alert" className="mt-2 text-sm text-red-600">{t('common.saveFailed')}</p> : null;
}

/** 저장 진행/실패 상태. run 은 성공하면 true. */
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = useCallback(async (fn: () => Promise<unknown>): Promise<boolean> => {
    setSaving(true);
    setFailed(false);
    try {
      await fn();
      return true;
    } catch (e) {
      console.error(e);
      setFailed(true);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);
  return { saving, failed, run, clearFailed: () => setFailed(false) };
}

/** 클립보드 복사 (실패하면 prompt 로 대체). 성공 시 2초간 copied 키를 돌려준다. */
export function useCopy() {
  const { t } = useAdminT();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      window.prompt(t('common.copyLinkPrompt'), text);
    }
  }, [t]);
  return { copied, copy };
}
