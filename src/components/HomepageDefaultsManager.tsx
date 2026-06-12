import React, { useEffect, useState } from 'react';
import { FallbackListingAdTemplate, HeroBannerStat, HomepageCategoryShortcut, HomepageDefaultsConfigState, HomepageSection, HomepageSectionType } from '../types';

type HomepageDefaultsManagerProps = {
  config: HomepageDefaultsConfigState;
  onSave?: (config: HomepageDefaultsConfigState) => Promise<HomepageDefaultsConfigState> | HomepageDefaultsConfigState | void;
};

const SECTION_TYPES: HomepageSectionType[] = [
  'hero_banner',
  'search_discovery',
  'emergency_grid',
  'promo_banner',
  'featured_businesses',
  'business_shelf',
  'text_business_strip',
  'offers_list',
  'updates_feed',
  'category_grid',
  'verified_business_grid',
  'trust_strip',
];

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const splitCsv = (value: string) => (
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const createSectionTemplate = (index: number): HomepageSection => ({
  id: `template-section-${index + 1}`,
  sectionType: 'category_grid',
  title: 'New Section',
  subtitle: '',
  status: 'active',
  visible: true,
  sortOrder: (index + 1) * 10,
  localityIds: ['template'],
  pincodes: [],
  categoryIds: [],
  ctaType: 'none',
  showViewAll: true,
  maxItems: 6,
  visibleSlots: 4,
  desktopCardCount: 4,
  mobileCardCount: 2,
  mobileDisplayMode: 'carousel',
  listingSourceMode: 'auto',
  pinnedBusinessIds: [],
  autoRotate: true,
  rotationIntervalSec: 3,
});

const createFallbackAd = (index: number): FallbackListingAdTemplate => ({
  id: `fallback-ad-${index + 1}`,
  title: `Fallback Ad ${index + 1}`,
  description: '',
  badge: 'Advertisement',
  ctaText: 'Learn More',
  backgroundColor: '#eef2ff',
  actionType: 'landing_page',
  categoryIds: [],
  tags: [],
  deviceTarget: 'all',
});

const createHeroStatTemplate = (index: number): HeroBannerStat => ({
  enabled: true,
  label: `Hero Stat ${index + 1}`,
  value: '',
  localityIds: [],
  pincodes: [],
});

const createHeroQuickAction = (index: number): HomepageCategoryShortcut => ({
  label: `Quick Action ${index + 1}`,
  categoryId: '',
  subcategoryId: '',
});

export default function HomepageDefaultsManager({
  config,
  onSave,
}: HomepageDefaultsManagerProps) {
  const [draft, setDraft] = useState<HomepageDefaultsConfigState>(config);
  const [statusText, setStatusText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const persist = async (nextDraft: HomepageDefaultsConfigState) => {
    if (!onSave) {
      setStatusText('Homepage defaults save callback is not configured.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        ...nextDraft,
        metadata: {
          seededFromCode: false,
          updatedAt: new Date().toISOString(),
        },
      });
      setStatusText('Homepage defaults saved.');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to save homepage defaults.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Homepage Defaults</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Default homepage section templates and fallback ad inventory can now be edited from admin instead of staying code-seeded.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <div>Section templates: <span className="font-bold text-slate-900">{draft.sectionTemplates.length}</span></div>
          <div>Fallback ads: <span className="font-bold text-slate-900">{draft.fallbackListingAds.length}</span></div>
          <div>Hero stat templates: <span className="font-bold text-slate-900">{draft.heroStatTemplates.length}</span></div>
          <div>Hero quick actions: <span className="font-bold text-slate-900">{draft.heroQuickActions.length}</span></div>
        </div>
      </div>

      {statusText && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          {statusText}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div>
          <div className="text-xs font-bold text-slate-900">Hero banner defaults</div>
          <div className="text-[10px] text-slate-500">These presets drive the admin hero-banner form and fallback stat templates.</div>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <input
            value={draft.heroBannerDraftDefaults.ctaLabel}
            onChange={(e) => setDraft((prev) => ({
              ...prev,
              heroBannerDraftDefaults: { ...prev.heroBannerDraftDefaults, ctaLabel: e.target.value },
            }))}
            placeholder="Default CTA label"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          />
          <select
            value={draft.heroBannerDraftDefaults.ctaType}
            onChange={(e) => setDraft((prev) => ({
              ...prev,
              heroBannerDraftDefaults: { ...prev.heroBannerDraftDefaults, ctaType: e.target.value as HomepageDefaultsConfigState['heroBannerDraftDefaults']['ctaType'] },
            }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          >
            <option value="search_category">search_category</option>
            <option value="landing_page">landing_page</option>
            <option value="landing_listing">landing_listing</option>
            <option value="lead_form">lead_form</option>
          </select>
          <input
            value={draft.heroBannerDraftDefaults.ctaTarget}
            onChange={(e) => setDraft((prev) => ({
              ...prev,
              heroBannerDraftDefaults: { ...prev.heroBannerDraftDefaults, ctaTarget: e.target.value },
            }))}
            placeholder="Default CTA target"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          />
          <input
            value={String(draft.heroBannerDraftDefaults.durationDays)}
            onChange={(e) => setDraft((prev) => ({
              ...prev,
              heroBannerDraftDefaults: {
                ...prev.heroBannerDraftDefaults,
                durationDays: Math.max(1, Number(e.target.value || 0) || 1),
              },
            }))}
            placeholder="Duration days"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-900">Hero stat templates</div>
              <div className="text-[10px] text-slate-500">Each new hero banner starts with these stat cards before locality overrides are applied.</div>
            </div>
            <button
              type="button"
              onClick={() => setDraft((prev) => ({
                ...prev,
                heroStatTemplates: [...prev.heroStatTemplates, createHeroStatTemplate(prev.heroStatTemplates.length)],
              }))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
            >
              Add stat
            </button>
          </div>

          {draft.heroStatTemplates.map((stat, index) => (
            <div key={`${stat.label}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-[auto_1fr_1fr_auto]">
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={stat.enabled}
                    onChange={(e) => setDraft((prev) => ({
                      ...prev,
                      heroStatTemplates: prev.heroStatTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: e.target.checked } : item),
                    }))}
                  />
                  <span>Enabled</span>
                </label>
                <input
                  value={stat.label}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    heroStatTemplates: prev.heroStatTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item),
                  }))}
                  placeholder="Stat label"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={stat.value}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    heroStatTemplates: prev.heroStatTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item),
                  }))}
                  placeholder="Stat value"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    heroStatTemplates: prev.heroStatTemplates.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={(stat.localityIds || []).join(', ')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    heroStatTemplates: prev.heroStatTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, localityIds: splitCsv(e.target.value) } : item),
                  }))}
                  placeholder="Locality IDs"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={(stat.pincodes || []).join(', ')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    heroStatTemplates: prev.heroStatTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, pincodes: splitCsv(e.target.value) } : item),
                  }))}
                  placeholder="Pincodes"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Hero quick actions</div>
            <div className="text-[10px] text-slate-500">These tiles appear inside the homepage hero search block.</div>
          </div>
          <button
            type="button"
            onClick={() => setDraft((prev) => ({
              ...prev,
              heroQuickActions: [...prev.heroQuickActions, createHeroQuickAction(prev.heroQuickActions.length)],
            }))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
          >
            Add action
          </button>
        </div>

        <div className="space-y-3">
          {draft.heroQuickActions.map((shortcut, index) => (
            <div key={`${shortcut.categoryId}-${shortcut.subcategoryId || 'all'}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  value={shortcut.label}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    heroQuickActions: prev.heroQuickActions.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item),
                  }))}
                  placeholder="Tile label"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={shortcut.categoryId}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    heroQuickActions: prev.heroQuickActions.map((item, itemIndex) => itemIndex === index ? { ...item, categoryId: e.target.value } : item),
                  }))}
                  placeholder="Category ID"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={shortcut.subcategoryId || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    heroQuickActions: prev.heroQuickActions.map((item, itemIndex) => itemIndex === index ? { ...item, subcategoryId: e.target.value } : item),
                  }))}
                  placeholder="Subcategory ID"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    heroQuickActions: prev.heroQuickActions.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div>
          <div className="text-xs font-bold text-slate-900">Search shortcut categories</div>
          <div className="text-[10px] text-slate-500">Quick category chips shown in the search and discovery block.</div>
        </div>
        <input
          value={draft.searchShortcutCategoryIds.join(', ')}
          onChange={(e) => setDraft((prev) => ({
            ...prev,
            searchShortcutCategoryIds: splitCsv(e.target.value),
          }))}
          placeholder="Category IDs"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Section templates</div>
            <div className="text-[10px] text-slate-500">These are cloned into new locality homepage layouts and fallback section rendering.</div>
          </div>
          <button
            type="button"
            onClick={() => setDraft((prev) => ({
              ...prev,
              sectionTemplates: [...prev.sectionTemplates, createSectionTemplate(prev.sectionTemplates.length)],
            }))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
          >
            Add template
          </button>
        </div>

        <div className="space-y-3">
          {draft.sectionTemplates.map((section, index) => (
            <div key={`${section.id}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  value={section.title}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item),
                  }))}
                  placeholder="Title"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={section.id}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, id: slugify(e.target.value) } : item),
                  }))}
                  placeholder="ID"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <select
                  value={section.sectionType}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, sectionType: e.target.value as HomepageSectionType } : item),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  {SECTION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={section.subtitle || ''}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, subtitle: e.target.value } : item),
                }))}
                rows={2}
                placeholder="Subtitle"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
              />
              <div className="grid gap-2 md:grid-cols-4">
                <input
                  value={String(section.maxItems || '')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, maxItems: Number(e.target.value || 0) || undefined } : item),
                  }))}
                  placeholder="Max items"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={String(section.visibleSlots || '')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, visibleSlots: Number(e.target.value || 0) || undefined } : item),
                  }))}
                  placeholder="Visible slots"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={String(section.desktopCardCount || '')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, desktopCardCount: Number(e.target.value || 0) || undefined } : item),
                  }))}
                  placeholder="Desktop cards"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={String(section.mobileCardCount || '')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, mobileCardCount: Number(e.target.value || 0) || undefined } : item),
                  }))}
                  placeholder="Mobile cards"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <input
                  value={section.placementKey || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, placementKey: e.target.value } : item),
                  }))}
                  placeholder="Placement key"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={section.categoryId || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, categoryId: e.target.value } : item),
                  }))}
                  placeholder="Primary category ID"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={(section.categoryIds || []).join(', ')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, categoryIds: splitCsv(e.target.value) } : item),
                  }))}
                  placeholder="Category IDs"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <select
                  value={section.mobileDisplayMode || 'carousel'}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    sectionTemplates: prev.sectionTemplates.map((item, itemIndex) => itemIndex === index ? { ...item, mobileDisplayMode: e.target.value as HomepageSection['mobileDisplayMode'] } : item),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  <option value="carousel">carousel</option>
                  <option value="stack">stack</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Fallback listing ads</div>
            <div className="text-[10px] text-slate-500">Used when sponsored inventory is missing for a slot or placement.</div>
          </div>
          <button
            type="button"
            onClick={() => setDraft((prev) => ({
              ...prev,
              fallbackListingAds: [...prev.fallbackListingAds, createFallbackAd(prev.fallbackListingAds.length)],
            }))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
          >
            Add ad
          </button>
        </div>

        <div className="space-y-3">
          {draft.fallbackListingAds.map((ad, index) => (
            <div key={`${ad.id}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  value={ad.title}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item),
                  }))}
                  placeholder="Title"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={ad.id}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, id: slugify(e.target.value) } : item),
                  }))}
                  placeholder="ID"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <select
                  value={ad.actionType}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, actionType: e.target.value as FallbackListingAdTemplate['actionType'] } : item),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  <option value="landing_page">landing_page</option>
                  <option value="landing_listing">landing_listing</option>
                  <option value="lead_form">lead_form</option>
                </select>
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={ad.description}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item),
                }))}
                rows={2}
                placeholder="Description"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
              />
              <div className="grid gap-2 md:grid-cols-4">
                <input
                  value={ad.badge}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, badge: e.target.value } : item),
                  }))}
                  placeholder="Badge"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={ad.ctaText}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, ctaText: e.target.value } : item),
                  }))}
                  placeholder="CTA text"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={ad.backgroundColor}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, backgroundColor: e.target.value } : item),
                  }))}
                  placeholder="#eef2ff"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <select
                  value={ad.deviceTarget || 'all'}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, deviceTarget: e.target.value as FallbackListingAdTemplate['deviceTarget'] } : item),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  <option value="all">all</option>
                  <option value="desktop">desktop</option>
                  <option value="mobile">mobile</option>
                </select>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <input
                  value={ad.targetUrl || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, targetUrl: e.target.value } : item),
                  }))}
                  placeholder="Target URL"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={ad.targetCategoryId || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, targetCategoryId: e.target.value } : item),
                  }))}
                  placeholder="Target category ID"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={ad.placementKey || ''}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, placementKey: e.target.value } : item),
                  }))}
                  placeholder="Placement key"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={String(ad.mobileRowPosition || '')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, mobileRowPosition: Number(e.target.value || 0) || undefined } : item),
                  }))}
                  placeholder="Mobile row"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={(ad.categoryIds || []).join(', ')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, categoryIds: splitCsv(e.target.value) } : item),
                  }))}
                  placeholder="Category IDs"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={(ad.tags || []).join(', ')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    fallbackListingAds: prev.fallbackListingAds.map((item, itemIndex) => itemIndex === index ? { ...item, tags: splitCsv(e.target.value) } : item),
                  }))}
                  placeholder="Tags"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void persist(draft)}
          disabled={isSaving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Homepage Defaults'}
        </button>
      </div>
    </div>
  );
}
