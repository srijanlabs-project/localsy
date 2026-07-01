export interface Locality {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  description: string;
  status: 'active' | 'inactive';
  coverImage: string;
  stats: {
    numBusinesses: number;
    numPending: number;
  };
  carouselImages?: string[]; // Multiple hero banners
}

export interface PincodeRoutingMapping {
  pincode: string;
  localityId: string;
}

export interface Business {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  sourceCategoryLabel?: string;
  sourceSubcategoryLabel?: string;
  taxonomyMapped?: boolean;
  localityId: string; // The primary domain locality
  stateId: string;    // Master State
  cityId: string;     // Master City
  areaId: string;     // Primary Area
  pincode?: string;   // Explicit pincode captured at listing level
  areasOfOperation: string[]; // List of operational areas from master list
  address: string;
  phone: string;
  email?: string; // Optional email
  website: string;
  description: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  featured: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  tags: string[];
  hours?: string;
  ownerName?: string;
  rejectionReason?: string;
  gpsCoordinates?: { lat: number; lng: number }; // Grabbed from simulator
  
  // discovery engine properties
  distance?: number; // Distance in km
  priceRange?: '₹' | '₹₹' | '₹₹₹' | '₹₹₹₹';
  deliveryAvailable?: boolean;
  hasOffers?: boolean;
  languagesSpoken?: string[];
  paymentMethods?: string[];
  experienceYears?: number;
  isSponsored?: boolean;
  cpcBudget?: number; // Cost Per Click budget
  
  // trust layer properties
  verifiedBadge?: boolean;
  kycStatus?: 'verified' | 'pending' | 'none';
  govRegistered?: boolean;
  responseTime?: string; // e.g. "< 10 mins", "Within 1 hour"
  customerSatisfaction?: number; // percent
  repeatCustomerScore?: number; // percent

  // monthly premium monetization states
  isMonthlySubscriber?: boolean;
  subscriptionPlan?: 'free' | 'basic' | 'premium';
}

export interface Review {
  id: string;
  businessId: string;
  userName: string;
  userPhone: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedByOtp: boolean;
  
  // Trust Layer - Enhanced Reviews
  photoUrl?: string;
  videoUrl?: string;
  isVerifiedPurchase?: boolean;
  helpfulVotes?: number;
  reported?: boolean;
  reportReason?: string;
}

export interface CommunityItem {
  id: string;
  type: 'qa' | 'recommendation' | 'event' | 'deal' | 'post';
  title: string;
  content: string;
  authorName: string;
  authorPhone?: string; // OTP verified matching
  createdAt: string;
  businessId?: string; // Optionally tagged business
  localityId: string;
  likes: number;
  image?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  publishAt?: string;
  expireAt?: string;
  answersCount?: number;
  answers?: Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
  eventDate?: string;
  dealPromoCode?: string;
  priceTag?: string;
  isSponsored?: boolean; // Monetization: Sponsored Posts
}

export interface CRMContact {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  lastInteraction: string;
  followUpNotes?: string;
  totalSpent?: number;
  ordersCount?: number;
  loyaltyPoints?: number;
}

export interface MarketingCoupon {
  id: string;
  businessId: string;
  title?: string;
  code: string;
  discount: string;
  description: string;
  startDate?: string;
  expiryDate: string;
  endDate?: string;
  usageCount: number;
  isActive?: boolean;
  localityIds?: string[];
  pincodes?: string[];
  categoryIds?: string[];
  badgeText?: string;
  ctaText?: string;
  targetBusinessId?: string;
}

export interface ListingAd {
  id: string;
  title: string;
  description: string;
  badge: string;
  ctaText: string;
  backgroundColor: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  actionType: 'landing_page' | 'landing_listing' | 'lead_form';
  targetUrl?: string;
  targetBusinessId?: string;
  sellerBusinessId?: string;
  localityIds?: string[];
  pincodes?: string[];
  categoryIds?: string[];
  tags?: string[];
  placementKey?: string;
  deviceTarget?: 'all' | 'desktop' | 'mobile';
  mobileRowPosition?: number;
  isActive: boolean;
}

export interface FallbackListingAdTemplate {
  id: string;
  title: string;
  description: string;
  badge: string;
  ctaText: string;
  backgroundColor: string;
  imageUrl?: string;
  actionType: 'landing_page' | 'landing_listing' | 'lead_form';
  targetUrl?: string;
  targetCategoryId?: string;
  categoryIds?: string[];
  tags?: string[];
  placementKey?: string;
  deviceTarget?: 'all' | 'desktop' | 'mobile';
  mobileRowPosition?: number;
}

export interface AdLead {
  id: string;
  adId: string;
  sellerBusinessId?: string;
  localityId: string;
  name: string;
  mobile: string;
  pincode: string;
  createdAt: string;
}

export interface HeroBanner {
  id: string;
  localityId: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  ctaLabel?: string;
  ctaType?: 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category';
  ctaTarget?: string;
  pincodes?: string[];
  heroStats?: HeroBannerStat[];
  isActive: boolean;
}

export interface HeroBannerStat {
  enabled: boolean;
  label: string;
  value: string;
  localityIds?: string[];
  pincodes?: string[];
}

export interface HeroBannerDraftDefaults {
  ctaLabel: string;
  ctaType: 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category';
  ctaTarget: string;
  durationDays: number;
}

export interface HomepageCategoryShortcut {
  label: string;
  categoryId: string;
  subcategoryId?: string;
}

export type HomepageSectionType =
  | 'hero_banner'
  | 'search_discovery'
  | 'emergency_grid'
  | 'promo_banner'
  | 'featured_businesses'
  | 'business_shelf'
  | 'text_business_strip'
  | 'offers_list'
  | 'updates_feed'
  | 'category_grid'
  | 'verified_business_grid'
  | 'trust_strip';

export type HomepageSectionCtaType =
  | 'none'
  | 'landing_page'
  | 'landing_listing'
  | 'lead_form'
  | 'search_category';

export interface HomepageSection {
  id: string;
  sectionType: HomepageSectionType;
  title: string;
  subtitle?: string;
  status: 'active' | 'inactive';
  visible: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  localityIds?: string[];
  pincodes?: string[];
  categoryId?: string;
  categoryIds?: string[];
  subcategoryId?: string;
  placementKey?: string;
  maxItems?: number;
  visibleSlots?: number;
  desktopCardCount?: number;
  mobileCardCount?: number;
  mobileDisplayMode?: 'carousel' | 'stack';
  ctaLabel?: string;
  ctaType?: HomepageSectionCtaType;
  ctaTarget?: string;
  backgroundColor?: string;
  showViewAll?: boolean;
  listingSourceMode?: 'auto' | 'manual';
  pinnedBusinessIds?: string[];
  autoRotate?: boolean;
  rotationIntervalSec?: number;
}

export interface HomepageLayout {
  id: string;
  localityId: string;
  name: string;
  status: 'active' | 'inactive';
  visible: boolean;
  sections: HomepageSection[];
  updatedAt: string;
}

export interface ApiConfiguration {
  syncMode: 'local' | 'api';
  homepageConfigEndpoint: string;
  adLeadsEndpoint?: string;
  homepageDefaultsConfigEndpoint?: string;
  localityRoutingConfigEndpoint?: string;
  geographyConfigEndpoint?: string;
  taxonomyConfigEndpoint?: string;
  seoDiscoveryConfigEndpoint?: string;
  scalableHomepageConfigEndpoint?: string;
  resolvedHomepageEndpoint?: string;
  publishResolvedHomepageEndpoint?: string;
  businessesEndpoint: string;
  auditEventsEndpoint: string;
  autoSyncHomepage: boolean;
  autoSyncBusinesses: boolean;
  lastHomepageSyncAt?: string;
  lastBusinessesSyncAt?: string;
}

export interface HomepageConfigState {
  heroBanners: HeroBanner[];
  listingAds: ListingAd[];
  coupons: MarketingCoupon[];
  homepageLayouts: HomepageLayout[];
  localityCategoryLinks: Array<{
    id: string;
    localityId: string;
    categoryId: string;
    subcategoryId?: string;
    slug: string;
  }>;
  communityItems: CommunityItem[];
  apiConfiguration: ApiConfiguration;
}

export interface HomepageDefaultsConfigState {
  sectionTemplates: HomepageSection[];
  fallbackListingAds: FallbackListingAdTemplate[];
  heroStatTemplates: HeroBannerStat[];
  heroBannerDraftDefaults: HeroBannerDraftDefaults;
  heroQuickActions: HomepageCategoryShortcut[];
  searchShortcutCategoryIds: string[];
  metadata: {
    seededFromCode: boolean;
    updatedAt: string;
  };
}

export interface SeoRouteIntent {
  id: string;
  slug: string;
  categoryId: string;
  q: string;
  labelPrefix: string;
}

export interface SeoLocalityMetadata {
  id: string;
  name: string;
  city: string;
  intro: string;
  pincodes: string[];
  subdomain: string;
}

export interface SeoCategoryLabel {
  categoryId: string;
  label: string;
}

export interface SeoTopListingGroup {
  localityId: string;
  categoryId: string;
  listingNames: string[];
}

export interface SeoDefaultListingGroup {
  categoryId: string;
  listingNames: string[];
}

export interface SeoDiscoveryConfigState {
  routeIntents: SeoRouteIntent[];
  localityMetadata: SeoLocalityMetadata[];
  categoryLabels: SeoCategoryLabel[];
  topListings: SeoTopListingGroup[];
  defaultListingNames: SeoDefaultListingGroup[];
  metadata: {
    seededFromCode: boolean;
    updatedAt: string;
  };
}

export interface TargetingRule {
  localityIds?: string[];
  categoryIds?: string[];
  subcategoryIds?: string[];
  pincodes?: string[];
  devices?: Array<'all' | 'mobile' | 'desktop'>;
  pageTypes?: string[];
  placementKeys?: string[];
}

export interface ScalableHomepageTemplate {
  id: string;
  name: string;
  templateScope: 'global' | 'city' | 'locality';
  localityIds: string[];
  status: 'draft' | 'active' | 'inactive' | 'archived';
  priority: number;
  isDefault: boolean;
  isFallback: boolean;
  sections: HomepageSection[];
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface ScalableHomepageAssignment {
  id: string;
  localityId: string;
  templateId: string;
  categoryId?: string;
  subcategoryId?: string;
  pincode?: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  priority: number;
  isFallback: boolean;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export type ScalableCampaignType =
  | 'hero_banner'
  | 'listing_ad'
  | 'sponsored_listing'
  | 'offer'
  | 'content_block';

export interface ScalableCampaign {
  id: string;
  name: string;
  campaignType: ScalableCampaignType;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  priority: number;
  isFallback: boolean;
  startDate?: string;
  endDate?: string;
  deviceTarget: 'all' | 'mobile' | 'desktop';
  placementKeys?: string[];
  targets: TargetingRule;
  maxItems?: number;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface ResolvedHomepagePayload {
  context: {
    localityId: string;
    categoryId?: string;
    subcategoryId?: string;
    pincode?: string;
    device: 'all' | 'mobile' | 'desktop';
    pageType: string;
    placementKey?: string;
    date: string;
  };
  template: {
    id: string;
    name: string;
    templateScope: string;
    isFallback: boolean;
  } | null;
  sections: HomepageSection[];
  sectionBusinessIdsBySection: Record<string, string[]>;
  heroBanners: HeroBanner[];
  listingAds: ListingAd[];
  sponsoredListings: Business[];
  sponsoredCampaigns: Array<Record<string, unknown>>;
  offers: MarketingCoupon[];
  contentBlocks: CommunityItem[];
  resolvedAt: string;
}

export interface PublishedHomepageSnapshot {
  id: string;
  localityId: string;
  categoryId?: string;
  subcategoryId?: string;
  pincode?: string;
  placementKey?: string;
  deviceTarget: 'all' | 'mobile' | 'desktop';
  pageType: string;
  payload: ResolvedHomepagePayload;
  publishedAt: string;
  updatedAt: string;
}

export interface ResolvedHomepagePublishContext {
  localityId: string;
  categoryId?: string;
  subcategoryId?: string;
  pincode?: string;
  placementKey?: string;
  device?: 'all' | 'mobile' | 'desktop';
  pageType?: string;
}

export interface ResolvedHomepagePublishRequest {
  localityIds?: string[];
  categoryIds?: string[];
  subcategoryIds?: string[];
  pincodes?: string[];
  placementKeys?: string[];
  deviceTargets?: Array<'all' | 'mobile' | 'desktop'>;
  pageTypes?: string[];
  contexts?: ResolvedHomepagePublishContext[];
}

export interface ResolvedHomepageSnapshotDeleteRequest {
  snapshotIds?: string[];
  localityIds?: string[];
  categoryIds?: string[];
  subcategoryIds?: string[];
  pincodes?: string[];
  placementKeys?: string[];
  deviceTargets?: Array<'all' | 'mobile' | 'desktop'>;
  pageTypes?: string[];
  contexts?: ResolvedHomepagePublishContext[];
}

export interface ScalableHomepageConfigState {
  version: number;
  templates: ScalableHomepageTemplate[];
  assignments: ScalableHomepageAssignment[];
  campaigns: ScalableCampaign[];
  publishedSnapshots: PublishedHomepageSnapshot[];
  metadata: {
    seededFromLegacy: boolean;
    notes?: string;
    updatedAt: string;
  };
}

export interface ScalableLegacyOwnershipSummary {
  legacyManagedTemplates: number;
  detachedTemplates: number;
  legacyManagedAssignments: number;
  detachedAssignments: number;
  legacyManagedCampaigns: number;
  detachedCampaigns: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface BusinessCategory {
  id: string;
  legacyId: number;
  name: string;
  slug: string;
  icon: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export interface BusinessSubcategory {
  id: string;
  legacyId: number;
  parentLegacyId: number;
  categoryId: string;
  name: string;
  slug: string;
  icon: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export interface BusinessTaxonomyState {
  categories: BusinessCategory[];
  subcategories: BusinessSubcategory[];
  metadata: {
    seededFromCode: boolean;
    updatedAt: string;
  };
}

export interface LocalityRoutingConfigState {
  localities: Locality[];
  subdomains: SubdomainMapping[];
  pincodeMappings: PincodeRoutingMapping[];
  defaultLocalityId: string;
  metadata: {
    seededFromCode: boolean;
    updatedAt: string;
  };
}

export interface SubdomainMapping {
  domain: string;
  localityId: string;
  sslEnabled: boolean;
  dnsStatus: 'active' | 'pending' | 'failed';
  createdAt: string;
}

// Master geography interfaces
export interface StateMaster {
  id: string;
  name: string;
}

export interface CityMaster {
  id: string;
  stateId: string;
  name: string;
}

export interface LocalityMaster {
  id: string;
  cityId: string;
  name: string;
}

export interface AreaMaster {
  id: string;
  localityId: string;
  cityId: string;
  name: string;
  pincode: string;
}

export interface GeographyConfigState {
  states: StateMaster[];
  cities: CityMaster[];
  localities: LocalityMaster[];
  areas: AreaMaster[];
  metadata: {
    seededFromCode: boolean;
    updatedAt: string;
  };
}

export type UserRole = 'buyer' | 'admin' | 'moderator' | 'operator' | 'seller' | 'developer' | 'resource';
export type UserType = 'platform_admin' | 'developer' | 'buyer' | 'seller' | 'resource';

export interface UserSession {
  role: UserRole;
  userName: string;
  userPhone?: string;
  isAuthenticated: boolean;
  contactUnlockToken?: string;
  sellerBusinessId?: string; // Linked for seller dashboard
  userType?: UserType;
  email?: string;
  authToken?: string;
}

export interface BuyerActivityEvent {
  id: string;
  actionType: 'saved_listing' | 'unsaved_listing' | 'contact_unlock' | 'review_submitted';
  businessId?: string;
  createdAt: string;
  title: string;
  detail?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actionType: 'search' | 'contact_view' | 'data_entry';
  description: string;
  details: string;
  ipAddress: string;
  deviceCode: string;
  userName: string;
}
