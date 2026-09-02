import React, { useMemo, useState } from 'react';
import type {
  ApiConfiguration,
  Locality,
  PublishedHomepageSnapshot,
  ResolvedHomepagePayload,
  ResolvedHomepagePublishContext,
  ResolvedHomepagePublishRequest,
  ResolvedHomepageSnapshotDeleteRequest,
  ScalableHomepageConfigState,
  ScalableLegacyOwnershipSummary,
} from '../../types';
import { OrderedCategoryPicker, OrderedSelectionPicker, type OrderedSelectionOption } from '../../components/admin/AdminConsoleSharedControls';
import { BUSINESS_CATEGORIES, BUSINESS_SUBCATEGORIES, getCategoryById, getSubcategoriesForCategory, getSubcategoryById } from '../../categoryMaster';
import { MASTER_AREAS } from '../../geographyMaster';
import { parseIdList, parsePincodeList } from '../../services/admin/adminConsoleUtils';

type PublishScopeDraft = {
  localityIds: string;
  categoryIds: string;
  subcategoryIds: string;
  pincodes: string;
  placementKeys: string;
  deviceTargets: string;
  pageTypes: string;
};

type ResolvedPreviewDraft = {
  localityId: string;
  categoryId: string;
  subcategoryId: string;
  pincode: string;
  device: 'all' | 'mobile' | 'desktop';
  pageType: 'homepage' | 'listing_results';
  placementKey: string;
  date: string;
  usePublished: boolean;
};

type ResolvedPreviewResult = {
  source: 'published_snapshot' | 'live_resolver' | 'legacy_fallback';
  payload: ResolvedHomepagePayload;
  resolution?: {
    source: 'published_snapshot' | 'live_resolver';
    strategy: string;
    usedPublished: boolean;
    requestedSnapshotId: string;
    legacySnapshotId: string;
    snapshot?: {
      id: string; localityId: string; categoryId?: string; subcategoryId?: string; pincode?: string;
      placementKey?: string; deviceTarget: string; pageType: string; publishedAt: string; updatedAt: string; score: number;
    } | null;
    template?: { id?: string; name?: string; templateScope?: string; isFallback?: boolean } | null;
    resolvedAt?: string;
  };
} | null;

type AdminHomepagePublishPageProps = {
  localities: Locality[];
  pincodeMappings?: Array<{ pincode: string; localityId: string }>;
  apiConfiguration?: ApiConfiguration;
  scalableHomepageConfig?: ScalableHomepageConfigState;
  onReseedScalableHomepageConfig?: (force?: boolean) => Promise<{ summary?: { templates?: number; assignments?: number; campaigns?: number } } | void> | void;
  onPublishResolvedHomepages?: (publishRequest?: string[] | ResolvedHomepagePublishRequest) => Promise<{ publishedCount?: number; totalSnapshots?: number } | void> | void;
  onDeleteResolvedHomepageSnapshots?: (deleteRequest?: ResolvedHomepageSnapshotDeleteRequest) => Promise<{ deletedCount?: number; remainingSnapshots?: number } | void> | void;
  onRefreshScalablePublishedSnapshots?: () => Promise<unknown> | void;
  onDeleteScalablePublishedSnapshot?: (snapshotId: string) => Promise<unknown> | void;
};

const DEVICE_SELECTION_OPTIONS: OrderedSelectionOption[] = [
  { id: 'all', label: 'All devices' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'mobile', label: 'Mobile' },
];
const PAGE_TYPE_SELECTION_OPTIONS: OrderedSelectionOption[] = [
  { id: 'homepage', label: 'Homepage' },
  { id: 'listing_results', label: 'Listing results' },
];

// Routed home for admin-backend-ux-spec.md Section 5.18 "Homepage CMS: Publish & Snapshots" —
// Section 9 build step 4. Merges the legacy console's 'publish' and 'insights' Homepage CMS
// subtabs into one screen, exactly as the spec's Notes line calls for ("Merges today's two
// sub-tabs into one workflow"). Ported from AdminConsole.tsx lines ~4786-4872 (the always-on
// "Scalable Homepage CMS" stats/reseed/publish block, previously also rendered redundantly on
// the Templates/Assignments/Campaigns subtabs — see this session's research notes) plus
// ~4874-5288 (Bulk Publish Scope, Published Snapshots, Resolved Homepage Preview — all three
// were gated to the 'insights' subtab specifically). Unchanged behavior, new location.
export default function AdminHomepagePublishPage({
  localities,
  pincodeMappings = [],
  apiConfiguration,
  scalableHomepageConfig,
  onReseedScalableHomepageConfig,
  onPublishResolvedHomepages,
  onDeleteResolvedHomepageSnapshots,
  onRefreshScalablePublishedSnapshots,
  onDeleteScalablePublishedSnapshot,
}: AdminHomepagePublishPageProps) {
  const primaryLocalityId = localities[0]?.id || '';
  const resolvedHomepageEndpoint = apiConfiguration?.resolvedHomepageEndpoint || '/api/resolved-homepage';

  const [publishScopeDraft, setPublishScopeDraft] = useState<PublishScopeDraft>({
    localityIds: primaryLocalityId,
    categoryIds: '',
    subcategoryIds: '',
    pincodes: '',
    placementKeys: '',
    deviceTargets: 'all',
    pageTypes: 'homepage',
  });
  const [resolvedPreviewDraft, setResolvedPreviewDraft] = useState<ResolvedPreviewDraft>({
    localityId: primaryLocalityId,
    categoryId: '',
    subcategoryId: '',
    pincode: '',
    device: 'all',
    pageType: 'homepage',
    placementKey: '',
    date: new Date().toISOString().slice(0, 10),
    usePublished: true,
  });
  const [resolvedPreviewResult, setResolvedPreviewResult] = useState<ResolvedPreviewResult>(null);
  const [resolvedPreviewLoading, setResolvedPreviewLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const scalableTemplateCount = scalableHomepageConfig?.templates.length || 0;
  const scalableAssignmentCount = scalableHomepageConfig?.assignments.length || 0;
  const scalableCampaignCount = scalableHomepageConfig?.campaigns.length || 0;
  const scalableSnapshotCount = scalableHomepageConfig?.publishedSnapshots.length || 0;
  const scalableLegacyOwnershipSummary: ScalableLegacyOwnershipSummary = useMemo(() => ({
    legacyManagedTemplates: (scalableHomepageConfig?.templates || []).filter((template) => String(template.metadata?.source || '').startsWith('legacy_') && !template.metadata?.detachedFromLegacySync).length,
    detachedTemplates: (scalableHomepageConfig?.templates || []).filter((template) => Boolean(template.metadata?.detachedFromLegacySync)).length,
    legacyManagedAssignments: (scalableHomepageConfig?.assignments || []).filter((assignment) => String(assignment.metadata?.source || '').startsWith('legacy_') && !assignment.metadata?.detachedFromLegacySync).length,
    detachedAssignments: (scalableHomepageConfig?.assignments || []).filter((assignment) => Boolean(assignment.metadata?.detachedFromLegacySync)).length,
    legacyManagedCampaigns: (scalableHomepageConfig?.campaigns || []).filter((campaign) => String(campaign.metadata?.source || '').startsWith('legacy_') && !campaign.metadata?.detachedFromLegacySync).length,
    detachedCampaigns: (scalableHomepageConfig?.campaigns || []).filter((campaign) => Boolean(campaign.metadata?.detachedFromLegacySync)).length,
  }), [scalableHomepageConfig]);
  const recentPublishedSnapshots: PublishedHomepageSnapshot[] = useMemo(() => (
    [...(scalableHomepageConfig?.publishedSnapshots || [])]
      .sort((left, right) => Date.parse(right.publishedAt || right.updatedAt || '') - Date.parse(left.publishedAt || left.updatedAt || ''))
      .slice(0, 12)
  ), [scalableHomepageConfig?.publishedSnapshots]);

  const localitySelectionOptions = useMemo(() => localities.map((locality) => ({
    id: locality.id,
    label: locality.name,
    meta: locality.slug,
  })), [localities]);
  const publishSubcategorySelectionOptions = useMemo(() => {
    const scopedCategoryIds = parseIdList(publishScopeDraft.categoryIds);
    return BUSINESS_SUBCATEGORIES
      .filter((subcategory) => scopedCategoryIds.length === 0 || scopedCategoryIds.includes(subcategory.categoryId))
      .map((subcategory) => ({
        id: subcategory.id,
        label: subcategory.name,
        meta: getCategoryById(subcategory.categoryId)?.name || subcategory.categoryId,
      }));
  }, [publishScopeDraft.categoryIds]);
  const placementKeySelectionOptions = useMemo(() => Array.from(new Set([
    'homepage_hero_primary',
    'homepage_hero_secondary',
    'homepage_strip_between_categories_and_listings',
    'homepage_inline_primary',
    'homepage_sidebar_top',
    'homepage_sidebar_food',
    'homepage_sidebar_clinic',
    'homepage_sidebar_marketing',
    ...(scalableHomepageConfig?.campaigns || []).flatMap((campaign) => campaign.placementKeys || []),
  ].filter(Boolean))).sort().map((placementKey) => ({ id: placementKey, label: placementKey })), [scalableHomepageConfig?.campaigns]);
  const pincodeSelectionOptions = useMemo(() => Array.from(new Set([
    ...pincodeMappings.map((mapping) => String(mapping.pincode || '').trim()),
    ...MASTER_AREAS.map((area) => String(area.pincode || '').trim()),
  ].filter((entry) => entry.length === 6))).sort().map((pincode) => ({ id: pincode, label: pincode })), [pincodeMappings]);

  const buildPublishContextsFromDraft = (draft: PublishScopeDraft): ResolvedHomepagePublishContext[] => {
    const localityIds = parseIdList(draft.localityIds);
    const categoryIds = parseIdList(draft.categoryIds);
    const subcategoryIds = parseIdList(draft.subcategoryIds);
    const pincodes = parsePincodeList(draft.pincodes);
    const placementKeys = parseIdList(draft.placementKeys);
    const deviceTargets = parseIdList(draft.deviceTargets).filter((device): device is 'all' | 'mobile' | 'desktop' => ['all', 'mobile', 'desktop'].includes(device));
    const pageTypes = parseIdList(draft.pageTypes);

    const scopedSubcategoryEntries = subcategoryIds.length > 0 ? subcategoryIds : [undefined];
    const scopedCategoryEntries = categoryIds.length > 0 ? categoryIds : [undefined];
    const scopedPincodeEntries = pincodes.length > 0 ? pincodes : [undefined];
    const scopedPlacementEntries = placementKeys.length > 0 ? placementKeys : [undefined];
    const scopedDeviceEntries = deviceTargets.length > 0 ? deviceTargets : (['all'] as Array<'all' | 'mobile' | 'desktop'>);
    const scopedPageTypeEntries = pageTypes.length > 0 ? pageTypes : ['homepage'];

    const contexts: ResolvedHomepagePublishContext[] = [];
    localityIds.forEach((localityId) => {
      scopedCategoryEntries.forEach((categoryId) => {
        const relevantSubcategories = categoryId
          ? scopedSubcategoryEntries.filter((subcategoryId) => !subcategoryId || getSubcategoryById(subcategoryId)?.categoryId === categoryId)
          : scopedSubcategoryEntries;
        (relevantSubcategories.length > 0 ? relevantSubcategories : [undefined]).forEach((subcategoryId) => {
          scopedPincodeEntries.forEach((pincode) => {
            scopedPlacementEntries.forEach((placementKey) => {
              scopedDeviceEntries.forEach((device) => {
                scopedPageTypeEntries.forEach((pageType) => {
                  contexts.push({ localityId, categoryId, subcategoryId, pincode, placementKey, device, pageType });
                });
              });
            });
          });
        });
      });
    });
    return contexts;
  };

  const publishScopeContexts = useMemo(() => buildPublishContextsFromDraft(publishScopeDraft), [publishScopeDraft]);
  const publishScopeCombinationCount = publishScopeContexts.length;

  const handlePublishResolvedHomepages = async (publishRequest?: string[] | ResolvedHomepagePublishRequest) => {
    if (!onPublishResolvedHomepages) {
      notify('Resolved homepage publish callback is not configured.');
      return;
    }
    try {
      const result = await onPublishResolvedHomepages(publishRequest);
      const publishedCount = typeof result === 'object' && result && 'publishedCount' in result ? result.publishedCount : undefined;
      notify(publishedCount ? `Published ${publishedCount} resolved homepage snapshot(s).` : 'Resolved homepage publish completed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish resolved homepages.';
      notify(message);
    }
  };

  const handlePublishPreviewContext = async () => {
    await handlePublishResolvedHomepages({
      contexts: [{
        localityId: resolvedPreviewDraft.localityId,
        categoryId: resolvedPreviewDraft.categoryId || undefined,
        subcategoryId: resolvedPreviewDraft.subcategoryId || undefined,
        pincode: resolvedPreviewDraft.pincode || undefined,
        placementKey: resolvedPreviewDraft.placementKey || undefined,
        device: resolvedPreviewDraft.device,
        pageType: resolvedPreviewDraft.pageType,
      }],
    });
  };

  const handlePublishScopedContexts = async () => {
    const localityIds = parseIdList(publishScopeDraft.localityIds);
    if (localityIds.length === 0) {
      notify('Select at least one locality before publishing a scoped snapshot set.');
      return;
    }
    if (publishScopeContexts.length === 0) {
      notify('No publish contexts were generated from the selected scope.');
      return;
    }
    await handlePublishResolvedHomepages({ contexts: publishScopeContexts });
  };

  const handleDeleteResolvedHomepageSnapshotSet = async (deleteRequest?: ResolvedHomepageSnapshotDeleteRequest) => {
    if (!onDeleteResolvedHomepageSnapshots) {
      notify('Resolved homepage snapshot delete callback is not configured.');
      return;
    }
    try {
      const result = await onDeleteResolvedHomepageSnapshots(deleteRequest);
      const deletedCount = typeof result === 'object' && result && 'deletedCount' in result ? result.deletedCount : undefined;
      notify(deletedCount ? `Deleted ${deletedCount} resolved homepage snapshot(s).` : 'Resolved homepage snapshot delete completed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete resolved homepage snapshots.';
      notify(message);
    }
  };

  const handleDeleteScopedSnapshots = async () => {
    if (publishScopeContexts.length === 0) {
      notify('No snapshot contexts are generated from the current scope.');
      return;
    }
    if (!confirm(`Delete ${publishScopeContexts.length} published snapshot context(s) from the current scope?`)) {
      return;
    }
    await handleDeleteResolvedHomepageSnapshotSet({ contexts: publishScopeContexts });
  };

  const handleDeleteSingleSnapshot = async (snapshotId: string) => {
    if (!snapshotId) return;
    if (!confirm('Delete this published snapshot?')) {
      return;
    }
    if (onDeleteScalablePublishedSnapshot) {
      try {
        await onDeleteScalablePublishedSnapshot(snapshotId);
        notify('Snapshot deleted.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete published snapshot.';
        notify(message);
      }
      return;
    }
    await handleDeleteResolvedHomepageSnapshotSet({ snapshotIds: [snapshotId] });
  };

  const handleRefreshPublishedSnapshots = async () => {
    if (!onRefreshScalablePublishedSnapshots) {
      notify('Snapshot refresh callback is not configured.');
      return;
    }
    try {
      await onRefreshScalablePublishedSnapshots();
      notify('Published snapshots refreshed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh published snapshots.';
      notify(message);
    }
  };

  const handleReseedScalableHomepageConfig = async (force = false) => {
    if (!onReseedScalableHomepageConfig) {
      notify('Scalable CMS reseed callback is not configured.');
      return;
    }
    try {
      const result = await onReseedScalableHomepageConfig(force);
      const summary = typeof result === 'object' && result && 'summary' in result ? result.summary : undefined;
      notify(summary
        ? `${force ? 'Force reseeded' : 'Reseeded'} scalable CMS: ${summary.templates || 0} templates, ${summary.campaigns || 0} campaigns.`
        : 'Scalable CMS reseeded from current homepage data.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reseed scalable homepage config.';
      notify(message);
    }
  };

  const handleLoadResolvedPreview = async () => {
    if (!resolvedHomepageEndpoint) {
      notify('Resolved homepage endpoint is not configured.');
      return;
    }
    if (!resolvedPreviewDraft.localityId) {
      notify('Select a locality for preview.');
      return;
    }

    setResolvedPreviewLoading(true);
    try {
      const params = new URLSearchParams({
        localityId: resolvedPreviewDraft.localityId,
        device: resolvedPreviewDraft.device,
        pageType: resolvedPreviewDraft.pageType,
        date: resolvedPreviewDraft.date || new Date().toISOString().slice(0, 10),
        usePublished: resolvedPreviewDraft.usePublished ? 'true' : 'false',
      });
      if (resolvedPreviewDraft.categoryId) params.set('categoryId', resolvedPreviewDraft.categoryId);
      if (resolvedPreviewDraft.subcategoryId) params.set('subcategoryId', resolvedPreviewDraft.subcategoryId);
      if (resolvedPreviewDraft.pincode) params.set('pincode', resolvedPreviewDraft.pincode);
      if (resolvedPreviewDraft.placementKey.trim()) params.set('placementKey', resolvedPreviewDraft.placementKey.trim());

      const response = await fetch(`${resolvedHomepageEndpoint}?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.payload) {
        throw new Error(payload?.error || 'Failed to load resolved homepage preview.');
      }

      setResolvedPreviewResult({
        source: payload.source || 'live_resolver',
        payload: payload.payload,
        resolution: payload.resolution,
      });
      notify(`Loaded ${payload.source || 'resolved'} homepage preview.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load resolved homepage preview.';
      notify(message);
    } finally {
      setResolvedPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Publish & Snapshots</h2>
        <p className="mt-0.5 text-xs text-slate-500">Publish locality pages, reseed legacy data, and manage scope-based releases, then review published snapshots and load resolved homepage previews.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-950">Publish & Snapshots</h3>
            <p className="text-[11px] text-slate-500 mt-1">Publish resolved homepage payloads and inspect what's live.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] md:w-[22rem]">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-emerald-700">Snapshots</div>
              <div className="mt-1 text-lg font-extrabold text-emerald-950">{scalableSnapshotCount}</div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-indigo-700">Templates</div>
              <div className="mt-1 text-lg font-extrabold text-indigo-950">{scalableTemplateCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-950">Scalable Homepage CMS</div>
              <div className="mt-1 text-[11px] text-emerald-800">
                Track templates, targeting assignments, campaigns, and published locality snapshots.
              </div>
            </div>
            <span className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-mono text-emerald-800">
              {scalableSnapshotCount} snapshots
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Templates</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableTemplateCount}</div>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Assignments</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableAssignmentCount}</div>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Campaigns</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableCampaignCount}</div>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Snapshots</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableSnapshotCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <div className="rounded-lg border border-amber-100 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Legacy Templates</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableLegacyOwnershipSummary.legacyManagedTemplates}</div>
              <div className="text-[10px] text-slate-500">Detached: {scalableLegacyOwnershipSummary.detachedTemplates}</div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Legacy Assignments</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableLegacyOwnershipSummary.legacyManagedAssignments}</div>
              <div className="text-[10px] text-slate-500">Detached: {scalableLegacyOwnershipSummary.detachedAssignments}</div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Legacy Campaigns</div>
              <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableLegacyOwnershipSummary.legacyManagedCampaigns}</div>
              <div className="text-[10px] text-slate-500">Detached: {scalableLegacyOwnershipSummary.detachedCampaigns}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { void handleReseedScalableHomepageConfig(false); }}
              className="flex-1 rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
            >
              Safe Reseed From Legacy
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirm('Force reseed from legacy data? This can overwrite scalable-authored state that was detached from legacy sync.')) return;
                void handleReseedScalableHomepageConfig(true);
              }}
              className="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 font-bold text-rose-700 hover:bg-rose-100"
            >
              Force Legacy Reseed
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { void handlePublishResolvedHomepages([primaryLocalityId]); }}
              className="flex-1 rounded-lg bg-[#1E3A8A] py-2 font-bold text-white hover:bg-[#1E3A8A]/90"
            >
              Publish Primary Locality
            </button>
            <button
              type="button"
              onClick={() => { void handlePublishResolvedHomepages(localities.map((locality) => locality.id)); }}
              className="flex-1 rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
            >
              Publish All Localities
            </button>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900">Bulk Publish Scope</div>
                <div className="text-[10px] text-slate-500">Build a structured publish set for locality, category, subcategory, pincode, placement, device, and page-type rollout.</div>
              </div>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-mono text-emerald-800">
                {publishScopeCombinationCount} contexts
              </span>
            </div>
            <OrderedSelectionPicker
              label="Publish localities"
              selectedIds={parseIdList(publishScopeDraft.localityIds)}
              options={localitySelectionOptions}
              onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, localityIds: nextIds.join(', ') }))}
              helperText="Choose the localities that should receive published snapshots in this batch."
              emptyText="No localities selected yet."
            />
            <OrderedCategoryPicker
              label="Publish categories"
              selectedIds={parseIdList(publishScopeDraft.categoryIds)}
              onChange={(nextIds) => setPublishScopeDraft((prev) => ({
                ...prev,
                categoryIds: nextIds.join(', '),
                subcategoryIds: parseIdList(prev.subcategoryIds)
                  .filter((subcategoryId) => {
                    const subcategory = getSubcategoryById(subcategoryId);
                    return subcategory ? nextIds.includes(subcategory.categoryId) : false;
                  })
                  .join(', '),
              }))}
              helperText="Optional category scopes for publishing. Leave empty to publish locality-wide snapshots."
            />
            <OrderedSelectionPicker
              label="Publish subcategories"
              selectedIds={parseIdList(publishScopeDraft.subcategoryIds)}
              options={publishSubcategorySelectionOptions}
              onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, subcategoryIds: nextIds.join(', ') }))}
              helperText="Optional subcategory scopes. These stay aligned to their parent categories during context generation."
              emptyText="No subcategories selected. Category-only or locality-only snapshots will be published."
            />
            <div className="grid gap-3 md:grid-cols-2">
              <OrderedSelectionPicker
                label="Publish pincodes"
                selectedIds={parsePincodeList(publishScopeDraft.pincodes)}
                options={pincodeSelectionOptions}
                onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, pincodes: nextIds.join(', ') }))}
                helperText="Optional pincode-specific publishes."
                emptyText="No pincodes selected. Snapshot contexts will not be pincode-scoped."
              />
              <OrderedSelectionPicker
                label="Publish placements"
                selectedIds={parseIdList(publishScopeDraft.placementKeys)}
                options={placementKeySelectionOptions}
                onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, placementKeys: nextIds.join(', ') }))}
                helperText="Optional placement-aware snapshot publishes."
                emptyText="No placement keys selected. Default placement context will be used."
              />
              <OrderedSelectionPicker
                label="Publish devices"
                selectedIds={parseIdList(publishScopeDraft.deviceTargets)}
                options={DEVICE_SELECTION_OPTIONS}
                onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, deviceTargets: nextIds.join(', ') }))}
                helperText="Choose which device targets should get snapshots."
                emptyText="No devices selected. The publish flow will fall back to all devices."
              />
              <OrderedSelectionPicker
                label="Publish page types"
                selectedIds={parseIdList(publishScopeDraft.pageTypes)}
                options={PAGE_TYPE_SELECTION_OPTIONS}
                onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, pageTypes: nextIds.join(', ') }))}
                helperText="Choose which page types should be published in this batch."
                emptyText="No page types selected. The publish flow will default to homepage."
              />
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-900">
              {publishScopeCombinationCount > 0
                ? `Ready to publish ${publishScopeCombinationCount} context${publishScopeCombinationCount === 1 ? '' : 's'} across the selected scope.`
                : 'No valid publish contexts are currently generated from this scope.'}
            </div>
            <button
              type="button"
              onClick={() => { void handlePublishScopedContexts(); }}
              className="w-full rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
            >
              Publish Scoped Snapshot Set
            </button>
            <button
              type="button"
              onClick={() => { void handleDeleteScopedSnapshots(); }}
              className="w-full rounded-lg border border-rose-200 bg-rose-50 py-2 font-bold text-rose-700 hover:bg-rose-100"
            >
              Delete Scoped Snapshot Set
            </button>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900">Published Snapshots</div>
                <div className="text-[10px] text-slate-500">Recent resolved payloads saved by the publish workflow.</div>
              </div>
              <div className="flex items-center gap-2">
                {onRefreshScalablePublishedSnapshots && (
                  <button
                    type="button"
                    onClick={() => { void handleRefreshPublishedSnapshots(); }}
                    className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-50"
                  >
                    Refresh
                  </button>
                )}
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-mono text-emerald-800">
                  {recentPublishedSnapshots.length} recent
                </span>
              </div>
            </div>
            {recentPublishedSnapshots.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {recentPublishedSnapshots.map((snapshot) => (
                  <div key={snapshot.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-700">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700">{snapshot.localityId}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700">{snapshot.deviceTarget}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700">{snapshot.pageType}</span>
                    </div>
                    <div className="mt-2 font-semibold text-slate-900">{snapshot.payload.template?.name || 'No template'}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {snapshot.categoryId || 'all'} / {snapshot.subcategoryId || 'all'} / {snapshot.pincode || 'all'} / {snapshot.placementKey || 'default'}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded border border-slate-200 bg-white px-2 py-1">
                        <div className="text-[9px] uppercase tracking-wide text-slate-500">Sections</div>
                        <div className="font-bold text-slate-900">{snapshot.payload.sections.length}</div>
                      </div>
                      <div className="rounded border border-slate-200 bg-white px-2 py-1">
                        <div className="text-[9px] uppercase tracking-wide text-slate-500">Ads</div>
                        <div className="font-bold text-slate-900">{snapshot.payload.listingAds.length}</div>
                      </div>
                      <div className="rounded border border-slate-200 bg-white px-2 py-1">
                        <div className="text-[9px] uppercase tracking-wide text-slate-500">Sponsored</div>
                        <div className="font-bold text-slate-900">{snapshot.payload.sponsoredListings.length}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500">
                      Published {String(snapshot.publishedAt || snapshot.updatedAt || '').replace('T', ' ').slice(0, 16)}
                    </div>
                    <button
                      type="button"
                      onClick={() => { void handleDeleteSingleSnapshot(snapshot.id); }}
                      className="mt-2 w-full rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Delete Snapshot
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-[11px] text-slate-500">
                No published snapshots yet. Publish a locality to persist and inspect resolved payloads.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-900">Resolved Homepage Preview</div>
              <div className="text-[10px] text-slate-500">Preview the final locality-aware payload returned by the resolver or published snapshot layer.</div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <select
                value={resolvedPreviewDraft.localityId}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, localityId: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
              >
                {localities.map((locality) => (
                  <option key={locality.id} value={locality.id}>{locality.name}</option>
                ))}
              </select>
              <select
                value={resolvedPreviewDraft.device}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, device: e.target.value as 'all' | 'mobile' | 'desktop' }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
              >
                <option value="all">All devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
              <select
                value={resolvedPreviewDraft.pageType}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, pageType: e.target.value as 'homepage' | 'listing_results' }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
              >
                <option value="homepage">Homepage</option>
                <option value="listing_results">Listing results</option>
              </select>
              <input
                type="date"
                value={resolvedPreviewDraft.date}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
              />
              <select
                value={resolvedPreviewDraft.categoryId}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
              >
                <option value="">All categories</option>
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={resolvedPreviewDraft.subcategoryId}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
              >
                <option value="">All subcategories</option>
                {getSubcategoriesForCategory(resolvedPreviewDraft.categoryId || BUSINESS_CATEGORIES[0]?.id || '').map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
              <input
                value={resolvedPreviewDraft.pincode}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="Pincode"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-mono"
              />
              <input
                value={resolvedPreviewDraft.placementKey}
                onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, placementKey: e.target.value }))}
                placeholder="Placement key (optional)"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-mono"
              />
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  checked={resolvedPreviewDraft.usePublished}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, usePublished: e.target.checked }))}
                />
                <span>Use published snapshots</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => { void handleLoadResolvedPreview(); }}
              disabled={resolvedPreviewLoading}
              className="w-full rounded-lg bg-[#1E3A8A] py-2 font-bold text-white hover:bg-[#1E3A8A]/90 disabled:opacity-50"
            >
              {resolvedPreviewLoading ? 'Loading preview...' : 'Load Resolved Preview'}
            </button>
            <button
              type="button"
              onClick={() => { void handlePublishPreviewContext(); }}
              className="w-full rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
            >
              Publish This Preview Context
            </button>
            {resolvedPreviewResult && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-[11px] text-slate-700 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 font-mono text-emerald-800">
                    {resolvedPreviewResult.source}
                  </span>
                  {resolvedPreviewResult.resolution?.strategy && (
                    <span className="rounded-full border border-sky-200 bg-white px-2 py-0.5 font-mono text-sky-700">
                      {resolvedPreviewResult.resolution.strategy}
                    </span>
                  )}
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-slate-600">
                    {resolvedPreviewResult.payload.template?.name || 'No template'}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-slate-600">
                    {resolvedPreviewResult.payload.context.pageType}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-slate-600">
                    {resolvedPreviewResult.payload.context.date}
                  </span>
                </div>
                {resolvedPreviewResult.resolution && (
                  <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[10px] text-sky-900 space-y-1">
                    <div>
                      <span className="font-bold">Resolver provenance:</span>{' '}
                      {resolvedPreviewResult.resolution.usedPublished ? 'Published snapshot served' : 'Live resolver served'}
                    </div>
                    <div className="font-mono break-all">
                      requested={resolvedPreviewResult.resolution.requestedSnapshotId}
                      {resolvedPreviewResult.resolution.snapshot?.id ? ` | served=${resolvedPreviewResult.resolution.snapshot.id}` : ''}
                      {resolvedPreviewResult.resolution.template?.id ? ` | template=${resolvedPreviewResult.resolution.template.id}` : ''}
                    </div>
                    {resolvedPreviewResult.resolution.snapshot && (
                      <div className="font-mono break-all">
                        score={resolvedPreviewResult.resolution.snapshot.score} | published={String(resolvedPreviewResult.resolution.snapshot.publishedAt || resolvedPreviewResult.resolution.snapshot.updatedAt || '').replace('T', ' ').slice(0, 16)}
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-[10px] font-mono text-slate-600">
                  {[
                    `locality=${resolvedPreviewResult.payload.context.localityId}`,
                    `category=${resolvedPreviewResult.payload.context.categoryId || 'all'}`,
                    `subcategory=${resolvedPreviewResult.payload.context.subcategoryId || 'all'}`,
                    `pincode=${resolvedPreviewResult.payload.context.pincode || 'all'}`,
                    `device=${resolvedPreviewResult.payload.context.device}`,
                    `placement=${resolvedPreviewResult.payload.context.placementKey || 'default'}`,
                  ].join(' | ')}
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Sections</div>
                    <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.sections.length}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Hero Banners</div>
                    <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.heroBanners.length}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Ads</div>
                    <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.listingAds.length}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Sponsored</div>
                    <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.sponsoredListings.length}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Offers</div>
                    <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.offers.length}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Content</div>
                    <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.contentBlocks.length}</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Section Pools</div>
                    <div className="mt-1 font-extrabold text-slate-950">{Object.keys(resolvedPreviewResult.payload.sectionBusinessIdsBySection || {}).length}</div>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Section Titles</div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      {resolvedPreviewResult.payload.sections.length > 0
                        ? resolvedPreviewResult.payload.sections.slice(0, 8).map((section) => section.title).join(', ')
                        : 'No sections'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Hero Titles</div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      {resolvedPreviewResult.payload.heroBanners.length > 0
                        ? resolvedPreviewResult.payload.heroBanners.slice(0, 5).map((hero) => hero.title).join(', ')
                        : 'No hero banners'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Ad Titles</div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      {resolvedPreviewResult.payload.listingAds.length > 0
                        ? resolvedPreviewResult.payload.listingAds.slice(0, 5).map((ad) => ad.title).join(', ')
                        : 'No ads'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Sponsored Listings</div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      {resolvedPreviewResult.payload.sponsoredListings.length > 0
                        ? resolvedPreviewResult.payload.sponsoredListings.slice(0, 5).map((business) => business.name).join(', ')
                        : 'No sponsored listings'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Offers</div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      {resolvedPreviewResult.payload.offers.length > 0
                        ? resolvedPreviewResult.payload.offers.slice(0, 5).map((offer) => offer.title || offer.code).join(', ')
                        : 'No offers'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Content Blocks</div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      {resolvedPreviewResult.payload.contentBlocks.length > 0
                        ? resolvedPreviewResult.payload.contentBlocks.slice(0, 5).map((item) => item.title).join(', ')
                        : 'No content blocks'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 md:col-span-2">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Section Inventory</div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      {resolvedPreviewResult.payload.sections.length > 0
                        ? resolvedPreviewResult.payload.sections.slice(0, 8).map((section) => {
                            const inventoryCount = (resolvedPreviewResult.payload.sectionBusinessIdsBySection?.[section.id] || []).length;
                            return `${section.title}: ${inventoryCount}`;
                          }).join(' | ')
                        : 'No sections'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
