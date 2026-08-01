import React from 'react';
import { Compass, MapPin } from 'lucide-react';
import { Business } from '../../types';

type SuggestedCategory = {
  category: {
    id: string;
    name: string;
  };
  listingCount: number;
};

type NearbyLocality = {
  id: string;
  name: string;
};

type NoResultsStateProps = {
  noResultsSuggestedCategories: SuggestedCategory[];
  nearbyCityLocalities: NearbyLocality[];
  noResultsFallbackBusinesses: Business[];
  openResultsForCategory: (categoryId: string, subcategoryId?: string) => void;
  onLocalityChange: (localityId: string) => void;
  openBusinessDetails: (business: Business) => void;
  renderCompactBusinessRow: (
    business: Business,
    options?: {
      highlightClass?: string;
      badgeLabel?: string;
      badgeClassName?: string;
      showImage?: boolean;
    }
  ) => React.ReactNode;
  shouldShowListingResultImage: (business: Business) => boolean;
  getBusinessSubcategoryLabel: (business: Business) => string;
  renderBusinessRecognitionBadges: (business: Business, compact?: boolean) => React.ReactNode;
};

export default function NoResultsState({
  noResultsSuggestedCategories,
  nearbyCityLocalities,
  noResultsFallbackBusinesses,
  openResultsForCategory,
  onLocalityChange,
  openBusinessDetails,
  renderCompactBusinessRow,
  shouldShowListingResultImage,
  getBusinessSubcategoryLabel,
  renderBusinessRecognitionBadges,
}: NoResultsStateProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-dashed border-slate-200 bg-white p-6 md:p-8">
      <div className="text-center">
        <Compass className="mx-auto mb-3 h-12 w-12 animate-spin text-slate-300" style={{ animationDuration: '6s' }} />
        <p className="text-base font-bold text-slate-850">No verified businesses found for this search</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
          Try a broader keyword, switch locality, or jump into one of the suggested categories below.
        </p>
      </div>

      {noResultsSuggestedCategories.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Suggested Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {noResultsSuggestedCategories.map(({ category, listingCount }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => openResultsForCategory(category.id)}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <span>{category.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-indigo-500">
                  {listingCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {nearbyCityLocalities.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Explore Nearby Localities
          </p>
          <div className="flex flex-wrap gap-2">
            {nearbyCityLocalities.slice(0, 4).map((locality) => (
              <button
                key={locality.id}
                type="button"
                onClick={() => onLocalityChange(locality.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>{locality.name.split(',')[0] || locality.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {noResultsFallbackBusinesses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Recommended Instead
            </p>
            <span className="text-[11px] font-medium text-slate-400">
              Based on trust and locality relevance
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {noResultsFallbackBusinesses.map((business) => (
              <div key={`fallback-${business.id}`} className="min-w-0">
                {renderCompactBusinessRow(business, { showImage: shouldShowListingResultImage(business) })}
                <button
                  type="button"
                  onClick={() => openBusinessDetails(business)}
                  className="hidden w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 md:block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{business.name}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{getBusinessSubcategoryLabel(business)}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                      {business.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{business.description}</div>
                  <div className="mt-3">{renderBusinessRecognitionBadges(business, true)}</div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
