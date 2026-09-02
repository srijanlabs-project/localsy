import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Business, BusinessTaxonomyState, Locality } from '../../types';
import ListingStatusWorkspace, { type ListingStatusFilter } from '../../components/admin/ListingStatusWorkspace';
import BusinessDetailDrawer from '../../components/admin/BusinessDetailDrawer';
import { InlineSubcategoryCreator } from '../../components/admin/AdminConsoleSharedControls';
import { getPublicLocalityUrl } from '../../services/admin/adminConsoleUtils';
import { computeDuplicateReviewCandidates } from '../../services/admin/duplicateReview';
import { createInlineSubcategory } from '../../services/admin/taxonomyMapping';

const LISTING_STATUS_PAGE_SIZE = 20;

type AdminListingDirectoryPageProps = {
  businesses: Business[];
  localities: Locality[];
  onUpdateBusiness?: (business: Business) => void;
  businessTaxonomy?: BusinessTaxonomyState;
  onSaveBusinessTaxonomy?: (taxonomy: BusinessTaxonomyState) => Promise<BusinessTaxonomyState> | void;
  /** Section 7 default seed data: Moderator is view-only on Listing Directory. See services/admin/adminRoles.ts. */
  canEdit: boolean;
};

// Routed home for admin-backend-ux-spec.md Section 5.5 "Listing Directory".
//
// Section 9 build step 2: Duplicate Review (5.3) and Listing Analytics (5.8) are now split
// out into their own routed screens (AdminDuplicateReviewPage, AdminListingAnalyticsPage) per
// the spec's Section 8 migration map. This page passes embedDuplicateReview/embedAnalytics
// ={false} to ListingStatusWorkspace, which renders a compact summary card + nav link for
// each instead of the full embedded panel — the merge/keep-separate state and handlers moved
// to AdminDuplicateReviewPage along with them.
export default function AdminListingDirectoryPage({
  businesses,
  localities,
  onUpdateBusiness,
  businessTaxonomy,
  onSaveBusinessTaxonomy,
  canEdit,
}: AdminListingDirectoryPageProps) {
  const navigate = useNavigate();
  const [listingStatusFilter, setListingStatusFilter] = useState<ListingStatusFilter>('all');
  const [listingStatusPage, setListingStatusPage] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);
  const [openBusinessId, setOpenBusinessId] = useState<string | null>(null);

  // View-only roles (Moderator, per Section 7's seed table) never get a mutation callback —
  // ListingStatusWorkspace and BusinessDetailDrawer both already render read-only when this
  // is undefined, so no separate "disabled" styling pass is needed here.
  const effectiveOnUpdateBusiness = canEdit ? onUpdateBusiness : undefined;

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Only the count is needed here now (for the summary card badge) — the full candidate
  // objects and merge/keep-separate flow live in AdminDuplicateReviewPage.
  const duplicateCandidateCount = useMemo(() => computeDuplicateReviewCandidates(businesses).length, [businesses]);

  const listingStatusItems = useMemo(() => (
    [...businesses]
      .filter((business) => {
        if (listingStatusFilter === 'all') return true;
        if (listingStatusFilter === 'suspended') {
          return business.status === 'rejected' && Boolean(business.suspensionReason);
        }
        if (listingStatusFilter === 'rejected') {
          return business.status === 'rejected' && !business.suspensionReason;
        }
        return business.status === listingStatusFilter;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ), [businesses, listingStatusFilter]);

  const listingStatusTotalPages = Math.max(1, Math.ceil(listingStatusItems.length / LISTING_STATUS_PAGE_SIZE));
  const safeListingStatusPage = Math.min(listingStatusPage, listingStatusTotalPages);
  const listingStatusPageItems = listingStatusItems.slice(
    (safeListingStatusPage - 1) * LISTING_STATUS_PAGE_SIZE,
    safeListingStatusPage * LISTING_STATUS_PAGE_SIZE
  );

  const openBusiness = openBusinessId ? businesses.find((b) => b.id === openBusinessId) || null : null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Listing Directory</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Browse, search, and manage the business directory.
          {!canEdit && <span className="ml-1 font-semibold text-amber-700">(view-only for your role)</span>}
        </p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}
      <ListingStatusWorkspace
        listingStatusItemsLength={listingStatusItems.length}
        listingStatusFilter={listingStatusFilter}
        onFilterChange={(filter) => {
          setListingStatusFilter(filter);
          setListingStatusPage(1);
        }}
        embedDuplicateReview={false}
        embedAnalytics={false}
        duplicateCandidateCount={duplicateCandidateCount}
        onNavigateToDuplicateReview={() => navigate('/duplicate-review')}
        onNavigateToListingAnalytics={() => navigate('/listing-analytics')}
        listingStatusPageItems={listingStatusPageItems}
        allBusinesses={businesses}
        localities={localities}
        onOpenBusiness={(business) => setOpenBusinessId(business.id)}
        onUpdateBusiness={effectiveOnUpdateBusiness}
        renderSubcategoryCreator={(business) => (
          <InlineSubcategoryCreator
            categoryId={business.categoryId}
            canCreate={canEdit && Boolean(onSaveBusinessTaxonomy && businessTaxonomy)}
            onCreate={(categoryId, rawName) => createInlineSubcategory(businessTaxonomy, onSaveBusinessTaxonomy, categoryId, rawName, notify)}
            onAssign={(subcategoryId) => effectiveOnUpdateBusiness?.({ ...business, subcategoryId })}
          />
        )}
        getPublicLocalityUrl={getPublicLocalityUrl}
        safeListingStatusPage={safeListingStatusPage}
        listingStatusTotalPages={listingStatusTotalPages}
        onPreviousPage={() => setListingStatusPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setListingStatusPage((prev) => Math.min(listingStatusTotalPages, prev + 1))}
      />

      {openBusiness && (
        <BusinessDetailDrawer
          business={openBusiness}
          locality={localities.find((l) => l.id === openBusiness.localityId)}
          canEdit={canEdit}
          onClose={() => setOpenBusinessId(null)}
          onSave={(updated) => {
            effectiveOnUpdateBusiness?.(updated);
            notify(`Saved changes to "${updated.name}".`);
            setOpenBusinessId(null);
          }}
          onOpenFullEditor={() => navigate('/legacy/listing-status')}
        />
      )}
    </div>
  );
}
