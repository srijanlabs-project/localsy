import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { ApiConfiguration } from '../../types';

type AdminApiSyncPageProps = {
  apiConfiguration?: ApiConfiguration;
  onUpdateApiConfiguration?: (config: ApiConfiguration) => void;
  onSyncHomepageConfig?: () => void;
};

const defaultApiConfiguration: ApiConfiguration = {
  syncMode: 'api',
  homepageConfigEndpoint: '/api/homepage-config',
  adLeadsEndpoint: '/api/ad-leads',
  homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
  localityRoutingConfigEndpoint: '/api/locality-routing-config',
  geographyConfigEndpoint: '/api/geography-config',
  taxonomyConfigEndpoint: '/api/business-taxonomy',
  seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
  scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
  resolvedHomepageEndpoint: '/api/resolved-homepage',
  publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
  businessesEndpoint: '/api/businesses',
  auditEventsEndpoint: '/api/audit-events',
  autoSyncHomepage: true,
  autoSyncBusinesses: true,
};

// Routed home for admin-backend-ux-spec.md Section 5.23 "API & Sync" — Section 9 build
// step. Unlike the other three Platform Config screens in this batch, there was no
// pre-extracted component for this one — it ported directly out of AdminConsole.tsx:
//   - Default `apiConfigDraft` shape: ported from the `useState<ApiConfiguration>` initializer
//     at AdminConsole.tsx lines ~431-447 (kept here as `defaultApiConfiguration`, used only
//     when the `apiConfiguration` prop hasn't loaded yet).
//   - The resync-on-prop-change `useEffect`: ported verbatim from lines ~902-905.
//   - `handleSaveApiConfiguration`: ported verbatim from lines ~1923-1927, except it uses a
//     local `notify` banner helper (same one-line pattern as AdminHomepageAssignmentsPage.tsx)
//     instead of the legacy console's shared `triggerNotification`.
//   - The form JSX (13 endpoint inputs + 2 auto-sync checkboxes + Sync Now button): ported
//     directly from lines ~4551-4734, including the Sync Now handler (lines ~4719-4730). No
//     mojibake/encoding artifacts were found in the ported JSX. Legacy indigo/emerald button
//     classes were swapped for Royal Blue (#1E3A8A) design tokens per the new page style; all
//     other structure/behavior is unchanged. The legacy console's Platform Config tab keeps
//     mounting its own inline copy of this form unchanged.
export default function AdminApiSyncPage({
  apiConfiguration,
  onUpdateApiConfiguration,
  onSyncHomepageConfig,
}: AdminApiSyncPageProps) {
  const [apiConfigDraft, setApiConfigDraft] = useState<ApiConfiguration>(() => apiConfiguration || defaultApiConfiguration);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!apiConfiguration) return;
    setApiConfigDraft(apiConfiguration);
  }, [apiConfiguration]);

  const handleSaveApiConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiConfiguration?.(apiConfigDraft);
    notify('API configuration saved.');
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">API & Sync</h2>
        <p className="mt-0.5 text-xs text-slate-500">Control sync endpoints, resolved homepage routes, and publish service paths.</p>
      </div>

      {notification && (
        <div className="rounded-xl border border-[#1E3A8A]/20 bg-[#1E3A8A]/5 px-3 py-2 text-xs font-semibold text-[#1E3A8A]">
          {notification}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-950">Platform API & Sync</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Control sync endpoints, resolved homepage routes, and publish service paths.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
            {apiConfigDraft.syncMode.toUpperCase()}
          </span>
        </div>

        <form onSubmit={handleSaveApiConfiguration} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700">Sync mode</span>
              <select
                value={apiConfigDraft.syncMode}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, syncMode: e.target.value as ApiConfiguration['syncMode'] }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="api">API + Local Fallback</option>
                <option value="local">Local Only</option>
              </select>
            </label>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="font-semibold text-slate-700">Last sync</div>
              <div className="mt-1 text-[11px] text-slate-500">
                {apiConfigDraft.lastHomepageSyncAt ? new Date(apiConfigDraft.lastHomepageSyncAt).toLocaleString() : 'Not synced yet'}
              </div>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">Homepage config endpoint</span>
            <input
              value={apiConfigDraft.homepageConfigEndpoint}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, homepageConfigEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">Ad leads endpoint</span>
            <input
              value={apiConfigDraft.adLeadsEndpoint || ''}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, adLeadsEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">Homepage defaults endpoint</span>
            <input
              value={apiConfigDraft.homepageDefaultsConfigEndpoint || ''}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, homepageDefaultsConfigEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">Locality routing endpoint</span>
            <input
              value={apiConfigDraft.localityRoutingConfigEndpoint || ''}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, localityRoutingConfigEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">Geography endpoint</span>
            <input
              value={apiConfigDraft.geographyConfigEndpoint || ''}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, geographyConfigEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">Taxonomy endpoint</span>
            <input
              value={apiConfigDraft.taxonomyConfigEndpoint || ''}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, taxonomyConfigEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">SEO discovery endpoint</span>
            <input
              value={apiConfigDraft.seoDiscoveryConfigEndpoint || ''}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, seoDiscoveryConfigEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700">Scalable CMS endpoint</span>
              <input
                value={apiConfigDraft.scalableHomepageConfigEndpoint || ''}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, scalableHomepageConfigEndpoint: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700">Resolved homepage endpoint</span>
              <input
                value={apiConfigDraft.resolvedHomepageEndpoint || ''}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, resolvedHomepageEndpoint: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-700">Publish snapshots endpoint</span>
            <input
              value={apiConfigDraft.publishResolvedHomepageEndpoint || ''}
              onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, publishResolvedHomepageEndpoint: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700">Businesses endpoint</span>
              <input
                value={apiConfigDraft.businessesEndpoint}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, businessesEndpoint: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700">Audit endpoint</span>
              <input
                value={apiConfigDraft.auditEventsEndpoint}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, auditEventsEndpoint: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
              <input
                type="checkbox"
                checked={apiConfigDraft.autoSyncHomepage}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, autoSyncHomepage: e.target.checked }))}
              />
              <span>Auto-sync homepage config</span>
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
              <input
                type="checkbox"
                checked={apiConfigDraft.autoSyncBusinesses}
                onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, autoSyncBusinesses: e.target.checked }))}
              />
              <span>Auto-sync businesses</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-lg bg-[#1E3A8A] py-2 font-bold text-white hover:bg-[#1E3A8A]/90">
              Save API Settings
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateApiConfiguration?.(apiConfigDraft);
                onSyncHomepageConfig?.();
                notify('Homepage sync started.');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1E3A8A]/30 bg-white px-4 py-2 font-bold text-[#1E3A8A] hover:bg-[#1E3A8A]/5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
