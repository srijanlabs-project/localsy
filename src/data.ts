import { CRMContact, Review } from './types';

// These two collections are still frontend-seeded for now.
// Larger listing/homepage seed payloads have been migrated to managed server-side JSON sources.

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    businessId: 's1',
    userName: 'Karan Malhotra',
    userPhone: '+918001122334',
    rating: 5,
    comment: 'Exceptional styling and warm behavior! The hair spa in their Sector 17 Phoenix Heights branch is spectacular. Best salon in Roadpali.',
    createdAt: '2026-04-12T14:00:00Z',
    verifiedByOtp: true,
    photoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80',
    isVerifiedPurchase: true,
    helpfulVotes: 14,
  },
  {
    id: 'r2',
    businessId: 's2',
    userName: 'Sneha Deshmukh',
    userPhone: '+919911223344',
    rating: 5,
    comment: 'The bridal package and hair academy quality is top tier. Priya Shinde is extremely experienced and guides everyone with care.',
    createdAt: '2026-05-01T08:15:00Z',
    verifiedByOtp: true,
    photoUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=300&q=80',
    isVerifiedPurchase: true,
    helpfulVotes: 5,
  },
  {
    id: 'r3',
    businessId: 's3',
    userName: 'Akshay Patil',
    userPhone: '+919876543210',
    rating: 4,
    comment: 'Advanced Botox scalp treatment done. Professional clinic ambience with high hygiene protocols near Amarante Sector 9E.',
    createdAt: '2026-03-20T10:30:00Z',
    verifiedByOtp: true,
    isVerifiedPurchase: false,
    helpfulVotes: 8,
  },
];

export const INITIAL_CRM_CONTACTS: CRMContact[] = [
  {
    id: 'crm1',
    businessId: 's1',
    name: 'Dilip Patil',
    phone: '+91 98311 00223',
    email: 'dilip.patil@startuphub.io',
    lastInteraction: '2026-05-19T08:00:00Z',
    followUpNotes: 'Regular grooming client. Enrolled monthly family membership card for 5 Elements salon.',
    totalSpent: 3500,
    ordersCount: 8,
    loyaltyPoints: 350,
  },
  {
    id: 'crm2',
    businessId: 's2',
    name: 'Sushma Swaraj',
    phone: '+91 88912 33441',
    email: 'sushma.sw@gmail.com',
    lastInteraction: '2026-05-18T16:30:00Z',
    followUpNotes: 'Booked customized pre-wedding beauty training module. Total batch size is 3 interns.',
    totalSpent: 12000,
    ordersCount: 1,
    loyaltyPoints: 1200,
  },
];
