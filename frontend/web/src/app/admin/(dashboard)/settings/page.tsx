'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { getSettings, saveSettings, defaultSettings } from '@/lib/services/admin/settings';
import { CompanyInfo } from '@unik/shared/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanyInfo>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      alert('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: keyof CompanyInfo, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSocialChange = (key: keyof CompanyInfo['socialMedia'], value: string) => {
    setSettings(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage general website settings</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Site Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Site Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand Name</label>
            <input
              type="text"
              value={settings.brandName}
              onChange={(e) => handleChange('brandName', e.target.value)}
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Site Description</label>
            <input
              type="text"
              value={settings.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input
              type="text"
              value={settings.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Viber</label>
            <input
              type="text"
              value={settings.contactViber}
              onChange={(e) => handleChange('contactViber', e.target.value)}
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Office Address</label>
            <input
              type="text"
              value={settings.officeAddress}
              onChange={(e) => handleChange('officeAddress', e.target.value)}
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Social Media */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">Social Media</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Facebook URL</label>
            <input
              type="url"
              value={settings.socialMedia.facebook}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Instagram URL</label>
            <input
              type="url"
              value={settings.socialMedia.instagram}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Twitter URL</label>
            <input
              type="url"
              value={settings.socialMedia.twitter}
              onChange={(e) => handleSocialChange('twitter', e.target.value)}
              placeholder="https://twitter.com/..."
              className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
