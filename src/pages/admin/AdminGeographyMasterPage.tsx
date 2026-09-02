import React from 'react';
import GeographyConfigManager from '../../components/GeographyConfigManager';
import type { GeographyConfigState } from '../../types';

type AdminGeographyMasterPageProps = {
  geographyConfig?: GeographyConfigState;
  onSaveGeographyConfig?: (config: GeographyConfigState) => Promise<GeographyConfigState> | void;
};

// Routed home for admin-backend-ux-spec.md Section 5.13 "Geography Master" — Section 9
// build step 3. This one is a thin wrapper: `GeographyConfigManager` already existed as a
// self-contained states/cities/localities/areas master-data editor (was previously only
// reachable via Platform Config > "Geography Master" in the legacy console); this route
// gives it its own place in the new Geography & Routing nav group per the spec's migration
// map (Section 6), alongside Localities/Pincode Routing/Category URLs. The legacy console's
// Platform Config tab keeps mounting the same component unchanged.
export default function AdminGeographyMasterPage({ geographyConfig, onSaveGeographyConfig }: AdminGeographyMasterPageProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Geography Master</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage states/cities/areas master data — the hierarchy locality-driven routing is built from.</p>
      </div>
      {geographyConfig ? (
        <GeographyConfigManager config={geographyConfig} onSave={onSaveGeographyConfig} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
          Geography master data isn't configured for this environment yet.
        </div>
      )}
    </div>
  );
}
