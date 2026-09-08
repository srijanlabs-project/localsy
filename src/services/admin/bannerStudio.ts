// One place that knows what a banner slot IS, and whether a given banner will
// actually appear in it.
//
// Before this, banners could be created on three screens writing to two stores,
// and only one of those stores was ever delivered:
//
//   Ad Banners       -> homepage_listing_ads    never read by the site
//   Hero Banners     -> homepage_hero_banners   localStorage only
//   Campaign Builder -> campaigns               the ONLY delivered path
//
// The site reads `/api/resolved-homepage`, whose payload is built by
// `resolveHomepageForContext` from `resolveCampaignPayloads(state, ctx, type)`
// — campaigns, filtered by status, date window and target score. A published
// snapshot, when one matches, is served instead of that. Proof rather than
// inference: every published snapshot in production carried `listingAds: []`
// while its `heroBanners` were populated, because hero banners existed as
// campaigns and listing ads only ever existed in the legacy table.
//
// So everything here builds CAMPAIGNS, and `evaluateBannerDelivery` mirrors the
// server's own conditions so the console can say "this will not render" before
// an operator goes looking for it on the site.
import type { ScalableCampaign, ScalableCampaignType, TargetingRule } from '../../types';

export type BannerPageType = 'homepage' | 'listing_results';

export type BannerSlot = {
  placementKey: string;
  label: string;
  /** Which campaignType actually renders in this slot. */
  campaignType: ScalableCampaignType;
  pageType: BannerPageType;
  device: 'desktop' | 'mobile' | 'all';
  width: number;
  height: number;
  /** `cover` centre-crops to the box; `auto` renders at the creative's own ratio. */
  fit: 'cover' | 'auto';
  /** What an operator needs to know before choosing this slot. */
  note?: string;
  /** True when the slot ALSO needs a homepage layout section carrying this key. */
  needsLayoutSection?: boolean;
};

// Sizes are derived from the render CSS, not guessed:
//   LocalityLandingUiV1 desktop hero row is max-w-[1280px] with gap-4 and
//   children at flex-[3.8] / flex-1, so 1264px splits 3.8:1 -> 1001 and 263,
//   both min-h-[360px]. The mobile results list is px-4, so a 390px viewport
//   leaves 358px. Only `mobile_inline` hard-codes a height (h-[120px]).
export const BANNER_SLOTS: BannerSlot[] = [
  {
    placementKey: 'homepage_hero_primary',
    label: 'Homepage hero — main',
    campaignType: 'listing_ad',
    pageType: 'homepage',
    device: 'desktop',
    width: 1000,
    height: 360,
    fit: 'cover',
    note: 'Shown bare with only a small badge. Best slot for a designed banner.',
  },
  {
    placementKey: 'homepage_hero_secondary',
    label: 'Homepage hero — side',
    campaignType: 'listing_ad',
    pageType: 'homepage',
    device: 'desktop',
    width: 263,
    height: 360,
    fit: 'cover',
    note: 'PORTRAIT. A landscape creative loses its left and right thirds.',
  },
  {
    placementKey: 'homepage_hero_junior',
    label: 'Homepage hero — junior rail',
    campaignType: 'listing_ad',
    pageType: 'homepage',
    device: 'desktop',
    width: 256,
    height: 400,
    fit: 'cover',
    note: 'PORTRAIT. Renders from 768px up; below that it is hidden.',
  },
  {
    placementKey: 'homepage_strip_between_categories_and_listings',
    label: 'Homepage strip — between categories and listings',
    campaignType: 'listing_ad',
    pageType: 'homepage',
    device: 'all',
    width: 1000,
    height: 200,
    fit: 'auto',
    note: 'No crop — renders at the creative’s own ratio, so pick one ratio and keep to it.',
  },
  {
    placementKey: 'mobile_inline',
    label: 'Mobile — between result cards',
    campaignType: 'listing_ad',
    pageType: 'homepage',
    device: 'mobile',
    width: 358,
    height: 120,
    fit: 'cover',
    note: 'The only slot with a fixed height. Room for one line and a short CTA.',
  },
  {
    placementKey: 'homepage_inline_primary',
    label: 'Mobile promo — “Promoted this week”',
    campaignType: 'listing_ad',
    pageType: 'homepage',
    device: 'mobile',
    width: 358,
    height: 180,
    fit: 'auto',
    needsLayoutSection: true,
    note: 'Hidden at 1280px and above. ALSO needs a homepage layout section with this key.',
  },
  {
    placementKey: 'listing_results',
    label: 'Search results — inline (texture only)',
    campaignType: 'listing_ad',
    pageType: 'listing_results',
    device: 'all',
    width: 1000,
    height: 240,
    fit: 'cover',
    note: 'Desktop renders the image at 25% opacity behind text. Not a slot for a designed banner.',
  },
  {
    placementKey: '',
    label: 'Homepage hero — carousel (hero banner)',
    campaignType: 'hero_banner',
    pageType: 'homepage',
    device: 'all',
    width: 1000,
    height: 360,
    fit: 'cover',
    note: 'Needs no placement key. A navy scrim and the title/subtitle are drawn OVER the image — leave those blank for a designed banner, or supply a plain photo.',
  },
];

export const findBannerSlot = (placementKey: string, campaignType: ScalableCampaignType) => (
  BANNER_SLOTS.find((slot) => slot.campaignType === campaignType && slot.placementKey === placementKey)
  || BANNER_SLOTS.find((slot) => slot.campaignType === campaignType)
  || null
);

export const describeBannerSlotSize = (slot: BannerSlot | null) => {
  if (!slot) return '';
  const crop = slot.fit === 'cover' ? 'crops to fit' : 'no crop';
  const device = slot.device === 'all' ? 'desktop + mobile' : slot.device;
  return `${slot.width} x ${slot.height} · ${crop} · ${device}`;
};

/** Retina asset size for the slots that crop; the `auto` ones are ratio-driven. */
export const describeBannerAssetAdvice = (slot: BannerSlot | null) => {
  if (!slot) return '';
  return `Supply ${slot.width * 2} x ${slot.height * 2} for retina.`;
};

export type BannerDraft = {
  id: string;
  name: string;
  campaignType: ScalableCampaignType;
  pageType: BannerPageType;
  placementKey: string;
  localityIds: string[];
  pincodes: string[];
  categoryIds: string[];
  subcategoryIds: string[];
  deviceTarget: 'all' | 'desktop' | 'mobile';
  imageUrl: string;
  title: string;
  description: string;
  badge: string;
  ctaText: string;
  actionType: 'landing_page' | 'landing_listing' | 'lead_form';
  targetUrl: string;
  targetBusinessId: string;
  startDate: string;
  endDate: string;
  status: ScalableCampaign['status'];
  priority: number;
};

export const emptyBannerDraft = (localityId = ''): BannerDraft => ({
  id: '',
  name: '',
  campaignType: 'listing_ad',
  pageType: 'homepage',
  placementKey: 'homepage_hero_primary',
  localityIds: localityId ? [localityId] : [],
  pincodes: [],
  categoryIds: [],
  subcategoryIds: [],
  deviceTarget: 'all',
  imageUrl: '',
  title: '',
  description: '',
  badge: '',
  ctaText: '',
  actionType: 'landing_page',
  targetUrl: '',
  targetBusinessId: '',
  startDate: '',
  endDate: '',
  // Active by default. The legacy Ad Banners form defaulted workflowStatus to
  // 'submitted' while the render filter only accepted approved/live, so every
  // newly created banner was invisible and nothing said why.
  status: 'active',
  priority: 100,
});

/** Builds the campaign the resolver will actually read. */
export const buildBannerCampaign = (draft: BannerDraft): ScalableCampaign => {
  const targets: TargetingRule = {
    localityIds: draft.localityIds,
    categoryIds: draft.categoryIds,
    subcategoryIds: draft.subcategoryIds,
    pincodes: draft.pincodes,
    devices: draft.deviceTarget === 'all' ? [] : [draft.deviceTarget],
    pageTypes: [draft.pageType],
    // Kept out of `targets` deliberately: the resolver scores
    // targets.placementKeys against ctx.placementKey, which the page does not
    // send. Placement is matched client-side off payload.placementKey instead,
    // so putting it in targets would filter the campaign out entirely.
    placementKeys: [],
  };

  const payload: Record<string, unknown> = {
    title: draft.title || draft.name,
    description: draft.description || undefined,
    badge: draft.badge || undefined,
    ctaText: draft.ctaText || undefined,
    ctaLabel: draft.ctaText || undefined,
    imageUrl: draft.imageUrl || undefined,
    startDate: draft.startDate || undefined,
    endDate: draft.endDate || undefined,
    isActive: draft.status === 'active',
    localityIds: draft.localityIds,
    pincodes: draft.pincodes,
    categoryIds: draft.categoryIds,
    deviceTarget: draft.deviceTarget,
    actionType: draft.actionType,
    targetUrl: draft.actionType === 'landing_page' ? draft.targetUrl || undefined : undefined,
    targetBusinessId: draft.actionType === 'landing_listing' ? draft.targetBusinessId || undefined : undefined,
  };
  // A hero banner carries no placement key; a listing ad is matched on it.
  if (draft.campaignType === 'listing_ad') payload.placementKey = draft.placementKey || undefined;
  if (draft.campaignType === 'hero_banner') payload.localityId = draft.localityIds[0] || undefined;

  return {
    id: draft.id,
    name: draft.name,
    campaignType: draft.campaignType,
    status: draft.status,
    priority: Number(draft.priority) || 0,
    isFallback: false,
    startDate: draft.startDate || undefined,
    endDate: draft.endDate || undefined,
    deviceTarget: draft.deviceTarget,
    placementKeys: draft.campaignType === 'listing_ad' && draft.placementKey ? [draft.placementKey] : [],
    targets,
    payload,
    updatedAt: new Date().toISOString(),
  };
};

export type BannerDeliveryVerdict = {
  live: boolean;
  reasons: string[];
  warnings: string[];
};

/**
 * Mirrors the server's own gates so the console can say why a banner is not
 * showing. Every `reason` below is a condition that makes the site skip it.
 */
export const evaluateBannerDelivery = (
  draft: BannerDraft,
  options: { todayIso?: string; hasSnapshotForLocality?: boolean } = {},
): BannerDeliveryVerdict => {
  const today = options.todayIso || new Date().toISOString().slice(0, 10);
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (draft.status !== 'active') reasons.push('Status is not Active.');
  if (!draft.imageUrl) reasons.push('No image uploaded.');
  if (draft.startDate && draft.startDate > today) reasons.push(`Starts on ${draft.startDate}, which is in the future.`);
  if (draft.endDate && draft.endDate < today) reasons.push(`Ended on ${draft.endDate}, which is in the past.`);
  if (draft.localityIds.length === 0) warnings.push('No locality selected — this shows in every locality.');

  const slot = findBannerSlot(draft.placementKey, draft.campaignType);
  if (draft.campaignType === 'listing_ad' && !draft.placementKey) {
    reasons.push('A listing ad needs a placement.');
  }
  if (slot && slot.device !== 'all' && draft.deviceTarget !== 'all' && draft.deviceTarget !== slot.device) {
    // The slot's own CSS breakpoint and the campaign's device target have to
    // agree; a desktop-targeted ad in a mobile-only slot renders nowhere.
    reasons.push(`Device target "${draft.deviceTarget}" can never match this ${slot.device}-only slot.`);
  }
  if (slot?.needsLayoutSection) {
    warnings.push('This slot also needs a homepage layout section carrying its placement key.');
  }
  if (options.hasSnapshotForLocality) {
    // A snapshot is served in preference to the live resolver, so it used to be
    // the reason a freshly-activated banner never appeared. Saving now
    // re-publishes the snapshots for the banner's localities, so the snapshot
    // carries the banner rather than hiding it — worth stating, not a blocker.
    warnings.push('This locality is served from a published snapshot, which is refreshed when you save.');
  }

  return { live: reasons.length === 0, reasons, warnings };
};

/** Reads an existing campaign back into the form. */
export const bannerDraftFromCampaign = (campaign: ScalableCampaign): BannerDraft => {
  const payload = (campaign.payload || {}) as Record<string, unknown>;
  const str = (value: unknown) => (typeof value === 'string' ? value : '');
  const list = (value: unknown) => (Array.isArray(value) ? value.map((entry) => String(entry)) : []);
  const pageTypes = campaign.targets?.pageTypes || [];
  return {
    id: campaign.id,
    name: campaign.name,
    campaignType: campaign.campaignType,
    pageType: (pageTypes[0] as BannerPageType) || 'homepage',
    placementKey: str(payload.placementKey) || (campaign.placementKeys || [])[0] || '',
    localityIds: campaign.targets?.localityIds || list(payload.localityIds),
    pincodes: campaign.targets?.pincodes || list(payload.pincodes),
    categoryIds: campaign.targets?.categoryIds || list(payload.categoryIds),
    subcategoryIds: campaign.targets?.subcategoryIds || [],
    deviceTarget: campaign.deviceTarget || 'all',
    imageUrl: str(payload.imageUrl),
    title: str(payload.title),
    description: str(payload.description),
    badge: str(payload.badge),
    ctaText: str(payload.ctaText) || str(payload.ctaLabel),
    actionType: (str(payload.actionType) as BannerDraft['actionType']) || 'landing_page',
    targetUrl: str(payload.targetUrl),
    targetBusinessId: str(payload.targetBusinessId),
    startDate: campaign.startDate || str(payload.startDate),
    endDate: campaign.endDate || str(payload.endDate),
    status: campaign.status,
    priority: campaign.priority,
  };
};
