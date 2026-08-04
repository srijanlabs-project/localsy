import React, { useMemo } from 'react';
import { ArrowRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Business, Category, Locality } from '../../types';
import {
  FeaturedBusinessCard,
  LocalisyPreviewHeader,
  PageContainer,
  SectionTitle,
  SidebarCard,
  StatItem,
  ThemePage,
  formatRating,
  getLocalityContext,
  popularSearches,
  pluralize,
} from './localisyPublicPrimitives';

type CategoryResultsUiV1Props = {
  activeLocalityId: string;
  businesses: Business[];
  categories: Category[];
  localities: Locality[];
  initialCategoryId?: string;
  onOpenLivePortal: () => void;
  onOpenCategoryPage: (categoryId: string, localityId?: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
};

export default function CategoryResultsUiV1({
  activeLocalityId,
  businesses,
  categories,
  localities,
  initialCategoryId,
  onOpenLivePortal,
  onOpenCategoryPage,
  onOpenListingPage,
}: CategoryResultsUiV1Props) {
  const activeLocality = useMemo(() => (
    localities.find((locality) => locality.id === activeLocalityId) || localities[0] || null
  ), [activeLocalityId, localities]);

  const { localityLabel, cityLabel, fullLocationLabel } = getLocalityContext(activeLocality);

  const approvedBusinesses = useMemo(() => (
    businesses.filter((business) => business.localityId === activeLocality?.id && business.status === 'approved')
  ), [activeLocality?.id, businesses]);

  const fallbackCategory = useMemo(() => {
    const ranked = new Map<string, number>();
    approvedBusinesses.forEach((business) => {
      ranked.set(business.categoryId, (ranked.get(business.categoryId) || 0) + 1);
    });
    const firstCategoryId = [...ranked.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
    return firstCategoryId || categories[0]?.id || '';
  }, [approvedBusinesses, categories]);

  const activeCategoryId = initialCategoryId && categories.some((category) => category.id === initialCategoryId)
    ? initialCategoryId
    : fallbackCategory;

  const activeCategory = categories.find((category) => category.id === activeCategoryId) || categories[0] || null;

  const resultBusinesses = useMemo(() => (
    approvedBusinesses
      .filter((business) => business.categoryId === activeCategoryId)
      .sort((left, right) => {
        const leftScore = (left.featured ? 4 : 0) + left.rating + (left.reviewCount / 50);
        const rightScore = (right.featured ? 4 : 0) + right.rating + (right.reviewCount / 50);
        return rightScore - leftScore;
      })
  ), [activeCategoryId, approvedBusinesses]);

  const averageRating = useMemo(() => {
    if (resultBusinesses.length === 0) return '4.5';
    const total = resultBusinesses.reduce((sum, business) => sum + (Number.isFinite(business.rating) ? business.rating : 0), 0);
    return formatRating(total / resultBusinesses.length);
  }, [resultBusinesses]);

  const siblingCategories = categories
    .filter((category) => category.id !== activeCategoryId)
    .slice(0, 5);

  return (
    <ThemePage>
      <PageContainer>
        <LocalisyPreviewHeader locationLabel={fullLocationLabel} onOpenLivePortal={onOpenLivePortal} />

        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white px-8 py-10 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1E3A8A]">
                Search Results
              </div>
              <h1 className="mt-5 text-[3.3rem] font-black leading-[0.95] tracking-[-0.06em] text-[#0D1B2A]">
                {activeCategory?.name || 'Local services'} in {localityLabel}
              </h1>
              <p className="mt-4 max-w-[560px] text-[1.05rem] leading-8 text-slate-600">
                Browse trusted businesses in {localityLabel}, compare ratings, and find the right listing faster.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatItem value={pluralize(Math.max(12, resultBusinesses.length), 'Results')} label="Matches" />
                <StatItem value={`${Math.max(6, siblingCategories.length + 1)}+`} label="Related categories" highlight="category" />
                <StatItem value={averageRating} label="Avg. Rating" highlight="star" />
                <StatItem value="Updated" label="Live" highlight="verified" />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {[activeCategory, ...siblingCategories].filter(Boolean).map((category) => (
                  <button
                    key={category!.id}
                    type="button"
                    onClick={() => onOpenCategoryPage(category!.id, activeLocality?.id || activeLocalityId)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
                      category!.id === activeCategoryId
                        ? 'border-[#0D1B2A] bg-[#0D1B2A] text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {category!.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-[linear-gradient(135deg,#0D1B2A_0%,#1E3A8A_100%)] p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <SlidersHorizontal className="h-4 w-4" />
                Recommended result controls
              </div>
              <div className="mt-5 space-y-3">
                {['Open now', 'Top rated', 'Nearby first', 'Verified only', 'Offers available'].map((filter) => (
                  <div key={filter} className="rounded-[18px] bg-white/10 px-4 py-3 text-sm font-medium">
                    {filter}
                  </div>
                ))}
              </div>
              <div className="mt-5 text-xs leading-6 text-white/75">
                This page is meant to become the main results experience for category plus locality intent routes.
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.9fr_0.95fr]">
          <div>
            <SectionTitle title={`${resultBusinesses.length} businesses found`} actionLabel="Map view" />
            <div className="mt-4 flex flex-wrap gap-3">
              {['Top picks', 'Closest match', 'Verified', 'Fast response', 'Premium'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {resultBusinesses.slice(0, 8).map((business) => (
                <div key={business.id}>
                  <FeaturedBusinessCard business={business} localityLabel={localityLabel} onOpenDetails={(businessId) => onOpenListingPage(businessId, business.localityId)} />
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-[22px] border border-[#FFD54F]/40 bg-[linear-gradient(90deg,#fff9df_0%,#fff5f9_100%)] px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950">Designed for intent-driven discovery</div>
                    <div className="mt-1 text-sm text-slate-600">This page supports locality-first ranking, sponsored slots, and future map-led browsing.</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                >
                  Refine search
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <SidebarCard title="Search context">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Location</div>
                  <div className="mt-1 font-semibold text-slate-900">{localityLabel}, {cityLabel}</div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Category</div>
                  <div className="mt-1 font-semibold text-slate-900">{activeCategory?.name || 'All categories'}</div>
                </div>
              </div>
            </SidebarCard>

            <SidebarCard title="Popular searches">
              <div className="flex flex-wrap gap-3">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </SidebarCard>
          </aside>
        </div>
      </PageContainer>
    </ThemePage>
  );
}
