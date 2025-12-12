'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import type { HomeConfig, HomeProductKey } from '@unik/shared/types';
import { getHomeConfigAdmin, saveHomeConfig, uploadHomeHeroBackground } from '@/lib/services/admin/homeConfigs';

const productKeys: HomeProductKey[] = ['courtside', 'cherry-blossom', 'default'];

export default function AdminHomeMediaPage() {
  const [productKey, setProductKey] = useState<HomeProductKey>('courtside');
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const cfg = await getHomeConfigAdmin(productKey);
        setConfig(cfg);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productKey]);

  const setHeroBg = async (device: 'desktop' | 'mobile', file: File) => {
    if (!config) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadHomeHeroBackground(file, productKey, device);
      const next: HomeConfig = {
        ...config,
        hero: {
          ...config.hero,
          bgDesktopUrl: device === 'desktop' ? url : config.hero.bgDesktopUrl,
          bgMobileUrl: device === 'mobile' ? url : config.hero.bgMobileUrl,
        },
      };
      setConfig(next);
      await saveHomeConfig(productKey, next);
      alert('Saved!');
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearHeroBg = async (device: 'desktop' | 'mobile') => {
    if (!config) return;
    if (!confirm(`Remove ${device} hero background for ${productKey}?`)) return;
    const next: HomeConfig = {
      ...config,
      hero: {
        ...config.hero,
        bgDesktopUrl: device === 'desktop' ? '' : config.hero.bgDesktopUrl,
        bgMobileUrl: device === 'mobile' ? '' : config.hero.bgMobileUrl,
      },
    };
    setConfig(next);
    await saveHomeConfig(productKey, next);
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Home • Media</h1>
        <p className="text-slate-500 mt-1">Upload hero background images (desktop/mobile) per product.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {productKeys.map((k) => (
          <button
            key={k}
            onClick={() => setProductKey(k)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              productKey === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {(['desktop', 'mobile'] as const).map((device) => {
          const url = device === 'desktop' ? config.hero.bgDesktopUrl : config.hero.bgMobileUrl;
          return (
            <div key={device} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Hero Background • {device.toUpperCase()}</h2>
                  <p className="text-sm text-slate-500">
                    Recommended: {device === 'desktop' ? '1920×1080+' : '1080×1600+'} (max 10MB)
                  </p>
                </div>
                {url && (
                  <button
                    type="button"
                    onClick={() => void clearHeroBg(device)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center mb-4">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`${productKey} ${device}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 text-sm">Not set</div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload Image
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void setHeroBg(device, file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>

              {url && (
                <div className="mt-3 text-xs">
                  <a href={url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-900 underline">
                    View full size
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


