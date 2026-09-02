import React from 'react';
import type { AdLead, AuditEvent, Business } from '../../types';
import ListingAnalyticsPanel from '../../components/admin/ListingAnalyticsPanel';

type AdminListingAnalyticsPageProps = {
  businesses: Business[];
  auditLogs?: AuditEvent[];
  adLeads?: AdLead[];
};

// Routed home for admin-backend-ux-spec.md Section 5.8 "Listing Analytics" — split out of the
// Listing Directory page (5.5) in Section 9 build step 2. Directory health and engagement
// per business/locality; read-only, same underlying panel used before the split.
export default function AdminListingAnalyticsPage({ businesses, auditLogs = [], adLeads = [] }: AdminListingAnalyticsPageProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Listing Analytics</h2>
        <p className="mt-0.5 text-xs text-slate-500">Directory health and engagement per business/locality.</p>
      </div>
      <ListingAnalyticsPanel businesses={businesses} auditLogs={auditLogs} adLeads={adLeads} />
    </div>
  );
}
