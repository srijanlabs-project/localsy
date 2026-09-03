import type { Business, Locality } from '../../types';
import { getCategoryById, getSubcategoryById } from '../../categoryMaster';
import { MASTER_AREAS, MASTER_CITIES, MASTER_STATES, resolvePincodeForAreaId } from '../../geographyMaster';

export type SearchSuggestion = {
  id: string;
  type: 'category' | 'subcategory' | 'business' | 'intent' | 'locality' | 'recent';
  displayValue: string;
  queryValue: string;
  categoryId?: string;
  subcategoryId?: string;
  businessId?: string;
  localityId?: string;
  metaLabel?: string;
};

export const getBusinessAreaName = (localities: Locality[], biz: Business) => {
  const areaName = MASTER_AREAS.find((area) => area.id === biz.areaId)?.name;
  if (areaName) return areaName;
  return localities.find((locality) => locality.id === biz.localityId)?.name.split(',')[0] || 'Area not set';
};

export const getBusinessCategoryLabel = (biz: Business) => (
  getCategoryById(biz.categoryId)?.name || biz.sourceCategoryLabel || biz.categoryId || 'Local Service'
);

export const getBusinessSubcategoryLabel = (biz: Business) => (
  getSubcategoryById(biz.subcategoryId)?.name || biz.sourceSubcategoryLabel || getBusinessCategoryLabel(biz)
);

export const normalizeSearchText = (value: string) => {
  const replacements: Array<[RegExp, string]> = [
    [/\bdr\b/g, 'doctor'],
    [/\bdocter\b|\bdocotor\b|\bdaktar\b|\bdaaktar\b/g, 'doctor'],
    [/\bdavakhana\b|\bdawakhaana\b/g, 'clinic'],
    [/\brugnalaya\b|\baspatal\b|\bhospitol\b/g, 'hospital'],
    [/\bbloodbank\b/g, 'blood bank'],
    [/\bpolice stn\b|\bpolice chowki\b/g, 'police station'],
    [/\bgharghuti\b|\bgharguti\b|\bghar ka khana\b|\bhome made\b/g, 'home food'],
    [/\bghar ka tiffin\b|\bdabba\b/g, 'tiffin'],
    [/\bmahila udyog\b|\bwomen owned\b|\bwoman owned\b/g, 'women-led'],
    [/\bmedikal\b/g, 'medical'],
    [/à¤¡à¥‰à¤•à¥à¤Ÿà¤°|à¤¡à¤¾à¤•à¥à¤Ÿà¤°|à¤¡à¥‰/g, 'doctor'],
    [/à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤²|à¤¹à¥‰à¤¸à¥à¤ªà¤¿à¤Ÿà¤²|à¤°à¥à¤—à¥à¤£à¤¾à¤²à¤¯/g, 'hospital'],
    [/à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•|à¤¦à¤µà¤¾à¤–à¤¾à¤¨à¤¾/g, 'clinic'],
    [/à¤¬à¥à¤²à¤¡ à¤¬à¥ˆà¤‚à¤•/g, 'blood bank'],
    [/à¤ªà¥à¤²à¤¿à¤¸|à¤ªà¥‹à¤²à¥€à¤¸/g, 'police'],
    [/à¤¬à¥ˆà¤‚à¤•|à¤à¤Ÿà¥€à¤à¤®/g, 'bank atm'],
    [/à¤˜à¤°à¤—à¥à¤¤à¥€|à¤˜à¤° à¤•à¤¾ à¤–à¤¾à¤¨à¤¾|à¤˜à¤°à¥€à¤²à¥‚ à¤–à¤¾à¤¨à¤¾/g, 'home food'],
    [/à¤Ÿà¤¿à¤«à¤¿à¤¨|à¤¡à¤¬à¥à¤¬à¤¾/g, 'tiffin'],
    [/à¤ªà¥à¤²à¤‚à¤¬à¤°|à¤¨à¤²/g, 'plumber'],
    [/à¤‡à¤²à¥‡à¤•à¥à¤Ÿà¥à¤°à¥€à¤¶à¤¿à¤¯à¤¨|à¤¬à¤¿à¤œà¤²à¥€/g, 'electrician'],
  ];

  let normalized = String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, ' ');

  replacements.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, ` ${replacement} `);
  });

  return normalized
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const tokenizeSearchText = (value: string) => normalizeSearchText(value).split(/[\s,/-]+/).filter(Boolean);

export const getBusinessSearchDocument = (localities: Locality[], biz: Business) => {
  const areaName = getBusinessAreaName(localities, biz);
  const localityName = localities.find((locality) => locality.id === biz.localityId)?.name || '';
  const cityName = MASTER_CITIES.find((city) => city.id === biz.cityId)?.name || '';
  const stateName = MASTER_STATES.find((state) => state.id === biz.stateId)?.name || '';
  return [
    biz.name,
    biz.description,
    biz.address,
    areaName,
    localityName,
    cityName,
    stateName,
    biz.pincode,
    getBusinessCategoryLabel(biz),
    getBusinessSubcategoryLabel(biz),
    biz.isHomeBased ? 'home business homemade home kitchen' : '',
    biz.isWomenLed ? 'women-led women owned housewife' : '',
    biz.isPublicService ? 'public service civic essential emergency' : '',
    ...(Array.isArray(biz.tags) ? biz.tags : []),
  ]
    .filter(Boolean)
    .join(' ');
};

export const isHomeBusinessIntent = (query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  return [
    'home baker',
    'home baking',
    'homemade',
    'made at home',
    'home kitchen',
    'housewife',
    'tiffin',
    'home chef',
  ].some((keyword) => normalizedQuery.includes(keyword));
};

export const isCivicIntent = (query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  return [
    'hospital',
    'clinic',
    'doctor',
    'blood bank',
    'ambulance',
    'police',
    'ngo',
    'charity',
    'foundation',
    'bank',
    'atm',
  ].some((keyword) => normalizedQuery.includes(keyword));
};

export const isHomeBasedBusiness = (localities: Locality[], biz: Business) => {
  if (biz.isHomeBased) return true;
  const document = getBusinessSearchDocument(localities, biz);
  return [
    'home baker',
    'home baking',
    'home kitchen',
    'homemade',
    'made at home',
    'tiffin',
    'housewife',
    'women-led',
    'women owned',
    'woman owned',
  ].some((keyword) => document.includes(keyword));
};

export const isWomenLedHomeBusiness = (localities: Locality[], biz: Business) => {
  if (biz.isWomenLed) return true;
  const document = getBusinessSearchDocument(localities, biz);
  return isHomeBasedBusiness(localities, biz) && [
    'women-led',
    'women led',
    'women owned',
    'woman owned',
    'housewife',
    'lady entrepreneur',
  ].some((keyword) => document.includes(keyword));
};

export const isEssentialCommunityService = (localities: Locality[], biz: Business) => {
  if (biz.isPublicService) return true;
  const document = getBusinessSearchDocument(localities, biz);
  return [
    'hospital',
    'clinic',
    'blood bank',
    'ambulance',
    'police',
    'bank',
    'atm',
    'ngo',
    'charity',
    'foundation',
    'public service',
    'government',
  ].some((keyword) => document.includes(keyword));
};

export const getBusinessQueryRelevanceScore = (localities: Locality[], biz: Business, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 35;

  const tokens = tokenizeSearchText(normalizedQuery);
  const businessName = normalizeSearchText(biz.name);
  const categoryLabel = normalizeSearchText(getBusinessCategoryLabel(biz));
  const subcategoryLabel = normalizeSearchText(getBusinessSubcategoryLabel(biz));
  const document = getBusinessSearchDocument(localities, biz);
  let score = 0;

  if (businessName === normalizedQuery) score += 140;
  else if (businessName.startsWith(normalizedQuery)) score += 100;
  else if (businessName.includes(normalizedQuery)) score += 72;

  if (subcategoryLabel === normalizedQuery) score += 84;
  else if (subcategoryLabel.includes(normalizedQuery)) score += 54;

  if (categoryLabel === normalizedQuery) score += 68;
  else if (categoryLabel.includes(normalizedQuery)) score += 40;

  if (document.includes(normalizedQuery)) score += 26;

  tokens.forEach((token) => {
    if (businessName.includes(token)) score += 15;
    else if (subcategoryLabel.includes(token)) score += 12;
    else if (categoryLabel.includes(token)) score += 10;
    else if (document.includes(token)) score += 6;
  });

  return score;
};

export const matchesBusinessSearch = (localities: Locality[], biz: Business, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return getBusinessQueryRelevanceScore(localities, biz, normalizedQuery) > 0;
};

type RecommendationArgs = {
  browsingLocalityIds: string[];
  business: Business;
  currentLocalityId: string;
  localities: Locality[];
  pageType: 'homepage' | 'results';
  query: string;
  resolvedSponsoredBusinessIds: Set<string>;
};

export const getBusinessRecommendedScore = ({
  browsingLocalityIds,
  business,
  currentLocalityId,
  localities,
  pageType,
  query,
  resolvedSponsoredBusinessIds,
}: RecommendationArgs) => {
  let score = 0;
  score += getBusinessQueryRelevanceScore(localities, business, query);

  if (business.localityId === currentLocalityId) score += 24;
  else if (browsingLocalityIds.includes(business.localityId)) score += 10;

  if (business.verifiedBadge) score += 18;
  if (business.kycStatus === 'verified') score += 12;
  if (business.govRegistered) score += 8;
  if (business.subscriptionPlan === 'premium') score += 8;

  score += Math.min(24, business.rating * 5);
  score += Math.min(18, (business.reviewCount || 0) * 0.35);
  score += Math.min(8, ((business.customerSatisfaction || 0) / 100) * 8);
  score += Math.min(6, ((business.repeatCustomerScore || 0) / 100) * 6);
  score += Math.min(18, Number(business.cpcBudget || 0) / 12);

  if ((business.description || '').trim().length >= 60) score += 5;
  if ((business.phone || '').replace(/\D/g, '').length >= 10) score += 4;
  if ((business.website || '').trim()) score += 2;
  if (business.responseTime) score += 3;

  if (isHomeBusinessIntent(query) && isHomeBasedBusiness(localities, business)) score += 26;
  if (isCivicIntent(query) && isEssentialCommunityService(localities, business)) score += 24;

  if (pageType === 'results') {
    if (resolvedSponsoredBusinessIds.has(business.id)) score += 24;
    if (business.isSponsored) score += 16;
    if (business.featured) score += 8;
  } else {
    if (resolvedSponsoredBusinessIds.has(business.id)) score += 18;
    if (business.isSponsored) score += 12;
    if (business.featured) score += 8;
  }

  const daysSinceCreated = Math.max(0, (Date.now() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (Number.isFinite(daysSinceCreated)) {
    score += Math.max(0, 8 - Math.min(8, daysSinceCreated / 30));
  }

  return score;
};

export const getBusinessCanonicalKey = (localities: Locality[], biz: Business) => {
  const normalizedPhone = String(biz.phone || '').replace(/\D/g, '').slice(-10);
  const normalizedPincode = resolvePincodeForAreaId(biz.pincode, biz.areaId);
  const normalizedAddress = normalizeSearchText(`${biz.address} ${getBusinessAreaName(localities, biz)}`).split(' ').slice(0, 6).join(' ');
  return [
    normalizeSearchText(biz.name),
    normalizedPhone || normalizedAddress || biz.id,
    normalizedPincode || biz.areaId || 'no-pin',
    biz.localityId,
  ].join('|');
};

type DedupeArgs = {
  browsingLocalityIds: string[];
  currentLocalityId: string;
  localities: Locality[];
  pageType: 'homepage' | 'results';
  query: string;
  resolvedSponsoredBusinessIds: Set<string>;
};

export const dedupeBusinessesForExperience = (items: Business[], args: DedupeArgs) => {
  const deduped = new Map<string, Business>();
  items.forEach((business) => {
    const key = getBusinessCanonicalKey(args.localities, business);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, business);
      return;
    }

    const existingScore = getBusinessRecommendedScore({ ...args, business: existing });
    const incomingScore = getBusinessRecommendedScore({ ...args, business });
    if (incomingScore > existingScore) {
      deduped.set(key, business);
    }
  });
  return Array.from(deduped.values());
};

export const filterSearchSuggestions = (searchQuery: string, searchSuggestions: SearchSuggestion[]) => {
  const normalizedQuery = normalizeSearchText(searchQuery);
  if (!normalizedQuery) return [];
  return searchSuggestions
    .map((suggestion) => {
      const normalizedDisplay = normalizeSearchText(suggestion.displayValue);
      const normalizedValue = normalizeSearchText(suggestion.queryValue);
      let score = 0;

      if (normalizedDisplay === normalizedQuery || normalizedValue === normalizedQuery) score += 140;
      else if (normalizedDisplay.startsWith(normalizedQuery) || normalizedValue.startsWith(normalizedQuery)) score += 110;
      else if (normalizedDisplay.includes(normalizedQuery) || normalizedValue.includes(normalizedQuery)) score += 72;

      tokenizeSearchText(normalizedQuery).forEach((token) => {
        if (normalizedDisplay.includes(token) || normalizedValue.includes(token)) score += 18;
      });

      if (suggestion.type === 'intent') score += 12;
      if (suggestion.type === 'business') score += 10;
      if (suggestion.type === 'recent') score += 8;
      if (suggestion.type === 'locality') score += 14;
      if (isHomeBusinessIntent(normalizedQuery) && suggestion.queryValue.toLowerCase().includes('home')) score += 24;
      if (isCivicIntent(normalizedQuery) && /hospital|clinic|bank|blood|police/.test(normalizedDisplay)) score += 24;

      return { suggestion, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.suggestion.displayValue.localeCompare(b.suggestion.displayValue))
    .map((entry) => entry.suggestion)
    .slice(0, 8);
};
