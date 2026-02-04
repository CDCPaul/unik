'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw } from 'lucide-react';
import {
  defaultRouletteConfig,
  getRouletteConfig,
  saveRouletteConfig,
} from '@/lib/services/roulette';
import type { RouletteConfig, RouletteTier } from '@unik/shared/types';

const probabilityOptions = [
  0.1, 0.2, 0.3, 0.5, 1, 2, 3, 4, 5, 8, 10, 12, 15, 16, 20, 30, 40, 50, 60, 70, 80, 90, 95,
  98, 99,
];

export default function RouletteSettingsPage() {
  const [config, setConfig] = useState<RouletteConfig>(defaultRouletteConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getRouletteConfig(defaultRouletteConfig.id);
        setConfig({
          ...defaultRouletteConfig,
          ...data,
          tiers: data.tiers?.length ? data.tiers : defaultRouletteConfig.tiers,
          slotCount: data.slotCount || defaultRouletteConfig.slotCount,
          targetSpins: data.targetSpins || defaultRouletteConfig.targetSpins,
          visualCounts: data.visualCounts || defaultRouletteConfig.visualCounts,
          visualPattern: data.visualPattern || defaultRouletteConfig.visualPattern,
        });
      } catch (error) {
        console.error('Failed to load roulette config:', error);
        alert('Failed to load roulette config');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const tiers = config.tiers || defaultRouletteConfig.tiers || [];
  const slotCount = config.slotCount || 50;
  const targetSpins = config.targetSpins || 0;
  const totalProb = tiers.reduce((acc, tier) => acc + Number(tier.probability || 0), 0);
  const visualCounts = config.visualCounts || { high: 5, mid: 10, low: 35 };
  const visualPatternText = (config.visualPattern || []).join(', ');

  const updateTier = (id: string, updates: Partial<RouletteTier>) => {
    setConfig((prev) => ({
      ...prev,
      tiers: (prev.tiers || []).map((tier) => (tier.id === id ? { ...tier, ...updates } : tier)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveRouletteConfig({
        ...config,
        tiers,
        slotCount,
        targetSpins,
        visualCounts,
        visualPattern: (config.visualPattern || []).filter(Boolean),
      });
      alert('Roulette settings saved!');
    } catch (error) {
      console.error('Failed to save roulette config:', error);
      alert('Failed to save roulette config');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roulette Settings</h1>
          <p className="text-slate-500 mt-1">Configure tiers, probabilities, and target spins.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="admin-btn-primary">
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 p-4">
            <label className="text-slate-500 text-xs uppercase tracking-wider">Target Spins</label>
            <input
              type="number"
              min={0}
              value={targetSpins}
              onChange={(e) => setConfig((prev) => ({ ...prev, targetSpins: Number(e.target.value) }))}
              className="admin-input mt-2"
            />
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-slate-500 text-xs uppercase tracking-wider">Slot Count</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{slotCount}</div>
            <p className="text-xs text-slate-500 mt-1">Fixed at 50 slices.</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-slate-500 text-xs uppercase tracking-wider">Total Probability</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{totalProb || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Relative weights are used.</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="admin-card p-6"
      >
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
          Visual Layout
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          {(['high', 'mid', 'low'] as const).map((grade) => (
            <div key={grade} className="rounded-lg border border-slate-200 p-4">
              <label className="text-slate-500 text-xs uppercase tracking-wider">{grade} slices</label>
              <input
                type="number"
                min={0}
                value={visualCounts[grade] ?? 0}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    visualCounts: {
                      ...(prev.visualCounts || {}),
                      [grade]: Number(e.target.value),
                    },
                  }))
                }
                className="admin-input mt-2"
              />
            </div>
          ))}
          <div className="rounded-lg border border-slate-200 p-4 md:col-span-1">
            <div className="text-slate-500 text-xs uppercase tracking-wider">Total</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {(visualCounts.high || 0) + (visualCounts.mid || 0) + (visualCounts.low || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Should equal {slotCount}.</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-slate-500 text-xs uppercase tracking-wider">Pattern</label>
          <input
            type="text"
            value={visualPatternText}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                visualPattern: e.target.value
                  .split(',')
                  .map((v) => v.trim().toLowerCase())
                  .filter(Boolean) as any,
              }))
            }
            className="admin-input mt-2"
            placeholder="low, low, low, mid, high, mid, low, low, low"
          />
          <p className="text-xs text-slate-500 mt-2">
            Pattern repeats until all slices are placed.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="admin-card"
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Prize Tiers</h2>
          <p className="text-sm text-slate-500 mt-1">
            Adjust name + probability. Slot allocation updates automatically.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {tiers.map((tier, index) => {
            const expected = totalProb ? Math.round((targetSpins * tier.probability) / totalProb) : 0;
            return (
              <div key={tier.id} className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-1 text-sm text-slate-500">#{index + 1}</div>
                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Probability</label>
                  <select
                    value={tier.probability}
                    onChange={(e) => updateTier(tier.id, { probability: Number(e.target.value) })}
                    className="admin-input"
                  >
                    {probabilityOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Visual slices</label>
                  <div className="text-lg font-semibold text-slate-900">
                    {visualCounts[tier.id as 'high' | 'mid' | 'low'] ?? 0}
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected</label>
                  <div className="text-lg font-semibold text-slate-900">{expected}</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
