import React, { useMemo } from 'react';
import {
  Bus,
  ChevronDown,
  ChevronRight,
  CircleDot,
  GraduationCap,
  Grid2x2,
  HeartHandshake,
  Landmark,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Pill,
  Plane,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Trees,
  UtensilsCrossed,
  Wrench,
  Dumbbell,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { Business, Category, Locality } from '../../types';

type LocalityLandingUiV1Props = {
  activeLocalityId: string;
  businesses: Business[];
  categories: Category[];
  localities: Locality[];
  onOpenLivePortal: () => void;
  onOpenCityPage: (localityId?: string) => void;
  onOpenCategoryPage: (categoryId: string, localityId?: string) => void;
  onOpenListingPage: (businessId: string, localityId?: string) => void;
};

type TileIcon = React.ComponentType<{ className?: string }>;

const categoryIconRules: Array<{ match: string[]; Icon: TileIcon; tone: string }> = [
  { match: ['restaurant', 'food', 'cafe', 'bakery'], Icon: UtensilsCrossed, tone: 'bg-orange-50 text-orange-500' },
  { match: ['grocery', 'supermarket', 'mart'], Icon: ShoppingCart, tone: 'bg-lime-50 text-lime-600' },
  { match: ['hospital', 'doctor', 'clinic', 'medical'], Icon: Stethoscope, tone: 'bg-rose-50 text-rose-500' },
  { match: ['school', 'tuition', 'education'], Icon: GraduationCap, tone: 'bg-blue-50 text-blue-500' },
  { match: ['pharmacy', 'chemist'], Icon: Pill, tone: 'bg-cyan-50 text-cyan-500' },
  { match: ['bank', 'finance', 'atm'], Icon: Landmark, tone: 'bg-violet-50 text-violet-500' },
  { match: ['gym', 'fitness'], Icon: Dumbbell, tone: 'bg-amber-50 text-amber-500' },
  { match: ['repair', 'service', 'electric', 'plumber', 'ac'], Icon: Wrench, tone: 'bg-[#eef4ff] text-[#1E3A8A]' },
];

const popularSearches = [
  'Best Restaurants',
  '24x7 Medical',
  'Grocery Stores',
  'PG / Hostels',
  'Home Tutors',
  'Electricians',
  'Salons',
  'Pest Control',
];

const getCategoryPresentation = (category: Category): { Icon: TileIcon; tone: string } => {
  const haystack = `${category.id} ${category.name}`.toLowerCase();
  return categoryIconRules.find((rule) => rule.match.some((token) => haystack.includes(token))) || {
    Icon: Store,
    tone: 'bg-slate-100 text-slate-500',
  };
};

const formatRating = (value: number) => Number.isFinite(value) ? value.toFixed(1) : '4.5';

const pluralize = (count: number, noun: string) => `${count}+ ${noun}`;

export default function LocalityLandingUiV1({
  activeLocalityId,
  businesses,
  categories,
  localities,
  onOpenLivePortal,
  onOpenCityPage,
  onOpenCategoryPage,
  onOpenListingPage,
}: LocalityLandingUiV1Props) {
  const activeLocality = useMemo(() => (
    localities.find((locality) => locality.id === activeLocalityId) || localities[0] || null
  ), [activeLocalityId, localities]);

  const localityLabel = activeLocality?.name.split(',')[0] || 'Roadpali';
  const cityLabel = activeLocality?.name.split(',')[1]?.trim() || 'Navi Mumbai';
  const fullLocationLabel = `${localityLabel}, ${cityLabel}`;

  const approvedBusinesses = useMemo(() => (
    businesses.filter((business) => business.localityId === activeLocality?.id && business.status === 'approved')
  ), [activeLocality?.id, businesses]);

  const featuredBusinesses = useMemo(() => (
    [...approvedBusinesses]
      .sort((left, right) => {
        const leftScore = (left.featured ? 4 : 0) + left.rating + (left.reviewCount / 50);
        const rightScore = (right.featured ? 4 : 0) + right.rating + (right.reviewCount / 50);
        return rightScore - leftScore;
      })
      .slice(0, 5)
  ), [approvedBusinesses]);

  const categoryTiles = useMemo(() => {
    const counts = new Map<string, number>();
    approvedBusinesses.forEach((business) => {
      const key = business.categoryId || 'uncategorized';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const tiles = [...counts.entries()]
      .map(([categoryId, count]) => {
        const category = categories.find((entry) => entry.id === categoryId) || {
          id: categoryId,
          name: categoryId === 'uncategorized' ? 'More Categories' : categoryId,
          icon: 'category_icon',
          color: '#94a3b8',
        };
        return { category, count };
      })
      .sort((left, right) => right.count - left.count)
      .slice(0, 7);

    return [
      ...tiles,
      {
        category: { id: 'more', name: 'More Categories', icon: 'category_icon', color: '#94a3b8' },
        count: Math.max(12, categories.length),
      },
    ];
  }, [approvedBusinesses, categories]);

  const averageRating = useMemo(() => {
    if (approvedBusinesses.length === 0) return '4.5';
    const total = approvedBusinesses.reduce((sum, business) => sum + (Number.isFinite(business.rating) ? business.rating : 0), 0);
    return formatRating(total / approvedBusinesses.length);
  }, [approvedBusinesses]);

  const heroImage = activeLocality?.coverImage || activeLocality?.carouselImages?.[0] || 'https://images.unsplash.com/photo-1515923256482-1c04580b477c?auto=format&fit=crop&w=1600&q=80';

  const highlightCards = [
    { icon: Bus, title: 'Kharghar Railway Stn.', distance: '7.5 km' },
    { icon: Navigation, title: 'Upcoming Metro', distance: '8.2 km' },
    { icon: Plane, title: 'Navi Mumbai Airport', distance: '17 km' },
    { icon: Bus, title: 'Kalamboli Bus Stop', distance: '2.1 km' },
    { icon: Landmark, title: 'Orion Mall', distance: '6.8 km' },
    { icon: Trees, title: 'Central Park', distance: '5.3 km' },
  ];

  const aboutCards = [
    {
      icon: Navigation,
      title: 'Connectivity',
      detail: 'Well connected via Sion-Panvel Highway, Mumbai-Pune Expressway and Kharghar railway station.',
    },
    {
      icon: MapPin,
      title: 'Nearby Areas',
      detail: 'Kalamboli, Kharghar, Kamothe, Panvel, Sector 20, Sector 19.',
    },
    {
      icon: Grid2x2,
      title: 'Lifestyle',
      detail: 'Peaceful residential locality with schools, markets, parks and modern amenities.',
    },
    {
      icon: HeartHandshake,
      title: 'Why People Choose',
      detail: 'Affordable living, good connectivity, and upcoming infrastructure.',
    },
  ];

  return (
    <section className="bg-[#FFF5F9] text-[#0D1B2A]">
      <div className="mx-auto max-w-[1540px] px-4 pb-10 pt-4 md:px-6 lg:px-8">
        <header className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#0D1B2A] text-[#FFD54F]">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[2rem] font-black tracking-[-0.05em] text-[#0D1B2A]">localisy</div>
                  <div className="-mt-1 text-[11px] font-medium text-slate-500">Find it locally</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenCityPage(activeLocality?.id || activeLocalityId)}
                className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0D1B2A] shadow-sm lg:inline-flex"
              >
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>{fullLocationLabel}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-1 items-center gap-3 lg:max-w-[760px]">
              <div className="flex h-12 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Search for restaurants, doctors, groceries, salons and more...</span>
              </div>
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0D1B2A] text-[#FFD54F] shadow-sm transition hover:bg-[#132845]"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button type="button" className="hidden items-center gap-2 text-sm font-semibold text-[#0D1B2A] md:inline-flex">
                <Grid2x2 className="h-4 w-4 text-slate-500" />
                <span>Categories</span>
              </button>
              <button
                type="button"
                onClick={onOpenLivePortal}
                className="hidden rounded-xl border border-[#FFD54F] bg-[#FFF4CC] px-4 py-3 text-sm font-semibold text-[#0D1B2A] md:inline-flex"
              >
                List Your Business
              </button>
              <button type="button" className="hidden items-center gap-2 text-sm font-semibold text-[#0D1B2A] md:inline-flex">
                <CircleDot className="h-4 w-4 text-slate-500" />
                <span>Login</span>
              </button>
            </div>
          </div>
        </header>

        <section className="relative mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="absolute inset-y-0 right-0 w-[64%]">
            <img src={heroImage} alt={fullLocationLabel} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,245,249,0.96)_0%,rgba(255,245,249,0.8)_28%,rgba(255,245,249,0)_60%)]" />
          </div>

          <div className="relative z-10 grid min-h-[320px] gap-8 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-[560px]">
              <div className="text-[2rem] font-bold tracking-[-0.04em] text-[#1E3A8A]">Welcome to</div>
              <h1 className="mt-1 text-[3.7rem] font-black leading-[0.95] tracking-[-0.06em] text-[#0D1B2A]">
                {localityLabel}, {cityLabel}
              </h1>
              <p className="mt-4 max-w-[430px] text-[1.05rem] leading-8 text-slate-600">
                Find everything you need around you.
                <br />
                Trusted local businesses at your fingertips.
              </p>

              <div className="mt-7 rounded-[18px] border border-slate-200 bg-white/92 p-3 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row">
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 md:w-[180px]"
                  >
                    <span>All Categories</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                  <div className="flex h-12 flex-1 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-400">
                    <span>Search in {localityLabel}...</span>
                    <Search className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0D1B2A] px-7 text-sm font-semibold text-white shadow-sm"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatItem value={pluralize(Math.max(350, approvedBusinesses.length), 'Businesses')} label="Businesses" />
                <StatItem value={`${Math.max(42, categories.length)}+`} label="Categories" highlight="category" />
                <StatItem value={averageRating} label="Avg. Rating" highlight="star" />
                <StatItem value="Updated" label="Daily" highlight="verified" />
              </div>
            </div>

            <div className="flex items-end justify-end">
              <div className="max-w-[500px] rounded-[22px] bg-[#0D1B2A]/84 p-6 text-white shadow-xl backdrop-blur">
                <div className="text-[1.55rem] font-bold tracking-[-0.03em]">Roadpali at a Glance</div>
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { title: 'Great', label: 'Connectivity' },
                    { title: 'Upcoming', label: 'Infrastructure' },
                    { title: 'Peaceful', label: 'Living' },
                    { title: 'Rapidly', label: 'Developing' },
                  ].map((item) => (
                    <div key={item.title} className="space-y-1">
                      <div className="text-sm font-bold">{item.title}</div>
                      <div className="text-xs text-white/75">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.9fr_0.95fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[2rem] font-black tracking-[-0.04em] text-slate-950">Browse by Category</h2>
              <button type="button" className="hidden items-center gap-2 text-sm font-semibold text-[#1E3A8A] md:inline-flex">
                View All Categories
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
              {categoryTiles.map(({ category, count }) => {
                const { Icon, tone } = getCategoryPresentation(category);
                const isMore = category.id === 'more';
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onOpenCategoryPage(category.id, activeLocality?.id || activeLocalityId)}
                    className="rounded-[22px] border border-slate-200 bg-white px-3 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${isMore ? 'bg-slate-100 text-slate-500' : tone}`}>
                      {isMore ? <MoreHorizontal className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="mt-4 text-sm font-bold text-slate-900">{category.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{count}+</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex items-center justify-between">
              <h2 className="text-[2rem] font-black tracking-[-0.04em] text-slate-950">Featured Businesses</h2>
              <button type="button" onClick={() => onOpenCategoryPage(categoryTiles[0]?.category.id || categories[0]?.id || '', activeLocality?.id || activeLocalityId)} className="text-sm font-semibold text-[#1E3A8A]">View All</button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {featuredBusinesses.map((business) => (
                <div key={business.id}>
                  <FeaturedBusinessCard business={business} localityLabel={localityLabel} onOpenDetails={(businessId) => onOpenListingPage(businessId, business.localityId)} />
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className="text-[1.55rem] font-black tracking-[-0.04em] text-slate-950">Popular Searches</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => onOpenCategoryPage(categoryTiles[0]?.category.id || categories[0]?.id || '', activeLocality?.id || activeLocalityId)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="text-[1.55rem] font-black tracking-[-0.04em] text-slate-950">About {localityLabel}</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {aboutCards.map((card) => (
                  <div key={card.title} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#1E3A8A]">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-base font-bold text-slate-900">{card.title}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</div>
                  </div>
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
                    <div className="text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950">Need help finding the right local option?</div>
                    <div className="mt-1 text-sm text-slate-600">Tell us what you need and we will help you discover the best local matches.</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                >
                  Request a Recommendation
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <SidebarCard
              title={`Explore ${localityLabel} on Map`}
              actionLabel="View Full Map"
            >
              <div className="relative h-[210px] overflow-hidden rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_20%),radial-gradient(circle_at_80%_30%,rgba(249,115,22,0.08),transparent_20%),radial-gradient(circle_at_50%_85%,rgba(34,197,94,0.08),transparent_20%)]" />
                <svg viewBox="0 0 420 210" className="absolute inset-0 h-full w-full text-slate-200">
                  <path d="M0 45 H420" stroke="currentColor" strokeWidth="2" />
                  <path d="M0 92 H420" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 148 H420" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M70 0 V210" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M170 0 V210" stroke="currentColor" strokeWidth="2" />
                  <path d="M278 0 V210" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M360 0 V210" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M310 0 C290 60 330 130 420 210" stroke="#bfdbfe" strokeWidth="16" fill="none" opacity="0.75" />
                </svg>
                {[
                  { left: '11%', top: '58%', color: 'bg-rose-500' },
                  { left: '35%', top: '32%', color: 'bg-violet-500' },
                  { left: '48%', top: '76%', color: 'bg-green-500' },
                  { left: '67%', top: '42%', color: 'bg-orange-500' },
                  { left: '84%', top: '61%', color: 'bg-sky-500' },
                  { left: '81%', top: '17%', color: 'bg-amber-500' },
                ].map((pin, index) => (
                  <span
                    key={`${pin.left}-${pin.top}-${index}`}
                    className={`absolute h-5 w-5 rounded-full ring-4 ring-white ${pin.color}`}
                    style={{ left: pin.left, top: pin.top }}
                  />
                ))}
                <div className="absolute left-1/2 top-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-md">
                  {localityLabel}
                </div>
              </div>
            </SidebarCard>

            <SidebarCard title="Local Highlights">
              <div className="grid grid-cols-2 gap-3">
                {highlightCards.map((item) => (
                  <div key={item.title} className="rounded-[18px] border border-slate-200 bg-white p-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1E3A8A]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.distance}</div>
                  </div>
                ))}
              </div>
            </SidebarCard>

            <div className="overflow-hidden rounded-[24px] border border-[#FFD54F]/35 bg-[linear-gradient(90deg,#fff9e1_0%,#ffffff_100%)] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[1.7rem] font-black tracking-[-0.04em] text-slate-950">Own a Business in {localityLabel}?</div>
                  <div className="mt-2 max-w-[260px] text-sm leading-6 text-slate-600">
                    Get discovered by thousands of local customers.
                  </div>
                  <button
                    type="button"
                    onClick={onOpenLivePortal}
                    className="mt-6 inline-flex rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
                  >
                    List Your Business
                  </button>
                </div>
                <div className="hidden rounded-[20px] bg-white/90 p-5 text-[#1E3A8A] shadow-sm md:block">
                  <Store className="h-16 w-16" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function StatItem({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: 'star' | 'verified' | 'category';
}) {
  const iconClassName = highlight === 'star'
    ? 'bg-amber-50 text-amber-500'
    : highlight === 'verified'
      ? 'bg-[#eef8f1] text-[#1b8f5f]'
      : 'bg-[#eef4ff] text-[#1E3A8A]';

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconClassName}`}>
        {highlight === 'star'
          ? <Star className="h-5 w-5" />
          : highlight === 'category'
            ? <Grid2x2 className="h-5 w-5" />
            : <ShieldCheck className="h-5 w-5" />}
      </span>
      <div>
        <div className="text-[1.6rem] font-black tracking-[-0.04em] text-slate-950">
          {highlight ? value : value.split('+')[0]}
          {!highlight && value.includes('+') ? '+' : ''}
        </div>
        <div className="text-xs text-slate-600">{label}</div>
      </div>
    </div>
  );
}

function FeaturedBusinessCard({
  business,
  localityLabel,
  onOpenDetails,
}: {
  business: Business;
  localityLabel: string;
  onOpenDetails?: (businessId: string) => void;
}) {
  const image = business.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
  return (
    <article className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-36 overflow-hidden">
        <img src={image} alt={business.name} className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3 rounded-full bg-[#FFF4CC] px-3 py-1 text-xs font-semibold text-[#0D1B2A] shadow-sm">
          Open
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenDetails?.(business.id)}
            className="text-left text-base font-bold text-slate-950 transition hover:text-[#1E3A8A]"
          >
            {business.name}
          </button>
          <div className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span>{formatRating(business.rating)}</span>
            <span className="text-xs text-slate-400">({business.reviewCount})</span>
          </div>
        </div>
        <div className="mt-1 text-sm text-slate-600">{business.sourceSubcategoryLabel || business.sourceCategoryLabel || 'Trusted local business'}</div>
        <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>{localityLabel}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800">
            <Phone className="h-3.5 w-3.5 text-[#1E3A8A]" />
            Call
          </button>
          <button type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800">
            <Navigation className="h-3.5 w-3.5 text-slate-500" />
            Directions
          </button>
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c9d8ff] text-[#1E3A8A]">
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
        {onOpenDetails ? (
          <button
            type="button"
            onClick={() => onOpenDetails(business.id)}
            className="mt-3 inline-flex text-xs font-semibold text-[#1E3A8A]"
          >
            View details
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SidebarCard({
  title,
  actionLabel,
  children,
}: {
  title: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[1.35rem] font-bold tracking-[-0.03em] text-slate-950">{title}</div>
        {actionLabel ? <button type="button" className="text-sm font-semibold text-[#1E3A8A]">{actionLabel}</button> : null}
      </div>
      {children}
    </section>
  );
}
