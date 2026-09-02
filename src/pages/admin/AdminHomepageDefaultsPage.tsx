import React from 'react';
import HomepageDefaultsManager from '../../components/HomepageDefaultsManager';
import type { HomepageDefaultsConfigState } from '../../types';

type AdminHomepageDefaultsPageProps = {
  homepageDefaultsConfig?: HomepageDefaultsConfigState;
  onSaveHomepageDefaultsConfig?: (config: HomepageDefaultsConfigState) => Promise<HomepageDefaultsConfigState> | void;
};

// Routed home for admin-backend-ux-spec.md Section 5.25 "Homepage Defaults" — Section 9
// build step. This one is a thin wrapper: `HomepageDefaultsManager` already existed as a
// self-contained default-section-template editor (was previously only reachable via
// Platform Config > "Homepage Defaults" in the legacy console); this route gives it its own
// place in the new Platform Config nav group per the spec's migration map. No logic ported —
// same pattern as AdminGeographyMasterPage.tsx. The legacy console's Platform Config tab
// keeps mounting the same component unchanged.
export default function AdminHomepageDefaultsPage({ homepageDefaultsConfig, onSaveHomepageDefaultsConfig }: AdminHomepageDefaultsPageProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Homepage Defaults</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage the default section templates new localities' homepages are seeded from.</p>
      </div>
      {homepageDefaultsConfig ? (
        <HomepageDefaultsManager config={homepageDefaultsConfig} onSave={onSaveHomepageDefaultsConfig} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
          Homepage defaults aren't configured for this environment yet.
        </div>
      )}
    </div>
  );
}
