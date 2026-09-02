import React, { useMemo, useState } from 'react';
import type { AdLead, Business, ListingAd, Locality } from '../../types';
import AdLeadInboxPanel from '../../components/admin/AdLeadInboxPanel';

type AdminLeadInboxPageProps = {
  adLeads?: AdLead[];
  listingAds?: ListingAd[];
  businesses: Business[];
  localities: Locality[];
};

// Routed home for admin-backend-ux-spec.md Section 5.21 "Campaigns: Lead Inbox".
// The simplest page in this batch: `AdLeadInboxPanel` is a fully self-contained,
// read-only presentational component (it owns its own pagination state
// internally) with no callback props at all, so this page only needs to supply
// the 5 read-only data props it already accepts (`adLeads`, `filteredAdLeads`,
// `listingAds`, `businesses`, `localities`) unchanged. The legacy Campaigns >
// Lead Inbox tab in `AdminConsole.tsx` is left completely untouched.
//
// Ported from `AdminConsole.tsx`:
//   - lines 1350-1358: the `filteredAdLeads` derivation.
//
// Deliberate deviation (same shape used by the other Campaigns & Offers pages
// built alongside this one, e.g. `AdminOffersPage.tsx`): the legacy
// `filteredAdLeads` filters against the console's SHARED cross-cutting filter
// bar state (`adminLocalityFilter` / `adminPincodeFilter` / `adminSearchQuery`).
// This page has no shared filter bar, so it owns a small local filter scoped
// just to this screen (`leadLocalityFilter` + `leadSearchQuery`) instead. The
// separate pincode filter input is dropped as a simplification — pincode is
// folded into the search box, so typing a pincode still narrows the list.
export default function AdminLeadInboxPage({
  adLeads = [],
  listingAds = [],
  businesses,
  localities,
}: AdminLeadInboxPageProps) {
  const [leadLocalityFilter, setLeadLocalityFilter] = useState<'all' | string>('all');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  const filteredAdLeads = useMemo(() => {
    return adLeads.filter((lead) => {
      if (leadLocalityFilter !== 'all' && lead.localityId !== leadLocalityFilter) return false;
      if (leadSearchQuery.trim()) {
        const query = leadSearchQuery.trim().toLowerCase();
        const searchable = `${lead.name} ${lead.mobile} ${lead.adId} ${lead.pincode}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [adLeads, leadLocalityFilter, leadSearchQuery]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Lead Inbox</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Review advertiser leads captured across campaigns and confirm follow-up coverage.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:flex-row sm:items-center">
        <select
          value={leadLocalityFilter}
          onChange={(event) => setLeadLocalityFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          <option value="all">All localities</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>{locality.name}</option>
          ))}
        </select>
        <input
          value={leadSearchQuery}
          onChange={(event) => setLeadSearchQuery(event.target.value)}
          placeholder="Search leads by name, mobile, pincode, or ad"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-1 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
      </div>

      <AdLeadInboxPanel
        adLeads={adLeads}
        filteredAdLeads={filteredAdLeads}
        listingAds={listingAds}
        businesses={businesses}
        localities={localities}
      />
    </div>
  );
}
