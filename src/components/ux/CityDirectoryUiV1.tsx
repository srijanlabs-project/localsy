import React, { useMemo } from 'react';
import { ArrowRight, Building2, MapPin, Sparkles } from 'lucide-react';
import { Business, Category, Locality } from '../../types';
import {
  CategoryChip,
  FeaturedBusinessCard,
  LocalisyPreviewHeader,
  PageContainer,
  SectionTitle,
  SidebarCard,
  StatItem,
  ThemePage,
  formatRating,
  getLocalityContext,
  pluralize,
} from './localisyPublicPrimitives';

type CityDirectoryUiV1Props = {
  activeLocalityId: string;
  businesses: Business[];
  categories: Category[];
  localities: Locality[];
  onOpenLivePortal: () => void;
  onOpenLocalityPage: (localityId: string) => void;
  onOpenCategoryPage: (categoryId: string, localityId?: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
};

export default function CityDirectoryUiV1({
  activeLocalityId,
  businesses,
  categories,
  localities,
  onOpenLivePortal,
  onOpenLocalityPage,
  onOpenCategoryPage,
  onOpenListingPage,
}: CityDirectoryUiV1Props) {
  const activeLocality = useMemo(() => (
    localities.find((locality) => locality.id === activeLocalityId) || localities[0] || null
  ), [activeLocalityId, localities]);

  const { cityLabel, fullLocationLabel } = getLocalityContext(activeLocality);

  const cityLocalities = useMemo(() => (
    localities.filter((locality) => locality.name.split(',')[1]?.trim() === cityLabel)
  ), [cityLabel, localities]);

  const cityLocalityIds = useMemo(() => new Set(cityLocalities.map((locality) => locality.id)), [cityLocalities]);

  const cityBusinesses = useMemo(() => (
    businesses.filter((business) => business.status === 'approved' && cityLocalityIds.has(business.localityId))
  ), [businesses, cityLocalityIds]);

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    cityBusinesses.forEach((business) => {
      counts.set(business.categoryId, (counts.get(business.categoryId) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([categoryId, count]) => ({
        category: categories.find((entry) => entry.id === categoryId),
        count,
      }))
      .filter((entry): entry is { category: Category; count: number } => Boolean(entry.category))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [categories, cityBusinesses]);

  const topBusinesses = useMemo(() => (
    [...cityBusinesses]
      .sort((left, right) => {
        const leftScore = (left.featured ? 4 : 0) + left.rating + (left.reviewCount / 50);
        const rightScore = (right.featured ? 4 : 0) + right.rating + (right.reviewCount / 50);
        return rightScore - leftScore;
      })
      .slice(0, 6)
  ), [cityBusinesses]);

  const averageRating = useMemo(() => {
    if (cityBusinesses.length === 0) return '4.5';
    const total = cityBusinesses.reduce((sum, business) => sum + (Number.isFinite(business.rating) ? business.rating : 0), 0);
    return formatRating(total / cityBusinesses.length);
  }, [cityBusinesses]);

  const spotlightLocalities = cityLocalities.slice(0, 6);

  return (
    <ThemePage>
      <PageContainer>
        <LocalisyPreviewHeader locationLabel={fullLocationLabel} onOpenLivePortal={onOpenLivePortal} />

        <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1E3A8A]">
                <Building2 className="h-3.5 w-3.5" />
                City Directory
              </div>
              <h1 className="mt-5 text-[3.5rem] font-black leading-[0.95] tracking-[-0.06em] text-[#0D1B2A]">
                Explore {cityLabel}
              </h1>
              <p className="mt-4 max-w-[560px] text-[1.05rem] leading-8 text-slate-600">
                Discover trusted local businesses, neighborhood hotspots, and the most searched services across {cityLabel}.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatItem value={pluralize(Math.max(120, cityBusinesses.length), 'Businesses')} label="Businesses" />
                <StatItem value={pluralize(Math.max(8, cityLocalities.length), 'Localities')} label="Localities" highlight="category" />
                <StatItem value={averageRating} label="Avg. Rating" highlight="star" />
                <StatItem value="Updated" label="Daily" highlight="verified" />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {spotlightLocalities.map((locality) => (
                  <button
                    key={locality.id}
                    type="button"
                    onClick={() => onOpenLocalityPage(locality.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#1E3A8A]" />
                    <span>{locality.name.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-[linear-gradient(135deg,#0D1B2A_0%,#1E3A8A_100%)] p-6 text-white shadow-xl">
              <div className="text-[1.55rem] font-bold tracking-[-0.03em]">{cityLabel} at a glance</div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">High intent traffic</div>
                  <div className="mt-1 text-xs text-white/75">Strong demand across food, health, education, and home services.</div>
                </div>
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">Locality-led browsing</div>
                  <div className="mt-1 text-xs text-white/75">Users can start city-wide and drill down into the right neighborhood.</div>
                </div>
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">SEO ready</div>
                  <div className="mt-1 text-xs text-white/75">City pages can aggregate localities, listings, and category intent pages.</div>
                </div>
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">Merchant growth</div>
                  <div className="mt-1 text-xs text-white/75">Designed to route discovery to locality pages and premium listing surfaces.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.9fr_0.95fr]">
          <div>
            <SectionTitle title={`Top categories in ${cityLabel}`} actionLabel="View all categories" />
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {topCategories.map(({ category, count }) => (
                <CategoryChip key={category.id} category={category} count={count} onClick={(categoryId) => onOpenCategoryPage(categoryId, cityLocalities[0]?.id || activeLocality?.id || activeLocalityId)} />
              ))}
            </div>

            <div className="mt-7">
              <SectionTitle title={`Featured businesses across ${cityLabel}`} actionLabel="Open search results" />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {topBusinesses.map((business) => {
                  const localityName = localities.find((locality) => locality.id === business.localityId)?.name.split(',')[0] || cityLabel;
                  return (
                    <div key={business.id}>
                      <FeaturedBusinessCard business={business} localityLabel={localityName} onOpenDetails={(businessId) => onOpenListingPage(businessId, business.localityId)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 rounded-[22px] border border-[#FFD54F]/40 bg-[linear-gradient(90deg,#fff9df_0%,#fff5f9_100%)] px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950">Build city-wide discovery with locality depth</div>
                    <div className="mt-1 text-sm text-slate-600">This page is designed to act as the parent discovery layer above locality pages.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCategoryPage(topCategories[0]?.category.id || categories[0]?.id || '', cityLocalities[0]?.id || activeLocality?.id || activeLocalityId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                >
                  Continue to results
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <SidebarCard title="Popular localities">
              <div className="space-y-3">
                {spotlightLocalities.map((locality) => (
                  <button
                    key={locality.id}
                    type="button"
                    onClick={() => onOpenLocalityPage(locality.id)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{locality.name.split(',')[0]}</div>
                        <div className="mt-1 text-xs text-slate-500">{locality.stats.numBusinesses || 0} listed businesses</div>
                      </div>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                        Active
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </SidebarCard>

            <SidebarCard title="Page role">
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>City pages give Localisy a strong national and regional discovery surface without diluting locality relevance.</p>
                <p>They can aggregate categories, neighborhoods, and featured listings while routing users deeper into a narrower search scope.</p>
              </div>
            </SidebarCard>
          </aside>
        </div>
      </PageContainer>
    </ThemePage>
  );
}
