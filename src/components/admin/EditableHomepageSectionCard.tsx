import React from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Copy, Trash2 } from 'lucide-react';
import type { Business, HomepageSection, Locality } from '../../types';
import { BUSINESS_CATEGORIES, getCategoryById, getSubcategoriesForCategory } from '../../categoryMaster';
import { OrderedCategoryPicker, OrderedSelectionPicker } from './AdminConsoleSharedControls';

type EditableHomepageSectionCardProps = {
  section: HomepageSection;
  index: number;
  isExpanded: boolean;
  sectionTypeLabel: string;
  localities: Locality[];
  filteredBusinesses: Business[];
  parsePincodeList: (raw: string) => string[];
  onToggleExpanded: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<HomepageSection>) => void | Promise<void>;
};

export default function EditableHomepageSectionCard({
  section,
  index,
  isExpanded,
  sectionTypeLabel,
  localities,
  filteredBusinesses,
  parsePincodeList,
  onToggleExpanded,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onUpdate,
}: EditableHomepageSectionCardProps) {
  const targetingSummary = section.localityIds?.length
    ? `${section.localityIds.length} localit${section.localityIds.length === 1 ? 'y' : 'ies'}`
    : 'all localities';
  const supportsListingSourceMode = ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(section.sectionType);
  const supportsBusinessFilters = ['business_shelf', 'text_business_strip'].includes(section.sectionType);
  const supportsCategoryGrid = ['category_grid', 'emergency_grid'].includes(section.sectionType);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"
            title={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-500">#{index + 1}</span>
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                {sectionTypeLabel}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${section.visible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                {section.visible ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-slate-900">{section.title}</div>
            <div className="truncate text-[10px] text-slate-500">
              {targetingSummary} • {section.pincodes?.length ? `${section.pincodes.length} pincodes` : 'all pincodes'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onMoveDown} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><ChevronDown className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onDuplicate} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><Copy className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onDelete} className="rounded border border-rose-200 bg-rose-50 p-1.5 text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {isExpanded && (
        <>
          <input
            value={section.title}
            onChange={(e) => { void onUpdate({ title: e.target.value }); }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
          />
          <textarea
            value={section.subtitle || ''}
            onChange={(e) => { void onUpdate({ subtitle: e.target.value }); }}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={section.status}
              onChange={(e) => { void onUpdate({ status: e.target.value as HomepageSection['status'] }); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={section.visible ? 'visible' : 'hidden'}
              onChange={(e) => { void onUpdate({ visible: e.target.value === 'visible' }); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <input
              type="date"
              value={section.startDate || ''}
              onChange={(e) => { void onUpdate({ startDate: e.target.value || undefined }); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              type="date"
              value={section.endDate || ''}
              onChange={(e) => { void onUpdate({ endDate: e.target.value || undefined }); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              value={String(section.maxItems || '')}
              onChange={(e) => { void onUpdate({ maxItems: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
              placeholder="Max items"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              value={String(section.visibleSlots || '')}
              onChange={(e) => { void onUpdate({ visibleSlots: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
              placeholder="Visible slots"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              value={String(section.desktopCardCount || '')}
              onChange={(e) => { void onUpdate({ desktopCardCount: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
              placeholder="Desktop cards"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              value={String(section.mobileCardCount || '')}
              onChange={(e) => { void onUpdate({ mobileCardCount: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
              placeholder="Mobile cards"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              value={section.pincodes?.join(', ') || ''}
              onChange={(e) => { void onUpdate({ pincodes: parsePincodeList(e.target.value) }); }}
              placeholder="Pincodes"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
            <input
              value={String(section.rotationIntervalSec || 3)}
              onChange={(e) => { void onUpdate({ rotationIntervalSec: Number(e.target.value.replace(/\D/g, '')) || 3 }); }}
              placeholder="Rotate seconds"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
          </div>
          {supportsListingSourceMode && (
            <select
              value={section.mobileDisplayMode || 'carousel'}
              onChange={(e) => { void onUpdate({ mobileDisplayMode: e.target.value as NonNullable<HomepageSection['mobileDisplayMode']> }); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <option value="carousel">Mobile Carousel</option>
              <option value="stack">Mobile Stack</option>
            </select>
          )}
          {supportsBusinessFilters && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={section.categoryId || ''}
                onChange={(e) => { void onUpdate({ categoryId: e.target.value, subcategoryId: '' }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={section.subcategoryId || ''}
                onChange={(e) => { void onUpdate({ subcategoryId: e.target.value || undefined }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="">All subcategories</option>
                {getSubcategoriesForCategory(section.categoryId || BUSINESS_CATEGORIES[0]?.id || '').map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
            </div>
          )}
          {supportsCategoryGrid && (
            <OrderedCategoryPicker
              label="Configured categories"
              selectedIds={section.categoryIds || []}
              onChange={(nextIds) => { void onUpdate({ categoryIds: nextIds }); }}
              helperText="Reorder the selected categories here to control the exact row order on the homepage."
            />
          )}
          {section.sectionType === 'promo_banner' && (
            <input
              value={section.placementKey || ''}
              onChange={(e) => { void onUpdate({ placementKey: e.target.value }); }}
              placeholder="Placement key"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <OrderedSelectionPicker
                label="Target localities"
                selectedIds={section.localityIds || []}
                options={localities.map((locality) => ({
                  id: locality.id,
                  label: locality.name,
                  meta: locality.slug || locality.id
                }))}
                onChange={(nextIds) => { void onUpdate({ localityIds: nextIds }); }}
                helperText="Select a locality and click Add. Remove all selected localities to make this section unrestricted."
                emptyText="No locality targeting selected. This section can show for any locality context that loads this layout."
              />
            </div>
            {supportsListingSourceMode && (
              <select
                value={section.listingSourceMode || 'auto'}
                onChange={(e) => { void onUpdate({ listingSourceMode: e.target.value as HomepageSection['listingSourceMode'] }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="auto">Auto listings</option>
                <option value="manual">Manual pinned listings</option>
              </select>
            )}
            <select
              value={section.ctaType || 'none'}
              onChange={(e) => { void onUpdate({ ctaType: e.target.value as HomepageSection['ctaType'] }); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <option value="none">No CTA</option>
              <option value="landing_page">Landing Page</option>
              <option value="landing_listing">Landing Listing</option>
              <option value="lead_form">Lead Form</option>
              <option value="search_category">Search Category</option>
            </select>
            <input
              value={section.ctaLabel || ''}
              onChange={(e) => { void onUpdate({ ctaLabel: e.target.value }); }}
              placeholder="CTA label"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              value={section.ctaTarget || ''}
              onChange={(e) => { void onUpdate({ ctaTarget: e.target.value }); }}
              placeholder="CTA target"
              className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
          </div>
          {section.listingSourceMode === 'manual' && supportsListingSourceMode && (
            <OrderedSelectionPicker
              label="Pinned listings"
              selectedIds={section.pinnedBusinessIds || []}
              options={filteredBusinesses.filter((business) => business.status === 'approved').map((business) => ({
                id: business.id,
                label: business.name,
                meta: `${getCategoryById(business.categoryId)?.name || business.categoryId} | ${business.pincode || 'No PIN'}`
              }))}
              onChange={(nextIds) => { void onUpdate({ pinnedBusinessIds: nextIds }); }}
              helperText="Select a listing and click Add. The selected order is used for manual homepage sections."
              emptyText="No listings pinned yet."
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                checked={section.showViewAll ?? true}
                onChange={(e) => { void onUpdate({ showViewAll: e.target.checked }); }}
              />
              <span>Show View All</span>
            </label>
            <label className="inline-flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                checked={section.autoRotate ?? true}
                onChange={(e) => { void onUpdate({ autoRotate: e.target.checked }); }}
              />
              <span>Auto rotate</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Background</span>
              <input
                type="color"
                value={section.backgroundColor || '#ffffff'}
                onChange={(e) => { void onUpdate({ backgroundColor: e.target.value }); }}
                className="h-8 w-12 rounded border border-slate-200 bg-white"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
