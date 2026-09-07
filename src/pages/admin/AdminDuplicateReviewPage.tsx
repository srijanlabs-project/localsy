import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Business } from '../../types';
import DuplicateReviewQueue from '../../components/admin/DuplicateReviewQueue';
import { getCategoryById } from '../../categoryMaster';
import { buildKeptSeparateBusiness, buildMergedBusinessPair } from '../../services/admin/duplicateReview';
import { runDuplicateScan, useDuplicateQueue } from '../../services/admin/duplicateQueue';

type AdminDuplicateReviewPageProps = {
  businesses: Business[];
  onUpdateBusiness?: (business: Business) => void;
  /** Section 7 default seed data: Operator gets Full here too; Moderator does not. See services/admin/adminRoles.ts. */
  canReview: boolean;
};

// Routed home for admin-backend-ux-spec.md Section 5.3 "Duplicate Review" — split out of the
// Listing Directory page (5.5) in Section 9 build step 2, per the spec's own migration map
// (Section 6: "Admin Workspace -> Listing Status" becomes both Listing Directory *and* this
// screen). The merge/keep-separate decision logic here is unchanged from what previously
// lived inline in AdminListingDirectoryPage.tsx — only the location moved.
export default function AdminDuplicateReviewPage({
  businesses,
  onUpdateBusiness,
  canReview,
}: AdminDuplicateReviewPageProps) {
  const [duplicateMergeTargetByBusinessId, setDuplicateMergeTargetByBusinessId] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<string | null>(null);
  const [scanState, setScanState] = useState<{ running: boolean; message: string }>({ running: false, message: '' });

  const effectiveOnUpdateBusiness = canReview ? onUpdateBusiness : undefined;

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // The queue is read from the server, which decided it once when each listing
  // was written. It used to be recomputed here on every page load by comparing
  // every listing against every other one.
  const {
    candidates: duplicateReviewCandidates,
    uncheckedListings,
    loaded: queueLoaded,
    refresh: refreshQueue,
  } = useDuplicateQueue();

  // Listings written before detection existed carry no verdict. Scanning walks
  // them in pages so a 26,000-row backfill is not one long request.
  const runBackfillScan = async () => {
    setScanState({ running: true, message: 'Checking listings for duplicates...' });
    try {
      let scanned = 0;
      let flagged = 0;
      for (let pass = 0; pass < 40; pass += 1) {
        const result = await runDuplicateScan(2000);
        scanned += result.scanned;
        flagged += result.flagged;
        setScanState({ running: true, message: `Checked ${scanned.toLocaleString()} listings, ${result.remaining.toLocaleString()} to go...` });
        if (result.remaining === 0 || result.scanned === 0) break;
      }
      setScanState({ running: false, message: `Checked ${scanned.toLocaleString()} listings and flagged ${flagged.toLocaleString()}.` });
      refreshQueue();
    } catch (error) {
      setScanState({ running: false, message: (error as Error)?.message || 'Duplicate scan failed.' });
    }
  };

  const mergeDateLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Duplicate Review</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Resolve likely-duplicate listings before they pollute the directory.
          {!canReview && <span className="ml-1 font-semibold text-amber-700">(view-only for your role)</span>}
        </p>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      {(uncheckedListings > 0 || scanState.message) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>
            {uncheckedListings > 0
              ? `${uncheckedListings.toLocaleString()} listings have never been checked for duplicates.`
              : scanState.message}
          </span>
          {uncheckedListings > 0 && canReview && (
            <button
              type="button"
              onClick={runBackfillScan}
              disabled={scanState.running}
              className="rounded-md bg-amber-900 px-2.5 py-1 font-semibold text-white disabled:opacity-60"
            >
              {scanState.running ? scanState.message || 'Checking...' : 'Check them now'}
            </button>
          )}
        </div>
      )}

      <DuplicateReviewQueue
        duplicateReviewCandidates={duplicateReviewCandidates}
        duplicateMergeTargetByBusinessId={duplicateMergeTargetByBusinessId}
        onSelectCanonical={(duplicateBusinessId, canonicalBusinessId) => {
          if (!canReview) return;
          setDuplicateMergeTargetByBusinessId((prev) => ({
            ...prev,
            [duplicateBusinessId]: canonicalBusinessId,
          }));
        }}
        onMergeDuplicate={(candidate) => {
          if (!effectiveOnUpdateBusiness) return;
          const { mergedCanonical, mergedDuplicate } = buildMergedBusinessPair(candidate, duplicateMergeTargetByBusinessId, mergeDateLabel);
          effectiveOnUpdateBusiness(mergedCanonical);
          effectiveOnUpdateBusiness(mergedDuplicate);
          setDuplicateMergeTargetByBusinessId((prev) => {
            const next = { ...prev };
            delete next[candidate.duplicate.id];
            delete next[candidate.canonical.id];
            return next;
          });
          notify(`Merged duplicate listing "${mergedDuplicate.name}" into "${mergedCanonical.name}".`);
          // The pair leaves the queue only once the server has the decision.
          setTimeout(refreshQueue, 1200);
        }}
        onKeepSeparate={(candidate) => {
          if (!effectiveOnUpdateBusiness) return;
          const keptSeparate = buildKeptSeparateBusiness(candidate, duplicateMergeTargetByBusinessId);
          const canonicalLabel = keptSeparate.mergedIntoBusinessId === candidate.canonical.id ? candidate.canonical.name : candidate.duplicate.name;
          effectiveOnUpdateBusiness(keptSeparate);
          notify(`Marked "${keptSeparate.name}" as reviewed and kept separate from "${canonicalLabel}".`);
          setTimeout(refreshQueue, 1200);
        }}
        getCategoryLabel={(business) => getCategoryById(business.categoryId)?.name || business.categoryId}
      />

      {queueLoaded && duplicateReviewCandidates.length === 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
          <span>New candidates appear here automatically as listings are created or edited — nothing to review right now.</span>
        </div>
      )}
    </div>
  );
}
