// How a campaign becomes something the public site will actually render.
//
// The resolver hands the client `campaign.payload` verbatim. The client, though,
// treats listing ads as ListingAd records and filters them:
//
//   if (!ad.isActive) return false;
//   if (!['approved', 'live'].includes(ad.workflowStatus || 'draft')) return false;
//
// A campaign payload carries neither `workflowStatus` nor `id`, so every
// campaign-created placed banner was read as 'draft' and dropped — which is why
// a hero-banner campaign rendered while a listing-ad campaign with identical
// targeting did not. Shaping happens here, in one place, rather than by asking
// every screen that writes a banner to remember to set a field the site's own
// filter depends on.
//
// The payload's own values always win, so an explicit workflowStatus set by an
// operator is preserved.

/** Shapes one listing-ad campaign into the ListingAd the client expects. */
export function toDeliverableListingAd(campaign) {
  const source = campaign && typeof campaign === 'object' ? campaign : {};
  const payload = source.payload && typeof source.payload === 'object' ? source.payload : {};
  const placementKeys = Array.isArray(source.placementKeys) ? source.placementKeys : [];
  return {
    ...payload,
    id: payload.id || source.id || '',
    workflowStatus: payload.workflowStatus || 'approved',
    // Only an explicit `false` deactivates. An absent flag means the campaign's
    // own `status: 'active'` already got it this far.
    isActive: payload.isActive !== false,
    startDate: payload.startDate || source.startDate || '',
    endDate: payload.endDate || source.endDate || '',
    placementKey: payload.placementKey || placementKeys[0] || '',
    deviceTarget: payload.deviceTarget || source.deviceTarget || 'all',
  };
}

export const AD_METRIC_TYPES = new Set(['impression', 'click', 'lead']);
export const AD_METRIC_MAX_EVENTS_PER_REQUEST = 25;

/** Keeps only events that name a real ad and a real metric, and bounds the strings. */
export function normalizeAdMetricEvent(event) {
  const source = event && typeof event === 'object' ? event : {};
  const adId = String(source.adId || '').trim().slice(0, 200);
  const type = String(source.type || '').trim().toLowerCase();
  if (!adId || !AD_METRIC_TYPES.has(type)) return null;
  return {
    adId,
    type,
    placementKey: String(source.placementKey || '').trim().slice(0, 120),
  };
}

/**
 * Folds a batch of events into one row per (ad, day, placement).
 *
 * A page load reports every banner it painted, so folding turns six impressions
 * into one statement. The rows it returns are added with an atomic UPSERT — the
 * counters this replaced were read-modify-write in the visitor's browser, which
 * silently lost increments whenever two visitors overlapped.
 *
 * Bad events are dropped rather than rejected: tracking must never be the reason
 * a public page reports an error.
 */
export function foldAdMetricEvents(events, metricDate) {
  const normalized = (Array.isArray(events) ? events : [])
    .map(normalizeAdMetricEvent)
    .filter(Boolean)
    .slice(0, AD_METRIC_MAX_EVENTS_PER_REQUEST);

  const folded = new Map();
  for (const event of normalized) {
    const key = `${event.adId}|${metricDate}|${event.placementKey}`;
    const row = folded.get(key) || {
      key,
      adId: event.adId,
      metricDate,
      placementKey: event.placementKey,
      impressions: 0,
      clicks: 0,
      leads: 0,
    };
    if (event.type === 'impression') row.impressions += 1;
    if (event.type === 'click') row.clicks += 1;
    if (event.type === 'lead') row.leads += 1;
    folded.set(key, row);
  }
  return { rows: [...folded.values()], accepted: normalized.length };
}

/**
 * The newest edit to anything a published snapshot is built FROM.
 *
 * Deliberately NOT `state.metadata.updatedAt`: publishing writes the snapshots
 * into that same state and bumps the field, so comparing against it would mark
 * every snapshot stale the instant it was published and the snapshot layer would
 * never be used again.
 */
export function getNewestCmsContentTimestamp(state) {
  let newest = 0;
  for (const collection of [state?.campaigns, state?.templates, state?.assignments]) {
    if (!Array.isArray(collection)) continue;
    for (const entity of collection) {
      const parsed = Date.parse(entity?.updatedAt || '');
      if (Number.isFinite(parsed) && parsed > newest) newest = parsed;
    }
  }
  return newest;
}

/**
 * True when a snapshot predates the newest content edit and must not be served.
 *
 * Nothing used to expire a snapshot, and a snapshot wins over live resolution —
 * so one published before a campaign was created kept serving the old homepage
 * indefinitely, identical on every check, with no way to tell from the site.
 */
export function isPublishedSnapshotStale(snapshot, newestContentAt) {
  if (!snapshot) return false;
  if (!newestContentAt) return false;
  const snapshotAt = Date.parse(snapshot.updatedAt || snapshot.publishedAt || '') || 0;
  return newestContentAt > snapshotAt;
}
