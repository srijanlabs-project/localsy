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
import { foldAdMetricEvents, normalizeAdMetricEvent, toDeliverableListingAd } from '../shared/homepageDelivery.js';

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

// --- what gets written ----------------------------------------------------

const campaign = buildBannerCampaign(ready({
  placementKey: 'homepage_hero_primary',
  pincodes: ['410218'],
  categoryIds: ['salon'],
  startDate: '2026-09-07',
  endDate: '2026-10-07',
  targetUrl: 'https://localisy.in/rrwa',
}));

check('the form writes a campaign, not a listing ad', campaign.campaignType === 'listing_ad' && !!campaign.targets);
check('status active is what the resolver filters on', campaign.status === 'active');
check(
  'targets.placementKeys stays empty so the resolver cannot score it to -1',
  Array.isArray(campaign.targets.placementKeys) && campaign.targets.placementKeys.length === 0,
  'the resolver scores it against ctx.placementKey, which the page never sends',
);
check('the placement key travels in the payload instead', campaign.payload.placementKey === 'homepage_hero_primary');
check('targeting carries the pincode', campaign.targets.pincodes.join() === '410218');
check('targeting carries the category', campaign.targets.categoryIds.join() === 'salon');
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
check('a shaped payload keeps its targeting', delivered.pincodes.join() === '410218');

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

console.log(`${passed} checks passed, ${failures.length} failed`);
failures.forEach((failure) => console.log(`  FAIL ${failure}`));
process.exit(failures.length === 0 ? 0 : 1);
