function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeDuplicateText(value) {
  return normalizeLower(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|and|shop|store|services|service|center|centre|clinic|hospital|road|sector|sector-|navi|mumbai)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => normalizeText(value)).filter(Boolean)));
}

function toTimestamp(value) {
  const time = new Date(String(value || '')).getTime();
  return Number.isFinite(time) ? time : 0;
}

function tokenOverlapScore(left, right) {
  const leftTokens = new Set(normalizeDuplicateText(left).split(/\s+/).filter(Boolean));
  const rightTokens = new Set(normalizeDuplicateText(right).split(/\s+/).filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1;
  });
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function buildBusinessAliasSet(...businesses) {
  return uniqueStrings(businesses.flatMap((business) => [
    business?.name,
    ...(Array.isArray(business?.aliasNames) ? business.aliasNames : []),
    business?.sourceCategoryLabel,
    business?.sourceSubcategoryLabel,
  ]));
}

export function buildBusinessSearchAliases(business) {
  return buildBusinessAliasSet(business);
}

export function getDuplicateConfidenceScore(left, right) {
  const leftPhone = normalizeDigits(left?.phone).slice(-10);
  const rightPhone = normalizeDigits(right?.phone).slice(-10);
  const leftPincode = normalizeDigits(left?.pincode);
  const rightPincode = normalizeDigits(right?.pincode);
  const leftName = normalizeDuplicateText(left?.name);
  const rightName = normalizeDuplicateText(right?.name);

  let score = 0;
  if (leftPhone && rightPhone && leftPhone === rightPhone) score += 48;
  if (leftPincode && rightPincode && leftPincode === rightPincode) score += 10;
  if (leftName && rightName && leftName === rightName) score += 20;
  score += Math.round(tokenOverlapScore(left?.name, right?.name) * 20);
  score += Math.round(tokenOverlapScore(left?.address, right?.address) * 14);
  if (normalizeText(left?.areaId) && normalizeText(left?.areaId) === normalizeText(right?.areaId)) score += 8;
  if (normalizeText(left?.categoryId) && normalizeText(left?.categoryId) === normalizeText(right?.categoryId)) score += 6;
  if (normalizeText(left?.subcategoryId) && normalizeText(left?.subcategoryId) === normalizeText(right?.subcategoryId)) score += 6;
  return Math.min(100, score);
}

export function chooseCanonicalBusiness(left, right) {
  const leftScore = (left?.status === 'approved' ? 40 : 0)
    + (left?.verifiedBadge ? 15 : 0)
    + (left?.kycStatus === 'verified' ? 10 : 0)
    + Number(left?.reviewCount || 0)
    + Number(left?.rating || 0) * 5;
  const rightScore = (right?.status === 'approved' ? 40 : 0)
    + (right?.verifiedBadge ? 15 : 0)
    + (right?.kycStatus === 'verified' ? 10 : 0)
    + Number(right?.reviewCount || 0)
    + Number(right?.rating || 0) * 5;
  if (leftScore === rightScore) {
    return toTimestamp(left?.createdAt) <= toTimestamp(right?.createdAt)
      ? { canonical: left, duplicate: right }
      : { canonical: right, duplicate: left };
  }
  return leftScore >= rightScore
    ? { canonical: left, duplicate: right }
    : { canonical: right, duplicate: left };
}

export function buildDuplicateBusinessCandidates(businesses = [], { limit = 30 } = {}) {
  const eligibleBusinesses = (Array.isArray(businesses) ? businesses : []).filter((business) => (
    business &&
    String(business.status || '') !== 'rejected' &&
    String(business.duplicateReviewStatus || '') !== 'merged'
  ));
  const candidates = [];

  for (let leftIndex = 0; leftIndex < eligibleBusinesses.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < eligibleBusinesses.length; rightIndex += 1) {
      const left = eligibleBusinesses[leftIndex];
      const right = eligibleBusinesses[rightIndex];
      const score = getDuplicateConfidenceScore(left, right);
      if (score < 68) continue;

      const { canonical, duplicate } = chooseCanonicalBusiness(left, right);
      if (duplicate.duplicateReviewStatus === 'separate' && duplicate.mergedIntoBusinessId === canonical.id) continue;

      const reasons = [];
      const canonicalPhone = normalizeDigits(canonical.phone).slice(-10);
      const duplicatePhone = normalizeDigits(duplicate.phone).slice(-10);
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
        aliasSuggestions: uniqueStrings([duplicate.name, ...(duplicate.aliasNames || [])]).filter((entry) => entry !== canonical.name),
      });
    }
  }

  return candidates
    .sort((left, right) => right.score - left.score || Number(right.canonical.reviewCount || 0) - Number(left.canonical.reviewCount || 0))
    .slice(0, Math.max(1, Math.min(Number(limit) || 30, 100)));
}

function buildMergedCanonicalBusiness(canonical, duplicate, createdAt = new Date().toISOString()) {
  const combinedReviewCount = Number(canonical.reviewCount || 0) + Number(duplicate.reviewCount || 0);
  const weightedRating = combinedReviewCount > 0
    ? (
        ((Number(canonical.rating || 0) * Number(canonical.reviewCount || 0)) +
        (Number(duplicate.rating || 0) * Number(duplicate.reviewCount || 0))) /
        combinedReviewCount
      )
    : Math.max(Number(canonical.rating || 0), Number(duplicate.rating || 0), 0);
  return {
    ...canonical,
    description: String(canonical.description || '').length >= String(duplicate.description || '').length ? canonical.description : duplicate.description,
    phone: canonical.phone || duplicate.phone,
    email: canonical.email || duplicate.email,
    website: canonical.website || duplicate.website,
    address: canonical.address || duplicate.address,
    imageUrl: canonical.imageUrl || duplicate.imageUrl,
    hours: canonical.hours || duplicate.hours,
    holidayHours: uniqueStrings([...(canonical.holidayHours || []), ...(duplicate.holidayHours || [])]),
    brochureUrl: canonical.brochureUrl || duplicate.brochureUrl,
    videoUrl: canonical.videoUrl || duplicate.videoUrl,
    featured: canonical.featured || duplicate.featured,
    verifiedBadge: canonical.verifiedBadge || duplicate.verifiedBadge,
    isSponsored: canonical.isSponsored || duplicate.isSponsored,
    govRegistered: canonical.govRegistered || duplicate.govRegistered,
    isHomeBased: canonical.isHomeBased || duplicate.isHomeBased,
    isWomenLed: canonical.isWomenLed || duplicate.isWomenLed,
    isPublicService: canonical.isPublicService || duplicate.isPublicService,
    reviewCount: combinedReviewCount,
    rating: Number(weightedRating.toFixed(1)),
    areasOfOperation: uniqueStrings([...(canonical.areasOfOperation || []), ...(duplicate.areasOfOperation || [])]),
    tags: uniqueStrings([...(canonical.tags || []), ...(duplicate.tags || []), 'merged-duplicate']),
    aliasNames: uniqueStrings(buildBusinessAliasSet(canonical, duplicate)),
    sourceLineage: uniqueStrings([canonical.id, ...(canonical.sourceLineage || []), duplicate.id, ...(duplicate.sourceLineage || [])]),
    duplicateReviewStatus: undefined,
    mergedIntoBusinessId: undefined,
    updatedAt: createdAt,
  };
}

export function mergeDuplicateBusinessPair({ businesses = [], reviews = [], canonicalId, duplicateId, timestamp = new Date().toISOString() }) {
  const canonical = (businesses || []).find((business) => String(business.id) === String(canonicalId));
  const duplicate = (businesses || []).find((business) => String(business.id) === String(duplicateId));
  if (!canonical || !duplicate) {
    throw new Error('Canonical or duplicate business was not found.');
  }

  const mergedCanonical = buildMergedCanonicalBusiness(canonical, duplicate, timestamp);
  const mergedDuplicate = {
    ...duplicate,
    status: 'rejected',
    duplicateReviewStatus: 'merged',
    mergedIntoBusinessId: canonical.id,
    rejectionReason: `Merged into canonical listing "${canonical.name}" on ${new Date(timestamp).toLocaleDateString('en-CA')}.`,
    sourceLineage: uniqueStrings([...(duplicate.sourceLineage || []), canonical.id]),
    updatedAt: timestamp,
  };

  const nextBusinesses = businesses.map((business) => {
    if (String(business.id) === String(canonical.id)) return mergedCanonical;
    if (String(business.id) === String(duplicate.id)) return mergedDuplicate;
    return business;
  });
  const nextReviews = reviews.map((review) => (
    String(review.businessId) === String(duplicate.id)
      ? { ...review, businessId: canonical.id }
      : review
  ));
  return {
    canonical: mergedCanonical,
    duplicate: mergedDuplicate,
    businesses: nextBusinesses,
    reviews: nextReviews,
  };
}

export function markDuplicatePairSeparate({ businesses = [], canonicalId, duplicateId, timestamp = new Date().toISOString() }) {
  const nextBusinesses = businesses.map((business) => {
    if (String(business.id) !== String(duplicateId)) return business;
    return {
      ...business,
      duplicateReviewStatus: 'separate',
      mergedIntoBusinessId: canonicalId,
      sourceLineage: uniqueStrings([...(business.sourceLineage || []), canonicalId]),
      updatedAt: timestamp,
    };
  });
  return nextBusinesses;
}

export function createCanonicalListingFromPair({ businesses = [], reviews = [], leftId, rightId, canonicalId, timestamp = new Date().toISOString() }) {
  const left = businesses.find((business) => String(business.id) === String(leftId));
  const right = businesses.find((business) => String(business.id) === String(rightId));
  if (!left || !right) {
    throw new Error('Source businesses were not found.');
  }
  const mergedSource = buildMergedCanonicalBusiness(left, right, timestamp);
  const canonicalBusiness = {
    ...mergedSource,
    id: normalizeText(canonicalId),
    status: 'approved',
    createdAt: timestamp,
    featured: mergedSource.featured || false,
    duplicateReviewStatus: undefined,
    mergedIntoBusinessId: undefined,
    tags: uniqueStrings([...(mergedSource.tags || []), 'canonical-created']),
  };
  const nextBusinesses = [
    canonicalBusiness,
    ...businesses.map((business) => {
      if (![String(left.id), String(right.id)].includes(String(business.id))) return business;
      return {
        ...business,
        status: 'rejected',
        duplicateReviewStatus: 'merged',
        mergedIntoBusinessId: canonicalBusiness.id,
        rejectionReason: `Merged into canonical listing "${canonicalBusiness.name}" on ${new Date(timestamp).toLocaleDateString('en-CA')}.`,
        sourceLineage: uniqueStrings([...(business.sourceLineage || []), canonicalBusiness.id]),
        updatedAt: timestamp,
      };
    }),
  ];
  const nextReviews = reviews.map((review) => (
    [String(left.id), String(right.id)].includes(String(review.businessId))
      ? { ...review, businessId: canonicalBusiness.id }
      : review
  ));
  return {
    canonicalBusiness,
    businesses: nextBusinesses,
    reviews: nextReviews,
  };
}

const PROFANITY_TOKENS = ['fraud', 'scam', 'fake', 'bloody', 'stupid', 'worst', 'abuse', 'cheat'];
const SPAM_PATTERNS = [/http(s)?:\/\//i, /\bwhatsapp\b/i, /\bcall now\b/i, /\bdiscount\b/i, /\bfree\b/i];

function classifyReview(review, businessesById) {
  const comment = normalizeLower(review?.comment);
  const matchingProfanity = PROFANITY_TOKENS.filter((token) => comment.includes(token));
  const spamSignals = SPAM_PATTERNS.filter((pattern) => pattern.test(String(review?.comment || '')));
  const samePhoneReviews = 0;
  const severity = review?.reported || matchingProfanity.length > 0
    ? 'high'
    : spamSignals.length > 0
      ? 'medium'
      : 'low';

  return {
    ...review,
    businessName: businessesById.get(String(review?.businessId || '')) || String(review?.businessId || ''),
    severity,
    moderationReasons: uniqueStrings([
      review?.reported ? 'user_reported' : '',
      matchingProfanity.length > 0 ? `profanity:${matchingProfanity.join(',')}` : '',
      spamSignals.length > 0 ? `spam:${spamSignals.length}` : '',
      samePhoneReviews > 2 ? 'repeat_phone_pattern' : '',
    ]),
  };
}

export function buildReviewModerationQueue({ reviews = [], businesses = [] } = {}) {
  const businessesById = new Map((businesses || []).map((business) => [String(business.id), String(business.name || business.id)]));
  const items = (reviews || [])
    .map((review) => classifyReview(review, businessesById))
    .filter((review) => review.reported || review.moderationReasons.length > 0)
    .sort((left, right) => (
      String(right.severity).localeCompare(String(left.severity))
      || toTimestamp(right.createdAt) - toTimestamp(left.createdAt)
    ));
  return {
    items,
    reportQueue: items.filter((item) => item.reported),
    spamQueue: items.filter((item) => item.moderationReasons.some((reason) => reason.startsWith('spam:'))),
    profanityQueue: items.filter((item) => item.moderationReasons.some((reason) => reason.startsWith('profanity:'))),
  };
}

export function buildTrendingBusinesses({ businesses = [], reviews = [] } = {}) {
  const reviewsByBusinessId = new Map();
  for (const review of Array.isArray(reviews) ? reviews : []) {
    const businessId = String(review.businessId || '');
    const entries = reviewsByBusinessId.get(businessId) || [];
    entries.push(review);
    reviewsByBusinessId.set(businessId, entries);
  }

  return (Array.isArray(businesses) ? businesses : [])
    .filter((business) => String(business.status || '') === 'approved')
    .map((business) => {
      const businessReviews = reviewsByBusinessId.get(String(business.id)) || [];
      const recentReviews = businessReviews.filter((review) => toTimestamp(review.createdAt) >= Date.now() - (30 * 24 * 60 * 60 * 1000));
      const recencyBoost = recentReviews.length * 8;
      const qualityBoost = Number(business.rating || 0) * 10;
      const trustBoost = (business.verifiedBadge ? 12 : 0) + (business.kycStatus === 'verified' ? 8 : 0);
      const engagementBoost = Math.min(30, Number(business.reviewCount || 0));
      return {
        businessId: business.id,
        businessName: business.name,
        localityId: business.localityId,
        categoryId: business.categoryId,
        rating: Number(business.rating || 0),
        reviewCount: Number(business.reviewCount || 0),
        recentReviews: recentReviews.length,
        trendingScore: Math.round(recencyBoost + qualityBoost + trustBoost + engagementBoost),
      };
    })
    .sort((left, right) => right.trendingScore - left.trendingScore || right.recentReviews - left.recentReviews)
    .slice(0, 25);
}

export function buildGeographyBoundaries({ businesses = [], geographyConfig = {} } = {}) {
  const localities = Array.isArray(geographyConfig.localities) ? geographyConfig.localities : [];
  return localities.map((locality) => {
    const points = (Array.isArray(businesses) ? businesses : [])
      .filter((business) => String(business.localityId || '') === String(locality.id || ''))
      .map((business) => business.gpsCoordinates)
      .filter((gps) => gps && Number.isFinite(Number(gps.lat)) && Number.isFinite(Number(gps.lng)));
    if (points.length === 0) {
      return {
        localityId: locality.id,
        localityName: locality.name,
        status: 'missing',
        bounds: null,
        center: null,
      };
    }
    const latitudes = points.map((gps) => Number(gps.lat));
    const longitudes = points.map((gps) => Number(gps.lng));
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    return {
      localityId: locality.id,
      localityName: locality.name,
      status: 'derived',
      pointCount: points.length,
      bounds: {
        minLat,
        maxLat,
        minLng,
        maxLng,
      },
      center: {
        lat: Number(((minLat + maxLat) / 2).toFixed(6)),
        lng: Number(((minLng + maxLng) / 2).toFixed(6)),
      },
    };
  });
}

export function buildMapProviderConfig() {
  return {
    provider: 'google_maps_links',
    capabilities: ['directions_link', 'external_maps_search', 'gps_coordinates', 'results_map_projection'],
    source: 'platform-default',
  };
}

export function buildPasswordPolicy() {
  return {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSymbol: true,
    forbiddenFragments: ['password', 'admin', '1234', 'qwerty'],
  };
}

export function validatePasswordAgainstPolicy(password) {
  const value = String(password || '');
  const policy = buildPasswordPolicy();
  const errors = [];
  if (value.length < policy.minLength) errors.push(`Password must be at least ${policy.minLength} characters long.`);
  if (policy.requireUppercase && !/[A-Z]/.test(value)) errors.push('Password must include at least one uppercase letter.');
  if (policy.requireLowercase && !/[a-z]/.test(value)) errors.push('Password must include at least one lowercase letter.');
  if (policy.requireDigit && !/[0-9]/.test(value)) errors.push('Password must include at least one number.');
  if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(value)) errors.push('Password must include at least one symbol.');
  policy.forbiddenFragments.forEach((fragment) => {
    if (normalizeLower(value).includes(fragment)) {
      errors.push(`Password cannot contain the fragment "${fragment}".`);
    }
  });
  return {
    valid: errors.length === 0,
    errors,
    policy,
  };
}
