'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Chrome, Loader2, ShieldAlert } from 'lucide-react';
import { signInWithGoogle } from '@/lib/auth';
import { safeNextPath } from '@/lib/admin/loginRedirect';
import { AdminLocaleProvider, useAdminT } from '@/lib/admin/i18n/AdminLocaleProvider';
import { LanguageToggle } from '@/components/admin/LanguageToggle';
import '@/lib/admin/emulators';

const ADMIN_DOMAIN = '@cebudirectclub.com';
// lib/auth 가 던지는 도메인 제한 오류 (그 외 Firebase 오류 문구는 그대로 보여준다)
const DOMAIN_ERROR = /^Only @(\S+) email addresses are allowed\.$/;

export default function AdminLoginPage() {
  return (
    <AdminLocaleProvider>
      <AdminLogin />
    </AdminLocaleProvider>
  );
}

function AdminLogin() {
  const { t } = useAdminT();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ domain: string } | { text: string } | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      router.push(safeNextPath(new URLSearchParams(window.location.search).get('next')));
    } catch (err: any) {
      const m = typeof err?.message === 'string' ? err.message : '';
      const domain = DOMAIN_ERROR.exec(m)?.[1];
      setError(domain ? { domain } : m ? { text: m } : { text: '' });
    } finally {
      setIsLoading(false);
    }
  };

  // {domain} 자리에 굵은 도메인을 끼워 넣는다 (언어마다 어순이 다르다)
  const domainNote = t('login.domainNote').split('{domain}');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            UNI<span className="text-yellow-400">K</span>
          </h1>
          <p className="text-slate-400">{t('login.subtitle')}</p>
          <LanguageToggle tone="dark" className="mt-4" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            {t('login.welcome')}
          </h2>
          <p className="text-slate-500 mb-8">
            {t('login.instructions')}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                {'domain' in error ? t('login.domainOnly', { domain: error.domain }) : error.text || t('login.failed', { domain: ADMIN_DOMAIN })}
              </p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 
                     bg-white border-2 border-slate-200 rounded-xl
                     hover:bg-slate-50 hover:border-slate-300
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
            ) : (
              <Chrome className="w-5 h-5 text-slate-600" />
            )}
            <span className="font-medium text-slate-700">
              {isLoading ? t('login.signingIn') : t('login.continueWithGoogle')}
            </span>
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            {domainNote[0]}<span className="font-medium">{ADMIN_DOMAIN}</span>{domainNote[1]}
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Cebu Direct Club. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

