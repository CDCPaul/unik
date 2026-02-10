'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RefreshCw, Plus, Trash2, AlertCircle, CheckCircle2, GripVertical } from 'lucide-react';
import {
  defaultRouletteConfig,
  getRouletteConfig,
  saveRouletteConfig,
} from '@/lib/services/roulette';
import type { RouletteConfig, RouletteTier } from '@unik/shared/types';

const COLORS = [
  '#FFD700', '#C0C0C0', '#CD7F32', '#FF6B6B', '#4ECDC4', 
  '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
];

export default function RouletteSettingsPage() {
  const [config, setConfig] = useState<RouletteConfig>(defaultRouletteConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getRouletteConfig(defaultRouletteConfig.id);
        
        // 기존 데이터 마이그레이션: visualCounts를 tiers의 visualCount로 변환
        let tiers = data.tiers || defaultRouletteConfig.tiers;
        
        if (data.visualCounts && tiers.length > 0) {
          tiers = tiers.map(tier => ({
            ...tier,
            visualCount: tier.visualCount ?? data.visualCounts?.[tier.id] ?? 0,
            color: tier.color || COLORS[tiers.findIndex(t => t.id === tier.id) % COLORS.length],
            order: tier.order ?? tiers.findIndex(t => t.id === tier.id) + 1,
          }));
        }
        
        setConfig({
          ...defaultRouletteConfig,
          ...data,
          tiers: tiers.sort((a, b) => a.order - b.order),
          slotCount: data.slotCount || defaultRouletteConfig.slotCount,
          targetSpins: data.targetSpins || defaultRouletteConfig.targetSpins,
          visualPattern: data.visualPattern || defaultRouletteConfig.visualPattern,
        });
      } catch (error) {
        console.error('Failed to load roulette config:', error);
        alert('Failed to load roulette settings.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const tiers = config.tiers || [];
  const slotCount = config.slotCount || 50;
  const targetSpins = config.targetSpins || 0;
  const totalProb = tiers.reduce((acc, tier) => acc + Number(tier.probability || 0), 0);
  const totalVisualCount = tiers.reduce((acc, tier) => acc + Number(tier.visualCount || 0), 0);
  const visualPatternText = (config.visualPattern || []).join(', ');

  // Validation logic
  useEffect(() => {
    const newErrors: string[] = [];
    
    if (totalVisualCount !== slotCount) {
      newErrors.push(`Total visible slices (${totalVisualCount}) does not match total slices (${slotCount}).`);
    }
    
    if (Math.abs(totalProb - 100) > 0.01) {
      newErrors.push(`Total probability (${totalProb.toFixed(2)}%) does not equal 100%.`);
    }
    
    if (tiers.length === 0) {
      newErrors.push('At least one prize is required.');
    }
    
    tiers.forEach((tier, idx) => {
      if (!tier.name.trim()) {
        newErrors.push(`Prize #${idx + 1} has an empty name.`);
      }
      if (tier.probability <= 0) {
        newErrors.push(`${tier.name} has a probability of 0 or less.`);
      }
      if (tier.visualCount < 0) {
        newErrors.push(`${tier.name} has a negative slice count.`);
      }
    });
    
    setErrors(newErrors);
  }, [tiers, slotCount, totalProb, totalVisualCount]);

  const updateTier = (id: string, updates: Partial<RouletteTier>) => {
    setConfig((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => (tier.id === id ? { ...tier, ...updates } : tier)),
    }));
  };

  const addTier = () => {
    const newId = `tier-${Date.now()}`;
    const newOrder = Math.max(...tiers.map(t => t.order), 0) + 1;
    const newTier: RouletteTier = {
      id: newId,
      name: 'New Prize',
      probability: 1.0,
      visualCount: 5,
      color: COLORS[tiers.length % COLORS.length],
      order: newOrder,
    };
    
    setConfig((prev) => ({
      ...prev,
      tiers: [...prev.tiers, newTier],
    }));
  };

  const deleteTier = (id: string) => {
    if (tiers.length <= 1) {
      alert('At least one prize is required.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this prize?')) return;
    
    setConfig((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((tier) => tier.id !== id),
    }));
  };

  const handleSave = async () => {
    if (errors.length > 0) {
      alert(`Cannot save:\n${errors.join('\n')}`);
      return;
    }
    
    setIsSaving(true);
    try {
      // visualCounts를 tiers 기반으로 재구성 (하위 호환성)
      const visualCounts = tiers.reduce((acc, tier) => {
        acc[tier.id] = tier.visualCount;
        return acc;
      }, {} as Record<string, number>);
      
      await saveRouletteConfig({
        ...config,
        tiers,
        slotCount,
        targetSpins,
        visualCounts, // 하위 호환성을 위해 유지
        visualPattern: (config.visualPattern || []).filter(Boolean),
      });
      alert('Roulette settings saved successfully!');
    } catch (error) {
      console.error('Failed to save roulette config:', error);
      alert('Failed to save roulette settings.');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roulette Settings</h1>
          <p className="text-slate-500 mt-1">Manage prize types, winning probabilities, and visible slice counts.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving || errors.length > 0} 
          className="admin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Validation Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="admin-card p-4 bg-red-50 border-l-4 border-red-500"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-2">Please resolve the following issues:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
        
        {errors.length === 0 && tiers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="admin-card p-4 bg-green-50 border-l-4 border-green-500"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700">All settings are valid. Ready to save.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roulette Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📊 Roulette Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Total Slices</div>
            <input
              type="number"
              min={1}
              max={200}
              value={slotCount}
              onChange={(e) => setConfig((prev) => ({ ...prev, slotCount: Number(e.target.value) }))}
              className="admin-input text-2xl font-semibold"
            />
            <p className="text-xs text-slate-500 mt-2">Total number of wheel slices</p>
          </div>
          
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Prize Types</div>
            <div className="text-2xl font-semibold text-slate-900">{tiers.length}</div>
            <p className="text-xs text-slate-500 mt-2">
              {tiers.map(t => t.name).join(', ')}
            </p>
          </div>
          
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Target Spins</div>
            <input
              type="number"
              min={0}
              value={targetSpins}
              onChange={(e) => setConfig((prev) => ({ ...prev, targetSpins: Number(e.target.value) }))}
              className="admin-input text-2xl font-semibold"
            />
            <p className="text-xs text-slate-500 mt-2">Win count limit baseline</p>
          </div>
          
          <div className={`rounded-lg border p-4 ${
            Math.abs(totalProb - 100) < 0.01 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}>
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Total Probability</div>
            <div className={`text-2xl font-semibold ${
              Math.abs(totalProb - 100) < 0.01 ? 'text-green-700' : 'text-red-700'
            }`}>
              {totalProb.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-2">Should equal 100%</p>
          </div>
        </div>
      </motion.div>

      {/* Prize Management Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="admin-card"
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">🎁 Prize Management</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure name, visible slice count, and winning probability for each prize.
            </p>
          </div>
          <button onClick={addTier} className="admin-btn-secondary">
            <Plus className="w-4 h-4" />
            Add Prize
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Prize Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Visible Slices
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Win Probability (%)
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Expected Wins<br/>({targetSpins} spins)
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tiers.map((tier, index) => {
                const expected = totalProb > 0 ? Math.round((targetSpins * tier.probability) / totalProb) : 0;
                const actualProb = totalProb > 0 ? ((tier.probability / totalProb) * 100).toFixed(2) : '0.00';
                
                return (
                  <tr key={tier.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border-2 border-slate-300"
                          style={{ backgroundColor: tier.color || '#ccc' }}
                        />
                        <input
                          type="color"
                          value={tier.color || '#ccc'}
                          onChange={(e) => updateTier(tier.id, { color: e.target.value })}
                          className="w-8 h-8 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                        className="admin-input"
                        placeholder="Prize name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={slotCount}
                        value={tier.visualCount}
                        onChange={(e) => updateTier(tier.id, { visualCount: Number(e.target.value) })}
                        className="admin-input w-24"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <input
                          type="number"
                          min={0.01}
                          max={100}
                          step={0.01}
                          value={tier.probability}
                          onChange={(e) => updateTier(tier.id, { probability: Number(e.target.value) })}
                          className="admin-input w-24"
                        />
                        <p className="text-xs text-slate-500">Actual: {actualProb}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-lg font-semibold text-slate-900">{expected}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteTier(tier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-900">
                  Total:
                </td>
                <td className="px-4 py-3">
                  <div className={`text-lg font-semibold ${
                    totalVisualCount === slotCount ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totalVisualCount} / {slotCount}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`text-lg font-semibold ${
                    Math.abs(totalProb - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totalProb.toFixed(2)}%
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-lg font-semibold text-slate-900">
                    {tiers.reduce((acc, tier) => {
                      const expected = totalProb > 0 ? Math.round((targetSpins * tier.probability) / totalProb) : 0;
                      return acc + expected;
                    }, 0)}
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* Advanced Settings - Visual Pattern */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="admin-card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">⚙️ Visual Pattern Settings</h2>
        <p className="text-sm text-slate-600 mb-4">
          Define the order in which slices are placed on the roulette wheel. This pattern repeats until all slices are placed.
        </p>
        
        <div className="space-y-4">
          {/* Quick Pattern Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Quick Pattern Selection
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  // Even distribution: all prizes in order
                  const pattern = tiers.map(t => t.id);
                  setConfig(prev => ({ ...prev, visualPattern: pattern }));
                }}
                className="p-3 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="font-medium text-slate-900 mb-1">Even Distribution</div>
                <div className="text-xs text-slate-500">Place all prizes in order</div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Probability-based: more high-probability prizes
                  const pattern: string[] = [];
                  const sorted = [...tiers].sort((a, b) => b.probability - a.probability);
                  
                  sorted.forEach((tier, idx) => {
                    const weight = Math.max(1, Math.ceil(tier.probability / 10));
                    for (let i = 0; i < weight; i++) {
                      pattern.push(tier.id);
                    }
                  });
                  
                  setConfig(prev => ({ ...prev, visualPattern: pattern.length > 0 ? pattern : [tiers[0]?.id || 'low'] }));
                }}
                className="p-3 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="font-medium text-slate-900 mb-1">Probability-Based</div>
                <div className="text-xs text-slate-500">Place proportional to win rate</div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Reverse order: emphasize lower tiers
                  const pattern: string[] = [];
                  const sorted = [...tiers].sort((a, b) => a.order - b.order).reverse();
                  
                  sorted.forEach((tier, idx) => {
                    const weight = idx + 1;
                    for (let i = 0; i < weight; i++) {
                      pattern.push(tier.id);
                    }
                  });
                  
                  setConfig(prev => ({ ...prev, visualPattern: pattern.length > 0 ? pattern : [tiers[0]?.id || 'low'] }));
                }}
                className="p-3 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="font-medium text-slate-900 mb-1">Emphasize Lower Tiers</div>
                <div className="text-xs text-slate-500">Place lower tiers more often</div>
              </button>
            </div>
          </div>

          {/* Custom Pattern Builder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Custom Pattern ({config.visualPattern?.length || 0} items)
            </label>
            
            {/* Current Pattern Display */}
            <div className="mb-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {(config.visualPattern || []).length === 0 ? (
                  <div className="text-sm text-slate-400 italic">Pattern is empty. Add prizes below.</div>
                ) : (
                  (config.visualPattern || []).map((tierId, idx) => {
                    const tier = tiers.find(t => t.id === tierId);
                    return (
                      <div
                        key={`${tierId}-${idx}`}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 text-sm font-medium"
                        style={{
                          backgroundColor: tier?.color || '#ccc',
                          borderColor: tier?.color || '#ccc',
                          color: '#000',
                        }}
                      >
                        <span>{tier?.name || tierId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newPattern = [...(config.visualPattern || [])];
                            newPattern.splice(idx, 1);
                            setConfig(prev => ({ ...prev, visualPattern: newPattern }));
                          }}
                          className="hover:bg-black/10 rounded-full p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add Prize Buttons */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 mb-2">Click to add to pattern:</div>
              <div className="flex flex-wrap gap-2">
                {tiers.map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      const newPattern = [...(config.visualPattern || []), tier.id];
                      setConfig(prev => ({ ...prev, visualPattern: newPattern }));
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 hover:shadow-md transition-all"
                    style={{
                      borderColor: tier.color || '#ccc',
                      backgroundColor: 'white',
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tier.color || '#ccc' }}
                    />
                    <span className="text-sm font-medium text-slate-900">{tier.name}</span>
                    <Plus className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, visualPattern: [] }))}
                  className="text-sm px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-600"
                >
                  Reset Pattern
                </button>
              </div>
            </div>
          </div>

          {/* Pattern Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <div className="font-medium mb-1">💡 How Patterns Work</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• Pattern repeats until all slices are placed on the wheel</li>
                  <li>• Each prize is placed only up to its "visible slice count"</li>
                  <li>• If pattern is empty, prizes are auto-placed in order</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
