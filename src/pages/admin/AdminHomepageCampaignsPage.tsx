import React, { useMemo, useState } from 'react';
import type {
  Business,
  ListingAd,
  Locality,
  ScalableCampaign,
  ScalableCampaignType,
  ScalableHomepageConfigState,
} from '../../types';
import { OrderedCategoryPicker, OrderedSelectionPicker } from '../../components/admin/AdminConsoleSharedControls';
import { BUSINESS_CATEGORIES, BUSINESS_SUBCATEGORIES, getCategoryById, getSubcategoryById } from '../../categoryMaster';
import {
  createAdminId,
  getScalableEntityOwnershipPresentation,
  isLegacyManagedScalableEntity,
  parseIdList,
  parsePincodeList,
  pruneEmptyPayload,
} from '../../services/admin/adminConsoleUtils';
import { deleteScalableEntity, persistScalableEntity } from '../../services/admin/homepageCms';

type AdminHomepageCampaignsPageProps = {
  localities: Locality[];
  businesses: Business[];
  listingAds?: ListingAd[];
  scalableHomepageConfig?: ScalableHomepageConfigState;
  onSaveScalableCampaign?: (campaign: ScalableCampaign) => Promise<unknown> | void;
  onDeleteScalableCampaign?: (campaignId: string) => Promise<unknown> | void;
  onPublishResolvedHomepages?: (localityIds: string[]) => Promise<unknown> | void;
};

const emptyCampaignDraft = (localityId: string) => ({
  id: '',
  name: '',
  campaignType: 'hero_banner' as ScalableCampaignType,
  status: 'active' as ScalableCampaign['status'],
  priority: '100',
  startDate: '',
  endDate: '',
  deviceTarget: 'all' as NonNullable<ListingAd['deviceTarget']>,
  placementKeys: '',
  localityIds: localityId,
  categoryIds: '',
  subcategoryIds: '',
  pincodes: '',
  payloadTitle: '',
  payloadSubtitle: '',
  payloadDescription: '',
  payloadImageUrl: '',
  payloadBadge: '',
  payloadCtaLabel: '',
  payloadCtaText: '',
  payloadTargetUrl: '',
  payloadTargetBusinessId: '',
  payloadBusinessIds: '',
  payloadCode: '',
  payloadDiscount: '',
  payloadAuthorName: '',
  payloadContent: '',
  payloadBackgroundColor: '#1d4ed8',
  payloadActionType: 'landing_page' as 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category',
  payloadText: '{}',
  isFallback: false,
});

// Routed home for a 6th Homepage CMS screen NOT explicitly named in
// admin-backend-ux-spec.md's Sections 5.14-5.18 or its Section 3 nav table (which lists only
// 5 Homepage CMS screens: Layout Builder, Hero Banners, Templates, Assignments, Publish &
// Snapshots). Ported from AdminConsole.tsx's Homepage CMS > "Campaigns" subtab (lines
// ~5591-5904, the "Campaign Builder" for `ScalableCampaign` entities), unchanged behavior, new
// location.
//
// Why this page exists despite not being in the original 5-screen list: research into the
// legacy code (see project doc's 0.5 status entry) found this subtab manages a distinct,
// substantial feature — `ScalableCampaign` records (hero/ad/sponsored-listing/offer/content
// targeting for the resolver) — with its own type, its own CRUD props
// (onSaveScalableCampaign/onDeleteScalableCampaign), and no overlap with the legacy, already
// -live "Ads & Offers" nav group (which edits ListingAd/MarketingCoupon records directly). The
// spec's own 7-subtabs-to-5-screens arithmetic only accounts for one merge (publish+insights),
// leaving this subtab unplaced — read as a spec gap, not an intentional fold, since none of the
// other 4 screens can absorb it without dropping capability (Section 2's design principle).
// Given it every bit as much stand-alone content as Templates or Assignments, it gets its own
// routed screen here rather than being silently dropped. Flagged in the project doc for
// whoever owns the spec to formally reconcile.
export default function AdminHomepageCampaignsPage({
  localities,
  businesses,
  listingAds = [],
  scalableHomepageConfig,
  onSaveScalableCampaign,
  onDeleteScalableCampaign,
  onPublishResolvedHomepages,
}: AdminHomepageCampaignsPageProps) {
  const primaryLocalityId = localities[0]?.id || '';
  const [campaignDraft, setCampaignDraft] = useState(() => emptyCampaignDraft(primaryLocalityId));
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const sortedScalableCampaigns = useMemo(
    () => [...(scalableHomepageConfig?.campaigns || [])].sort((a, b) => b.priority - a.priority),
    [scalableHomepageConfig?.campaigns]
  );
  const localitySelectionOptions = useMemo(() => localities.map((locality) => ({
    id: locality.id,
    label: locality.name,
    meta: locality.slug,
  })), [localities]);
  const localityNameById = useMemo(() => new Map(localities.map((locality) => [locality.id, locality.name])), [localities]);
  const formatLocalityLabel = (localityId: string) => localityNameById.get(localityId) || localityId;

  const subcategorySelectionOptions = useMemo(() => {
    const scopedCategoryIds = parseIdList(campaignDraft.categoryIds);
    return BUSINESS_SUBCATEGORIES
      .filter((subcategory) => scopedCategoryIds.length === 0 || scopedCategoryIds.includes(subcategory.categoryId))
      .map((subcategory) => ({
        id: subcategory.id,
        label: subcategory.name,
        meta: getCategoryById(subcategory.categoryId)?.name || subcategory.categoryId,
      }));
  }, [campaignDraft.categoryIds]);

  const placementKeySelectionOptions = useMemo(() => Array.from(new Set([
    'homepage_hero_primary',
    'homepage_hero_secondary',
    'homepage_strip_between_categories_and_listings',
    'homepage_inline_primary',
    'homepage_sidebar_top',
    'homepage_sidebar_food',
    'homepage_sidebar_clinic',
    'homepage_sidebar_marketing',
    ...listingAds.map((ad) => String(ad.placementKey || '').trim()),
    ...sortedScalableCampaigns.flatMap((campaign) => campaign.placementKeys || []),
  ].filter(Boolean))).sort().map((placementKey) => ({ id: placementKey, label: placementKey })), [listingAds, sortedScalableCampaigns]);

  const approvedBusinessSelectionOptions = useMemo(() => businesses
    .filter((business) => business.status === 'approved')
    .map((business) => ({
      id: business.id,
      label: business.name,
      meta: `${getCategoryById(business.categoryId)?.name || business.categoryId} · ${localities.find((locality) => locality.id === business.localityId)?.name || business.localityId}`,
    })), [businesses, localities]);

  const resetCampaignDraft = () => setCampaignDraft(emptyCampaignDraft(primaryLocalityId));

  const beginEditCampaign = (campaign: ScalableCampaign) => {
    const payload = (campaign.payload || {}) as Record<string, unknown>;
    setCampaignDraft({
      id: campaign.id,
      name: campaign.name,
      campaignType: campaign.campaignType,
      status: campaign.status,
      priority: String(campaign.priority),
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      deviceTarget: campaign.deviceTarget || 'all',
      placementKeys: (campaign.placementKeys || []).join(', '),
      localityIds: (campaign.targets.localityIds || []).join(', '),
      categoryIds: (campaign.targets.categoryIds || []).join(', '),
      subcategoryIds: (campaign.targets.subcategoryIds || []).join(', '),
      pincodes: (campaign.targets.pincodes || []).join(', '),
      payloadTitle: String(payload.title || ''),
      payloadSubtitle: String(payload.subtitle || ''),
      payloadDescription: String(payload.description || ''),
      payloadImageUrl: String(payload.imageUrl || payload.image || ''),
      payloadBadge: String(payload.badge || payload.badgeText || ''),
      payloadCtaLabel: String(payload.ctaLabel || ''),
      payloadCtaText: String(payload.ctaText || ''),
      payloadTargetUrl: String(payload.targetUrl || payload.ctaTarget || ''),
      payloadTargetBusinessId: String(payload.targetBusinessId || ''),
      payloadBusinessIds: Array.isArray(payload.businessIds) ? payload.businessIds.join(', ') : '',
      payloadCode: String(payload.code || ''),
      payloadDiscount: String(payload.discount || ''),
      payloadAuthorName: String(payload.authorName || ''),
      payloadContent: String(payload.content || ''),
      payloadBackgroundColor: String(payload.backgroundColor || '#1d4ed8'),
      payloadActionType: ['landing_page', 'landing_listing', 'lead_form', 'search_category'].includes(String(payload.actionType || payload.ctaType || ''))
        ? (String(payload.actionType || payload.ctaType) as 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category')
        : 'landing_page',
      payloadText: JSON.stringify(campaign.payload || {}, null, 2),
      isFallback: campaign.isFallback,
    });
  };

  const handleSaveCampaignDraft = async () => {
    if (!scalableHomepageConfig) {
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!campaignDraft.name.trim()) {
      notify('Campaign name is required.');
      return;
    }

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(campaignDraft.payloadText || '{}');
    } catch {
      notify('Campaign payload must be valid JSON.');
      return;
    }

    const localityIds = parseIdList(campaignDraft.localityIds);
    const categoryIds = parseIdList(campaignDraft.categoryIds);
    const subcategoryIds = parseIdList(campaignDraft.subcategoryIds);
    const pincodes = parsePincodeList(campaignDraft.pincodes);
    const placementKeys = parseIdList(campaignDraft.placementKeys);
    const businessIds = parseIdList(campaignDraft.payloadBusinessIds);

    const guidedPayload = (() => {
      if (campaignDraft.campaignType === 'hero_banner') {
        return pruneEmptyPayload({
          id: campaignDraft.id || undefined,
          localityId: localityIds[0] || '',
          title: campaignDraft.payloadTitle || campaignDraft.name,
          subtitle: campaignDraft.payloadSubtitle,
          imageUrl: campaignDraft.payloadImageUrl,
          startDate: campaignDraft.startDate || undefined,
          endDate: campaignDraft.endDate || undefined,
          ctaLabel: campaignDraft.payloadCtaLabel || 'Explore Businesses',
          ctaType: campaignDraft.payloadActionType,
          ctaTarget: campaignDraft.payloadTargetUrl || 'all',
          pincodes,
          isActive: campaignDraft.status === 'active',
        });
      }
      if (campaignDraft.campaignType === 'listing_ad') {
        return pruneEmptyPayload({
          id: campaignDraft.id || undefined,
          title: campaignDraft.payloadTitle || campaignDraft.name,
          description: campaignDraft.payloadDescription,
          badge: campaignDraft.payloadBadge || 'Sponsored',
          ctaText: campaignDraft.payloadCtaText || 'Know More',
          backgroundColor: campaignDraft.payloadBackgroundColor || '#1d4ed8',
          imageUrl: campaignDraft.payloadImageUrl || undefined,
          startDate: campaignDraft.startDate || undefined,
          endDate: campaignDraft.endDate || undefined,
          actionType: campaignDraft.payloadActionType === 'search_category' ? 'landing_page' : campaignDraft.payloadActionType,
          targetUrl: campaignDraft.payloadActionType === 'landing_page' ? campaignDraft.payloadTargetUrl || undefined : undefined,
          targetBusinessId: campaignDraft.payloadActionType === 'landing_listing' ? campaignDraft.payloadTargetBusinessId || undefined : undefined,
          localityIds,
          pincodes,
          categoryIds,
          placementKey: placementKeys[0] || undefined,
          deviceTarget: campaignDraft.deviceTarget,
          isActive: campaignDraft.status === 'active',
        });
      }
      if (campaignDraft.campaignType === 'offer') {
        return pruneEmptyPayload({
          id: campaignDraft.id || undefined,
          businessId: campaignDraft.payloadTargetBusinessId || '',
          title: campaignDraft.payloadTitle || campaignDraft.name,
          code: campaignDraft.payloadCode,
          discount: campaignDraft.payloadDiscount,
          description: campaignDraft.payloadDescription,
          startDate: campaignDraft.startDate || undefined,
          expiryDate: campaignDraft.endDate || undefined,
          endDate: campaignDraft.endDate || undefined,
          usageCount: 0,
          isActive: campaignDraft.status === 'active',
          localityIds,
          pincodes,
          categoryIds,
          badgeText: campaignDraft.payloadDiscount || undefined,
          ctaText: campaignDraft.payloadCtaText || 'Claim Offer',
          targetBusinessId: campaignDraft.payloadTargetBusinessId || undefined,
        });
      }
      if (campaignDraft.campaignType === 'sponsored_listing') {
        return pruneEmptyPayload({
          businessIds,
          sellerBusinessId: businessIds[0] || undefined,
          title: campaignDraft.payloadTitle || campaignDraft.name,
          description: campaignDraft.payloadDescription,
        });
      }
      return pruneEmptyPayload({
        id: campaignDraft.id || undefined,
        localityId: localityIds[0] || '',
        title: campaignDraft.payloadTitle || campaignDraft.name,
        content: campaignDraft.payloadContent || campaignDraft.payloadDescription,
        authorName: campaignDraft.payloadAuthorName || 'Localisy Team',
        type: 'post',
        createdAt: new Date().toISOString(),
        likes: 0,
        image: campaignDraft.payloadImageUrl || undefined,
        status: campaignDraft.status === 'draft' ? 'draft' : campaignDraft.status === 'archived' ? 'archived' : 'published',
        publishAt: campaignDraft.startDate ? new Date(campaignDraft.startDate).toISOString() : new Date().toISOString(),
        expireAt: campaignDraft.endDate ? new Date(campaignDraft.endDate).toISOString() : undefined,
      });
    })();

    const nextPayload = pruneEmptyPayload({ ...parsedPayload, ...guidedPayload });

    const nextCampaign: ScalableCampaign = {
      id: campaignDraft.id || createAdminId('campaign'),
      name: campaignDraft.name.trim(),
      campaignType: campaignDraft.campaignType,
      status: campaignDraft.status,
      priority: Number(campaignDraft.priority) || 100,
      isFallback: campaignDraft.isFallback,
      startDate: campaignDraft.startDate || undefined,
      endDate: campaignDraft.endDate || undefined,
      deviceTarget: campaignDraft.deviceTarget,
      placementKeys,
      targets: {
        localityIds,
        categoryIds,
        subcategoryIds,
        pincodes,
        devices: [campaignDraft.deviceTarget],
        pageTypes: ['homepage', 'listing_results'],
        placementKeys,
      },
      payload: nextPayload,
      metadata: {
        ...(scalableHomepageConfig.campaigns.find((campaign) => campaign.id === campaignDraft.id)?.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
      updatedAt: new Date().toISOString(),
    };

    await persistScalableEntity({
      save: onSaveScalableCampaign,
      entity: nextCampaign,
      successMessage: campaignDraft.id ? 'Campaign updated and published.' : 'Campaign created and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: localityIds.length > 0 ? localityIds : [primaryLocalityId],
      missingCallbackMessage: 'Scalable campaign save callback is not configured.',
      genericErrorMessage: 'Failed to save scalable campaign.',
    });
    resetCampaignDraft();
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!scalableHomepageConfig) {
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    const campaign = scalableHomepageConfig.campaigns.find((entry) => entry.id === campaignId);
    await deleteScalableEntity({
      deleteFn: onDeleteScalableCampaign,
      id: campaignId,
      successMessage: 'Campaign deleted and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: campaign?.targets.localityIds && campaign.targets.localityIds.length > 0 ? campaign.targets.localityIds : [primaryLocalityId],
      missingCallbackMessage: 'Scalable campaign delete callback is not configured.',
      genericErrorMessage: 'Failed to delete scalable campaign.',
    });
    if (campaignDraft.id === campaignId) resetCampaignDraft();
  };

  const handleDetachCampaignFromLegacySync = async (campaign: ScalableCampaign) => {
    if (!scalableHomepageConfig) {
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!isLegacyManagedScalableEntity(campaign.metadata)) {
      notify('This campaign is already detached or scalable-owned.');
      return;
    }
    const detachedAt = new Date().toISOString();
    await persistScalableEntity({
      save: onSaveScalableCampaign,
      entity: {
        ...campaign,
        metadata: {
          ...(campaign.metadata || {}),
          updatedFrom: 'admin_console',
          detachedFromLegacySync: true,
          detachedAt,
          detachedReason: 'manual_admin_detach',
        },
        updatedAt: detachedAt,
      },
      successMessage: `Campaign "${campaign.name}" detached from legacy sync.`,
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: campaign.targets.localityIds && campaign.targets.localityIds.length > 0 ? campaign.targets.localityIds : [primaryLocalityId],
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Campaign Builder</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage hero, ads, offers, sponsored listings, and content targeting.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Campaigns</div>
            <div className="text-[10px] text-slate-500">Manage hero, ads, offers, sponsored listings, and content targeting.</div>
          </div>
          <button
            type="button"
            onClick={resetCampaignDraft}
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700"
          >
            New
          </button>
        </div>
        <div className="space-y-2 text-[11px]">
          <input
            value={campaignDraft.name}
            onChange={(e) => setCampaignDraft((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Campaign name"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={campaignDraft.campaignType}
              onChange={(e) => setCampaignDraft((prev) => ({ ...prev, campaignType: e.target.value as ScalableCampaignType }))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="hero_banner">Hero banner</option>
              <option value="listing_ad">Listing ad</option>
              <option value="sponsored_listing">Sponsored listing</option>
              <option value="offer">Offer</option>
              <option value="content_block">Content block</option>
            </select>
            <input
              value={campaignDraft.priority}
              onChange={(e) => setCampaignDraft((prev) => ({ ...prev, priority: e.target.value }))}
              placeholder="Priority"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={campaignDraft.startDate} onChange={(e) => setCampaignDraft((prev) => ({ ...prev, startDate: e.target.value }))} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
            <input type="date" value={campaignDraft.endDate} onChange={(e) => setCampaignDraft((prev) => ({ ...prev, endDate: e.target.value }))} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={campaignDraft.status}
              onChange={(e) => setCampaignDraft((prev) => ({ ...prev, status: e.target.value as ScalableCampaign['status'] }))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={campaignDraft.deviceTarget}
              onChange={(e) => setCampaignDraft((prev) => ({ ...prev, deviceTarget: e.target.value as NonNullable<ListingAd['deviceTarget']> }))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
          <OrderedSelectionPicker
            label="Placement keys"
            selectedIds={parseIdList(campaignDraft.placementKeys)}
            options={placementKeySelectionOptions}
            onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, placementKeys: nextIds.join(', ') }))}
            helperText="Limit the campaign to one or more resolver placement keys when needed."
            emptyText="No placement keys selected. The campaign can resolve anywhere else the targeting rules match."
          />
          <OrderedSelectionPicker
            label="Target localities"
            selectedIds={parseIdList(campaignDraft.localityIds)}
            options={localitySelectionOptions}
            onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, localityIds: nextIds.join(', ') }))}
            helperText="Pick the localities this campaign should serve."
            emptyText="No locality restrictions selected yet."
          />
          <OrderedCategoryPicker
            label="Target categories"
            selectedIds={parseIdList(campaignDraft.categoryIds)}
            onChange={(nextIds) => setCampaignDraft((prev) => ({
              ...prev,
              categoryIds: nextIds.join(', '),
              subcategoryIds: parseIdList(prev.subcategoryIds)
                .filter((subcategoryId) => {
                  const subcategory = getSubcategoryById(subcategoryId);
                  return subcategory ? nextIds.includes(subcategory.categoryId) : false;
                })
                .join(', '),
            }))}
            helperText="Category targeting can be broad or ordered. Any selected subcategory must belong to one of these categories."
          />
          <OrderedSelectionPicker
            label="Target subcategories"
            selectedIds={parseIdList(campaignDraft.subcategoryIds)}
            options={subcategorySelectionOptions}
            onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, subcategoryIds: nextIds.join(', ') }))}
            helperText="Refine campaign delivery to specific subcategories within the selected category scope."
            emptyText="No subcategories selected. The campaign will apply at the category or locality level instead."
          />
          <input value={campaignDraft.pincodes} onChange={(e) => setCampaignDraft((prev) => ({ ...prev, pincodes: e.target.value }))} placeholder="Pincodes" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono" />
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Guided Payload Fields</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={campaignDraft.payloadTitle}
                onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTitle: e.target.value }))}
                placeholder="Payload title"
                className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
              />
              <input
                value={campaignDraft.payloadImageUrl}
                onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadImageUrl: e.target.value }))}
                placeholder="Image URL"
                className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
              />
            </div>
            {(campaignDraft.campaignType === 'hero_banner' || campaignDraft.campaignType === 'listing_ad' || campaignDraft.campaignType === 'offer') && (
              <textarea
                value={campaignDraft.payloadDescription}
                onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadDescription: e.target.value }))}
                placeholder={campaignDraft.campaignType === 'hero_banner' ? 'Hero subtitle/summary' : 'Description'}
                rows={2}
                className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2"
              />
            )}
            {campaignDraft.campaignType === 'hero_banner' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={campaignDraft.payloadSubtitle}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadSubtitle: e.target.value }))}
                  placeholder="Hero subtitle"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
                <input
                  value={campaignDraft.payloadCtaLabel}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCtaLabel: e.target.value }))}
                  placeholder="CTA label"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
              </div>
            )}
            {(campaignDraft.campaignType === 'hero_banner' || campaignDraft.campaignType === 'listing_ad') && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={campaignDraft.payloadActionType}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadActionType: e.target.value as 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category' }))}
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                >
                  <option value="landing_page">Landing Page</option>
                  <option value="landing_listing">Landing Listing</option>
                  <option value="lead_form">Lead Form</option>
                  {campaignDraft.campaignType === 'hero_banner' && <option value="search_category">Search Category</option>}
                </select>
                <input
                  value={campaignDraft.payloadTargetUrl}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTargetUrl: e.target.value }))}
                  placeholder="CTA / target URL"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
              </div>
            )}
            {campaignDraft.campaignType === 'listing_ad' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={campaignDraft.payloadBadge}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadBadge: e.target.value }))}
                  placeholder="Badge"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
                <input
                  value={campaignDraft.payloadCtaText}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCtaText: e.target.value }))}
                  placeholder="CTA text"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
                <input
                  value={campaignDraft.payloadBackgroundColor}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadBackgroundColor: e.target.value }))}
                  placeholder="Background color"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono"
                />
                <input
                  value={campaignDraft.payloadTargetBusinessId}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTargetBusinessId: e.target.value }))}
                  placeholder="Target business ID"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono"
                />
              </div>
            )}
            {campaignDraft.campaignType === 'offer' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={campaignDraft.payloadCode}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCode: e.target.value }))}
                  placeholder="Offer code"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
                <input
                  value={campaignDraft.payloadDiscount}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadDiscount: e.target.value }))}
                  placeholder="Discount label"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
                <input
                  value={campaignDraft.payloadTargetBusinessId}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTargetBusinessId: e.target.value }))}
                  placeholder="Business ID"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono"
                />
                <input
                  value={campaignDraft.payloadCtaText}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCtaText: e.target.value }))}
                  placeholder="CTA text"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
              </div>
            )}
            {campaignDraft.campaignType === 'sponsored_listing' && (
              <div className="space-y-2">
                <OrderedSelectionPicker
                  label="Sponsored businesses"
                  selectedIds={parseIdList(campaignDraft.payloadBusinessIds)}
                  options={approvedBusinessSelectionOptions}
                  onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, payloadBusinessIds: nextIds.join(', ') }))}
                  helperText="Choose the businesses to pin into this sponsored listing campaign."
                  emptyText="No sponsored businesses selected yet."
                />
                <input
                  value={campaignDraft.payloadDescription}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadDescription: e.target.value }))}
                  placeholder="Description"
                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
              </div>
            )}
            {campaignDraft.campaignType === 'content_block' && (
              <>
                <input
                  value={campaignDraft.payloadAuthorName}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadAuthorName: e.target.value }))}
                  placeholder="Author name"
                  className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
                <textarea
                  value={campaignDraft.payloadContent}
                  onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadContent: e.target.value }))}
                  placeholder="Content"
                  rows={3}
                  className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2"
                />
              </>
            )}
          </div>
          <textarea
            value={campaignDraft.payloadText}
            onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadText: e.target.value }))}
            rows={7}
            placeholder="Campaign payload JSON"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono"
          />
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
            <input
              type="checkbox"
              checked={campaignDraft.isFallback}
              onChange={(e) => setCampaignDraft((prev) => ({ ...prev, isFallback: e.target.checked }))}
            />
            <span>Fallback campaign</span>
          </label>
          <button
            type="button"
            onClick={() => { void handleSaveCampaignDraft(); }}
            className="w-full rounded-lg bg-[#1E3A8A] py-2 font-bold text-white hover:bg-[#1E3A8A]/90"
          >
            {campaignDraft.id ? 'Update Campaign' : 'Create Campaign'}
          </button>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {sortedScalableCampaigns.slice(0, 20).map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-800">{campaign.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getScalableEntityOwnershipPresentation(campaign.metadata).className}`}>
                      {getScalableEntityOwnershipPresentation(campaign.metadata).label}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">{campaign.status}</span>
                    {campaign.isFallback && <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Fallback</span>}
                  </div>
                  <div className="text-[10px] text-slate-500">{campaign.campaignType} · {campaign.status} · priority {campaign.priority}</div>
                  <div className="text-[10px] text-slate-500">Source: {getScalableEntityOwnershipPresentation(campaign.metadata).detail}</div>
                  <div className="text-[10px] text-slate-500">
                    Targets: {(campaign.targets.localityIds || []).slice(0, 2).map((localityId) => formatLocalityLabel(localityId)).join(', ') || 'all localities'}{(campaign.targets.localityIds || []).length > 2 ? ` +${(campaign.targets.localityIds || []).length - 2} more` : ''}{(campaign.placementKeys || []).length > 0 ? ` | placements: ${(campaign.placementKeys || []).slice(0, 2).join(', ')}${(campaign.placementKeys || []).length > 2 ? ` +${(campaign.placementKeys || []).length - 2}` : ''}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {isLegacyManagedScalableEntity(campaign.metadata) && (
                    <button type="button" onClick={() => { void handleDetachCampaignFromLegacySync(campaign); }} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Detach</button>
                  )}
                  <button type="button" onClick={() => beginEditCampaign(campaign)} className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700">Edit</button>
                  <button type="button" onClick={() => { void handleDeleteCampaign(campaign.id); }} className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {sortedScalableCampaigns.length === 0 && (
            <div className="py-4 text-center text-xs italic text-slate-400">No campaigns created yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
