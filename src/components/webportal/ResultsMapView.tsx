import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Business } from '../../types';

type ResultsMapViewProps = {
  businesses: Business[];
  selectedLocalityName: string;
  activeBusinessId: string | null;
  onSetActiveBusinessId: (businessId: string) => void;
  projectSearchResultMapPoint: (business: Business) => { x: number; y: number };
  openBusinessDetails: (business: Business) => void;
  openBusinessDirections: (business: Business) => void;
  renderBusinessRecognitionBadges: (business: Business, compact?: boolean) => React.ReactNode;
  getBusinessSubcategoryLabel: (business: Business) => string;
};

export default function ResultsMapView({
  businesses,
  selectedLocalityName,
  activeBusinessId,
  onSetActiveBusinessId,
  projectSearchResultMapPoint,
  openBusinessDetails,
  openBusinessDirections,
  renderBusinessRecognitionBadges,
  getBusinessSubcategoryLabel,
}: ResultsMapViewProps) {
  const activeBusiness = businesses.find((business) => business.id === activeBusinessId) || businesses[0] || null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Locality Map View</p>
              <p className="text-xs text-slate-500">Clickable pins for listings on this page</p>
            </div>
            {activeBusiness && (
              <button
                type="button"
                onClick={() => openBusinessDirections(activeBusiness)}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Directions</span>
              </button>
            )}
          </div>
        </div>
        <div className="relative h-[420px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(135deg,#eff6ff_0%,#ffffff_38%,#ecfdf5_100%)]">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.14) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {businesses.map((business, index) => {
            const point = projectSearchResultMapPoint(business);
            const active = business.id === activeBusiness?.id;
            return (
              <button
                key={`map-${business.id}`}
                type="button"
                onMouseEnter={() => onSetActiveBusinessId(business.id)}
                onClick={() => onSetActiveBusinessId(business.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition ${active ? 'z-20 scale-110' : 'z-10 hover:scale-105'}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg ${
                    active ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-white bg-indigo-600 text-white'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </span>
                <span
                  className={`mt-1 block max-w-[160px] rounded-full px-2 py-1 text-[10px] font-bold shadow ${
                    active ? 'bg-white text-emerald-700' : 'bg-white/90 text-slate-700'
                  }`}
                >
                  {index + 1}. {business.name}
                </span>
              </button>
            );
          })}
          <div className="absolute bottom-4 left-4 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-[11px] text-slate-600 shadow backdrop-blur">
            <div className="font-semibold text-slate-800">{selectedLocalityName}</div>
            <div>{businesses.length} mapped businesses on this page</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {businesses.map((business) => {
          const active = business.id === activeBusiness?.id;
          return (
            <button
              key={`map-list-${business.id}`}
              type="button"
              onMouseEnter={() => onSetActiveBusinessId(business.id)}
              onClick={() => openBusinessDetails(business)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active ? 'border-emerald-300 bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">{business.name}</div>
                  <div className="mt-1 truncate text-xs font-medium text-slate-500">{getBusinessSubcategoryLabel(business)}</div>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                  {business.rating.toFixed(1)}
                </span>
              </div>
              <div className="mt-3 text-xs leading-5 text-slate-600">{business.address}</div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">{renderBusinessRecognitionBadges(business, true)}</div>
                <span className="text-[11px] font-semibold text-indigo-600">Open listing</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
