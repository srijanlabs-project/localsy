import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Grid2x2,
  LogOut,
  MapPin,
  Menu,
  Search,
  Star,
  User,
} from 'lucide-react';
import { Business, Category, HeroBanner, ListingAd, Locality, UserSession } from '../../types';
import { getCategoryById } from '../../categoryMaster';
import { getMediaProxyUrl } from '../../utils/mediaUrl';
import happyBusinessLogo from '../../assets/happy-business-logo.png';

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
  onOpenListingPage: (businessId: string, localityId?: string) => void;
};

type CategoryTile = {
  category: Category;
  count: number;
  accent: string;
};

type SectionGroup = CategoryTile & {
  chips: string[];
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

const formatRating = (value: number) => Number.isFinite(value) ? value.toFixed(1) : '4.5';

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

const getBusinessLocationLabel = (business: Business) => (
  business.address.split(',')[0]?.trim()
  || 'Sector 17'
);

const getListingScore = (business: Business) => (
  (business.featured ? 80 : 0)
  + (business.rating || 0) * 10
  + ((business.reviewCount || 0) / 8)
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
  onOpenListingPage,
}: LocalityLandingUiV1Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [heroRotationTick, setHeroRotationTick] = useState(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroRotationTick((current) => current + 1);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  const activeLocality = useMemo(
    () => localities.find((locality) => locality.id === activeLocalityId) || localities[0] || null,
    [activeLocalityId, localities],
  );

  const localityLabel = activeLocality?.name.split(',')[0] || 'Roadpali';
  const primaryPincode = useMemo(() => {
    const firstBusinessPin = businesses.find((business) => business.localityId === activeLocality?.id && business.pincode)?.pincode;
    return firstBusinessPin || '410218';
  }, [activeLocality?.id, businesses]);
  const resolvedPincode = displayedPincode || primaryPincode;
  const resolvedNodeLabel = activeNodeLabel || localityLabel;
  const isAuthenticated = Boolean(userSession?.isAuthenticated && userSession?.userPhone);

  const approvedBusinesses = useMemo(
    () => businesses
      .filter((business) => business.localityId === activeLocality?.id && business.status === 'approved')
      .sort((left, right) => getListingScore(right) - getListingScore(left)),
    [activeLocality?.id, businesses],
  );

  const recentSearchTerms = useMemo(
    () => recentSearches.map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 5),
    [recentSearches],
  );

  const categoryTiles = useMemo(
    () => buildCategoryTiles(approvedBusinesses, categories),
    [approvedBusinesses, categories],
  );

  const visibleCategoryTiles = categoryTiles.slice(0, 12);
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

  const sectionGroups = useMemo<SectionGroup[]>(
    () => categoryTiles.slice(0, 4).map((tile) => ({
      ...tile,
      chips: Array.from(new Set(
        approvedBusinesses
          .filter((business) => business.categoryId === tile.category.id)
          .slice(0, 8)
          .map((business) => getBusinessSubcategory(business, categories)),
      )).slice(0, 4),
      listings: approvedBusinesses
        .filter((business) => business.categoryId === tile.category.id)
        .slice(0, 4),
    })),
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
          heroPromo={mobilePrimaryPromo}
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

        <div className="hidden pb-14 lg:block">
          <section className="bg-white px-10 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-[2rem] font-extrabold tracking-[-0.04em] text-[#0F172A]">All categories</h2>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {Math.max(visibleCategoryTiles.length, 1)} active groups shown from {Math.max(categories.length, 1)} total category groups.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenCategoryPage(featuredCategoryId, activeLocality?.id || activeLocalityId)}
                  className="rounded-full border border-[#D8E0EA] px-4 py-2 text-sm font-semibold text-[#667085]"
                >
                  A-Z index
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCategoryPage(featuredCategoryId, activeLocality?.id || activeLocalityId)}
                  className="text-sm font-semibold text-[#C46A00]"
                >
                  View all {'->'}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-6 gap-4">
              {visibleCategoryTiles.map(({ category, count, accent }) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onOpenCategoryPage(category.id, activeLocality?.id || activeLocalityId)}
                  className="rounded-[18px] border border-[#E6EBF2] bg-white px-4 py-5 text-center transition hover:-translate-y-0.5 hover:border-[#F59E0B] hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                >
                  <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ backgroundColor: `${accent}16`, color: accent }}>
                    <Grid2x2 className="h-5 w-5" />
                  </span>
                  <div className="mt-3 text-[13px] font-bold leading-4 text-[#111827]">{category.name}</div>
                  <div className="mt-1 text-[11px] text-[#98A2B3]">{count} listings</div>
                </button>
              ))}
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

          <div className="mt-6 space-y-6">
            {sectionGroups.map((section) => (
              <React.Fragment key={section.category.id}>
                <DirectorySectionPanel
                  categories={categories}
                  section={section}
                  onOpenCategoryPage={() => onOpenCategoryPage(section.category.id, activeLocality?.id || activeLocalityId)}
                  onOpenListingPage={onOpenListingPage}
                />
              </React.Fragment>
            ))}
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
  stripBannerAd,
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
      <header className="bg-[#111827] px-8 py-5 text-white shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={onOpenCityPage}
              className="flex items-center"
            >
              <img src={happyBusinessLogo} alt="Localisy" className="h-10 w-auto object-contain" />
            </button>
            <button
              type="button"
              onClick={onOpenPincodeModal || onOpenCityPage}
              className="inline-flex cursor-pointer items-baseline gap-2 text-left"
            >
              <span className="text-[13px] font-normal uppercase tracking-[0.26em] text-[#F59E0B]">
                {localityLabel} | {resolvedPincode}
              </span>
              <span className="cursor-pointer text-[13px] font-normal uppercase tracking-[0.22em] text-[#4F46E5] underline-offset-4 transition hover:underline">
                (Change)
              </span>
            </button>
          </div>
          <div className="flex items-center gap-10">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => onOpenPlatform?.()}
                className="cursor-pointer border-b-2 border-transparent pb-1 text-[13px] font-normal text-white transition hover:text-white/85"
              >
                Platform
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenLivePortal}
              className={`cursor-pointer pb-1 text-[13px] font-normal text-white transition hover:text-white/85 ${isAdvertiseActive ? 'border-b-2 border-[#F59E0B]' : 'border-b-2 border-transparent'}`}
            >
              Advertise Business
            </button>
            {isAuthenticated ? (
              <div className={`flex items-center gap-3 border-b-2 pb-1 text-[13px] font-normal text-white ${isAccountActive ? 'border-[#F59E0B]' : 'border-transparent'}`}>
                <span>{userSession?.userName?.split(' ')[0] || 'Account'}</span>
                <button type="button" onClick={onLogout} className="text-[13px] font-normal text-white/80 transition hover:text-white">
                  Log Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onRequestAuth}
                className={`cursor-pointer border-b-2 pb-1 text-[13px] font-normal text-white transition hover:text-white/85 ${isAccountActive ? 'border-[#F59E0B]' : 'border-transparent'}`}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white px-8 py-0">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-[minmax(0,1fr)_170px] gap-4">
            {rotatingPrimaryHeroAd ? (
              <ImageAdPromoCard listingAd={rotatingPrimaryHeroAd} onOpenListingAd={onOpenListingAd} onOpenLivePortal={onOpenLivePortal} />
            ) : (
              <PromoCard
                tone="warm"
                image={primaryPromo.image}
                badge={primaryPromo.badge}
                title={primaryPromo.title}
                subtitle={primaryPromo.subtitle}
                cta={primaryPromo.cta}
                onClick={primaryPromo.onClick}
              />
            )}
            {rotatingSecondaryHeroAd ? (
              <ImageAdPromoCard listingAd={rotatingSecondaryHeroAd} compact onOpenListingAd={onOpenListingAd} onOpenLivePortal={onOpenLivePortal} />
            ) : (
              <PromoCard
                tone="berry"
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
          <div className="mt-2 flex gap-2 pb-2">
            {Array.from({ length: Math.max(rotatingPrimaryHeroCount || 0, 1) }).map((_, index) => (
              <span
                key={`hero-dot-${index}`}
                className={`h-[3px] w-[30px] rounded-full ${index === rotatingPrimaryHeroIndex ? 'bg-[#F59E0B]' : 'bg-[#E5E7EB]'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#B45309] px-8 py-4">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_360px] items-center gap-6">
          <div className="relative">
            <div className="border border-white/16 bg-[#8C2D04] p-2 shadow-[0_14px_34px_rgba(124,45,18,0.28)]">
              <div className="flex items-center rounded-[12px] bg-white px-4 py-2.5">
                <Search className="h-4 w-4 text-[#98A2B3]" />
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
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-[#111827] outline-none"
                />
                <div className="mr-4 flex items-center gap-2 border-l border-[#E5E7EB] pl-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                  <MapPin className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span>{localityLabel} | {primaryPincode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => submitSearch()}
                  className="rounded-[10px] bg-[#B45309] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Search
                </button>
              </div>
            </div>

            {shouldShowSuggestions ? (
              <div className="absolute left-2 right-2 top-[calc(100%+14px)] z-20 overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
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

          <div className="space-y-3">
            <div className="text-[1.2rem] font-extrabold leading-tight tracking-[-0.04em] text-white">
              Every trusted business in <span className="text-[#F59E0B]">{localityLabel}</span>, in one place.
            </div>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => submitSearch(term)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
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
      className={`relative block overflow-hidden text-left ${compact ? 'min-h-[300px]' : 'min-h-[300px]'}`}
    >
      <img src={adImage} alt={listingAd.title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute left-4 top-4 z-10 inline-flex rounded-md bg-[#FBBF24] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
        {listingAd.badge || 'Sponsored'}
      </div>
    </button>
  );
}

function MobileHomeShell({
  localityLabel,
  categories,
  heroPromo,
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
  heroPromo: PromoCardContent;
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

  return (
    <div className="px-4 pt-4 lg:hidden">
      <section className="overflow-hidden rounded-[24px] bg-[#111827] text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div>
            <div className="text-[1.5rem] font-extrabold tracking-[-0.04em]">LOCALISY</div>
            <button
              type="button"
              onClick={onOpenPincodeModal}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#F59E0B]"
            >
              <MapPin className="h-3 w-3" />
              {resolvedPincode} | {resolvedNodeLabel}
            </button>
          </div>
          <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/12 bg-white/5"
          >
            <Menu className="h-5 w-5" />
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

        <div className="px-4 py-5">
          <h1 className="max-w-[290px] text-[2rem] font-extrabold leading-[1.02] tracking-[-0.04em]">
            Every trusted business in <span className="text-[#F59E0B]">{localityLabel}.</span>
          </h1>

          <div className="relative mt-5">
            <div className="flex items-center rounded-[14px] bg-white px-3 py-3 text-[#111827]">
              <Search className="h-4 w-4 text-[#98A2B3]" />
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
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] outline-none"
              />
              <button
                type="button"
                onClick={() => submitSearch()}
                className="rounded-[10px] bg-[#F59E0B] px-4 py-2 text-sm font-bold text-[#111827]"
              >
                Go
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
        </div>

        <div className="bg-white px-4 pb-4 text-[#111827]">
          <div className="overflow-hidden rounded-[16px]">
            <button type="button" onClick={heroPromo.onClick} className="relative block h-[154px] w-full text-left">
              <img src={heroPromo.image} alt={heroPromo.title || localityLabel} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,94,84,0.88)_0%,rgba(15,23,42,0.18)_100%)]" />
              <div className="relative z-10 flex h-full flex-col justify-end px-4 py-4 text-white">
                <span className="mb-2 inline-flex w-fit rounded-md bg-[#F59E0B] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#111827]">
                  {heroPromo.badge}
                </span>
                <div className="text-[1.6rem] font-extrabold tracking-[-0.04em]">
                  {heroPromo.title}
                </div>
                <div className="mt-1 max-w-[240px] text-[12px] text-white/80">{heroPromo.subtitle}</div>
              </div>
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="h-[3px] w-[28px] rounded-full bg-[#F59E0B]" />
            <span className="h-[3px] w-[28px] rounded-full bg-[#D9DDE6]" />
            <span className="h-[3px] w-[28px] rounded-full bg-[#D9DDE6]" />
            <span className="h-[3px] w-[28px] rounded-full bg-[#D9DDE6]" />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {quickSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => submitSearch(term)}
                className="inline-flex whitespace-nowrap rounded-full bg-[#EFF3F8] px-3 py-2 text-[12px] font-medium text-[#667085]"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PromoCard({
  tone,
  image,
  badge,
  title,
  subtitle,
  cta,
  compact = false,
  onClick,
}: {
  tone: 'warm' | 'berry';
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  compact?: boolean;
  onClick: () => void;
}) {
  const overlay = tone === 'warm'
    ? 'bg-[linear-gradient(90deg,rgba(202,83,16,0.88)_0%,rgba(111,36,10,0.42)_100%)]'
    : 'bg-[linear-gradient(180deg,rgba(162,28,98,0.88)_0%,rgba(86,22,63,0.82)_100%)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden text-left text-white ${compact ? 'min-h-[300px]' : 'min-h-[300px]'}`}
    >
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      <div className={`absolute inset-0 ${overlay}`} />
      <div className={`relative z-10 flex h-full flex-col justify-between ${compact ? 'px-4 py-4' : 'px-7 py-6'}`}>
        <div>
          <span className="inline-flex rounded-md bg-[#FBBF24] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
            {badge}
          </span>
          <div className={`mt-3 font-extrabold leading-[1.02] tracking-[-0.04em] ${compact ? 'text-[1.15rem]' : 'max-w-[440px] text-[2.1rem]'}`}>
            {title}
          </div>
          <div className={`mt-2 text-white/85 ${compact ? 'text-[11px]' : 'text-sm'}`}>{subtitle}</div>
        </div>
        <div>
          <span className={`inline-flex rounded-[10px] font-bold ${compact ? 'bg-white px-3 py-2 text-xs text-[#5B1C4A]' : 'bg-[#FBBF24] px-4 py-2.5 text-sm text-[#111827]'}`}>
            {cta}
          </span>
        </div>
      </div>
    </button>
  );
}

function DirectorySectionPanel({
  categories,
  section,
  onOpenCategoryPage,
  onOpenListingPage,
}: {
  categories: Category[];
  section: SectionGroup;
  onOpenCategoryPage: () => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
}) {
  return (
    <section className="bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: section.accent }} />
          <h3 className="text-[1.1rem] font-extrabold tracking-[-0.03em] text-[#111827]">{section.category.name}</h3>
          <div className="flex gap-2">
            {section.chips.map((chip) => (
              <span key={`${section.category.id}-${chip}`} className="rounded-full bg-[#F2F4F7] px-3 py-1 text-[11px] font-semibold text-[#667085]">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <button type="button" onClick={onOpenCategoryPage} className="text-sm font-semibold text-[#C46A00]">
          All {section.count} sub-categories {'->'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {section.listings.map((business) => (
          <DirectoryListingCard
            key={business.id}
            business={business}
            categoryLabel={getBusinessSearchLabel(business, categories)}
            onOpenListingPage={onOpenListingPage}
          />
        ))}
      </div>
    </section>
  );
}

function DirectoryListingCard({
  business,
  categoryLabel,
  onOpenListingPage,
}: {
  business: Business;
  categoryLabel: string;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
}) {
  const imageUrl = business.coverImageUrl || business.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=720&q=80';
  const badgeLabel = business.featured ? 'Sponsored' : (!business.phone ? 'Unclaimed' : business.verifiedBadge ? 'Verified' : '');

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#E6EBF2] bg-white">
      <button
        type="button"
        onClick={() => onOpenListingPage(business.id, business.localityId)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[0.92/1] overflow-hidden bg-[#EEF2F7]">
          <img src={getMediaProxyUrl(imageUrl)} alt={business.name} className="h-full w-full object-cover" />
          {badgeLabel ? (
            <span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${business.featured ? 'bg-[#FBBF24] text-[#111827]' : 'bg-white/90 text-[#667085]'}`}>
              {badgeLabel}
            </span>
          ) : null}
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#111827] shadow-sm">
            <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
            {formatRating(business.rating)}
          </span>
        </div>
      </button>

      <div className="px-3 pb-3 pt-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C46A00]">{categoryLabel}</div>
        <div className="mt-2 text-[1rem] font-extrabold leading-5 text-[#111827]">{business.name}</div>
        <div className="mt-1 text-[12px] text-[#98A2B3]">
          {getBusinessLocationLabel(business)} | {Math.max(business.reviewCount || 0, 0)} ratings
        </div>
        <button
          type="button"
          onClick={() => onOpenListingPage(business.id, business.localityId)}
          className={`show-number-action mt-3 w-full rounded-[12px] px-3 py-3 text-sm ${business.phone ? 'bg-[#0F172A] text-white' : 'border border-[#E4E7EC] bg-white text-[#667085]'}`}
        >
          {business.phone ? 'Show number' : 'Send enquiry'}
        </button>
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
                <div className="flex items-center gap-1 text-sm font-bold text-[#047857]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{formatRating(business.rating)}</span>
                </div>
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
