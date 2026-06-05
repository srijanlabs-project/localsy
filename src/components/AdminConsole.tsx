import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, XCircle, Plus, Info, Globe, AlertCircle, 
  Trash2, PlusCircle, Check, Database, Eye, Server, RefreshCw, MapPin, Copy, ChevronUp, ChevronDown
} from 'lucide-react';
import { Locality, Business, SubdomainMapping, UserSession, AuditEvent, ListingAd, HeroBanner, AdLead, MarketingCoupon, HomepageLayout, HomepageSection, HomepageSectionType, ApiConfiguration, CommunityItem } from '../types';
import { MASTER_AREAS } from '../data';
import { getBusinessImageUrl, getCategoryFallbackImage, hasUploadedBusinessImage } from '../utils/businessImage';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
  getCategoryById,
  getSubcategoriesForCategory,
  getSubcategoryById,
  resolveDefaultSubcategoryId
} from '../categoryMaster';

interface AdminConsoleProps {
  localities: Locality[];
  businesses: Business[];
  subdomains: SubdomainMapping[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onCreateLocality: (name: string, subdomain: string, description: string, image: string) => void;
  onDeleteLocality: (id: string) => void;
  onUpdateBusiness?: (b: Business) => void;
  userSession?: UserSession;
  auditLogs?: AuditEvent[];
  
  // Customizable Pincode Routing Props
  pincodeMappings?: Array<{ pincode: string; localityId: string }>;
  onAddPincodeMapping?: (pincode: string, localityId: string) => void;
  onDeletePincodeMapping?: (pincode: string) => void;
  defaultLocalityId?: string;
  onChangeDefaultLocalityId?: (localityId: string) => void;
  onBulkImportBusinesses?: (rows: Array<{
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
    latitude: string;
    longitude: string;
  }>) => { imported: number; skipped: number };
  listingAds?: ListingAd[];
  onCreateListingAd?: (ad: Omit<ListingAd, 'id'>) => void;
  onUpdateListingAd?: (ad: ListingAd) => void;
  onDeleteListingAd?: (adId: string) => void;
  heroBanners?: HeroBanner[];
  onCreateHeroBanner?: (banner: Omit<HeroBanner, 'id'>) => void;
  onUpdateHeroBanner?: (banner: HeroBanner) => void;
  onDeleteHeroBanner?: (bannerId: string) => void;
  coupons?: MarketingCoupon[];
  onAddCoupon?: (coupon: Omit<MarketingCoupon, 'id' | 'usageCount'>) => void;
  communityItems?: CommunityItem[];
  onAddCommunityItem?: (item: Omit<CommunityItem, 'id' | 'createdAt' | 'likes'>) => void;
  onUpdateCommunityItem?: (item: CommunityItem) => void;
  onDeleteCommunityItem?: (itemId: string) => void;
  homepageLayouts?: HomepageLayout[];
  onCreateHomepageSection?: (localityId: string, section: Omit<HomepageSection, 'id' | 'sortOrder'>) => void;
  onUpdateHomepageSection?: (localityId: string, section: HomepageSection) => void;
  onDeleteHomepageSection?: (localityId: string, sectionId: string) => void;
  onDuplicateHomepageSection?: (localityId: string, sectionId: string) => void;
  onMoveHomepageSection?: (localityId: string, sectionId: string, direction: 'up' | 'down') => void;
  adLeads?: AdLead[];
  apiConfiguration?: ApiConfiguration;
  onUpdateApiConfiguration?: (config: ApiConfiguration) => void;
  onSyncHomepageConfig?: () => void;
  localityCategoryLinks?: LocalityCategoryLink[];
  onCreateLocalityCategoryLink?: (payload: Omit<LocalityCategoryLink, 'id'>) => void;
  onDeleteLocalityCategoryLink?: (id: string) => void;
}

type BulkImportRow = {
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
};

type ImportPreviewRow = BulkImportRow & {
  rowNumber: number;
  previewStatus: 'ready' | 'update' | 'fail';
  errors: string[];
  normalizedPhone: string;
  resolvedPincode: string;
  resolvedLocalityId: string;
  categorySuggestionNeeded: boolean;
  subcategorySuggestionNeeded: boolean;
  suggestedCategoryName?: string;
  suggestedSubcategoryName?: string;
};

type LocalityCategoryLink = {
  id: string;
  localityId: string;
  categoryId: string;
  subcategoryId?: string;
  slug: string;
};

type AdminWorkspaceTab = 'moderation' | 'listing-status' | 'bulk-upload' | 'data-audit';
type ListingStatusFilter = 'all' | 'approved' | 'rejected' | 'pending';
type AdminOperationsSection = 'listings' | 'homepage' | 'campaigns' | 'geography' | 'content' | 'platform';

export default function AdminConsole({
  localities,
  businesses,
  subdomains,
  onApprove,
  onReject,
  onCreateLocality,
  onDeleteLocality,
  onUpdateBusiness,
  userSession,
  auditLogs = [],
  
  pincodeMappings = [],
  onAddPincodeMapping,
  onDeletePincodeMapping,
  defaultLocalityId = 'roadpali',
  onChangeDefaultLocalityId,
  onBulkImportBusinesses,
  listingAds = [],
  onCreateListingAd,
  onUpdateListingAd,
  onDeleteListingAd,
  heroBanners = [],
  onCreateHeroBanner,
  onUpdateHeroBanner,
  onDeleteHeroBanner,
  coupons = [],
  onAddCoupon,
  communityItems = [],
  onAddCommunityItem,
  onUpdateCommunityItem,
  onDeleteCommunityItem,
  homepageLayouts = [],
  onCreateHomepageSection,
  onUpdateHomepageSection,
  onDeleteHomepageSection,
  onDuplicateHomepageSection,
  onMoveHomepageSection,
  adLeads = [],
  apiConfiguration,
  onUpdateApiConfiguration,
  onSyncHomepageConfig,
  localityCategoryLinks = [],
  onCreateLocalityCategoryLink,
  onDeleteLocalityCategoryLink
}: AdminConsoleProps) {
  // Internal infrastructure controls are hidden from public-facing admin UI.
  const showInternalTopology = false;
  const [newLocName, setNewLocName] = useState('');
  const [newLocSubdomain, setNewLocSubdomain] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocImg, setNewLocImg] = useState('');
  const [newLocPincodes, setNewLocPincodes] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectionActive, setRejectionActive] = useState<Record<string, boolean>>({});
  const [adminNotification, setAdminNotification] = useState<string | null>(null);
  const [editedHrs, setEditedHrs] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<string>('');
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);
  const [adminWorkspaceTab, setAdminWorkspaceTab] = useState<AdminWorkspaceTab>('moderation');
  const [listingStatusFilter, setListingStatusFilter] = useState<ListingStatusFilter>('all');
  const [operationsSection, setOperationsSection] = useState<AdminOperationsSection>('homepage');
  const [listingStatusPage, setListingStatusPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [importPreviewPage, setImportPreviewPage] = useState(1);
  const [selectedBackendBiz, setSelectedBackendBiz] = useState<Business | null>(null);
  const [backendDraft, setBackendDraft] = useState<Business | null>(null);
  const [backendEditMode, setBackendEditMode] = useState(false);
  const [uploadedTab, setUploadedTab] = useState<'active' | 'deactivated' | 'pending'>('active');
  const [uploadedPage, setUploadedPage] = useState(1);

  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adBadge, setAdBadge] = useState('Sponsored');
  const [adCtaText, setAdCtaText] = useState('Know More');
  const [adBgColor, setAdBgColor] = useState('#1d4ed8');
  const [adStartDate, setAdStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [adEndDate, setAdEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [adActionType, setAdActionType] = useState<ListingAd['actionType']>('landing_page');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adTargetBusinessId, setAdTargetBusinessId] = useState('');
  const [adSellerBusinessId, setAdSellerBusinessId] = useState('');
  const [adLocalityId, setAdLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [adPincodes, setAdPincodes] = useState('');
  const [adPlacementKey, setAdPlacementKey] = useState('homepage_inline_primary');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adDeviceTarget, setAdDeviceTarget] = useState<NonNullable<ListingAd['deviceTarget']>>('all');
  const [adMobileRowPosition, setAdMobileRowPosition] = useState('3');

  const [heroLocalityId, setHeroLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroStartDate, setHeroStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [heroEndDate, setHeroEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [heroCtaLabel, setHeroCtaLabel] = useState('Explore Businesses');
  const [heroCtaType, setHeroCtaType] = useState<NonNullable<HeroBanner['ctaType']>>('search_category');
  const [heroCtaTarget, setHeroCtaTarget] = useState('all');
  const [heroPincodes, setHeroPincodes] = useState('');

  const [couponBusinessId, setCouponBusinessId] = useState('');
  const [couponTitle, setCouponTitle] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [couponStartDate, setCouponStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [couponEndDate, setCouponEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [couponLocalityId, setCouponLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [couponPincodes, setCouponPincodes] = useState('');

  const [homepageLocalityId, setHomepageLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [newSectionType, setNewSectionType] = useState<HomepageSectionType>('hero_banner');
  const [newSectionTitle, setNewSectionTitle] = useState('Hero Banner');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionCategoryId, setNewSectionCategoryId] = useState(BUSINESS_CATEGORIES[0]?.id || 'food-restaurants');
  const [newSectionSubcategoryId, setNewSectionSubcategoryId] = useState('');
  const [newSectionPlacementKey, setNewSectionPlacementKey] = useState('homepage_inline_primary');
  const [newSectionMaxItems, setNewSectionMaxItems] = useState('6');
  const [newSectionCtaLabel, setNewSectionCtaLabel] = useState('');
  const [newSectionCtaType, setNewSectionCtaType] = useState<HomepageSection['ctaType']>('none');
  const [newSectionCtaTarget, setNewSectionCtaTarget] = useState('');
  const [newSectionBackgroundColor, setNewSectionBackgroundColor] = useState('#ffffff');
  const [newSectionStartDate, setNewSectionStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSectionEndDate, setNewSectionEndDate] = useState('');
  const [newSectionPincodes, setNewSectionPincodes] = useState('');
  const [newSectionShowViewAll, setNewSectionShowViewAll] = useState(true);
  const [newSectionVisibleSlots, setNewSectionVisibleSlots] = useState('4');
  const [newSectionDesktopCardCount, setNewSectionDesktopCardCount] = useState('4');
  const [newSectionMobileCardCount, setNewSectionMobileCardCount] = useState('2');
  const [newSectionMobileDisplayMode, setNewSectionMobileDisplayMode] = useState<NonNullable<HomepageSection['mobileDisplayMode']>>('carousel');
  const [newSectionCategoryIds, setNewSectionCategoryIds] = useState<string[]>([]);
  const [newSectionListingSourceMode, setNewSectionListingSourceMode] = useState<HomepageSection['listingSourceMode']>('auto');
  const [newSectionPinnedBusinessIds, setNewSectionPinnedBusinessIds] = useState<string[]>([]);
  const [newSectionAutoRotate, setNewSectionAutoRotate] = useState(true);
  const [newSectionRotationIntervalSec, setNewSectionRotationIntervalSec] = useState('3');
  const [apiConfigDraft, setApiConfigDraft] = useState<ApiConfiguration>(() => apiConfiguration || {
    syncMode: 'api',
    homepageConfigEndpoint: '/api/homepage-config',
    businessesEndpoint: '/api/businesses',
    auditEventsEndpoint: '/api/audit-events',
    autoSyncHomepage: true,
    autoSyncBusinesses: true
  });

  const [linkLocalityId, setLinkLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [linkCategoryId, setLinkCategoryId] = useState(BUSINESS_CATEGORIES[0]?.id || 'food-restaurants');
  const [linkSubcategoryId, setLinkSubcategoryId] = useState('');
  const [adminLocalityFilter, setAdminLocalityFilter] = useState('all');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('all');
  const [adminSubcategoryFilter, setAdminSubcategoryFilter] = useState('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminPincodeFilter, setAdminPincodeFilter] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [communityDraft, setCommunityDraft] = useState<Partial<CommunityItem>>({
    type: 'post',
    title: '',
    content: '',
    authorName: 'Localisy Team'
  });

  useEffect(() => {
    if (localities.length === 0) return;
    if (!localities.some((locality) => locality.id === heroLocalityId)) {
      setHeroLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === adLocalityId)) {
      setAdLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === couponLocalityId)) {
      setCouponLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === homepageLocalityId)) {
      setHomepageLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === linkLocalityId)) {
      setLinkLocalityId(localities[0].id);
    }
  }, [localities, heroLocalityId, adLocalityId, couponLocalityId, homepageLocalityId, linkLocalityId]);

  useEffect(() => {
    if (!linkSubcategoryId) return;
    if (!getSubcategoriesForCategory(linkCategoryId).some((subcategory) => subcategory.id === linkSubcategoryId)) {
      setLinkSubcategoryId('');
    }
  }, [linkCategoryId, linkSubcategoryId]);

  useEffect(() => {
    if (!newSectionSubcategoryId) return;
    if (!getSubcategoriesForCategory(newSectionCategoryId).some((subcategory) => subcategory.id === newSectionSubcategoryId)) {
      setNewSectionSubcategoryId('');
    }
  }, [newSectionCategoryId, newSectionSubcategoryId]);

  useEffect(() => {
    if (adminCategoryFilter === 'all') {
      setAdminSubcategoryFilter('all');
      return;
    }
    if (!getSubcategoriesForCategory(adminCategoryFilter).some((subcategory) => subcategory.id === adminSubcategoryFilter)) {
      setAdminSubcategoryFilter('all');
    }
  }, [adminCategoryFilter, adminSubcategoryFilter]);

  useEffect(() => {
    if (!couponBusinessId) {
      const firstApproved = businesses.find((business) => business.status === 'approved');
      if (firstApproved) {
        setCouponBusinessId(firstApproved.id);
      }
    }
  }, [businesses, couponBusinessId]);

  useEffect(() => {
    if (!apiConfiguration) return;
    setApiConfigDraft(apiConfiguration);
  }, [apiConfiguration]);

  const parsePincodeList = (raw: string) => (
    raw
      .split(/[\s,]+/)
      .map((entry) => entry.replace(/\D/g, '').trim())
      .filter((entry, index, items) => entry.length === 6 && items.indexOf(entry) === index)
  );

  const homepageSectionLabels: Record<HomepageSectionType, string> = {
    hero_banner: 'Hero Banner',
    search_discovery: 'Search & Discovery',
    emergency_grid: 'Emergency Services',
    promo_banner: 'Promo Banner',
    featured_businesses: 'Featured Businesses',
    business_shelf: 'Business Shelf',
    text_business_strip: 'Compact Service Strip',
    offers_list: 'Offers & Deals',
    updates_feed: 'Locality Updates',
    category_grid: 'Category Grid',
    verified_business_grid: 'Verified Businesses',
    trust_strip: 'Trust Strip'
  };

  const homepageSectionOptions = (Object.keys(homepageSectionLabels) as HomepageSectionType[]).map((sectionType) => ({
    id: sectionType,
    label: homepageSectionLabels[sectionType]
  }));
  const operationsSectionTabs: Array<{ id: AdminOperationsSection; label: string }> = [
    { id: 'listings', label: 'Listings Ops' },
    { id: 'homepage', label: 'Homepage CMS' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'geography', label: 'Geography & Routing' },
    { id: 'content', label: 'Content & Community' },
    { id: 'platform', label: 'Platform Config' }
  ];

  const selectedHomepageLayout = homepageLayouts.find((layout) => layout.localityId === homepageLocalityId);
  const homepageSections = [...(selectedHomepageLayout?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const filteredBusinesses = businesses.filter((business) => {
    if (adminLocalityFilter !== 'all' && business.localityId !== adminLocalityFilter) return false;
    if (adminCategoryFilter !== 'all' && business.categoryId !== adminCategoryFilter) return false;
    if (adminSubcategoryFilter !== 'all' && business.subcategoryId !== adminSubcategoryFilter) return false;
    if (adminStatusFilter !== 'all' && business.status !== adminStatusFilter) return false;
    if (adminPincodeFilter.trim()) {
      const businessPincode = business.pincode || MASTER_AREAS.find((area) => area.id === business.areaId)?.pincode || '';
      if (!businessPincode.includes(adminPincodeFilter.trim())) return false;
    }
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${business.name} ${business.phone} ${business.address} ${business.ownerName || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredCoupons = coupons.filter((coupon) => {
    const business = businesses.find((entry) => entry.id === coupon.businessId);
    if (adminLocalityFilter !== 'all' && !(coupon.localityIds || []).includes(adminLocalityFilter) && business?.localityId !== adminLocalityFilter) return false;
    if (adminCategoryFilter !== 'all' && business?.categoryId !== adminCategoryFilter) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${coupon.title || ''} ${coupon.code} ${coupon.description} ${business?.name || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredListingAds = listingAds.filter((ad) => {
    if (adminLocalityFilter !== 'all' && !(ad.localityIds || []).includes(adminLocalityFilter)) return false;
    if (adminStatusFilter === 'active' && !ad.isActive) return false;
    if (adminStatusFilter === 'inactive' && ad.isActive) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${ad.title} ${ad.description} ${ad.badge} ${ad.placementKey || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredHeroBanners = heroBanners.filter((hero) => {
    if (adminLocalityFilter !== 'all' && hero.localityId !== adminLocalityFilter) return false;
    if (adminStatusFilter === 'active' && !hero.isActive) return false;
    if (adminStatusFilter === 'inactive' && hero.isActive) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${hero.title} ${hero.subtitle}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredCommunityItems = communityItems.filter((item) => {
    if (adminLocalityFilter !== 'all' && item.localityId !== adminLocalityFilter) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${item.title} ${item.content} ${item.authorName}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredAdLeads = adLeads.filter((lead) => {
    if (adminLocalityFilter !== 'all' && lead.localityId !== adminLocalityFilter) return false;
    if (adminPincodeFilter.trim() && !lead.pincode.includes(adminPincodeFilter.trim())) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${lead.name} ${lead.mobile} ${lead.adId}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredHomepageSections = homepageSections.filter((section) => {
    if (adminStatusFilter === 'active' && section.status !== 'active') return false;
    if (adminStatusFilter === 'inactive' && section.status === 'active') return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${section.title} ${section.subtitle || ''} ${section.sectionType}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredLocalities = localities.filter((locality) => {
    if (adminLocalityFilter !== 'all' && locality.id !== adminLocalityFilter) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${locality.name} ${locality.subdomain} ${locality.slug}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredPincodeMappings = pincodeMappings.filter((mapping) => {
    if (adminLocalityFilter !== 'all' && mapping.localityId !== adminLocalityFilter) return false;
    if (adminPincodeFilter.trim() && !mapping.pincode.includes(adminPincodeFilter.trim())) return false;
    if (adminSearchQuery.trim()) {
      const localityName = localities.find((locality) => locality.id === mapping.localityId)?.name || mapping.localityId;
      const query = adminSearchQuery.trim().toLowerCase();
      if (!`${mapping.pincode} ${localityName}`.toLowerCase().includes(query)) return false;
    }
    return true;
  });
  const filteredLocalityCategoryLinks = localityCategoryLinks.filter((link) => {
    if (adminLocalityFilter !== 'all' && link.localityId !== adminLocalityFilter) return false;
    if (adminCategoryFilter !== 'all' && link.categoryId !== adminCategoryFilter) return false;
    if (adminSubcategoryFilter !== 'all' && link.subcategoryId !== adminSubcategoryFilter) return false;
    if (adminSearchQuery.trim()) {
      const localityName = localities.find((locality) => locality.id === link.localityId)?.name || link.localityId;
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${localityName} ${link.slug} ${link.categoryId} ${link.subcategoryId || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });

  const parseCsvLine = (line: string) => {
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((s) => s.trim().replace(/^"|"$/g, ''));
  };

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

  const inferCategory = (services: string) => {
    const s = services.toLowerCase();
    if (s.includes('salon') || s.includes('spa') || s.includes('beauty')) return 'beauty-wellness';
    if (s.includes('hospital') || s.includes('medical') || s.includes('pharmacy') || s.includes('clinic')) return 'health-medical';
    if (s.includes('school') || s.includes('preschool') || s.includes('education')) return 'education-training';
    if (s.includes('hardware') || s.includes('electrical') || s.includes('plumbing')) return 'home-services';
    if (s.includes('restaurant') || s.includes('sweets') || s.includes('food')) return 'food-restaurants';
    if (s.includes('fashion') || s.includes('clothing') || s.includes('store') || s.includes('retail')) return 'shopping-retail';
    if (s.includes('software') || s.includes('digital') || s.includes('it service')) return 'digital-technology';
    return 'professional-services';
  };

  const resolveCategoryFromImport = (categoryName: string | undefined, services: string) => {
    const direct = BUSINESS_CATEGORIES.find((category) => category.name.toLowerCase() === String(categoryName || '').trim().toLowerCase());
    return direct?.id || inferCategory(services);
  };

  const inferSubcategory = (services: string, categoryId: string) => {
    const s = services.toLowerCase();
    if (categoryId === 'beauty-wellness' && s.includes('spa')) return 'spas';
    if (categoryId === 'beauty-wellness') return 'salons';
    if (categoryId === 'health-medical' && s.includes('pharmacy')) return 'medical-stores';
    if (categoryId === 'health-medical' && s.includes('dental')) return 'dental-clinics';
    if (categoryId === 'health-medical') return 'clinics';
    if (categoryId === 'food-restaurants' && s.includes('cafe')) return 'cafes';
    if (categoryId === 'food-restaurants' && s.includes('sweet')) return 'sweet-shops';
    if (categoryId === 'food-restaurants') return 'restaurants';
    if (categoryId === 'home-services' && s.includes('plumb')) return 'plumbers';
    if (categoryId === 'home-services' && s.includes('ac')) return 'ac-repair';
    if (categoryId === 'home-services') return 'electricians';
    if (categoryId === 'shopping-retail' && s.includes('cloth')) return 'clothing-stores';
    if (categoryId === 'shopping-retail') return 'grocery-stores';
    return resolveDefaultSubcategoryId(categoryId);
  };

  const inferLocality = (area: string) => {
    const a = area.toLowerCase();
    if (a.includes('kharghar')) return 'kharghar';
    if (a.includes('kamothe')) return 'kamothe';
    if (a.includes('panvel')) return 'panvel';
    if (a.includes('taloja')) return 'taloja';
    if (a.includes('kalamboli')) return 'kalamboli';
    return 'roadpali';
  };

  const applyImportSuggestion = (rowNumber: number) => {
    setImportPreview((prev) => prev.map((row) => {
      if (row.rowNumber !== rowNumber) return row;
      const categoryName = getCategoryById(row.categoryId || '')?.name || row.category || '';
      const subcategoryName = getSubcategoryById(row.subcategoryId || '')?.name || row.subcategory || '';
      return {
        ...row,
        category: categoryName,
        subcategory: subcategoryName,
        categorySuggestionNeeded: false,
        subcategorySuggestionNeeded: false,
        suggestedCategoryName: categoryName,
        suggestedSubcategoryName: subcategoryName
      };
    }));
  };

  const buildImportPreview = (rows: BulkImportRow[]) => rows.map((row, idx): ImportPreviewRow => {
    const errors: string[] = [];
    const normalizedPhone = normalizePhone(row.mobile);
    const areaMatch =
      MASTER_AREAS.find(a => a.name.toLowerCase().includes((row.area || '').toLowerCase()) && row.area.trim()) ||
      MASTER_AREAS.find(a => a.pincode === row.pin.replace(/\D/g, ''));
    const resolvedPincode = row.pin.replace(/\D/g, '') || areaMatch?.pincode || '';
    const mappedLocality = pincodeMappings.find(m => m.pincode === resolvedPincode)?.localityId;
    const resolvedLocalityId = mappedLocality || inferLocality(`${row.area} ${row.city}`);
    const directCategory = BUSINESS_CATEGORIES.find((category) => (
      category.name.toLowerCase() === String(row.category || '').trim().toLowerCase()
    ));
    const categoryId = directCategory?.id || resolveCategoryFromImport(row.category, row.services || '');
    const directSubcategory = BUSINESS_SUBCATEGORIES.find((subcategory) => (
      subcategory.categoryId === categoryId &&
      subcategory.name.toLowerCase() === String(row.subcategory || '').trim().toLowerCase()
    ));
    const subcategoryId = directSubcategory?.id || inferSubcategory(row.services || '', categoryId);
    const categorySuggestionNeeded = Boolean(String(row.category || '').trim()) && !directCategory;
    const subcategorySuggestionNeeded = Boolean(String(row.subcategory || '').trim()) && !directSubcategory;
    const suggestedCategoryName = getCategoryById(categoryId)?.name || categoryId;
    const suggestedSubcategoryName = getSubcategoryById(subcategoryId)?.name || subcategoryId;

    if (!row.businessName.trim()) errors.push('Business Name is required.');
    if (normalizedPhone.length > 0 && normalizedPhone.length !== 10) errors.push('Mobile must be blank or a valid 10-digit number.');
    if (resolvedPincode.length !== 6) errors.push('Valid 6-digit PIN is required or must match a known area.');
    if (!localities.some(l => l.id === resolvedLocalityId)) errors.push(`Mapped locality "${resolvedLocalityId}" does not exist.`);
    if (!BUSINESS_CATEGORIES.some(c => c.id === categoryId)) errors.push('Could not resolve a valid category.');
    if (!getSubcategoriesForCategory(categoryId).some(s => s.id === subcategoryId)) errors.push('Could not resolve a valid subcategory.');

    const duplicate = businesses.find((biz) => {
      const bizPincode = biz.pincode || MASTER_AREAS.find(a => a.id === biz.areaId)?.pincode || '';
      return (
        biz.name.trim().toLowerCase() === row.businessName.trim().toLowerCase() &&
        normalizedPhone.length > 0 &&
        normalizePhone(biz.phone) === normalizedPhone &&
        bizPincode === resolvedPincode &&
        biz.localityId === resolvedLocalityId
      );
    });

    const previewStatus: ImportPreviewRow['previewStatus'] = errors.length ? 'fail' : duplicate ? 'update' : 'ready';
    return {
      ...row,
      rowNumber: idx + 2,
      previewStatus,
      errors,
      normalizedPhone,
      resolvedPincode,
      resolvedLocalityId,
      categorySuggestionNeeded,
      subcategorySuggestionNeeded,
      suggestedCategoryName,
      suggestedSubcategoryName,
      importAction: duplicate ? 'update' : 'create',
      existingBusinessId: duplicate?.id,
      localityId: resolvedLocalityId,
      areaId: areaMatch?.id || 'roadpali-sec17',
      categoryId,
      subcategoryId
    };
  });

  const handleCsvImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setImportResult('CSV appears empty or missing rows.');
      setImportPreview([]);
      return;
    }
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      const get = (name: string) => {
        const idx = headers.indexOf(name.toLowerCase());
        return idx >= 0 ? (cols[idx] || '') : '';
      };
      return {
        businessName: get('Business Name'),
        address: get('Address'),
        area: get('Area'),
        city: get('City'),
        state: get('State'),
        pin: get('PIN'),
        mobile: get('Mobile'),
        rating: get('Rating'),
        reviews: get('Reviews'),
        services: get('Services'),
        category: get('Category'),
        subcategory: get('Subcategory'),
        latitude: get('Latitude'),
        longitude: get('Longitude'),
      };
    }).filter((r) => r.businessName.trim());

    const preview = buildImportPreview(rows);
    setImportPreview(preview);
    setImportPreviewPage(1);
    const ready = preview.filter(r => r.previewStatus === 'ready').length;
    const updates = preview.filter(r => r.previewStatus === 'update').length;
    const failed = preview.filter(r => r.previewStatus === 'fail').length;
    setImportResult(`Preview generated: ${ready} ready, ${updates} existing matches need update confirmation, ${failed} failed.`);
  };

  const handleApplyImportPreview = () => {
    if (!onBulkImportBusinesses) {
      setImportResult('Bulk import callback is not configured.');
      return;
    }
    const validRows = importPreview.filter(r => r.previewStatus !== 'fail');
    const updateRows = validRows.filter(r => r.previewStatus === 'update');
    if (updateRows.length > 0 && !confirm(`${updateRows.length} listing(s) already exist with the same business name, phone, pincode, and locality. Update those records instead of creating duplicates?`)) {
      return;
    }
    const result = onBulkImportBusinesses(validRows);
    const failed = importPreview.filter(r => r.previewStatus === 'fail').length;
    setImportPreview(importPreview.filter(r => r.previewStatus === 'fail'));
    setImportPreviewPage(1);
    setImportResult(`Upload complete: ${result.imported} created, ${result.skipped} updated/skipped, ${failed} failed rows kept below with error details.`);
  };

  const downloadFailedImportCsv = () => {
    const failedRows = importPreview.filter(r => r.previewStatus === 'fail');
    const header = ['Row', 'Business Name', 'Address', 'Area', 'City', 'State', 'PIN', 'Mobile', 'Rating', 'Reviews', 'Services', 'Category', 'Subcategory', 'Latitude', 'Longitude', 'Error Details'];
    const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const body = failedRows.map(r => [
      r.rowNumber, r.businessName, r.address, r.area, r.city, r.state, r.pin, r.mobile, r.rating, r.reviews, r.services, r.category || '', r.subcategory || '', r.latitude, r.longitude, r.errors.join('; ')
    ].map(escapeCsv).join(','));
    const blob = new Blob([[header.map(escapeCsv).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'failed-business-imports.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const pendingBusinesses = businesses.filter(b => b.status === 'pending');
  const listingStatusItems = [...businesses]
    .filter((business) => listingStatusFilter === 'all' ? true : business.status === listingStatusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const LISTING_STATUS_PAGE_SIZE = 20;
  const listingStatusTotalPages = Math.max(1, Math.ceil(listingStatusItems.length / LISTING_STATUS_PAGE_SIZE));
  const safeListingStatusPage = Math.min(listingStatusPage, listingStatusTotalPages);
  const listingStatusPageItems = listingStatusItems.slice(
    (safeListingStatusPage - 1) * LISTING_STATUS_PAGE_SIZE,
    safeListingStatusPage * LISTING_STATUS_PAGE_SIZE
  );
  const adminWorkspaceTabs: Array<{ id: AdminWorkspaceTab; label: string; count?: number }> = [
    { id: 'moderation', label: 'Moderation', count: pendingBusinesses.length },
    { id: 'listing-status', label: 'Listing Status', count: businesses.length },
    { id: 'bulk-upload', label: 'Bulk Upload' },
    { id: 'data-audit', label: 'Data Audit', count: auditLogs.length }
  ];
  const AUDIT_PAGE_SIZE = 20;
  const auditTotalPages = Math.max(1, Math.ceil(auditLogs.length / AUDIT_PAGE_SIZE));
  const safeAuditPage = Math.min(auditPage, auditTotalPages);
  const pagedAuditLogs = auditLogs.slice((safeAuditPage - 1) * AUDIT_PAGE_SIZE, safeAuditPage * AUDIT_PAGE_SIZE);
  const IMPORT_PREVIEW_PAGE_SIZE = 20;
  const importPreviewTotalPages = Math.max(1, Math.ceil(importPreview.length / IMPORT_PREVIEW_PAGE_SIZE));
  const safeImportPreviewPage = Math.min(importPreviewPage, importPreviewTotalPages);
  const pagedImportPreview = importPreview.slice(
    (safeImportPreviewPage - 1) * IMPORT_PREVIEW_PAGE_SIZE,
    safeImportPreviewPage * IMPORT_PREVIEW_PAGE_SIZE
  );

  const triggerNotification = (msg: string) => {
    setAdminNotification(msg);
    setTimeout(() => setAdminNotification(null), 3000);
  };

  const openBackendListing = (biz: Business) => {
    setSelectedBackendBiz(biz);
    setBackendDraft({
      ...biz,
      pincode: biz.pincode || MASTER_AREAS.find((area) => area.id === biz.areaId)?.pincode || '',
      areasOfOperation: [...(biz.areasOfOperation || [])]
    });
    setBackendEditMode(false);
  };

  const closeBackendListing = () => {
    setSelectedBackendBiz(null);
    setBackendDraft(null);
    setBackendEditMode(false);
  };

  const saveBackendListing = () => {
    if (!backendDraft || !onUpdateBusiness) return;
    const normalizedDraft = {
      ...backendDraft,
      pincode: backendDraft.pincode || MASTER_AREAS.find((area) => area.id === backendDraft.areaId)?.pincode || ''
    };
    onUpdateBusiness(normalizedDraft);
    setSelectedBackendBiz(normalizedDraft);
    setBackendDraft(normalizedDraft);
    setBackendEditMode(false);
    triggerNotification(`Saved listing: ${normalizedDraft.name}`);
  };

  const handleLocalitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocSubdomain) {
      triggerNotification("Please fill in Name and Subdomain!");
      return;
    }
    
    // Clean subdomain format
    let cleanSub = newLocSubdomain.toLowerCase().trim();
    if (!cleanSub.includes('.')) {
      cleanSub = `${cleanSub}.yellowpages.io`;
    }

    const defaultImg = newLocImg.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80';

    const newLocalityId = newLocName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mappedPins = newLocPincodes
      .split(/[\s,]+/)
      .map((pin) => pin.replace(/\D/g, '').trim())
      .filter((pin, index, arr) => pin.length === 6 && arr.indexOf(pin) === index);

    onCreateLocality(newLocName, cleanSub, newLocDesc || 'Dynamic regional yellow pages listings catalog.', defaultImg);
    mappedPins.forEach((pin) => onAddPincodeMapping?.(pin, newLocalityId));
    triggerNotification(`Successfully spun up locality: ${newLocName}`);
    setNewLocName('');
    setNewLocSubdomain('');
    setNewLocDesc('');
    setNewLocImg('');
    setNewLocPincodes('');
  };

  const uploadedListings = businesses.filter((business) => (
    business.id.startsWith('csv_') ||
    business.id.startsWith('b_dynamic_') ||
    business.ownerName === 'Imported via CSV'
  ));
  const uploadedStatusFiltered = uploadedListings.filter((business) => {
    if (uploadedTab === 'active') return business.status === 'approved';
    if (uploadedTab === 'deactivated') return business.status === 'rejected';
    return business.status === 'pending';
  });
  const UPLOADED_PAGE_SIZE = 20;
  const uploadedTotalPages = Math.max(1, Math.ceil(uploadedStatusFiltered.length / UPLOADED_PAGE_SIZE));
  const safeUploadedPage = Math.min(uploadedPage, uploadedTotalPages);
  const uploadedPageItems = uploadedStatusFiltered.slice((safeUploadedPage - 1) * UPLOADED_PAGE_SIZE, safeUploadedPage * UPLOADED_PAGE_SIZE);

  const handleCreateListingAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adDescription.trim() || !adCtaText.trim()) {
      triggerNotification('Please fill Ad title, description, and CTA text.');
      return;
    }
    if (adActionType === 'landing_page' && !adTargetUrl.trim()) {
      triggerNotification('Please provide a landing page URL.');
      return;
    }
    if (adActionType === 'landing_listing' && !adTargetBusinessId) {
      triggerNotification('Please choose a landing listing.');
      return;
    }

    onCreateListingAd?.({
      title: adTitle.trim(),
      description: adDescription.trim(),
      badge: adBadge.trim() || 'Sponsored',
      ctaText: adCtaText.trim(),
      backgroundColor: adBgColor || '#1d4ed8',
      imageUrl: adImageUrl.trim() || undefined,
      startDate: adStartDate,
      endDate: adEndDate,
      actionType: adActionType,
      targetUrl: adActionType === 'landing_page' ? adTargetUrl.trim() : undefined,
      targetBusinessId: adActionType === 'landing_listing' ? adTargetBusinessId : undefined,
      sellerBusinessId: adSellerBusinessId || undefined,
      localityIds: adLocalityId ? [adLocalityId] : [],
      pincodes: parsePincodeList(adPincodes),
      placementKey: adPlacementKey.trim() || 'homepage_inline_primary',
      deviceTarget: adDeviceTarget,
      mobileRowPosition: adDeviceTarget !== 'desktop' && Number(adMobileRowPosition) > 0 ? Number(adMobileRowPosition) : undefined,
      isActive: true
    });

    setAdTitle('');
    setAdDescription('');
    setAdBadge('Sponsored');
    setAdCtaText('Know More');
    setAdTargetUrl('');
    setAdTargetBusinessId('');
    setAdSellerBusinessId('');
    setAdPincodes('');
    setAdPlacementKey('homepage_inline_primary');
    setAdImageUrl('');
    setAdDeviceTarget('all');
    setAdMobileRowPosition('3');
    triggerNotification('Listing ad created successfully.');
  };

  const handleCreateHeroBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroTitle.trim() || !heroSubtitle.trim() || !heroImageUrl.trim()) {
      triggerNotification('Please fill hero title, subtitle, and image URL.');
      return;
    }
    onCreateHeroBanner?.({
      localityId: heroLocalityId,
      title: heroTitle.trim(),
      subtitle: heroSubtitle.trim(),
      imageUrl: heroImageUrl.trim(),
      startDate: heroStartDate,
      endDate: heroEndDate,
      ctaLabel: heroCtaLabel.trim() || 'Explore Businesses',
      ctaType: heroCtaType,
      ctaTarget: heroCtaTarget.trim() || 'all',
      pincodes: parsePincodeList(heroPincodes),
      isActive: true
    });
    setHeroTitle('');
    setHeroSubtitle('');
    setHeroImageUrl('');
    setHeroCtaLabel('Explore Businesses');
    setHeroCtaType('search_category');
    setHeroCtaTarget('all');
    setHeroPincodes('');
    triggerNotification('Hero banner created.');
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponBusinessId || !couponTitle.trim() || !couponCode.trim() || !couponDiscount.trim() || !couponDescription.trim()) {
      triggerNotification('Please fill offer business, title, code, discount, and description.');
      return;
    }

    onAddCoupon?.({
      businessId: couponBusinessId,
      title: couponTitle.trim(),
      code: couponCode.trim(),
      discount: couponDiscount.trim(),
      description: couponDescription.trim(),
      startDate: couponStartDate,
      expiryDate: couponEndDate,
      endDate: couponEndDate,
      isActive: true,
      localityIds: couponLocalityId ? [couponLocalityId] : [],
      pincodes: parsePincodeList(couponPincodes),
      badgeText: couponDiscount.trim(),
      ctaText: 'Claim Offer',
      targetBusinessId: couponBusinessId
    });

    setCouponTitle('');
    setCouponCode('');
    setCouponDiscount('');
    setCouponDescription('');
    setCouponPincodes('');
    triggerNotification('Offer created successfully.');
  };

  const handleCreateHomepageSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homepageLocalityId || !newSectionTitle.trim()) {
      triggerNotification('Choose locality and section title before adding a homepage section.');
      return;
    }

    onCreateHomepageSection?.(homepageLocalityId, {
      sectionType: newSectionType,
      title: newSectionTitle.trim(),
      subtitle: newSectionSubtitle.trim() || undefined,
      status: 'active',
      visible: true,
      startDate: newSectionStartDate || undefined,
      endDate: newSectionEndDate || undefined,
      localityIds: [homepageLocalityId],
      pincodes: parsePincodeList(newSectionPincodes),
      categoryId: ['business_shelf', 'text_business_strip'].includes(newSectionType) ? newSectionCategoryId : undefined,
      categoryIds: ['category_grid', 'emergency_grid'].includes(newSectionType) ? newSectionCategoryIds : undefined,
      subcategoryId: ['business_shelf', 'text_business_strip'].includes(newSectionType) ? (newSectionSubcategoryId || undefined) : undefined,
      placementKey: newSectionType === 'promo_banner' ? newSectionPlacementKey.trim() || 'homepage_inline_primary' : undefined,
      maxItems: Number(newSectionMaxItems) > 0 ? Number(newSectionMaxItems) : undefined,
      visibleSlots: Number(newSectionVisibleSlots) > 0 ? Number(newSectionVisibleSlots) : undefined,
      desktopCardCount: Number(newSectionDesktopCardCount) > 0 ? Number(newSectionDesktopCardCount) : undefined,
      mobileCardCount: Number(newSectionMobileCardCount) > 0 ? Number(newSectionMobileCardCount) : undefined,
      mobileDisplayMode: ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) ? newSectionMobileDisplayMode : undefined,
      ctaLabel: newSectionCtaLabel.trim() || undefined,
      ctaType: newSectionCtaType || 'none',
      ctaTarget: newSectionCtaTarget.trim() || undefined,
      backgroundColor: newSectionBackgroundColor || undefined,
      showViewAll: newSectionShowViewAll,
      listingSourceMode: ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) ? (newSectionListingSourceMode || 'auto') : undefined,
      pinnedBusinessIds: newSectionListingSourceMode === 'manual' ? newSectionPinnedBusinessIds : undefined,
      autoRotate: newSectionAutoRotate,
      rotationIntervalSec: Number(newSectionRotationIntervalSec) > 0 ? Number(newSectionRotationIntervalSec) : 3
    });

    setNewSectionSubtitle('');
    setNewSectionPincodes('');
    setNewSectionCtaLabel('');
    setNewSectionCtaType('none');
    setNewSectionCtaTarget('');
    setNewSectionBackgroundColor('#ffffff');
    setNewSectionEndDate('');
    setNewSectionMaxItems('6');
    setNewSectionVisibleSlots('4');
    setNewSectionDesktopCardCount('4');
    setNewSectionMobileCardCount('2');
    setNewSectionMobileDisplayMode('carousel');
    setNewSectionCategoryIds([]);
    setNewSectionListingSourceMode('auto');
    setNewSectionPinnedBusinessIds([]);
    setNewSectionAutoRotate(true);
    setNewSectionRotationIntervalSec('3');
    triggerNotification('Homepage section added.');
  };

  const handleSaveApiConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiConfiguration?.(apiConfigDraft);
    triggerNotification('API configuration saved.');
  };

  const toggleSectionCategoryId = (categoryId: string) => {
    setNewSectionCategoryIds((prev) => (
      prev.includes(categoryId)
        ? prev.filter((item) => item !== categoryId)
        : [...prev, categoryId]
    ));
  };

  const handleCreateCommunityItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityDraft.title?.trim() || !communityDraft.content?.trim() || !adminLocalityFilter || adminLocalityFilter === 'all') {
      triggerNotification('Choose a locality and add title/content for the update.');
      return;
    }
    onAddCommunityItem?.({
      type: communityDraft.type || 'post',
      title: communityDraft.title.trim(),
      content: communityDraft.content.trim(),
      authorName: communityDraft.authorName?.trim() || 'Localisy Team',
      localityId: adminLocalityFilter
    });
    setCommunityDraft({
      type: 'post',
      title: '',
      content: '',
      authorName: 'Localisy Team'
    });
    triggerNotification('Locality update created.');
  };

  const updateHomepageSection = (section: HomepageSection, patch: Partial<HomepageSection>) => {
    onUpdateHomepageSection?.(homepageLocalityId, {
      ...section,
      ...patch
    });
  };

  const handleCreateLocalityCategoryLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const localitySlug = localities.find((locality) => locality.id === linkLocalityId)?.slug || linkLocalityId;
    const filterSlug = linkSubcategoryId || linkCategoryId;
    const slug = `locality/${localitySlug}/${filterSlug}`;
    onCreateLocalityCategoryLink?.({
      localityId: linkLocalityId,
      categoryId: linkCategoryId,
      subcategoryId: linkSubcategoryId || undefined,
      slug
    });
    triggerNotification('Locality + category URL mapping created.');
  };

  return (
    <div id="admin-console-root" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Moderation Module */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Admin Workspace</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch between moderation, listing status, imports, and audit activity without stacking everything in one long view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {adminWorkspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAdminWorkspaceTab(tab.id);
                    if (tab.id === 'listing-status') setListingStatusPage(1);
                    if (tab.id === 'data-audit') setAuditPage(1);
                    if (tab.id === 'bulk-upload') setImportPreviewPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    adminWorkspaceTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      adminWorkspaceTab === tab.id ? 'bg-white/15 text-white' : 'bg-white text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {adminWorkspaceTab === 'moderation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Intake Moderation Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted business requests from Hyper Local proprietors. Real-time verification simulator.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
              {pendingBusinesses.length} Pending Approval
            </span>
          </div>

          {pendingBusinesses.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-700">All applications processed!</p>
              <p className="text-xs text-slate-400 mt-1">No new Hyper Local businesses waiting in the moderation queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBusinesses.map((biz) => {
                const locality = localities.find(l => l.id === biz.localityId);
                const isRejecting = rejectionActive[biz.id];

                return (
                  <div key={biz.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row tracking-tight gap-4">
                    <img 
                      src={getBusinessImageUrl(biz)}
                      alt={biz.name}
                      onError={(e)=>{
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
                      }}
                      className={`w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 self-start md:self-center ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-2'}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{biz.name}</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {getCategoryById(biz.categoryId)?.name || biz.categoryId}
                          {biz.subcategoryId && ` / ${getSubcategoryById(biz.subcategoryId)?.name || biz.subcategoryId}`}
                        </span>
                        {onUpdateBusiness && (
                          <>
                            <select
                              value={biz.categoryId}
                              onChange={(e) => {
                                const nextCategory = e.target.value;
                                onUpdateBusiness({ ...biz, categoryId: nextCategory, subcategoryId: resolveDefaultSubcategoryId(nextCategory) });
                              }}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-semibold text-slate-700"
                              title="Change listing category"
                            >
                              {BUSINESS_CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={biz.subcategoryId}
                              onChange={(e) => onUpdateBusiness({ ...biz, subcategoryId: e.target.value })}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-semibold text-slate-700"
                              title="Change listing subcategory"
                            >
                              {getSubcategoriesForCategory(biz.categoryId).map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                        {locality && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-medium">
                            📌 Locality target: {locality.name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        {biz.description}
                      </p>

                      {/* Display geographical operational areas & coordinates */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {biz.areasOfOperation && biz.areasOfOperation.map(aid => {
                          const area = MASTER_AREAS.find(a => a.id === aid);
                          return (
                            <span key={aid} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              🏠 Area: {area ? area.name : aid}
                            </span>
                          );
                        })}
                        {biz.gpsCoordinates && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100 font-mono">
                            📡 GPS: {biz.gpsCoordinates.lat}, {biz.gpsCoordinates.lng}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono text-slate-500 pt-2 bg-slate-100/40 p-2.5 rounded-lg border border-slate-200/50">
                        <div className="truncate">📞 {biz.phone || 'Not provided'}</div>
                        <div className="truncate">
                          ✉️ {biz.email ? biz.email : <span className="text-slate-400 italic">No Email Specified</span>}
                        </div>
                        <div className="truncate text-blue-600 font-sans hover:underline">
                          🔗 <a href={biz.website} hrefLang="en" target="_blank" rel="noreferrer">{biz.website}</a>
                        </div>
                        <div className="col-span-full font-sans text-slate-600 mt-1">
                          📍 Address: {biz.address}
                        </div>
                        
                        {/* Interactive edit trigger context */}
                        <div className="col-span-full mt-2.5 flex items-center gap-2">
                          <span className="font-sans text-[11px] text-slate-400">Hours Adjustment:</span>
                          <input
                            type="text"
                            value={editedHrs[biz.id] !== undefined ? editedHrs[biz.id] : biz.hours || '10:00 AM - 08:30 PM'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedHrs(prev => ({ ...prev, [biz.id]: val }));
                              if (onUpdateBusiness) {
                                onUpdateBusiness({ ...biz, hours: val });
                              }
                            }}
                            className="bg-white border border-slate-300 rounded text-[11px] px-2 py-0.5 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                          />
                        </div>

                        {biz.ownerName && (
                          <div className="col-span-full font-sans text-slate-700 italic mt-0.5">
                            👤 Applicant Proprietor: {biz.ownerName}
                          </div>
                        )}
                      </div>

                      {isRejecting && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                          <label className="block text-xs font-semibold text-slate-700">Specify Rejection Reason:</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={rejectionReasons[biz.id] || ''}
                              onChange={(e) => setRejectionReasons({ ...rejectionReasons, [biz.id]: e.target.value })}
                              placeholder="e.g. Missing license documentation, incorrect address or invalid category"
                              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-red-400"
                            />
                            <button
                              onClick={() => {
                                onReject(biz.id, rejectionReasons[biz.id] || 'Rejected after auditing review guidelines.');
                                setRejectionActive({ ...rejectionActive, [biz.id]: false });
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs px-3 py-1.5 rounded-lg font-bold"
                            >
                              Confirm Rejection
                            </button>
                            <button
                              onClick={() => setRejectionActive({ ...rejectionActive, [biz.id]: false })}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-xs px-3 py-1.5 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!isRejecting && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            onClick={() => onApprove(biz.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Entry
                          </button>
                          <button
                            onClick={() => setRejectionActive({ ...rejectionActive, [biz.id]: true })}
                            className="text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {adminWorkspaceTab === 'listing-status' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-blue-600" />
                Other Listings Status
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review listing states in one place. This tab now paginates 20 listings per page.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 self-start">
              {listingStatusItems.length} listings • 20 per page
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'approved', label: 'Active' },
              { id: 'rejected', label: 'Deactivated' },
              { id: 'pending', label: 'Pending' }
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setListingStatusFilter(filter.id as ListingStatusFilter);
                  setListingStatusPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  listingStatusFilter === filter.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                  <th className="py-2">Business</th>
                  <th className="py-2">Category / Subcategory</th>
                  <th className="py-2">Subdomain/Region</th>
                  <th className="py-2">Proprietor</th>
                  <th className="py-2">Decision Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listingStatusPageItems.map((business) => {
                  const locality = localities.find((candidate) => candidate.id === business.localityId);
                  const isRejected = business.status === 'rejected';
                  const isPending = business.status === 'pending';
                  return (
                    <tr
                      key={business.id}
                      onClick={() => openBackendListing(business)}
                      className="hover:bg-slate-50/50 cursor-pointer"
                    >
                      <td className={`py-2.5 font-semibold ${isRejected ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {business.name}
                      </td>
                      <td className="py-2.5">
                        {onUpdateBusiness ? (
                          <div className="flex flex-col gap-1">
                            <select
                              value={business.categoryId}
                              required
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const nextCategory = e.target.value;
                                onUpdateBusiness({ ...business, categoryId: nextCategory, subcategoryId: resolveDefaultSubcategoryId(nextCategory) });
                              }}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700"
                              title="Update listing category"
                            >
                              {BUSINESS_CATEGORIES.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                            <select
                              value={business.subcategoryId}
                              required
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => onUpdateBusiness({ ...business, subcategoryId: e.target.value })}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700"
                              title="Update listing subcategory"
                            >
                              {getSubcategoriesForCategory(business.categoryId).map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span>{getCategoryById(business.categoryId)?.name || business.categoryId} / {getSubcategoryById(business.subcategoryId)?.name || business.subcategoryId}</span>
                        )}
                      </td>
                      <td className={`py-2.5 font-mono ${isRejected ? 'text-slate-400' : 'text-slate-600'}`}>
                        {locality?.subdomain || 'Unknown'}
                      </td>
                      <td className="py-2.5">{business.ownerName || 'Self-Registered'}</td>
                      <td className="py-2.5">
                        {business.status === 'approved' && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Approved
                          </span>
                        )}
                        {business.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Pending
                          </span>
                        )}
                        {business.status === 'rejected' && (
                          <div className="text-red-500 font-semibold flex flex-col">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Rejected
                            </span>
                            <span className="text-[10px] font-sans text-slate-400 max-w-[180px] truncate" title={business.rejectionReason}>
                              {business.rejectionReason || 'No reason recorded'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {listingStatusPageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No listings found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setListingStatusPage((prev) => Math.max(1, prev - 1))}
              disabled={safeListingStatusPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-mono text-slate-500">
              Page {safeListingStatusPage} / {listingStatusTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setListingStatusPage((prev) => Math.min(listingStatusTotalPages, prev + 1))}
              disabled={safeListingStatusPage >= listingStatusTotalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        )}

        {adminWorkspaceTab === 'data-audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                🇮🇳 Compliance &amp; Data Privacy Audit Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mandatory privacy logs tracking human &amp; AI conversational searches, OTP validated contact unlocks, and listing mutations.
              </p>
            </div>
            <div className="bg-slate-100 text-[10px] font-mono px-3 py-1 rounded-lg text-slate-600 border border-slate-200 uppercase tracking-tight self-start md:self-auto">
              SLA Compliant • GDPR Safeguarded
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No security compliance logs registered in current shard session.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-500 border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-550">
                    <th className="p-3">Logged Date/Time</th>
                    <th className="p-3">Actor &amp; Scope</th>
                    <th className="p-3">Audited Action description</th>
                    <th className="p-3">Trace IP Address</th>
                    <th className="p-3">Device Signature Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedAuditLogs.map((log) => {
                    const badgeColor = 
                      log.actionType === 'search' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200/50' 
                        : log.actionType === 'contact_view'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/50';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/35 transition text-[11px] whitespace-nowrap md:whitespace-normal">
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{log.userName}</span>
                          <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border mt-0.5 uppercase tracking-wide font-mono ${badgeColor}`}>
                            {log.actionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 max-w-[280px]">
                          <span className="font-bold text-slate-700 block">{log.description}</span>
                          <span className="text-slate-500 text-[10px] leading-relaxed block overflow-hidden text-ellipsis">{log.details}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            {log.ipAddress}
                          </span>
                          <span className="block text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Zone B-West (IN)</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400 max-w-[150px] truncate" title={log.deviceCode}>
                          {log.deviceCode}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {auditLogs.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                disabled={safeAuditPage <= 1}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-mono text-slate-500">
                Page {safeAuditPage} / {auditTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))}
                disabled={safeAuditPage >= auditTotalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
        )}

        {adminWorkspaceTab === 'bulk-upload' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-md font-bold text-slate-950">Bulk Import Businesses (CSV)</h3>
          <p className="text-xs text-slate-500">
            Upload CSV with columns: Business Name, Address, Area, City, State, PIN, Mobile, Rating, Reviews, Services, Category, Subcategory, Latitude, Longitude.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsvImport(f);
            }}
            className="w-full text-xs border border-slate-200 rounded-lg p-2"
          />
          {importResult && (
            <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-3 py-2">
              {importResult}
            </div>
          )}
          {importPreview.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg">
                    Ready: {importPreview.filter(r => r.previewStatus === 'ready').length}
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg">
                    Updates: {importPreview.filter(r => r.previewStatus === 'update').length}
                  </span>
                  <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-1 rounded-lg">
                    Failed: {importPreview.filter(r => r.previewStatus === 'fail').length}
                  </span>
                </div>
                <div className="flex gap-2">
                  {importPreview.some(r => r.previewStatus === 'fail') && (
                    <button
                      type="button"
                      onClick={downloadFailedImportCsv}
                      className="text-[10px] bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50"
                    >
                      Export Failed CSV
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyImportPreview}
                    disabled={!importPreview.some(r => r.previewStatus !== 'fail')}
                    className="text-[10px] bg-indigo-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700"
                  >
                    Upload Ready Items
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-72">
                <table className="w-full text-left text-[10px] text-slate-600">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="uppercase font-mono text-slate-400">
                      <th className="p-2">Row</th>
                      <th className="p-2">Business</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Pincode</th>
                      <th className="p-2">Locality</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Subcategory</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 min-w-[220px]">Error Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedImportPreview.map((row) => (
                      <tr key={`${row.rowNumber}-${row.businessName}`} className="hover:bg-slate-50/60">
                        <td className="p-2 font-mono">{row.rowNumber}</td>
                        <td className="p-2 font-semibold text-slate-800">{row.businessName}</td>
                        <td className="p-2 font-mono">{row.normalizedPhone || 'Not provided'}</td>
                        <td className="p-2 font-mono">{row.resolvedPincode || '-'}</td>
                        <td className="p-2">{localities.find(l => l.id === row.resolvedLocalityId)?.name.split(',')[0] || row.resolvedLocalityId}</td>
                        <td className="p-2 align-top">
                          <span className="block text-slate-800">{row.category?.trim() || 'Not supplied'}</span>
                          <span className={`block text-[9px] ${row.categorySuggestionNeeded ? 'text-amber-700 font-semibold' : 'text-slate-400'}`}>
                            {row.categorySuggestionNeeded ? `Suggested: ${row.suggestedCategoryName}` : `Mapped: ${getCategoryById(row.categoryId || '')?.name || row.categoryId}`}
                          </span>
                        </td>
                        <td className="p-2 align-top">
                          <span className="block text-slate-800">{row.subcategory?.trim() || 'Not supplied'}</span>
                          <span className={`block text-[9px] ${row.subcategorySuggestionNeeded ? 'text-amber-700 font-semibold' : 'text-slate-400'}`}>
                            {row.subcategorySuggestionNeeded ? `Suggested: ${row.suggestedSubcategoryName}` : `Mapped: ${getSubcategoryById(row.subcategoryId || '')?.name || row.subcategoryId}`}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            row.previewStatus === 'ready'
                              ? 'bg-emerald-50 text-emerald-700'
                              : row.previewStatus === 'update'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700'
                          }`}>
                            {row.previewStatus === 'ready' ? 'Ready' : row.previewStatus === 'update' ? 'Update existing' : 'Fail'}
                          </span>
                        </td>
                        <td className="p-2 align-top">
                          <div className="space-y-1">
                            {row.errors.length > 0 ? (
                              <div className="text-rose-600">{row.errors.join('; ')}</div>
                            ) : row.previewStatus === 'update' ? (
                              <div className="text-blue-700">Existing ID: {row.existingBusinessId}</div>
                            ) : (
                              <div className="text-slate-400">-</div>
                            )}
                            {(row.categorySuggestionNeeded || row.subcategorySuggestionNeeded) && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
                                <div className="text-[9px] font-semibold text-amber-800">
                                  Suggested mapping: {row.suggestedCategoryName || 'Unknown'} / {row.suggestedSubcategoryName || 'Unknown'}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Use suggested category "${row.suggestedCategoryName}" and subcategory "${row.suggestedSubcategoryName}" for ${row.businessName}?`)) {
                                      applyImportSuggestion(row.rowNumber);
                                    }
                                  }}
                                  className="mt-1 rounded bg-amber-500 px-2 py-1 text-[9px] font-bold text-white hover:bg-amber-600"
                                >
                                  OK, use suggestion
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setImportPreviewPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeImportPreviewPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="font-mono text-slate-500">
                  Page {safeImportPreviewPage} / {importPreviewTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setImportPreviewPage((prev) => Math.min(importPreviewTotalPages, prev + 1))}
                  disabled={safeImportPreviewPage >= importPreviewTotalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Domain Mapping Panel and Locality Spinner */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">Operations Workspace</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Switch manager groups so each operational form set stays focused instead of piling everything into one long sidebar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {operationsSectionTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOperationsSection(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    operationsSection === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 text-xs">
            <select
              value={adminLocalityFilter}
              onChange={(e) => setAdminLocalityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All localities</option>
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>
            <select
              value={adminCategoryFilter}
              onChange={(e) => setAdminCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All categories</option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={adminSubcategoryFilter}
              onChange={(e) => setAdminSubcategoryFilter(e.target.value)}
              disabled={adminCategoryFilter === 'all'}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 disabled:text-slate-400"
            >
              <option value="all">All subcategories</option>
              {adminCategoryFilter !== 'all' && getSubcategoriesForCategory(adminCategoryFilter).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
            <input
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              placeholder="Search name, phone, title..."
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            />
            <input
              value={adminPincodeFilter}
              onChange={(e) => setAdminPincodeFilter(e.target.value.replace(/\D/g, ''))}
              placeholder="Pincode"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono"
            />
            <select
              value={adminStatusFilter}
              onChange={(e) => setAdminStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Dynamic Mapping and DNS Status */}
        {showInternalTopology && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              Mapped Subdomains Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify NGINX virtual host headers mapping custom domains to physical PostgreSQL databases.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Active Gateways</span>
              <span className="text-emerald-400 text-[10px] bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 uppercase tracking-wide">
                Nginx Alive
              </span>
            </div>
            {subdomains.map(sub => {
              const loc = localities.find(l => l.id === sub.localityId);
              return (
                <div key={sub.domain} className="space-y-1 py-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      🌐 {sub.domain}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      sub.dnsStatus === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {sub.dnsStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 pl-5 flex items-center justify-between">
                    <span>Database: {loc ? `db_${loc.slug}_yellow` : 'db_unassigned'}</span>
                    <span className="text-indigo-400">SSL Enabled ✔️</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg space-y-1 border border-indigo-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 leading-normal">
              In a full production deploy, these routes dynamically intercept the host header variables inside the <strong>Express Router Request payload</strong> to query records strictly matching the subdomain.
            </p>
          </div>
        </div>}

        {/* Locality Spinner Form */}
        {operationsSection === 'geography' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950 mb-1 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Create Hyper Local Business Page
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Provision a page, subdomain route, and optional pincode group for a municipality or neighbourhood cluster.
          </p>

          {adminNotification && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 border border-emerald-100 text-xs transition-all animate-bounce">
              <Check className="w-4 h-4" /> {adminNotification}
            </div>
          )}

          <form onSubmit={handleLocalitySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / City Name</label>
              <input
                type="text"
                required
                value={newLocName}
                onChange={(e) => {
                  setNewLocName(e.target.value);
                  if (!newLocSubdomain) {
                    setNewLocSubdomain(`${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}.yellowpages.io`);
                  }
                }}
                placeholder="e.g. San Francisco"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subdomain Route mapping</label>
              <input
                type="text"
                required
                value={newLocSubdomain}
                onChange={(e) => setNewLocSubdomain(e.target.value)}
                placeholder="e.g. sf.yellowpages.io"
                className="w-full text-xs px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The subdomain opens this page; mapped pincodes below decide which visitors are routed here after pincode selection.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Regional Description</label>
              <textarea
                value={newLocDesc}
                onChange={(e) => setNewLocDesc(e.target.value)}
                rows={2}
                placeholder="Help local searchers understand what they will find here..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City Image (Unsplash URL - optional)</label>
              <input
                type="url"
                value={newLocImg}
                onChange={(e) => setNewLocImg(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mapped Pincodes</label>
              <input
                type="text"
                value={newLocPincodes}
                onChange={(e) => setNewLocPincodes(e.target.value)}
                placeholder="e.g. 410218, 410101"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Users entering any mapped pincode will open this Hyper Local page. Separate multiple pincodes with commas or spaces.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Provision Network Domain
            </button>
          </form>
        </div>}

        {/* Existing Localities Grid Panel */}
        {operationsSection === 'geography' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
            Localities Databases ({filteredLocalities.length})
          </h4>
          <div className="space-y-2.5">
            {filteredLocalities.map(loc => {
              const locCount = businesses.filter(b => b.localityId === loc.id && b.status === "approved").length;
              return (
                <div key={loc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="truncate pr-2">
                    <span className="block text-xs font-bold text-slate-800 truncate">{loc.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono truncate">{loc.subdomain}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
                      {locCount} approved
                    </span>
                    <button
                      onClick={() => onDeleteLocality(loc.id)}
                      disabled={localities.length <= 1}
                      title="Decommission locality database"
                      className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>}

        {/* Pincode Routing Master Config Panel */}
        {operationsSection === 'homepage' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Pincode Routing Engine
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure 1:1 or many:1 static bindings mapping postal codes to active Hyper Local pages and their subdomain routes.
            </p>
          </div>

          {/* Form to change current Default fallback locality */}
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/70 space-y-1.5">
            <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-tight">Default Fallback Page:</label>
            <select
              value={defaultLocalityId}
              onChange={(e) => onChangeDefaultLocalityId?.(e.target.value)}
              className="w-full bg-white border border-indigo-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer text-indigo-950 font-semibold"
            >
              {localities.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name.split(',')[0]} (Fallback Default)
                </option>
              ))}
            </select>
            <span className="text-[9px] text-indigo-600 block leading-tight">This page opens automatically on first visit when a user enters an unactivated pincode, clicks skip, or views general landing info.</span>
          </div>

          {/* List of current mappings */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Active Mappings ({filteredPincodeMappings.length})</span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredPincodeMappings.map(mapping => {
                const matchedLoc = localities.find(l => l.id === mapping.localityId);
                return (
                  <div key={mapping.pincode} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-150 rounded-xl font-mono">
                    <span className="font-bold text-slate-800">📪 {mapping.pincode}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[11px] text-slate-600 font-semibold">{matchedLoc?.name.split(',')[0] || mapping.localityId}</span>
                      <button
                        onClick={() => onDeletePincodeMapping?.(mapping.pincode)}
                        className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete this binding mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredPincodeMappings.length === 0 && (
                <div className="text-center py-4 text-slate-405 text-xs italic">No postal codes mapped yet.</div>
              )}
            </div>
          </div>

          {/* Form to add a new pairing */}
          <div className="border-t border-slate-200/80 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Custom Entry</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 410210"
                  id="admin-new-pincode"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Open Page</label>
                <select
                  id="admin-new-locality"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-slate-700 cursor-pointer text-ellipsis whitespace-nowrap overflow-hidden"
                >
                  {localities.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name.split(',')[0]}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const pinInput = document.getElementById('admin-new-pincode') as HTMLInputElement;
                const locSelect = document.getElementById('admin-new-locality') as HTMLSelectElement;
                if (!pinInput || !locSelect) return;
                const pin = pinInput.value.replace(/\D/g, '').trim();
                const locId = locSelect.value;
                if (pin.length !== 6) {
                  alert("Please supply a valid 6-digit Indian Pincode code.");
                  return;
                }
                const existing = pincodeMappings.find(m => m.pincode === pin);
                if (existing) {
                  alert(`Pincode ${pin} is already assigned to a directory node. Clear the existing route first!`);
                  return;
                }
                onAddPincodeMapping?.(pin, locId);
                pinInput.value = '';
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-indigo-500/25 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Set Area Binding
            </button>
          </div>
        </div>}

        {operationsSection === 'platform' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-950">Uploaded Listings</h3>
            <span className="text-[10px] font-mono text-slate-500">20 per page</span>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'active', label: 'Active' },
              { id: 'deactivated', label: 'Deactivated' },
              { id: 'pending', label: 'Pending' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setUploadedTab(tab.id as 'active' | 'deactivated' | 'pending');
                  setUploadedPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  uploadedTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {uploadedPageItems.length === 0 ? (
              <div className="text-xs text-slate-400">No listings in this tab.</div>
            ) : (
              uploadedPageItems.map((listing) => (
                <div key={listing.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800 truncate">{listing.name}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        PIN {listing.pincode || MASTER_AREAS.find((area) => area.id === listing.areaId)?.pincode || 'NA'}
                      </span>
                    </div>
                    {onUpdateBusiness && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = listing.status === 'approved' ? 'rejected' : 'approved';
                          onUpdateBusiness({
                            ...listing,
                            status: nextStatus,
                            rejectionReason: nextStatus === 'rejected' ? (listing.rejectionReason || 'Deactivated from uploaded listings tab.') : undefined
                          });
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                          listing.status === 'approved'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {listing.status === 'approved' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setUploadedPage((prev) => Math.max(1, prev - 1))}
              disabled={safeUploadedPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-mono text-slate-500">
              Page {safeUploadedPage} / {uploadedTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setUploadedPage((prev) => Math.min(uploadedTotalPages, prev + 1))}
              disabled={safeUploadedPage >= uploadedTotalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>}

        {operationsSection === 'geography' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">Homepage Layout Manager</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Arrange repeatable sections for each locality page. Sections can be scheduled, hidden, duplicated, and targeted by pincode.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
              {filteredHomepageSections.length} sections
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <select
              value={homepageLocalityId}
              onChange={(e) => setHomepageLocalityId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>

            <form onSubmit={handleCreateHomepageSectionSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSectionType}
                  onChange={(e) => {
                    const nextType = e.target.value as HomepageSectionType;
                    setNewSectionType(nextType);
                    setNewSectionTitle(homepageSectionLabels[nextType]);
                    setNewSectionMobileDisplayMode(nextType === 'verified_business_grid' ? 'stack' : 'carousel');
                    setNewSectionDesktopCardCount(nextType === 'featured_businesses' ? '3' : nextType === 'verified_business_grid' ? '5' : '4');
                    setNewSectionMobileCardCount('2');
                  }}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  {homepageSectionOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <input
                  value={newSectionMaxItems}
                  onChange={(e) => setNewSectionMaxItems(e.target.value.replace(/\D/g, ''))}
                  placeholder="Max items"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newSectionVisibleSlots}
                  onChange={(e) => setNewSectionVisibleSlots(e.target.value.replace(/\D/g, ''))}
                  placeholder="Visible slots"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
                <input
                  value={newSectionRotationIntervalSec}
                  onChange={(e) => setNewSectionRotationIntervalSec(e.target.value.replace(/\D/g, ''))}
                  placeholder="Rotate seconds"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) && (
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={newSectionDesktopCardCount}
                    onChange={(e) => setNewSectionDesktopCardCount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Desktop cards"
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  />
                  <input
                    value={newSectionMobileCardCount}
                    onChange={(e) => setNewSectionMobileCardCount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Mobile cards"
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  />
                  <select
                    value={newSectionMobileDisplayMode}
                    onChange={(e) => setNewSectionMobileDisplayMode(e.target.value as NonNullable<HomepageSection['mobileDisplayMode']>)}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="carousel">Mobile Carousel</option>
                    <option value="stack">Mobile Stack</option>
                  </select>
                </div>
              )}
              <input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Section title"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
              <textarea
                value={newSectionSubtitle}
                onChange={(e) => setNewSectionSubtitle(e.target.value)}
                placeholder="Section subtitle"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
              {['business_shelf', 'text_business_strip'].includes(newSectionType) && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newSectionCategoryId}
                    onChange={(e) => setNewSectionCategoryId(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select
                    value={newSectionSubcategoryId}
                    onChange={(e) => setNewSectionSubcategoryId(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">All subcategories</option>
                    {getSubcategoriesForCategory(newSectionCategoryId).map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {['category_grid', 'emergency_grid'].includes(newSectionType) && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-2 text-[11px] font-semibold text-slate-700">Category selection and order</div>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_CATEGORIES.map((category) => (
                      <label key={category.id} className="inline-flex items-center gap-2 text-[11px] text-slate-700">
                        <input
                          type="checkbox"
                          checked={newSectionCategoryIds.includes(category.id)}
                          onChange={() => toggleSectionCategoryId(category.id)}
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newSectionListingSourceMode || 'auto'}
                    onChange={(e) => setNewSectionListingSourceMode(e.target.value as HomepageSection['listingSourceMode'])}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="auto">Auto listings</option>
                    <option value="manual">Manual pinned listings</option>
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={newSectionAutoRotate}
                      onChange={(e) => setNewSectionAutoRotate(e.target.checked)}
                    />
                    <span>Auto rotate overflow</span>
                  </label>
                </div>
              )}
              {newSectionListingSourceMode === 'manual' && ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) && (
                <select
                  multiple
                  value={newSectionPinnedBusinessIds}
                  onChange={(e) => setNewSectionPinnedBusinessIds(Array.from(e.currentTarget.selectedOptions, (option: HTMLOptionElement) => option.value))}
                  className="h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                    <option key={business.id} value={business.id}>{business.name}</option>
                  ))}
                </select>
              )}
              {newSectionType === 'promo_banner' && (
                <input
                  value={newSectionPlacementKey}
                  onChange={(e) => setNewSectionPlacementKey(e.target.value)}
                  placeholder="Placement key"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newSectionStartDate}
                  onChange={(e) => setNewSectionStartDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
                <input
                  type="date"
                  value={newSectionEndDate}
                  onChange={(e) => setNewSectionEndDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSectionCtaType || 'none'}
                  onChange={(e) => setNewSectionCtaType(e.target.value as HomepageSection['ctaType'])}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="none">No CTA</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="landing_listing">Landing Listing</option>
                  <option value="lead_form">Lead Form</option>
                  <option value="search_category">Search Category</option>
                </select>
                <input
                  value={newSectionCtaLabel}
                  onChange={(e) => setNewSectionCtaLabel(e.target.value)}
                  placeholder="CTA label"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <input
                value={newSectionCtaTarget}
                onChange={(e) => setNewSectionCtaTarget(e.target.value)}
                placeholder="CTA target"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
              <input
                value={newSectionPincodes}
                onChange={(e) => setNewSectionPincodes(e.target.value)}
                placeholder="Target pincodes"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={newSectionShowViewAll}
                    onChange={(e) => setNewSectionShowViewAll(e.target.checked)}
                  />
                  <span>Show View All</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Background</span>
                  <input
                    type="color"
                    value={newSectionBackgroundColor}
                    onChange={(e) => setNewSectionBackgroundColor(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-200 bg-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
                Add Homepage Section
              </button>
            </form>

            <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1">
              {filteredHomepageSections.map((section, index) => (
                <div key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-500">#{index + 1}</span>
                      <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {homepageSectionLabels[section.sectionType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => onMoveHomepageSection?.(homepageLocalityId, section.id, 'up')} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><ChevronUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => onMoveHomepageSection?.(homepageLocalityId, section.id, 'down')} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><ChevronDown className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => onDuplicateHomepageSection?.(homepageLocalityId, section.id)} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><Copy className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => onDeleteHomepageSection?.(homepageLocalityId, section.id)} className="rounded border border-rose-200 bg-rose-50 p-1.5 text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <input
                    value={section.title}
                    onChange={(e) => updateHomepageSection(section, { title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                  />
                  <textarea
                    value={section.subtitle || ''}
                    onChange={(e) => updateHomepageSection(section, { subtitle: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={section.status}
                      onChange={(e) => updateHomepageSection(section, { status: e.target.value as HomepageSection['status'] })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <select
                      value={section.visible ? 'visible' : 'hidden'}
                      onChange={(e) => updateHomepageSection(section, { visible: e.target.value === 'visible' })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <option value="visible">Visible</option>
                      <option value="hidden">Hidden</option>
                    </select>
                    <input
                      type="date"
                      value={section.startDate || ''}
                      onChange={(e) => updateHomepageSection(section, { startDate: e.target.value || undefined })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      type="date"
                      value={section.endDate || ''}
                      onChange={(e) => updateHomepageSection(section, { endDate: e.target.value || undefined })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      value={String(section.maxItems || '')}
                      onChange={(e) => updateHomepageSection(section, { maxItems: Number(e.target.value.replace(/\D/g, '')) || undefined })}
                      placeholder="Max items"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      value={String(section.visibleSlots || '')}
                      onChange={(e) => updateHomepageSection(section, { visibleSlots: Number(e.target.value.replace(/\D/g, '')) || undefined })}
                      placeholder="Visible slots"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      value={String(section.desktopCardCount || '')}
                      onChange={(e) => updateHomepageSection(section, { desktopCardCount: Number(e.target.value.replace(/\D/g, '')) || undefined })}
                      placeholder="Desktop cards"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      value={String(section.mobileCardCount || '')}
                      onChange={(e) => updateHomepageSection(section, { mobileCardCount: Number(e.target.value.replace(/\D/g, '')) || undefined })}
                      placeholder="Mobile cards"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      value={section.pincodes?.join(', ') || ''}
                      onChange={(e) => updateHomepageSection(section, { pincodes: parsePincodeList(e.target.value) })}
                      placeholder="Pincodes"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                    />
                    <input
                      value={String(section.rotationIntervalSec || 3)}
                      onChange={(e) => updateHomepageSection(section, { rotationIntervalSec: Number(e.target.value.replace(/\D/g, '')) || 3 })}
                      placeholder="Rotate seconds"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  </div>
                  {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(section.sectionType) && (
                    <select
                      value={section.mobileDisplayMode || 'carousel'}
                      onChange={(e) => updateHomepageSection(section, { mobileDisplayMode: e.target.value as NonNullable<HomepageSection['mobileDisplayMode']> })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <option value="carousel">Mobile Carousel</option>
                      <option value="stack">Mobile Stack</option>
                    </select>
                  )}
                  {['business_shelf', 'text_business_strip'].includes(section.sectionType) && (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={section.categoryId || ''}
                        onChange={(e) => updateHomepageSection(section, { categoryId: e.target.value, subcategoryId: '' })}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        {BUSINESS_CATEGORIES.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                      <select
                        value={section.subcategoryId || ''}
                        onChange={(e) => updateHomepageSection(section, { subcategoryId: e.target.value || undefined })}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <option value="">All subcategories</option>
                        {getSubcategoriesForCategory(section.categoryId || BUSINESS_CATEGORIES[0]?.id || '').map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {['category_grid', 'emergency_grid'].includes(section.sectionType) && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 text-[11px] font-semibold text-slate-700">Configured categories</div>
                      <div className="grid grid-cols-2 gap-2">
                        {BUSINESS_CATEGORIES.map((category) => (
                          <label key={category.id} className="inline-flex items-center gap-2 text-[11px] text-slate-700">
                            <input
                              type="checkbox"
                              checked={(section.categoryIds || []).includes(category.id)}
                              onChange={() => {
                                const nextCategoryIds = (section.categoryIds || []).includes(category.id)
                                  ? (section.categoryIds || []).filter((item) => item !== category.id)
                                  : [...(section.categoryIds || []), category.id];
                                updateHomepageSection(section, { categoryIds: nextCategoryIds });
                              }}
                            />
                            <span>{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {section.sectionType === 'promo_banner' && (
                    <input
                      value={section.placementKey || ''}
                      onChange={(e) => updateHomepageSection(section, { placementKey: e.target.value })}
                      placeholder="Placement key"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(section.sectionType) && (
                      <select
                        value={section.listingSourceMode || 'auto'}
                        onChange={(e) => updateHomepageSection(section, { listingSourceMode: e.target.value as HomepageSection['listingSourceMode'] })}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <option value="auto">Auto listings</option>
                        <option value="manual">Manual pinned listings</option>
                      </select>
                    )}
                    <select
                      value={section.ctaType || 'none'}
                      onChange={(e) => updateHomepageSection(section, { ctaType: e.target.value as HomepageSection['ctaType'] })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <option value="none">No CTA</option>
                      <option value="landing_page">Landing Page</option>
                      <option value="landing_listing">Landing Listing</option>
                      <option value="lead_form">Lead Form</option>
                      <option value="search_category">Search Category</option>
                    </select>
                    <input
                      value={section.ctaLabel || ''}
                      onChange={(e) => updateHomepageSection(section, { ctaLabel: e.target.value })}
                      placeholder="CTA label"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      value={section.ctaTarget || ''}
                      onChange={(e) => updateHomepageSection(section, { ctaTarget: e.target.value })}
                      placeholder="CTA target"
                      className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  </div>
                  {section.listingSourceMode === 'manual' && ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(section.sectionType) && (
                    <select
                      multiple
                      value={section.pinnedBusinessIds || []}
                      onChange={(e) => updateHomepageSection(section, { pinnedBusinessIds: Array.from(e.currentTarget.selectedOptions, (option: HTMLOptionElement) => option.value) })}
                      className="h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                        <option key={business.id} value={business.id}>{business.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={section.showViewAll ?? true}
                        onChange={(e) => updateHomepageSection(section, { showViewAll: e.target.checked })}
                      />
                      <span>Show View All</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={section.autoRotate ?? true}
                        onChange={(e) => updateHomepageSection(section, { autoRotate: e.target.checked })}
                      />
                      <span>Auto rotate</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Background</span>
                      <input
                        type="color"
                        value={section.backgroundColor || '#ffffff'}
                        onChange={(e) => updateHomepageSection(section, { backgroundColor: e.target.value })}
                        className="h-8 w-12 rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {filteredHomepageSections.length === 0 && (
                <div className="text-xs text-slate-400">No homepage sections configured yet for this locality.</div>
              )}
            </div>
          </div>
        </div>}

        {operationsSection === 'listings' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">API Configuration</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Control where homepage builder content syncs and whether browser edits autosave through the local API layer.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
              {apiConfigDraft.syncMode.toUpperCase()}
            </span>
          </div>

          <form onSubmit={handleSaveApiConfiguration} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Sync mode</span>
                <select
                  value={apiConfigDraft.syncMode}
                  onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, syncMode: e.target.value as ApiConfiguration['syncMode'] }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <option value="api">API + Local Fallback</option>
                  <option value="local">Local Only</option>
                </select>
              </label>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="font-semibold text-slate-700">Last sync</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {apiConfigDraft.lastHomepageSyncAt ? new Date(apiConfigDraft.lastHomepageSyncAt).toLocaleString() : 'Not synced yet'}
                </div>
              </div>
            </div>

            <label className="block space-y-1">
              <span className="font-semibold text-slate-700">Homepage config endpoint</span>
              <input
                value={apiConfigDraft.homepageConfigEndpoint}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, homepageConfigEndpoint: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Businesses endpoint</span>
                <input
                  value={apiConfigDraft.businessesEndpoint}
                  onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, businessesEndpoint: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Audit endpoint</span>
                <input
                  value={apiConfigDraft.auditEventsEndpoint}
                  onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, auditEventsEndpoint: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={apiConfigDraft.autoSyncHomepage}
                  onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, autoSyncHomepage: e.target.checked }))}
                />
                <span>Auto-sync homepage config</span>
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={apiConfigDraft.autoSyncBusinesses}
                  onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, autoSyncBusinesses: e.target.checked }))}
                />
                <span>Auto-sync businesses</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700">
                Save API Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateApiConfiguration?.(apiConfigDraft);
                  onSyncHomepageConfig?.();
                  triggerNotification('Homepage sync started.');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Now</span>
              </button>
            </div>
          </form>
        </div>}

        {operationsSection === 'campaigns' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Offers & Deals Manager</h3>
          <form onSubmit={handleCreateCouponSubmit} className="space-y-3 text-xs">
            <select
              value={couponBusinessId}
              onChange={(e) => setCouponBusinessId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">Select business</option>
              {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
            <input
              value={couponTitle}
              onChange={(e) => setCouponTitle(e.target.value)}
              placeholder="Offer title"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(e.target.value)}
                placeholder="Discount label"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <textarea
              value={couponDescription}
              onChange={(e) => setCouponDescription(e.target.value)}
              placeholder="Offer description"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={couponLocalityId}
                onChange={(e) => setCouponLocalityId(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                {localities.map((locality) => (
                  <option key={locality.id} value={locality.id}>{locality.name}</option>
                ))}
              </select>
              <input
                value={couponPincodes}
                onChange={(e) => setCouponPincodes(e.target.value)}
                placeholder="Pincodes"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={couponStartDate}
                onChange={(e) => setCouponStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                type="date"
                value={couponEndDate}
                onChange={(e) => setCouponEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
              Create Offer
            </button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredCoupons.map((coupon) => (
              <div key={coupon.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                <span className="block font-semibold text-slate-800 truncate">{coupon.title || coupon.code}</span>
                <span className="block text-[10px] text-slate-500">
                  {businesses.find((business) => business.id === coupon.businessId)?.name || coupon.businessId}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">
                  {(coupon.startDate || coupon.expiryDate)} {'->'} {(coupon.endDate || coupon.expiryDate)}
                </span>
              </div>
            ))}
            {coupons.length === 0 && <div className="text-xs text-slate-400">No offers created yet.</div>}
          </div>
        </div>}

        {operationsSection === 'content' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">Updates Feed Manager</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Create and manage locality-specific updates for the homepage updates feed. Choose a locality in the shared filter bar first.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
              {filteredCommunityItems.length} items
            </span>
          </div>
          <form onSubmit={handleCreateCommunityItemSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={communityDraft.type || 'post'}
                onChange={(e) => setCommunityDraft((prev) => ({ ...prev, type: e.target.value as CommunityItem['type'] }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="post">Post</option>
                <option value="event">Event</option>
                <option value="deal">Deal</option>
                <option value="recommendation">Recommendation</option>
                <option value="qa">Q&A</option>
              </select>
              <input
                value={communityDraft.authorName || ''}
                onChange={(e) => setCommunityDraft((prev) => ({ ...prev, authorName: e.target.value }))}
                placeholder="Author"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </div>
            <input
              value={communityDraft.title || ''}
              onChange={(e) => setCommunityDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Update title"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <textarea
              value={communityDraft.content || ''}
              onChange={(e) => setCommunityDraft((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Update content"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700">
              Create Locality Update
            </button>
          </form>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredCommunityItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{item.title}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {localities.find((locality) => locality.id === item.localityId)?.name || item.localityId} • {item.type}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 line-clamp-2">{item.content}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCommunityItem?.(item.id)}
                    className="rounded bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredCommunityItems.length === 0 && (
              <div className="text-xs text-slate-400">No locality updates found for the current filters.</div>
            )}
          </div>
        </div>}

        {operationsSection === 'campaigns' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Ad Banner Manager</h3>
          <form onSubmit={handleCreateListingAdSubmit} className="space-y-3 text-xs">
            <input
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
              placeholder="Ad title"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <textarea
              value={adDescription}
              onChange={(e) => setAdDescription(e.target.value)}
              placeholder="Ad description"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={adBadge}
                onChange={(e) => setAdBadge(e.target.value)}
                placeholder="Badge"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                value={adCtaText}
                onChange={(e) => setAdCtaText(e.target.value)}
                placeholder="CTA text"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={adStartDate}
                onChange={(e) => setAdStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                type="date"
                value={adEndDate}
                onChange={(e) => setAdEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={adActionType}
                onChange={(e) => setAdActionType(e.target.value as ListingAd['actionType'])}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="landing_page">Landing Page</option>
                <option value="landing_listing">Landing Listing</option>
                <option value="lead_form">Lead Generation Form</option>
              </select>
              <input
                type="color"
                value={adBgColor}
                onChange={(e) => setAdBgColor(e.target.value)}
                className="border border-slate-200 rounded-lg h-9 w-full bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={adLocalityId}
                onChange={(e) => setAdLocalityId(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                {localities.map((locality) => (
                  <option key={locality.id} value={locality.id}>{locality.name}</option>
                ))}
              </select>
              <input
                value={adPlacementKey}
                onChange={(e) => setAdPlacementKey(e.target.value)}
                placeholder="Placement key"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                value={adImageUrl}
                onChange={(e) => setAdImageUrl(e.target.value)}
                placeholder="Image URL (optional)"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 md:col-span-2"
              />
              <select
                value={adDeviceTarget}
                onChange={(e) => setAdDeviceTarget(e.target.value as NonNullable<ListingAd['deviceTarget']>)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="all">Desktop + Mobile</option>
                <option value="desktop">Desktop Only</option>
                <option value="mobile">Mobile Only</option>
              </select>
            </div>
            {adDeviceTarget !== 'desktop' && (
              <input
                value={adMobileRowPosition}
                onChange={(e) => setAdMobileRowPosition(e.target.value.replace(/\D/g, ''))}
                placeholder="Mobile row position (after section row)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            )}
            <input
              value={adPincodes}
              onChange={(e) => setAdPincodes(e.target.value)}
              placeholder="Target pincodes"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
            />
            {adActionType === 'landing_page' && (
              <input
                type="url"
                value={adTargetUrl}
                onChange={(e) => setAdTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            )}
            {adActionType === 'landing_listing' && (
              <select
                value={adTargetBusinessId}
                onChange={(e) => setAdTargetBusinessId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="">Select target listing</option>
                {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            )}
            <select
              value={adSellerBusinessId}
              onChange={(e) => setAdSellerBusinessId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">No seller mapping (platform only)</option>
              {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
              Create Ad Banner
            </button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredListingAds.map((ad) => (
              <div key={ad.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-semibold text-slate-800 truncate">{ad.title}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{ad.startDate} → {ad.endDate}</span>
                    <span className="block text-[10px] text-slate-500">
                      {(ad.localityIds || []).join(', ') || 'All localities'} • {ad.placementKey || 'homepage_inline_primary'}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {ad.deviceTarget || 'all'}{ad.mobileRowPosition ? ` • mobile row ${ad.mobileRowPosition}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateListingAd?.({ ...ad, isActive: !ad.isActive })}
                      className={`text-[10px] px-2 py-1 rounded ${ad.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {ad.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteListingAd?.(ad.id)}
                      className="text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <select
                    value={ad.deviceTarget || 'all'}
                    onChange={(e) => {
                      const nextTarget = e.target.value as NonNullable<ListingAd['deviceTarget']>;
                      onUpdateListingAd?.({
                        ...ad,
                        deviceTarget: nextTarget,
                        mobileRowPosition: nextTarget === 'desktop' ? undefined : (ad.mobileRowPosition || 3)
                      });
                    }}
                    className="border border-slate-200 rounded px-2 py-1.5 bg-white text-[11px]"
                  >
                    <option value="all">Desktop + Mobile</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                  {(ad.deviceTarget || 'all') !== 'desktop' && (
                    <input
                      value={String(ad.mobileRowPosition || '')}
                      onChange={(e) => onUpdateListingAd?.({ ...ad, mobileRowPosition: Number(e.target.value.replace(/\D/g, '')) || undefined })}
                      placeholder="Mobile row"
                      className="border border-slate-200 rounded px-2 py-1.5 bg-white text-[11px]"
                    />
                  )}
                </div>
              </div>
            ))}
            {listingAds.length === 0 && <div className="text-xs text-slate-400">No ads created yet.</div>}
          </div>
        </div>}

        {operationsSection === 'homepage' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Hero Banner Manager</h3>
          <form onSubmit={handleCreateHeroBannerSubmit} className="space-y-3 text-xs">
            <select
              value={heroLocalityId}
              onChange={(e) => setHeroLocalityId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>
            <input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Hero title"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Hero subtitle"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <input
              type="url"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="Hero image URL"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={heroStartDate}
                onChange={(e) => setHeroStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                type="date"
                value={heroEndDate}
                onChange={(e) => setHeroEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={heroCtaLabel}
                onChange={(e) => setHeroCtaLabel(e.target.value)}
                placeholder="CTA label"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <select
                value={heroCtaType}
                onChange={(e) => setHeroCtaType(e.target.value as NonNullable<HeroBanner['ctaType']>)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="landing_page">Landing Page</option>
                <option value="landing_listing">Landing Listing</option>
                <option value="lead_form">Lead Form</option>
                <option value="search_category">Search Category</option>
              </select>
            </div>
            <input
              value={heroCtaTarget}
              onChange={(e) => setHeroCtaTarget(e.target.value)}
              placeholder="CTA target"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <input
              value={heroPincodes}
              onChange={(e) => setHeroPincodes(e.target.value)}
              placeholder="Target pincodes"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
              Create Hero Banner
            </button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredHeroBanners.map((hero) => (
              <div key={hero.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-semibold text-slate-800 truncate">{hero.title}</span>
                    <span className="block text-[10px] text-slate-500">{localities.find((locality) => locality.id === hero.localityId)?.name || hero.localityId}</span>
                    <span className="block text-[10px] text-slate-500">
                      {hero.ctaLabel || 'No CTA'} • {(hero.pincodes || []).join(', ') || 'All pincodes'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateHeroBanner?.({ ...hero, isActive: !hero.isActive })}
                      className={`text-[10px] px-2 py-1 rounded ${hero.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {hero.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHeroBanner?.(hero.id)}
                      className="text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {heroBanners.length === 0 && <div className="text-xs text-slate-400">No hero banners configured.</div>}
          </div>
        </div>}

        {operationsSection === 'campaigns' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-base font-extrabold text-slate-950">Ad Lead Inbox</h3>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {adLeads.length === 0 ? (
              <div className="text-xs text-slate-400">No ad leads submitted yet.</div>
            ) : (
              filteredAdLeads.slice(0, 50).map((lead) => (
                <div key={lead.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{lead.name}</span>
                    <span className="font-mono text-slate-500">{lead.pincode}</span>
                  </div>
                  <div className="text-slate-600 font-mono">{lead.mobile}</div>
                  <div className="text-[10px] text-slate-400">
                    Seller: {lead.sellerBusinessId || 'Platform'} • {new Date(lead.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>}

        {operationsSection === 'geography' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Locality + Category URL Mapper</h3>
          <form onSubmit={handleCreateLocalityCategoryLinkSubmit} className="space-y-3 text-xs">
            <select
              value={linkLocalityId}
              onChange={(e) => setLinkLocalityId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>
            <select
              value={linkCategoryId}
              onChange={(e) => setLinkCategoryId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={linkSubcategoryId}
              onChange={(e) => setLinkSubcategoryId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">All subcategories under selected category</option>
              {getSubcategoriesForCategory(linkCategoryId).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
              Create Locality + Category URL
            </button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredLocalityCategoryLinks.map((link) => {
              const fullUrl = `${window.location.origin}/${link.slug}`;
              return (
                <div key={link.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                  <a href={fullUrl} target="_blank" rel="noreferrer" className="text-indigo-700 font-mono break-all hover:underline">
                    {fullUrl}
                  </a>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {localities.find((locality) => locality.id === link.localityId)?.name || link.localityId} • {link.subcategoryId || link.categoryId}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteLocalityCategoryLink?.(link.id)}
                    className="mt-2 text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
            {filteredLocalityCategoryLinks.length === 0 && <div className="text-xs text-slate-400">No locality-category URLs created yet.</div>}
          </div>
        </div>}
      </div>
      {selectedBackendBiz && backendDraft && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Backend Listing</span>
                <h3 className="font-extrabold text-lg leading-tight">{backendDraft.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeBackendListing}
                className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Business Name</label>
                  <input
                    value={backendDraft.name}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Category</label>
                  <select
                    value={backendDraft.categoryId}
                    disabled={!backendEditMode}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      setBackendDraft({ ...backendDraft, categoryId: nextCategory, subcategoryId: resolveDefaultSubcategoryId(nextCategory) });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    {BUSINESS_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Subcategory</label>
                  <select
                    value={backendDraft.subcategoryId}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, subcategoryId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    {getSubcategoriesForCategory(backendDraft.categoryId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Phone</label>
                  <input
                    value={backendDraft.phone}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Website</label>
                  <input
                    value={backendDraft.website}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, website: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Locality</label>
                  <select
                    value={backendDraft.localityId}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, localityId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    {localities.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Primary Area / Pincode</label>
                  <select
                    value={backendDraft.areaId}
                    disabled={!backendEditMode}
                    onChange={(e) => {
                      const nextAreaId = e.target.value;
                      const nextPincode = MASTER_AREAS.find((area) => area.id === nextAreaId)?.pincode || backendDraft.pincode || '';
                      setBackendDraft({ ...backendDraft, areaId: nextAreaId, pincode: nextPincode });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    {MASTER_AREAS.map(area => (
                      <option key={area.id} value={area.id}>{area.name} ({area.pincode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Pincode</label>
                  <input
                    value={backendDraft.pincode || ''}
                    disabled={!backendEditMode}
                    maxLength={6}
                    onChange={(e) => setBackendDraft({ ...backendDraft, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Address</label>
                  <input
                    value={backendDraft.address}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={backendDraft.description}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 p-4 flex justify-end gap-2 bg-slate-50">
              {!backendEditMode ? (
                <button
                  type="button"
                  onClick={() => setBackendEditMode(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setBackendDraft({
                        ...selectedBackendBiz,
                        pincode: selectedBackendBiz.pincode || MASTER_AREAS.find((area) => area.id === selectedBackendBiz.areaId)?.pincode || '',
                        areasOfOperation: [...(selectedBackendBiz.areasOfOperation || [])]
                      });
                      setBackendEditMode(false);
                    }}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveBackendListing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
