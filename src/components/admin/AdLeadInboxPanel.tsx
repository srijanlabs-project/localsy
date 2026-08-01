import React, { useMemo, useState } from 'react';
import type { AdLead, Business, ListingAd, Locality } from '../../types';

type AdLeadInboxPanelProps = {
  adLeads: AdLead[];
  filteredAdLeads: AdLead[];
  listingAds: ListingAd[];
  businesses: Business[];
  localities: Locality[];
};

const PAGE_SIZE = 12;

export default function AdLeadInboxPanel({
  adLeads,
  filteredAdLeads,
  listingAds,
  businesses,
  localities,
}: AdLeadInboxPanelProps) {
  const [leadPage, setLeadPage] = useState(1);

  const safeLeadPage = Math.min(Math.max(leadPage, 1), Math.max(1, Math.ceil(filteredAdLeads.length / PAGE_SIZE)));
  const pagedLeads = filteredAdLeads.slice((safeLeadPage - 1) * PAGE_SIZE, safeLeadPage * PAGE_SIZE);

  const leadMetrics = useMemo(() => {
    const sellerIds = new Set(filteredAdLeads.map((lead) => lead.sellerBusinessId).filter(Boolean));
    const localityIds = new Set(filteredAdLeads.map((lead) => lead.localityId));
    const latestLeadAt = filteredAdLeads
      .map((lead) => lead.createdAt)
      .sort((left, right) => right.localeCompare(left))[0];
    return {
      sellers: sellerIds.size,
      localities: localityIds.size,
      latestLeadAt,
    };
  }, [filteredAdLeads]);

  const topLeadAds = useMemo(() => {
    const counts = new Map<string, number>();
    filteredAdLeads.forEach((lead) => {
      counts.set(lead.adId, (counts.get(lead.adId) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([adId, count]) => ({
        adId,
        count,
        title: listingAds.find((ad) => ad.id === adId)?.title || adId,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 4);
  }, [filteredAdLeads, listingAds]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Ad Lead Inbox</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Track every advertiser lead, verify who received it, and help ops resolve follow-up gaps quickly.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
            <div className="font-bold text-indigo-700">Visible</div>
            <div className="text-lg font-extrabold text-slate-950">{filteredAdLeads.length}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="font-bold text-emerald-800">Advertisers</div>
            <div className="text-lg font-extrabold text-slate-950">{leadMetrics.sellers}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="font-bold text-slate-600">Total Leads</div>
            <div className="text-lg font-extrabold text-slate-950">{adLeads.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Lead Stream</div>
              <div className="text-[11px] text-slate-500">
                {filteredAdLeads.length === 0
                  ? 'No ad leads submitted yet.'
                  : `Showing ${pagedLeads.length} of ${filteredAdLeads.length} filtered leads`}
              </div>
            </div>
            {leadMetrics.latestLeadAt && (
              <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">
                Latest {new Date(leadMetrics.latestLeadAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
            {filteredAdLeads.length === 0 ? (
              <div className="text-xs text-slate-400">No ad leads submitted yet.</div>
            ) : (
              pagedLeads.map((lead) => {
                const ad = listingAds.find((candidate) => candidate.id === lead.adId);
                const seller = lead.sellerBusinessId
                  ? businesses.find((candidate) => candidate.id === lead.sellerBusinessId)
                  : undefined;
                const locality = localities.find((candidate) => candidate.id === lead.localityId);
                return (
                  <div key={lead.id} className="bg-white border border-slate-150 rounded-xl p-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800">{lead.name}</span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {lead.pincode}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-600 font-mono">{lead.mobile}</div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          Ad: {ad?.title || lead.adId}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Seller: {seller?.name || lead.sellerBusinessId || 'Platform'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Locality: {locality?.name || lead.localityId}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold text-slate-600">
                        {new Date(lead.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredAdLeads.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setLeadPage((page) => Math.max(1, page - 1))}
                disabled={safeLeadPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-[11px] text-slate-500">
                Page {safeLeadPage} of {Math.max(1, Math.ceil(filteredAdLeads.length / PAGE_SIZE))}
              </div>
              <button
                type="button"
                onClick={() => setLeadPage((page) => Math.min(Math.ceil(filteredAdLeads.length / PAGE_SIZE), page + 1))}
                disabled={safeLeadPage >= Math.ceil(filteredAdLeads.length / PAGE_SIZE)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="text-sm font-extrabold text-slate-900">Lead Coverage</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Localities</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-950">{leadMetrics.localities}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Avg / Ad</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-950">
                  {topLeadAds.length > 0 ? (filteredAdLeads.length / topLeadAds.length).toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="text-sm font-extrabold text-slate-900">Top Lead Ads</div>
            <div className="space-y-2">
              {topLeadAds.length === 0 ? (
                <div className="text-[11px] text-slate-400">No ad leads available yet.</div>
              ) : (
                topLeadAds.map((ad) => (
                  <div key={ad.adId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="font-semibold text-slate-900 truncate">{ad.title}</div>
                    <div className="text-[11px] text-slate-500">{ad.count} leads captured</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
