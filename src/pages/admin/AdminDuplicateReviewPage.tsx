import React, { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Business } from '../../types';
import DuplicateReviewQueue from '../../components/admin/DuplicateReviewQueue';
import { getCategoryById } from '../../categoryMaster';
import { buildKeptSeparateBusiness, buildMergedBusinessPair, computeDuplicateReviewCandidates } from '../../services/admin/duplicateReview';

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

  const effectiveOnUpdateBusiness = canReview ? onUpdateBusiness : undefined;

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const duplicateReviewCandidates = useMemo(() => computeDuplicateReviewCandidates(businesses), [businesses]);
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
        }}
        onKeepSeparate={(candidate) => {
          if (!effectiveOnUpdateBusiness) return;
          const keptSeparate = buildKeptSeparateBusiness(candidate, duplicateMergeTargetByBusinessId);
          const canonicalLabel = keptSeparate.mergedIntoBusinessId === candidate.canonical.id ? candidate.canonical.name : candidate.duplicate.name;
          effectiveOnUpdateBusiness(keptSeparate);
          notify(`Marked "${keptSeparate.name}" as reviewed and kept separate from "${canonicalLabel}".`);
        }}
        getCategoryLabel={(business) => getCategoryById(business.categoryId)?.name || business.categoryId}
      />

      {duplicateReviewCandidates.length === 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
          <span>New candidates appear here automatically as listings are created or edited — nothing to review right now.</span>
        </div>
      )}
    </div>
  );
}
