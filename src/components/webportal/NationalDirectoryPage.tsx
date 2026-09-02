import React, { useMemo } from 'react';
import { ArrowRight, Building2, MapPin, Sparkles } from 'lucide-react';
import type { Business, Category, Locality } from '../../types';
import { buildNationalDirectorySummary, getBusinessPrimaryLocationLabel } from '../../services/webportal/publicExperience';
import {
  CategoryChip,
  FeaturedBusinessCard,
  LocalisyPreviewHeader,
  PageContainer,
  SectionTitle,
  SidebarCard,
  StatItem,
  ThemePage,
  pluralize,
} from '../ux/localisyPublicPrimitives';

type NationalDirectoryPageProps = {
  businesses: Business[];
  categories: Category[];
  localities: Locality[];
  onOpenLivePortal: () => void;
  onOpenLocalityPage: (localityId: string) => void;
  onOpenCategoryPage: (categoryId: string, localityId?: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
};

export default function NationalDirectoryPage({
  businesses,
  categories,
  localities,
  onOpenLivePortal,
  onOpenLocalityPage,
  onOpenCategoryPage,
  onOpenListingPage,
}: NationalDirectoryPageProps) {
  const summary = useMemo(() => buildNationalDirectorySummary(businesses, localities), [businesses, localities]);

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    summary.approvedBusinesses.forEach((business) => {
      counts.set(business.categoryId, (counts.get(business.categoryId) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([categoryId, count]) => ({
        category: categories.find((entry) => entry.id === categoryId),
        count,
      }))
      .filter((entry): entry is { category: Category; count: number } => Boolean(entry.category))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8);
  }, [categories, summary.approvedBusinesses]);

  return (
    <ThemePage>
      <PageContainer>
        <LocalisyPreviewHeader locationLabel="India" onOpenLivePortal={onOpenLivePortal} />

        <section className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1E3A8A]">
                <Building2 className="h-3.5 w-3.5" />
                National Discovery
              </div>
              <h1 className="mt-5 text-[3.7rem] font-black leading-[0.95] tracking-[-0.06em] text-[#0D1B2A]">
                Discover India through trusted local directories
              </h1>
              <p className="mt-4 max-w-[620px] text-[1.05rem] leading-8 text-slate-600">
                Localisy can scale from one locality to many cities while keeping search locality-first, business trust clear,
                and merchant discovery strong.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatItem value={pluralize(summary.approvedBusinesses.length || 350, 'Businesses')} label="Businesses" />
                <StatItem value={pluralize(summary.cityIds.length || 12, 'Cities')} label="Cities" highlight="category" />
                <StatItem value={pluralize(summary.stateIds.length || 4, 'States')} label="States" />
                <StatItem value="SEO" label="Ready" highlight="verified" />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {summary.localityHighlights.slice(0, 6).map(({ locality }) => (
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

            <div className="rounded-[24px] bg-[linear-gradient(135deg,#0D1B2A_0%,#1E3A8A_60%,#0f766e_100%)] p-6 text-white shadow-xl">
              <div className="text-[1.55rem] font-bold tracking-[-0.03em]">Why this page matters</div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">Top-level discovery</div>
                  <div className="mt-1 text-xs text-white/75">National and regional pages support broad search entry before city and locality refinement.</div>
                </div>
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">SEO multiplier</div>
                  <div className="mt-1 text-xs text-white/75">Programmatic city, locality, category, and listing surfaces expand organic acquisition cleanly.</div>
                </div>
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">Merchant funnel</div>
                  <div className="mt-1 text-xs text-white/75">Sellers can claim, upgrade, and improve visibility from one public discovery surface.</div>
                </div>
                <div className="rounded-[18px] bg-white/10 p-4">
                  <div className="text-sm font-bold">Operations visibility</div>
                  <div className="mt-1 text-xs text-white/75">Pages can reveal coverage gaps, indexability, and city-level content opportunity.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.85fr_0.95fr]">
          <div>
            <SectionTitle title="Top categories across Localisy" actionLabel="Open live search" />
            <div className="mt-4 flex flex-wrap gap-2.5">
              {topCategories.map(({ category, count }) => (
                <CategoryChip key={category.id} category={category} count={count} onClick={(categoryId) => onOpenCategoryPage(categoryId, summary.localityHighlights[0]?.locality.id)} />
              ))}
            </div>

            <div className="mt-7">
              <SectionTitle title="Featured businesses across markets" actionLabel="Open seller-ready directory" />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summary.featuredBusinesses.slice(0, 8).map((business) => (
                  <FeaturedBusinessCard
                    key={business.id}
                    business={business}
                    localityLabel={getBusinessPrimaryLocationLabel(localities, business)}
                    onOpenDetails={(businessId) => onOpenListingPage(businessId, business.localityId)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-7 rounded-[22px] border border-[#FFD54F]/40 bg-[linear-gradient(90deg,#fff9df_0%,#fff5f9_100%)] px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950">Built for expansion, not just one locality</div>
                    <div className="mt-1 text-sm text-slate-600">This is the parent organic and discovery surface above city pages, seller pages, and locality pages.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCategoryPage(topCategories[0]?.category.id || categories[0]?.id || '', summary.localityHighlights[0]?.locality.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                >
                  Continue to discovery
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <SidebarCard title="High-coverage localities">
              <div className="space-y-3">
                {summary.localityHighlights.map(({ locality, count }) => (
                  <button
                    key={locality.id}
                    type="button"
                    onClick={() => onOpenLocalityPage(locality.id)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{locality.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{count} live businesses</div>
                      </div>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                        Explore
                      </span>
                    </div>
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
