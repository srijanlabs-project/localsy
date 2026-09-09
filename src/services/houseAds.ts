// The one banner shown when a slot has nothing booked in it.
//
// Every banner slot used to backfill with something misleading:
//
//   hero (main + side)  ->  a business listing, picked as approvedBusinesses[0]
//   hero (seeded)       ->  a stock Unsplash photo of a different city
//   in-feed strip       ->  "Your shop, top of this row, from Rs 499 a week"
//   sidebar / inline    ->  homepage-defaults-config.json `fallbackListingAds`
//
// The last of those is the worst: three of its four entries are INVENTED
// businesses with invented offers ("Radiance Skin & Hair Clinic - 20% OFF",
// "Delicious food delivered fast! - Up to 50% OFF"). They stayed off the site
// only because their gate required `resolvedHomepageSource === 'legacy_fallback'`,
// which never holds once the resolver is configured. A live directory must not
// present fabricated advertiser creatives as real ads, so they are gone.
//
// Promoting a real business was no better: `approvedBusinesses[0]` is one of
// 26,000 chosen by sort order, shown in a paid slot, for free — unfair to the
// rest and indistinguishable from a booking to a visitor.
//
// What replaces all of it is one honest house ad: the slot is empty, and it says
// so by inviting the reader to fill it.
import type { ListingAd } from '../types';

export const HOUSE_AD_ID = 'house_ad_add_your_business';

/**
 * Which empty slot gets the house ad, most prominent first.
 *
 * Deliberately ONE per page. Filling every empty slot with the same creative
 * would put four or five identical "Add Your Business" panels on one homepage,
 * which reads as an empty site rather than an invitation. Slots that lose the
 * draw collapse, as they already did.
 */
export const HOUSE_AD_SLOT_PRIORITY = [
  'homepage_hero_primary',
  'homepage_strip_between_categories_and_listings',
  'homepage_inline_primary',
  'mobile_inline',
  'homepage_hero_secondary',
  'homepage_hero_junior',
  'listing_results',
] as const;

/**
 * Slots whose box is too short for a headline plus a benefit line.
 *
 * The house ad is drawn from text, so it fills whatever container it is given —
 * but the same three-line copy that reads well in a 360px hero is a cramped mess
 * in a 120px mobile strip. These get the short form.
 */
const COMPACT_HOUSE_AD_SLOTS = new Set([
  'homepage_sidebar',
  'mobile_inline',
  'homepage_hero_junior',
  'homepage_inline_primary',
  'homepage_strip_between_categories_and_listings',
]);

export type HouseAdContext = {
  /** "Roadpali", used so the benefit line names the reader's own area. */
  localityLabel?: string;
  placementKey?: string;
  /** Slots that currently hold a booked banner, so they are not candidates. */
  filledPlacementKeys?: string[];
};

/**
 * The placement the house ad should take, or '' when every slot is booked.
 *
 * Pure so the choice is testable: which slot fills is the part that decides
 * whether a visitor sees one invitation or five.
 */
export const pickHouseAdPlacement = (filledPlacementKeys: string[] = []): string => {
  const filled = new Set(filledPlacementKeys.filter(Boolean));
  return HOUSE_AD_SLOT_PRIORITY.find((placementKey) => !filled.has(placementKey)) || '';
};

/**
 * The house ad, shaped as a ListingAd so every slot can render it with the
 * component it already uses.
 *
 * No `imageUrl` on purpose: an image means an upload, a CDN path, and a slot
 * that renders blank the day that path 404s. The rendering components already
 * have a no-image branch that draws the background colour and the text.
 *
 * `actionType: 'lead_form'` sends a click into the existing advertise lead
 * capture, which is the whole point of the banner.
 */
export const buildHouseAd = (context: HouseAdContext = {}): ListingAd => {
  const area = String(context.localityLabel || '').trim();
  const compact = COMPACT_HOUSE_AD_SLOTS.has(String(context.placementKey || ''));
  return {
    id: HOUSE_AD_ID,
    title: compact
      ? 'Add your business — free'
      : 'Add Your Hyper Local Business',
    description: compact
      ? (area ? `Found by neighbours in ${area}.` : 'Found by neighbours nearby.')
      : (area
        ? `Free to list, and found by neighbours searching in ${area}.`
        : 'Free to list, and found by neighbours searching nearby.'),
    badge: 'Localisy',
    ctaText: compact ? 'List free' : 'List my business - free',
    backgroundColor: '#0D1B2A',
    startDate: '',
    endDate: '',
    actionType: 'lead_form',
    localityIds: [],
    pincodes: [],
    categoryIds: [],
    tags: [],
    placementKey: context.placementKey || '',
    deviceTarget: 'all',
    workflowStatus: 'live',
    isActive: true,
    impressions: 0,
    clicks: 0,
    leadCount: 0,
  };
};

/** True for the house ad, so callers can treat it differently from a booking. */
export const isHouseAd = (ad?: { id?: string } | null) => Boolean(ad && ad.id === HOUSE_AD_ID);
