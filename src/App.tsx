import React, { useState, useEffect } from 'react';
import { 
  INITIAL_LOCALITIES, INITIAL_BUSINESSES, INITIAL_CATEGORIES, INITIAL_REVIEWS,
  INITIAL_COMMUNITY_ITEMS, INITIAL_CRM_CONTACTS, INITIAL_COUPONS
} from './data';
import { 
  Locality, Business, SubdomainMapping, Review, UserSession, UserRole,
  CommunityItem, CRMContact, MarketingCoupon, AuditEvent
} from './types';
import ProposalPanel from './components/ProposalPanel';
import WebPortal from './components/WebPortal';
import AndroidSimulator from './components/AndroidSimulator';
import AdminConsole from './components/AdminConsole';
import { 
  Layout, Smartphone, Shield, BookOpen, Layers, RefreshCw, 
  User, CheckCircle, ShieldAlert, KeyRound, Wrench, Briefcase, HelpCircle
} from 'lucide-react';

export default function App() {
  // Load from local storage or fallback to defaults
  const [localities, setLocalities] = useState<Locality[]>(() => {
    const saved = localStorage.getItem('yp_localities');
    return saved ? JSON.parse(saved) : INITIAL_LOCALITIES;
  });

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem('yp_businesses');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESSES;
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

  const [activeLocalityId, setActiveLocalityId] = useState<string>(() => {
    return 'bandra';
  });

  const [activeView, setActiveView] = useState<'proposal' | 'web' | 'android' | 'admin'>('web'); // Default to pubic web portal for instant aesthetics!

  // Active User session simulation
  const [userSession, setUserSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('yp_user_session');
    return saved ? JSON.parse(saved) : {
      role: 'buyer',
      userName: 'Karan Malhotra (Verified Citizen)',
      userPhone: '+91 80011 22334',
      isAuthenticated: true // Gated behind simulated sign in
    };
  });

  // Track the business IDs for which the current user has performed OTP verification to unlock contact details
  const [viewedBusinessIds, setViewedBusinessIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('yp_viewed_bizs');
    return saved ? JSON.parse(saved) : ['b1']; // Pre-authorize b1 for quick visual overview
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
        description: 'Provisioned primary database shards for Locality "Bandra"',
        details: 'Route slug mapped to bandra.yellowpages.io with active SSL',
        ipAddress: '103.45.22.105',
        deviceCode: 'Mozilla/5.0 (H:1080, W:1920, DPR:2)',
        userName: 'Rahul Sharma (National Administrator)'
      },
      {
        id: 'audit_init_2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actionType: 'contact_view',
        description: 'Revealed contact coordinates for merchant: "The Bandra Seaside Bistro"',
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
      setViewedBusinessIds(['b1']);
      setUserSession({
        role: 'buyer',
        userName: 'Karan Malhotra (Verified Citizen)',
        userPhone: '+91 80011 22334',
        isAuthenticated: true
      });
      setActiveLocalityId('bandra');
      alert("Application storage cleared & restored to Mumbai metrics!");
    }
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
          sellerBusinessId: 'b5', // Pre-linked to Sardar Filter Coffee for quick testing
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
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600/15">
      
      {/* Role Access Control Simulator Header Strip */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-2.5 flex flex-col xl:flex-row items-center justify-between gap-3 text-xs text-white z-50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-amber-500/15 text-amber-400 font-mono text-[9px] px-2 py-0.5 rounded-md border border-amber-500/20 uppercase font-bold tracking-wider">
            Identity Simulator Hub
          </span>
          <span className="text-slate-300 font-medium">Select simulated role access perspective to audit workflow permissions:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'buyer', label: '👤 Buyer (Guest)', color: 'border-slate-700 hover:bg-slate-800 text-slate-300', active: 'bg-blue-600 border-blue-500 text-white' },
            { id: 'admin', label: '🛡️ Admin Operator', color: 'border-slate-700 hover:bg-slate-800 text-slate-300', active: 'bg-red-600 border-red-500 text-white font-bold' },
            { id: 'moderator', label: '⚖️ Region Moderator', color: 'border-slate-700 hover:bg-slate-800 text-slate-300', active: 'bg-purple-600 border-purple-500 text-white font-bold' },
            { id: 'operator', label: '⌨️ Data Operator', color: 'border-slate-700 hover:bg-slate-800 text-slate-300', active: 'bg-amber-600 border-amber-500 text-slate-950 font-bold' },
            { id: 'seller', label: '💼 Certified Seller', color: 'border-slate-700 hover:bg-slate-800 text-slate-300', active: 'bg-emerald-600 border-emerald-500 text-white font-bold' },
          ].map(r => {
            const isSel = userSession.role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => simulateRoleLogin(r.id as UserRole)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition font-medium ${isSel ? r.active : r.color}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
          <span>Active User:</span>
          <strong className="text-white bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
            {userSession.userName}
          </strong>
        </div>
      </div>

      {/* Top Navigation Frame */}
      <nav id="platform-navbar" className="bg-white border-b border-slate-200 sticky top-0 md:top-auto z-40 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-bold font-sans text-slate-950 flex items-center gap-1.5 leading-none">
              YellowPages India Directory
            </h1>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Multi-Zone Shard Database • verified OTP view Protection • Admin approval Life Cycle
            </span>
          </div>
        </div>

        {/* HUD Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
          <button
            onClick={() => setActiveView('proposal')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeView === 'proposal' 
              ? 'bg-white text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            Specs &amp; Tech Stack
          </button>
          
          <button
            onClick={() => setActiveView('web')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeView === 'web' 
              ? 'bg-white text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-indigo-500" />
            🖥️ Public Web Portal
          </button>

          <button
            onClick={() => setActiveView('android')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeView === 'android' 
              ? 'bg-white text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            📱 Android App Client
          </button>

          {(userSession.role === 'admin' || userSession.role === 'moderator') && (
            <button
              onClick={() => setActiveView('admin')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 relative ${
                activeView === 'admin' 
                ? 'bg-white text-slate-950 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-red-500" />
              🛡️ Moderation Desk
              {businesses.some(b => b.status === 'pending') && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold font-mono animate-bounce">
                  {businesses.filter(b => b.status === 'pending').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Global Reset Switch */}
        <button
          onClick={handleResetData}
          title="Reset database to default state"
          className="text-[11px] text-slate-400 hover:text-red-500 font-mono transition flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Reset Mumbai Databases
        </button>
      </nav>

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Workspace Active Presentation Render */}
        {activeView === 'proposal' && (
          <div className="space-y-6">
            <ProposalPanel />
            <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-200 pt-6 gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ready to explore the fully functional interactive showcase?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Test the exact business registration, moderation, and responsive mobile displays below.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('web')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold px-4 py-2 rounded-xl transition"
                >
                  Explore Public Web →
                </button>
                {(userSession.role === 'admin' || userSession.role === 'moderator') && (
                  <button
                    onClick={() => setActiveView('admin')}
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

        {activeView === 'android' && (
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

        {activeView === 'admin' && (userSession.role === 'admin' || userSession.role === 'moderator') && (
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
          />
        )}

      </main>

      {/* Humble, Professional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            <span>Developed with Google AI Studio. Full-stack operational mocks with active localStorage and dynamic role context.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>DNS Server Status: <strong className="text-emerald-500 font-semibold font-mono">100% ONLINE</strong></span>
            <span>Port: <strong className="text-slate-650 font-semibold font-mono">3000</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
