// One screen for every banner on the site.
//
// It replaces three: the legacy Ad Banners form (wrote `homepage_listing_ads`,
// which the site never read), the Hero Banners page (wrote
// `homepage_hero_banners`, which only survived in localStorage) and the
// campaign-shaped half of the Campaign Builder. Everything here writes a
// CAMPAIGN, because `resolveHomepageForContext` builds the payload the site
// renders from `resolveCampaignPayloads` and nothing else.
//
// The table's "Live" column is the point of the screen: it runs the same
// conditions the server does, so a banner that cannot render says why here
// rather than being hunted for on the public site.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import type { Business, Locality, ScalableCampaign, ScalableHomepageConfigState, UserSession } from '../../types';
import { uploadAdminMediaImage } from '../../services/admin/adminConsoleUtils';
import {
  BANNER_SLOTS,
  type BannerDraft,
  type BannerMetrics,
  bannerDraftFromCampaign,
  buildBannerCampaign,
  describeBannerCtr,
  describeBannerAssetAdvice,
  describeBannerSlotSize,
  emptyBannerDraft,
  evaluateBannerDelivery,
  findBannerSlot,
  isSeededFallbackBanner,
  loadBannerMetrics,
  withBannerStatus,
} from '../../services/admin/bannerStudio';

type BannerStudioPanelProps = {
  localities: Locality[];
  /** Only id + name are read, so the taxonomy catalogue can be passed straight in. */
  categories: Array<{ id: string; name: string }>;
  businesses: Business[];
  userSession?: UserSession;
  scalableHomepageConfig?: ScalableHomepageConfigState | null;
  publishedSnapshotLocalityIds?: string[];
  onSaveScalableCampaign?: (campaign: ScalableCampaign) => Promise<unknown> | void;
  onDeleteScalableCampaign?: (campaignId: string) => Promise<unknown> | void;
  canManage: boolean;
};

const FIELD = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none';
const LABEL = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500';

const parseList = (value: string) => value.split(',').map((entry) => entry.trim()).filter(Boolean);

export default function BannerStudioPanel({
  localities,
  categories,
  businesses,
  userSession,
  scalableHomepageConfig,
  publishedSnapshotLocalityIds = [],
  onSaveScalableCampaign,
  onDeleteScalableCampaign,
  canManage,
}: BannerStudioPanelProps) {
  const [draft, setDraft] = useState<BannerDraft>(() => emptyBannerDraft(localities[0]?.id || ''));
  const [busy, setBusy] = useState<'' | 'upload' | 'save' | 'delete' | 'status'>('');
  // Delivery counters, read once per mount. An empty map just means the
  // performance columns show dashes.
  const [metrics, setMetrics] = useState<Map<string, BannerMetrics>>(() => new Map());
  const refreshMetrics = useCallback(() => {
    void loadBannerMetrics(userSession?.authToken).then(setMetrics);
  }, [userSession?.authToken]);
  useEffect(() => { refreshMetrics(); }, [refreshMetrics]);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof BannerDraft>(key: K, value: BannerDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // Only the slots that belong to the chosen banner type and page.
  const slotOptions = useMemo(() => BANNER_SLOTS.filter((slot) => (
    slot.campaignType === draft.campaignType && slot.pageType === draft.pageType
  )), [draft.campaignType, draft.pageType]);

  const slot = findBannerSlot(draft.placementKey, draft.campaignType);
  const verdict = evaluateBannerDelivery(draft, {
    hasSnapshotForLocality: draft.localityIds.some((id) => publishedSnapshotLocalityIds.includes(id)),
  });

  const banners = useMemo(() => (scalableHomepageConfig?.campaigns || [])
    .filter((campaign) => campaign.campaignType === 'listing_ad' || campaign.campaignType === 'hero_banner')
    .map((campaign) => {
      const asDraft = bannerDraftFromCampaign(campaign);
      return {
        campaign,
        draft: asDraft,
        verdict: evaluateBannerDelivery(asDraft, {
          hasSnapshotForLocality: asDraft.localityIds.some((id) => publishedSnapshotLocalityIds.includes(id)),
        }),
      };
    })
    .sort((left, right) => right.campaign.priority - left.campaign.priority
      || left.campaign.name.localeCompare(right.campaign.name)),
  [scalableHomepageConfig, publishedSnapshotLocalityIds]);

  const pickImage = async (file: File | null) => {
    if (!file) return;
    setBusy('upload'); setNotice(null);
    try {
      const folder = `homepage-banners/${draft.campaignType}/${draft.placementKey || 'hero'}`;
      const url = await uploadAdminMediaImage(file, folder, userSession?.authToken);
      set('imageUrl', typeof url === 'string' ? url : String((url as { url?: string })?.url || ''));
      setNotice({ tone: 'ok', text: 'Image uploaded.' });
    } catch (error) {
      setNotice({ tone: 'bad', text: (error as Error)?.message || 'Upload failed.' });
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    // Both of these used to be silent returns — the button appeared to work and
    // nothing reached the server, which is indistinguishable from a save that
    // succeeded and then failed to deliver. Every refusal now says so.
    if (!onSaveScalableCampaign) {
      setNotice({ tone: 'bad', text: 'This screen has no save handler wired, so nothing can be saved. That is a wiring fault, not something you can fix here.' });
      return;
    }
    if (!canManage) {
      setNotice({ tone: 'bad', text: 'Your role cannot manage campaigns, so this will not save.' });
      return;
    }
    if (!draft.name.trim()) { setNotice({ tone: 'bad', text: 'Give the banner a name.' }); return; }
    setBusy('save'); setNotice(null);
    try {
      await onSaveScalableCampaign(buildBannerCampaign(draft));
      setNotice({
        tone: verdict.live ? 'ok' : 'bad',
        text: verdict.live
          ? 'Saved and published. It should be on the site now.'
          : `Saved, but it will NOT render: ${verdict.reasons[0]}`,
      });
      setDraft(emptyBannerDraft(localities[0]?.id || ''));
    } catch (error) {
      setNotice({ tone: 'bad', text: (error as Error)?.message || 'Save failed.' });
    } finally { setBusy(''); }
  };

  // Pause and Make live, which the retired ops panel had and the form-only
  // screen did not: changing status meant opening Edit and finding a dropdown.
  const setStatus = async (campaign: ScalableCampaign, status: ScalableCampaign['status']) => {
    if (!onSaveScalableCampaign) return;
    setBusy('status'); setNotice(null);
    try {
      await onSaveScalableCampaign(withBannerStatus(campaign, status));
      setNotice({
        tone: 'ok',
        text: status === 'active'
          ? `"${campaign.name}" is live. The snapshot for its localities was refreshed.`
          : `"${campaign.name}" is paused and will stop showing.`,
      });
    } catch (error) {
      setNotice({ tone: 'bad', text: (error as Error)?.message || 'Status change failed.' });
    } finally { setBusy(''); }
  };

  const remove = async (campaignId: string) => {
    if (!onDeleteScalableCampaign) return;
    setBusy('delete');
    try { await onDeleteScalableCampaign(campaignId); }
    catch (error) { setNotice({ tone: 'bad', text: (error as Error)?.message || 'Delete failed.' }); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Banners</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Every banner on the site — hero, strips and in-feed placements — created and managed here.
          {!canManage && <span className="ml-1 font-semibold text-amber-700">(view-only for your role)</span>}
        </p>
      </div>

      {/* A disabled screen looked almost identical to a working one: one small
          parenthetical in the subtitle. If nothing here can save, say it once,
          loudly, above the form. */}
      {!canManage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          Your role cannot manage campaigns. You can read this screen, but nothing on it will save.
        </div>
      )}

      {notice && (
        <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${notice.tone === 'ok'
          ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
          : 'border-rose-100 bg-rose-50 text-rose-800'}`}>
          {notice.text}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className={LABEL}>Banner name (internal)</label>
            <input className={FIELD} value={draft.name} disabled={!canManage}
              onChange={(event) => set('name', event.target.value)}
              placeholder="RRWA — Discover Local (hero)" />
          </div>

          <div>
            <label className={LABEL}>Banner type</label>
            <select className={FIELD} value={draft.campaignType} disabled={!canManage}
              onChange={(event) => {
                const next = event.target.value as BannerDraft['campaignType'];
                setDraft((prev) => ({
                  ...prev,
                  campaignType: next,
                  placementKey: BANNER_SLOTS.find((s) => s.campaignType === next && s.pageType === prev.pageType)?.placementKey ?? '',
                }));
              }}>
              <option value="listing_ad">Placed banner (choose a slot)</option>
              <option value="hero_banner">Hero carousel banner</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>1. Page</label>
            <select className={FIELD} value={draft.pageType} disabled={!canManage}
              onChange={(event) => set('pageType', event.target.value as BannerDraft['pageType'])}>
              <option value="homepage">Homepage / locality</option>
              <option value="listing_results">Search results</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>2. Placement</label>
            <select className={FIELD} value={draft.placementKey} disabled={!canManage || draft.campaignType === 'hero_banner'}
              onChange={(event) => set('placementKey', event.target.value)}>
              {slotOptions.map((option) => (
                <option key={option.placementKey || 'hero'} value={option.placementKey}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* The size hint that would have stopped a 1000x200 desktop strip going
              into a 358px mobile-only slot. */}
          {slot && (
            <div className="md:col-span-3 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-[11px] text-indigo-900">
              <span className="font-bold">{describeBannerSlotSize(slot)}</span>
              <span className="ml-1 text-indigo-700">{describeBannerAssetAdvice(slot)}</span>
              {slot.note && <div className="mt-0.5 text-indigo-800">{slot.note}</div>}
            </div>
          )}

          <div>
            <label className={LABEL}>Locality</label>
            <select className={FIELD} value={draft.localityIds[0] || ''} disabled={!canManage}
              onChange={(event) => set('localityIds', event.target.value ? [event.target.value] : [])}>
              <option value="">All localities</option>
              {localities.map((locality) => <option key={locality.id} value={locality.id}>{locality.name}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL}>3. Pincodes</label>
            <input className={FIELD} value={draft.pincodes.join(', ')} disabled={!canManage}
              onChange={(event) => set('pincodes', parseList(event.target.value))}
              placeholder="Blank = the whole locality" />
            <p className="mt-1 text-[10px] leading-tight text-slate-500">
              Leave blank unless you must narrow inside the locality. A pincode here hides the banner
              from every visitor who has not chosen that pincode.
            </p>
          </div>

          <div>
            <label className={LABEL}>4. Category</label>
            <select className={FIELD} value={draft.categoryIds[0] || ''} disabled={!canManage}
              onChange={(event) => set('categoryIds', event.target.value ? [event.target.value] : [])}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <p className="mt-1 text-[10px] leading-tight text-slate-500">
              Search-results banners only. The homepage sends no category, so a category here stops a
              homepage banner rendering at all.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>5. Image</label>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" disabled={!canManage || busy === 'upload'}
                onChange={(event) => void pickImage(event.target.files?.[0] || null)}
                className="block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-indigo-700" />
              {busy === 'upload' && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />}
            </div>
            {draft.imageUrl && (
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <img src={draft.imageUrl} alt="Banner preview" className="block max-h-[130px] w-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className={LABEL}>Device</label>
            <select className={FIELD} value={draft.deviceTarget} disabled={!canManage}
              onChange={(event) => set('deviceTarget', event.target.value as BannerDraft['deviceTarget'])}>
              <option value="all">Desktop + mobile</option>
              <option value="desktop">Desktop only</option>
              <option value="mobile">Mobile only</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>6. On click</label>
            <select className={FIELD} value={draft.actionType} disabled={!canManage}
              onChange={(event) => set('actionType', event.target.value as BannerDraft['actionType'])}>
              <option value="landing_page">Open a URL</option>
              <option value="landing_listing">Open a listing</option>
              <option value="lead_form">Lead form</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>{draft.actionType === 'landing_listing' ? 'Listing' : 'Landing URL'}</label>
            {draft.actionType === 'landing_listing' ? (
              <select className={FIELD} value={draft.targetBusinessId} disabled={!canManage}
                onChange={(event) => set('targetBusinessId', event.target.value)}>
                <option value="">Select a listing</option>
                {businesses.slice(0, 400).map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            ) : (
              <input className={FIELD} value={draft.targetUrl} disabled={!canManage}
                onChange={(event) => set('targetUrl', event.target.value)} placeholder="https://…" />
            )}
          </div>

          <div>
            <label className={LABEL}>7. Start date</label>
            <input type="date" className={FIELD} value={draft.startDate} disabled={!canManage}
              onChange={(event) => set('startDate', event.target.value)} />
          </div>
          <div>
            <label className={LABEL}>8. End date</label>
            <input type="date" className={FIELD} value={draft.endDate} disabled={!canManage}
              onChange={(event) => set('endDate', event.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Status / priority</label>
            <div className="flex gap-2">
              <select className={FIELD} value={draft.status} disabled={!canManage}
                onChange={(event) => set('status', event.target.value as BannerDraft['status'])}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
              <input type="number" className={FIELD} value={draft.priority} disabled={!canManage}
                onChange={(event) => set('priority', Number(event.target.value) || 0)} />
            </div>
          </div>

          {/* A hero banner's title/subtitle are drawn OVER the image by PromoCard,
              under a navy scrim — so a designed creative wants them blank. */}
          <div className="md:col-span-3">
            <label className={LABEL}>
              Overlay text {draft.campaignType === 'hero_banner' && (
                <span className="font-semibold normal-case tracking-normal text-amber-700">
                  — drawn over the image under a dark gradient. Leave blank if the artwork already has its own headline.
                </span>
              )}
            </label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input className={FIELD} value={draft.title} disabled={!canManage}
                onChange={(event) => set('title', event.target.value)} placeholder="Title (optional)" />
              <input className={FIELD} value={draft.description} disabled={!canManage}
                onChange={(event) => set('description', event.target.value)} placeholder="Subtitle (optional)" />
              <input className={FIELD} value={draft.ctaText} disabled={!canManage}
                onChange={(event) => set('ctaText', event.target.value)} placeholder="CTA label (optional)" />
            </div>
          </div>
        </div>

        {/* Says up front whether this will render, and why not. */}
        <div className={`mt-3 rounded-lg border px-3 py-2 text-[11px] ${verdict.live
          ? 'border-emerald-100 bg-emerald-50 text-emerald-900'
          : 'border-rose-100 bg-rose-50 text-rose-900'}`}>
          <div className="flex items-center gap-1.5 font-bold">
            {verdict.live ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {verdict.live ? 'This will render' : 'This will NOT render'}
          </div>
          {verdict.reasons.map((reason) => <div key={reason} className="mt-0.5">• {reason}</div>)}
          {verdict.warnings.map((warning) => <div key={warning} className="mt-0.5 text-amber-800">• {warning}</div>)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void save()} disabled={!canManage || busy === 'save'}
            title={canManage ? undefined : 'Your role cannot manage campaigns'}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
            {busy === 'save' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {draft.id ? 'Update banner' : 'Create banner'}
          </button>
          {draft.id && (
            <button type="button" onClick={() => setDraft(emptyBannerDraft(localities[0]?.id || ''))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
              Cancel edit
            </button>
          )}
          {draft.id && (
            <span className="text-[11px] text-slate-500">Editing <code className="rounded bg-slate-100 px-1">{draft.id}</code></span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">All banners ({banners.length})</h3>
          <span className="text-[11px] text-slate-500">
            Impressions, clicks and leads: last 30 days.
            <button type="button" onClick={refreshMetrics} className="ml-1.5 font-bold text-indigo-600 underline">Refresh</button>
          </span>
        </div>
        {banners.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No banners yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-[11px]">
              <thead className="text-slate-500">
                <tr>
                  {['', 'Name', 'Placement', 'Locality', 'Dates', 'Live', 'Impr.', 'Clicks', 'CTR', 'Leads', ''].map((heading, index) => (
                    <th key={`${heading}-${index}`} className="px-2 py-1.5 font-bold uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {banners.map(({ campaign, draft: row, verdict: rowVerdict }) => (
                  <tr key={campaign.id} className="border-t border-slate-100 align-top">
                    <td className="px-2 py-2">
                      {row.imageUrl
                        ? <img src={row.imageUrl} alt="" className="h-8 w-14 rounded object-cover" />
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-2 py-2">
                      <div className="font-bold text-slate-900">{campaign.name}</div>
                      <div className="text-slate-500">
                        {campaign.campaignType === 'hero_banner' ? 'Hero carousel' : 'Placed banner'} · p{campaign.priority}
                        {campaign.status !== 'active' && (
                          <span className="ml-1 font-bold uppercase tracking-wide text-amber-700">{campaign.status}</span>
                        )}
                        {isSeededFallbackBanner(campaign) && (
                          <span className="ml-1 rounded bg-slate-100 px-1 py-0.5 font-bold uppercase tracking-wide text-slate-500">seeded</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {findBannerSlot(row.placementKey, row.campaignType)?.label || row.placementKey || '—'}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {row.localityIds.length > 0 ? row.localityIds.join(', ') : 'all'}
                      {row.pincodes.length > 0 && <div className="text-slate-400">{row.pincodes.join(', ')}</div>}
                    </td>
                    <td className="px-2 py-2 text-slate-600">{row.startDate || '—'} → {row.endDate || '—'}</td>
                    <td className="px-2 py-2">
                      {rowVerdict.live
                        ? <span className="font-bold text-emerald-700">Live</span>
                        : (
                          <div>
                            <span className="font-bold text-rose-700">Not live</span>
                            <div className="text-rose-600">{rowVerdict.reasons[0]}</div>
                          </div>
                        )}
                    </td>
                    {/* Counters come from ad_metric_daily, keyed by campaign id.
                        A dash means nothing recorded yet, which is different from
                        zero and should look different. */}
                    <td className="px-2 py-2 tabular-nums text-slate-700">
                      {metrics.get(campaign.id)?.impressions?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-slate-700">
                      {metrics.get(campaign.id)?.clicks?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-2 py-2 tabular-nums font-bold text-slate-800">
                      {describeBannerCtr(metrics.get(campaign.id))}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-slate-700">
                      {metrics.get(campaign.id)?.leads?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {isSeededFallbackBanner(campaign) ? (
                          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500">
                            From homepage-config.json
                          </span>
                        ) : campaign.status === 'active' ? (
                          <button type="button" onClick={() => void setStatus(campaign, 'inactive')}
                            disabled={!canManage || busy === 'status'}
                            className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 font-bold text-amber-800 disabled:opacity-50">
                            <Pause className="h-3 w-3" /> Pause
                          </button>
                        ) : (
                          <button type="button" onClick={() => void setStatus(campaign, 'active')}
                            disabled={!canManage || busy === 'status'}
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-bold text-emerald-800 disabled:opacity-50">
                            <Play className="h-3 w-3" /> Make live
                          </button>
                        )}
                        <button type="button" onClick={() => setDraft(row)} disabled={!canManage}
                          className="rounded border border-slate-200 px-2 py-1 font-bold text-slate-700 disabled:opacity-50">Edit</button>
                        <button type="button" onClick={() => void remove(campaign.id)} disabled={!canManage}
                          className="rounded border border-rose-200 px-2 py-1 font-bold text-rose-700 disabled:opacity-50">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {banners.some(({ campaign }) => isSeededFallbackBanner(campaign)) && (
              <p className="mt-2 text-[11px] text-slate-500">
                Rows marked <span className="font-bold uppercase">seeded</span> come from
                {' '}<code className="rounded bg-slate-100 px-1">homepage-config.json</code> and are re-synced from that
                file, so pausing one here would not hold. They are fallbacks only — any banner you create for the same
                locality now takes the slot ahead of them.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
