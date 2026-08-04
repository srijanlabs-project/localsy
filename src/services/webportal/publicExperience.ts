import type { Business, Locality } from '../../types';
import { MASTER_CITIES, MASTER_STATES } from '../../geographyMaster';

export type ExperienceRouteContext =
  | { page: 'locality' }
  | { page: 'city'; cityId: string }
  | { page: 'national' }
  | { page: 'seller'; sellerBusinessId: string };

export const slugifyPublicValue = (value: string) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getBusinessGallery = (business: Business) => (
  Array.from(new Set([
    business.coverImageUrl,
    business.imageUrl,
    business.logoUrl,
    ...(business.galleryUrls || []),
  ].map((entry) => String(entry || '').trim()).filter(Boolean))).slice(0, 8)
);

export const getBusinessPrimaryLocationLabel = (localities: Locality[], business: Business) => {
  const locality = localities.find((entry) => entry.id === business.localityId) || null;
  const localityLabel = locality?.name.split(',')[0]?.trim() || business.localityId;
  const city = MASTER_CITIES.find((entry) => entry.id === business.cityId) || null;
  return city?.name ? `${localityLabel}, ${city.name}` : localityLabel;
};

export const getBusinessDirectionsUrl = (business: Business) => {
  if (business.gpsCoordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${business.gpsCoordinates.lat},${business.gpsCoordinates.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address || business.name)}`;
};

export const getBusinessCanonicalSlug = (business: Business) => (
  business.slug || slugifyPublicValue(`${business.name}-${business.id}`)
);

export const getSellerPageSlug = (business: Business) => (
  slugifyPublicValue(`${business.name}-${business.id}`)
);

export const getCityRecordForLocality = (businesses: Business[], localities: Locality[], cityId: string) => {
  const city = MASTER_CITIES.find((entry) => entry.id === cityId) || null;
  const state = city ? MASTER_STATES.find((entry) => entry.id === city.stateId) || null : null;
  const cityLocalities = localities.filter((entry) => entry.name.toLowerCase().includes(city?.name.toLowerCase() || ''));
  const cityLocalityIds = new Set(cityLocalities.map((entry) => entry.id));
  const cityBusinesses = businesses.filter((entry) => cityLocalityIds.has(entry.localityId) && entry.status === 'approved');
  return {
    city,
    state,
    cityLocalities,
    cityBusinesses,
  };
};

export const buildNationalDirectorySummary = (businesses: Business[], localities: Locality[]) => {
  const approvedBusinesses = businesses.filter((business) => business.status === 'approved');
  const cityIds = Array.from(new Set(approvedBusinesses.map((business) => business.cityId).filter(Boolean)));
  const stateIds = Array.from(new Set(approvedBusinesses.map((business) => business.stateId).filter(Boolean)));
  const featuredBusinesses = [...approvedBusinesses]
    .sort((left, right) => (
      (Number(right.featured) - Number(left.featured)) ||
      right.rating - left.rating ||
      right.reviewCount - left.reviewCount
    ))
    .slice(0, 8);
  const localityHighlights = localities
    .map((locality) => {
      const count = approvedBusinesses.filter((business) => business.localityId === locality.id).length;
      return { locality, count };
    })
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
  return {
    approvedBusinesses,
    cityIds,
    stateIds,
    featuredBusinesses,
    localityHighlights,
  };
};
