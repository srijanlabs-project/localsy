import React, { useState } from 'react';
import type { AdLead, Business, ListingAd, Locality, UserSession } from '../../types';
import AdOperationsPanel from '../../components/admin/AdOperationsPanel';
import AdvertiserCreativeFormPanel from '../../components/admin/AdvertiserCreativeFormPanel';
import { OrderedCategoryPicker } from '../../components/admin/AdminConsoleSharedControls';
import { getMediaProxyUrl } from '../../utils/mediaUrl';
import {
  buildListingTags,
  parsePincodeList,
  slugifyForPath,
  uploadAdminMediaImage,
} from '../../services/admin/adminConsoleUtils';

type AdminAdBannersPageProps = {
  localities: Locality[];
  businesses: Business[];
  listingAds?: ListingAd[];
  adLeads?: AdLead[];
  userSession?: UserSession;
  onCreateListingAd?: (ad: Omit<ListingAd, 'id'>) => void;
  onUpdateListingAd?: (ad: ListingAd) => void;
  onDeleteListingAd?: (adId: string) => void;
};

// Routed home for admin-backend-ux-spec.md Section 5.20 "Campaigns: Ad Banners" — the most
// involved of the Campaigns & Offers pages. Reuses the existing, fully-controlled
// `AdOperationsPanel` (owns its own UI-only selection/filter/analytics-range state, takes all
// data/handlers as props) and `AdvertiserCreativeFormPanel` (zero internal state, fully
// controlled creative-authoring form) unchanged, plus the existing `AdminConsoleProps`
// listing-ad callback props unchanged. Local state/logic ported verbatim from
// `src/components/AdminConsole.tsx`:
//   - lines 314-347: `currentAdminDateIso` (hardcoded '2026-07-30' admin "today" reference,
//     not derived from Date.now()) and all 25 `adXxx` useState hooks (adLocalityId defaults to
//     localities[0]?.id here instead of the legacy `primaryLocalityId` closure variable).
//   - lines 776-837: `resetListingAdForm` and `beginEditListingAd`.
//   - lines 1230-1291: the 5 pure helpers (`getDerivedAdLeadCount`, `getAdCtr`, `getAdCpl`,
//     `getAdOpsPriorityScore`, `getAdOpsSlaLabel`) and the derived-data blocks
//     (`pendingReviewAds`, `prioritizedPendingReviewAds`, `liveOrApprovedAds`, `rejectedAds`,
//     `adPerformanceSummary`) — all pure functions of `filteredListingAds`/`adLeads`/
//     `currentAdminDateIso`.
//   - lines 1292-1320: `handleAdWorkflowTransition`, `handleAdRejection` and
//     `handleAdReviewRequest` (both still use `window.prompt`, kept as-is), rewired to this
//     page's own local `notify` helper instead of the console's shared `triggerNotification`.
//   - line 747: `getListingAdFolder`.
//   - lines 1716-1802: `handleCreateListingAdSubmit`.
//   - lines 6291-6390: the `AdOperationsPanel` / `AdvertiserCreativeFormPanel` wiring,
//     including the inline `categoryPicker` built from `<OrderedCategoryPicker>` bound to
//     local `adCategoryIds`/`setAdCategoryIds`.
// The legacy `uploadBannerImage` helper (lines 713-744) closed over the enclosing component's
// `userSession`; this page instead uses the generalized `uploadAdminMediaImage(file, folder,
// authToken)` from `adminConsoleUtils.ts`, passing `userSession?.authToken` explicitly.
//
// Deliberate deviation: the legacy `filteredListingAds` derivation (around line 1219) filters
// against the console's SHARED cross-cutting filter bar (`adminLocalityFilter` /
// `adminStatusFilter` / `adminSearchQuery`). This page has no shared filter bar, so it owns a
// small local filter scoped just to this screen (locality + active/inactive + search) and
// applies the same filter logic shape against local state instead.
//
// Note: a known mojibake artifact (garbled UTF-8 in a `meta` string built from category +
// locality name, involving `approvedBusinessSelectionOptions` around AdminConsole.tsx line
// 1206) was checked for during porting; that derived value is not used by this page's props,
// so nothing was carried over from it.
//
// The legacy Campaigns > Ad Banners tab in AdminConsole.tsx is left completely untouched.
export default function AdminAdBannersPage({
  localities,
  businesses,
  listingAds = [],
  adLeads = [],
  userSession,
  onCreateListingAd,
  onUpdateListingAd,
  onDeleteListingAd,
}: AdminAdBannersPageProps) {
  const primaryLocalityId = localities[0]?.id || '';
  const currentAdminDateIso = '2026-07-30';

  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adBadge, setAdBadge] = useState('Sponsored');
  const [adCtaText, setAdCtaText] = useState('Know More');
  const [adBgColor, setAdBgColor] = useState('#1d4ed8');
  const [adStartDate, setAdStartDate] = useState(currentAdminDateIso);
  const [adEndDate, setAdEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [adActionType, setAdActionType] = useState<ListingAd['actionType']>('landing_page');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adTargetBusinessId, setAdTargetBusinessId] = useState('');
  const [adSellerBusinessId, setAdSellerBusinessId] = useState('');
  const [adLocalityId, setAdLocalityId] = useState(primaryLocalityId);
  const [adPincodes, setAdPincodes] = useState('');
  const [adCategoryIds, setAdCategoryIds] = useState<string[]>([]);
  const [adTags, setAdTags] = useState('');
  const [adPlacementKey, setAdPlacementKey] = useState('homepage_inline_primary');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adImageUploading, setAdImageUploading] = useState(false);
  const [adDeviceTarget, setAdDeviceTarget] = useState<NonNullable<ListingAd['deviceTarget']>>('all');
  const [adMobileRowPosition, setAdMobileRowPosition] = useState('3');
  const [adWorkflowStatus, setAdWorkflowStatus] = useState<NonNullable<ListingAd['workflowStatus']>>('submitted');
  const [adBillingModel, setAdBillingModel] = useState<NonNullable<ListingAd['billingModel']>>('fixed');
  const [adRotationMode, setAdRotationMode] = useState<NonNullable<ListingAd['rotationMode']>>('even');
  const [adPlannedBudget, setAdPlannedBudget] = useState('15000');
  const [adSpentBudget, setAdSpentBudget] = useState('0');
  const [adCpcBid, setAdCpcBid] = useState('25');
  const [adImpressions, setAdImpressions] = useState('0');
  const [adClicks, setAdClicks] = useState('0');
  const [adReviewNotes, setAdReviewNotes] = useState('');
  const [adEditId, setAdEditId] = useState<string | null>(null);
  const [adFormError, setAdFormError] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  // Local-only filter scoped to this screen (see header comment for why this differs from
  // the legacy shared filter bar).
  const [adsLocalityFilter, setAdsLocalityFilter] = useState<'all' | string>('all');
  const [adsStatusFilter, setAdsStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [adsSearchQuery, setAdsSearchQuery] = useState('');

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const resetListingAdForm = () => {
    setAdTitle('');
    setAdDescription('');
    setAdBadge('Sponsored');
    setAdCtaText('Know More');
    setAdTargetUrl('');
    setAdTargetBusinessId('');
    setAdSellerBusinessId('');
    setAdPincodes('');
    setAdCategoryIds([]);
    setAdTags('');
    setAdPlacementKey('homepage_inline_primary');
    setAdImageUrl('');
    setAdImageFile(null);
    setAdDeviceTarget('all');
    setAdMobileRowPosition('3');
    setAdWorkflowStatus('submitted');
    setAdBillingModel('fixed');
    setAdRotationMode('even');
    setAdPlannedBudget('15000');
    setAdSpentBudget('0');
    setAdCpcBid('25');
    setAdImpressions('0');
    setAdClicks('0');
    setAdReviewNotes('');
    setAdEditId(null);
    setAdFormError('');
  };

  const beginEditListingAd = (ad: ListingAd) => {
    setAdEditId(ad.id);
    setAdTitle(ad.title);
    setAdDescription(ad.description);
    setAdBadge(ad.badge || 'Sponsored');
    setAdCtaText(ad.ctaText || 'Know More');
    setAdBgColor(ad.backgroundColor || '#1d4ed8');
    setAdStartDate(ad.startDate);
    setAdEndDate(ad.endDate);
    setAdActionType(ad.actionType);
    setAdTargetUrl(ad.targetUrl || '');
    setAdTargetBusinessId(ad.targetBusinessId || '');
    setAdSellerBusinessId(ad.sellerBusinessId || '');
    setAdLocalityId(ad.localityIds?.[0] || primaryLocalityId);
    setAdPincodes((ad.pincodes || []).join(', '));
    setAdCategoryIds(ad.categoryIds || []);
    setAdTags((ad.tags || []).join(', '));
    setAdPlacementKey(ad.placementKey || 'homepage_inline_primary');
    setAdImageUrl(ad.imageUrl || '');
    setAdImageFile(null);
    setAdDeviceTarget(ad.deviceTarget || 'all');
    setAdMobileRowPosition(String(ad.mobileRowPosition || '3'));
    setAdWorkflowStatus(ad.workflowStatus || 'submitted');
    setAdBillingModel(ad.billingModel || 'fixed');
    setAdRotationMode(ad.rotationMode || 'even');
    setAdPlannedBudget(ad.plannedBudget !== undefined ? String(ad.plannedBudget) : '15000');
    setAdSpentBudget(ad.spentBudget !== undefined ? String(ad.spentBudget) : '0');
    setAdCpcBid(ad.cpcBid !== undefined ? String(ad.cpcBid) : '25');
    setAdImpressions(ad.impressions !== undefined ? String(ad.impressions) : '0');
    setAdClicks(ad.clicks !== undefined ? String(ad.clicks) : '0');
    setAdReviewNotes(ad.reviewNotes || '');
    setAdFormError('');
  };

  const getListingAdFolder = () => `homepage-banners/listing-ads/${slugifyForPath(adPlacementKey || 'homepage_inline_primary')}`;

  const filteredListingAds = listingAds.filter((ad) => {
    if (adsLocalityFilter !== 'all' && !(ad.localityIds || []).includes(adsLocalityFilter)) return false;
    if (adsStatusFilter === 'active' && !ad.isActive) return false;
    if (adsStatusFilter === 'inactive' && ad.isActive) return false;
    if (adsSearchQuery.trim()) {
      const query = adsSearchQuery.trim().toLowerCase();
      const searchable = `${ad.title} ${ad.description} ${ad.badge} ${ad.placementKey || ''} ${ad.workflowStatus || ''} ${ad.billingModel || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });

  const getDerivedAdLeadCount = (ad: ListingAd) => adLeads.filter((lead) => lead.adId === ad.id).length;
  const getAdCtr = (ad: ListingAd) => {
    const impressions = Number(ad.impressions || 0);
    const clicks = Number(ad.clicks || 0);
    if (impressions <= 0) return 0;
    return (clicks / impressions) * 100;
  };
  const getAdCpl = (ad: ListingAd) => {
    const leadCount = Math.max(Number(ad.leadCount || 0), getDerivedAdLeadCount(ad));
    const spent = Number(ad.spentBudget || 0);
    if (leadCount <= 0) return 0;
    return spent / leadCount;
  };
  const pendingReviewAds = filteredListingAds.filter((ad) => ['submitted', 'under_review'].includes(ad.workflowStatus || 'draft'));
  const getAdOpsPriorityScore = (ad: ListingAd) => {
    const submittedAt = ad.submittedAt || ad.startDate || currentAdminDateIso;
    const ageHours = Math.max(0, (Date.now() - Date.parse(submittedAt)) / (1000 * 60 * 60));
    let score = 0;

    if (ad.workflowStatus === 'submitted') score += 36;
    if (ad.workflowStatus === 'under_review') score += 22;
    if ((ad.deviceTarget || 'all') === 'all') score += 8;
    if ((ad.placementKey || '').includes('homepage')) score += 10;
    if ((ad.billingModel || 'fixed') === 'cpc') score += 8;
    if ((ad.localityIds || []).length > 1) score += 6;

    score += Math.min(32, ageHours / 6);
    score += Math.min(18, Number(ad.plannedBudget || 0) / 5000);
    score += Math.min(10, Number(ad.cpcBid || 0) / 10);

    return score;
  };
  const getAdOpsSlaLabel = (ad: ListingAd) => {
    const submittedAt = ad.submittedAt || ad.startDate || currentAdminDateIso;
    const ageHours = Math.max(0, (Date.now() - Date.parse(submittedAt)) / (1000 * 60 * 60));
    if (ageHours >= 48) return 'Critical SLA';
    if (ageHours >= 24) return 'Due Today';
    if (ageHours >= 8) return 'Review Soon';
    return 'Fresh';
  };
  const prioritizedPendingReviewAds = pendingReviewAds
    .slice()
    .sort((left, right) => (
      getAdOpsPriorityScore(right) - getAdOpsPriorityScore(left) ||
      Date.parse(right.submittedAt || right.startDate || currentAdminDateIso) - Date.parse(left.submittedAt || left.startDate || currentAdminDateIso)
    ));
  const liveOrApprovedAds = filteredListingAds.filter((ad) => ['approved', 'scheduled', 'live', 'paused'].includes(ad.workflowStatus || 'draft'));
  const rejectedAds = filteredListingAds.filter((ad) => ad.workflowStatus === 'rejected');
  const adPerformanceSummary = filteredListingAds.reduce((summary, ad) => {
    summary.plannedBudget += Number(ad.plannedBudget || 0);
    summary.spentBudget += Number(ad.spentBudget || 0);
    summary.impressions += Number(ad.impressions || 0);
    summary.clicks += Number(ad.clicks || 0);
    summary.leads += Math.max(Number(ad.leadCount || 0), getDerivedAdLeadCount(ad));
    return summary;
  }, {
    plannedBudget: 0,
    spentBudget: 0,
    impressions: 0,
    clicks: 0,
    leads: 0
  });

  const handleAdWorkflowTransition = (
    ad: ListingAd,
    nextStatus: NonNullable<ListingAd['workflowStatus']>,
    options?: { reason?: string; deactivate?: boolean }
  ) => {
    const nextLeadCount = Math.max(Number(ad.leadCount || 0), getDerivedAdLeadCount(ad));
    const shouldDeactivate = options?.deactivate === true || ['rejected', 'archived', 'draft'].includes(nextStatus);
    const shouldActivate = ['approved', 'scheduled', 'live'].includes(nextStatus);
    onUpdateListingAd?.({
      ...ad,
      workflowStatus: nextStatus,
      isActive: shouldDeactivate ? false : shouldActivate ? true : ad.isActive,
      reviewedAt: ['approved', 'scheduled', 'live', 'paused', 'rejected'].includes(nextStatus) ? new Date().toISOString() : ad.reviewedAt,
      reviewedBy: ['approved', 'scheduled', 'live', 'paused', 'rejected'].includes(nextStatus) ? (userSession?.userName || userSession?.role || 'admin') : ad.reviewedBy,
      reviewNotes: options?.reason || ad.reviewNotes,
      leadCount: nextLeadCount
    });
    notify(`Ad moved to ${nextStatus.replace(/_/g, ' ')}.`);
  };
  const handleAdRejection = (ad: ListingAd) => {
    const reason = window.prompt('Why is this ad being rejected?', ad.reviewNotes || 'Needs creative or targeting revision.');
    if (reason === null) return;
    handleAdWorkflowTransition(ad, 'rejected', { reason: reason.trim() || 'Rejected by ops review.', deactivate: true });
  };
  const handleAdReviewRequest = (ad: ListingAd) => {
    const note = window.prompt('What changes are needed before approval?', ad.reviewNotes || 'Please revise creative, targeting, or budget.');
    if (note === null) return;
    handleAdWorkflowTransition(ad, 'under_review', { reason: note.trim() || 'Revision requested by ops.' });
  };

  const handleCreateListingAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdFormError('');
    if (!adTitle.trim() || !adDescription.trim() || !adCtaText.trim()) {
      const message = 'Please fill Ad title, description, and CTA text.';
      setAdFormError(message);
      notify(message);
      return;
    }
    if (adActionType === 'landing_page' && !adTargetUrl.trim()) {
      const message = 'Please provide a landing page URL.';
      setAdFormError(message);
      notify(message);
      return;
    }
    if (adActionType === 'landing_listing' && !adTargetBusinessId) {
      const message = 'Please choose a landing listing.';
      setAdFormError(message);
      notify(message);
      return;
    }

    setAdImageUploading(true);
    try {
      const existingAd = adEditId ? listingAds.find((entry) => entry.id === adEditId) || null : null;
      const nextPlacementKey = adPlacementKey.trim() || 'homepage_inline_primary';
      const uploadedImageUrl = adImageFile
        ? await uploadAdminMediaImage(adImageFile, getListingAdFolder(), userSession?.authToken)
        : getMediaProxyUrl(adImageUrl.trim());

      if (!uploadedImageUrl) {
        const message = 'Please upload an ad image or provide a banner image URL.';
        setAdFormError(message);
        notify(message);
        return;
      }

      const payload: Omit<ListingAd, 'id'> = {
        title: adTitle.trim(),
        description: adDescription.trim(),
        badge: adBadge.trim() || 'Sponsored',
        ctaText: adCtaText.trim(),
        backgroundColor: adBgColor || '#1d4ed8',
        imageUrl: uploadedImageUrl || undefined,
        startDate: adStartDate,
        endDate: adEndDate,
        actionType: adActionType,
        targetUrl: adActionType === 'landing_page' ? adTargetUrl.trim() : undefined,
        targetBusinessId: adActionType === 'landing_listing' ? adTargetBusinessId : undefined,
        sellerBusinessId: adSellerBusinessId || undefined,
        localityIds: adLocalityId ? [adLocalityId] : [],
        pincodes: parsePincodeList(adPincodes),
        categoryIds: adCategoryIds,
        tags: buildListingTags(adTags),
        placementKey: nextPlacementKey,
        deviceTarget: adDeviceTarget,
        mobileRowPosition: adDeviceTarget !== 'desktop' && Number(adMobileRowPosition) > 0 ? Number(adMobileRowPosition) : undefined,
        workflowStatus: adWorkflowStatus,
        billingModel: adBillingModel,
        rotationMode: adRotationMode,
        plannedBudget: Number(adPlannedBudget.replace(/[^\d.]/g, '')) || undefined,
        spentBudget: Number(adSpentBudget.replace(/[^\d.]/g, '')) || 0,
        cpcBid: adBillingModel === 'cpc' ? (Number(adCpcBid.replace(/[^\d.]/g, '')) || undefined) : undefined,
        impressions: Number(adImpressions.replace(/[^\d]/g, '')) || 0,
        clicks: Number(adClicks.replace(/[^\d]/g, '')) || 0,
        leadCount: existingAd?.leadCount || 0,
        submittedAt: ['submitted', 'under_review'].includes(adWorkflowStatus) ? (existingAd?.submittedAt || new Date().toISOString()) : existingAd?.submittedAt,
        reviewedAt: ['approved', 'scheduled', 'live', 'paused', 'rejected'].includes(adWorkflowStatus) ? new Date().toISOString() : existingAd?.reviewedAt,
        reviewedBy: ['approved', 'scheduled', 'live', 'paused', 'rejected'].includes(adWorkflowStatus) ? (userSession?.userName || userSession?.role || 'admin') : existingAd?.reviewedBy,
        reviewNotes: adReviewNotes.trim() || undefined,
        isActive: ['approved', 'scheduled', 'live'].includes(adWorkflowStatus)
      };

      if (adEditId) {
        onUpdateListingAd?.({ ...payload, id: adEditId });
        notify('Listing ad updated successfully.');
      } else {
        onCreateListingAd?.(payload);
        notify('Listing ad created successfully.');
      }
      resetListingAdForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ad image upload failed.';
      setAdFormError(message);
      notify(message);
    } finally {
      setAdImageUploading(false);
    }
  };

  const approvedBusinesses = businesses.filter((business) => business.status === 'approved');

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Ad Banners</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Manage advertiser creatives, review workflow, and delivery analytics for homepage and search ad placements.
        </p>
      </div>
      {notification && (
        <div className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: '#93C5FD', backgroundColor: '#EFF6FF', color: '#1E3A8A' }}>
          {notification}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:flex-row sm:items-center">
        <select
          value={adsLocalityFilter}
          onChange={(event) => setAdsLocalityFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <option value="all">All localities</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>{locality.name}</option>
          ))}
        </select>
        <select
          value={adsStatusFilter}
          onChange={(event) => setAdsStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <input
          value={adsSearchQuery}
          onChange={(event) => setAdsSearchQuery(event.target.value)}
          placeholder="Search ads by title, description, badge, placement, workflow, or billing model"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-1"
        />
      </div>

      <AdOperationsPanel
        localities={localities}
        filteredBusinesses={approvedBusinesses}
        filteredListingAds={filteredListingAds}
        pendingReviewAds={pendingReviewAds}
        prioritizedPendingReviewAds={prioritizedPendingReviewAds}
        liveOrApprovedAds={liveOrApprovedAds}
        rejectedAds={rejectedAds}
        adPerformanceSummary={adPerformanceSummary}
        currentAdminDateIso={currentAdminDateIso}
        getAdCtr={getAdCtr}
        getAdCpl={getAdCpl}
        getDerivedAdLeadCount={getDerivedAdLeadCount}
        getAdOpsPriorityScore={getAdOpsPriorityScore}
        getAdOpsSlaLabel={getAdOpsSlaLabel}
        onBeginEditListingAd={beginEditListingAd}
        onTransitionAd={handleAdWorkflowTransition}
        onReviewRequest={handleAdReviewRequest}
        onRejectAd={handleAdRejection}
        onDeleteAd={(adId) => onDeleteListingAd?.(adId)}
        onUpdateAd={(ad) => onUpdateListingAd?.(ad)}
      />
      <AdvertiserCreativeFormPanel
        localities={localities}
        approvedBusinesses={approvedBusinesses}
        categoryPicker={(
          <OrderedCategoryPicker
            label="Ad category targeting"
            selectedIds={adCategoryIds}
            onChange={setAdCategoryIds}
            helperText="Add categories this ad should match on search results. Leave empty to allow all categories."
          />
        )}
        adTitle={adTitle}
        adDescription={adDescription}
        adBadge={adBadge}
        adCtaText={adCtaText}
        adStartDate={adStartDate}
        adEndDate={adEndDate}
        adWorkflowStatus={adWorkflowStatus}
        adBillingModel={adBillingModel}
        adRotationMode={adRotationMode}
        adActionType={adActionType}
        adBgColor={adBgColor}
        adPlannedBudget={adPlannedBudget}
        adSpentBudget={adSpentBudget}
        adCpcBid={adCpcBid}
        adImpressions={adImpressions}
        adClicks={adClicks}
        adReviewNotes={adReviewNotes}
        adLocalityId={adLocalityId}
        adPlacementKey={adPlacementKey}
        adTags={adTags}
        adImageUrl={adImageUrl}
        adDeviceTarget={adDeviceTarget}
        adMobileRowPosition={adMobileRowPosition}
        adPincodes={adPincodes}
        adTargetUrl={adTargetUrl}
        adTargetBusinessId={adTargetBusinessId}
        adSellerBusinessId={adSellerBusinessId}
        adImageUploading={adImageUploading}
        adEditId={adEditId}
        adFormError={adFormError}
        adPreviewImageUrl={adImageFile ? URL.createObjectURL(adImageFile) : adImageUrl}
        adImageFolder={getListingAdFolder()}
        onAdTitleChange={setAdTitle}
        onAdDescriptionChange={setAdDescription}
        onAdBadgeChange={setAdBadge}
        onAdCtaTextChange={setAdCtaText}
        onAdStartDateChange={setAdStartDate}
        onAdEndDateChange={setAdEndDate}
        onAdWorkflowStatusChange={setAdWorkflowStatus}
        onAdBillingModelChange={setAdBillingModel}
        onAdRotationModeChange={setAdRotationMode}
        onAdActionTypeChange={setAdActionType}
        onAdBgColorChange={setAdBgColor}
        onAdPlannedBudgetChange={(value) => setAdPlannedBudget(value.replace(/[^\d.]/g, ''))}
        onAdSpentBudgetChange={(value) => setAdSpentBudget(value.replace(/[^\d.]/g, ''))}
        onAdCpcBidChange={(value) => setAdCpcBid(value.replace(/[^\d.]/g, ''))}
        onAdImpressionsChange={(value) => setAdImpressions(value.replace(/[^\d]/g, ''))}
        onAdClicksChange={(value) => setAdClicks(value.replace(/[^\d]/g, ''))}
        onAdReviewNotesChange={setAdReviewNotes}
        onAdLocalityIdChange={setAdLocalityId}
        onAdPlacementKeyChange={setAdPlacementKey}
        onAdTagsChange={setAdTags}
        onAdImageUrlChange={setAdImageUrl}
        onAdImageFileChange={setAdImageFile}
        onAdDeviceTargetChange={setAdDeviceTarget}
        onAdMobileRowPositionChange={(value) => setAdMobileRowPosition(value.replace(/\D/g, ''))}
        onAdPincodesChange={setAdPincodes}
        onAdTargetUrlChange={setAdTargetUrl}
        onAdTargetBusinessIdChange={setAdTargetBusinessId}
        onAdSellerBusinessIdChange={setAdSellerBusinessId}
        onSubmit={handleCreateListingAdSubmit}
        onReset={resetListingAdForm}
      />
    </div>
  );
}
