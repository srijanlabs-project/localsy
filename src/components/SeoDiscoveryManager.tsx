import React, { useEffect, useMemo, useState } from 'react';
import { Locality, SeoDiscoveryConfigState } from '../types';
import { BUSINESS_CATEGORIES, getCategoryById } from '../categoryMaster';

type SeoDiscoveryManagerProps = {
  config: SeoDiscoveryConfigState;
  localities: Locality[];
  onSave?: (config: SeoDiscoveryConfigState) => Promise<SeoDiscoveryConfigState> | SeoDiscoveryConfigState | void;
};

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

export default function SeoDiscoveryManager({
  config,
  localities,
  onSave,
}: SeoDiscoveryManagerProps) {
  const [draft, setDraft] = useState<SeoDiscoveryConfigState>(config);
  const [statusText, setStatusText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const localityLookup = useMemo(
    () => new Map(localities.map((locality) => [locality.id, locality])),
    [localities]
  );

  const saveConfig = async () => {
    if (!onSave) {
      setStatusText('SEO discovery save callback is not configured.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        ...draft,
        metadata: {
          seededFromCode: false,
          updatedAt: new Date().toISOString(),
        },
      });
      setStatusText('SEO discovery configuration saved.');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to save SEO discovery configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">SEO Discovery Configuration</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Locality SEO metadata, route intents, category labels, and fallback listing names now live in managed configuration instead of code-only route constants.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <div>Route intents: <span className="font-bold text-slate-900">{draft.routeIntents.length}</span></div>
          <div>SEO localities: <span className="font-bold text-slate-900">{draft.localityMetadata.length}</span></div>
        </div>
      </div>

      {statusText && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          {statusText}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Route intents</div>
            <div className="text-[10px] text-slate-500">These control canonical locality/category search paths like `/roadpali/electrician`.</div>
          </div>
          <button
            type="button"
            onClick={() => setDraft((prev) => ({
              ...prev,
              routeIntents: [
                ...prev.routeIntents,
                {
                  id: `seo-intent-${prev.routeIntents.length + 1}`,
                  slug: '',
                  categoryId: BUSINESS_CATEGORIES[0]?.id || '',
                  q: '',
                  labelPrefix: '',
                },
              ],
            }))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
          >
            Add intent
          </button>
        </div>
        <div className="space-y-2">
          {draft.routeIntents.map((intent, index) => (
            <div key={`${intent.id}-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <input
                value={intent.q}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  routeIntents: prev.routeIntents.map((row, rowIndex) => rowIndex === index ? { ...row, q: e.target.value, labelPrefix: row.labelPrefix || e.target.value } : row),
                }))}
                placeholder="Search term"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
              />
              <input
                value={intent.slug}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  routeIntents: prev.routeIntents.map((row, rowIndex) => rowIndex === index ? { ...row, slug: slugify(e.target.value) } : row),
                }))}
                placeholder="Slug"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
              />
              <select
                value={intent.categoryId}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  routeIntents: prev.routeIntents.map((row, rowIndex) => rowIndex === index ? { ...row, categoryId: e.target.value } : row),
                }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
              >
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input
                value={intent.labelPrefix}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  routeIntents: prev.routeIntents.map((row, rowIndex) => rowIndex === index ? { ...row, labelPrefix: e.target.value } : row),
                }))}
                placeholder="Footer label"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
              />
              <button
                type="button"
                onClick={() => setDraft((prev) => ({
                  ...prev,
                  routeIntents: prev.routeIntents.filter((_, rowIndex) => rowIndex !== index),
                }))}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Locality metadata</div>
            <div className="text-[10px] text-slate-500">Controls SSR headings, intros, robots host mapping, and sitemap locality scope.</div>
          </div>
        </div>
        <div className="space-y-2">
          {draft.localityMetadata.map((locality, index) => (
            <div key={`${locality.id}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-4">
                <select
                  value={locality.id}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    localityMetadata: prev.localityMetadata.map((row, rowIndex) => (
                      rowIndex === index
                        ? {
                            ...row,
                            id: e.target.value,
                            name: (localityLookup.get(e.target.value)?.name || row.name).split(',')[0],
                          }
                        : row
                    )),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  {localities.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.name.split(',')[0]}</option>
                  ))}
                </select>
                <input
                  value={locality.name}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    localityMetadata: prev.localityMetadata.map((row, rowIndex) => rowIndex === index ? { ...row, name: e.target.value } : row),
                  }))}
                  placeholder="Display name"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={locality.city}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    localityMetadata: prev.localityMetadata.map((row, rowIndex) => rowIndex === index ? { ...row, city: e.target.value } : row),
                  }))}
                  placeholder="City"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <input
                  value={locality.subdomain}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    localityMetadata: prev.localityMetadata.map((row, rowIndex) => rowIndex === index ? { ...row, subdomain: e.target.value } : row),
                  }))}
                  placeholder="Subdomain"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
                />
              </div>
              <textarea
                value={locality.intro}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  localityMetadata: prev.localityMetadata.map((row, rowIndex) => rowIndex === index ? { ...row, intro: e.target.value } : row),
                }))}
                rows={2}
                placeholder="Locality intro"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
              />
              <input
                value={locality.pincodes.join(', ')}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  localityMetadata: prev.localityMetadata.map((row, rowIndex) => rowIndex === index ? { ...row, pincodes: splitCsv(e.target.value) } : row),
                }))}
                placeholder="Pincodes, comma separated"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-900">Category labels</div>
              <div className="text-[10px] text-slate-500">Used for category-level SEO headings and copy.</div>
            </div>
            <button
              type="button"
              onClick={() => setDraft((prev) => ({
                ...prev,
                categoryLabels: [...prev.categoryLabels, { categoryId: BUSINESS_CATEGORIES[0]?.id || '', label: '' }],
              }))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
            >
              Add label
            </button>
          </div>
          <div className="space-y-2">
            {draft.categoryLabels.map((row, index) => (
              <div key={`${row.categoryId}-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]">
                <select
                  value={row.categoryId}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    categoryLabels: prev.categoryLabels.map((item, rowIndex) => rowIndex === index ? { ...item, categoryId: e.target.value, label: item.label || getCategoryById(e.target.value)?.name || '' } : item),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  {BUSINESS_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <input
                  value={row.label}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    categoryLabels: prev.categoryLabels.map((item, rowIndex) => rowIndex === index ? { ...item, label: e.target.value } : item),
                  }))}
                  placeholder="SEO label"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    categoryLabels: prev.categoryLabels.filter((_, rowIndex) => rowIndex !== index),
                  }))}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-900">Default listing name groups</div>
              <div className="text-[10px] text-slate-500">Used when a locality/category pair has no dedicated fallback listing set.</div>
            </div>
            <button
              type="button"
              onClick={() => setDraft((prev) => ({
                ...prev,
                defaultListingNames: [...prev.defaultListingNames, { categoryId: BUSINESS_CATEGORIES[0]?.id || '', listingNames: [] }],
              }))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
            >
              Add group
            </button>
          </div>
          <div className="space-y-2">
            {draft.defaultListingNames.map((row, index) => (
              <div key={`${row.categoryId}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <select
                    value={row.categoryId}
                    onChange={(e) => setDraft((prev) => ({
                      ...prev,
                      defaultListingNames: prev.defaultListingNames.map((item, rowIndex) => rowIndex === index ? { ...item, categoryId: e.target.value } : item),
                    }))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                  >
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({
                      ...prev,
                      defaultListingNames: prev.defaultListingNames.filter((_, rowIndex) => rowIndex !== index),
                    }))}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={row.listingNames.join(', ')}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    defaultListingNames: prev.defaultListingNames.map((item, rowIndex) => rowIndex === index ? { ...item, listingNames: splitCsv(e.target.value) } : item),
                  }))}
                  rows={2}
                  placeholder="Listing names, comma separated"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Locality-specific top listing groups</div>
            <div className="text-[10px] text-slate-500">Dedicated fallback listing-name sets per locality and category for SSR pages.</div>
          </div>
          <button
            type="button"
            onClick={() => setDraft((prev) => ({
              ...prev,
              topListings: [
                ...prev.topListings,
                {
                  localityId: localities[0]?.id || 'roadpali',
                  categoryId: BUSINESS_CATEGORIES[0]?.id || '',
                  listingNames: [],
                },
              ],
            }))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
          >
            Add group
          </button>
        </div>
        <div className="space-y-2">
          {draft.topListings.map((row, index) => (
            <div key={`${row.localityId}-${row.categoryId}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <select
                  value={row.localityId}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    topListings: prev.topListings.map((item, rowIndex) => rowIndex === index ? { ...item, localityId: e.target.value } : item),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  {localities.map((locality) => (
                    <option key={locality.id} value={locality.id}>{locality.name.split(',')[0]}</option>
                  ))}
                </select>
                <select
                  value={row.categoryId}
                  onChange={(e) => setDraft((prev) => ({
                    ...prev,
                    topListings: prev.topListings.map((item, rowIndex) => rowIndex === index ? { ...item, categoryId: e.target.value } : item),
                  }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
                >
                  {BUSINESS_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    topListings: prev.topListings.filter((_, rowIndex) => rowIndex !== index),
                  }))}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={row.listingNames.join(', ')}
                onChange={(e) => setDraft((prev) => ({
                  ...prev,
                  topListings: prev.topListings.map((item, rowIndex) => rowIndex === index ? { ...item, listingNames: splitCsv(e.target.value) } : item),
                }))}
                rows={2}
                placeholder="Listing names, comma separated"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveConfig}
          disabled={isSaving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save SEO Config'}
        </button>
      </div>
    </div>
  );
}
