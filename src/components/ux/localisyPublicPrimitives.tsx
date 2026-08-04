import React from 'react';
import {
  ChevronDown,
  CircleDot,
  GraduationCap,
  Grid2x2,
  Landmark,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Phone,
  Pill,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Wrench,
  Dumbbell,
} from 'lucide-react';
import { Business, Category, Locality } from '../../types';

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

export const popularSearches = [
  'Best Restaurants',
  '24x7 Medical',
  'Grocery Stores',
  'Home Tutors',
  'Electricians',
  'Salons',
  'Pest Control',
];

export function getCategoryPresentation(category: Category): { Icon: TileIcon; tone: string } {
  const haystack = `${category.id} ${category.name}`.toLowerCase();
  return categoryIconRules.find((rule) => rule.match.some((token) => haystack.includes(token))) || {
    Icon: Store,
    tone: 'bg-slate-100 text-slate-500',
  };
}

export function formatRating(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '4.5';
}

export function pluralize(count: number, noun: string) {
  return `${count}+ ${noun}`;
}

export function getLocalityContext(activeLocality: Locality | null) {
  const localityLabel = activeLocality?.name.split(',')[0] || 'Roadpali';
  const cityLabel = activeLocality?.name.split(',')[1]?.trim() || 'Navi Mumbai';
  return {
    localityLabel,
    cityLabel,
    fullLocationLabel: `${localityLabel}, ${cityLabel}`,
  };
}

export function ThemePage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="bg-[#FFF5F9] text-[#0D1B2A]">{children}</section>;
}

export function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-[1540px] px-4 pb-10 pt-4 md:px-6 lg:px-8">{children}</div>;
}

export function LocalisyPreviewHeader({
  locationLabel,
  onOpenLivePortal,
}: {
  locationLabel: string;
  onOpenLivePortal: () => void;
}) {
  return (
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
            className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0D1B2A] shadow-sm lg:inline-flex"
          >
            <MapPin className="h-4 w-4 text-slate-500" />
            <span>{locationLabel}</span>
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
  );
}

export function SectionTitle({
  title,
  actionLabel,
}: {
  title: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[2rem] font-black tracking-[-0.04em] text-slate-950">{title}</h2>
      {actionLabel ? <button type="button" className="text-sm font-semibold text-[#1E3A8A]">{actionLabel}</button> : null}
    </div>
  );
}

export function StatItem({
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

export function SidebarCard({
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

export function FeaturedBusinessCard({
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

export function CategoryChip({
  category,
  count,
  onClick,
}: {
  category: Category;
  count?: number;
  onClick?: (categoryId: string) => void;
}) {
  const { Icon, tone } = getCategoryPresentation(category);

  return (
    <button
      type="button"
      onClick={() => onClick?.(category.id)}
      className="rounded-[22px] border border-slate-200 bg-white px-3 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm font-bold text-slate-900">{category.name}</div>
      {typeof count === 'number' ? <div className="mt-1 text-xs text-slate-500">{count}+</div> : null}
    </button>
  );
}

export function MoreCategoryChip() {
  return (
    <button
      type="button"
      className="rounded-[22px] border border-slate-200 bg-white px-3 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <MoreHorizontal className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm font-bold text-slate-900">More Categories</div>
      <div className="mt-1 text-xs text-slate-500">Explore</div>
    </button>
  );
}
