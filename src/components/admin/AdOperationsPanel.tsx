import React, { useMemo, useState } from 'react';
import { AlertCircle, BarChart3, CheckSquare2, PauseCircle, PlayCircle, TrendingUp, Wallet } from 'lucide-react';
import type { Business, ListingAd, Locality } from '../../types';
import { getCategoryById } from '../../categoryMaster';

type AdPerformanceSummary = {
  plannedBudget: number;
  spentBudget: number;
  impressions: number;
  clicks: number;
  leads: number;
};

type AdOperationsPanelProps = {
  localities: Locality[];
  filteredBusinesses: Business[];
  filteredListingAds: ListingAd[];
  pendingReviewAds: ListingAd[];
  prioritizedPendingReviewAds: ListingAd[];
  liveOrApprovedAds: ListingAd[];
  rejectedAds: ListingAd[];
  adPerformanceSummary: AdPerformanceSummary;
  currentAdminDateIso: string;
  getAdCtr: (ad: ListingAd) => number;
  getAdCpl: (ad: ListingAd) => number;
  getDerivedAdLeadCount: (ad: ListingAd) => number;
  getAdOpsPriorityScore: (ad: ListingAd) => number;
  getAdOpsSlaLabel: (ad: ListingAd) => string;
  onBeginEditListingAd: (ad: ListingAd) => void;
  onTransitionAd: (
    ad: ListingAd,
    nextStatus: NonNullable<ListingAd['workflowStatus']>,
    options?: { reason?: string; deactivate?: boolean }
  ) => void;
  onReviewRequest: (ad: ListingAd) => void;
  onRejectAd: (ad: ListingAd) => void;
  onDeleteAd: (adId: string) => void;
  onUpdateAd: (ad: ListingAd) => void;
};

type AdPriorityFilter = 'all' | 'critical' | 'due' | 'soon' | 'fresh';
type AdWorkflowFilter = 'all' | 'review' | 'live' | 'paused' | 'rejected';
type AnalyticsRange = '7d' | '30d' | '90d' | 'all';

const formatInr = (value: number) => `Rs ${Math.round(value)}`;
const MS_PER_DAY = 86400000;

const getSafeDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAdActivityDate = (ad: ListingAd) => ad.reviewedAt || ad.submittedAt || ad.startDate || ad.endDate;

export default function AdOperationsPanel({
  localities,
  filteredBusinesses,
  filteredListingAds,
  pendingReviewAds,
  prioritizedPendingReviewAds,
  liveOrApprovedAds,
  rejectedAds,
  adPerformanceSummary,
  currentAdminDateIso,
  getAdCtr,
  getAdCpl,
  getDerivedAdLeadCount,
  getAdOpsPriorityScore,
  getAdOpsSlaLabel,
  onBeginEditListingAd,
  onTransitionAd,
  onReviewRequest,
  onRejectAd,
  onDeleteAd,
  onUpdateAd,
}: AdOperationsPanelProps) {
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [workflowFilter, setWorkflowFilter] = useState<AdWorkflowFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<AdPriorityFilter>('all');
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('30d');

  const analyticsAds = useMemo(() => {
    if (analyticsRange === 'all') return filteredListingAds;
    const currentDate = getSafeDate(currentAdminDateIso) || new Date();
    const windowDays = analyticsRange === '7d' ? 7 : analyticsRange === '30d' ? 30 : 90;
    return filteredListingAds.filter((ad) => {
      const activityDate = getSafeDate(getAdActivityDate(ad));
      if (!activityDate) return false;
      const ageDays = (currentDate.getTime() - activityDate.getTime()) / MS_PER_DAY;
      return ageDays >= 0 && ageDays <= windowDays;
    });
  }, [analyticsRange, currentAdminDateIso, filteredListingAds]);

  const visibleAds = useMemo(() => (
    filteredListingAds.filter((ad) => {
      if (workflowFilter === 'review') return ['submitted', 'under_review'].includes(ad.workflowStatus || 'draft');
      if (workflowFilter === 'live') return ['approved', 'scheduled', 'live'].includes(ad.workflowStatus || 'draft');
      if (workflowFilter === 'paused') return ad.workflowStatus === 'paused';
      if (workflowFilter === 'rejected') return ad.workflowStatus === 'rejected';
      return true;
    }).filter((ad) => {
      const sla = getAdOpsSlaLabel(ad);
      if (priorityFilter === 'critical') return sla === 'Critical SLA';
      if (priorityFilter === 'due') return sla === 'Due Today';
      if (priorityFilter === 'soon') return sla === 'Review Soon';
      if (priorityFilter === 'fresh') return sla === 'Fresh';
      return true;
    })
  ), [filteredListingAds, getAdOpsSlaLabel, priorityFilter, workflowFilter]);

  const selectedAds = useMemo(
    () => visibleAds.filter((ad) => selectedAdIds.includes(ad.id)),
    [selectedAdIds, visibleAds]
  );

  const topCtrAds = useMemo(
    () => analyticsAds
      .slice()
      .sort((left, right) => getAdCtr(right) - getAdCtr(left))
      .slice(0, 3),
    [analyticsAds, getAdCtr]
  );

  const topLeadAds = useMemo(
    () => analyticsAds
      .slice()
      .sort((left, right) => getDerivedAdLeadCount(right) - getDerivedAdLeadCount(left))
      .slice(0, 3),
    [analyticsAds, getDerivedAdLeadCount]
  );

  const atRiskBudgetAds = useMemo(
    () => analyticsAds
      .filter((ad) => Number(ad.plannedBudget || 0) > 0)
      .filter((ad) => Number(ad.spentBudget || 0) >= Number(ad.plannedBudget || 0) * 0.8)
      .slice()
      .sort((left, right) => (
        (Number(right.spentBudget || 0) / Math.max(1, Number(right.plannedBudget || 1))) -
        (Number(left.spentBudget || 0) / Math.max(1, Number(left.plannedBudget || 1)))
      ))
      .slice(0, 4),
    [analyticsAds]
  );

  const placementBreakdown = useMemo(() => {
    const placementTotals = new Map<string, { ads: number; clicks: number; leads: number }>();
    analyticsAds.forEach((ad) => {
      const key = ad.placementKey || 'homepage_inline_primary';
      const existing = placementTotals.get(key) || { ads: 0, clicks: 0, leads: 0 };
      existing.ads += 1;
      existing.clicks += Number(ad.clicks || 0);
      existing.leads += Math.max(Number(ad.leadCount || 0), getDerivedAdLeadCount(ad));
      placementTotals.set(key, existing);
    });
    return Array.from(placementTotals.entries())
      .map(([placementKey, value]) => ({ placementKey, ...value }))
      .sort((left, right) => right.clicks - left.clicks || right.leads - left.leads)
      .slice(0, 4);
  }, [analyticsAds, getDerivedAdLeadCount]);

  const workflowBreakdown = useMemo(() => {
    const statusTotals = new Map<string, number>();
    analyticsAds.forEach((ad) => {
      const key = ad.workflowStatus || 'draft';
      statusTotals.set(key, (statusTotals.get(key) || 0) + 1);
    });
    return Array.from(statusTotals.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count);
  }, [analyticsAds]);

  const rotationBreakdown = useMemo(() => {
    const rotationTotals = new Map<string, number>();
    analyticsAds.forEach((ad) => {
      const key = ad.rotationMode || 'even';
      rotationTotals.set(key, (rotationTotals.get(key) || 0) + 1);
    });
    return Array.from(rotationTotals.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count);
  }, [analyticsAds]);

  const trendPoints = useMemo(() => {
    const trendMap = new Map<string, { date: string; ads: number; clicks: number; leads: number; spend: number }>();
    analyticsAds.forEach((ad) => {
      const dateKey = (getAdActivityDate(ad) || currentAdminDateIso).slice(0, 10);
      const existing = trendMap.get(dateKey) || { date: dateKey, ads: 0, clicks: 0, leads: 0, spend: 0 };
      existing.ads += 1;
      existing.clicks += Number(ad.clicks || 0);
      existing.leads += Math.max(Number(ad.leadCount || 0), getDerivedAdLeadCount(ad));
      existing.spend += Number(ad.spentBudget || 0);
      trendMap.set(dateKey, existing);
    });
    return Array.from(trendMap.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-6);
  }, [analyticsAds, currentAdminDateIso, getDerivedAdLeadCount]);

  const averageCtr = analyticsAds.length > 0
    ? `${(analyticsAds.reduce((sum, ad) => sum + getAdCtr(ad), 0) / analyticsAds.length).toFixed(2)}%`
    : '0.00%';
  const cplEligibleAds = analyticsAds.filter((ad) => getAdCpl(ad) > 0);
  const averageCpl = cplEligibleAds.length > 0
    ? formatInr(cplEligibleAds.reduce((sum, ad) => sum + getAdCpl(ad), 0) / cplEligibleAds.length)
    : 'n/a';
  const analyticsPlannedBudget = analyticsAds.reduce((sum, ad) => sum + Number(ad.plannedBudget || 0), 0);
  const analyticsSpentBudget = analyticsAds.reduce((sum, ad) => sum + Number(ad.spentBudget || 0), 0);
  const maxTrendClicks = Math.max(1, ...trendPoints.map((point) => point.clicks));

  const toggleAdSelection = (adId: string) => {
    setSelectedAdIds((prev) => (
      prev.includes(adId) ? prev.filter((candidate) => candidate !== adId) : [...prev, adId]
    ));
  };

  const toggleVisibleSelection = () => {
    const visibleIds = visibleAds.map((ad) => ad.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedAdIds.includes(id));
    setSelectedAdIds((prev) => {
      if (allSelected) return prev.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const applyBulkTransition = (
    nextStatus: NonNullable<ListingAd['workflowStatus']>,
    options?: { reason?: string; deactivate?: boolean }
  ) => {
    selectedAds.forEach((ad) => onTransitionAd(ad, nextStatus, options));
    setSelectedAdIds([]);
  };

  const requestBulkRevision = () => {
    const reason = window.prompt('What changes are needed before approval for the selected ads?', 'Please revise creative, targeting, or budget.');
    if (reason === null) return;
    selectedAds.forEach((ad) => onTransitionAd(ad, 'under_review', { reason: reason.trim() || 'Revision requested by ops.' }));
    setSelectedAdIds([]);
  };

  const rejectBulkAds = () => {
    const reason = window.prompt('Why are the selected ads being rejected?', 'Rejected by ops review.');
    if (reason === null) return;
    selectedAds.forEach((ad) => onTransitionAd(ad, 'rejected', { reason: reason.trim() || 'Rejected by ops review.', deactivate: true }));
    setSelectedAdIds([]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h3 className="text-base font-extrabold text-slate-950">Ad Banner Manager</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Pending Review</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-950">{pendingReviewAds.length}</div>
          <div className="text-[11px] text-slate-600">Submitted or under review ads waiting for ops action.</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Live / Approved</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-950">{liveOrApprovedAds.length}</div>
          <div className="text-[11px] text-slate-600">Approved, scheduled, live, or paused ads tracked here.</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-800">Spend vs Plan</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-950">{formatInr(adPerformanceSummary.spentBudget)} / {formatInr(adPerformanceSummary.plannedBudget)}</div>
          <div className="text-[11px] text-slate-600">Campaign budget tracking for advertiser and ops review.</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Performance</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-950">{adPerformanceSummary.clicks} clicks</div>
          <div className="text-[11px] text-slate-500">{rejectedAds.length} rejected ads in current filtered view.</div>
          <div className="text-[11px] text-slate-600">{adPerformanceSummary.impressions} impressions - {adPerformanceSummary.leads} leads</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Advertiser Analytics Snapshot</h4>
                <p className="text-[11px] text-slate-500">
                  {analyticsAds.length} of {filteredListingAds.length} ads in the selected analytics window.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['7d', '30d', '90d', 'all'] as AnalyticsRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setAnalyticsRange(range)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    analyticsRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {range === 'all' ? 'All time' : range}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Average CTR</div>
              <div className="mt-1 text-xl font-extrabold text-slate-950">{averageCtr}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Average CPL</div>
              <div className="mt-1 text-xl font-extrabold text-slate-950">{averageCpl}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Budget Remaining</div>
              <div className="mt-1 text-xl font-extrabold text-slate-950">{formatInr(Math.max(0, analyticsPlannedBudget - analyticsSpentBudget))}</div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                Top CTR Ads
              </div>
              {topCtrAds.length === 0 ? (
                <div className="text-[11px] text-slate-400">No ad delivery data yet.</div>
              ) : (
                topCtrAds.map((ad) => (
                  <div key={`${ad.id}-ctr`} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <div className="font-semibold text-slate-900 truncate">{ad.title}</div>
                    <div className="text-[11px] text-slate-500">{getAdCtr(ad).toFixed(2)}% CTR - {Number(ad.clicks || 0)} clicks</div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <CheckSquare2 className="h-3.5 w-3.5 text-sky-600" />
                Top Lead Ads
              </div>
              {topLeadAds.length === 0 ? (
                <div className="text-[11px] text-slate-400">No ad leads captured yet.</div>
              ) : (
                topLeadAds.map((ad) => (
                  <div key={`${ad.id}-lead`} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <div className="font-semibold text-slate-900 truncate">{ad.title}</div>
                    <div className="text-[11px] text-slate-500">{getDerivedAdLeadCount(ad)} leads - {getAdCpl(ad) > 0 ? formatInr(getAdCpl(ad)) : 'n/a'} CPL</div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <Wallet className="h-3.5 w-3.5 text-amber-600" />
                Budget Risk Watch
              </div>
              {atRiskBudgetAds.length === 0 ? (
                <div className="text-[11px] text-slate-400">No campaigns are near budget limits.</div>
              ) : (
                atRiskBudgetAds.map((ad) => (
                  <div key={`${ad.id}-budget`} className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2">
                    <div className="font-semibold text-slate-900 truncate">{ad.title}</div>
                    <div className="text-[11px] text-amber-800">
                      {formatInr(Number(ad.spentBudget || 0))} / {formatInr(Number(ad.plannedBudget || 0))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Placement Breakdown</div>
            <div className="grid gap-2 md:grid-cols-2">
              {placementBreakdown.length === 0 ? (
                <div className="text-[11px] text-slate-400">No placement data available yet.</div>
              ) : (
                placementBreakdown.map((placement) => (
                  <div key={placement.placementKey} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <div className="font-semibold text-slate-900 truncate">{placement.placementKey}</div>
                    <div className="text-[11px] text-slate-500">{placement.ads} ads - {placement.clicks} clicks - {placement.leads} leads</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Delivery Trend</div>
              {trendPoints.length === 0 ? (
                <div className="text-[11px] text-slate-400">No recent delivery trend is available for this window.</div>
              ) : (
                trendPoints.map((point) => (
                  <div key={point.date} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                      <span>{point.date}</span>
                      <span>{point.clicks} clicks - {point.leads} leads</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.max(8, (point.clicks / maxTrendClicks) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Workflow & Rotation Mix</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  {(workflowBreakdown.length === 0 ? [] : workflowBreakdown).map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600">{item.label.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-slate-900">{item.count}</span>
                    </div>
                  ))}
                  {workflowBreakdown.length === 0 && <div className="text-[11px] text-slate-400">No workflow mix available.</div>}
                </div>
                <div className="space-y-2">
                  {(rotationBreakdown.length === 0 ? [] : rotationBreakdown).map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-bold text-slate-900">{item.count}</span>
                    </div>
                  ))}
                  {rotationBreakdown.length === 0 && <div className="text-[11px] text-slate-400">No rotation mix available.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {pendingReviewAds.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <h4 className="text-sm font-extrabold text-slate-900">Ops Review Queue</h4>
            </div>
            <div className="space-y-2">
              {prioritizedPendingReviewAds.slice(0, 4).map((ad) => (
                <div key={`${ad.id}-queue`} className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-900">{ad.title}</div>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {getAdOpsSlaLabel(ad)}
                      </span>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        Priority {Math.round(getAdOpsPriorityScore(ad))}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {(ad.workflowStatus || 'draft').replace(/_/g, ' ')} - {ad.billingModel || 'fixed'} - {ad.placementKey || 'homepage_inline_primary'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Submitted {new Date(ad.submittedAt || ad.startDate || currentAdminDateIso).toLocaleString()}
                    </div>
                    {ad.reviewNotes && <div className="mt-1 text-[11px] text-slate-600 line-clamp-2">{ad.reviewNotes}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ad.workflowStatus === 'submitted' && (
                      <button
                        type="button"
                        onClick={() => onTransitionAd(ad, 'under_review', { reason: ad.reviewNotes || 'Review started by ops.' })}
                        className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-[11px] font-bold text-amber-800"
                      >
                        Start Review
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onTransitionAd(ad, ad.startDate > currentAdminDateIso ? 'scheduled' : 'live', { reason: ad.reviewNotes || 'Approved by ops.' })}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onReviewRequest(ad)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700"
                    >
                      Request Revision
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectAd(ad)}
                      className="rounded-lg bg-rose-100 px-3 py-2 text-[11px] font-bold text-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Ops Controls</h4>
            <p className="text-[11px] text-slate-500">Filter, bulk review, and manage ad delivery without opening each campaign individually.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={workflowFilter}
              onChange={(event) => setWorkflowFilter(event.target.value as AdWorkflowFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              <option value="all">All workflows</option>
              <option value="review">Review queue</option>
              <option value="live">Approved / live</option>
              <option value="paused">Paused</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as AdPriorityFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              <option value="all">All priorities</option>
              <option value="critical">Critical SLA</option>
              <option value="due">Due Today</option>
              <option value="soon">Review Soon</option>
              <option value="fresh">Fresh</option>
            </select>
            <button
              type="button"
              onClick={toggleVisibleSelection}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
            >
              {visibleAds.length > 0 && visibleAds.every((ad) => selectedAdIds.includes(ad.id)) ? 'Clear visible' : 'Select visible'}
            </button>
          </div>
        </div>

        {selectedAds.length > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-indigo-800">
              {selectedAds.length} ads selected
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyBulkTransition('under_review', { reason: 'Bulk moved to review by ops.' })}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[11px] font-bold text-indigo-700"
              >
                Start review
              </button>
              <button
                type="button"
                onClick={() => applyBulkTransition('live', { reason: 'Bulk approved by ops.' })}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => applyBulkTransition('paused', { reason: 'Bulk paused by ops.', deactivate: true })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={requestBulkRevision}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700"
              >
                Request revision
              </button>
              <button
                type="button"
                onClick={rejectBulkAds}
                className="rounded-lg bg-rose-100 px-3 py-2 text-[11px] font-bold text-rose-700"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {visibleAds.map((ad) => (
            <div key={ad.id} className="bg-white border border-slate-150 rounded-lg p-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedAdIds.includes(ad.id)}
                    onChange={() => toggleAdSelection(ad.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <div className="min-w-0">
                    <span className="block font-semibold text-slate-800 truncate">{ad.title}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {(ad.workflowStatus || 'draft').replace(/_/g, ' ')}
                      </span>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        {ad.billingModel || 'fixed'}
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {ad.rotationMode || 'even'} rotation
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        {getAdOpsSlaLabel(ad)}
                      </span>
                    </div>
                    <span className="block text-[10px] text-slate-500 font-mono">{ad.startDate} - {ad.endDate}</span>
                    <span className="block text-[10px] text-slate-500">
                      {(ad.localityIds || []).map((localityId) => localities.find((locality) => locality.id === localityId)?.name || localityId).join(', ') || 'All localities'} - {ad.placementKey || 'homepage_inline_primary'}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {ad.deviceTarget || 'all'}{ad.mobileRowPosition ? ` - mobile row ${ad.mobileRowPosition}` : ''}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Categories: {(ad.categoryIds || []).map((categoryId) => getCategoryById(categoryId)?.name || categoryId).join(', ') || 'All'} | Tags: {(ad.tags || []).join(', ') || 'Any'}
                    </span>
                    {ad.reviewedBy && (
                      <span className="block text-[10px] text-slate-500">
                        Reviewed by {ad.reviewedBy} {ad.reviewedAt ? `on ${new Date(ad.reviewedAt).toLocaleString()}` : ''}
                      </span>
                    )}
                    {ad.sellerBusinessId && (
                      <span className="block text-[10px] text-slate-500">
                        Advertiser: {filteredBusinesses.find((business) => business.id === ad.sellerBusinessId)?.name || ad.sellerBusinessId}
                      </span>
                    )}
                    {ad.reviewNotes && (
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">Review note:</span> {ad.reviewNotes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onBeginEditListingAd(ad)}
                    className="text-[10px] px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700"
                  >
                    Edit
                  </button>
                  {['draft', 'submitted', 'under_review'].includes(ad.workflowStatus || 'draft') && (
                    <button
                      type="button"
                      onClick={() => onTransitionAd(ad, ad.startDate > currentAdminDateIso ? 'scheduled' : 'live', { reason: ad.reviewNotes || 'Approved by ops.' })}
                      className="text-[10px] px-2 py-1 rounded bg-emerald-600 text-white"
                    >
                      <PlayCircle className="inline h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  {['live', 'approved', 'scheduled'].includes(ad.workflowStatus || 'draft') && (
                    <button
                      type="button"
                      onClick={() => onTransitionAd(ad, 'paused', { reason: 'Paused by ops.', deactivate: true })}
                      className="text-[10px] px-2 py-1 rounded bg-slate-200 text-slate-700"
                    >
                      <PauseCircle className="inline h-3.5 w-3.5" /> Pause
                    </button>
                  )}
                  {ad.workflowStatus === 'paused' && (
                    <button
                      type="button"
                      onClick={() => onTransitionAd(ad, ad.startDate > currentAdminDateIso ? 'scheduled' : 'live', { reason: 'Resumed by ops.' })}
                      className="text-[10px] px-2 py-1 rounded bg-emerald-100 text-emerald-700"
                    >
                      Resume
                    </button>
                  )}
                  {ad.workflowStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => onRejectAd(ad)}
                      className="text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteAd(ad.id)}
                    className="text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <select
                  value={ad.deviceTarget || 'all'}
                  onChange={(event) => {
                    const nextTarget = event.target.value as NonNullable<ListingAd['deviceTarget']>;
                    onUpdateAd({
                      ...ad,
                      deviceTarget: nextTarget,
                      mobileRowPosition: nextTarget === 'desktop' ? undefined : (ad.mobileRowPosition || 3),
                    });
                  }}
                  className="border border-slate-200 rounded px-2 py-1.5 bg-white text-[11px]"
                >
                  <option value="all">Desktop + Mobile</option>
                  <option value="desktop">Desktop Only</option>
                  <option value="mobile">Mobile Only</option>
                </select>
                {(ad.deviceTarget || 'all') !== 'desktop' && (
                  <input
                    value={String(ad.mobileRowPosition || '')}
                    onChange={(event) => onUpdateAd({ ...ad, mobileRowPosition: Number(event.target.value.replace(/\D/g, '')) || undefined })}
                    placeholder="Mobile row"
                    className="border border-slate-200 rounded px-2 py-1.5 bg-white text-[11px]"
                  />
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Budget</div>
                  <div className="font-bold text-slate-900">{formatInr(Number(ad.spentBudget || 0))} / {formatInr(Number(ad.plannedBudget || 0))}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Delivery</div>
                  <div className="font-bold text-slate-900">{Number(ad.impressions || 0)} imp - {Number(ad.clicks || 0)} clicks</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">CTR</div>
                  <div className="font-bold text-slate-900">{getAdCtr(ad).toFixed(2)}%</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Leads / CPL</div>
                  <div className="font-bold text-slate-900">{Math.max(Number(ad.leadCount || 0), getDerivedAdLeadCount(ad))} - {getAdCpl(ad) > 0 ? formatInr(getAdCpl(ad)) : 'n/a'}</div>
                </div>
              </div>
            </div>
          ))}
          {filteredListingAds.length === 0 && <div className="text-xs text-slate-400">No ads created yet.</div>}
        </div>
      </div>
    </div>
  );
}
