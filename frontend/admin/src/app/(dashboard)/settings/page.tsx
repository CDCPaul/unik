'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Mail, Phone, MapPin, Globe, Image } from 'lucide-react';

interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  logoUrl: string;
  faviconUrl: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'UNIK',
  tagline: 'Your Gateway to Korean Basketball',
  contactEmail: 'ticket@cebudirectclub.com',
  contactPhone: '+63 912 345 6789',
  address: 'Cebu City, Philippines',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  logoUrl: '',
  faviconUrl: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to Firebase
      console.log('Saving settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure website general settings</p>
        </div>
        <button onClick={saveSettings} disabled={isSaving} className="btn-primary">
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => updateSetting('siteName', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => updateSetting('tagline', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => updateSetting('contactEmail', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => updateSetting('contactPhone', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => updateSetting('address', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </motion.div>

        {/* Social Media */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Social Media</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Facebook URL</label>
              <input
                type="url"
                value={settings.facebookUrl}
                onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/..."
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Instagram URL</label>
              <input
                type="url"
                value={settings.instagramUrl}
                onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/..."
                className="input-field"
              />
            </div>
            <div>
              <label className="label">YouTube URL</label>
              <input
                type="url"
                value={settings.youtubeUrl}
                onChange={(e) => updateSetting('youtubeUrl', e.target.value)}
                placeholder="https://youtube.com/..."
                className="input-field"
              />
            </div>
          </div>
        </motion.div>

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <Image className="w-4 h-4" />
                Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-400">U</span>
                  )}
                </div>
                <button className="btn-secondary text-sm">
                  Upload Logo
                </button>
              </div>
            </div>
            <div>
              <label className="label">Favicon</label>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                  {settings.faviconUrl ? (
                    <img src={settings.faviconUrl} alt="Favicon" className="max-w-full max-h-full" />
                  ) : (
                    <Globe className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <button className="btn-secondary text-sm">
                  Upload Favicon
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6 border-red-200"
      >
        <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900">Reset All Settings</h3>
            <p className="text-sm text-slate-500">This will reset all settings to default values</p>
          </div>
          <button className="btn-danger">
            Reset to Default
          </button>
        </div>
      </motion.div>
    </div>
  );
}

