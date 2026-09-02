import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, Globe2, Info, Plus, Trash2 } from 'lucide-react';
import type { Business, Locality } from '../../types';
import { formatNumber, formatPercent, normalizeText } from '../../services/admin/auditAnalytics';

type AdminSeoPerformancePageProps = {
  businesses: Business[];
  localities: Locality[];
};

// Routed home for admin-backend-ux-spec.md Section 5.31 "Analytics & Insights: SEO Performance"
// — Section 9 build step 7. NET NEW, no legacy tab, but MOSTLY real: indexed-page count, top
// landing pages, impressions/clicks/CTR are all aggregated from the real `seoImpressions`/
// `seoClicks`/`seoLandingPagePath` fields already stored on `Business` records (the same fields
// `ListingAnalyticsPanel`'s SEO panel already uses) — nothing there is fabricated.
//
// One piece is honestly NOT real, disclosed in its own banner rather than faked: the spec's
// "sitemap submission history and status" and "trigger submission" action. There is no
// submission-history data model anywhere in this app (confirmed: no "sitemap" hits in
// types.ts), and the actual sitemap submission is a Node script
// (`npm run seo:submit-sitemaps`, package.json) that only runs from a terminal/CI — a browser
// admin screen cannot invoke it. So this page offers a manual, local-only "submission log"
// (localStorage-persisted, same pattern as the Role Builder/User Directory pages) for someone to
// jot down when they ran the script and what happened — it is a notebook, not a tracker, and
// doesn't pretend to run or monitor the script itself.
type LocalSitemapLogEntry = {
  id: string;
  note: string;
  loggedAt: string;
};

const STORAGE_KEY = 'localsy_admin_sitemap_log_v1';

const loadStoredLog = (): LocalSitemapLogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalSitemapLogEntry[]) : [];
  } catch {
    return [];
  }
};

let logIdCounter = 0;
const buildLogId = () => {
  logIdCounter += 1;
  return `sitemap_log_${logIdCounter}`;
};

export default function AdminSeoPerformancePage({ businesses, localities }: AdminSeoPerformancePageProps) {
  const [localityFilter, setLocalityFilter] = useState<'all' | string>('all');
  const [logEntries, setLogEntries] = useState<LocalSitemapLogEntry[]>(() => loadStoredLog());
  const [newLogNote, setNewLogNote] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logEntries));
    } catch {
      // Best-effort persistence only.
    }
  }, [logEntries]);

  const scopedBusinesses = useMemo(() => (
    localityFilter === 'all' ? businesses : businesses.filter((b) => b.localityId === localityFilter)
  ), [businesses, localityFilter]);

  const seoMetrics = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    const landingPageMap = new Map<string, { path: string; listings: number; impressions: number; clicks: number }>();

    scopedBusinesses.forEach((business) => {
      const impressions = Math.max(0, Number(business.seoImpressions || 0));
      const clicks = Math.max(0, Number(business.seoClicks || 0));
      totalImpressions += impressions;
      totalClicks += clicks;
      const path = normalizeText(business.seoLandingPagePath);
      if (!path) return;
      const current = landingPageMap.get(path) || { path, listings: 0, impressions: 0, clicks: 0 };
      current.listings += 1;
      current.impressions += impressions;
      current.clicks += clicks;
      landingPageMap.set(path, current);
    });

    const topLandingPages = Array.from(landingPageMap.values())
      .sort((left, right) => right.impressions - left.impressions || right.clicks - left.clicks)
      .slice(0, 10);

    const indexedListings = scopedBusinesses.filter((b) => Number(b.seoImpressions || 0) > 0 || Number(b.seoClicks || 0) > 0).length;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return { totalImpressions, totalClicks, ctr, indexedListings, routeCoverage: landingPageMap.size, topLandingPages };
  }, [scopedBusinesses]);

  const handleAddLogEntry = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newLogNote.trim()) return;
    setLogEntries((prev) => [{ id: buildLogId(), note: newLogNote.trim(), loggedAt: new Date().toISOString() }, ...prev]);
    setNewLogNote('');
  };

  const removeLogEntry = (id: string) => {
    setLogEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">SEO Performance</h2>
        <p className="mt-0.5 text-xs text-slate-500">Monitor organic performance — the reporting counterpart to SEO Discovery's defaults.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
        <p>
          Impressions, clicks, CTR, and landing-page coverage below are real — aggregated from the same SEO fields
          already stored on each business record. There's no organic-traffic time series stored anywhere, so this is
          a current snapshot rather than a trend line.
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
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Impressions</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(seoMetrics.totalImpressions)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Clicks</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(seoMetrics.totalClicks)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">CTR</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatPercent(seoMetrics.ctr)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Landing pages</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(seoMetrics.routeCoverage)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Indexed listings</div>
          <div className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(seoMetrics.indexedListings)}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-800">
          <Globe2 className="h-3.5 w-3.5 text-[#1E3A8A]" /> Top landing pages
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Path</th>
              <th className="px-3 py-2 font-semibold">Listings</th>
              <th className="px-3 py-2 font-semibold">Impressions</th>
              <th className="px-3 py-2 font-semibold">Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {seoMetrics.topLandingPages.map((row) => (
              <tr key={row.path}>
                <td className="px-3 py-2 font-medium text-slate-800">{row.path}</td>
                <td className="px-3 py-2">{formatNumber(row.listings)}</td>
                <td className="px-3 py-2">{formatNumber(row.impressions)}</td>
                <td className="px-3 py-2">{formatNumber(row.clicks)}</td>
              </tr>
            ))}
            {seoMetrics.topLandingPages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">No SEO landing page signals in this scope.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            <span className="font-semibold">Sitemap submission history isn't tracked by the app.</span> Sitemaps are
            submitted by running <code>npm run seo:submit-sitemaps</code> from a terminal/CI — this page can't invoke
            that script or see its results. The log below is a manual, local-only notebook for jotting down when it
            was last run, not a real status tracker.
          </p>
        </div>
        <form onSubmit={handleAddLogEntry} className="mt-2 flex gap-2">
          <input
            value={newLogNote}
            onChange={(event) => setNewLogNote(event.target.value)}
            placeholder="e.g. Ran seo:submit-sitemaps for all localities, no errors"
            className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
          />
          <button type="submit" className="flex items-center gap-1 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3B82F6]">
            <Plus className="h-3.5 w-3.5" /> Log entry
          </button>
        </form>
        {logEntries.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {logEntries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-[11px] text-amber-900">
                <span className="flex items-start gap-1.5">
                  <FileText className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>
                    {entry.note}
                    <span className="ml-1.5 text-[10px] text-amber-600">{new Date(entry.loggedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </span>
                <button type="button" onClick={() => removeLogEntry(entry.id)}>
                  <Trash2 className="h-3 w-3 text-amber-400 hover:text-rose-600" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
