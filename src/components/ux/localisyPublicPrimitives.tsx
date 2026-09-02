import React from 'react';
import {
  Briefcase,
  Building2,
  Car,
  ChevronDown,
  CircleDot,
  Factory,
  GraduationCap,
  Grid2x2,
  Hammer,
  Landmark,
  Laptop,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  PartyPopper,
  PawPrint,
  Phone,
  Pill,
  Plane,
  Scissors,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sprout,
  Star,
  Stethoscope,
  Store,
  Ticket,
  UtensilsCrossed,
  Wrench,
  Dumbbell,
} from 'lucide-react';
import { Business, Category, Locality } from '../../types';
import { resolveMasterCategoryId } from '../../categoryMaster';

type TileIcon = React.ComponentType<{ className?: string }>;

// Tinted-fill icon tones built from the Localisy token palette (design-language.md §3, §7.3) —
// pale token backgrounds with a token-derived icon color, no invented accent hues.
//
// Keyed by the canonical business-taxonomy category id (see shared/businessTaxonomySeed.js) so
// every one of the 19 real top-level categories gets its own correct, distinct icon — matching
// only by keyword caused real collisions (e.g. "Event Services", "Financial Services", and
// "Government & Public Services" all contain the word "service" and were falling into a generic
// repair/plumbing icon that had nothing to do with them).
const CATEGORY_ID_PRESENTATION: Record<string, { Icon: TileIcon; tone: string }> = {
  'food-restaurants': { Icon: UtensilsCrossed, tone: 'bg-[#FFF7DB] text-[#0D1B2A]' },
  'health-medical': { Icon: Stethoscope, tone: 'bg-[#FFF5F9] text-[#0D1B2A]' },
  'beauty-wellness': { Icon: Scissors, tone: 'bg-[#FFF5F9] text-[#BE185D]' },
  'home-services': { Icon: Wrench, tone: 'bg-[#EAF2FF] text-[#1E3A8A]' },
  automotive: { Icon: Car, tone: 'bg-slate-100 text-[#0D1B2A]' },
  'real-estate': { Icon: Building2, tone: 'bg-[#EAF2FF] text-[#3B82F6]' },
  'education-training': { Icon: GraduationCap, tone: 'bg-[#EAF2FF] text-[#3B82F6]' },
  'shopping-retail': { Icon: ShoppingBag, tone: 'bg-[#EAF2FF] text-[#1E3A8A]' },
  'professional-services': { Icon: Briefcase, tone: 'bg-slate-100 text-[#0D1B2A]' },
  'travel-hospitality': { Icon: Plane, tone: 'bg-[#EAF2FF] text-[#3B82F6]' },
  'event-services': { Icon: PartyPopper, tone: 'bg-[#FFF5F9] text-[#BE185D]' },
  'repair-maintenance': { Icon: Hammer, tone: 'bg-slate-100 text-[#64748B]' },
  'financial-services': { Icon: Landmark, tone: 'bg-[#EAF2FF] text-[#1E3A8A]' },
  'pets-animals': { Icon: PawPrint, tone: 'bg-[#FFF7DB] text-[#0D1B2A]' },
  'industrial-b2b': { Icon: Factory, tone: 'bg-slate-100 text-[#64748B]' },
  agriculture: { Icon: Sprout, tone: 'bg-[#FFF7DB] text-[#0D1B2A]' },
  'entertainment-leisure': { Icon: Ticket, tone: 'bg-[#FFF5F9] text-[#BE185D]' },
  'digital-technology': { Icon: Laptop, tone: 'bg-[#EAF2FF] text-[#3B82F6]' },
  'government-public-services': { Icon: ShieldCheck, tone: 'bg-slate-100 text-[#0D1B2A]' },
};

// Fallback for any category id outside the known master list (custom/imported categories) —
// intentionally narrower than a plain "service" keyword, which caused the collisions above.
const categoryIconRules: Array<{ match: string[]; Icon: TileIcon; tone: string }> = [
  { match: ['restaurant', 'food', 'cafe', 'bakery'], Icon: UtensilsCrossed, tone: 'bg-[#FFF7DB] text-[#0D1B2A]' },
  { match: ['grocery', 'supermarket', 'mart'], Icon: ShoppingCart, tone: 'bg-[#EAF2FF] text-[#1E3A8A]' },
  { match: ['hospital', 'doctor', 'clinic', 'medical', 'health'], Icon: Stethoscope, tone: 'bg-[#FFF5F9] text-[#0D1B2A]' },
  { match: ['beauty', 'wellness', 'salon', 'spa', 'parlour'], Icon: Scissors, tone: 'bg-[#FFF5F9] text-[#BE185D]' },
  { match: ['school', 'tuition', 'education'], Icon: GraduationCap, tone: 'bg-[#EAF2FF] text-[#3B82F6]' },
  { match: ['pharmacy', 'chemist'], Icon: Pill, tone: 'bg-slate-100 text-[#64748B]' },
  { match: ['bank', 'finance', 'atm'], Icon: Landmark, tone: 'bg-[#EAF2FF] text-[#1E3A8A]' },
  { match: ['gym', 'fitness'], Icon: Dumbbell, tone: 'bg-[#FFF7DB] text-[#0D1B2A]' },
  { match: ['professional', 'consult', 'legal', 'account'], Icon: Briefcase, tone: 'bg-slate-100 text-[#0D1B2A]' },
  { match: ['shopping', 'retail', 'store', 'mall'], Icon: ShoppingBag, tone: 'bg-[#EAF2FF] text-[#3B82F6]' },
  { match: ['repair', 'electric', 'plumber', 'ac repair'], Icon: Wrench, tone: 'bg-[#EAF2FF] text-[#1E3A8A]' },
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
  const resolvedId = resolveMasterCategoryId(category.id);
  const byId = CATEGORY_ID_PRESENTATION[resolvedId] || CATEGORY_ID_PRESENTATION[category.id];
  if (byId) return byId;

  const haystack = `${category.id} ${category.name}`.toLowerCase();
  return categoryIconRules.find((rule) => rule.match.some((token) => haystack.includes(token))) || {
    Icon: Store,
    tone: 'bg-slate-100 text-slate-500',
  };
}

// Some category sources store a raw slug ("professional-services") instead of a display
// name. Humanize it at render time rather than relying on upstream data being clean.
export function formatCategoryLabel(name: string): string {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'Category';
  const looksLikeSlug = /[-_]/.test(trimmed) && !/\s/.test(trimmed);
  if (!looksLikeSlug) return trimmed;
  return trimmed
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
    <header className="rounded-[20px] border border-slate-200 bg-white px-5 py-3.5 shadow-[0_2px_4px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0D1B2A] text-[#FFD54F]">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="text-[19px] font-bold tracking-[-0.02em] text-[#0D1B2A]">Localisy</div>
          </div>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#0D1B2A] lg:inline-flex"
          >
            <MapPin className="h-3.5 w-3.5 text-[#64748B]" />
            <span>{locationLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-1 items-center gap-3 lg:max-w-[640px]">
          <div className="flex h-11 flex-1 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="truncate text-sm text-slate-400">Search for restaurants, doctors, groceries, salons and more...</span>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#0D1B2A] text-[#FFD54F] transition hover:bg-[#132845]"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="hidden items-center gap-1.5 text-sm font-semibold text-[#0D1B2A] md:inline-flex">
            <Grid2x2 className="h-4 w-4 text-[#64748B]" />
            <span>Categories</span>
          </button>
          <button
            type="button"
            onClick={onOpenLivePortal}
            className="hidden rounded-[10px] border border-[#FFD54F] bg-[#FFF7DB] px-3.5 py-2.5 text-sm font-semibold text-[#0D1B2A] transition hover:bg-[#FFF1BF] md:inline-flex"
          >
            List Your Business
          </button>
          <button type="button" className="hidden items-center gap-1.5 text-sm font-semibold text-[#0D1B2A] md:inline-flex">
            <CircleDot className="h-4 w-4 text-[#64748B]" />
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
      <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">{title}</h2>
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
    ? 'bg-[#FFF7DB] text-[#B45309]'
    : highlight === 'verified'
      ? 'bg-[#eef8f1] text-[#1b8f5f]'
      : 'bg-[#EAF2FF] text-[#1E3A8A]';

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
        <div className="text-[20px] font-bold tracking-[-0.01em] text-[#0D1B2A]">
          {highlight ? value : value.split('+')[0]}
          {!highlight && value.includes('+') ? '+' : ''}
        </div>
        <div className="text-xs text-[#64748B]">{label}</div>
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
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[17px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">{title}</div>
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
    <article className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_2px_4px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
      <div className="relative h-36 overflow-hidden">
        <img src={image} alt={business.name} className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3 rounded-full bg-[#FFF7DB] px-3 py-1 text-xs font-semibold text-[#0D1B2A]">
          Open
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenDetails?.(business.id)}
            className="text-left text-base font-semibold text-[#0D1B2A] transition hover:text-[#1E3A8A]"
          >
            {business.name}
          </button>
          <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#0D1B2A]">
            <Star className="h-3.5 w-3.5 fill-[#FFD54F] text-[#FFD54F]" />
            <span>{formatRating(business.rating)}</span>
            <span className="text-xs text-slate-400">({business.reviewCount})</span>
          </div>
        </div>
        <div className="mt-1 text-sm text-[#64748B]">{business.sourceSubcategoryLabel || business.sourceCategoryLabel || 'Trusted local business'}</div>
        <div className="mt-3 flex items-center gap-1 text-xs text-[#64748B]">
          <MapPin className="h-3.5 w-3.5" />
          <span>{localityLabel}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0D1B2A]">
            <Phone className="h-3.5 w-3.5 text-[#1E3A8A]" />
            Call
          </button>
          <button type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-[#64748B]">
            <Navigation className="h-3.5 w-3.5 text-[#64748B]" />
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
  const label = formatCategoryLabel(category.name);

  return (
    <button
      type="button"
      onClick={() => onClick?.(category.id)}
      className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-[0_2px_4px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#3B82F6] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
    >
      <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="whitespace-nowrap text-sm font-semibold text-[#0D1B2A]">{label}</span>
      {typeof count === 'number' ? <span className="text-xs text-[#64748B]">{count}+</span> : null}
    </button>
  );
}

export function MoreCategoryChip() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-[0_2px_4px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#3B82F6] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
    >
      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#64748B]">
        <MoreHorizontal className="h-4 w-4" />
      </span>
      <span className="whitespace-nowrap text-sm font-semibold text-[#0D1B2A]">More Categories</span>
    </button>
  );
}
