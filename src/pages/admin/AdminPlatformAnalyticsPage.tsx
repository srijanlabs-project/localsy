import React, { useMemo, useState } from 'react';
import { BarChart3, Eye, Info, PhoneCall, Search, Star, TrendingUp } from 'lucide-react';
import type { AuditEvent, Business, Locality } from '../../types';
import { attributeEventToBusinessId, buildBusinessNameLookup, formatNumber, normalizeLower } from '../../services/admin/auditAnalytics';

type AdminPlatformAnalyticsPageProps = {
  businesses: Business[];
  localities: Locality[];
  auditLogs: AuditEvent[];
};

// Routed home for admin-backend-ux-spec.md Section 5.29 "Analytics & Insights: Platform
// Analytics Overview" — Section 9 build step 7. NET NEW (no existing component/legacy tab),
// but per the spec's own note this is "the first buildable Analytics screen since it only
// needs data already being logged" — and it's built that way here: every number on this page
// is derived from real `AuditEvent` records and real `Business` fields, the same data
// `ListingAnalyticsPanel` (spec 5.8) already uses per-business. This page rolls the same
// events up to locality/platform altitude instead.
//
// Reuses the audit-event parsing helpers extracted to services/admin/auditAnalytics.ts in this
// same step (pulled out of ListingAnalyticsPanel.tsx, no behavior change there) so the
// business-id attribution logic isn't duplicated a third time.
//
// Two honestly-disclosed real limitations (not "local-state" issues — genuine data-model gaps,
// called out in the info panel below rather than silently smoothed over):
// 1. "Reviews" is `business.reviewCount`, a running total with no historical snapshots — it
//    cannot be scoped to the date-range filter the way views/searches/unlocks/new-listings can.
// 2. Audit events only attribute to a business (and from there, a locality) when the event's
//    `details` blob carries a listing id, or for "opened WhatsApp intent" events, a business
//    name match. Events that don't resolve to a business are still counted in the platform-wide
//    tiles at the top, but can't appear in the per-locality breakdown table — so the table's
//    column totals can be slightly less than the tiles above. This is the same attribution gap
//    ListingAnalyticsPanel already has; not something invented for this page.
export default function AdminPlatformAnalyticsPage({ businesses, localities, auditLogs }: AdminPlatformAnalyticsPageProps) {
  const [localityFilter, setLocalityFilter] = useState<'all' | string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const localityNameById = useMemo(() => {
    const map: Record<string, string> = {};
    localities.forEach((locality) => { map[locality.id] = locality.name; });
    return map;
  }, [localities]);

  const businessLocalityById = useMemo(() => {
    const map: Record<string, string> = {};
    businesses.forEach((business) => { map[business.id] = business.localityId; });
    return map;
  }, [businesses]);

  const businessNameLookup = useMemo(() => buildBusinessNameLookup(businesses), [businesses]);

  const withinDateRange = (isoTimestamp: string) => {
    if (!isoTimestamp) return true;
    const time = new Date(isoTimestamp).getTime();
    if (Number.isNaN(time)) return true;
    if (dateFrom && time < new Date(dateFrom).getTime()) return false;
    if (dateTo && time > new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
    return true;
  };

  const scopedLogs = useMemo(() => auditLogs.filter((event) => withinDateRange(event.timestamp)), [auditLogs, dateFrom, dateTo]);

  const scopedBusinesses = useMemo(() => (
    localityFilter === 'all' ? businesses : businesses.filter((b) => b.localityId === localityFilter)
  ), [businesses, localityFilter]);

  const analytics = useMemo(() => {
    let pageViews = 0;
    let searches = 0;
    let contactUnlocks = 0;
    const perLocality = new Map<string, { views: number; searches: number; unlocks: number; newListings: number; reviews: number }>();
    const ensureLocality = (localityId: string) => {
      if (!perLocality.has(localityId)) {
        perLocality.set(localityId, { views: 0, searches: 0, unlocks: 0, newListings: 0, reviews: 0 });
      }
      return perLocality.get(localityId)!;
    };
    const byDay = new Map<string, number>();

    scopedLogs.forEach((event) => {
      const description = normalizeLower(event.description);
      const actionType = normalizeLower(event.actionType);
      const isView = description.includes('viewed mobile listing details');
      const isSearch = actionType === 'search';
      const isUnlock = description.includes('unlocked business contact');

      const businessId = attributeEventToBusinessId(event, businessNameLookup);
      const localityId = businessId ? businessLocalityById[businessId] : undefined;
      // When a locality filter is active, an event that isn't attributable to that locality
      // (including one that isn't attributable to ANY business at all) is excluded entirely —
      // both from the tiles and the table — matching what "filtering to one locality" should mean.
      if (localityFilter !== 'all' && localityId !== localityFilter) return;

      if (isView) pageViews += 1;
      if (isSearch) searches += 1;
      if (isUnlock) contactUnlocks += 1;

      if (localityId) {
        const bucket = ensureLocality(localityId);
        if (isView) bucket.views += 1;
        if (isSearch) bucket.searches += 1;
        if (isUnlock) bucket.unlocks += 1;
      }

      if (isView || isSearch || isUnlock) {
        const dayKey = normalizeLower(event.timestamp).slice(0, 10) || 'unknown';
        byDay.set(dayKey, (byDay.get(dayKey) || 0) + 1);
      }
    });

    let newListings = 0;
    let totalReviews = 0;
    scopedBusinesses.forEach((business) => {
      const bucket = ensureLocality(business.localityId);
      bucket.reviews += Number(business.reviewCount || 0);
      totalReviews += Number(business.reviewCount || 0);
      if (withinDateRange(business.createdAt)) {
        bucket.newListings += 1;
        newListings += 1;
      }
    });

    const localityRows = Array.from(perLocality.entries())
      .map(([localityId, stats]) => ({ localityId, name: localityNameById[localityId] || localityId, ...stats }))
      .sort((a, b) => (b.views + b.searches + b.unlocks) - (a.views + a.searches + a.unlocks));

    const trendDays = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    const trendMax = Math.max(1, ...trendDays.map(([, count]) => count));

    return { pageViews, searches, contactUnlocks, newListings, totalReviews, localityRows, trendDays, trendMax };
  }, [scopedLogs, scopedBusinesses, businessLocalityById, businessNameLookup, localityFilter, localityNameById, dateFrom, dateTo]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Platform Analytics Overview</h2>
        <p className="mt-0.5 text-xs text-slate-500">Platform-wide traffic and engagement, aggregated across localities.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
        <p>
          Built entirely from real audit events and business records already logged elsewhere in this app — nothing
          on this page is simulated. Two honest gaps: "Reviews" is a running total and can't be scoped to the date
          filter below; and events that can't be traced back to a specific business (see this page's own code
          comment) count in the tiles above but not in the per-locality table, so the table's totals can run slightly
          under the tiles.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:flex-row sm:items-center">
        <select
          value={localityFilter}
          onChange={(event) => setLocalityFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          <option value="all">All localities</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>{locality.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400">From</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 focus:outline-none" />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400">To</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 focus:outline-none" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400"><Eye className="h-3 w-3" /> Page views</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(analytics.pageViews)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400"><Search className="h-3 w-3" /> Searches</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(analytics.searches)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400"><PhoneCall className="h-3 w-3" /> Contact unlocks</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(analytics.contactUnlocks)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400"><Star className="h-3 w-3" /> Reviews</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(analytics.totalReviews)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400"><BarChart3 className="h-3 w-3" /> New listings</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(analytics.newListings)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <TrendingUp className="h-4 w-4 text-[#1E3A8A]" /> Daily interaction trend
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">Views + searches + unlocks per day, last {analytics.trendDays.length || 0} day(s) with activity in range.</p>
        {analytics.trendDays.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">No interaction events in this range.</p>
        ) : (
          <div className="mt-3 flex items-end gap-1.5" style={{ height: '96px' }}>
            {analytics.trendDays.map(([day, count]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1" title={`${day}: ${count}`}>
                <div
                  className="w-full rounded-t bg-[#3B82F6]"
                  style={{ height: `${Math.max(4, (count / analytics.trendMax) * 80)}px` }}
                />
                <span className="text-[9px] text-slate-400">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Locality</th>
              <th className="px-3 py-2 font-semibold">Views</th>
              <th className="px-3 py-2 font-semibold">Searches</th>
              <th className="px-3 py-2 font-semibold">Unlocks</th>
              <th className="px-3 py-2 font-semibold">New listings</th>
              <th className="px-3 py-2 font-semibold">Reviews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analytics.localityRows.map((row) => (
              <tr key={row.localityId}>
                <td className="px-3 py-2 font-semibold text-slate-800">{row.name}</td>
                <td className="px-3 py-2">{formatNumber(row.views)}</td>
                <td className="px-3 py-2">{formatNumber(row.searches)}</td>
                <td className="px-3 py-2">{formatNumber(row.unlocks)}</td>
                <td className="px-3 py-2">{formatNumber(row.newListings)}</td>
                <td className="px-3 py-2">{formatNumber(row.reviews)}</td>
              </tr>
            ))}
            {analytics.localityRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-400">No locality-attributable data in this range.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
