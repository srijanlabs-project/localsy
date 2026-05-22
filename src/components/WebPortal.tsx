import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Phone, Mail, ExternalLink, Star, 
  BookOpen, Plus, Compass, ChevronRight, ChevronLeft, Share2, Globe, Heart, 
  ShieldAlert, Lock, Unlock, MessageSquare, CheckCircle, Navigation, Award, User, Clock,
  Volume2, Camera, Brain, Megaphone, Users, BarChart3, Ticket, PlusCircle, Filter, 
  TrendingUp, Check, CheckSquare, Sparkles, Trash2, QrCode, Activity
} from 'lucide-react';
import { 
  Locality, Business, Category, Review, UserSession,
  CommunityItem, CRMContact, MarketingCoupon
} from '../types';
import { MASTER_STATES, MASTER_CITIES, MASTER_AREAS } from '../data';
import OtpVerificationModal from './OtpVerificationModal';
import GoogleLocationPicker from './GoogleLocationPicker';
import { getBusinessImageUrl, getCategoryFallbackImage } from '../utils/businessImage';

interface WebPortalProps {
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
  onLocalityChange,
  userSession,
  onUserSessionChange,
  viewedBusinessIds,
  onUnlockBusinessContact,
  onSubmitApplication,
  onUpdateBusiness,
  onAddReview,
  
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  
  // Hero Image Carousel slide index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // OTP modal visibility controls
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTargetBiz, setOtpTargetBiz] = useState<Business | null>(null);

  // Application / Registration Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Email optional
  const [website, setWebsite] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [hours, setHours] = useState('10:00 AM - 08:30 PM');
  const [imageUrl, setImageUrl] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Master geography form values
  const [formStateId, setFormStateId] = useState('mh');
  const [formCityId, setFormCityId] = useState('navimumbai');
  const [formAreaId, setFormAreaId] = useState('roadpali-sec17');
  const [formAreasOfOperation, setFormAreasOfOperation] = useState<string[]>(['roadpali-sec17']);

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
  const [communityTags, setCommunityTags] = useState('monsoon, Roadpali');

  useEffect(() => {
    if (SIMPLE_SEARCH_FORM) {
      setActivePortalTab('listings');
      if (searchMode !== 'keyword') setSearchMode('keyword');
    }
  }, [SIMPLE_SEARCH_FORM, searchMode]);

  // Auto-rotating slider effect
  const currentLocality = localities.find(l => l.id === activeLocalityId) || localities[0];
  const selectedLocalityNames = activeLocalityId
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => localities.find((l) => l.id === id)?.name || id)
    .join(', ');
  const carouselImages = currentLocality.carouselImages || [currentLocality.coverImage];

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Audit log tracker for user search operations (debounced/distinct values)
  useEffect(() => {
    if (!onLogAuditEvent) return;

    if (searchMode === 'keyword' && searchQuery.trim()) {
      const timer = setTimeout(() => {
        onLogAuditEvent(
          'search',
          `Searched directory (Keyword)`,
          `Zone: "${activeLocalityId}" | Query: "${searchQuery}" | Category: "${selectedCategory}"`
        );
      }, 1500); // 1.5-second debounce to prevent heavy typewriter audit logs while typing
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchMode, selectedCategory, activeLocalityId, onLogAuditEvent]);

  useEffect(() => {
    if (!onLogAuditEvent) return;

    if (searchMode === 'voice' && voiceTranscript.trim()) {
      onLogAuditEvent(
        'search',
        `Searched directory (Simulated Voice Recognition)`,
        `Zone: "${activeLocalityId}" | Transcribed audio output: "${voiceTranscript}"`
      );
    }
  }, [voiceTranscript, searchMode, onLogAuditEvent, activeLocalityId]);

  useEffect(() => {
    if (!onLogAuditEvent) return;

    if (searchMode === 'image' && uploadedImageTag) {
      onLogAuditEvent(
        'search',
        `Searched directory (Scan Visual Photo Upload)`,
        `Zone: "${activeLocalityId}" | Extracted Tag: "${uploadedImageTag}" | Directed query: "${searchQuery}"`
      );
    }
  }, [uploadedImageTag, searchMode, onLogAuditEvent, activeLocalityId]);

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
      const q = aiSearchQuery.toLowerCase();
      if (q.includes('hair') || q.includes('salon') || q.includes('groom') || q.includes('cut')) {
        setAiResponseText(`✨ AI Recommendation: I highly recommend "5 Elements | Family Salon" in Sector 17, Roadpali. They offer premium family styling packages, organic hair spa treatments, and maintain a stellar 4.9★ rating based on verified customer feedback.`);
      } else if (q.includes('academy') || q.includes('spa') || q.includes('majestic')) {
        setAiResponseText(`✨ AI Recommendation: Look no further than "Majestic Salon Spa & Academy" in Sector 11, Kalamboli. Managed by Priya Shinde, they hold standard certified beauty training programs and luxury therapeutic bridal therapies.`);
      } else if (q.includes('veg') || q.includes('food') || q.includes('dosa') || q.includes('utsav')) {
        setAiResponseText(`✨ AI Recommendation: "Utsav Grand Pure Veg Restaurant" on Sector 17, Roadpali is the finest pure vegetarian choice! Delivers outstanding Podi Dosa plates and North Indian paneer delicacies in a dynamic family lounge.`);
      } else {
        setAiResponseText(`✨ AI Recommendation: For your query "${aiSearchQuery}", we scanned the active regional directory coords for Roadpali and found high-quality options. Try checking "Barberry Bliss Family Salon" or filters under "Salons & Wellness"!`);
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
  const approvedInLocality = businesses.filter(
    b => b.localityId === activeLocalityId && b.status === "approved"
  );

  const filteredBusinesses = approvedInLocality.filter(b => {
    // Determine query to match
    const activeText = (searchMode === 'voice' && voiceTranscript) ? voiceTranscript : searchQuery;
    const matchesSearch = !activeText.trim() || 
                          b.name.toLowerCase().includes(activeText.toLowerCase()) || 
                          b.description.toLowerCase().includes(activeText.toLowerCase()) ||
                          b.tags.some(t => t.toLowerCase().includes(activeText.toLowerCase()));
    
    // Check if matching primary category
    const matchesCategory = selectedCategory === 'all' || b.categoryId === selectedCategory;

    // Discovery Filter: Distance
    const matchesDistance = filterDistance === 'all' || (b.distance !== undefined && b.distance <= parseFloat(filterDistance));

    // Discovery Filter: Rating min check
    const matchesRating = filterRating === 0 || b.rating >= filterRating;

    // Discovery Filter: Open now check 
    const matchesOpenNow = !filterOpenNow || b.hours.includes('24') || b.hours.includes('AM');

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

    return matchesSearch && matchesCategory && matchesDistance && matchesRating && matchesOpenNow && matchesPrice && matchesDelivery && matchesOffers && matchesVerified && matchesLanguage && matchesPayment && matchesExperience;
  });

  // Apply sorting rules
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    if (sortBy === 'recommended') {
      // Sponsored/CPC bids, then featured status, then top rating
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
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

  // Separate sorted lists
  const featuredBusinesses = sortedBusinesses.filter(b => b.featured);
  const regularBusinesses = sortedBusinesses.filter(b => !b.featured);

  // Trigger registration submission
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address || formAreasOfOperation.length === 0) {
      alert("Please fill in the required fields (*), select operational areas, and define address details.");
      return;
    }

    // Determine featured state limit
    const numFeaturedInLocalAndCat = businesses.filter(
      b => b.localityId === activeLocalityId && b.categoryId === categoryId && b.featured && b.status === 'approved'
    ).length;

    // Default dynamic properties
    const newBizData = {
      name,
      categoryId,
      localityId: activeLocalityId,
      stateId: formStateId,
      cityId: formCityId,
      areaId: formAreaId,
      areasOfOperation: formAreasOfOperation,
      address,
      phone,
      email: email.trim() || undefined, // Email optional!
      website: website || `https://${name.toLowerCase().replace(/\s+/g, '')}.in`,
      description: description || `${name} is a certified local provider of premium local services.`,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=500&q=80',
      featured: false, // Starts as standard approved, admins can toggle VIP status
      tags: [categoryId, 'Local', 'Indian-SME'],
      hours,
      ownerName: ownerName || 'National Proprietor',
      gpsCoordinates: gpsCoords
    };

    onSubmitApplication(newBizData);

    // reset fields
    setName('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setCategoryId('food');
    setAddress('');
    setDescription('');
    setOwnerName('');
    setHours('10:00 AM - 08:30 PM');
    setImageUrl('');
    setFormAreasOfOperation([formAreaId]);
    setGpsCoords(undefined);

    setShowApplyModal(false);
    alert(`Registration received successfully! Listing "${name}" has boarded the verification queue. A regional moderator will audit properties inside the Moderation Desk.`);
  };

  // Triggered on OTP Verification success
  const handleOtpSuccess = (verifiedName: string, verifiedPhone: string) => {
    // Authenticate the user session globally
    onUserSessionChange({
      role: userSession.role === 'buyer' ? 'buyer' : userSession.role,
      userName: `${verifiedName} (Verified Customer)`,
      userPhone: verifiedPhone,
      isAuthenticated: true
    });

    // Unlock the specific contact requested
    if (otpTargetBiz) {
      onUnlockBusinessContact(otpTargetBiz.id);
      alert(`OTP Verification successful! Contact details unlocked for "${otpTargetBiz.name}".`);
      
      // Update selected business ref if open
      if (selectedBiz?.id === otpTargetBiz.id) {
        setSelectedBiz({ ...selectedBiz });
      }
    }
    
    setOtpTargetBiz(null);
  };

  const initContactUnlockFlow = (biz: Business, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card details click
    setOtpTargetBiz(biz);
    
    // If already session-authenticated, immediately unlock and skip modal!
    if (userSession.isAuthenticated && userSession.userPhone) {
      onUnlockBusinessContact(biz.id);
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
      b => b.localityId === activeLocalityId && b.categoryId === biz.categoryId && b.featured && b.status === 'approved'
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
      }
    }
  };

  const handleCityChange = (cityId: string) => {
    setFormCityId(cityId);
    const relatedAreas = MASTER_AREAS.filter(a => a.cityId === cityId);
    if (relatedAreas.length > 0) {
      setFormAreaId(relatedAreas[0].id);
      setFormAreasOfOperation([relatedAreas[0].id]);
    }
  };

  const handleAreaCheckToggle = (areaId: string) => {
    setFormAreasOfOperation(prev => 
      prev.includes(areaId)
        ? prev.filter(x => x !== areaId)
        : [...prev, areaId]
    );
  };

  return (
    <div id="web-portal-root" className="space-y-8 pb-10">
      
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
            Local Business Directory for {selectedLocalityNames || currentLocality.name}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            {currentLocality.description} verified reviews, location-grabbing utilities, and dynamic approval tracking.
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
      {activePortalTab === 'listings' && (
        <div className="space-y-6">
          {/* Advanced Multi-Mode Search Suite */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
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
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search businesses by name, special tags, services..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-sans"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-red-500 font-mono flex-shrink-0 cursor-pointer"
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
                            if (b) setSelectedBiz(b);
                          } else if (q.includes('academy') || q.includes('spa') || q.includes('majestic')) {
                            const b = businesses.find(x => x.id === 's2');
                            if (b) setSelectedBiz(b);
                          } else if (q.includes('veg') || q.includes('food') || q.includes('dosa') || q.includes('utsav')) {
                            const b = businesses.find(x => x.id === 'b11');
                            if (b) setSelectedBiz(b);
                          } else {
                            const b = businesses.find(x => x.id === 's8'); // Barberry Bliss Family Salon as default
                            if (b) setSelectedBiz(b);
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* 1. Distance filter */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Max Distance Radius</label>
                  <select 
                    value={filterDistance}
                    onChange={(e) => setFilterDistance(e.target.value as any)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:outline-none text-[11px]"
                  >
                    <option value="all">Any range (Roadpali Zone)</option>
                    <option value="1">Within 1.0 km</option>
                    <option value="2">Within 2.0 km</option>
                    <option value="5">Within 5.0 km</option>
                  </select>
                </div>

                {/* 2. Rating min check */}
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

                {/* 3. Price scale filter */}
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

                {/* 4. Sorter order desk */}
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

          {/* Categories slide horizontal selector bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-3xs flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-tight flex-shrink-0">Filter Category:</span>
            <div className="flex items-center gap-1.5 pb-1">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`text-[11px] px-3 py-1.5 rounded-xl transition duration-150 flex items-center gap-1 whitespace-nowrap font-medium ${
                    selectedCategory === c.id 
                      ? 'bg-slate-950 text-white font-bold shadow' 
                      : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bulletin local campaign strip */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-l-4 border-amber-500 rounded-r-2xl p-3.5 flex items-center justify-between gap-4 shadow-2xs">
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

          {/* LISTINGS STREAMS SECTION */}
          <div className="space-y-6">
            
            {/* VIP Premium Sponsored Segment */}
            {featuredBusinesses.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold font-mono text-indigo-650 tracking-widest uppercase flex items-center gap-1.5">
                  ⭐ Premium Featured &amp; Sponsored ({featuredBusinesses.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredBusinesses.map(biz => {
                    const hasViewed = viewedBusinessIds.includes(biz.id);
                    return (
                      <div 
                        key={biz.id}
                        onClick={() => setSelectedBiz(biz)}
                        className="bg-white rounded-2xl border-2 border-indigo-400/40 p-5 shadow-xs flex flex-col md:flex-row gap-5 hover:border-indigo-600 transition cursor-pointer relative"
                      >
                        <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white text-[9px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full tracking-wide flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" /> Sponsored VIP
                        </span>

                        <img 
                          src={getBusinessImageUrl(biz)}
                          alt={biz.name}
                          className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover bg-slate-100 self-center border border-slate-200 flex-shrink-0"
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
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold uppercase">
                              {biz.categoryId}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {biz.description}
                          </p>

                          <div className="text-[11px] font-mono text-slate-500 space-y-0.5 font-sans">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {hasViewed ? (
                                <div className="flex items-center gap-1.5 text-slate-800 font-bold font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  <span>📞 {biz.phone}</span>
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
                            
                            {/* Area scope list */}
                            {biz.areasOfOperation && biz.areasOfOperation.length > 0 && (
                              <div className="font-sans text-[10px] text-slate-400 mt-1 truncate">
                                🗺️ Service Areas: {biz.areasOfOperation.map(aid => MASTER_AREAS.find(a => a.id === aid)?.name).filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-lg font-bold">
                              ★ {biz.rating} <span className="font-medium text-slate-400 text-[10px]">({biz.reviewCount || 0} customer reviews)</span>
                            </div>
                            <span className="text-xs text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5 text-[10px]">
                              Inspect records &gt;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standard Approved Listings Segment */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono text-slate-400 tracking-widest uppercase mb-1">
                Active Verified Listings Directory ({regularBusinesses.length})
              </h3>

              {regularBusinesses.length === 0 && featuredBusinesses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                  <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                  <p className="text-base font-bold text-slate-850">No verified businesses found matching criteria</p>
                  <p className="text-xs text-slate-505 mt-1 max-w-sm mx-auto">
                    Adjust search queries or refine your category keywords above to discover matching merchants.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularBusinesses.map((biz, index) => {
                    const hasViewed = viewedBusinessIds.includes(biz.id);
                    // Inject a beautiful sponsor banner ad after every 3rd listing
                    const injectAd = (index > 0) && (index % 3 === 2);
                    const MOCK_BANNER_ADS = [
                      {
                        title: "⚡ Switch to JioFiber – Best High-Speed Broadband in Roadpali",
                        description: "Get 200 Mbps unlimited optical fiber Internet, free smart setup, and 14 premium OTT channels. Call +91 86559 11223.",
                        badge: "Local ISP Sponsor",
                        cta: "Claim Free Router",
                        color: "from-blue-600 via-indigo-900 to-slate-900"
                      },
                      {
                        title: "🏥 Apollo Diagnostics India – Sector 17 Health Checkup at ₹899",
                        description: "Complete health evaluation package covering 68 key parameters with certified online reports & free home collection.",
                        badge: "Medical Partner",
                        cta: "Book Diagnostic",
                        color: "from-emerald-700 via-teal-905 to-slate-900"
                      },
                      {
                        title: "🚗 Royal Landmark Hyundai Group – Big Monsoon Bonanza",
                        description: "Drive home a premium SUV with zero downpayment, exchange bonuses up to ₹40,000, and free 3-year service shields.",
                        badge: "Automotive Ad",
                        cta: "Request Demo Drive",
                        color: "from-sky-700 via-slate-900 to-indigo-950"
                      }
                    ];
                    const ad = MOCK_BANNER_ADS[Math.floor(index / 3) % MOCK_BANNER_ADS.length];

                    return (
                      <React.Fragment key={biz.id}>
                        <div 
                          onClick={() => setSelectedBiz(biz)}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="relative">
                              <img 
                                src={getBusinessImageUrl(biz)}
                                alt={biz.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
                                }}
                                className="w-full h-36 object-cover rounded-xl border border-slate-200/60 bg-slate-100"
                              />
                              {biz.verifiedBadge && (
                                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  Verified Badge
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                                  {biz.categoryId.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-0.5 bg-amber-50 text-amber-600 text-xs px-1.5 rounded font-bold">
                                  ★ {biz.rating}
                                </div>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight truncate flex items-center gap-1">
                                {biz.name}
                                {biz.isSponsored && (
                                  <span className="bg-amber-100 text-amber-800 text-[8px] font-mono font-bold px-1 rounded">CPC</span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-505 line-clamp-2 italic leading-relaxed">
                                &quot;{biz.description}&quot;
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-500 font-mono">
                            <div className="flex items-center justify-between font-sans flex-wrap gap-1.5">
                              {hasViewed ? (
                                <div className="flex items-center gap-1 text-slate-800 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                                  <span>📞 {biz.phone}</span>
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
                            
                            <span className="text-indigo-600 font-sans font-bold hover:underline inline-flex items-center gap-0.5 mt-1 block">
                              Explore directory record →
                            </span>
                          </div>
                        </div>

                        {/* Injected Gorgeous Premium Row Banner Ad */}
                        {injectAd && ad && (
                          <div className="col-span-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                              <div className="bg-amber-400 text-slate-950 p-3 rounded-full flex-shrink-0 animate-bounce shadow">
                                <Megaphone className="w-5 h-5" />
                              </div>
                              <div className="text-center md:text-left space-y-1">
                                <span className="inline-flex bg-amber-500/15 text-amber-400 font-mono text-[9px] px-2.5 py-0.5 rounded-md border border-amber-500/20 uppercase font-bold tracking-wider mb-1">
                                  📢 {ad.badge} Sponsored Highlight
                                </span>
                                <h4 className="text-base font-bold text-white font-sans">{ad.title}</h4>
                                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{ad.description}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                alert(`Simulating sponsor connection to ${ad.badge}. A direct referral WhatsApp route has been dispatched!`);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-xl transition shadow flex items-center gap-2 flex-shrink-0 cursor-pointer w-full md:w-auto justify-center"
                            >
                              <span>{ad.cta}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
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
                  <span className="text-emerald-500">🤝</span> Roadpali Citizens Forum Hub
                </h3>
                <span className="text-xs text-slate-400 font-mono">Sharded Community Channel</span>
              </div>

              {/* Feed items */}
              <div className="space-y-4">
                {communityItems.filter(item => item.localityId === activeLocalityId).map(post => (
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

                    <h4 className="font-extrabold text-slate-900 text-sm">{post.title}</h4>
                    <p className="text-xs text-slate-650 leading-relaxed font-sans">{post.content}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/55 flex-wrap gap-2 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500">
                          #roadpali_citizens
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
              </div>
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
          {/* Active Workspace Switcher header */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 text-slate-950 p-2.5 rounded-xl font-bold font-sans">
                💼 SME
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">Active Merchant Growth Desk Workspace:</div>
                <h3 className="font-extrabold text-base text-white">
                  {businesses.find(b => b.id === activeSellerBizId)?.name || 'Local SME Outlet'}
                </h3>
              </div>
            </div>

            {/* SME selector dropdown to easily swap client context to inspect stats */}
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
                    {crmContacts.filter(c => c.businessId === activeSellerBizId).length} Contacts
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
                      {crmContacts.filter(c => c.businessId === activeSellerBizId).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 font-mono">
                            No lead lookups recorded yet. Perform public OTP views as Buyer perspective to bootstrap CRM contacts!
                          </td>
                        </tr>
                      ) : (
                        crmContacts.filter(c => c.businessId === activeSellerBizId).map(contact => (
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
                onClick={() => setSelectedBiz(null)}
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
                className="w-full h-44 object-cover rounded-2xl border border-slate-200 bg-slate-50 shadow-inner"
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

                  <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    ★ {selectedBiz.rating} ({selectedBiz.reviewCount} verified reviews)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {selectedBiz.categoryId.toUpperCase()}
                  </span>
                  {selectedBiz.tags.map(t => (
                    <span key={t} className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic">
                &quot;{selectedBiz.description}&quot;
              </p>

              {/* Master Areas of Operation list inside details */}
              {selectedBiz.areasOfOperation && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-wrap gap-2 items-center text-xs">
                  <span className="font-bold text-slate-400 font-mono text-[9px] uppercase">Service Areas:</span>
                  {selectedBiz.areasOfOperation.map(aid => {
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
                        <a href={`tel:${selectedBiz.phone}`} className="hover:underline text-indigo-600 font-bold">{selectedBiz.phone}</a>
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

              {/* Audited reviews List Module */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Verified Customer Reviews ({reviews.filter(r => r.businessId === selectedBiz.id).length})
                </h4>

                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {reviews.filter(r => r.businessId === selectedBiz.id).length === 0 ? (
                    <p className="text-slate-400 italic text-[11px] py-2 text-center bg-slate-50 rounded-lg">
                      No customer reviews yet. Be the first to verify and post matching feedback!
                    </p>
                  ) : (
                    reviews.filter(r => r.businessId === selectedBiz.id).map(rev => (
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
                      <Lock className="w-3.5 h-3.5" /> Authenticate Phone via simulated SMS OTP
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <a 
                  href={selectedBiz.website} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs py-2.5 rounded-xl text-center shadow flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Visit Website
                </a>
                <button 
                  onClick={() => alert(`Direct link context copied for: https://${currentLocality.subdomain}/biz/${selectedBiz.id}`)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Listing
                </button>
              </div>
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
                  Add Your Business to {currentLocality.name}
                </h3>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-slate-200 hover:text-white font-mono font-bold text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
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
                  <label className="block font-bold text-slate-700 mb-1">Category Segment *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="salon">Salons &amp; Wellness</option>
                    <option value="food">Food &amp; Dining</option>
                    <option value="tech">Tech &amp; Digital</option>
                    <option value="health">Health &amp; Wellness</option>
                    <option value="home">Home Services</option>
                    <option value="services">Professional Services</option>
                    <option value="retail">Shops &amp; Retail</option>
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
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
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
