'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Eye, Palette, RefreshCw } from 'lucide-react';
import { getTheme, saveTheme, defaultTheme, type ThemeColors } from '@/lib/services/theme';

const presetThemes = [
  {
    name: 'Dark Premium',
    colors: defaultTheme,
  },
  {
    name: 'Ocean Blue',
    colors: {
      ...defaultTheme,
      pageBg: '#0c4a6e',
      navbarBg: '#0c4a6e',
      cardBg: '#075985',
      primaryBtnBg: '#0ea5e9',
      primaryBtnHoverBg: '#0284c7',
      accentColor: '#38bdf8',
      goldColor: '#fbbf24',
    },
  },
  {
    name: 'Burgundy Gold',
    colors: {
      ...defaultTheme,
      pageBg: '#450a0a',
      navbarBg: '#450a0a',
      cardBg: '#7f1d1d',
      primaryBtnBg: '#eab308',
      primaryBtnText: '#1c1917',
      primaryBtnHoverBg: '#ca8a04',
      accentColor: '#f59e0b',
      goldColor: '#fbbf24',
    },
  },
  {
    name: 'Light Modern',
    colors: {
      pageBg: '#f8fafc',
      navbarBg: '#ffffff',
      cardBg: '#ffffff',
      footerBg: '#1e293b',
      headingText: '#0f172a',
      bodyText: '#1e293b',
      mutedText: '#64748b',
      primaryBtnBg: '#3b82f6',
      primaryBtnText: '#ffffff',
      primaryBtnHoverBg: '#2563eb',
      secondaryBtnBg: '#f1f5f9',
      secondaryBtnText: '#1e293b',
      secondaryBtnBorder: '#e2e8f0',
      accentColor: '#3b82f6',
      goldColor: '#f59e0b',
    },
  },
];

const colorGroups = [
  {
    title: 'Backgrounds',
    colors: [
      { key: 'pageBg', label: 'Page Background' },
      { key: 'navbarBg', label: 'Navbar Background' },
      { key: 'cardBg', label: 'Card Background' },
      { key: 'footerBg', label: 'Footer Background' },
    ],
  },
  {
    title: 'Text Colors',
    colors: [
      { key: 'headingText', label: 'Heading Text' },
      { key: 'bodyText', label: 'Body Text' },
      { key: 'mutedText', label: 'Muted Text' },
    ],
  },
  {
    title: 'Primary Button',
    colors: [
      { key: 'primaryBtnBg', label: 'Background' },
      { key: 'primaryBtnText', label: 'Text' },
      { key: 'primaryBtnHoverBg', label: 'Hover Background' },
    ],
  },
  {
    title: 'Secondary Button',
    colors: [
      { key: 'secondaryBtnBg', label: 'Background' },
      { key: 'secondaryBtnText', label: 'Text' },
      { key: 'secondaryBtnBorder', label: 'Border' },
    ],
  },
  {
    title: 'Accents',
    colors: [
      { key: 'accentColor', label: 'Accent Color' },
      { key: 'goldColor', label: 'Gold / Highlight' },
    ],
  },
];

export default function ThemePage() {
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('Custom');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    setIsLoading(true);
    try {
      const savedTheme = await getTheme();
      setTheme(savedTheme);
      
      // Check if it matches a preset
      const matchingPreset = presetThemes.find(p => 
        JSON.stringify(p.colors) === JSON.stringify(savedTheme)
      );
      setActivePreset(matchingPreset?.name || 'Custom');
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
    setActivePreset('Custom');
  };

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setTheme(preset.colors);
    setActivePreset(preset.name);
  };

  const resetToDefault = () => {
    setTheme(defaultTheme);
    setActivePreset('Dark Premium');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTheme(theme);
      alert('Theme saved successfully! The changes will be visible on the main website.');
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme');
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
          <h1 className="text-2xl font-bold text-slate-900">Theme Settings</h1>
          <p className="text-slate-500 mt-1">Customize website colors and appearance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetToDefault} className="btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preset Themes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Preset Themes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    activePreset === preset.name
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-1 mb-3">
                    <div
                      className="w-6 h-6 rounded-full border border-slate-300"
                      style={{ backgroundColor: preset.colors.pageBg }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-slate-300"
                      style={{ backgroundColor: preset.colors.primaryBtnBg }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-slate-300"
                      style={{ backgroundColor: preset.colors.goldColor }}
                    />
                  </div>
                  <div className="text-sm font-medium text-slate-900">{preset.name}</div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Color Groups */}
          {colorGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{group.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {group.colors.map((color) => (
                  <div key={color.key}>
                    <label className="label">{color.label}</label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={theme[color.key as keyof ThemeColors]}
                          onChange={(e) => updateColor(color.key as keyof ThemeColors, e.target.value)}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                        />
                      </div>
                      <input
                        type="text"
                        value={theme[color.key as keyof ThemeColors]}
                        onChange={(e) => updateColor(color.key as keyof ThemeColors, e.target.value)}
                        className="input-field flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 sticky top-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Live Preview</h2>
              <Eye className="w-5 h-5 text-slate-400" />
            </div>

            {/* Mini Website Preview */}
            <div
              className="rounded-xl overflow-hidden border border-slate-200"
              style={{ backgroundColor: theme.pageBg }}
            >
              {/* Navbar Preview */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: theme.navbarBg }}
              >
                <span className="font-bold" style={{ color: theme.headingText }}>
                  UNI<span style={{ color: theme.goldColor }}>K</span>
                </span>
                <div className="flex gap-3 text-xs" style={{ color: theme.mutedText }}>
                  <span>Home</span>
                  <span>Tour</span>
                  <span>Register</span>
                </div>
              </div>

              {/* Hero Preview */}
              <div className="p-6 text-center">
                <div
                  className="text-lg font-bold mb-2"
                  style={{ color: theme.headingText }}
                >
                  Experience the KBL
                </div>
                <div
                  className="text-xs mb-4"
                  style={{ color: theme.bodyText }}
                >
                  All-Star 2026 Tour
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: theme.primaryBtnBg,
                    color: theme.primaryBtnText,
                  }}
                >
                  Book Now
                </button>
              </div>

              {/* Card Preview */}
              <div className="px-4 pb-4">
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: theme.cardBg }}
                >
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: theme.headingText }}
                  >
                    Tour Package
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: theme.mutedText }}
                  >
                    4 Days / 3 Nights
                  </div>
                </div>
              </div>

              {/* Button Preview */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: theme.primaryBtnBg,
                    color: theme.primaryBtnText,
                  }}
                >
                  Primary
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border"
                  style={{
                    backgroundColor: theme.secondaryBtnBg,
                    color: theme.secondaryBtnText,
                    borderColor: theme.secondaryBtnBorder,
                  }}
                >
                  Secondary
                </button>
              </div>

              {/* Footer Preview */}
              <div
                className="px-4 py-3 text-center text-xs"
                style={{
                  backgroundColor: theme.footerBg,
                  color: theme.mutedText,
                }}
              >
                © 2025 UNIK
              </div>
            </div>

            {/* Current Preset */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Current Theme</div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary-600" />
                <span className="font-medium text-slate-900">{activePreset}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6 bg-purple-50 border-purple-200">
        <h3 className="font-medium text-purple-900 mb-2">🎨 Design Tips</h3>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Use high contrast between background and text for readability</li>
          <li>• Gold/yellow accents work great for premium travel brands</li>
          <li>• Preview your changes before saving to ensure visual consistency</li>
          <li>• Changes will apply to the main website after saving</li>
        </ul>
      </div>
    </div>
  );
}
