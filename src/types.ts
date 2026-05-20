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

export interface Business {
  id: string;
  name: string;
  categoryId: string;
  localityId: string; // The primary domain locality
  stateId: string;    // Master State
  cityId: string;     // Master City
  areaId: string;     // Primary Area
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
  image?: string;
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
  code: string;
  discount: string;
  description: string;
  expiryDate: string;
  usageCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
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

export interface AreaMaster {
  id: string;
  cityId: string;
  name: string;
  pincode: string;
}

export type UserRole = 'buyer' | 'admin' | 'moderator' | 'operator' | 'seller';

export interface UserSession {
  role: UserRole;
  userName: string;
  userPhone?: string;
  isAuthenticated: boolean;
  sellerBusinessId?: string; // Linked for seller dashboard
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

