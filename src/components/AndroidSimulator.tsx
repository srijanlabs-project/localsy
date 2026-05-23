import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Wifi, WifiOff, Battery, Volume2, Info, Navigation, Share2, 
  PhoneCall, ArrowLeft, RefreshCw, Send, CheckCircle, ShieldAlert, Lock, Unlock, Star, MessageSquare
} from 'lucide-react';
import { Locality, Business, Category, Review, UserSession } from '../types';
import { MASTER_STATES, MASTER_CITIES, MASTER_AREAS } from '../data';
import OtpVerificationModal from './OtpVerificationModal';
import GoogleLocationPicker from './GoogleLocationPicker';
import { getBusinessImageUrl, getCategoryFallbackImage, hasUploadedBusinessImage } from '../utils/businessImage';
import { resolveDefaultSubcategoryId } from '../categoryMaster';

interface AndroidSimulatorProps {
  localities: Locality[];
  businesses: Business[];
  categories: Category[];
  reviews: Review[];
  activeLocalityId: string;
  onLocalityChange: (id: string) => void;
  userSession: UserSession;
  onUserSessionChange: (sess: UserSession) => void;
  viewedBusinessIds: string[];
  onUnlockBusinessContact: (bizId: string) => void;
  onSubmitApplication: (bizData: Omit<Business, 'id' | 'status' | 'createdAt' | 'rating' | 'reviewCount'>) => void;
  onUpdateBusiness: (b: Business) => void;
  onAddReview: (bizId: string, userName: string, userPhone: string, rating: number, comment: string) => void;
}

export default function AndroidSimulator({
  localities,
  businesses,
  categories,
  reviews,
  activeLocalityId,
  onLocalityChange,
  userSession,
  onUserSessionChange,
  viewedBusinessIds,
  onUnlockBusinessContact,
  onSubmitApplication,
  onUpdateBusiness,
  onAddReview
}: AndroidSimulatorProps) {
  const [offlineMode, setOfflineMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'detail' | 'apply'>('home');
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bridgeLogs, setBridgeLogs] = useState<string[]>([
    '[System] Android Webview initialized successfully.',
    '[Bridge] JVM Hook "YellowPagesBridge" registered for instant SMS/GPS grabs.'
  ]);

  // Mobile Image Carousel slide index
  const [mobileSlideIdx, setMobileSlideIdx] = useState(0);

  // Form states
  const [appName, setAppName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appEmail, setAppEmail] = useState(''); // Optional!
  const [appWebsite, setAppWebsite] = useState('');
  const [appCategory, setAppCategory] = useState('food');
  const [appDesc, setAppDesc] = useState('');
  const [appAddress, setAppAddress] = useState('');
  const [appHours, setAppHours] = useState('10:00 AM - 08:30 PM');
  const [appOwner, setAppOwner] = useState('');
  const [appStateId, setAppStateId] = useState('mh');
  const [appCityId, setAppCityId] = useState('navimumbai');
  const [appAreaId, setAppAreaId] = useState('roadpali-sec17');
  const [appAreasOfOperation, setAppAreasOfOperation] = useState<string[]>(['roadpali-sec17']);
  const [appGpsCoords, setAppGpsCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Verification dialog trigger state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [activeVerifyBizId, setActiveVerifyBizId] = useState<string | null>(null);

  // Mobile ratings form states
  const [mRating, setMRating] = useState(5);
  const [mComment, setMComment] = useState('');

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setBridgeLogs(prev => [`[${timestamp}] ${log}`, ...prev.slice(0, 8)]);
  };

  const activeLocality = localities.find(l => l.id === activeLocalityId) || localities[0];
  const carouselImages = activeLocality.carouselImages || [activeLocality.coverImage];

  // Auto scroll mobile slides
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setMobileSlideIdx(prev => (prev + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(slideInterval);
  }, [carouselImages.length]);

  const approvedInLocality = businesses.filter(
    b => b.localityId === activeLocalityId && b.status === 'approved'
  );

  const filteredBusinesses = approvedInLocality.filter(biz => {
    const matchesSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          biz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          biz.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || biz.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedBiz = businesses.find(b => b.id === selectedBizId);

  // Intent simulators
  const triggerNativeCall = (phone: string, name: string) => {
    addLog(`[Intent] Dialing tel:${phone} for merchant: "${name}"`);
    alert(`[Android Dialing Simulator] Initiating direct cellular call structure to: ${phone}`);
  };

  const triggerNativeShare = (name: string, web: string) => {
    addLog(`[Intent] Text extra sent: "Browse verified local listings of ${name} on: ${web}"`);
    alert(`[Android OS Sharesheet] Link broadcasted: ${web}`);
  };

  const triggerNativeMap = (address: string, coords?: { lat: number; lng: number }) => {
    const geoUri = coords ? `geo:${coords.lat},${coords.lng}?z=16` : `geo:0,0?q=${encodeURIComponent(address)}`;
    addLog(`[Intent] android.intent.action.VIEW with target URI - "${geoUri}"`);
    alert(`[Google Maps Integration] Pinpointed Map alignment at verified address!`);
  };

  const handleStateChange = (stateId: string) => {
    setAppStateId(stateId);
    const relatedCities = MASTER_CITIES.filter(c => c.stateId === stateId);
    if (relatedCities.length > 0) {
      const cityId = relatedCities[0].id;
      setAppCityId(cityId);
      const relatedAreas = MASTER_AREAS.filter(a => a.cityId === cityId);
      if (relatedAreas.length > 0) {
        setAppAreaId(relatedAreas[0].id);
        setAppAreasOfOperation([relatedAreas[0].id]);
      }
    }
  };

  const handleCityChange = (cityId: string) => {
    setAppCityId(cityId);
    const relatedAreas = MASTER_AREAS.filter(a => a.cityId === cityId);
    if (relatedAreas.length > 0) {
      setAppAreaId(relatedAreas[0].id);
      setAppAreasOfOperation([relatedAreas[0].id]);
    }
  };

  const handleAreaCheckToggle = (areaId: string) => {
    setAppAreasOfOperation(prev => 
      prev.includes(areaId)
        ? prev.filter(x => x !== areaId)
        : [...prev, areaId]
    );
  };

  // Submit registration
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appPhone || !appAddress || appAreasOfOperation.length === 0) {
      addLog(`[Webview] Form Alert: Application constraints missed.`);
      alert("Missing required fields!");
      return;
    }

    const newBizData = {
      name: appName,
      categoryId: appCategory,
      subcategoryId: resolveDefaultSubcategoryId(appCategory),
      localityId: activeLocalityId,
      stateId: appStateId,
      cityId: appCityId,
      areaId: appAreaId,
      areasOfOperation: appAreasOfOperation,
      address: appAddress,
      phone: appPhone,
      email: appEmail.trim() || undefined, // Email optional!
      website: appWebsite || `https://${appName.toLowerCase().replace(/\s+/g, '')}.in`,
      description: appDesc || `${appName} is a dependable local shop.`,
      imageUrl: '',
      featured: false,
      tags: [appCategory, 'Local', 'Mobile-Entry'],
      hours: appHours,
      ownerName: appOwner || 'Mobile Applicant',
      gpsCoordinates: appGpsCoords
    };

    onSubmitApplication(newBizData);
    addLog(`[Bridge] Dispatched registration callback over JavascriptInterface.`);
    
    // Clear application states
    setAppName('');
    setAppPhone('');
    setAppEmail('');
    setAppWebsite('');
    setAppCategory('food');
    setAppDesc('');
    setAppAddress('');
    setAppOwner('');
    setAppGpsCoords(undefined);

    setCurrentScreen('home');
    alert(`Application for "${newBizData.name}" submitted! It awaits moderation in the intake pipeline.`);
  };

  const handlePostMobileReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mComment.trim() || !selectedBizId) return;

    onAddReview(
      selectedBizId,
      userSession.userName || 'Verified Mobile Client',
      userSession.userPhone || '+91 90044 12120',
      mRating,
      mComment
    );

    addLog(`[Bridge] Dispatched review rating review: ${mRating}/5 stars.`);
    setMComment('');
    alert("Mobile review entry authorized and rating metrics generated!");
  };

  const handleOtpSuccess = (verifiedName: string, verifiedPhone: string) => {
    onUserSessionChange({
      role: userSession.role === 'buyer' ? 'buyer' : userSession.role,
      userName: `${verifiedName} (Verified Mobile)`,
      userPhone: verifiedPhone,
      isAuthenticated: true
    });

    if (activeVerifyBizId) {
      onUnlockBusinessContact(activeVerifyBizId);
      addLog(`[Bridge] Decrypted verified numbers for ID: ${activeVerifyBizId}`);
    }
    setActiveVerifyBizId(null);
  };

  const initMobileUnlock = (bizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userSession.isAuthenticated && userSession.userPhone) {
      onUnlockBusinessContact(bizId);
      addLog(`[Bridge] Unlocked contacts instantly using existing authenticated user token.`);
      return;
    }
    setActiveVerifyBizId(bizId);
    setShowOtpModal(true);
  };

  return (
    <div id="android-simulator-container" className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Device Body on Left & Center */}
      <div className="md:col-span-2 flex justify-center">
        <div className="relative w-80 h-[620px] bg-slate-900 rounded-[36px] shadow-2xl border-[10px] border-slate-950 overflow-hidden flex flex-col shrink-0">
          
          {/* Speaker ear piece & Camera notch */}
          <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex items-center justify-center z-40">
            <div className="w-16 h-4 bg-slate-950 rounded-b-xl flex items-center justify-center gap-1">
              <span className="w-8 h-1 bg-slate-800 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
            </div>
          </div>

          {/* Android System Status Bar */}
          <div className="pt-6 px-4 pb-1 bg-indigo-950 text-slate-300 text-[10px] font-mono flex justify-between items-center z-30 select-none">
            <span className="font-semibold">09:00 AM</span>
            <div className="flex items-center gap-1.5">
              {offlineMode ? (
                <WifiOff className="w-3 h-3 text-red-400 font-bold" title="Offline Cache Mode Activates" />
              ) : (
                <Wifi className="w-3 h-3 text-emerald-400" />
              )}
              <Volume2 className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Webview App container */}
          <div className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden text-slate-800">
            {offlineMode ? (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-6 z-50">
                <WifiOff className="w-12 h-12 text-slate-400 mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Offline Shard Cache Active</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Offline indexing allows seamless listing access even inside low coverage regions.
                </p>
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl max-w-full">
                  <span className="text-[10px] font-mono block font-bold text-indigo-900 mb-1">LOCAL SQLITE CACHE DB:</span>
                  <div className="text-[10px] text-indigo-700 text-left truncate">
                    🏷️ Loaded {approvedInLocality.length} stores in {activeLocality.name}
                  </div>
                </div>
                <button
                  onClick={() => setOfflineMode(false)}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs px-4 py-2 rounded-xl font-bold transition"
                >
                  Reconnect Networks
                </button>
              </div>
            ) : null}

            {/* WebView Header */}
            <header className="bg-indigo-900 text-white px-3 py-3 shadow flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {currentScreen !== 'home' && (
                  <button onClick={() => setCurrentScreen('home')} className="p-1 hover:bg-indigo-800 rounded">
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </button>
                )}
                <div className="truncate max-w-[150px]">
                  <h1 className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1">
                    🌐 {activeLocality.subdomain}
                  </h1>
                  <span className="text-[8px] text-indigo-200 block">India WebView Client v3.0</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCurrentScreen('apply');
                  addLog(`[Bridge] Initiating business registration web formulation.`);
                }} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold font-mono text-[9px] px-2 py-1 rounded"
              >
                + Register
              </button>
            </header>

            {/* WebView Routing Display */}
            <div className="flex-1 overflow-y-auto px-3 py-2.5">
              
              {currentScreen === 'home' && (
                <div className="space-y-4">
                  {/* Locality Selector card */}
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-indigo-950 flex items-center justify-between">
                      <span>📍 Select Region portal:</span>
                      <span className="font-mono text-[8px] bg-indigo-200 text-indigo-850 px-1 rounded">MOCK DNS</span>
                    </div>
                    <select
                      value={activeLocalityId}
                      onChange={(e) => {
                        onLocalityChange(e.target.value);
                        addLog(`[Webview] Hop mapped region route: ${e.target.value}`);
                      }}
                      className="w-full bg-white border border-slate-200 p-1 rounded-lg text-xs font-mono font-medium focus:outline-none"
                    >
                      {localities.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Smaller Mobile Banner Ad Strip */}
                  <div className="bg-amber-100 rounded-lg p-2 text-[9px] text-slate-700 leading-normal border-l-2 border-amber-500 font-sans">
                    🔥 <strong>Emergency Services Helpline:</strong> Local plumbers/electricians are verified by operators. Reveal contacts via OTP below.
                  </div>

                  {/* Filter elements inside simulator */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search plumber, bistro, labs..."
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="absolute left-2.5 top-1.5 text-slate-400">🔍</span>
                    </div>

                    {/* Quick Category sliders */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {categories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCategory(c.id);
                            addLog(`[Webview] Screen filter by category: ${c.id}`);
                          }}
                          className={`text-[9.5px] px-2.5 py-0.5 rounded-full whitespace-nowrap transition ${
                            selectedCategory === c.id 
                            ? 'bg-indigo-600 text-white font-bold' 
                            : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Listings Grid */}
                  <div className="space-y-2">
                    {filteredBusinesses.length === 0 ? (
                      <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-semibold text-slate-500">No stores match criteria.</p>
                      </div>
                    ) : (
                      filteredBusinesses.map(biz => {
                        const hasViewed = viewedBusinessIds.includes(biz.id);
                        return (
                          <div 
                            key={biz.id}
                            onClick={() => {
                              setSelectedBizId(biz.id);
                              setCurrentScreen('detail');
                              addLog(`[Webview] Display detail page: "${biz.name}"`);
                            }}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-3xs cursor-pointer transition flex gap-2.5"
                          >
                            <img 
                              src={getBusinessImageUrl(biz)}
                              alt={biz.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
                              }}
                              className={`w-12 h-12 rounded bg-slate-100 flex-shrink-0 ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-1'}`}
                            />
                            <div className="flex-1 truncate text-left">
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-slate-900 text-[11px] truncate leading-tight">{biz.name}</h4>
                                <span className="text-[9.5px] text-amber-600 font-bold">★ {biz.rating}</span>
                              </div>
                              <p className="text-[9.5px] text-slate-500 truncate">{biz.description}</p>
                              
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50">
                                <span className="text-[8.5px] text-slate-400 font-mono">📍 {MASTER_AREAS.find(a => a.id === biz.areaId)?.name || 'Mumbai'}</span>
                                {hasViewed ? (
                                  <span className="text-[8.5px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-1.5 rounded">
                                    Approved &amp; Viewed
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => initMobileUnlock(biz.id, e)}
                                    className="text-[8.5px] text-indigo-600 font-bold underline flex items-center gap-0.5"
                                  >
                                    <Lock className="w-2 h-2" /> Unlock Contacts
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {currentScreen === 'detail' && selectedBiz && (
                <div className="space-y-3.5 text-xs font-sans text-left">
                  <button 
                    onClick={() => setCurrentScreen('home')}
                    className="inline-flex items-center gap-1 text-indigo-600 font-bold text-[10px]"
                  >
                    ← Back to Phone Feed
                  </button>

                  <img 
                    src={getBusinessImageUrl(selectedBiz)}
                    alt={selectedBiz.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getCategoryFallbackImage(selectedBiz.categoryId);
                    }}
                    className={`w-full h-28 rounded-xl border border-slate-200 bg-slate-100 shadow-sm ${hasUploadedBusinessImage(selectedBiz) ? 'object-cover' : 'object-contain p-3'}`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-950 text-sm leading-tight">{selectedBiz.name}</h3>
                      <span className="bg-amber-100 text-amber-800 text-[9.5px] px-1.5 py-0.5 rounded font-bold">
                        ★ {selectedBiz.rating}
                      </span>
                    </div>
                    {/* Areas details under detail view */}
                    {selectedBiz.areasOfOperation && (
                      <div className="text-[9px] text-indigo-700 font-mono">
                        🗺️ Serves Areas: {selectedBiz.areasOfOperation.map(aid => MASTER_AREAS.find(a => a.id === aid)?.name).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-600 italic leading-relaxed">
                    &quot;{selectedBiz.description}&quot;
                  </p>

                  {/* Gated dial action phone selector */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-250 text-[10px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400 uppercase text-[8.5px]">Verified Core:</span>
                      {viewedBusinessIds.includes(selectedBiz.id) ? (
                        <span className="bg-emerald-50 text-emerald-800 text-[8.5px] px-1.5 rounded font-bold border border-emerald-250">
                          ✓ Unlocked
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 text-[8.5px] px-1.5 rounded font-bold border border-amber-250">
                          🔒 OTP Gated
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Tel Contact:</span>
                      {viewedBusinessIds.includes(selectedBiz.id) ? (
                        <strong className="text-slate-900 font-mono font-bold">{selectedBiz.phone}</strong>
                      ) : (
                        <button
                          onClick={(e) => initMobileUnlock(selectedBiz.id, e)}
                          className="bg-indigo-600 text-white font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1 animate-pulse"
                        >
                          <Unlock className="w-2 h-2" /> Verify mobile OTP SMS
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Intent native action buttons inside Webview */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        if (viewedBusinessIds.includes(selectedBiz.id)) {
                          triggerNativeCall(selectedBiz.phone, selectedBiz.name);
                        } else {
                          setActiveVerifyBizId(selectedBiz.id);
                          setShowOtpModal(true);
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-1.5 rounded-lg flex flex-col items-center justify-center text-[9.5px] transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5 mb-1" />
                      <span>Dial Call</span>
                    </button>
                    <button
                      onClick={() => triggerNativeMap(selectedBiz.address, selectedBiz.gpsCoordinates)}
                      className="bg-slate-850 hover:bg-slate-900 text-white font-bold p-1.5 rounded-lg flex flex-col items-center justify-center text-[9.5px] transition"
                    >
                      <Navigation className="w-3.5 h-3.5 mb-1" />
                      <span>GPS Pin</span>
                    </button>
                    <button
                      onClick={() => triggerNativeShare(selectedBiz.name, selectedBiz.website)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold p-1.5 rounded-lg flex flex-col items-center justify-center text-[9.5px] transition"
                    >
                      <Share2 className="w-3.5 h-3.5 mb-1" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Reviews lists */}
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-[10.5px] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-slate-400" /> Reviews Feed
                    </h4>
                    
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {reviews.filter(r => r.businessId === selectedBiz.id).map(r => (
                        <div key={r.id} className="bg-white p-2 rounded-lg border border-slate-150 text-[9.5px]">
                          <div className="flex justify-between items-center text-slate-400">
                            <strong>{r.userName}</strong>
                            <span>{'★'.repeat(r.rating)}</span>
                          </div>
                          <p className="text-slate-600 mt-1 italic leading-tight">&quot;{r.comment}&quot;</p>
                        </div>
                      ))}
                    </div>

                    {/* Writing review inside phone */}
                    {userSession.isAuthenticated && userSession.userPhone ? (
                      <form onSubmit={handlePostMobileReview} className="p-2 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[9.5px] text-indigo-950">Add review:</span>
                          <select 
                            value={mRating} 
                            onChange={(e)=>setMRating(Number(e.target.value))}
                            className="bg-white font-bold text-[9.5px] p-0.5 rounded font-mono"
                          >
                            <option value="5">5★ (Excellent)</option>
                            <option value="4">4★ (Good)</option>
                            <option value="3">3★ (Average)</option>
                            <option value="2">2★ (Poor)</option>
                            <option value="1">1★ (Terrible)</option>
                          </select>
                        </div>
                        <div className="flex gap-1">
                          <input 
                            type="text"
                            required
                            value={mComment}
                            onChange={(e)=>setMComment(e.target.value)}
                            placeholder="Type customer review..."
                            className="text-[9.5px] p-1 rounded border border-slate-200 flex-1"
                          />
                          <button type="submit" className="bg-indigo-600 text-white p-1 rounded">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-2 bg-slate-100 rounded-lg text-[9px] text-slate-500 text-center">
                        🔐 OTP verify credentials to post rating feedback.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentScreen === 'apply' && (
                <div className="space-y-3.5 text-xs text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold font-mono text-slate-900">✏️ SME Register Portal</h3>
                    <button onClick={() => setCurrentScreen('home')} className="text-slate-400 hover:text-slate-700 font-bold text-[10px]">Close</button>
                  </div>

                  <form onSubmit={handleApplySubmit} className="space-y-2.5 text-left bg-white p-3 rounded-xl border border-slate-205">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-700">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="e.g. Pali Hill Electricians"
                        className="w-full text-[10px] p-1.5 border border-slate-200 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-700">Category Segment *</label>
                      <select
                        value={appCategory}
                        onChange={(e) => setAppCategory(e.target.value)}
                        className="w-full text-[10px] p-1.5 bg-slate-55 border border-slate-200 rounded"
                      >
                        <option value="salon">Salons &amp; Wellness</option>
                        <option value="food">Food &amp; Dining</option>
                        <option value="tech">Tech &amp; Custom Software</option>
                        <option value="health">Health &amp; Wellness</option>
                        <option value="home">Home Repairs/Services</option>
                        <option value="services">Professional consultancy</option>
                        <option value="retail">Shops &amp; Retail Hub</option>
                      </select>
                    </div>

                    {/* Master Geography inside mobile view form */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5">
                      <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Master Geological selects:</span>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={appStateId}
                          onChange={(e)=>handleStateChange(e.target.value)}
                          className="bg-white text-[9.5px] p-1 border rounded"
                        >
                          {MASTER_STATES.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>

                        <select
                          value={appCityId}
                          onChange={(e)=>handleCityChange(e.target.value)}
                          className="bg-white text-[9.5px] p-1 border rounded"
                        >
                          {MASTER_CITIES.filter(c => c.stateId === appStateId).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Multiselect checkboxes for areas of operation */}
                      <div>
                        <span className="block text-[8px] font-bold text-slate-500 mb-1">Operational Area (Check matching neighborhoods):</span>
                        <div className="bg-white rounded border border-slate-150 p-1.5 max-h-24 overflow-y-auto space-y-1">
                          {MASTER_AREAS.filter(a => a.cityId === appCityId).map(area => {
                            const active = appAreasOfOperation.includes(area.id);
                            return (
                              <label key={area.id} className="flex items-center gap-1 text-[8.5px] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() => handleAreaCheckToggle(area.id)}
                                  className="w-2.5 h-2.5 text-indigo-600 focus:ring-0"
                                />
                                <span>{area.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Google picker simulator */}
                    <GoogleLocationPicker 
                      cityName={MASTER_CITIES.find(c => c.id === appCityId)?.name || 'Mumbai'}
                      onLocationGrabbed={(mockAddr, coords) => {
                        setAppAddress(mockAddr);
                        setAppGpsCoords(coords);
                        addLog(`[Bridge] Grabbed GPS: lat=${coords.lat}, lng=${coords.lng} via satellite.`);
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-700">Phone Contact *</label>
                        <input
                          type="tel"
                          required
                          value={appPhone}
                          onChange={(e) => setAppPhone(e.target.value)}
                          placeholder="+91..."
                          className="w-full text-[10px] p-1.5 border border-slate-200 rounded"
                        />
                      </div>
                      <div>
                        {/* Email Optional! */}
                        <label className="block text-[9.5px] font-bold text-slate-700">Email (Optional)</label>
                        <input
                          type="email"
                          value={appEmail}
                          onChange={(e) => setAppEmail(e.target.value)}
                          placeholder="e.g. name@shop.in"
                          className="w-full text-[10px] p-1.5 border border-slate-200 rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-700">Physical address Location *</label>
                      <input
                        type="text"
                        required
                        value={appAddress}
                        onChange={(e) => setAppAddress(e.target.value)}
                        placeholder="Street details..."
                        className="w-full text-[10px] p-1.5 border border-slate-200 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-700">proprietor Full Name</label>
                      <input
                        type="text"
                        value={appOwner}
                        onChange={(e) => setAppOwner(e.target.value)}
                        placeholder="Merchant name"
                        className="w-full text-[10px] p-1.5 border border-slate-200 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-700">Business description</label>
                      <textarea
                        value={appDesc}
                        onChange={(e) => setAppDesc(e.target.value)}
                        rows={2}
                        placeholder="Specialties, services..."
                        className="w-full text-[10px] p-1.5 border border-slate-200 rounded"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] py-2 rounded transition"
                    >
                      Route to moderator Queue
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Android Navigation Bar */}
            <div className="h-10 bg-slate-950 flex items-center justify-around text-slate-400 text-xs border-t border-slate-850 select-none">
              <button 
                onClick={() => {
                  setCurrentScreen('home');
                  addLog(`[System] Back triggered.`);
                }}
                className="hover:text-white px-3 py-1"
              >
                ◀
              </button>
              <button 
                onClick={() => {
                  setCurrentScreen('home'); 
                  setSearchQuery(''); 
                  setSelectedCategory('all');
                  addLog(`[System] home routing.`);
                }} 
                className="hover:text-white px-3 py-1"
              >
                ●
              </button>
              <button 
                onClick={() => {
                  addLog(`[System] Multi-task manager.`);
                }}
                className="hover:text-white px-3 py-1"
              >
                ■
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Android Debug Console/State Inspector on Right */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-5 font-mono text-xs space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold animate-pulse">
            📱 Device Intent Terminal
          </span>
          <h4 className="text-sm font-bold text-white mt-2">Native Webview Bridge logs</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-normal">
            Intercepts packets, GPS coordinates, and SMS OTP logs passed dynamically from the running Webview.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Network state simulator:</span>
            <button
              onClick={() => {
                setOfflineMode(!offlineMode);
                addLog(`[Signal Simulator] Network offline changed: ${!offlineMode}`);
              }}
              className={`text-[10px] px-2.5 py-1 rounded transition font-bold font-mono ${
                offlineMode ? 'bg-emerald-600 text-white' : 'bg-red-950 text-red-400 border border-red-900'
              }`}
            >
              {offlineMode ? '✔️ Set Connected' : '⚡ Simulate Offline mode'}
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400">Terminal Shell Stream:</span>
            <div className="bg-black/90 p-3 rounded-lg border border-slate-850 h-64 overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1.5 scrollbar-thin">
              {bridgeLogs.map((log, idx) => (
                <div key={idx} className="leading-normal break-all">
                  <span className="text-slate-500">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-1 font-sans text-[11px] text-slate-300">
          <p className="font-bold text-slate-200">Simulating verified mobile reviews:</p>
          <p className="text-slate-400 leading-normal text-[10px]">
            To review inside the phone client: Click details of any business. If guest, click <strong>Verify mobile OTP SMS</strong>. Slide the slider, input name + phone number, and input test OTP <strong>1212</strong>. Once passed, the mobile client immediately permits writing and submitting verified reviews!
          </p>
        </div>
      </div>

      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerifySuccess={handleOtpSuccess}
        businessName={businesses.find(b=>b.id===activeVerifyBizId)?.name}
      />
    </div>
  );
}
