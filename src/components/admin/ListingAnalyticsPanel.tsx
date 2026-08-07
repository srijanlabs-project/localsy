import React, { useMemo } from 'react';
import { BarChart3, Globe2, PhoneCall, Search, TrendingUp } from 'lucide-react';
import type { AdLead, AuditEvent, Business } from '../../types';

type ListingAnalyticsPanelProps = {
  businesses: Business[];
  auditLogs: AuditEvent[];
  adLeads: AdLead[];
};

type ListingMetricRow = {
  id: string;
  name: string;
  localityId: string;
  status: string;
  views: number;
  clicks: number;
  unlocks: number;
  reviews: number;
  leads: number;
  seoImpressions: number;
  seoClicks: number;
  seoLandingPagePath: string;
};

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function normalizeLower(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizeKey(value: unknown) {
  return normalizeLower(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function parseAuditDetails(details: unknown) {
  const raw = normalizeText(details);
  if (!raw) return {} as Record<string, string>;
  return raw
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((acc, segment) => {
      const separatorIndex = segment.indexOf(':');
      if (separatorIndex === -1) return acc;
      const key = normalizeKey(segment.slice(0, separatorIndex));
      const rawValue = segment.slice(separatorIndex + 1).trim();
      if (!key) return acc;
      acc[key] = rawValue.replace(/^"(.*)"$/, '$1').trim();
      return acc;
    }, {} as Record<string, string>);
}

function getDetailValue(details: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = details[normalizeKey(key)];
    if (value) return value;
  }
  return '';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(Math.max(0, Number(value) || 0));
}

function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
}

export default function ListingAnalyticsPanel({
  businesses,
  auditLogs,
  adLeads,
}: ListingAnalyticsPanelProps) {
  const metrics = useMemo(() => {
    const approvedAndManaged = businesses.filter((business) => business.status !== 'pending');
    const metricMap = new Map<string, ListingMetricRow>();
    const businessNameLookup = new Map<string, string>();

    approvedAndManaged.forEach((business) => {
      metricMap.set(business.id, {
        id: business.id,
        name: business.name,
        localityId: business.localityId,
        status: business.status,
        views: 0,
        clicks: 0,
        unlocks: 0,
        reviews: Number(business.reviewCount || 0),
        leads: 0,
        seoImpressions: Math.max(0, Number(business.seoImpressions || 0)),
        seoClicks: Math.max(0, Number(business.seoClicks || 0)),
        seoLandingPagePath: normalizeText(business.seoLandingPagePath),
      });
      businessNameLookup.set(`${normalizeLower(business.name)}::${normalizeLower(business.localityId)}`, business.id);
      businessNameLookup.set(normalizeLower(business.name), business.id);
    });

    auditLogs.forEach((event) => {
      const parsedDetails = parseAuditDetails(event.details);
      const description = normalizeLower(event.description);
      const actionType = normalizeLower(event.actionType);
      let businessId = getDetailValue(parsedDetails, 'listing id', 'listingid', 'business id', 'businessid');

      if (!businessId && description.includes('opened whatsapp intent')) {
        const businessName = getDetailValue(parsedDetails, 'business');
        const localityId = getDetailValue(parsedDetails, 'locality');
        businessId = businessNameLookup.get(`${normalizeLower(businessName)}::${normalizeLower(localityId)}`)
          || businessNameLookup.get(normalizeLower(businessName))
          || '';
      }

      if (!businessId || !metricMap.has(businessId)) return;
      const current = metricMap.get(businessId)!;

      if (description.includes('viewed mobile listing details')) {
        current.views += 1;
      }
      if (description.includes('opened whatsapp intent')) {
        current.clicks += 1;
      }
      if (description.includes('unlocked business contact')) {
        current.unlocks += 1;
        current.clicks += 1;
        current.leads += 1;
      }
      if (actionType === 'contact_view' && description.includes('viewed mobile listing details')) {
        current.clicks += 1;
      }
    });

    adLeads.forEach((lead) => {
      const businessId = normalizeText(lead.sellerBusinessId);
      if (!businessId || !metricMap.has(businessId)) return;
      metricMap.get(businessId)!.leads += 1;
    });

    const rows = Array.from(metricMap.values());
    const totals = rows.reduce((acc, row) => ({
      views: acc.views + row.views,
      clicks: acc.clicks + row.clicks,
      unlocks: acc.unlocks + row.unlocks,
      reviews: acc.reviews + row.reviews,
      leads: acc.leads + row.leads,
      seoImpressions: acc.seoImpressions + row.seoImpressions,
      seoClicks: acc.seoClicks + row.seoClicks,
    }), {
      views: 0,
      clicks: 0,
      unlocks: 0,
      reviews: 0,
      leads: 0,
      seoImpressions: 0,
      seoClicks: 0,
    });

    const topListings = [...rows]
      .sort((left, right) => (
        (right.leads + right.unlocks + right.clicks + right.views) - (left.leads + left.unlocks + left.clicks + left.views)
        || right.reviews - left.reviews
        || left.name.localeCompare(right.name)
      ))
      .slice(0, 8);

    const landingPageMap = new Map<string, { path: string; listings: number; impressions: number; clicks: number }>();
    rows.forEach((row) => {
      const path = normalizeText(row.seoLandingPagePath);
      if (!path) return;
      const current = landingPageMap.get(path) || { path, listings: 0, impressions: 0, clicks: 0 };
      current.listings += 1;
      current.impressions += row.seoImpressions;
      current.clicks += row.seoClicks;
      landingPageMap.set(path, current);
    });
    const topLandingPages = Array.from(landingPageMap.values())
      .sort((left, right) => right.impressions - left.impressions || right.clicks - left.clicks)
      .slice(0, 6);

    const indexedListings = rows.filter((row) => row.seoImpressions > 0 || row.seoClicks > 0).length;
    const routeCoverage = landingPageMap.size;
    const seoCtr = totals.seoImpressions > 0 ? (totals.seoClicks / totals.seoImpressions) * 100 : 0;

    return {
      rows,
      totals,
      topListings,
      topLandingPages,
      indexedListings,
      routeCoverage,
      seoCtr,
    };
  }, [adLeads, auditLogs, businesses]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            Listing Analytics Snapshot
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Audited listing interactions built from contact unlocks, listing detail opens, WhatsApp intents, reviews, and leads.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Views</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.totals.views)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Clicks</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.totals.clicks)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Unlocks</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.totals.unlocks)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Reviews</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.totals.reviews)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Leads</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.totals.leads)}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Listing</th>
                  <th className="px-3 py-2">Views</th>
                  <th className="px-3 py-2">Clicks</th>
                  <th className="px-3 py-2">Unlocks</th>
                  <th className="px-3 py-2">Reviews</th>
                  <th className="px-3 py-2">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.topListings.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">{row.status}</div>
                    </td>
                    <td className="px-3 py-2">{formatNumber(row.views)}</td>
                    <td className="px-3 py-2">{formatNumber(row.clicks)}</td>
                    <td className="px-3 py-2">{formatNumber(row.unlocks)}</td>
                    <td className="px-3 py-2">{formatNumber(row.reviews)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{formatNumber(row.leads)}</td>
                  </tr>
                ))}
                {metrics.topListings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-400">No listing interaction data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            SEO Analytics Snapshot
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Listing-level SEO performance built from stored impressions, clicks, indexed listing presence, and landing page coverage.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Impressions</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.totals.seoImpressions)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Clicks</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.totals.seoClicks)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">CTR</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatPercent(metrics.seoCtr)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Landing Pages</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.routeCoverage)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Indexed Listings</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(metrics.indexedListings)}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Landing Page</th>
                  <th className="px-3 py-2">Listings</th>
                  <th className="px-3 py-2">Impressions</th>
                  <th className="px-3 py-2">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.topLandingPages.map((row) => (
                  <tr key={row.path}>
                    <td className="px-3 py-2 font-medium text-slate-900">{row.path}</td>
                    <td className="px-3 py-2">{formatNumber(row.listings)}</td>
                    <td className="px-3 py-2">{formatNumber(row.impressions)}</td>
                    <td className="px-3 py-2">{formatNumber(row.clicks)}</td>
                  </tr>
                ))}
                {metrics.topLandingPages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">No SEO landing page signals available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><Search className="h-3.5 w-3.5 text-indigo-600" /> Data source</div>
          <div className="mt-1">Listing interactions are derived from auditable runtime events plus verified lead records.</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><PhoneCall className="h-3.5 w-3.5 text-emerald-600" /> Conversion signals</div>
          <div className="mt-1">Unlocks and seller-side lead records are treated as the strongest live conversion proxies in this admin slice.</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><Globe2 className="h-3.5 w-3.5 text-amber-600" /> SEO coverage</div>
          <div className="mt-1">Landing page coverage is counted from listing-level SEO route paths already stored on each business record.</div>
        </div>
      </div>
    </div>
  );
}
