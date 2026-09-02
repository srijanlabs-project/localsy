import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Database,
  ListFilter,
  PauseCircle,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { AdLead, AuditEvent, Business, Locality } from '../../types';
import DuplicateReviewQueue, { type DuplicateReviewCandidate } from './DuplicateReviewQueue';
import ListingAnalyticsPanel from './ListingAnalyticsPanel';
import {
  BUSINESS_CATEGORIES,
  getCategoryById,
  getSubcategoriesForCategory,
  getSubcategoryById,
  resolveDefaultSubcategoryId,
} from '../../categoryMaster';

export type ListingStatusFilter = 'all' | 'approved' | 'rejected' | 'pending' | 'suspended';

type ListingStatusWorkspaceProps = {
  listingStatusItemsLength: number;
  listingStatusFilter: ListingStatusFilter;
  onFilterChange: (filter: ListingStatusFilter) => void;
  /**
   * Duplicate Review (spec 5.3) and Listing Analytics (5.8) can render inline (legacy
   * AdminConsole.tsx's Listing Status tab, unchanged behavior — omit both `embed*` props
   * below to keep that) or be split into their own routed screens (the new, separately-
   * routed Listing Directory page passes embedDuplicateReview/embedAnalytics={false} and
   * gets a compact summary card + nav callback instead). See admin-backend-ux-spec.md
   * Section 9 build step 2.
   */
  embedDuplicateReview?: boolean;
  embedAnalytics?: boolean;
  duplicateReviewCandidates?: DuplicateReviewCandidate[];
  duplicateMergeTargetByBusinessId?: Record<string, string>;
  onSelectCanonical?: (duplicateBusinessId: string, canonicalBusinessId: string) => void;
  onMergeDuplicate?: (candidate: DuplicateReviewCandidate) => void;
  onKeepSeparate?: (candidate: DuplicateReviewCandidate) => void;
  /** Used for the compact summary card's badge when embedDuplicateReview is false. */
  duplicateCandidateCount?: number;
  onNavigateToDuplicateReview?: () => void;
  onNavigateToListingAnalytics?: () => void;
  listingStatusPageItems: Business[];
  allBusinesses: Business[];
  auditLogs?: AuditEvent[];
  adLeads?: AdLead[];
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
  { id: 'suspended', label: 'Suspended' },
  { id: 'rejected', label: 'Deactivated' },
  { id: 'pending', label: 'Pending' },
];

function isSuspendedListing(business: Business) {
  return business.status === 'rejected' && Boolean(business.suspensionReason);
}

function getStatusMeta(business: Business) {
  if (business.status === 'approved') {
    return {
      label: 'Approved',
      tone: 'text-emerald-600',
      dot: 'bg-emerald-500',
      reason: '',
    };
  }

  if (business.status === 'pending') {
    return {
      label: 'Pending',
      tone: 'text-amber-600',
      dot: 'bg-amber-500',
      reason: '',
    };
  }

  if (isSuspendedListing(business)) {
    return {
      label: 'Suspended',
      tone: 'text-orange-600',
      dot: 'bg-orange-500',
      reason: business.suspensionReason || '',
    };
  }

  return {
    label: 'Rejected',
    tone: 'text-red-600',
    dot: 'bg-red-500',
    reason: business.rejectionReason || '',
  };
}

function askReason(message: string) {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.prompt(message)?.trim() || '';
}

function confirmAction(message: string) {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.confirm(message);
}

export default function ListingStatusWorkspace({
  listingStatusItemsLength,
  listingStatusFilter,
  onFilterChange,
  embedDuplicateReview = true,
  embedAnalytics = true,
  duplicateReviewCandidates = [],
  duplicateMergeTargetByBusinessId = {},
  onSelectCanonical = () => {},
  onMergeDuplicate = () => {},
  onKeepSeparate = () => {},
  duplicateCandidateCount,
  onNavigateToDuplicateReview,
  onNavigateToListingAnalytics,
  listingStatusPageItems,
  allBusinesses,
  auditLogs = [],
  adLeads = [],
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
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);

  const businessIndex = useMemo(() => {
    const index = new Map<string, Business>();
    allBusinesses.forEach((business) => index.set(business.id, business));
    return index;
  }, [allBusinesses]);

  const summaryCounts = useMemo(() => {
    return allBusinesses.reduce(
      (acc, business) => {
        if (business.status === 'approved') {
          acc.approved += 1;
        } else if (business.status === 'pending') {
          acc.pending += 1;
        } else if (isSuspendedListing(business)) {
          acc.suspended += 1;
        } else if (business.status === 'rejected') {
          acc.rejected += 1;
        }
        return acc;
      },
      { approved: 0, pending: 0, suspended: 0, rejected: 0 }
    );
  }, [allBusinesses]);

  const currentPageIds = useMemo(() => listingStatusPageItems.map((business) => business.id), [listingStatusPageItems]);
  const selectedOnPageCount = currentPageIds.filter((id) => selectedBusinessIds.includes(id)).length;
  const allPageItemsSelected = currentPageIds.length > 0 && selectedOnPageCount === currentPageIds.length;

  useEffect(() => {
    setSelectedBusinessIds((current) => current.filter((id) => businessIndex.has(id)));
  }, [businessIndex]);

  const updateMultipleBusinesses = (businessIds: string[], updater: (business: Business) => Business) => {
    if (!onUpdateBusiness) return;
    businessIds.forEach((businessId) => {
      const business = businessIndex.get(businessId);
      if (!business) return;
      onUpdateBusiness(updater(business));
    });
    setSelectedBusinessIds([]);
  };

  const handleBulkApprove = () => {
    if (!selectedBusinessIds.length || !confirmAction(`Approve ${selectedBusinessIds.length} selected listings?`)) {
      return;
    }
    updateMultipleBusinesses(selectedBusinessIds, (business) => ({
      ...business,
      status: 'approved',
      rejectionReason: undefined,
      suspensionReason: undefined,
      suspendedAt: undefined,
    }));
  };

  const handleBulkReject = () => {
    if (!selectedBusinessIds.length) return;
    const reason = askReason(`Why are you rejecting ${selectedBusinessIds.length} selected listings?`);
    if (!reason) return;
    updateMultipleBusinesses(selectedBusinessIds, (business) => ({
      ...business,
      status: 'rejected',
      rejectionReason: reason,
      suspensionReason: undefined,
      suspendedAt: undefined,
    }));
  };

  const handleBulkSuspend = () => {
    if (!selectedBusinessIds.length) return;
    const reason = askReason(`Why are you suspending ${selectedBusinessIds.length} selected listings?`);
    if (!reason) return;
    const suspendedAt = new Date().toISOString();
    updateMultipleBusinesses(selectedBusinessIds, (business) => ({
      ...business,
      status: 'rejected',
      rejectionReason: undefined,
      suspensionReason: reason,
      suspendedAt,
    }));
  };

  const handleRowAction = (business: Business, action: 'approve' | 'reject' | 'suspend') => {
    if (!onUpdateBusiness) return;

    if (action === 'approve') {
      if (!confirmAction(`Approve "${business.name}"?`)) return;
      onUpdateBusiness({
        ...business,
        status: 'approved',
        rejectionReason: undefined,
        suspensionReason: undefined,
        suspendedAt: undefined,
      });
      return;
    }

    const reason = askReason(
      action === 'reject'
        ? `Why are you rejecting "${business.name}"?`
        : `Why are you suspending "${business.name}"?`
    );
    if (!reason) return;

    onUpdateBusiness({
      ...business,
      status: 'rejected',
      rejectionReason: action === 'reject' ? reason : undefined,
      suspensionReason: action === 'suspend' ? reason : undefined,
      suspendedAt: action === 'suspend' ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-blue-600" />
            Listing Status And Performance
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Operate approvals, suspensions, taxonomy cleanup, duplicate review, and listing visibility from one workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500">
          <span className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
            {listingStatusItemsLength} filtered listings
          </span>
          <span className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
            {allBusinesses.length} total managed
          </span>
          <span className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
            20 per page
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-[10px] uppercase tracking-wide text-emerald-700">Approved</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-900">{summaryCounts.approved}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="text-[10px] uppercase tracking-wide text-amber-700">Pending</div>
          <div className="mt-1 text-2xl font-extrabold text-amber-900">{summaryCounts.pending}</div>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <div className="text-[10px] uppercase tracking-wide text-orange-700">Suspended</div>
          <div className="mt-1 text-2xl font-extrabold text-orange-900">{summaryCounts.suspended}</div>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="text-[10px] uppercase tracking-wide text-red-700">Rejected</div>
          <div className="mt-1 text-2xl font-extrabold text-red-900">{summaryCounts.rejected}</div>
        </div>
      </div>

      {embedAnalytics ? (
        <ListingAnalyticsPanel businesses={allBusinesses} auditLogs={auditLogs} adLeads={adLeads} />
      ) : (
        <button
          type="button"
          onClick={onNavigateToListingAnalytics}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/5"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#1E3A8A]" />
            <div>
              <div className="text-sm font-bold text-slate-950">Listing Analytics</div>
              <div className="text-xs text-slate-500">Views, clicks, unlocks, reviews, and SEO performance for the directory.</div>
            </div>
          </div>
          <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#1E3A8A] shadow-sm">View full analytics</span>
        </button>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-[#1E3A8A]" />
              Operational filters and bulk actions
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Use bulk operations to resolve review queues faster without leaving the listing status page.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {selectedBusinessIds.length > 0 ? `${selectedBusinessIds.length} listings selected` : 'Select listings to enable bulk actions'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                listingStatusFilter === filter.id ? 'bg-[#1E3A8A] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!selectedBusinessIds.length || !onUpdateBusiness}
            onClick={handleBulkApprove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Bulk Approve
          </button>
          <button
            type="button"
            disabled={!selectedBusinessIds.length || !onUpdateBusiness}
            onClick={handleBulkSuspend}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PauseCircle className="h-4 w-4" />
            Bulk Suspend
          </button>
          <button
            type="button"
            disabled={!selectedBusinessIds.length || !onUpdateBusiness}
            onClick={handleBulkReject}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Bulk Reject
          </button>
        </div>
      </div>

      {embedDuplicateReview ? (
        <DuplicateReviewQueue
          duplicateReviewCandidates={duplicateReviewCandidates}
          duplicateMergeTargetByBusinessId={duplicateMergeTargetByBusinessId}
          onSelectCanonical={onSelectCanonical}
          onMergeDuplicate={onMergeDuplicate}
          onKeepSeparate={onKeepSeparate}
          getCategoryLabel={(business) => getCategoryById(business.categoryId)?.name || business.categoryId}
        />
      ) : (
        <button
          type="button"
          onClick={onNavigateToDuplicateReview}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/5"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <div>
              <div className="text-sm font-bold text-slate-950">Duplicate Review</div>
              <div className="text-xs text-slate-500">High-confidence overlaps detected from name, phone, pincode, address, and locality similarity.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Boolean(duplicateCandidateCount) && (
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-mono font-bold text-rose-700">
                {duplicateCandidateCount}
              </span>
            )}
            <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#1E3A8A] shadow-sm">Review duplicates</span>
          </div>
        </button>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-500 border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
              <th className="py-2 px-3">
                <input
                  type="checkbox"
                  checked={allPageItemsSelected}
                  onChange={() => {
                    if (allPageItemsSelected) {
                      setSelectedBusinessIds((current) => current.filter((id) => !currentPageIds.includes(id)));
                      return;
                    }
                    setSelectedBusinessIds((current) => Array.from(new Set([...current, ...currentPageIds])));
                  }}
                  aria-label="Select all listings on page"
                />
              </th>
              <th className="py-2 px-3">Business</th>
              <th className="py-2 px-3">Category / Subcategory</th>
              <th className="py-2 px-3">Public Route</th>
              <th className="py-2 px-3">Proprietor</th>
              <th className="py-2 px-3">Decision Status</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {listingStatusPageItems.map((business) => {
              const locality = localities.find((candidate) => candidate.id === business.localityId);
              const statusMeta = getStatusMeta(business);
              const isBlocked = business.status === 'rejected';
              const isSelected = selectedBusinessIds.includes(business.id);

              return (
                <tr
                  key={business.id}
                  onClick={() => onOpenBusiness(business)}
                  className={`cursor-pointer hover:bg-[#3B82F6]/5 ${isSelected ? 'bg-[#3B82F6]/10' : ''}`}
                >
                  <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedBusinessIds((current) => (
                          current.includes(business.id)
                            ? current.filter((id) => id !== business.id)
                            : [...current, business.id]
                        ));
                      }}
                      aria-label={`Select ${business.name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className={`font-semibold ${isBlocked ? 'text-slate-500' : 'text-slate-900'}`}>{business.name}</div>
                    <div className="mt-1 text-[10px] font-mono text-slate-400">{business.id}</div>
                  </td>
                  <td className="px-3 py-3">
                    {onUpdateBusiness ? (
                      <div className="flex flex-col gap-1.5" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={business.categoryId}
                          required
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
                  <td className="px-3 py-3 font-mono text-slate-600">
                    <div>{getPublicLocalityUrl(locality)}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                      {locality?.name || 'Unknown locality'}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-700">{business.ownerName || 'Self-Registered'}</div>
                    <div className="mt-1 text-[10px] text-slate-400">{business.phone || 'No phone on record'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={`font-semibold inline-flex items-center gap-1.5 ${statusMeta.tone}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                      {statusMeta.label}
                    </div>
                    {statusMeta.reason && (
                      <div
                        className="mt-1 max-w-[220px] truncate text-[10px] text-slate-400"
                        title={statusMeta.reason}
                      >
                        {statusMeta.reason}
                      </div>
                    )}
                    {business.suspendedAt && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Since {new Date(business.suspendedAt).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleRowAction(business, 'approve')}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowAction(business, 'suspend')}
                        className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowAction(business, 'reject')}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {listingStatusPageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No listings found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <span>
          Suspended listings are stored on the existing rejected state with a suspension reason and timestamp, so we preserve current workflows while exposing a clearer operations status for the team.
        </span>
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
