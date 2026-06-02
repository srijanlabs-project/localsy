import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { 
  INITIAL_LOCALITIES, INITIAL_BUSINESSES, INITIAL_CATEGORIES, INITIAL_REVIEWS,
  INITIAL_COMMUNITY_ITEMS, INITIAL_CRM_CONTACTS, INITIAL_COUPONS, MASTER_AREAS
} from './data';
import { 
  Locality, Business, SubdomainMapping, Review, UserSession, UserRole,
  CommunityItem, CRMContact, MarketingCoupon, AuditEvent, ListingAd, AdLead, HeroBanner
} from './types';
import WebPortal from './components/WebPortal';
import PincodeSelectionModal from './components/PincodeSelectionModal';
import AuthModal from './components/AuthModal';
import happyBusinessLogo from './assets/happy-business-logo.png';
import { 
  Layout, Smartphone, Shield, BookOpen, Layers, RefreshCw, 
  User, CheckCircle, ShieldAlert, KeyRound, Wrench, Briefcase, HelpCircle,
  Sliders, Settings, X, Database, MapPin, Search, LogOut, ChevronDown
} from 'lucide-react';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
  resolveDefaultSubcategoryId,
  resolveMasterCategoryId
} from './categoryMaster';

const DEFAULT_PINCODE_MAPPINGS: Array<{ pincode: string; localityId: string }> = [
  { pincode: '410101', localityId: 'roadpali' }, // Kalamboli (routed to Roadpali/Kalamboli single page)
  { pincode: '410218', localityId: 'roadpali' }, // Kalamboli (routed to Roadpali/Kalamboli single page)
  { pincode: '410210', localityId: 'kharghar' },
  { pincode: '410209', localityId: 'kamothe' },
  { pincode: '410206', localityId: 'panvel' },
  { pincode: '410221', localityId: 'panvel' },
  { pincode: '410208', localityId: 'taloja' },
];

const resolveBusinessPincode = (business: Business): string => {
  if (business.pincode && /^\d{6}$/.test(business.pincode)) return business.pincode;
  return MASTER_AREAS.find((area) => area.id === business.areaId)?.pincode || '';
};

const normalizeBusinessTaxonomy = (business: Business): Business => {
  const categoryId = resolveMasterCategoryId(business.categoryId);
  return {
    ...business,
    categoryId,
    subcategoryId: business.subcategoryId || resolveDefaultSubcategoryId(business.categoryId),
    pincode: resolveBusinessPincode({ ...business, categoryId })
  };
};

const normalizeStoredBusiness = (business: Business): Business => {
  const normalized = normalizeBusinessTaxonomy(business);
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

type SeoRouteIntent = {
  id: string;
  slug: string;
  categoryId: string;
  q: string;
  labelPrefix: string;
};

const SEO_ROUTE_INTENTS: SeoRouteIntent[] = [
  { id: 'electrician', slug: 'electrician', categoryId: 'home-services', q: 'Electrician', labelPrefix: 'Electrician' },
  { id: 'salon', slug: 'salon', categoryId: 'beauty-wellness', q: 'Salon', labelPrefix: 'Salon' },
  { id: 'dental', slug: 'dental-clinic', categoryId: 'health-medical', q: 'Dental Clinic', labelPrefix: 'Dental Clinic' },
  { id: 'restaurant', slug: 'restaurant', categoryId: 'food-restaurants', q: 'Restaurant', labelPrefix: 'Restaurant' },
  { id: 'grocery', slug: 'grocery-store', categoryId: 'shopping-retail', q: 'Grocery Store', labelPrefix: 'Grocery Store' },
  { id: 'chartered', slug: 'ca', categoryId: 'professional-services', q: 'Chartered Accountant', labelPrefix: 'CA' },
];

const slugifyForUrl = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const ProposalPanel = lazy(() => import('./components/ProposalPanel'));
const AndroidSimulator = lazy(() => import('./components/AndroidSimulator'));
const AdminConsole = lazy(() => import('./components/AdminConsole'));

export default function App() {
  const PRODUCTION_MODE = true;
  // Database version management to clear stale browser caches when definitions evolve
  const CURRENT_DB_VERSION = 'yp_v14_seo_subdomain_routes';
  
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
      localStorage.setItem('yp_cache_version', CURRENT_DB_VERSION);
    }
  });

  // Load from local storage or fallback to defaults
  const [localities, setLocalities] = useState<Locality[]>(() => {
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
    }
    return INITIAL_LOCALITIES;
  });

  const [businesses, setBusinesses] = useState<Business[]>(() => {
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
    return INITIAL_BUSINESSES.map(normalizeStoredBusiness);
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('yp_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [subdomains, setSubdomains] = useState<SubdomainMapping[]>(() => {
    const saved = localStorage.getItem('yp_subdomains');
    if (saved) return JSON.parse(saved);

    // Bootstrap subdomain maps from primary states
    return INITIAL_LOCALITIES.map(l => ({
      domain: l.subdomain,
      localityId: l.id,
      sslEnabled: true,
      dnsStatus: 'active' as const,
      createdAt: new Date().toISOString()
    }));
  });

  const [defaultLocalityId, setDefaultLocalityId] = useState<string>(() => {
    return localStorage.getItem('yp_default_locality_id') || 'roadpali';
  });

  const [activeLocalityId, setActiveLocalityId] = useState<string>(() => {
    const savedLoc = localStorage.getItem('yp_saved_locality_id');
    if (savedLoc) return savedLoc;
    return localStorage.getItem('yp_default_locality_id') || 'roadpali';
  });

  const [savedPincode, setSavedPincode] = useState<string | null>(() => {
    return localStorage.getItem('yp_saved_pincode');
  });

  const [showPincodeModal, setShowPincodeModal] = useState<boolean>(() => {
    const prompted = localStorage.getItem('yp_pincode_prompted');
    return !prompted;
  });

  const [pincodeMappings, setPincodeMappings] = useState<Array<{ pincode: string; localityId: string }>>(() => {
    const saved = localStorage.getItem('yp_pincode_mappings');
    if (saved) return JSON.parse(saved);
    return DEFAULT_PINCODE_MAPPINGS;
  });

  const [listingAds, setListingAds] = useState<ListingAd[]>(() => {
    const saved = localStorage.getItem('yp_listing_ads');
    if (saved) return JSON.parse(saved);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 10);
    return [
      {
        id: 'ad_seed_1',
        title: 'Roadpali Fiber Upgrade Drive',
        description: 'Get high-speed broadband installation and starter plan offers this month.',
        badge: 'Local ISP Sponsor',
        ctaText: 'View Offer',
        backgroundColor: '#1d4ed8',
        startDate,
        endDate,
        actionType: 'landing_page',
        targetUrl: 'https://www.jio.com/fiber',
        isActive: true
      }
    ];
  });

  const [adLeads, setAdLeads] = useState<AdLead[]>(() => {
    const saved = localStorage.getItem('yp_ad_leads');
    return saved ? JSON.parse(saved) : [];
  });

  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(() => {
    const saved = localStorage.getItem('yp_hero_banners');
    if (saved) return JSON.parse(saved);
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
    return INITIAL_LOCALITIES.map((locality) => ({
      id: `hero_${locality.id}`,
      localityId: locality.id,
      title: `Hyper Local Directory for ${locality.name.split(',')[0]}`,
      subtitle: `${locality.description} verified reviews, location-grabbing utilities, and dynamic approval tracking.`,
      imageUrl: (locality.carouselImages && locality.carouselImages[0]) || locality.coverImage,
      startDate,
      endDate,
      isActive: true
    }));
  });

  const [urlCategoryFilter, setUrlCategoryFilter] = useState<string | null>(null);
  const [urlSubcategoryFilter, setUrlSubcategoryFilter] = useState<string | null>(null);
  const [urlSearchFilter, setUrlSearchFilter] = useState<string | null>(null);
  const [urlFilterNonce, setUrlFilterNonce] = useState(0);
  const [urlSelectedBusinessId, setUrlSelectedBusinessId] = useState<string | null>(null);
  const [urlSelectionNonce, setUrlSelectionNonce] = useState(0);

  const [localityCategoryLinks, setLocalityCategoryLinks] = useState<LocalityCategoryLink[]>(() => {
    const saved = localStorage.getItem('yp_locality_category_links');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const seoIntentBySlug = useMemo(() => {
    const lookup = new Map<string, SeoRouteIntent>();
    for (const intent of SEO_ROUTE_INTENTS) {
      lookup.set(intent.slug, intent);
    }
    return lookup;
  }, []);

  const categorySlugLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const category of BUSINESS_CATEGORIES) {
      lookup.set(category.id.toLowerCase(), category.id);
      lookup.set(category.slug.toLowerCase(), category.id);
      lookup.set(slugifyForUrl(category.name), category.id);
    }
    for (const category of INITIAL_CATEGORIES) {
      if (category.id === 'all') continue;
      lookup.set(category.id.toLowerCase(), resolveMasterCategoryId(category.id));
      lookup.set(slugifyForUrl(category.name), resolveMasterCategoryId(category.id));
    }
    return lookup;
  }, []);

  const seoIntentByCategoryAndQuery = useMemo(() => {
    const lookup = new Map<string, SeoRouteIntent>();
    for (const intent of SEO_ROUTE_INTENTS) {
      lookup.set(`${intent.categoryId}::${intent.q.toLowerCase()}`, intent);
    }
    return lookup;
  }, []);

  const seoDefaultIntentByCategory = useMemo(() => {
    const lookup = new Map<string, SeoRouteIntent>();
    for (const intent of SEO_ROUTE_INTENTS) {
      if (!lookup.has(intent.categoryId)) {
        lookup.set(intent.categoryId, intent);
      }
    }
    return lookup;
  }, []);

  const [activeView, setActiveView] = useState<'proposal' | 'web' | 'android' | 'admin'>('web'); // Default to pubic web portal for instant aesthetics!
  const [showSandbox, setShowSandbox] = useState(false); // Controls floating simulation HUD
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          authToken: token,
          isAuthenticated: true,
        });
      })
      .catch(() => {
        localStorage.removeItem('yp_auth_token');
      });
  }, []);

  // Track the business IDs for which the current user has performed OTP verification to unlock contact details
  const [viewedBusinessIds, setViewedBusinessIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('yp_viewed_bizs');
    return saved ? JSON.parse(saved) : ['s1']; // Pre-authorize s1 for quick visual overview
  });

  const [communityItems, setCommunityItems] = useState<CommunityItem[]>(() => {
    const saved = localStorage.getItem('yp_community');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_ITEMS;
  });

  const [crmContacts, setCrmContacts] = useState<CRMContact[]>(() => {
    const saved = localStorage.getItem('yp_crm');
    return saved ? JSON.parse(saved) : INITIAL_CRM_CONTACTS;
  });

  const [coupons, setCoupons] = useState<MarketingCoupon[]>(() => {
    const saved = localStorage.getItem('yp_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
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

  const persistBusinessesToServer = (nextBusinesses: Business[]) => {
    fetch('/api/businesses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businesses: nextBusinesses })
    }).catch(() => {
      // Local cache remains the fallback when the API is unavailable.
    });
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/businesses')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { businesses?: Business[] } | null) => {
        if (cancelled || !Array.isArray(data?.businesses)) return;
        if (data.businesses.length === 0) {
          persistBusinessesToServer(businesses);
          return;
        }
        setBusinesses((prev) => {
          const remoteBusinesses = data.businesses || [];
          const next = mergeBusinessCollections(prev, remoteBusinesses);
          if (next.length > remoteBusinesses.length) persistBusinessesToServer(next);
          return next;
        });
      })
      .catch(() => {
        // Static/local builds keep using localStorage and seed data.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Push state to localStorage on any updates
  useEffect(() => {
    localStorage.setItem('yp_localities', JSON.stringify(localities));
  }, [localities]);

  useEffect(() => {
    localStorage.setItem('yp_pincode_mappings', JSON.stringify(pincodeMappings));
  }, [pincodeMappings]);

  useEffect(() => {
    localStorage.setItem('yp_default_locality_id', defaultLocalityId);
  }, [defaultLocalityId]);

  useEffect(() => {
    localStorage.setItem('yp_businesses', JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem('yp_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('yp_subdomains', JSON.stringify(subdomains));
  }, [subdomains]);

  useEffect(() => {
    localStorage.setItem('yp_user_session', JSON.stringify(userSession));
  }, [userSession]);

  useEffect(() => {
    localStorage.setItem('yp_viewed_bizs', JSON.stringify(viewedBusinessIds));
  }, [viewedBusinessIds]);

  useEffect(() => {
    localStorage.setItem('yp_community', JSON.stringify(communityItems));
  }, [communityItems]);

  useEffect(() => {
    localStorage.setItem('yp_crm', JSON.stringify(crmContacts));
  }, [crmContacts]);

  useEffect(() => {
    localStorage.setItem('yp_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('yp_listing_ads', JSON.stringify(listingAds));
  }, [listingAds]);

  useEffect(() => {
    localStorage.setItem('yp_ad_leads', JSON.stringify(adLeads));
  }, [adLeads]);

  useEffect(() => {
    localStorage.setItem('yp_hero_banners', JSON.stringify(heroBanners));
  }, [heroBanners]);

  useEffect(() => {
    localStorage.setItem('yp_locality_category_links', JSON.stringify(localityCategoryLinks));
  }, [localityCategoryLinks]);

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
        } else {
          const categoryFromSlug = categorySlugLookup.get(intentOrCategorySegment);
          if (categoryFromSlug) {
            resolvedCategoryId = categoryFromSlug;
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
        if (categoryParam && INITIAL_CATEGORIES.some((category) => category.id === categoryParam)) {
          resolvedCategoryId = categoryParam;
        } else if (categoryParam === 'all') {
          resolvedCategoryId = 'all';
        }
      }

      const searchParam = (params.get('q') || '').trim();
      if (!resolvedSearch && searchParam) {
        resolvedSearch = searchParam;
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
      setUrlSelectedBusinessId(resolvedBusinessId);
      setUrlFilterNonce((prev) => prev + 1);
      setUrlSelectionNonce((prev) => prev + 1);
    };

    applySeoUrlState();
    window.addEventListener('popstate', applySeoUrlState);
    return () => window.removeEventListener('popstate', applySeoUrlState);
  }, [localities, businesses, seoIntentBySlug, categorySlugLookup]);

  // Unified logger for complete client-side security compliance auditing
  const logAuditEvent = (actionType: 'search' | 'contact_view' | 'data_entry', description: string, details: string) => {
    const ipAddress = `103.${45 + Math.floor(Math.random() * 40)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const userAgent = navigator.userAgent || 'Mozilla/5.0';
    const deviceCode = `${userAgent.split(' ')[0]} (H:${window.screen.height}, W:${window.screen.width}, DPR:${window.devicePixelRatio})`;
    
    const freshLog: AuditEvent = {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType,
      description,
      details,
      ipAddress,
      deviceCode,
      userName: userSession.userName || 'Anonymous Explorer'
    };
    
    setAuditLogs(prev => [freshLog, ...prev]);

    // Persist audit events server-side for public deployment traceability.
    // This is best-effort and should never block UX interactions.
    fetch('/api/audit-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(freshLog),
    }).catch(() => {
      // Keep silent fallback to local state/localStorage if server logging fails.
    });
  };

  // Actions
  const handleAddCommunityItem = (item: Omit<CommunityItem, 'id' | 'createdAt' | 'likes'>) => {
    const fresh: CommunityItem = {
      ...item,
      id: `comm_${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    setCommunityItems(prev => [fresh, ...prev]);
    logAuditEvent('data_entry', `Created community board discussion: "${item.title}"`, `Category type: ${item.type} | Region shard: ${item.localityId}`);
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
    const fresh: MarketingCoupon = {
      ...coupon,
      id: `cpn_${Date.now()}`,
      usageCount: 0
    };
    setCoupons(prev => [fresh, ...prev]);
    logAuditEvent('data_entry', `Launched promotional listing coupon code: "${coupon.code}"`, `Discount: ${coupon.discount} | Business ID: ${coupon.businessId}`);
  };

  const handleCreateListingAd = (adInput: Omit<ListingAd, 'id'>) => {
    const freshAd: ListingAd = {
      ...adInput,
      id: `ad_${Date.now()}`
    };
    setListingAds((prev) => [freshAd, ...prev]);
    logAuditEvent('data_entry', `Created listing ad banner`, `Ad: "${adInput.title}" | Action: ${adInput.actionType}`);
  };

  const handleUpdateListingAd = (ad: ListingAd) => {
    setListingAds((prev) => prev.map((existing) => (existing.id === ad.id ? ad : existing)));
    logAuditEvent('data_entry', `Updated listing ad banner`, `Ad ID: ${ad.id}`);
  };

  const handleDeleteListingAd = (adId: string) => {
    setListingAds((prev) => prev.filter((ad) => ad.id !== adId));
    setAdLeads((prev) => prev.filter((lead) => lead.adId !== adId));
    logAuditEvent('data_entry', `Deleted listing ad banner`, `Ad ID: ${adId}`);
  };

  const handleCreateHeroBanner = (bannerInput: Omit<HeroBanner, 'id'>) => {
    const freshBanner: HeroBanner = {
      ...bannerInput,
      id: `hero_${Date.now()}`
    };
    setHeroBanners((prev) => [freshBanner, ...prev]);
    logAuditEvent('data_entry', `Created hero banner`, `Locality: ${bannerInput.localityId}`);
  };

  const handleUpdateHeroBanner = (banner: HeroBanner) => {
    setHeroBanners((prev) => prev.map((existing) => (existing.id === banner.id ? banner : existing)));
    logAuditEvent('data_entry', `Updated hero banner`, `Hero ID: ${banner.id}`);
  };

  const handleDeleteHeroBanner = (bannerId: string) => {
    setHeroBanners((prev) => prev.filter((banner) => banner.id !== bannerId));
    logAuditEvent('data_entry', `Deleted hero banner`, `Hero ID: ${bannerId}`);
  };

  const handleSubmitAdLead = (leadInput: Omit<AdLead, 'id' | 'createdAt'>) => {
    const freshLead: AdLead = {
      ...leadInput,
      id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    setAdLeads((prev) => [freshLead, ...prev]);

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
    setLocalityCategoryLinks((prev) => [linkRecord, ...prev]);
    logAuditEvent(
      'data_entry',
      'Created locality-category URL mapping',
      `Locality: ${payload.localityId} | Category: ${payload.categoryId} | Subcategory: ${payload.subcategoryId || 'all'}`
    );
  };

  const handleDeleteLocalityCategoryLink = (id: string) => {
    setLocalityCategoryLinks((prev) => prev.filter((row) => row.id !== id));
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

    setLocalities(prev => [...prev, newLoc]);
    setSubdomains(prev => [...prev, newSub]);
    logAuditEvent('data_entry', `Provisioned new municipal zone shard database and SSL routing: "${name}"`, `Virtual host bound to: ${subdomain}`);
  };

  const handleDeleteLocality = (locId: string) => {
    const target = localities.find(l => l.id === locId);
    setLocalities(prev => prev.filter(l => l.id !== locId));
    setSubdomains(prev => prev.filter(s => s.localityId !== locId));
    // Re-route if deleting current active locality
    if (activeLocalityId === locId) {
      const remaining = localities.filter(l => l.id !== locId);
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
      const normalized = {
        ...updatedBiz,
        pincode: updatedBiz.pincode || MASTER_AREAS.find((area) => area.id === updatedBiz.areaId)?.pincode || ''
      };
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
  const handleRegisterContactView = (businessId: string) => {
    setViewedBusinessIds(prev => prev.includes(businessId) ? prev : [...prev, businessId]);
    const b = businesses.find(x => x.id === businessId);
    logAuditEvent('contact_view', `Unlocked business contact coordinates (OTP Verified)`, `Revealed contact for "${b?.name || businessId}" | Listing ID: ${businessId}`);
  };

  const handleResetData = () => {
    if (confirm("Reset application data back to Indian defaults? This clears pending/registered custom edits.")) {
      localStorage.removeItem('yp_localities');
      localStorage.removeItem('yp_businesses');
      localStorage.removeItem('yp_subdomains');
      localStorage.removeItem('yp_reviews');
      localStorage.removeItem('yp_user_session');
      localStorage.removeItem('yp_viewed_bizs');
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
      
      setLocalities(INITIAL_LOCALITIES);
      setBusinesses(INITIAL_BUSINESSES.map(normalizeStoredBusiness));
      setReviews(INITIAL_REVIEWS);
      setCommunityItems(INITIAL_COMMUNITY_ITEMS);
      setCrmContacts(INITIAL_CRM_CONTACTS);
      setCoupons(INITIAL_COUPONS);
      setListingAds([]);
      setAdLeads([]);
      setHeroBanners(INITIAL_LOCALITIES.map((locality) => ({
        id: `hero_${locality.id}`,
        localityId: locality.id,
        title: `Hyper Local Directory for ${locality.name.split(',')[0]}`,
        subtitle: `${locality.description} verified reviews, location-grabbing utilities, and dynamic approval tracking.`,
        imageUrl: (locality.carouselImages && locality.carouselImages[0]) || locality.coverImage,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
        isActive: true
      })));
      setLocalityCategoryLinks([]);
      setSubdomains(INITIAL_LOCALITIES.map(l => ({
        domain: l.subdomain,
        localityId: l.id,
        sslEnabled: true,
        dnsStatus: 'active' as const,
        createdAt: new Date().toISOString()
      })));
      setViewedBusinessIds(['s1']);
      setUserSession({
        role: 'buyer',
        userName: 'Karan Malhotra (Verified Citizen)',
        userPhone: '+91 80011 22334',
        isAuthenticated: true
      });
      setActiveLocalityId('roadpali');
      setSavedPincode(null);
      setShowPincodeModal(true);
      setDefaultLocalityId('roadpali');
      setPincodeMappings(DEFAULT_PINCODE_MAPPINGS);
      setUrlCategoryFilter(null);
      setUrlSubcategoryFilter(null);
      setUrlFilterNonce(0);
      alert("Application storage cleared & restored to Roadpali metrics!");
    }
  };

  // Pincode Routing Engine operations
  const handleSavePincode = (pincode: string | null, matchedLocalityId: string) => {
    setSavedPincode(pincode);
    if (pincode) {
      localStorage.setItem('yp_saved_pincode', pincode);
      localStorage.setItem('yp_saved_locality_id', matchedLocalityId);
      window.history.pushState({}, '', `${window.location.origin}/pin/${pincode}`);
    } else {
      localStorage.removeItem('yp_saved_pincode');
      localStorage.removeItem('yp_saved_locality_id');
      window.history.pushState({}, '', `${window.location.origin}/`);
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
    setPincodeMappings(prev => {
      const filtered = prev.filter(m => m.pincode !== pincode);
      return [...filtered, { pincode, localityId }];
    });
    logAuditEvent('data_entry', `Added dynamic route mapping`, `Bind Postal: "${pincode}" -> Regional Node: "${localityId}"`);
  };

  const handleDeletePincodeMapping = (pincode: string) => {
    setPincodeMappings(prev => prev.filter(m => m.pincode !== pincode));
    logAuditEvent('data_entry', `Deleted route mapping`, `De-registered routing for Pincode: "${pincode}"`);
  };

  const handleChangeDefaultLocalityId = (localityId: string) => {
    setDefaultLocalityId(localityId);
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
      }

      const directLink = localityCategoryLinks.find((link) => link.slug.toLowerCase() === pathParts.join('/').toLowerCase());
      if (directLink) {
        localityToken = directLink.localityId;
        categoryToken = directLink.categoryId;
        subcategoryToken = directLink.subcategoryId || subcategoryToken;
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
  }>) => {
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
          next[existingIndex] = {
            ...next[existingIndex],
            name,
            categoryId: row.categoryId || inferCategory(row.services || ''),
            subcategoryId: row.subcategoryId || resolveDefaultSubcategoryId(row.categoryId || inferCategory(row.services || '')),
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
            tags: (row.services || next[existingIndex].tags.join(',')).split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
            gpsCoordinates: lat !== undefined && lng !== undefined ? { lat, lng } : next[existingIndex].gpsCoordinates,
          };
          skipped++;
          continue;
        }

        if (existingIndex >= 0) {
          skipped++;
          continue;
        }

        next.unshift({
          id: `csv_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          name,
          categoryId: row.categoryId || inferCategory(row.services || ''),
          subcategoryId: row.subcategoryId || resolveDefaultSubcategoryId(row.categoryId || inferCategory(row.services || '')),
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
          tags: (row.services || 'Imported').split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
          ownerName: 'Imported via CSV',
          gpsCoordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
        });
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
    SEO_ROUTE_INTENTS.map((intent) => ({
      ...intent,
      label: `${intent.labelPrefix} in ${activeLocalityName}`,
    }))
  ), [activeLocalityName]);

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
    const normalizedPin = savedPincode?.replace(/\D/g, '') || '';
    if (/^\d{6}$/.test(normalizedPin)) {
      const matched = pincodeMappings.find((mapping) => mapping.pincode === normalizedPin);
      if (matched) {
        setActiveLocalityId(matched.localityId);
      }
      const homeUrl = `${window.location.origin}/pin/${normalizedPin}`;
      window.history.pushState({}, '', homeUrl);
    } else {
      window.history.pushState({}, '', `${window.location.origin}/`);
    }
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
    const siteName = 'Happy Gifting Businesses';
    const seoTitle = (urlSearchFilter && urlSearchFilter.trim())
      ? `${urlSearchFilter.trim()} in ${activeLocalityName} | ${siteName}`
      : (urlCategoryFilter && urlCategoryFilter !== 'all')
        ? `${seoCategoryName || 'Businesses'} in ${activeLocalityName} | ${siteName}`
        : `${activeLocalityName} Local Business Directory | ${siteName}`;

    const seoDescription = (urlCategoryFilter && urlCategoryFilter !== 'all')
      ? `Find verified ${seoCategoryName.toLowerCase()} in ${activeLocalityName} with phone, address, ratings, and service details.`
      : `Explore verified local businesses in ${activeLocalityName}, including shops, clinics, salons, restaurants, and home services.`;

    const origin = window.location.origin;
    const activeLocalityPath = buildLocalityPath(activeLocality?.id || 'roadpali');
    const canonicalPath = buildSeoPath(activeLocality?.id || 'roadpali', urlCategoryFilter, urlSearchFilter);
    const canonicalUrl = `${origin}${canonicalPath}`;
    const categoryOrSearchText = [seoCategoryName, urlSearchFilter].filter(Boolean).join(', ');
    const keywordSet = [
      `${activeLocalityName} businesses`,
      `${activeLocalityName} local services`,
      categoryOrSearchText,
      ...seoFooterLinks.map((link) => link.label),
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
    setPropertyMeta('og:type', 'website');
    setPropertyMeta('og:site_name', siteName);
    setPropertyMeta('og:title', seoTitle);
    setPropertyMeta('og:description', seoDescription);
    setPropertyMeta('og:url', canonicalUrl);

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600/15 relative">
      
      {/* Top Navigation Frame - Pristine, Live, Human-labeled web directory */}
      <nav id="platform-navbar" className="bg-white border-b border-slate-200 sticky top-0 md:top-auto z-40 px-3 sm:px-4 md:px-8 py-2.5 md:py-4 shadow-xs">
        <div className="flex items-center gap-2.5 md:hidden">
          <button
            type="button"
            onClick={handleMainLogoHome}
            className="shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Happy Business home"
          >
          <img
            src={happyBusinessLogo}
            alt="Localisy"
            className="h-8 sm:h-9 w-auto max-w-[128px] object-contain"
          />
          </button>

        {/* Real-time Pincode and Locality tracker */}
          <button
            type="button"
            onClick={() => setShowPincodeModal(true)}
            className="min-w-0 flex-1 md:flex-none md:min-w-[320px] inline-flex h-11 md:h-12 items-center gap-2 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 hover:bg-slate-100 text-indigo-950 px-3 md:px-4 rounded-2xl text-xs md:text-sm font-semibold font-mono shadow-xs transition cursor-pointer"
            title="Change pincode or locality"
          >
            <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="truncate">
              <span className="font-extrabold text-slate-800">{displayedPincode}</span>
              <span className="text-indigo-500 font-sans font-semibold ml-1">
                <span className="md:hidden">({compactNodeLabel})</span>
                <span className="hidden md:inline">({activeNodeLabel})</span>
              </span>
            </span>
            <span className="hidden md:inline text-[10px] text-indigo-600 underline ml-auto font-bold">Change</span>
          </button>

          <button
            type="button"
            onClick={handleSearchShortcut}
            className="h-11 md:h-12 w-14 md:w-16 inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer shrink-0"
            title="Jump to listing search"
          >
            <Search className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
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

          <div className="relative shrink-0">
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

        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMainLogoHome}
              className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Open home page for selected pincode"
            >
              <img
                src={happyBusinessLogo}
                alt="Localisy"
                className="h-12 md:h-14 w-auto object-contain"
              />
            </button>
          </div>

          {/* Real-time Pincode and Locality tracker */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPincodeModal(true)}
              className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 hover:bg-slate-100 text-indigo-850 px-3.5 py-1.5 rounded-2xl text-xs font-semibold font-mono shadow-xs transition cursor-pointer"
              title="Click to switch regional portal using pincode"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-650 animate-bounce" />
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
              className="hidden sm:inline-flex bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Advertise Business
            </button>

            {canAccessAdmin && (
              <button
                type="button"
                onClick={() => setActiveViewWithAudit('admin')}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
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
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
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
            categories={INITIAL_CATEGORIES}
            reviews={reviews}
            activeLocalityId={activeLocalityId}
            pincodeMappings={pincodeMappings}
            localityMappedPincodes={mappedPincodesForActiveLocality}
            savedPincode={savedPincode}
            initialCategoryFilter={urlCategoryFilter}
            initialSearchFilter={urlSearchFilter}
            filterNonce={urlFilterNonce}
            initialSelectedBusinessId={urlSelectedBusinessId}
            selectionNonce={urlSelectionNonce}
            onLocalityChange={setActiveLocalityId}
            userSession={userSession}
            onUserSessionChange={setUserSession}
            viewedBusinessIds={viewedBusinessIds}
            onUnlockBusinessContact={handleRegisterContactView}
            onSubmitApplication={handleSubmitApplication}
            onUpdateBusiness={handleUpdateBusiness}
            onAddReview={handleAddReview}
            listingAds={listingAds}
            adLeads={adLeads}
            heroBanners={heroBanners}
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
              categories={INITIAL_CATEGORIES}
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
              adLeads={adLeads}
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
            <span className="text-xs text-slate-500">(c) 2026 Happy Gifting Businesses.</span>
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
        onAuthSuccess={({ token, name, phone, email, role, userType }) => {
          localStorage.setItem('yp_auth_token', token);
          setUserSession({
            role: role as UserRole,
            userType,
            userName: `${name} (${userType})`,
            userPhone: phone,
            email,
            authToken: token,
            isAuthenticated: true,
          });
          logAuditEvent('data_entry', 'User Authenticated', `Authenticated user ${email} with role: ${role}`);
        }}
      />
    </div>
  );
}
