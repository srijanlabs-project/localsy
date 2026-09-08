import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function readFile(relPath) {
  const abs = path.join(projectRoot, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
  return fs.readFileSync(abs, 'utf8');
}

function mustContain(text, pattern, label, relPath) {
  if (!pattern.test(text)) {
    throw new Error(`Resolved homepage smoke failed: ${label} not found in ${relPath}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Resolved homepage smoke failed: ${message}`);
  }
}

const serverText = readFile('server.js');
const webPortalText = readFile('src/components/WebPortal.tsx');
const adminConsoleText = readFile('src/components/AdminConsole.tsx');
const homepageConfig = JSON.parse(readFile('homepage-config.json'));

mustContain(
  serverText,
  /app\.get\('\/api\/resolved-homepage', async \(req, res\) => \{/,
  'resolved homepage read route',
  'server.js',
);
mustContain(
  serverText,
  /const snapshotMatch = usePublished \? findPublishedSnapshotMatch\(cmsState, context\) : null;/,
  'published snapshot selection before live resolve',
  'server.js',
);
// A snapshot is served in preference to live resolution and nothing expired it,
// so one published before a campaign edit kept serving the old homepage forever.
mustContain(
  serverText,
  /const publishedSnapshotMatch = snapshotMatch && !snapshotMatch\.stale \? snapshotMatch : null;/,
  'stale snapshots passed over in favour of live resolution',
  'server.js',
);
// Staleness must be measured against content edits, NOT state.metadata.updatedAt
// — publishing writes snapshots into the same state and bumps that field, which
// would mark every snapshot stale the moment it was published.
mustContain(
  serverText,
  /stale: isPublishedSnapshotStale\(match\.snapshot, newestContentAt\)/,
  'staleness computed from the shared helper',
  'server.js',
);
mustContain(
  readFile('shared/homepageDelivery.js'),
  /for \(const collection of \[state\?\.campaigns, state\?\.templates, state\?\.assignments\]\)/,
  'staleness measured from campaign/template/assignment edits, not state.metadata',
  'shared/homepageDelivery.js',
);
mustContain(
  serverText,
  /const payload = publishedSnapshotMatch\?\.snapshot\?\.payload \|\| await resolveHomepageForContext\(context, \{ state: cmsState \}\);/,
  'published snapshot payload fallback to live resolver',
  'server.js',
);
mustContain(
  serverText,
  /async function publishResolvedHomepageSnapshotsFromRequest\(requestBody\)/,
  'resolved homepage publish helper',
  'server.js',
);
mustContain(
  serverText,
  /function findPublishedSnapshotMatch\(state, context\)/,
  'published snapshot matcher helper',
  'server.js',
);
mustContain(
  serverText,
  /const resolution = \{/,
  'resolved homepage provenance payload',
  'server.js',
);
mustContain(
  serverText,
  /res\.setHeader\('X-Resolved-Homepage-Source', resolution\.source\);/,
  'resolved homepage source response header',
  'server.js',
);
mustContain(
  serverText,
  /res\.setHeader\('X-Resolved-Homepage-Strategy', resolution\.strategy\);/,
  'resolved homepage strategy response header',
  'server.js',
);

mustContain(
  webPortalText,
  /const hasResolvedHomepagePayload = resolvedHomepagePayload !== null;/,
  'authoritative resolved payload flag',
  'src/components/WebPortal.tsx',
);
// Stronger than it used to be. This asserted the legacy `heroBanners` prop was
// the fallback whenever no resolved payload was in hand — which meant the hero
// painted a stale banner from the retired homepage_hero_banners store, then the
// configured one, then the campaign: three banners per page load. When the
// resolver is configured it is now the only hero source.
mustContain(
  webPortalText,
  /const cmsHeroBanners = hasResolvedHomepagePayload\s*\? \(resolvedHomepagePayload\?\.heroBanners \|\| \[\]\)\s*: \(resolvedHomepageConfigured \? \[\] : heroBanners\);/s,
  'hero banners come only from the resolver once it is configured',
  'src/components/WebPortal.tsx',
);
// The hero is held for the beat before hydration rather than painting the
// bottom of its three-level fallback and swapping up.
mustContain(
  webPortalText,
  /isHeroPending=\{shouldDeferResolvedListingAds\}/,
  'hero held while the resolved payload is in flight',
  'src/components/WebPortal.tsx',
);
// A campaign payload carries no workflowStatus, and the client drops a listing
// ad whose workflowStatus is not approved/live. Shaping is what makes a
// campaign-created placed banner deliverable at all.
mustContain(
  serverText,
  /listingAds: resolveCampaignPayloads\(state, effectiveContext, 'listing_ad'\)\.map\(toDeliverableListingAd\),/,
  'listing-ad campaigns shaped into ListingAd records before delivery',
  'server.js',
);
mustContain(
  webPortalText,
  /\['approved', 'live'\]\.includes\(ad\.workflowStatus \|\| 'draft'\)/,
  'the client filter that shaping exists to satisfy',
  'src/components/WebPortal.tsx',
);
// Banner performance depends on a write path a public visitor is allowed to use.
// Before this endpoint the only way to move a counter was the privileged
// listing-ads PUT, so every visitor's tracking call was rejected and the admin
// console reported frozen numbers as performance.
mustContain(
  serverText,
  /app\.post\('\/api\/ad-metrics\/track', async \(req, res\) => \{/,
  'public banner tracking endpoint',
  'server.js',
);
mustContain(
  serverText,
  /CREATE TABLE IF NOT EXISTS ad_metric_daily/,
  'daily banner counter table',
  'server.js',
);
// homepage-config.json's six seeded hero banners become campaigns with
// isFallback:true and priority 100 — the same priority a console-created banner
// defaults to. Without an explicit tie-break the seeded Unsplash placeholder can
// take the slot an operator just booked.
mustContain(
  serverText,
  /const leftFallback = left\.campaign\.isFallback \? 1 : 0;/,
  'real bookings sorted ahead of seeded fallback campaigns',
  'server.js',
);
// The increment must stay an atomic UPSERT. A read-modify-write here loses
// counts whenever two visitors overlap, which is what the old client-side
// counter did.
mustContain(
  serverText,
  /ON CONFLICT \(ad_id, metric_date, placement_key\)\s*DO UPDATE SET\s*impressions = ad_metric_daily\.impressions \+ EXCLUDED\.impressions/s,
  'atomic counter increment',
  'server.js',
);
mustContain(
  webPortalText,
  /const cmsListingAds = hasResolvedHomepagePayload\s*\? \(resolvedHomepagePayload\?\.listingAds \|\| \[\]\)\s*: listingAds;/s,
  'listing ads trust resolved payload even when empty',
  'src/components/WebPortal.tsx',
);
mustContain(
  webPortalText,
  /const cmsCoupons = hasResolvedHomepagePayload\s*\? \(resolvedHomepagePayload\?\.offers \|\| \[\]\)\s*: coupons;/s,
  'offers trust resolved payload even when empty',
  'src/components/WebPortal.tsx',
);
mustContain(
  webPortalText,
  /const cmsCommunityItems = hasResolvedHomepagePayload\s*\? \(resolvedHomepagePayload\?\.contentBlocks \|\| \[\]\)\s*: communityItems;/s,
  'updates trust resolved payload even when empty',
  'src/components/WebPortal.tsx',
);
mustContain(
  webPortalText,
  /const activeHomepageSections = useMemo\(\(\) => \{\s*const sections = hasResolvedHomepagePayload\s*\? resolvedHomepageSections\s*: \(activeHomepageLayout\?\.sections \|\| \[\]\);/s,
  'homepage sections trust resolved payload even when empty',
  'src/components/WebPortal.tsx',
);
mustContain(
  adminConsoleText,
  /Resolver provenance:/,
  'admin preview provenance panel',
  'src/components/AdminConsole.tsx',
);

const layouts = Array.isArray(homepageConfig.homepageLayouts) ? homepageConfig.homepageLayouts : [];
const heroBanners = Array.isArray(homepageConfig.heroBanners) ? homepageConfig.heroBanners : [];
const listingAds = Array.isArray(homepageConfig.listingAds) ? homepageConfig.listingAds : [];
const coupons = Array.isArray(homepageConfig.coupons) ? homepageConfig.coupons : [];
const communityItems = Array.isArray(homepageConfig.communityItems) ? homepageConfig.communityItems : [];
const localityCategoryLinks = Array.isArray(homepageConfig.localityCategoryLinks) ? homepageConfig.localityCategoryLinks : [];
const apiConfiguration = homepageConfig.apiConfiguration || {};

assert(apiConfiguration.resolvedHomepageEndpoint === '/api/resolved-homepage', 'homepage config must point to /api/resolved-homepage');
assert(apiConfiguration.publishResolvedHomepageEndpoint === '/api/resolved-homepage/publish', 'homepage config must point publish endpoint to /api/resolved-homepage/publish');

const requiredLocalities = ['roadpali', 'kalamboli'];
const requiredSectionTypes = ['hero_banner', 'featured_businesses', 'offers_list', 'updates_feed'];

for (const localityId of requiredLocalities) {
  const layout = layouts.find((entry) => String(entry.localityId || '') === localityId);
  assert(layout, `missing homepage layout for ${localityId}`);
  assert(layout.visible !== false, `${localityId} homepage layout must be visible`);
  assert(Array.isArray(layout.sections) && layout.sections.length > 0, `${localityId} homepage layout must contain sections`);
  for (const sectionType of requiredSectionTypes) {
    assert(
      layout.sections.some((section) => String(section.sectionType || '') === sectionType && String(section.status || 'active') === 'active' && section.visible !== false),
      `${localityId} homepage layout must include active ${sectionType}`,
    );
  }

  assert(
    heroBanners.some((entry) => String(entry.localityId || '') === localityId && entry.isActive !== false),
    `${localityId} must have at least one active hero banner`,
  );
  assert(
    listingAds.some((entry) => entry.isActive !== false && Array.isArray(entry.localityIds) && entry.localityIds.includes(localityId)),
    `${localityId} must have at least one active listing ad`,
  );
  assert(
    coupons.some((entry) => entry.isActive !== false && Array.isArray(entry.localityIds) && entry.localityIds.includes(localityId)),
    `${localityId} must have at least one active coupon`,
  );
  assert(
    communityItems.some((entry) => String(entry.localityId || '') === localityId && !['draft', 'archived'].includes(String(entry.status || 'published'))),
    `${localityId} must have at least one published community item`,
  );
  assert(
    localityCategoryLinks.some((entry) => String(entry.localityId || '') === localityId),
    `${localityId} must have at least one locality category link`,
  );
}

console.log('Resolved homepage smoke check passed.');
