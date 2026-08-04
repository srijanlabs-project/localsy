import React from 'react';
import { Business } from '../../types';

export type DuplicateReviewCandidate = {
  id: string;
  canonical: Business;
  duplicate: Business;
  score: number;
  reasons: string[];
};

type DuplicateReviewQueueProps = {
  duplicateReviewCandidates: DuplicateReviewCandidate[];
  duplicateMergeTargetByBusinessId: Record<string, string>;
  onSelectCanonical: (duplicateBusinessId: string, canonicalBusinessId: string) => void;
  onMergeDuplicate: (candidate: DuplicateReviewCandidate) => void;
  onKeepSeparate: (candidate: DuplicateReviewCandidate) => void;
  getCategoryLabel: (business: Business) => string;
};

export default function DuplicateReviewQueue({
  duplicateReviewCandidates,
  duplicateMergeTargetByBusinessId,
  onSelectCanonical,
  onMergeDuplicate,
  onKeepSeparate,
  getCategoryLabel,
}: DuplicateReviewQueueProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Duplicate Review Queue</h4>
          <p className="text-xs text-slate-500">
            High-confidence overlaps detected from name, phone, pincode, address, and locality similarity.
          </p>
        </div>
        <span className="self-start rounded-full bg-white px-3 py-1 text-[10px] font-mono font-bold text-slate-600 shadow-sm">
          {duplicateReviewCandidates.length} candidates
        </span>
      </div>

      {duplicateReviewCandidates.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
          No high-confidence duplicate pairs are pending review.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {duplicateReviewCandidates.slice(0, 8).map((candidate) => {
            const selectedCanonicalId = duplicateMergeTargetByBusinessId[candidate.duplicate.id] || candidate.canonical.id;
            return (
              <div key={candidate.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-mono font-bold text-amber-700">
                        Confidence {candidate.score}%
                      </span>
                      {candidate.reasons.map((reason) => (
                        <span key={`${candidate.id}-${reason}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {[candidate.canonical, candidate.duplicate].map((business) => {
                        const isSelectedCanonical = selectedCanonicalId === business.id;
                        const isSuggestedCanonical = candidate.canonical.id === business.id;
                        return (
                          <div
                            key={`${candidate.id}-${business.id}`}
                            className={`rounded-xl border p-3 ${
                              isSelectedCanonical ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-slate-900">{business.name}</div>
                                <div className="mt-1 text-[11px] text-slate-500">{getCategoryLabel(business)}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {isSuggestedCanonical && (
                                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                                    Suggested canonical
                                  </span>
                                )}
                                {isSelectedCanonical && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                    Keep this
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                              <div>{business.phone || 'No phone'} • {business.pincode || 'No pincode'}</div>
                              <div className="truncate">{business.address}</div>
                              <div>Reviews: {business.reviewCount || 0} • Rating: {business.rating || 0}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full space-y-3 xl:w-[260px]">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Keep as canonical
                      </label>
                      <select
                        value={selectedCanonicalId}
                        onChange={(event) => onSelectCanonical(candidate.duplicate.id, event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        <option value={candidate.canonical.id}>{candidate.canonical.name}</option>
                        <option value={candidate.duplicate.id}>{candidate.duplicate.name}</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => onMergeDuplicate(candidate)}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        Merge Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => onKeepSeparate(candidate)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                      >
                        Keep Separate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
