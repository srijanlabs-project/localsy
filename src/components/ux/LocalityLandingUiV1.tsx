import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Grid2x2,
  LogOut,
  MapPin,
  Menu,
  Search,
  Star,
  User,
  X,
} from 'lucide-react';
import { Business, Category, HeroBanner, ListingAd, Locality, MarketingCoupon, UserSession } from '../../types';
import { getAreaById } from '../../geographyMaster';
import { getCategoryById, getSubcategoryById } from '../../categoryMaster';
import { getMediaProxyUrl } from '../../utils/mediaUrl';
import happyBusinessLogo from '../../assets/happy-business-logo.png';
import { CategoryChip, formatRating, getCategoryPresentation } from './localisyPublicPrimitives';

type LocalityLandingUiV1Props = {
  activeLocalityId: string;
  businesses: Business[];
  categories: Category[];
  heroBanners?: HeroBanner[];
  listingAds?: ListingAd[];
  localities: Locality[];
  recentSearches: string[];
  onClearRecentSearches: () => void;
  onSearchSubmit: (query: string) => void;
  onOpenHeroCta?: (banner: HeroBanner) => void;
  onOpenListingAd?: (ad: ListingAd) => void;
  displayedPincode?: string;
  // Every pincode this page covers. Listings are scoped by PINCODE, not by
  // which locality a business happens to be tagged with, so a business in a
  // shared pincode shows up on every locality page that covers that pincode.
  scopedPincodes?: string[];
  activeNodeLabel?: string;
  userSession?: UserSession;
  onOpenPincodeModal?: () => void;
  onRequestAuth?: () => void;
  onLogout?: () => void;
  isAdvertiseActive?: boolean;
  isAccountActive?: boolean;
  onOpenLivePortal: () => void;
  onOpenPlatform?: () => void;
  onOpenCityPage: (localityId?: string) => void;
  onOpenCategoryPage: (categoryId: string, localityId?: string) => void;
  // Opens the results page already scoped to a subcategory. Optional so the
  // /ui preview routes, which have no results page, can leave it out and fall
  // back to opening the parent category.
  onOpenSubcategoryPage?: (categoryId: string, subcategoryId: string, localityId?: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  // "Show number" must reveal the number where it is pressed, not navigate to
  // the listing page. The host owns the unlock flow, so it passes a handler in;
  // without one the button falls back to opening the listing.
  onShowNumber?: (businessId: string, event: React.MouseEvent) => void;
  // Businesses whose number this visitor has already unlocked.
  revealedPhoneBusinessIds?: string[];
  // Live offers for this locality. Until now offers were created in admin and
  // rendered nowhere: the only consumer was renderHomepageSectionsContent,
  // which is dead code.
  offers?: MarketingCoupon[];
};

type CategoryTile = {
  category: Category;
  count: number;
  accent: string;
};

type SubcategoryChip = {
  id: string;
  name: string;
  count: number;
};

type SectionGroup = CategoryTile & {
  chips: SubcategoryChip[];
  listings: Business[];
};

type PromoCardContent = {
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
};

const CATEGORY_ACCENTS = [
  '#F97316',
  '#10B981',
  '#EC4899',
  '#6366F1',
  '#8B5CF6',
  '#14B8A6',
  '#F59E0B',
  '#3B82F6',
  '#84CC16',
  '#A855F7',
  '#64748B',
  '#E879F9',
];

const HERO_PRIMARY_PLACEMENT_KEY = 'homepage_hero_primary';
const HERO_SECONDARY_PLACEMENT_KEY = 'homepage_hero_secondary';
const CATEGORY_STRIP_PLACEMENT_KEY = 'homepage_strip_between_categories_and_listings';

const matchesPlacementTarget = (
  ad: ListingAd,
  placementKey: string,
  device: 'desktop' | 'mobile' | 'all' = 'all',
) => {
  if (String(ad.placementKey || '').trim() !== placementKey) return false;
  const target = ad.deviceTarget || 'all';
  if (device === 'desktop') return target !== 'mobile';
  if (device === 'mobile') return target !== 'desktop';
  return true;
};

const normalizeValue = (value: string) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getBusinessSearchLabel = (business: Business, categories: Category[]) => (
  categories.find((category) => category.id === business.categoryId)?.name
  || getCategoryById(business.categoryId)?.name
  || business.sourceCategoryLabel
  || 'Local business'
);

const getBusinessSubcategory = (business: Business, categories: Category[]) => (
  business.sourceSubcategoryLabel
  || getBusinessSearchLabel(business, categories)
);

// The real subcategory name, resolved from the taxonomy by id, falling back to
// the imported source label and only then to the parent category. Cards show
// this instead of the parent category, which was too coarse to be useful
// (every row under "Food & Restaurants" just repeated the section heading).
const getBusinessSubcategoryLabel = (business: Business, categories: Category[]) => (
  getSubcategoryById(business.subcategoryId || '')?.name
  || business.sourceSubcategoryLabel
  || getBusinessSearchLabel(business, categories)
);

const getBusinessLocationLabel = (business: Business) => (
  business.address.split(',')[0]?.trim()
  || 'Sector 17'
);

const getListingScore = (business: Business) => (
  (business.featured ? 80 : 0)
  + (business.rating || 0) * 10
  + ((business.reviewCount || 0) / 8)
);
// A listing with no contactable phone shows no action button, so it is the
// least useful card. Ranking it below every contactable listing keeps the
// dead-end cards out of the top of each category row.
const hasContactablePhone = (business: Business) => (
  Boolean(String(business.phone || '').replace(/\D/g, '').slice(-10))
);

const compareListings = (left: Business, right: Business) => (
  (Number(hasContactablePhone(right)) - Number(hasContactablePhone(left)))
  || (getListingScore(right) - getListingScore(left))
);

function buildCategoryTiles(approvedBusinesses: Business[], categories: Category[]) {
  const counts = new Map<string, number>();
  approvedBusinesses.forEach((business) => {
    const key = business.categoryId || 'uncategorized';
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([categoryId, count], index) => ({
      category: categories.find((entry) => entry.id === categoryId) || {
        id: categoryId,
        name: getCategoryById(categoryId)?.name || categoryId || 'More',
      } as Category,
      count,
      accent: CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length],
    }))
    .sort((left, right) => right.count - left.count || left.category.name.localeCompare(right.category.name));
}

function buildPromoTitle(business: Business | null, localityLabel: string, fallback: string) {
  if (!business) return fallback;
  return `${business.name} in ${localityLabel}`;
}

function buildPromoSubtitle(business: Business | null, categories: Category[], localityLabel: string) {
  if (!business) return `Trusted local businesses in ${localityLabel}`;
  return `${getBusinessSearchLabel(business, categories)} | ${getBusinessLocationLabel(business)}`;
}

export default function LocalityLandingUiV1({
  activeLocalityId,
  businesses,
  categories,
  heroBanners = [],
  listingAds = [],
  localities,
  recentSearches,
  onClearRecentSearches,
  onSearchSubmit,
  onOpenHeroCta,
  onOpenListingAd,
  displayedPincode,
  scopedPincodes = [],
  activeNodeLabel,
  userSession,
  onOpenPincodeModal,
  onRequestAuth,
  onLogout,
  isAdvertiseActive = false,
  isAccountActive = false,
  onOpenLivePortal,
  onOpenPlatform,
  onOpenCityPage,
  onOpenCategoryPage,
  onOpenSubcategoryPage,
  onOpenListingPage,
  onShowNumber,
  revealedPhoneBusinessIds = [],
  offers = [],
}: LocalityLandingUiV1Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openChipMenuId, setOpenChipMenuId] = useState<string | null>(null);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [expandedSheetCategoryId, setExpandedSheetCategoryId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [heroRotationTick, setHeroRotationTick] = useState(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroRotationTick((current) => current + 1);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  // activeLocalityId can be a comma-joined list when a shared pincode routes
  // to more than one locality — the page then shows all of them together.
  const activeLocalityIds = useMemo(
    () => activeLocalityId.split(',').map((id) => id.trim()).filter(Boolean),
    [activeLocalityId],
  );
  const activeLocalityList = useMemo(
    () => {
      const resolved = activeLocalityIds
        .map((id) => localities.find((locality) => locality.id === id))
        .filter((locality): locality is NonNullable<typeof locality> => Boolean(locality));
      return resolved.length > 0 ? resolved : (localities[0] ? [localities[0]] : []);
    },
    [activeLocalityIds, localities],
  );
  const activeLocality = activeLocalityList[0] || null;
  const scopedLocalityIds = activeLocalityList.map((locality) => locality.id);

  const localityLabel = activeLocalityList.length > 0
    ? activeLocalityList.map((locality) => locality.name.split(',')[0]).join(' & ')
    : 'Roadpali';
  const primaryPincode = useMemo(() => {
    const firstBusinessPin = businesses.find((business) => scopedLocalityIds.includes(business.localityId) && business.pincode)?.pincode;
    return firstBusinessPin || '410218';
  }, [scopedLocalityIds.join(','), businesses]);
  const resolvedPincode = displayedPincode || primaryPincode;
  const resolvedNodeLabel = activeNodeLabel || localityLabel;
  const isAuthenticated = Boolean(userSession?.isAuthenticated && userSession?.userPhone);

  // Listings are scoped by PINCODE, not by the locality a business is tagged
  // with: a page covering 400706 shows every approved business sitting in
  // 400706 regardless of whether it was filed under Seawoods or Nerul. The
  // locality-id filter is only a fallback for a page with no mapped pincodes,
  // so such a page isn't left showing an empty directory.
  const approvedBusinesses = useMemo(() => {
    const pincodeScope = scopedPincodes.map((pin) => String(pin || '').replace(/\D/g, '')).filter(Boolean);
    const resolveBusinessPincode = (business: Business) => String(
      business.pincode || getAreaById(business.areaId || '')?.pincode || ''
    ).replace(/\D/g, '');

    return businesses
      .filter((business) => {
        if (business.status !== 'approved') return false;
        if (pincodeScope.length > 0) return pincodeScope.includes(resolveBusinessPincode(business));
        return scopedLocalityIds.includes(business.localityId);
      })
      .sort(compareListings);
  }, [scopedPincodes.join(','), scopedLocalityIds.join(','), businesses]);

  const recentSearchTerms = useMemo(
    () => recentSearches.map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 5),
    [recentSearches],
  );

  const categoryTiles = useMemo(
    () => buildCategoryTiles(approvedBusinesses, categories),
    [approvedBusinesses, categories],
  );

  // Every category group present in this locality gets a chip, not just the
  // first 12 — the chip strip mirrors the section rows below it. Buckets that
  // resolve to no actual listing are dropped for the same reason the rows drop
  // them, so the chips and the rows always agree.
  const visibleCategoryTiles = useMemo(
    () => categoryTiles.filter((tile) => approvedBusinesses.some((business) => business.categoryId === tile.category.id)),
    [approvedBusinesses, categoryTiles],
  );
  const featuredCategoryId = visibleCategoryTiles[0]?.category.id || categories[0]?.id || 'all';
  const primaryHeroBusiness = approvedBusinesses[0] || null;
  const secondaryHeroBusiness = approvedBusinesses.find((business) => business.id !== primaryHeroBusiness?.id && business.featured) || approvedBusinesses[1] || null;
  const homepageListingAds = useMemo(
    () => listingAds.filter((ad) => !ad.placementKey || ad.placementKey.startsWith('homepage')),
    [listingAds],
  );
  const primaryHeroImageAds = useMemo(
    () => homepageListingAds
      .filter((ad) => matchesPlacementTarget(ad, HERO_PRIMARY_PLACEMENT_KEY, 'desktop'))
      .slice(0, 7),
    [homepageListingAds],
  );
  const mobilePrimaryHeroImageAds = useMemo(
    () => homepageListingAds
      .filter((ad) => matchesPlacementTarget(ad, HERO_PRIMARY_PLACEMENT_KEY, 'mobile'))
      .slice(0, 7),
    [homepageListingAds],
  );
  const secondaryHeroImageAds = useMemo(
    () => homepageListingAds
      .filter((ad) => matchesPlacementTarget(ad, HERO_SECONDARY_PLACEMENT_KEY, 'desktop'))
      .slice(0, 7),
    [homepageListingAds],
  );
  const stripBannerAd = useMemo(
    () => homepageListingAds.find((ad) => matchesPlacementTarget(ad, CATEGORY_STRIP_PLACEMENT_KEY)) || null,
    [homepageListingAds],
  );
  // Full inventory for the between-categories strip, so the every-3rd-row
  // banner can rotate rather than repeating one creative down the page.
  const interCategoryAds = useMemo(
    () => homepageListingAds.filter((ad) => matchesPlacementTarget(ad, CATEGORY_STRIP_PLACEMENT_KEY)),
    [homepageListingAds],
  );
  const rotatingPrimaryHeroAd = primaryHeroImageAds.length > 0
    ? primaryHeroImageAds[heroRotationTick % primaryHeroImageAds.length]
    : null;
  const rotatingMobilePrimaryHeroAd = mobilePrimaryHeroImageAds.length > 0
    ? mobilePrimaryHeroImageAds[heroRotationTick % mobilePrimaryHeroImageAds.length]
    : null;
  const rotatingSecondaryHeroAd = secondaryHeroImageAds.length > 0
    ? secondaryHeroImageAds[heroRotationTick % secondaryHeroImageAds.length]
    : null;
  const primaryHeroBanner = heroBanners[0] || null;
  const secondaryHeroBanner = heroBanners[1] || null;

  // Slides for the mobile sponsored slot: booked inventory first, with a house
  // "promote your business" creative as the fallback so the slot always has
  // something real to show. Rotates on the same tick as the hero.
  const mobileSponsoredSlides = useMemo(() => {
    const booked = homepageListingAds
      .filter((ad) => (ad.deviceTarget || 'all') !== 'desktop')
      .slice(0, 10)
      .map((ad) => ({
        id: ad.id,
        title: ad.title || `Featured in ${localityLabel}`,
        subtitle: ad.description || `Sponsored placement across ${localityLabel}.`,
        cta: ad.ctaText || 'Learn more',
        image: ad.imageUrl ? getMediaProxyUrl(ad.imageUrl) : '',
        onClick: () => (onOpenListingAd ? onOpenListingAd(ad) : onOpenLivePortal()),
      }));
    if (booked.length > 0) return booked;
    return [{
      id: 'house-promote',
      title: 'Grow your business with Localisy',
      subtitle: `Reach more customers in ${localityLabel} with our platform.`,
      cta: 'Promote Now',
      image: '',
      onClick: onOpenLivePortal,
    }];
  }, [homepageListingAds, localityLabel, onOpenListingAd, onOpenLivePortal]);

  // Every category group present here with its FULL subcategory list (the
  // section chips are capped at 6; the sheet is the place that shows all of
  // them), busiest group first.
  const categorySheetGroups = useMemo(() => categoryTiles.map((tile) => {
    const counts = new Map<string, SubcategoryChip>();
    approvedBusinesses
      .filter((business) => business.categoryId === tile.category.id)
      .forEach((business) => {
        const name = getBusinessSubcategoryLabel(business, categories);
        if (!name) return;
        const id = String(business.subcategoryId || '').trim();
        const key = id || `label:${name}`;
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { id, name, count: 1 });
      });
    return {
      category: tile.category,
      count: tile.count,
      subcategories: [...counts.values()]
        .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name)),
    };
  }), [approvedBusinesses, categories, categoryTiles]);

  // Offers, paired with the business each one belongs to so a card can name it
  // and link through. The host has already applied date and locality targeting.
  const offerCards = useMemo(() => offers
    .map((offer) => {
      const business = approvedBusinesses.find((entry) => entry.id === (offer.targetBusinessId || offer.businessId));
      return {
        offer,
        business: business || null,
        headline: String(offer.discount || offer.badgeText || 'Offer').trim(),
        title: String(offer.title || offer.description || '').trim(),
      };
    })
    .filter((entry) => entry.headline || entry.title)
    .slice(0, 12), [approvedBusinesses, offers]);

  // Chips and the category sheet both route through here: use the real
  // subcategory route when the caller wired one and the chip carries a taxonomy
  // id, otherwise fall back to the parent category page.
  const openSubcategory = (categoryId: string, subcategoryId: string) => {
    const localityId = activeLocality?.id || activeLocalityId;
    if (onOpenSubcategoryPage && subcategoryId) {
      onOpenSubcategoryPage(categoryId, subcategoryId, localityId);
      return;
    }
    onOpenCategoryPage(categoryId, localityId);
  };

  const mobileSponsoredIndex = mobileSponsoredSlides.length > 0
    ? heroRotationTick % mobileSponsoredSlides.length
    : 0;
  const mobileSponsoredSlide = mobileSponsoredSlides[mobileSponsoredIndex];

  // Distinct subcategories actually present here — shown on the mobile
  // "View all" tile alongside the group count.
  const presentSubcategoryCount = useMemo(() => {
    const seen = new Set<string>();
    approvedBusinesses.forEach((business) => {
      const id = String(business.subcategoryId || '').trim();
      if (id) seen.add(id);
    });
    return seen.size;
  }, [approvedBusinesses]);

  // One row per category group that actually has listings here — not a
  // top-4 slice. buildCategoryTiles already drops empty categories, so this
  // is every group present in this locality, busiest first.
  const sectionGroups = useMemo<SectionGroup[]>(
    () => categoryTiles.map((tile) => ({
      ...tile,
      // Real subcategory names for this category, ordered by how many listings
      // each has, computed across the whole category rather than the first few
      // rows. These drive the per-section chip row on mobile.
      chips: (() => {
        // Keyed by the real subcategory id where the listing has one, so a chip
        // can route straight to a subcategory-filtered result set. Listings with
        // no taxonomy id still get a chip, keyed by their label, which falls
        // back to opening the parent category.
        const counts = new Map<string, SubcategoryChip>();
        approvedBusinesses
          .filter((business) => business.categoryId === tile.category.id)
          .forEach((business) => {
            const name = getBusinessSubcategoryLabel(business, categories);
            if (!name) return;
            const id = String(business.subcategoryId || '').trim();
            const key = id || `label:${name}`;
            const existing = counts.get(key);
            if (existing) existing.count += 1;
            else counts.set(key, { id, name, count: 1 });
          });
        return [...counts.values()]
          .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
          .slice(0, 6);
      })(),
      listings: approvedBusinesses
        .filter((business) => business.categoryId === tile.category.id)
        .slice(0, 4),
    }))
    // Never render an empty row. A tile is counted from a business's own
    // categoryId, so a bucket whose id matches no listing (e.g. anything that
    // landed in a synthetic "uncategorized" group) would otherwise draw a
    // heading with no cards under it.
    .filter((section) => section.listings.length > 0),
    [approvedBusinesses, categories, categoryTiles],
  );

  const quickSearches = useMemo(() => {
    const candidates = approvedBusinesses
      .slice(0, 24)
      .map((business) => business.sourceSubcategoryLabel || getBusinessSearchLabel(business, categories))
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
    return Array.from(new Set(candidates)).slice(0, 5);
  }, [approvedBusinesses, categories]);

  const normalizedQuery = normalizeValue(deferredSearchQuery);

  const matchingBusinesses = useMemo(() => {
    if (!normalizedQuery) return approvedBusinesses.slice(0, 5);
    return approvedBusinesses
      .filter((business) => {
        const haystack = normalizeValue([
          business.name,
          business.description,
          business.address,
          business.sourceCategoryLabel,
          business.sourceSubcategoryLabel,
          getBusinessSearchLabel(business, categories),
          ...(business.tags || []),
        ].filter(Boolean).join(' '));
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 5);
  }, [approvedBusinesses, categories, normalizedQuery]);

  const matchingCategories = useMemo(() => {
    const pool = categoryTiles.filter(({ category, count }) => {
      if (!normalizedQuery) return count > 0;
      const directMatch = normalizeValue(category.name).includes(normalizedQuery);
      const categoryListingMatch = approvedBusinesses.some((business) => (
        business.categoryId === category.id
        && normalizeValue(`${business.name} ${business.description} ${business.sourceSubcategoryLabel || ''}`).includes(normalizedQuery)
      ));
      return directMatch || categoryListingMatch;
    });
    return pool.slice(0, 5);
  }, [approvedBusinesses, categoryTiles, normalizedQuery]);

  const suggestionResultCount = useMemo(() => {
    if (!normalizedQuery) return approvedBusinesses.length;
    return approvedBusinesses.filter((business) => {
      const haystack = normalizeValue([
        business.name,
        business.description,
        business.address,
        business.sourceCategoryLabel,
        business.sourceSubcategoryLabel,
        getBusinessSearchLabel(business, categories),
        ...(business.tags || []),
      ].filter(Boolean).join(' '));
      return haystack.includes(normalizedQuery);
    }).length;
  }, [approvedBusinesses, categories, normalizedQuery]);

  const shouldShowSuggestions = isSearchFocused && (searchQuery.trim().length > 0 || recentSearchTerms.length > 0);

  const submitSearch = (query = searchQuery) => {
    const finalQuery = String(query || '').trim() || getCategoryById(featuredCategoryId)?.name || '';
    if (!finalQuery) return;
    onSearchSubmit(finalQuery);
  };

  const primaryPromo = useMemo<PromoCardContent>(() => {
    if (rotatingPrimaryHeroAd) {
      return {
        image: getMediaProxyUrl(rotatingPrimaryHeroAd.imageUrl || ''),
        badge: rotatingPrimaryHeroAd.badge || 'Sponsored placement',
        title: rotatingPrimaryHeroAd.title,
        subtitle: rotatingPrimaryHeroAd.description,
        cta: rotatingPrimaryHeroAd.ctaText || 'Explore',
        onClick: () => {
          if (onOpenListingAd) {
            onOpenListingAd(rotatingPrimaryHeroAd);
            return;
          }
          onOpenLivePortal();
        },
      };
    }

    if (primaryHeroBanner) {
      return {
        image: getMediaProxyUrl(primaryHeroBanner.imageUrl),
        badge: 'Sponsored placement',
        title: primaryHeroBanner.title,
        subtitle: primaryHeroBanner.subtitle,
        cta: primaryHeroBanner.ctaLabel || 'Explore',
        onClick: () => {
          if (onOpenHeroCta) {
            onOpenHeroCta(primaryHeroBanner);
            return;
          }
          submitSearch(primaryHeroBanner.title);
        },
      };
    }

    return {
      image: getMediaProxyUrl(primaryHeroBusiness?.coverImageUrl || primaryHeroBusiness?.imageUrl || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80'),
      badge: primaryHeroBusiness?.featured ? 'Featured listing' : 'Popular now',
      title: buildPromoTitle(primaryHeroBusiness, localityLabel, `Trusted businesses in ${localityLabel}`),
      subtitle: buildPromoSubtitle(primaryHeroBusiness, categories, localityLabel),
      cta: 'View listing',
      onClick: () => {
        if (primaryHeroBusiness) {
          onOpenListingPage(primaryHeroBusiness.id, primaryHeroBusiness.localityId);
          return;
        }
        submitSearch(searchQuery);
      },
    };
  }, [categories, localityLabel, onOpenHeroCta, onOpenListingAd, onOpenListingPage, onOpenLivePortal, primaryHeroBanner, primaryHeroBusiness, rotatingPrimaryHeroAd, searchQuery]);

  const mobilePrimaryPromo = useMemo<PromoCardContent>(() => {
    if (rotatingMobilePrimaryHeroAd) {
      return {
        image: getMediaProxyUrl(rotatingMobilePrimaryHeroAd.imageUrl || ''),
        badge: rotatingMobilePrimaryHeroAd.badge || 'Sponsored placement',
        title: rotatingMobilePrimaryHeroAd.title,
        subtitle: rotatingMobilePrimaryHeroAd.description,
        cta: rotatingMobilePrimaryHeroAd.ctaText || 'Explore',
        onClick: () => {
          if (onOpenListingAd) {
            onOpenListingAd(rotatingMobilePrimaryHeroAd);
            return;
          }
          onOpenLivePortal();
        },
      };
    }

    return primaryPromo;
  }, [onOpenListingAd, onOpenLivePortal, primaryPromo, rotatingMobilePrimaryHeroAd]);

  const secondaryPromo = useMemo<PromoCardContent>(() => {
    if (rotatingSecondaryHeroAd) {
      return {
        image: getMediaProxyUrl(rotatingSecondaryHeroAd.imageUrl || ''),
        badge: rotatingSecondaryHeroAd.badge || 'Sponsored',
        title: rotatingSecondaryHeroAd.title,
        subtitle: rotatingSecondaryHeroAd.description,
        cta: rotatingSecondaryHeroAd.ctaText || 'Explore',
        onClick: () => {
          if (onOpenListingAd) {
            onOpenListingAd(rotatingSecondaryHeroAd);
            return;
          }
          onOpenLivePortal();
        },
      };
    }

    if (secondaryHeroBanner) {
      return {
        image: getMediaProxyUrl(secondaryHeroBanner.imageUrl),
        badge: 'Sponsored',
        title: secondaryHeroBanner.title,
        subtitle: secondaryHeroBanner.subtitle,
        cta: secondaryHeroBanner.ctaLabel || 'Explore',
        onClick: () => {
          if (onOpenHeroCta) {
            onOpenHeroCta(secondaryHeroBanner);
            return;
          }
          submitSearch(secondaryHeroBanner.title);
        },
      };
    }

    return {
      image: getMediaProxyUrl(secondaryHeroBusiness?.coverImageUrl || secondaryHeroBusiness?.imageUrl || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'),
      badge: secondaryHeroBusiness?.featured ? 'Sponsored' : 'Top rated',
      title: buildPromoTitle(secondaryHeroBusiness, localityLabel, `Recommended picks in ${localityLabel}`),
      subtitle: buildPromoSubtitle(secondaryHeroBusiness, categories, localityLabel),
      cta: secondaryHeroBusiness ? 'See details' : 'Explore',
      onClick: () => {
        if (secondaryHeroBusiness) {
          onOpenListingPage(secondaryHeroBusiness.id, secondaryHeroBusiness.localityId);
          return;
        }
        submitSearch(searchQuery);
      },
    };
  }, [categories, localityLabel, onOpenHeroCta, onOpenListingAd, onOpenListingPage, onOpenLivePortal, rotatingSecondaryHeroAd, secondaryHeroBanner, secondaryHeroBusiness, searchQuery]);

  return (
    <section className="localisy-public-page min-h-screen overflow-x-hidden bg-[#EEF2F7] text-[#0F172A]">
      <div className="mx-auto w-full max-w-[1440px]">
        <DesktopHomeShell
          localityLabel={localityLabel}
          primaryPincode={primaryPincode}
          categories={categories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          submitSearch={submitSearch}
          recentSearchTerms={recentSearchTerms}
          onClearRecentSearches={onClearRecentSearches}
          quickSearches={quickSearches}
          resolvedPincode={resolvedPincode}
          resolvedNodeLabel={resolvedNodeLabel}
          userSession={userSession}
          onOpenPincodeModal={onOpenPincodeModal}
          onRequestAuth={onRequestAuth}
          onLogout={onLogout}
          isAdvertiseActive={isAdvertiseActive}
          isAccountActive={isAccountActive}
          onOpenLivePortal={onOpenLivePortal}
          onOpenPlatform={onOpenPlatform}
          rotatingPrimaryHeroAd={rotatingPrimaryHeroAd}
          rotatingSecondaryHeroAd={rotatingSecondaryHeroAd}
          rotatingPrimaryHeroCount={primaryHeroImageAds.length}
          rotatingPrimaryHeroIndex={primaryHeroImageAds.length > 0 ? heroRotationTick % primaryHeroImageAds.length : 0}
          onOpenListingAd={onOpenListingAd}
          onOpenCityPage={() => onOpenCityPage(activeLocality?.id || activeLocalityId)}
          primaryPromo={primaryPromo}
          secondaryPromo={secondaryPromo}
          shouldShowSuggestions={shouldShowSuggestions}
          onSearchFocus={() => setIsSearchFocused(true)}
          onSearchBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
          matchingCategories={matchingCategories}
          matchingBusinesses={matchingBusinesses}
          suggestionResultCount={suggestionResultCount}
          onOpenCategoryPage={(categoryId) => onOpenCategoryPage(categoryId, activeLocality?.id || activeLocalityId)}
          onOpenListingPage={(businessId, localityId) => onOpenListingPage(businessId, localityId)}
        />

        <MobileHomeShell
          localityLabel={localityLabel}
          categories={categories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          submitSearch={submitSearch}
          recentSearchTerms={recentSearchTerms}
          onClearRecentSearches={onClearRecentSearches}
          quickSearches={quickSearches}
          resolvedPincode={resolvedPincode}
          resolvedNodeLabel={resolvedNodeLabel}
          userSession={userSession}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onOpenPincodeModal={onOpenPincodeModal}
          onRequestAuth={onRequestAuth}
          onLogout={onLogout}
          onOpenLivePortal={onOpenLivePortal}
          onOpenPlatform={onOpenPlatform}
          shouldShowSuggestions={shouldShowSuggestions}
          onSearchFocus={() => setIsSearchFocused(true)}
          onSearchBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
          matchingCategories={matchingCategories}
          matchingBusinesses={matchingBusinesses}
          suggestionResultCount={suggestionResultCount}
          onOpenCategoryPage={(categoryId) => onOpenCategoryPage(categoryId, activeLocality?.id || activeLocalityId)}
          onOpenListingPage={(businessId, localityId) => onOpenListingPage(businessId, localityId)}
        />

        {/* HERO BANNERS — two slots side by side, 70% / 30%, fed by the same
            sources as desktop: Hero 1 from `homepage_hero_primary`, Hero 2 from
            `homepage_hero_secondary`. Booked ad inventory wins; the configured
            hero banner is the fallback, so the row is never empty. */}
        <div className="px-4 pt-4 lg:hidden">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#C46A00]">Sponsored</span>
            <span className="text-[10px] font-semibold text-[#98A2B3]">
              {mobileSponsoredIndex + 1} / {mobileSponsoredSlides.length}
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={mobilePrimaryPromo.onClick}
              className="relative block h-[132px] w-[70%] shrink-0 overflow-hidden rounded-[14px] bg-[#0D1B2A] text-left"
            >
              {mobilePrimaryPromo.image ? (
                <img
                  src={mobilePrimaryPromo.image}
                  alt={mobilePrimaryPromo.title || localityLabel}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,27,42,0.92)_0%,rgba(13,27,42,0.45)_100%)]" />
              <span className="relative z-10 flex h-full flex-col justify-end p-3 text-white">
                {mobilePrimaryPromo.badge ? (
                  <span className="mb-1.5 inline-flex w-fit rounded-[6px] bg-[#F59E0B] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#111827]">
                    {mobilePrimaryPromo.badge}
                  </span>
                ) : null}
                <span className="line-clamp-2 text-[14px] font-extrabold leading-[1.25] tracking-[-0.02em]">
                  {mobilePrimaryPromo.title}
                </span>
                {mobilePrimaryPromo.subtitle ? (
                  <span className="mt-0.5 line-clamp-2 text-[10.5px] leading-[1.3] text-white/80">
                    {mobilePrimaryPromo.subtitle}
                  </span>
                ) : null}
              </span>
            </button>

            <button
              type="button"
              onClick={secondaryPromo.onClick}
              className="relative block h-[132px] w-[30%] shrink-0 overflow-hidden rounded-[14px] bg-[#1E293B] text-left"
            >
              {secondaryPromo.image ? (
                <img
                  src={secondaryPromo.image}
                  alt={secondaryPromo.title || localityLabel}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.25)_0%,rgba(15,23,42,0.9)_100%)]" />
              <span className="relative z-10 flex h-full flex-col justify-end p-2.5 text-white">
                <span className="line-clamp-3 text-[11px] font-bold leading-[1.25]">
                  {secondaryPromo.title}
                </span>
              </span>
            </button>
          </div>

          {mobileSponsoredSlides.length > 1 ? (
            <div className="mt-2 flex justify-center gap-1.5">
              {mobileSponsoredSlides.map((slide, dotIndex) => (
                <span
                  key={`sponsored-dot-${slide.id}`}
                  className={`h-[3px] w-6 rounded-full ${dotIndex === mobileSponsoredIndex ? 'bg-[#F59E0B]' : 'bg-[#E1E6ED]'}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* CATEGORY & SUBCATEGORY SHEET
            "View all" used to jump straight into one category's results, which
            skipped the browse step entirely. It now opens this sheet: every
            group present in this locality, expandable to its subcategories, so
            a visitor can pick either level before landing on results. */}
        {isCategorySheetOpen ? (
          <div className="fixed inset-0 z-[70] lg:flex lg:items-center lg:justify-center lg:p-6" role="dialog" aria-modal="true" aria-label="Browse categories">
            <button
              type="button"
              aria-label="Close categories"
              onClick={() => setIsCategorySheetOpen(false)}
              className="absolute inset-0 bg-[#0D1B2A]/55"
            />
            {/* Bottom sheet on a phone, centred dialog on desktop — the same
                component serves the mobile "View all" tile and the desktop
                "Browse by category → View all" link. */}
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[22px] bg-white shadow-[0_-18px_50px_rgba(15,23,42,0.28)] lg:relative lg:inset-auto lg:max-h-[76vh] lg:w-full lg:max-w-[720px] lg:rounded-[20px] lg:shadow-[0_24px_60px_rgba(15,23,42,0.3)]">
              <div className="flex items-start justify-between gap-3 border-b border-[#EEF2F6] px-4 pb-3 pt-4">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#0D1B2A]">All categories</h2>
                  <p className="mt-0.5 text-[11.5px] font-medium text-[#667085]">
                    {categorySheetGroups.length} groups · {presentSubcategoryCount} subcategories in {localityLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategorySheetOpen(false)}
                  aria-label="Close"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E6EBF2] text-[#475467]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 lg:px-4">
                {categorySheetGroups.map(({ category, count, subcategories }) => {
                  const { Icon, tone } = getCategoryPresentation(category);
                  const isExpanded = expandedSheetCategoryId === category.id;
                  return (
                    <div key={`sheet-${category.id}`} className="border-b border-[#F2F5F9] last:border-b-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategorySheetOpen(false);
                            onOpenCategoryPage(category.id, activeLocality?.id || activeLocalityId);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2.5 py-3 pl-1 pr-2 text-left"
                        >
                          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${tone}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-bold text-[#111827]">{category.name}</span>
                            <span className="block text-[11px] font-medium text-[#98A2B3]">
                              {count} listed · {subcategories.length} subcategories
                            </span>
                          </span>
                        </button>
                        {subcategories.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedSheetCategoryId((current) => current === category.id ? null : category.id)}
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} ${category.name} subcategories`}
                            aria-expanded={isExpanded}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E6EBF2] text-[#475467]"
                          >
                            <ChevronDown className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        ) : null}
                      </div>

                      {isExpanded && subcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pb-3 pl-[42px] pr-1">
                          {subcategories.map((subcategory) => (
                            <button
                              key={`sheet-${category.id}-${subcategory.id || subcategory.name}`}
                              type="button"
                              onClick={() => {
                                setIsCategorySheetOpen(false);
                                openSubcategory(category.id, subcategory.id);
                              }}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#E6EBF2] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#475467] active:bg-slate-50"
                            >
                              <span className="truncate">{subcategory.name}</span>
                              <span className="shrink-0 text-[10px] font-bold text-[#98A2B3]">{subcategory.count}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* MOBILE DIRECTORY CONTENT
            Everything below the hero used to be desktop-only (`hidden lg:block`),
            so on a phone the page ended after the search pills — no category
            browse, no rows, no listings at all. This follows the agreed mobile
            structure: a 3-up Categories grid with a "View all" tile, then one
            section per category with a scrollable subcategory chip row and a
            2-up card grid, and a banner after every 3rd section. Cards stay
            text-only (no photo, no rating) to match the rest of the product.
            Bottom padding clears the fixed mobile tab bar. */}
        <div className="px-4 pb-32 lg:hidden">
          <section className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-[#0D1B2A]">Categories</h2>
              <button
                type="button"
                onClick={() => setIsCategorySheetOpen(true)}
                className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#C46A00]"
              >
                All {visibleCategoryTiles.length} groups
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {visibleCategoryTiles.slice(0, 8).map(({ category, count }) => {
                const { Icon, tone } = getCategoryPresentation(category);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onOpenCategoryPage(category.id, activeLocality?.id || activeLocalityId)}
                    className="flex min-h-[92px] flex-col rounded-[14px] border border-[#E6EBF2] bg-white px-2.5 py-2.5 text-left transition active:bg-slate-50"
                  >
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-[10px] ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="mt-2 line-clamp-2 text-[11.5px] font-bold leading-[1.25] text-[#111827]">
                      {category.name}
                    </span>
                    <span className="mt-auto pt-1 text-[10px] font-medium text-[#98A2B3]">{count} listed</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCategorySheetOpen(true)}
                aria-haspopup="dialog"
                className="flex min-h-[92px] items-center justify-between gap-1 rounded-[14px] bg-[#0D1B2A] px-2.5 py-2.5 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-extrabold text-[#F59E0B]">View all</span>
                  <span className="mt-1 block text-[10px] font-medium leading-[1.3] text-white/70">
                    {visibleCategoryTiles.length} groups · {presentSubcategoryCount} subs
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/70" />
              </button>
            </div>
          </section>

          <OfferStrip
            offerCards={offerCards}
            localityLabel={localityLabel}
            onOpenListingPage={onOpenListingPage}
            compact
          />

          <div className="mt-5 space-y-5">
            {sectionGroups.map((section, index) => {
              const isBannerSlot = (index + 1) % 3 === 0 && index !== sectionGroups.length - 1;
              const bannerAd = interCategoryAds.length > 0
                ? interCategoryAds[Math.floor(index / 3) % interCategoryAds.length]
                : null;
              return (
                <React.Fragment key={`m-${section.category.id}`}>
                  <section>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="truncate text-[16px] font-extrabold tracking-[-0.02em] text-[#0D1B2A]">
                        {section.category.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onOpenCategoryPage(section.category.id, activeLocality?.id || activeLocalityId)}
                        className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#C46A00]"
                      >
                        All {section.count}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Subcategory chips: no sideways scrollbar. Two fit inline
                        and the rest live behind the chevron dropdown. */}
                    {section.chips.length > 0 ? (
                      <div className="relative mt-2.5 flex items-center gap-2">
                        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                          {section.chips.slice(0, 2).map((chip, chipIndex) => (
                            <button
                              key={`${section.category.id}-${chip.id || chip.name}`}
                              type="button"
                              onClick={() => openSubcategory(section.category.id, chip.id)}
                              className={`inline-flex max-w-full truncate rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                                chipIndex === 0
                                  ? 'bg-[#F59E0B] text-[#111827]'
                                  : 'border border-[#E6EBF2] bg-white text-[#475467]'
                              }`}
                            >
                              {chip.name}
                            </button>
                          ))}
                        </div>
                        {section.chips.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => setOpenChipMenuId((current) => current === section.category.id ? null : section.category.id)}
                            aria-label={`See all ${section.category.name} subcategories`}
                            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-[#E6EBF2] bg-white px-2.5 text-[11.5px] font-semibold text-[#475467]"
                          >
                            +{section.chips.length - 2}
                            <ChevronDown className={`h-3.5 w-3.5 transition ${openChipMenuId === section.category.id ? 'rotate-180' : ''}`} />
                          </button>
                        ) : null}
                        {openChipMenuId === section.category.id ? (
                          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[220px] overflow-y-auto rounded-[14px] border border-[#E2E8F0] bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                            {section.chips.slice(2).map((chip) => (
                              <button
                                key={`${section.category.id}-menu-${chip.id || chip.name}`}
                                type="button"
                                onClick={() => {
                                  setOpenChipMenuId(null);
                                  openSubcategory(section.category.id, chip.id);
                                }}
                                className="flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[12px] font-medium text-[#475467] hover:bg-slate-50"
                              >
                                <span className="truncate">{chip.name}</span>
                                <span className="shrink-0 text-[10px] text-[#98A2B3]">{chip.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      {section.listings.slice(0, 4).map((business) => (
                        <MobileListingCard
                          key={business.id}
                          business={business}
                          onOpenListingPage={onOpenListingPage}
                          onShowNumber={onShowNumber}
                          isPhoneRevealed={revealedPhoneBusinessIds.includes(business.id)}
                        />
                      ))}
                    </div>
                  </section>

                  {isBannerSlot && bannerAd ? (
                    <InFeedAdStrip
                      listingAd={bannerAd}
                      onOpenListingAd={onOpenListingAd}
                      onOpenLivePortal={onOpenLivePortal}
                      imageOnly
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="hidden pb-14 lg:block">
          {/* Full-bleed band matching the hero section's shell exactly
              (px-8 py-7 with an inner max-w-[1280px]) instead of a centred
              rounded card, so the two sections line up. Square corners, no
              border or shadow, light orange ground. */}
          <section className="bg-[#FFF3E6] px-8 py-7">
            <div className="mx-auto max-w-[1280px]">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">Browse by category</h2>
                  <p className="mt-1 text-xs text-[#8A6A45]">
                    {visibleCategoryTiles.length} active {visibleCategoryTiles.length === 1 ? 'group' : 'groups'} in this locality.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenCategoryPage(featuredCategoryId, activeLocality?.id || activeLocalityId)}
                    className="rounded-full border border-[#E8CFAE] bg-white/70 px-4 py-2 text-sm font-semibold text-[#8A6A45] transition hover:border-[#C46A00] hover:text-[#C46A00]"
                  >
                    A-Z index
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCategorySheetOpen(true)}
                    aria-haspopup="dialog"
                    className="text-sm font-semibold text-[#C46A00]"
                  >
                    View all {'->'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {visibleCategoryTiles.map(({ category, count }) => (
                  <CategoryChip
                    key={category.id}
                    category={category}
                    count={count}
                    onClick={(categoryId) => onOpenCategoryPage(categoryId, activeLocality?.id || activeLocalityId)}
                  />
                ))}
              </div>
            </div>
          </section>

          {stripBannerAd ? (
            <div className="mt-6">
              <InFeedAdStrip
                listingAd={stripBannerAd}
                onOpenListingAd={onOpenListingAd}
                onOpenLivePortal={onOpenLivePortal}
                imageOnly
              />
            </div>
          ) : null}

          <OfferStrip
            offerCards={offerCards}
            localityLabel={localityLabel}
            onOpenListingPage={onOpenListingPage}
          />

          <div className="mt-6 space-y-6">
            {sectionGroups.map((section, index) => {
              // A banner slots in after every 3rd category row (never trailing
              // after the last one). Ads rotate through whatever inventory is
              // booked for the between-categories strip placement.
              const isBannerSlot = (index + 1) % 3 === 0 && index !== sectionGroups.length - 1;
              const bannerAd = interCategoryAds.length > 0
                ? interCategoryAds[Math.floor(index / 3) % interCategoryAds.length]
                : null;
              return (
                <React.Fragment key={section.category.id}>
                  <DirectorySectionPanel
                    categories={categories}
                    section={section}
                    onOpenCategoryPage={() => onOpenCategoryPage(section.category.id, activeLocality?.id || activeLocalityId)}
                    onOpenListingPage={onOpenListingPage}
                    onShowNumber={onShowNumber}
                    revealedPhoneBusinessIds={revealedPhoneBusinessIds}
                  />
                  {isBannerSlot && bannerAd ? (
                    <InFeedAdStrip
                      listingAd={bannerAd}
                      onOpenListingAd={onOpenListingAd}
                      onOpenLivePortal={onOpenLivePortal}
                      imageOnly
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>

          <footer className="mt-8 bg-[#111827] px-10 py-10 text-white">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-8">
              <div>
                <div className="text-[1.8rem] font-extrabold tracking-[-0.04em]">
                  LOCALISY <span className="text-[0.95rem] uppercase tracking-[0.18em] text-[#F59E0B]">{localityLabel}</span>
                </div>
                <p className="mt-4 max-w-[320px] text-sm leading-6 text-[#98A2B3]">
                  Discover trusted businesses in {localityLabel}. Contact visibility follows verified access rules.
                </p>
              </div>
              <FooterColumn title="Explore" items={['Categories', 'Sectors', 'Offers']} />
              <FooterColumn title="For business" items={['Claim a listing', 'Advertise', 'Lead reports']} />
              <FooterColumn title="About locality" items={[`${approvedBusinesses.length} active listings`, `${visibleCategoryTiles.length} top categories`, `${primaryPincode} priority pincode`]} />
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-[#7C8799]">
              <div>Copyright 2026 Localisy | {localityLabel} {primaryPincode}</div>
              <div>Privacy | Terms | Report a listing</div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}

function DesktopHomeShell({
  localityLabel,
  primaryPincode,
  categories,
  searchQuery,
  setSearchQuery,
  submitSearch,
  recentSearchTerms,
  onClearRecentSearches,
  quickSearches,
  resolvedPincode,
  resolvedNodeLabel,
  userSession,
  onOpenPincodeModal,
  onRequestAuth,
  onLogout,
  isAdvertiseActive,
  isAccountActive,
  onOpenLivePortal,
  onOpenPlatform,
  rotatingPrimaryHeroAd,
  rotatingSecondaryHeroAd,
  rotatingPrimaryHeroCount,
  rotatingPrimaryHeroIndex,
  onOpenListingAd,
  onOpenCityPage,
  primaryPromo,
  secondaryPromo,
  shouldShowSuggestions,
  onSearchFocus,
  onSearchBlur,
  matchingCategories,
  matchingBusinesses,
  suggestionResultCount,
  onOpenCategoryPage,
  onOpenListingPage,
}: {
  localityLabel: string;
  primaryPincode: string;
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  submitSearch: (query?: string) => void;
  recentSearchTerms: string[];
  onClearRecentSearches: () => void;
  quickSearches: string[];
  resolvedPincode: string;
  resolvedNodeLabel: string;
  userSession?: UserSession;
  onOpenPincodeModal?: () => void;
  onRequestAuth?: () => void;
  onLogout?: () => void;
  isAdvertiseActive: boolean;
  isAccountActive: boolean;
  onOpenLivePortal: () => void;
  onOpenPlatform?: () => void;
  rotatingPrimaryHeroAd: ListingAd | null;
  rotatingSecondaryHeroAd: ListingAd | null;
  rotatingPrimaryHeroCount: number;
  rotatingPrimaryHeroIndex: number;
  onOpenListingAd?: (ad: ListingAd) => void;
  onOpenCityPage: () => void;
  primaryPromo: PromoCardContent;
  secondaryPromo: PromoCardContent;
  shouldShowSuggestions: boolean;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  matchingCategories: CategoryTile[];
  matchingBusinesses: Business[];
  suggestionResultCount: number;
  onOpenCategoryPage: (categoryId: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
}) {
  const isAuthenticated = Boolean(userSession?.isAuthenticated && userSession?.userPhone);

  return (
    <div className="hidden lg:block">
      <header className="border-b border-slate-200 bg-white px-8 py-3.5 shadow-[0_2px_4px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex max-w-[1280px] items-center gap-5">
          <button
            type="button"
            onClick={onOpenCityPage}
            className="flex flex-shrink-0 items-center gap-2.5"
            title="Localisy"
          >
            <img src={happyBusinessLogo} alt="Localisy" className="h-9 w-auto object-contain" />
          </button>

          <button
            type="button"
            onClick={onOpenPincodeModal || onOpenCityPage}
            className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-[#FFF5F9] px-3.5 py-2 text-[13px] font-medium text-[#0D1B2A] transition hover:border-[#3B82F6] lg:inline-flex"
          >
            <MapPin className="h-3.5 w-3.5 text-[#64748B]" />
            <span>{localityLabel} | {resolvedPincode}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <div className="relative min-w-0 max-w-[520px] flex-1">
            <div className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4">
              <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder="Search businesses, services, categories..."
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0D1B2A] outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => submitSearch()}
                className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0D1B2A] text-[#FFD54F] transition hover:bg-[#132845]"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>

            {shouldShowSuggestions ? (
              <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                <SearchSuggestionsPanel
                  searchQuery={searchQuery}
                  recentSearchTerms={recentSearchTerms}
                  matchingCategories={matchingCategories}
                  matchingBusinesses={matchingBusinesses}
                  categories={categories}
                  suggestionResultCount={suggestionResultCount}
                  onOpenCategoryPage={onOpenCategoryPage}
                  onOpenListingPage={onOpenListingPage}
                  onClearRecent={onClearRecentSearches}
                  onSubmitSearch={submitSearch}
                />
              </div>
            ) : null}
          </div>

          <div className="ml-auto flex flex-shrink-0 items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => onOpenPlatform?.()}
                className="hidden text-sm font-semibold text-[#0D1B2A] transition hover:text-[#1E3A8A] md:inline-flex"
              >
                Platform
              </button>
            ) : null}

            <button
              type="button"
              onClick={onOpenLivePortal}
              className={`hidden rounded-[10px] border border-[#FFD54F] px-3.5 py-2.5 text-sm font-semibold text-[#0D1B2A] transition md:inline-flex ${isAdvertiseActive ? 'bg-[#FFF1BF]' : 'bg-[#FFF7DB] hover:bg-[#FFF1BF]'}`}
            >
              List Your Business
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <span className="hidden text-sm font-semibold text-[#0D1B2A] md:inline">{userSession?.userName?.split(' ')[0] || 'Account'}</span>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Log out"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#64748B] transition hover:border-slate-300 hover:text-[#0D1B2A]"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onRequestAuth}
                className={`rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition ${isAccountActive ? 'bg-[#0D1B2A] text-white' : 'text-[#0D1B2A] hover:bg-slate-100'}`}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white px-8 py-7">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-stretch gap-4">
            <div className="relative min-h-[360px] flex-[3.8] overflow-hidden rounded-[24px] shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
              {rotatingPrimaryHeroAd ? (
                <ImageAdPromoCard listingAd={rotatingPrimaryHeroAd} onOpenListingAd={onOpenListingAd} onOpenLivePortal={onOpenLivePortal} />
              ) : (
                <PromoCard
                  image={primaryPromo.image}
                  badge={primaryPromo.badge}
                  title={primaryPromo.title}
                  subtitle={primaryPromo.subtitle}
                  cta={primaryPromo.cta}
                  onClick={primaryPromo.onClick}
                />
              )}
              <div className="absolute bottom-5 left-8 z-10 flex gap-2">
                {Array.from({ length: Math.max(rotatingPrimaryHeroCount || 0, 1) }).map((_, index) => (
                  <span
                    key={`hero-dot-${index}`}
                    className={`h-2 w-2 rounded-full ${index === rotatingPrimaryHeroIndex ? 'bg-[#FFD54F]' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </div>

            <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              {rotatingSecondaryHeroAd ? (
                <ImageAdPromoCard listingAd={rotatingSecondaryHeroAd} compact onOpenListingAd={onOpenListingAd} onOpenLivePortal={onOpenLivePortal} />
              ) : (
                <PromoCard
                  image={secondaryPromo.image}
                  badge={secondaryPromo.badge}
                  title={secondaryPromo.title}
                  subtitle={secondaryPromo.subtitle}
                  cta={secondaryPromo.cta}
                  compact
                  onClick={secondaryPromo.onClick}
                />
              )}
            </div>
          </div>

          {quickSearches.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#64748B]">Popular:</span>
              {quickSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => submitSearch(term)}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0D1B2A] transition hover:border-[#3B82F6] hover:text-[#1E3A8A]"
                >
                  {term}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ImageAdPromoCard({
  listingAd,
  compact = false,
  onOpenListingAd,
  onOpenLivePortal,
}: {
  listingAd: ListingAd;
  compact?: boolean;
  onOpenListingAd?: (ad: ListingAd) => void;
  onOpenLivePortal: () => void;
}) {
  const adImage = getMediaProxyUrl(listingAd.imageUrl || '');

  return (
    <button
      type="button"
      onClick={() => onOpenListingAd ? onOpenListingAd(listingAd) : onOpenLivePortal()}
      className="relative block h-full w-full min-h-[360px] text-left"
    >
      <img src={adImage} alt={listingAd.title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute left-4 top-4 z-10 inline-flex rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0D1B2A]">
        {listingAd.badge || 'Sponsored'}
      </div>
    </button>
  );
}

function MobileHomeShell({
  localityLabel,
  categories,
  searchQuery,
  setSearchQuery,
  submitSearch,
  recentSearchTerms,
  onClearRecentSearches,
  quickSearches,
  resolvedPincode,
  resolvedNodeLabel,
  userSession,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenPincodeModal,
  onRequestAuth,
  onLogout,
  onOpenLivePortal,
  onOpenPlatform,
  shouldShowSuggestions,
  onSearchFocus,
  onSearchBlur,
  matchingCategories,
  matchingBusinesses,
  suggestionResultCount,
  onOpenCategoryPage,
  onOpenListingPage,
}: {
  localityLabel: string;
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  submitSearch: (query?: string) => void;
  recentSearchTerms: string[];
  onClearRecentSearches: () => void;
  quickSearches: string[];
  resolvedPincode: string;
  resolvedNodeLabel: string;
  userSession?: UserSession;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
  onOpenPincodeModal?: () => void;
  onRequestAuth?: () => void;
  onLogout?: () => void;
  onOpenLivePortal: () => void;
  onOpenPlatform?: () => void;
  shouldShowSuggestions: boolean;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  matchingCategories: CategoryTile[];
  matchingBusinesses: Business[];
  suggestionResultCount: number;
  onOpenCategoryPage: (categoryId: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
}) {
  const isAuthenticated = Boolean(userSession?.isAuthenticated && userSession?.userPhone);
  const [isQuickSearchMenuOpen, setIsQuickSearchMenuOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Full-bleed dark bar: identity and location only. It used to be a
          rounded floating card that also swallowed the headline, the search
          box and a large hero image; the design puts only the logo/node row
          on the dark ground and everything else on the white page below. */}
      <header className="bg-[#0D1B2A] px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 text-[1.2rem] font-extrabold tracking-[-0.04em]">
              L<span className="text-[#F59E0B]">O</span>CALISY
            </div>
            <button type="button" onClick={onOpenPincodeModal} className="min-w-0 text-left">
              <span className="block text-[9px] font-medium uppercase tracking-[0.08em] text-white/50">Node</span>
              <span className="block truncate text-[12px] font-bold text-white">
                {resolvedNodeLabel} - {resolvedPincode}
              </span>
            </button>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/15 bg-white/5"
            >
              <Menu className="h-4 w-4" />
            </button>
            {isMobileMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 rounded-[18px] border border-slate-200 bg-white p-2 text-[#111827] shadow-[0_20px_50px_rgba(15,23,42,0.28)]">
                <button type="button" onClick={onOpenPincodeModal} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  Change pincode
                </button>
                {isAuthenticated ? (
                  <button type="button" onClick={() => onOpenPlatform?.()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">
                    <Grid2x2 className="h-4 w-4 text-[#F59E0B]" />
                    Platform
                  </button>
                ) : null}
                <button type="button" onClick={onOpenLivePortal} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">
                  <ArrowRight className="h-4 w-4 text-[#F59E0B]" />
                  Advertise business
                </button>
                {isAuthenticated ? (
                  <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                ) : (
                  <button type="button" onClick={onRequestAuth} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-indigo-50">
                    <User className="h-4 w-4 text-indigo-600" />
                    Sign in
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Headline, search and quick chips sit on the white page ground. */}
      <div className="px-4 pt-4">
        <h1 className="text-[1.55rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0D1B2A]">
          Every trusted business in <span className="text-[#F59E0B]">{localityLabel}.</span>
        </h1>

        <div className="relative mt-3">
          <div className="flex items-center rounded-[12px] border border-[#E2E8F0] bg-white py-1.5 pl-3 pr-1.5 text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Search className="h-4 w-4 shrink-0 text-[#98A2B3]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitSearch();
                }
              }}
              placeholder="Search businesses, categories, services..."
              className="min-w-0 flex-1 border-0 bg-transparent px-2.5 text-[13px] outline-none"
            />
            <button
              type="button"
              onClick={() => submitSearch()}
              className="shrink-0 rounded-[9px] bg-[#F59E0B] px-4 py-2 text-[13px] font-bold text-white"
            >
              Search
            </button>
          </div>

          {shouldShowSuggestions ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
              <SearchSuggestionsPanel
                searchQuery={searchQuery}
                recentSearchTerms={recentSearchTerms}
                matchingCategories={matchingCategories}
                matchingBusinesses={matchingBusinesses}
                categories={categories}
                suggestionResultCount={suggestionResultCount}
                onOpenCategoryPage={onOpenCategoryPage}
                onOpenListingPage={onOpenListingPage}
                onClearRecent={onClearRecentSearches}
                onSubmitSearch={submitSearch}
                compact
              />
            </div>
          ) : null}
        </div>

        {/* Quick searches never scroll sideways: the first few sit inline and
            anything that would run off the page goes into a "+N" dropdown. */}
        {quickSearches.length > 0 ? (
          <div className="relative mt-2.5 flex flex-wrap items-center gap-2">
            {quickSearches.slice(0, 3).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => submitSearch(term)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E6EBF2] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[#475467]"
              >
                <Search className="h-3 w-3 text-[#98A2B3]" />
                {term}
              </button>
            ))}

            {quickSearches.length > 3 ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsQuickSearchMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#E6EBF2] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#475467]"
                >
                  +{quickSearches.length - 3}
                  <ChevronDown className={`h-3 w-3 transition ${isQuickSearchMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isQuickSearchMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[220px] overflow-y-auto rounded-[14px] border border-[#E2E8F0] bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                    {quickSearches.slice(3).map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setIsQuickSearchMenuOpen(false);
                          submitSearch(term);
                        }}
                        className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[12px] font-medium text-[#475467] hover:bg-slate-50"
                      >
                        <Search className="h-3 w-3 shrink-0 text-[#98A2B3]" />
                        {term}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OfferStrip({
  offerCards,
  localityLabel,
  onOpenListingPage,
  compact = false,
}: {
  offerCards: Array<{ offer: MarketingCoupon; business: Business | null; headline: string; title: string }>;
  localityLabel: string;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  compact?: boolean;
}) {
  if (offerCards.length === 0) return null;
  return (
    <section className={compact ? 'mt-5' : 'mt-6'}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={`font-extrabold tracking-[-0.02em] text-[#0D1B2A] ${compact ? 'text-[19px]' : 'text-[18px]'}`}>
          Offers in {localityLabel}
        </h2>
        <span className="shrink-0 text-[12px] font-semibold text-[#98A2B3]">
          {offerCards.length} live
        </span>
      </div>
      <div className={`no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1 ${compact ? '' : 'flex-wrap overflow-visible'}`}>
        {offerCards.map(({ offer, business, headline, title }) => {
          const Wrapper = business ? 'button' : 'div';
          return (
            <Wrapper
              key={offer.id}
              {...(business
                ? { type: 'button' as const, onClick: () => onOpenListingPage(business.id, business.localityId) }
                : {})}
              className={`flex ${compact ? 'min-w-[212px] shrink-0' : 'min-w-[236px]'} flex-col rounded-[14px] border border-[#FFD9A8] bg-[#FFF6EA] px-3 py-3 text-left`}
            >
              <span className="inline-flex w-fit rounded-md bg-[#F59E0B] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#111827]">
                {headline || 'Offer'}
              </span>
              {title ? (
                <span className="mt-2 line-clamp-2 text-[12.5px] font-bold leading-[1.3] text-[#111827]">{title}</span>
              ) : null}
              {business ? (
                <span className="mt-1 line-clamp-1 text-[11px] font-medium text-[#8A6A45]">{business.name}</span>
              ) : null}
              <span className="mt-2 flex items-center gap-2 text-[10.5px] font-semibold text-[#98734A]">
                {offer.code ? <span className="rounded border border-[#E8CFAE] bg-white px-1.5 py-0.5 font-mono">{offer.code}</span> : null}
                {offer.expiryDate ? <span>till {offer.expiryDate}</span> : null}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}

function PromoCard({
  image,
  badge,
  title,
  subtitle,
  cta,
  compact = false,
  onClick,
}: {
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block h-full w-full min-h-[360px] text-left text-white"
    >
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(13,27,42,0.78),rgba(13,27,42,0.34))]" />
      {compact ? (
        <div className="relative z-10 flex h-full flex-col justify-between px-6 py-6">
          <span className="inline-flex w-fit rounded-full bg-white/22 px-2.5 py-1 text-[11px] font-semibold text-white">{badge}</span>
          <div>
            <div className="mb-2 text-[18px] font-semibold leading-[1.3] text-white">{title}</div>
            <div className="text-[13px] leading-[18px] text-white/85">{subtitle}</div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex h-full flex-col justify-center px-10 py-10">
          <div className="max-w-[520px]">
            <span className="inline-flex rounded-full bg-white/16 px-3 py-1.5 text-xs font-semibold text-[#FFD54F]">{badge}</span>
            <div className="mt-4 text-[38px] font-bold leading-[1.12] tracking-[-0.01em] text-white">{title}</div>
            <div className="mt-3 max-w-[440px] text-base leading-6 text-white/82">{subtitle}</div>
            <span className="mt-6 inline-flex rounded-xl bg-[#FFD54F] px-6 py-3.5 text-[15px] font-semibold text-[#0D1B2A]">{cta}</span>
          </div>
        </div>
      )}
    </button>
  );
}

function DirectorySectionPanel({
  categories,
  section,
  onOpenCategoryPage,
  onOpenListingPage,
  onShowNumber,
  revealedPhoneBusinessIds = [],
}: {
  categories: Category[];
  section: SectionGroup;
  onOpenCategoryPage: () => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  onShowNumber?: (businessId: string, event: React.MouseEvent) => void;
  revealedPhoneBusinessIds?: string[];
}) {
  return (
    <section className="bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      {/* The section heading is deliberately styled unlike a listing name:
          larger, uppercase, letter-spaced and sitting on an accent-coloured
          rule, so a category row never reads as just another card title. */}
      <div className="mb-4 flex items-center justify-between border-b-2 pb-2.5" style={{ borderColor: `${section.accent}55` }}>
        <div className="flex items-center gap-3">
          <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: section.accent }} />
          <h3 className="text-[0.95rem] font-black uppercase tracking-[0.14em] text-[#0D1B2A]">{section.category.name}</h3>
          <div className="flex gap-2">
            {section.chips.map((chip) => (
              <span key={`${section.category.id}-${chip.id || chip.name}`} className="rounded-full bg-[#F2F4F7] px-3 py-1 text-[11px] font-semibold text-[#667085]">
                {chip.name}
              </span>
            ))}
          </div>
        </div>
        <button type="button" onClick={onOpenCategoryPage} className="text-sm font-semibold text-[#C46A00]">
          All {section.count} businesses {'->'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {section.listings.map((business) => (
          <DirectoryListingCard
            key={business.id}
            business={business}
            categoryLabel={getBusinessSubcategoryLabel(business, categories)}
            onOpenListingPage={onOpenListingPage}
            onShowNumber={onShowNumber}
            isPhoneRevealed={revealedPhoneBusinessIds.includes(business.id)}
          />
        ))}
      </div>
    </section>
  );
}

// Phone-scale listing card, following the agreed mobile structure:
// "<AREA> · VERIFIED" eyebrow, name, an open-till line, then the action.
// Deliberately no photo block and no star rating — the mockup showed both, but
// they stay hidden here to match the rest of the product.
// The card eyebrow wants the sector/area, not the first line of the address
// (which is usually a shop or plot number). Prefer the geography area this
// listing is filed under, then any "Sector N" found in the address, and only
// then fall back to the first address segment.
const getBusinessSectorLabel = (business: Business) => {
  const areaName = getAreaById(business.areaId || '')?.name || '';
  const areaSegment = areaName.split(',')[0]?.trim();
  if (areaSegment) return areaSegment;
  const sectorMatch = String(business.address || '').match(/sector\s*[-\s]?\s*[0-9]+[A-Za-z]?/i);
  if (sectorMatch) return sectorMatch[0].replace(/\s+/g, ' ').trim();
  return getBusinessLocationLabel(business);
};

// Home cards show a trimmed address (first 30 characters) followed by the area
// name, so a long imported address never pushes the card out of shape.
const getShortAddressLabel = (business: Business) => {
  const address = String(business.address || '').trim();
  const area = getBusinessSectorLabel(business);
  if (!address) return area;
  const head = address.length > 30 ? `${address.slice(0, 30).trimEnd()}...` : address;
  if (!area) return head;
  return head.toLowerCase().includes(area.toLowerCase()) ? head : `${head} · ${area}`;
};

const getOpenTillLabel = (business: Business) => {
  const hours = String(business.hours || '').trim();
  if (!hours) return '';
  const closing = hours.includes('-') ? hours.split('-').pop() : '';
  const trimmed = String(closing || '').trim();
  return trimmed ? `Open till ${trimmed}` : '';
};

function MobileListingCard({
  business,
  onOpenListingPage,
  onShowNumber,
  isPhoneRevealed = false,
}: {
  business: Business;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  onShowNumber?: (businessId: string, event: React.MouseEvent) => void;
  isPhoneRevealed?: boolean;
}) {
  const areaLabel = getBusinessSectorLabel(business);
  const shortAddress = getShortAddressLabel(business);
  const isVerified = Boolean(business.verifiedBadge);
  const photoUrl = business.coverImageUrl || business.imageUrl || '';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[#E6EBF2] bg-white">
      {/* The photo block only renders when there IS a photo. Almost no imported
          listing has one, and a grid of empty "no photo" tiles made the page
          look broken — a card with no image simply collapses to text, and the
          badges that would sit on the image move inline instead. */}
      {photoUrl ? (
        <button
          type="button"
          onClick={() => onOpenListingPage(business.id, business.localityId)}
          className="block text-left"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EEF2F7]">
            <img
              src={getMediaProxyUrl(photoUrl)}
              alt={business.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {isVerified ? (
              <span className="absolute right-2 top-2 rounded-[6px] bg-[#DCFCE7] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.08em] text-[#15803D]">
                Verified
              </span>
            ) : null}
            {business.featured ? (
              <span className="absolute left-2 top-2 rounded-[6px] bg-[#F59E0B] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.08em] text-[#111827]">
                Sponsored
              </span>
            ) : null}
          </div>
        </button>
      ) : null}

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        {!photoUrl && (isVerified || business.featured) ? (
          <div className="mb-1 flex flex-wrap items-center gap-1">
            {business.featured ? (
              <span className="rounded-[6px] bg-[#F59E0B] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.08em] text-[#111827]">
                Sponsored
              </span>
            ) : null}
            {isVerified ? (
              <span className="rounded-[6px] bg-[#DCFCE7] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.08em] text-[#15803D]">
                Verified
              </span>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenListingPage(business.id, business.localityId)}
          className="block flex-1 text-left"
        >
          <div className="truncate text-[9.5px] font-bold uppercase tracking-[0.08em] text-[#C46A00]">
            {[areaLabel, isVerified ? 'Verified' : ''].filter(Boolean).join(' · ')}
          </div>
          <div className="mt-1 line-clamp-2 text-[13px] font-bold leading-[1.3] text-[#111827]">
            {business.name}
          </div>
          {/* Rating and opening time intentionally not shown on home-page cards. */}
          {shortAddress ? (
            <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#667085]">{shortAddress}</div>
          ) : null}
        </button>
        {/* Reveals the number in place (the host opens its unlock modal) —
            it must not navigate to the listing page. */}
        {business.phone ? (
          isPhoneRevealed ? (
            <a
              href={`tel:${business.phone}`}
              onClick={(event) => event.stopPropagation()}
              className="show-number-action mt-2 block w-full rounded-[8px] border border-[#C3D5CD] bg-[#DEE9E4] px-3 py-2 text-center text-[12px] font-semibold text-[#2F4A41]"
            >
              {business.phone}
            </a>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (onShowNumber) onShowNumber(business.id, event);
                else onOpenListingPage(business.id, business.localityId);
              }}
              className="show-number-action mt-2 w-full rounded-[8px] border border-[#C3D5CD] bg-[#DEE9E4] px-3 py-2 text-[12px] font-semibold text-[#2F4A41]"
            >
              Show number
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}

function DirectoryListingCard({
  business,
  categoryLabel,
  onOpenListingPage,
  onShowNumber,
  isPhoneRevealed = false,
}: {
  business: Business;
  categoryLabel: string;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  onShowNumber?: (businessId: string, event: React.MouseEvent) => void;
  isPhoneRevealed?: boolean;
}) {
  const badgeLabel = business.featured ? 'Sponsored' : (!business.phone ? 'Unclaimed' : business.verifiedBadge ? 'Verified' : '');

  // Homepage cards are text-only: the photo block is deliberately not
  // rendered here. The badge and rating that used to sit on top of the
  // image move inline above the name so nothing is lost.
  return (
    <article className="overflow-hidden rounded-[18px] border border-[#E6EBF2] bg-white">
      <div className="px-3 pb-3 pt-3">
        {/* Subcategory eyebrow. Rating badge intentionally not rendered. */}
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C46A00]">{categoryLabel}</div>
        {badgeLabel ? (
          <span className={`mt-2 inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${business.featured ? 'bg-[#FBBF24] text-[#111827]' : 'bg-[#F2F4F7] text-[#667085]'}`}>
            {badgeLabel}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenListingPage(business.id, business.localityId)}
          className="block w-full text-left"
        >
          {/* Listing name: sentence case, semibold, tighter — clearly a card
              title rather than a section heading. */}
          <div className="mt-2 text-[0.95rem] font-semibold leading-5 tracking-[-0.01em] text-[#1F2937]">{business.name}</div>
        </button>
        {/* The "<shop> | N ratings" line is gone — the address below carries the
            location, and ratings are no longer surfaced. */}
        {business.address ? (
          <div className="mt-1 line-clamp-2 text-[12px] leading-4 text-[#667085]" title={business.address}>
            {business.address}
          </div>
        ) : null}
        {/* No "Send enquiry" fallback: only a listing with a phone gets a
            button, and it reveals the number here rather than navigating. */}
        {business.phone ? (
          isPhoneRevealed ? (
            <a
              href={`tel:${business.phone}`}
              onClick={(event) => event.stopPropagation()}
              className="show-number-action mt-3 block w-full rounded-[12px] border border-[#C3D5CD] bg-[#DEE9E4] px-3 py-3 text-center text-sm font-semibold text-[#2F4A41] transition hover:bg-[#D2E1DB]"
            >
              {business.phone}
            </a>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (onShowNumber) onShowNumber(business.id, event);
                else onOpenListingPage(business.id, business.localityId);
              }}
              className="show-number-action mt-3 w-full rounded-[12px] border border-[#C3D5CD] bg-[#DEE9E4] px-3 py-3 text-sm font-semibold text-[#2F4A41] transition hover:bg-[#D2E1DB]"
            >
              Show number
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}

function InFeedAdStrip({
  listingAd,
  onOpenListingAd,
  onOpenLivePortal,
  imageOnly = false,
}: {
  listingAd: ListingAd | null;
  onOpenListingAd?: (ad: ListingAd) => void;
  onOpenLivePortal: () => void;
  imageOnly?: boolean;
}) {
  if (listingAd) {
    const adImage = getMediaProxyUrl(listingAd.imageUrl || '');
    if (imageOnly && adImage) {
      return (
        <button
          type="button"
          onClick={() => onOpenListingAd ? onOpenListingAd(listingAd) : onOpenLivePortal()}
          className="relative block w-full overflow-hidden text-left"
        >
          <img src={adImage} alt={listingAd.title} className="block h-auto w-full object-cover" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onOpenListingAd ? onOpenListingAd(listingAd) : onOpenLivePortal()}
        className="relative block w-full overflow-hidden rounded-[18px] text-left"
        style={{ backgroundColor: listingAd.backgroundColor || '#111827' }}
      >
        {adImage ? <img src={adImage} alt={listingAd.title} className="absolute inset-0 h-full w-full object-cover opacity-30" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.78)_52%,rgba(15,23,42,0.52)_100%)]" />
        <div className="relative z-10 flex items-center justify-between gap-6 px-6 py-5 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <span className="rounded-md bg-[#F59E0B] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#111827]">
                {listingAd.badge || 'Ad'}
              </span>
              {listingAd.placementKey ? <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">{listingAd.placementKey.replace(/_/g, ' ')}</span> : null}
            </div>
            <div className="mt-3 text-lg font-extrabold tracking-[-0.03em]">{listingAd.title}</div>
            <div className="mt-1 max-w-[760px] text-sm text-white/78">{listingAd.description}</div>
          </div>
          <span className="shrink-0 rounded-[10px] bg-white px-4 py-2 text-sm font-bold text-[#111827]">
            {listingAd.ctaText || 'Explore'}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] bg-[#111827]">
      <div className="flex items-center justify-between px-6 py-5 text-white">
        <div className="flex items-center gap-4">
          <span className="rounded-md bg-[#F59E0B] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#111827]">Ad</span>
          <div className="text-lg font-extrabold tracking-[-0.03em]">Your shop, top of this row, from Rs 499 a week</div>
        </div>
        <button
          type="button"
          onClick={onOpenLivePortal}
          className="rounded-[10px] bg-white px-4 py-2 text-sm font-bold text-[#111827]"
        >
          See rates
        </button>
      </div>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-3 space-y-2 text-sm text-[#98A2B3]">
        {items.map((item) => <div key={item}>{item}</div>)}
      </div>
    </div>
  );
}

function SearchSuggestionsPanel({
  searchQuery,
  recentSearchTerms,
  matchingCategories,
  matchingBusinesses,
  categories,
  suggestionResultCount,
  onOpenCategoryPage,
  onOpenListingPage,
  onClearRecent,
  onSubmitSearch,
  compact = false,
}: {
  searchQuery: string;
  recentSearchTerms: string[];
  matchingCategories: CategoryTile[];
  matchingBusinesses: Business[];
  categories: Category[];
  suggestionResultCount: number;
  onOpenCategoryPage: (categoryId: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  onClearRecent: () => void;
  onSubmitSearch: (query?: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="text-[#0F172A]">
      {recentSearchTerms.length > 0 ? (
        <div className="border-b border-[#E2E8F0] px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Recent</div>
            <button type="button" onClick={onClearRecent} className="text-sm text-[#94A3B8]">Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearchTerms.map((term) => (
              <button
                key={term}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSubmitSearch(term);
                }}
                className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-sm text-[#667085] hover:border-[#F59E0B] hover:text-[#111827]"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-b border-[#E2E8F0] px-4 py-3">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Categories</div>
        <div className="space-y-1">
          {matchingCategories.slice(0, 5).map(({ category, count }) => (
            <button
              key={category.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onOpenCategoryPage(category.id);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2 text-left transition hover:bg-[#F8FAFC]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE7F3] text-[#C0266D]">
                  <Grid2x2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[1.02rem] font-bold text-[#B45309]">{category.name}</div>
                  <div className="truncate text-sm text-[#94A3B8]">{count} listings</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#C7CEDB]" />
            </button>
          ))}
          {matchingCategories.length === 0 ? (
            <div className="rounded-xl bg-[#F8FAFC] px-3 py-3 text-sm text-[#94A3B8]">
              No matching categories found.
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Businesses</div>
        <div className="space-y-2">
          {matchingBusinesses.slice(0, 5).map((business) => (
            <button
              key={business.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onOpenListingPage(business.id, business.localityId);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2 text-left transition hover:bg-[#F8FAFC]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={getMediaProxyUrl(business.imageUrl || business.coverImageUrl || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=120&q=80')}
                  alt={business.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate text-[1.02rem] font-bold text-[#B45309]">{business.name}</div>
                  <div className="truncate text-sm text-[#94A3B8]">{getBusinessSearchLabel(business, categories)} | {getBusinessLocationLabel(business)}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {business.featured ? (
                  <span className="rounded-md bg-[#FEF3C7] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#B45309]">
                    Sponsored
                  </span>
                ) : null}
                {/* Rating intentionally not rendered. */}
              </div>
            </button>
          ))}
          {matchingBusinesses.length === 0 ? (
            <div className="rounded-xl bg-[#F8FAFC] px-3 py-3 text-sm text-[#94A3B8]">
              No matching businesses found yet.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-4">
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onSubmitSearch(searchQuery);
          }}
          className={`font-semibold text-[#B45309] ${compact ? 'text-sm' : 'text-[1.02rem]'}`}
        >
            View all {Math.max(suggestionResultCount, matchingBusinesses.length)} results for "{searchQuery || 'search'}" {'->'}
        </button>
        {!compact ? (
          <div className="inline-flex items-center gap-2 text-sm text-[#94A3B8]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E8F0]">Enter</span>
            <span>to search</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
