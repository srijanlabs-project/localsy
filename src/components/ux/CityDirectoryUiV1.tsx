import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Grid2x2,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react';
import { Business, Category, Locality, UserSession } from '../../types';
import happyBusinessLogo from '../../assets/happy-business-logo.png';
import { getMediaProxyUrl } from '../../utils/mediaUrl';

type CityDirectoryUiV1Props = {
  activeLocalityId: string;
  businesses: Business[];
  categories: Category[];
  localities: Locality[];
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
  onOpenLocalityPage: (localityId: string) => void;
  onOpenCategoryPage: (categoryId: string, localityId?: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  onSearchSubmit?: (query: string, localityId?: string) => void;
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

const normalizeValue = (value: string) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const formatRating = (value: number) => Number.isFinite(value) ? value.toFixed(1) : '4.5';

const getBusinessSearchLabel = (business: Business, categories: Category[]) => (
  categories.find((category) => category.id === business.categoryId)?.name
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
  + (business.isSponsored ? 40 : 0)
  + (business.rating || 0) * 10
  + ((business.reviewCount || 0) / 8)
);

const buildCategoryTiles = (approvedBusinesses: Business[], categories: Category[]) => {
  const counts = new Map<string, number>();
  approvedBusinesses.forEach((business) => {
    const key = business.categoryId || 'uncategorized';
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([categoryId, count], index) => ({
      category: categories.find((entry) => entry.id === categoryId) || {
        id: categoryId,
        name: categoryId || 'More',
      } as Category,
      count,
      accent: CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length],
    }))
    .sort((left, right) => right.count - left.count || left.category.name.localeCompare(right.category.name));
};

const buildPromoTitle = (business: Business | null, cityLabel: string, fallback: string) => {
  if (!business) return fallback;
  return `${business.name} across ${cityLabel}`;
};

const buildPromoSubtitle = (business: Business | null, categories: Category[], cityLabel: string) => {
  if (!business) return `Trusted local businesses across ${cityLabel}`;
  return `${getBusinessSearchLabel(business, categories)} | ${getBusinessLocationLabel(business)}`;
};

export default function CityDirectoryUiV1({
  activeLocalityId,
  businesses,
  categories,
  localities,
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
  onOpenLocalityPage,
  onOpenCategoryPage,
  onOpenListingPage,
  onSearchSubmit,
}: CityDirectoryUiV1Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeLocality = useMemo(
    () => localities.find((locality) => locality.id === activeLocalityId) || localities[0] || null,
    [activeLocalityId, localities],
  );

  const activeLocalityBusinesses = useMemo(
    () => businesses.filter((business) => business.localityId === activeLocality?.id),
    [activeLocality?.id, businesses],
  );

  const inferredCityId = activeLocalityBusinesses[0]?.cityId || '';
  const cityLocalities = useMemo(() => {
    if (inferredCityId) {
      const localityIdsInCity = new Set(
        businesses
          .filter((business) => business.cityId === inferredCityId)
          .map((business) => business.localityId),
      );
      return localities.filter((locality) => localityIdsInCity.has(locality.id));
    }

    const fallbackCityLabel = activeLocality?.name.split(',')[1]?.trim() || '';
    return localities.filter((locality) => locality.name.split(',')[1]?.trim() === fallbackCityLabel);
  }, [activeLocality?.name, businesses, inferredCityId, localities]);

  const cityLocalityIds = useMemo(
    () => new Set(cityLocalities.map((locality) => locality.id)),
    [cityLocalities],
  );

  const cityBusinesses = useMemo(
    () => businesses
      .filter((business) => business.status === 'approved' && cityLocalityIds.has(business.localityId))
      .sort((left, right) => getListingScore(right) - getListingScore(left)),
    [businesses, cityLocalityIds],
  );

  const cityLabel = useMemo(() => {
    if (activeLocality?.name.split(',')[1]?.trim()) return activeLocality.name.split(',')[1].trim();
    return cityBusinesses[0]?.address.split(',').slice(-1)[0]?.trim() || 'City';
  }, [activeLocality?.name, cityBusinesses]);

  const resolvedPincode = displayedPincode || cityBusinesses[0]?.pincode || activeLocalityBusinesses[0]?.pincode || '410218';
  const resolvedNodeLabel = activeNodeLabel || cityLabel;
  const isAuthenticated = Boolean(userSession?.isAuthenticated && userSession?.userPhone);

  const categoryTiles = useMemo(
    () => buildCategoryTiles(cityBusinesses, categories),
    [categories, cityBusinesses],
  );

  const visibleCategoryTiles = categoryTiles.slice(0, 12);
  const topCategoryId = visibleCategoryTiles[0]?.category.id || categories[0]?.id || 'all';
  const primaryLocalityId = cityLocalities[0]?.id || activeLocality?.id || activeLocalityId;

  const primaryHeroBusiness = cityBusinesses[0] || null;
  const secondaryHeroBusiness = cityBusinesses.find((business) => business.id !== primaryHeroBusiness?.id) || cityBusinesses[1] || null;

  const sectionGroups = useMemo<SectionGroup[]>(
    () => categoryTiles.slice(0, 4).map((tile) => ({
      ...tile,
      chips: Array.from(new Set(
        cityBusinesses
          .filter((business) => business.categoryId === tile.category.id)
          .slice(0, 8)
          .map((business) => getBusinessSubcategory(business, categories)),
      )).slice(0, 4),
      listings: cityBusinesses
        .filter((business) => business.categoryId === tile.category.id)
        .slice(0, 4),
    })),
    [categories, categoryTiles, cityBusinesses],
  );

  const quickSearches = useMemo(() => {
    const candidates = cityBusinesses
      .slice(0, 24)
      .map((business) => business.sourceSubcategoryLabel || getBusinessSearchLabel(business, categories))
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
    return Array.from(new Set(candidates)).slice(0, 3);
  }, [categories, cityBusinesses]);

  const spotlightLocalities = useMemo(() => cityLocalities.slice(0, 8), [cityLocalities]);

  const averageRating = useMemo(() => {
    if (cityBusinesses.length === 0) return '4.5';
    const total = cityBusinesses.reduce((sum, business) => sum + (Number.isFinite(business.rating) ? business.rating : 0), 0);
    return formatRating(total / cityBusinesses.length);
  }, [cityBusinesses]);

  const primaryPromo = useMemo<PromoCardContent>(() => ({
    image: getMediaProxyUrl(primaryHeroBusiness?.coverImageUrl || primaryHeroBusiness?.imageUrl || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80'),
    badge: primaryHeroBusiness?.featured ? 'Featured listing' : 'City spotlight',
    title: buildPromoTitle(primaryHeroBusiness, cityLabel, `Trusted businesses across ${cityLabel}`),
    subtitle: buildPromoSubtitle(primaryHeroBusiness, categories, cityLabel),
    cta: primaryHeroBusiness ? 'View listing' : 'Explore city',
    onClick: () => {
      if (primaryHeroBusiness) {
        onOpenListingPage(primaryHeroBusiness.id, primaryHeroBusiness.localityId);
        return;
      }
      onOpenLocalityPage(primaryLocalityId);
    },
  }), [categories, cityLabel, onOpenListingPage, onOpenLocalityPage, primaryHeroBusiness, primaryLocalityId]);

  const secondaryPromo = useMemo<PromoCardContent>(() => ({
    image: getMediaProxyUrl(secondaryHeroBusiness?.coverImageUrl || secondaryHeroBusiness?.imageUrl || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'),
    badge: secondaryHeroBusiness?.featured ? 'Sponsored' : 'Top rated',
    title: buildPromoTitle(secondaryHeroBusiness, cityLabel, `Popular picks in ${cityLabel}`),
    subtitle: buildPromoSubtitle(secondaryHeroBusiness, categories, cityLabel),
    cta: secondaryHeroBusiness ? 'See details' : 'Browse localities',
    onClick: () => {
      if (secondaryHeroBusiness) {
        onOpenListingPage(secondaryHeroBusiness.id, secondaryHeroBusiness.localityId);
        return;
      }
      onOpenLocalityPage(primaryLocalityId);
    },
  }), [categories, cityLabel, onOpenListingPage, onOpenLocalityPage, primaryLocalityId, secondaryHeroBusiness]);

  const submitSearch = (query = searchQuery) => {
    const normalizedQuery = String(query || '').trim() || cityLabel;
    if (onSearchSubmit) {
      onSearchSubmit(normalizedQuery, primaryLocalityId);
      return;
    }
    onOpenLocalityPage(primaryLocalityId);
  };

  const searchSupportingText = `${spotlightLocalities.length} localities · ${cityBusinesses.length} active businesses`;

  return (
    <section className="localisy-public-page min-h-screen overflow-x-hidden bg-[#EEF2F7] text-[#0F172A]">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="hidden w-full lg:block">
          <header className="bg-[#111827] px-8 py-5 text-white shadow-[0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between">
              <div className="flex items-center gap-10">
                <button type="button" onClick={onOpenLivePortal} className="flex items-center">
                  <img src={happyBusinessLogo} alt="Localisy" className="h-10 w-auto object-contain" />
                </button>
                <button
                  type="button"
                  onClick={onOpenPincodeModal || onOpenLivePortal}
                  className="inline-flex cursor-pointer items-baseline gap-2 text-left"
                >
                  <span className="text-[13px] font-normal uppercase tracking-[0.26em] text-[#F59E0B]">
                    {cityLabel} | {resolvedPincode}
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
                    onClick={onOpenPlatform || onOpenLivePortal}
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

          <div className="bg-white px-8 py-6">
            <div className="mx-auto max-w-[1280px]">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C46A00]">City spotlight</div>
              <div className="grid grid-cols-[minmax(0,1fr)_170px] gap-4">
                <PromoCard tone="warm" {...primaryPromo} />
                <PromoCard tone="berry" compact {...secondaryPromo} />
              </div>
              <div className="mt-3 flex gap-2">
                <span className="h-[3px] w-[30px] rounded-full bg-[#F59E0B]" />
                <span className="h-[3px] w-[30px] rounded-full bg-[#E5E7EB]" />
                <span className="h-[3px] w-[30px] rounded-full bg-[#E5E7EB]" />
                <span className="h-[3px] w-[30px] rounded-full bg-[#E5E7EB]" />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] px-8 py-4">
            <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_360px] items-center gap-6">
              <div className="rounded-[16px] border border-white/16 bg-[#2B3446] p-2 shadow-[0_14px_34px_rgba(2,6,23,0.28)]">
                <div className="flex items-center rounded-[12px] bg-white px-4 py-2.5">
                  <Search className="h-4 w-4 text-[#98A2B3]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitSearch();
                      }
                    }}
                    placeholder={`Search businesses across ${cityLabel}...`}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-[#111827] outline-none"
                  />
                  <div className="mr-4 flex items-center gap-2 border-l border-[#E5E7EB] pl-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                    <MapPin className="h-3.5 w-3.5 text-[#F59E0B]" />
                    <span>{cityLabel} | {resolvedPincode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => submitSearch()}
                    className="rounded-[10px] bg-[#F59E0B] px-5 py-2.5 text-sm font-bold text-[#111827]"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[1.2rem] font-extrabold leading-tight tracking-[-0.04em] text-white">
                  Every trusted business in <span className="text-[#F59E0B]">{cityLabel}</span>, locality by locality.
                </div>
                <div className="flex gap-2 overflow-hidden">
                  {quickSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => submitSearch(term)}
                      className="truncate rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                      <button type="button" onClick={onOpenPlatform || onOpenLivePortal} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">
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
              <h1 className="max-w-[320px] text-[2rem] font-extrabold leading-[1.02] tracking-[-0.04em]">
                Explore trusted businesses across <span className="text-[#F59E0B]">{cityLabel}.</span>
              </h1>

              <div className="mt-5">
                <div className="flex items-center rounded-[14px] bg-white px-3 py-3 text-[#111827]">
                  <Search className="h-4 w-4 text-[#98A2B3]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitSearch();
                      }
                    }}
                    placeholder={`Search ${cityLabel}...`}
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
              </div>
            </div>

            <div className="bg-white px-4 pb-4 text-[#111827]">
              <PromoCard tone="warm" {...primaryPromo} />
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

        <div className="hidden w-full pb-14 lg:block">
          <section className="bg-white px-10 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-[2rem] font-extrabold tracking-[-0.04em] text-[#0F172A]">Localities in {cityLabel}</h2>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  Browse every locality landing page in {cityLabel}, each linked into the same search and listing experience.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenLocalityPage(primaryLocalityId)}
                className="text-sm font-semibold text-[#C46A00]"
              >
                Open primary locality {'->'}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              {spotlightLocalities.map((locality) => {
                const count = cityBusinesses.filter((business) => business.localityId === locality.id).length;
                return (
                  <button
                    key={locality.id}
                    type="button"
                    onClick={() => onOpenLocalityPage(locality.id)}
                    className="w-[148px] rounded-[18px] border border-[#E6EBF2] bg-white px-4 py-5 text-left transition hover:-translate-y-0.5 hover:border-[#F59E0B] hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#EEF4FF] text-[#1E3A8A]">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="mt-4 text-[15px] font-bold leading-5 text-[#111827]">
                      {locality.name.split(',')[0]}
                    </div>
                    <div className="mt-1 text-[12px] text-[#98A2B3]">{count} listings</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-6 bg-white px-10 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-[2rem] font-extrabold tracking-[-0.04em] text-[#0F172A]">All categories</h2>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {Math.max(visibleCategoryTiles.length, 1)} active groups shown from {Math.max(categories.length, 1)} category groups across {cityLabel}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenCategoryPage(topCategoryId, primaryLocalityId)}
                className="text-sm font-semibold text-[#C46A00]"
              >
                View all {'->'}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-6 gap-4">
              {visibleCategoryTiles.map(({ category, count, accent }) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onOpenCategoryPage(category.id, primaryLocalityId)}
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

          <div className="mt-6 space-y-6">
            {sectionGroups.map((section) => (
              <section key={section.category.id} className="bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
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
                  <button
                    type="button"
                    onClick={() => onOpenCategoryPage(section.category.id, primaryLocalityId)}
                    className="text-sm font-semibold text-[#C46A00]"
                  >
                    All {section.count} listings {'->'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {section.listings.map((business) => (
                    <CityListingCard
                      key={business.id}
                      business={business}
                      categoryLabel={getBusinessSearchLabel(business, categories)}
                      onOpenListingPage={onOpenListingPage}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-6 overflow-hidden bg-[#111827]">
            <div className="flex items-center justify-between px-6 py-5 text-white">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-[#F59E0B] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#111827]">
                    City guide
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">{searchSupportingText}</span>
                </div>
                <div className="mt-3 text-lg font-extrabold tracking-[-0.03em]">Start with {cityLabel}, then drill down into the right locality page.</div>
                <div className="mt-1 text-sm text-white/78">
                  Locality pages, search results, and listing pages now share the same public design language and navigation logic.
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenLocalityPage(primaryLocalityId)}
                className="shrink-0 rounded-[10px] bg-white px-4 py-2 text-sm font-bold text-[#111827]"
              >
                Explore localities
              </button>
            </div>
          </section>

          <footer className="mt-8 bg-[#111827] px-10 py-10 text-white">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-8">
              <div>
                <div className="text-[1.8rem] font-extrabold tracking-[-0.04em]">
                  LOCALISY <span className="text-[0.95rem] uppercase tracking-[0.18em] text-[#F59E0B]">{cityLabel}</span>
                </div>
                <p className="mt-4 max-w-[340px] text-sm leading-6 text-[#98A2B3]">
                  Discover trusted businesses across {cityLabel}. Every city page routes into locality pages, search results, and listing detail pages using one shared design language.
                </p>
              </div>
              <FooterColumn title="Explore" items={['Localities', 'Categories', 'Search results']} />
              <FooterColumn title="For business" items={['Claim a listing', 'Advertise', 'Lead reports']} />
              <FooterColumn title="About city" items={[`${cityBusinesses.length} active listings`, `${spotlightLocalities.length} localities`, `${resolvedPincode} primary pincode`]} />
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-[#7C8799]">
              <div>Copyright 2026 Localisy | {cityLabel} {resolvedPincode}</div>
              <div>Privacy | Terms | Report a listing</div>
            </div>
          </footer>
        </div>

        <div className="px-4 pb-12 lg:hidden">
          <section className="mt-4 rounded-[22px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <h2 className="text-[1.6rem] font-extrabold tracking-[-0.04em] text-[#0F172A]">Localities in {cityLabel}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {spotlightLocalities.map((locality) => (
                <button
                  key={locality.id}
                  type="button"
                  onClick={() => onOpenLocalityPage(locality.id)}
                  className="rounded-full border border-[#E6EBF2] bg-white px-4 py-2 text-sm font-medium text-[#475467]"
                >
                  {locality.name.split(',')[0]}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-[22px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <h2 className="text-[1.6rem] font-extrabold tracking-[-0.04em] text-[#0F172A]">Top categories</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {visibleCategoryTiles.slice(0, 6).map(({ category, count, accent }) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onOpenCategoryPage(category.id, primaryLocalityId)}
                  className="rounded-[18px] border border-[#E6EBF2] bg-white px-4 py-4 text-left"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px]" style={{ backgroundColor: `${accent}16`, color: accent }}>
                    <Grid2x2 className="h-5 w-5" />
                  </span>
                  <div className="mt-3 text-[14px] font-bold leading-5 text-[#111827]">{category.name}</div>
                  <div className="mt-1 text-[11px] text-[#98A2B3]">{count} listings</div>
                </button>
              ))}
            </div>
          </section>

          <div className="mt-4 space-y-4">
            {sectionGroups.map((section) => (
              <section key={section.category.id} className="rounded-[22px] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: section.accent }} />
                    <h3 className="text-[1rem] font-extrabold tracking-[-0.03em] text-[#111827]">{section.category.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenCategoryPage(section.category.id, primaryLocalityId)}
                    className="text-sm font-semibold text-[#C46A00]"
                  >
                    View all
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {section.listings.slice(0, 2).map((business) => (
                    <CityCompactCard
                      key={business.id}
                      business={business}
                      onOpenListingPage={onOpenListingPage}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
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
}: PromoCardContent & {
  tone: 'warm' | 'berry';
  compact?: boolean;
}) {
  const overlay = tone === 'warm'
    ? 'bg-[linear-gradient(90deg,rgba(202,83,16,0.88)_0%,rgba(111,36,10,0.42)_100%)]'
    : 'bg-[linear-gradient(180deg,rgba(162,28,98,0.88)_0%,rgba(86,22,63,0.82)_100%)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative min-h-[160px] overflow-hidden rounded-[16px] text-left text-white"
    >
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      <div className={`absolute inset-0 ${overlay}`} />
      <div className={`relative z-10 flex h-full flex-col justify-between ${compact ? 'px-4 py-4' : 'px-7 py-6'}`}>
        <div>
          <span className="inline-flex rounded-md bg-[#FBBF24] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
            {badge}
          </span>
          <div className={`mt-3 font-extrabold leading-[1.02] tracking-[-0.04em] ${compact ? 'text-[1.15rem]' : 'max-w-[460px] text-[2.1rem]'}`}>
            {title}
          </div>
          <div className={`mt-2 text-white/85 ${compact ? 'text-[11px]' : 'text-sm'}`}>{subtitle}</div>
        </div>
        <span className={`inline-flex rounded-[10px] font-bold ${compact ? 'bg-white px-3 py-2 text-xs text-[#5B1C4A]' : 'bg-[#FBBF24] px-4 py-2.5 text-sm text-[#111827]'}`}>
          {cta}
        </span>
      </div>
    </button>
  );
}

function CityListingCard({
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

function CityCompactCard({
  business,
  onOpenListingPage,
}: {
  business: Business;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
}) {
  const imageUrl = business.imageUrl || business.coverImageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=720&q=80';

  return (
    <button
      type="button"
      onClick={() => onOpenListingPage(business.id, business.localityId)}
      className="flex w-full items-center gap-3 rounded-[18px] border border-[#E6EBF2] bg-white p-3 text-left"
    >
      <img src={getMediaProxyUrl(imageUrl)} alt={business.name} className="h-20 w-20 rounded-[14px] object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold text-[#111827]">{business.name}</div>
        <div className="mt-1 text-[12px] text-[#98A2B3]">{getBusinessLocationLabel(business)}</div>
        <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-white px-0 text-[12px] font-bold text-[#111827]">
          <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
          {formatRating(business.rating)}
        </div>
      </div>
    </button>
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
