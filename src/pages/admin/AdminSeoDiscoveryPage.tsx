import React from 'react';
import SeoDiscoveryManager from '../../components/SeoDiscoveryManager';
import type { Locality, SeoDiscoveryConfigState } from '../../types';

type AdminSeoDiscoveryPageProps = {
  localities: Locality[];
  seoDiscoveryConfig?: SeoDiscoveryConfigState;
  onSaveSeoDiscoveryConfig?: (config: SeoDiscoveryConfigState) => Promise<SeoDiscoveryConfigState> | void;
};

// Routed home for admin-backend-ux-spec.md Section 5.26 "SEO & Discovery" — Section 9
// build step. This one is a thin wrapper: `SeoDiscoveryManager` already existed as a
// self-contained SEO metadata/discovery-page editor (was previously only reachable via
// Platform Config > "SEO & Discovery" in the legacy console); this route gives it its own
// place in the new Platform Config nav group per the spec's migration map. No logic ported —
// same pattern as AdminGeographyMasterPage.tsx. The legacy console's Platform Config tab
// keeps mounting the same component unchanged.
export default function AdminSeoDiscoveryPage({ localities, seoDiscoveryConfig, onSaveSeoDiscoveryConfig }: AdminSeoDiscoveryPageProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">SEO & Discovery</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage SEO metadata templates and locality/category discovery pages.</p>
      </div>
      {seoDiscoveryConfig ? (
        <SeoDiscoveryManager config={seoDiscoveryConfig} localities={localities} onSave={onSaveSeoDiscoveryConfig} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
          SEO & discovery configuration isn't set up for this environment yet.
        </div>
      )}
    </div>
  );
}
