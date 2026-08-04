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
  /const publishedSnapshotMatch = usePublished \? findPublishedSnapshotMatch\(cmsState, context\) : null;/,
  'published snapshot selection before live resolve',
  'server.js',
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
mustContain(
  webPortalText,
  /const cmsHeroBanners = hasResolvedHomepagePayload\s*\? \(resolvedHomepagePayload\?\.heroBanners \|\| \[\]\)\s*: heroBanners;/s,
  'hero banners trust resolved payload even when empty',
  'src/components/WebPortal.tsx',
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
