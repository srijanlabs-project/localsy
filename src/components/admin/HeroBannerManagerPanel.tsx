import React from 'react';
import type { HeroBanner, Locality } from '../../types';

type HeroStatDraft = {
  enabled: boolean;
  label: string;
  value: string;
  localityIds: string;
  pincodes: string;
};

type HeroBannerManagerPanelProps = {
  localities: Locality[];
  heroBanners: HeroBanner[];
  filteredHeroBanners: HeroBanner[];
  heroLocalityId: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroImageUploading: boolean;
  heroEditId: string | null;
  heroFormError: string;
  heroStartDate: string;
  heroEndDate: string;
  heroCtaLabel: string;
  heroCtaType: NonNullable<HeroBanner['ctaType']>;
  heroCtaTarget: string;
  heroPincodes: string;
  heroStatsDraft: HeroStatDraft[];
  heroPreviewImageUrl?: string;
  heroImageFolder: string;
  onHeroLocalityIdChange: (value: string) => void;
  onHeroTitleChange: (value: string) => void;
  onHeroSubtitleChange: (value: string) => void;
  onHeroImageUrlChange: (value: string) => void;
  onHeroImageFileChange: (file: File | null) => void;
  onHeroStartDateChange: (value: string) => void;
  onHeroEndDateChange: (value: string) => void;
  onHeroCtaLabelChange: (value: string) => void;
  onHeroCtaTypeChange: (value: NonNullable<HeroBanner['ctaType']>) => void;
  onHeroCtaTargetChange: (value: string) => void;
  onHeroPincodesChange: (value: string) => void;
  onToggleAllStats: () => void;
  onToggleStat: (index: number) => void;
  onUpdateStatField: (index: number, field: keyof HeroStatDraft, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onBeginEdit: (hero: HeroBanner) => void;
  onToggleActive: (hero: HeroBanner) => void;
  onDelete: (heroId: string) => void;
};

export default function HeroBannerManagerPanel({
  localities,
  heroBanners,
  filteredHeroBanners,
  heroLocalityId,
  heroTitle,
  heroSubtitle,
  heroImageUrl,
  heroImageUploading,
  heroEditId,
  heroFormError,
  heroStartDate,
  heroEndDate,
  heroCtaLabel,
  heroCtaType,
  heroCtaTarget,
  heroPincodes,
  heroStatsDraft,
  heroPreviewImageUrl,
  heroImageFolder,
  onHeroLocalityIdChange,
  onHeroTitleChange,
  onHeroSubtitleChange,
  onHeroImageUrlChange,
  onHeroImageFileChange,
  onHeroStartDateChange,
  onHeroEndDateChange,
  onHeroCtaLabelChange,
  onHeroCtaTypeChange,
  onHeroCtaTargetChange,
  onHeroPincodesChange,
  onToggleAllStats,
  onToggleStat,
  onUpdateStatField,
  onSubmit,
  onReset,
  onBeginEdit,
  onToggleActive,
  onDelete,
}: HeroBannerManagerPanelProps) {
  const activeHeroCount = filteredHeroBanners.filter((hero) => hero.isActive).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Hero Banner Manager</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Manage the first-fold locality story, CTA journey, and trust stat cards from a single ops workspace.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="font-bold text-emerald-800">Active</div>
            <div className="text-lg font-extrabold text-slate-950">{activeHeroCount}</div>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
            <div className="font-bold text-indigo-700">Visible</div>
            <div className="text-lg font-extrabold text-slate-950">{filteredHeroBanners.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="font-bold text-slate-600">Configured</div>
            <div className="text-lg font-extrabold text-slate-950">{heroBanners.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
          <select
            value={heroLocalityId}
            onChange={(event) => onHeroLocalityIdChange(event.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            {localities.map((locality) => (
              <option key={locality.id} value={locality.id}>{locality.name}</option>
            ))}
          </select>
          <input
            value={heroTitle}
            onChange={(event) => onHeroTitleChange(event.target.value)}
            placeholder="Hero title"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          />
          <textarea
            value={heroSubtitle}
            onChange={(event) => onHeroSubtitleChange(event.target.value)}
            placeholder="Hero subtitle"
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          />
          <input
            type="url"
            value={heroImageUrl}
            onChange={(event) => onHeroImageUrlChange(event.target.value)}
            placeholder="Hero image URL (optional if uploading)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          />
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
            <div className="font-semibold text-slate-700">Upload hero image</div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onHeroImageFileChange(event.target.files?.[0] || null)}
              className="mt-2 block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-indigo-700"
            />
            <div className="mt-1 text-[10px] text-slate-500">
              Uploads to <span className="font-mono">{heroImageFolder}</span>
            </div>
            {heroPreviewImageUrl && (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={heroPreviewImageUrl} alt="Hero preview" className="h-32 w-full object-cover" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={heroStartDate}
              onChange={(event) => onHeroStartDateChange(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
            <input
              type="date"
              value={heroEndDate}
              onChange={(event) => onHeroEndDateChange(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={heroCtaLabel}
              onChange={(event) => onHeroCtaLabelChange(event.target.value)}
              placeholder="CTA label"
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
            <select
              value={heroCtaType}
              onChange={(event) => onHeroCtaTypeChange(event.target.value as NonNullable<HeroBanner['ctaType']>)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="landing_page">Landing Page</option>
              <option value="landing_listing">Landing Listing</option>
              <option value="lead_form">Lead Form</option>
              <option value="search_category">Search Category</option>
            </select>
          </div>
          <input
            value={heroCtaTarget}
            onChange={(event) => onHeroCtaTargetChange(event.target.value)}
            placeholder="CTA target"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          />
          <input
            value={heroPincodes}
            onChange={(event) => onHeroPincodesChange(event.target.value)}
            placeholder="Target pincodes"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono"
          />
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-800">Hero stat cards</div>
                <div className="text-[10px] text-slate-500">Toggle each card and target it by locality or pincode.</div>
              </div>
              <button
                type="button"
                onClick={onToggleAllStats}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700"
              >
                Toggle all
              </button>
            </div>
            <div className="space-y-2">
              {heroStatsDraft.map((stat, index) => (
                <div key={`hero-stat-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={stat.enabled}
                        onChange={() => onToggleStat(index)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      Card {index + 1}
                    </label>
                    <span className="text-[10px] text-slate-500">{stat.enabled ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={stat.value}
                      onChange={(event) => onUpdateStatField(index, 'value', event.target.value)}
                      placeholder="Value"
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    />
                    <input
                      value={stat.label}
                      onChange={(event) => onUpdateStatField(index, 'label', event.target.value)}
                      placeholder="Label"
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={stat.localityIds}
                      onChange={(event) => onUpdateStatField(index, 'localityIds', event.target.value)}
                      placeholder="Locality IDs"
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                    />
                    <input
                      value={stat.pincodes}
                      onChange={(event) => onUpdateStatField(index, 'pincodes', event.target.value)}
                      placeholder="Pincodes"
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={heroImageUploading}
            className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {heroImageUploading ? 'Uploading...' : (heroEditId ? 'Update Hero Banner' : 'Create Hero Banner')}
          </button>
          {heroFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{heroFormError}</div>}
          {heroEditId && (
            <button
              type="button"
              onClick={onReset}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700"
            >
              Cancel Edit
            </button>
          )}
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Hero Library</div>
              <div className="text-[11px] text-slate-500">{heroBanners.length} total hero banners</div>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              {filteredHeroBanners.length} in scope
            </div>
          </div>
          <div className="space-y-2 max-h-[38rem] overflow-y-auto pr-1">
            {filteredHeroBanners.map((hero) => (
              <div key={hero.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs">
                {hero.imageUrl ? (
                  <img src={hero.imageUrl} alt={hero.title} className="mb-3 h-28 w-full rounded-lg object-cover" />
                ) : null}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-semibold text-slate-800 truncate">{hero.title}</span>
                    <span className="block text-[10px] text-slate-500">
                      {localities.find((locality) => locality.id === hero.localityId)?.name || hero.localityId}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {hero.ctaLabel || 'No CTA'} - {(hero.pincodes || []).join(', ') || 'All pincodes'}
                    </span>
                    <span className="block text-[10px] text-slate-500">{hero.startDate} - {hero.endDate}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onBeginEdit(hero)}
                      className="text-[10px] px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(hero)}
                      className={`text-[10px] px-2 py-1 rounded ${hero.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {hero.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(hero.id)}
                      className="text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {heroBanners.length === 0 && <div className="text-xs text-slate-400">No hero banners configured.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
