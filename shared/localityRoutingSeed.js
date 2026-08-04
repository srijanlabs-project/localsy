import {
  DEFAULT_AREAS,
  DEFAULT_CITIES,
  DEFAULT_GEOGRAPHY_LOCALITIES,
} from './geographySeed.js';

const DEFAULT_LOCALITY_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
];

const DEFAULT_LOCALITY_CAROUSEL_IMAGES = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
];

const slugifyForUrl = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const buildDefaultLocalityDescription = (localityName, cityName) => (
  `Discover verified businesses, local offers, and community updates in ${localityName}${cityName ? `, ${cityName}` : ''}.`
);

export const DEFAULT_LOCALITY_ID = DEFAULT_GEOGRAPHY_LOCALITIES[0]?.id || 'locality-default';

export const DEFAULT_LOCALITIES = DEFAULT_GEOGRAPHY_LOCALITIES.map((locality, index) => {
  const city = DEFAULT_CITIES.find((entry) => entry.id === locality.cityId);
  const slug = slugifyForUrl(locality.id || locality.name);
  const coverImage = DEFAULT_LOCALITY_COVER_IMAGES[index % DEFAULT_LOCALITY_COVER_IMAGES.length];
  const carouselImages = Array.from({ length: 3 }, (_, offset) => (
    DEFAULT_LOCALITY_CAROUSEL_IMAGES[(index + offset) % DEFAULT_LOCALITY_CAROUSEL_IMAGES.length]
  ));
  return {
    id: locality.id,
    name: city?.name ? `${locality.name}, ${city.name}` : locality.name,
    slug,
    subdomain: `${slug}.localisy.in`,
    description: buildDefaultLocalityDescription(locality.name, city?.name || ''),
    status: 'active',
    coverImage,
    stats: { numBusinesses: 0, numPending: 0 },
    carouselImages,
  };
});

const buildDefaultPincodeMappingsFromAreas = (areas = DEFAULT_AREAS) => {
  const firstLocalityByPincode = new Map();
  areas.forEach((area) => {
    const pincode = String(area?.pincode || '').replace(/\D/g, '').slice(0, 6);
    const localityId = String(area?.localityId || '').trim();
    if (!pincode || !localityId || firstLocalityByPincode.has(pincode)) return;
    firstLocalityByPincode.set(pincode, localityId);
  });
  return Array.from(firstLocalityByPincode.entries()).map(([pincode, localityId]) => ({
    pincode,
    localityId,
  }));
};

const DEFAULT_SUPPLEMENTAL_PINCODE_MAPPINGS = [
  { pincode: '410101', localityId: DEFAULT_LOCALITY_ID },
];

export const DEFAULT_PINCODE_MAPPINGS = [
  ...buildDefaultPincodeMappingsFromAreas(),
  ...DEFAULT_SUPPLEMENTAL_PINCODE_MAPPINGS.filter((mapping) => (
    !buildDefaultPincodeMappingsFromAreas().some((entry) => entry.pincode === mapping.pincode)
  )),
];

export const buildDefaultSubdomainMappings = (localities = DEFAULT_LOCALITIES) => (
  localities.map((locality) => ({
    domain: locality.subdomain || `${slugifyForUrl(locality.slug || locality.id)}.localisy.in`,
    localityId: locality.id,
    sslEnabled: true,
    dnsStatus: 'active',
    createdAt: new Date().toISOString(),
  }))
);
