export const DEFAULT_LOCALITY_ID = 'roadpali';

export const DEFAULT_LOCALITIES = [
  {
    id: 'roadpali',
    name: 'Roadpali, Navi Mumbai',
    slug: 'roadpali',
    subdomain: 'roadpali.happygifting.in',
    description: 'Explore verified family salons, trendy multi-cuisine dining hubs, and essential shops in the highly planned residential nodes of Roadpali.',
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    stats: { numBusinesses: 8, numPending: 2 },
    carouselImages: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'kharghar',
    name: 'Kharghar, Navi Mumbai',
    slug: 'kharghar',
    subdomain: 'kharghar.happygifting.in',
    description: 'Find premium cafes, sports courts, wellness lounges, and educational consulting services in the highly aesthetic node of Kharghar.',
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    stats: { numBusinesses: 2, numPending: 0 },
    carouselImages: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'kamothe',
    name: 'Kamothe, Navi Mumbai',
    slug: 'kamothe',
    subdomain: 'kamothe.happygifting.in',
    description: 'Connect with local supermarkets, home appliances workshops, tuition centers, and dental clinics across Kamothe nodes.',
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
    stats: { numBusinesses: 2, numPending: 0 },
    carouselImages: [
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'panvel',
    name: 'Panvel, Navi Mumbai',
    slug: 'panvel',
    subdomain: 'panvel.happygifting.in',
    description: 'Explore the traditional commercial capital of Navi Mumbai with historical food courts, diagnostic healthcare clinics, and transport centers.',
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    stats: { numBusinesses: 2, numPending: 0 },
    carouselImages: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'taloja',
    name: 'Taloja, Navi Mumbai',
    slug: 'taloja',
    subdomain: 'taloja.happygifting.in',
    description: 'Discover massive tooling industries, hardware stores, professional technical consultants, and logistics solutions based in Taloja.',
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    stats: { numBusinesses: 2, numPending: 0 },
    carouselImages: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'kalamboli',
    name: 'Kalamboli, Navi Mumbai',
    slug: 'kalamboli',
    subdomain: 'kalamboli.happygifting.in',
    description: 'Connect with established spa academies, ladies dress boutiques, general medical stores, and trusted technical contractors across Kalamboli.',
    status: 'active',
    coverImage: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
    stats: { numBusinesses: 7, numPending: 1 },
    carouselImages: [
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export const DEFAULT_PINCODE_MAPPINGS = [
  { pincode: '410101', localityId: 'roadpali' },
  { pincode: '410218', localityId: 'roadpali' },
  { pincode: '410210', localityId: 'kharghar' },
  { pincode: '410209', localityId: 'kamothe' },
  { pincode: '410206', localityId: 'panvel' },
  { pincode: '410221', localityId: 'panvel' },
  { pincode: '410208', localityId: 'taloja' }
];

export const buildDefaultSubdomainMappings = (localities = DEFAULT_LOCALITIES) => (
  localities.map((locality) => ({
    domain: locality.subdomain,
    localityId: locality.id,
    sslEnabled: true,
    dnsStatus: 'active',
    createdAt: new Date().toISOString(),
  }))
);
