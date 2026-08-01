import React, { useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Building2,
  Clock3,
  Compass,
  HeartPulse,
  Hotel,
  Landmark,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import { Business, Category, Locality } from '../../types';

type MockIcon = React.ComponentType<{ className?: string }>;

type LocalityLandingMockV1Props = {
  activeLocalityId: string;
  businesses: Business[];
  categories: Category[];
  localities: Locality[];
  onExitMock: () => void;
};

const FALLBACK_CATEGORY_ICON: MockIcon = Store;

const CATEGORY_ICON_RULES: Array<{ match: string[]; Icon: MockIcon }> = [
  { match: ['food', 'restaurant', 'cafe', 'bakery'], Icon: UtensilsCrossed },
  { match: ['health', 'medical', 'clinic', 'hospital', 'doctor'], Icon: Stethoscope },
  { match: ['repair', 'service', 'electric', 'plumber', 'auto'], Icon: Wrench },
  { match: ['hotel', 'stay', 'accommodation', 'travel'], Icon: Hotel },
  { match: ['home', 'interior', 'furniture', 'real-estate'], Icon: Building2 },
  { match: ['finance', 'legal', 'consult'], Icon: Landmark },
];

const formatRating = (value: number) => Number.isFinite(value) ? value.toFixed(1) : '4.7';

const getCategoryIcon = (category: Category): MockIcon => {
  const haystack = `${category.id} ${category.name}`.toLowerCase();
  return CATEGORY_ICON_RULES.find((rule) => rule.match.some((token) => haystack.includes(token)))?.Icon || FALLBACK_CATEGORY_ICON;
};

export default function LocalityLandingMockV1({
  activeLocalityId,
  businesses,
  categories,
  localities,
  onExitMock,
}: LocalityLandingMockV1Props) {
  const activeLocality = useMemo(() => (
    localities.find((locality) => locality.id === activeLocalityId) || localities[0] || null
  ), [activeLocalityId, localities]);

  const localityLabel = activeLocality?.name.split(',')[0] || 'Your Locality';
  const localityBusinesses = useMemo(() => (
    businesses.filter((business) => business.localityId === activeLocality?.id && business.status === 'approved')
  ), [activeLocality?.id, businesses]);

  const featuredBusinesses = useMemo(() => (
    [...localityBusinesses]
      .sort((left, right) => {
        const leftScore = (left.featured ? 3 : 0) + left.rating + (left.reviewCount / 50);
        const rightScore = (right.featured ? 3 : 0) + right.rating + (right.reviewCount / 50);
        return rightScore - leftScore;
      })
      .slice(0, 4)
  ), [localityBusinesses]);

  const categorySummaries = useMemo(() => {
    const counts = new Map<string, { count: number; sampleNames: string[] }>();
    localityBusinesses.forEach((business) => {
      const key = business.categoryId || 'uncategorized';
      const existing = counts.get(key) || { count: 0, sampleNames: [] };
      existing.count += 1;
      if (existing.sampleNames.length < 2) existing.sampleNames.push(business.name);
      counts.set(key, existing);
    });

    return [...counts.entries()]
      .map(([categoryId, summary]) => {
        const category = categories.find((entry) => entry.id === categoryId) || {
          id: categoryId,
          name: categoryId === 'uncategorized' ? 'Everyday Services' : categoryId,
          icon: 'category_icon',
          color: '#d97706',
        };
        return {
          category,
          count: summary.count,
          sampleNames: summary.sampleNames,
        };
      })
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [categories, localityBusinesses]);

  const trustMetrics = useMemo(() => {
    const verifiedCount = localityBusinesses.filter((business) => business.verifiedBadge || business.kycStatus === 'verified').length;
    const fastResponseCount = localityBusinesses.filter((business) => String(business.responseTime || '').trim().length > 0).length;
    const averageRating = localityBusinesses.length > 0
      ? localityBusinesses.reduce((total, business) => total + (Number.isFinite(business.rating) ? business.rating : 0), 0) / localityBusinesses.length
      : 4.7;

    return [
      { label: 'Verified businesses', value: String(verifiedCount || Math.min(48, localityBusinesses.length || 24)) },
      { label: 'Average trust rating', value: formatRating(averageRating) },
      { label: 'Fast responders', value: `${fastResponseCount || Math.min(18, localityBusinesses.length || 12)}+` },
    ];
  }, [localityBusinesses]);

  const quickIntents = [
    {
      title: 'Emergency and urgent',
      detail: 'Use this for high-intent queries like ambulance, plumber, locksmith, and 24x7 needs.',
      accent: 'from-rose-500 to-orange-400',
      Icon: HeartPulse,
    },
    {
      title: 'Best rated nearby',
      detail: 'Shortlist trusted businesses fast using reviews, response quality, and verified tags.',
      accent: 'from-amber-500 to-yellow-400',
      Icon: Star,
    },
    {
      title: 'Family and daily use',
      detail: 'Surface groceries, clinics, tutors, salons, bakeries, and home services in one scan.',
      accent: 'from-emerald-500 to-teal-400',
      Icon: Compass,
    },
    {
      title: 'AI assisted discovery',
      detail: 'Support natural-language search and follow-up questions without breaking locality context.',
      accent: 'from-sky-500 to-cyan-400',
      Icon: Brain,
    },
  ];

  const breadcrumbs = ['India', activeLocality?.name.split(',')[1]?.trim() || 'City', localityLabel];

  return (
    <section className="relative min-h-[calc(100vh-220px)] flex-1 overflow-hidden rounded-[32px] border border-stone-200 bg-stone-50 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.24),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.18),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.98))]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 md:py-8 xl:px-10">
        <div className="flex flex-col gap-4 rounded-[28px] border border-stone-200 bg-white/88 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">UX Mock V1</span>
              <span>Locality Landing</span>
              <span className="text-slate-300">/</span>
              <span>Wave 1 Review</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb}-${index}`}>
                  {index > 0 && <ChevronDivider />}
                  <span className={index === breadcrumbs.length - 1 ? 'font-semibold text-slate-900' : ''}>{crumb}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onExitMock}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <span>Open UI Screen</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_55%,#f59e0b_140%)] p-[1px] shadow-[0_16px_60px_rgba(15,23,42,0.18)]">
            <div className="rounded-[29px] bg-slate-950/92 px-6 py-6 text-white md:px-8 md:py-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-200">
                <Sparkles className="h-4 w-4" />
                <span>Designed to keep locality context visible at every step</span>
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                Find trusted businesses in {localityLabel} without jumping across generic directories.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                This concept makes the locality page feel like a decision surface, not just a listing dump. Search, trust filters,
                popular intents, and merchant discovery all start above the fold.
              </p>

              <div className="mt-6 rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-4 text-slate-900 shadow-lg">
                    <Search className="h-5 w-5 text-teal-700" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Search prompt</div>
                      <div className="truncate text-sm font-semibold md:text-base">
                        Dentist open now, bakery for birthday cake, best AC repair near me
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <MockChip label="Open now" />
                    <MockChip label="Verified only" />
                    <MockChip label="Top rated" />
                    <MockChip label="Near me" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-amber-200" />
                    <span>{localityLabel} locked as current locality context</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
                    <span>Trust, reviews, and verification lead the scan path</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Trust snapshot</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Why users should trust this page</h2>
                </div>
                <BadgeCheck className="h-10 w-10 text-emerald-600" />
              </div>
              <div className="mt-5 grid gap-3">
                {trustMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl bg-stone-50 px-4 py-3">
                    <div className="text-2xl font-black text-slate-900">{metric.value}</div>
                    <div className="mt-1 text-sm text-slate-500">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Review focus</p>
              <div className="mt-4 grid gap-3">
                <ReviewPoint
                  title="Search should feel task-led"
                  detail="The first action is solving intent, not forcing the user to browse category trees."
                />
                <ReviewPoint
                  title="Locality should stay obvious"
                  detail="Users should always know which locality they are browsing and how to switch it."
                />
                <ReviewPoint
                  title="Trust cues should reduce hesitation"
                  detail="Verified, rating, and response-time signals need to sit close to every conversion point."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickIntents.map((intent) => (
            <div
              key={intent.title}
              className="group rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`inline-flex rounded-2xl bg-gradient-to-br ${intent.accent} p-3 text-white shadow-lg`}>
                <intent.Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">{intent.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{intent.detail}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span>See suggested layout</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Top categories</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">What people most often look for in {localityLabel}</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-500">
                This block helps the page act as both a landing experience and an SEO-powered discovery hub.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categorySummaries.map((entry) => {
                const Icon = getCategoryIcon(entry.category);
                return (
                  <article key={entry.category.id} className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex rounded-2xl bg-white p-3 text-teal-700 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                        {entry.count} listings
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-900">{entry.category.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Example discovery names: {entry.sampleNames.join(', ') || 'Trusted local picks'}.
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-stone-200 bg-[#fffaf1] p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">Merchant entry point</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">This page should convert local businesses too</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              The page is not just for buyers. Merchants who discover weak or missing representation should see a clean claim or add-business CTA.
            </p>

            <div className="mt-5 space-y-3">
              <ActionRow
                icon={<Building2 className="h-4 w-4 text-amber-700" />}
                title="Claim your existing business"
                detail="Useful when the listing already exists but ownership is not verified."
              />
              <ActionRow
                icon={<Store className="h-4 w-4 text-amber-700" />}
                title="Add your business to this locality"
                detail="Useful for coverage gaps and new merchants entering the area."
              />
              <ActionRow
                icon={<MessageSquareText className="h-4 w-4 text-amber-700" />}
                title="Respond to leads and reviews"
                detail="Creates a bridge from discovery into merchant workspace value."
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Trusted picks</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Businesses that deserve prime attention above the fold</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified, rated, and locality-relevant</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {featuredBusinesses.map((business) => (
                <article key={business.id} className="grid gap-4 rounded-[24px] border border-stone-200 bg-stone-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{business.name}</h3>
                      {business.featured && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{business.description || 'Trusted business with strong locality relevance and conversion potential.'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {formatRating(business.rating)} ({business.reviewCount} reviews)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2">
                        <Clock3 className="h-3.5 w-3.5 text-teal-600" />
                        {business.responseTime || 'Responds fast'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        {localityLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    <button type="button" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                      View listing
                    </button>
                    <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                      Unlock contact
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-stone-200 bg-[#f0fdfa] p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">Flow logic</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">The intended user journey on this page</h2>
            <div className="mt-5 space-y-4">
              <JourneyStep
                index="01"
                title="Recognize intent fast"
                detail="Search prompt, quick chips, and category blocks should help users decide where to click in under five seconds."
              />
              <JourneyStep
                index="02"
                title="Compare with confidence"
                detail="Listings must show trust, relevance, and response signals without forcing users into deep detail pages first."
              />
              <JourneyStep
                index="03"
                title="Convert without friction"
                detail="Calls, WhatsApp, contact unlock, and review actions should be present but not visually noisy."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChevronDivider() {
  return <span className="text-slate-300">/</span>;
}

function MockChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-2 text-xs font-semibold text-white">
      {label}
    </span>
  );
}

function ReviewPoint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div>
    </div>
  );
}

function ActionRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white/80 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex rounded-xl bg-amber-100 p-2">{icon}</div>
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div>
        </div>
      </div>
    </div>
  );
}

function JourneyStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-white/80 p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">{index}</div>
      <div className="mt-2 text-base font-black text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div>
    </div>
  );
}
