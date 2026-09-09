// Locks in the banner form's delivery verdict and the campaign it writes.
//
// Every case below is a way a banner was created, activated, and then not
// visible on the site — the failure that this screen exists to make impossible
// to reach silently. Run with:  npx tsx scripts/banner-studio-test.mjs
import {
  BANNER_SLOTS,
  bannerDraftFromCampaign,
  buildBannerCampaign,
  describeBannerSlotSize,
  emptyBannerDraft,
  describeBannerCtr,
  evaluateBannerDelivery,
  findBannerSlot,
  withBannerStatus,
} from '../src/services/admin/bannerStudio.ts';
import { HOUSE_AD_SLOT_PRIORITY, buildHouseAd, isHouseAd, pickHouseAdPlacement } from '../src/services/houseAds.ts';
import {
  foldAdMetricEvents,
  getNewestCmsContentTimestamp,
  isPublishedSnapshotStale,
  normalizeAdMetricEvent,
  toDeliverableListingAd,
} from '../shared/homepageDelivery.js';

let passed = 0;
const failures = [];
const check = (name, condition, detail) => {
  if (condition) { passed += 1; return; }
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

const TODAY = '2026-09-08';
const ready = (over = {}) => ({
  ...emptyBannerDraft('roadpali'),
  name: 'RRWA hero',
  imageUrl: 'https://cdn.example/rrwa.png',
  ...over,
});
const verdict = (draft, options = {}) => evaluateBannerDelivery(draft, { todayIso: TODAY, ...options });

// --- the four gates that made a banner invisible -------------------------

check('a complete active banner is live', verdict(ready()).live);

check(
  'a non-active status blocks delivery',
  !verdict(ready({ status: 'draft' })).live,
  'the legacy form defaulted to submitted and the render filter only accepted approved/live',
);

check('a missing image blocks delivery', !verdict(ready({ imageUrl: '' })).live);

check(
  'a future start date blocks delivery and says the date',
  (() => {
    const result = verdict(ready({ startDate: '2026-12-01' }));
    return !result.live && result.reasons.some((reason) => reason.includes('2026-12-01'));
  })(),
);

check('an end date in the past blocks delivery', !verdict(ready({ endDate: '2026-08-01' })).live);

check('today inside the window is live', verdict(ready({ startDate: '2026-09-01', endDate: '2026-10-07' })).live);
check('an empty window is live', verdict(ready({ startDate: '', endDate: '' })).live);

// --- device target vs the slot's own breakpoint ---------------------------

check(
  'a desktop-targeted ad in a mobile-only slot can never render',
  !verdict(ready({ placementKey: 'mobile_inline', deviceTarget: 'desktop' })).live,
);
check(
  'a mobile-targeted ad in a desktop-only slot can never render',
  !verdict(ready({ placementKey: 'homepage_hero_primary', deviceTarget: 'mobile' })).live,
);
check(
  'device "all" matches a device-restricted slot',
  verdict(ready({ placementKey: 'mobile_inline', deviceTarget: 'all' })).live,
);

// --- placement ------------------------------------------------------------

check(
  'a listing ad with no placement cannot render',
  !verdict(ready({ placementKey: '' })).live,
);
check(
  'a hero banner needs no placement key',
  verdict(ready({ campaignType: 'hero_banner', placementKey: '' })).live,
);

// --- warnings are not blockers -------------------------------------------

check(
  'no locality warns but still delivers',
  (() => {
    const result = verdict(ready({ localityIds: [] }));
    return result.live && result.warnings.length > 0;
  })(),
);
check(
  'a published snapshot warns rather than blocking, because saving republishes it',
  (() => {
    const result = verdict(ready(), { hasSnapshotForLocality: true });
    return result.live && result.warnings.some((warning) => warning.includes('snapshot'));
  })(),
);
check(
  'the layout-section slot warns about the section it also needs',
  verdict(ready({ placementKey: 'homepage_inline_primary', deviceTarget: 'mobile' })).warnings
    .some((warning) => warning.includes('layout section')),
);

// --- targeting that silently switches a banner off ------------------------
//
// calculateTargetScore VETOES on a target the context cannot satisfy, and a
// homepage request carries neither a category (never) nor a pincode (unless the
// visitor saved one). Both fields read like helpful filters and are how a banner
// ends up activated and invisible.
//
// Real evidence: the seeded hero_roadpali and hero_kalamboli banners in
// homepage-config.json both carry pincodes ['410218'], and neither has been
// reaching its locality's homepage.

check(
  'a category target blocks a HOMEPAGE banner outright',
  (() => {
    const result = verdict(ready({ categoryIds: ['beauty-wellness'], pageType: 'homepage' }));
    return !result.live && result.reasons.some((reason) => reason.includes('category'));
  })(),
  'the homepage request never carries a categoryId, so the veto can never be satisfied',
);
check(
  'the same category target is fine on search results',
  verdict(ready({
    categoryIds: ['beauty-wellness'],
    pageType: 'listing_results',
    placementKey: 'listing_results',
  })).live,
);
check(
  'a pincode target warns loudly but still delivers',
  (() => {
    const result = verdict(ready({ pincodes: ['410218'] }));
    return result.live && result.warnings.some((warning) => warning.includes('410218'));
  })(),
  'it reaches only visitors who set that pincode — a warning, not a blocker',
);
check(
  'no pincode and no category produces neither',
  (() => {
    const result = verdict(ready());
    return result.warnings.every((warning) => !warning.includes('Pincode target'));
  })(),
);

// --- what gets written ----------------------------------------------------

// A homepage banner, targeted the way one should be: locality only. No category
// (the homepage sends none) and no pincode (that would hide it from anyone who
// has not set one) — the two checks above cover those cases deliberately.
const campaign = buildBannerCampaign(ready({
  placementKey: 'homepage_hero_primary',
  pincodes: [],
  categoryIds: [],
  startDate: '2026-09-07',
  endDate: '2026-10-07',
  targetUrl: 'https://localisy.in/rrwa',
}));

// Category and pincode targeting still has to survive a save; it is legitimate
// on a search-results banner.
const searchCampaign = buildBannerCampaign(ready({
  pageType: 'listing_results',
  placementKey: 'listing_results',
  categoryIds: ['beauty-wellness'],
  pincodes: ['410218'],
}));
check('a search-results banner keeps its category targeting', searchCampaign.targets.categoryIds.join() === 'beauty-wellness');
check('a search-results banner keeps its pincode targeting', searchCampaign.targets.pincodes.join() === '410218');
check(
  'and reads back with both intact',
  (() => {
    const back = bannerDraftFromCampaign(searchCampaign);
    return back.categoryIds.join() === 'beauty-wellness' && back.pincodes.join() === '410218';
  })(),
);

check('the form writes a campaign, not a listing ad', campaign.campaignType === 'listing_ad' && !!campaign.targets);

// --- every new banner needs its own id ------------------------------------
//
// An empty id does not mean "the server will assign one". sanitizeCampaign's
// `index` defaults to 0, so a blank id becomes the literal `campaign_1`, and the
// upsert matches that id and REPLACES the row already stored there. Creating
// three banners left one.

check('a new banner gets an id of its own', campaign.id.length > 0);
check('and it is not the manufactured fallback', campaign.id !== 'campaign_1');
check(
  'two new banners get different ids',
  buildBannerCampaign(ready({ name: 'A' })).id !== buildBannerCampaign(ready({ name: 'B' })).id,
  'sharing one id is how each save overwrote the last',
);
check(
  'editing an existing banner keeps its id',
  buildBannerCampaign({ ...ready(), id: 'banner_existing_1' }).id === 'banner_existing_1',
);
check(
  'a console-created banner is detached from the legacy sync',
  campaign.metadata?.detachedFromLegacySync === true,
  'otherwise it shares a namespace with the seeded banners and can be re-derived',
);
check('status active is what the resolver filters on', campaign.status === 'active');
check(
  'targets.placementKeys stays empty so the resolver cannot score it to -1',
  Array.isArray(campaign.targets.placementKeys) && campaign.targets.placementKeys.length === 0,
  'the resolver scores it against ctx.placementKey, which the page never sends',
);
check('the placement key travels in the payload instead', campaign.payload.placementKey === 'homepage_hero_primary');
check('a locality-only banner targets no pincode', campaign.targets.pincodes.length === 0);
check('a locality-only banner targets no category', campaign.targets.categoryIds.length === 0);
check('targeting carries the locality', campaign.targets.localityIds.join() === 'roadpali');
check('the page type is targeted', campaign.targets.pageTypes.join() === 'homepage');
check('device "all" targets no device rather than a literal "all"', campaign.targets.devices.length === 0);
check('the payload is marked active for the client-side filter', campaign.payload.isActive === true);
check('the landing URL survives', campaign.payload.targetUrl === 'https://localisy.in/rrwa');

const heroCampaign = buildBannerCampaign(ready({ campaignType: 'hero_banner', placementKey: '' }));
check('a hero banner carries no placement key', heroCampaign.payload.placementKey === undefined);
check('a hero banner carries its locality id', heroCampaign.payload.localityId === 'roadpali');

// --- round trip -----------------------------------------------------------

const roundTripped = bannerDraftFromCampaign(campaign);
check('a saved campaign reads back into the same placement', roundTripped.placementKey === 'homepage_hero_primary');
check('a saved campaign reads back into the same image', roundTripped.imageUrl === 'https://cdn.example/rrwa.png');
check('a saved campaign reads back into the same window', roundTripped.startDate === '2026-09-07' && roundTripped.endDate === '2026-10-07');
check('a saved campaign reads back live', verdict(roundTripped).live);

// --- delivery: what the client's own filter requires ---------------------
//
// WebPortal drops a listing ad unless `isActive` is true AND
// `workflowStatus || 'draft'` is in ['approved', 'live'], and it keys and tracks
// ads by `id`. A campaign payload carries none of those, so the resolver shapes
// them on the way out. These checks are the coupling; if the client's filter
// changes, they are what should be updated with it.

const delivered = toDeliverableListingAd({ ...campaign, id: 'camp_rrwa_1' });

check(
  'a shaped payload passes the client\'s workflowStatus filter',
  ['approved', 'live'].includes(delivered.workflowStatus || 'draft'),
  'without this the client reads "draft" and the banner never renders',
);
check('a shaped payload is active', delivered.isActive === true);
check('a shaped payload carries an id for keying and click tracking', delivered.id === 'camp_rrwa_1');
check('a shaped payload keeps its placement key', delivered.placementKey === 'homepage_hero_primary');
check('a shaped payload keeps its image', delivered.imageUrl === 'https://cdn.example/rrwa.png');
check('a shaped payload keeps its locality targeting', delivered.localityIds.join() === 'roadpali');

check(
  'an explicit workflowStatus from an operator is not overwritten',
  toDeliverableListingAd({ id: 'c1', payload: { workflowStatus: 'paused' } }).workflowStatus === 'paused',
);
check(
  'an explicit isActive:false still deactivates',
  toDeliverableListingAd({ id: 'c1', payload: { isActive: false } }).isActive === false,
);
check(
  'campaign-level dates fill in when the payload has none',
  (() => {
    const shaped = toDeliverableListingAd({ id: 'c1', startDate: '2026-09-01', endDate: '2026-10-01', payload: {} });
    return shaped.startDate === '2026-09-01' && shaped.endDate === '2026-10-01';
  })(),
);
check(
  'a campaign with no payload at all does not throw',
  toDeliverableListingAd({ id: 'c1' }).id === 'c1',
);

// --- the slot catalogue ---------------------------------------------------

check('every slot has a size', BANNER_SLOTS.every((slot) => slot.width > 0 && slot.height > 0));
check('every slot has a label', BANNER_SLOTS.every((slot) => slot.label.trim().length > 0));
check(
  'the side hero slot is portrait, which is what a landscape creative gets cropped by',
  (() => {
    const slot = findBannerSlot('homepage_hero_secondary', 'listing_ad');
    return !!slot && slot.height > slot.width;
  })(),
);
check('the size hint states the pixels and the crop', describeBannerSlotSize(findBannerSlot('mobile_inline', 'listing_ad')).includes('358 x 120'));
check(
  'a placement key from a different banner type falls back rather than returning nothing',
  findBannerSlot('homepage_hero_primary', 'hero_banner')?.campaignType === 'hero_banner',
);

// --- pause / make live ----------------------------------------------------
//
// The retired ops panel had these; the form-only screen did not, so pausing
// meant opening Edit and hunting for a dropdown. Both flags have to move
// together: the resolver filters on campaign.status, the client filters on
// payload.isActive, and setting one leaves the banner paused on the server and
// live in a published snapshot.

const paused = withBannerStatus(campaign, 'inactive');
check('pausing sets the campaign status the resolver filters on', paused.status === 'inactive');
check('pausing also clears payload.isActive, which the client filters on', paused.payload.isActive === false);
check('a paused banner does not deliver', !verdict(bannerDraftFromCampaign(paused)).live);

const relived = withBannerStatus(paused, 'active');
check('making it live restores both flags', relived.status === 'active' && relived.payload.isActive === true);
check('making it live delivers again', verdict(bannerDraftFromCampaign(relived)).live);
check('the status change keeps everything else', relived.payload.imageUrl === 'https://cdn.example/rrwa.png');

// --- performance counters -------------------------------------------------

check('an event with no ad id is dropped', normalizeAdMetricEvent({ type: 'click' }) === null);
check('an unknown metric type is dropped', normalizeAdMetricEvent({ adId: 'a1', type: 'hover' }) === null);
check('a valid event survives', normalizeAdMetricEvent({ adId: 'a1', type: 'click' })?.type === 'click');

const folded = foldAdMetricEvents([
  { adId: 'a1', type: 'impression', placementKey: 'homepage_hero_primary' },
  { adId: 'a1', type: 'impression', placementKey: 'homepage_hero_primary' },
  { adId: 'a1', type: 'click', placementKey: 'homepage_hero_primary' },
  { adId: 'a2', type: 'impression', placementKey: 'mobile_inline' },
  { adId: '', type: 'impression' },
  { adId: 'a3', type: 'nonsense' },
], '2026-09-08');

check('one row per ad per day per placement', folded.rows.length === 2, `got ${folded.rows.length}`);
check(
  'repeat impressions add up inside one row',
  folded.rows.find((row) => row.adId === 'a1')?.impressions === 2,
);
check('clicks are counted separately from impressions', folded.rows.find((row) => row.adId === 'a1')?.clicks === 1);
check('a second ad keeps its own row', folded.rows.find((row) => row.adId === 'a2')?.impressions === 1);
check('junk events are dropped, not counted', folded.accepted === 4, `accepted ${folded.accepted}`);
check(
  'the same ad in two placements stays two rows, so per-slot performance is readable',
  foldAdMetricEvents([
    { adId: 'a1', type: 'impression', placementKey: 'homepage_hero_primary' },
    { adId: 'a1', type: 'impression', placementKey: 'mobile_inline' },
  ], '2026-09-08').rows.length === 2,
);
check('an empty batch produces no rows', foldAdMetricEvents([], '2026-09-08').rows.length === 0);
check('a batch is capped so one request cannot write unbounded rows',
  foldAdMetricEvents(Array.from({ length: 200 }, (_, index) => ({ adId: `ad${index}`, type: 'impression' })), '2026-09-08').rows.length === 25);

check('CTR reads as a percentage', describeBannerCtr({ adId: 'a', impressions: 1000, clicks: 25, leads: 0 }) === '2.5%');
check(
  'no impressions reads as a dash, not 0%',
  describeBannerCtr({ adId: 'a', impressions: 0, clicks: 0, leads: 0 }) === '—',
  'a banner nobody has seen has no click-through rate, and showing 0% implies it failed',
);
check('a banner with no row at all reads as a dash', describeBannerCtr(undefined) === '—');

// --- stale published snapshots --------------------------------------------
//
// A snapshot beats live resolution and nothing expired it, so one published
// before a banner was created kept serving the old homepage indefinitely — the
// same response byte for byte on every check, with no way to tell from the site
// that the console had moved on.

const SNAP = { id: 's1', updatedAt: '2026-09-08T18:47:48.064Z' };

check(
  'a snapshot older than the newest campaign edit is stale',
  isPublishedSnapshotStale(SNAP, Date.parse('2026-09-08T19:10:00.000Z')),
);
check(
  'a snapshot published after the newest edit is fresh',
  !isPublishedSnapshotStale(SNAP, Date.parse('2026-09-08T18:00:00.000Z')),
);
check(
  'a snapshot published at the same instant is fresh',
  !isPublishedSnapshotStale(SNAP, Date.parse('2026-09-08T18:47:48.064Z')),
  'publishing writes the snapshot from that very state; equal is not stale',
);
check('with no content at all nothing is stale', !isPublishedSnapshotStale(SNAP, 0));
check('a missing snapshot is not stale', !isPublishedSnapshotStale(null, Date.now()));
check(
  'publishedAt stands in when updatedAt is missing',
  isPublishedSnapshotStale({ id: 's2', publishedAt: '2026-09-01T00:00:00.000Z' }, Date.parse('2026-09-08T00:00:00.000Z')),
);

check(
  'the newest timestamp spans campaigns, templates and assignments',
  getNewestCmsContentTimestamp({
    campaigns: [{ updatedAt: '2026-09-01T00:00:00.000Z' }],
    templates: [{ updatedAt: '2026-09-05T00:00:00.000Z' }],
    assignments: [{ updatedAt: '2026-09-03T00:00:00.000Z' }],
  }) === Date.parse('2026-09-05T00:00:00.000Z'),
);
check(
  'state.metadata.updatedAt is deliberately ignored',
  getNewestCmsContentTimestamp({
    campaigns: [{ updatedAt: '2026-09-01T00:00:00.000Z' }],
    metadata: { updatedAt: '2027-01-01T00:00:00.000Z' },
  }) === Date.parse('2026-09-01T00:00:00.000Z'),
  'publishing bumps metadata.updatedAt, which would mark every snapshot stale on publish',
);
check('an empty state has no newest timestamp', getNewestCmsContentTimestamp({}) === 0);
check('a malformed updatedAt is skipped rather than throwing',
  getNewestCmsContentTimestamp({ campaigns: [{ updatedAt: 'not a date' }, { updatedAt: '2026-09-02T00:00:00.000Z' }] })
  === Date.parse('2026-09-02T00:00:00.000Z'));

// --- the hero CTA that did nothing ---------------------------------------
//
// The hero click path is handleConfiguredCta(banner.ctaType, banner.ctaTarget),
// which returns immediately when ctaType is missing. A listing ad uses
// actionType/targetUrl instead, so a hero banner built here rendered fine and
// its button was dead.

const heroCta = buildBannerCampaign(ready({
  campaignType: 'hero_banner',
  placementKey: '',
  actionType: 'landing_page',
  targetUrl: 'https://localisy.in/advertise',
}));
check('a hero banner carries ctaType', heroCta.payload.ctaType === 'landing_page');
check('a hero banner carries ctaTarget', heroCta.payload.ctaTarget === 'https://localisy.in/advertise');
check(
  'a listing-target hero points at the business, not a URL',
  (() => {
    const built = buildBannerCampaign(ready({
      campaignType: 'hero_banner',
      placementKey: '',
      actionType: 'landing_listing',
      targetBusinessId: 'localisy015177',
      targetUrl: 'https://ignored.example',
    }));
    return built.payload.ctaTarget === 'localisy015177';
  })(),
);
check(
  'a listing ad is untouched by the hero CTA mapping',
  campaign.payload.ctaType === undefined,
  'listing ads go through actionType/targetUrl, which already worked',
);

// --- the house ad ---------------------------------------------------------
//
// Every empty slot used to backfill with something misleading: a business
// listing promoted for free in a paid slot, a stock photo of another city, or —
// worst — homepage-defaults-config.json's `fallbackListingAds`, three of whose
// four entries were invented businesses with invented offers.

const house = buildHouseAd({ localityLabel: 'Roadpali', placementKey: 'homepage_hero_primary' });
check('the house ad names the reader\'s own area', house.description.includes('Roadpali'));
check('the house ad reads as an invitation', house.title === 'Add Your Hyper Local Business');
check(
  'the house ad carries no image',
  house.imageUrl === undefined,
  'an image means an upload and a slot that renders blank the day that path 404s',
);
check('a click opens the advertise lead form', house.actionType === 'lead_form');
check('the house ad targets no locality, so it fits every one', house.localityIds.length === 0);
check(
  'the house ad carries no pincode',
  house.pincodes.length === 0,
  'a pincode is what made every real banner invisible today',
);
check('the house ad is identifiable', isHouseAd(house) && !isHouseAd({ id: 'banner_x' }));
check('it survives having no locality label', buildHouseAd().description.includes('nearby'));

check(
  'with nothing booked it takes the hero',
  pickHouseAdPlacement([]) === 'homepage_hero_primary',
);
check(
  'with the hero booked it falls to the strip',
  pickHouseAdPlacement(['homepage_hero_primary']) === 'homepage_strip_between_categories_and_listings',
  'so a page never loses its invitation just because one banner sold',
);
check(
  'with every slot booked it takes none',
  pickHouseAdPlacement([...HOUSE_AD_SLOT_PRIORITY]) === '',
);
check(
  'it picks exactly one slot, never several',
  typeof pickHouseAdPlacement(['homepage_hero_primary']) === 'string',
  'filling every empty slot would put five identical invitations on one homepage',
);

console.log(`${passed} checks passed, ${failures.length} failed`);
failures.forEach((failure) => console.log(`  FAIL ${failure}`));
process.exit(failures.length === 0 ? 0 : 1);
