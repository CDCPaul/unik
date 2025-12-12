'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, ArrowUp, ArrowDown, Eye, Monitor, Smartphone, Save } from 'lucide-react';
import type { HomeConfig, HomeProductKey, HomeSection, TourPackage, Player, GalleryImage } from '@unik/shared/types';
import { getHomeConfigAdmin, saveHomeConfig } from '@/lib/services/admin/homeConfigs';
import { getTours } from '@/lib/services/tours';
import { getPlayers } from '@/lib/services/players';
import { getGalleryImages } from '@/lib/services/gallery';
import HomePreview from '@/components/homebuilder/HomePreview';

const productKeys: HomeProductKey[] = ['courtside', 'cherry-blossom', 'default'];

function newSection(type: HomeSection['type']): HomeSection {
  const id = `${type}-${Date.now()}`;
  if (type === 'spacer') {
    return { id, type, enabled: true, order: 999, props: { height: 'md' } } as any;
  }
  if (type === 'highlightsFromItinerary') {
    return {
      id,
      type,
      enabled: true,
      order: 999,
      props: { heading: 'Highlights', subheading: 'Top moments from the itinerary.', maxItems: 3, onlyHighlighted: true },
    } as any;
  }
  if (type === 'playersGrid') {
    return {
      id,
      type,
      enabled: true,
      order: 999,
      props: { heading: 'Filipino Stars', subheading: 'Meet the pride of Philippines in KBL.', ctaText: 'View All Players', maxItems: 4 },
    } as any;
  }
  if (type === 'galleryPreview') {
    return {
      id,
      type,
      enabled: true,
      order: 999,
      props: { heading: 'Tour Gallery', subheading: 'Sneak peek of what awaits you in Korea.', ctaText: 'View Full Gallery', maxItems: 6 },
    } as any;
  }
  // cta
  return {
    id,
    type: 'cta',
    enabled: true,
    order: 999,
    props: { heading: "Don't Miss the Action!", body: 'Secure your spot now for the upcoming tour.', buttonText: 'Register Now' },
  } as any;
}

export default function AdminHomeBuilderPage() {
  const [productKey, setProductKey] = useState<HomeProductKey>('courtside');
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Preview data
  const [tour, setTour] = useState<TourPackage | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const cfg = await getHomeConfigAdmin(productKey);
        setConfig(cfg);
        setSelectedSectionId(cfg.sections?.[0]?.id || null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productKey]);

  useEffect(() => {
    async function loadPreviewData() {
      try {
        const [toursData, playersData, galleryData] = await Promise.all([getTours(), getPlayers(), getGalleryImages()]);
        const activeTours = toursData.filter(t => t.isActive);
        const byProduct = activeTours.filter(t => {
          if (productKey === 'default') return true;
          return t.productCategory === productKey || t.productId?.startsWith(productKey);
        });
        const selected = byProduct.find(t => t.isFeaturedOnHome) || byProduct.find(t => t.isFeatured) || byProduct[0] || activeTours[0] || null;
        setTour(selected || null);
        setPlayers(playersData);
        setGallery(galleryData);
      } catch (e) {
        console.error(e);
      }
    }
    loadPreviewData();
  }, [productKey]);

  const sortedSections = useMemo(() => {
    return (config?.sections || []).slice().sort((a, b) => a.order - b.order);
  }, [config?.sections]);

  const selectedSection = useMemo(() => {
    if (!config || !selectedSectionId) return null;
    return config.sections.find(s => s.id === selectedSectionId) || null;
  }, [config, selectedSectionId]);

  const updateSection = (id: string, patch: Partial<HomeSection>) => {
    if (!config) return;
    setConfig({
      ...config,
      sections: config.sections.map(s => (s.id === id ? ({ ...s, ...patch } as any) : s)),
    });
  };

  const moveSection = (id: string, dir: 'up' | 'down') => {
    if (!config) return;
    const sections = sortedSections.slice();
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const swapWith = dir === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sections.length) return;
    const a = sections[idx];
    const b = sections[swapWith];
    const next = config.sections.map(s => {
      if (s.id === a.id) return { ...s, order: b.order } as any;
      if (s.id === b.id) return { ...s, order: a.order } as any;
      return s;
    });
    setConfig({ ...config, sections: next });
  };

  const addSection = (type: HomeSection['type']) => {
    if (!config) return;
    const maxOrder = Math.max(0, ...(config.sections || []).map(s => s.order));
    const s = newSection(type);
    s.order = maxOrder + 10;
    setConfig({ ...config, sections: [...config.sections, s] });
    setSelectedSectionId(s.id);
  };

  const removeSection = (id: string) => {
    if (!config) return;
    if (!confirm('Remove this section?')) return;
    const next = config.sections.filter(s => s.id !== id);
    setConfig({ ...config, sections: next });
    setSelectedSectionId(next[0]?.id || null);
  };

  const save = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await saveHomeConfig(productKey, config);
      alert('Saved!');
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home • Builder</h1>
          <p className="text-slate-500 mt-1">Edit section order/visibility and text. Preview supports desktop/mobile toggle.</p>
        </div>
        <button
          onClick={() => void save()}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
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

      <div className="grid xl:grid-cols-12 gap-6">
        {/* Left: Sections list */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-900">Sections</div>
              <div className="flex gap-2">
                <select
                  className="admin-input text-sm"
                  onChange={(e) => {
                    const v = e.target.value as HomeSection['type'];
                    if (v) addSection(v);
                    e.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">+ Add</option>
                  <option value="playersGrid">Players Grid</option>
                  <option value="highlightsFromItinerary">Highlights (from itinerary)</option>
                  <option value="galleryPreview">Gallery Preview</option>
                  <option value="cta">CTA</option>
                  <option value="spacer">Spacer</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {sortedSections.map((s) => (
                <div
                  key={s.id}
                  className={`border rounded-lg p-3 cursor-pointer ${
                    selectedSectionId === s.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedSectionId(s.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{s.type}</div>
                      <div className="text-xs text-slate-500">order: {s.order}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={(e) => updateSection(s.id, { enabled: e.target.checked } as any)}
                        />
                        enabled
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      className="p-1 rounded border border-slate-200 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(s.id, 'up');
                      }}
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded border border-slate-200 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(s.id, 'down');
                      }}
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-xs text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSection(s.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {sortedSections.length === 0 && <div className="text-sm text-slate-500">No sections.</div>}
            </div>
          </div>

          {/* Hero text (always) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="font-semibold text-slate-900 mb-3">Hero (Text & Fonts)</div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Badge</label>
                <input
                  value={config.hero.badgeText || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, badgeText: e.target.value } })}
                  className="admin-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Badge Font</label>
                <select
                  value={config.hero.badgeFontFamily || 'inherit'}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, badgeFontFamily: e.target.value as any } })}
                  className="admin-input text-sm"
                >
                  <option value="inherit">Inherit</option>
                  <option value="display">Display</option>
                  <option value="korean-sans">Korean Sans (각진)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title (override)</label>
                <input
                  value={config.hero.titleText || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleText: e.target.value } })}
                  className="admin-input text-sm"
                  placeholder="Blank = use featured tour title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subtitle (override)</label>
                <input
                  value={config.hero.subtitleText || ''}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitleText: e.target.value } })}
                  className="admin-input text-sm"
                  placeholder="Blank = use featured tour subtitle"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subtitle Font</label>
                <select
                  value={config.hero.subtitleFontFamily || 'inherit'}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitleFontFamily: e.target.value as any } })}
                  className="admin-input text-sm"
                >
                  <option value="inherit">Inherit</option>
                  <option value="display">Display</option>
                  <option value="korean-sans">Korean Sans (각진)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Primary CTA Text</label>
                  <input
                    value={config.hero.primaryCtaText || ''}
                    onChange={(e) => setConfig({ ...config, hero: { ...config.hero, primaryCtaText: e.target.value } })}
                    className="admin-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Secondary CTA Text</label>
                  <input
                    value={config.hero.secondaryCtaText || ''}
                    onChange={(e) => setConfig({ ...config, hero: { ...config.hero, secondaryCtaText: e.target.value } })}
                    className="admin-input text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Primary CTA Font</label>
                  <select
                    value={config.hero.primaryCtaFontFamily || 'inherit'}
                    onChange={(e) => setConfig({ ...config, hero: { ...config.hero, primaryCtaFontFamily: e.target.value as any } })}
                    className="admin-input text-sm"
                  >
                    <option value="inherit">Inherit</option>
                    <option value="display">Display</option>
                    <option value="korean-sans">Korean Sans (각진)</option>
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Secondary CTA Font</label>
                  <select
                    value={config.hero.secondaryCtaFontFamily || 'inherit'}
                    onChange={(e) => setConfig({ ...config, hero: { ...config.hero, secondaryCtaFontFamily: e.target.value as any } })}
                    className="admin-input text-sm"
                  >
                    <option value="inherit">Inherit</option>
                    <option value="display">Display</option>
                    <option value="korean-sans">Korean Sans (각진)</option>
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title Font</label>
                <select
                  value={config.hero.titleFontFamily || 'display'}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, titleFontFamily: e.target.value as any } })}
                  className="admin-input text-sm"
                >
                  <option value="inherit">Inherit</option>
                  <option value="display">Display</option>
                  <option value="korean-sans">Korean Sans (각진)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              <div className="text-xs text-slate-500">
                Hero background images are managed in <span className="font-semibold">Home → Media</span>.
              </div>
            </div>
          </div>

          {/* Section editor */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="font-semibold text-slate-900 mb-3">Selected Section</div>
            {!selectedSection ? (
              <div className="text-sm text-slate-500">Select a section.</div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">type: <span className="font-semibold">{selectedSection.type}</span></div>

                {(selectedSection.type === 'playersGrid' || selectedSection.type === 'galleryPreview') && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Heading</label>
                      <input
                        value={(selectedSection as any).props?.heading || ''}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, heading: e.target.value } } as any)
                        }
                        className="admin-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Heading Font</label>
                      <select
                        value={(selectedSection as any).props?.headingFontFamily || 'inherit'}
                        onChange={(e) =>
                          updateSection(
                            selectedSection.id,
                            { props: { ...(selectedSection as any).props, headingFontFamily: e.target.value } } as any
                          )
                        }
                        className="admin-input text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="display">Display</option>
                        <option value="korean-sans">Korean Sans (각진)</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subheading</label>
                      <input
                        value={(selectedSection as any).props?.subheading || ''}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, subheading: e.target.value } } as any)
                        }
                        className="admin-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subheading Font</label>
                      <select
                        value={(selectedSection as any).props?.subheadingFontFamily || 'inherit'}
                        onChange={(e) =>
                          updateSection(
                            selectedSection.id,
                            { props: { ...(selectedSection as any).props, subheadingFontFamily: e.target.value } } as any
                          )
                        }
                        className="admin-input text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="display">Display</option>
                        <option value="korean-sans">Korean Sans (각진)</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                    {'ctaText' in ((selectedSection as any).props || {}) && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">CTA Text</label>
                        <input
                          value={(selectedSection as any).props?.ctaText || ''}
                          onChange={(e) =>
                            updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, ctaText: e.target.value } } as any)
                          }
                          className="admin-input text-sm"
                        />
                      </div>
                    )}
                    {'ctaText' in ((selectedSection as any).props || {}) && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">CTA Font</label>
                        <select
                          value={(selectedSection as any).props?.ctaFontFamily || 'inherit'}
                          onChange={(e) =>
                            updateSection(
                              selectedSection.id,
                              { props: { ...(selectedSection as any).props, ctaFontFamily: e.target.value } } as any
                            )
                          }
                          className="admin-input text-sm"
                        >
                          <option value="inherit">Inherit</option>
                          <option value="display">Display</option>
                          <option value="korean-sans">Korean Sans (각진)</option>
                          <option value="sans-serif">Sans Serif</option>
                          <option value="serif">Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {selectedSection.type === 'highlightsFromItinerary' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Heading</label>
                      <input
                        value={(selectedSection as any).props?.heading || ''}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, heading: e.target.value } } as any)
                        }
                        className="admin-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Heading Font</label>
                      <select
                        value={(selectedSection as any).props?.headingFontFamily || 'inherit'}
                        onChange={(e) =>
                          updateSection(
                            selectedSection.id,
                            { props: { ...(selectedSection as any).props, headingFontFamily: e.target.value } } as any
                          )
                        }
                        className="admin-input text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="display">Display</option>
                        <option value="korean-sans">Korean Sans (각진)</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subheading</label>
                      <input
                        value={(selectedSection as any).props?.subheading || ''}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, subheading: e.target.value } } as any)
                        }
                        className="admin-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subheading Font</label>
                      <select
                        value={(selectedSection as any).props?.subheadingFontFamily || 'inherit'}
                        onChange={(e) =>
                          updateSection(
                            selectedSection.id,
                            { props: { ...(selectedSection as any).props, subheadingFontFamily: e.target.value } } as any
                          )
                        }
                        className="admin-input text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="display">Display</option>
                        <option value="korean-sans">Korean Sans (각진)</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Max Items</label>
                        <input
                          type="number"
                          min={1}
                          value={(selectedSection as any).props?.maxItems || 3}
                          onChange={(e) =>
                            updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, maxItems: Number(e.target.value) } } as any)
                          }
                          className="admin-input text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="text-xs text-slate-600 inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean((selectedSection as any).props?.onlyHighlighted ?? true)}
                            onChange={(e) =>
                              updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, onlyHighlighted: e.target.checked } } as any)
                            }
                          />
                          onlyHighlighted
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {selectedSection.type === 'cta' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Heading</label>
                      <input
                        value={(selectedSection as any).props?.heading || ''}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, heading: e.target.value } } as any)
                        }
                        className="admin-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Heading Font</label>
                      <select
                        value={(selectedSection as any).props?.headingFontFamily || 'inherit'}
                        onChange={(e) =>
                          updateSection(
                            selectedSection.id,
                            { props: { ...(selectedSection as any).props, headingFontFamily: e.target.value } } as any
                          )
                        }
                        className="admin-input text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="display">Display</option>
                        <option value="korean-sans">Korean Sans (각진)</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Body</label>
                      <textarea
                        rows={3}
                        value={(selectedSection as any).props?.body || ''}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, body: e.target.value } } as any)
                        }
                        className="admin-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Body Font</label>
                      <select
                        value={(selectedSection as any).props?.bodyFontFamily || 'inherit'}
                        onChange={(e) =>
                          updateSection(
                            selectedSection.id,
                            { props: { ...(selectedSection as any).props, bodyFontFamily: e.target.value } } as any
                          )
                        }
                        className="admin-input text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="display">Display</option>
                        <option value="korean-sans">Korean Sans (각진)</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Button Text</label>
                      <input
                        value={(selectedSection as any).props?.buttonText || ''}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { props: { ...(selectedSection as any).props, buttonText: e.target.value } } as any)
                        }
                        className="admin-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Button Font</label>
                      <select
                        value={(selectedSection as any).props?.buttonFontFamily || 'inherit'}
                        onChange={(e) =>
                          updateSection(
                            selectedSection.id,
                            { props: { ...(selectedSection as any).props, buttonFontFamily: e.target.value } } as any
                          )
                        }
                        className="admin-input text-sm"
                      >
                        <option value="inherit">Inherit</option>
                        <option value="display">Display</option>
                        <option value="korean-sans">Korean Sans (각진)</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedSection.type === 'spacer' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Height</label>
                    <select
                      value={(selectedSection as any).props?.height || 'md'}
                      onChange={(e) => updateSection(selectedSection.id, { props: { height: e.target.value } } as any)}
                      className="admin-input text-sm"
                    >
                      <option value="sm">sm</option>
                      <option value="md">md</option>
                      <option value="lg">lg</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Eye className="w-4 h-4" /> Preview
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg border ${previewDevice === 'desktop' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700'}`}
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded-lg border ${previewDevice === 'mobile' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700'}`}
                onClick={() => setPreviewDevice('mobile')}
                title="Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <HomePreview
              device={previewDevice}
              config={config}
              tour={tour}
              players={players}
              gallery={gallery}
              productKey={productKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


