// Shared duplicate-detection and merge logic for business listings.
//
// Originally this lived only inside AdminConsole.tsx's component body. It is
// extracted here so that both the legacy AdminConsole (Listing Status tab)
// and the new, separately-routed Listing Directory page (see
// src/pages/admin/AdminListingDirectoryPage.tsx) can share one implementation
// instead of drifting apart. All functions here are pure (no React, no
// closures over component state) so they're safe to import anywhere.
import type { Business } from '../../types';
import type { DuplicateReviewCandidate } from '../../components/admin/DuplicateReviewQueue';

const DUPLICATE_SCORE_THRESHOLD = 68;
const MAX_DUPLICATE_CANDIDATES = 20;

export const normalizeDuplicateText = (value: string) => (
  String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
);

export const tokenizeDuplicateText = (value: string) => normalizeDuplicateText(value).split(' ').filter(Boolean);

export const getTokenOverlapScore = (left: string, right: string) => {
  const leftTokens = new Set(tokenizeDuplicateText(left));
  const rightTokens = new Set(tokenizeDuplicateText(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1;
  });
  return overlap / Math.max(leftTokens.size, rightTokens.size);
};

export const getDuplicateConfidenceScore = (left: Business, right: Business) => {
  if (left.id === right.id) return 0;
  if (left.localityId !== right.localityId) return 0;

  const leftPhone = String(left.phone || '').replace(/\D/g, '').slice(-10);
  const rightPhone = String(right.phone || '').replace(/\D/g, '').slice(-10);
  const leftPincode = String(left.pincode || '').trim();
  const rightPincode = String(right.pincode || '').trim();
  const leftName = normalizeDuplicateText(left.name);
  const rightName = normalizeDuplicateText(right.name);

  let score = 0;
  if (leftPhone && rightPhone && leftPhone === rightPhone) score += 48;
  if (leftPincode && rightPincode && leftPincode === rightPincode) score += 10;
  if (leftName && rightName && leftName === rightName) score += 20;
  score += Math.round(getTokenOverlapScore(left.name, right.name) * 20);
  score += Math.round(getTokenOverlapScore(left.address, right.address) * 14);
  if (left.areaId && right.areaId && left.areaId === right.areaId) score += 8;
  if (left.categoryId && right.categoryId && left.categoryId === right.categoryId) score += 6;
  if (left.subcategoryId && right.subcategoryId && left.subcategoryId === right.subcategoryId) score += 6;
  return Math.min(100, score);
};

export const chooseCanonicalBusiness = (left: Business, right: Business) => {
  const leftScore = (left.status === 'approved' ? 40 : 0)
    + (left.verifiedBadge ? 15 : 0)
    + (left.kycStatus === 'verified' ? 10 : 0)
    + (left.reviewCount || 0)
    + (left.rating || 0) * 5;
  const rightScore = (right.status === 'approved' ? 40 : 0)
    + (right.verifiedBadge ? 15 : 0)
    + (right.kycStatus === 'verified' ? 10 : 0)
    + (right.reviewCount || 0)
    + (right.rating || 0) * 5;
  if (leftScore === rightScore) {
    return new Date(left.createdAt).getTime() <= new Date(right.createdAt).getTime()
      ? { canonical: left, duplicate: right }
      : { canonical: right, duplicate: left };
  }
  return leftScore >= rightScore
    ? { canonical: left, duplicate: right }
    : { canonical: right, duplicate: left };
};

export const computeDuplicateReviewCandidates = (businesses: Business[]): DuplicateReviewCandidate[] => {
  const eligibleBusinesses = businesses.filter((business) => business.status !== 'rejected' && business.duplicateReviewStatus !== 'merged');
  const candidates: DuplicateReviewCandidate[] = [];

  for (let leftIndex = 0; leftIndex < eligibleBusinesses.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < eligibleBusinesses.length; rightIndex += 1) {
      const left = eligibleBusinesses[leftIndex];
      const right = eligibleBusinesses[rightIndex];
      const score = getDuplicateConfidenceScore(left, right);
      if (score < DUPLICATE_SCORE_THRESHOLD) continue;

      const { canonical, duplicate } = chooseCanonicalBusiness(left, right);
      if (duplicate.duplicateReviewStatus === 'separate' && duplicate.mergedIntoBusinessId === canonical.id) continue;

      const reasons: string[] = [];
      const canonicalPhone = String(canonical.phone || '').replace(/\D/g, '').slice(-10);
      const duplicatePhone = String(duplicate.phone || '').replace(/\D/g, '').slice(-10);
      if (canonicalPhone && canonicalPhone === duplicatePhone) reasons.push('same phone');
      if (canonical.pincode && canonical.pincode === duplicate.pincode) reasons.push('same pincode');
      if (normalizeDuplicateText(canonical.name) === normalizeDuplicateText(duplicate.name)) reasons.push('same business name');
      if (canonical.areaId === duplicate.areaId) reasons.push('same area');
      if (canonical.categoryId === duplicate.categoryId) reasons.push('same category');
      if (reasons.length === 0) reasons.push('high text similarity');

      candidates.push({
        id: `${canonical.id}__${duplicate.id}`,
        canonical,
        duplicate,
        score,
        reasons,
      });
    }
  }

  return candidates
    .sort((left, right) => right.score - left.score || right.canonical.reviewCount - left.canonical.reviewCount)
    .slice(0, MAX_DUPLICATE_CANDIDATES);
};

/** Resolve which side of a candidate pair the operator has picked as canonical (defaults to the auto-chosen one). */
const resolveCandidateSides = (candidate: DuplicateReviewCandidate, duplicateMergeTargetByBusinessId: Record<string, string>) => {
  const selectedCanonicalId = duplicateMergeTargetByBusinessId[candidate.duplicate.id] || candidate.canonical.id;
  const canonical = selectedCanonicalId === candidate.duplicate.id ? candidate.duplicate : candidate.canonical;
  const duplicate = selectedCanonicalId === candidate.duplicate.id ? candidate.canonical : candidate.duplicate;
  return { canonical, duplicate };
};

/** Pure builder for the two updated Business records a "merge" decision produces. */
export const buildMergedBusinessPair = (
  candidate: DuplicateReviewCandidate,
  duplicateMergeTargetByBusinessId: Record<string, string>,
  mergeDateLabel: string
): { mergedCanonical: Business; mergedDuplicate: Business } => {
  const { canonical, duplicate } = resolveCandidateSides(candidate, duplicateMergeTargetByBusinessId);
  const combinedReviewCount = (canonical.reviewCount || 0) + (duplicate.reviewCount || 0);
  const weightedRating = combinedReviewCount > 0
    ? (((canonical.rating || 0) * (canonical.reviewCount || 0)) + ((duplicate.rating || 0) * (duplicate.reviewCount || 0))) / combinedReviewCount
    : Math.max(canonical.rating || 0, duplicate.rating || 0, 0);

  const mergedCanonical: Business = {
    ...canonical,
    // Both sides are read through String(): `description` is one of the fields
    // the lite API projection drops, and a listing imported without one has no
    // such key at all, so `.length` on it throws mid-merge.
    description: String(canonical.description || '').length >= String(duplicate.description || '').length
      ? canonical.description
      : duplicate.description,
    phone: canonical.phone || duplicate.phone,
    email: canonical.email || duplicate.email,
    website: canonical.website || duplicate.website,
    address: canonical.address || duplicate.address,
    imageUrl: canonical.imageUrl || duplicate.imageUrl,
    hours: canonical.hours || duplicate.hours,
    featured: canonical.featured || duplicate.featured,
    verifiedBadge: canonical.verifiedBadge || duplicate.verifiedBadge,
    isSponsored: canonical.isSponsored || duplicate.isSponsored,
    govRegistered: canonical.govRegistered || duplicate.govRegistered,
    isHomeBased: canonical.isHomeBased || duplicate.isHomeBased,
    isWomenLed: canonical.isWomenLed || duplicate.isWomenLed,
    isPublicService: canonical.isPublicService || duplicate.isPublicService,
    reviewCount: combinedReviewCount,
    rating: Number(weightedRating.toFixed(1)),
    areasOfOperation: Array.from(new Set([...(canonical.areasOfOperation || []), ...(duplicate.areasOfOperation || [])])),
    tags: Array.from(new Set([...(canonical.tags || []), ...(duplicate.tags || []), 'merged-duplicate'])),
    sourceLineage: Array.from(new Set([canonical.id, ...(canonical.sourceLineage || []), duplicate.id, ...(duplicate.sourceLineage || [])])),
    duplicateReviewStatus: undefined,
    mergedIntoBusinessId: undefined,
  };
  const mergedDuplicate: Business = {
    ...duplicate,
    status: 'rejected',
    duplicateReviewStatus: 'merged',
    mergedIntoBusinessId: canonical.id,
    rejectionReason: `Merged into canonical listing "${canonical.name}" on ${mergeDateLabel}.`,
    sourceLineage: Array.from(new Set([...(duplicate.sourceLineage || []), canonical.id])),
  };

  return { mergedCanonical, mergedDuplicate };
};

/** Pure builder for the updated Business record a "keep separate" decision produces. */
export const buildKeptSeparateBusiness = (
  candidate: DuplicateReviewCandidate,
  duplicateMergeTargetByBusinessId: Record<string, string>
): Business => {
  const { canonical, duplicate } = resolveCandidateSides(candidate, duplicateMergeTargetByBusinessId);
  return {
    ...duplicate,
    duplicateReviewStatus: 'separate',
    mergedIntoBusinessId: canonical.id,
    sourceLineage: Array.from(new Set([...(duplicate.sourceLineage || []), canonical.id])),
  };
};
