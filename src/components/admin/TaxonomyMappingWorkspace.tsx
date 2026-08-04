import React from 'react';
import { Eye } from 'lucide-react';
import type { Business, Locality } from '../../types';
import {
  BUSINESS_CATEGORIES,
  getCategoryById,
  getSubcategoriesForCategory,
  getSubcategoryById,
} from '../../categoryMaster';

type TaxonomyDraft = {
  categoryId: string;
  subcategoryId: string;
};

type TaxonomyMappingWorkspaceProps = {
  localities: Locality[];
  unmappedTaxonomyBusinesses: Business[];
  getTaxonomyDraft: (business: Business) => TaxonomyDraft;
  onUpdateTaxonomyDraft: (businessId: string, patch: Partial<TaxonomyDraft>) => void;
  onSaveTaxonomyMapping: (business: Business) => void;
  onOpenBusinessDetails: (business: Business) => void;
  renderSubcategoryCreator: (business: Business, categoryId: string) => React.ReactNode;
};

const getBusinessTaxonomyLabel = (
  business: Pick<Business, 'categoryId' | 'subcategoryId'> & {
    sourceCategoryLabel?: string;
    sourceSubcategoryLabel?: string;
  }
) => ({
  category: business.sourceCategoryLabel || getCategoryById(business.categoryId)?.name || business.categoryId || 'Not mapped',
  subcategory: business.sourceSubcategoryLabel || getSubcategoryById(business.subcategoryId)?.name || business.subcategoryId || 'Not mapped',
});

export default function TaxonomyMappingWorkspace({
  localities,
  unmappedTaxonomyBusinesses,
  getTaxonomyDraft,
  onUpdateTaxonomyDraft,
  onSaveTaxonomyMapping,
  onOpenBusinessDetails,
  renderSubcategoryCreator,
}: TaxonomyMappingWorkspaceProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-md font-bold text-slate-950">Unmapped Category / Subcategory Queue</h3>
          <p className="text-xs text-slate-500">
            Listings are saved even when upload taxonomy does not match master data. Use this queue to map them later. Raw upload values are preserved and also added to tags.
          </p>
        </div>
        <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
          {unmappedTaxonomyBusinesses.length} pending mapping
        </span>
      </div>

      {unmappedTaxonomyBusinesses.length === 0 ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Nice and clean. No listings are waiting for taxonomy mapping right now.
        </div>
      ) : (
        <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1">
          {unmappedTaxonomyBusinesses.map((business) => {
            const draft = getTaxonomyDraft(business);
            const taxonomyLabel = getBusinessTaxonomyLabel(business);
            return (
              <div key={business.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{business.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {(localities.find((locality) => locality.id === business.localityId)?.name || business.localityId)}
                      {' - '}
                      {business.phone || 'Phone not provided'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenBusinessDetails(business)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Open details
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3 text-[11px]">
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="font-bold text-slate-500 mb-1">Uploaded Category</div>
                    <div className="text-slate-900">{business.sourceCategoryLabel || taxonomyLabel.category}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="font-bold text-slate-500 mb-1">Uploaded Subcategory</div>
                    <div className="text-slate-900">{business.sourceSubcategoryLabel || taxonomyLabel.subcategory}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <div className="font-bold text-slate-500 mb-1">Current Tags</div>
                    <div className="text-slate-900 line-clamp-2">{(business.tags || []).join(', ') || 'No tags yet'}</div>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <select
                    value={draft.categoryId}
                    onChange={(event) => onUpdateTaxonomyDraft(business.id, { categoryId: event.target.value, subcategoryId: '' })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <option value="">Select master category</option>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="space-y-2">
                    <select
                      value={draft.subcategoryId}
                      onChange={(event) => onUpdateTaxonomyDraft(business.id, { subcategoryId: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                      disabled={!draft.categoryId}
                    >
                      <option value="">{draft.categoryId ? 'Select master subcategory' : 'Choose category first'}</option>
                      {getSubcategoriesForCategory(draft.categoryId).map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                    {renderSubcategoryCreator(business, draft.categoryId)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSaveTaxonomyMapping(business)}
                    disabled={!draft.categoryId || !draft.subcategoryId}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Save mapping
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
