import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { 
  INITIAL_REVIEWS,
  INITIAL_CRM_CONTACTS
} from './data';
import { 
  Locality, Business, SubdomainMapping, Review, UserSession, UserRole,
  CommunityItem, CRMContact, MarketingCoupon, AuditEvent, ListingAd, AdLead, HeroBanner, HeroBannerStat, BuyerActivityEvent,
  HomepageLayout, HomepageSection, HomepageSectionType, ApiConfiguration, HomepageConfigState, ScalableHomepageConfigState, ScalableCampaign, ScalableHomepageTemplate, ScalableHomepageAssignment, BusinessTaxonomyState, BusinessCategory, BusinessSubcategory, LocalityRoutingConfigState, PincodeRoutingMapping, GeographyConfigState, StateMaster, CityMaster, AreaMaster, HomepageDefaultsConfigState, FallbackListingAdTemplate, HeroBannerDraftDefaults, SeoDiscoveryConfigState, SeoRouteIntent, SeoLocalityMetadata, SeoCategoryLabel, SeoTopListingGroup, SeoDefaultListingGroup, ResolvedHomepagePublishRequest, ResolvedHomepageSnapshotDeleteRequest, ScalableLegacyOwnershipSummary, PublishedHomepageSnapshot
} from './types';
import WebPortal from './components/WebPortal';
import PincodeSelectionModal from './components/PincodeSelectionModal';
import AuthModal from './components/AuthModal';
import happyBusinessLogo from './assets/happy-business-logo.png';
import { 
  Layout, Smartphone, Shield, BookOpen, Layers, RefreshCw, 
  User, CheckCircle, ShieldAlert, KeyRound, Wrench, Briefcase, HelpCircle,
  Sliders, Settings, X, Database, MapPin, Search, LogOut, ChevronDown, Menu
} from 'lucide-react';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
  getCategoryById,
  getSubcategoryById,
  setBusinessTaxonomyCatalog,
  resolveDefaultSubcategoryId,
  resolveMasterCategoryId
} from './categoryMaster';
import { MASTER_AREAS, MASTER_CITIES, MASTER_STATES, setGeographyCatalog } from './geographyMaster';
import {
  DEFAULT_LOCALITIES,
  DEFAULT_LOCALITY_ID,
  DEFAULT_PINCODE_MAPPINGS,
  buildDefaultSubdomainMappings,
} from '../shared/localityRoutingSeed.js';
import {
  DEFAULT_FALLBACK_LISTING_AD_TEMPLATES,
  DEFAULT_HERO_BANNER_DRAFT_DEFAULTS,
  DEFAULT_HERO_QUICK_ACTIONS,
  DEFAULT_HERO_STAT_TEMPLATES,
  DEFAULT_HOMEPAGE_SECTION_TEMPLATES,
  DEFAULT_SEARCH_SHORTCUT_CATEGORY_IDS,
} from '../shared/homepageDefaultsSeed.js';
import {
  DEFAULT_SEO_CATEGORY_LABELS,
  DEFAULT_SEO_DEFAULT_LISTING_NAMES,
  DEFAULT_SEO_LOCALITY_METADATA,
  DEFAULT_SEO_ROUTE_INTENTS,
  DEFAULT_SEO_TOP_LISTINGS,
} from '../shared/seoDiscoverySeed.js';

const PUBLIC_SITE_ORIGIN = 'https://www.localisy.in';
const LOCALITY_GEO_CENTERS: Record<string, { lat: number; lng: number }> = {
  roadpali: { lat: 19.0314, lng: 73.1028 },
  kalamboli: { lat: 19.0412, lng: 73.1025 },
  kharghar: { lat: 19.0436, lng: 73.0667 },
  kamothe: { lat: 19.0167, lng: 73.0967 },
  panvel: { lat: 18.9894, lng: 73.1175 },
  taloja: { lat: 19.0769, lng: 73.1181 },
};

const toRadians = (value: number) => (value * Math.PI) / 180;
const getDistanceInKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a = (
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2
  );
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const resolveBusinessPincode = (business: Business): string => {
  if (business.pincode && /^\d{6}$/.test(business.pincode)) return business.pincode;
  return MASTER_AREAS.find((area) => area.id === business.areaId)?.pincode || '';
};

const splitTagSource = (value: string) => (
  String(value || '')
    .split(/[|,/]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const uniqueTags = (...groups: Array<Array<string | undefined>>) => {
  const seen = new Set<string>();
  const tags: string[] = [];
  groups.flat().forEach((entry) => {
    const trimmed = String(entry || '').trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(trimmed);
  });
  return tags.slice(0, 25);
};

const isValidCategoryId = (categoryId: string) => BUSINESS_CATEGORIES.some((category) => category.id === categoryId);
const isValidSubcategoryId = (categoryId: string, subcategoryId: string) => BUSINESS_SUBCATEGORIES.some((subcategory) => (
  subcategory.categoryId === categoryId && subcategory.id === subcategoryId
));

const buildBusinessTags = (business: Partial<Business>) => {
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

const isBusinessTaxonomyMapped = (business: Partial<Business>) => (
  isValidCategoryId(business.categoryId || '') &&
  isValidSubcategoryId(business.categoryId || '', business.subcategoryId || '')
);

const normalizeBusinessTaxonomy = (business: Business): Business => {
  const categoryId = resolveMasterCategoryId(business.categoryId || '');
  const validCategory = isValidCategoryId(categoryId);
  const validSubcategory = isValidSubcategoryId(categoryId, business.subcategoryId || '');
  const shouldDefaultSubcategory = validCategory && !validSubcategory && !String(business.sourceSubcategoryLabel || '').trim();
  const normalizedCategoryId = validCategory ? categoryId : '';
  const normalizedSubcategoryId = validCategory
    ? (
        validSubcategory
          ? (business.subcategoryId || '')
          : (shouldDefaultSubcategory ? resolveDefaultSubcategoryId(categoryId) : '')
      )
    : '';
  return {
    ...business,
    categoryId: normalizedCategoryId,
    subcategoryId: normalizedSubcategoryId,
    taxonomyMapped: normalizedCategoryId !== '' && normalizedSubcategoryId !== '',
    pincode: resolveBusinessPincode({ ...business, categoryId: normalizedCategoryId }),
    tags: buildBusinessTags({
      ...business,
      categoryId: normalizedCategoryId,
      subcategoryId: normalizedSubcategoryId,
    })
  };
};

const normalizeStoredBusiness = (business: Business): Business => {
  const sanitizedBusiness: Business = {
    ...business,
    name: String(business.name || '').trim(),
    categoryId: String(business.categoryId || '').trim(),
    subcategoryId: String(business.subcategoryId || '').trim(),
    sourceCategoryLabel: business.sourceCategoryLabel ? String(business.sourceCategoryLabel).trim() : undefined,
    sourceSubcategoryLabel: business.sourceSubcategoryLabel ? String(business.sourceSubcategoryLabel).trim() : undefined,
    address: String(business.address || '').trim(),
    phone: String(business.phone || '').trim(),
    website: String(business.website || '').trim(),
    description: String(business.description || '').trim(),
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
  };
  const normalized = normalizeBusinessTaxonomy(sanitizedBusiness);
  const isUploadedListing =
    normalized.id.startsWith('csv_') ||
    normalized.id.startsWith('b_dynamic_') ||
    normalized.ownerName === 'Imported via CSV';

  return isUploadedListing && normalized.status === 'pending'
    ? { ...normalized, status: 'approved' }
    : normalized;
};

const mergeBusinessCollections = (base: Business[], incoming: Business[]): Business[] => {
  const merged = new Map<string, Business>();
  base.forEach((business) => merged.set(business.id, normalizeStoredBusiness(business)));
  incoming.forEach((business) => merged.set(business.id, normalizeStoredBusiness(business)));
  return Array.from(merged.values());
};

type LocalityCategoryLink = {
  id: string;
  localityId: string;
  categoryId: string;
  subcategoryId?: string;
  slug: string;
};

const DEFAULT_API_CONFIGURATION: ApiConfiguration = {
  syncMode: 'api',
  homepageConfigEndpoint: '/api/homepage-config',
  adLeadsEndpoint: '/api/ad-leads',
  homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
  localityRoutingConfigEndpoint: '/api/locality-routing-config',
  geographyConfigEndpoint: '/api/geography-config',
  taxonomyConfigEndpoint: '/api/business-taxonomy',
  seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
  scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
  resolvedHomepageEndpoint: '/api/resolved-homepage',
  publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
  businessesEndpoint: '/api/businesses',
  auditEventsEndpoint: '/api/audit-events',
  autoSyncHomepage: true,
  autoSyncBusinesses: true
};

const slugifyForUrl = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const normalizeStringList = (value: unknown): string[] => (
  Array.isArray(value)
    ? value
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
    : []
);

const getTodayIso = () => new Date().toISOString().slice(0, 10);
const AUDIT_EVENT_DEDUPE_MS = 15_000;
const AUDIT_EVENT_SEARCH_DEDUPE_MS = 20_000;
const AUDIT_EVENT_AUTOMATION_DEDUPE_MS = 180_000;
const AUDIT_EVENT_AUTOMATION_SERVER_COOLDOWN_MS = 60_000;

const isLikelyAutomatedClient = () => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver) || /(bot|crawler|spider|zap|headless|lighthouse|playwright|puppeteer|phantom|selenium)/i.test(userAgent);
};

const normalizeApiConfiguration = (value?: Partial<ApiConfiguration> | null): ApiConfiguration => ({
  syncMode: value?.syncMode === 'local' ? 'local' : 'api',
  homepageConfigEndpoint: value?.homepageConfigEndpoint || DEFAULT_API_CONFIGURATION.homepageConfigEndpoint,
  adLeadsEndpoint: value?.adLeadsEndpoint || DEFAULT_API_CONFIGURATION.adLeadsEndpoint,
  homepageDefaultsConfigEndpoint: value?.homepageDefaultsConfigEndpoint || DEFAULT_API_CONFIGURATION.homepageDefaultsConfigEndpoint,
  localityRoutingConfigEndpoint: value?.localityRoutingConfigEndpoint || DEFAULT_API_CONFIGURATION.localityRoutingConfigEndpoint,
  geographyConfigEndpoint: value?.geographyConfigEndpoint || DEFAULT_API_CONFIGURATION.geographyConfigEndpoint,
  taxonomyConfigEndpoint: value?.taxonomyConfigEndpoint || DEFAULT_API_CONFIGURATION.taxonomyConfigEndpoint,
  seoDiscoveryConfigEndpoint: value?.seoDiscoveryConfigEndpoint || DEFAULT_API_CONFIGURATION.seoDiscoveryConfigEndpoint,
  scalableHomepageConfigEndpoint: value?.scalableHomepageConfigEndpoint || DEFAULT_API_CONFIGURATION.scalableHomepageConfigEndpoint,
  resolvedHomepageEndpoint: value?.resolvedHomepageEndpoint || DEFAULT_API_CONFIGURATION.resolvedHomepageEndpoint,
  publishResolvedHomepageEndpoint: value?.publishResolvedHomepageEndpoint || DEFAULT_API_CONFIGURATION.publishResolvedHomepageEndpoint,
  businessesEndpoint: value?.businessesEndpoint || DEFAULT_API_CONFIGURATION.businessesEndpoint,
  auditEventsEndpoint: value?.auditEventsEndpoint || DEFAULT_API_CONFIGURATION.auditEventsEndpoint,
  autoSyncHomepage: value?.autoSyncHomepage ?? DEFAULT_API_CONFIGURATION.autoSyncHomepage,
  autoSyncBusinesses: value?.autoSyncBusinesses ?? DEFAULT_API_CONFIGURATION.autoSyncBusinesses,
  lastHomepageSyncAt: value?.lastHomepageSyncAt,
  lastBusinessesSyncAt: value?.lastBusinessesSyncAt
});

const readPersistedApiConfiguration = (): ApiConfiguration => {
  if (typeof window === 'undefined') return DEFAULT_API_CONFIGURATION;
  const saved = window.localStorage.getItem('yp_api_configuration');
  if (!saved) return DEFAULT_API_CONFIGURATION;
  try {
    return normalizeApiConfiguration(JSON.parse(saved));
  } catch {
    window.localStorage.removeItem('yp_api_configuration');
    return DEFAULT_API_CONFIGURATION;
  }
};

const getPersistableApiConfiguration = (value: ApiConfiguration): ApiConfiguration => ({
  ...normalizeApiConfiguration(value),
  lastHomepageSyncAt: undefined,
  lastBusinessesSyncAt: undefined
});

const normalizeStoredLocality = (locality: Locality): Locality => ({
  ...locality,
  id: String(locality.id || '').trim(),
  name: String(locality.name || '').trim(),
  slug: String(locality.slug || locality.id || '').trim(),
  subdomain: String(locality.subdomain || '').trim(),
  description: String(locality.description || '').trim(),
  status: locality.status === 'inactive' ? 'inactive' : 'active',
  coverImage: String(locality.coverImage || '').trim(),
  stats: {
    numBusinesses: Number(locality.stats?.numBusinesses || 0),
    numPending: Number(locality.stats?.numPending || 0),
  },
  carouselImages: Array.isArray(locality.carouselImages)
    ? locality.carouselImages.map((image) => String(image || '').trim()).filter(Boolean)
    : [],
});

const normalizeStoredSubdomain = (subdomain: SubdomainMapping): SubdomainMapping => ({
  domain: String(subdomain.domain || '').trim(),
  localityId: String(subdomain.localityId || '').trim(),
  sslEnabled: Boolean(subdomain.sslEnabled),
  dnsStatus: subdomain.dnsStatus === 'pending' || subdomain.dnsStatus === 'failed' ? subdomain.dnsStatus : 'active',
  createdAt: String(subdomain.createdAt || new Date().toISOString()),
});

const normalizeStoredPincodeMapping = (mapping: PincodeRoutingMapping): PincodeRoutingMapping => ({
  pincode: String(mapping.pincode || '').replace(/\D/g, '').slice(0, 6),
  localityId: String(mapping.localityId || '').trim(),
});

const normalizeLocalityRoutingConfigState = (
  value?: Partial<LocalityRoutingConfigState> | null,
): LocalityRoutingConfigState => {
  const fallbackLocalities = (DEFAULT_LOCALITIES as Locality[]).map(normalizeStoredLocality);
  const localities = Array.isArray(value?.localities)
    ? value.localities.map(normalizeStoredLocality).filter((locality) => locality.id && locality.name)
    : fallbackLocalities;
  const localityIds = new Set(localities.map((locality) => locality.id));
  const subdomains = Array.isArray(value?.subdomains)
    ? value.subdomains
        .map(normalizeStoredSubdomain)
        .filter((subdomain) => subdomain.domain && localityIds.has(subdomain.localityId))
    : (buildDefaultSubdomainMappings(localities as unknown as typeof DEFAULT_LOCALITIES) as SubdomainMapping[]).map(normalizeStoredSubdomain);
  const pincodeMappings = Array.isArray(value?.pincodeMappings)
    ? value.pincodeMappings
        .map(normalizeStoredPincodeMapping)
        .filter((mapping) => mapping.pincode && localityIds.has(mapping.localityId))
    : (DEFAULT_PINCODE_MAPPINGS as PincodeRoutingMapping[]).map(normalizeStoredPincodeMapping);
  const defaultLocalityId = localityIds.has(String(value?.defaultLocalityId || ''))
    ? String(value?.defaultLocalityId)
    : (localities[0]?.id || DEFAULT_LOCALITY_ID);
  return {
    localities,
    subdomains,
    pincodeMappings,
    defaultLocalityId,
    metadata: {
      seededFromCode: value?.metadata?.seededFromCode ?? true,
      updatedAt: value?.metadata?.updatedAt || new Date().toISOString(),
    },
  };
};

const normalizeStoredState = (state: StateMaster): StateMaster => ({
  id: String(state.id || '').trim(),
  name: String(state.name || '').trim(),
});

const normalizeStoredCity = (city: CityMaster): CityMaster => ({
  id: String(city.id || '').trim(),
  stateId: String(city.stateId || '').trim(),
  name: String(city.name || '').trim(),
});

const normalizeStoredArea = (area: AreaMaster): AreaMaster => ({
  id: String(area.id || '').trim(),
  cityId: String(area.cityId || '').trim(),
  name: String(area.name || '').trim(),
  pincode: String(area.pincode || '').replace(/\D/g, '').slice(0, 6),
});

const normalizeGeographyConfigState = (
  value?: Partial<GeographyConfigState> | null,
): GeographyConfigState => {
  const states = Array.isArray(value?.states)
    ? value.states.map(normalizeStoredState).filter((state) => state.id && state.name)
    : [...MASTER_STATES].map(normalizeStoredState);
  const stateIds = new Set(states.map((state) => state.id));
  const cities = Array.isArray(value?.cities)
    ? value.cities.map(normalizeStoredCity).filter((city) => city.id && city.name && stateIds.has(city.stateId))
    : [...MASTER_CITIES].map(normalizeStoredCity);
  const cityIds = new Set(cities.map((city) => city.id));
  const areas = Array.isArray(value?.areas)
    ? value.areas.map(normalizeStoredArea).filter((area) => area.id && area.name && area.pincode && cityIds.has(area.cityId))
    : [...MASTER_AREAS].map(normalizeStoredArea);
  return {
    states,
    cities,
    areas,
    metadata: {
      seededFromCode: value?.metadata?.seededFromCode ?? true,
      updatedAt: value?.metadata?.updatedAt || new Date().toISOString(),
    },
  };
};

const formatValidationExamples = (entries: string[], limit = 3) => {
  if (entries.length <= limit) return entries.join(', ');
  return `${entries.slice(0, limit).join(', ')} +${entries.length - limit} more`;
};

const validateGeographyConfigForOperations = (
  config: GeographyConfigState,
  businesses: Business[],
  pincodeMappings: PincodeRoutingMapping[],
) => {
  const errors: string[] = [];
  const seenStateNames = new Map<string, string>();
  const seenCityNames = new Map<string, string>();
  const seenAreaNames = new Map<string, string>();
  const stateIds = new Set<string>();
  const cityIds = new Set<string>();
  const areaIds = new Set<string>();

  const duplicateStateIds = config.states
    .map((state) => state.id)
    .filter((id, index, values) => values.indexOf(id) !== index);
  if (duplicateStateIds.length > 0) {
    errors.push(`Duplicate state IDs are not allowed: ${formatValidationExamples([...new Set(duplicateStateIds)])}.`);
  }

  const duplicateCityIds = config.cities
    .map((city) => city.id)
    .filter((id, index, values) => values.indexOf(id) !== index);
  if (duplicateCityIds.length > 0) {
    errors.push(`Duplicate city IDs are not allowed: ${formatValidationExamples([...new Set(duplicateCityIds)])}.`);
  }

  const duplicateAreaIds = config.areas
    .map((area) => area.id)
    .filter((id, index, values) => values.indexOf(id) !== index);
  if (duplicateAreaIds.length > 0) {
    errors.push(`Duplicate area IDs are not allowed: ${formatValidationExamples([...new Set(duplicateAreaIds)])}.`);
  }

  for (const state of config.states) {
    stateIds.add(state.id);
    const key = slugifyForUrl(state.name);
    const existing = seenStateNames.get(key);
    if (existing && existing !== state.id) {
      errors.push(`State name "${state.name}" is duplicated. Keep state names unique.`);
      break;
    }
    seenStateNames.set(key, state.id);
  }

  for (const city of config.cities) {
    cityIds.add(city.id);
    if (!stateIds.has(city.stateId)) {
      errors.push(`City "${city.name}" points to missing state "${city.stateId}".`);
    }
    const key = `${city.stateId}::${slugifyForUrl(city.name)}`;
    const existing = seenCityNames.get(key);
    if (existing && existing !== city.id) {
      errors.push(`City name "${city.name}" is duplicated inside the same state.`);
      break;
    }
    seenCityNames.set(key, city.id);
  }

  for (const area of config.areas) {
    areaIds.add(area.id);
    if (!cityIds.has(area.cityId)) {
      errors.push(`Area "${area.name}" points to missing city "${area.cityId}".`);
    }
    if (!/^\d{6}$/.test(area.pincode)) {
      errors.push(`Area "${area.name}" must have a valid 6-digit pincode.`);
    }
    const key = `${area.cityId}::${slugifyForUrl(area.name)}`;
    const existing = seenAreaNames.get(key);
    if (existing && existing !== area.id) {
      errors.push(`Area name "${area.name}" is duplicated inside the same city.`);
      break;
    }
    seenAreaNames.set(key, area.id);
  }

  const cityLookup = new Map(config.cities.map((city) => [city.id, city]));
  const areaLookup = new Map(config.areas.map((area) => [area.id, area]));
  const pincodeLocalityLookup = new Map(pincodeMappings.map((mapping) => [mapping.pincode, mapping.localityId]));

  const missingPrimaryGeoBusinesses = businesses
    .filter((business) => !stateIds.has(business.stateId) || !cityIds.has(business.cityId) || !areaIds.has(business.areaId))
    .map((business) => business.name);
  if (missingPrimaryGeoBusinesses.length > 0) {
    errors.push(`These listings would lose their primary geography mapping: ${formatValidationExamples(missingPrimaryGeoBusinesses)}.`);
  }

  const missingOperationalAreaBusinesses = businesses
    .filter((business) => business.areasOfOperation.some((areaId) => !areaIds.has(areaId)))
    .map((business) => business.name);
  if (missingOperationalAreaBusinesses.length > 0) {
    errors.push(`These listings reference areas of operation that would be removed: ${formatValidationExamples(missingOperationalAreaBusinesses)}.`);
  }

  const mismatchedAreaChainBusinesses = businesses
    .filter((business) => {
      const area = areaLookup.get(business.areaId);
      const city = cityLookup.get(business.cityId);
      if (!area || !city) return false;
      return area.cityId !== business.cityId || city.stateId !== business.stateId;
    })
    .map((business) => business.name);
  if (mismatchedAreaChainBusinesses.length > 0) {
    errors.push(`These listings would no longer match their state/city/area hierarchy: ${formatValidationExamples(mismatchedAreaChainBusinesses)}.`);
  }

  const localityMismatchBusinesses = businesses
    .filter((business) => {
      const area = areaLookup.get(business.areaId);
      const resolvedPincode = String(business.pincode || area?.pincode || '').trim();
      if (!resolvedPincode) return false;
      const mappedLocalityId = pincodeLocalityLookup.get(resolvedPincode);
      return Boolean(mappedLocalityId) && mappedLocalityId !== business.localityId;
    })
    .map((business) => business.name);
  if (localityMismatchBusinesses.length > 0) {
    errors.push(`These listings would conflict with locality-pincode routing rules: ${formatValidationExamples(localityMismatchBusinesses)}.`);
  }

  return errors;
};

const normalizeFallbackListingAdTemplate = (
  ad: Partial<FallbackListingAdTemplate>,
  index: number,
): FallbackListingAdTemplate => ({
  id: String(ad.id || `fallback_ad_${index + 1}`).trim(),
  title: String(ad.title || `Fallback Ad ${index + 1}`).trim(),
  description: String(ad.description || '').trim(),
  badge: String(ad.badge || 'Advertisement').trim(),
  ctaText: String(ad.ctaText || 'Learn More').trim(),
  backgroundColor: String(ad.backgroundColor || '#eef2ff').trim(),
  imageUrl: ad.imageUrl ? String(ad.imageUrl).trim() : undefined,
  actionType: ad.actionType === 'landing_page' || ad.actionType === 'landing_listing' || ad.actionType === 'lead_form'
    ? ad.actionType
    : 'landing_page',
  targetUrl: ad.targetUrl ? String(ad.targetUrl).trim() : undefined,
  targetCategoryId: ad.targetCategoryId ? String(ad.targetCategoryId).trim() : undefined,
  categoryIds: normalizeStringList(ad.categoryIds),
  tags: normalizeStringList(ad.tags),
  placementKey: ad.placementKey ? String(ad.placementKey).trim() : undefined,
  deviceTarget: ad.deviceTarget === 'desktop' || ad.deviceTarget === 'mobile' ? ad.deviceTarget : 'all',
  mobileRowPosition: Number.isFinite(Number(ad.mobileRowPosition)) ? Number(ad.mobileRowPosition) : undefined,
});

const DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS: HeroBannerDraftDefaults = {
  ctaLabel: String(DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaLabel || 'Explore Businesses'),
  ctaType: (
    DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaType === 'landing_page' ||
    DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaType === 'landing_listing' ||
    DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaType === 'lead_form' ||
    DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaType === 'search_category'
  )
    ? DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaType
    : 'search_category',
  ctaTarget: String(DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaTarget || 'all'),
  durationDays: Math.max(1, Number(DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.durationDays || 30)),
};

const DEFAULT_MANAGED_HERO_STAT_TEMPLATES: HeroBannerStat[] = (DEFAULT_HERO_STAT_TEMPLATES as HeroBannerStat[]).map((stat) => ({
  enabled: stat.enabled ?? true,
  label: String(stat.label || '').trim(),
  value: String(stat.value || '').trim(),
  localityIds: normalizeStringList(stat.localityIds),
  pincodes: normalizeStringList(stat.pincodes),
}));

const normalizeHeroBannerDraftDefaults = (
  value?: Partial<HeroBannerDraftDefaults> | null,
): HeroBannerDraftDefaults => ({
  ctaLabel: String(value?.ctaLabel || DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS.ctaLabel).trim() || DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS.ctaLabel,
  ctaType: value?.ctaType === 'landing_page' || value?.ctaType === 'landing_listing' || value?.ctaType === 'lead_form' || value?.ctaType === 'search_category'
    ? value.ctaType
    : DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS.ctaType,
  ctaTarget: String(value?.ctaTarget || DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS.ctaTarget).trim() || DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS.ctaTarget,
  durationDays: Math.max(1, Number.isFinite(Number(value?.durationDays)) ? Number(value?.durationDays) : DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS.durationDays),
});

const normalizeHeroStatTemplate = (
  stat: Partial<HeroBannerStat> | null | undefined,
  index: number,
): HeroBannerStat => {
  const fallback = DEFAULT_MANAGED_HERO_STAT_TEMPLATES[index] || DEFAULT_MANAGED_HERO_STAT_TEMPLATES[0];
  return {
    enabled: stat?.enabled ?? fallback.enabled ?? true,
    label: String(stat?.label || fallback.label || `Stat ${index + 1}`).trim(),
    value: String(stat?.value || fallback.value || '').trim(),
    localityIds: normalizeStringList(stat?.localityIds),
    pincodes: normalizeStringList(stat?.pincodes),
  };
};

const normalizeHomepageCategoryShortcut = (
  shortcut: { label?: string; categoryId?: string; subcategoryId?: string } | null | undefined,
): { label: string; categoryId: string; subcategoryId?: string } => ({
  label: String(shortcut?.label || '').trim(),
  categoryId: String(shortcut?.categoryId || '').trim(),
  subcategoryId: shortcut?.subcategoryId ? String(shortcut.subcategoryId).trim() : undefined,
});

let runtimeHeroStatTemplates: HeroBannerStat[] = DEFAULT_MANAGED_HERO_STAT_TEMPLATES.map(normalizeHeroStatTemplate);
let runtimeHeroBannerDraftDefaults: HeroBannerDraftDefaults = normalizeHeroBannerDraftDefaults(DEFAULT_MANAGED_HERO_BANNER_DRAFT_DEFAULTS);

const setHomepageDefaultsRuntimeCatalog = (config?: Partial<HomepageDefaultsConfigState> | null) => {
  runtimeHeroStatTemplates = (
    Array.isArray(config?.heroStatTemplates) && config.heroStatTemplates.length > 0
      ? config.heroStatTemplates.map(normalizeHeroStatTemplate)
      : DEFAULT_MANAGED_HERO_STAT_TEMPLATES.map(normalizeHeroStatTemplate)
  );
  runtimeHeroBannerDraftDefaults = normalizeHeroBannerDraftDefaults(config?.heroBannerDraftDefaults);
};

const getRuntimeHeroStatTemplates = () => runtimeHeroStatTemplates.map((stat) => ({
  ...stat,
  localityIds: [...(stat.localityIds || [])],
  pincodes: [...(stat.pincodes || [])],
}));

const getRuntimeHeroBannerDraftDefaults = (): HeroBannerDraftDefaults => ({
  ...runtimeHeroBannerDraftDefaults,
});

const normalizeHomepageDefaultsConfigState = (
  value?: Partial<HomepageDefaultsConfigState> | null,
): HomepageDefaultsConfigState => ({
  sectionTemplates: Array.isArray(value?.sectionTemplates)
    ? value.sectionTemplates.map((section, index) => normalizeHomepageSection(section, 'template', index))
    : (DEFAULT_HOMEPAGE_SECTION_TEMPLATES as HomepageSection[]).map((section, index) => normalizeHomepageSection(section, 'template', index)),
  fallbackListingAds: Array.isArray(value?.fallbackListingAds)
    ? value.fallbackListingAds.map(normalizeFallbackListingAdTemplate)
    : (DEFAULT_FALLBACK_LISTING_AD_TEMPLATES as FallbackListingAdTemplate[]).map(normalizeFallbackListingAdTemplate),
  heroStatTemplates: Array.isArray(value?.heroStatTemplates) && value.heroStatTemplates.length > 0
    ? value.heroStatTemplates.map(normalizeHeroStatTemplate)
    : DEFAULT_MANAGED_HERO_STAT_TEMPLATES.map(normalizeHeroStatTemplate),
  heroBannerDraftDefaults: normalizeHeroBannerDraftDefaults(value?.heroBannerDraftDefaults),
  heroQuickActions: Array.isArray(value?.heroQuickActions) && value.heroQuickActions.length > 0
    ? value.heroQuickActions
        .map(normalizeHomepageCategoryShortcut)
        .filter((shortcut) => shortcut.categoryId)
    : DEFAULT_HERO_QUICK_ACTIONS.map(normalizeHomepageCategoryShortcut).filter((shortcut) => shortcut.categoryId),
  searchShortcutCategoryIds: Array.isArray(value?.searchShortcutCategoryIds) && value.searchShortcutCategoryIds.length > 0
    ? normalizeStringList(value.searchShortcutCategoryIds)
    : normalizeStringList(DEFAULT_SEARCH_SHORTCUT_CATEGORY_IDS),
  metadata: {
    seededFromCode: value?.metadata?.seededFromCode ?? true,
    updatedAt: value?.metadata?.updatedAt || new Date().toISOString(),
  },
});

const normalizeSeoRouteIntent = (intent: Partial<SeoRouteIntent>, index: number): SeoRouteIntent => ({
  id: String(intent.id || intent.slug || `seo-intent-${index + 1}`).trim(),
  slug: slugifyForUrl(intent.slug || intent.q || intent.id || `seo-intent-${index + 1}`),
  categoryId: String(intent.categoryId || '').trim(),
  q: String(intent.q || '').trim(),
  labelPrefix: String(intent.labelPrefix || intent.q || '').trim(),
});

const normalizeSeoLocalityMetadata = (
  locality: Partial<SeoLocalityMetadata>,
  index: number,
): SeoLocalityMetadata => ({
  id: String(locality.id || `seo-locality-${index + 1}`).trim(),
  name: String(locality.name || locality.id || '').trim(),
  city: String(locality.city || '').trim(),
  intro: String(locality.intro || '').trim(),
  pincodes: normalizeStringList(locality.pincodes),
  subdomain: String(locality.subdomain || '').trim(),
});

const normalizeSeoCategoryLabel = (
  label: Partial<SeoCategoryLabel>,
  index: number,
): SeoCategoryLabel => ({
  categoryId: String(label.categoryId || `category-${index + 1}`).trim(),
  label: String(label.label || label.categoryId || '').trim(),
});

const normalizeSeoTopListingGroup = (
  group: Partial<SeoTopListingGroup>,
  index: number,
): SeoTopListingGroup => ({
  localityId: String(group.localityId || `locality-${index + 1}`).trim(),
  categoryId: String(group.categoryId || '').trim(),
  listingNames: normalizeStringList(group.listingNames),
});

const normalizeSeoDefaultListingGroup = (
  group: Partial<SeoDefaultListingGroup>,
  index: number,
): SeoDefaultListingGroup => ({
  categoryId: String(group.categoryId || `category-${index + 1}`).trim(),
  listingNames: normalizeStringList(group.listingNames),
});

const normalizeSeoDiscoveryConfigState = (
  value?: Partial<SeoDiscoveryConfigState> | null,
): SeoDiscoveryConfigState => ({
  routeIntents: Array.isArray(value?.routeIntents)
    ? value.routeIntents
        .map(normalizeSeoRouteIntent)
        .filter((intent) => intent.id && intent.slug && intent.categoryId && intent.q)
    : (DEFAULT_SEO_ROUTE_INTENTS as SeoRouteIntent[])
        .map(normalizeSeoRouteIntent)
        .filter((intent) => intent.id && intent.slug && intent.categoryId && intent.q),
  localityMetadata: Array.isArray(value?.localityMetadata)
    ? value.localityMetadata
        .map(normalizeSeoLocalityMetadata)
        .filter((locality) => locality.id && locality.name)
    : (DEFAULT_SEO_LOCALITY_METADATA as SeoLocalityMetadata[])
        .map(normalizeSeoLocalityMetadata)
        .filter((locality) => locality.id && locality.name),
  categoryLabels: Array.isArray(value?.categoryLabels)
    ? value.categoryLabels
        .map(normalizeSeoCategoryLabel)
        .filter((label) => label.categoryId && label.label)
    : (DEFAULT_SEO_CATEGORY_LABELS as SeoCategoryLabel[])
        .map(normalizeSeoCategoryLabel)
        .filter((label) => label.categoryId && label.label),
  topListings: Array.isArray(value?.topListings)
    ? value.topListings
        .map(normalizeSeoTopListingGroup)
        .filter((group) => group.localityId && group.categoryId && group.listingNames.length > 0)
    : (DEFAULT_SEO_TOP_LISTINGS as SeoTopListingGroup[])
        .map(normalizeSeoTopListingGroup)
        .filter((group) => group.localityId && group.categoryId && group.listingNames.length > 0),
  defaultListingNames: Array.isArray(value?.defaultListingNames)
    ? value.defaultListingNames
        .map(normalizeSeoDefaultListingGroup)
        .filter((group) => group.categoryId && group.listingNames.length > 0)
    : (DEFAULT_SEO_DEFAULT_LISTING_NAMES as SeoDefaultListingGroup[])
        .map(normalizeSeoDefaultListingGroup)
        .filter((group) => group.categoryId && group.listingNames.length > 0),
  metadata: {
    seededFromCode: value?.metadata?.seededFromCode ?? true,
    updatedAt: value?.metadata?.updatedAt || new Date().toISOString(),
  },
});

const PORTAL_CATEGORY_TONES = [
  'bg-emerald-500/10 text-emerald-600',
  'bg-indigo-500/10 text-indigo-600',
  'bg-amber-500/10 text-amber-600',
  'bg-rose-500/10 text-rose-600',
  'bg-orange-500/10 text-orange-600',
  'bg-sky-500/10 text-sky-600',
  'bg-pink-500/10 text-pink-600',
  'bg-cyan-500/10 text-cyan-600',
];

const normalizeBusinessCategory = (category: Partial<BusinessCategory>, index: number): BusinessCategory => ({
  id: String(category.id || category.slug || `category-${index + 1}`).trim(),
  legacyId: Number.isFinite(Number(category.legacyId)) ? Number(category.legacyId) : index + 1,
  name: String(category.name || category.id || '').trim(),
  slug: String(category.slug || category.id || `category-${index + 1}`).trim(),
  icon: String(category.icon || 'category_icon').trim(),
  status: category.status === 'inactive' ? 'inactive' : 'active',
  sortOrder: Number.isFinite(Number(category.sortOrder)) ? Number(category.sortOrder) : index + 1,
});

const normalizeBusinessSubcategory = (subcategory: Partial<BusinessSubcategory>, index: number): BusinessSubcategory => ({
  id: String(subcategory.id || subcategory.slug || `subcategory-${index + 1}`).trim(),
  legacyId: Number.isFinite(Number(subcategory.legacyId)) ? Number(subcategory.legacyId) : index + 1,
  parentLegacyId: Number.isFinite(Number(subcategory.parentLegacyId)) ? Number(subcategory.parentLegacyId) : index + 1,
  categoryId: String(subcategory.categoryId || '').trim(),
  name: String(subcategory.name || subcategory.id || '').trim(),
  slug: String(subcategory.slug || subcategory.id || `subcategory-${index + 1}`).trim(),
  icon: String(subcategory.icon || 'subcategory_icon').trim(),
  status: subcategory.status === 'inactive' ? 'inactive' : 'active',
  sortOrder: Number.isFinite(Number(subcategory.sortOrder)) ? Number(subcategory.sortOrder) : index + 1,
});

const normalizeBusinessTaxonomyState = (value?: Partial<BusinessTaxonomyState> | null): BusinessTaxonomyState => {
  const categories = Array.isArray(value?.categories)
    ? value.categories.map(normalizeBusinessCategory).filter((category) => category.id && category.name)
    : [...BUSINESS_CATEGORIES].map(normalizeBusinessCategory);
  const categoryIds = new Set(categories.map((category) => category.id));
  const subcategories = Array.isArray(value?.subcategories)
    ? value.subcategories
        .map(normalizeBusinessSubcategory)
        .filter((subcategory) => subcategory.id && subcategory.name && categoryIds.has(subcategory.categoryId))
    : [...BUSINESS_SUBCATEGORIES].map(normalizeBusinessSubcategory);
  return {
    categories: [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    subcategories: [...subcategories].sort((a, b) => {
      if (a.categoryId !== b.categoryId) return a.categoryId.localeCompare(b.categoryId);
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    }),
    metadata: {
      seededFromCode: value?.metadata?.seededFromCode ?? true,
      updatedAt: value?.metadata?.updatedAt || new Date().toISOString(),
    },
  };
};

const buildPortalCategories = (categories: BusinessCategory[]) => ([
  { id: 'all', name: 'All Categories', icon: 'Grid', color: PORTAL_CATEGORY_TONES[0] },
  ...categories
    .filter((category) => category.status === 'active')
    .slice(0, 8)
    .map((category, index) => ({
      id: category.id,
      name: category.name,
      icon: category.icon || 'Grid',
      color: PORTAL_CATEGORY_TONES[(index + 1) % PORTAL_CATEGORY_TONES.length],
    })),
]);

const normalizeStoredCoupon = (coupon: MarketingCoupon): MarketingCoupon => {
  const endDate = coupon.endDate || coupon.expiryDate || getTodayIso();
  return {
    ...coupon,
    title: coupon.title || coupon.description || coupon.code,
    startDate: coupon.startDate || getTodayIso(),
    expiryDate: endDate,
    endDate,
    isActive: coupon.isActive ?? true,
    localityIds: normalizeStringList(coupon.localityIds),
    pincodes: normalizeStringList(coupon.pincodes),
    categoryIds: normalizeStringList(coupon.categoryIds),
    badgeText: coupon.badgeText || coupon.discount,
    ctaText: coupon.ctaText || 'Claim Offer',
    targetBusinessId: coupon.targetBusinessId || coupon.businessId
  };
};

const normalizeStoredListingAd = (ad: ListingAd): ListingAd => ({
  ...ad,
  localityIds: normalizeStringList(ad.localityIds),
  pincodes: normalizeStringList(ad.pincodes),
  categoryIds: normalizeStringList(ad.categoryIds),
  tags: normalizeStringList(ad.tags),
  placementKey: ad.placementKey || 'homepage_inline_primary',
  deviceTarget: ad.deviceTarget || 'all',
  imageUrl: ad.imageUrl?.trim() || undefined,
  mobileRowPosition: ad.mobileRowPosition && ad.mobileRowPosition > 0 ? ad.mobileRowPosition : undefined
});

const normalizeStoredHeroStat = (stat: HeroBannerStat | null | undefined, index: number): HeroBannerStat => {
  const fallback = runtimeHeroStatTemplates[index] || runtimeHeroStatTemplates[0] || normalizeHeroStatTemplate(null, index);
  return {
    enabled: stat?.enabled ?? true,
    label: String(stat?.label || fallback.label),
    value: String(stat?.value || fallback.value),
    localityIds: normalizeStringList(stat?.localityIds),
    pincodes: normalizeStringList(stat?.pincodes)
  };
};

const normalizeStoredHeroBanner = (banner: HeroBanner): HeroBanner => ({
  ...banner,
  ctaLabel: banner.ctaLabel || getRuntimeHeroBannerDraftDefaults().ctaLabel,
  ctaType: banner.ctaType || getRuntimeHeroBannerDraftDefaults().ctaType,
  ctaTarget: banner.ctaTarget || getRuntimeHeroBannerDraftDefaults().ctaTarget,
  pincodes: normalizeStringList(banner.pincodes),
  heroStats: Array.isArray(banner.heroStats)
    ? banner.heroStats.map((stat, index) => normalizeStoredHeroStat(stat, index))
    : undefined
});

const normalizeStoredCommunityItem = (item: CommunityItem): CommunityItem => {
  const nowIso = new Date().toISOString();
  const publishAt = item.publishAt || item.createdAt || nowIso;
  const status = item.status || (
    item.expireAt && Date.parse(item.expireAt) < Date.now()
      ? 'archived'
      : item.publishAt && Date.parse(item.publishAt) > Date.now()
        ? 'scheduled'
        : 'published'
  );

  return {
    ...item,
    image: item.image?.trim() || undefined,
    status,
    publishAt,
    expireAt: item.expireAt || undefined
  };
};

const normalizeStoredAdLead = (lead: AdLead): AdLead => ({
  ...lead,
  id: String(lead.id || '').trim(),
  adId: String(lead.adId || '').trim(),
  sellerBusinessId: lead.sellerBusinessId ? String(lead.sellerBusinessId).trim() : undefined,
  localityId: String(lead.localityId || '').trim(),
  name: String(lead.name || '').trim(),
  mobile: String(lead.mobile || '').trim(),
  pincode: String(lead.pincode || '').trim(),
  createdAt: lead.createdAt || new Date().toISOString(),
});

const getSectionLabel = (sectionType: HomepageSectionType) => {
  switch (sectionType) {
    case 'hero_banner':
      return 'Hero Banner';
    case 'search_discovery':
      return 'Search & Discovery';
    case 'emergency_grid':
      return 'Emergency Services';
    case 'promo_banner':
      return 'Promo Banner';
    case 'featured_businesses':
      return 'Featured Businesses';
    case 'business_shelf':
      return 'Business Shelf';
    case 'text_business_strip':
      return 'Compact Service Strip';
    case 'offers_list':
      return 'Offers & Deals';
    case 'updates_feed':
      return 'Locality Updates';
    case 'category_grid':
      return 'Category Grid';
    case 'verified_business_grid':
      return 'Verified Businesses';
    case 'trust_strip':
      return 'Trust Strip';
    default:
      return 'Homepage Section';
  }
};

const normalizeHomepageSection = (
  section: HomepageSection,
  localityId: string,
  index: number
): HomepageSection => ({
  ...section,
  id: section.id || `home_section_${localityId}_${index + 1}`,
  title: section.title || getSectionLabel(section.sectionType),
  status: section.status || 'active',
  visible: section.visible ?? true,
  sortOrder: section.sortOrder ?? (index + 1) * 10,
  localityIds: normalizeStringList(section.localityIds).length > 0
    ? normalizeStringList(section.localityIds)
    : [localityId],
  pincodes: normalizeStringList(section.pincodes),
  categoryIds: normalizeStringList(section.categoryIds),
  ctaType: section.ctaType || 'none',
  showViewAll: section.showViewAll ?? true,
  maxItems: section.maxItems ?? (section.sectionType === 'verified_business_grid' ? 9 : 6),
  visibleSlots: section.visibleSlots ?? section.maxItems ?? (section.sectionType === 'verified_business_grid' ? 6 : 4),
  desktopCardCount: section.desktopCardCount ?? section.visibleSlots ?? (section.sectionType === 'verified_business_grid' ? 5 : section.sectionType === 'featured_businesses' ? 3 : 4),
  mobileCardCount: section.mobileCardCount ?? 2,
  mobileDisplayMode: section.mobileDisplayMode || (section.sectionType === 'verified_business_grid' ? 'stack' : 'carousel'),
  listingSourceMode: section.listingSourceMode || 'auto',
  pinnedBusinessIds: normalizeStringList(section.pinnedBusinessIds),
  autoRotate: section.autoRotate ?? true,
  rotationIntervalSec: section.rotationIntervalSec ?? 3
});

const reindexHomepageSections = (sections: HomepageSection[]) => (
  [...sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section, index) => ({
      ...section,
      sortOrder: (index + 1) * 10
    }))
);

const applyHomepageSectionOrder = (sections: HomepageSection[]) => (
  [...sections].map((section, index) => ({
    ...section,
    sortOrder: (index + 1) * 10,
  }))
);

const instantiateHomepageTemplateSections = (
  locality: Locality,
  templates: HomepageSection[],
): HomepageSection[] => {
  const localityName = locality.name.split(',')[0];
  return reindexHomepageSections(
    templates.map((template, index) => normalizeHomepageSection({
      ...template,
      id: `home_${locality.id}_${template.id || template.sectionType || index + 1}`,
      title: template.sectionType === 'hero_banner' && template.title === 'Hero'
        ? `Hero: ${localityName}`
        : template.sectionType === 'updates_feed' && template.title === 'Locality Updates'
          ? `${localityName} Updates`
          : template.title,
      subtitle: template.sectionType === 'hero_banner' && template.subtitle === 'Primary visual banner for this locality'
        ? `Primary visual banner for ${localityName}`
        : template.subtitle,
      startDate: template.sectionType === 'hero_banner' ? (template.startDate || getTodayIso()) : template.startDate,
      localityIds: [locality.id],
    } as HomepageSection, locality.id, index))
  );
};

const buildDefaultHomepageLayout = (
  locality: Locality,
  sectionTemplates: HomepageSection[] = DEFAULT_HOMEPAGE_SECTION_TEMPLATES as HomepageSection[],
): HomepageLayout => {
  const localityName = locality.name.split(',')[0];
  const sections = instantiateHomepageTemplateSections(locality, sectionTemplates);

  return {
    id: `homepage_${locality.id}`,
    localityId: locality.id,
    name: `${localityName} Homepage`,
    status: 'active',
    visible: true,
    sections,
    updatedAt: new Date().toISOString()
  };
};

const normalizeHomepageLayout = (
  layout: HomepageLayout,
  localities: Locality[],
  sectionTemplates: HomepageSection[] = DEFAULT_HOMEPAGE_SECTION_TEMPLATES as HomepageSection[],
): HomepageLayout => {
  const locality = localities.find((entry) => entry.id === layout.localityId);
  const fallbackLocality = locality || localities[0];
  const defaultSections = fallbackLocality ? buildDefaultHomepageLayout(fallbackLocality, sectionTemplates).sections : [];
  const hasExplicitSections = Array.isArray(layout.sections);
  const sourceSections = hasExplicitSections ? layout.sections : defaultSections;
  const normalizedSections = reindexHomepageSections(
    (sourceSections || []).map((section, index) => normalizeHomepageSection(section, layout.localityId, index))
  );
  return {
    ...layout,
    id: layout.id || `homepage_${layout.localityId}`,
    name: layout.name || `${fallbackLocality?.name.split(',')[0] || layout.localityId} Homepage`,
    status: layout.status || 'active',
    visible: layout.visible ?? true,
    sections: normalizedSections,
    updatedAt: layout.updatedAt || new Date().toISOString()
  };
};

const ensureHomepageLayouts = (
  layouts: HomepageLayout[],
  localities: Locality[],
  sectionTemplates: HomepageSection[] = DEFAULT_HOMEPAGE_SECTION_TEMPLATES as HomepageSection[],
): HomepageLayout[] => {
  const normalizedLayouts = layouts.map((layout) => normalizeHomepageLayout(layout, localities, sectionTemplates));
  const existingLocalityIds = new Set(normalizedLayouts.map((layout) => layout.localityId));
  const missingLayouts = localities
    .filter((locality) => !existingLocalityIds.has(locality.id))
    .map((locality) => buildDefaultHomepageLayout(locality, sectionTemplates));
  return [...normalizedLayouts, ...missingLayouts];
};

const normalizeHomepageConfigState = (
  value: Partial<HomepageConfigState> | null | undefined,
  localities: Locality[],
  sectionTemplates: HomepageSection[] = DEFAULT_HOMEPAGE_SECTION_TEMPLATES as HomepageSection[],
): HomepageConfigState => ({
  heroBanners: Array.isArray(value?.heroBanners) ? value!.heroBanners.map(normalizeStoredHeroBanner) : [],
  listingAds: Array.isArray(value?.listingAds) ? value!.listingAds.map(normalizeStoredListingAd) : [],
  coupons: Array.isArray(value?.coupons) ? value!.coupons.map(normalizeStoredCoupon) : [],
  homepageLayouts: ensureHomepageLayouts(Array.isArray(value?.homepageLayouts) ? value!.homepageLayouts : [], localities, sectionTemplates),
  localityCategoryLinks: Array.isArray(value?.localityCategoryLinks)
    ? value!.localityCategoryLinks.map((link) => ({
        id: String(link.id || ''),
        localityId: String(link.localityId || ''),
        categoryId: String(link.categoryId || ''),
        subcategoryId: link.subcategoryId ? String(link.subcategoryId) : undefined,
        slug: String(link.slug || '')
      })).filter((link) => link.id && link.localityId && link.categoryId && link.slug)
    : [],
  communityItems: Array.isArray(value?.communityItems) ? value!.communityItems as CommunityItem[] : [],
  apiConfiguration: normalizeApiConfiguration(value?.apiConfiguration)
});

const normalizeScalableHomepageConfigState = (
  value: Partial<ScalableHomepageConfigState> | null | undefined
): ScalableHomepageConfigState => ({
  version: Number.isFinite(Number(value?.version)) ? Number(value?.version) : 1,
  templates: Array.isArray(value?.templates) ? value!.templates : [],
  assignments: Array.isArray(value?.assignments) ? value!.assignments : [],
  campaigns: Array.isArray(value?.campaigns) ? value!.campaigns : [],
  publishedSnapshots: Array.isArray(value?.publishedSnapshots) ? value!.publishedSnapshots : [],
  metadata: {
    seededFromLegacy: Boolean(value?.metadata?.seededFromLegacy),
    notes: value?.metadata?.notes || '',
    updatedAt: value?.metadata?.updatedAt || new Date().toISOString()
  }
});

const getScalableEntityMetadataSource = (metadata?: Record<string, unknown>) => String(metadata?.source || '');
const isScalableEntityDetachedFromLegacySync = (metadata?: Record<string, unknown>) => Boolean(metadata?.detachedFromLegacySync);
const isLegacyManagedScalableEntity = (metadata?: Record<string, unknown>) => (
  getScalableEntityMetadataSource(metadata).startsWith('legacy_') && !isScalableEntityDetachedFromLegacySync(metadata)
);
const shouldAllowLegacyScalableReseed = (config: ScalableHomepageConfigState) => (
  Boolean(config.metadata?.seededFromLegacy) &&
  [...config.templates, ...config.assignments, ...config.campaigns].every((entity) => isLegacyManagedScalableEntity(entity.metadata))
);

const syncScalableTemplatesFromLayouts = (
  config: ScalableHomepageConfigState,
  layouts: HomepageLayout[]
): ScalableHomepageConfigState => {
  const existingTemplatesById = new Map(config.templates.map((template) => [template.id, template]));
  const syncedTemplates = layouts.map((layout): ScalableHomepageTemplate => {
    const templateId = `tpl_${layout.id || `homepage_${layout.localityId}`}`;
    const existing = existingTemplatesById.get(templateId);
    return {
      id: templateId,
      name: layout.name || `${layout.localityId} Homepage Template`,
      templateScope: 'locality',
      localityIds: [layout.localityId],
      status: layout.status === 'inactive' ? 'inactive' : 'active',
      priority: existing?.priority ?? 100,
      isDefault: existing?.isDefault ?? false,
      isFallback: existing?.isFallback ?? true,
      sections: layout.sections,
      metadata: {
        ...(existing?.metadata || {}),
        source: 'legacy_homepage_layout',
        legacyLayoutId: layout.id,
      },
      updatedAt: layout.updatedAt || new Date().toISOString(),
    };
  });

  const syncedTemplateIds = new Set(syncedTemplates.map((template) => template.id));
  const preservedTemplates = config.templates.filter((template) => {
    const metadata = (template.metadata as Record<string, unknown> | undefined) || {};
    const source = getScalableEntityMetadataSource(metadata);
    const detachedFromLegacySync = isScalableEntityDetachedFromLegacySync(metadata);
    if (syncedTemplateIds.has(template.id)) {
      return detachedFromLegacySync || !source.startsWith('legacy_');
    }
    if (source === 'legacy_homepage_layout') {
      return detachedFromLegacySync;
    }
    return true;
  });
  const preservedTemplateIds = new Set(preservedTemplates.map((template) => template.id));
  const activeSyncedTemplates = syncedTemplates.filter((template) => !preservedTemplateIds.has(template.id));

  return {
    ...config,
    templates: [...preservedTemplates, ...activeSyncedTemplates],
    metadata: {
      ...config.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
};

const syncScalableAssignmentsFromLayouts = (
  config: ScalableHomepageConfigState,
  layouts: HomepageLayout[]
): ScalableHomepageConfigState => {
  const syncedAssignments: ScalableHomepageAssignment[] = layouts.map((layout) => ({
    id: `assign_${layout.localityId}`,
    localityId: layout.localityId,
    templateId: `tpl_${layout.id || `homepage_${layout.localityId}`}`,
    status: layout.status === 'inactive' ? 'inactive' : 'active',
    priority: 100,
    isFallback: true,
    metadata: {
      source: 'legacy_homepage_assignment',
      legacyLayoutId: layout.id,
    },
    updatedAt: layout.updatedAt || new Date().toISOString(),
  }));

  const syncedAssignmentIds = new Set(syncedAssignments.map((assignment) => assignment.id));
  const preservedAssignments = config.assignments.filter((assignment) => {
    const metadata = (assignment.metadata as Record<string, unknown> | undefined) || {};
    const source = getScalableEntityMetadataSource(metadata);
    const detachedFromLegacySync = isScalableEntityDetachedFromLegacySync(metadata);
    if (syncedAssignmentIds.has(assignment.id)) {
      return detachedFromLegacySync || !source.startsWith('legacy_');
    }
    if (source === 'legacy_homepage_assignment') {
      return detachedFromLegacySync;
    }
    return true;
  });
  const preservedAssignmentIds = new Set(preservedAssignments.map((assignment) => assignment.id));
  const activeSyncedAssignments = syncedAssignments.filter((assignment) => !preservedAssignmentIds.has(assignment.id));

  return {
    ...config,
    assignments: [...preservedAssignments, ...activeSyncedAssignments],
    metadata: {
      ...config.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
};

const syncScalableCampaignCollection = (
  config: ScalableHomepageConfigState,
  campaignType: ScalableCampaign['campaignType'],
  nextCampaigns: ScalableCampaign[],
  sourceTag: string
): ScalableHomepageConfigState => {
  const incomingCampaignIds = new Set(nextCampaigns.map((campaign) => campaign.id));
  const preservedCampaigns = config.campaigns.filter((campaign) => {
    if (campaign.campaignType !== campaignType) return true;
    const metadata = (campaign.metadata as Record<string, unknown> | undefined) || {};
    const source = getScalableEntityMetadataSource(metadata);
    const detachedFromLegacySync = isScalableEntityDetachedFromLegacySync(metadata);
    if (incomingCampaignIds.has(campaign.id)) {
      return detachedFromLegacySync || source !== sourceTag;
    }
    if (source === sourceTag) {
      return detachedFromLegacySync;
    }
    return true;
  });
  const preservedCampaignIds = new Set(preservedCampaigns.map((campaign) => campaign.id));

  return {
    ...config,
    campaigns: [
      ...preservedCampaigns,
      ...nextCampaigns.filter((campaign) => !preservedCampaignIds.has(campaign.id)),
    ],
    metadata: {
      ...config.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
};

type ScalableLegacyCampaignSourceTag =
  | 'legacy_hero_banner'
  | 'legacy_listing_ad'
  | 'legacy_coupon'
  | 'legacy_community_item'
  | 'legacy_business_sponsorship';

const ProposalPanel = lazy(() => import('./components/ProposalPanel'));
const AndroidSimulator = lazy(() => import('./components/AndroidSimulator'));
const AdminConsole = lazy(() => import('./components/AdminConsole'));

export default function App() {
  const PRODUCTION_MODE = true;
  const initialPersistedApiConfiguration = readPersistedApiConfiguration();
  const shouldBootstrapManagedStateFromLocal = initialPersistedApiConfiguration.syncMode === 'local';
  // Database version management to clear stale browser caches when definitions evolve
  const CURRENT_DB_VERSION = 'yp_v16_hero_defaults_guardrails';
  
  // Clean sweep of ancient local storage shards if database version is old
  useState(() => {
    const savedVer = localStorage.getItem('yp_cache_version');
    if (savedVer !== CURRENT_DB_VERSION) {
      localStorage.removeItem('yp_localities');
      localStorage.removeItem('yp_businesses');
      localStorage.removeItem('yp_reviews');
      localStorage.removeItem('yp_subdomains');
      localStorage.removeItem('yp_community');
      localStorage.removeItem('yp_crm');
      localStorage.removeItem('yp_coupons');
      localStorage.removeItem('yp_viewed_bizs');
      localStorage.removeItem('yp_audit_logs');
      localStorage.removeItem('yp_listing_ads');
      localStorage.removeItem('yp_ad_leads');
      localStorage.removeItem('yp_hero_banners');
      localStorage.removeItem('yp_locality_category_links');
      localStorage.removeItem('yp_homepage_layouts');
      localStorage.removeItem('yp_api_configuration');
      localStorage.setItem('yp_cache_version', CURRENT_DB_VERSION);
    }
  });

  // Load from local storage or fallback to defaults
  const [localities, setLocalities] = useState<Locality[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return (DEFAULT_LOCALITIES as Locality[]).map(normalizeStoredLocality);
    }
    const saved = localStorage.getItem('yp_localities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure "roadpali" exists in loaded localities, otherwise discard stale developer storage
        if (parsed && parsed.some((l: any) => l.id === 'roadpali')) {
          return parsed;
        }
      } catch (e) {
        // Fall through
      }
      // Stale data detected - purge old database entries
      localStorage.removeItem('yp_localities');
      localStorage.removeItem('yp_businesses');
      localStorage.removeItem('yp_reviews');
      localStorage.removeItem('yp_subdomains');
      localStorage.removeItem('yp_community');
      localStorage.removeItem('yp_crm');
      localStorage.removeItem('yp_coupons');
      localStorage.removeItem('yp_viewed_bizs');
      localStorage.removeItem('yp_audit_logs');
      localStorage.removeItem('yp_listing_ads');
      localStorage.removeItem('yp_ad_leads');
      localStorage.removeItem('yp_hero_banners');
      localStorage.removeItem('yp_locality_category_links');
      localStorage.removeItem('yp_homepage_layouts');
      localStorage.removeItem('yp_api_configuration');
    }
    return (DEFAULT_LOCALITIES as Locality[]).map(normalizeStoredLocality);
  });

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_businesses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.some((b: any) => b.localityId === 'roadpali' || b.id === 's1')) {
          return parsed.map(normalizeStoredBusiness);
        }
      } catch (e) {
        // Fall through
      }
    }
    return [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('yp_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [subdomains, setSubdomains] = useState<SubdomainMapping[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return (buildDefaultSubdomainMappings(DEFAULT_LOCALITIES) as SubdomainMapping[]).map(normalizeStoredSubdomain);
    }
    const saved = localStorage.getItem('yp_subdomains');
    if (saved) return JSON.parse(saved);

    // Bootstrap subdomain maps from primary states
    return (buildDefaultSubdomainMappings(DEFAULT_LOCALITIES) as SubdomainMapping[]).map(normalizeStoredSubdomain);
  });

  const [defaultLocalityId, setDefaultLocalityId] = useState<string>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return DEFAULT_LOCALITY_ID;
    }
    return localStorage.getItem('yp_default_locality_id') || DEFAULT_LOCALITY_ID;
  });

  const [activeLocalityId, setActiveLocalityId] = useState<string>(() => {
    const savedLoc = localStorage.getItem('yp_saved_locality_id');
    if (savedLoc) return savedLoc;
    return localStorage.getItem('yp_default_locality_id') || DEFAULT_LOCALITY_ID;
  });

  const [savedPincode, setSavedPincode] = useState<string | null>(() => {
    return localStorage.getItem('yp_saved_pincode');
  });

  const [showPincodeModal, setShowPincodeModal] = useState<boolean>(() => {
    const prompted = localStorage.getItem('yp_pincode_prompted');
    return !prompted;
  });

  const [pincodeMappings, setPincodeMappings] = useState<Array<{ pincode: string; localityId: string }>>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return (DEFAULT_PINCODE_MAPPINGS as PincodeRoutingMapping[]).map(normalizeStoredPincodeMapping);
    }
    const saved = localStorage.getItem('yp_pincode_mappings');
    if (saved) return JSON.parse(saved);
    return (DEFAULT_PINCODE_MAPPINGS as PincodeRoutingMapping[]).map(normalizeStoredPincodeMapping);
  });

  const [listingAds, setListingAds] = useState<ListingAd[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_listing_ads');
    if (saved) return JSON.parse(saved).map(normalizeStoredListingAd);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 10);
    const seededListingAds: ListingAd[] = [
      {
        id: 'ad_seed_1',
        title: 'Roadpali Fiber Upgrade Drive',
        description: 'Get high-speed broadband installation and starter plan offers this month.',
        badge: 'Local ISP Sponsor',
        ctaText: 'View Offer',
        backgroundColor: '#1d4ed8',
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=640&q=80',
        startDate,
        endDate,
        actionType: 'landing_page',
        targetUrl: 'https://www.jio.com/fiber',
        localityIds: ['roadpali'],
        placementKey: 'homepage_inline_primary',
        deviceTarget: 'all',
        mobileRowPosition: 3,
        isActive: true
      }
    ];
    return seededListingAds.map(normalizeStoredListingAd);
  });

  const [adLeads, setAdLeads] = useState<AdLead[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_ad_leads');
    return saved ? JSON.parse(saved).map(normalizeStoredAdLead) : [];
  });

  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_hero_banners');
    if (saved) return JSON.parse(saved).map(normalizeStoredHeroBanner);
    const heroBannerDraftDefaults = getRuntimeHeroBannerDraftDefaults();
    const startDate = new Date().toISOString().slice(0, 10);
    const seedHeroEndDate = new Date();
    seedHeroEndDate.setDate(seedHeroEndDate.getDate() + heroBannerDraftDefaults.durationDays);
    const endDate = seedHeroEndDate.toISOString().slice(0, 10);
    const seededHeroBanners: HeroBanner[] = (DEFAULT_LOCALITIES as Locality[]).map((locality) => ({
      id: `hero_${locality.id}`,
      localityId: locality.id,
      title: `Hyper Local Directory for ${locality.name.split(',')[0]}`,
      subtitle: `${locality.description} verified reviews, location-grabbing utilities, and dynamic approval tracking.`,
      imageUrl: (locality.carouselImages && locality.carouselImages[0]) || locality.coverImage,
      startDate,
      endDate,
      ctaLabel: heroBannerDraftDefaults.ctaLabel,
      ctaType: heroBannerDraftDefaults.ctaType,
      ctaTarget: heroBannerDraftDefaults.ctaTarget,
      isActive: true
    }));
    return seededHeroBanners.map(normalizeStoredHeroBanner);
  });

  const [urlCategoryFilter, setUrlCategoryFilter] = useState<string | null>(null);
  const [urlSubcategoryFilter, setUrlSubcategoryFilter] = useState<string | null>(null);
  const [urlSearchFilter, setUrlSearchFilter] = useState<string | null>(null);
  const [urlIsSearchResults, setUrlIsSearchResults] = useState(false);
  const [urlFilterNonce, setUrlFilterNonce] = useState(0);
  const [urlSelectedBusinessId, setUrlSelectedBusinessId] = useState<string | null>(null);
  const [urlSelectionNonce, setUrlSelectionNonce] = useState(0);

  const [localityCategoryLinks, setLocalityCategoryLinks] = useState<LocalityCategoryLink[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_locality_category_links');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [homepageLayouts, setHomepageLayouts] = useState<HomepageLayout[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_homepage_layouts');
    if (saved) {
      try {
        return ensureHomepageLayouts(JSON.parse(saved), localities);
      } catch (error) {
        localStorage.removeItem('yp_homepage_layouts');
      }
    }
    return localities.map((locality) => buildDefaultHomepageLayout(locality));
  });

  const [apiConfiguration, setApiConfiguration] = useState<ApiConfiguration>(() => {
    return initialPersistedApiConfiguration;
  });
  const [homepageDefaultsConfig, setHomepageDefaultsConfig] = useState<HomepageDefaultsConfigState>(() => (
    normalizeHomepageDefaultsConfigState(null)
  ));
  const [homepageDefaultsConfigReady, setHomepageDefaultsConfigReady] = useState(false);
  const [geographyConfigReady, setGeographyConfigReady] = useState(false);
  const [geographyConfig, setGeographyConfig] = useState<GeographyConfigState>(() => (
    normalizeGeographyConfigState(null)
  ));
  const [businessTaxonomy, setBusinessTaxonomy] = useState<BusinessTaxonomyState>(() => (
    normalizeBusinessTaxonomyState(null)
  ));
  const [seoDiscoveryConfig, setSeoDiscoveryConfig] = useState<SeoDiscoveryConfigState>(() => (
    normalizeSeoDiscoveryConfigState(null)
  ));
  const [scalableHomepageConfig, setScalableHomepageConfig] = useState<ScalableHomepageConfigState>(() => (
    normalizeScalableHomepageConfigState(null)
  ));
  const [localityRoutingConfigReady, setLocalityRoutingConfigReady] = useState(false);
  const [scalableHomepageConfigReady, setScalableHomepageConfigReady] = useState(false);
  const portalCategories = useMemo(() => buildPortalCategories(businessTaxonomy.categories), [businessTaxonomy.categories]);

  const seoIntentBySlug = useMemo(() => {
    const lookup = new Map<string, SeoRouteIntent>();
    for (const intent of seoDiscoveryConfig.routeIntents) {
      lookup.set(intent.slug, intent);
    }
    return lookup;
  }, [seoDiscoveryConfig.routeIntents]);

  const categorySlugLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const category of BUSINESS_CATEGORIES) {
      lookup.set(category.id.toLowerCase(), category.id);
      lookup.set(category.slug.toLowerCase(), category.id);
      lookup.set(slugifyForUrl(category.name), category.id);
    }
    for (const category of portalCategories) {
      if (category.id === 'all') continue;
      lookup.set(category.id.toLowerCase(), resolveMasterCategoryId(category.id));
      lookup.set(slugifyForUrl(category.name), resolveMasterCategoryId(category.id));
    }
    return lookup;
  }, [portalCategories, businessTaxonomy.categories]);

  const seoIntentByCategoryAndQuery = useMemo(() => {
    const lookup = new Map<string, SeoRouteIntent>();
    for (const intent of seoDiscoveryConfig.routeIntents) {
      lookup.set(`${intent.categoryId}::${intent.q.toLowerCase()}`, intent);
    }
    return lookup;
  }, [seoDiscoveryConfig.routeIntents]);

  const seoDefaultIntentByCategory = useMemo(() => {
    const lookup = new Map<string, SeoRouteIntent>();
    for (const intent of seoDiscoveryConfig.routeIntents) {
      if (!lookup.has(intent.categoryId)) {
        lookup.set(intent.categoryId, intent);
      }
    }
    return lookup;
  }, [seoDiscoveryConfig.routeIntents]);

  const [activeView, setActiveView] = useState<'proposal' | 'web' | 'android' | 'admin'>('web'); // Default to pubic web portal for instant aesthetics!
  const [showSandbox, setShowSandbox] = useState(false); // Controls floating simulation HUD
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Active User session simulation
  const [userSession, setUserSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('yp_user_session');
    return saved ? JSON.parse(saved) : {
      role: 'buyer',
      userName: 'Anonymous Guest Explorer',
      userPhone: undefined,
      isAuthenticated: false
    };
  });

  useEffect(() => {
    const token = localStorage.getItem('yp_auth_token');
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) return;
        setUserSession({
          role: data.user.role,
          userType: data.user.userType,
          userName: data.user.name,
          userPhone: data.user.phone || undefined,
          email: data.user.email,
          sellerBusinessId: data.user.sellerBusinessId || undefined,
          authToken: token,
          isAuthenticated: true,
        });
      })
      .catch(() => {
        localStorage.removeItem('yp_auth_token');
      });
  }, []);

  useEffect(() => {
    if (userSession.role !== 'seller' || !userSession.isAuthenticated || userSession.sellerBusinessId) return;

    const normalizedSessionPhone = (userSession.userPhone || '').replace(/\D/g, '').slice(-10);
    const normalizedSessionEmail = (userSession.email || '').trim().toLowerCase();
    const matchedBusiness = businesses.find((business) => {
      const normalizedBusinessPhone = (business.phone || '').replace(/\D/g, '').slice(-10);
      const normalizedBusinessEmail = (business.email || '').trim().toLowerCase();
      return (
        (normalizedSessionPhone && normalizedBusinessPhone && normalizedSessionPhone === normalizedBusinessPhone) ||
        (normalizedSessionEmail && normalizedBusinessEmail && normalizedSessionEmail === normalizedBusinessEmail)
      );
    });

    if (!matchedBusiness) return;

    setUserSession((prev) => {
      if (prev.role !== 'seller' || prev.sellerBusinessId) return prev;
      return {
        ...prev,
        sellerBusinessId: matchedBusiness.id,
      };
    });
  }, [
    businesses,
    userSession.email,
    userSession.isAuthenticated,
    userSession.role,
    userSession.sellerBusinessId,
    userSession.userPhone,
  ]);

  useEffect(() => {
    setHomepageDefaultsRuntimeCatalog(homepageDefaultsConfig);
    setHeroBanners((prev) => prev.map(normalizeStoredHeroBanner));
  }, [homepageDefaultsConfig]);

  useEffect(() => {
    if (!apiConfiguration.homepageDefaultsConfigEndpoint) {
      setHomepageDefaultsConfigReady(true);
      return;
    }
    let cancelled = false;

    fetch(apiConfiguration.homepageDefaultsConfigEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { config?: Partial<HomepageDefaultsConfigState> } | null) => {
        if (cancelled) return;
        const normalized = normalizeHomepageDefaultsConfigState(data?.config || null);
        setHomepageDefaultsConfig(normalized);
        setHomepageDefaultsConfigReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHomepageDefaultsConfigReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.homepageDefaultsConfigEndpoint]);

  useEffect(() => {
    if (!apiConfiguration.geographyConfigEndpoint) {
      setGeographyConfigReady(true);
      return;
    }
    let cancelled = false;

    fetch(apiConfiguration.geographyConfigEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { config?: Partial<GeographyConfigState> } | null) => {
        if (cancelled) return;
        const normalized = normalizeGeographyConfigState(data?.config || null);
        setGeographyConfig(normalized);
        setGeographyCatalog(normalized.states, normalized.cities, normalized.areas);
        setBusinesses((prev) => prev.map(normalizeStoredBusiness));
        setGeographyConfigReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setGeographyConfigReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.geographyConfigEndpoint]);

  useEffect(() => {
    if (!apiConfiguration.seoDiscoveryConfigEndpoint) {
      return;
    }
    let cancelled = false;

    fetch(apiConfiguration.seoDiscoveryConfigEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { config?: Partial<SeoDiscoveryConfigState> } | null) => {
        if (cancelled) return;
        setSeoDiscoveryConfig(normalizeSeoDiscoveryConfigState(data?.config || null));
      })
      .catch(() => {
        if (cancelled) return;
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.seoDiscoveryConfigEndpoint]);

  useEffect(() => {
    if (!apiConfiguration.localityRoutingConfigEndpoint) {
      setLocalityRoutingConfigReady(true);
      return;
    }
    let cancelled = false;

    fetch(apiConfiguration.localityRoutingConfigEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { config?: Partial<LocalityRoutingConfigState> } | null) => {
        if (cancelled) return;
        if (!data?.config) {
          setLocalityRoutingConfigReady(true);
          return;
        }
        const normalized = normalizeLocalityRoutingConfigState(data.config);
        setLocalities(normalized.localities);
        setSubdomains(normalized.subdomains);
        setPincodeMappings(normalized.pincodeMappings);
        setDefaultLocalityId(normalized.defaultLocalityId);
        setLocalityRoutingConfigReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLocalityRoutingConfigReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.localityRoutingConfigEndpoint]);

  useEffect(() => {
    setBusinessTaxonomyCatalog(businessTaxonomy.categories, businessTaxonomy.subcategories);
    setBusinesses((prev) => prev.map(normalizeStoredBusiness));
  }, [businessTaxonomy]);

  useEffect(() => {
    if (!apiConfiguration.taxonomyConfigEndpoint) return;
    let cancelled = false;

    fetch(apiConfiguration.taxonomyConfigEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { taxonomy?: Partial<BusinessTaxonomyState> } | null) => {
        if (cancelled || !data?.taxonomy) return;
        const normalized = normalizeBusinessTaxonomyState(data.taxonomy);
        setBusinessTaxonomy(normalized);
      })
      .catch(() => {
        // Runtime catalog remains on the bundled fallback if taxonomy API is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.taxonomyConfigEndpoint]);

  useEffect(() => {
    if (localities.length === 0) return;
    if (!localities.some((locality) => locality.id === defaultLocalityId)) {
      setDefaultLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === activeLocalityId)) {
      setActiveLocalityId(localities[0].id);
    }
  }, [localities, activeLocalityId, defaultLocalityId]);

  useEffect(() => {
    if (!homepageDefaultsConfigReady || localities.length === 0) return;
    const nextLayouts = ensureHomepageLayouts(homepageLayouts, localities, homepageDefaultsConfig.sectionTemplates);
    const currentSignature = JSON.stringify(homepageLayouts);
    const nextSignature = JSON.stringify(nextLayouts);
    if (currentSignature === nextSignature) return;

    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint && homepageConfigLoadedRef.current) {
      setHomepageConfigSyncSignatureForOverrides({ homepageLayouts: nextLayouts });
    }
    setHomepageLayouts(nextLayouts);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint && homepageConfigLoadedRef.current) {
      void persistHomepageLayoutCollectionMutation(nextLayouts).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
  }, [
    apiConfiguration.homepageConfigEndpoint,
    apiConfiguration.syncMode,
    homepageDefaultsConfig.sectionTemplates,
    homepageDefaultsConfigReady,
    homepageLayouts,
    localities,
  ]);

  useEffect(() => {
    if (homepageConfigLoadedRef.current || !homepageDefaultsConfigReady || !geographyConfigReady || !localityRoutingConfigReady || localities.length === 0) return;
    const canReadPrivilegedHomepageConfig = Boolean(userSession.authToken) && ['admin', 'developer'].includes(userSession.role);
    let cancelled = false;

    Promise.all([
      fetch(getHomepageApiConfigurationEndpoint()).then((response) => (response.ok ? response.json() : null)),
      fetch(getHomepageLayoutsEndpoint()).then((response) => (response.ok ? response.json() : null)),
      fetch(getHomepageConfigCollectionEndpoint('hero-banners')).then((response) => (response.ok ? response.json() : null)),
      fetch(getHomepageConfigCollectionEndpoint('listing-ads')).then((response) => (response.ok ? response.json() : null)),
      fetch(getHomepageConfigCollectionEndpoint('coupons')).then((response) => (response.ok ? response.json() : null)),
      fetch(getHomepageConfigCollectionEndpoint('community-items')).then((response) => (response.ok ? response.json() : null)),
      fetch(getHomepageConfigCollectionEndpoint('locality-category-links')).then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([
        apiConfigurationData,
        layoutsData,
        heroBannersData,
        listingAdsData,
        couponsData,
        communityItemsData,
        localityCategoryLinksData,
      ]) => {
        if (cancelled) {
          homepageConfigLoadedRef.current = true;
          return;
        }

        const normalizedConfig = normalizeHomepageConfigState({
          apiConfiguration: apiConfigurationData?.apiConfiguration || {},
          homepageLayouts: layoutsData?.layouts || [],
          heroBanners: heroBannersData?.heroBanners || [],
          listingAds: listingAdsData?.listingAds || [],
          coupons: couponsData?.coupons || [],
          communityItems: communityItemsData?.communityItems || [],
          localityCategoryLinks: localityCategoryLinksData?.localityCategoryLinks || [],
        }, localities, homepageDefaultsConfig.sectionTemplates);
        setHeroBanners(normalizedConfig.heroBanners.map(normalizeStoredHeroBanner));
        setListingAds(normalizedConfig.listingAds.map(normalizeStoredListingAd));
        setCoupons(normalizedConfig.coupons.map(normalizeStoredCoupon));
        setHomepageLayouts(normalizedConfig.homepageLayouts);
        setLocalityCategoryLinks(normalizedConfig.localityCategoryLinks);
        setCommunityItems(normalizedConfig.communityItems.map(normalizeStoredCommunityItem));
        setApiConfiguration((prev) => normalizeApiConfiguration({
          ...prev,
          ...normalizedConfig.apiConfiguration,
          lastHomepageSyncAt: normalizedConfig.apiConfiguration.lastHomepageSyncAt || prev.lastHomepageSyncAt
        }));
        lastHomepageSyncSignatureRef.current = JSON.stringify({
          ...normalizedConfig,
          apiConfiguration: getPersistableApiConfiguration(normalizedConfig.apiConfiguration)
        });
        homepageConfigLoadedRef.current = true;
      })
      .catch(() => {
        if (!canReadPrivilegedHomepageConfig) {
          homepageConfigLoadedRef.current = true;
          return null;
        }

        return fetch(apiConfiguration.homepageConfigEndpoint, {
          headers: {
            ...getAuthHeaders(),
          },
        })
          .then((response) => (response.ok ? response.json() : null))
          .then((data: { config?: Partial<HomepageConfigState> } | null) => {
            if (cancelled || !data?.config) {
              homepageConfigLoadedRef.current = true;
              return;
            }

            const normalizedConfig = normalizeHomepageConfigState(data.config, localities, homepageDefaultsConfig.sectionTemplates);
            setHeroBanners(normalizedConfig.heroBanners.map(normalizeStoredHeroBanner));
            setListingAds(normalizedConfig.listingAds.map(normalizeStoredListingAd));
            setCoupons(normalizedConfig.coupons.map(normalizeStoredCoupon));
            setHomepageLayouts(normalizedConfig.homepageLayouts);
            setLocalityCategoryLinks(normalizedConfig.localityCategoryLinks);
            setCommunityItems(normalizedConfig.communityItems.map(normalizeStoredCommunityItem));
            setApiConfiguration((prev) => normalizeApiConfiguration({
              ...prev,
              ...normalizedConfig.apiConfiguration,
              lastHomepageSyncAt: normalizedConfig.apiConfiguration.lastHomepageSyncAt || prev.lastHomepageSyncAt
            }));
            lastHomepageSyncSignatureRef.current = JSON.stringify({
              ...normalizedConfig,
              apiConfiguration: getPersistableApiConfiguration(normalizedConfig.apiConfiguration)
            });
            homepageConfigLoadedRef.current = true;
          });
      })
      .catch(() => {
        homepageConfigLoadedRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.homepageConfigEndpoint, geographyConfigReady, homepageDefaultsConfig.sectionTemplates, homepageDefaultsConfigReady, localityRoutingConfigReady, localities, userSession.authToken, userSession.role]);

  useEffect(() => {
    if (apiConfiguration.syncMode !== 'api' || !apiConfiguration.adLeadsEndpoint) return;
    const canReadAdLeads = Boolean(userSession.authToken) && ['admin', 'developer'].includes(userSession.role);
    if (!canReadAdLeads) return;
    let cancelled = false;

    fetch(apiConfiguration.adLeadsEndpoint, {
      headers: {
        ...getAuthHeaders(),
      },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { adLeads?: AdLead[] } | null) => {
        if (cancelled || !Array.isArray(data?.adLeads)) return;
        setAdLeads(data.adLeads.map(normalizeStoredAdLead));
      })
      .catch(() => {
        // Keep local in-memory ad leads if the managed endpoint is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.adLeadsEndpoint, apiConfiguration.syncMode, userSession.authToken, userSession.role]);

  useEffect(() => {
    if (!apiConfiguration.scalableHomepageConfigEndpoint) return;
    const canReadScalableHomepageConfig = Boolean(userSession.authToken) && ['admin', 'developer'].includes(userSession.role);
    if (!canReadScalableHomepageConfig) {
      scalableHomepageConfigLoadedRef.current = true;
      setScalableHomepageConfigReady(true);
      return;
    }
    let cancelled = false;

    fetch(apiConfiguration.scalableHomepageConfigEndpoint, {
      headers: {
        ...getAuthHeaders(),
      },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { config?: Partial<ScalableHomepageConfigState> } | null) => {
        if (cancelled) {
          scalableHomepageConfigLoadedRef.current = true;
          setScalableHomepageConfigReady(true);
          return;
        }
        if (!data?.config) {
          scalableHomepageConfigLoadedRef.current = true;
          setScalableHomepageConfigReady(true);
          return;
        }
        setScalableHomepageConfig(normalizeScalableHomepageConfigState(data.config));
        scalableHomepageConfigLoadedRef.current = true;
        setScalableHomepageConfigReady(true);
      })
      .catch(() => {
        // Keep empty scalable config state as fallback during rollout.
        scalableHomepageConfigLoadedRef.current = true;
        setScalableHomepageConfigReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.scalableHomepageConfigEndpoint, userSession.authToken, userSession.role]);

  // Track the business IDs for which the current user has performed OTP verification to unlock contact details
  const [viewedBusinessIds, setViewedBusinessIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('yp_viewed_bizs');
    return saved ? JSON.parse(saved) : ['s1']; // Pre-authorize s1 for quick visual overview
  });

  const [savedBusinessIds, setSavedBusinessIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('yp_saved_business_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const [buyerActivityEvents, setBuyerActivityEvents] = useState<BuyerActivityEvent[]>(() => {
    const saved = localStorage.getItem('yp_buyer_activity_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [communityItems, setCommunityItems] = useState<CommunityItem[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_community');
    return saved
      ? JSON.parse(saved).map(normalizeStoredCommunityItem)
      : [];
  });

  const [crmContacts, setCrmContacts] = useState<CRMContact[]>(() => {
    const saved = localStorage.getItem('yp_crm');
    return saved ? JSON.parse(saved) : INITIAL_CRM_CONTACTS;
  });

  const [coupons, setCoupons] = useState<MarketingCoupon[]>(() => {
    if (!shouldBootstrapManagedStateFromLocal) {
      return [];
    }
    const saved = localStorage.getItem('yp_coupons');
    return saved ? JSON.parse(saved).map(normalizeStoredCoupon) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem('yp_audit_logs');
    if (saved) return JSON.parse(saved);
    // Seed some initial audited actions to make the UI look gorgeous upon launch
    return [
      {
        id: 'audit_init_1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        actionType: 'data_entry',
        description: 'Provisioned primary database shards for Locality "Roadpali"',
        details: 'Route slug mapped to roadpali.yellowpages.co.in with active SSL',
        ipAddress: '103.45.22.105',
        deviceCode: 'Mozilla/5.0 (H:1080, W:1920, DPR:2)',
        userName: 'Rahul Sharma (National Administrator)'
      },
      {
        id: 'audit_init_2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actionType: 'contact_view',
        description: 'Revealed contact coordinates for merchant: "5 Elements | Family Salon"',
        details: 'OTP Verified successfully with SMS gateway ID sms_2026',
        ipAddress: '103.88.192.43',
        deviceCode: 'Chrome/124.0.0 (H:900, W:1440, DPR:1)',
        userName: 'Karan Malhotra (Verified Citizen)'
      }
    ];
  });

  const homepageConfigLoadedRef = useRef(false);
  const scalableHomepageConfigLoadedRef = useRef(false);
  const lastHomepageSyncSignatureRef = useRef('');
  const legacyLayoutAutoSyncInitializedRef = useRef(false);
  const legacyLayoutAutoSyncSignatureRef = useRef('');
  const legacyLayoutAutoSyncInFlightRef = useRef(false);
  const legacyCampaignAutoSyncInitializedRef = useRef<Record<string, boolean>>({});
  const legacyCampaignAutoSyncSignatureRef = useRef<Record<string, string>>({});
  const legacyCampaignAutoSyncInFlightRef = useRef<Record<string, boolean>>({});
  const auditEventDedupRef = useRef<Map<string, number>>(new Map());
  const lastAutomatedAuditPostAtRef = useRef(0);
  const autoLocationAttemptedRef = useRef(false);

  const buildHomepageConfigPayload = (): HomepageConfigState => ({
    heroBanners,
    listingAds,
    coupons,
    homepageLayouts,
    localityCategoryLinks,
    communityItems,
    apiConfiguration: getPersistableApiConfiguration(apiConfiguration)
  });

  const buildHomepageConfigPayloadWithOverrides = (
    overrides: Partial<HomepageConfigState> = {}
  ): HomepageConfigState => ({
    ...buildHomepageConfigPayload(),
    ...overrides,
  });

  const buildLocalityRoutingConfigPayload = (): LocalityRoutingConfigState => ({
    localities,
    subdomains,
    pincodeMappings,
    defaultLocalityId,
    metadata: {
      seededFromCode: false,
      updatedAt: new Date().toISOString(),
    },
  });

  const getAuthHeaders = () => {
    const token = userSession.authToken || localStorage.getItem('yp_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getHomepageConfigEntityEndpoint = (entityPath?: string) => {
    const baseEndpoint = String(apiConfiguration.homepageConfigEndpoint || '').replace(/\/+$/, '');
    if (!baseEndpoint) {
      throw new Error('Homepage config endpoint is not configured.');
    }
    if (!entityPath) return baseEndpoint;
    return `${baseEndpoint}/${entityPath.replace(/^\/+/, '')}`;
  };

  const getHomepageLayoutSectionsEndpoint = (localityId: string, sectionId?: string, suffix?: string) => {
    const base = getHomepageConfigEntityEndpoint(`layouts/${encodeURIComponent(localityId)}/sections`);
    if (sectionId && suffix) return `${base}/${encodeURIComponent(sectionId)}/${suffix.replace(/^\/+/, '')}`;
    if (sectionId) return `${base}/${encodeURIComponent(sectionId)}`;
    if (suffix) return `${base}/${suffix.replace(/^\/+/, '')}`;
    return base;
  };

  const getHomepageLayoutEndpoint = (localityId: string) => (
    getHomepageConfigEntityEndpoint(`layouts/${encodeURIComponent(localityId)}`)
  );

  const getHomepageLayoutsEndpoint = () => (
    getHomepageConfigEntityEndpoint('layouts')
  );

  const getHomepageApiConfigurationEndpoint = () => (
    getHomepageConfigEntityEndpoint('api-configuration')
  );

  const getHomepageConfigCollectionEndpoint = (collectionPath: string, entityId?: string) => {
    const normalizedCollectionPath = collectionPath.replace(/^\/+|\/+$/g, '');
    return entityId
      ? getHomepageConfigEntityEndpoint(`${normalizedCollectionPath}/${encodeURIComponent(entityId)}`)
      : getHomepageConfigEntityEndpoint(normalizedCollectionPath);
  };

  const setHomepageConfigSyncSignatureForOverrides = (overrides: Partial<HomepageConfigState>) => {
    lastHomepageSyncSignatureRef.current = JSON.stringify(buildHomepageConfigPayloadWithOverrides(overrides));
  };

  const persistHomepageConfigCollectionMutation = async (
    collectionPath: string,
    method: 'POST' | 'PUT' | 'DELETE',
    requestBody: Record<string, unknown> = {}
  ) => {
    const response = await fetch(getHomepageConfigEntityEndpoint(collectionPath), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to persist homepage config collection');
    }
    return response.json().catch(() => null);
  };

  const getOrCreateDeviceId = () => {
    const storageKey = 'yp_device_id';
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `dev_${crypto.randomUUID()}`
      : `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(storageKey, next);
    return next;
  };

  const persistHomepageConfigToServer = (nextPayload?: HomepageConfigState) => {
    const payload = nextPayload || buildHomepageConfigPayload();
    return fetch(apiConfiguration.homepageConfigEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ config: payload })
    });
  };

  const persistLocalityRoutingConfigToServer = async (nextPayload?: LocalityRoutingConfigState) => {
    if (!apiConfiguration.localityRoutingConfigEndpoint) {
      throw new Error('Locality routing config endpoint is not configured.');
    }
    const payload = normalizeLocalityRoutingConfigState(nextPayload || buildLocalityRoutingConfigPayload());
    const response = await fetch(apiConfiguration.localityRoutingConfigEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ config: payload }),
    });
    if (!response.ok) {
      throw new Error('Failed to save locality routing config');
    }
    const data = await response.json().catch(() => null);
    return normalizeLocalityRoutingConfigState(data?.config || payload);
  };

  const persistBusinessesToServer = (nextBusinesses: Business[]) => {
    if (apiConfiguration.syncMode !== 'api' || !apiConfiguration.autoSyncBusinesses) {
      return;
    }
    fetch(apiConfiguration.businessesEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ businesses: nextBusinesses })
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to sync businesses');
        setApiConfiguration((prev) => ({
          ...prev,
          lastBusinessesSyncAt: new Date().toISOString()
        }));
      })
      .catch(() => {
      // Local cache remains the fallback when the API is unavailable.
      });
  };

  useEffect(() => {
    let cancelled = false;
    fetch(apiConfiguration.businessesEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { businesses?: Business[] } | null) => {
        if (cancelled || !Array.isArray(data?.businesses)) return;
        if (data.businesses.length === 0) {
          if (businesses.length > 0 && apiConfiguration.syncMode === 'api' && apiConfiguration.autoSyncBusinesses) {
            persistBusinessesToServer(businesses);
          }
          return;
        }
        setBusinesses((prev) => {
          const remoteBusinesses = data.businesses || [];
          const next = mergeBusinessCollections(prev, remoteBusinesses);
          if (next.length > remoteBusinesses.length && apiConfiguration.syncMode === 'api' && apiConfiguration.autoSyncBusinesses) {
            persistBusinessesToServer(next);
          }
          return next;
        });
      })
      .catch(() => {
        // Static/local builds keep using localStorage and seed data.
      });

    return () => {
      cancelled = true;
    };
  }, [apiConfiguration.autoSyncBusinesses, apiConfiguration.businessesEndpoint, apiConfiguration.syncMode, businesses]);

  // Push state to localStorage on any updates
  const mirrorLocalityRoutingLocally = apiConfiguration.syncMode !== 'api';

  useEffect(() => {
    if (!mirrorLocalityRoutingLocally) return;
    localStorage.setItem('yp_localities', JSON.stringify(localities));
  }, [localities, mirrorLocalityRoutingLocally]);

  useEffect(() => {
    if (!mirrorLocalityRoutingLocally) return;
    localStorage.setItem('yp_pincode_mappings', JSON.stringify(pincodeMappings));
  }, [pincodeMappings, mirrorLocalityRoutingLocally]);

  useEffect(() => {
    if (!mirrorLocalityRoutingLocally) return;
    localStorage.setItem('yp_default_locality_id', defaultLocalityId);
  }, [defaultLocalityId, mirrorLocalityRoutingLocally]);

  const mirrorBusinessesLocally = apiConfiguration.syncMode !== 'api';

  useEffect(() => {
    if (mirrorLocalityRoutingLocally) return;
    localStorage.removeItem('yp_localities');
    localStorage.removeItem('yp_subdomains');
    localStorage.removeItem('yp_pincode_mappings');
    localStorage.removeItem('yp_default_locality_id');
  }, [mirrorLocalityRoutingLocally]);

  useEffect(() => {
    if (!mirrorBusinessesLocally) return;
    localStorage.setItem('yp_businesses', JSON.stringify(businesses));
  }, [businesses, mirrorBusinessesLocally]);

  useEffect(() => {
    localStorage.setItem('yp_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    if (!mirrorLocalityRoutingLocally) return;
    localStorage.setItem('yp_subdomains', JSON.stringify(subdomains));
  }, [subdomains, mirrorLocalityRoutingLocally]);

  useEffect(() => {
    localStorage.setItem('yp_user_session', JSON.stringify(userSession));
  }, [userSession]);

  useEffect(() => {
    localStorage.setItem('yp_viewed_bizs', JSON.stringify(viewedBusinessIds));
  }, [viewedBusinessIds]);

  useEffect(() => {
    localStorage.setItem('yp_saved_business_ids', JSON.stringify(savedBusinessIds));
  }, [savedBusinessIds]);

  useEffect(() => {
    localStorage.setItem('yp_buyer_activity_events', JSON.stringify(buyerActivityEvents));
  }, [buyerActivityEvents]);

  const mirrorHomepageStateLocally = apiConfiguration.syncMode !== 'api';

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_community', JSON.stringify(communityItems));
  }, [communityItems, mirrorHomepageStateLocally]);

  useEffect(() => {
    localStorage.setItem('yp_crm', JSON.stringify(crmContacts));
  }, [crmContacts]);

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_coupons', JSON.stringify(coupons));
  }, [coupons, mirrorHomepageStateLocally]);

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_listing_ads', JSON.stringify(listingAds));
  }, [listingAds, mirrorHomepageStateLocally]);

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_ad_leads', JSON.stringify(adLeads));
  }, [adLeads, mirrorHomepageStateLocally]);

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_hero_banners', JSON.stringify(heroBanners));
  }, [heroBanners, mirrorHomepageStateLocally]);

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_locality_category_links', JSON.stringify(localityCategoryLinks));
  }, [localityCategoryLinks, mirrorHomepageStateLocally]);

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_homepage_layouts', JSON.stringify(homepageLayouts));
  }, [homepageLayouts, mirrorHomepageStateLocally]);

  useEffect(() => {
    if (!mirrorHomepageStateLocally) return;
    localStorage.setItem('yp_api_configuration', JSON.stringify(apiConfiguration));
  }, [apiConfiguration, mirrorHomepageStateLocally]);

  useEffect(() => {
    localStorage.setItem('yp_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    logAuditEvent('data_entry', 'Active locality changed', `Locality switched to: ${activeLocalityId}`);
  }, [activeLocalityId]);

  useEffect(() => {
    const applySeoUrlState = () => {
      const decodeSegment = (segment: string) => decodeURIComponent(segment).trim().toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const pathSegments = window.location.pathname
        .split('/')
        .filter(Boolean)
        .map(decodeSegment);
      const hostFirstLabel = window.location.hostname.split('.')[0]?.toLowerCase() || '';
      const hostLocality = localities.find((locality) => (
        locality.id === hostFirstLabel || locality.slug === hostFirstLabel
      )) || null;

      let resolvedLocalityId: string | null = null;
      let resolvedCategoryId: string | null = null;
      let resolvedSearch: string | null = null;
      let resolvedBusinessId: string | null = null;
      let shouldOpenSearchResults = false;

      let scopedSegments = pathSegments;
      if (pathSegments.length > 0) {
        const localitySegment = pathSegments[0];
        const matchedLocality = localities.find((locality) => (
          locality.id === localitySegment || locality.slug === localitySegment
        ));
        if (matchedLocality) {
          resolvedLocalityId = matchedLocality.id;
          scopedSegments = pathSegments.slice(1);
        }
      }

      if (!resolvedLocalityId && hostLocality) {
        resolvedLocalityId = hostLocality.id;
      }

      if (scopedSegments.length > 0) {
        const intentOrCategorySegment = scopedSegments[0];
        const matchedIntent = seoIntentBySlug.get(intentOrCategorySegment);
        if (matchedIntent) {
          resolvedCategoryId = matchedIntent.categoryId;
          resolvedSearch = matchedIntent.q;
          shouldOpenSearchResults = true;
        } else {
          const categoryFromSlug = categorySlugLookup.get(intentOrCategorySegment);
          if (categoryFromSlug) {
            resolvedCategoryId = categoryFromSlug;
            shouldOpenSearchResults = true;
          }
        }

        if (scopedSegments.length > 1) {
          const listingSegment = scopedSegments[1];
          const possibleBusinessId = listingSegment.split('-').pop() || '';
          if (possibleBusinessId && businesses.some((biz) => biz.id === possibleBusinessId)) {
            resolvedBusinessId = possibleBusinessId;
          }
        }
      }

      const localityParam = (params.get('locality') || '').trim().toLowerCase();
      if (!resolvedLocalityId && localityParam) {
        const matchedLocality = localities.find((locality) => (
          locality.id === localityParam || locality.slug === localityParam
        ));
        if (matchedLocality) resolvedLocalityId = matchedLocality.id;
      }

      const categoryParam = (params.get('category') || '').trim().toLowerCase();
      if (!resolvedCategoryId) {
        const normalizedCategoryParam = resolveMasterCategoryId(categoryParam);
        if (categoryParam && BUSINESS_CATEGORIES.some((category) => category.id === normalizedCategoryParam)) {
          resolvedCategoryId = normalizedCategoryParam;
          shouldOpenSearchResults = true;
        } else if (categoryParam === 'all') {
          resolvedCategoryId = 'all';
          shouldOpenSearchResults = true;
        }
      } else if (categoryParam) {
        shouldOpenSearchResults = true;
      }

      const searchParam = (params.get('srp') || params.get('q') || '').trim();
      if (!resolvedSearch && searchParam) {
        resolvedSearch = searchParam;
      }
      if (searchParam) {
        shouldOpenSearchResults = true;
      }
      if (!resolvedBusinessId) {
        const businessParam = (params.get('biz') || '').trim();
        if (businessParam && businesses.some((biz) => biz.id === businessParam)) {
          resolvedBusinessId = businessParam;
        }
      }

      if (resolvedLocalityId) {
        setActiveLocalityId(resolvedLocalityId);
        localStorage.setItem('yp_saved_locality_id', resolvedLocalityId);
        localStorage.setItem('yp_pincode_prompted', 'true');
        setShowPincodeModal(false);
      }

      setUrlCategoryFilter(resolvedCategoryId);
      setUrlSearchFilter(resolvedSearch || null);
      setUrlIsSearchResults(shouldOpenSearchResults);
      setUrlSelectedBusinessId(resolvedBusinessId);
      setUrlFilterNonce((prev) => prev + 1);
      setUrlSelectionNonce((prev) => prev + 1);
    };

    applySeoUrlState();
    window.addEventListener('popstate', applySeoUrlState);
    return () => window.removeEventListener('popstate', applySeoUrlState);
  }, [localities, businesses, seoIntentBySlug, categorySlugLookup]);

  useEffect(() => {
    if (autoLocationAttemptedRef.current) return;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!showPincodeModal) return;
    if (savedPincode) return;
    if (localStorage.getItem('yp_pincode_prompted')) return;
    if (window.location.pathname && window.location.pathname !== '/') return;

    autoLocationAttemptedRef.current = true;

    const fallbackToDefault = () => {
      handleSavePincode(null, defaultLocalityId || 'roadpali');
      setShowPincodeModal(false);
    };

    if (!navigator.geolocation) {
      fallbackToDefault();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const nearestLocalityId = localities.reduce<{ id: string; distance: number } | null>((best, locality) => {
          const center = LOCALITY_GEO_CENTERS[locality.id];
          if (!center) return best;
          const distance = getDistanceInKm(currentPoint, center);
          if (!best || distance < best.distance) {
            return { id: locality.id, distance };
          }
          return best;
        }, null);

        const resolvedLocalityId = nearestLocalityId && nearestLocalityId.distance <= 25
          ? nearestLocalityId.id
          : (defaultLocalityId || 'roadpali');

        handleSavePincode(null, resolvedLocalityId);
        setShowPincodeModal(false);
        logAuditEvent(
          'data_entry',
          'Mobile location auto-routing applied',
          `GPS locality routed to: "${resolvedLocalityId}" | Accuracy: ${Math.round(position.coords.accuracy || 0)}m`
        );
      },
      () => {
        fallbackToDefault();
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 300000,
      }
    );
  }, [defaultLocalityId, localities, savedPincode, showPincodeModal]);

  // Unified logger for complete client-side security compliance auditing
  const logAuditEvent = (actionType: 'search' | 'contact_view' | 'data_entry', description: string, details: string) => {
    const now = Date.now();
    const likelyAutomated = isLikelyAutomatedClient();
    const normalizedDescription = description.trim();
    const normalizedDetails = details.trim();
    const dedupeKey = [actionType, normalizedDescription, normalizedDetails, userSession.userName || 'anonymous'].join('|');
    const lastSeenAt = auditEventDedupRef.current.get(dedupeKey) || 0;
    const dedupeWindowMs = likelyAutomated
      ? AUDIT_EVENT_AUTOMATION_DEDUPE_MS
      : actionType === 'search'
        ? AUDIT_EVENT_SEARCH_DEDUPE_MS
        : AUDIT_EVENT_DEDUPE_MS;
    if (now - lastSeenAt < dedupeWindowMs) return;

    auditEventDedupRef.current.set(dedupeKey, now);
    if (auditEventDedupRef.current.size > 250) {
      for (const [key, timestamp] of auditEventDedupRef.current.entries()) {
        if (now - timestamp > AUDIT_EVENT_AUTOMATION_DEDUPE_MS * 2) {
          auditEventDedupRef.current.delete(key);
        }
      }
    }

    const ipAddress = 'client-side';
    const userAgent = navigator.userAgent || 'Mozilla/5.0';
    const deviceCode = `${userAgent.split(' ')[0]} (H:${window.screen.height}, W:${window.screen.width}, DPR:${window.devicePixelRatio})`;
    
    const freshLog: AuditEvent = {
      id: `audit_${now}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType,
      description: normalizedDescription,
      details: normalizedDetails,
      ipAddress,
      deviceCode,
      userName: userSession.userName || 'Anonymous Explorer'
    };
    
    setAuditLogs(prev => [freshLog, ...prev]);

    const shouldPostToServer = (() => {
      if (import.meta.env.DEV) return false;
      if (actionType === 'contact_view') return true;
      if (!likelyAutomated) return true;
      if (userSession.isAuthenticated) return true;
      if (typeof document !== 'undefined' && document.hidden) return false;
      if (now - lastAutomatedAuditPostAtRef.current < AUDIT_EVENT_AUTOMATION_SERVER_COOLDOWN_MS) {
        return false;
      }
      lastAutomatedAuditPostAtRef.current = now;
      return true;
    })();
    if (!shouldPostToServer) return;

    // Persist audit events server-side for public deployment traceability.
    // This is best-effort and should never block UX interactions.
  fetch(apiConfiguration.auditEventsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userSession.authToken ? { Authorization: `Bearer ${userSession.authToken}` } : {})
      },
      body: JSON.stringify(freshLog),
    }).catch(() => {
      // Keep silent fallback to local state/localStorage if server logging fails.
    });
  };

  const appendBuyerActivityEvent = (event: Omit<BuyerActivityEvent, 'id' | 'createdAt'>) => {
    setBuyerActivityEvents((prev) => [
      {
        id: `buyer_evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
        ...event,
      },
      ...prev,
    ].slice(0, 50));
  };

  const handleToggleSavedBusiness = (businessId: string) => {
    const business = businesses.find((item) => item.id === businessId);
    const businessName = business?.name || 'Listing';
    const businessCategory = business?.sourceSubcategoryLabel || business?.sourceCategoryLabel || 'local category';
    const wasSaved = savedBusinessIds.includes(businessId);

    setSavedBusinessIds((prev) => (
      wasSaved
        ? prev.filter((id) => id !== businessId)
        : [...prev, businessId]
    ));

    appendBuyerActivityEvent({
      actionType: wasSaved ? 'unsaved_listing' : 'saved_listing',
      businessId,
      title: wasSaved ? 'Removed saved listing' : 'Saved listing',
      detail: `${businessName} in ${businessCategory}`,
    });
  };

  // Actions
  const handleAddCommunityItem = (item: Omit<CommunityItem, 'id' | 'createdAt' | 'likes'>) => {
    const fresh: CommunityItem = normalizeStoredCommunityItem({
      ...item,
      id: `comm_${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0,
      image: item.image?.trim() || undefined,
      status: item.status || (
        item.publishAt && Date.parse(item.publishAt) > Date.now()
          ? 'scheduled'
          : 'published'
      ),
      publishAt: item.publishAt || new Date().toISOString(),
      expireAt: item.expireAt || undefined
    });
    const nextCommunityItems = [fresh, ...communityItems];
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ communityItems: nextCommunityItems });
    }
    setCommunityItems(nextCommunityItems);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation('community-items', 'POST', { communityItem: fresh }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Created community board discussion: "${item.title}"`, `Category type: ${item.type} | Region shard: ${item.localityId}`);
  };

  const handleUpdateCommunityItem = (item: CommunityItem) => {
    const normalizedItem = normalizeStoredCommunityItem(item);
    const nextCommunityItems = communityItems.map((existing) => (existing.id === item.id ? normalizedItem : existing));
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ communityItems: nextCommunityItems });
    }
    setCommunityItems(nextCommunityItems);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`community-items/${encodeURIComponent(item.id)}`, 'PUT', { communityItem: normalizedItem }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Updated locality update`, `Update ID: ${item.id} | Locality: ${item.localityId}`);
  };

  const handleDeleteCommunityItem = (itemId: string) => {
    const nextCommunityItems = communityItems.filter((item) => item.id !== itemId);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ communityItems: nextCommunityItems });
    }
    setCommunityItems(nextCommunityItems);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`community-items/${encodeURIComponent(itemId)}`, 'DELETE').catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Deleted locality update`, `Update ID: ${itemId}`);
  };

  const handleAddCRMContact = (contact: Omit<CRMContact, 'id' | 'lastInteraction'>) => {
    const fresh: CRMContact = {
      ...contact,
      id: `crm_${Date.now()}`,
      lastInteraction: new Date().toISOString()
    };
    setCrmContacts(prev => [fresh, ...prev]);
  };

  const handleUpdateCRMContact = (updated: CRMContact) => {
    setCrmContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleAddCoupon = (coupon: Omit<MarketingCoupon, 'id' | 'usageCount'>) => {
    const fresh: MarketingCoupon = normalizeStoredCoupon({
      ...coupon,
      id: `cpn_${Date.now()}`,
      usageCount: 0
    });
    const nextCoupons = [fresh, ...coupons];
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ coupons: nextCoupons });
    }
    setCoupons(nextCoupons);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation('coupons', 'POST', { coupon: fresh }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Launched promotional listing coupon code: "${coupon.code}"`, `Discount: ${coupon.discount} | Business ID: ${coupon.businessId}`);
  };

  const handleUpdateCoupon = (coupon: MarketingCoupon) => {
    const normalizedCoupon = normalizeStoredCoupon(coupon);
    const nextCoupons = coupons.map((existing) => (existing.id === coupon.id ? normalizedCoupon : existing));
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ coupons: nextCoupons });
    }
    setCoupons(nextCoupons);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`coupons/${encodeURIComponent(coupon.id)}`, 'PUT', { coupon: normalizedCoupon }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Updated promotional listing coupon code`, `Coupon ID: ${coupon.id} | Business ID: ${coupon.businessId}`);
  };

  const handleDeleteCoupon = (couponId: string) => {
    const nextCoupons = coupons.filter((coupon) => coupon.id !== couponId);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ coupons: nextCoupons });
    }
    setCoupons(nextCoupons);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`coupons/${encodeURIComponent(couponId)}`, 'DELETE').catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Deleted promotional listing coupon code`, `Coupon ID: ${couponId}`);
  };

  const handleCreateListingAd = (adInput: Omit<ListingAd, 'id'>) => {
    const freshAd: ListingAd = normalizeStoredListingAd({
      ...adInput,
      id: `ad_${Date.now()}`
    });
    const nextListingAds = [freshAd, ...listingAds];
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ listingAds: nextListingAds });
    }
    setListingAds(nextListingAds);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation('listing-ads', 'POST', { listingAd: freshAd }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Created listing ad banner`, `Ad: "${adInput.title}" | Action: ${adInput.actionType}`);
  };

  const handleUpdateListingAd = (ad: ListingAd) => {
    const normalizedAd = normalizeStoredListingAd(ad);
    const nextListingAds = listingAds.map((existing) => (existing.id === ad.id ? normalizedAd : existing));
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ listingAds: nextListingAds });
    }
    setListingAds(nextListingAds);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`listing-ads/${encodeURIComponent(ad.id)}`, 'PUT', { listingAd: normalizedAd }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Updated listing ad banner`, `Ad ID: ${ad.id}`);
  };

  const handleDeleteListingAd = (adId: string) => {
    const nextListingAds = listingAds.filter((ad) => ad.id !== adId);
    const nextAdLeads = adLeads.filter((lead) => lead.adId !== adId);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ listingAds: nextListingAds });
    }
    setListingAds(nextListingAds);
    setAdLeads(nextAdLeads);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`listing-ads/${encodeURIComponent(adId)}`, 'DELETE').catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.adLeadsEndpoint) {
      void fetch(`${apiConfiguration.adLeadsEndpoint.replace(/\/+$/, '')}/by-ad/${encodeURIComponent(adId)}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      }).catch(() => {
        // Keep local state intact even if best-effort ad lead cleanup fails.
      });
    }
    logAuditEvent('data_entry', `Deleted listing ad banner`, `Ad ID: ${adId}`);
  };

  const handleCreateHeroBanner = (bannerInput: Omit<HeroBanner, 'id'>) => {
    const freshBanner: HeroBanner = normalizeStoredHeroBanner({
      ...bannerInput,
      id: `hero_${Date.now()}`
    });
    const nextHeroBanners = [freshBanner, ...heroBanners];
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ heroBanners: nextHeroBanners });
    }
    setHeroBanners(nextHeroBanners);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation('hero-banners', 'POST', { banner: freshBanner }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Created hero banner`, `Locality: ${bannerInput.localityId}`);
  };

  const handleUpdateHeroBanner = (banner: HeroBanner) => {
    const normalizedBanner = normalizeStoredHeroBanner(banner);
    const nextHeroBanners = heroBanners.map((existing) => (existing.id === banner.id ? normalizedBanner : existing));
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ heroBanners: nextHeroBanners });
    }
    setHeroBanners(nextHeroBanners);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`hero-banners/${encodeURIComponent(banner.id)}`, 'PUT', { banner: normalizedBanner }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Updated hero banner`, `Hero ID: ${banner.id}`);
  };

  const handleDeleteHeroBanner = (bannerId: string) => {
    const nextHeroBanners = heroBanners.filter((banner) => banner.id !== bannerId);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ heroBanners: nextHeroBanners });
    }
    setHeroBanners(nextHeroBanners);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`hero-banners/${encodeURIComponent(bannerId)}`, 'DELETE').catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Deleted hero banner`, `Hero ID: ${bannerId}`);
  };

  const buildHomepageLayoutDraft = (
    localityId: string,
    layoutsOverride: HomepageLayout[] = homepageLayouts
  ): HomepageLayout => {
    const locality = localities.find((entry) => entry.id === localityId) || localities[0] || normalizeStoredLocality((DEFAULT_LOCALITIES as Locality[])[0]);
    return layoutsOverride.find((layout) => layout.localityId === localityId)
      || buildDefaultHomepageLayout(locality, homepageDefaultsConfig.sectionTemplates);
  };

  const mergeHomepageLayoutIntoCollection = (
    layout: HomepageLayout,
    layoutsOverride: HomepageLayout[] = homepageLayouts
  ) => {
    const normalizedLayout = normalizeHomepageLayout(layout, localities, homepageDefaultsConfig.sectionTemplates);
    const filtered = layoutsOverride.filter((existing) => existing.localityId !== normalizedLayout.localityId);
    return [...filtered, normalizedLayout];
  };

  const replaceHomepageLayoutInState = (layout: HomepageLayout) => {
    setHomepageLayouts((prev) => mergeHomepageLayoutIntoCollection(layout, prev));
  };

  const persistHomepageLayoutSectionMutation = async (
    localityId: string,
    options: {
      method: 'POST' | 'PUT' | 'DELETE';
      layout: HomepageLayout;
      section?: HomepageSection;
      sections?: HomepageSection[];
      sectionId?: string;
      suffix?: string;
    }
  ) => {
    const response = await fetch(
      getHomepageLayoutSectionsEndpoint(localityId, options.sectionId, options.suffix),
      {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          layout: options.layout,
          ...(options.section ? { section: options.section } : {}),
          ...(options.sections ? { sections: options.sections } : {}),
        }),
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to persist homepage layout section');
    }
    const payload = await response.json().catch(() => null) as { layout?: HomepageLayout } | null;
    if (payload?.layout) {
      replaceHomepageLayoutInState(payload.layout);
    }
    return payload;
  };

  const persistHomepageLayoutMutation = async (
    localityId: string,
    method: 'PUT' | 'DELETE',
    layout?: HomepageLayout
  ) => {
    const response = await fetch(
      getHomepageLayoutEndpoint(localityId),
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        ...(layout ? { body: JSON.stringify({ layout }) } : {}),
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to persist homepage layout');
    }
    const payload = await response.json().catch(() => null) as { layout?: HomepageLayout } | null;
    if (payload?.layout) {
      replaceHomepageLayoutInState(payload.layout);
    }
    return payload;
  };

  const persistHomepageLayoutCollectionMutation = async (layouts: HomepageLayout[]) => {
    const response = await fetch(
      getHomepageLayoutsEndpoint(),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ layouts }),
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to persist homepage layouts');
    }
    const payload = await response.json().catch(() => null) as { layouts?: HomepageLayout[] } | null;
    if (Array.isArray(payload?.layouts)) {
      setHomepageLayouts(ensureHomepageLayouts(payload.layouts, localities, homepageDefaultsConfig.sectionTemplates));
    }
    return payload;
  };

  const persistHomepageApiConfigurationMutation = async (nextConfiguration: ApiConfiguration) => {
    const response = await fetch(
      getHomepageApiConfigurationEndpoint(),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          apiConfiguration: getPersistableApiConfiguration(nextConfiguration),
        }),
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to persist homepage API configuration');
    }
    return response.json().catch(() => null) as Promise<{ apiConfiguration?: ApiConfiguration } | null>;
  };

  const handleCreateHomepageSection = (
    localityId: string,
    sectionInput: Omit<HomepageSection, 'id' | 'sortOrder'>,
    insertPosition?: number
  ) => {
    const baseLayout = buildHomepageLayoutDraft(localityId);
    const orderedSections = reindexHomepageSections(baseLayout.sections);
    const nextSection = normalizeHomepageSection(
      {
        ...sectionInput,
        id: `home_section_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        sortOrder: (orderedSections[orderedSections.length - 1]?.sortOrder || 0) + 10
      } as HomepageSection,
      localityId,
      orderedSections.length
    );
    const normalizedInsertPosition = Number.isFinite(Number(insertPosition))
      ? Math.max(1, Math.min(orderedSections.length + 1, Number(insertPosition)))
      : 1;
    const nextSections = [...orderedSections];
    nextSections.splice(normalizedInsertPosition - 1, 0, nextSection);
    const nextLayout = {
      ...baseLayout,
      sections: applyHomepageSectionOrder(nextSections),
      updatedAt: new Date().toISOString(),
    };
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      lastHomepageSyncSignatureRef.current = JSON.stringify(
        buildHomepageConfigPayloadWithOverrides({
          homepageLayouts: mergeHomepageLayoutIntoCollection(nextLayout),
        })
      );
    }
    replaceHomepageLayoutInState(nextLayout);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageLayoutSectionMutation(localityId, {
        method: 'POST',
        layout: baseLayout,
        section: nextSection,
      }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
        // Keep local state intact even if best-effort homepage layout section sync fails.
      });
    }
    logAuditEvent('data_entry', 'Created homepage section', `Locality: ${localityId} | Type: ${sectionInput.sectionType}`);
  };

  const handleUpdateHomepageSection = (localityId: string, section: HomepageSection) => {
    const baseLayout = buildHomepageLayoutDraft(localityId);
    const normalizedSection = normalizeHomepageSection(section, localityId, 0);
    const nextLayout = {
      ...baseLayout,
      sections: reindexHomepageSections(
        baseLayout.sections.map((existing) => (existing.id === section.id ? normalizedSection : existing))
      ),
      updatedAt: new Date().toISOString(),
    };
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      lastHomepageSyncSignatureRef.current = JSON.stringify(
        buildHomepageConfigPayloadWithOverrides({
          homepageLayouts: mergeHomepageLayoutIntoCollection(nextLayout),
        })
      );
    }
    replaceHomepageLayoutInState(nextLayout);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageLayoutSectionMutation(localityId, {
        method: 'PUT',
        layout: baseLayout,
        sectionId: section.id,
        section: normalizedSection,
      }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
        // Keep local state intact even if best-effort homepage layout section sync fails.
      });
    }
    logAuditEvent('data_entry', 'Updated homepage section', `Locality: ${localityId} | Section ID: ${section.id}`);
  };

  const handleDeleteHomepageSection = (localityId: string, sectionId: string) => {
    const baseLayout = buildHomepageLayoutDraft(localityId);
    const nextLayout = {
      ...baseLayout,
      sections: reindexHomepageSections(baseLayout.sections.filter((section) => section.id !== sectionId)),
      updatedAt: new Date().toISOString(),
    };
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      lastHomepageSyncSignatureRef.current = JSON.stringify(
        buildHomepageConfigPayloadWithOverrides({
          homepageLayouts: mergeHomepageLayoutIntoCollection(nextLayout),
        })
      );
    }
    replaceHomepageLayoutInState(nextLayout);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageLayoutSectionMutation(localityId, {
        method: 'DELETE',
        layout: baseLayout,
        sectionId,
      }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
        // Keep local state intact even if best-effort homepage layout section sync fails.
      });
    }
    logAuditEvent('data_entry', 'Deleted homepage section', `Locality: ${localityId} | Section ID: ${sectionId}`);
  };

  const handleDuplicateHomepageSection = (localityId: string, sectionId: string) => {
    const baseLayout = buildHomepageLayoutDraft(localityId);
    const target = baseLayout.sections.find((section) => section.id === sectionId);
    if (!target) return;
    const duplicate = normalizeHomepageSection(
      {
        ...target,
        id: `home_section_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: `${target.title} Copy`,
        sortOrder: target.sortOrder + 1
      },
      localityId,
      baseLayout.sections.length
    );
    const nextLayout = {
      ...baseLayout,
      sections: reindexHomepageSections([...baseLayout.sections, duplicate]),
      updatedAt: new Date().toISOString(),
    };
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      lastHomepageSyncSignatureRef.current = JSON.stringify(
        buildHomepageConfigPayloadWithOverrides({
          homepageLayouts: mergeHomepageLayoutIntoCollection(nextLayout),
        })
      );
    }
    replaceHomepageLayoutInState(nextLayout);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageLayoutSectionMutation(localityId, {
        method: 'POST',
        layout: baseLayout,
        sectionId,
        suffix: 'duplicate',
      }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
        // Keep local state intact even if best-effort homepage layout section sync fails.
      });
    }
    logAuditEvent('data_entry', 'Duplicated homepage section', `Locality: ${localityId} | Section ID: ${sectionId}`);
  };

  const handleMoveHomepageSection = (localityId: string, sectionId: string, direction: 'up' | 'down') => {
    const baseLayout = buildHomepageLayoutDraft(localityId);
    const sorted = reindexHomepageSections(baseLayout.sections);
    const index = sorted.findIndex((section) => section.id === sectionId);
    if (index === -1) return;
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sorted.length) return;
    const nextSections = [...sorted];
    [nextSections[index], nextSections[nextIndex]] = [nextSections[nextIndex], nextSections[index]];
    const reorderedSections = applyHomepageSectionOrder(nextSections);
    const nextLayout = {
      ...baseLayout,
      sections: reorderedSections,
      updatedAt: new Date().toISOString(),
    };
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      lastHomepageSyncSignatureRef.current = JSON.stringify(
        buildHomepageConfigPayloadWithOverrides({
          homepageLayouts: mergeHomepageLayoutIntoCollection(nextLayout),
        })
      );
    }
    replaceHomepageLayoutInState(nextLayout);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageLayoutSectionMutation(localityId, {
        method: 'PUT',
        layout: baseLayout,
        sections: reorderedSections,
        suffix: 'reorder',
      }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
        // Keep local state intact even if best-effort homepage layout section sync fails.
      });
    }
    logAuditEvent('data_entry', 'Reordered homepage section', `Locality: ${localityId} | Section ID: ${sectionId} | Direction: ${direction}`);
  };

  const handleUpdateApiConfiguration = (nextConfiguration: ApiConfiguration) => {
    const normalizedConfiguration = normalizeApiConfiguration(nextConfiguration);
    setApiConfiguration(normalizedConfiguration);
    if (normalizedConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageApiConfigurationMutation(normalizedConfiguration)
        .then((payload) => {
          if (payload?.apiConfiguration) {
            setApiConfiguration(normalizeApiConfiguration(payload.apiConfiguration));
          }
        })
        .catch(() => {
          // Keep local state intact even if best-effort homepage API configuration sync fails.
        });
    }
    lastHomepageSyncSignatureRef.current = '';
    logAuditEvent(
      'data_entry',
      'Updated API configuration',
      `Sync mode: ${nextConfiguration.syncMode} | Homepage autosync: ${nextConfiguration.autoSyncHomepage ? 'on' : 'off'} | Business autosync: ${nextConfiguration.autoSyncBusinesses ? 'on' : 'off'}`
    );
  };

  const syncLocalityRoutingConfigInBackground = (
    mutator: (config: LocalityRoutingConfigState) => LocalityRoutingConfigState,
  ) => {
    const nextConfig = normalizeLocalityRoutingConfigState(mutator(buildLocalityRoutingConfigPayload()));
    setLocalities(nextConfig.localities);
    setSubdomains(nextConfig.subdomains);
    setPincodeMappings(nextConfig.pincodeMappings);
    setDefaultLocalityId(nextConfig.defaultLocalityId);

    const canWriteLocalityRouting = Boolean(userSession.authToken) && ['admin', 'developer'].includes(userSession.role);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.localityRoutingConfigEndpoint && canWriteLocalityRouting) {
      void persistLocalityRoutingConfigToServer(nextConfig).catch(() => {
        // Keep local state intact even if best-effort locality routing sync fails.
      });
    }
  };

  const handleSaveBusinessTaxonomy = async (nextTaxonomy: BusinessTaxonomyState) => {
    const normalized = normalizeBusinessTaxonomyState(nextTaxonomy);
    setBusinessTaxonomyCatalog(normalized.categories, normalized.subcategories);
    setBusinessTaxonomy(normalized);
    setBusinesses((prev) => prev.map(normalizeStoredBusiness));

    if (apiConfiguration.taxonomyConfigEndpoint && apiConfiguration.syncMode === 'api') {
      const response = await fetch(apiConfiguration.taxonomyConfigEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ taxonomy: normalized }),
      });
      if (!response.ok) {
        throw new Error('Failed to save business taxonomy');
      }
      const payload = await response.json().catch(() => null);
      const saved = normalizeBusinessTaxonomyState(payload?.taxonomy || normalized);
      setBusinessTaxonomyCatalog(saved.categories, saved.subcategories);
      setBusinessTaxonomy(saved);
      setBusinesses((prev) => prev.map(normalizeStoredBusiness));
    }

    logAuditEvent(
      'data_entry',
      'Saved master business taxonomy',
      `Categories: ${normalized.categories.length} | Subcategories: ${normalized.subcategories.length}`
    );
    return normalized;
  };

  const handleSaveGeographyConfig = async (nextConfig: GeographyConfigState) => {
    const normalized = normalizeGeographyConfigState(nextConfig);
    const validationErrors = validateGeographyConfigForOperations(normalized, businesses, pincodeMappings);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(' '));
    }

    if (apiConfiguration.geographyConfigEndpoint && apiConfiguration.syncMode === 'api') {
      const response = await fetch(apiConfiguration.geographyConfigEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ config: normalized }),
      });
      if (!response.ok) {
        throw new Error('Failed to save geography config');
      }
      const payload = await response.json().catch(() => null);
      const saved = normalizeGeographyConfigState(payload?.config || normalized);
      const savedValidationErrors = validateGeographyConfigForOperations(saved, businesses, pincodeMappings);
      if (savedValidationErrors.length > 0) {
        throw new Error(savedValidationErrors.join(' '));
      }
      setGeographyConfig(saved);
      setGeographyCatalog(saved.states, saved.cities, saved.areas);
      setBusinesses((prev) => prev.map(normalizeStoredBusiness));
      logAuditEvent(
        'data_entry',
        'Saved managed geography configuration',
        `States: ${saved.states.length} | Cities: ${saved.cities.length} | Areas: ${saved.areas.length}`
      );
      return saved;
    }

    setGeographyConfig(normalized);
    setGeographyCatalog(normalized.states, normalized.cities, normalized.areas);
    setBusinesses((prev) => prev.map(normalizeStoredBusiness));
    logAuditEvent(
      'data_entry',
      'Saved managed geography configuration',
      `States: ${normalized.states.length} | Cities: ${normalized.cities.length} | Areas: ${normalized.areas.length}`
    );
    return normalized;
  };

  const handleSaveHomepageDefaultsConfig = async (nextConfig: HomepageDefaultsConfigState) => {
    const normalized = normalizeHomepageDefaultsConfigState(nextConfig);

    if (apiConfiguration.homepageDefaultsConfigEndpoint && apiConfiguration.syncMode === 'api') {
      const response = await fetch(apiConfiguration.homepageDefaultsConfigEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ config: normalized }),
      });
      if (!response.ok) {
        throw new Error('Failed to save homepage defaults config');
      }
      const payload = await response.json().catch(() => null);
      const saved = normalizeHomepageDefaultsConfigState(payload?.config || normalized);
      setHomepageDefaultsConfig(saved);
      setHomepageDefaultsRuntimeCatalog(saved);
      setHeroBanners((prev) => prev.map(normalizeStoredHeroBanner));
      logAuditEvent(
        'data_entry',
        'Saved homepage defaults configuration',
        `Section templates: ${saved.sectionTemplates.length} | Fallback ads: ${saved.fallbackListingAds.length} | Hero stat templates: ${saved.heroStatTemplates.length}`
      );
      return saved;
    }

    setHomepageDefaultsConfig(normalized);
    setHomepageDefaultsRuntimeCatalog(normalized);
    setHeroBanners((prev) => prev.map(normalizeStoredHeroBanner));
    logAuditEvent(
      'data_entry',
      'Saved homepage defaults configuration',
      `Section templates: ${normalized.sectionTemplates.length} | Fallback ads: ${normalized.fallbackListingAds.length} | Hero stat templates: ${normalized.heroStatTemplates.length}`
    );
    return normalized;
  };

  const handleSaveSeoDiscoveryConfig = async (nextConfig: SeoDiscoveryConfigState) => {
    const normalized = normalizeSeoDiscoveryConfigState(nextConfig);
    setSeoDiscoveryConfig(normalized);

    if (apiConfiguration.seoDiscoveryConfigEndpoint && apiConfiguration.syncMode === 'api') {
      const response = await fetch(apiConfiguration.seoDiscoveryConfigEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ config: normalized }),
      });
      if (!response.ok) {
        throw new Error('Failed to save SEO discovery config');
      }
      const payload = await response.json().catch(() => null);
      const saved = normalizeSeoDiscoveryConfigState(payload?.config || normalized);
      setSeoDiscoveryConfig(saved);
    }

    logAuditEvent(
      'data_entry',
      'Saved SEO discovery configuration',
      `Route intents: ${normalized.routeIntents.length} | Localities: ${normalized.localityMetadata.length} | Top listing groups: ${normalized.topListings.length}`
    );
    return normalized;
  };

  const handleSaveScalableHomepageConfig = async (nextConfiguration: ScalableHomepageConfigState) => {
    if (!apiConfiguration.scalableHomepageConfigEndpoint) {
      throw new Error('Scalable homepage config endpoint is not configured.');
    }

    const response = await fetch(apiConfiguration.scalableHomepageConfigEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ config: nextConfiguration })
    });
    if (!response.ok) {
      throw new Error('Failed to save scalable homepage config');
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || nextConfiguration);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      'Saved scalable homepage configuration',
      `Templates: ${normalized.templates.length} | Campaigns: ${normalized.campaigns.length} | Snapshots: ${normalized.publishedSnapshots.length}`
    );
    return normalized;
  };

  const getScalableHomepageEntityEndpoint = (entityPath: string, entityId?: string) => {
    const baseEndpoint = String(apiConfiguration.scalableHomepageConfigEndpoint || '').replace(/\/+$/, '');
    if (!baseEndpoint) {
      throw new Error('Scalable homepage config endpoint is not configured.');
    }
    const normalizedEntityPath = entityPath.replace(/^\/+|\/+$/g, '');
    return entityId
      ? `${baseEndpoint}/${normalizedEntityPath}/${encodeURIComponent(entityId)}`
      : `${baseEndpoint}/${normalizedEntityPath}`;
  };

  const getScalableHomepageSnapshotsEndpoint = (snapshotId?: string) => (
    getScalableHomepageEntityEndpoint('snapshots', snapshotId)
  );

  const getScalableLegacyLayoutSyncEndpoint = () => (
    getScalableHomepageEntityEndpoint('sync-legacy-layouts')
  );

  const getScalableLegacyCampaignSyncEndpoint = () => (
    getScalableHomepageEntityEndpoint('sync-legacy-campaigns')
  );

  const getScalableTemplateSectionsEndpoint = (templateId: string, sectionId?: string, suffix?: string) => {
    const base = getScalableHomepageEntityEndpoint(`templates/${encodeURIComponent(templateId)}/sections`);
    if (sectionId && suffix) return `${base}/${encodeURIComponent(sectionId)}/${suffix.replace(/^\/+/, '')}`;
    if (sectionId) return `${base}/${encodeURIComponent(sectionId)}`;
    if (suffix) return `${base}/${suffix.replace(/^\/+/, '')}`;
    return base;
  };

  const handleSaveScalableTemplate = async (template: ScalableHomepageTemplate) => {
    const response = await fetch(
      template.id ? getScalableHomepageEntityEndpoint('templates', template.id) : getScalableHomepageEntityEndpoint('templates'),
      {
        method: template.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ template })
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to save scalable template');
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      template.id ? 'Updated scalable homepage template' : 'Created scalable homepage template',
      `Template: ${template.name} | Scope: ${template.templateScope} | Localities: ${(template.localityIds || []).join(', ') || 'all'}`
    );
    return payload?.template as ScalableHomepageTemplate | undefined;
  };

  const handleDeleteScalableTemplate = async (templateId: string) => {
    const response = await fetch(getScalableHomepageEntityEndpoint('templates', templateId), {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to delete scalable template');
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      'Deleted scalable homepage template',
      `Template ID: ${templateId} | Cascaded assignments: ${Array.isArray(payload?.deletedAssignmentIds) ? payload.deletedAssignmentIds.length : 0}`
    );
    return payload;
  };

  const handleSaveScalableAssignment = async (assignment: ScalableHomepageAssignment) => {
    const response = await fetch(
      assignment.id ? getScalableHomepageEntityEndpoint('assignments', assignment.id) : getScalableHomepageEntityEndpoint('assignments'),
      {
        method: assignment.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ assignment })
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to save scalable assignment');
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      assignment.id ? 'Updated scalable homepage assignment' : 'Created scalable homepage assignment',
      `Assignment: ${assignment.localityId} -> ${assignment.templateId}`
    );
    return payload?.assignment as ScalableHomepageAssignment | undefined;
  };

  const handleDeleteScalableAssignment = async (assignmentId: string) => {
    const response = await fetch(getScalableHomepageEntityEndpoint('assignments', assignmentId), {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to delete scalable assignment');
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      'Deleted scalable homepage assignment',
      `Assignment ID: ${assignmentId}`
    );
    return payload;
  };

  const handleSaveScalableCampaign = async (campaign: ScalableCampaign) => {
    const response = await fetch(
      campaign.id ? getScalableHomepageEntityEndpoint('campaigns', campaign.id) : getScalableHomepageEntityEndpoint('campaigns'),
      {
        method: campaign.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ campaign })
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to save scalable campaign');
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      campaign.id ? 'Updated scalable homepage campaign' : 'Created scalable homepage campaign',
      `Campaign: ${campaign.name} | Type: ${campaign.campaignType}`
    );
    return payload?.campaign as ScalableCampaign | undefined;
  };

  const handleDeleteScalableCampaign = async (campaignId: string) => {
    const response = await fetch(getScalableHomepageEntityEndpoint('campaigns', campaignId), {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to delete scalable campaign');
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      'Deleted scalable homepage campaign',
      `Campaign ID: ${campaignId}`
    );
    return payload;
  };

  const handleRefreshScalablePublishedSnapshots = async () => {
    const response = await fetch(getScalableHomepageSnapshotsEndpoint(), {
      headers: {
        ...getAuthHeaders(),
      },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to refresh scalable homepage snapshots');
    }

    const payload = await response.json().catch(() => null) as { snapshots?: PublishedHomepageSnapshot[] } | null;
    if (Array.isArray(payload?.snapshots)) {
      replacePublishedHomepageSnapshots(payload.snapshots);
    }
    logAuditEvent(
      'data_entry',
      'Refreshed scalable homepage snapshots',
      `Snapshots: ${Array.isArray(payload?.snapshots) ? payload.snapshots.length : 0}`
    );
    return payload;
  };

  const handleCreateScalableTemplateSection = async (templateId: string, section: HomepageSection) => {
    const response = await fetch(getScalableTemplateSectionsEndpoint(templateId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ section }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to create scalable template section');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent('data_entry', 'Created scalable template section', `Template: ${templateId} | Section: ${section.id}`);
    return payload;
  };

  const handleUpdateScalableTemplateSection = async (templateId: string, sectionId: string, section: HomepageSection) => {
    const response = await fetch(getScalableTemplateSectionsEndpoint(templateId, sectionId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ section }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to update scalable template section');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent('data_entry', 'Updated scalable template section', `Template: ${templateId} | Section: ${sectionId}`);
    return payload;
  };

  const handleReorderScalableTemplateSections = async (templateId: string, sections: HomepageSection[]) => {
    const response = await fetch(getScalableTemplateSectionsEndpoint(templateId, undefined, 'reorder'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ sections }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to reorder scalable template sections');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent('data_entry', 'Reordered scalable template sections', `Template: ${templateId} | Sections: ${sections.length}`);
    return payload;
  };

  const handleDuplicateScalableTemplateSection = async (templateId: string, sectionId: string) => {
    const response = await fetch(getScalableTemplateSectionsEndpoint(templateId, sectionId, 'duplicate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to duplicate scalable template section');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent('data_entry', 'Duplicated scalable template section', `Template: ${templateId} | Source section: ${sectionId}`);
    return payload;
  };

  const handleDeleteScalableTemplateSection = async (templateId: string, sectionId: string) => {
    const response = await fetch(getScalableTemplateSectionsEndpoint(templateId, sectionId), {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to delete scalable template section');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent('data_entry', 'Deleted scalable template section', `Template: ${templateId} | Section: ${sectionId}`);
    return payload;
  };

  const handleSyncScalableTemplateSectionsFromLocality = async (templateId: string, localityId: string) => {
    const response = await fetch(getScalableTemplateSectionsEndpoint(templateId, undefined, 'sync-locality'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ localityId }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to sync scalable template sections from locality');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent('data_entry', 'Synced scalable template sections from locality', `Template: ${templateId} | Locality: ${localityId}`);
    return payload;
  };

  const handleSyncScalableLegacyLayouts = async (localityIds?: string[]) => {
    const response = await fetch(getScalableLegacyLayoutSyncEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ localityIds: localityIds && localityIds.length > 0 ? localityIds : undefined }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to sync scalable legacy layouts');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent('data_entry', 'Synced scalable legacy layouts', `Localities: ${(localityIds && localityIds.length > 0 ? localityIds : []).join(', ') || 'all'}`);
    return payload;
  };

  const handleSyncScalableLegacyCampaigns = async (
    sourceTags: ScalableLegacyCampaignSourceTag[],
    localityIds?: string[]
  ) => {
    const response = await fetch(getScalableLegacyCampaignSyncEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        sourceTags,
        localityIds: localityIds && localityIds.length > 0 ? localityIds : undefined,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to sync scalable legacy campaigns');
    }
    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || scalableHomepageConfig || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      'Synced scalable legacy campaigns',
      `Sources: ${sourceTags.join(', ')} | Localities: ${(localityIds && localityIds.length > 0 ? localityIds : []).join(', ') || 'all'}`
    );
    return payload;
  };

  const handleDeleteScalablePublishedSnapshot = async (snapshotId: string) => {
    const response = await fetch(getScalableHomepageSnapshotsEndpoint(snapshotId), {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to delete scalable homepage snapshot');
    }

    const payload = await response.json().catch(() => null) as { publishedSnapshots?: PublishedHomepageSnapshot[] } | null;
    if (Array.isArray(payload?.publishedSnapshots)) {
      replacePublishedHomepageSnapshots(payload.publishedSnapshots);
    }
    logAuditEvent(
      'data_entry',
      'Deleted scalable homepage snapshot',
      `Snapshot ID: ${snapshotId}`
    );
    return payload;
  };

  const handleReseedScalableHomepageConfig = async (force = false) => {
    if (!apiConfiguration.scalableHomepageConfigEndpoint) {
      throw new Error('Scalable homepage config endpoint is not configured.');
    }

    const response = await fetch(`${apiConfiguration.scalableHomepageConfigEndpoint}/reseed-legacy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ force })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string; ownership?: ScalableLegacyOwnershipSummary } | null;
      const ownershipSummary = payload?.ownership
        ? ` Detached templates: ${payload.ownership.detachedTemplates}; detached assignments: ${payload.ownership.detachedAssignments}; detached campaigns: ${payload.ownership.detachedCampaigns}.`
        : '';
      throw new Error((payload?.error || 'Failed to reseed scalable homepage config') + ownershipSummary);
    }

    const payload = await response.json().catch(() => null);
    const normalized = normalizeScalableHomepageConfigState(payload?.config || null);
    setScalableHomepageConfig(normalized);
    logAuditEvent(
      'data_entry',
      'Reseeded scalable homepage configuration',
      `Templates: ${normalized.templates.length} | Campaigns: ${normalized.campaigns.length}`
    );
    return payload;
  };

  const replacePublishedHomepageSnapshots = (snapshots: PublishedHomepageSnapshot[]) => {
    setScalableHomepageConfig((previous) => {
      const baseState = normalizeScalableHomepageConfigState(previous || null);
      return normalizeScalableHomepageConfigState({
        ...baseState,
        publishedSnapshots: snapshots,
        metadata: {
          ...baseState.metadata,
          updatedAt: new Date().toISOString(),
        },
      });
    });
  };

  const handlePublishResolvedHomepages = async (publishRequest?: string[] | ResolvedHomepagePublishRequest) => {
    if (!apiConfiguration.publishResolvedHomepageEndpoint) {
      throw new Error('Resolved homepage publish endpoint is not configured.');
    }

    const requestBody = Array.isArray(publishRequest)
      ? {
          localityIds: publishRequest.length > 0 ? publishRequest : localities.map((locality) => locality.id)
        }
      : {
          ...(publishRequest || {}),
          localityIds: publishRequest?.localityIds && publishRequest.localityIds.length > 0
            ? publishRequest.localityIds
            : publishRequest?.contexts?.length
              ? undefined
              : localities.map((locality) => locality.id),
        };

    const response = await fetch(apiConfiguration.publishResolvedHomepageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Failed to publish resolved homepages');
    }

    const payload = await response.json().catch(() => null) as { publishedSnapshots?: PublishedHomepageSnapshot[] } | null;
    if (Array.isArray(payload?.publishedSnapshots)) {
      replacePublishedHomepageSnapshots(payload.publishedSnapshots);
    }

    logAuditEvent(
      'data_entry',
      'Published resolved homepage snapshots',
      Array.isArray(publishRequest)
        ? `Localities: ${(publishRequest.length > 0 ? publishRequest : localities.map((locality) => locality.id)).join(', ')}`
        : publishRequest?.contexts?.length
          ? `Contexts: ${publishRequest.contexts.map((context) => `${context.localityId}/${context.categoryId || 'all'}/${context.subcategoryId || 'all'}/${context.pincode || 'all'}/${context.placementKey || 'default'}/${context.device || 'all'}/${context.pageType || 'homepage'}`).join(', ')}`
          : `Localities: ${((publishRequest?.localityIds && publishRequest.localityIds.length > 0 ? publishRequest.localityIds : localities.map((locality) => locality.id))).join(', ')}`
    );
    return payload;
  };

  const handleDeleteResolvedHomepageSnapshots = async (deleteRequest?: ResolvedHomepageSnapshotDeleteRequest) => {
    if (!apiConfiguration.resolvedHomepageEndpoint) {
      throw new Error('Resolved homepage endpoint is not configured.');
    }

    const response = await fetch(`${apiConfiguration.resolvedHomepageEndpoint}/snapshots/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(deleteRequest || {})
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || 'Failed to delete resolved homepage snapshots');
    }

    const payload = await response.json().catch(() => null) as { publishedSnapshots?: PublishedHomepageSnapshot[] } | null;
    if (Array.isArray(payload?.publishedSnapshots)) {
      replacePublishedHomepageSnapshots(payload.publishedSnapshots);
    }

    logAuditEvent(
      'data_entry',
      'Deleted resolved homepage snapshots',
      deleteRequest?.snapshotIds?.length
        ? `Snapshot IDs: ${deleteRequest.snapshotIds.join(', ')}`
        : deleteRequest?.contexts?.length
          ? `Contexts: ${deleteRequest.contexts.map((context) => `${context.localityId}/${context.categoryId || 'all'}/${context.subcategoryId || 'all'}/${context.pincode || 'all'}/${context.placementKey || 'default'}/${context.device || 'all'}/${context.pageType || 'homepage'}`).join(', ')}`
          : 'Scoped delete request executed.'
    );
    return payload;
  };

  const refreshResolvedHomepageArtifactsInBackground = (localityIds?: string[]) => {
    if (apiConfiguration.syncMode !== 'api') return;
    if (!apiConfiguration.scalableHomepageConfigEndpoint && !apiConfiguration.publishResolvedHomepageEndpoint) {
      return;
    }
    const scopedLocalityIds = localityIds && localityIds.length > 0
      ? localityIds
      : localities.map((locality) => locality.id);

    Promise.resolve()
      .then(async () => {
        const canReseedFromLegacy = !scalableHomepageConfigLoadedRef.current
          || shouldAllowLegacyScalableReseed(normalizeScalableHomepageConfigState(scalableHomepageConfig));
        if (apiConfiguration.scalableHomepageConfigEndpoint && canReseedFromLegacy) {
          await handleReseedScalableHomepageConfig();
        }
        if (apiConfiguration.publishResolvedHomepageEndpoint) {
          await handlePublishResolvedHomepages(scopedLocalityIds);
        }
      })
      .catch(() => {
        // Keep legacy homepage config saved even if resolver refresh/publish is temporarily unavailable.
      });
  };

  const syncScalableConfigInBackground = (
    mutator: (config: ScalableHomepageConfigState) => ScalableHomepageConfigState,
    publishLocalityIds: string[] = []
  ) => {
    if (!scalableHomepageConfigLoadedRef.current) return;
    const canWriteScalableCms = Boolean(userSession.authToken) && ['admin', 'developer'].includes(userSession.role);
    if (!canWriteScalableCms) return;
    const nextConfig = mutator(normalizeScalableHomepageConfigState(scalableHomepageConfig));
    setScalableHomepageConfig(nextConfig);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.scalableHomepageConfigEndpoint) {
      void handleSaveScalableHomepageConfig(nextConfig)
        .then(() => {
          const scopedLocalityIds = Array.from(new Set(publishLocalityIds.filter(Boolean)));
          if (scopedLocalityIds.length === 0 || !apiConfiguration.publishResolvedHomepageEndpoint) return;
          return handlePublishResolvedHomepages(scopedLocalityIds);
        })
        .catch(() => {
          // Keep local state intact even if best-effort scalable sync fails.
      });
    }
  };

  const syncScalableLegacyCampaignSourceInBackground = (
    sourceTag: ScalableLegacyCampaignSourceTag,
    publishLocalityIds: string[] = [],
    sourceSignature = ''
  ) => {
    if (apiConfiguration.syncMode !== 'api' || !apiConfiguration.scalableHomepageConfigEndpoint) {
      return false;
    }
    if (!scalableHomepageConfigLoadedRef.current) {
      return true;
    }
    const canWriteScalableCms = Boolean(userSession.authToken) && ['admin', 'developer'].includes(userSession.role);
    if (!canWriteScalableCms) {
      return true;
    }
    const scopedLocalityIds: string[] = Array.from(new Set<string>(publishLocalityIds.filter(Boolean)));
    const syncSignature = JSON.stringify({
      sourceTag,
      localityIds: [...scopedLocalityIds].sort(),
      sourceSignature,
    });
    if (!legacyCampaignAutoSyncInitializedRef.current[sourceTag]) {
      legacyCampaignAutoSyncInitializedRef.current[sourceTag] = true;
      legacyCampaignAutoSyncSignatureRef.current[sourceTag] = syncSignature;
      return true;
    }
    if (legacyCampaignAutoSyncInFlightRef.current[sourceTag]) {
      return true;
    }
    if (legacyCampaignAutoSyncSignatureRef.current[sourceTag] === syncSignature) {
      return true;
    }
    legacyCampaignAutoSyncSignatureRef.current[sourceTag] = syncSignature;
    legacyCampaignAutoSyncInFlightRef.current[sourceTag] = true;
    void handleSyncScalableLegacyCampaigns([sourceTag], scopedLocalityIds)
      .then(() => {
        if (scopedLocalityIds.length === 0 || !apiConfiguration.publishResolvedHomepageEndpoint) return;
        return handlePublishResolvedHomepages(scopedLocalityIds);
      })
      .catch(() => {
        // Keep local state intact even if best-effort scalable sync fails.
      })
      .finally(() => {
        legacyCampaignAutoSyncInFlightRef.current[sourceTag] = false;
      });
    return true;
  };

  const handleManualHomepageConfigSync = () => {
    const payload = buildHomepageConfigPayload();
    persistHomepageConfigToServer(payload)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to sync homepage config');
        lastHomepageSyncSignatureRef.current = JSON.stringify(payload);
        setApiConfiguration((prev) => ({
          ...prev,
          lastHomepageSyncAt: new Date().toISOString()
        }));
        refreshResolvedHomepageArtifactsInBackground(localities.map((locality) => locality.id));
        logAuditEvent('data_entry', 'Manually synced homepage config', `Endpoint: ${apiConfiguration.homepageConfigEndpoint}`);
      })
      .catch(() => {
        alert('Homepage configuration sync failed. Please verify the API endpoint and try again.');
      });
  };

  useEffect(() => {
    if (!scalableHomepageConfigReady) return;
    if (apiConfiguration.syncMode !== 'api' || !apiConfiguration.scalableHomepageConfigEndpoint) {
      syncScalableConfigInBackground(
        (config) => syncScalableAssignmentsFromLayouts(syncScalableTemplatesFromLayouts(config, homepageLayouts), homepageLayouts),
        homepageLayouts.map((layout) => layout.localityId)
      );
      return;
    }
    const canWriteScalableCms = Boolean(userSession.authToken) && ['admin', 'developer'].includes(userSession.role);
    if (!canWriteScalableCms) return;
    const scopedLocalityIds: string[] = Array.from(new Set<string>(
      homepageLayouts
        .map((layout) => String(layout.localityId || '').trim())
        .filter((localityId): localityId is string => localityId.length > 0)
    ));
    const layoutSyncSignature = JSON.stringify(homepageLayouts.map((layout) => ({
      id: layout.id || '',
      localityId: layout.localityId,
      status: layout.status || '',
      updatedAt: layout.updatedAt || '',
      sections: Array.isArray(layout.sections) ? layout.sections.length : 0,
    })));
    const layoutRequestSignature = JSON.stringify({
      localityIds: [...scopedLocalityIds].sort(),
      layoutSyncSignature,
    });
    if (!legacyLayoutAutoSyncInitializedRef.current) {
      legacyLayoutAutoSyncInitializedRef.current = true;
      legacyLayoutAutoSyncSignatureRef.current = layoutRequestSignature;
      return;
    }
    if (legacyLayoutAutoSyncInFlightRef.current) return;
    if (legacyLayoutAutoSyncSignatureRef.current === layoutRequestSignature) return;
    legacyLayoutAutoSyncSignatureRef.current = layoutRequestSignature;
    legacyLayoutAutoSyncInFlightRef.current = true;
    void handleSyncScalableLegacyLayouts(scopedLocalityIds)
      .then(() => {
        if (scopedLocalityIds.length === 0 || !apiConfiguration.publishResolvedHomepageEndpoint) return;
        return handlePublishResolvedHomepages(scopedLocalityIds);
      })
      .catch(() => {
        // Keep local state intact even if best-effort scalable sync fails.
      })
      .finally(() => {
        legacyLayoutAutoSyncInFlightRef.current = false;
      });
  }, [homepageLayouts, scalableHomepageConfigReady, userSession.authToken, userSession.role]);

  useEffect(() => {
    if (!scalableHomepageConfigReady) return;
    const heroBannerLocalityIds = heroBanners.map((banner) => banner.localityId);
    const heroBannerSyncSignature = JSON.stringify(heroBanners.map((banner) => ({
      id: banner.id,
      localityId: banner.localityId,
      isActive: banner.isActive,
      startDate: banner.startDate || '',
      endDate: banner.endDate || '',
      updatedAt: banner.updatedAt || '',
    })));
    if (syncScalableLegacyCampaignSourceInBackground('legacy_hero_banner', heroBannerLocalityIds, heroBannerSyncSignature)) {
      return;
    }
    const nextCampaigns: ScalableCampaign[] = heroBanners.map((banner) => ({
      id: `hero_${banner.id}`,
      name: banner.title || `Hero Banner ${banner.id}`,
      campaignType: 'hero_banner',
      status: banner.isActive ? 'active' : 'inactive',
      priority: 100,
      isFallback: true,
      startDate: banner.startDate || undefined,
      endDate: banner.endDate || undefined,
      deviceTarget: 'all',
      placementKeys: [],
      targets: {
        localityIds: [banner.localityId],
        categoryIds: [],
        subcategoryIds: [],
        pincodes: banner.pincodes || [],
        devices: ['all'],
        pageTypes: ['homepage'],
        placementKeys: [],
      },
      payload: banner as unknown as Record<string, unknown>,
      metadata: {
        source: 'legacy_hero_banner',
      },
      updatedAt: new Date().toISOString(),
    }));
    syncScalableConfigInBackground(
      (config) => syncScalableCampaignCollection(config, 'hero_banner', nextCampaigns, 'legacy_hero_banner'),
      heroBannerLocalityIds
    );
  }, [heroBanners, scalableHomepageConfigReady, userSession.authToken, userSession.role]);

  useEffect(() => {
    if (!scalableHomepageConfigReady) return;
    const listingAdLocalityIds = listingAds.flatMap((ad) => ad.localityIds || []);
    const listingAdSyncSignature = JSON.stringify(listingAds.map((ad) => ({
      id: ad.id,
      localityIds: ad.localityIds || [],
      categoryIds: ad.categoryIds || [],
      isActive: ad.isActive,
      placementKey: ad.placementKey || '',
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
    })));
    if (syncScalableLegacyCampaignSourceInBackground('legacy_listing_ad', listingAdLocalityIds, listingAdSyncSignature)) {
      return;
    }
    const nextCampaigns: ScalableCampaign[] = listingAds.map((ad) => ({
      id: `ad_${ad.id}`,
      name: ad.title || `Listing Ad ${ad.id}`,
      campaignType: 'listing_ad',
      status: ad.isActive ? 'active' : 'inactive',
      priority: 100,
      isFallback: true,
      startDate: ad.startDate || undefined,
      endDate: ad.endDate || undefined,
      deviceTarget: ad.deviceTarget || 'all',
      placementKeys: ad.placementKey ? [ad.placementKey] : [],
      targets: {
        localityIds: ad.localityIds || [],
        categoryIds: ad.categoryIds || [],
        subcategoryIds: [],
        pincodes: ad.pincodes || [],
        devices: [ad.deviceTarget || 'all'],
        pageTypes: ['homepage', 'listing_results'],
        placementKeys: ad.placementKey ? [ad.placementKey] : [],
      },
      payload: ad as unknown as Record<string, unknown>,
      metadata: {
        source: 'legacy_listing_ad',
      },
      updatedAt: new Date().toISOString(),
    }));
    syncScalableConfigInBackground(
      (config) => syncScalableCampaignCollection(config, 'listing_ad', nextCampaigns, 'legacy_listing_ad'),
      listingAdLocalityIds
    );
  }, [listingAds, scalableHomepageConfigReady, userSession.authToken, userSession.role]);

  useEffect(() => {
    if (!scalableHomepageConfigReady) return;
    const couponLocalityIds = coupons.flatMap((coupon) => {
      if (Array.isArray(coupon.localityIds) && coupon.localityIds.length > 0) {
        return coupon.localityIds;
      }
      const relatedBusiness = businesses.find((business) => business.id === coupon.businessId);
      return relatedBusiness?.localityId ? [relatedBusiness.localityId] : [];
    });
    const couponSyncSignature = JSON.stringify(coupons.map((coupon) => ({
      id: coupon.id,
      businessId: coupon.businessId,
      localityIds: coupon.localityIds || [],
      categoryIds: coupon.categoryIds || [],
      status: coupon.status || '',
      isActive: coupon.isActive,
      startDate: coupon.startDate || '',
      expiryDate: coupon.expiryDate || coupon.endDate || '',
    })));
    if (syncScalableLegacyCampaignSourceInBackground('legacy_coupon', couponLocalityIds, couponSyncSignature)) {
      return;
    }
    const nextCampaigns: ScalableCampaign[] = coupons.map((coupon) => {
      const relatedBusiness = businesses.find((business) => business.id === coupon.businessId);
      return {
        id: `offer_${coupon.id}`,
        name: coupon.title || coupon.code || `Offer ${coupon.id}`,
        campaignType: 'offer',
        status: coupon.isActive === false ? 'inactive' : 'active',
        priority: 100,
        isFallback: true,
        startDate: coupon.startDate || undefined,
        endDate: coupon.endDate || coupon.expiryDate || undefined,
        deviceTarget: 'all',
        placementKeys: [],
        targets: {
          localityIds: coupon.localityIds && coupon.localityIds.length > 0
            ? coupon.localityIds
            : (relatedBusiness ? [relatedBusiness.localityId] : []),
          categoryIds: coupon.categoryIds || (relatedBusiness?.categoryId ? [relatedBusiness.categoryId] : []),
          subcategoryIds: relatedBusiness?.subcategoryId ? [relatedBusiness.subcategoryId] : [],
          pincodes: coupon.pincodes || (relatedBusiness?.pincode ? [relatedBusiness.pincode] : []),
          devices: ['all'],
          pageTypes: ['homepage', 'listing_results'],
          placementKeys: [],
        },
        payload: coupon as unknown as Record<string, unknown>,
        metadata: {
          source: 'legacy_coupon',
        },
        updatedAt: new Date().toISOString(),
      };
    });
    syncScalableConfigInBackground(
      (config) => syncScalableCampaignCollection(config, 'offer', nextCampaigns, 'legacy_coupon'),
      nextCampaigns.flatMap((campaign) => campaign.targets.localityIds || [])
    );
  }, [coupons, businesses, scalableHomepageConfigReady, userSession.authToken, userSession.role]);

  useEffect(() => {
    if (!scalableHomepageConfigReady) return;
    const communityLocalityIds = communityItems.map((item) => item.localityId);
    const communitySyncSignature = JSON.stringify(communityItems.map((item) => ({
      id: item.id,
      localityId: item.localityId,
      status: item.status,
      publishAt: item.publishAt || '',
      expireAt: item.expireAt || '',
      isSponsored: item.isSponsored,
    })));
    if (syncScalableLegacyCampaignSourceInBackground('legacy_community_item', communityLocalityIds, communitySyncSignature)) {
      return;
    }
    const nextCampaigns: ScalableCampaign[] = communityItems.map((item) => ({
      id: `content_${item.id}`,
      name: item.title || `Content Block ${item.id}`,
      campaignType: 'content_block',
      status: item.status === 'archived'
        ? 'archived'
        : item.status === 'draft'
          ? 'draft'
          : 'active',
      priority: item.isSponsored ? 120 : 100,
      isFallback: true,
      startDate: item.publishAt ? item.publishAt.slice(0, 10) : item.createdAt.slice(0, 10),
      endDate: item.expireAt ? item.expireAt.slice(0, 10) : undefined,
      deviceTarget: 'all',
      placementKeys: [],
      targets: {
        localityIds: [item.localityId],
        categoryIds: [],
        subcategoryIds: [],
        pincodes: [],
        devices: ['all'],
        pageTypes: ['homepage'],
        placementKeys: [],
      },
      payload: item as unknown as Record<string, unknown>,
      metadata: {
        source: 'legacy_community_item',
      },
      updatedAt: new Date().toISOString(),
    }));
    syncScalableConfigInBackground(
      (config) => syncScalableCampaignCollection(config, 'content_block', nextCampaigns, 'legacy_community_item'),
      communityLocalityIds
    );
  }, [communityItems, scalableHomepageConfigReady, userSession.authToken, userSession.role]);

  useEffect(() => {
    if (!scalableHomepageConfigReady) return;
    const sponsoredLocalityIds = businesses
      .filter((business) => business.isSponsored)
      .map((business) => business.localityId);
    const sponsoredSyncSignature = JSON.stringify(businesses
      .filter((business) => business.isSponsored)
      .map((business) => ({
        id: business.id,
        localityId: business.localityId,
        categoryId: business.categoryId || '',
        subcategoryId: business.subcategoryId || '',
        pincode: business.pincode || '',
        status: business.status || '',
        cpcBudget: business.cpcBudget || '',
      })));
    if (syncScalableLegacyCampaignSourceInBackground('legacy_business_sponsorship', sponsoredLocalityIds, sponsoredSyncSignature)) {
      return;
    }
    const nextCampaigns: ScalableCampaign[] = businesses
      .filter((business) => business.isSponsored)
      .map((business) => ({
        id: `sponsored_${business.id}`,
        name: business.name || `Sponsored Listing ${business.id}`,
        campaignType: 'sponsored_listing',
        status: business.status === 'approved' ? 'active' : 'inactive',
        priority: Number.isFinite(Number(business.cpcBudget)) ? Math.round(Number(business.cpcBudget)) : 100,
        isFallback: true,
        deviceTarget: 'all',
        placementKeys: [],
        targets: {
          localityIds: [business.localityId],
          categoryIds: business.categoryId ? [business.categoryId] : [],
          subcategoryIds: business.subcategoryId ? [business.subcategoryId] : [],
          pincodes: business.pincode ? [business.pincode] : [],
          devices: ['all'],
          pageTypes: ['homepage', 'listing_results'],
          placementKeys: [],
        },
        maxItems: 1,
        payload: {
          businessIds: [business.id],
          sellerBusinessId: business.id,
          businessName: business.name,
        },
        metadata: {
          source: 'legacy_business_sponsorship',
        },
        updatedAt: new Date().toISOString(),
      }));
    syncScalableConfigInBackground(
      (config) => syncScalableCampaignCollection(config, 'sponsored_listing', nextCampaigns, 'legacy_business_sponsorship'),
      nextCampaigns.flatMap((campaign) => campaign.targets.localityIds || [])
    );
  }, [businesses, scalableHomepageConfigReady, userSession.authToken, userSession.role]);

  const handleSubmitAdLead = (leadInput: Omit<AdLead, 'id' | 'createdAt'>) => {
    const freshLead: AdLead = normalizeStoredAdLead({
      ...leadInput,
      id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    });
    setAdLeads((prev) => [freshLead, ...prev]);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.adLeadsEndpoint) {
      void fetch(apiConfiguration.adLeadsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adLead: freshLead }),
      }).catch(() => {
        // Keep local state intact even if best-effort ad lead sync fails.
      });
    }

    if (leadInput.sellerBusinessId) {
      setCrmContacts((prev) => {
        const crmLead: CRMContact = {
          id: `crm_ad_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          businessId: leadInput.sellerBusinessId as string,
          name: leadInput.name,
          phone: leadInput.mobile,
          lastInteraction: freshLead.createdAt,
          followUpNotes: `Lead captured from ad campaign (${leadInput.adId})`,
          loyaltyPoints: 0
        };
        return [crmLead, ...prev];
      });
    }

    logAuditEvent(
      'data_entry',
      'Captured ad lead',
      `Ad ID: ${leadInput.adId} | Seller ID: ${leadInput.sellerBusinessId || 'platform'} | Mobile: ${leadInput.mobile}`
    );
  };

  const handleCreateLocalityCategoryLink = (payload: Omit<LocalityCategoryLink, 'id'>) => {
    const linkRecord = {
      ...payload,
      id: `lc_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    const nextLocalityCategoryLinks = [linkRecord, ...localityCategoryLinks];
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ localityCategoryLinks: nextLocalityCategoryLinks });
    }
    setLocalityCategoryLinks(nextLocalityCategoryLinks);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation('locality-category-links', 'POST', { localityCategoryLink: linkRecord }).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent(
      'data_entry',
      'Created locality-category URL mapping',
      `Locality: ${payload.localityId} | Category: ${payload.categoryId} | Subcategory: ${payload.subcategoryId || 'all'}`
    );
  };

  const handleDeleteLocalityCategoryLink = (id: string) => {
    const nextLocalityCategoryLinks = localityCategoryLinks.filter((row) => row.id !== id);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ localityCategoryLinks: nextLocalityCategoryLinks });
    }
    setLocalityCategoryLinks(nextLocalityCategoryLinks);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageConfigCollectionMutation(`locality-category-links/${encodeURIComponent(id)}`, 'DELETE').catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', 'Deleted locality-category URL mapping', `Mapping ID: ${id}`);
  };

  const handleApproveBusiness = (bizId: string) => {
    setBusinesses(prev => {
      const next = prev.map(b => {
        if (b.id === bizId) {
          logAuditEvent('data_entry', `Approved business listing registration: "${b.name}"`, `Successfully validated SLA & activated routing headers for ID ${bizId}`);
          return { ...b, status: 'approved' };
        }
        return b;
      });
      persistBusinessesToServer(next);
      return next;
    });
  };

  const handleRejectBusiness = (bizId: string, reason: string) => {
    setBusinesses(prev => {
      const next = prev.map(b => {
        if (b.id === bizId) {
          logAuditEvent('data_entry', `Rejected business listing application: "${b.name}"`, `Reason of refusal: "${reason}" | App ID ${bizId} flag rejected`);
          return { ...b, status: 'rejected', rejectionReason: reason };
        }
        return b;
      });
      persistBusinessesToServer(next);
      return next;
    });
  };

  const handleCreateLocality = (name: string, subdomain: string, description: string, image: string) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newLoc: Locality = {
      id,
      name,
      slug: id,
      subdomain,
      description,
      status: 'active',
      coverImage: image,
      stats: { numBusinesses: 0, numPending: 0 },
      carouselImages: [
        image,
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
      ]
    };

    const newSub: SubdomainMapping = {
      domain: subdomain,
      localityId: id,
      sslEnabled: true,
      dnsStatus: 'active',
      createdAt: new Date().toISOString()
    };

    syncLocalityRoutingConfigInBackground((config) => ({
      ...config,
      localities: [...config.localities, newLoc],
      subdomains: [...config.subdomains, newSub],
      metadata: {
        ...config.metadata,
        seededFromCode: false,
        updatedAt: new Date().toISOString(),
      },
    }));
    const nextLayout = buildDefaultHomepageLayout(newLoc, homepageDefaultsConfig.sectionTemplates);
    const nextLayouts = [...homepageLayouts.filter((layout) => layout.localityId !== id), nextLayout];
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ homepageLayouts: nextLayouts });
    }
    setHomepageLayouts(nextLayouts);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageLayoutMutation(id, 'PUT', nextLayout).catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    logAuditEvent('data_entry', `Provisioned new municipal zone shard database and SSL routing: "${name}"`, `Virtual host bound to: ${subdomain}`);
  };

  const handleDeleteLocality = (locId: string) => {
    const target = localities.find(l => l.id === locId);
    const remaining = localities.filter(l => l.id !== locId);
    syncLocalityRoutingConfigInBackground((config) => ({
      ...config,
      localities: config.localities.filter((locality) => locality.id !== locId),
      subdomains: config.subdomains.filter((subdomain) => subdomain.localityId !== locId),
      pincodeMappings: config.pincodeMappings.filter((mapping) => mapping.localityId !== locId),
      defaultLocalityId: config.defaultLocalityId === locId
        ? (remaining[0]?.id || DEFAULT_LOCALITY_ID)
        : config.defaultLocalityId,
      metadata: {
        ...config.metadata,
        seededFromCode: false,
        updatedAt: new Date().toISOString(),
      },
    }));
    const nextLayouts = homepageLayouts.filter((layout) => layout.localityId !== locId);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      setHomepageConfigSyncSignatureForOverrides({ homepageLayouts: nextLayouts });
    }
    setHomepageLayouts(nextLayouts);
    if (apiConfiguration.syncMode === 'api' && apiConfiguration.homepageConfigEndpoint) {
      void persistHomepageLayoutMutation(locId, 'DELETE').catch(() => {
        lastHomepageSyncSignatureRef.current = '';
      });
    }
    // Re-route if deleting current active locality
    if (activeLocalityId === locId) {
      if (remaining.length > 0) {
        setActiveLocalityId(remaining[0].id);
      }
    }
    logAuditEvent('data_entry', `Decommissioned municipal zone mapping: "${target?.name || locId}"`, `Removed SSL bindings and virtual shards`);
  };

  const handleSubmitApplication = (appData: Omit<Business, 'id' | 'status' | 'createdAt' | 'rating' | 'reviewCount'>) => {
    const newBiz: Business = {
      ...appData,
      id: `b_dynamic_${Date.now()}`,
      status: 'approved',
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      pincode: appData.pincode || MASTER_AREAS.find((area) => area.id === appData.areaId)?.pincode || ''
    };

    setBusinesses(prev => {
      const next = [newBiz, ...prev];
      persistBusinessesToServer(next);
      return next;
    });
    logAuditEvent('data_entry', `Submitted registration request for new business: "${appData.name}"`, `Owner/Proprietor: ${appData.ownerName} | Ph: ${appData.phone} | Shard Locality: ${appData.localityId}`);
  };

  // Allow Admins, Moderators, Sellers, and Data Operators to directly modify listings
  const handleUpdateBusiness = (updatedBiz: Business) => {
    logAuditEvent('data_entry', `Business listing updated: "${updatedBiz.name}"`, `Updated listing ID: ${updatedBiz.id} | Locality: ${updatedBiz.localityId}`);
    setBusinesses(prev => {
      const normalized = normalizeStoredBusiness({
        ...updatedBiz,
        pincode: updatedBiz.pincode || MASTER_AREAS.find((area) => area.id === updatedBiz.areaId)?.pincode || ''
      });
      const next = prev.map(b => b.id === normalized.id ? normalized : b);
      persistBusinessesToServer(next);
      return next;
    });
  };

  // Add a verified customer review, and update rating counters
  const handleAddReview = (businessId: string, userName: string, userPhone: string, rating: number, comment: string) => {
    const newReview: Review = {
      id: `rev_${Date.now()}`,
      businessId,
      userName,
      userPhone,
      rating,
      comment,
      createdAt: new Date().toISOString(),
      verifiedByOtp: true
    };

    const nextReviews = [...reviews, newReview];
    setReviews(nextReviews);
    const reviewedBusiness = businesses.find((business) => business.id === businessId);
    appendBuyerActivityEvent({
      actionType: 'review_submitted',
      businessId,
      title: 'Submitted verified review',
      detail: `${reviewedBusiness?.name || 'Business'} • ${rating}★`,
    });

    // Recalculate average rating & reviewCount for this business
    setBusinesses(prevBizs => {
      const next = prevBizs.map(b => {
        if (b.id === businessId) {
          const itemReviews = nextReviews.filter(r => r.businessId === businessId);
          const sumRating = itemReviews.reduce((sum, r) => sum + r.rating, 0);
          const avg = parseFloat((sumRating / itemReviews.length).toFixed(1));
          logAuditEvent('data_entry', `Created OTP-verified customer rating for: "${b.name}"`, `${rating}★ given by ${userName}`);
          return {
            ...b,
            rating: avg,
            reviewCount: itemReviews.length
          };
        }
        return b;
      });
      persistBusinessesToServer(next);
      return next;
    });
  };

  // Register that a user safely unlocked a verified listing via sliding Captcha and OTP validated
  const handleRegisterContactView = async (payload: { businessId: string; viewerName?: string; viewerPhone?: string; unlockToken?: string }) => {
    try {
      const businessId = payload.businessId;
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/contact-unlock/record-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          businessId,
          viewerName: payload.viewerName || userSession.userName || 'Anonymous Explorer',
          viewerPhone: payload.viewerPhone || userSession.userPhone || '',
          deviceId,
          unlockToken: payload.unlockToken || '',
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.error || 'Daily contact view limit reached.';
        alert(message);
        return false;
      }

      setViewedBusinessIds((prev) => (prev.includes(businessId) ? prev : [...prev, businessId]));
      const b = businesses.find((x) => x.id === businessId);
      appendBuyerActivityEvent({
        actionType: 'contact_unlock',
        businessId,
        title: 'Unlocked business contact',
        detail: b?.name || businessId,
      });
      logAuditEvent('contact_view', `Unlocked business contact coordinates (OTP Verified)`, `Revealed contact for "${b?.name || businessId}" | Listing ID: ${businessId}`);
      return true;
    } catch (err) {
      console.error('Failed to record contact unlock:', err);
      alert('Unable to verify contact unlock right now. Please try again.');
      return false;
    }
  };

  const handleResetData = () => {
    if (confirm("Reset application data back to Indian defaults? This clears pending/registered custom edits.")) {
      localStorage.removeItem('yp_localities');
      localStorage.removeItem('yp_businesses');
      localStorage.removeItem('yp_subdomains');
      localStorage.removeItem('yp_reviews');
      localStorage.removeItem('yp_user_session');
      localStorage.removeItem('yp_viewed_bizs');
      localStorage.removeItem('yp_saved_business_ids');
      localStorage.removeItem('yp_buyer_activity_events');
      localStorage.removeItem('yp_community');
      localStorage.removeItem('yp_crm');
      localStorage.removeItem('yp_coupons');
      localStorage.removeItem('yp_audit_logs');
      localStorage.removeItem('yp_saved_pincode');
      localStorage.removeItem('yp_saved_locality_id');
      localStorage.removeItem('yp_pincode_prompted');
      localStorage.removeItem('yp_pincode_mappings');
      localStorage.removeItem('yp_default_locality_id');
      localStorage.removeItem('yp_listing_ads');
      localStorage.removeItem('yp_ad_leads');
      localStorage.removeItem('yp_hero_banners');
      localStorage.removeItem('yp_locality_category_links');
      localStorage.removeItem('yp_homepage_layouts');
      localStorage.removeItem('yp_api_configuration');
      
      const resetLocalities = (DEFAULT_LOCALITIES as Locality[]).map(normalizeStoredLocality);
      setLocalities(resetLocalities);
      setBusinesses([]);
      setReviews(INITIAL_REVIEWS);
      setViewedBusinessIds([]);
      setSavedBusinessIds([]);
      setBuyerActivityEvents([]);
      setCommunityItems([]);
      setCrmContacts(INITIAL_CRM_CONTACTS);
      setCoupons([]);
      setListingAds([]);
      setAdLeads([]);
      const heroBannerDraftDefaults = getRuntimeHeroBannerDraftDefaults();
      const resetHeroEndDate = new Date();
      resetHeroEndDate.setDate(resetHeroEndDate.getDate() + heroBannerDraftDefaults.durationDays);
      const resetHeroBanners: HeroBanner[] = (DEFAULT_LOCALITIES as Locality[]).map((locality) => ({
        id: `hero_${locality.id}`,
        localityId: locality.id,
        title: `Hyper Local Directory for ${locality.name.split(',')[0]}`,
        subtitle: `${locality.description} verified reviews, location-grabbing utilities, and dynamic approval tracking.`,
        imageUrl: (locality.carouselImages && locality.carouselImages[0]) || locality.coverImage,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: resetHeroEndDate.toISOString().slice(0, 10),
        ctaLabel: heroBannerDraftDefaults.ctaLabel,
        ctaType: heroBannerDraftDefaults.ctaType,
        ctaTarget: heroBannerDraftDefaults.ctaTarget,
        isActive: true
      }));
      setHeroBanners(resetHeroBanners.map(normalizeStoredHeroBanner));
      setLocalityCategoryLinks([]);
      setHomepageLayouts(resetLocalities.map((locality) => buildDefaultHomepageLayout(locality, homepageDefaultsConfig.sectionTemplates)));
      setApiConfiguration(DEFAULT_API_CONFIGURATION);
      lastHomepageSyncSignatureRef.current = '';
      setSubdomains((buildDefaultSubdomainMappings(DEFAULT_LOCALITIES) as SubdomainMapping[]).map(normalizeStoredSubdomain));
      setViewedBusinessIds(['s1']);
      setUserSession({
        role: 'buyer',
        userName: 'Karan Malhotra (Verified Citizen)',
        userPhone: '+91 80011 22334',
        isAuthenticated: true
      });
      setActiveLocalityId(DEFAULT_LOCALITY_ID);
      setSavedPincode(null);
      setShowPincodeModal(true);
      setDefaultLocalityId(DEFAULT_LOCALITY_ID);
      setPincodeMappings((DEFAULT_PINCODE_MAPPINGS as PincodeRoutingMapping[]).map(normalizeStoredPincodeMapping));
      setUrlCategoryFilter(null);
      setUrlSubcategoryFilter(null);
      setUrlFilterNonce(0);

      if (apiConfiguration.syncMode === 'api') {
        void fetch(apiConfiguration.businessesEndpoint)
          .then((response) => (response.ok ? response.json() : null))
          .then((data: { businesses?: Business[] } | null) => {
            if (Array.isArray(data?.businesses) && data.businesses.length > 0) {
              setBusinesses(data.businesses.map(normalizeStoredBusiness));
            }
          })
          .catch(() => {});

        void Promise.all([
          fetch(getHomepageApiConfigurationEndpoint()).then((response) => (response.ok ? response.json() : null)),
          fetch(getHomepageLayoutsEndpoint()).then((response) => (response.ok ? response.json() : null)),
          fetch(getHomepageConfigCollectionEndpoint('hero-banners')).then((response) => (response.ok ? response.json() : null)),
          fetch(getHomepageConfigCollectionEndpoint('listing-ads')).then((response) => (response.ok ? response.json() : null)),
          fetch(getHomepageConfigCollectionEndpoint('coupons')).then((response) => (response.ok ? response.json() : null)),
          fetch(getHomepageConfigCollectionEndpoint('community-items')).then((response) => (response.ok ? response.json() : null)),
          fetch(getHomepageConfigCollectionEndpoint('locality-category-links')).then((response) => (response.ok ? response.json() : null)),
        ])
          .then(([
            apiConfigurationData,
            layoutsData,
            heroBannersData,
            listingAdsData,
            couponsData,
            communityItemsData,
            localityCategoryLinksData,
          ]) => {
            const normalizedConfig = normalizeHomepageConfigState({
              apiConfiguration: apiConfigurationData?.apiConfiguration || {},
              homepageLayouts: layoutsData?.layouts || [],
              heroBanners: heroBannersData?.heroBanners || [],
              listingAds: listingAdsData?.listingAds || [],
              coupons: couponsData?.coupons || [],
              communityItems: communityItemsData?.communityItems || [],
              localityCategoryLinks: localityCategoryLinksData?.localityCategoryLinks || [],
            }, resetLocalities, homepageDefaultsConfig.sectionTemplates);
            setHeroBanners(normalizedConfig.heroBanners.map(normalizeStoredHeroBanner));
            setListingAds(normalizedConfig.listingAds.map(normalizeStoredListingAd));
            setCoupons(normalizedConfig.coupons.map(normalizeStoredCoupon));
            setHomepageLayouts(normalizedConfig.homepageLayouts);
            setLocalityCategoryLinks(normalizedConfig.localityCategoryLinks);
            setCommunityItems(normalizedConfig.communityItems.map(normalizeStoredCommunityItem));
            setApiConfiguration((prev) => normalizeApiConfiguration({
              ...prev,
              ...normalizedConfig.apiConfiguration,
            }));
          })
          .catch(() => fetch(apiConfiguration.homepageConfigEndpoint)
            .then((response) => (response.ok ? response.json() : null))
            .then((data: { config?: Partial<HomepageConfigState> } | null) => {
              if (!data?.config) return;
              const normalizedConfig = normalizeHomepageConfigState(data.config, resetLocalities, homepageDefaultsConfig.sectionTemplates);
              setHeroBanners(normalizedConfig.heroBanners.map(normalizeStoredHeroBanner));
              setListingAds(normalizedConfig.listingAds.map(normalizeStoredListingAd));
              setCoupons(normalizedConfig.coupons.map(normalizeStoredCoupon));
              setHomepageLayouts(normalizedConfig.homepageLayouts);
              setLocalityCategoryLinks(normalizedConfig.localityCategoryLinks);
              setCommunityItems(normalizedConfig.communityItems.map(normalizeStoredCommunityItem));
            }))
          .catch(() => {});
      }

      alert("Application storage cleared & restored to Roadpali metrics!");
    }
  };

  // Pincode Routing Engine operations
  const handleSavePincode = (pincode: string | null, matchedLocalityId: string) => {
    setSavedPincode(pincode);
    localStorage.setItem('yp_saved_locality_id', matchedLocalityId);
    if (pincode) {
      localStorage.setItem('yp_saved_pincode', pincode);
    } else {
      localStorage.removeItem('yp_saved_pincode');
    }
    localStorage.setItem('yp_pincode_prompted', 'true');
    setActiveLocalityId(matchedLocalityId);
    setUrlCategoryFilter(null);
    setUrlSearchFilter(null);
    setUrlFilterNonce((prev) => prev + 1);
    const matchedLocality = localities.find((locality) => locality.id === matchedLocalityId);
    const localitySlug = matchedLocality?.slug || matchedLocalityId;
    window.history.pushState({}, '', `/${localitySlug}`);
    logAuditEvent('data_entry', `Pincode Routing Executed`, `Mapped pin: ${pincode || 'Skipped'}. Routed interface view to: "${matchedLocalityId}"`);
  };

  const handleAddPincodeMapping = (pincode: string, localityId: string) => {
    syncLocalityRoutingConfigInBackground((config) => ({
      ...config,
      pincodeMappings: [
        ...config.pincodeMappings.filter((mapping) => mapping.pincode !== pincode),
        { pincode, localityId },
      ],
      metadata: {
        ...config.metadata,
        seededFromCode: false,
        updatedAt: new Date().toISOString(),
      },
    }));
    logAuditEvent('data_entry', `Added dynamic route mapping`, `Bind Postal: "${pincode}" -> Regional Node: "${localityId}"`);
  };

  const handleDeletePincodeMapping = (pincode: string) => {
    syncLocalityRoutingConfigInBackground((config) => ({
      ...config,
      pincodeMappings: config.pincodeMappings.filter((mapping) => mapping.pincode !== pincode),
      metadata: {
        ...config.metadata,
        seededFromCode: false,
        updatedAt: new Date().toISOString(),
      },
    }));
    logAuditEvent('data_entry', `Deleted route mapping`, `De-registered routing for Pincode: "${pincode}"`);
  };

  const handleChangeDefaultLocalityId = (localityId: string) => {
    syncLocalityRoutingConfigInBackground((config) => ({
      ...config,
      defaultLocalityId: localityId,
      metadata: {
        ...config.metadata,
        seededFromCode: false,
        updatedAt: new Date().toISOString(),
      },
    }));
    logAuditEvent('data_entry', `Default fallback page adjusted`, `Root Fallback set to: "${localityId}"`);
  };

  // Helper names & avatars for simulated roles
  const simulateRoleLogin = (role: UserRole) => {
    switch (role) {
      case 'admin':
        setUserSession({
          role: 'admin',
          userName: 'Rahul Sharma (National Administrator)',
          isAuthenticated: true,
          userPhone: '+91 99990 12345'
        });
        break;
      case 'moderator':
        setUserSession({
          role: 'moderator',
          userName: 'Priya Iyer (Region Coordinator)',
          isAuthenticated: true,
          userPhone: '+91 98880 54121'
        });
        break;
      case 'operator':
        setUserSession({
          role: 'operator',
          userName: 'Devashish Sen (Data Entry Specialist)',
          isAuthenticated: true,
          userPhone: '+91 91720 00192'
        });
        break;
      case 'seller':
        setUserSession({
          role: 'seller',
          userName: 'Kamesh Iyer (Proprietor Trader)',
          isAuthenticated: true,
          sellerBusinessId: 's1', // Pre-linked to 5 Elements for quick testing
          userPhone: '+91 80555 87788'
        });
        break;
      case 'buyer':
      default:
        setUserSession({
          role: 'buyer',
          userName: 'Anonymous Guest Explorer',
          isAuthenticated: false // Will require human Captcha slider + static SMS OTP code
        });
        break;
    }
    logAuditEvent('data_entry', 'Role switched in sandbox', `Switched to role: ${role}`);
  };

  const setActiveViewWithAudit = (nextView: 'proposal' | 'web' | 'android' | 'admin') => {
    if (PRODUCTION_MODE && (nextView === 'proposal' || nextView === 'android')) return;
    setActiveView(nextView);
    logAuditEvent('data_entry', 'Interface view switched', `Active view changed to: ${nextView}`);
  };

  const canAccessAdmin = ['admin', 'moderator', 'developer'].includes(userSession.role);

  useEffect(() => {
    const resolveLocalityFromToken = (token: string) => {
      const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, '');
      return localities.find((locality) => {
        const compactName = locality.name.split(',')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        return [locality.id, locality.slug, compactName].includes(normalized);
      });
    };

    const applyUrlContext = () => {
      const url = new URL(window.location.href);
      const pathParts = url.pathname.split('/').filter(Boolean);

      let pincodeToken = (url.searchParams.get('pin') || '').replace(/\D/g, '');
      let localityToken = (url.searchParams.get('locality') || '').trim().toLowerCase();
      let categoryToken = (url.searchParams.get('category') || '').trim().toLowerCase();
      let subcategoryToken = (url.searchParams.get('subcategory') || '').trim().toLowerCase();
      const srpToken = (url.searchParams.get('srp') || url.searchParams.get('q') || '').trim();
      let shouldOpenSearchResults = Boolean(srpToken || categoryToken || subcategoryToken);

      if (pathParts[0] === 'pin' && pathParts[1]) {
        pincodeToken = pathParts[1].replace(/\D/g, '');
      }

      if ((pathParts[0] === 'locality' || pathParts[0] === 'explore') && pathParts[1]) {
        localityToken = pathParts[1].trim().toLowerCase();
      }

      if ((pathParts[0] === 'locality' || pathParts[0] === 'explore') && pathParts[2]) {
        const routeCategoryToken = pathParts[2].trim().toLowerCase();
        if (BUSINESS_CATEGORIES.some((category) => [category.id, category.slug].includes(routeCategoryToken))) {
          categoryToken = routeCategoryToken;
        } else {
          subcategoryToken = routeCategoryToken;
        }
        shouldOpenSearchResults = true;
      }

      const directLink = localityCategoryLinks.find((link) => link.slug.toLowerCase() === pathParts.join('/').toLowerCase());
      if (directLink) {
        localityToken = directLink.localityId;
        categoryToken = directLink.categoryId;
        subcategoryToken = directLink.subcategoryId || subcategoryToken;
        shouldOpenSearchResults = true;
      }

      if (/^\d{6}$/.test(pincodeToken)) {
        const pinMapping = pincodeMappings.find((mapping) => mapping.pincode === pincodeToken);
        if (pinMapping) {
          setSavedPincode(pincodeToken);
          setActiveLocalityId(pinMapping.localityId);
          localStorage.setItem('yp_saved_pincode', pincodeToken);
          localStorage.setItem('yp_saved_locality_id', pinMapping.localityId);
          localStorage.setItem('yp_pincode_prompted', 'true');
          setShowPincodeModal(false);
        }
      }

      if (localityToken) {
        const matchedLocality = resolveLocalityFromToken(localityToken);
        if (matchedLocality) {
          setActiveLocalityId(matchedLocality.id);
        }
      }

      const mappedSubcategory = BUSINESS_SUBCATEGORIES.find((subcategory) => (
        [subcategory.id, subcategory.slug].includes(subcategoryToken)
      ));
      const mappedCategory = BUSINESS_CATEGORIES.find((category) => (
        [category.id, category.slug].includes(resolveMasterCategoryId(categoryToken))
      ));

      const resolvedCategory = mappedCategory?.id || mappedSubcategory?.categoryId || null;
      const resolvedSubcategory = mappedSubcategory?.id || null;
      setUrlCategoryFilter(resolvedCategory);
      setUrlSubcategoryFilter(resolvedSubcategory);
      setUrlSearchFilter(srpToken || null);
      setUrlIsSearchResults(shouldOpenSearchResults);
      setUrlFilterNonce((prev) => prev + 1);
    };

    applyUrlContext();
    window.addEventListener('popstate', applyUrlContext);
    return () => window.removeEventListener('popstate', applyUrlContext);
  }, [localities, pincodeMappings, localityCategoryLinks]);

  const handleBulkImportBusinesses = (rows: Array<{
    businessName: string;
    address: string;
    area: string;
    city: string;
    state: string;
    pin: string;
    mobile: string;
    rating: string;
    reviews: string;
    services: string;
    category?: string;
    subcategory?: string;
    latitude: string;
    longitude: string;
    importAction?: 'create' | 'update';
    existingBusinessId?: string;
    localityId?: string;
    areaId?: string;
    categoryId?: string;
    subcategoryId?: string;
    sourceCategoryLabel?: string;
    sourceSubcategoryLabel?: string;
    taxonomyMapped?: boolean;
    tags?: string[];
  }>) => {
    const inferLocality = (area: string) => {
      const a = area.toLowerCase();
      if (a.includes('kharghar')) return 'kharghar';
      if (a.includes('kamothe')) return 'kamothe';
      if (a.includes('panvel')) return 'panvel';
      if (a.includes('taloja')) return 'taloja';
      if (a.includes('kalamboli')) return 'kalamboli';
      return 'roadpali';
    };

    let imported = 0;
    let skipped = 0;

    setBusinesses(prev => {
      const next = [...prev];
      const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      const getBusinessPincode = (b: Business) => b.pincode || MASTER_AREAS.find(a => a.id === b.areaId)?.pincode || '';

      for (const row of rows) {
        const phone = row.mobile && row.mobile !== '—' ? (row.mobile.startsWith('+91') ? row.mobile : `+91 ${row.mobile}`) : '';
        const address = row.address && row.address !== '—' ? row.address : `${row.area || 'Unknown Area'}, ${row.city || 'Navi Mumbai'}`;
        const name = row.businessName.trim();
        if (!name) {
          skipped++;
          continue;
        }
        const localityId = row.localityId || inferLocality(row.area || row.city || '');
        const areaMatch = MASTER_AREAS.find(a => a.id === row.areaId) || MASTER_AREAS.find(a => a.name.toLowerCase().includes((row.area || '').toLowerCase()));
        const areaId = row.areaId || areaMatch?.id || 'roadpali-sec17';
        const rating = row.rating && row.rating !== '—' ? parseFloat(row.rating) : 0;
        const reviewCount = row.reviews && row.reviews !== '—' ? parseInt(row.reviews, 10) || 0 : 0;
        const lat = row.latitude && row.latitude !== '—' ? parseFloat(row.latitude) : undefined;
        const lng = row.longitude && row.longitude !== '—' ? parseFloat(row.longitude) : undefined;

        const normalizedPhone = normalizePhone(phone);
        const resolvedPincode = MASTER_AREAS.find(a => a.id === areaId)?.pincode || row.pin.replace(/\D/g, '');
        const existingIndex = next.findIndex((b) => (
          (row.existingBusinessId && b.id === row.existingBusinessId) ||
          (
            b.name.trim().toLowerCase() === name.toLowerCase() &&
            normalizedPhone.length > 0 &&
            normalizePhone(b.phone) === normalizedPhone &&
            getBusinessPincode(b) === resolvedPincode &&
            b.localityId === localityId
          )
        ));

        if (row.importAction === 'update' && existingIndex >= 0) {
          next[existingIndex] = normalizeStoredBusiness({
            ...next[existingIndex],
            name,
            categoryId: row.categoryId || '',
            subcategoryId: row.subcategoryId || '',
            sourceCategoryLabel: row.sourceCategoryLabel || row.category || next[existingIndex].sourceCategoryLabel,
            sourceSubcategoryLabel: row.sourceSubcategoryLabel || row.subcategory || next[existingIndex].sourceSubcategoryLabel,
            taxonomyMapped: row.taxonomyMapped ?? isBusinessTaxonomyMapped({ categoryId: row.categoryId || '', subcategoryId: row.subcategoryId || '' }),
            localityId,
            areaId,
            pincode: resolvedPincode,
            areasOfOperation: [areaId],
            address,
            phone,
            description: row.services || next[existingIndex].description,
            rating: Number.isFinite(rating) ? rating : next[existingIndex].rating,
            reviewCount: Number.isFinite(reviewCount) ? reviewCount : next[existingIndex].reviewCount,
            status: 'approved',
            tags: uniqueTags(
              row.tags || [],
              next[existingIndex].tags || [],
              splitTagSource(row.services || ''),
              splitTagSource(row.category || ''),
              splitTagSource(row.subcategory || '')
            ),
            gpsCoordinates: lat !== undefined && lng !== undefined ? { lat, lng } : next[existingIndex].gpsCoordinates,
          });
          skipped++;
          continue;
        }

        if (existingIndex >= 0) {
          skipped++;
          continue;
        }

        next.unshift(normalizeStoredBusiness({
          id: `csv_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          name,
          categoryId: row.categoryId || '',
          subcategoryId: row.subcategoryId || '',
          sourceCategoryLabel: row.sourceCategoryLabel || row.category || undefined,
          sourceSubcategoryLabel: row.sourceSubcategoryLabel || row.subcategory || undefined,
          taxonomyMapped: row.taxonomyMapped ?? isBusinessTaxonomyMapped({ categoryId: row.categoryId || '', subcategoryId: row.subcategoryId || '' }),
          localityId,
          stateId: 'mh',
          cityId: 'navimumbai',
          areaId,
          pincode: resolvedPincode,
          areasOfOperation: [areaId],
          address,
          phone,
          website: `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'business'}.in`,
          description: row.services || 'Business imported from CSV.',
          rating: Number.isFinite(rating) ? rating : 0,
          reviewCount,
          imageUrl: '',
          featured: false,
          status: 'approved',
          createdAt: new Date().toISOString(),
          tags: uniqueTags(
            row.tags || [],
            splitTagSource(row.services || ''),
            splitTagSource(row.category || ''),
            splitTagSource(row.subcategory || ''),
            ['Imported via CSV']
          ),
          ownerName: 'Imported via CSV',
          gpsCoordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
        }));
        imported++;
      }
      persistBusinessesToServer(next);
      return next;
    });

    logAuditEvent('data_entry', 'CSV import executed', `Rows processed: ${rows.length} | Imported: ${imported} | Skipped: ${skipped}`);
    return { imported, skipped };
  };

  const activeLocality = localities.find((locality) => locality.id === activeLocalityId) || localities[0];
  const activeLocalityName = activeLocality?.name.split(',')[0] || 'Roadpali';
  const seoCategoryName = BUSINESS_CATEGORIES.find((category) => category.id === (urlCategoryFilter || ''))?.name || '';
  const getLocalitySlug = (localityId: string) => {
    const locality = localities.find((candidate) => candidate.id === localityId);
    return locality?.slug || localityId || 'roadpali';
  };

  const buildLocalityPath = (localityId: string) => `/${getLocalitySlug(localityId)}`;

  const buildSeoPath = (
    localityId: string,
    categoryId: string | null,
    searchQuery: string | null
  ) => {
    const localityPath = buildLocalityPath(localityId);
    if (!categoryId || categoryId === 'all') return localityPath;

    const normalizedCategoryId = resolveMasterCategoryId(categoryId);
    const normalizedSearch = (searchQuery || '').trim().toLowerCase();
    if (normalizedSearch) {
      const matchedIntent = seoIntentByCategoryAndQuery.get(`${normalizedCategoryId}::${normalizedSearch}`);
      if (matchedIntent) return `${localityPath}/${matchedIntent.slug}`;
    }

    const defaultIntent = seoDefaultIntentByCategory.get(normalizedCategoryId);
    if (defaultIntent) return `${localityPath}/${defaultIntent.slug}`;

    return `${localityPath}/${slugifyForUrl(normalizedCategoryId)}`;
  };

  const seoFooterLinks = useMemo(() => (
    seoDiscoveryConfig.routeIntents.map((intent) => ({
      ...intent,
      label: `${intent.labelPrefix} in ${activeLocalityName}`,
    }))
  ), [activeLocalityName, seoDiscoveryConfig.routeIntents]);

  const buildSeoHref = (categoryId: string, q: string) => buildSeoPath(
    activeLocality?.id || 'roadpali',
    categoryId,
    q
  );

  const handleSeoFooterLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    categoryId: string,
    q: string
  ) => {
    e.preventDefault();
    setActiveViewWithAudit('web');
    if (activeLocality?.id) {
      setActiveLocalityId(activeLocality.id);
      localStorage.setItem('yp_saved_locality_id', activeLocality.id);
    }
    setUrlCategoryFilter(categoryId);
    setUrlSubcategoryFilter(null);
    setUrlSearchFilter(q);
    setUrlFilterNonce((prev) => prev + 1);
    localStorage.setItem('yp_pincode_prompted', 'true');
    setShowPincodeModal(false);

    const nextUrl = buildSeoPath(activeLocality?.id || 'roadpali', categoryId, q);
    window.history.pushState({}, '', nextUrl);
  };

  const activeNodeLabel = (() => {
    if (activeLocalityId === 'roadpali') return 'Roadpali & Kalamboli';
    return localities.find((l) => l.id === activeLocalityId)?.name.split(',')[0] || 'Roadpali';
  })();
  const compactNodeLabel = activeNodeLabel.length > 16 ? `${activeNodeLabel.slice(0, 16)}...` : activeNodeLabel;
  const displayedPincode = savedPincode ? savedPincode : 'Select area';
  const activeLocalityIds = activeLocalityId.split(',').map((value) => value.trim()).filter(Boolean);
  const mappedPincodesForActiveLocality = pincodeMappings
    .filter((mapping) => activeLocalityIds.includes(mapping.localityId))
    .map((mapping) => mapping.pincode);
  const localityServingLabel = (() => {
    if (activeLocalityId === 'roadpali') {
      return 'Serving Roadpali, Kalamboli, and Navi Mumbai since 2026.';
    }
    const localityName = localities.find((locality) => locality.id === activeLocalityId)?.name.split(',')[0] || 'Roadpali';
    const mappedLocalityNames = Array.from(new Set(
      pincodeMappings
        .filter((mapping) => activeLocalityIds.includes(mapping.localityId))
        .map((mapping) => {
          const mappedLocality = localities.find((locality) => locality.id === mapping.localityId);
          return mappedLocality?.name.split(',')[0];
        })
        .filter(Boolean) as string[]
    ));

    if (mappedLocalityNames.length > 1) {
      const last = mappedLocalityNames[mappedLocalityNames.length - 1];
      const initial = mappedLocalityNames.slice(0, -1).join(', ');
      return `Serving ${initial}, and ${last} since 2026.`;
    }

    if (mappedLocalityNames.length === 1) {
      return `Serving ${mappedLocalityNames[0]} and nearby areas since 2026.`;
    }

    return `Serving ${localityName} and nearby areas since 2026.`;
  })();
  const handleMainLogoHome = () => {
    setActiveViewWithAudit('web');
    setUrlIsSearchResults(false);
    setUrlCategoryFilter(null);
    setUrlSubcategoryFilter(null);
    setUrlSearchFilter(null);
    setUrlFilterNonce((prev) => prev + 1);
    const normalizedPin = savedPincode?.replace(/\D/g, '') || '';
    if (/^\d{6}$/.test(normalizedPin)) {
      const matched = pincodeMappings.find((mapping) => mapping.pincode === normalizedPin);
      if (matched) {
        setActiveLocalityId(matched.localityId);
        window.history.pushState({}, '', buildLocalityPath(matched.localityId));
        return;
      }
    }
    window.history.pushState({}, '', buildLocalityPath(activeLocality?.id || activeLocalityId || 'roadpali'));
  };
  const handleSearchShortcut = () => {
    const searchForm = document.getElementById('public-listing-search');
    if (searchForm) {
      searchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const searchInput = document.getElementById('public-listing-search-input') as HTMLInputElement | null;
    window.setTimeout(() => searchInput?.focus(), 350);
  };
  const handleLogout = () => {
    localStorage.removeItem('yp_auth_token');
    setUserSession({
      role: 'buyer',
      userName: 'Anonymous Guest Explorer',
      isAuthenticated: false,
      userPhone: undefined
    });
    setShowUserMenu(false);
    logAuditEvent('data_entry', 'User Logged Out', 'Client cleared verified session status.');
  };

  useEffect(() => {
    const siteName = 'Localisy';
    const seoTitle = (urlSearchFilter && urlSearchFilter.trim())
      ? `${urlSearchFilter.trim()} in ${activeLocalityName} | ${siteName}`
      : (urlCategoryFilter && urlCategoryFilter !== 'all')
        ? `${seoCategoryName || 'Businesses'} in ${activeLocalityName} | ${siteName}`
        : `${activeLocalityName} Local Business Directory | ${siteName}`;

    const seoDescription = (urlCategoryFilter && urlCategoryFilter !== 'all')
      ? `Browse verified ${seoCategoryName.toLowerCase()} in ${activeLocalityName}. Compare phone, address, ratings, hours, and trusted local providers.`
      : `Discover verified local businesses in ${activeLocalityName}. Explore salons, restaurants, clinics, home services, and shops nearby.`;

    const origin = window.location.origin;
    const activeLocalityPath = buildLocalityPath(activeLocality?.id || 'roadpali');
    const canonicalPath = buildSeoPath(activeLocality?.id || 'roadpali', urlCategoryFilter, urlSearchFilter);
    const canonicalUrl = `${origin}${canonicalPath}`;
    const seoImageUrl = `${origin}/seo-image.svg?title=${encodeURIComponent(seoTitle)}&subtitle=${encodeURIComponent(
      urlSearchFilter?.trim()
        ? `${activeLocalityName} • ${urlSearchFilter.trim()}`
        : `${activeLocalityName} • ${seoCategoryName || 'Local Directory'}`
    )}&brand=${encodeURIComponent(siteName)}`;
    const keywordSet = [
      `${activeLocalityName} businesses`,
      `${activeLocalityName} local business directory`,
      seoCategoryName,
      urlSearchFilter,
      `verified businesses in ${activeLocalityName}`,
      'Navi Mumbai businesses',
      'local services near me',
    ]
      .filter(Boolean)
      .join(', ');

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setPropertyMeta = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    document.title = seoTitle;
    setMeta('description', seoDescription);
    setMeta('keywords', keywordSet);
    setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', seoTitle);
    setMeta('twitter:description', seoDescription);
    setMeta('twitter:image', seoImageUrl);
    setMeta('twitter:image:alt', seoTitle);
    setPropertyMeta('og:type', 'website');
    setPropertyMeta('og:site_name', siteName);
    setPropertyMeta('og:title', seoTitle);
    setPropertyMeta('og:description', seoDescription);
    setPropertyMeta('og:url', canonicalUrl);
    setPropertyMeta('og:image', seoImageUrl);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    const breadcrumbElements: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: activeLocalityName, item: `${origin}${activeLocalityPath}` },
    ];

    if (urlCategoryFilter && urlCategoryFilter !== 'all') {
      breadcrumbElements.push({
        '@type': 'ListItem',
        position: 3,
        name: (urlSearchFilter && urlSearchFilter.trim()) || seoCategoryName || 'Businesses',
        item: canonicalUrl,
      });
    }

    const jsonLdPayload = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${origin}/#website`,
          url: origin,
          name: siteName,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${origin}${activeLocalityPath}?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'CollectionPage',
          '@id': `${canonicalUrl}#collection`,
          url: canonicalUrl,
          name: seoTitle,
          description: seoDescription,
          isPartOf: { '@id': `${origin}/#website` }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbElements
        },
        {
          '@type': 'ItemList',
          name: `Popular searches in ${activeLocalityName}`,
          itemListElement: seoFooterLinks.map((link, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: link.label,
            url: `${origin}${buildSeoHref(link.categoryId, link.q)}`
          }))
        }
      ]
    };

    let jsonLdScript = document.getElementById('local-seo-jsonld');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      jsonLdScript.setAttribute('id', 'local-seo-jsonld');
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(jsonLdPayload);
  }, [activeLocality?.id, activeLocalityName, seoCategoryName, urlCategoryFilter, urlSearchFilter, seoFooterLinks]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50 font-sans text-slate-800 selection:bg-indigo-600/15">
      
      {/* Top Navigation Frame - Pristine, Live, Human-labeled web directory */}
      <nav id="platform-navbar" className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur md:top-auto md:px-8 md:py-0">
        <div className="relative flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={handleMainLogoHome}
            className="shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Localisy home"
          >
          <img
            src={happyBusinessLogo}
            alt="Localisy"
            className="h-7 w-auto max-w-[92px] object-contain"
          />
          </button>

        {/* Real-time Pincode and Locality tracker */}
          <button
            type="button"
            onClick={() => setShowPincodeModal(true)}
            className="min-w-0 flex-1 inline-flex h-9 items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-950 shadow-sm transition hover:border-indigo-200"
            title="Change pincode or locality"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
            <span className="truncate">
              <span className="font-extrabold text-slate-800">{displayedPincode}</span>
            </span>
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMobileMenu((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
              title="Open menu"
            >
              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {showMobileMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {userSession.isAuthenticated && userSession.userPhone ? (
                  <div className="mb-1 border-b border-slate-100 px-3 py-2">
                    <span className="block truncate text-xs font-bold text-slate-900">{userSession.userName}</span>
                    <span className="block truncate text-[10px] text-slate-500">{userSession.userPhone}</span>
                  </div>
                ) : null}
                {!userSession.isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowAuthModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <User className="h-4 w-4" />
                    Sign In
                  </button>
                )}
                {canAccessAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setActiveViewWithAudit('admin');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Console
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    window.dispatchEvent(new CustomEvent('localsy:open-business-application'));
                    const seekWebPortal = document.getElementById('web-portal-root');
                    if (seekWebPortal) seekWebPortal.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Briefcase className="w-4 h-4" />
                  Advertise Business
                </button>
                {userSession.isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={`hidden w-full gap-2 md:hidden ${userSession.isAuthenticated && userSession.userPhone ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {userSession.isAuthenticated && userSession.userPhone ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (canAccessAdmin) {
                      setActiveViewWithAudit('admin');
                    } else {
                      window.dispatchEvent(new CustomEvent('localsy:open-business-application'));
                      const seekWebPortal = document.getElementById('web-portal-root');
                      if (seekWebPortal) seekWebPortal.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold shadow-sm transition ${
                    canAccessAdmin
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  {canAccessAdmin ? <Shield className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                  <span>{canAccessAdmin ? 'Admin Console' : 'Advertise Business'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] font-bold text-rose-600 shadow-sm transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('localsy:open-business-application'));
                    const seekWebPortal = document.getElementById('web-portal-root');
                    if (seekWebPortal) seekWebPortal.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Advertise</span>
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => {
              // Direct access for merchants to submit a listing.
              window.dispatchEvent(new CustomEvent('localsy:open-business-application'));
              const seekWebPortal = document.getElementById('web-portal-root');
              if (seekWebPortal) seekWebPortal.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Open the listing application form for merchants who want to be promoted on the directory"
            className="hidden lg:inline-flex bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-3 rounded-xl transition cursor-pointer"
          >
            Advertise Business
          </button>

          <div className="hidden">
            {userSession.isAuthenticated && userSession.userPhone ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((open) => !open)}
                  className="h-11 md:h-12 w-14 md:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-0 md:px-4 rounded-2xl transition cursor-pointer shadow-sm"
                  title="Open user menu"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline max-w-[120px] truncate">{userSession.userName.split(' ')[0]}</span>
                  <ChevronDown className="hidden md:inline w-3.5 h-3.5" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <span className="block text-xs font-bold text-slate-900 truncate">{userSession.userName}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{userSession.userPhone}</span>
                    </div>
                    {canAccessAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveViewWithAudit('admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Console
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        window.dispatchEvent(new CustomEvent('localsy:open-business-application'));
                        const seekWebPortal = document.getElementById('web-portal-root');
                        if (seekWebPortal) seekWebPortal.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl"
                    >
                      <Briefcase className="w-4 h-4" />
                      Advertise Business
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="h-11 md:h-12 w-14 md:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-0 md:px-4 rounded-2xl transition cursor-pointer shadow-sm"
                title="Sign in to post reviews and manage access"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}
          </div>

          {userSession.isAuthenticated && userSession.userPhone ? (
            <div className="hidden items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-800 font-semibold truncate max-w-[150px]" title={`${userSession.userName} (${userSession.userPhone})`}>
                👤 {userSession.userName.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('yp_auth_token');
                  setUserSession({
                    role: 'buyer',
                    userName: 'Anonymous Guest Explorer',
                    isAuthenticated: false,
                    userPhone: undefined
                  });
                  logAuditEvent('data_entry', 'User Logged Out', 'Client cleared verified session status.');
                }}
                className="text-rose-600 hover:text-rose-800 text-[10px] font-bold border-l border-slate-200 pl-2 cursor-pointer ml-1"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="hidden items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
              title="Sign in to post reviews & manage role-based access"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        <div className="hidden h-[72px] items-center justify-between gap-5 md:flex">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMainLogoHome}
              className="rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Open home page for selected pincode"
            >
              <img
                src={happyBusinessLogo}
                alt="Localisy"
                className="h-10 w-auto object-contain"
              />
            </button>
          </div>

          {/* Real-time Pincode and Locality tracker */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowPincodeModal(true)}
              className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-950 shadow-sm transition hover:border-indigo-200"
              title="Click to switch regional portal using pincode"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Pincode: {savedPincode ? savedPincode : 'None'}
                <span className="text-indigo-400 font-sans ml-1 text-[10px] font-normal">
                  ({activeNodeLabel} node)
                </span>
              </span>
              <span className="text-[10px] text-indigo-600 underline ml-1 font-bold">Change</span>
            </button>

            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-sans font-semibold text-xs py-1.5 px-3 rounded-full border border-emerald-250">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Node: {activeNodeLabel}
            </span>

            <button
              onClick={() => {
                // Direct access for merchants to submit a listing.
                window.dispatchEvent(new CustomEvent('localsy:open-business-application'));
                const seekWebPortal = document.getElementById('web-portal-root');
                if (seekWebPortal) seekWebPortal.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Open the listing application form for merchants who want to be promoted on the directory"
              className="hidden sm:inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
            >
              Advertise Business
            </button>

            {canAccessAdmin && (
              <button
                type="button"
                onClick={() => setActiveViewWithAudit('admin')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 cursor-pointer"
                title="Open Admin moderation and bulk import console"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            )}

            {userSession.isAuthenticated && userSession.userPhone ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-800 font-semibold truncate max-w-[150px]" title={`${userSession.userName} (${userSession.userPhone})`}>
                  {userSession.userName.split(' ')[0]}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-rose-600 hover:text-rose-800 text-[10px] font-bold border-l border-slate-200 pl-2 cursor-pointer ml-1"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-xs font-bold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer"
                title="Sign in to post reviews & manage role-based access"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Workspace Frame */}
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 space-y-8 overflow-x-hidden px-4 py-5 md:px-8 md:py-8">
        
        {/* Workspace Active Presentation Render */}
        {!PRODUCTION_MODE && activeView === 'proposal' && (
          <div className="space-y-6">
            <Suspense fallback={<div className="text-xs text-slate-500">Loading proposal preview...</div>}>
              <ProposalPanel />
            </Suspense>
            <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-200 pt-6 gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ready to explore the fully functional interactive showcase?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Test the exact business registration, moderation, and responsive mobile displays below.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveViewWithAudit('web')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold px-4 py-2 rounded-xl transition"
                >
                  Explore Public Web →
                </button>
                {canAccessAdmin && (
                  <button
                    onClick={() => setActiveViewWithAudit('admin')}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold px-4 py-2 rounded-xl transition"
                  >
                    Manage Moderation (Admin) →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'web' && (
          <WebPortal 
            localities={localities}
            businesses={businesses}
            categories={portalCategories}
            reviews={reviews}
            activeLocalityId={activeLocalityId}
            pincodeMappings={pincodeMappings}
            localityMappedPincodes={mappedPincodesForActiveLocality}
            savedPincode={savedPincode}
            initialCategoryFilter={urlCategoryFilter}
            initialSearchFilter={urlSearchFilter}
            initialResultsPage={urlIsSearchResults}
            filterNonce={urlFilterNonce}
            initialSelectedBusinessId={urlSelectedBusinessId}
            selectionNonce={urlSelectionNonce}
            onLocalityChange={setActiveLocalityId}
            userSession={userSession}
            onUserSessionChange={setUserSession}
            viewedBusinessIds={viewedBusinessIds}
            savedBusinessIds={savedBusinessIds}
            onToggleSavedBusiness={handleToggleSavedBusiness}
            buyerActivityEvents={buyerActivityEvents}
            onUnlockBusinessContact={handleRegisterContactView}
            onSubmitApplication={handleSubmitApplication}
            onUpdateBusiness={handleUpdateBusiness}
            onAddReview={handleAddReview}
            listingAds={listingAds}
            adLeads={adLeads}
            heroBanners={heroBanners}
            homepageLayouts={homepageLayouts}
            homepageDefaultsConfig={homepageDefaultsConfig}
            apiConfiguration={apiConfiguration}
            onSubmitAdLead={handleSubmitAdLead}
            urlCategoryFilter={urlCategoryFilter}
            urlSubcategoryFilter={urlSubcategoryFilter}
            urlFilterNonce={urlFilterNonce}
            
            communityItems={communityItems}
            onAddCommunityItem={handleAddCommunityItem}
            crmContacts={crmContacts}
            onAddCRMContact={handleAddCRMContact}
            onUpdateCRMContact={handleUpdateCRMContact}
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onLogAuditEvent={logAuditEvent}
          />
        )}

        {!PRODUCTION_MODE && activeView === 'android' && (
          <Suspense fallback={<div className="text-xs text-slate-500">Loading mobile preview...</div>}>
            <AndroidSimulator 
              localities={localities}
              businesses={businesses}
              categories={portalCategories}
              reviews={reviews}
              activeLocalityId={activeLocalityId}
              onLocalityChange={setActiveLocalityId}
              userSession={userSession}
              onUserSessionChange={setUserSession}
              viewedBusinessIds={viewedBusinessIds}
              onUnlockBusinessContact={handleRegisterContactView}
              onSubmitApplication={handleSubmitApplication}
              onUpdateBusiness={handleUpdateBusiness}
              onAddReview={handleAddReview}
            />
          </Suspense>
        )}

        {activeView === 'admin' && canAccessAdmin && (
          <Suspense fallback={<div className="text-xs text-slate-500">Loading admin console...</div>}>
            <AdminConsole 
              localities={localities}
              businesses={businesses}
              subdomains={subdomains}
              onApprove={handleApproveBusiness}
              onReject={handleRejectBusiness}
              onCreateLocality={handleCreateLocality}
              onDeleteLocality={handleDeleteLocality}
              onUpdateBusiness={handleUpdateBusiness} // Allows edits directly in queue!
              userSession={userSession}
              auditLogs={auditLogs}
              pincodeMappings={pincodeMappings}
              onAddPincodeMapping={handleAddPincodeMapping}
              onDeletePincodeMapping={handleDeletePincodeMapping}
              defaultLocalityId={defaultLocalityId}
              onChangeDefaultLocalityId={handleChangeDefaultLocalityId}
              onBulkImportBusinesses={handleBulkImportBusinesses}
              listingAds={listingAds}
              onCreateListingAd={handleCreateListingAd}
              onUpdateListingAd={handleUpdateListingAd}
              onDeleteListingAd={handleDeleteListingAd}
              heroBanners={heroBanners}
              onCreateHeroBanner={handleCreateHeroBanner}
              onUpdateHeroBanner={handleUpdateHeroBanner}
              onDeleteHeroBanner={handleDeleteHeroBanner}
              coupons={coupons}
              onAddCoupon={handleAddCoupon}
              onUpdateCoupon={handleUpdateCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              communityItems={communityItems}
              onAddCommunityItem={handleAddCommunityItem}
              onUpdateCommunityItem={handleUpdateCommunityItem}
              onDeleteCommunityItem={handleDeleteCommunityItem}
              homepageLayouts={homepageLayouts}
              onCreateHomepageSection={handleCreateHomepageSection}
              onUpdateHomepageSection={handleUpdateHomepageSection}
              onDeleteHomepageSection={handleDeleteHomepageSection}
              onDuplicateHomepageSection={handleDuplicateHomepageSection}
              onMoveHomepageSection={handleMoveHomepageSection}
              adLeads={adLeads}
              apiConfiguration={apiConfiguration}
              geographyConfig={geographyConfig}
              onSaveGeographyConfig={handleSaveGeographyConfig}
              homepageDefaultsConfig={homepageDefaultsConfig}
              onSaveHomepageDefaultsConfig={handleSaveHomepageDefaultsConfig}
              onUpdateApiConfiguration={handleUpdateApiConfiguration}
              businessTaxonomy={businessTaxonomy}
              onSaveBusinessTaxonomy={handleSaveBusinessTaxonomy}
              seoDiscoveryConfig={seoDiscoveryConfig}
              onSaveSeoDiscoveryConfig={handleSaveSeoDiscoveryConfig}
              onSyncHomepageConfig={handleManualHomepageConfigSync}
              scalableHomepageConfig={scalableHomepageConfig}
              onSaveScalableTemplate={handleSaveScalableTemplate}
              onDeleteScalableTemplate={handleDeleteScalableTemplate}
              onCreateScalableTemplateSection={handleCreateScalableTemplateSection}
              onUpdateScalableTemplateSection={handleUpdateScalableTemplateSection}
              onReorderScalableTemplateSections={handleReorderScalableTemplateSections}
              onDuplicateScalableTemplateSection={handleDuplicateScalableTemplateSection}
              onDeleteScalableTemplateSection={handleDeleteScalableTemplateSection}
              onSyncScalableTemplateSectionsFromLocality={handleSyncScalableTemplateSectionsFromLocality}
              onSaveScalableAssignment={handleSaveScalableAssignment}
              onDeleteScalableAssignment={handleDeleteScalableAssignment}
              onSaveScalableCampaign={handleSaveScalableCampaign}
              onDeleteScalableCampaign={handleDeleteScalableCampaign}
              onRefreshScalablePublishedSnapshots={handleRefreshScalablePublishedSnapshots}
              onDeleteScalablePublishedSnapshot={handleDeleteScalablePublishedSnapshot}
              onReseedScalableHomepageConfig={handleReseedScalableHomepageConfig}
              onPublishResolvedHomepages={handlePublishResolvedHomepages}
              onDeleteResolvedHomepageSnapshots={handleDeleteResolvedHomepageSnapshots}
              localityCategoryLinks={localityCategoryLinks}
              onCreateLocalityCategoryLink={handleCreateLocalityCategoryLink}
              onDeleteLocalityCategoryLink={handleDeleteLocalityCategoryLink}
            />
          </Suspense>
        )}

      </main>

      {/* Pristine, Professional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="block text-white font-bold text-sm">{activeNodeLabel} Businesses</span>
            <span className="block text-xs text-slate-500">Your trusted neighbourhood Hyper Local directory node. {localityServingLabel}</span>
            {mappedPincodesForActiveLocality.length > 0 && (
              <span className="block text-[10px] text-slate-500 font-mono">
                Pincodes: {mappedPincodesForActiveLocality.join(', ')}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Popular Searches
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {seoFooterLinks.map((link) => (
                <a
                  key={link.id}
                  href={buildSeoHref(link.categoryId, link.q)}
                  onClick={(e) => handleSeoFooterLinkClick(e, link.categoryId, link.q)}
                  className="text-[11px] text-slate-300 hover:text-white hover:underline underline-offset-2 transition"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-4 text-xs">
            <button 
              style={{ display: PRODUCTION_MODE ? 'none' : 'inline-flex' }}
              onClick={() => {
                simulateRoleLogin('admin');
                setActiveView('admin');
                setShowSandbox(true);
                alert("Switched role to Admin Operator. You can view pending listings in the Moderation Desk via the developer sandbox widget!");
              }}
              className="text-slate-300 hover:text-white transition text-xs bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl font-medium cursor-pointer"
            >
              🔐 Moderator Login Gate
            </button>
            <span className="text-slate-600" style={{ display: PRODUCTION_MODE ? 'none' : 'inline' }}>|</span>
            <span className="text-xs text-slate-500">(c) 2026 Localisy. A Hyper Local Business Directory. Discover Local. Support Local. Grow Local.</span>
          </div>
        </div>
      </footer>

      {/* Floating Developer Sandbox Panel - For AI Studio reviewers and team tests */}
      {!PRODUCTION_MODE && <div className="fixed bottom-6 right-6 z-50">
        {!showSandbox ? (
          <button
            onClick={() => setShowSandbox(true)}
            className="bg-indigo-600 hover:bg-indigo-750 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer transition hover:scale-103 active:scale-97 group border border-indigo-500/25"
          >
            <Sliders className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold font-sans tracking-wide">Developer Sandbox</span>
            {businesses.some(b => b.status === 'pending') && (
              <span className="bg-rose-500 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                {businesses.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
        ) : (
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 w-80 md:w-96 border border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400 animate-pulse" />
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Sandbox Settings</span>
                  <span className="block text-[10px] text-slate-400 font-medium font-sans">Verify role scopes & client simulated views</span>
                </div>
              </div>
              <button
                onClick={() => setShowSandbox(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Case Shard Identity Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans">Simulate User Identity</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'buyer', label: '👤 Buyer (Guest)', desc: 'SME visitor, OTP view' },
                  { id: 'admin', label: '🛡️ Admin Operator', desc: 'Can approve listings' },
                  { id: 'moderator', label: '⚖️ Coordinator', desc: 'Audit SLAs & stats' },
                  { id: 'operator', label: '⌨️ Data Oper.', desc: 'Direct mapping helper' },
                  { id: 'seller', label: '💼 Seller Rep', desc: 'Dispatches coupons & CRM' },
                ].map(r => {
                  const isSel = userSession.role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => simulateRoleLogin(r.id as UserRole)}
                      className={`text-left p-2 rounded-xl border transition cursor-pointer ${
                        isSel 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <span className="block text-[11px] font-bold leading-tight">{r.label}</span>
                      <span className="block text-[8px] text-slate-400 leading-tight mt-0.5">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-indigo-300 flex items-center gap-1 font-mono pt-1">
                <span>Active Profile:</span>
                <strong className="text-white truncate">{userSession.userName}</strong>
              </div>
            </div>

            {/* Simulated Layout View Port selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans">Presentational Mode</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'web', label: '🖥️ Public Web', icon: Layout },
                  { id: 'android', label: '📱 Mobile Sim', icon: Smartphone },
                  ...((canAccessAdmin) ? [
                    { id: 'admin', label: '🛡️ Moderation', icon: Shield }
                  ] : []),
                  { id: 'proposal', label: '📖 Specs & Stack', icon: BookOpen }
                ].map(v => {
                  const Icon = v.icon;
                  const isSel = activeView === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setActiveViewWithAudit(v.id as any);
                        setShowSandbox(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold leading-none border transition cursor-pointer ${
                        isSel 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset helper and diagnostic values */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (confirm("Reset cache and database metrics back to Roadpali defaults? This clears your custom input listings.")) {
                    handleResetData();
                  }
                }}
                className="flex items-center gap-1.5 text-[10px] font-mono text-rose-500 hover:text-rose-400 font-bold bg-rose-500/10 hover:bg-rose-500/15 p-1.5 px-2.5 rounded-lg transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset System State
              </button>

              <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" />
                Sandbox Active
              </span>
            </div>
          </div>
        )}
      </div>}

      <PincodeSelectionModal 
        isOpen={showPincodeModal}
        onClose={() => setShowPincodeModal(false)}
        savedPincode={savedPincode}
        onSavePincode={handleSavePincode}
        pincodeMappings={pincodeMappings}
        localities={localities}
        defaultLocalityId={defaultLocalityId}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={({ token, name, phone, email, role, userType, sellerBusinessId }) => {
          localStorage.setItem('yp_auth_token', token);
          setUserSession({
            role: role as UserRole,
            userType,
            userName: `${name} (${userType})`,
            userPhone: phone,
            email,
            sellerBusinessId,
            authToken: token,
            isAuthenticated: true,
          });
          logAuditEvent('data_entry', 'User Authenticated', `Authenticated user ${email} with role: ${role}`);
        }}
      />
    </div>
  );
}
