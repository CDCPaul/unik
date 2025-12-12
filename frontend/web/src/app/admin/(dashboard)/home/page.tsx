'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutTemplate, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { CompanyInfo } from '@unik/shared/types';
import { defaultSettings, getSettings, saveSettings } from '@/lib/services/admin/settings';

export default function AdminHomePage() {
  const [settings, setSettings] = useState<CompanyInfo>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const s = await getSettings();
        setSettings(s);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const value = useMemo(() => settings.homeFeaturedProductKey || 'auto', [settings.homeFeaturedProductKey]);

  const setValue = async (next: 'auto' | 'courtside' | 'cherry-blossom') => {
    setIsSaving(true);
    let nextSettings: CompanyInfo | null = null;
    setSettings((prev) => {
      nextSettings = { ...prev, homeFeaturedProductKey: next };
      return nextSettings;
    });
    try {
      // use the computed next settings to avoid stale closures
      if (nextSettings) await saveSettings(nextSettings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Home</h1>
        <p className="text-slate-500 mt-1">Build the customer home page per product (auto switches by featured tour).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Public Home: Featured Product</h2>
            <p className="text-slate-500 text-sm mt-1">
              Choose which product the customer homepage should show by default.
            </p>
          </div>
          {(isLoading || isSaving) && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
        </div>

        <div className="mt-4 inline-flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setValue('auto')}
            disabled={isLoading || isSaving}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              value === 'auto' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Auto (by Featured Tour)
          </button>
          <button
            type="button"
            onClick={() => setValue('courtside')}
            disabled={isLoading || isSaving}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              value === 'courtside' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Courtside (Basketball)
          </button>
          <button
            type="button"
            onClick={() => setValue('cherry-blossom')}
            disabled={isLoading || isSaving}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              value === 'cherry-blossom' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Cherry Blossom (Marathon)
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/admin/home/builder"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <LayoutTemplate className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg font-semibold text-slate-900">Builder</h2>
          </div>
          <p className="text-slate-500 text-sm">Enable/disable sections, change order, and edit section text with preview.</p>
        </Link>

        <Link
          href="/admin/home/media"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg font-semibold text-slate-900">Media</h2>
          </div>
          <p className="text-slate-500 text-sm">Upload hero background images (desktop/mobile) per product.</p>
        </Link>
      </div>
    </div>
  );
}


