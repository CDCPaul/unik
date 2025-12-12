'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Type } from 'lucide-react';
import { getUiText, saveUiText } from '@/lib/services/admin/uiText';

type Field = { key: string; label: string; placeholder?: string; multiline?: boolean };

type FontChoice = 'inherit' | 'display' | 'sans-serif' | 'serif' | 'monospace' | 'korean-sans';

const fields: Field[] = [
  // Navbar / common
  { key: 'common.bookNow', label: 'Common • Book Now', placeholder: 'Book Now' },
  { key: 'common.viewTourDetails', label: 'Common • View Tour Details', placeholder: 'View Tour Details' },
  { key: 'common.registerNow', label: 'Common • Register Now', placeholder: 'Register Now' },

  // Footer
  { key: 'footer.heading.navigation', label: 'Footer • Heading: Navigation', placeholder: 'Navigation' },
  { key: 'footer.heading.support', label: 'Footer • Heading: Support', placeholder: 'Support' },
  { key: 'footer.heading.contact', label: 'Footer • Heading: Contact', placeholder: 'Contact Us' },
  { key: 'footer.link.home', label: 'Footer • Link: Home', placeholder: 'Home' },
  { key: 'footer.link.players', label: 'Footer • Link: Players', placeholder: 'Players' },
  { key: 'footer.link.tour', label: 'Footer • Link: Tour Package', placeholder: 'Tour Package' },
  { key: 'footer.link.info', label: 'Footer • Link: Travel Info', placeholder: 'Travel Info' },
  { key: 'footer.link.register', label: 'Footer • Link: Register Now', placeholder: 'Register Now' },
  { key: 'footer.link.contact', label: 'Footer • Link: Contact Us', placeholder: 'Contact Us' },
  { key: 'footer.link.faq', label: 'Footer • Link: FAQ', placeholder: 'FAQ' },
  { key: 'footer.link.visa', label: 'Footer • Link: Visa Info', placeholder: 'Visa Info' },
  { key: 'footer.link.privacy', label: 'Footer • Link: Privacy Policy', placeholder: 'Privacy Policy' },
  { key: 'footer.link.terms', label: 'Footer • Link: Terms of Service', placeholder: 'Terms of Service' },

  // Floating button
  { key: 'floating.registerNow', label: 'Floating Button • Register Now', placeholder: 'Register Now' },
  { key: 'floating.scrollTopAria', label: 'Floating Button • Scroll to top (aria)', placeholder: 'Scroll to top' },

  // Register page
  { key: 'register.title', label: 'Register Page • Title', placeholder: 'Register for Tour' },
  { key: 'register.subtitle', label: 'Register Page • Subtitle', placeholder: 'Fill out the form below to secure your spot...' },

  // Info page
  { key: 'info.hero.kicker', label: 'Info Page • Hero Kicker', placeholder: 'Essential Information' },
  { key: 'info.hero.title', label: 'Info Page • Hero Title', placeholder: 'Travel Information' },
  { key: 'info.hero.subtitle', label: 'Info Page • Hero Subtitle', placeholder: 'Everything you need to know before your trip...', multiline: true },

  { key: 'info.quickFacts.timezone', label: 'Info Page • Quick Fact: Timezone', placeholder: 'GMT+9 (1 hour ahead of PH)' },
  { key: 'info.quickFacts.flight', label: 'Info Page • Quick Fact: Flight Time', placeholder: '~4 hour flight from Manila' },
  { key: 'info.quickFacts.language', label: 'Info Page • Quick Fact: Language', placeholder: 'Korean (English in tourist areas)' },

  { key: 'info.section.visa.title', label: 'Info Page • Section: Visa (Title)', placeholder: 'Visa Requirements' },
  { key: 'info.section.visa.html', label: 'Info Page • Section: Visa (HTML)', placeholder: '<p>...</p>', multiline: true },
  { key: 'info.section.weather.title', label: 'Info Page • Section: Weather (Title)', placeholder: 'Weather & Packing' },
  { key: 'info.section.weather.html', label: 'Info Page • Section: Weather (HTML)', placeholder: '<p>...</p>', multiline: true },
  { key: 'info.section.money.title', label: 'Info Page • Section: Money (Title)', placeholder: 'Money & Payments' },
  { key: 'info.section.money.html', label: 'Info Page • Section: Money (HTML)', placeholder: '<p>...</p>', multiline: true },
  { key: 'info.section.communication.title', label: 'Info Page • Section: Communication (Title)', placeholder: 'Communication' },
  { key: 'info.section.communication.html', label: 'Info Page • Section: Communication (HTML)', placeholder: '<p>...</p>', multiline: true },

  { key: 'info.faq.kicker', label: 'Info Page • FAQ Kicker', placeholder: 'Got Questions?' },
  { key: 'info.faq.title', label: 'Info Page • FAQ Title', placeholder: 'Frequently Asked Questions' },
  { key: 'info.faq.1.q', label: 'Info Page • FAQ 1 (Question)', placeholder: 'What happens if my visa is denied?' },
  { key: 'info.faq.1.a', label: 'Info Page • FAQ 1 (Answer)', placeholder: '...', multiline: true },
  { key: 'info.faq.2.q', label: 'Info Page • FAQ 2 (Question)', placeholder: 'Is travel insurance included?' },
  { key: 'info.faq.2.a', label: 'Info Page • FAQ 2 (Answer)', placeholder: '...', multiline: true },
  { key: 'info.faq.3.q', label: 'Info Page • FAQ 3 (Question)', placeholder: 'Can I extend my stay after the tour?' },
  { key: 'info.faq.3.a', label: 'Info Page • FAQ 3 (Answer)', placeholder: '...', multiline: true },
  { key: 'info.faq.4.q', label: 'Info Page • FAQ 4 (Question)', placeholder: 'What is the payment schedule?' },
  { key: 'info.faq.4.a', label: 'Info Page • FAQ 4 (Answer)', placeholder: '...', multiline: true },
  { key: 'info.faq.5.q', label: 'Info Page • FAQ 5 (Question)', placeholder: 'Are the game seats guaranteed?' },
  { key: 'info.faq.5.a', label: 'Info Page • FAQ 5 (Answer)', placeholder: '...', multiline: true },
  { key: 'info.faq.6.q', label: 'Info Page • FAQ 6 (Question)', placeholder: 'What if I have dietary restrictions?' },
  { key: 'info.faq.6.a', label: 'Info Page • FAQ 6 (Answer)', placeholder: '...', multiline: true },

  { key: 'info.notice.title', label: 'Info Page • Notice Title', placeholder: 'Important Notice' },
  { key: 'info.notice.body', label: 'Info Page • Notice Body', placeholder: 'All information provided is accurate...', multiline: true },
];

export default function UiTextAdminPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [fonts, setFonts] = useState<Record<string, FontChoice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const doc = await getUiText();
        setValues(doc.values || {});
        setFonts((doc.fonts || {}) as Record<string, FontChoice>);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const onSave = async () => {
    setIsSaving(true);
    try {
      await saveUiText(values, fonts);
      alert('Saved!');
    } catch (e) {
      console.error(e);
      alert('Save failed');
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Type className="w-5 h-5" /> UI Text
          </h1>
          <p className="text-slate-500 mt-1">Centralized copy. Pages use t(key, fallback).</p>
        </div>
        <button
          onClick={() => void onSave()}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {f.multiline ? (
                  <textarea
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={4}
                    className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent sm:col-span-8"
                  />
                ) : (
                  <input
                    type="text"
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent sm:col-span-8"
                  />
                )}
                <select
                  value={fonts[f.key] ?? 'inherit'}
                  onChange={(e) => setFonts(prev => ({ ...prev, [f.key]: e.target.value as FontChoice }))}
                  className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent sm:col-span-4"
                  title="Font"
                >
                  <option value="inherit">Inherit</option>
                  <option value="display">Display</option>
                  <option value="korean-sans">Korean Sans (각진)</option>
                  <option value="sans-serif">Sans</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Mono</option>
                </select>
              </div>
              <p className="text-xs text-slate-400 mt-1">key: {f.key}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


