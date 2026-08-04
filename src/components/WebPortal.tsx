import React, { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { 
  Search, MapPin, Phone, Mail, ExternalLink, Star, 
  BookOpen, Plus, Compass, ChevronRight, ChevronLeft, ChevronDown, Share2, Globe, Heart, 
  ShieldAlert, Lock, Unlock, MessageSquare, CheckCircle, Navigation, Award, User, Clock,
  Volume2, Camera, Brain, Megaphone, Users, BarChart3, Ticket, PlusCircle, Filter, 
  TrendingUp, Check, CheckSquare, Sparkles, Trash2, QrCode, Activity,
  Home, SlidersHorizontal, Utensils, Stethoscope, Zap, CakeSlice, Wrench,
  Grid3X3, Flame, Ambulance, Car, Dumbbell, ShoppingCart, GraduationCap,
  CalendarDays, Headphones, ShieldCheck, CalendarCheck, BriefcaseMedical, X,
  Hospital, Siren, CirclePlus, Bookmark, ChefHat, Store, HeartPulse
} from 'lucide-react';
import { 
  Locality, Business, Category, Review, UserSession, BuyerActivityEvent,
  CommunityItem, CRMContact, MarketingCoupon, ListingAd, AdLead, HeroBanner, HomepageLayout, HomepageSection, ApiConfiguration, ResolvedHomepagePayload, HomepageDefaultsConfigState
} from '../types';
import homepageDefaultsBootstrap from '../../homepage-defaults-config.json';
import { MASTER_STATES, MASTER_CITIES, MASTER_LOCALITIES, MASTER_AREAS } from '../geographyMaster';
import OtpVerificationModal from './OtpVerificationModal';
import GoogleLocationPicker from './GoogleLocationPicker';
import NoResultsState from './webportal/NoResultsState';
import ResultsMapView from './webportal/ResultsMapView';
import { getBusinessImageUrl, getCategoryFallbackImage, hasUploadedBusinessImage } from '../utils/businessImage';
import { getMediaProxyUrl } from '../utils/mediaUrl';
import { getAdCtr as getAdCtrService, getAdDeliveryScore as getAdDeliveryScoreService, rankAdsForDelivery as rankAdsForDeliveryService } from '../services/webportal/adDelivery';
import {
  dedupeBusinessesForExperience as dedupeBusinessesForExperienceService,
  filterSearchSuggestions,
  getBusinessAreaName as getBusinessAreaNameService,
  getBusinessCategoryLabel as getBusinessCategoryLabelService,
  getBusinessRecommendedScore as getBusinessRecommendedScoreService,
  getBusinessSubcategoryLabel as getBusinessSubcategoryLabelService,
  isCivicIntent as isCivicIntentService,
  isEssentialCommunityService as isEssentialCommunityServiceService,
  isHomeBasedBusiness as isHomeBasedBusinessService,
  isHomeBusinessIntent as isHomeBusinessIntentService,
  isWomenLedHomeBusiness as isWomenLedHomeBusinessService,
  matchesBusinessSearch as matchesBusinessSearchService,
  type SearchSuggestion,
} from '../services/webportal/businessDiscovery';
import { getBusinessGallery } from '../services/webportal/publicExperience';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
  getCategoryById,
  getSubcategoriesForCategory,
  getSubcategoryById,
  resolveDefaultSubcategoryId
} from '../categoryMaster';

type PortalIcon = React.ComponentType<{ className?: string }>;

const HOMEPAGE_DEFAULTS_BOOTSTRAP = homepageDefaultsBootstrap as Partial<HomepageDefaultsConfigState>;

type PaginationControlsProps = {
  compact?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function PaginationControls({
  compact = false,
  currentPage,
  totalPages,
  onPageChange
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50 ${
          compact ? 'text-[11px]' : 'text-xs'
        }`}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Previous</span>
      </button>
      <span className="font-mono text-slate-500">
        Page {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50 ${
          compact ? 'text-[11px]' : 'text-xs'
        }`}
      >
        <span>Next</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

type MobileAdCarouselProps = {
  ads: ListingAd[];
  onAdClick: (ad: ListingAd) => void;
};

function MobileAdCarousel({ ads, onAdClick }: MobileAdCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const adSignature = ads.map((ad) => ad.id).join('|');

  useEffect(() => {
    setActiveIndex(0);
    railRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [adSignature]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const slideWidth = 212;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % ads.length;
        railRef.current?.scrollTo({ left: next * slideWidth, behavior: 'smooth' });
        return next;
      });
    }, 3000);
    return () => window.clearInterval(interval);
  }, [adSignature, ads.length]);

  const handleScroll = () => {
    if (!railRef.current) return;
    const nextIndex = Math.round(railRef.current.scrollLeft / 212);
    const boundedIndex = Math.max(0, Math.min(ads.length - 1, nextIndex));
    if (boundedIndex !== activeIndex) {
      setActiveIndex(boundedIndex);
    }
  };

  return (
    <div className="space-y-3 xl:hidden">
      <div
        ref={railRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
      >
        {ads.map((ad, index) => {
          const isDark = index % 4 === 1 || ad.backgroundColor === '#064e3b';
          const adImage = getMediaProxyUrl(ad.imageUrl);
          return (
            <button
              key={`${ad.id}-mobile-${index}`}
              type="button"
              onClick={() => onAdClick(ad)}
              className={`relative min-h-[220px] w-[200px] min-w-[200px] snap-start overflow-hidden rounded-2xl text-left shadow-sm ${
                isDark ? 'text-white' : 'text-indigo-950'
              }`}
              style={{ backgroundColor: ad.backgroundColor || (isDark ? '#064e3b' : '#ede9fe') }}
            >
              {adImage ? (
                <img
                  src={adImage}
                  alt={ad.title}
                  className="h-full min-h-[220px] w-full rounded-2xl object-cover"
                />
              ) : (
              <div className="relative min-h-[220px] p-5">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-white/70' : 'text-indigo-500'}`}>
                {ad.badge || 'Advertisement'}
              </span>
              <h4 className="mt-4 max-w-[120px] text-xl font-extrabold leading-tight">{ad.title}</h4>
              <p className={`mt-2 max-w-[132px] text-xs font-medium leading-5 ${isDark ? 'text-white/85' : 'text-indigo-900/70'}`}>
                {ad.description}
              </p>
              <span className={`mt-4 inline-flex rounded-xl px-4 py-2 text-xs font-bold ${
                isDark ? 'bg-white text-emerald-950' : 'bg-indigo-600 text-white'
              }`}>
                {ad.ctaText}
              </span>
              <Megaphone className={`absolute bottom-4 right-4 h-16 w-16 rotate-[-12deg] ${isDark ? 'text-white/15' : 'text-indigo-400/25'}`} />
              </div>
              )}
            </button>
          );
        })}
      </div>
      {ads.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {ads.map((ad, index) => (
            <button
              key={`${ad.id}-dot-${index}`}
              type="button"
              onClick={() => {
                railRef.current?.scrollTo({ left: index * 212, behavior: 'smooth' });
                setActiveIndex(index);
              }}
              className={`h-2.5 w-2.5 rounded-full transition ${index === activeIndex ? 'bg-indigo-600' : 'bg-slate-300'}`}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type SwipeDotsProps = {
  totalDots: number;
  activeIndex?: number;
  className?: string;
};

type ViewAllModalState =
  | { kind: 'offers'; title: string; items: Array<{ id: string; title: string; description?: string; discount?: string; businessName?: string; businessId?: string; image?: string }> }
  | { kind: 'updates'; title: string; items: Array<CommunityItem> }
  | { kind: 'businesses'; title: string; items: Array<Business> }
  | { kind: 'categories'; title: string; items: Array<{ id: string; name: string }> }
  | { kind: 'emergency'; title: string; items: Array<{ id: string; name: string }> };

function SwipeDots({ totalDots, activeIndex = 0, className = '' }: SwipeDotsProps) {
  if (totalDots <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: totalDots }, (_, index) => (
        <span
          key={`swipe-dot-${index}`}
          className={`h-2.5 w-2.5 rounded-full transition ${index === activeIndex ? 'bg-indigo-600' : 'bg-slate-300'}`}
        />
      ))}
    </div>
  );
}

interface WebPortalProps {
  localities: Locality[];
  businesses: Business[];
  categories: Category[];
  reviews: Review[];
  activeLocalityId: string;
  pincodeMappings?: Array<{ pincode: string; localityId: string }>;
  localityMappedPincodes?: string[];
  savedPincode?: string | null;
  initialCategoryFilter?: string | null;
  initialSearchFilter?: string | null;
  initialResultsPage?: boolean;
  filterNonce?: number;
  initialSelectedBusinessId?: string | null;
  selectionNonce?: number;
  onLocalityChange: (id: string) => void;
  userSession: UserSession;
  onUserSessionChange: (sess: UserSession) => void;
  viewedBusinessIds: string[];
  savedBusinessIds: string[];
  compareBusinessIds: string[];
  onToggleSavedBusiness: (businessId: string) => void;
  onToggleComparedBusiness: (businessId: string) => { allowed: boolean; active: boolean; reason?: string };
  buyerActivityEvents: BuyerActivityEvent[];
  onUnlockBusinessContact: (payload: { businessId: string; viewerName?: string; viewerPhone?: string; unlockToken?: string }) => Promise<boolean> | boolean;
  onSubmitApplication: (bizData: Omit<Business, 'id' | 'status' | 'createdAt' | 'rating' | 'reviewCount'>) => void;
  onUpdateBusiness: (b: Business) => void;
  onAddReview: (bizId: string, userName: string, userPhone: string, rating: number, comment: string) => void;
  listingAds?: ListingAd[];
  adLeads?: AdLead[];
  heroBanners?: HeroBanner[];
  homepageLayouts?: HomepageLayout[];
  homepageDefaultsConfig?: HomepageDefaultsConfigState;
  apiConfiguration?: ApiConfiguration;
  onSubmitAdLead?: (lead: Omit<AdLead, 'id' | 'createdAt'>) => void;
  onTrackListingAdInteraction?: (payload: { adId: string; type: 'impression' | 'click' | 'lead'; context?: string }) => void;
  urlCategoryFilter?: string | null;
  urlSubcategoryFilter?: string | null;
  urlFilterNonce?: number;
  
  // Custom interactive models props
  communityItems: CommunityItem[];
  onAddCommunityItem: (item: Omit<CommunityItem, 'id' | 'createdAt' | 'likes'>) => void;
  crmContacts: CRMContact[];
  onAddCRMContact: (contact: Omit<CRMContact, 'id' | 'lastInteraction'>) => void;
  onUpdateCRMContact: (updated: CRMContact) => void;
  coupons: MarketingCoupon[];
  onAddCoupon: (coupon: Omit<MarketingCoupon, 'id' | 'usageCount'>) => void;
  onLogAuditEvent?: (actionType: 'search' | 'contact_view' | 'data_entry', description: string, details: string) => void;
}

export default function WebPortal({
  localities,
  businesses,
  categories,
  reviews,
  activeLocalityId,
  pincodeMappings = [],
  localityMappedPincodes = [],
  savedPincode,
  initialCategoryFilter = null,
  initialSearchFilter = null,
  initialResultsPage = false,
  filterNonce = 0,
  initialSelectedBusinessId = null,
  selectionNonce = 0,
  onLocalityChange,
  userSession,
  onUserSessionChange,
  viewedBusinessIds,
  savedBusinessIds,
  compareBusinessIds,
  onToggleSavedBusiness,
  onToggleComparedBusiness,
  buyerActivityEvents,
  onUnlockBusinessContact,
  onSubmitApplication,
  onUpdateBusiness,
  onAddReview,
  listingAds = [],
  adLeads = [],
  heroBanners = [],
  homepageLayouts = [],
  homepageDefaultsConfig,
  apiConfiguration,
  onSubmitAdLead,
  onTrackListingAdInteraction,
  urlCategoryFilter = null,
  urlSubcategoryFilter = null,
  urlFilterNonce = 0,
  
  communityItems,
  onAddCommunityItem,
  crmContacts,
  onAddCRMContact,
  onUpdateCRMContact,
  coupons,
  onAddCoupon,
  onLogAuditEvent
}: WebPortalProps) {
  const showSubdomainLocationMapping = false; // Hidden for production public UI.
  const SIMPLE_SEARCH_FORM = true;
  const SHOW_PORTAL_TABS = false;
  const SHOW_REFINED_FILTERS = false;
  const SEO_INTENT_SLUG_BY_CATEGORY: Record<string, string> = {
    home: 'electrician',
    'home-services': 'electrician',
    salon: 'salon',
    'beauty-wellness': 'salon',
    health: 'dental-clinic',
    'health-medical': 'dental-clinic',
    food: 'restaurant',
    'food-restaurants': 'restaurant',
    retail: 'grocery-store',
    'shopping-retail': 'grocery-store',
    services: 'ca',
    'professional-services': 'ca',
  };
  const slugifyForUrl = (value: string) => value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const initialSelectedLocalityIds = activeLocalityId
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const initialMasterLocality =
    MASTER_LOCALITIES.find((locality) => locality.id === initialSelectedLocalityIds[0]) ||
    MASTER_LOCALITIES.find((locality) => locality.id === activeLocalityId) ||
    MASTER_LOCALITIES.find((locality) => locality.id === localities[0]?.id) ||
    MASTER_LOCALITIES[0];
  const initialMasterCity =
    (initialMasterLocality
      ? MASTER_CITIES.find((city) => city.id === initialMasterLocality.cityId)
      : undefined) ||
    MASTER_CITIES[0];
  const initialMasterState =
    (initialMasterCity
      ? MASTER_STATES.find((state) => state.id === initialMasterCity.stateId)
      : undefined) ||
    MASTER_STATES[0];
  const initialLocalityAreas = initialMasterLocality
    ? MASTER_AREAS.filter((area) => area.localityId === initialMasterLocality.id)
    : [];
  const initialPrimaryArea =
    initialLocalityAreas[0] ||
    (initialMasterCity
      ? MASTER_AREAS.find((area) => area.cityId === initialMasterCity.id)
      : undefined) ||
    MASTER_AREAS[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  
  // Hero Image Carousel slide index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // OTP modal visibility controls
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTargetBiz, setOtpTargetBiz] = useState<Business | null>(null);
  const [contactUnlockToken, setContactUnlockToken] = useState('');

  // Application / Registration Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Email optional
  const [website, setWebsite] = useState('');
  const [categoryId, setCategoryId] = useState('food-restaurants');
  const [subcategoryId, setSubcategoryId] = useState('restaurants');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [hours, setHours] = useState('10:00 AM - 08:30 PM');
  const [imageUrl, setImageUrl] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [listingPincode, setListingPincode] = useState(savedPincode || initialPrimaryArea?.pincode || '');

  // Master geography form values
  const [formStateId, setFormStateId] = useState(initialMasterState?.id || '');
  const [formCityId, setFormCityId] = useState(initialMasterCity?.id || '');
  const [formAreaId, setFormAreaId] = useState(initialPrimaryArea?.id || '');
  const [formAreasOfOperation, setFormAreasOfOperation] = useState<string[]>(initialPrimaryArea?.id ? [initialPrimaryArea.id] : []);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState('');

  // Portal tab navigation: listings directory finder, community feed & local deals, merchant crm and growth
  const [activePortalTab, setActivePortalTab] = useState<'listings' | 'community' | 'merchant'>('listings');

  // Advanced Search Modes: keyword, voice, image, ai search
  const [searchMode, setSearchMode] = useState<'keyword' | 'voice' | 'image' | 'ai'>('keyword');
  const [voiceIsListening, setVoiceIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [uploadedImageTag, setUploadedImageTag] = useState<string | null>(null);
  
  // AI Conversational Search
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiIsResponding, setAiIsResponding] = useState(false);
  const [aiResponseText, setAiResponseText] = useState('');

  // Rich Discovery Filters
  const [filterDistance, setFilterDistance] = useState<'all' | '1' | '2' | '5'>('all');
  const [filterCityId, setFilterCityId] = useState('all');
  const [filterRating, setFilterRating] = useState<0 | 4 | 4.5>(0);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterPriceRange, setFilterPriceRange] = useState<'all' | '₹' | '₹₹' | '₹₹₹' | '₹₹₹₹'>('all');
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterHasOffers, setFilterHasOffers] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterLanguageSpoken, setFilterLanguageSpoken] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterExperience, setFilterExperience] = useState<'all' | '5' | '10'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'popular' | 'rating' | 'nearest' | 'newest'>('recommended');
  const [resultsViewMode, setResultsViewMode] = useState<'grid' | 'map'>('grid');
  const [activeMapBusinessId, setActiveMapBusinessId] = useState<string | null>(null);

  // Merchant Hub Grow Desk workspace state
  const [activeSellerBizId, setActiveSellerBizId] = useState('s1');

  // Marketing campaign dispatcher inputs
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignPlatform, setCampaignPlatform] = useState<'email' | 'whatsapp' | 'sms'>('email');
  const [campaignIsSending, setCampaignIsSending] = useState(false);

  // Growth Room coupon creator states
  const [cpnCode, setCpnCode] = useState('');
  const [cpnDiscount, setCpnDiscount] = useState('20% OFF');
  const [cpnDesc, setCpnDesc] = useState('');
  const [cpnExpiry, setCpnExpiry] = useState('31-Dec-2026');

  // CRM notes manager
  const [crmNotes, setCrmNotes] = useState<{ [contactId: string]: string }>({});

  // Help score tracking for reviews
  const [helpfulVotes, setHelpfulVotes] = useState<{ [reviewId: string]: number }>({});
  const [reportedReviews, setReportedReviews] = useState<string[]>([]);

  // Community creation board values
  const [communityTitle, setCommunityTitle] = useState('');
  const [communityBody, setCommunityBody] = useState('');
  const [communitySection, setCommunitySection] = useState<'qna' | 'deals' | 'recommendations' | 'sponsored'>('qna');
  const [communityTags, setCommunityTags] = useState(`monsoon, ${initialMasterLocality?.name.split(',')[0] || 'Local Area'}`);
  const [recommendationRequestOpen, setRecommendationRequestOpen] = useState(false);
  const [recommendationRequestName, setRecommendationRequestName] = useState(userSession.userName || '');
  const [recommendationRequestPhone, setRecommendationRequestPhone] = useState(userSession.userPhone || '');
  const [recommendationRequestPincode, setRecommendationRequestPincode] = useState(savedPincode || initialPrimaryArea?.pincode || '');
  const [recommendationRequestNeed, setRecommendationRequestNeed] = useState('');
  const [recommendationRequestNotes, setRecommendationRequestNotes] = useState('');
  const [applyFormError, setApplyFormError] = useState('');
  const [applyDuplicateBusinessId, setApplyDuplicateBusinessId] = useState<string | null>(null);
  const [activeLeadAd, setActiveLeadAd] = useState<ListingAd | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadMobile, setLeadMobile] = useState('');
  const [leadPincode, setLeadPincode] = useState(savedPincode || initialPrimaryArea?.pincode || '');
  const [featuredPage, setFeaturedPage] = useState(1);
  const [regularPage, setRegularPage] = useState(1);
  const [communityPage, setCommunityPage] = useState(1);
  const [crmPage, setCrmPage] = useState(1);
  const [merchantLeadsPage, setMerchantLeadsPage] = useState(1);
  const [sellerWidgetLeadsPage, setSellerWidgetLeadsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [homepageRotationTick, setHomepageRotationTick] = useState(0);
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);
  const [viewAllModal, setViewAllModal] = useState<ViewAllModalState | null>(null);
  const [isResultsPage, setIsResultsPage] = useState(false);
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const trackedAdImpressionIdsRef = useRef<Set<string>>(new Set());
  const [resolvedHomepagePayload, setResolvedHomepagePayload] = useState<ResolvedHomepagePayload | null>(null);
  const [resolvedHomepageSource, setResolvedHomepageSource] = useState<'published_snapshot' | 'live_resolver' | 'legacy_fallback'>('legacy_fallback');
  const [resolvedHomepageHydrated, setResolvedHomepageHydrated] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (SIMPLE_SEARCH_FORM) {
      setActivePortalTab('listings');
      if (searchMode !== 'keyword') setSearchMode('keyword');
    }
  }, [SIMPLE_SEARCH_FORM, searchMode]);

  useEffect(() => {
    const openApplicationForm = () => setShowApplyModal(true);
    window.addEventListener('localsy:open-business-application', openApplicationForm);
    return () => window.removeEventListener('localsy:open-business-application', openApplicationForm);
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setSelectedSubcategory('all');
      return;
    }
    const allowed = getSubcategoriesForCategory(selectedCategory);
    if (selectedSubcategory !== 'all' && !allowed.some((s) => s.id === selectedSubcategory)) {
      setSelectedSubcategory('all');
    }
  }, [selectedCategory, selectedSubcategory]);

  useEffect(() => {
    const allowed = getSubcategoriesForCategory(categoryId);
    if (!allowed.some((s) => s.id === subcategoryId)) {
      setSubcategoryId(resolveDefaultSubcategoryId(categoryId));
    }
  }, [categoryId, subcategoryId]);

  useEffect(() => {
    if (!urlFilterNonce) return;
    if (urlCategoryFilter) {
      setSelectedCategory(urlCategoryFilter);
      setSelectedSubcategory(urlSubcategoryFilter || 'all');
      setActivePortalTab('listings');
    } else if (urlSubcategoryFilter) {
      const parent = getSubcategoryById(urlSubcategoryFilter)?.categoryId || 'all';
      setSelectedCategory(parent);
      setSelectedSubcategory(urlSubcategoryFilter);
      setActivePortalTab('listings');
    }
  }, [urlCategoryFilter, urlSubcategoryFilter, urlFilterNonce]);

  useEffect(() => {
    if (!savedPincode) return;
    setListingPincode(savedPincode);
    setLeadPincode(savedPincode);
  }, [savedPincode]);

  useEffect(() => {
    const selectedIds = activeLocalityId
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const activeMasterLocality =
      MASTER_LOCALITIES.find((locality) => locality.id === selectedIds[0]) ||
      MASTER_LOCALITIES.find((locality) => locality.id === activeLocalityId) ||
      MASTER_LOCALITIES.find((locality) => locality.id === localities[0]?.id);
    if (!activeMasterLocality) return;
    const activeMasterCity = MASTER_CITIES.find((city) => city.id === activeMasterLocality.cityId);
    const activeMasterState = activeMasterCity
      ? MASTER_STATES.find((state) => state.id === activeMasterCity.stateId)
      : undefined;
    const activeAreas = MASTER_AREAS.filter((area) => area.localityId === activeMasterLocality.id);
    const selectedAreaStillValid = activeAreas.some((area) => area.id === formAreaId);
    const nextPrimaryArea = selectedAreaStillValid
      ? activeAreas.find((area) => area.id === formAreaId)
      : activeAreas[0];

    if (activeMasterState?.id && activeMasterState.id !== formStateId) {
      setFormStateId(activeMasterState.id);
    }
    if (activeMasterCity?.id && activeMasterCity.id !== formCityId) {
      setFormCityId(activeMasterCity.id);
    }
    if ((nextPrimaryArea?.id || '') !== formAreaId) {
      setFormAreaId(nextPrimaryArea?.id || '');
    }
    setFormAreasOfOperation((prev) => {
      const nextAreas = prev.filter((areaId) => activeAreas.some((area) => area.id === areaId));
      if (nextAreas.length > 0) return nextAreas;
      return nextPrimaryArea?.id ? [nextPrimaryArea.id] : [];
    });
    if (!/^\d{6}$/.test(listingPincode)) {
      setListingPincode(savedPincode || nextPrimaryArea?.pincode || '');
    }
  }, [activeLocalityId, formAreaId, formCityId, formStateId, listingPincode, localities, savedPincode]);

  useEffect(() => {
    const areaPincode = MASTER_AREAS.find((area) => area.id === formAreaId)?.pincode;
    if (!areaPincode) return;
    if (!/^\d{6}$/.test(listingPincode)) {
      setListingPincode(areaPincode);
    }
  }, [formAreaId, listingPincode]);

  useEffect(() => {
    if (filterNonce === 0) return;
    setActivePortalTab('listings');
    setIsResultsPage(initialResultsPage);
    setSelectedCategory(initialCategoryFilter ?? 'all');
    setSelectedSubcategory('all');
    setSearchQuery(initialSearchFilter ?? '');
  }, [filterNonce, initialCategoryFilter, initialSearchFilter, initialResultsPage]);

  // Auto-rotating slider effect
  const selectedLocalityIds = activeLocalityId
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const browsingLocalityIds = selectedLocalityIds;
  const currentLocality =
    localities.find((l) => l.id === selectedLocalityIds[0]) ||
    localities.find((l) => l.id === activeLocalityId) ||
    localities[0];
  const currentLocalityMaster =
    MASTER_LOCALITIES.find((locality) => locality.id === currentLocality?.id) ||
    MASTER_LOCALITIES.find((locality) => locality.slug === currentLocality?.slug) ||
    MASTER_LOCALITIES.find((locality) => locality.id === selectedLocalityIds[0]);
  const nearbyCityLocalities = currentLocalityMaster
    ? MASTER_LOCALITIES
        .filter((locality) => locality.cityId === currentLocalityMaster.cityId && locality.id !== currentLocalityMaster.id)
        .slice(0, 6)
    : [];
  const selectedLocalityMappedPincodes = localityMappedPincodes.length > 0
    ? localityMappedPincodes
    : pincodeMappings
        .filter((mapping) => selectedLocalityIds.includes(mapping.localityId))
        .map((mapping) => mapping.pincode);
  const selectedLocalityNames = activeLocalityId
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => localities.find((l) => l.id === id)?.name || id)
    .join(', ');
  const currentLocalityLabel = currentLocality?.name.split(',')[0] || 'your area';
  const recentSearchStorageKey = `localsy:recent-searches:${currentLocality?.id || 'global'}`;
  const communityHashtag = `#${slugifyForUrl(currentLocalityLabel || 'community').replace(/-/g, '_')}_community`;
  const aiRecommendationPool = businesses
    .filter((business) => business.status === 'approved')
    .filter((business) => browsingLocalityIds.length === 0 || browsingLocalityIds.includes(business.localityId));
  const todayIso = new Date().toISOString().slice(0, 10);
  const hasResolvedHomepagePayload = resolvedHomepagePayload !== null;
  const cmsHeroBanners = hasResolvedHomepagePayload
    ? (resolvedHomepagePayload?.heroBanners || [])
    : heroBanners;
  const shouldDeferResolvedListingAds = Boolean(
    apiConfiguration?.resolvedHomepageEndpoint &&
    currentLocality?.id &&
    !resolvedHomepageHydrated
  );
  const cmsListingAds = shouldDeferResolvedListingAds
    ? []
    : hasResolvedHomepagePayload
      ? (resolvedHomepagePayload?.listingAds || [])
      : listingAds;
  const cmsCoupons = hasResolvedHomepagePayload
    ? (resolvedHomepagePayload?.offers || [])
    : coupons;
  const cmsCommunityItems = hasResolvedHomepagePayload
    ? (resolvedHomepagePayload?.contentBlocks || [])
    : communityItems;
  const resolvedHomepageSections = hasResolvedHomepagePayload
    ? (resolvedHomepagePayload?.sections || [])
    : [];
  const resolvedSectionBusinessIdsBySection = resolvedHomepagePayload?.sectionBusinessIdsBySection || {};
  const resolvedSponsoredBusinessIds = new Set(
    (resolvedHomepagePayload?.sponsoredListings || []).map((business) => business.id)
  );
  const activeHeroBanners = cmsHeroBanners.filter((banner) => {
    if (!banner.isActive) return false;
    if (banner.localityId !== currentLocality.id) return false;
    if (banner.startDate > todayIso || banner.endDate < todayIso) return false;
    if (banner.pincodes && banner.pincodes.length > 0 && !banner.pincodes.some((pincode) => pincode === savedPincode || selectedLocalityMappedPincodes.includes(pincode))) {
      return false;
    }
    return true;
  });
  const carouselImages = activeHeroBanners.length > 0
    ? activeHeroBanners.map((banner) => getMediaProxyUrl(banner.imageUrl))
    : (currentLocality.carouselImages || [currentLocality.coverImage]).map((image) => getMediaProxyUrl(image));
  const activeHeroSlide = activeHeroBanners.length > 0
    ? activeHeroBanners[carouselIndex % activeHeroBanners.length]
    : null;
  const currentLocalitySlug = currentLocality.slug || currentLocality.id;
  const currentDeviceTarget: 'mobile' | 'desktop' = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(recentSearchStorageKey);
      if (!raw) {
        setRecentSearches([]);
        return;
      }
      const parsed = JSON.parse(raw);
      const next = Array.isArray(parsed)
        ? parsed
            .map((entry) => String(entry || '').trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];
      setRecentSearches(next);
    } catch {
      setRecentSearches([]);
    }
  }, [recentSearchStorageKey]);

  useEffect(() => {
    if (!apiConfiguration?.resolvedHomepageEndpoint || !currentLocality?.id) {
      setResolvedHomepageHydrated(true);
      setResolvedHomepagePayload(null);
      setResolvedHomepageSource('legacy_fallback');
      return;
    }

    let cancelled = false;
    setResolvedHomepageHydrated(false);
    const params = new URLSearchParams({
      localityId: currentLocality.id,
      device: currentDeviceTarget,
      pageType: isResultsPage ? 'listing_results' : 'homepage',
    });
    if (savedPincode) params.set('pincode', savedPincode);
    if (selectedCategory && selectedCategory !== 'all') params.set('categoryId', selectedCategory);
    if (selectedSubcategory && selectedSubcategory !== 'all') params.set('subcategoryId', selectedSubcategory);

    fetch(`${apiConfiguration.resolvedHomepageEndpoint}?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { payload?: ResolvedHomepagePayload; source?: 'published_snapshot' | 'live_resolver' } | null) => {
        if (cancelled) return;
        if (!data?.payload) {
          setResolvedHomepageHydrated(true);
          setResolvedHomepagePayload(null);
          setResolvedHomepageSource('legacy_fallback');
          return;
        }
        setResolvedHomepageHydrated(true);
        setResolvedHomepagePayload(data.payload);
        setResolvedHomepageSource(data.source || 'live_resolver');
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedHomepageHydrated(true);
        setResolvedHomepagePayload(null);
        setResolvedHomepageSource('legacy_fallback');
      });

    return () => {
      cancelled = true;
    };
  }, [
    apiConfiguration?.resolvedHomepageEndpoint,
    currentLocality?.id,
    currentDeviceTarget,
    isResultsPage,
    savedPincode,
    selectedCategory,
    selectedSubcategory,
  ]);

  const buildCategoryRoutePath = (categoryId: string) => {
    if (categoryId === 'all') return `/${currentLocalitySlug}`;
    const seoSlug = SEO_INTENT_SLUG_BY_CATEGORY[categoryId] || slugifyForUrl(categoryId);
    return `/${currentLocalitySlug}/${seoSlug}`;
  };
  const getSearchResultsKeyword = (categoryId = selectedCategory, query = searchQuery) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) return trimmedQuery;
    if (categoryId && categoryId !== 'all') return getCategoryById(categoryId)?.name || categoryId;
    return 'All';
  };
  const rememberRecentSearch = (query: string) => {
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery) return;
    setRecentSearches((prev) => {
      const next = [trimmedQuery, ...prev.filter((entry) => entry.toLowerCase() !== trimmedQuery.toLowerCase())].slice(0, 6);
      try {
        window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(next));
      } catch {
        // Ignore storage failures in private or blocked contexts.
      }
      return next;
    });
  };
  const buildSearchResultsRoutePath = (
    categoryId = selectedCategory,
    subcategoryId = selectedSubcategory,
    query = searchQuery
  ) => {
    const params = new URLSearchParams();
    const keyword = getSearchResultsKeyword(categoryId, query);
    params.set('srp', keyword);
    if (categoryId && categoryId !== 'all') params.set('category', categoryId);
    if (subcategoryId && subcategoryId !== 'all') params.set('subcategory', subcategoryId);
    return `/${currentLocalitySlug}?${params.toString()}`;
  };
  const buildListingRoutePath = (biz: Business) => {
    const locality = localities.find((entry) => entry.id === biz.localityId);
    const localitySlug = locality?.slug || biz.localityId;
    const seoSlug = SEO_INTENT_SLUG_BY_CATEGORY[biz.categoryId] || slugifyForUrl(biz.categoryId);
    return `/${localitySlug}/${seoSlug}/${biz.slug || `${slugifyForUrl(biz.name)}-${biz.id}`}`;
  };
  const buildAbsoluteListingUrl = (biz: Business) => {
    const path = buildListingRoutePath(biz);
    if (typeof window === 'undefined') return path;
    return new URL(path, window.location.origin).toString();
  };
  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', 'true');
    helper.style.position = 'absolute';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    document.body.removeChild(helper);
  };
  const pushHistoryIfNeeded = (nextPath: string) => {
    if (`${window.location.pathname}${window.location.search}` === nextPath) return;
    window.history.pushState({}, '', nextPath);
  };
  const openResultsFromSearch = (
    categoryId = selectedCategory,
    subcategoryId = selectedSubcategory,
    query = searchQuery
  ) => {
    const nextCategory = categoryId || 'all';
    const nextSubcategory = nextCategory === 'all' ? 'all' : (subcategoryId || 'all');
    const nextQuery = String(query || '').trim();
    setActivePortalTab('listings');
    setSelectedCategory(nextCategory);
    setSelectedSubcategory(nextSubcategory);
    setSearchQuery(nextQuery);
    setSelectedBiz(null);
    setIsResultsPage(true);
    rememberRecentSearch(getSearchResultsKeyword(nextCategory, nextQuery));
    pushHistoryIfNeeded(buildSearchResultsRoutePath(nextCategory, nextSubcategory, nextQuery));
    window.requestAnimationFrame(() => {
      document.getElementById('results-page-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const openResultsPage = () => {
    openResultsFromSearch(selectedCategory, selectedSubcategory, searchQuery);
  };
  const openHomePage = () => {
    setIsResultsPage(false);
    setSelectedBiz(null);
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    pushHistoryIfNeeded(`/${currentLocalitySlug}`);
    window.requestAnimationFrame(() => {
      document.getElementById('web-portal-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const openResultsForCategory = (categoryId: string, subcategoryId = 'all') => {
    const categoryKeyword = subcategoryId !== 'all'
      ? getSubcategoryById(subcategoryId)?.name || getCategoryById(categoryId)?.name || categoryId
      : getCategoryById(categoryId)?.name || (categoryId === 'all' ? '' : categoryId);
    openResultsFromSearch(categoryId, categoryId === 'all' ? 'all' : subcategoryId, categoryKeyword);
  };
  const handleCategoryShortcut = (categoryId: string, subcategoryId = 'all') => {
    openResultsForCategory(categoryId, subcategoryId);
  };
  const openBusinessDetails = (biz: Business) => {
    setSelectedBiz(biz);
    pushHistoryIfNeeded(buildListingRoutePath(biz));
  };
  const handleShareBusinessListing = async (biz: Business) => {
    const listingUrl = buildAbsoluteListingUrl(biz);
    const shareText = `${biz.name} on Localisy${getBusinessAreaName(biz) ? `, ${getBusinessAreaName(biz)}` : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: biz.name,
          text: shareText,
          url: listingUrl,
        });
      } else {
        await copyTextToClipboard(listingUrl);
        alert(`Listing link copied for "${biz.name}".`);
      }
      onLogAuditEvent?.(
        'contact_view',
        'Shared listing',
        `Business: "${biz.name}" | URL: "${listingUrl}"`
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await copyTextToClipboard(listingUrl);
        alert(`Listing link copied for "${biz.name}".`);
      } catch {
        alert('Unable to share listing right now.');
      }
    }
  };
  const handleShareBusinessToWhatsapp = (biz: Business) => {
    const listingUrl = buildAbsoluteListingUrl(biz);
    const message = `Check out ${biz.name} on Localisy: ${listingUrl}`;
    onLogAuditEvent?.(
      'contact_view',
      'Shared listing to WhatsApp',
      `Business: "${biz.name}" | URL: "${listingUrl}"`
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };
  const closeBusinessDetails = () => {
    setSelectedBiz(null);
    pushHistoryIfNeeded(buildCategoryRoutePath(selectedCategory));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  useEffect(() => {
    if (selectionNonce === 0) return;
    if (!initialSelectedBusinessId) {
      setSelectedBiz(null);
      return;
    }
    const matched = businesses.find((biz) => biz.id === initialSelectedBusinessId);
    if (!matched) return;
    setActivePortalTab('listings');
    setSelectedBiz(matched);
  }, [selectionNonce, initialSelectedBusinessId, businesses]);

  useEffect(() => {
    if (activePortalTab !== 'listings') return;
    if (selectedBiz) return;
    pushHistoryIfNeeded(buildCategoryRoutePath(selectedCategory));
  }, [activePortalTab, selectedBiz, selectedCategory, currentLocalitySlug]);

  useEffect(() => {
    setFeaturedPage(1);
    setRegularPage(1);
  }, [
    activeLocalityId,
    searchQuery,
    voiceTranscript,
    searchMode,
    selectedCategory,
    selectedSubcategory,
    filterCityId,
    sortBy,
    filterDistance,
    filterRating,
    filterOpenNow,
    filterPriceRange,
    filterDelivery,
    filterHasOffers,
    filterVerifiedOnly,
    filterLanguageSpoken,
    filterPaymentMethod,
    filterExperience,
    urlFilterNonce
  ]);

  useEffect(() => {
    setCommunityPage(1);
  }, [activeLocalityId, activePortalTab]);

  useEffect(() => {
    setCrmPage(1);
    setMerchantLeadsPage(1);
  }, [activeSellerBizId]);

  useEffect(() => {
    if (userSession.role !== 'seller' || !userSession.sellerBusinessId) return;
    if (activeSellerBizId === userSession.sellerBusinessId) return;
    setActiveSellerBizId(userSession.sellerBusinessId);
  }, [activeSellerBizId, userSession.role, userSession.sellerBusinessId]);

  useEffect(() => {
    setSellerWidgetLeadsPage(1);
  }, [userSession.sellerBusinessId, activePortalTab]);

  useEffect(() => {
    setReviewsPage(1);
  }, [selectedBiz?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHomepageRotationTick((value) => value + 1);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isResultsPage) return;
    const interval = window.setInterval(() => {
      document.querySelectorAll<HTMLElement>('[data-mobile-auto-scroll="true"]').forEach((rail) => {
        if (rail.scrollWidth <= rail.clientWidth) return;
        const maxLeft = rail.scrollWidth - rail.clientWidth;
        const nextLeft = rail.scrollLeft + rail.clientWidth;
        rail.scrollTo({
          left: nextLeft >= maxLeft - 8 ? 0 : nextLeft,
          behavior: 'smooth'
        });
      });
    }, 3200);
    return () => window.clearInterval(interval);
  }, [isResultsPage]);

  // Audit log tracker for user search operations (debounced/distinct values)
  useEffect(() => {
    if (!onLogAuditEvent) return;

    if (isResultsPage && searchMode === 'keyword' && searchQuery.trim()) {
      const timer = setTimeout(() => {
        onLogAuditEvent(
          'search',
          `Searched directory (Keyword)`,
          `Zone: "${activeLocalityId}" | Query: "${searchQuery}" | Category: "${selectedCategory}"`
        );
      }, 1500); // 1.5-second debounce to prevent heavy typewriter audit logs while typing
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchMode, selectedCategory, activeLocalityId, onLogAuditEvent, isResultsPage]);

  useEffect(() => {
    if (!onLogAuditEvent) return;

    if (isResultsPage && searchMode === 'voice' && voiceTranscript.trim()) {
      onLogAuditEvent(
        'search',
        `Searched directory (Simulated Voice Recognition)`,
        `Zone: "${activeLocalityId}" | Transcribed audio output: "${voiceTranscript}"`
      );
    }
  }, [voiceTranscript, searchMode, onLogAuditEvent, activeLocalityId, isResultsPage]);

  useEffect(() => {
    if (!onLogAuditEvent) return;

    if (isResultsPage && searchMode === 'image' && uploadedImageTag) {
      onLogAuditEvent(
        'search',
        `Searched directory (Scan Visual Photo Upload)`,
        `Zone: "${activeLocalityId}" | Extracted Tag: "${uploadedImageTag}" | Directed query: "${searchQuery}"`
      );
    }
  }, [uploadedImageTag, searchMode, onLogAuditEvent, activeLocalityId, isResultsPage]);

  const handleNextSlide = () => {
    setCarouselIndex(prev => (prev + 1) % carouselImages.length);
  };

  const handlePrevSlide = () => {
    setCarouselIndex(prev => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  // Voice Search Activation Simulation
  const triggerVoiceSearchSimulate = () => {
    setVoiceIsListening(true);
    setVoiceTranscript('');
    setTimeout(() => {
      setVoiceIsListening(false);
      const choices = ['Salon', 'Grooming', 'Botox', 'Academy', 'Utsav'];
      const pick = choices[Math.floor(Math.random() * choices.length)];
      setVoiceTranscript(pick);
      setSearchQuery(pick);
    }, 2000);
  };

  // Image tag click simulation
  const triggerImageTagSimulate = (tag: string) => {
    setUploadedImageTag(tag);
    if (tag === 'tea_shop') {
      setSearchQuery('Utsav');
      setSelectedCategory('food');
    } else if (tag === 'saree') {
      setSearchQuery('Boutique');
      setSelectedCategory('salon');
    } else if (tag === 'dental_chair') {
      setSearchQuery('5 Elements');
      setSelectedCategory('salon');
    }
  };

  // AI Semantic Conversational recommendations engine simulation
  const handleAiSearchRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setAiIsResponding(true);
    setAiResponseText('');
    onLogAuditEvent?.(
      'search',
      `Conversational Recommendation (Gemini Conversational Query)`,
      `Natural prompt: "${aiSearchQuery}"`
    );
    setTimeout(() => {
      setAiIsResponding(false);
      const normalizedQuery = aiSearchQuery.trim().toLowerCase();
      const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
      const hintGroups = [
        ['hair', 'salon', 'groom', 'cut', 'barber', 'beauty'],
        ['academy', 'spa', 'wellness', 'therapy'],
        ['veg', 'food', 'dosa', 'restaurant', 'cafe', 'tiffin'],
      ];
      const matchedHints = hintGroups.find((group) => group.some((token) => normalizedQuery.includes(token))) || queryTokens;
      const buildSearchHaystack = (business: Business) => [
        business.name,
        business.description,
        business.tags.join(' '),
        getCategoryById(business.categoryId)?.name || '',
        getSubcategoryById(business.subcategoryId)?.name || '',
      ].join(' ').toLowerCase();
      const sortBusinessesByQuality = (items: Business[]) => (
        [...items].sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount) || a.name.localeCompare(b.name))
      );
      const directMatches = sortBusinessesByQuality(
        aiRecommendationPool.filter((business) => {
          const haystack = buildSearchHaystack(business);
          return queryTokens.some((token) => haystack.includes(token));
        })
      );
      const hintMatches = sortBusinessesByQuality(
        aiRecommendationPool.filter((business) => {
          const haystack = buildSearchHaystack(business);
          return matchedHints.some((hint) => haystack.includes(hint));
        })
      );
      const recommendedBusiness = directMatches[0] || hintMatches[0];

      if (recommendedBusiness) {
        const areaLabel = MASTER_AREAS.find((area) => area.id === recommendedBusiness.areaId)?.name
          || localities.find((locality) => locality.id === recommendedBusiness.localityId)?.name.split(',')[0]
          || currentLocalityLabel;
        const categoryLabel = getSubcategoryById(recommendedBusiness.subcategoryId)?.name
          || getCategoryById(recommendedBusiness.categoryId)?.name
          || 'local services';
        const summaryText = recommendedBusiness.description.trim().split(/[.!?]/)[0]?.trim() || `Trusted ${categoryLabel.toLowerCase()} provider`;
        const ratingText = recommendedBusiness.rating > 0
          ? ` Rated ${recommendedBusiness.rating.toFixed(1)} star from ${recommendedBusiness.reviewCount} reviews.`
          : '';
        setAiResponseText(`AI Recommendation: Try "${recommendedBusiness.name}" in ${areaLabel}. ${summaryText}.${ratingText}`);
        return;
      }

      if (queryTokens.length > 0) {
        setAiResponseText(`AI Recommendation: For "${aiSearchQuery}", we scanned verified businesses in ${currentLocalityLabel}. Try a broader keyword like salon, clinic, restaurant, electrician, or tutor to surface the best local matches.`);
        return;
      }
      const q = aiSearchQuery.toLowerCase();
      if (q.includes('hair') || q.includes('salon') || q.includes('groom') || q.includes('cut')) {
        setAiResponseText(`AI Recommendation: Search verified salons and grooming providers in ${currentLocalityLabel} for the strongest local matches.`);
      } else if (q.includes('academy') || q.includes('spa') || q.includes('majestic')) {
        setAiResponseText(`AI Recommendation: Explore verified wellness, academy, and spa listings in ${currentLocalityLabel} to compare the best nearby options.`);
      } else if (q.includes('veg') || q.includes('food') || q.includes('dosa') || q.includes('utsav')) {
        setAiResponseText(`AI Recommendation: Browse verified restaurants and food providers in ${currentLocalityLabel} to compare trusted nearby choices.`);
      } else {
        setAiResponseText(`AI Recommendation: For "${aiSearchQuery}", try refining your search with a business type, category, or service keyword to surface the best matches in ${currentLocalityLabel}.`);
      }
    }, 1200);
  };

  // Submit dynamic coupon creation
  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpnCode.trim()) return;
    onAddCoupon({
      businessId: activeSellerBizId,
      code: cpnCode.toUpperCase().replace(/\s+/g, ''),
      discount: cpnDiscount,
      description: cpnDesc || `Exclusive local merchant coupon discount.`,
      expiryDate: cpnExpiry
    });
    alert(`Coupon "${cpnCode.toUpperCase()}" launched safely! This coupon code is now active and is dynamically populated inside normal listing detail panels.`);
    setCpnCode('');
    setCpnDesc('');
  };

  // Submit community forum post
  const handleAddCommunityPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityTitle.trim() || !communityBody.trim()) {
      alert("Please fill in the discussion title and message.");
      return;
    }
    onAddCommunityItem({
      localityId: activeLocalityId,
      title: communityTitle,
      content: communityBody,
      type: communitySection === 'deals' ? 'deal' : communitySection === 'qna' ? 'qa' : 'recommendation',
      authorName: userSession.userName || 'Local Citizen',
    });
    setCommunityTitle('');
    setCommunityBody('');
    alert("Discussion thread posted live on the locality bulletin board!");
  };

  const activeSearchText = (searchMode === 'voice' && voiceTranscript) ? voiceTranscript : (isResultsPage ? deferredSearchQuery : '');
  const normalizedActiveSearch = normalizeSearchText(activeSearchText);

  const openRecommendationRequest = () => {
    const seededNeed = activeSearchText.trim()
      || searchQuery.trim()
      || (selectedSubcategory !== 'all'
        ? getSubcategoryById(selectedSubcategory)?.name || ''
        : selectedCategory !== 'all'
          ? getCategoryById(selectedCategory)?.name || ''
          : '');
    setRecommendationRequestName(userSession.userName || '');
    setRecommendationRequestPhone(userSession.userPhone || '');
    setRecommendationRequestPincode(savedPincode || listingPincode || initialPrimaryArea?.pincode || '');
    setRecommendationRequestNeed(seededNeed);
    setRecommendationRequestNotes('');
    setRecommendationRequestOpen(true);
  };

  const handleRecommendationRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requesterName = recommendationRequestName.trim();
    const requesterPhone = recommendationRequestPhone.replace(/\D/g, '').slice(-10);
    const requestedNeed = recommendationRequestNeed.trim();
    const categoryLabel = selectedSubcategory !== 'all'
      ? getSubcategoryById(selectedSubcategory)?.name || selectedSubcategory
      : selectedCategory !== 'all'
        ? getCategoryById(selectedCategory)?.name || selectedCategory
        : 'General search';

    if (!requesterName || requesterPhone.length !== 10 || !/^\d{6}$/.test(recommendationRequestPincode) || !requestedNeed) {
      alert('Please enter your name, 10-digit mobile number, 6-digit pincode, and what you are looking for.');
      return;
    }

    const detailLines = [
      `Need: ${requestedNeed}`,
      `Search context: ${categoryLabel}`,
      `Pincode: ${recommendationRequestPincode}`,
      `Locality: ${currentLocality.name}`,
      recommendationRequestNotes.trim() ? `Preferences: ${recommendationRequestNotes.trim()}` : '',
    ].filter(Boolean);

    onAddCommunityItem({
      localityId: activeLocalityId,
      type: 'recommendation',
      title: `Need recommendation: ${requestedNeed}`,
      content: detailLines.join(' | '),
      authorName: requesterName,
      authorPhone: requesterPhone,
    });

    onLogAuditEvent?.(
      'data_entry',
      'Submitted recommendation request',
      `Need: "${requestedNeed}" | Locality: "${activeLocalityId}" | Pincode: "${recommendationRequestPincode}"`
    );

    setRecommendationRequestOpen(false);
    setRecommendationRequestNotes('');
    alert('Your recommendation request has been posted for local follow-up.');
  };

  // Launch targeted multi-channel CRM customer campaign
  const handleRunCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject.trim() || !campaignBody.trim()) {
      alert("Please specify a campaign title and content message.");
      return;
    }
    setCampaignIsSending(true);
    setTimeout(() => {
      setCampaignIsSending(false);
      alert(`Campaign Dispatched Successfully! 🚀 Sent via simulated ${campaignPlatform.toUpperCase()} to all local customer database numbers who have viewed this business, utilizing template system tags.`);
      setCampaignSubject('');
      setCampaignBody('');
    }, 1800);
  };

  // Helper reviews interactive behaviors
  const handleHelpVote = (revId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpfulVotes(prev => ({
      ...prev,
      [revId]: (prev[revId] || 0) + 1
    }));
  };

  const handleReportAbuse = (revId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Flag this review as spam or system abuse? It will be logged for regional operator review.")) {
      setReportedReviews(prev => [...prev, revId]);
    }
  };

  // Filter approved listings relevant to search keyword + category ID
  const approvedInLocality = businesses.filter((b) => {
    const businessPincode = b.pincode || MASTER_AREAS.find((area) => area.id === b.areaId)?.pincode || '';
    const matchesMappedPincode = selectedLocalityMappedPincodes.length === 0
      ? true
      : selectedLocalityMappedPincodes.includes(businessPincode);
    return browsingLocalityIds.includes(b.localityId) && b.status === 'approved' && matchesMappedPincode;
  });
  const availableCityOptions = useMemo(() => {
    const cityIds = Array.from(new Set(approvedInLocality.map((business) => business.cityId).filter(Boolean)));
    return cityIds
      .map((cityId) => ({
        id: cityId,
        name: MASTER_CITIES.find((city) => city.id === cityId)?.name || cityId,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [approvedInLocality]);
  const filteredBusinesses = approvedInLocality.filter(b => {
    const matchesSearch = matchesBusinessSearch(b, normalizedActiveSearch);
    
    // Check if matching primary category
    const matchesCategory = selectedCategory === 'all' || b.categoryId === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || b.subcategoryId === selectedSubcategory;
    const matchesCity = filterCityId === 'all' || b.cityId === filterCityId;

    // Discovery Filter: Distance
    const matchesDistance = filterDistance === 'all' || (b.distance !== undefined && b.distance <= parseFloat(filterDistance));

    // Discovery Filter: Rating min check
    const matchesRating = filterRating === 0 || b.rating >= filterRating;

    // Discovery Filter: Open now check 
    const businessHours = String(b.hours || '');
    const matchesOpenNow = !filterOpenNow || businessHours.includes('24') || businessHours.includes('AM');

    // Discovery Filter: Price range matching
    const matchesPrice = filterPriceRange === 'all' || b.priceRange === filterPriceRange;

    // Discovery Filter: Delivery matching
    const matchesDelivery = !filterDelivery || b.deliveryAvailable === true;

    // Discovery Filter: Offers matching
    const matchesOffers = !filterHasOffers || b.hasOffers === true;

    // Discovery Filter: Verified check
    const matchesVerified = !filterVerifiedOnly || b.verifiedBadge === true;

    // Discovery Filter: Language spoken
    const matchesLanguage = filterLanguageSpoken === 'all' || b.languagesSpoken?.includes(filterLanguageSpoken);

    // Discovery Filter: Payment methods
    const matchesPayment = filterPaymentMethod === 'all' || b.paymentMethods?.includes(filterPaymentMethod);

    // Discovery Filter: Experience min years
    const matchesExperience = filterExperience === 'all' || (b.experienceYears !== undefined && b.experienceYears >= parseFloat(filterExperience));

    return matchesSearch && matchesCategory && matchesSubcategory && matchesCity && matchesDistance && matchesRating && matchesOpenNow && matchesPrice && matchesDelivery && matchesOffers && matchesVerified && matchesLanguage && matchesPayment && matchesExperience;
  });
  const dedupedFilteredBusinesses = dedupeBusinessesForExperience(filteredBusinesses, normalizedActiveSearch, 'results');

  // Apply sorting rules
  const sortedBusinesses = [...dedupedFilteredBusinesses].sort((a, b) => {
    if (sortBy === 'recommended') {
      const scoreDiff = getBusinessRecommendedScore(b, normalizedActiveSearch, 'results') - getBusinessRecommendedScore(a, normalizedActiveSearch, 'results');
      if (scoreDiff !== 0) return scoreDiff;
      return (b.reviewCount - a.reviewCount) || b.name.localeCompare(a.name);
    }
    if (sortBy === 'popular') {
      return b.reviewCount - a.reviewCount;
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    if (sortBy === 'nearest') {
      return (a.distance || 99) - (b.distance || 99);
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });
  const homepageSortedBusinesses = dedupeBusinessesForExperience(approvedInLocality, '', 'homepage').sort((a, b) => {
    const scoreDiff = getBusinessRecommendedScore(b, '', 'homepage') - getBusinessRecommendedScore(a, '', 'homepage');
    if (scoreDiff !== 0) return scoreDiff;
    return (b.reviewCount - a.reviewCount) || b.name.localeCompare(a.name);
  });
  const defaultHeroStatCards = [
    { label: 'Happy Users', value: '15K+', Icon: Users, className: 'text-indigo-600 bg-indigo-50' },
    { label: 'Verified Businesses', value: `${sortedBusinesses.length}+`, Icon: CheckCircle, className: 'text-emerald-600 bg-emerald-50' },
    {
      label: 'Average Rating',
      value: sortedBusinesses.length > 0 ? (sortedBusinesses.reduce((sum, business) => sum + business.rating, 0) / sortedBusinesses.length).toFixed(1) : '0.0',
      Icon: Star,
      className: 'text-amber-500 bg-amber-50'
    }
  ];
  const heroStatCards = activeHeroSlide?.heroStats === undefined
    ? defaultHeroStatCards
    : activeHeroSlide.heroStats
        .filter((stat) => stat.enabled)
        .filter((stat) => {
          const localityMatch = !stat.localityIds || stat.localityIds.length === 0 || stat.localityIds.includes(currentLocality.id);
          const pincodeMatch = !stat.pincodes || stat.pincodes.length === 0 || stat.pincodes.some((pincode) => pincode === savedPincode || selectedLocalityMappedPincodes.includes(pincode));
          return localityMatch && pincodeMatch;
        })
        .slice(0, 3)
        .map((stat, index) => {
          const Icon = [Users, CheckCircle, Star][index] || Users;
          const className = ['text-indigo-600 bg-indigo-50', 'text-emerald-600 bg-emerald-50', 'text-amber-500 bg-amber-50'][index] || 'text-indigo-600 bg-indigo-50';
          return { label: stat.label, value: stat.value, Icon, className };
        });

  // Separate sorted lists
  const featuredBusinesses = sortedBusinesses.filter(b => b.featured);
  const regularBusinesses = sortedBusinesses.filter(b => !b.featured);
  const FEATURED_PAGE_SIZE = 6;
  const REGULAR_PAGE_SIZE = 18;
  const COMMUNITY_PAGE_SIZE = 8;
  const CRM_PAGE_SIZE = 10;
  const LEADS_PAGE_SIZE = 10;
  const REVIEWS_PAGE_SIZE = 6;
  const featuredTotalPages = Math.max(1, Math.ceil(featuredBusinesses.length / FEATURED_PAGE_SIZE));
  const safeFeaturedPage = Math.min(featuredPage, featuredTotalPages);
  const pagedFeaturedBusinesses = featuredBusinesses.slice(
    (safeFeaturedPage - 1) * FEATURED_PAGE_SIZE,
    safeFeaturedPage * FEATURED_PAGE_SIZE
  );
  const regularTotalPages = Math.max(1, Math.ceil(regularBusinesses.length / REGULAR_PAGE_SIZE));
  const safeRegularPage = Math.min(regularPage, regularTotalPages);
  const pagedRegularBusinesses = regularBusinesses.slice(
    (safeRegularPage - 1) * REGULAR_PAGE_SIZE,
    safeRegularPage * REGULAR_PAGE_SIZE
  );
  const searchResultBusinesses = sortedBusinesses;
  const searchResultTotalPages = Math.max(1, Math.ceil(searchResultBusinesses.length / REGULAR_PAGE_SIZE));
  const safeSearchResultPage = Math.min(regularPage, searchResultTotalPages);
  const pagedSearchResultBusinesses = searchResultBusinesses.slice(
    (safeSearchResultPage - 1) * REGULAR_PAGE_SIZE,
    safeSearchResultPage * REGULAR_PAGE_SIZE
  );
  useEffect(() => {
    if (!onLogAuditEvent) return;
    if (!isResultsPage || !normalizedActiveSearch || searchResultBusinesses.length > 0) return;
    onLogAuditEvent(
      'search',
      'No-result search',
      `Zone: "${activeLocalityId}" | Query: "${activeSearchText}" | Category: "${selectedCategory}"`
    );
  }, [activeLocalityId, activeSearchText, isResultsPage, normalizedActiveSearch, onLogAuditEvent, searchResultBusinesses.length, selectedCategory]);
  const searchResultMapBusinesses = pagedSearchResultBusinesses.filter((business) => (
    business.gpsCoordinates &&
    Number.isFinite(business.gpsCoordinates.lat) &&
    Number.isFinite(business.gpsCoordinates.lng)
  ));
  const searchResultMapBounds = useMemo(() => {
    if (searchResultMapBusinesses.length === 0) return null;
    const latitudes = searchResultMapBusinesses.map((business) => business.gpsCoordinates!.lat);
    const longitudes = searchResultMapBusinesses.map((business) => business.gpsCoordinates!.lng);
    return {
      minLat: Math.min(...latitudes),
      maxLat: Math.max(...latitudes),
      minLng: Math.min(...longitudes),
      maxLng: Math.max(...longitudes),
    };
  }, [searchResultMapBusinesses]);
  const projectSearchResultMapPoint = (business: Business) => {
    if (!business.gpsCoordinates || !searchResultMapBounds) return { x: 50, y: 50 };
    const { minLat, maxLat, minLng, maxLng } = searchResultMapBounds;
    const latRange = Math.max(0.01, maxLat - minLat);
    const lngRange = Math.max(0.01, maxLng - minLng);
    return {
      x: 10 + (((business.gpsCoordinates.lng - minLng) / lngRange) * 80),
      y: 12 + (((maxLat - business.gpsCoordinates.lat) / latRange) * 72),
    };
  };
  const activeMapBusiness = searchResultMapBusinesses.find((business) => business.id === activeMapBusinessId) || searchResultMapBusinesses[0] || null;
  useEffect(() => {
    if (resultsViewMode === 'map' && searchResultMapBusinesses.length === 0) {
      setResultsViewMode('grid');
    }
  }, [resultsViewMode, searchResultMapBusinesses.length]);
  useEffect(() => {
    if (pagedSearchResultBusinesses.length === 0) {
      setActiveMapBusinessId(null);
      return;
    }
    const firstMappedBusiness = pagedSearchResultBusinesses.find((business) => business.gpsCoordinates)?.id || null;
    setActiveMapBusinessId((prev) => (
      prev && pagedSearchResultBusinesses.some((business) => business.id === prev)
        ? prev
        : firstMappedBusiness
    ));
  }, [pagedSearchResultBusinesses]);
  const applyDuplicateBusiness = applyDuplicateBusinessId
    ? businesses.find((business) => business.id === applyDuplicateBusinessId) || null
    : null;
  const searchSuggestions: SearchSuggestion[] = [
    ...recentSearches.map((query, index) => ({
      id: `recent-${index}-${slugifyForUrl(query)}`,
      type: 'recent' as const,
      displayValue: query,
      queryValue: query,
      metaLabel: 'Recent search'
    })),
    ...[
      { id: 'intent-home-baker', displayValue: 'Home Bakers', queryValue: 'home baker', categoryId: 'food-restaurants', subcategoryId: 'bakeries', metaLabel: 'Intent shortcut' },
      { id: 'intent-tiffin', displayValue: 'Tiffin Services', queryValue: 'tiffin service', categoryId: 'food-restaurants', subcategoryId: 'tiffin-services', metaLabel: 'Intent shortcut' },
      { id: 'intent-hospital', displayValue: 'Hospitals Nearby', queryValue: 'hospital', categoryId: 'health-medical', subcategoryId: 'hospitals', metaLabel: 'Essential service' },
      { id: 'intent-clinic', displayValue: 'Clinics Nearby', queryValue: 'clinic', categoryId: 'health-medical', subcategoryId: 'clinics', metaLabel: 'Essential service' },
      { id: 'intent-bank', displayValue: 'Banks & ATM', queryValue: 'bank atm', metaLabel: 'Essential service' }
    ].map((suggestion) => ({
      ...suggestion,
      type: 'intent' as const
    })),
    ...BUSINESS_CATEGORIES.map((category) => ({
      id: `category-${category.id}`,
      type: 'category' as const,
      displayValue: category.name,
      queryValue: category.name,
      categoryId: category.id,
      metaLabel: 'Category'
    })),
    ...BUSINESS_SUBCATEGORIES.map((subcategory) => ({
      id: `subcategory-${subcategory.id}`,
      type: 'subcategory' as const,
      displayValue: subcategory.name,
      queryValue: subcategory.name,
      categoryId: subcategory.categoryId,
      subcategoryId: subcategory.id,
      metaLabel: 'Subcategory'
    })),
    ...nearbyCityLocalities.map((locality) => ({
      id: `locality-${locality.id}`,
      type: 'locality' as const,
      displayValue: locality.name,
      queryValue: locality.name.split(',')[0] || locality.name,
      localityId: locality.id,
      metaLabel: 'Nearby locality'
    })),
    ...approvedInLocality.map((business) => {
      const categoryLabel = getBusinessCategoryLabel(business);
      const subcategoryLabel = getBusinessSubcategoryLabel(business);
      const contextualLabel = subcategoryLabel && subcategoryLabel !== categoryLabel
        ? `${business.name} in ${subcategoryLabel}`
        : `${business.name} in ${categoryLabel}`;
      return {
        id: `business-${business.id}`,
        type: 'business' as const,
        displayValue: contextualLabel,
        queryValue: business.name,
        categoryId: business.categoryId || undefined,
        subcategoryId: business.subcategoryId || undefined,
        businessId: business.id,
        metaLabel: getBusinessRecognitionBadges(business)[0]?.label || 'Business',
      };
    }),
  ];
  const filteredSearchSuggestions = useMemo<SearchSuggestion[]>(
    () => filterSearchSuggestions(searchQuery, searchSuggestions),
    [searchQuery, searchSuggestions]
  );
  const topSearchSuggestion = filteredSearchSuggestions[0] || null;
  const shouldShowSearchSuggestions = (
    searchMode === 'keyword' &&
    isSearchInputFocused &&
    searchQuery.trim().length > 0 &&
    filteredSearchSuggestions.length > 0
  );
  const localityCommunityItems = cmsCommunityItems
    .filter((item) => selectedLocalityIds.includes(item.localityId))
    .filter((item) => {
      if (item.status === 'draft' || item.status === 'archived') return false;
      const publishAt = item.publishAt || item.createdAt;
      if (publishAt && Date.parse(publishAt) > Date.now()) return false;
      if (item.expireAt && Date.parse(item.expireAt) < Date.now()) return false;
      return true;
    })
    .sort((a, b) => Date.parse(b.publishAt || b.createdAt) - Date.parse(a.publishAt || a.createdAt));
  const communityTotalPages = Math.max(1, Math.ceil(localityCommunityItems.length / COMMUNITY_PAGE_SIZE));
  const safeCommunityPage = Math.min(communityPage, communityTotalPages);
  const pagedCommunityItems = localityCommunityItems.slice(
    (safeCommunityPage - 1) * COMMUNITY_PAGE_SIZE,
    safeCommunityPage * COMMUNITY_PAGE_SIZE
  );
  const activeSellerContacts = crmContacts.filter((contact) => contact.businessId === activeSellerBizId);
  const crmTotalPages = Math.max(1, Math.ceil(activeSellerContacts.length / CRM_PAGE_SIZE));
  const safeCrmPage = Math.min(crmPage, crmTotalPages);
  const pagedSellerContacts = activeSellerContacts.slice(
    (safeCrmPage - 1) * CRM_PAGE_SIZE,
    safeCrmPage * CRM_PAGE_SIZE
  );
  const noResultsSuggestedCategories = BUSINESS_CATEGORIES
    .map((category) => {
      const listingCount = approvedInLocality.filter((business) => business.categoryId === category.id).length;
      let score = listingCount;
      if (isCivicIntent(normalizedActiveSearch) && category.id === 'health-medical') score += 20;
      if (isHomeBusinessIntent(normalizedActiveSearch) && category.id === 'food-restaurants') score += 18;
      if (selectedCategory !== 'all' && category.id === selectedCategory) score -= 10;
      return { category, listingCount, score };
    })
    .filter((entry) => entry.listingCount > 0)
    .sort((a, b) => b.score - a.score || b.listingCount - a.listingCount)
    .slice(0, 4);
  const noResultsFallbackBusinesses = homepageSortedBusinesses
    .filter((business) => {
      if (isCivicIntent(normalizedActiveSearch)) return isEssentialCommunityService(business);
      if (isHomeBusinessIntent(normalizedActiveSearch)) return isHomeBasedBusiness(business);
      if (selectedCategory !== 'all') return business.categoryId === selectedCategory;
      return true;
    })
    .slice(0, 4);
  const activeMerchantLeads = adLeads.filter((lead) => lead.sellerBusinessId === activeSellerBizId);
  const merchantLeadsTotalPages = Math.max(1, Math.ceil(activeMerchantLeads.length / LEADS_PAGE_SIZE));
  const safeMerchantLeadsPage = Math.min(merchantLeadsPage, merchantLeadsTotalPages);
  const pagedMerchantLeads = activeMerchantLeads.slice(
    (safeMerchantLeadsPage - 1) * LEADS_PAGE_SIZE,
    safeMerchantLeadsPage * LEADS_PAGE_SIZE
  );
  const activeSellerWidgetLeads = adLeads.filter((lead) => lead.sellerBusinessId === userSession.sellerBusinessId);
  const sellerWidgetLeadsTotalPages = Math.max(1, Math.ceil(activeSellerWidgetLeads.length / LEADS_PAGE_SIZE));
  const safeSellerWidgetLeadsPage = Math.min(sellerWidgetLeadsPage, sellerWidgetLeadsTotalPages);
  const pagedSellerWidgetLeads = activeSellerWidgetLeads.slice(
    (safeSellerWidgetLeadsPage - 1) * LEADS_PAGE_SIZE,
    safeSellerWidgetLeadsPage * LEADS_PAGE_SIZE
  );
  const selectedBizReviews = selectedBiz ? reviews.filter((review) => review.businessId === selectedBiz.id) : [];
  const relatedSelectedBusinesses = selectedBiz
    ? businesses
      .filter((business) => (
        business.id !== selectedBiz.id &&
        business.status === 'approved' &&
        (
          business.localityId === selectedBiz.localityId ||
          business.categoryId === selectedBiz.categoryId ||
          (!!selectedBiz.subcategoryId && business.subcategoryId === selectedBiz.subcategoryId)
        )
      ))
      .map((business) => {
        let score = getBusinessRecommendedScore(
          business,
          `${getBusinessCategoryLabel(selectedBiz)} ${getBusinessSubcategoryLabel(selectedBiz)} ${selectedBiz.tags?.join(' ') || ''}`.trim(),
          'results'
        );
        if (business.localityId === selectedBiz.localityId) score += 18;
        if (business.areaId === selectedBiz.areaId) score += 24;
        if (business.categoryId === selectedBiz.categoryId) score += 20;
        if (selectedBiz.subcategoryId && business.subcategoryId === selectedBiz.subcategoryId) score += 34;
        return { business, score };
      })
      .sort((left, right) => right.score - left.score || right.business.rating - left.business.rating || left.business.name.localeCompare(right.business.name))
      .slice(0, 3)
      .map((entry) => entry.business)
    : [];
  const reviewsTotalPages = Math.max(1, Math.ceil(selectedBizReviews.length / REVIEWS_PAGE_SIZE));
  const safeReviewsPage = Math.min(reviewsPage, reviewsTotalPages);
  const pagedSelectedBizReviews = selectedBizReviews.slice(
    (safeReviewsPage - 1) * REVIEWS_PAGE_SIZE,
    safeReviewsPage * REVIEWS_PAGE_SIZE
  );
  const scopedPincodes = new Set([
    ...(savedPincode ? [savedPincode] : []),
    ...selectedLocalityMappedPincodes
  ]);
  const matchesDateWindow = (startDate?: string, endDate?: string) => {
    if (startDate && startDate > todayIso) return false;
    if (endDate && endDate < todayIso) return false;
    return true;
  };
  const matchesTargeting = (localityIds?: string[], pincodes?: string[], fallbackPincode?: string) => {
    const normalizedLocalityIds = localityIds || [];
    if (normalizedLocalityIds.length > 0 && !normalizedLocalityIds.some((id) => selectedLocalityIds.includes(id))) {
      return false;
    }
    const normalizedPincodes = pincodes || [];
    if (normalizedPincodes.length === 0) return true;
    return normalizedPincodes.some((pincode) => scopedPincodes.has(pincode) || (!!fallbackPincode && fallbackPincode === pincode));
  };
  const activeListingAds = cmsListingAds.filter((ad) => {
    if (!ad.isActive) return false;
    if (!['approved', 'live'].includes(ad.workflowStatus || 'draft')) return false;
    if (!matchesDateWindow(ad.startDate, ad.endDate)) return false;
    return matchesTargeting(ad.localityIds, ad.pincodes);
  });
  const adMatchesBusinessContext = (ad: ListingAd, candidates: Business[]) => {
    const adCategoryIds = ad.categoryIds || [];
    const adTags = (ad.tags || []).map((tag) => tag.toLowerCase());
    if (adCategoryIds.length === 0 && adTags.length === 0) return true;
    return candidates.some((business) => {
      const businessText = [
        business.name,
        business.description,
        business.categoryId,
        business.subcategoryId,
        getBusinessCategoryLabel(business),
        getBusinessSubcategoryLabel(business),
        ...(business.tags || [])
      ].join(' ').toLowerCase();
      return (
        adCategoryIds.includes(business.categoryId) ||
        adTags.some((tag) => tag && businessText.includes(tag))
      );
    });
  };
  const getAdsForBusinessContext = (candidates: Business[], ads: ListingAd[]) => (
    ads.filter((ad) => adMatchesBusinessContext(ad, candidates))
  );
  const activeCoupons = cmsCoupons.filter((coupon) => {
    const relatedBusiness = businesses.find((business) => business.id === coupon.businessId);
    if (coupon.isActive === false) return false;
    if (!matchesDateWindow(coupon.startDate, coupon.endDate || coupon.expiryDate)) return false;
    return matchesTargeting(
      coupon.localityIds && coupon.localityIds.length > 0 ? coupon.localityIds : (relatedBusiness ? [relatedBusiness.localityId] : []),
      coupon.pincodes,
      relatedBusiness?.pincode
    );
  });
  const activeHomepageLayout = useMemo(() => {
    const localityLayout = homepageLayouts.find((layout) => layout.localityId === currentLocality.id);
    if (localityLayout) return localityLayout;
    return homepageLayouts[0] || null;
  }, [homepageLayouts, currentLocality.id]);
  const activeHomepageSections = useMemo(() => {
    const sections = hasResolvedHomepagePayload
      ? resolvedHomepageSections
      : (activeHomepageLayout?.sections || []);
    return [...sections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((section) => section.status === 'active')
      .filter((section) => section.visible)
      .filter((section) => matchesDateWindow(section.startDate, section.endDate))
      .filter((section) => matchesTargeting(section.localityIds, section.pincodes));
  }, [activeHomepageLayout, hasResolvedHomepagePayload, resolvedHomepageSections, todayIso, activeLocalityId, savedPincode]);
  const quickCategoryIds = homepageDefaultsConfig?.searchShortcutCategoryIds?.length
    ? homepageDefaultsConfig.searchShortcutCategoryIds
    : ['food-restaurants', 'health-medical', 'home-services', 'beauty-wellness', 'shopping-retail', 'professional-services'];
  const iconToneByCategory: Record<string, { Icon: PortalIcon; iconClassName: string; bgClassName: string }> = {
    'food-restaurants': { Icon: Utensils, iconClassName: 'text-orange-500', bgClassName: 'bg-orange-50' },
    'health-medical': { Icon: BriefcaseMedical, iconClassName: 'text-blue-600', bgClassName: 'bg-blue-50' },
    'beauty-wellness': { Icon: Sparkles, iconClassName: 'text-pink-500', bgClassName: 'bg-pink-50' },
    'home-services': { Icon: Home, iconClassName: 'text-indigo-600', bgClassName: 'bg-indigo-50' },
    automotive: { Icon: Car, iconClassName: 'text-amber-500', bgClassName: 'bg-amber-50' },
    'shopping-retail': { Icon: ShoppingCart, iconClassName: 'text-green-600', bgClassName: 'bg-green-50' },
    'education-training': { Icon: GraduationCap, iconClassName: 'text-violet-600', bgClassName: 'bg-violet-50' },
    'event-services': { Icon: CalendarDays, iconClassName: 'text-purple-600', bgClassName: 'bg-purple-50' },
    'professional-services': { Icon: Megaphone, iconClassName: 'text-cyan-600', bgClassName: 'bg-cyan-50' },
    'repair-maintenance': { Icon: Wrench, iconClassName: 'text-slate-600', bgClassName: 'bg-slate-100' },
    'digital-technology': { Icon: TrendingUp, iconClassName: 'text-indigo-600', bgClassName: 'bg-indigo-50' }
  };
  const subcategoryToneById: Record<string, { Icon: PortalIcon; iconClassName: string; bgClassName: string }> = {
    restaurants: { Icon: Utensils, iconClassName: 'text-orange-500', bgClassName: 'bg-orange-50' },
    clinics: { Icon: Stethoscope, iconClassName: 'text-blue-600', bgClassName: 'bg-blue-50' },
    'dental-clinics': { Icon: HeartPulse, iconClassName: 'text-cyan-600', bgClassName: 'bg-cyan-50' },
    electricians: { Icon: Zap, iconClassName: 'text-amber-500', bgClassName: 'bg-amber-50' },
    bakeries: { Icon: CakeSlice, iconClassName: 'text-rose-500', bgClassName: 'bg-rose-50' },
    plumbers: { Icon: Wrench, iconClassName: 'text-sky-600', bgClassName: 'bg-sky-50' },
    'house-cleaning': { Icon: Users, iconClassName: 'text-emerald-600', bgClassName: 'bg-emerald-50' },
    gyms: { Icon: Dumbbell, iconClassName: 'text-rose-600', bgClassName: 'bg-rose-50' },
    'grocery-stores': { Icon: ShoppingCart, iconClassName: 'text-green-600', bgClassName: 'bg-green-50' },
    'tuition-centers': { Icon: GraduationCap, iconClassName: 'text-violet-600', bgClassName: 'bg-violet-50' },
    cafes: { Icon: Store, iconClassName: 'text-orange-500', bgClassName: 'bg-orange-50' },
    'car-service': { Icon: Car, iconClassName: 'text-amber-500', bgClassName: 'bg-amber-50' },
    'wedding-planners': { Icon: CalendarDays, iconClassName: 'text-purple-600', bgClassName: 'bg-purple-50' }
  };
  const heroQuickActions = (homepageDefaultsConfig?.heroQuickActions?.length
    ? homepageDefaultsConfig.heroQuickActions
    : [
        { label: 'Restaurants', categoryId: 'food-restaurants', subcategoryId: 'restaurants' },
        { label: 'Doctors', categoryId: 'health-medical', subcategoryId: 'clinics' },
        { label: 'Electricians', categoryId: 'home-services', subcategoryId: 'electricians' },
        { label: 'Home Bakers', categoryId: 'food-restaurants', subcategoryId: 'bakeries' },
        { label: 'Plumbers', categoryId: 'home-services', subcategoryId: 'plumbers' },
        { label: 'Maid Services', categoryId: 'home-services', subcategoryId: 'house-cleaning' }
      ])
    .map((shortcut) => {
      const subcategoryTone = shortcut.subcategoryId ? subcategoryToneById[shortcut.subcategoryId] : undefined;
      const categoryTone = iconToneByCategory[shortcut.categoryId] || { Icon: Grid3X3, iconClassName: 'text-indigo-600', bgClassName: 'bg-indigo-50' };
      const tone = subcategoryTone || categoryTone;
      const categoryLabel = getCategoryById(shortcut.categoryId)?.name || shortcut.categoryId;
      const subcategoryLabel = shortcut.subcategoryId ? (getSubcategoryById(shortcut.subcategoryId)?.name || shortcut.subcategoryId) : '';
      return {
        label: shortcut.label || subcategoryLabel || categoryLabel,
        categoryId: shortcut.categoryId,
        subcategoryId: shortcut.subcategoryId,
        Icon: tone.Icon,
        iconClassName: tone.iconClassName,
        bgClassName: tone.bgClassName,
      };
    })
    .filter((shortcut) => shortcut.categoryId);
  const getSectionBusinessPool = (section: HomepageSection) => {
    const resolvedBusinessIds = resolvedSectionBusinessIdsBySection[section.id] || [];
    if (resolvedBusinessIds.length > 0) {
      return resolvedBusinessIds
        .map((businessId) => homepageSortedBusinesses.find((business) => business.id === businessId))
        .filter(Boolean) as Business[];
    }

    const scopedBusinesses = homepageSortedBusinesses
      .filter((business) => business.status === 'approved')
      .filter((business) => !section.categoryId || business.categoryId === section.categoryId)
      .filter((business) => !section.subcategoryId || business.subcategoryId === section.subcategoryId);

    if (section.listingSourceMode === 'manual' && (section.pinnedBusinessIds || []).length > 0) {
      return (section.pinnedBusinessIds || [])
        .map((businessId) => scopedBusinesses.find((business) => business.id === businessId))
        .filter(Boolean) as Business[];
    }

    if (section.sectionType === 'featured_businesses') {
      return scopedBusinesses.filter((business) => business.featured);
    }

    if (section.sectionType === 'verified_business_grid') {
      return scopedBusinesses.filter((business) => !business.featured);
    }

    return scopedBusinesses;
  };
  const getRotatedItems = <T,>(items: T[], visibleSlots: number, autoRotate = true) => {
    if (items.length <= visibleSlots) return items;
    if (!autoRotate) return items.slice(0, visibleSlots);
    const startIndex = homepageRotationTick % items.length;
    return Array.from({ length: visibleSlots }, (_, offset) => items[(startIndex + offset) % items.length]);
  };
  const getConfiguredCategories = (section: HomepageSection) => {
    const configured = (section.categoryIds || []).map((categoryId) => getCategoryById(categoryId)).filter(Boolean) as typeof BUSINESS_CATEGORIES;
    return configured.length > 0 ? configured : BUSINESS_CATEGORIES.slice(0, section.maxItems || 8);
  };
  const getDesktopCardCount = (section: HomepageSection, fallback: number) => (
    section.desktopCardCount || section.visibleSlots || fallback
  );
  const getMobileCardCount = (section: HomepageSection, fallback = 2) => (
    section.mobileCardCount || fallback
  );
  const getMobileDisplayMode = (section: HomepageSection) => (
    section.mobileDisplayMode || (section.sectionType === 'verified_business_grid' ? 'stack' : 'carousel')
  );
  const getDesktopGridCount = (_requestedCount: number, itemCount: number) => (
    Math.max(1, Math.min(Math.max(1, itemCount), 5))
  );
  const getDesktopSectionItems = <T,>(items: T[], sectionMaxItems: number) => (
    items.slice(0, Math.min(sectionMaxItems, 10))
  );
  const getSwipeDotCount = (itemCount: number, visibleCount: number) => (
    Math.max(1, Math.ceil(itemCount / Math.max(1, visibleCount)))
  );
  const getSwipeDotActiveIndex = (itemCount: number, visibleCount: number) => {
    if (itemCount <= visibleCount) return 0;
    const pageCount = getSwipeDotCount(itemCount, visibleCount);
    return Math.min(pageCount - 1, Math.floor((homepageRotationTick % itemCount) / Math.max(1, visibleCount)));
  };

  const getBusinessAreaName = (biz: Business) => getBusinessAreaNameService(localities, biz);

  function getBusinessCategoryLabel(biz: Business) {
    return getBusinessCategoryLabelService(biz);
  }

  function getBusinessSubcategoryLabel(biz: Business) {
    return getBusinessSubcategoryLabelService(biz);
  }

  function normalizeSearchText(value: string) {
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
      [/डॉक्टर|डाक्टर|डॉ/g, 'doctor'],
      [/अस्पताल|हॉस्पिटल|रुग्णालय/g, 'hospital'],
      [/क्लिनिक|दवाखाना/g, 'clinic'],
      [/ब्लड बैंक/g, 'blood bank'],
      [/पुलिस|पोलीस/g, 'police'],
      [/बैंक|एटीएम/g, 'bank atm'],
      [/घरगुती|घर का खाना|घरीलू खाना/g, 'home food'],
      [/टिफिन|डब्बा/g, 'tiffin'],
      [/प्लंबर|नल/g, 'plumber'],
      [/इलेक्ट्रीशियन|बिजली/g, 'electrician'],
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
  }

  function isHomeBusinessIntent(query: string) {
    return isHomeBusinessIntentService(query);
  }

  function isCivicIntent(query: string) {
    return isCivicIntentService(query);
  }

  function isHomeBasedBusiness(biz: Business) {
    return isHomeBasedBusinessService(localities, biz);
  }

  function isWomenLedHomeBusiness(biz: Business) {
    return isWomenLedHomeBusinessService(localities, biz);
  }

  function isEssentialCommunityService(biz: Business) {
    return isEssentialCommunityServiceService(localities, biz);
  }

  function getBusinessRecognitionBadges(biz: Business) {
    const badges: Array<{ label: string; className: string; Icon: PortalIcon }> = [];
    if (isWomenLedHomeBusiness(biz)) {
      badges.push({
        label: 'Women-led Home Business',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
        Icon: Home
      });
    } else if (isHomeBasedBusiness(biz)) {
      badges.push({
        label: 'Home Business',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        Icon: ChefHat
      });
    }
    if (isEssentialCommunityService(biz)) {
      badges.push({
        label: 'Essential Service',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        Icon: HeartPulse
      });
    }
    return badges.slice(0, 2);
  }

  function renderBusinessRecognitionBadges(biz: Business, compact = false) {
    const badges = getBusinessRecognitionBadges(biz);
    if (badges.length === 0) return null;
    return (
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'pt-1'}`}>
        {badges.map(({ label, className, Icon }) => (
          <span
            key={`${biz.id}-${label}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold ${compact ? 'text-[10px]' : 'text-[11px]'} ${className}`}
          >
            <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            <span>{label}</span>
          </span>
        ))}
      </div>
    );
  }

  function matchesBusinessSearch(biz: Business, query: string) {
    return matchesBusinessSearchService(localities, biz, query);
  }

  function getBusinessRecommendedScore(biz: Business, query: string, pageType: 'homepage' | 'results') {
    return getBusinessRecommendedScoreService({
      business: biz,
      query,
      pageType,
      localities,
      currentLocalityId: currentLocality.id,
      browsingLocalityIds,
      resolvedSponsoredBusinessIds
    });
  }

  function dedupeBusinessesForExperience(items: Business[], query: string, pageType: 'homepage' | 'results') {
    return dedupeBusinessesForExperienceService(items, {
      query,
      pageType,
      localities,
      currentLocalityId: currentLocality.id,
      browsingLocalityIds,
      resolvedSponsoredBusinessIds
    });
  }

  const applySearchSuggestionPreview = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.queryValue);
    if (suggestion.categoryId) {
      setSelectedCategory(suggestion.categoryId);
      setSelectedSubcategory(suggestion.subcategoryId || 'all');
      return;
    }
    if (suggestion.subcategoryId) {
      const parentCategoryId = getSubcategoryById(suggestion.subcategoryId)?.categoryId || 'all';
      setSelectedCategory(parentCategoryId);
      setSelectedSubcategory(suggestion.subcategoryId);
    }
  };

  const handleSearchInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorAtEnd = (event.currentTarget.selectionStart ?? event.currentTarget.value.length) === event.currentTarget.value.length;
    const normalizedTypedQuery = normalizeSearchText(searchQuery);
    const normalizedTopQuery = normalizeSearchText(topSearchSuggestion?.queryValue || '');
    const canCompleteTopSuggestion = Boolean(
      topSearchSuggestion &&
      cursorAtEnd &&
      normalizedTypedQuery &&
      normalizedTopQuery &&
      normalizedTopQuery !== normalizedTypedQuery &&
      normalizedTopQuery.startsWith(normalizedTypedQuery)
    );

    if ((event.key === 'Tab' || event.key === 'ArrowRight') && canCompleteTopSuggestion) {
      event.preventDefault();
      applySearchSuggestionPreview(topSearchSuggestion!);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      openResultsPage();
    }
  };

  const applySearchSuggestion = (suggestion: SearchSuggestion) => {
    const nextCategory = suggestion.categoryId || 'all';
    const nextSubcategory = suggestion.subcategoryId || 'all';
    const nextQuery = suggestion.queryValue;
    setSearchQuery(nextQuery);
    setSelectedCategory(nextCategory);
    setSelectedSubcategory(nextSubcategory);
    setIsSearchInputFocused(false);
    onLogAuditEvent?.(
      'search',
      'Selected autosuggest suggestion',
      `Type: "${suggestion.type}" | Value: "${suggestion.displayValue}" | Locality: "${currentLocality.id}"`
    );

    if (suggestion.type === 'locality' && suggestion.localityId) {
      onLocalityChange(suggestion.localityId);
      return;
    }

    if (suggestion.businessId) {
      rememberRecentSearch(nextQuery);
      const business = businesses.find((entry) => entry.id === suggestion.businessId);
      if (business) {
        openBusinessDetails(business);
        return;
      }
    }

    if (suggestion.type === 'recent' || suggestion.type === 'intent' || suggestion.type === 'category' || suggestion.type === 'subcategory') {
      openResultsFromSearch(nextCategory, nextSubcategory, nextQuery);
    }
  };

  const renderSearchSuggestions = () => {
    if (!shouldShowSearchSuggestions) return null;
    return (
      <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {filteredSearchSuggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              applySearchSuggestion(suggestion);
            }}
            className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate font-medium">{suggestion.displayValue}</div>
                {index === 0 && (
                  <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                    Tab to complete
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                {suggestion.metaLabel || (
                  suggestion.type === 'business'
                    ? 'Business'
                    : suggestion.type === 'locality'
                      ? 'Nearby locality'
                      : suggestion.type === 'recent'
                        ? 'Recent search'
                    : suggestion.type === 'subcategory'
                      ? 'Subcategory'
                      : suggestion.type === 'intent'
                        ? 'Intent shortcut'
                        : 'Category'
                )}
              </div>
            </div>
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
          </button>
        ))}
      </div>
    );
  };

  const activeSellerBusiness = businesses.find((business) => business.id === activeSellerBizId) || null;
  const activeSellerCoupons = coupons.filter((coupon) => coupon.businessId === activeSellerBizId);
  const activeSellerReviews = reviews.filter((review) => review.businessId === activeSellerBizId);
  const buyerSavedBusinesses = savedBusinessIds
    .map((businessId) => businesses.find((business) => business.id === businessId) || null)
    .filter((business): business is Business => Boolean(business));
  const buyerComparedBusinesses = compareBusinessIds
    .map((businessId) => businesses.find((business) => business.id === businessId) || null)
    .filter((business): business is Business => Boolean(business));
  const buyerViewedBusinesses = viewedBusinessIds
    .map((businessId) => businesses.find((business) => business.id === businessId) || null)
    .filter((business): business is Business => Boolean(business));
  const buyerSubmittedReviews = reviews
    .filter((review) => (
      (userSession.userPhone && review.userPhone === userSession.userPhone) ||
      (userSession.userName && review.userName === userSession.userName)
    ))
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const buyerRecentActivity = buyerActivityEvents
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8);
  const isSellerWorkspaceLocked = userSession.role === 'seller' && Boolean(userSession.sellerBusinessId);
  const handleSaveBusinessClick = (biz: Business, event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleSavedBusiness(biz.id);
  };
  const isBusinessSaved = (businessId: string) => savedBusinessIds.includes(businessId);
  const handleCompareBusinessClick = (biz: Business, event: React.MouseEvent) => {
    event.stopPropagation();
    const result = onToggleComparedBusiness(biz.id);
    if (!result.allowed && result.reason) {
      alert(result.reason);
    }
  };
  const isBusinessCompared = (businessId: string) => compareBusinessIds.includes(businessId);

  const openBusinessDirections = (biz: Business, e: React.MouseEvent) => {
    e.stopPropagation();
    const destination = biz.gpsCoordinates
      ? `${biz.gpsCoordinates.lat},${biz.gpsCoordinates.lng}`
      : `${biz.address}, ${getBusinessAreaName(biz)}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`, '_blank', 'noopener,noreferrer');
  };
  const openBusinessDirectionsDirect = (biz: Business) => {
    const destination = biz.gpsCoordinates
      ? `${biz.gpsCoordinates.lat},${biz.gpsCoordinates.lng}`
      : `${biz.address}, ${getBusinessAreaName(biz)}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`, '_blank', 'noopener,noreferrer');
  };

  const handlePrimaryBusinessAction = (biz: Business, e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewedBusinessIds.includes(biz.id) && biz.phone) {
      window.location.href = `tel:${biz.phone}`;
      return;
    }
    initContactUnlockFlow(biz, e);
  };

  const handleBusinessWhatsappAction = (biz: Business, e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneDigits = (biz.phone || '').replace(/\D/g, '').slice(-10);
    if (!phoneDigits) {
      openBusinessDetails(biz);
      return;
    }
    onLogAuditEvent?.(
      'contact_view',
      'Opened WhatsApp intent',
      `Business: "${biz.name}" | Locality: "${biz.localityId}" | Phone suffix: "${phoneDigits.slice(-4)}"`
    );
    window.open(
      `https://wa.me/91${phoneDigits}?text=${encodeURIComponent(`Hi ${biz.name}, I found your service on Localisy.`)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const renderCompactBusinessRow = (
    biz: Business,
    options?: {
      highlightClass?: string;
      badgeLabel?: string;
      badgeClassName?: string;
      showImage?: boolean;
    }
  ) => {
    const categoryLabel = getBusinessCategoryLabel(biz);
    const areaLabel = getBusinessAreaName(biz);
    const hasPhone = Boolean((biz.phone || '').replace(/\D/g, '').slice(-10));
    const showImage = options?.showImage === true;
    return (
      <div
        key={biz.id}
        onClick={() => openBusinessDetails(biz)}
        className={`md:hidden w-full min-w-0 overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition active:scale-[0.99] ${options?.highlightClass || 'border-slate-200'}`}
      >
        <div className="flex gap-3">
          {showImage && (
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img
                src={getBusinessImageUrl(biz)}
                alt={biz.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
                }}
                className={`h-full w-full ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-2.5'}`}
              />
              {options?.badgeLabel && (
                <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${options.badgeClassName || 'bg-slate-900 text-white'}`}>
                  {options.badgeLabel}
                </span>
              )}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-slate-900">
                  {biz.name}
                </h4>
                <div className="truncate text-xs font-medium text-slate-500">
                  {categoryLabel}
                </div>
                {!showImage && options?.badgeLabel && (
                  <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ${options.badgeClassName || 'bg-slate-900 text-white'}`}>
                    {options.badgeLabel}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => handleSaveBusinessClick(biz, e)}
                className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition ${
                  isBusinessSaved(biz.id)
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
                title="Save business"
              >
                <Heart className={`h-4 w-4 ${isBusinessSaved(biz.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {renderBusinessRecognitionBadges(biz, true)}
            <button
              type="button"
              onClick={(e) => handleCompareBusinessClick(biz, e)}
              className={`inline-flex w-full items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isBusinessCompared(biz.id)
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{isBusinessCompared(biz.id) ? 'Added to Compare' : 'Compare'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600" title="Google Ratings">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{biz.rating.toFixed(1)}</span>
              </span>
              <span className="truncate">• {areaLabel}</span>
            </div>

            {hasPhone ? (
              <button
                type="button"
                onClick={(e) => handlePrimaryBusinessAction(biz, e)}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openBusinessDetails(biz);
                }}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Details</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBusinessCard = (biz: Business, badgeLabel?: string, cardsPerView = 2, showImage = false) => {
    const hasPhone = Boolean((biz.phone || '').replace(/\D/g, '').slice(-10));
    return (
      <div
        key={biz.id}
        onClick={() => openBusinessDetails(biz)}
        className="md:hidden min-w-0 flex-shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        style={{
          width: cardsPerView <= 1
            ? '100%'
            : `calc((100% - ${(cardsPerView - 1) * 12}px) / ${cardsPerView})`,
          minWidth: cardsPerView <= 1 ? '100%' : `calc((100% - ${(cardsPerView - 1) * 12}px) / ${cardsPerView})`
        }}
      >
        {showImage && (
          <div className="relative h-28 bg-slate-100">
            <img
              src={getBusinessImageUrl(biz)}
              alt={biz.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
              }}
              className={`h-full w-full ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-4'}`}
            />
            {(badgeLabel || biz.isSponsored) && (
              <span className="absolute left-2 top-2 rounded-md bg-indigo-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                {badgeLabel || 'Sponsored'}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => handleSaveBusinessClick(biz, e)}
              className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
                isBusinessSaved(biz.id)
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-white/90 text-slate-600'
              }`}
              title="Save business"
            >
              <Heart className={`h-4 w-4 ${isBusinessSaved(biz.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
        <div className="space-y-1.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-bold text-slate-950">{biz.name}</h4>
            {!showImage && (
              <button
                type="button"
                onClick={(e) => handleSaveBusinessClick(biz, e)}
                className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border shadow-sm transition ${
                  isBusinessSaved(biz.id)
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
                title="Save business"
              >
                <Heart className={`h-4 w-4 ${isBusinessSaved(biz.id) ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          <div className="truncate text-xs font-medium text-slate-500">
            {getBusinessCategoryLabel(biz)}
          </div>
          {renderBusinessRecognitionBadges(biz, true)}
          <button
            type="button"
            onClick={(e) => handleCompareBusinessClick(biz, e)}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              isBusinessCompared(biz.id)
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>{isBusinessCompared(biz.id) ? 'Added to Compare' : 'Compare'}</span>
          </button>
          {!showImage && (badgeLabel || biz.isSponsored) && (
            <span className="inline-flex rounded-md bg-indigo-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
              {badgeLabel || 'Sponsored'}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {biz.rating.toFixed(1)}
            </span>
            <span className="truncate text-slate-500">{getBusinessAreaName(biz)}</span>
          </div>
          {hasPhone ? (
            <button
              type="button"
              onClick={(e) => handlePrimaryBusinessAction(biz, e)}
              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openBusinessDetails(biz);
              }}
              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Details</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const shouldShowListingResultImage = (biz: Business) => biz.isSponsored === true;

  const handleListingAdAction = (ad: ListingAd) => {
    onTrackListingAdInteraction?.({
      adId: ad.id,
      type: 'click',
      context: ad.placementKey || (isResultsPage ? 'listing_results' : 'homepage')
    });
    if (ad.actionType === 'landing_page') {
      if (ad.targetUrl) {
        window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (ad.actionType === 'landing_listing') {
      if (!ad.targetBusinessId) return;
      const target = businesses.find((biz) => biz.id === ad.targetBusinessId);
      if (target) {
        setSelectedBiz(target);
      }
      return;
    }
    setLeadPincode(savedPincode || leadPincode);
    setActiveLeadAd(ad);
  };

  const handleAdLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadAd) return;
    const mobile = leadMobile.replace(/\D/g, '');
    if (!leadName.trim() || mobile.length < 10 || !/^\d{6}$/.test(leadPincode)) {
      alert('Please enter valid lead details (Name, Mobile, and 6-digit Pincode).');
      return;
    }
    onSubmitAdLead?.({
      adId: activeLeadAd.id,
      sellerBusinessId: activeLeadAd.sellerBusinessId,
      localityId: currentLocality.id,
      name: leadName.trim(),
      mobile: mobile.slice(-10),
      pincode: leadPincode
    });
    onTrackListingAdInteraction?.({
      adId: activeLeadAd.id,
      type: 'lead',
      context: activeLeadAd.placementKey || (isResultsPage ? 'listing_results' : 'homepage')
    });
    setLeadName('');
    setLeadMobile('');
    setLeadPincode(savedPincode || leadPincode);
    setActiveLeadAd(null);
    alert('Thank you! Your details were submitted to the seller and platform team.');
  };

  const renderDesktopBusinessTile = (biz: Business, accentClassName = 'border-slate-200', badgeLabel?: string, showImage = false) => {
    const hasPhone = Boolean((biz.phone || '').replace(/\D/g, '').slice(-10));
    return (
      <div
        key={biz.id}
        onClick={() => openBusinessDetails(biz)}
        className={`hidden h-full w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:flex md:flex-col ${accentClassName}`}
      >
        {showImage && (
          <div className="relative">
            <img
              src={getBusinessImageUrl(biz)}
              alt={biz.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
              }}
              className={`h-40 w-full border-b border-slate-200 bg-slate-100 ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-4'}`}
            />
            {(badgeLabel || biz.isSponsored) && (
              <span className="absolute left-2 top-2 rounded-md bg-indigo-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                {badgeLabel || 'Sponsored'}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => handleSaveBusinessClick(biz, e)}
              className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur ${
                isBusinessSaved(biz.id)
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-white/90 text-slate-600'
              }`}
              title="Save business"
            >
              <Heart className={`h-4 w-4 ${isBusinessSaved(biz.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-500">
              {getBusinessCategoryLabel(biz)}
            </span>
            {!showImage && (badgeLabel || biz.isSponsored) && (
              <span className="rounded-md bg-indigo-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                {badgeLabel || 'Sponsored'}
              </span>
            )}
            {biz.verifiedBadge && (
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
            )}
          </div>
          <h4 className="line-clamp-2 min-h-[2.75rem] break-words text-sm font-bold leading-5 text-slate-900 lg:text-base">{biz.name}</h4>
          {renderBusinessRecognitionBadges(biz, true)}
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600" title="Google Ratings">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {biz.rating.toFixed(1)}
            </span>
            <span className="text-slate-300">|</span>
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">{getBusinessAreaName(biz)}</span>
          </div>
          {!showImage && (
            <button
              type="button"
              onClick={(e) => handleSaveBusinessClick(biz, e)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${
                isBusinessSaved(biz.id)
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
              title="Save business"
            >
              <Heart className={`h-4 w-4 ${isBusinessSaved(biz.id) ? 'fill-current' : ''}`} />
            </button>
          )}
          {hasPhone ? (
            <button
              type="button"
              onClick={(e) => handlePrimaryBusinessAction(biz, e)}
              className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              title="Call business"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openBusinessDetails(biz);
              }}
              className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Details</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTextBusinessStripCard = (biz: Business, options?: { stack?: boolean; cardsPerView?: number }) => {
    const hasPhone = Boolean((biz.phone || '').replace(/\D/g, '').slice(-10));
    const subcategoryLabel = getBusinessSubcategoryLabel(biz);
    const experienceLabel = biz.experienceYears ? `${biz.experienceYears} Years Exp` : 'Trusted Local Pro';
    const localityLabel = getBusinessAreaName(biz);
    const cardsPerView = options?.cardsPerView || 2;

    return (
      <div
        key={biz.id}
        onClick={() => openBusinessDetails(biz)}
        className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          options?.stack ? 'h-full w-full min-w-0' : 'min-w-0 flex-shrink-0 snap-start'
        }`}
        style={options?.stack ? undefined : {
          width: cardsPerView <= 1
            ? '100%'
            : `calc((100% - ${(cardsPerView - 1) * 16}px) / ${cardsPerView})`,
          minWidth: cardsPerView <= 1
            ? '100%'
            : `calc((100% - ${(cardsPerView - 1) * 16}px) / ${cardsPerView})`
        }}
      >
        <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{biz.rating.toFixed(1)}</span>
        </div>
        <h4 className={`mt-4 break-words font-bold text-slate-950 ${options?.stack ? 'line-clamp-2 min-h-[3.25rem] text-lg leading-6' : 'text-xl leading-7'}`}>{biz.name}</h4>
        <p className="mt-2 line-clamp-2 break-words text-sm font-medium text-slate-600">
          {subcategoryLabel}
          <span className="mx-2 text-slate-300">•</span>
          {(biz.tags || []).slice(0, 1)[0] || 'Nearby'}
        </p>
        <p className="mt-2 line-clamp-2 break-words text-sm text-slate-500">
          {localityLabel}
          <span className="mx-2 text-slate-300">•</span>
          {experienceLabel}
        </p>
        {options?.stack ? (
          hasPhone ? (
            <button
              type="button"
              onClick={(e) => handlePrimaryBusinessAction(biz, e)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-700"
              title="Call business"
            >
              <Phone className="h-4 w-4" />
              <span className="truncate">Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openBusinessDetails(biz);
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"
            >
              <ExternalLink className="h-4 w-4 text-indigo-600" />
              <span className="truncate">Details</span>
            </button>
          )
        ) : hasPhone ? (
          <button
            type="button"
            onClick={(e) => handlePrimaryBusinessAction(biz, e)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-700"
            title="Call business"
          >
            <Phone className="h-4 w-4" />
            <span className="truncate">Call</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openBusinessDetails(biz);
            }}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"
          >
            <ExternalLink className="h-4 w-4 text-indigo-600" />
            <span className="truncate">Details</span>
          </button>
        )}
      </div>
    );
  };

  const handleConfiguredCta = (
    ctaType: HomepageSection['ctaType'] | HeroBanner['ctaType'] | undefined,
    ctaTarget: string | undefined,
    fallbackLabel = 'Submit'
  ) => {
    if (!ctaType || ctaType === 'none') return;
    if (ctaType === 'landing_page') {
      if (ctaTarget) {
        window.open(ctaTarget, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (ctaType === 'landing_listing') {
      if (!ctaTarget) return;
      const targetBusiness = businesses.find((biz) => biz.id === ctaTarget);
      if (targetBusiness) {
        openBusinessDetails(targetBusiness);
      }
      return;
    }
    if (ctaType === 'lead_form') {
      setLeadPincode(savedPincode || leadPincode);
      setActiveLeadAd({
        id: `cta_lead_${Date.now()}`,
        title: fallbackLabel,
        description: 'Lead capture',
        badge: 'Lead Form',
        ctaText: fallbackLabel,
        backgroundColor: '#4f46e5',
        startDate: todayIso,
        endDate: todayIso,
        actionType: 'lead_form',
        sellerBusinessId: ctaTarget || undefined,
        targetBusinessId: ctaTarget || undefined,
        localityIds: [currentLocality.id],
        isActive: true
      });
      return;
    }
    setSelectedCategory(ctaTarget || 'all');
    setSelectedSubcategory('all');
    setSelectedBiz(null);
    pushHistoryIfNeeded(buildCategoryRoutePath(ctaTarget || 'all'));
  };

  const renderSectionHeader = (
    title: string,
    subtitle?: string,
    showViewAll?: boolean,
    onViewAll?: () => void
  ) => (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {showViewAll && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View All
        </button>
      )}
    </div>
  );
  const renderHeroCategoryCard = (
    item: {
      label: string;
      categoryId: string;
      subcategoryId: string;
      Icon: PortalIcon;
      iconClassName: string;
      bgClassName: string;
    },
    compact = false
  ) => {
    const Icon = item.Icon;
    return (
      <button
        key={`${item.categoryId}-${item.subcategoryId}`}
        type="button"
        onClick={() => handleCategoryShortcut(item.categoryId, item.subcategoryId)}
        className={`min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 ${
          compact ? 'px-2 py-3 text-center' : 'flex flex-col items-center gap-2 px-2.5 py-2 text-center'
        }`}
      >
        <span className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${item.bgClassName}`}>
          <Icon className={`h-4 w-4 ${item.iconClassName}`} />
        </span>
        <span className={`${compact ? 'mt-2 block text-[11px] font-medium' : 'text-[11px] font-medium'} leading-tight text-slate-700 whitespace-normal break-words`}>
          {item.label}
        </span>
      </button>
    );
  };

  const renderHomepageSection = (section: HomepageSection) => {
    const sectionKey = `${section.sectionType}-${section.id}`;
    const sectionMaxItems = ['featured_businesses', 'business_shelf', 'text_business_strip', 'verified_business_grid'].includes(section.sectionType)
      ? Math.min(section.maxItems || 10, 10)
      : section.maxItems || 6;

    if (section.sectionType === 'hero_banner') {
      const heroTitle = activeHeroSlide?.title || `Discover Trusted Businesses in ${selectedLocalityNames || currentLocality.name}`;
      const heroSubtitle = activeHeroSlide?.subtitle || 'Restaurants, home kitchens, services, professionals and more.';
      const heroCtaLabel = activeHeroSlide?.ctaLabel || section.ctaLabel || 'Explore Businesses';
      const heroCtaType = activeHeroSlide?.ctaType || section.ctaType;
      const heroCtaTarget = activeHeroSlide?.ctaTarget || section.ctaTarget || 'all';
      return (
        <section key={sectionKey} className="relative w-full min-w-0 overflow-hidden rounded-[26px] bg-white shadow-sm md:min-h-[400px]">
          <div className="absolute inset-y-0 right-0 hidden w-[62%] md:block">
            <img
              src={carouselImages[carouselIndex]}
              alt={currentLocality.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/10" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/90 via-white/30 to-transparent" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_72%_28%,rgba(99,102,241,0.12),transparent_32%)]" />
          <div className="relative z-10 p-4 md:p-8 lg:p-10">
            <div className="w-full min-w-0 max-w-[660px] space-y-4 md:space-y-5">
              <div className="md:hidden overflow-hidden rounded-2xl">
                <img
                  src={carouselImages[carouselIndex]}
                  alt={currentLocality.name}
                  className="h-44 w-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <h1 className="max-w-full whitespace-pre-line break-words text-[2rem] font-extrabold leading-[1.08] text-slate-950 md:max-w-xl md:text-5xl">
                  {heroTitle}
                </h1>
                <p className="max-w-full text-sm font-medium leading-6 text-slate-600 md:max-w-lg md:text-base">
                  {heroSubtitle}
                </p>
                {heroCtaType && heroCtaType !== 'none' && (
                  <button
                    type="button"
                    onClick={() => handleConfiguredCta(heroCtaType, heroCtaTarget, heroCtaLabel)}
                    className="inline-flex max-w-full items-center justify-center self-start rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    {heroCtaLabel}
                  </button>
                )}
              </div>

              <div id="public-listing-search" className="rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200/80 scroll-mt-24">
                <div className="grid grid-cols-[minmax(0,1fr)_56px] gap-2 md:grid-cols-[minmax(0,1fr)_190px_112px]">
                  <label className="relative block min-w-0">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="public-listing-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchInputFocused(true)}
                      onBlur={() => window.setTimeout(() => setIsSearchInputFocused(false), 120)}
                      onKeyDown={handleSearchInputKeyDown}
                      placeholder="Search businesses, services..."
                      className="h-12 w-full rounded-xl border border-transparent bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-200 focus:bg-indigo-50/30"
                    />
                    {renderSearchSuggestions()}
                  </label>
                  <div
                    className="hidden h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 md:inline-flex"
                    title="Selected locality"
                  >
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span className="truncate">{selectedLocalityNames || currentLocality.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openResultsPage}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden md:inline">Search</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pb-1 md:hidden">
                {heroQuickActions.slice(0, 5).map((item) => renderHeroCategoryCard(item, true))}
                <button
                  type="button"
                  onClick={() => setShowAllCategoriesModal(true)}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                >
                  <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <Grid3X3 className="h-4 w-4 text-indigo-600" />
                  </span>
                  <span className="mt-2 block text-[11px] font-bold leading-tight text-slate-800">
                    View All
                  </span>
                </button>
              </div>

              <div className="hidden grid-cols-6 gap-3 pb-1 md:grid">
                {heroQuickActions.slice(0, 5).map((item) => renderHeroCategoryCard(item))}
                <button
                  type="button"
                  onClick={() => setShowAllCategoriesModal(true)}
                  className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-[11px] font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                >
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <Grid3X3 className="h-4 w-4 text-indigo-600" />
                  </span>
                  <span className="min-w-0 whitespace-normal break-words leading-tight">View All</span>
                </button>
              </div>

            </div>

            {heroStatCards.length > 0 && (
            <div className="absolute right-8 top-8 hidden w-[210px] space-y-3 lg:block">
              {heroStatCards.map((stat) => {
                const Icon = stat.Icon;
                return (
                  <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg backdrop-blur">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.className}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-lg font-extrabold text-slate-950">{stat.value}</div>
                      <div className="text-[11px] font-semibold text-slate-500">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </section>
      );
    }

    if (section.sectionType === 'search_discovery') {
      if (activeHomepageSections.some((homepageSection) => homepageSection.sectionType === 'hero_banner')) return null;
      return (
        <section key={sectionKey} id="public-listing-search" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24">
          {renderSectionHeader(section.title, section.subtitle)}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="public-listing-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchInputFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsSearchInputFocused(false), 120)}
                  onKeyDown={handleSearchInputKeyDown}
                  placeholder="Search businesses, services, products..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {renderSearchSuggestions()}
              </div>
              <select
                id="public-category-filter"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('all');
                  setIsResultsPage(true);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={selectedSubcategory}
                disabled={selectedCategory === 'all'}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value);
                  setIsResultsPage(true);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="all">All Subcategories</option>
                {getSubcategoriesForCategory(selectedCategory).map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickCategoryIds.map((categoryId) => {
                const category = getCategoryById(categoryId);
                if (!category) return null;
                const active = selectedCategory === categoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                  onClick={() => {
                    openResultsForCategory(category.id);
                  }}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (section.sectionType === 'emergency_grid') {
      const emergencyCategories = getConfiguredCategories(section).slice(0, sectionMaxItems);
      const emergencyDotCount = getSwipeDotCount(emergencyCategories.length, 3);
      return (
        <section key={sectionKey} className="rounded-2xl border border-rose-100 bg-rose-50/45 p-4 shadow-sm md:p-5">
          {renderSectionHeader(section.title, section.subtitle, section.showViewAll, () => {
            setViewAllModal({
              kind: 'emergency',
              title: section.title,
              items: getConfiguredCategories(section)
            });
          })}
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
            {emergencyCategories.map((category) => {
              const tone = iconToneByCategory[category.id] || { Icon: Siren, iconClassName: 'text-rose-600', bgClassName: 'bg-rose-50' };
              const Icon = tone.Icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    handleCategoryShortcut(category.id);
                  }}
                  className="min-w-[122px] rounded-xl border border-rose-100 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                >
                  <span className={`mx-auto mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl ${tone.bgClassName}`}>
                    <Icon className={`h-6 w-6 ${tone.iconClassName}`} />
                  </span>
                  <div className="text-xs font-extrabold text-slate-900">{category.name.replace(' & ', ' ')}</div>
                </button>
              );
            })}
          </div>
          <SwipeDots totalDots={emergencyDotCount} className="mt-3 md:hidden" />
        </section>
      );
    }

    if (section.sectionType === 'promo_banner') {
      const promoAd = activeListingAds.find((ad) => (ad.placementKey || 'homepage_inline_primary') === (section.placementKey || 'homepage_inline_primary')) || null;
      if (!promoAd) return null;
      const promoImage = getMediaProxyUrl(promoAd.imageUrl);
      return (
        <button
          key={sectionKey}
          type="button"
          onClick={() => handleListingAdAction(promoAd)}
          className="block w-full overflow-hidden rounded-2xl bg-white text-left shadow-lg xl:hidden"
          style={{ backgroundColor: promoAd.backgroundColor || section.backgroundColor || '#4338ca' }}
        >
          {promoImage ? (
            <img
              src={promoImage}
              alt={promoAd.title}
              className="h-auto w-full rounded-2xl object-cover"
            />
          ) : (
          <div className="relative min-h-[150px] overflow-hidden rounded-xl p-5 text-white">
            <div className="absolute -right-5 bottom-0 hidden h-32 w-32 rounded-full bg-white/10 md:block" />
            <Megaphone className="absolute bottom-4 right-5 h-24 w-24 rotate-[-10deg] text-white/20" />
            <div className="relative max-w-lg space-y-3">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90">
                {promoAd.badge}
              </span>
              <h3 className="text-2xl font-extrabold leading-tight">{promoAd.title}</h3>
              <p className="max-w-2xl text-sm text-white/85">{promoAd.description}</p>
              <span className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900">
                {promoAd.ctaText}
              </span>
            </div>
          </div>
          )}
        </button>
      );
    }

    if (section.sectionType === 'featured_businesses') {
      const featuredPool = getSectionBusinessPool(section);
      const desktopCardCount = getDesktopCardCount(section, Math.min(3, sectionMaxItems));
      const mobileCardCount = getMobileCardCount(section, 2);
      const mobileDisplayMode = getMobileDisplayMode(section);
      const mobileFeaturedItems = mobileDisplayMode === 'stack'
        ? featuredPool.slice(0, mobileCardCount)
        : featuredPool.slice(0, sectionMaxItems);
      const desktopFeaturedItems = getDesktopSectionItems(featuredPool, sectionMaxItems);
      const desktopFeaturedGridCount = getDesktopGridCount(desktopCardCount, desktopFeaturedItems.length);
      const featuredDotCount = getSwipeDotCount(featuredPool.length, mobileCardCount);
      const featuredDotIndex = getSwipeDotActiveIndex(featuredPool.length, mobileCardCount);
      if (mobileFeaturedItems.length === 0 && desktopFeaturedItems.length === 0) return null;
      return (
        <section key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {renderSectionHeader(section.title, section.subtitle, section.showViewAll, () => {
            openResultsForCategory(section.categoryId || 'all', section.subcategoryId || 'all');
          })}
          {mobileDisplayMode === 'stack' ? (
            <div className="mt-4 space-y-3 md:hidden">
              {mobileFeaturedItems.map((business) => renderCompactBusinessRow(business, { showImage: true }))}
            </div>
          ) : (
            <>
              <div data-mobile-auto-scroll="true" className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:hidden">
                {mobileFeaturedItems.map((business) => renderMobileBusinessCard(business, 'Sponsored', mobileCardCount, true))}
              </div>
              <SwipeDots totalDots={featuredDotCount} activeIndex={featuredDotIndex} className="mt-3 md:hidden" />
            </>
          )}
          <div
            className="mt-4 hidden gap-4 md:grid md:justify-start"
            style={{ gridTemplateColumns: `repeat(${desktopFeaturedGridCount}, 200px)` }}
          >
            {desktopFeaturedItems.map((business) => (
              renderDesktopBusinessTile(business, 'border-indigo-200', 'Sponsored', true)
            ))}
          </div>
        </section>
      );
    }

    if (section.sectionType === 'business_shelf') {
      const shelfBusinessMatches = getSectionBusinessPool(section);
      const desktopCardCount = getDesktopCardCount(section, Math.min(4, sectionMaxItems));
      const mobileCardCount = getMobileCardCount(section, 2);
      const mobileDisplayMode = getMobileDisplayMode(section);
      const mobileShelfItems = mobileDisplayMode === 'stack'
        ? shelfBusinessMatches.slice(0, mobileCardCount)
        : shelfBusinessMatches.slice(0, sectionMaxItems);
      const desktopShelfItems = getDesktopSectionItems(shelfBusinessMatches, sectionMaxItems);
      const desktopShelfGridCount = getDesktopGridCount(desktopCardCount, desktopShelfItems.length);
      const shelfDotCount = getSwipeDotCount(shelfBusinessMatches.length, mobileCardCount);
      const shelfDotIndex = getSwipeDotActiveIndex(shelfBusinessMatches.length, mobileCardCount);
      if (mobileShelfItems.length === 0 && desktopShelfItems.length === 0) return null;
      return (
        <section key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {renderSectionHeader(section.title, section.subtitle, section.showViewAll, () => {
            openResultsForCategory(section.categoryId || 'all', section.subcategoryId || 'all');
          })}
          {mobileDisplayMode === 'stack' ? (
            <div className="mt-4 space-y-3 md:hidden">
              {mobileShelfItems.map((business) => renderCompactBusinessRow(business))}
            </div>
          ) : (
            <>
              <div data-mobile-auto-scroll="true" className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:hidden">
                {mobileShelfItems.map((business) => renderMobileBusinessCard(business, undefined, mobileCardCount))}
              </div>
              <SwipeDots totalDots={shelfDotCount} activeIndex={shelfDotIndex} className="mt-3 md:hidden" />
            </>
          )}
          <div
            className="mt-4 hidden gap-4 md:grid md:justify-start"
            style={{ gridTemplateColumns: `repeat(${desktopShelfGridCount}, 200px)` }}
          >
            {desktopShelfItems.map((business) => (
              renderDesktopBusinessTile(business)
            ))}
          </div>
        </section>
      );
    }

    if (section.sectionType === 'text_business_strip') {
      const stripPool = getSectionBusinessPool(section);
      const desktopCardCount = getDesktopCardCount(section, Math.min(4, sectionMaxItems));
      const mobileCardCount = getMobileCardCount(section, 2);
      const mobileDisplayMode = getMobileDisplayMode(section);
      const mobileStripItems = mobileDisplayMode === 'stack'
        ? stripPool.slice(0, mobileCardCount)
        : stripPool.slice(0, sectionMaxItems);
      const desktopStripItems = getDesktopSectionItems(stripPool, sectionMaxItems);
      const desktopStripGridCount = getDesktopGridCount(desktopCardCount, desktopStripItems.length);
      const stripDotCount = getSwipeDotCount(stripPool.length, mobileCardCount);
      const stripDotIndex = getSwipeDotActiveIndex(stripPool.length, mobileCardCount);
      if (mobileStripItems.length === 0 && desktopStripItems.length === 0) return null;
      return (
        <section key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {renderSectionHeader(section.title, section.subtitle, section.showViewAll, () => {
            openResultsForCategory(section.categoryId || 'all', section.subcategoryId || 'all');
          })}
          {mobileDisplayMode === 'stack' ? (
            <div className="mt-4 space-y-3 md:hidden">
              {mobileStripItems.map((business) => renderTextBusinessStripCard(business, { stack: true }))}
            </div>
          ) : (
            <>
              <div data-mobile-auto-scroll="true" className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 md:hidden">
                {mobileStripItems.map((business) => renderTextBusinessStripCard(business, { cardsPerView: mobileCardCount }))}
              </div>
              <SwipeDots totalDots={stripDotCount} activeIndex={stripDotIndex} className="mt-3 md:hidden" />
            </>
          )}
          <div
            className="mt-4 hidden gap-4 md:grid md:justify-start"
            style={{ gridTemplateColumns: `repeat(${desktopStripGridCount}, 200px)` }}
          >
            {desktopStripItems.map((business) => renderTextBusinessStripCard(business, { stack: true }))}
          </div>
        </section>
      );
    }

    if (section.sectionType === 'offers_list') {
      const offerItems = activeCoupons.slice(0, sectionMaxItems);
      if (offerItems.length === 0) return null;
      return (
        <section key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {renderSectionHeader(section.title, undefined, section.showViewAll, () => {
            setViewAllModal({
              kind: 'offers',
              title: section.title,
              items: activeCoupons.map((coupon) => {
                const couponBusiness = businesses.find((business) => business.id === coupon.businessId);
                return {
                  id: coupon.id,
                  title: coupon.title || coupon.code,
                  description: coupon.description,
                  discount: coupon.discount,
                  businessName: couponBusiness?.name || 'Local offer',
                  businessId: coupon.businessId,
                  image: couponBusiness ? getBusinessImageUrl(couponBusiness) : undefined
                };
              })
            });
          })}
          <div className="mt-4 space-y-3">
            {offerItems.map((coupon, index) => {
              const couponBusiness = businesses.find((business) => business.id === coupon.businessId);
              const tone = couponBusiness
                ? iconToneByCategory[couponBusiness.categoryId] || { Icon: Ticket, iconClassName: 'text-indigo-600', bgClassName: 'bg-indigo-50' }
                : { Icon: Ticket, iconClassName: 'text-indigo-600', bgClassName: 'bg-indigo-50' };
              const Icon = index === 1 ? Dumbbell : index === 2 ? Utensils : tone.Icon;
              return (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() => {
                    if (couponBusiness) {
                      openBusinessDetails(couponBusiness);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${tone.bgClassName}`}>
                      <Icon className={`h-6 w-6 ${tone.iconClassName}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900">{coupon.title || coupon.code}</div>
                      <div className="mt-1 text-xs text-slate-500">{couponBusiness?.name || 'Local offer'}</div>
                    </div>
                    <span className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
                      {coupon.discount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      );
    }

    if (section.sectionType === 'updates_feed') {
      const updateItems = localityCommunityItems.slice(0, sectionMaxItems);
      if (updateItems.length === 0) return null;
      return (
        <section key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {renderSectionHeader(section.title, undefined, section.showViewAll, () => {
            setViewAllModal({
              kind: 'updates',
              title: section.title,
              items: localityCommunityItems
            });
          })}
          <div className="mt-4 space-y-3">
            {updateItems.map((item, index) => (
              <div key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <img
                    src={getMediaProxyUrl(item.image) || carouselImages[index % carouselImages.length]}
                    alt={item.title}
                    className="h-14 w-16 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.content}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {index === 0 ? '2h ago' : index === 1 ? '5h ago' : new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section.sectionType === 'category_grid') {
      const categoryItems = getConfiguredCategories(section).slice(0, sectionMaxItems);
      return (
        <section key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {renderSectionHeader(section.title, undefined, section.showViewAll, () => setShowAllCategoriesModal(true))}
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {categoryItems.map((category) => {
              const tone = iconToneByCategory[category.id] || { Icon: Grid3X3, iconClassName: 'text-indigo-600', bgClassName: 'bg-indigo-50' };
              const Icon = tone.Icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryShortcut(category.id)}
                  className="min-w-0 rounded-xl p-2 text-center transition hover:bg-slate-50"
                >
                  <span className={`mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tone.bgClassName}`}>
                    <Icon className={`h-6 w-6 ${tone.iconClassName}`} />
                  </span>
                  <div className="text-[11px] font-extrabold leading-tight text-slate-900 md:text-xs">
                    <span className="line-clamp-2 break-words">
                      {category.name.replace('Food & ', '').replace('Shopping & ', '')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      );
    }

    if (section.sectionType === 'verified_business_grid') {
      const verifiedPool = getSectionBusinessPool(section);
      const desktopCardCount = getDesktopCardCount(section, Math.min(5, sectionMaxItems));
      const mobileCardCount = getMobileCardCount(section, 2);
      const mobileDisplayMode = getMobileDisplayMode(section);
      const mobileVerifiedItems = mobileDisplayMode === 'stack'
        ? verifiedPool.slice(0, mobileCardCount)
        : verifiedPool.slice(0, sectionMaxItems);
      const desktopVerifiedItems = getDesktopSectionItems(verifiedPool, sectionMaxItems);
      const desktopVerifiedGridCount = getDesktopGridCount(desktopCardCount, desktopVerifiedItems.length);
      const verifiedDotCount = getSwipeDotCount(verifiedPool.length, mobileCardCount);
      const verifiedDotIndex = getSwipeDotActiveIndex(verifiedPool.length, mobileCardCount);
      if (mobileVerifiedItems.length === 0 && desktopVerifiedItems.length === 0) return null;
      return (
        <section key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-extrabold text-slate-950">{section.title}</h3>
                <span className="text-xs font-semibold text-slate-500">{homepageSortedBusinesses.length} Businesses</span>
              </div>
              {section.subtitle && <p className="mt-1 text-xs text-slate-500">{section.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSortBy('recommended')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
              >
                <span>Sort By</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFilterVerifiedOnly((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                <span>Filter</span>
              </button>
            </div>
          </div>
          {mobileDisplayMode === 'stack' ? (
            <div className="mt-4 space-y-3 md:hidden">
              {mobileVerifiedItems.map((business) => renderCompactBusinessRow(business))}
            </div>
          ) : (
            <>
              <div data-mobile-auto-scroll="true" className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:hidden">
                {mobileVerifiedItems.map((business) => renderMobileBusinessCard(business, undefined, mobileCardCount))}
              </div>
              <SwipeDots totalDots={verifiedDotCount} activeIndex={verifiedDotIndex} className="mt-3 md:hidden" />
            </>
          )}
          <div
            className="mt-4 hidden gap-4 md:grid md:justify-start"
            style={{ gridTemplateColumns: `repeat(${desktopVerifiedGridCount}, 200px)` }}
          >
            {desktopVerifiedItems.map((business) => renderDesktopBusinessTile(business))}
          </div>
          {section.showViewAll && verifiedPool.length > desktopVerifiedItems.length && (
            <button
              type="button"
              onClick={() => openResultsForCategory(section.categoryId || 'all', section.subcategoryId || 'all')}
              className="mx-auto mt-4 block rounded-xl bg-indigo-50 px-8 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              View More Businesses
            </button>
          )}
        </section>
      );
    }

    if (section.sectionType === 'trust_strip') {
      return (
        <section key={sectionKey} className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white shadow-lg md:p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: '100% Verified Businesses', value: '100%', Icon: ShieldCheck },
              { label: 'Safe & Secure Platform', value: 'Secure', Icon: ShieldCheck },
              { label: 'Dedicated Local Support', value: 'Support', Icon: Headphones },
              { label: 'Serving Since 2026', value: '2026', Icon: CalendarCheck }
            ].map((item) => {
              const Icon = item.Icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold">{item.value}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-indigo-100">{item.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    return null;
  };

  // Trigger registration submission
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyFormError('');
    setApplyDuplicateBusinessId(null);

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedDescription = description.trim();
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const normalizedEmail = email.trim();

    if (!trimmedName || !trimmedAddress || formAreasOfOperation.length === 0 || !/^\d{6}$/.test(listingPincode)) {
      setApplyFormError('Please complete the required fields, including service areas and a valid 6-digit pincode.');
      return;
    }

    if (!normalizedPhone && !normalizedEmail) {
      setApplyFormError('Please provide at least one contact method: mobile number or email address.');
      return;
    }

    if (normalizedPhone && normalizedPhone.length !== 10) {
      setApplyFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!formAreaId || !formAreasOfOperation.includes(formAreaId)) {
      setApplyFormError('Please choose a primary area and include it in the selected service areas.');
      return;
    }

    if (trimmedDescription.length < 24) {
      setApplyFormError('Please add a slightly richer business description so customers understand the service clearly.');
      return;
    }

    const normalizedListingName = normalizeSearchText(trimmedName);
    const duplicateBusiness = businesses.find((business) => {
      const businessPhone = (business.phone || '').replace(/\D/g, '').slice(-10);
      const businessPincode = business.pincode || MASTER_AREAS.find((area) => area.id === business.areaId)?.pincode || '';
      const samePhone = Boolean(normalizedPhone && businessPhone && normalizedPhone === businessPhone);
      const sameName = normalizeSearchText(business.name) === normalizedListingName;
      const samePincode = Boolean(listingPincode && businessPincode === listingPincode);
      const sameArea = business.areaId === formAreaId;
      const sameLocalityScope = selectedLocalityIds.includes(business.localityId) || business.localityId === activeLocalityId;
      return sameLocalityScope && (
        (samePhone && samePincode) ||
        (samePhone && sameName) ||
        (sameName && (samePincode || sameArea))
      );
    });

    if (duplicateBusiness) {
      setApplyFormError(`A similar listing already exists for "${duplicateBusiness.name}". Please review the existing record instead of creating a duplicate.`);
      setApplyDuplicateBusinessId(duplicateBusiness.id);
      return;
    }

    // Default dynamic properties
    const newBizData = {
      name: trimmedName,
      categoryId,
      subcategoryId,
      localityId: selectedLocalityIds[0] || activeLocalityId,
      stateId: formStateId,
      cityId: formCityId,
      areaId: formAreaId,
      pincode: listingPincode,
      areasOfOperation: formAreasOfOperation,
      address: trimmedAddress,
      phone: normalizedPhone,
      email: normalizedEmail || undefined,
      website: website.trim(),
      description: trimmedDescription,
      imageUrl: imageUrl.trim(),
      featured: false,
      tags: Array.from(new Set([
        categoryId,
        subcategoryId,
        'Local',
        'Indian-SME',
        MASTER_AREAS.find((area) => area.id === formAreaId)?.name || '',
      ].filter(Boolean))),
      hours,
      ownerName: ownerName || 'National Proprietor',
      gpsCoordinates: gpsCoords,
      contactPrivacyMode: normalizedPhone ? 'unlock_required' as const : 'area_only' as const,
    };

    onSubmitApplication(newBizData);

    // reset fields
    setName('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setCategoryId('food-restaurants');
    setSubcategoryId('restaurants');
    setAddress('');
    setDescription('');
    setOwnerName('');
    setHours('10:00 AM - 08:30 PM');
    setImageUrl('');
    setFormAreasOfOperation([formAreaId]);
    setListingPincode(savedPincode || MASTER_AREAS.find((area) => area.id === formAreaId)?.pincode || '');
    setGpsCoords(undefined);
    setApplyFormError('');
    setApplyDuplicateBusinessId(null);

    setShowApplyModal(false);
    alert(`Registration received successfully! Listing "${trimmedName}" has been sent to the verification queue for moderator review.`);
  };

  // Triggered on OTP Verification success
  const handleOtpSuccess = async (verifiedName: string, verifiedPhone: string, unlockToken?: string) => {
    setContactUnlockToken(unlockToken || '');
    // Authenticate the user session globally
    onUserSessionChange({
      role: userSession.role === 'buyer' ? 'buyer' : userSession.role,
      userName: `${verifiedName} (Verified Customer)`,
      userPhone: verifiedPhone,
      isAuthenticated: true,
      contactUnlockToken: unlockToken || userSession.contactUnlockToken,
    });

    // Unlock the specific contact requested
    if (otpTargetBiz) {
      const allowed = await Promise.resolve(onUnlockBusinessContact({
        businessId: otpTargetBiz.id,
        viewerName: verifiedName,
        viewerPhone: verifiedPhone,
        unlockToken,
      }));
      if (!allowed) {
        return false;
      }
      alert(`OTP Verification successful! Contact details unlocked for "${otpTargetBiz.name}".`);
      
      // Update selected business ref if open
      if (selectedBiz?.id === otpTargetBiz.id) {
        setSelectedBiz({ ...selectedBiz });
      }
    }
    
    setOtpTargetBiz(null);
    return true;
  };

  const initContactUnlockFlow = (biz: Business, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card details click
    if (!biz.phone) {
      alert('This listing does not have a phone number yet.');
      return;
    }
    setOtpTargetBiz(biz);
    
    // If already session-authenticated, immediately unlock and skip modal!
    const activeUnlockToken = contactUnlockToken || userSession.contactUnlockToken || '';
    if (userSession.isAuthenticated && userSession.userPhone && activeUnlockToken) {
      void Promise.resolve(onUnlockBusinessContact({
        businessId: biz.id,
        viewerName: userSession.userName,
        viewerPhone: userSession.userPhone,
        unlockToken: activeUnlockToken,
      })).then((allowed) => {
        if (allowed === false) {
          return;
        }
        alert(`Contact details unlocked for "${biz.name}".`);
      }).catch(() => {
        alert('Unable to verify contact unlock right now.');
      });
      return;
    }
    
    setShowOtpModal(true);
  };

  // Add review rating action
  const handlePostReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert("Please enter a short review message.");
      return;
    }
    if (!selectedBiz) return;

    onAddReview(
      selectedBiz.id,
      userSession.userName || 'Anonymous Client',
      userSession.userPhone || '+91 99999 88888',
      newRating,
      newComment
    );

    // Reset review form inputs
    setNewComment('');
    setNewRating(5);
    alert("Thank you! Your verified user review has been posted and rating averages updated.");
  };

  const toggleFeaturedStatus = (biz: Business) => {
    // Admin toggling listing featured state
    const alreadyFeaturedCount = businesses.filter(
      b => selectedLocalityIds.includes(b.localityId) && b.categoryId === biz.categoryId && b.featured && b.status === 'approved'
    ).length;

    if (!biz.featured && alreadyFeaturedCount >= 3) {
      alert(`⚠️ CAP SATURATED: Every category segment allows a maximum of 3 featured listings to prevent directory spam. Please un-feature another item first!`);
      return;
    }

    const updatedBiz = { ...biz, featured: !biz.featured };
    onUpdateBusiness(updatedBiz);
    
    // Sync current drawer if open
    if (selectedBiz?.id === biz.id) {
      setSelectedBiz(updatedBiz);
    }
  };

  // Sync state drop downs
  const handleStateChange = (stateId: string) => {
    setFormStateId(stateId);
    const relatedCities = MASTER_CITIES.filter(c => c.stateId === stateId);
    if (relatedCities.length > 0) {
      const cityId = relatedCities[0].id;
      setFormCityId(cityId);
      
      const relatedAreas = MASTER_AREAS.filter(a => a.cityId === cityId);
      if (relatedAreas.length > 0) {
        setFormAreaId(relatedAreas[0].id);
        setFormAreasOfOperation([relatedAreas[0].id]);
        setListingPincode(relatedAreas[0].pincode);
      }
    }
  };

  const handleCityChange = (cityId: string) => {
    setFormCityId(cityId);
    const relatedAreas = MASTER_AREAS.filter(a => a.cityId === cityId);
    if (relatedAreas.length > 0) {
      setFormAreaId(relatedAreas[0].id);
      setFormAreasOfOperation([relatedAreas[0].id]);
      setListingPincode(relatedAreas[0].pincode);
    }
  };

  const handleAreaCheckToggle = (areaId: string) => {
    setFormAreasOfOperation(prev => 
      prev.includes(areaId)
        ? prev.filter(x => x !== areaId)
        : [...prev, areaId]
    );
  };

  const fallbackSectionTemplates = homepageDefaultsConfig?.sectionTemplates
    || (Array.isArray(HOMEPAGE_DEFAULTS_BOOTSTRAP.sectionTemplates) ? HOMEPAGE_DEFAULTS_BOOTSTRAP.sectionTemplates as HomepageSection[] : []);
  const resolvedHomepageSectionsBase: HomepageSection[] = activeHomepageSections.length > 0 ? activeHomepageSections : fallbackSectionTemplates.map((section, index) => ({
    ...section,
    id: `fallback_${section.id || section.sectionType || index + 1}`,
  }));
  const hasBusinessHomepageSection = resolvedHomepageSectionsBase.some((section) => (
    ['featured_businesses', 'business_shelf', 'text_business_strip', 'verified_business_grid'].includes(section.sectionType)
  ));
  const homepageSectionsToRender: HomepageSection[] = hasBusinessHomepageSection
    ? resolvedHomepageSectionsBase
    : [
        ...resolvedHomepageSectionsBase,
        {
          id: 'auto_fallback_verified_businesses',
          sectionType: 'verified_business_grid',
          title: 'Top Local Businesses',
          subtitle: `Popular approved listings currently active in ${currentLocality.name}.`,
          status: 'active',
          visible: true,
          sortOrder: 999,
          maxItems: 10,
          desktopCardCount: 5,
          mobileCardCount: 2,
          mobileDisplayMode: 'stack',
          showViewAll: true,
          listingSourceMode: 'auto',
          localityIds: [currentLocality.id],
        }
      ];
  const shouldUseFallbackAds = !shouldDeferResolvedListingAds && resolvedHomepageSource === 'legacy_fallback' && activeListingAds.length === 0;
  const fallbackSidebarAds: ListingAd[] = (homepageDefaultsConfig?.fallbackListingAds || (Array.isArray(HOMEPAGE_DEFAULTS_BOOTSTRAP.fallbackListingAds) ? HOMEPAGE_DEFAULTS_BOOTSTRAP.fallbackListingAds : []) as Array<Record<string, unknown>>).map((ad, index) => ({
    id: String(ad.id || `fallback_ad_${index + 1}`),
    title: String(ad.title || 'Fallback Ad'),
    description: String(ad.description || ''),
    badge: String(ad.badge || 'Advertisement'),
    ctaText: String(ad.ctaText || 'Learn More'),
    backgroundColor: String(ad.backgroundColor || '#eef2ff'),
    imageUrl: ad.imageUrl ? String(ad.imageUrl) : undefined,
    startDate: todayIso,
    endDate: todayIso,
    actionType: (ad.actionType === 'lead_form' || ad.actionType === 'landing_listing' ? ad.actionType : 'landing_page') as ListingAd['actionType'],
    targetUrl: ad.targetUrl
      ? String(ad.targetUrl)
      : (ad.targetCategoryId ? buildCategoryRoutePath(String(ad.targetCategoryId)) : undefined),
    localityIds: [currentLocality.id],
    categoryIds: Array.isArray(ad.categoryIds) ? ad.categoryIds.map((categoryId) => String(categoryId)) : [],
    tags: Array.isArray(ad.tags) ? ad.tags.map((tag) => String(tag)) : [],
    placementKey: ad.placementKey ? String(ad.placementKey) : undefined,
    deviceTarget: ad.deviceTarget === 'desktop' || ad.deviceTarget === 'mobile' ? ad.deviceTarget : 'all',
    mobileRowPosition: Number.isFinite(Number(ad.mobileRowPosition)) ? Number(ad.mobileRowPosition) : 3,
    isActive: true
  }));
  const getAdCtr = (ad: ListingAd) => getAdCtrService(ad);
  const getAdDeliveryScore = (ad: ListingAd, contextKey: string) => (
    getAdDeliveryScoreService(ad, {
      contextKey,
      homepageRotationTick,
      selectedCategory,
      selectedSubcategory,
      todayIso
    })
  );
  const rankAdsForDelivery = (ads: ListingAd[], contextKey: string) => (
    rankAdsForDeliveryService(ads, {
      contextKey,
      homepageRotationTick,
      selectedCategory,
      selectedSubcategory,
      todayIso
    })
  );
  const homepageAdInventory = rankAdsForDelivery(
    shouldUseFallbackAds ? [...activeListingAds, ...fallbackSidebarAds] : activeListingAds,
    isResultsPage ? 'listing_results' : 'homepage'
  );
  const desktopSidebarAds = rankAdsForDelivery(homepageAdInventory, 'homepage_sidebar')
    .filter((ad) => (ad.deviceTarget || 'all') !== 'mobile')
    .slice(0, 4);
  const contextualListingAds = rankAdsForDelivery(getAdsForBusinessContext(sortedBusinesses, homepageAdInventory), 'listing_results');
  const desktopResultAds = contextualListingAds.filter((ad) => (ad.deviceTarget || 'all') !== 'mobile');
  const mobileResultAds = contextualListingAds.filter((ad) => (ad.deviceTarget || 'all') !== 'desktop');
  const mobileInlineAds = rankAdsForDelivery(homepageAdInventory, 'mobile_inline')
    .filter((ad) => (ad.deviceTarget || 'all') !== 'desktop')
    .filter((ad) => (ad.mobileRowPosition || 0) > 0)
    .sort((a, b) => (a.mobileRowPosition || 0) - (b.mobileRowPosition || 0) || (getAdDeliveryScore(b, 'mobile_inline') - getAdDeliveryScore(a, 'mobile_inline')));
  useEffect(() => {
    if (!onTrackListingAdInteraction) return;
    const visibleAds = [
      ...homepageAdInventory,
      ...desktopSidebarAds,
      ...desktopResultAds,
      ...mobileResultAds,
      ...mobileInlineAds
    ];
    visibleAds.forEach((ad) => {
      if (trackedAdImpressionIdsRef.current.has(ad.id)) return;
      trackedAdImpressionIdsRef.current.add(ad.id);
      onTrackListingAdInteraction({
        adId: ad.id,
        type: 'impression',
        context: ad.placementKey || (isResultsPage ? 'listing_results' : 'homepage')
      });
    });
  }, [
    desktopResultAds,
    desktopSidebarAds,
    homepageAdInventory,
    isResultsPage,
    mobileInlineAds,
    mobileResultAds,
    onTrackListingAdInteraction
  ]);
  const scrollToPublicSearch = () => {
    const target = document.getElementById('public-listing-search');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToHomepageResults = () => {
    const target = document.getElementById('homepage-results-anchor');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const renderHomepageSectionsContent = () => {
    const renderedSections: React.ReactNode[] = [];
    const groupedMobileAds = mobileInlineAds.reduce<Record<number, ListingAd[]>>((acc, ad) => {
      const rowPosition = ad.mobileRowPosition || 0;
      if (!rowPosition) return acc;
      if (!acc[rowPosition]) acc[rowPosition] = [];
      acc[rowPosition].push(ad);
      return acc;
    }, {});
    let mobileRowCursor = 0;

    for (let index = 0; index < homepageSectionsToRender.length; index += 1) {
      const section = homepageSectionsToRender[index];
      const nextSection = homepageSectionsToRender[index + 1];

      if (section.sectionType === 'offers_list' && nextSection?.sectionType === 'updates_feed') {
        const offersSection = renderHomepageSection(section);
        const updatesSection = renderHomepageSection(nextSection);

        if (offersSection && updatesSection) {
          renderedSections.push(
            <div key={`paired-${section.id}-${nextSection.id}`} className="grid gap-5 md:grid-cols-2">
              {offersSection}
              {updatesSection}
            </div>
          );
          mobileRowCursor += 1;
          if (groupedMobileAds[mobileRowCursor]?.length) {
            renderedSections.push(
              <React.Fragment key={`mobile-ads-row-${mobileRowCursor}`}>
                <MobileAdCarousel
                  ads={groupedMobileAds[mobileRowCursor]}
                  onAdClick={handleListingAdAction}
                />
              </React.Fragment>
            );
          }
        } else {
          if (offersSection) {
            renderedSections.push(offersSection);
            mobileRowCursor += 1;
            if (groupedMobileAds[mobileRowCursor]?.length) {
              renderedSections.push(
                <React.Fragment key={`mobile-ads-row-${mobileRowCursor}`}>
                  <MobileAdCarousel
                    ads={groupedMobileAds[mobileRowCursor]}
                    onAdClick={handleListingAdAction}
                  />
                </React.Fragment>
              );
            }
          }
          if (updatesSection) {
            renderedSections.push(updatesSection);
            mobileRowCursor += 1;
            if (groupedMobileAds[mobileRowCursor]?.length) {
              renderedSections.push(
                <React.Fragment key={`mobile-ads-row-${mobileRowCursor}`}>
                  <MobileAdCarousel
                    ads={groupedMobileAds[mobileRowCursor]}
                    onAdClick={handleListingAdAction}
                  />
                </React.Fragment>
              );
            }
          }
        }

        index += 1;
        continue;
      }

      const renderedSection = renderHomepageSection(section);
      if (renderedSection) {
        renderedSections.push(renderedSection);
        mobileRowCursor += 1;
        if (groupedMobileAds[mobileRowCursor]?.length) {
          renderedSections.push(
            <React.Fragment key={`mobile-ads-row-${mobileRowCursor}`}>
              <MobileAdCarousel
                ads={groupedMobileAds[mobileRowCursor]}
                onAdClick={handleListingAdAction}
              />
            </React.Fragment>
          );
        }
      }
    }

    Object.entries(groupedMobileAds)
      .filter(([row]) => Number(row) > mobileRowCursor)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .forEach(([row, ads]) => {
        renderedSections.push(
          <React.Fragment key={`mobile-ads-row-${row}`}>
            <MobileAdCarousel
              ads={ads as ListingAd[]}
              onAdClick={handleListingAdAction}
            />
          </React.Fragment>
        );
      });

    return renderedSections;
  };
  const renderSidebarAdCard = (ad: ListingAd, index: number) => {
    const isDark = index === 1 || ad.backgroundColor === '#064e3b';
    const adImage = getMediaProxyUrl(ad.imageUrl);
    return (
      <button
        key={`${ad.id}-${index}`}
        type="button"
        onClick={() => handleListingAdAction(ad)}
        className={`relative min-h-[220px] overflow-hidden rounded-2xl text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          isDark ? 'text-white' : 'text-indigo-950'
        }`}
        style={{ backgroundColor: ad.backgroundColor || (isDark ? '#064e3b' : '#ede9fe') }}
      >
        {adImage ? (
          <img
            src={adImage}
            alt={ad.title}
            className="h-full min-h-[220px] w-full rounded-2xl object-cover"
          />
        ) : (
        <div className="relative min-h-[220px] p-6">
        <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-white/70' : 'text-indigo-500'}`}>
          {ad.badge || 'Advertisement'}
        </span>
        <h4 className="mt-5 max-w-[190px] text-2xl font-extrabold leading-tight">{ad.title}</h4>
        <p className={`mt-3 max-w-[190px] text-sm font-medium ${isDark ? 'text-white/85' : 'text-indigo-900/70'}`}>{ad.description}</p>
        <span className={`mt-5 inline-flex rounded-xl px-4 py-2 text-xs font-bold ${
          isDark ? 'bg-white text-emerald-950' : 'bg-indigo-600 text-white'
        }`}>
          {ad.ctaText}
        </span>
        {index === 1 ? (
          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=420&q=80"
            alt=""
            className="absolute -bottom-8 -right-12 h-36 w-36 rounded-full object-cover shadow-2xl"
          />
        ) : (
          <Megaphone className={`absolute bottom-5 right-5 h-24 w-24 rotate-[-12deg] ${isDark ? 'text-white/15' : 'text-indigo-400/25'}`} />
        )}
        </div>
        )}
      </button>
    );
  };

  return (
    <div id="web-portal-root" className="w-full max-w-full space-y-6 overflow-x-hidden pb-28 md:pb-10">
      
      {/* Dynamic Subdomain Navigator Router Header */}
      {showSubdomainLocationMapping && <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 md:p-5 border border-indigo-500/10 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-wider text-indigo-400 uppercase">Subdomain Location Mapping:</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                HTTPS Router Active
              </span>
            </div>
            <h4 className="text-base font-mono font-bold text-white mt-0.5 select-all">
              https://{currentLocality.subdomain}/
            </h4>
          </div>
        </div>

        {/* DNS Hop selection */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto bg-slate-950 p-1.5 rounded-xl border border-slate-850">
          <span className="text-[10px] text-slate-400 font-mono px-2 uppercase tracking-tight">Simulate Subdomain redirection:</span>
          {localities.map(loc => (
            <button
              key={loc.id}
              onClick={() => onLocalityChange(loc.id)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all ${
                activeLocalityId === loc.id 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {loc.slug}.in
            </button>
          ))}
        </div>
      </div>}

      {/* Hero Header Section with Dynamic Carousel */}
      {false && (
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white min-h-[240px] md:min-h-[300px] flex items-center shadow-lg group">
        <div className="absolute inset-0 z-0">
          <img 
            src={carouselImages[carouselIndex]} 
            alt={currentLocality.name}
            className="w-full h-full object-cover opacity-35 transition-all duration-1000 transform scale-103"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent"></div>
        </div>

        {/* Sliders navigation overlays */}
        <button 
          onClick={handlePrevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-1.5 rounded-full text-slate-300 hover:text-white transition opacity-0 group-hover:opacity-100 z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={handleNextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-1.5 rounded-full text-slate-300 hover:text-white transition opacity-0 group-hover:opacity-100 z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel indicators dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {carouselImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCarouselIndex(i)}
              className={`w-2 h-2 rounded-full transition ${carouselIndex === i ? 'bg-indigo-500 w-4' : 'bg-slate-500/50'}`}
            ></button>
          ))}
        </div>

        <div className="relative z-10 px-6 md:px-12 py-8 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 animate-bounce" /> Indian Regional Directory
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold font-sans tracking-tight text-white leading-tight">
            {activeHeroSlide?.title || `Hyper Local Directory for ${selectedLocalityNames || currentLocality.name}`}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            {activeHeroSlide?.subtitle || `${currentLocality.description} verified reviews, location-grabbing utilities, and dynamic approval tracking.`}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {(userSession.role === 'admin' || userSession.role === 'moderator' || userSession.role === 'operator' || userSession.role === 'seller') ? (
              <button
                onClick={() => setShowApplyModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono px-4 py-2.5 rounded-xl transition shadow hover:shadow-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add New Business
              </button>
            ) : (
              <button
                onClick={() => setShowApplyModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono px-4 py-2.5 rounded-xl transition shadow hover:shadow-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Apply To Add Business
              </button>
            )}
            <div className="text-xs text-slate-400 font-mono">
              🛡️ Operator SLA: verified in &lt;1 hour
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Primary Multi-Hub Portal Navigation Workspace Tabs */}
      {SHOW_PORTAL_TABS && <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1 shadow-2xs">
        <button
          onClick={() => setActivePortalTab('listings')}
          className={`flex-1 py-3 text-center text-xs font-bold font-sans flex items-center justify-center gap-2 rounded-xl transition ${
            activePortalTab === 'listings'
              ? 'bg-indigo-650 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          📂 Yellow Directory Finder
        </button>
        <button
          onClick={() => setActivePortalTab('community')}
          className={`flex-1 py-3 text-center text-xs font-bold font-sans flex items-center justify-center gap-2 rounded-xl transition relative ${
            activePortalTab === 'community'
              ? 'bg-emerald-650 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
          }`}
        >
          <Users className="w-4 h-4" />
          🤝 Citizens Bulletin &amp; Deals
          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">
            {communityItems.length} live
          </span>
        </button>
        <button
          onClick={() => setActivePortalTab('merchant')}
          className={`flex-1 py-3 text-center text-xs font-bold font-sans flex items-center justify-center gap-2 rounded-xl transition ${
            activePortalTab === 'merchant'
              ? 'bg-amber-600 text-slate-950 shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          💼 SME Merchant Workspace &amp; CRM
        </button>
      </div>}

      {/* RENDER TAB 1: YELLOW PAGES BUSINESS DIRECTORY FINDER */}
      {activePortalTab === 'listings' && !isResultsPage && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-5">
            <div id="homepage-results-anchor" className="scroll-mt-24" />
            {renderHomepageSectionsContent()}

            {userSession.role === 'seller' && userSession.sellerBusinessId && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Seller Ad Leads</h4>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-700">
                    {activeSellerWidgetLeads.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {pagedSellerWidgetLeads.map((lead) => (
                    <div key={lead.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">{lead.name}</span>
                        <span className="font-mono text-slate-500">{lead.pincode}</span>
                      </div>
                      <div className="font-mono text-slate-600">{lead.mobile}</div>
                    </div>
                  ))}
                  {activeSellerWidgetLeads.length === 0 && (
                    <span className="text-xs text-slate-400">No leads received yet.</span>
                  )}
                </div>
                <div className="mt-3">
                  <PaginationControls
                    compact
                    currentPage={safeSellerWidgetLeadsPage}
                    totalPages={sellerWidgetLeadsTotalPages}
                    onPageChange={setSellerWidgetLeadsPage}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="hidden space-y-5 xl:block">
            <div className="sticky top-6 space-y-5">
              {desktopSidebarAds.map((ad, index) => renderSidebarAdCard(ad, index))}
            </div>
          </aside>
        </div>
      )}
      {activePortalTab === 'listings' && isResultsPage && (
        <div id="results-page-top" className="space-y-3 scroll-mt-20 md:space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  <button type="button" onClick={openHomePage} className="text-indigo-600 hover:text-indigo-700">
                    Home
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <span>Search Results</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                    {sortedBusinesses.length} results
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-extrabold leading-tight text-slate-950 md:mt-2 md:text-2xl">
                  {getSearchResultsKeyword()} Businesses in {selectedLocalityNames || currentLocality.name}
                </h2>
              </div>
            </div>
          </div>
          {/* Advanced Multi-Mode Search Suite */}
          <div id="public-listing-search" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs scroll-mt-20 md:p-5">
            <div className="hidden items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <span className="text-xs font-bold font-mono uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Discovery Search Suite:
              </span>
              {!SIMPLE_SEARCH_FORM && <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                {[
                  { id: 'keyword', label: '🔍 Text', icon: Search },
                  { id: 'voice', label: '🎤 Voice', icon: Volume2 },
                  { id: 'image', label: '📷 Image', icon: Camera },
                  { id: 'ai', label: '✨ Gemini AI', icon: Brain },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setSearchMode(mode.id as any);
                      if (mode.id !== 'voice') setVoiceTranscript('');
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                      searchMode === mode.id
                        ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <mode.icon className="w-3 h-3 text-indigo-505" />
                    {mode.label}
                  </button>
                ))}
              </div>}
            </div>

            {/* Render conditional inputs matching active Search Mode */}
            {searchMode === 'keyword' && (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:gap-3">
                <div className="relative min-w-0">
                  <input
                    id="public-listing-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedCategory('all');
                      setSelectedSubcategory('all');
                    }}
                    onFocus={() => setIsSearchInputFocused(true)}
                    onBlur={() => window.setTimeout(() => setIsSearchInputFocused(false), 120)}
                    onKeyDown={handleSearchInputKeyDown}
                    placeholder="Search businesses, tags, services..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {renderSearchSuggestions()}
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={openResultsPage}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Search</span>
                </button>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedSubcategory('all');
                    }}
                    className="col-span-full justify-self-end text-xs font-mono text-slate-400 hover:text-red-500"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}

            {!SIMPLE_SEARCH_FORM && searchMode === 'voice' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  {voiceIsListening 
                    ? "🗣️ Speach Recognition engine is loading. Speak clearly now..." 
                    : voiceTranscript 
                      ? `Voice Tag Analized successfully: "${voiceTranscript}"` 
                      : "Simulate voice-powered local regional lookup:"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={triggerVoiceSearchSimulate}
                    disabled={voiceIsListening}
                    className={`text-xs font-mono font-bold px-4 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                      voiceIsListening 
                        ? 'bg-red-100 border-red-200 text-red-600 animate-pulse' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    {voiceIsListening ? 'Listening Live...' : 'Start Voice Listening'}
                  </button>
                  {voiceTranscript && (
                    <button
                      onClick={() => {
                        setVoiceTranscript('');
                        setSearchQuery('');
                      }}
                      className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-300 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {voiceTranscript && (
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">
                    ✓ Directory instantly filtered matching voice segment &quot;{voiceTranscript}&quot;
                  </span>
                )}
              </div>
            )}

            {!SIMPLE_SEARCH_FORM && searchMode === 'image' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-center">
                <p className="text-xs text-slate-600">
                  {uploadedImageTag 
                    ? `AI Image Classification finished! Tag matching: "${uploadedImageTag.replace('_', ' ').toUpperCase()}"` 
                    : "Drag-and-Drop or select photo tag to simulate indexing local directory via mobile camera scan:"}
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  {[
                    { id: 'tea_shop', label: '🍛 Pure Veg Dosa Plate', icon: Clock },
                    { id: 'saree', label: '👗 Designer Boutique Saree', icon: Award },
                    { id: 'dental_chair', label: '💇 Elite Salon Chair', icon: CheckCircle },
                  ].map(photo => {
                    const active = uploadedImageTag === photo.id;
                    return (
                      <button
                        key={photo.id}
                        onClick={() => triggerImageTagSimulate(photo.id)}
                        className={`text-xs px-3.5 py-2 rounded-xl border flex items-center gap-1.5 font-mono ${
                          active 
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <photo.icon className="w-3.5 h-3.5 text-amber-500" />
                        {photo.label}
                      </button>
                    );
                  })}
                </div>
                {uploadedImageTag && (
                  <p className="text-[10px] text-indigo-650 font-semibold font-mono">
                    ✓ Filtered directory with tag coordinates for category selection. Click another tag or reset text to clear.
                  </p>
                )}
              </div>
            )}

            {!SIMPLE_SEARCH_FORM && searchMode === 'ai' && (
              <form onSubmit={handleAiSearchRun} className="bg-slate-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2 text-indigo-900 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 mb-1 leading-normal">
                  <Brain className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[11px] font-bold">Natural Language AI Search (Grounding)</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Type conversational commands like &quot;Give me clean Pali Hill dentists&quot;, &quot;Organic South dinner coffee spot&quot;, or &quot;Sea-facing quieter eatery&quot;.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    placeholder="Ask Gemini AI for curated regional recommendations..."
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold px-4 rounded-xl transition flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Ask Gemini
                  </button>
                </div>

                {aiIsResponding && (
                  <div className="text-xs text-slate-500 font-mono animate-pulse py-2 pl-2 border-l-2 border-indigo-500">
                    Scanning regional shards... Analyzing sentiment ratings...
                  </div>
                )}

                {aiResponseText && !aiIsResponding && (
                  <div className="bg-white border border-indigo-100 rounded-xl p-3.5 text-xs text-slate-705 leading-relaxed space-y-2">
                    <p className="font-sans text-indigo-950 font-medium">{aiResponseText}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const q = aiSearchQuery.toLowerCase();
                          if (q.includes('hair') || q.includes('salon') || q.includes('groom') || q.includes('cut') || q.includes('element')) {
                            const b = businesses.find(x => x.id === 's1');
                            if (b) openBusinessDetails(b);
                          } else if (q.includes('academy') || q.includes('spa') || q.includes('majestic')) {
                            const b = businesses.find(x => x.id === 's2');
                            if (b) openBusinessDetails(b);
                          } else if (q.includes('veg') || q.includes('food') || q.includes('dosa') || q.includes('utsav')) {
                            const b = businesses.find(x => x.id === 'b11');
                            if (b) openBusinessDetails(b);
                          } else {
                            const b = businesses.find(x => x.id === 's8'); // Barberry Bliss Family Salon as default
                            if (b) openBusinessDetails(b);
                          }
                        }}
                        className="text-[10px] font-mono font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200/50 transition cursor-pointer"
                      >
                        🚀 Fast Track &gt;&gt; Open Recommended card
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* COLLAPSIBLE ADVANCED METRIC FILTERS DECK */}
            {SHOW_REFINED_FILTERS && <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-4">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold border-b border-slate-150 pb-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Refined Shards Filters Selector</span>
              </div>

              {/* Grid of Sliders and Multi-select states */}
              <div className="grid grid-cols-2 gap-4 text-xs lg:grid-cols-5">
                {/* 1. Distance filter */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Max Distance Radius</label>
                  <select 
                    value={filterDistance}
                    onChange={(e) => setFilterDistance(e.target.value as any)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:outline-none text-[11px]"
                  >
                    <option value="all">Any range (selected locality)</option>
                    <option value="1">Within 1.0 km</option>
                    <option value="2">Within 2.0 km</option>
                    <option value="5">Within 5.0 km</option>
                  </select>
                </div>

                {/* 2. City filter */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">City Scope</label>
                  <select
                    value={filterCityId}
                    onChange={(e) => setFilterCityId(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:outline-none text-[11px]"
                  >
                    <option value="all">All active cities</option>
                    {availableCityOptions.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Rating min check */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Customer Star rating</label>
                  <select 
                    value={filterRating}
                    onChange={(e) => setFilterRating(parseFloat(e.target.value) as any)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:outline-none text-[11px]"
                  >
                    <option value="0">Show all feedback</option>
                    <option value="4">Highly rated (4.0★+)</option>
                    <option value="4.5">Elite Quality (4.5★+)</option>
                  </select>
                </div>

                {/* 4. Price scale filter */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Affoxability scale</label>
                  <select 
                    value={filterPriceRange}
                    onChange={(e) => setFilterPriceRange(e.target.value as any)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:outline-none text-[11px]"
                  >
                    <option value="all">Show all prices</option>
                    <option value="₹">Budget friendly (₹)</option>
                    <option value="₹₹">Moderate outlay (₹₹)</option>
                    <option value="₹₹₹">Premium spend (₹₹₹)</option>
                    <option value="₹₹₹₹">Ultra upscale (₹₹₹₹)</option>
                  </select>
                </div>

                {/* 5. Sorter order desk */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Prioritize Listings</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-2 bg-indigo-50 border-indigo-200 text-indigo-950 font-bold rounded-lg border focus:outline-none text-[11px]"
                  >
                    <option value="recommended">Recommended (CPC + VIP)</option>
                    <option value="popular">Popularity (Most Reviewed)</option>
                    <option value="rating">Top average Stars (★)</option>
                    <option value="nearest">Nearest physical range</option>
                    <option value="newest">Recently approved listings</option>
                  </select>
                </div>
              </div>

              {/* Toggle checklist strip */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2 border-t border-slate-150/50">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-650 font-mono">
                  <input
                    type="checkbox"
                    checked={filterOpenNow}
                    onChange={(e) => setFilterOpenNow(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Open Now</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-650 font-mono">
                  <input
                    type="checkbox"
                    checked={filterDelivery}
                    onChange={(e) => setFilterDelivery(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Delivery Available</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-650 font-mono">
                  <input
                    type="checkbox"
                    checked={filterHasOffers}
                    onChange={(e) => setFilterHasOffers(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Has active Deals</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-650 font-mono">
                  <input
                    type="checkbox"
                    checked={filterVerifiedOnly}
                    onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                    ✓ Physical Verified Only
                  </span>
                </label>

                {/* Additional multi checklist filters */}
                <span className="text-slate-400">|</span>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 font-mono">Language:</span>
                  <select
                    value={filterLanguageSpoken}
                    onChange={(e) => setFilterLanguageSpoken(e.target.value)}
                    className="p-1 bg-white border border-slate-200 rounded font-mono text-[10px]"
                  >
                    <option value="all">Any</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 font-mono">Payment:</span>
                  <select
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                    className="p-1 bg-white border border-slate-200 rounded font-mono text-[10px]"
                  >
                    <option value="all">Any</option>
                    <option value="UPI">UPI Enabled</option>
                    <option value="Credit Card">Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 font-mono">Years in service:</span>
                  <select
                    value={filterExperience}
                    onChange={(e) => setFilterExperience(e.target.value as any)}
                    className="p-1 bg-white border border-slate-200 rounded font-mono text-[10px]"
                  >
                    <option value="all">all</option>
                    <option value="5">5+ Years</option>
                    <option value="10">10+ Years</option>
                  </select>
                </div>
              </div>
            </div>}

            {/* Quick clean reset button for filters */}
            {(filterDistance !== 'all' || filterRating !== 0 || filterOpenNow || filterPriceRange !== 'all' || filterDelivery || filterHasOffers || filterVerifiedOnly || filterLanguageSpoken !== 'all' || filterPaymentMethod !== 'all' || filterExperience !== 'all' || sortBy !== 'recommended') && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterDistance('all');
                    setFilterRating(0);
                    setFilterOpenNow(false);
                    setFilterPriceRange('all');
                    setFilterDelivery(false);
                    setFilterHasOffers(false);
                    setFilterVerifiedOnly(false);
                    setFilterLanguageSpoken('all');
                    setFilterPaymentMethod('all');
                    setFilterExperience('all');
                    setSortBy('recommended');
                  }}
                  className="text-[10px] text-red-500 hover:underline font-mono"
                >
                  Reset all advanced filters to default
                </button>
              </div>
            )}
          </div>

          {/* Bulletin local campaign strip */}
          <div className="hidden bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-l-4 border-amber-500 rounded-r-2xl p-3.5 items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400 text-amber-950 text-[10px] uppercase font-mono font-bold px-2 py-1 rounded-md tracking-wider">
                LOCAL BULLETIN
              </div>
              <p className="text-slate-700 text-xs font-medium">
                ⚡ Monsoons prep campaign: Check listed electrical &amp; plumbing repair helplines below. Verified by regional ops.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">AD #2026</span>
          </div>

          {userSession.role === 'seller' && userSession.sellerBusinessId && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800">Seller Ad Leads</h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-mono font-bold">
                  {activeSellerWidgetLeads.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {pagedSellerWidgetLeads.map((lead) => (
                  <div key={lead.id} className="bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{lead.name}</span>
                      <span className="font-mono text-slate-500">{lead.pincode}</span>
                    </div>
                    <div className="font-mono text-slate-600">{lead.mobile}</div>
                  </div>
                ))}
                {activeSellerWidgetLeads.length === 0 && (
                  <span className="text-[11px] text-slate-400">No leads received yet.</span>
                )}
              </div>
              <PaginationControls
                compact
                currentPage={safeSellerWidgetLeadsPage}
                totalPages={sellerWidgetLeadsTotalPages}
                onPageChange={setSellerWidgetLeadsPage}
              />
            </div>
          )}

          {/* LISTINGS STREAMS SECTION */}
          <div className="space-y-6">
            
            {/* VIP Premium Sponsored Segment */}
            {featuredBusinesses.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold font-mono text-indigo-650 tracking-widest uppercase flex items-center gap-1.5">
                  ⭐ Premium Featured &amp; Sponsored ({featuredBusinesses.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pagedFeaturedBusinesses.map(biz => {
                    const hasViewed = viewedBusinessIds.includes(biz.id);
                    return (
                      <React.Fragment key={biz.id}>
                        {renderCompactBusinessRow(biz, {
                          highlightClass: 'border-indigo-300',
                          badgeLabel: 'VIP',
                          badgeClassName: 'bg-indigo-700 text-white'
                        })}
                        <div 
                          onClick={() => openBusinessDetails(biz)}
                          className="relative hidden cursor-pointer flex-col gap-5 rounded-2xl border-2 border-indigo-400/40 bg-white p-5 shadow-xs transition hover:border-indigo-600 md:flex md:flex-row"
                        >
                          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-700 to-indigo-900 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white font-mono">
                            <Sparkles className="h-2.5 w-2.5 animate-spin text-amber-300" /> Sponsored VIP
                          </span>

                          <img 
                            src={getBusinessImageUrl(biz)}
                            alt={biz.name}
                            className={`h-24 w-24 self-center rounded-xl border border-slate-200 bg-slate-100 md:h-28 md:w-28 flex-shrink-0 ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-3'}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
                            }}
                          />

                          <div className="flex-1 space-y-2 truncate">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1">
                                {biz.name}
                                {biz.verifiedBadge && (
                                  <span className="text-emerald-500" title="Physical KYC Verified Merchant">✓</span>
                                )}
                              </h4>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                                {getBusinessCategoryLabel(biz)}
                                {(biz.subcategoryId || biz.sourceSubcategoryLabel) && ` / ${getBusinessSubcategoryLabel(biz)}`}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {biz.description}
                            </p>

                            <div className="text-[11px] font-mono text-slate-500 space-y-0.5 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {hasViewed ? (
                                  <div className="flex items-center gap-1.5 text-slate-800 font-bold font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                    <span>📞 {biz.phone || 'Not provided'}</span>
                                    <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-md text-[8px] font-bold">
                                      Viewed
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => initContactUnlockFlow(biz, e)}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] px-2.5 py-1 rounded-lg border border-indigo-200/50 flex items-center gap-1 font-bold transition font-mono"
                                  >
                                    <Lock className="w-3 h-3 text-indigo-600" /> Reveal Contact (OTP Gated)
                                  </button>
                                )}
                              </div>

                              {biz.email && hasViewed && (
                                <div className="truncate text-slate-600">✉️ {biz.email}</div>
                              )}

                              <div className="truncate text-blue-600 flex items-center gap-1">
                                <Globe className="w-3 h-3 text-blue-400" /> {biz.website}
                              </div>
                              <div className="font-sans text-slate-600 font-medium truncate">📍 {biz.address}</div>
                              <div className="font-mono text-[10px] text-slate-500">
                                PIN: {biz.pincode || MASTER_AREAS.find((area) => area.id === biz.areaId)?.pincode || 'Not set'}
                              </div>
                              
                              {biz.areasOfOperation && biz.areasOfOperation.length > 0 && (
                                <div className="font-sans text-[10px] text-slate-400 mt-1 truncate">
                                  🗺️ Service Areas: {(biz.areasOfOperation || []).map(aid => MASTER_AREAS.find(a => a.id === aid)?.name).filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-lg font-bold" title="Google Ratings">
                                ★ {biz.rating} <span className="font-medium text-slate-400 text-[10px]">({biz.reviewCount || 0} customer reviews)</span>
                              </div>
                              <span className="text-xs text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5 text-[10px]">
                                Inspect records &gt;
                              </span>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <PaginationControls
                  currentPage={safeFeaturedPage}
                  totalPages={featuredTotalPages}
                  onPageChange={setFeaturedPage}
                />
              </div>
            )}

            {/* Standard Approved Listings Segment */}
            <div className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="mb-1 text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
                  Active Verified Listings Directory ({searchResultBusinesses.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-mono font-semibold text-slate-500">
                    {searchResultMapBusinesses.length > 0
                      ? `${searchResultMapBusinesses.length} mapped on this page`
                      : 'Map view available when GPS is present'}
                  </span>
                  <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setResultsViewMode('grid')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        resultsViewMode === 'grid'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Grid3X3 className="h-3.5 w-3.5" />
                      <span>Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (searchResultMapBusinesses.length > 0) setResultsViewMode('map');
                      }}
                      disabled={searchResultMapBusinesses.length === 0}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        resultsViewMode === 'map'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45'
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Map</span>
                    </button>
                  </div>
                </div>
              </div>

              {searchResultBusinesses.length === 0 ? (
                <NoResultsState
                  activeSearchLabel={activeSearchText}
                  noResultsSuggestedCategories={noResultsSuggestedCategories}
                  nearbyCityLocalities={nearbyCityLocalities}
                  noResultsFallbackBusinesses={noResultsFallbackBusinesses}
                  openResultsForCategory={openResultsForCategory}
                  onLocalityChange={onLocalityChange}
                  onOpenRecommendationRequest={openRecommendationRequest}
                  openBusinessDetails={openBusinessDetails}
                  renderCompactBusinessRow={renderCompactBusinessRow}
                  shouldShowListingResultImage={shouldShowListingResultImage}
                  getBusinessSubcategoryLabel={getBusinessSubcategoryLabel}
                  renderBusinessRecognitionBadges={renderBusinessRecognitionBadges}
                />
              ) : (
                resultsViewMode === 'map' && searchResultMapBusinesses.length > 0 ? (
                  <ResultsMapView
                    businesses={searchResultMapBusinesses}
                    selectedLocalityName={selectedLocalityNames || currentLocality.name}
                    activeBusinessId={activeMapBusinessId}
                    onSetActiveBusinessId={setActiveMapBusinessId}
                    projectSearchResultMapPoint={projectSearchResultMapPoint}
                    openBusinessDetails={openBusinessDetails}
                    openBusinessDirections={openBusinessDirectionsDirect}
                    renderBusinessRecognitionBadges={renderBusinessRecognitionBadges}
                    getBusinessSubcategoryLabel={getBusinessSubcategoryLabel}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {pagedSearchResultBusinesses.map((biz, index) => {
                      const hasViewed = viewedBusinessIds.includes(biz.id);
                      const resultAds = desktopResultAds.length > 0 ? desktopResultAds : mobileResultAds;
                      const injectAd = resultAds.length > 0 && (index + 1) % 4 === 0;
                      const ad = resultAds.length > 0
                        ? resultAds[Math.floor(index / 4) % resultAds.length]
                        : null;

                      return (
                        <React.Fragment key={biz.id}>
                          {renderCompactBusinessRow(biz, (biz.featured || biz.isSponsored) ? {
                            badgeLabel: 'VIP',
                            badgeClassName: 'bg-indigo-700 text-white',
                            showImage: shouldShowListingResultImage(biz)
                          } : undefined)}
                          <div 
                            onClick={() => openBusinessDetails(biz)}
                            className="relative hidden cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-indigo-400 hover:shadow-md md:flex"
                          >
                            {(biz.featured || biz.isSponsored) && (
                              <span className="absolute right-3 top-3 z-10 rounded-full bg-indigo-700 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                                Sponsored VIP
                              </span>
                            )}
                            <div className="space-y-3">
                              {shouldShowListingResultImage(biz) && (
                                <div className="relative">
                                  <img 
                                    src={getBusinessImageUrl(biz)}
                                    alt={biz.name}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
                                    }}
                                    className={`w-full h-36 rounded-xl border border-slate-200/60 bg-slate-100 ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-4'}`}
                                  />
                                  {biz.verifiedBadge && (
                                    <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                      Verified Badge
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                                    {getBusinessCategoryLabel(biz)}
                                    {(biz.subcategoryId || biz.sourceSubcategoryLabel) && ` / ${getBusinessSubcategoryLabel(biz)}`}
                                  </span>
                                  <div className="flex items-center gap-0.5 bg-amber-50 text-amber-600 text-xs px-1.5 rounded font-bold" title="Google Ratings">
                                    ★ {biz.rating}
                                  </div>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight truncate flex items-center gap-1">
                                  {biz.name}
                                  {biz.verifiedBadge && !(biz.featured || biz.isSponsored) && (
                                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                  )}
                                  {biz.isSponsored && (
                                    <span className="bg-amber-100 text-amber-800 text-[8px] font-mono font-bold px-1 rounded">CPC</span>
                                  )}
                                </h4>
                                <p className="line-clamp-2 text-xs italic leading-relaxed text-slate-500">
                                  &quot;{biz.description}&quot;
                                </p>
                                {renderBusinessRecognitionBadges(biz, true)}
                              </div>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-500 font-mono">
                              <div className="flex items-center justify-between font-sans flex-wrap gap-1.5">
                                {hasViewed ? (
                                  <div className="flex items-center gap-1 text-slate-800 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                                    <span>📞 {biz.phone || 'Not provided'}</span>
                                    <span className="text-emerald-700 text-[8px] font-bold ml-1">Viewed</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => initContactUnlockFlow(biz, e)}
                                    className="bg-slate-105 hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-700 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                                  >
                                    <Lock className="w-2.5 h-2.5" /> Unlock Phone Number
                                  </button>
                                )}
                              </div>

                              <div className="font-sans text-slate-600 truncate leading-normal">📍 {biz.address}</div>
                              <div className="font-mono text-[10px] text-slate-500 truncate">
                                PIN: {biz.pincode || MASTER_AREAS.find((area) => area.id === biz.areaId)?.pincode || 'Not set'}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleCompareBusinessClick(biz, e)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                                  isBusinessCompared(biz.id)
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                                }`}
                              >
                                <CheckSquare className="h-3 w-3" />
                                <span>{isBusinessCompared(biz.id) ? 'Comparing' : 'Compare'}</span>
                              </button>
                              
                              <span className="text-indigo-600 font-sans font-bold hover:underline inline-flex items-center gap-0.5 mt-1 block">
                                Explore directory record →
                              </span>
                            </div>
                          </div>

                          {injectAd && ad && (
                            <div
                              className="min-h-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
                              style={{ backgroundColor: ad.backgroundColor || '#0f172a' }}
                            >
                              <div className="hidden">
                                <div className="bg-amber-400 text-slate-950 p-3 rounded-full flex-shrink-0 animate-bounce shadow">
                                  <Megaphone className="w-5 h-5" />
                                </div>
                                <div className="text-center md:text-left space-y-1">
                                  <span className="inline-flex bg-amber-500/15 text-amber-400 font-mono text-[9px] px-2.5 py-0.5 rounded-md border border-amber-500/20 uppercase font-bold tracking-wider mb-1">
                                    📢 {ad.badge} Sponsored Highlight
                                  </span>
                                  <h4 className="text-base font-bold text-white font-sans">{ad.title}</h4>
                                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{ad.description}</p>
                                  <span className="text-[10px] text-slate-200 font-mono">
                                    Action: {ad.actionType.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleListingAdAction(ad)}
                                className="h-full min-h-[220px] w-full cursor-pointer overflow-hidden rounded-2xl text-left"
                              >
                                {getMediaProxyUrl(ad.imageUrl) ? (
                                  <img
                                    src={getMediaProxyUrl(ad.imageUrl)}
                                    alt={ad.title}
                                    className="h-full min-h-[220px] w-full rounded-2xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full min-h-[220px] flex-col justify-between p-4 text-white">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">{ad.badge}</span>
                                    <div>
                                      <h4 className="text-lg font-extrabold leading-tight">{ad.title}</h4>
                                      <p className="mt-2 line-clamp-3 text-xs text-white/80">{ad.description}</p>
                                    </div>
                                    <span className="inline-flex rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900">{ad.ctaText}</span>
                                  </div>
                                )}
                              </button>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )
              )}
              {searchResultBusinesses.length > 0 && (
                <PaginationControls
                  currentPage={safeSearchResultPage}
                  totalPages={searchResultTotalPages}
                  onPageChange={setRegularPage}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: LOCAL COMMUNTIY CITIZEN BULLETIN BOARD & DEALS */}
      {activePortalTab === 'community' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main interactive discussion stream column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-sans">
                  <span className="text-emerald-500">🤝</span> {currentLocalityLabel} Citizens Forum Hub
                </h3>
                <span className="text-xs text-slate-400 font-mono">Sharded Community Channel</span>
              </div>

              {/* Feed items */}
              <div className="space-y-4">
                {pagedCommunityItems.map(post => (
                  <div key={post.id} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-800 text-xs">
                          {post.authorName.charAt(0)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block leading-none">{post.authorName}</span>
                          <span className="text-[9px] font-mono text-slate-400">Published {new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                        post.type === 'deal'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : post.type === 'qa'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {post.type}
                      </span>
                    </div>

                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-36 w-full rounded-xl object-cover"
                      />
                    ) : null}

                    <h4 className="font-extrabold text-slate-900 text-sm">{post.title}</h4>
                    <p className="text-xs text-slate-650 leading-relaxed font-sans">{post.content}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/55 flex-wrap gap-2 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500">
                          {communityHashtag}
                        </span>
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500">
                          #verified_ops
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => alert("Citizens recommendation upvoted!")}
                          className="text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1 px-1 py-0.5 rounded bg-white border border-slate-200/60"
                        >
                          👍 Upvote Helpful
                        </button>
                        <button
                          onClick={() => alert("Simulating localized reply thread.")}
                          className="text-slate-600 hover:text-indigo-600 font-medium"
                        >
                          💬 Write Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {localityCommunityItems.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
                    No community posts yet for this locality.
                  </div>
                )}
              </div>
              <PaginationControls
                currentPage={safeCommunityPage}
                totalPages={communityTotalPages}
                onPageChange={setCommunityPage}
              />
            </div>
          </div>

          {/* Citizen action launching deck & deals ticker */}
          <div className="space-y-6">
            <form onSubmit={handleAddCommunityPost} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-2">
                <PlusCircle className="w-4 h-4 text-emerald-500" /> post local citizen bulletin
              </h4>

              <div>
                <label className="block text-[11px] text-slate-560 font-mono mb-1">Bulletin Section</label>
                <select
                  value={communitySection}
                  onChange={(e) => setCommunitySection(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="qna">❓ Question &amp; Answer (Q&amp;A)</option>
                  <option value="deals">🏷️ Local Merchant Deals</option>
                  <option value="recommendations">✍️ Citizens Recommendations</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-560 font-mono mb-1">Thread Heading</label>
                <input
                  type="text"
                  required
                  value={communityTitle}
                  onChange={(e) => setCommunityTitle(e.target.value)}
                  placeholder="e.g. Any quiet cafes with wifi around Carter Road?"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-560 font-mono mb-1">Your Message Details</label>
                <textarea
                  required
                  rows={4}
                  value={communityBody}
                  onChange={(e) => setCommunityBody(e.target.value)}
                  placeholder="Ask are there good parking facilities, power-backup tables, or check other neighborhood parameters..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-560 font-mono mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={communityTags}
                  onChange={(e) => setCommunityTags(e.target.value)}
                  placeholder="monsoon, carter_road, parking"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Broadcast to Citizens Board
              </button>
            </form>

            {/* Local recommendations list widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                📢 LOCAL COMMUNITY LEADERBOARD
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2 flex justify-between rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">🥇 Karan Malhotra</span>
                  <span className="font-mono text-indigo-600 text-[10px] font-bold">14 helpful tips</span>
                </div>
                <div className="p-2 flex justify-between rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">🥈 Priya Iyer</span>
                  <span className="font-mono text-indigo-600 text-[10px] font-bold">9 tips</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: DYNAMIC SME MERCHANT WORKSPACE & CRM */}
      {activePortalTab === 'merchant' && (
        <div className="space-y-6">
          {userSession.role === 'buyer' ? (
            <>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-emerald-300">Buyer dashboard</div>
                    <h3 className="text-xl font-extrabold">
                      {userSession.userName || 'Anonymous Buyer'}
                    </h3>
                    <p className="max-w-2xl text-sm text-slate-300">
                      Track saved listings, recently unlocked contacts, and your verified review activity from one place before UAT.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Account status</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {userSession.isAuthenticated ? 'Verified user session active' : 'Guest mode with local saved history'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: 'Saved listings', value: buyerSavedBusinesses.length, className: 'border-rose-200 bg-rose-50 text-rose-700' },
                  { label: 'Compare queue', value: buyerComparedBusinesses.length, className: 'border-sky-200 bg-sky-50 text-sky-700' },
                  { label: 'Contact unlocks', value: buyerViewedBusinesses.length, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                  { label: 'Verified actions', value: buyerRecentActivity.length, className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
                  { label: 'Your reviews', value: buyerSubmittedReviews.length, className: 'border-amber-200 bg-amber-50 text-amber-700' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-2xl border p-4 ${stat.className}`}>
                    <div className="text-[11px] font-mono uppercase tracking-wide">{stat.label}</div>
                    <div className="mt-2 text-2xl font-extrabold">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Saved listings</h4>
                      <p className="text-[11px] text-slate-500">Businesses the buyer marked for revisit.</p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                      {buyerSavedBusinesses.length} saved
                    </span>
                  </div>
                  {buyerSavedBusinesses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Tap the heart on any business card and it will appear here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {buyerSavedBusinesses.slice(0, 4).map((biz) => renderDesktopBusinessTile(biz))}
                      </div>
                      <div className="flex gap-3 overflow-x-auto md:hidden">
                        {buyerSavedBusinesses.slice(0, 4).map((biz) => renderMobileBusinessCard(biz))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Compare listings</h4>
                      <p className="text-[11px] text-slate-500">Keep up to 3 listings side by side before contacting.</p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">
                      {buyerComparedBusinesses.length}/3 selected
                    </span>
                  </div>
                  {buyerComparedBusinesses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Use the compare button on any listing card to build a short shortlist.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[720px] rounded-2xl border border-slate-200">
                        <div className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
                          <div className="p-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Field</div>
                          {Array.from({ length: 3 }, (_, index) => buyerComparedBusinesses[index] || null).map((biz, index) => (
                            <div key={`compare-head-${biz?.id || index}`} className="border-l border-slate-200 p-3">
                              {biz ? (
                                <div className="space-y-2">
                                  <div className="text-sm font-bold text-slate-900">{biz.name}</div>
                                  <div className="text-[11px] text-slate-500">{getBusinessCategoryLabel(biz)}</div>
                                  <button
                                    type="button"
                                    onClick={() => onToggleComparedBusiness(biz.id)}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400">Open slot</div>
                              )}
                            </div>
                          ))}
                        </div>
                        {[
                          { label: 'Area', render: (biz: Business) => getBusinessAreaName(biz) },
                          { label: 'Rating', render: (biz: Business) => `${biz.rating.toFixed(1)} (${biz.reviewCount} reviews)` },
                          { label: 'Hours', render: (biz: Business) => biz.hours || 'Not shared' },
                          { label: 'Phone', render: (biz: Business) => biz.phone || 'OTP unlock required' },
                          { label: 'Website', render: (biz: Business) => biz.website || 'Listing page only' },
                          { label: 'Tags', render: (biz: Business) => (biz.tags || []).slice(0, 3).join(', ') || 'Not tagged' },
                        ].map((row) => (
                          <div key={row.label} className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] border-b border-slate-100 last:border-b-0">
                            <div className="bg-slate-50/70 p-3 text-[11px] font-semibold text-slate-600">{row.label}</div>
                            {Array.from({ length: 3 }, (_, index) => buyerComparedBusinesses[index] || null).map((biz, index) => (
                              <div key={`compare-row-${row.label}-${biz?.id || index}`} className="border-l border-slate-100 p-3 text-[11px] text-slate-700">
                                {biz ? row.render(biz) : '—'}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Unlocked contacts</h4>
                      <p className="text-[11px] text-slate-500">Businesses whose phone details were verified and viewed.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      {buyerViewedBusinesses.length} unlocked
                    </span>
                  </div>
                  {buyerViewedBusinesses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Unlock a business contact with OTP verification to build this history.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {buyerViewedBusinesses.slice(0, 6).map((biz) => (
                        <button
                          key={biz.id}
                          type="button"
                          onClick={() => openBusinessDetails(biz)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">{biz.name}</div>
                            <div className="truncate text-xs text-slate-500">
                              {getBusinessCategoryLabel(biz)} • {getBusinessAreaName(biz)}
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="mb-4 border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-extrabold text-slate-900">Recent buyer activity</h4>
                    <p className="text-[11px] text-slate-500">Recent saved, review, and OTP-verified actions.</p>
                  </div>
                  {buyerRecentActivity.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Buyer actions will start showing here as soon as you interact with listings.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {buyerRecentActivity.map((event) => (
                        <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                                {event.actionType === 'saved_listing' || event.actionType === 'unsaved_listing' ? (
                                  <Bookmark className="h-4 w-4" />
                                ) : event.actionType === 'compare_listing' || event.actionType === 'uncompare_listing' ? (
                                  <CheckSquare className="h-4 w-4" />
                                ) : event.actionType === 'contact_unlock' ? (
                                  <ShieldCheck className="h-4 w-4" />
                                ) : (
                                  <Star className="h-4 w-4" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">{event.title}</div>
                                {event.detail && (
                                  <div className="truncate text-xs text-slate-500">{event.detail}</div>
                                )}
                              </div>
                            </div>
                            <div className="whitespace-nowrap text-[10px] font-mono text-slate-400">
                              {new Date(event.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Submitted reviews</h4>
                      <p className="text-[11px] text-slate-500">Verified ratings submitted from this buyer account.</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                      {buyerSubmittedReviews.length} reviews
                    </span>
                  </div>
                  {buyerSubmittedReviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Submit a verified review from any listing to see it reflected here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {buyerSubmittedReviews.slice(0, 5).map((review) => {
                        const business = businesses.find((item) => item.id === review.businessId);
                        return (
                          <div key={review.id} className="rounded-xl border border-slate-200 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {business?.name || review.businessId}
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  {review.rating.toFixed(1)}
                                </div>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
          {/* Active Workspace Switcher header */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 text-slate-950 p-2.5 rounded-xl font-bold font-sans">
                💼 SME
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                  {isSellerWorkspaceLocked ? 'Seller Growth Desk Workspace:' : 'Active Merchant Growth Desk Workspace:'}
                </div>
                <h3 className="font-extrabold text-base text-white">
                  {activeSellerBusiness?.name || 'Local SME Outlet'}
                </h3>
              </div>
            </div>

            {/* SME selector dropdown to easily swap client context to inspect stats */}
            {isSellerWorkspaceLocked ? (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-right">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300">Workspace lock</div>
                <div className="text-xs font-semibold text-white">Mapped to your owned listing</div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-955 p-1.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono px-1">Switch simulated workspace:</span>
                <select
                  value={activeSellerBizId}
                  onChange={(e) => setActiveSellerBizId(e.target.value)}
                  className="bg-slate-900 text-xs text-white border border-slate-800 rounded px-2 py-1 font-sans focus:outline-none"
                >
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.localityId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: 'Owned listing', value: activeSellerBusiness ? 1 : 0, className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
              { label: 'CRM contacts', value: activeSellerContacts.length, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
              { label: 'Ad leads', value: activeMerchantLeads.length, className: 'border-sky-200 bg-sky-50 text-sky-700' },
              { label: 'Live offers', value: activeSellerCoupons.length, className: 'border-amber-200 bg-amber-50 text-amber-700' },
              { label: 'Reviews', value: activeSellerReviews.length, className: 'border-violet-200 bg-violet-50 text-violet-700' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl border p-4 ${stat.className}`}>
                <div className="text-[11px] font-mono uppercase tracking-wide">{stat.label}</div>
                <div className="mt-2 text-2xl font-extrabold">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: CRM and campaign management tools */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active CRM Database list */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      🗄️ customer lead database (CRM)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Citizens who performed verified phone lookups or viewed contact cards</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold font-mono">
                    {activeSellerContacts.length} Contacts
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 text-[10px] uppercase font-mono font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Phone ID</th>
                        <th className="p-3">Method Match</th>
                        <th className="p-3">Loyalty Points</th>
                        <th className="p-3">Follow-up Notes / Status Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSellerContacts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 font-mono">
                            No lead lookups recorded yet. Perform public OTP views as Buyer perspective to bootstrap CRM contacts!
                          </td>
                        </tr>
                      ) : (
                        pagedSellerContacts.map(contact => (
                          <tr key={contact.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">{contact.name}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-600">{contact.phone}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-slate-700">
                                WhatsApp OTP
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-indigo-650">{contact.loyaltyPoints || 100} UI</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...contact, loyaltyPoints: (contact.loyaltyPoints || 100) + 50 };
                                    onUpdateCRMContact(updated);
                                  }}
                                  className="bg-slate-200 hover:bg-indigo-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold transition"
                                  title="+50 loyalty points"
                                >
                                  +50
                                </button>
                              </div>
                            </td>
                            <td className="p-3 space-y-1.5 max-w-[200px]">
                              <input
                                type="text"
                                value={crmNotes[contact.id] !== undefined ? crmNotes[contact.id] : (contact.followUpNotes || '')}
                                onChange={(e) => setCrmNotes({ ...crmNotes, [contact.id]: e.target.value })}
                                placeholder="Edit merchant notes >>"
                                className="w-full text-[10px] p-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
                              />
                              <div className="flex justify-between items-center text-[9px] text-slate-400">
                                <span>Updated: {new Date(contact.lastInteraction).toLocaleDateString()}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const notesText = crmNotes[contact.id] || '';
                                    onUpdateCRMContact({
                                      ...contact,
                                      followUpNotes: notesText,
                                      lastInteraction: new Date().toISOString()
                                    });
                                    alert("Follow-up logs persisted safely for client " + contact.name);
                                  }}
                                  className="text-indigo-655 hover:text-indigo-700 font-bold hover:underline font-mono"
                                >
                                  Save notes
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  currentPage={safeCrmPage}
                  totalPages={crmTotalPages}
                  onPageChange={setCrmPage}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">Ad Leads</h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-bold font-mono">
                    {activeMerchantLeads.length} Leads
                  </span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {activeMerchantLeads.length === 0 ? (
                    <p className="text-[11px] text-slate-400">No ad-form leads captured yet.</p>
                  ) : (
                    pagedMerchantLeads
                      .map((lead) => (
                        <div key={lead.id} className="bg-slate-50 border border-slate-150 rounded-lg px-3 py-2 text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{lead.name}</span>
                            <span className="font-mono text-slate-400">{lead.pincode}</span>
                          </div>
                          <div className="text-slate-600 font-mono">{lead.mobile}</div>
                          <div className="text-[10px] text-slate-400">{new Date(lead.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                  )}
                </div>
                <PaginationControls
                  compact
                  currentPage={safeMerchantLeadsPage}
                  totalPages={merchantLeadsTotalPages}
                  onPageChange={setMerchantLeadsPage}
                />
              </div>

              {/* Marketing multi-channel campaign push form */}
              <form onSubmit={handleRunCampaignSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    📢 Launch Citizen Marketing Campaign
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Send coupon alerts, monsoon updates or discount triggers to your CRM database leads</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-560 font-mono mb-1">Marketing Platform Channel</label>
                    <select
                      value={campaignPlatform}
                      onChange={(e) => setCampaignPlatform(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    >
                      <option value="email">📧 Multi-tenant Email Broadcast</option>
                      <option value="whatsapp">💬 WhatsApp API Regional Pushes</option>
                      <option value="sms">📱 SMS Bulk Telephony (India DLT Router)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-560 font-mono mb-1">Campaign Slate Heading/Subject</label>
                    <input
                      type="text"
                      required
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      placeholder="e.g. Monsoon Special: Flat 20% off all organic coffee!"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-560 font-mono mb-1">Message Content Markup</label>
                  <textarea
                    required
                    rows={3}
                    value={campaignBody}
                    onChange={(e) => setCampaignBody(e.target.value)}
                    placeholder="Provide discount codes, booking directions, and specify that they are verified local providers..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-mono text-slate-500">
                    Est. delivery scope: {crmContacts.filter(c => c.businessId === activeSellerBizId).length} leads
                  </span>
                  
                  <button
                    type="submit"
                    disabled={campaignIsSending}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-955 font-mono font-bold text-xs px-5 py-2 rounded-xl transition shadow flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {campaignIsSending ? 'sending campaign alerts...' : '🚀 Dispatch Broadcast'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right column: SME coupon templates generator, subscription level tier and performance stats */}
            <div className="space-y-6">
              
              {/* Dynamic Traffic Leads Analytics UI chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-indigo-500" /> Merchant traffic metrics
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">views and conversions logged securely across current locality subdomain</p>
                </div>

                {/* SME views metric indicators */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] text-slate-400 block font-mono">Month Views</span>
                    <strong className="text-sm font-mono text-slate-900">1,489 views</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <span className="text-[10px] text-slate-400 block font-mono">CRM Leads</span>
                    <strong className="text-sm font-mono text-emerald-600">
                      {crmContacts.filter(c => c.businessId === activeSellerBizId).length || '1'} clicks
                    </strong>
                  </div>
                </div>

                {/* High quality responsive custom bar chart visualizer */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>Peak traffic time segment (Heatmap representation)</span>
                    <span className="text-indigo-650 font-bold">12.8% Conversion rate</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 font-mono text-[9px] text-slate-500">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Morning (08:00 AM - 12:00 PM)</span>
                        <span className="font-bold">422 views</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Afternoon (12:00 PM - 04:00 PM)</span>
                        <span className="font-bold">612 views</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Evening (04:00 PM - 08:30 PM)</span>
                        <span className="font-bold">392 views</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '55%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct CPC Ads Budget Slider with sponsor rank boost alert */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Cost-per-click CPC Budget</span>
                    <strong className="text-indigo-600 font-bold">₹15 / click</strong>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200/50 p-2.5 rounded-lg text-[10px] text-indigo-900 leading-normal">
                    <span>
                      💡 Raising Cost-per-click from budget settings pushes this business higher in **Sponsored listings sorting searches** instantly.
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic SME Coupon Generator Form */}
              <form onSubmit={handleCreateCouponSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-2">
                  <Ticket className="w-4 h-4 text-indigo-500" /> launch new discount coupon
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      value={cpnCode}
                      onChange={(e) => setCpnCode(e.target.value)}
                      placeholder="e.g. MONSOON30"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono mb-1">Discount Metric</label>
                    <select
                      value={cpnDiscount}
                      onChange={(e) => setCpnDiscount(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                    >
                      <option value="15% OFF">🏷️ 15% Flat Discount</option>
                      <option value="25% OFF">🏷️ 25% Flat Discount</option>
                      <option value="Flat ₹50 OFF">🏷️ Flat ₹50 Discount</option>
                      <option value="BUY 1 GET 1">🏷️ Buy 1 Get 1 Free</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-mono mb-1 font-sans">SME Coupon Description</label>
                  <input
                    type="text"
                    value={cpnDesc}
                    onChange={(e) => setCpnDesc(e.target.value)}
                    placeholder="e.g. Valid on all takeaway food items"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-550 font-mono mb-1">Expiration Cut-off Date</label>
                  <input
                    type="text"
                    value={cpnExpiry}
                    onChange={(e) => setCpnExpiry(e.target.value)}
                    placeholder="31-Dec-2026"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-955 font-mono text-xs font-bold py-2 rounded-xl transition shadow flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Launch Coupon Code
                </button>
              </form>

              {/* SME Premium Subscription Status Plan control panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    💳 Subscription Premium Tier
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Configure your monthly portal visibility index level</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950 font-sans">
                  <div className="flex justify-between items-center">
                    <strong className="text-amber-900 font-bold uppercase tracking-wide">🏆 Premium SME Gold</strong>
                    <span className="bg-amber-600 text-slate-950 text-[9px] px-1.5 py-0.5 font-mono font-bold rounded">Active</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-amber-900">
                    Includes verified check-mark icon, priority listings boosts, infinite SMS campaigning access, custom CRM triggers, and premium SEO domain mapping tags. Custom-billed monthly plan.
                  </p>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* Directory Details Drawer / Modal View */}
      {selectedBiz && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full uppercase">
                  Verified Local Listing Record
                </span>
                <h4 className="font-bold text-sm tracking-tight text-white mt-1">
                  🌐 Secured Connection Hub
                </h4>
              </div>
              <button 
                onClick={closeBusinessDetails}
                className="text-slate-300 hover:text-white font-bold text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <img 
                src={getBusinessImageUrl(selectedBiz)}
                alt={selectedBiz.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(selectedBiz.categoryId);
                }}
                className={`w-full h-44 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner ${hasUploadedBusinessImage(selectedBiz) ? 'object-cover' : 'object-contain p-4'}`}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-950 font-sans">{selectedBiz.name}</h3>
                    {selectedBiz.featured && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        VIP Core
                      </span>
                    )}
                  </div>

                  <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold" title="Google Ratings">
                    ★ {selectedBiz.rating} ({selectedBiz.reviewCount} verified reviews)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {getBusinessCategoryLabel(selectedBiz)}
                    {(selectedBiz.subcategoryId || selectedBiz.sourceSubcategoryLabel) && ` / ${getBusinessSubcategoryLabel(selectedBiz)}`}
                  </span>
                  {(selectedBiz.tags || []).map(t => (
                    <span key={t} className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic">
                &quot;{selectedBiz.description}&quot;
              </p>

              {getBusinessGallery(selectedBiz).length > 0 && (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Gallery</span>
                    <span className="text-[10px] font-mono text-slate-500">{getBusinessGallery(selectedBiz).length} assets</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {getBusinessGallery(selectedBiz).slice(0, 4).map((image, index) => (
                      <div key={`${image}-${index}`} className={`${index === 0 ? 'col-span-2 row-span-2' : ''} overflow-hidden rounded-xl bg-slate-100`}>
                        <img src={getMediaProxyUrl(image)} alt={`${selectedBiz.name} ${index + 1}`} className="h-full min-h-[84px] w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((selectedBiz.businessTypes && selectedBiz.businessTypes.length > 0) || (selectedBiz.serviceTypes && selectedBiz.serviceTypes.length > 0) || (selectedBiz.verificationTags && selectedBiz.verificationTags.length > 0)) && (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Profile identity</div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedBiz.businessTypes || []).slice(0, 3).map((entry) => (
                      <span key={`biz-type-${entry}`} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
                        {entry}
                      </span>
                    ))}
                    {(selectedBiz.serviceTypes || []).slice(0, 3).map((entry) => (
                      <span key={`service-type-${entry}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                        {entry}
                      </span>
                    ))}
                    {(selectedBiz.verificationTags || []).slice(0, 4).map((entry) => (
                      <span key={`verify-${entry}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        {entry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Master Areas of Operation list inside details */}
              {selectedBiz.areasOfOperation && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-wrap gap-2 items-center text-xs">
                  <span className="font-bold text-slate-400 font-mono text-[9px] uppercase">Service Areas:</span>
                  {(selectedBiz.areasOfOperation || []).map(aid => {
                    const area = MASTER_AREAS.find(a => a.id === aid);
                    return (
                      <span key={aid} className="bg-indigo-50 border border-indigo-150 text-indigo-805 px-2 py-0.5 rounded-md text-[10px] font-medium">
                        📍 {area ? `${area.name} (${area.pincode})` : aid}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Verified details cards */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 font-mono text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="text-indigo-600 text-sm">📍</span>
                  <div>
                    <span className="block font-bold font-sans text-[10px] text-slate-400 uppercase">Address:</span>
                    <span className="font-sans text-slate-800 text-xs">{selectedBiz.address}</span>
                    <span className="block font-mono text-[10px] text-slate-500 mt-1">
                      Pincode: {selectedBiz.pincode || MASTER_AREAS.find((area) => area.id === selectedBiz.areaId)?.pincode || 'Not set'}
                    </span>
                    {selectedBiz.gpsCoordinates && (
                      <span className="block font-mono text-[9px] text-blue-600 mt-0.5">
                        GPS Locked: {selectedBiz.gpsCoordinates.lat}° N, {selectedBiz.gpsCoordinates.lng}° E
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-indigo-600 text-sm">📞</span>
                  <div>
                    <span className="block font-bold font-sans text-[10px] text-slate-400 uppercase">Proprietor Contact:</span>
                    {viewedBusinessIds.includes(selectedBiz.id) ? (
                      <div className="flex items-center gap-2">
                        {selectedBiz.phone ? (
                          <a href={`tel:${selectedBiz.phone}`} className="hover:underline text-indigo-600 font-bold">{selectedBiz.phone}</a>
                        ) : (
                          <span className="text-slate-400">Not provided</span>
                        )}
                        <span className="bg-emerald-500/10 text-emerald-600 text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                          ✓ Viewed Previously
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => initContactUnlockFlow(selectedBiz, e)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] px-2.5 py-1 rounded-lg font-bold transition font-mono flex items-center gap-1 mt-1"
                      >
                        <Unlock className="w-3 h-3" /> OTP verify to unlock phone
                      </button>
                    )}
                  </div>
                </div>

                {/* Email (Optional!) */}
                {selectedBiz.email && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-indigo-600 text-sm">✉️</span>
                    <div>
                      <span className="block font-bold font-sans text-[10px] text-slate-400 uppercase">Business Email:</span>
                      {viewedBusinessIds.includes(selectedBiz.id) ? (
                        <a href={`mailto:${selectedBiz.email}`} className="hover:underline text-slate-800 font-bold">{selectedBiz.email}</a>
                      ) : (
                        <span className="text-slate-400 italic">Gated behind OTP</span>
                      )}
                    </div>
                  </div>
                )}

                {selectedBiz.hours && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-indigo-600 text-sm">⏱️</span>
                    <div>
                      <span className="block font-bold font-sans text-[10px] text-slate-400 uppercase">Working Hours:</span>
                      <span className="text-slate-800">{selectedBiz.hours}</span>
                    </div>
                  </div>
                )}
                {selectedBiz.ownerName && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-indigo-600 text-sm">👤</span>
                    <div>
                      <span className="block font-bold font-sans text-[10px] text-slate-400 uppercase">Claimed Merchant:</span>
                      <span className="text-slate-800 font-sans">{selectedBiz.ownerName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SELLER CONTROL / EXPLANATION PANEL */}
              {userSession.role === 'seller' && userSession.sellerBusinessId === selectedBiz.id && (
                <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Proprietor Ownership Dashboard</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-normal font-sans">
                    As simulated listing seller, you have clearance. Modify hours, tags, or operational bounds. Saves automatically and triggers moderated reviews.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedBiz.hours}
                      onChange={(e) => {
                        const updated = { ...selectedBiz, hours: e.target.value };
                        onUpdateBusiness(updated);
                        setSelectedBiz(updated);
                      }}
                      placeholder="e.g. 24 Hours open!"
                      className="text-[10px] bg-white border border-slate-200 font-mono px-2.5 py-1.5 rounded-lg flex-1"
                    />
                    <button
                      onClick={() => alert("Simulated updates written back to local state database. Triggers pending review flag.")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg shrink-0"
                    >
                      Audit Flag
                    </button>
                  </div>
                </div>
              )}

              {/* ADMIN AND MODERATOR CONTROLS INSIDE WEB DRAWER */}
              {(userSession.role === 'admin' || userSession.role === 'moderator') && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 space-y-3.5 text-xs text-rose-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-extrabold">
                      <Award className="w-4 h-4 text-rose-600" />
                      <span>Security Authority (Level: {userSession.role.toUpperCase()})</span>
                    </div>
                    <button
                      onClick={() => toggleFeaturedStatus(selectedBiz)}
                      className={`text-[10px] px-2.5 py-1 rounded font-bold font-mono transition shadow-sm ${
                        selectedBiz.featured 
                          ? 'bg-rose-700 text-white' 
                          : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {selectedBiz.featured ? '⭐ Un-Feature VIP Listing' : '⭐ Toggle Featured (Max 3 Allowed)'}
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedBiz.description}
                      onChange={(e) => {
                        const updated = { ...selectedBiz, description: e.target.value };
                        onUpdateBusiness(updated);
                        setSelectedBiz(updated);
                      }}
                      className="text-[11px] bg-white border border-slate-200 px-2 py-1 rounded flex-1 focus:outline-none"
                      title="Direct edit description"
                    />
                  </div>
                </div>
              )}

              {relatedSelectedBusinesses.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Similar Nearby Listings</h4>
                      <p className="text-[11px] text-slate-500">
                        Good alternatives in {getBusinessAreaName(selectedBiz)} and nearby matching categories.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Continue exploring
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {relatedSelectedBusinesses.map((biz) => (
                      <button
                        key={`related-${biz.id}`}
                        type="button"
                        onClick={() => openBusinessDetails(biz)}
                        className="w-full rounded-2xl border border-white bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="truncate text-sm font-bold text-slate-900">{biz.name}</h5>
                              {biz.verifiedBadge && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              {getBusinessCategoryLabel(biz)}
                              {(biz.subcategoryId || biz.sourceSubcategoryLabel) && ` / ${getBusinessSubcategoryLabel(biz)}`}
                            </div>
                            <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                              {biz.description}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                              <span>{getBusinessAreaName(biz)}</span>
                              {biz.distance ? <span>{biz.distance.toFixed(1)} km away</span> : null}
                              {biz.hours ? <span>{biz.hours}</span> : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                              {biz.rating.toFixed(1)} stars
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400">
                              {biz.reviewCount} reviews
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audited reviews List Module */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Verified Customer Reviews ({selectedBizReviews.length})
                </h4>

                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {selectedBizReviews.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px] py-2 text-center bg-slate-50 rounded-lg">
                      No customer reviews yet. Be the first to verify and post matching feedback!
                    </p>
                  ) : (
                    pagedSelectedBizReviews.map(rev => (
                      <div key={rev.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            👤 {rev.userName} 
                            <span className="bg-emerald-50 text-emerald-800 text-[9px] px-1.5 rounded border border-emerald-150 font-bold flex items-center gap-0.5" title="OTP Verified review creator">
                              ✓ OTP Verified
                            </span>
                          </span>
                          <span className="text-[10px] text-amber-600 font-mono font-bold">
                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          </span>
                        </div>
                        <p className="text-slate-650 leading-relaxed font-sans">{rev.comment}</p>
                        <span className="text-[9px] text-slate-450 block font-mono">Posted: {new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
                <PaginationControls
                  compact
                  currentPage={safeReviewsPage}
                  totalPages={reviewsTotalPages}
                  onPageChange={setReviewsPage}
                />

                {/* Submit Ratings after verification check */}
                {userSession.isAuthenticated && userSession.userPhone ? (
                  <form onSubmit={handlePostReview} className="bg-indigo-55/40 border border-indigo-100 rounded-2xl p-4 mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-850">Leave Verified review:</span>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 mr-2 uppercase font-mono font-bold">Score rating:</span>
                        {[1, 2, 3, 4, 5].map(starNum => (
                          <button
                            type="button"
                            key={starNum}
                            onClick={() => setNewRating(starNum)}
                            className="text-amber-500 hover:scale-110 active:scale-95 transition"
                          >
                            <Star className={`w-4 h-4 ${newRating >= starNum ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      placeholder="Share your authentic consumer service experience..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-mono font-bold text-[10px] py-2 rounded-xl shadow-xs transition"
                    >
                      Post Audited Review Packet
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4 mt-2 text-center space-y-2.5">
                    <p className="text-[11px] text-slate-600 leading-normal">
                      🔒 You must authenticate your mobile number via safe OTP check before uploading verified rating comments. This prevents scraper bot spam campaigns.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpTargetBiz(selectedBiz);
                        setShowOtpModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] px-3.5 py-1.5 rounded-lg font-bold transition font-mono shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Authenticate Phone via SMS OTP
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <a 
                  href={selectedBiz.website || buildAbsoluteListingUrl(selectedBiz)}
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs py-2.5 rounded-xl text-center shadow flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> {selectedBiz.website ? 'Visit Website' : 'Open Listing'}
                </a>
                <button
                  type="button"
                  onClick={() => openBusinessDirectionsDirect(selectedBiz)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </button>
                <button 
                  type="button"
                  onClick={() => void handleShareBusinessListing(selectedBiz)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Listing
                </button>
                <button
                  type="button"
                  onClick={() => handleShareBusinessToWhatsapp(selectedBiz)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const result = onToggleComparedBusiness(selectedBiz.id);
                    if (!result.allowed && result.reason) {
                      alert(result.reason);
                    }
                  }}
                  className={`col-span-2 font-mono font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    isBusinessCompared(selectedBiz.id)
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" /> {isBusinessCompared(selectedBiz.id) ? 'Added to Compare' : 'Add to Compare'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="col-span-2 rounded-xl border border-[#FFD54F] bg-[#FFF4CC] py-2.5 text-xs font-bold text-[#0D1B2A] transition hover:bg-[#ffeaa2]"
                >
                  Claim This Listing
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="col-span-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Contact Sales For Premium Visibility
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {recommendationRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-800 px-5 py-4 text-white">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-100">Recommendation Request</div>
                <h3 className="mt-1 text-base font-extrabold">Ask Localisy to find the right business</h3>
              </div>
              <button
                type="button"
                onClick={() => setRecommendationRequestOpen(false)}
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleRecommendationRequestSubmit} className="space-y-4 p-5 text-xs">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Full name *</label>
                  <input
                    type="text"
                    required
                    value={recommendationRequestName}
                    onChange={(e) => setRecommendationRequestName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Mobile number *</label>
                  <input
                    type="tel"
                    required
                    value={recommendationRequestPhone}
                    onChange={(e) => setRecommendationRequestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">What are you looking for? *</label>
                  <input
                    type="text"
                    required
                    value={recommendationRequestNeed}
                    onChange={(e) => setRecommendationRequestNeed(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                    placeholder="e.g. women-led home baker near Roadpali"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recommendationRequestPincode}
                    onChange={(e) => setRecommendationRequestPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono"
                    placeholder="410218"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">Preferences or notes</label>
                <textarea
                  rows={4}
                  value={recommendationRequestNotes}
                  onChange={(e) => setRecommendationRequestNotes(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  placeholder="Share budget, urgency, location preference, parking need, women-led preference, home visit need, or any other context."
                />
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[11px] leading-relaxed text-emerald-900">
                Your request will be posted to the locality recommendation board so ops or local contributors can guide you to relevant listings.
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecommendationRequestOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeLeadAd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-indigo-700 text-white">
              <span className="text-[10px] uppercase tracking-wider font-mono">Lead Generation Form</span>
              <h4 className="text-sm font-extrabold mt-1">{activeLeadAd.title}</h4>
            </div>
            <form onSubmit={handleAdLeadSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={leadMobile}
                  onChange={(e) => setLeadMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={leadPincode}
                  onChange={(e) => setLeadPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="6-digit pincode"
                />
              </div>
              {activeLeadAd.sellerBusinessId && (
                <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
                  This lead will be visible to seller account <strong>{activeLeadAd.sellerBusinessId}</strong> and platform admin.
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveLeadAd(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Submit Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewAllModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-3 backdrop-blur-sm md:items-center md:justify-center md:p-6">
          <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950">{viewAllModal.title}</h3>
                <p className="mt-1 text-xs text-slate-500">Complete list for this section.</p>
              </div>
              <button
                type="button"
                onClick={() => setViewAllModal(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto px-4 py-4 md:px-6">
              {viewAllModal.kind === 'offers' && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {viewAllModal.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.businessId) {
                          const biz = businesses.find((business) => business.id === item.businessId);
                          if (biz) openBusinessDetails(biz);
                        }
                        setViewAllModal(null);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                          {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Ticket className="h-6 w-6 text-indigo-600" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.businessName}</div>
                          <div className="mt-1 text-xs font-semibold text-emerald-700">{item.discount}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {viewAllModal.kind === 'updates' && (
                <div className="space-y-3">
                  {viewAllModal.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setViewAllModal(null)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || carouselImages[0]}
                          alt={item.title}
                          className="h-16 w-20 flex-shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.type}</div>
                          <div className="truncate text-sm font-bold text-slate-900">{item.title}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-slate-500">{item.content}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {viewAllModal.kind === 'businesses' && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {viewAllModal.items.map((biz) => (
                    <button
                      key={biz.id}
                      type="button"
                      onClick={() => {
                        openBusinessDetails(biz);
                        setViewAllModal(null);
                      }}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <img src={getBusinessImageUrl(biz)} alt={biz.name} className="h-32 w-full object-cover" />
                      <div className="space-y-1 p-4">
                        <div className="truncate text-sm font-bold text-slate-900">{biz.name}</div>
                        <div className="text-xs text-slate-500">{getBusinessCategoryLabel(biz)}</div>
                        <div className="text-xs font-semibold text-amber-600">★ {biz.rating} ({biz.reviewCount})</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {viewAllModal.kind === 'categories' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {viewAllModal.items.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        handleCategoryShortcut(category.id);
                        setViewAllModal(null);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <div className="text-sm font-bold text-slate-900">{category.name}</div>
                    </button>
                  ))}
                </div>
              )}
              {viewAllModal.kind === 'emergency' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {viewAllModal.items.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        handleCategoryShortcut(category.id);
                        setViewAllModal(null);
                      }}
                      className="rounded-2xl border border-rose-100 bg-white p-3 text-left shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
                    >
                      <div className="text-sm font-bold text-slate-900">{category.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Modal for adding businesses */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex justify-between items-center">
              <div>
                <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase">
                  Verify &amp; List
                </span>
                <h3 className="text-base font-extrabold tracking-tight font-sans text-white mt-1">
                  Add Your Hyper Local Business to {currentLocality.name}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setApplyFormError('');
                  setApplyDuplicateBusinessId(null);
                  setShowApplyModal(false);
                }}
                className="text-slate-200 hover:text-white font-mono font-bold text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {applyFormError && (
                <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                  <div className="text-[11px] font-semibold leading-relaxed">{applyFormError}</div>
                  {applyDuplicateBusiness && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowApplyModal(false);
                        setApplyFormError('');
                        setApplyDuplicateBusinessId(null);
                        openBusinessDetails(applyDuplicateBusiness);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open existing listing</span>
                    </button>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pali Hill Bakers"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    required
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      setCategoryId(nextCategory);
                      setSubcategoryId(resolveDefaultSubcategoryId(nextCategory));
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    {BUSINESS_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subcategory *</label>
                  <select
                    value={subcategoryId}
                    required
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    {getSubcategoriesForCategory(categoryId).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Master Geographical State, City, Areas selectors */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <span className="block text-[10px] uppercase font-mono font-bold text-slate-400">Master Geological Structure:</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State *</label>
                    <select
                      value={formStateId}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    >
                      {MASTER_STATES.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City *</label>
                    <select
                      value={formCityId}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    >
                      {MASTER_CITIES.filter(c => c.stateId === formStateId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Multi-select Checklist for operational cities */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Areas of Operation Checklist (Select Master Neighborhoods) *
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">Configure neighborhoods your service operators serve:</p>
                  
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                    {MASTER_AREAS.filter(a => a.cityId === formCityId).map(area => {
                      const active = formAreasOfOperation.includes(area.id);
                      return (
                        <label 
                          key={area.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer select-none transition ${
                            active 
                              ? 'bg-indigo-50/50 border-indigo-200 font-semibold text-indigo-900' 
                              : 'bg-transparent border-slate-100 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => handleAreaCheckToggle(area.id)}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                          <span className="text-[10px]">{area.name} ({area.pincode})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pinpoint Google Maps Picker Integrator */}
              <GoogleLocationPicker 
                cityName={MASTER_CITIES.find(c => c.id === formCityId)?.name || 'Mumbai'}
                onLocationGrabbed={(mockAddr, coords) => {
                  setAddress(mockAddr);
                  setGpsCoords(coords);
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Claimed Owner / Applicant</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Owner's full name"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Working Hours Schema</label>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 10:00 AM - 08:30 PM"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Listing Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={listingPincode}
                    onChange={(e) => setListingPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 400001"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 22 5550 4321"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@shop.in (Optional)"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Verified Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, landmark details..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website URL (Optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myshop.in"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cover Picture URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Unsplash picture direct URL link"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">SME Business description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Summarize coordinates, specialties, or certifications..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-emerald-900 leading-normal">
                <ShieldAlert className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px]">
                  All listings go through a strict integrity audit in the administrator operator moderation panel to avoid address spamming. Approved listings display within 1 hour.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs py-3 rounded-xl shadow-md transition"
              >
                Send Verification Application Request
              </button>
            </form>
          </div>
        </div>
      )}

      {showAllCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-3 backdrop-blur-sm md:items-center md:justify-center md:p-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950">Explore Categories</h3>
                <p className="mt-1 text-xs text-slate-500">Choose any category to open matching businesses.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCategoriesModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-4 py-4 md:px-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {BUSINESS_CATEGORIES.map((category) => {
                  const tone = iconToneByCategory[category.id] || { Icon: Grid3X3, iconClassName: 'text-indigo-600', bgClassName: 'bg-indigo-50' };
                  const Icon = tone.Icon;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setShowAllCategoriesModal(false);
                        handleCategoryShortcut(category.id);
                      }}
                      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone.bgClassName}`}>
                        <Icon className={`h-4 w-4 ${tone.iconClassName}`} />
                      </span>
                      <span className="mt-3 block text-sm font-bold leading-tight text-slate-900">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[26px] border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur md:hidden">
        <div className="grid grid-cols-5 items-end gap-2 text-[11px] font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 text-indigo-600"
          >
            <Home className="h-5 w-5 fill-indigo-100" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={scrollToPublicSearch}
            className="flex flex-col items-center gap-1"
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            className="-mt-8 flex flex-col items-center gap-1 text-indigo-600"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
              <CirclePlus className="h-7 w-7" />
            </span>
            <span>Add Business</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePortalTab('merchant')}
            className="flex flex-col items-center gap-1"
          >
            <Bookmark className="h-5 w-5" />
            <span>Saved</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePortalTab('merchant')}
            className="flex flex-col items-center gap-1"
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* Embedded Verification Modal wrapper */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerifySuccess={handleOtpSuccess}
        businessName={otpTargetBiz?.name}
      />

    </div>
  );
}
