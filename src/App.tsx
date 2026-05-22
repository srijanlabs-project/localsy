import React, { useState, useEffect } from 'react';
import { 
  INITIAL_LOCALITIES, INITIAL_BUSINESSES, INITIAL_CATEGORIES, INITIAL_REVIEWS,
  INITIAL_COMMUNITY_ITEMS, INITIAL_CRM_CONTACTS, INITIAL_COUPONS, MASTER_AREAS
} from './data';
import { 
  Locality, Business, SubdomainMapping, Review, UserSession, UserRole,
  CommunityItem, CRMContact, MarketingCoupon, AuditEvent
} from './types';
import ProposalPanel from './components/ProposalPanel';
import WebPortal from './components/WebPortal';
import AndroidSimulator from './components/AndroidSimulator';
import AdminConsole from './components/AdminConsole';
import PincodeSelectionModal from './components/PincodeSelectionModal';
import AuthModal from './components/AuthModal';
import happyBusinessLogo from './assets/happy-business-logo.png';
import { 
  Layout, Smartphone, Shield, BookOpen, Layers, RefreshCw, 
  User, CheckCircle, ShieldAlert, KeyRound, Wrench, Briefcase, HelpCircle,
  Sliders, Settings, X, Database, MapPin
} from 'lucide-react';
import { resolveDefaultSubcategoryId, resolveMasterCategoryId } from './categoryMaster';

const normalizeBusinessTaxonomy = (business: Business): Business => {
  const categoryId = resolveMasterCategoryId(business.categoryId);
  return {
    ...business,
    categoryId,
    subcategoryId: business.subcategoryId || resolveDefaultSubcategoryId(business.categoryId)
  };
};

export default function App() {
  const PRODUCTION_MODE = true;
  // Database version management to clear stale browser caches when definitions evolve
  const CURRENT_DB_VERSION = 'yp_v12_category_subcategory_master';
  
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
          return parsed.map(normalizeBusinessTaxonomy);
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
    }
    return INITIAL_LOCALITIES;
  });

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem('yp_businesses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.some((b: any) => b.localityId === 'roadpali' || b.id === 's1')) {
          return parsed;
        }
      } catch (e) {
        // Fall through
      }
    }
    return INITIAL_BUSINESSES.map(normalizeBusinessTaxonomy);
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
    return [
      { pincode: '410101', localityId: 'roadpali' }, // Kalamboli (routed to Roadpali/Kalamboli single page)
      { pincode: '410218', localityId: 'roadpali' }, // Kalamboli (routed to Roadpali/Kalamboli single page)
      { pincode: '410210', localityId: 'kharghar' },
      { pincode: '410209', localityId: 'kamothe' },
      { pincode: '410206', localityId: 'panvel' },
      { pincode: '410221', localityId: 'panvel' },
      { pincode: '410208', localityId: 'taloja' },
    ];
  });

  const [activeView, setActiveView] = useState<'proposal' | 'web' | 'android' | 'admin'>('web'); // Default to pubic web portal for instant aesthetics!
  const [showSandbox, setShowSandbox] = useState(false); // Controls floating simulation HUD
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    localStorage.setItem('yp_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    logAuditEvent('data_entry', 'Active locality changed', `Locality switched to: ${activeLocalityId}`);
  }, [activeLocalityId]);

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

  const handleApproveBusiness = (bizId: string) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === bizId) {
        logAuditEvent('data_entry', `Approved business listing registration: "${b.name}"`, `Successfully validated SLA & activated routing headers for ID ${bizId}`);
        return { ...b, status: 'approved' };
      }
      return b;
    }));
  };

  const handleRejectBusiness = (bizId: string, reason: string) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === bizId) {
        logAuditEvent('data_entry', `Rejected business listing application: "${b.name}"`, `Reason of refusal: "${reason}" | App ID ${bizId} flag rejected`);
        return { ...b, status: 'rejected', rejectionReason: reason };
      }
      return b;
    }));
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
      status: 'pending', // Starts in moderation pipeline
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString()
    };

    setBusinesses(prev => [newBiz, ...prev]);
    logAuditEvent('data_entry', `Submitted registration request for new business: "${appData.name}"`, `Owner/Proprietor: ${appData.ownerName} | Ph: ${appData.phone} | Shard Locality: ${appData.localityId}`);
  };

  // Allow Admins, Moderators, Sellers, and Data Operators to directly modify listings
  const handleUpdateBusiness = (updatedBiz: Business) => {
    logAuditEvent('data_entry', `Business listing updated: "${updatedBiz.name}"`, `Updated listing ID: ${updatedBiz.id} | Locality: ${updatedBiz.localityId}`);
    setBusinesses(prev => prev.map(b => b.id === updatedBiz.id ? updatedBiz : b));
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
    setBusinesses(prevBizs => prevBizs.map(b => {
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
    }));
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
      
      setLocalities(INITIAL_LOCALITIES);
      setBusinesses(INITIAL_BUSINESSES);
      setReviews(INITIAL_REVIEWS);
      setCommunityItems(INITIAL_COMMUNITY_ITEMS);
      setCrmContacts(INITIAL_CRM_CONTACTS);
      setCoupons(INITIAL_COUPONS);
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
      setPincodeMappings([
        { pincode: '410101', localityId: 'roadpali' },
        { pincode: '410218', localityId: 'roadpali' },
        { pincode: '410210', localityId: 'kharghar' },
        { pincode: '410209', localityId: 'kamothe' },
        { pincode: '410206', localityId: 'panvel' },
        { pincode: '410221', localityId: 'panvel' },
        { pincode: '410208', localityId: 'taloja' },
      ]);
      alert("Application storage cleared & restored to Roadpali metrics!");
    }
  };

  // Pincode Routing Engine operations
  const handleSavePincode = (pincode: string | null, matchedLocalityId: string) => {
    setSavedPincode(pincode);
    if (pincode) {
      localStorage.setItem('yp_saved_pincode', pincode);
      localStorage.setItem('yp_saved_locality_id', matchedLocalityId);
    } else {
      localStorage.removeItem('yp_saved_pincode');
      localStorage.removeItem('yp_saved_locality_id');
    }
    localStorage.setItem('yp_pincode_prompted', 'true');
    setActiveLocalityId(matchedLocalityId);
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
      const getBusinessPincode = (b: Business) => MASTER_AREAS.find(a => a.id === b.areaId)?.pincode || '';

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
            areasOfOperation: [areaId],
            address,
            phone,
            description: row.services || next[existingIndex].description,
            rating: Number.isFinite(rating) ? rating : next[existingIndex].rating,
            reviewCount: Number.isFinite(reviewCount) ? reviewCount : next[existingIndex].reviewCount,
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
          areasOfOperation: [areaId],
          address,
          phone,
          website: `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'business'}.in`,
          description: row.services || 'Business imported from CSV.',
          rating: Number.isFinite(rating) ? rating : 0,
          reviewCount,
          imageUrl: '',
          featured: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          tags: (row.services || 'Imported').split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
          ownerName: 'Imported via CSV',
          gpsCoordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
        });
        imported++;
      }
      return next;
    });

    logAuditEvent('data_entry', 'CSV import executed', `Rows processed: ${rows.length} | Imported: ${imported} | Skipped: ${skipped}`);
    return { imported, skipped };
  };

  const activeNodeLabel = (() => {
    if (activeLocalityId === 'roadpali') return 'Roadpali & Kalamboli';
    return localities.find((l) => l.id === activeLocalityId)?.name.split(',')[0] || 'Roadpali';
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600/15 relative">
      
      {/* Top Navigation Frame - Pristine, Live, Human-labeled web directory */}
      <nav id="platform-navbar" className="bg-white border-b border-slate-200 sticky top-0 md:top-auto z-40 px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src={happyBusinessLogo}
            alt="Happy Business"
            className="h-12 md:h-14 w-auto object-contain"
          />
        </div>

        {/* Real-time Pincode and Locality tracker */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
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
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
              title="Sign in to post reviews & manage role-based access"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Workspace Active Presentation Render */}
        {!PRODUCTION_MODE && activeView === 'proposal' && (
          <div className="space-y-6">
            <ProposalPanel />
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
            savedPincode={savedPincode}
            onLocalityChange={setActiveLocalityId}
            userSession={userSession}
            onUserSessionChange={setUserSession}
            viewedBusinessIds={viewedBusinessIds}
            onUnlockBusinessContact={handleRegisterContactView}
            onSubmitApplication={handleSubmitApplication}
            onUpdateBusiness={handleUpdateBusiness}
            onAddReview={handleAddReview}
            
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
        )}

        {activeView === 'admin' && canAccessAdmin && (
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
          />
        )}

      </main>

      {/* Pristine, Professional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="block text-white font-bold text-sm">Roadpali Businesses</span>
            <span className="block text-xs text-slate-500">Your trusted neighbourhood Hyper Local directory node. Serving Roadpali, Kalamboli, and Navi Mumbai since 2026.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
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
            <span className="text-xs text-slate-500">© 2026 Happy Gifting Businesses. Secure OTP View Protection.</span>
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
