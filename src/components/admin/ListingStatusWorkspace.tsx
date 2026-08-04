import React from 'react';
import { Database } from 'lucide-react';
import type { Business, Locality } from '../../types';
import DuplicateReviewQueue, { type DuplicateReviewCandidate } from './DuplicateReviewQueue';
import {
  BUSINESS_CATEGORIES,
  getCategoryById,
  getSubcategoriesForCategory,
  getSubcategoryById,
  resolveDefaultSubcategoryId,
} from '../../categoryMaster';

export type ListingStatusFilter = 'all' | 'approved' | 'rejected' | 'pending';

type ListingStatusWorkspaceProps = {
  listingStatusItemsLength: number;
  listingStatusFilter: ListingStatusFilter;
  onFilterChange: (filter: ListingStatusFilter) => void;
  duplicateReviewCandidates: DuplicateReviewCandidate[];
  duplicateMergeTargetByBusinessId: Record<string, string>;
  onSelectCanonical: (duplicateBusinessId: string, canonicalBusinessId: string) => void;
  onMergeDuplicate: (candidate: DuplicateReviewCandidate) => void;
  onKeepSeparate: (candidate: DuplicateReviewCandidate) => void;
  listingStatusPageItems: Business[];
  localities: Locality[];
  onOpenBusiness: (business: Business) => void;
  onUpdateBusiness?: (business: Business) => void;
  renderSubcategoryCreator?: (business: Business) => React.ReactNode;
  getPublicLocalityUrl: (locality?: Locality | null) => string;
  safeListingStatusPage: number;
  listingStatusTotalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

const statusFilters: Array<{ id: ListingStatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Active' },
  { id: 'rejected', label: 'Deactivated' },
  { id: 'pending', label: 'Pending' },
];

export default function ListingStatusWorkspace({
  listingStatusItemsLength,
  listingStatusFilter,
  onFilterChange,
  duplicateReviewCandidates,
  duplicateMergeTargetByBusinessId,
  onSelectCanonical,
  onMergeDuplicate,
  onKeepSeparate,
  listingStatusPageItems,
  localities,
  onOpenBusiness,
  onUpdateBusiness,
  renderSubcategoryCreator,
  getPublicLocalityUrl,
  safeListingStatusPage,
  listingStatusTotalPages,
  onPreviousPage,
  onNextPage,
}: ListingStatusWorkspaceProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-blue-600" />
            Other Listings Status
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review listing states in one place. This tab now paginates 20 listings per page.
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 self-start">
          {listingStatusItemsLength} listings • 20 per page
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              listingStatusFilter === filter.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <DuplicateReviewQueue
        duplicateReviewCandidates={duplicateReviewCandidates}
        duplicateMergeTargetByBusinessId={duplicateMergeTargetByBusinessId}
        onSelectCanonical={onSelectCanonical}
        onMergeDuplicate={onMergeDuplicate}
        onKeepSeparate={onKeepSeparate}
        getCategoryLabel={(business) => getCategoryById(business.categoryId)?.name || business.categoryId}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-500 border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
              <th className="py-2">Business</th>
              <th className="py-2">Category / Subcategory</th>
              <th className="py-2">Public Route</th>
              <th className="py-2">Proprietor</th>
              <th className="py-2">Decision Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listingStatusPageItems.map((business) => {
              const locality = localities.find((candidate) => candidate.id === business.localityId);
              const isRejected = business.status === 'rejected';
              return (
                <tr
                  key={business.id}
                  onClick={() => onOpenBusiness(business)}
                  className="hover:bg-slate-50/50 cursor-pointer"
                >
                  <td className={`py-2.5 font-semibold ${isRejected ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {business.name}
                  </td>
                  <td className="py-2.5">
                    {onUpdateBusiness ? (
                      <div className="flex flex-col gap-1">
                        <select
                          value={business.categoryId}
                          required
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            const nextCategory = event.target.value;
                            onUpdateBusiness({
                              ...business,
                              categoryId: nextCategory,
                              subcategoryId: resolveDefaultSubcategoryId(nextCategory),
                            });
                          }}
                          className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700"
                          title="Update listing category"
                        >
                          {BUSINESS_CATEGORIES.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={business.subcategoryId}
                          required
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => onUpdateBusiness({ ...business, subcategoryId: event.target.value })}
                          className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700"
                          title="Update listing subcategory"
                        >
                          {getSubcategoriesForCategory(business.categoryId).map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </option>
                          ))}
                        </select>
                        {renderSubcategoryCreator?.(business)}
                      </div>
                    ) : (
                      <span>
                        {getCategoryById(business.categoryId)?.name || business.categoryId}
                        {' / '}
                        {getSubcategoryById(business.subcategoryId)?.name || business.subcategoryId}
                      </span>
                    )}
                  </td>
                  <td className={`py-2.5 font-mono ${isRejected ? 'text-slate-400' : 'text-slate-600'}`}>
                    {getPublicLocalityUrl(locality)}
                  </td>
                  <td className="py-2.5">{business.ownerName || 'Self-Registered'}</td>
                  <td className="py-2.5">
                    {business.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Approved
                      </span>
                    )}
                    {business.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Pending
                      </span>
                    )}
                    {business.status === 'rejected' && (
                      <div className="text-red-500 font-semibold flex flex-col">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Rejected
                        </span>
                        <span className="text-[10px] font-sans text-slate-400 max-w-[180px] truncate" title={business.rejectionReason}>
                          {business.rejectionReason || 'No reason recorded'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {listingStatusPageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  No listings found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={safeListingStatusPage <= 1}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="font-mono text-slate-500">
          Page {safeListingStatusPage} / {listingStatusTotalPages}
        </span>
        <button
          type="button"
          onClick={onNextPage}
          disabled={safeListingStatusPage >= listingStatusTotalPages}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
