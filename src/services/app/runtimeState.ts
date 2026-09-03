import type {
  ApiConfiguration,
  Business,
  BuyerActivityEvent,
  BuyerStateSnapshot,
  CRMContact,
  Locality,
  Review,
  UserSession,
} from '../../types';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
  getCategoryById,
  getSubcategoryById,
  resolveDefaultSubcategoryId,
  resolveMasterCategoryId,
} from '../../categoryMaster';
import { getAreaPincode } from '../../geographyMaster';

const slugifyBusinessValue = (value: string) => String(value || '')
  // NFKD first, so styled and accented characters survive as letters instead of
  // being stripped: "Cafe Coffee Day" with an accented e used to slug to
  // 'caf-coffee-day', and 65 listings whose names are in a decorative Unicode
  // font or Devanagari slugged to the empty string. All five copies of this
  // function must stay identical — the server builds sitemap URLs with its copy
  // and the client builds links with these, so any drift is two canonical URLs
  // for one listing.
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const toRadians = (value: number) => (value * Math.PI) / 180;

export const getDistanceInKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a = (
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2
  );
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isStoredLocalityLike = (value: unknown): value is Locality => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Locality>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0
  );
};

export const isStoredBusinessLike = (value: unknown): value is Business => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Business>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.localityId === 'string' &&
    candidate.localityId.trim().length > 0
  );
};

export const buildLocalityGeoCentersFromBusinesses = (localities: Locality[], businesses: Business[]) => {
  const totals = new Map<string, { lat: number; lng: number; count: number }>();
  businesses.forEach((business) => {
    const coords = business.gpsCoordinates;
    if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return;
    if (!localities.some((locality) => locality.id === business.localityId)) return;
    const existing = totals.get(business.localityId) || { lat: 0, lng: 0, count: 0 };
    existing.lat += coords.lat;
    existing.lng += coords.lng;
    existing.count += 1;
    totals.set(business.localityId, existing);
  });

  return localities.reduce<Record<string, { lat: number; lng: number }>>((acc, locality) => {
    const total = totals.get(locality.id);
    if (!total || total.count === 0) return acc;
    acc[locality.id] = {
      lat: total.lat / total.count,
      lng: total.lng / total.count,
    };
    return acc;
  }, {});
};

export const resolveBusinessPincode = (business: Business): string => {
  if (business.pincode && /^\d{6}$/.test(business.pincode)) return business.pincode;
  return getAreaPincode(business.areaId);
};

export const splitTagSource = (value: string) => (
  String(value || '')
    .split(/[|,/]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
);

// Mirrors the stop-list in services/admin/adminConsoleUtils.ts: the apply step
// builds tags through this helper, so both paths have to agree or a listing's
// tags would depend on which screen imported it.
const NON_DISCRIMINATING_TAGS = new Set([
  'point_of_interest', 'point of interest', 'establishment', 'premise', 'subpremise',
  'political', 'geocode', 'plus_code', 'route', 'street_address',
  'locality', 'sublocality', 'sublocality_level_1', 'postal_code',
  'administrative_area_level_1', 'administrative_area_level_2', 'administrative_area_level_3',
]);

export const uniqueTags = (...groups: Array<Array<string | undefined>>) => {
  const seen = new Set<string>();
  const tags: string[] = [];
  groups.flat().forEach((entry) => {
    const trimmed = String(entry || '').trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    if (NON_DISCRIMINATING_TAGS.has(key)) return;
    seen.add(key);
    tags.push(trimmed);
  });
  return tags.slice(0, 25);
};

export const isValidCategoryId = (categoryId: string) => BUSINESS_CATEGORIES.some((category) => category.id === categoryId);

export const isValidSubcategoryId = (categoryId: string, subcategoryId: string) => BUSINESS_SUBCATEGORIES.some((subcategory) => (
  subcategory.categoryId === categoryId && subcategory.id === subcategoryId
));

export const buildBusinessTags = (business: Partial<Business>) => {
  const mappedCategoryName = getCategoryById(business.categoryId || '')?.name || '';
  const mappedSubcategoryName = getSubcategoryById(business.subcategoryId || '')?.name || '';
  return uniqueTags(
    Array.isArray(business.tags) ? business.tags : [],
    splitTagSource(business.sourceCategoryLabel || ''),
    splitTagSource(business.sourceSubcategoryLabel || ''),
    splitTagSource(business.description || ''),
    [
      business.categoryId,
      business.subcategoryId,
      mappedCategoryName,
      mappedSubcategoryName,
    ],
  );
};

export const isBusinessTaxonomyMapped = (business: Partial<Business>) => (
  isValidCategoryId(business.categoryId || '') &&
  isValidSubcategoryId(business.categoryId || '', business.subcategoryId || '')
);

export const normalizeBusinessTaxonomy = (business: Business): Business => {
  const categoryId = resolveMasterCategoryId(business.categoryId || '');
  const validCategory = isValidCategoryId(categoryId);
  const validSubcategory = isValidSubcategoryId(categoryId, business.subcategoryId || '');
  const shouldDefaultSubcategory = validCategory && !validSubcategory && !String(business.sourceSubcategoryLabel || '').trim();
  // Do NOT blank an unrecognized category/subcategory id. The runtime catalog
  // starts life as the bundled seed and is only replaced once the taxonomy API
  // resolves, so normalizing a business before that would erase a perfectly
  // good id for any category added since the seed. Because this normalization
  // is destructive and re-runs on the already-normalized record, a blanked id
  // could never be recovered once the real catalog arrived — the listing just
  // fell into an "uncategorized" bucket forever. The server's value is
  // authoritative; keep it and let `taxonomyMapped` carry whether it validated.
  const normalizedCategoryId = validCategory ? categoryId : (business.categoryId || '');
  const normalizedSubcategoryId = validCategory
    ? (
        validSubcategory
          ? (business.subcategoryId || '')
          : (shouldDefaultSubcategory ? resolveDefaultSubcategoryId(categoryId) : '')
      )
    : (business.subcategoryId || '');
  return {
    ...business,
    categoryId: normalizedCategoryId,
    subcategoryId: normalizedSubcategoryId,
    taxonomyMapped: validCategory && normalizedSubcategoryId !== '',
    pincode: resolveBusinessPincode({ ...business, categoryId: normalizedCategoryId }),
    tags: buildBusinessTags({
      ...business,
      categoryId: normalizedCategoryId,
      subcategoryId: normalizedSubcategoryId,
    }),
  };
};

// Imported listing text carries junk from the source export: runs of "?" where
// non-Latin characters were lost before the CSV was produced (the raw file has
// no Devanagari bytes at all, so they are unrecoverable), plus stray leading and
// trailing punctuation like "@", "#", a lone ".", or a dangling comma. Strip all
// of it so names and addresses read cleanly. Opening brackets are preserved so
// "(CTL) Clinitech Laboratory" survives intact, and any bracket left empty once
// the lost characters are removed is dropped rather than shown as "( )".
export const cleanImportedText = (value: string | undefined | null): string => {
  let out = String(value || '');
  if (!out) return '';
  out = out.replace(/\?{2,}/g, ' ');
  out = out.replace(/\(\s*\)/g, ' ').replace(/\[\s*\]/g, ' ');
  out = out.replace(/^[\s?@#.\-*~|/\\,;:+=_'"!&%$^)\]]+/, '');
  out = out.replace(/[\s?@#*~|\\,;:+=_'"^-]+$/, '');
  out = out.replace(/\s{2,}/g, ' ').trim();
  return out;
};

export const normalizeStoredBusiness = (business: Business): Business => {
  const sanitizedBusiness: Business = {
    ...business,
    slug: String(business.slug || slugifyBusinessValue(`${business.name || ''}-${business.id || ''}`)).trim() || undefined,
    name: cleanImportedText(business.name) || String(business.name || '').trim(),
    googlePlaceId: business.googlePlaceId ? String(business.googlePlaceId).trim() : undefined,
    categoryId: String(business.categoryId || '').trim(),
    subcategoryId: String(business.subcategoryId || '').trim(),
    businessTypes: Array.isArray(business.businessTypes)
      ? business.businessTypes.map((entry) => String(entry || '').trim()).filter(Boolean)
      : undefined,
    serviceTypes: Array.isArray(business.serviceTypes)
      ? business.serviceTypes.map((entry) => String(entry || '').trim()).filter(Boolean)
      : undefined,
    sourceCategoryLabel: business.sourceCategoryLabel ? String(business.sourceCategoryLabel).trim() : undefined,
    sourceSubcategoryLabel: business.sourceSubcategoryLabel ? String(business.sourceSubcategoryLabel).trim() : undefined,
    address: cleanImportedText(business.address) || String(business.address || '').trim(),
    phone: String(business.phone || '').trim(),
    website: String(business.website || '').trim(),
    description: String(business.description || '').trim(),
    logoUrl: business.logoUrl ? String(business.logoUrl).trim() : undefined,
    coverImageUrl: business.coverImageUrl ? String(business.coverImageUrl).trim() : undefined,
    galleryUrls: Array.isArray(business.galleryUrls)
      ? business.galleryUrls.map((entry) => String(entry || '').trim()).filter(Boolean)
      : undefined,
    tags: Array.isArray(business.tags)
      ? business.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : [],
    hours: typeof business.hours === 'string' ? business.hours : '',
    areasOfOperation: Array.isArray(business.areasOfOperation)
      ? business.areasOfOperation.map((areaId) => String(areaId || '').trim()).filter(Boolean)
      : [],
    languagesSpoken: Array.isArray(business.languagesSpoken)
      ? business.languagesSpoken.map((language) => String(language || '').trim()).filter(Boolean)
      : undefined,
    paymentMethods: Array.isArray(business.paymentMethods)
      ? business.paymentMethods.map((method) => String(method || '').trim()).filter(Boolean)
      : undefined,
    duplicateReviewStatus: ['pending', 'merged', 'separate'].includes(String(business.duplicateReviewStatus || ''))
      ? business.duplicateReviewStatus
      : undefined,
    mergedIntoBusinessId: business.mergedIntoBusinessId ? String(business.mergedIntoBusinessId).trim() : undefined,
    sourceLineage: Array.isArray(business.sourceLineage)
      ? business.sourceLineage.map((entry) => String(entry || '').trim()).filter(Boolean)
      : undefined,
    verificationTags: Array.isArray(business.verificationTags)
      ? business.verificationTags.map((entry) => String(entry || '').trim()).filter(Boolean)
      : undefined,
    domainMappingTags: Array.isArray(business.domainMappingTags)
      ? business.domainMappingTags.map((entry) => String(entry || '').trim()).filter(Boolean)
      : undefined,
    featuredSnippetAnswer: business.featuredSnippetAnswer ? String(business.featuredSnippetAnswer).trim() : undefined,
    seoLandingPagePath: business.seoLandingPagePath ? String(business.seoLandingPagePath).trim() : undefined,
    seoPremiumEnabled: business.seoPremiumEnabled === true,
    seoImpressions: Number.isFinite(Number(business.seoImpressions)) ? Number(business.seoImpressions) : undefined,
    seoClicks: Number.isFinite(Number(business.seoClicks)) ? Number(business.seoClicks) : undefined,
  };
  const synthesizedGallery = [
    sanitizedBusiness.coverImageUrl,
    sanitizedBusiness.imageUrl,
    sanitizedBusiness.logoUrl,
    ...(sanitizedBusiness.galleryUrls || []),
    sanitizedBusiness.videoUrl,
    sanitizedBusiness.brochureUrl,
  ].map((entry) => String(entry || '').trim()).filter(Boolean);
  const verificationTags = Array.from(new Set([
    ...(sanitizedBusiness.verificationTags || []),
    sanitizedBusiness.verifiedBadge ? 'Verified listing' : '',
    sanitizedBusiness.kycStatus === 'verified' ? 'KYC verified' : '',
    sanitizedBusiness.govRegistered ? 'Gov registered' : '',
    sanitizedBusiness.isWomenLed ? 'Women-led business' : '',
    sanitizedBusiness.isHomeBased ? 'Home-based business' : '',
    sanitizedBusiness.isPublicService ? 'Public service' : '',
  ].filter(Boolean)));
  const normalized = normalizeBusinessTaxonomy(sanitizedBusiness);
  const normalizedWithAssets: Business = {
    ...normalized,
    slug: sanitizedBusiness.slug || slugifyBusinessValue(`${normalized.name}-${normalized.id}`),
    logoUrl: sanitizedBusiness.logoUrl || sanitizedBusiness.imageUrl || undefined,
    coverImageUrl: sanitizedBusiness.coverImageUrl || sanitizedBusiness.imageUrl || undefined,
    galleryUrls: synthesizedGallery.slice(0, 8),
    verificationTags,
    businessTypes: sanitizedBusiness.businessTypes && sanitizedBusiness.businessTypes.length > 0
      ? sanitizedBusiness.businessTypes
      : [getCategoryById(normalized.categoryId)?.name || normalized.sourceCategoryLabel || 'Local business'],
    serviceTypes: sanitizedBusiness.serviceTypes && sanitizedBusiness.serviceTypes.length > 0
      ? sanitizedBusiness.serviceTypes
      : [getSubcategoryById(normalized.subcategoryId)?.name || normalized.sourceSubcategoryLabel || getCategoryById(normalized.categoryId)?.name || 'Services'],
    domainMappingTags: sanitizedBusiness.domainMappingTags && sanitizedBusiness.domainMappingTags.length > 0
      ? sanitizedBusiness.domainMappingTags
      : [normalized.localityId, normalized.categoryId, normalized.subcategoryId].filter(Boolean),
    seoLandingPagePath: sanitizedBusiness.seoLandingPagePath || undefined,
    seoPremiumEnabled: sanitizedBusiness.seoPremiumEnabled === true || normalized.subscriptionPlan === 'premium',
  };
  // String(): `normalizedWithAssets.id` was read directly, so one record
  // without an id threw "Cannot read properties of undefined (reading
  // 'startsWith')" out of a state initializer and React unmounted the entire
  // app — a blank page from a single malformed listing.
  const listingId = String(normalizedWithAssets.id || '');
  const isUploadedListing =
    listingId.startsWith('csv_') ||
    listingId.startsWith('b_dynamic_') ||
    normalizedWithAssets.ownerName === 'Imported via CSV';

  return isUploadedListing && normalizedWithAssets.status === 'pending'
    ? { ...normalizedWithAssets, status: 'approved' }
    : normalizedWithAssets;
};

export const normalizeStoredReview = (review: Review): Review => ({
  ...review,
  id: String(review.id || '').trim(),
  businessId: String(review.businessId || '').trim(),
  userName: String(review.userName || '').trim(),
  userPhone: String(review.userPhone || '').trim(),
  rating: Number.isFinite(Number(review.rating)) ? Math.max(1, Math.min(5, Number(review.rating))) : 5,
  comment: String(review.comment || '').trim(),
  createdAt: String(review.createdAt || new Date().toISOString()),
  verifiedByOtp: Boolean(review.verifiedByOtp),
  photoUrl: review.photoUrl ? String(review.photoUrl).trim() : undefined,
  videoUrl: review.videoUrl ? String(review.videoUrl).trim() : undefined,
  isVerifiedPurchase: review.isVerifiedPurchase === true,
  helpfulVotes: Number.isFinite(Number(review.helpfulVotes)) ? Number(review.helpfulVotes) : undefined,
  reported: review.reported === true,
  reportReason: review.reportReason ? String(review.reportReason).trim() : undefined,
});

export const normalizeStoredCrmContact = (contact: CRMContact): CRMContact => ({
  ...contact,
  id: String(contact.id || '').trim(),
  businessId: String(contact.businessId || '').trim(),
  name: String(contact.name || '').trim(),
  phone: String(contact.phone || '').trim(),
  email: contact.email ? String(contact.email).trim() : undefined,
  lastInteraction: String(contact.lastInteraction || new Date().toISOString()),
  followUpNotes: contact.followUpNotes ? String(contact.followUpNotes).trim() : undefined,
  totalSpent: Number.isFinite(Number(contact.totalSpent)) ? Number(contact.totalSpent) : undefined,
  ordersCount: Number.isFinite(Number(contact.ordersCount)) ? Number(contact.ordersCount) : undefined,
  loyaltyPoints: Number.isFinite(Number(contact.loyaltyPoints)) ? Number(contact.loyaltyPoints) : undefined,
});

export const normalizeBuyerActivityEvent = (event: BuyerActivityEvent): BuyerActivityEvent => ({
  ...event,
  id: String(event.id || '').trim(),
  actionType: ['saved_listing', 'unsaved_listing', 'compare_listing', 'uncompare_listing', 'contact_unlock', 'review_submitted'].includes(String(event.actionType || ''))
    ? event.actionType
    : 'saved_listing',
  businessId: event.businessId ? String(event.businessId).trim() : undefined,
  createdAt: String(event.createdAt || new Date().toISOString()),
  title: String(event.title || '').trim(),
  detail: event.detail ? String(event.detail).trim() : undefined,
});

export const normalizeBuyerStateSnapshot = (value?: Partial<BuyerStateSnapshot> | null): BuyerStateSnapshot => ({
  viewedBusinessIds: Array.isArray(value?.viewedBusinessIds)
    ? Array.from(new Set(value.viewedBusinessIds.map((entry) => String(entry || '').trim()).filter(Boolean)))
    : [],
  savedBusinessIds: Array.isArray(value?.savedBusinessIds)
    ? Array.from(new Set(value.savedBusinessIds.map((entry) => String(entry || '').trim()).filter(Boolean)))
    : [],
  compareBusinessIds: Array.isArray(value?.compareBusinessIds)
    ? Array.from(new Set(value.compareBusinessIds.map((entry) => String(entry || '').trim()).filter(Boolean))).slice(0, 3)
    : [],
  buyerActivityEvents: Array.isArray(value?.buyerActivityEvents)
    ? value.buyerActivityEvents
        .map(normalizeBuyerActivityEvent)
        .filter((event) => event.id && event.title)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 50)
    : [],
});

export const mergeBuyerStateSnapshots = (base: BuyerStateSnapshot, incoming: BuyerStateSnapshot): BuyerStateSnapshot => {
  const mergedViewed = Array.from(new Set([...(incoming.viewedBusinessIds || []), ...(base.viewedBusinessIds || [])]));
  const mergedSaved = Array.from(new Set([...(incoming.savedBusinessIds || []), ...(base.savedBusinessIds || [])]));
  const mergedCompared = Array.from(new Set([...(incoming.compareBusinessIds || []), ...(base.compareBusinessIds || [])])).slice(0, 3);
  const eventMap = new Map<string, BuyerActivityEvent>();
  [...(incoming.buyerActivityEvents || []), ...(base.buyerActivityEvents || [])]
    .map(normalizeBuyerActivityEvent)
    .forEach((event) => {
      const key = event.id || `${event.actionType}|${event.businessId || ''}|${event.title}|${event.createdAt}`;
      if (!eventMap.has(key)) {
        eventMap.set(key, event);
      }
    });
  return normalizeBuyerStateSnapshot({
    viewedBusinessIds: mergedViewed,
    savedBusinessIds: mergedSaved,
    compareBusinessIds: mergedCompared,
    buyerActivityEvents: Array.from(eventMap.values()),
  });
};

const DEFAULT_GUEST_VIEWED_BUSINESS_IDS = ['s1'];

export const buildGuestUserSession = (): UserSession => ({
  role: 'buyer',
  userType: 'buyer',
  userName: 'Anonymous Guest Explorer',
  userId: undefined,
  userPhone: undefined,
  email: undefined,
  authToken: undefined,
  contactUnlockToken: undefined,
  sellerBusinessId: undefined,
  isAuthenticated: false,
});

export const readGuestBuyerStateSnapshotFromStorage = (): BuyerStateSnapshot => {
  try {
    const viewedBusinessIds = localStorage.getItem('yp_viewed_bizs');
    const savedBusinessIds = localStorage.getItem('yp_saved_business_ids');
    const compareBusinessIds = localStorage.getItem('yp_compare_business_ids');
    const buyerActivityEvents = localStorage.getItem('yp_buyer_activity_events');
    const normalized = normalizeBuyerStateSnapshot({
      viewedBusinessIds: viewedBusinessIds ? JSON.parse(viewedBusinessIds) : DEFAULT_GUEST_VIEWED_BUSINESS_IDS,
      savedBusinessIds: savedBusinessIds ? JSON.parse(savedBusinessIds) : [],
      compareBusinessIds: compareBusinessIds ? JSON.parse(compareBusinessIds) : [],
      buyerActivityEvents: buyerActivityEvents ? JSON.parse(buyerActivityEvents) : [],
    });
    return normalized.viewedBusinessIds.length > 0
      ? normalized
      : normalizeBuyerStateSnapshot({
          ...normalized,
          viewedBusinessIds: DEFAULT_GUEST_VIEWED_BUSINESS_IDS,
        });
  } catch {
    return normalizeBuyerStateSnapshot({
      viewedBusinessIds: DEFAULT_GUEST_VIEWED_BUSINESS_IDS,
    });
  }
};

export const getBuyerStateScopeKey = (session: UserSession, config: ApiConfiguration) => {
  if (!(session.isAuthenticated && session.authToken && config.syncMode === 'api' && config.buyerStateEndpoint)) {
    return 'guest';
  }
  const normalizedUserId = String(session.userId || '').trim();
  const normalizedEmail = String(session.email || '').trim().toLowerCase();
  const normalizedPhone = String(session.userPhone || '').replace(/\D/g, '');
  return `auth:${normalizedUserId || normalizedEmail || normalizedPhone || 'authenticated'}`;
};

export const mergeBusinessCollections = (base: Business[], incoming: Business[]): Business[] => {
  const merged = new Map<string, Business>();
  // Keyed on the id, so a record without one has nowhere to go anyway — and
  // normalizing it used to throw and take the app down with it. A malformed
  // listing from the API must cost that listing, not the page. Drop it here
  // rather than letting `undefined` become a map key.
  const add = (business: Business) => {
    const id = String(business?.id || '').trim();
    if (!id) return;
    merged.set(id, normalizeStoredBusiness(business));
  };
  base.forEach(add);
  incoming.forEach(add);
  return Array.from(merged.values());
};
