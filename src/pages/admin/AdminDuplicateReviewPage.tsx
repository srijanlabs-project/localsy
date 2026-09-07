import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Business } from '../../types';
import DuplicateReviewQueue from '../../components/admin/DuplicateReviewQueue';
import { getCategoryById } from '../../categoryMaster';
import { keepDuplicatePairSeparate, mergeDuplicatePair, runDuplicateScan, useDuplicateQueue } from '../../services/admin/duplicateQueue';

type AdminDuplicateReviewPageProps = {
  businesses: Business[];
  onUpdateBusiness?: (business: Business) => void;
  /** Applies records the SERVER has already written to local state, without persisting them back. */
  onApplyServerBusinessRecords?: (records: Business[]) => void;
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
  onApplyServerBusinessRecords,
  canReview,
}: AdminDuplicateReviewPageProps) {
  const [duplicateMergeTargetByBusinessId, setDuplicateMergeTargetByBusinessId] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<string | null>(null);
  const [scanState, setScanState] = useState<{ running: boolean; message: string }>({ running: false, message: '' });
  // Which pair is mid-decision, so its buttons can be disabled. Without this a
  // second click lands before the first request returns, and a merge applied
  // twice inflates the canonical's review count.
  const [decidingId, setDecidingId] = useState<string | null>(null);

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

  // The operator can flip which side is canonical, so the request has to carry
  // the chosen sides rather than the auto-picked ones.
  const decide = async (candidate: { id: string; canonical: Business; duplicate: Business }, action: 'merge' | 'keep-separate') => {
    if (!canReview || decidingId) return;
    const selectedCanonicalId = duplicateMergeTargetByBusinessId[candidate.duplicate.id] || candidate.canonical.id;
    const canonical = selectedCanonicalId === candidate.duplicate.id ? candidate.duplicate : candidate.canonical;
    const duplicate = selectedCanonicalId === candidate.duplicate.id ? candidate.canonical : candidate.duplicate;

    setDecidingId(candidate.id);
    try {
      const result = action === 'merge'
        ? await mergeDuplicatePair(canonical.id, duplicate.id)
        : await keepDuplicatePairSeparate(canonical.id, duplicate.id);

      setDuplicateMergeTargetByBusinessId((prev) => {
        const next = { ...prev };
        delete next[candidate.duplicate.id];
        delete next[candidate.canonical.id];
        return next;
      });

      // The server wrote the rows; local state is refreshed from what it
      // returned rather than recomputed here, and deliberately NOT persisted
      // back — a write-back would send the whole partial client collection
      // over the rows the server just settled.
      const changed = [result.canonical, result.duplicate, result.business]
        .filter(Boolean) as Business[];
      if (changed.length > 0) onApplyServerBusinessRecords?.(changed);

      if (action === 'merge') {
        notify(result.alreadyMerged
          ? `"${duplicate.name}" was already merged into "${canonical.name}".`
          : `Merged "${duplicate.name}" into "${canonical.name}".`);
      } else {
        notify(`Kept "${duplicate.name}" separate from "${canonical.name}".`);
      }
      refreshQueue();
    } catch (error) {
      notify((error as Error)?.message || 'The decision could not be saved.');
    } finally {
      setDecidingId(null);
    }
  };

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
        onMergeDuplicate={(candidate) => { void decide(candidate, 'merge'); }}
        onKeepSeparate={(candidate) => { void decide(candidate, 'keep-separate'); }}
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
