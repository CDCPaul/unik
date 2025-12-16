'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Mail, Phone, MapPin, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { getSettings, saveSettings, defaultSettings, uploadLogo } from '@/lib/services/admin/settings';
import { CompanyInfo } from '@unik/shared/types';
import Image from 'next/image';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanyInfo>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const normalizeContactLists = (s: CompanyInfo): CompanyInfo => {
    const contactEmails =
      (s.contactEmails && s.contactEmails.length ? s.contactEmails : (s.contactEmail ? [s.contactEmail] : [])).filter(Boolean);
    const contactPhones =
      (s.contactPhones && s.contactPhones.length ? s.contactPhones : (s.contactPhone ? [s.contactPhone] : [])).filter(Boolean);
    const contactVibers =
      (s.contactVibers && s.contactVibers.length ? s.contactVibers : (s.contactViber ? [s.contactViber] : [])).filter(Boolean);

    return {
      ...s,
      contactEmails,
      contactPhones,
      contactVibers,
      // Keep legacy fields aligned to first value for other parts of the app
      contactEmail: contactEmails[0] || s.contactEmail,
      contactPhone: contactPhones[0] || s.contactPhone,
      contactViber: contactVibers[0] || s.contactViber,
    };
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(normalizeContactLists(data));
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

  const updateListValue = (key: 'contactEmails' | 'contactPhones' | 'contactVibers', idx: number, value: string) => {
    setSettings((prev) => {
      const current = (prev[key] || []).slice();
      current[idx] = value;
      return normalizeContactLists({ ...prev, [key]: current } as CompanyInfo);
    });
  };

  const addListValue = (key: 'contactEmails' | 'contactPhones' | 'contactVibers') => {
    setSettings((prev) => normalizeContactLists({ ...prev, [key]: [...(prev[key] || []), ''] } as CompanyInfo));
  };

  const removeListValue = (key: 'contactEmails' | 'contactPhones' | 'contactVibers', idx: number) => {
    setSettings((prev) => {
      const next = (prev[key] || []).filter((_, i) => i !== idx);
      return normalizeContactLists({ ...prev, [key]: next } as CompanyInfo);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const logoUrl = await uploadLogo(file);
      setSettings(prev => ({ ...prev, logoUrl }));
      alert('Logo uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('Are you sure you want to remove the logo?')) {
      setSettings(prev => ({ ...prev, logoUrl: '' }));
    }
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

      <div className="space-y-6">
        {/* Site Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
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

            {/* Logo Upload */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-3">Logo</label>
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="shrink-0">
                  {settings.logoUrl ? (
                    <div className="relative">
                      <div className="w-32 h-20 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                        <Image
                          src={settings.logoUrl}
                          alt="Logo Preview"
                          width={128}
                          height={80}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove Logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>
                    {settings.logoUrl && (
                      <a
                        href={settings.logoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-600 hover:text-slate-900 underline"
                      >
                        View Full Size
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Recommended: PNG or SVG format, max 5MB. Logo will appear in the navigation bar.
                  </p>
                </div>
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
            <div className="space-y-6">
              {/* Emails */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <label className="block text-sm font-medium text-slate-700">Emails</label>
                  <button
                    type="button"
                    onClick={() => addListValue('contactEmails')}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    + Add Email
                  </button>
                </div>
                <div className="space-y-2">
                  {(settings.contactEmails || []).map((v, idx) => (
                    <div key={`email-${idx}`} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={v}
                        onChange={(e) => updateListValue('contactEmails', idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeListValue('contactEmails', idx)}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                        aria-label="Remove email"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                  {(!settings.contactEmails || settings.contactEmails.length === 0) && (
                    <p className="text-sm text-slate-500">No emails set.</p>
                  )}
                </div>
              </div>

              {/* Phones */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <label className="block text-sm font-medium text-slate-700">Phone Numbers</label>
                  <button
                    type="button"
                    onClick={() => addListValue('contactPhones')}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    + Add Phone
                  </button>
                </div>
                <div className="space-y-2">
                  {(settings.contactPhones || []).map((v, idx) => (
                    <div key={`phone-${idx}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) => updateListValue('contactPhones', idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeListValue('contactPhones', idx)}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                        aria-label="Remove phone"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                  {(!settings.contactPhones || settings.contactPhones.length === 0) && (
                    <p className="text-sm text-slate-500">No phone numbers set.</p>
                  )}
                </div>
              </div>

              {/* Vibers */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <label className="block text-sm font-medium text-slate-700">Viber Numbers</label>
                  <button
                    type="button"
                    onClick={() => addListValue('contactVibers')}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    + Add Viber
                  </button>
                </div>
                <div className="space-y-2">
                  {(settings.contactVibers || []).map((v, idx) => (
                    <div key={`viber-${idx}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) => updateListValue('contactVibers', idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeListValue('contactVibers', idx)}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                        aria-label="Remove viber"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                  {(!settings.contactVibers || settings.contactVibers.length === 0) && (
                    <p className="text-sm text-slate-500">No Viber numbers set.</p>
                  )}
                </div>
              </div>

              {/* Office Address */}
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
          transition={{ delay: 0.15 }}
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
    </div>
  );
}
