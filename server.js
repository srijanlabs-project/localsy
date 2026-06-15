import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';
import { buildBusinessTaxonomySeed } from './shared/businessTaxonomySeed.js';
import {
  DEFAULT_LOCALITIES,
  DEFAULT_LOCALITY_ID,
  DEFAULT_PINCODE_MAPPINGS,
  buildDefaultSubdomainMappings,
} from './shared/localityRoutingSeed.js';
import {
  DEFAULT_STATES,
  DEFAULT_CITIES,
  DEFAULT_GEOGRAPHY_LOCALITIES,
  DEFAULT_AREAS,
} from './shared/geographySeed.js';
import {
  DEFAULT_FALLBACK_LISTING_AD_TEMPLATES,
  DEFAULT_HERO_BANNER_DRAFT_DEFAULTS,
  DEFAULT_HERO_QUICK_ACTIONS,
  DEFAULT_HERO_STAT_TEMPLATES,
  DEFAULT_HOMEPAGE_SECTION_TEMPLATES,
  DEFAULT_SEARCH_SHORTCUT_CATEGORY_IDS,
} from './shared/homepageDefaultsSeed.js';
import {
  DEFAULT_SEO_CATEGORY_LABELS,
  DEFAULT_SEO_DEFAULT_LISTING_NAMES,
  DEFAULT_SEO_LOCALITY_METADATA,
  DEFAULT_SEO_ROUTE_INTENTS,
  DEFAULT_SEO_TOP_LISTINGS,
} from './shared/seoDiscoverySeed.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const auditLogPath = path.join(__dirname, 'audit-events.jsonl');
const usersPath = path.join(__dirname, 'users.json');
const businessesPath = path.join(__dirname, 'businesses.json');
const adLeadsPath = path.join(__dirname, 'ad-leads.json');
const homepageConfigPath = path.join(__dirname, 'homepage-config.json');
const businessTaxonomyPath = path.join(__dirname, 'business-taxonomy.json');
const localityRoutingConfigPath = path.join(__dirname, 'locality-routing-config.json');
const geographyConfigPath = path.join(__dirname, 'geography-config.json');
const homepageDefaultsConfigPath = path.join(__dirname, 'homepage-defaults-config.json');
const seoDiscoveryConfigPath = path.join(__dirname, 'seo-discovery-config.json');
const scalableCmsStatePath = path.join(__dirname, 'scalable-cms-state.json');
const TOKEN_SECRET = process.env.AUTH_SECRET || 'replace-this-in-production';
const TOKEN_TTL_SEC = 60 * 60 * 12; // 12 hours

app.use(express.json({ limit: '20mb' }));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: ws: wss:",
      "media-src 'self' data: blob: https:",
      "form-action 'self'",
    ].join('; '),
  );
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : String(forwardedProto || '').split(',')[0]) || req.protocol;
  if (String(proto).toLowerCase() === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

let pgPool = null;
let pgInitAttempted = false;
let memoryUsers = null;
let memoryBusinesses = null;
let memoryAdLeads = null;
let memoryHomepageConfig = null;
let memoryBusinessTaxonomy = null;
let memoryLocalityRoutingConfig = null;
let memoryGeographyConfig = null;
let memoryHomepageDefaultsConfig = null;
let memorySeoDiscoveryConfig = null;
let memoryScalableCmsState = null;
let memoryOtpChallenges = null;
let memoryContactViewEvents = null;
const auditEventThrottleBuckets = new Map();
const auditEventRecentWrites = new Map();
const publicWriteThrottleBuckets = new Map();

const STORAGE_ENDPOINT_URL = process.env.S3_ENDPOINT_URL || process.env.STORAGE_ENDPOINT_URL || '';
const STORAGE_BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.STORAGE_BUCKET_NAME || '';
const STORAGE_ACCESS_KEY_ID =
  process.env.S3_ACCESS_KEY_ID ||
  process.env.ACCESS_KEY_ID ||
  process.env.Access_Key_ID ||
  process.env.STORAGE_ACCESS_KEY_ID ||
  '';
const STORAGE_SECRET_ACCESS_KEY =
  process.env.S3_SECRET_ACCESS_KEY ||
  process.env.SECRET_ACCESS_KEY ||
  process.env.Secret_Access_Key ||
  process.env.STORAGE_SECRET_ACCESS_KEY ||
  '';
const STORAGE_REGION = process.env.S3_REGION || process.env.STORAGE_REGION || 'auto';
const STORAGE_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || '';
const STORAGE_FORCE_PATH_STYLE = String(process.env.S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true';
const STORAGE_OBJECT_ACL = process.env.S3_OBJECT_ACL || '';
const MSG91_AUTHKEY = process.env.MSG91_AUTHKEY || '';
const MSG91_OTP_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID || '';
const MSG91_OTP_BASE_URL = process.env.MSG91_OTP_BASE_URL || 'https://control.msg91.com';
const CONTACT_VIEW_DAILY_LIMIT = Math.max(1, parseInt(process.env.CONTACT_VIEW_DAILY_LIMIT || '10', 10) || 10);
const AUDIT_EVENT_WINDOW_MS = Math.max(10_000, parseInt(process.env.AUDIT_EVENT_WINDOW_MS || '60000', 10) || 60_000);
const AUDIT_EVENT_MAX_PER_WINDOW = Math.max(10, parseInt(process.env.AUDIT_EVENT_MAX_PER_WINDOW || '40', 10) || 40);
const AUDIT_EVENT_AUTH_MAX_PER_WINDOW = Math.max(
  AUDIT_EVENT_MAX_PER_WINDOW,
  parseInt(process.env.AUDIT_EVENT_AUTH_MAX_PER_WINDOW || '120', 10) || 120,
);
const AUDIT_EVENT_BOT_MAX_PER_WINDOW = Math.max(2, parseInt(process.env.AUDIT_EVENT_BOT_MAX_PER_WINDOW || '6', 10) || 6);
const AUDIT_EVENT_DEDUPE_MS = Math.max(1_000, parseInt(process.env.AUDIT_EVENT_DEDUPE_MS || '15000', 10) || 15_000);
const AUDIT_EVENT_BOT_DEDUPE_MS = Math.max(
  AUDIT_EVENT_DEDUPE_MS,
  parseInt(process.env.AUDIT_EVENT_BOT_DEDUPE_MS || '180000', 10) || 180_000,
);
const PUBLIC_WRITE_THROTTLE_WINDOW_MS = Math.max(
  10_000,
  parseInt(process.env.PUBLIC_WRITE_THROTTLE_WINDOW_MS || '600000', 10) || 600_000,
);
const PUBLIC_WRITE_THROTTLE_LIMIT = Math.max(
  3,
  parseInt(process.env.PUBLIC_WRITE_THROTTLE_LIMIT || '12', 10) || 12,
);
const TRUSTED_APP_ORIGINS = String(process.env.TRUSTED_APP_ORIGINS || '')
  .split(',')
  .map((entry) => entry.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const PUBLIC_USER_TYPES = ['buyer', 'seller', 'resource'];
const ALL_USER_TYPES = ['platform_admin', 'developer', 'buyer', 'seller', 'resource'];
const SEO_SITE_NAME = 'Localisy';
const SEO_SITE_TAGLINE = 'A Hyper Local Business Directory';
const SEO_SITE_PROMISE = 'Discover Local. Support Local. Grow Local.';

let cachedIndexTemplate = null;

function getOrigin(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : String(forwardedProto || '').split(',')[0]) || req.protocol;
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function normalizeOriginValue(value) {
  try {
    return new URL(String(value || '').trim()).origin.replace(/\/+$/, '');
  } catch (_error) {
    return '';
  }
}

function getTrustedRequestOrigins(req) {
  return new Set([
    getOrigin(req).replace(/\/+$/, ''),
    ...TRUSTED_APP_ORIGINS,
  ].filter(Boolean));
}

function enforceTrustedWriteOrigin(req, res) {
  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;
  const requestOrigin = normalizeOriginValue(
    Array.isArray(originHeader) ? originHeader[0] : originHeader,
  ) || normalizeOriginValue(
    Array.isArray(refererHeader) ? refererHeader[0] : refererHeader,
  );

  if (!requestOrigin) {
    return true;
  }

  const trustedOrigins = getTrustedRequestOrigins(req);
  if (trustedOrigins.has(requestOrigin)) {
    return true;
  }

  res.status(403).json({
    ok: false,
    error: 'Cross-origin write requests are not allowed.',
  });
  return false;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugifyForUrl(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildLocalityPath(localityId) {
  return `/${slugifyForUrl(localityId || 'roadpali')}`;
}

function buildSeoPath(context, localityId, categoryId, q) {
  const localityPath = buildLocalityPath(localityId);
  if (!categoryId || categoryId === 'all') return localityPath;
  const normalizedQuery = (q || '').trim().toLowerCase();
  if (normalizedQuery) {
    const matchedIntent = context.intentByCategoryAndQuery.get(`${categoryId}::${normalizedQuery}`);
    if (matchedIntent) return `${localityPath}/${matchedIntent.slug}`;
  }
  const defaultIntent = context.defaultIntentByCategory.get(categoryId);
  if (defaultIntent) return `${localityPath}/${defaultIntent.slug}`;
  return `${localityPath}/${slugifyForUrl(categoryId)}`;
}

function buildSeoImageUrl(origin, title, subtitle) {
  const params = new URLSearchParams({
    title: String(title || '').slice(0, 120),
    subtitle: String(subtitle || '').slice(0, 160),
    brand: SEO_SITE_NAME,
    tagline: SEO_SITE_PROMISE,
  });
  return `${origin}/seo-image.svg?${params.toString()}`;
}

function queryValueAsString(value) {
  if (Array.isArray(value)) return String(value[0] || '');
  if (value === undefined || value === null) return '';
  return String(value);
}

function resolveLegacySeoRedirectPath(query, context) {
  const localitySlug = slugifyForUrl(queryValueAsString(query.locality));
  if (!localitySlug || !context.localityIdSet.has(localitySlug)) return null;

  const categorySlug = slugifyForUrl(queryValueAsString(query.category));
  let categoryId = context.categoryIdSet.has(categorySlug) ? categorySlug : null;
  let searchQuery = queryValueAsString(query.q).trim();

  if (!categoryId && searchQuery) {
    const searchIntent = context.intentBySlug.get(slugifyForUrl(searchQuery));
    if (!searchIntent) return null;
    categoryId = searchIntent.categoryId;
    searchQuery = searchIntent.q;
  }

  if (categoryId && searchQuery) {
    const matchedIntent = context.intentByCategoryAndQuery.get(`${categoryId}::${searchQuery.toLowerCase()}`);
    if (matchedIntent) {
      return buildSeoPath(context, localitySlug, matchedIntent.categoryId, matchedIntent.q);
    }
  }

  return buildSeoPath(context, localitySlug, categoryId, null);
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function humanizeSlug(value) {
  return String(value)
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLocalityFromHost(req, context) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const rawHost = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get('host') || '';
  const hostname = String(rawHost).split(',')[0].split(':')[0].toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return null;
  const parts = hostname.split('.');
  if (parts.length < 2) return null;
  const candidate = slugifyForUrl(parts[0]);
  return context.localityIdSet.has(candidate) ? candidate : null;
}

function parseSeoRoute(pathname, context, forcedLocalityId = null) {
  const segments = String(pathname || '/')
    .split('/')
    .filter(Boolean)
    .map((segment) => slugifyForUrl(decodeURIComponent(segment)));

  const localityId = forcedLocalityId || segments[0] || null;
  if (!localityId || !context.localityIdSet.has(localityId)) return null;

  let localSegments = segments;
  if (forcedLocalityId) {
    if (segments[0] === forcedLocalityId) {
      localSegments = segments.slice(1);
    } else if (context.localityIdSet.has(segments[0])) {
      localSegments = segments.slice(1);
    }
  } else {
    localSegments = segments.slice(1);
  }

  const pageSlug = localSegments[0] || null;
  const listingSlug = localSegments[1] || null;

  let intent = null;
  let categoryId = null;
  if (pageSlug) {
    intent = context.intentBySlug.get(pageSlug) || null;
    if (intent) {
      categoryId = intent.categoryId;
    } else if (context.categoryIdSet.has(pageSlug)) {
      categoryId = pageSlug;
    } else {
      return null;
    }
  }

  return {
    localityId,
    pageSlug,
    listingSlug,
    intent,
    categoryId,
  };
}

function buildListingSlug(name, syntheticId) {
  return `${slugifyForUrl(name)}-${syntheticId}`;
}

function getListingNamesForRoute(context, localityId, categoryId) {
  const fromLocality = categoryId ? context.topListingsByLocalityCategory.get(`${localityId}::${categoryId}`) : null;
  if (Array.isArray(fromLocality) && fromLocality.length > 0) return fromLocality;
  if (categoryId && context.defaultListingNamesByCategory.has(categoryId)) {
    return context.defaultListingNamesByCategory.get(categoryId);
  }
  return [
    'Verified Local Business',
    'Top Rated Service Provider',
    'Trusted Neighborhood Merchant',
  ];
}

async function getIndexTemplate() {
  if (cachedIndexTemplate) return cachedIndexTemplate;
  try {
    cachedIndexTemplate = await fs.readFile(path.join(distPath, 'index.html'), 'utf8');
  } catch {
    cachedIndexTemplate = null;
  }
  return cachedIndexTemplate;
}

function buildSeoRouteModel(origin, route, context) {
  const localityMeta = context.localityMetaById.get(route.localityId);
  if (!localityMeta) return null;

  const localityPath = buildLocalityPath(route.localityId);
  const canonicalPath = buildSeoPath(context, route.localityId, route.categoryId, route.intent?.q || null);
  const listingSuffix = route.listingSlug ? `/${route.listingSlug}` : '';
  const canonicalUrl = `${origin}${canonicalPath}${listingSuffix}`;
  const categoryLabel = route.categoryId ? (context.categoryLabelById.get(route.categoryId) || humanizeSlug(route.categoryId)) : null;
  const listingLabel = route.listingSlug ? humanizeSlug(route.listingSlug.replace(/-\w+$/, '')) : null;
  const routeHeading = route.intent?.q || categoryLabel || `${localityMeta.name} Businesses`;
  const pageTitle = listingLabel
    ? `${listingLabel} in ${localityMeta.name} | ${SEO_SITE_NAME}`
    : route.categoryId
    ? `${routeHeading} in ${localityMeta.name} | ${SEO_SITE_NAME}`
    : `${localityMeta.name} Local Business Directory | ${SEO_SITE_NAME}`;
  const pageDescription = listingLabel
    ? `View address, phone, ratings, hours, and service details for ${listingLabel} in ${localityMeta.name}, ${localityMeta.city}.`
    : route.categoryId
    ? `Browse verified ${routeHeading.toLowerCase()} in ${localityMeta.name}, ${localityMeta.city}. Compare address, phone, ratings, hours, and trusted local providers.`
    : `Discover verified local businesses in ${localityMeta.name}, ${localityMeta.city}. Compare salons, restaurants, clinics, home services, and shops nearby.`;
  const metaKeywords = [
    `${localityMeta.name} businesses`,
    `${localityMeta.name} local directory`,
    categoryLabel ? `${categoryLabel} in ${localityMeta.name}` : '',
    `${localityMeta.city} local business directory`,
    'verified local businesses',
    SEO_SITE_NAME,
  ].filter(Boolean).join(', ');
  const socialImageUrl = buildSeoImageUrl(
    origin,
    pageTitle,
    route.categoryId ? `${localityMeta.name} • ${routeHeading}` : `${localityMeta.intro} • ${SEO_SITE_PROMISE}`
  );

  const fallbackCategoryId = route.categoryId || context.config.routeIntents[0]?.categoryId || 'all';
  const listingNames = getListingNamesForRoute(context, route.localityId, fallbackCategoryId);
  const listingLinks = listingNames.map((name, index) => ({
    name,
    href: `${buildSeoPath(context, route.localityId, fallbackCategoryId, route.intent?.q || null)}/${buildListingSlug(name, `${route.localityId}-${index + 1}`)}`,
  }));

  const internalLinks = context.config.routeIntents.map((intent) => ({
    label: `${intent.q} in ${localityMeta.name}`,
    href: buildSeoPath(context, route.localityId, intent.categoryId, intent.q),
  }));

  return {
    localityPath,
    canonicalUrl,
    pageTitle,
    pageDescription,
    metaKeywords,
    socialImageUrl,
    heading: routeHeading,
    localityMeta,
    categoryLabel,
    route,
    listingLinks,
    internalLinks,
  };
}

function renderSeoBodyHtml(model) {
  const listingLabel = model.route.listingSlug ? humanizeSlug(model.route.listingSlug.replace(/-\w+$/, '')) : null;
  const heading = model.route.categoryId
    ? `${model.heading} in ${model.localityMeta.name}`
    : `${model.localityMeta.name} Businesses`;
  const finalHeading = listingLabel || heading;
  const subheading = model.route.categoryId
    ? `Serving ${model.localityMeta.name} (${model.localityMeta.pincodes.join(', ')}) in ${model.localityMeta.city}`
    : model.localityMeta.intro;

  const listingItems = model.listingLinks
    .map((item) => `<li><a href="${htmlEscape(item.href)}">${htmlEscape(item.name)}</a></li>`)
    .join('');
  const internalItems = model.internalLinks
    .map((item) => `<li><a href="${htmlEscape(item.href)}">${htmlEscape(item.label)}</a></li>`)
    .join('');

  return [
    '<main id="seo-server-content" style="max-width:1024px;margin:0 auto;padding:28px 16px 16px 16px;font-family:Inter,Arial,sans-serif;color:#0f172a;">',
    `<p style="font-size:12px;color:#475569;margin:0 0 8px 0;">Local directory node: ${htmlEscape(model.localityMeta.subdomain)}</p>`,
    `<h1 style="font-size:32px;line-height:1.2;margin:0 0 12px 0;">${htmlEscape(finalHeading)}</h1>`,
    `<p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 20px 0;">${htmlEscape(subheading)}</p>`,
    '<section>',
    '<h2 style="font-size:22px;line-height:1.3;margin:0 0 10px 0;">Top Verified Listings</h2>',
    '<ul style="margin:0 0 22px 18px;line-height:1.8;color:#1e293b;">',
    listingItems,
    '</ul>',
    '</section>',
    '<section>',
    '<h2 style="font-size:20px;line-height:1.3;margin:0 0 10px 0;">Explore More Services</h2>',
    '<ul style="margin:0 0 22px 18px;line-height:1.8;color:#1e293b;">',
    internalItems,
    '</ul>',
    '</section>',
    `<p style="font-size:13px;color:#475569;line-height:1.7;margin:0;">This page is mapped for ${htmlEscape(model.localityMeta.name)} locality and includes businesses discovered across mapped pincodes (${htmlEscape(model.localityMeta.pincodes.join(', '))}).</p>`,
    '</main>',
  ].join('');
}

function renderSeoJsonLd(origin, model) {
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
    { '@type': 'ListItem', position: 2, name: model.localityMeta.name, item: `${origin}${model.localityPath}` },
  ];
  if (model.route.categoryId) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: model.heading,
      item: model.canonicalUrl,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: model.pageTitle,
        description: model.pageDescription,
        url: model.canonicalUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
      {
        '@type': 'ItemList',
        name: `Top listings in ${model.localityMeta.name}`,
        itemListElement: model.listingLinks.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: `${origin}${item.href}`,
        })),
      },
    ],
  };
}

function applySeoHeadTags(html, model, jsonLd) {
  let updatedHtml = html;
  const escapedTitle = htmlEscape(model.pageTitle);
  updatedHtml = updatedHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`);
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']description["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']keywords["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']robots["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+property=["']og:type["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+property=["']og:title["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+property=["']og:description["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+property=["']og:url["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+property=["']og:site_name["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+property=["']og:image["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:card["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:title["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:description["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:image["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:image:alt["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<script[^>]*id=["']server-seo-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/ig, '');

  const escapedDescription = htmlEscape(model.pageDescription);
  const escapedCanonical = htmlEscape(model.canonicalUrl);
  const escapedKeywords = htmlEscape(model.metaKeywords);
  const escapedSocialImage = htmlEscape(model.socialImageUrl);
  const seoHeadTags = [
    `<meta name="description" content="${escapedDescription}">`,
    `<meta name="keywords" content="${escapedKeywords}">`,
    `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SEO_SITE_NAME}">`,
    `<meta property="og:title" content="${escapedTitle}">`,
    `<meta property="og:description" content="${escapedDescription}">`,
    `<meta property="og:url" content="${escapedCanonical}">`,
    `<meta property="og:image" content="${escapedSocialImage}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapedTitle}">`,
    `<meta name="twitter:description" content="${escapedDescription}">`,
    `<meta name="twitter:image" content="${escapedSocialImage}">`,
    `<meta name="twitter:image:alt" content="${escapedTitle}">`,
    `<link rel="canonical" href="${escapedCanonical}">`,
    `<script type="application/ld+json" id="server-seo-jsonld">${JSON.stringify(jsonLd)}</script>`,
  ].join('');

  updatedHtml = updatedHtml.replace('</head>', `${seoHeadTags}</head>`);
  return updatedHtml;
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  const [header, body, sig] = token.split('.');
  if (!header || !body || !sig) return null;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `${salt}:${Buffer.from(key).toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, keyHex] = String(stored).split(':');
  if (!salt || !keyHex) return false;
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return crypto.timingSafeEqual(Buffer.from(keyHex, 'hex'), Buffer.from(key));
}

function normalizeRoleForType(userType) {
  if (userType === 'platform_admin') return 'admin';
  if (userType === 'developer') return 'developer';
  if (userType === 'seller') return 'seller';
  if (userType === 'buyer') return 'buyer';
  return 'resource';
}

function normalizePhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

function normalizeRequestIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor || '');
  const rawIp = forwarded.split(',')[0].trim() || req.socket?.remoteAddress || req.ip || 'unknown';
  return String(rawIp).replace(/^::ffff:/, '');
}

function normalizeDeviceId(value) {
  const cleaned = String(value || '').trim();
  return cleaned.slice(0, 128);
}

function prunePublicWriteThrottleBuckets(now = Date.now()) {
  for (const [key, bucket] of publicWriteThrottleBuckets.entries()) {
    if (!bucket || now - bucket.windowStartedAt > bucket.windowMs * 2) {
      publicWriteThrottleBuckets.delete(key);
    }
  }
}

function enforcePublicWriteThrottle(req, res, {
  bucket,
  limit = PUBLIC_WRITE_THROTTLE_LIMIT,
  windowMs = PUBLIC_WRITE_THROTTLE_WINDOW_MS,
  keySuffix = '',
} = {}) {
  if (!enforceTrustedWriteOrigin(req, res)) {
    return false;
  }
  const now = Date.now();
  prunePublicWriteThrottleBuckets(now);
  const ipAddress = normalizeRequestIp(req);
  const throttleKey = [
    bucket || req.path || 'public-write',
    ipAddress || 'unknown',
    String(keySuffix || '').slice(0, 160),
  ].join('|');

  const existingBucket = publicWriteThrottleBuckets.get(throttleKey);
  if (!existingBucket || now - existingBucket.windowStartedAt >= windowMs) {
    publicWriteThrottleBuckets.set(throttleKey, {
      count: 1,
      windowStartedAt: now,
      windowMs,
    });
    return true;
  }

  if (existingBucket.count >= limit) {
    const retryAfterMs = Math.max(0, windowMs - (now - existingBucket.windowStartedAt));
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil(retryAfterMs / 1000))));
    res.status(429).json({
      ok: false,
      error: 'Too many requests. Please try again shortly.',
      retryAfterMs,
    });
    return false;
  }

  existingBucket.count += 1;
  existingBucket.windowMs = windowMs;
  publicWriteThrottleBuckets.set(throttleKey, existingBucket);
  return true;
}

function normalizeAuditText(value, maxLength = 512) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isLikelyAutomatedAgent(userAgent) {
  return /(bot|crawler|spider|zap|headless|lighthouse|playwright|puppeteer|phantom|selenium|python-requests|axios|node-fetch|curl)/i.test(
    String(userAgent || ''),
  );
}

function pruneAuditThrottleCaches(now = Date.now()) {
  for (const [key, bucket] of auditEventThrottleBuckets.entries()) {
    if (!bucket || now - bucket.windowStartedAt > AUDIT_EVENT_WINDOW_MS * 2) {
      auditEventThrottleBuckets.delete(key);
    }
  }
  for (const [key, lastSeenAt] of auditEventRecentWrites.entries()) {
    if (now - lastSeenAt > AUDIT_EVENT_BOT_DEDUPE_MS * 2) {
      auditEventRecentWrites.delete(key);
    }
  }
}

function evaluateAuditEventThrottle({ ipAddress, userAgent, actionType, description, details, userName, isAuthenticated }) {
  const now = Date.now();
  pruneAuditThrottleCaches(now);

  const automated = isLikelyAutomatedAgent(userAgent);
  const dedupeWindowMs = automated ? AUDIT_EVENT_BOT_DEDUPE_MS : AUDIT_EVENT_DEDUPE_MS;
  const fingerprint = [
    ipAddress || 'unknown',
    actionType || 'unknown',
    normalizeAuditText(description, 160),
    normalizeAuditText(details, 240),
    normalizeAuditText(userName, 80) || 'anonymous',
  ].join('|');

  const lastSeenAt = auditEventRecentWrites.get(fingerprint) || 0;
  if (now - lastSeenAt < dedupeWindowMs) {
    return {
      accept: false,
      status: 'deduped',
      automated,
      retryAfterMs: Math.max(0, dedupeWindowMs - (now - lastSeenAt)),
    };
  }
  auditEventRecentWrites.set(fingerprint, now);

  const bucketKey = `${ipAddress || 'unknown'}|${automated ? 'bot' : 'human'}|${isAuthenticated ? 'auth' : 'anon'}|${actionType || 'unknown'}`;
  const allowedPerWindow = automated
    ? AUDIT_EVENT_BOT_MAX_PER_WINDOW
    : isAuthenticated
      ? AUDIT_EVENT_AUTH_MAX_PER_WINDOW
      : AUDIT_EVENT_MAX_PER_WINDOW;

  const existingBucket = auditEventThrottleBuckets.get(bucketKey);
  if (!existingBucket || now - existingBucket.windowStartedAt >= AUDIT_EVENT_WINDOW_MS) {
    auditEventThrottleBuckets.set(bucketKey, { windowStartedAt: now, count: 1 });
    return { accept: true, automated, status: 'accepted' };
  }

  if (existingBucket.count >= allowedPerWindow) {
    return {
      accept: false,
      status: 'throttled',
      automated,
      retryAfterMs: Math.max(0, AUDIT_EVENT_WINDOW_MS - (now - existingBucket.windowStartedAt)),
    };
  }

  existingBucket.count += 1;
  auditEventThrottleBuckets.set(bucketKey, existingBucket);
  return { accept: true, automated, status: 'accepted' };
}

function getDayWindowIso(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function buildAuthUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    role: user.role,
    status: user.status,
    sellerBusinessId: user.sellerBusinessId || undefined,
  };
}

function buildOtpChallengeToken({ challengeId, userId, userType, mobile, purpose, context = {} }) {
  const exp = Math.floor(Date.now() / 1000) + 10 * 60;
  return signToken({
    sub: userId,
    challengeId,
    userType,
    mobile,
    purpose,
    otpChallenge: true,
    ...context,
    exp,
  });
}

function verifyOtpChallengeToken(token, expectedPurpose) {
  const payload = verifyToken(token);
  if (!payload || !payload.otpChallenge) return null;
  if (expectedPurpose && payload.purpose !== expectedPurpose) return null;
  if (!payload.mobile || !payload.sub || !payload.challengeId) return null;
  return payload;
}

function buildContactUnlockGrantToken({ challengeId, mobile }) {
  const exp = Math.floor(Date.now() / 1000) + 30 * 60;
  return signToken({
    sub: `contact:${mobile}`,
    challengeId,
    mobile,
    purpose: 'contact-unlock-grant',
    contactUnlockGrant: true,
    exp,
  });
}

function verifyContactUnlockGrantToken(token) {
  const payload = verifyToken(token);
  if (!payload || !payload.contactUnlockGrant) return null;
  if (payload.purpose !== 'contact-unlock-grant') return null;
  if (!payload.mobile || !payload.challengeId) return null;
  return payload;
}

async function createOtpChallenge({ userId, userType, mobile, purpose }) {
  const challengeId = randomId('otp');
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const challenge = {
    id: challengeId,
    userId,
    userType,
    mobile,
    purpose,
    createdAt,
    expiresAt,
    usedAt: null,
  };

  const client = await getPgClient();
  if (client) {
    await client.query(
      `INSERT INTO auth_otp_challenges (id, user_id, user_type, mobile, purpose, created_at, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [challenge.id, challenge.userId, challenge.userType, challenge.mobile, challenge.purpose, challenge.createdAt, challenge.expiresAt],
    );
  } else {
    if (!Array.isArray(memoryOtpChallenges)) memoryOtpChallenges = [];
    memoryOtpChallenges = memoryOtpChallenges.filter((entry) => entry.expiresAt > createdAt && !entry.usedAt);
    memoryOtpChallenges.push(challenge);
  }

  return challenge;
}

async function readOtpChallenge(challengeId) {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT id, user_id, user_type, mobile, purpose, created_at, expires_at, used_at
       FROM auth_otp_challenges
      WHERE id = $1
      LIMIT 1`,
      [challengeId],
    );
    const row = result.rows[0];
    if (!row) return null;
    if (row.used_at) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    return {
      id: row.id,
      userId: row.user_id,
      userType: row.user_type,
      mobile: row.mobile,
      purpose: row.purpose,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at),
      usedAt: row.used_at,
    };
  }

  if (!Array.isArray(memoryOtpChallenges)) return null;
  const index = memoryOtpChallenges.findIndex((entry) => entry.id === challengeId);
  if (index === -1) return null;
  const entry = memoryOtpChallenges[index];
  if (entry.usedAt || new Date(entry.expiresAt).getTime() < Date.now()) return null;
  return entry;
}

async function markOtpChallengeUsed(challengeId) {
  const client = await getPgClient();
  if (client) {
    await client.query(`UPDATE auth_otp_challenges SET used_at = NOW() WHERE id = $1`, [challengeId]);
    return;
  }
  if (!Array.isArray(memoryOtpChallenges)) return;
  const index = memoryOtpChallenges.findIndex((entry) => entry.id === challengeId);
  if (index === -1) return;
  memoryOtpChallenges[index] = { ...memoryOtpChallenges[index], usedAt: nowIso() };
}

async function getContactViewCountsToday({ loginKey, ipAddress, deviceId }) {
  const { startIso, endIso } = getDayWindowIso();
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT
         COUNT(*) FILTER (WHERE login_key = $2) AS login_count,
         COUNT(*) FILTER (WHERE ip_address = $3) AS ip_count,
         COUNT(*) FILTER (WHERE device_id = $4) AS device_count
       FROM contact_view_events
      WHERE created_at >= $1 AND created_at < $5`,
      [startIso, loginKey, ipAddress, deviceId, endIso],
    );
    const row = result.rows[0] || {};
    return {
      loginCount: Number(row.login_count || 0),
      ipCount: Number(row.ip_count || 0),
      deviceCount: Number(row.device_count || 0),
    };
  }

  if (!Array.isArray(memoryContactViewEvents)) {
    return { loginCount: 0, ipCount: 0, deviceCount: 0 };
  }

  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  const todaysEvents = memoryContactViewEvents.filter((event) => {
    const createdMs = new Date(event.createdAt).getTime();
    return createdMs >= startMs && createdMs < endMs;
  });
  return {
    loginCount: todaysEvents.filter((event) => event.loginKey === loginKey).length,
    ipCount: todaysEvents.filter((event) => event.ipAddress === ipAddress).length,
    deviceCount: todaysEvents.filter((event) => event.deviceId === deviceId).length,
  };
}

async function recordContactViewEvent({ businessId, loginKey, viewerName, viewerPhone, ipAddress, deviceId }) {
  const client = await getPgClient();
  const event = {
    id: randomId('cview'),
    businessId,
    loginKey,
    viewerName: viewerName || '',
    viewerPhone: viewerPhone || '',
    ipAddress,
    deviceId,
    createdAt: nowIso(),
  };

  if (client) {
    await client.query(
      `INSERT INTO contact_view_events (id, business_id, login_key, viewer_name, viewer_phone, ip_address, device_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        event.id,
        event.businessId,
        event.loginKey,
        event.viewerName,
        event.viewerPhone,
        event.ipAddress,
        event.deviceId,
        event.createdAt,
      ],
    );
  } else {
    if (!Array.isArray(memoryContactViewEvents)) memoryContactViewEvents = [];
    memoryContactViewEvents = memoryContactViewEvents.filter((entry) => {
      const createdMs = new Date(entry.createdAt).getTime();
      const { startIso, endIso } = getDayWindowIso();
      return createdMs >= new Date(startIso).getTime() && createdMs < new Date(endIso).getTime();
    });
    memoryContactViewEvents.push(event);
  }

  return event;
}

async function sendMsg91Otp(mobile) {
  if (!MSG91_AUTHKEY || !MSG91_OTP_TEMPLATE_ID) {
    throw new Error('MSG91 OTP is not configured');
  }
  const url = new URL('/api/v5/otp', MSG91_OTP_BASE_URL);
  url.searchParams.set('template_id', MSG91_OTP_TEMPLATE_ID);
  url.searchParams.set('mobile', mobile);
  url.searchParams.set('authkey', MSG91_AUTHKEY);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`MSG91 OTP send failed (${response.status}): ${text || response.statusText}`);
  }
  return text;
}

async function verifyMsg91Otp(mobile, otp) {
  if (!MSG91_AUTHKEY) {
    throw new Error('MSG91 OTP is not configured');
  }
  const url = new URL('/api/v5/otp/verify', MSG91_OTP_BASE_URL);
  url.searchParams.set('otp', otp);
  url.searchParams.set('mobile', mobile);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authkey: MSG91_AUTHKEY,
    },
  });
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`MSG91 OTP verify failed (${response.status}): ${text || response.statusText}`);
  }
  const normalized = text.trim().toLowerCase();
  if (normalized.includes('invalid otp') || normalized.includes('otp expired')) {
    throw new Error('Invalid or expired OTP');
  }
  return text;
}

function findUserByLoginIdentifier(users, identifier) {
  const normalized = String(identifier || '').toLowerCase().trim();
  if (!normalized) return null;
  return users.find((user) => user.email === normalized);
}

function findUserByMobile(users, mobile) {
  const target = normalizePhoneDigits(mobile);
  if (!target) return null;
  return users.find((user) => normalizePhoneDigits(user.phone) === target);
}

async function readUsers() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT id, name, email, phone, user_type, role, password_hash, created_at, status
       FROM app_users
       ORDER BY created_at ASC`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      userType: row.user_type,
      role: row.role,
      passwordHash: row.password_hash,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      status: row.status,
    }));
  }

  if (Array.isArray(memoryUsers)) return memoryUsers;
  try {
    const raw = await fs.readFile(usersPath, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  const client = await getPgClient();
  if (client) {
    await runInPgTransaction(async (tx) => {
      await tx.query('DELETE FROM app_users');
      for (const user of users) {
        await tx.query(
          `INSERT INTO app_users (id, name, email, phone, user_type, role, password_hash, created_at, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            user.id,
            user.name,
            user.email,
            user.phone || '',
            user.userType,
            user.role,
            user.passwordHash,
            user.createdAt,
            user.status || 'active',
          ],
        );
      }
    }, 'writeUsers');
    return;
  }

  try {
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8');
    memoryUsers = users;
  } catch (err) {
    // In some container runtimes the app dir can be read-only. Keep app available.
    console.warn('users.json write failed, using in-memory user store:', err?.message || err);
    memoryUsers = users;
  }
}

function sanitizeBusinessListings(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((business) => business && business.id && business.name)
    .map((business) => ({
      ...business,
      id: String(business.id),
      name: String(business.name),
      status: ['approved', 'pending', 'rejected'].includes(business.status)
        ? business.status
        : 'pending',
    }));
}

function mergeBusinessListings(existing, incoming) {
  const merged = new Map();
  for (const business of existing) merged.set(business.id, business);
  for (const business of incoming) merged.set(business.id, business);
  return Array.from(merged.values());
}

async function readBusinessListings() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['businesses'],
    );
    const data = result.rows[0]?.value;
    const listings = sanitizeBusinessListings(data);
    if (listings) return listings;
    try {
      const raw = await fs.readFile(businessesPath, 'utf8');
      const fileData = JSON.parse(raw);
      const seededListings = sanitizeBusinessListings(fileData) || [];
      await client.query(
        `INSERT INTO app_state (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        ['businesses', JSON.stringify(seededListings)],
      );
      return seededListings;
    } catch {
      return [];
    }
  }

  if (Array.isArray(memoryBusinesses)) return memoryBusinesses;
  try {
    const raw = await fs.readFile(businessesPath, 'utf8');
    const data = JSON.parse(raw);
    const listings = sanitizeBusinessListings(data) || [];
    memoryBusinesses = listings;
    return listings;
  } catch {
    return [];
  }
}

async function writeBusinessListings(businesses) {
  const listings = sanitizeBusinessListings(businesses) || [];
  const client = await getPgClient();
  if (client) {
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['businesses', JSON.stringify(listings)],
    );
    return;
  }

  try {
    await fs.writeFile(businessesPath, JSON.stringify(listings, null, 2), 'utf8');
    memoryBusinesses = listings;
  } catch (err) {
    console.warn('businesses.json write failed, using in-memory listing store:', err?.message || err);
    memoryBusinesses = listings;
  }
}

function sanitizeAdLead(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const lead = value;
  const adId = String(lead.adId || '').trim();
  const localityId = String(lead.localityId || '').trim();
  const mobile = String(lead.mobile || '').trim();
  const name = String(lead.name || '').trim();
  if (!adId || !localityId || !mobile || !name) {
    return null;
  }
  return {
    id: String(lead.id || `lead_${Date.now()}_${index + 1}`),
    adId,
    sellerBusinessId: lead.sellerBusinessId ? String(lead.sellerBusinessId).trim() : undefined,
    localityId,
    name,
    mobile,
    pincode: String(lead.pincode || '').trim(),
    createdAt: lead.createdAt || new Date().toISOString(),
  };
}

function sanitizeAdLeads(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((lead, index) => sanitizeAdLead(lead, index))
    .filter(Boolean);
}

async function readAdLeads() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['ad_leads'],
    );
    const data = result.rows[0]?.value;
    const leads = sanitizeAdLeads(data);
    if (Array.isArray(leads) && leads.length > 0) return leads;
    if (Array.isArray(data) && data.length === 0) return [];
    try {
      const raw = await fs.readFile(adLeadsPath, 'utf8');
      const fileData = JSON.parse(raw);
      const seededLeads = sanitizeAdLeads(fileData);
      await client.query(
        `INSERT INTO app_state (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        ['ad_leads', JSON.stringify(seededLeads)],
      );
      return seededLeads;
    } catch {
      return [];
    }
  }

  if (Array.isArray(memoryAdLeads)) return memoryAdLeads;
  try {
    const raw = await fs.readFile(adLeadsPath, 'utf8');
    const data = JSON.parse(raw);
    const leads = sanitizeAdLeads(data);
    memoryAdLeads = leads;
    return leads;
  } catch {
    return [];
  }
}

async function writeAdLeads(adLeads) {
  const leads = sanitizeAdLeads(adLeads);
  const client = await getPgClient();
  if (client) {
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['ad_leads', JSON.stringify(leads)],
    );
    return leads;
  }

  try {
    await fs.writeFile(adLeadsPath, JSON.stringify(leads, null, 2), 'utf8');
    memoryAdLeads = leads;
    return leads;
  } catch (err) {
    console.warn('ad-leads.json write failed, using in-memory ad lead store:', err?.message || err);
    memoryAdLeads = leads;
    return leads;
  }
}

function sanitizeHomepageConfig(value) {
  if (!value || typeof value !== 'object') return null;
  const config = value;
  return {
    heroBanners: Array.isArray(config.heroBanners) ? config.heroBanners : [],
    listingAds: Array.isArray(config.listingAds) ? config.listingAds : [],
    coupons: Array.isArray(config.coupons) ? config.coupons : [],
    homepageLayouts: Array.isArray(config.homepageLayouts) ? config.homepageLayouts : [],
    localityCategoryLinks: Array.isArray(config.localityCategoryLinks) ? config.localityCategoryLinks : [],
    communityItems: Array.isArray(config.communityItems) ? config.communityItems : [],
    apiConfiguration: config.apiConfiguration && typeof config.apiConfiguration === 'object'
      ? config.apiConfiguration
      : {
          syncMode: 'api',
          homepageConfigEndpoint: '/api/homepage-config',
          homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
          localityRoutingConfigEndpoint: '/api/locality-routing-config',
          geographyConfigEndpoint: '/api/geography-config',
          taxonomyConfigEndpoint: '/api/business-taxonomy',
          seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
          scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
          resolvedHomepageEndpoint: '/api/resolved-homepage',
          publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
          businessesEndpoint: '/api/businesses',
          auditEventsEndpoint: '/api/audit-events',
          autoSyncHomepage: true,
          autoSyncBusinesses: true,
        },
  };
}

function sanitizeLegacyHomepageSection(value, index = 0, localityId = '') {
  const payload = value && typeof value === 'object' ? cloneJson(value, {}) || {} : {};
  return {
    ...payload,
    id: String(payload.id || `home_section_${localityId || 'layout'}_${index + 1}`),
    title: String(payload.title || payload.sectionType || `Section ${index + 1}`),
    visible: payload.visible !== false,
    sortOrder: Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : (index + 1) * 10,
  };
}

function reindexLegacyHomepageSections(sections, localityId = '') {
  return sanitizeTemplateSections(sections)
    .map((section, index) => sanitizeLegacyHomepageSection(section, index, localityId))
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .map((section, index) => ({
      ...section,
      sortOrder: (index + 1) * 10,
    }));
}

function sanitizeLegacyHomepageLayout(value, index = 0) {
  const layout = value && typeof value === 'object' ? cloneJson(value, {}) || {} : {};
  const localityId = String(layout.localityId || '').trim();
  return {
    ...layout,
    id: String(layout.id || `homepage_${localityId || index + 1}`),
    localityId,
    name: String(layout.name || `${localityId || 'default'} Homepage`),
    status: String(layout.status || 'active') === 'inactive' ? 'inactive' : 'active',
    visible: layout.visible !== false,
    sections: reindexLegacyHomepageSections(layout.sections || [], localityId),
    updatedAt: String(layout.updatedAt || new Date().toISOString()),
  };
}

function buildDefaultLegacyHomepageLayout(localityId, fallbackLayout) {
  const normalizedLocalityId = String(localityId || '').trim();
  if (fallbackLayout && typeof fallbackLayout === 'object') {
    return sanitizeLegacyHomepageLayout({
      ...fallbackLayout,
      localityId: normalizedLocalityId,
    });
  }
  return sanitizeLegacyHomepageLayout({
    id: `homepage_${normalizedLocalityId || crypto.randomUUID()}`,
    localityId: normalizedLocalityId,
    name: `${normalizedLocalityId || 'default'} Homepage`,
    status: 'active',
    visible: true,
    sections: [],
  });
}

function normalizeStringList(value) {
  return Array.isArray(value)
    ? value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
    : [];
}

function cloneJson(value, fallback = null) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

async function readHomepageConfigFromTables(client) {
  const [layoutsResult, heroBannersResult, listingAdsResult, couponsResult, communityItemsResult, localityCategoryLinksResult, appStateResult] = await Promise.all([
    client.query(`
      SELECT id, locality_id, name, status, visible, sections, updated_at
      FROM homepage_layouts
      ORDER BY locality_id ASC
    `),
    client.query(`
      SELECT payload
      FROM homepage_hero_banners
      ORDER BY updated_at DESC
    `),
    client.query(`
      SELECT payload
      FROM homepage_listing_ads
      ORDER BY updated_at DESC
    `),
    client.query(`
      SELECT payload
      FROM homepage_coupons
      ORDER BY updated_at DESC
    `),
    client.query(`
      SELECT payload
      FROM homepage_community_items
      ORDER BY updated_at DESC
    `),
    client.query(`
      SELECT payload
      FROM homepage_locality_category_links
      ORDER BY updated_at DESC
    `),
    client.query(`
      SELECT value
      FROM app_state
      WHERE key = $1
      LIMIT 1
    `, ['homepage_config']),
  ]);

  const mirroredConfig = sanitizeHomepageConfig(appStateResult.rows[0]?.value);
  const rowCount = [
    layoutsResult.rowCount,
    heroBannersResult.rowCount,
    listingAdsResult.rowCount,
    couponsResult.rowCount,
    communityItemsResult.rowCount,
    localityCategoryLinksResult.rowCount,
  ].reduce((sum, count) => sum + Number(count || 0), 0);
  if (rowCount === 0) {
    return null;
  }

  return sanitizeHomepageConfig({
    heroBanners: heroBannersResult.rows.map((row) => cloneJson(row.payload, {})).filter(Boolean),
    listingAds: listingAdsResult.rows.map((row) => cloneJson(row.payload, {})).filter(Boolean),
    coupons: couponsResult.rows.map((row) => cloneJson(row.payload, {})).filter(Boolean),
    homepageLayouts: layoutsResult.rows.map((row, index) => sanitizeLegacyHomepageLayout({
      id: row.id,
      localityId: row.locality_id,
      name: row.name,
      status: row.status,
      visible: row.visible,
      sections: row.sections,
      updatedAt: row.updated_at,
    }, index)),
    localityCategoryLinks: localityCategoryLinksResult.rows.map((row) => cloneJson(row.payload, {})).filter(Boolean),
    communityItems: communityItemsResult.rows.map((row) => cloneJson(row.payload, {})).filter(Boolean),
    apiConfiguration: mirroredConfig?.apiConfiguration,
  });
}

async function syncHomepageConfigToTables(_client, state) {
  await runInPgTransaction(async (client) => {
    for (const layout of state.homepageLayouts || []) {
      const sanitizedLayout = sanitizeLegacyHomepageLayout(layout);
      await client.query(
        `INSERT INTO homepage_layouts (id, locality_id, name, status, visible, sections, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)
         ON CONFLICT (id)
         DO UPDATE SET
           locality_id = EXCLUDED.locality_id,
           name = EXCLUDED.name,
           status = EXCLUDED.status,
           visible = EXCLUDED.visible,
           sections = EXCLUDED.sections,
           updated_at = EXCLUDED.updated_at`,
        [
          sanitizedLayout.id,
          sanitizedLayout.localityId,
          sanitizedLayout.name,
          sanitizedLayout.status,
          sanitizedLayout.visible,
          JSON.stringify(sanitizedLayout.sections || []),
          sanitizedLayout.updatedAt || new Date().toISOString(),
        ],
      );
    }

    for (const banner of state.heroBanners || []) {
      await client.query(
        `INSERT INTO homepage_hero_banners (id, locality_id, start_date, end_date, is_active, payload, updated_at)
         VALUES ($1, $2, NULLIF($3, '')::date, NULLIF($4, '')::date, $5, $6::jsonb, $7::timestamptz)
         ON CONFLICT (id)
         DO UPDATE SET
           locality_id = EXCLUDED.locality_id,
           start_date = EXCLUDED.start_date,
           end_date = EXCLUDED.end_date,
           is_active = EXCLUDED.is_active,
           payload = EXCLUDED.payload,
           updated_at = EXCLUDED.updated_at`,
        [
          String(banner?.id || ''),
          String(banner?.localityId || ''),
          String(banner?.startDate || ''),
          String(banner?.endDate || ''),
          banner?.isActive !== false,
          JSON.stringify(cloneJson(banner, {}) || {}),
          String(banner?.updatedAt || banner?.startDate || new Date().toISOString()),
        ],
      );
    }

    for (const listingAd of state.listingAds || []) {
      await client.query(
        `INSERT INTO homepage_listing_ads (id, placement_key, device_target, is_active, locality_ids, category_ids, payload, updated_at)
         VALUES ($1, NULLIF($2, ''), $3, $4, $5, $6, $7::jsonb, $8::timestamptz)
         ON CONFLICT (id)
         DO UPDATE SET
           placement_key = EXCLUDED.placement_key,
           device_target = EXCLUDED.device_target,
           is_active = EXCLUDED.is_active,
           locality_ids = EXCLUDED.locality_ids,
           category_ids = EXCLUDED.category_ids,
           payload = EXCLUDED.payload,
           updated_at = EXCLUDED.updated_at`,
        [
          String(listingAd?.id || ''),
          String(listingAd?.placementKey || ''),
          String(listingAd?.deviceTarget || 'all'),
          listingAd?.isActive !== false,
          Array.isArray(listingAd?.localityIds) ? listingAd.localityIds.map((value) => String(value || '').trim()).filter(Boolean) : [],
          Array.isArray(listingAd?.categoryIds) ? listingAd.categoryIds.map((value) => String(value || '').trim()).filter(Boolean) : [],
          JSON.stringify(cloneJson(listingAd, {}) || {}),
          String(listingAd?.updatedAt || new Date().toISOString()),
        ],
      );
    }

    for (const coupon of state.coupons || []) {
      await client.query(
        `INSERT INTO homepage_coupons (id, business_id, target_business_id, is_active, locality_ids, category_ids, end_date, payload, updated_at)
         VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, $6, NULLIF($7, '')::date, $8::jsonb, $9::timestamptz)
         ON CONFLICT (id)
         DO UPDATE SET
           business_id = EXCLUDED.business_id,
           target_business_id = EXCLUDED.target_business_id,
           is_active = EXCLUDED.is_active,
           locality_ids = EXCLUDED.locality_ids,
           category_ids = EXCLUDED.category_ids,
           end_date = EXCLUDED.end_date,
           payload = EXCLUDED.payload,
           updated_at = EXCLUDED.updated_at`,
        [
          String(coupon?.id || ''),
          String(coupon?.businessId || ''),
          String(coupon?.targetBusinessId || ''),
          coupon?.isActive !== false,
          Array.isArray(coupon?.localityIds) ? coupon.localityIds.map((value) => String(value || '').trim()).filter(Boolean) : [],
          Array.isArray(coupon?.categoryIds) ? coupon.categoryIds.map((value) => String(value || '').trim()).filter(Boolean) : [],
          String(coupon?.endDate || coupon?.expiryDate || ''),
          JSON.stringify(cloneJson(coupon, {}) || {}),
          String(coupon?.updatedAt || new Date().toISOString()),
        ],
      );
    }

    for (const communityItem of state.communityItems || []) {
      await client.query(
        `INSERT INTO homepage_community_items (id, locality_id, item_type, status, publish_at, expire_at, payload, updated_at)
         VALUES ($1, $2, NULLIF($3, ''), $4, NULLIF($5, '')::timestamptz, NULLIF($6, '')::timestamptz, $7::jsonb, $8::timestamptz)
         ON CONFLICT (id)
         DO UPDATE SET
           locality_id = EXCLUDED.locality_id,
           item_type = EXCLUDED.item_type,
           status = EXCLUDED.status,
           publish_at = EXCLUDED.publish_at,
           expire_at = EXCLUDED.expire_at,
           payload = EXCLUDED.payload,
           updated_at = EXCLUDED.updated_at`,
        [
          String(communityItem?.id || ''),
          String(communityItem?.localityId || ''),
          String(communityItem?.type || ''),
          String(communityItem?.status || 'published'),
          String(communityItem?.publishAt || communityItem?.createdAt || ''),
          String(communityItem?.expireAt || ''),
          JSON.stringify(cloneJson(communityItem, {}) || {}),
          String(communityItem?.updatedAt || communityItem?.createdAt || new Date().toISOString()),
        ],
      );
    }

    for (const link of state.localityCategoryLinks || []) {
      await client.query(
        `INSERT INTO homepage_locality_category_links (id, locality_id, category_id, subcategory_id, slug, payload, updated_at)
         VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6::jsonb, $7::timestamptz)
         ON CONFLICT (id)
         DO UPDATE SET
           locality_id = EXCLUDED.locality_id,
           category_id = EXCLUDED.category_id,
           subcategory_id = EXCLUDED.subcategory_id,
           slug = EXCLUDED.slug,
           payload = EXCLUDED.payload,
           updated_at = EXCLUDED.updated_at`,
        [
          String(link?.id || ''),
          String(link?.localityId || ''),
          String(link?.categoryId || ''),
          String(link?.subcategoryId || ''),
          String(link?.slug || ''),
          JSON.stringify(cloneJson(link, {}) || {}),
          String(link?.updatedAt || new Date().toISOString()),
        ],
      );
    }

    await deleteRowsMissingFromIdSet(client, 'homepage_locality_category_links', (state.localityCategoryLinks || []).map((entry) => String(entry?.id || '')).filter(Boolean));
    await deleteRowsMissingFromIdSet(client, 'homepage_community_items', (state.communityItems || []).map((entry) => String(entry?.id || '')).filter(Boolean));
    await deleteRowsMissingFromIdSet(client, 'homepage_coupons', (state.coupons || []).map((entry) => String(entry?.id || '')).filter(Boolean));
    await deleteRowsMissingFromIdSet(client, 'homepage_listing_ads', (state.listingAds || []).map((entry) => String(entry?.id || '')).filter(Boolean));
    await deleteRowsMissingFromIdSet(client, 'homepage_hero_banners', (state.heroBanners || []).map((entry) => String(entry?.id || '')).filter(Boolean));
    await deleteRowsMissingFromIdSet(client, 'homepage_layouts', (state.homepageLayouts || []).map((entry) => String(entry?.id || '')).filter(Boolean));

    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['homepage_config', JSON.stringify(state)],
    );

  }, 'syncHomepageConfigToTables');
}

function sanitizeSeoRouteIntent(value, index = 0) {
  const intent = value && typeof value === 'object' ? value : {};
  const slugSource = String(intent.slug || intent.q || intent.id || `seo-intent-${index + 1}`).trim();
  return {
    id: String(intent.id || slugSource || `seo-intent-${index + 1}`).trim(),
    slug: slugifyForUrl(slugSource),
    categoryId: String(intent.categoryId || '').trim(),
    q: String(intent.q || '').trim(),
    labelPrefix: String(intent.labelPrefix || intent.q || '').trim(),
  };
}

function sanitizeSeoLocalityMetadata(value, index = 0) {
  const locality = value && typeof value === 'object' ? value : {};
  return {
    id: String(locality.id || `seo-locality-${index + 1}`).trim(),
    name: String(locality.name || locality.id || '').trim(),
    city: String(locality.city || '').trim(),
    intro: String(locality.intro || '').trim(),
    pincodes: normalizeStringList(locality.pincodes),
    subdomain: String(locality.subdomain || '').trim(),
  };
}

function sanitizeSeoCategoryLabel(value, index = 0) {
  const label = value && typeof value === 'object' ? value : {};
  return {
    categoryId: String(label.categoryId || `category-${index + 1}`).trim(),
    label: String(label.label || label.categoryId || '').trim(),
  };
}

function sanitizeSeoTopListingGroup(value, index = 0) {
  const group = value && typeof value === 'object' ? value : {};
  return {
    localityId: String(group.localityId || `locality-${index + 1}`).trim(),
    categoryId: String(group.categoryId || '').trim(),
    listingNames: normalizeStringList(group.listingNames),
  };
}

function sanitizeSeoDefaultListingGroup(value, index = 0) {
  const group = value && typeof value === 'object' ? value : {};
  return {
    categoryId: String(group.categoryId || `category-${index + 1}`).trim(),
    listingNames: normalizeStringList(group.listingNames),
  };
}

function sanitizeSeoDiscoveryConfigState(value) {
  const source = value && typeof value === 'object' ? value : {};
  const routeIntents = Array.isArray(source.routeIntents)
    ? source.routeIntents.map(sanitizeSeoRouteIntent).filter((intent) => intent.id && intent.slug && intent.categoryId && intent.q)
    : DEFAULT_SEO_ROUTE_INTENTS.map(sanitizeSeoRouteIntent).filter((intent) => intent.id && intent.slug && intent.categoryId && intent.q);
  const localityMetadata = Array.isArray(source.localityMetadata)
    ? source.localityMetadata.map(sanitizeSeoLocalityMetadata).filter((locality) => locality.id && locality.name)
    : DEFAULT_SEO_LOCALITY_METADATA.map(sanitizeSeoLocalityMetadata).filter((locality) => locality.id && locality.name);
  const categoryLabels = Array.isArray(source.categoryLabels)
    ? source.categoryLabels.map(sanitizeSeoCategoryLabel).filter((label) => label.categoryId && label.label)
    : DEFAULT_SEO_CATEGORY_LABELS.map(sanitizeSeoCategoryLabel).filter((label) => label.categoryId && label.label);
  const topListings = Array.isArray(source.topListings)
    ? source.topListings.map(sanitizeSeoTopListingGroup).filter((group) => group.localityId && group.categoryId && group.listingNames.length > 0)
    : DEFAULT_SEO_TOP_LISTINGS.map(sanitizeSeoTopListingGroup).filter((group) => group.localityId && group.categoryId && group.listingNames.length > 0);
  const defaultListingNames = Array.isArray(source.defaultListingNames)
    ? source.defaultListingNames.map(sanitizeSeoDefaultListingGroup).filter((group) => group.categoryId && group.listingNames.length > 0)
    : DEFAULT_SEO_DEFAULT_LISTING_NAMES.map(sanitizeSeoDefaultListingGroup).filter((group) => group.categoryId && group.listingNames.length > 0);
  return {
    routeIntents,
    localityMetadata,
    categoryLabels,
    topListings,
    defaultListingNames,
    metadata: {
      seededFromCode: source.metadata?.seededFromCode ?? true,
      updatedAt: String(source.metadata?.updatedAt || new Date().toISOString()),
    },
  };
}

function buildSeoDiscoveryContext(config) {
  const safeConfig = sanitizeSeoDiscoveryConfigState(config);
  const localityIds = safeConfig.localityMetadata.map((locality) => locality.id);
  const categoryIds = Array.from(new Set([
    ...safeConfig.categoryLabels.map((label) => label.categoryId),
    ...safeConfig.routeIntents.map((intent) => intent.categoryId),
    ...safeConfig.topListings.map((group) => group.categoryId),
    ...safeConfig.defaultListingNames.map((group) => group.categoryId),
  ]));
  const localityMetaById = new Map(safeConfig.localityMetadata.map((locality) => [locality.id, locality]));
  const categoryLabelById = new Map(safeConfig.categoryLabels.map((label) => [label.categoryId, label.label]));
  const intentBySlug = new Map(safeConfig.routeIntents.map((intent) => [intent.slug, intent]));
  const intentByCategoryAndQuery = new Map(
    safeConfig.routeIntents.map((intent) => [`${intent.categoryId}::${intent.q.toLowerCase()}`, intent]),
  );
  const defaultIntentByCategory = new Map();
  for (const intent of safeConfig.routeIntents) {
    if (!defaultIntentByCategory.has(intent.categoryId)) {
      defaultIntentByCategory.set(intent.categoryId, intent);
    }
  }
  const topListingsByLocalityCategory = new Map(
    safeConfig.topListings.map((group) => [`${group.localityId}::${group.categoryId}`, group.listingNames]),
  );
  const defaultListingNamesByCategory = new Map(
    safeConfig.defaultListingNames.map((group) => [group.categoryId, group.listingNames]),
  );

  return {
    config: safeConfig,
    localityIds,
    localityIdSet: new Set(localityIds),
    categoryIds,
    categoryIdSet: new Set(categoryIds),
    localityMetaById,
    categoryLabelById,
    intentBySlug,
    intentByCategoryAndQuery,
    defaultIntentByCategory,
    topListingsByLocalityCategory,
    defaultListingNamesByCategory,
  };
}

function sanitizeBusinessCategory(value, index = 0) {
  const category = value && typeof value === 'object' ? value : {};
  return {
    id: String(category.id || category.slug || `category-${index + 1}`).trim(),
    legacyId: Number.isFinite(Number(category.legacyId)) ? Number(category.legacyId) : index + 1,
    name: String(category.name || category.id || '').trim(),
    slug: String(category.slug || category.id || `category-${index + 1}`).trim(),
    icon: String(category.icon || 'category_icon').trim(),
    status: String(category.status || 'active') === 'inactive' ? 'inactive' : 'active',
    sortOrder: Number.isFinite(Number(category.sortOrder)) ? Number(category.sortOrder) : index + 1,
  };
}

function sanitizeBusinessSubcategory(value, categoryMap, index = 0) {
  const subcategory = value && typeof value === 'object' ? value : {};
  const categoryId = String(subcategory.categoryId || '').trim();
  const parentCategory = categoryMap.get(categoryId);
  if (!parentCategory) return null;
  return {
    id: String(subcategory.id || subcategory.slug || `subcategory-${index + 1}`).trim(),
    legacyId: Number.isFinite(Number(subcategory.legacyId)) ? Number(subcategory.legacyId) : index + 1,
    parentLegacyId: Number.isFinite(Number(subcategory.parentLegacyId))
      ? Number(subcategory.parentLegacyId)
      : Number(parentCategory.legacyId || index + 1),
    categoryId,
    name: String(subcategory.name || subcategory.id || '').trim(),
    slug: String(subcategory.slug || subcategory.id || `subcategory-${index + 1}`).trim(),
    icon: String(subcategory.icon || 'subcategory_icon').trim(),
    status: String(subcategory.status || 'active') === 'inactive' ? 'inactive' : 'active',
    sortOrder: Number.isFinite(Number(subcategory.sortOrder)) ? Number(subcategory.sortOrder) : index + 1,
  };
}

function sanitizeBusinessTaxonomyState(value) {
  const fallbackSeed = buildBusinessTaxonomySeed();
  const source = value && typeof value === 'object' ? value : {};
  const categories = Array.isArray(source.categories)
    ? source.categories.map((category, index) => sanitizeBusinessCategory(category, index)).filter((category) => category.id && category.name)
    : fallbackSeed.categories.map((category, index) => sanitizeBusinessCategory(category, index));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const subcategories = Array.isArray(source.subcategories)
    ? source.subcategories.map((subcategory, index) => sanitizeBusinessSubcategory(subcategory, categoryMap, index)).filter(Boolean)
    : fallbackSeed.subcategories.map((subcategory, index) => sanitizeBusinessSubcategory(subcategory, categoryMap, index)).filter(Boolean);
  return {
    categories: categories.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    subcategories: subcategories.sort((a, b) => {
      if (a.categoryId !== b.categoryId) return a.categoryId.localeCompare(b.categoryId);
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    }),
    metadata: {
      seededFromCode: source.metadata?.seededFromCode ?? true,
      updatedAt: String(source.metadata?.updatedAt || new Date().toISOString()),
    },
  };
}

function sanitizeLocality(value, index = 0) {
  const locality = value && typeof value === 'object' ? value : {};
  return {
    id: String(locality.id || `locality-${index + 1}`).trim(),
    name: String(locality.name || locality.id || '').trim(),
    slug: String(locality.slug || locality.id || `locality-${index + 1}`).trim(),
    subdomain: String(locality.subdomain || '').trim(),
    description: String(locality.description || '').trim(),
    status: String(locality.status || 'active') === 'inactive' ? 'inactive' : 'active',
    coverImage: String(locality.coverImage || '').trim(),
    stats: {
      numBusinesses: Number(locality.stats?.numBusinesses || 0),
      numPending: Number(locality.stats?.numPending || 0),
    },
    carouselImages: Array.isArray(locality.carouselImages)
      ? locality.carouselImages.map((image) => String(image || '').trim()).filter(Boolean)
      : [],
  };
}

function sanitizeSubdomainMapping(value) {
  const subdomain = value && typeof value === 'object' ? value : {};
  return {
    domain: String(subdomain.domain || '').trim(),
    localityId: String(subdomain.localityId || '').trim(),
    sslEnabled: Boolean(subdomain.sslEnabled),
    dnsStatus: ['active', 'pending', 'failed'].includes(String(subdomain.dnsStatus || 'active'))
      ? String(subdomain.dnsStatus || 'active')
      : 'active',
    createdAt: String(subdomain.createdAt || new Date().toISOString()),
  };
}

function sanitizePincodeRoutingMapping(value) {
  const mapping = value && typeof value === 'object' ? value : {};
  return {
    pincode: String(mapping.pincode || '').replace(/\D/g, '').slice(0, 6),
    localityId: String(mapping.localityId || '').trim(),
  };
}

function sanitizeLocalityRoutingConfigState(value) {
  const seedLocalities = DEFAULT_LOCALITIES.map(sanitizeLocality);
  const source = value && typeof value === 'object' ? value : {};
  const localities = Array.isArray(source.localities)
    ? source.localities.map(sanitizeLocality).filter((locality) => locality.id && locality.name)
    : seedLocalities;
  const localityIds = new Set(localities.map((locality) => locality.id));
  const subdomains = Array.isArray(source.subdomains)
    ? source.subdomains
        .map(sanitizeSubdomainMapping)
        .filter((subdomain) => subdomain.domain && localityIds.has(subdomain.localityId))
    : buildDefaultSubdomainMappings(localities).map(sanitizeSubdomainMapping);
  const pincodeMappings = Array.isArray(source.pincodeMappings)
    ? source.pincodeMappings
        .map(sanitizePincodeRoutingMapping)
        .filter((mapping) => mapping.pincode && localityIds.has(mapping.localityId))
    : DEFAULT_PINCODE_MAPPINGS.map(sanitizePincodeRoutingMapping);
  const defaultLocalityId = localityIds.has(String(source.defaultLocalityId || ''))
    ? String(source.defaultLocalityId)
    : (localities[0]?.id || DEFAULT_LOCALITY_ID);
  return {
    localities,
    subdomains,
    pincodeMappings,
    defaultLocalityId,
    metadata: {
      seededFromCode: source.metadata?.seededFromCode ?? true,
      updatedAt: String(source.metadata?.updatedAt || new Date().toISOString()),
    },
  };
}

function sanitizeStateMaster(value, index = 0) {
  const state = value && typeof value === 'object' ? value : {};
  return {
    id: String(state.id || `state-${index + 1}`).trim(),
    name: String(state.name || state.id || '').trim(),
  };
}

function sanitizeCityMaster(value, stateIds, index = 0) {
  const city = value && typeof value === 'object' ? value : {};
  const stateId = String(city.stateId || '').trim();
  if (!stateIds.has(stateId)) return null;
  return {
    id: String(city.id || `city-${index + 1}`).trim(),
    stateId,
    name: String(city.name || city.id || '').trim(),
  };
}

function sanitizeLocalityMaster(value, cityIds, index = 0) {
  const locality = value && typeof value === 'object' ? value : {};
  const cityId = String(locality.cityId || '').trim();
  if (!cityIds.has(cityId)) return null;
  return {
    id: String(locality.id || `locality-${index + 1}`).trim(),
    cityId,
    name: String(locality.name || locality.id || '').trim(),
  };
}

function inferLocalityIdForArea(area, localities) {
  const explicitLocalityId = String(area?.localityId || '').trim();
  if (explicitLocalityId) return explicitLocalityId;

  const areaId = slugifyForUrl(area?.id || '');
  const areaName = slugifyForUrl(area?.name || '');
  const cityId = String(area?.cityId || '').trim();
  const localityMatch = localities.find((locality) => {
    if (cityId && locality.cityId !== cityId) return false;
    const localityId = slugifyForUrl(locality.id || '');
    const localityName = slugifyForUrl(locality.name || '');
    return (
      (localityId && (areaId.includes(localityId) || areaName.includes(localityId))) ||
      (localityName && (areaId.includes(localityName) || areaName.includes(localityName)))
    );
  });
  return localityMatch?.id || '';
}

function sanitizeAreaMaster(value, cityIds, localityIds, localities, index = 0) {
  const area = value && typeof value === 'object' ? value : {};
  const cityId = String(area.cityId || '').trim();
  const localityId = inferLocalityIdForArea(area, localities);
  if (!cityIds.has(cityId)) return null;
  if (!localityIds.has(localityId)) return null;
  return {
    id: String(area.id || `area-${index + 1}`).trim(),
    localityId,
    cityId,
    name: String(area.name || area.id || '').trim(),
    pincode: String(area.pincode || '').replace(/\D/g, '').slice(0, 6),
  };
}

function sanitizeGeographyConfigState(value) {
  const source = value && typeof value === 'object' ? value : {};
  const states = Array.isArray(source.states)
    ? source.states.map(sanitizeStateMaster).filter((state) => state.id && state.name)
    : DEFAULT_STATES.map(sanitizeStateMaster);
  const stateIds = new Set(states.map((state) => state.id));
  const cities = Array.isArray(source.cities)
    ? source.cities.map((city, index) => sanitizeCityMaster(city, stateIds, index)).filter(Boolean)
    : DEFAULT_CITIES.map((city, index) => sanitizeCityMaster(city, stateIds, index)).filter(Boolean);
  const cityIds = new Set(cities.map((city) => city.id));
  const localities = Array.isArray(source.localities)
    ? source.localities.map((locality, index) => sanitizeLocalityMaster(locality, cityIds, index)).filter(Boolean)
    : DEFAULT_GEOGRAPHY_LOCALITIES.map((locality, index) => sanitizeLocalityMaster(locality, cityIds, index)).filter(Boolean);
  const localityIds = new Set(localities.map((locality) => locality.id));
  const areas = Array.isArray(source.areas)
    ? source.areas.map((area, index) => sanitizeAreaMaster(area, cityIds, localityIds, localities, index)).filter(Boolean)
    : DEFAULT_AREAS.map((area, index) => sanitizeAreaMaster(area, cityIds, localityIds, localities, index)).filter(Boolean);
  return {
    states,
    cities,
    localities,
    areas,
    metadata: {
      seededFromCode: source.metadata?.seededFromCode ?? true,
      updatedAt: String(source.metadata?.updatedAt || new Date().toISOString()),
    },
  };
}

function sanitizeHomepageDefaultsConfigState(value) {
  const source = value && typeof value === 'object' ? value : {};
  const sectionTemplates = Array.isArray(source.sectionTemplates)
    ? source.sectionTemplates.map((section, index) => {
        const payload = cloneJson(section, {}) || {};
        return {
          ...payload,
          id: String(payload.id || `template_section_${index + 1}`),
        };
      }).filter(Boolean)
    : cloneJson(DEFAULT_HOMEPAGE_SECTION_TEMPLATES, []) || [];
  const fallbackListingAds = Array.isArray(source.fallbackListingAds)
    ? source.fallbackListingAds.map((ad, index) => {
        const payload = cloneJson(ad, {}) || {};
        return {
          ...payload,
          id: String(payload.id || `fallback_ad_${index + 1}`),
        };
      }).filter(Boolean)
    : cloneJson(DEFAULT_FALLBACK_LISTING_AD_TEMPLATES, []) || [];
  const heroStatTemplates = Array.isArray(source.heroStatTemplates) && source.heroStatTemplates.length > 0
    ? source.heroStatTemplates.map((stat, index) => {
        const payload = cloneJson(stat, {}) || {};
        const fallback = DEFAULT_HERO_STAT_TEMPLATES[index] || DEFAULT_HERO_STAT_TEMPLATES[0] || {};
        return {
          enabled: payload.enabled ?? fallback.enabled ?? true,
          label: String(payload.label || fallback.label || `Stat ${index + 1}`),
          value: String(payload.value || fallback.value || ''),
          localityIds: normalizeStringList(payload.localityIds),
          pincodes: normalizeStringList(payload.pincodes),
        };
      }).filter(Boolean)
    : cloneJson(DEFAULT_HERO_STAT_TEMPLATES, []) || [];
  const heroQuickActions = Array.isArray(source.heroQuickActions) && source.heroQuickActions.length > 0
    ? source.heroQuickActions.map((shortcut) => {
        const payload = cloneJson(shortcut, {}) || {};
        return {
          label: String(payload.label || '').trim(),
          categoryId: String(payload.categoryId || '').trim(),
          subcategoryId: payload.subcategoryId ? String(payload.subcategoryId).trim() : undefined,
        };
      }).filter((shortcut) => shortcut.categoryId)
    : cloneJson(DEFAULT_HERO_QUICK_ACTIONS, []) || [];
  const searchShortcutCategoryIds = Array.isArray(source.searchShortcutCategoryIds) && source.searchShortcutCategoryIds.length > 0
    ? normalizeStringList(source.searchShortcutCategoryIds)
    : cloneJson(DEFAULT_SEARCH_SHORTCUT_CATEGORY_IDS, []) || [];
  const draftDefaultsSource = source.heroBannerDraftDefaults && typeof source.heroBannerDraftDefaults === 'object'
    ? source.heroBannerDraftDefaults
    : {};
  return {
    sectionTemplates,
    fallbackListingAds,
    heroStatTemplates,
    heroQuickActions,
    searchShortcutCategoryIds,
    heroBannerDraftDefaults: {
      ctaLabel: String(draftDefaultsSource.ctaLabel || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaLabel),
      ctaType: ['landing_page', 'landing_listing', 'lead_form', 'search_category'].includes(String(draftDefaultsSource.ctaType || ''))
        ? String(draftDefaultsSource.ctaType)
        : DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaType,
      ctaTarget: String(draftDefaultsSource.ctaTarget || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaTarget),
      durationDays: Math.max(1, parseInt(String(draftDefaultsSource.durationDays || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.durationDays), 10) || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.durationDays),
    },
    metadata: {
      seededFromCode: source.metadata?.seededFromCode ?? true,
      updatedAt: String(source.metadata?.updatedAt || new Date().toISOString()),
    },
  };
}

function normalizeCmsStatus(value) {
  return ['draft', 'active', 'inactive', 'archived'].includes(String(value || ''))
    ? String(value)
    : 'active';
}

function normalizeDateOnlyInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return raw.slice(0, 10);
  }

  const dayMonthYearMatch = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dayMonthYearMatch) {
    const [, day, month, year] = dayMonthYearMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeTargetingRule(value) {
  const rule = value && typeof value === 'object' ? value : {};
  const devices = normalizeStringList(rule.devices).filter((entry) => ['all', 'mobile', 'desktop'].includes(entry));
  return {
    localityIds: normalizeStringList(rule.localityIds),
    categoryIds: normalizeStringList(rule.categoryIds),
    subcategoryIds: normalizeStringList(rule.subcategoryIds),
    pincodes: normalizeStringList(rule.pincodes),
    devices: devices.length > 0 ? devices : ['all'],
    pageTypes: normalizeStringList(rule.pageTypes),
    placementKeys: normalizeStringList(rule.placementKeys),
  };
}

function sanitizeTemplateSections(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((section, index) => {
      if (!section || typeof section !== 'object') return null;
      const payload = cloneJson(section, {});
      return {
        ...payload,
        id: String(payload.id || `section_${index + 1}`),
      };
    })
    .filter(Boolean);
}

function sanitizeScalableTemplate(value, index = 0) {
  const template = value && typeof value === 'object' ? value : {};
  const localityIds = normalizeStringList(template.localityIds);
  return {
    id: String(template.id || `tpl_${index + 1}`),
    name: String(template.name || `Homepage Template ${index + 1}`),
    templateScope: String(template.templateScope || (localityIds.length > 0 ? 'locality' : 'global')),
    localityIds,
    status: normalizeCmsStatus(template.status),
    priority: Number.isFinite(Number(template.priority)) ? Number(template.priority) : 100,
    isDefault: Boolean(template.isDefault),
    isFallback: Boolean(template.isFallback),
    sections: sanitizeTemplateSections(template.sections),
    metadata: cloneJson(template.metadata, {}) || {},
    updatedAt: String(template.updatedAt || new Date().toISOString()),
  };
}

function sanitizeTemplateAssignment(value, index = 0) {
  const assignment = value && typeof value === 'object' ? value : {};
  return {
    id: String(assignment.id || `assign_${index + 1}`),
    localityId: String(assignment.localityId || ''),
    templateId: String(assignment.templateId || ''),
    categoryId: assignment.categoryId ? String(assignment.categoryId) : '',
    subcategoryId: assignment.subcategoryId ? String(assignment.subcategoryId) : '',
    pincode: assignment.pincode ? String(assignment.pincode) : '',
    status: normalizeCmsStatus(assignment.status),
    priority: Number.isFinite(Number(assignment.priority)) ? Number(assignment.priority) : 100,
    isFallback: Boolean(assignment.isFallback),
    metadata: cloneJson(assignment.metadata, {}) || {},
    updatedAt: String(assignment.updatedAt || new Date().toISOString()),
  };
}

function sanitizeCampaign(value, index = 0) {
  const campaign = value && typeof value === 'object' ? value : {};
  return {
    id: String(campaign.id || `campaign_${index + 1}`),
    name: String(campaign.name || campaign.title || `Campaign ${index + 1}`),
    campaignType: String(campaign.campaignType || 'content_block'),
    status: normalizeCmsStatus(campaign.status),
    priority: Number.isFinite(Number(campaign.priority)) ? Number(campaign.priority) : 100,
    isFallback: Boolean(campaign.isFallback),
    startDate: normalizeDateOnlyInput(campaign.startDate),
    endDate: normalizeDateOnlyInput(campaign.endDate),
    deviceTarget: ['all', 'mobile', 'desktop'].includes(String(campaign.deviceTarget || 'all'))
      ? String(campaign.deviceTarget || 'all')
      : 'all',
    placementKeys: normalizeStringList(campaign.placementKeys),
    targets: normalizeTargetingRule(campaign.targets),
    maxItems: Number.isFinite(Number(campaign.maxItems)) ? Number(campaign.maxItems) : undefined,
    payload: cloneJson(campaign.payload, {}) || {},
    metadata: cloneJson(campaign.metadata, {}) || {},
    updatedAt: String(campaign.updatedAt || new Date().toISOString()),
  };
}

function sanitizePublishedSnapshot(value, index = 0) {
  const snapshot = value && typeof value === 'object' ? value : {};
  return {
    id: String(snapshot.id || `snapshot_${index + 1}`),
    localityId: String(snapshot.localityId || ''),
    categoryId: snapshot.categoryId ? String(snapshot.categoryId) : '',
    subcategoryId: snapshot.subcategoryId ? String(snapshot.subcategoryId) : '',
    pincode: snapshot.pincode ? String(snapshot.pincode) : '',
    placementKey: snapshot.placementKey ? String(snapshot.placementKey) : '',
    deviceTarget: ['all', 'mobile', 'desktop'].includes(String(snapshot.deviceTarget || 'all'))
      ? String(snapshot.deviceTarget || 'all')
      : 'all',
    pageType: String(snapshot.pageType || 'homepage'),
    payload: cloneJson(snapshot.payload, {}) || {},
    publishedAt: String(snapshot.publishedAt || new Date().toISOString()),
    updatedAt: String(snapshot.updatedAt || new Date().toISOString()),
  };
}

function getScalableEntityMetadataSource(metadata) {
  return String(metadata?.source || '');
}

function isScalableEntityDetachedFromLegacySync(metadata) {
  return Boolean(metadata?.detachedFromLegacySync);
}

function isLegacyManagedScalableEntity(metadata) {
  return getScalableEntityMetadataSource(metadata).startsWith('legacy_') && !isScalableEntityDetachedFromLegacySync(metadata);
}

function buildScalableLegacyOwnershipSummary(state) {
  const templates = Array.isArray(state?.templates) ? state.templates : [];
  const assignments = Array.isArray(state?.assignments) ? state.assignments : [];
  const campaigns = Array.isArray(state?.campaigns) ? state.campaigns : [];
  return {
    legacyManagedTemplates: templates.filter((template) => isLegacyManagedScalableEntity(template.metadata)).length,
    detachedTemplates: templates.filter((template) => isScalableEntityDetachedFromLegacySync(template.metadata)).length,
    legacyManagedAssignments: assignments.filter((assignment) => isLegacyManagedScalableEntity(assignment.metadata)).length,
    detachedAssignments: assignments.filter((assignment) => isScalableEntityDetachedFromLegacySync(assignment.metadata)).length,
    legacyManagedCampaigns: campaigns.filter((campaign) => isLegacyManagedScalableEntity(campaign.metadata)).length,
    detachedCampaigns: campaigns.filter((campaign) => isScalableEntityDetachedFromLegacySync(campaign.metadata)).length,
  };
}

const LEGACY_SCALABLE_CAMPAIGN_SOURCE_TAGS = [
  'legacy_hero_banner',
  'legacy_listing_ad',
  'legacy_coupon',
  'legacy_community_item',
  'legacy_business_sponsorship',
];

function normalizeLegacyScalableCampaignSourceTags(sourceTags) {
  return normalizeStringList(sourceTags).filter((sourceTag) => LEGACY_SCALABLE_CAMPAIGN_SOURCE_TAGS.includes(sourceTag));
}

function buildLegacyScalableCampaignSources(homepageConfig, businesses) {
  const safeConfig = sanitizeHomepageConfig(homepageConfig) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const safeBusinesses = Array.isArray(businesses) ? businesses : [];
  const businessesById = new Map(
    safeBusinesses
      .filter((business) => business && typeof business === 'object' && business.id)
      .map((business) => [String(business.id), business]),
  );

  const heroBannerCampaigns = (safeConfig.heroBanners || []).map((banner, index) => sanitizeCampaign({
    id: `hero_${String(banner.id || `banner_${index + 1}`)}`,
    name: String(banner.title || `Hero Banner ${index + 1}`),
    campaignType: 'hero_banner',
    status: banner.isActive === false ? 'inactive' : 'active',
    priority: 100,
    isFallback: true,
    startDate: banner.startDate ? String(banner.startDate) : '',
    endDate: banner.endDate ? String(banner.endDate) : '',
    deviceTarget: 'all',
    placementKeys: [],
    targets: {
      localityIds: normalizeStringList([banner.localityId]),
      categoryIds: [],
      subcategoryIds: [],
      pincodes: normalizeStringList(banner.pincodes),
      devices: ['all'],
      pageTypes: ['homepage'],
      placementKeys: [],
    },
    payload: cloneJson(banner, {}) || {},
    metadata: {
      source: 'legacy_hero_banner',
    },
    updatedAt: new Date().toISOString(),
  }, index));

  const listingAdCampaigns = (safeConfig.listingAds || []).map((ad, index) => sanitizeCampaign({
    id: `ad_${String(ad.id || `listing_ad_${index + 1}`)}`,
    name: String(ad.title || `Listing Ad ${index + 1}`),
    campaignType: 'listing_ad',
    status: ad.isActive === false ? 'inactive' : 'active',
    priority: 100,
    isFallback: true,
    startDate: ad.startDate ? String(ad.startDate) : '',
    endDate: ad.endDate ? String(ad.endDate) : '',
    deviceTarget: ['desktop', 'mobile'].includes(String(ad.deviceTarget || ''))
      ? String(ad.deviceTarget)
      : 'all',
    placementKeys: normalizeStringList([ad.placementKey]),
    targets: {
      localityIds: normalizeStringList(ad.localityIds),
      categoryIds: normalizeStringList(ad.categoryIds),
      subcategoryIds: [],
      pincodes: normalizeStringList(ad.pincodes),
      devices: normalizeStringList([ad.deviceTarget || 'all']),
      pageTypes: ['homepage', 'listing_results'],
      placementKeys: normalizeStringList([ad.placementKey]),
    },
    payload: cloneJson(ad, {}) || {},
    metadata: {
      source: 'legacy_listing_ad',
    },
    updatedAt: new Date().toISOString(),
  }, index));

  const offerCampaigns = (safeConfig.coupons || []).map((coupon, index) => {
    const relatedBusiness = businessesById.get(String(coupon.businessId || ''));
    return sanitizeCampaign({
      id: `offer_${String(coupon.id || `coupon_${index + 1}`)}`,
      name: String(coupon.title || coupon.code || `Offer ${index + 1}`),
      campaignType: 'offer',
      status: coupon.isActive === false ? 'inactive' : 'active',
      priority: 100,
      isFallback: true,
      startDate: coupon.startDate ? String(coupon.startDate) : '',
      endDate: coupon.endDate || coupon.expiryDate ? String(coupon.endDate || coupon.expiryDate) : '',
      deviceTarget: 'all',
      placementKeys: [],
      targets: {
        localityIds: Array.isArray(coupon.localityIds) && coupon.localityIds.length > 0
          ? normalizeStringList(coupon.localityIds)
          : normalizeStringList([relatedBusiness?.localityId]),
        categoryIds: Array.isArray(coupon.categoryIds) && coupon.categoryIds.length > 0
          ? normalizeStringList(coupon.categoryIds)
          : normalizeStringList([relatedBusiness?.categoryId]),
        subcategoryIds: normalizeStringList([relatedBusiness?.subcategoryId]),
        pincodes: Array.isArray(coupon.pincodes) && coupon.pincodes.length > 0
          ? normalizeStringList(coupon.pincodes)
          : normalizeStringList([relatedBusiness?.pincode]),
        devices: ['all'],
        pageTypes: ['homepage', 'listing_results'],
        placementKeys: [],
      },
      payload: cloneJson(coupon, {}) || {},
      metadata: {
        source: 'legacy_coupon',
      },
      updatedAt: new Date().toISOString(),
    }, index);
  });

  const contentBlockCampaigns = (safeConfig.communityItems || []).map((item, index) => sanitizeCampaign({
    id: `content_${String(item.id || `content_${index + 1}`)}`,
    name: String(item.title || `Content Block ${index + 1}`),
    campaignType: 'content_block',
    status: item.status === 'archived'
      ? 'archived'
      : item.status === 'draft'
        ? 'draft'
        : 'active',
    priority: item.isSponsored ? 120 : 100,
    isFallback: true,
    startDate: item.publishAt
      ? String(item.publishAt).slice(0, 10)
      : item.createdAt
        ? String(item.createdAt).slice(0, 10)
        : '',
    endDate: item.expireAt ? String(item.expireAt).slice(0, 10) : '',
    deviceTarget: 'all',
    placementKeys: [],
    targets: {
      localityIds: normalizeStringList([item.localityId]),
      categoryIds: [],
      subcategoryIds: [],
      pincodes: [],
      devices: ['all'],
      pageTypes: ['homepage'],
      placementKeys: [],
    },
    payload: cloneJson(item, {}) || {},
    metadata: {
      source: 'legacy_community_item',
    },
    updatedAt: new Date().toISOString(),
  }, index));

  const sponsoredListingCampaigns = safeBusinesses
    .filter((business) => business && typeof business === 'object' && business.isSponsored === true)
    .map((business, index) => sanitizeCampaign({
      id: `sponsored_${String(business.id || `business_${index + 1}`)}`,
      name: String(business.name || `Sponsored Listing ${index + 1}`),
      campaignType: 'sponsored_listing',
      status: business.status === 'approved' ? 'active' : 'inactive',
      priority: Number.isFinite(Number(business.cpcBudget)) ? Math.round(Number(business.cpcBudget)) : 100,
      isFallback: true,
      startDate: '',
      endDate: '',
      deviceTarget: 'all',
      placementKeys: [],
      targets: {
        localityIds: normalizeStringList([business.localityId]),
        categoryIds: normalizeStringList([business.categoryId]),
        subcategoryIds: normalizeStringList([business.subcategoryId]),
        pincodes: normalizeStringList([business.pincode]),
        devices: ['all'],
        pageTypes: ['homepage', 'listing_results'],
        placementKeys: [],
      },
      maxItems: 1,
      payload: {
        businessIds: [String(business.id)],
        sellerBusinessId: String(business.id),
        businessName: String(business.name || ''),
      },
      metadata: {
        source: 'legacy_business_sponsorship',
      },
      updatedAt: new Date().toISOString(),
    }, index));

  return {
    legacy_hero_banner: {
      campaignType: 'hero_banner',
      campaigns: heroBannerCampaigns,
    },
    legacy_listing_ad: {
      campaignType: 'listing_ad',
      campaigns: listingAdCampaigns,
    },
    legacy_coupon: {
      campaignType: 'offer',
      campaigns: offerCampaigns,
    },
    legacy_community_item: {
      campaignType: 'content_block',
      campaigns: contentBlockCampaigns,
    },
    legacy_business_sponsorship: {
      campaignType: 'sponsored_listing',
      campaigns: sponsoredListingCampaigns,
    },
  };
}

function syncScalableTemplatesFromLegacyLayouts(state, layouts) {
  const existingTemplatesById = new Map((state.templates || []).map((template) => [template.id, template]));
  const syncedTemplates = (layouts || []).map((layout, index) => {
    const templateId = `tpl_${String(layout.id || `homepage_${layout.localityId || index + 1}`)}`;
    const existing = existingTemplatesById.get(templateId);
    return sanitizeScalableTemplate({
      id: templateId,
      name: String(layout.name || `${layout.localityId || 'default'} Homepage Template`),
      templateScope: 'locality',
      localityIds: normalizeStringList([layout.localityId]),
      status: layout.status === 'inactive' ? 'inactive' : 'active',
      priority: existing?.priority ?? 100,
      isDefault: existing?.isDefault ?? false,
      isFallback: existing?.isFallback ?? true,
      sections: sanitizeTemplateSections(layout.sections),
      metadata: {
        ...(existing?.metadata || {}),
        source: 'legacy_homepage_layout',
        legacyLayoutId: String(layout.id || ''),
      },
      updatedAt: String(layout.updatedAt || new Date().toISOString()),
    }, index);
  });

  const syncedTemplateIds = new Set(syncedTemplates.map((template) => template.id));
  const preservedTemplates = (state.templates || []).filter((template) => {
    const metadata = template.metadata || {};
    const source = getScalableEntityMetadataSource(metadata);
    const detachedFromLegacySync = isScalableEntityDetachedFromLegacySync(metadata);
    if (syncedTemplateIds.has(template.id)) {
      return detachedFromLegacySync || !source.startsWith('legacy_');
    }
    if (source === 'legacy_homepage_layout') {
      return detachedFromLegacySync;
    }
    return true;
  });
  const preservedTemplateIds = new Set(preservedTemplates.map((template) => template.id));
  const activeSyncedTemplates = syncedTemplates.filter((template) => !preservedTemplateIds.has(template.id));

  return {
    ...state,
    templates: [...preservedTemplates, ...activeSyncedTemplates],
    metadata: {
      ...(state.metadata || {}),
      updatedAt: new Date().toISOString(),
    },
  };
}

function syncScalableAssignmentsFromLegacyLayouts(state, layouts) {
  const syncedAssignments = (layouts || []).map((layout, index) => sanitizeTemplateAssignment({
    id: `assign_${layout.localityId || index + 1}`,
    localityId: String(layout.localityId || ''),
    templateId: `tpl_${String(layout.id || `homepage_${layout.localityId || index + 1}`)}`,
    status: layout.status === 'inactive' ? 'inactive' : 'active',
    priority: 100,
    isFallback: true,
    metadata: {
      source: 'legacy_homepage_assignment',
      legacyLayoutId: String(layout.id || ''),
    },
    updatedAt: String(layout.updatedAt || new Date().toISOString()),
  }, index));

  const syncedAssignmentIds = new Set(syncedAssignments.map((assignment) => assignment.id));
  const preservedAssignments = (state.assignments || []).filter((assignment) => {
    const metadata = assignment.metadata || {};
    const source = getScalableEntityMetadataSource(metadata);
    const detachedFromLegacySync = isScalableEntityDetachedFromLegacySync(metadata);
    if (syncedAssignmentIds.has(assignment.id)) {
      return detachedFromLegacySync || !source.startsWith('legacy_');
    }
    if (source === 'legacy_homepage_assignment') {
      return detachedFromLegacySync;
    }
    return true;
  });
  const preservedAssignmentIds = new Set(preservedAssignments.map((assignment) => assignment.id));
  const activeSyncedAssignments = syncedAssignments.filter((assignment) => !preservedAssignmentIds.has(assignment.id));

  return {
    ...state,
    assignments: [...preservedAssignments, ...activeSyncedAssignments],
    metadata: {
      ...(state.metadata || {}),
      updatedAt: new Date().toISOString(),
    },
  };
}

function syncScalableCampaignCollection(state, campaignType, nextCampaigns, sourceTag) {
  const incomingCampaignIds = new Set((nextCampaigns || []).map((campaign) => campaign.id));
  const preservedCampaigns = (state.campaigns || []).filter((campaign) => {
    if (campaign.campaignType !== campaignType) return true;
    const metadata = campaign.metadata || {};
    const source = getScalableEntityMetadataSource(metadata);
    const detachedFromLegacySync = isScalableEntityDetachedFromLegacySync(metadata);
    if (incomingCampaignIds.has(campaign.id)) {
      return detachedFromLegacySync || source !== sourceTag;
    }
    if (source === sourceTag) {
      return detachedFromLegacySync;
    }
    return true;
  });
  const preservedCampaignIds = new Set(preservedCampaigns.map((campaign) => campaign.id));
  const activeSyncedCampaigns = (nextCampaigns || []).filter((campaign) => !preservedCampaignIds.has(campaign.id));

  return sanitizeScalableCmsState({
    ...state,
    campaigns: [...preservedCampaigns, ...activeSyncedCampaigns],
    metadata: {
      ...(state.metadata || {}),
      updatedAt: new Date().toISOString(),
    },
  });
}

function shouldAllowLegacyScalableReseed(state) {
  if (!state || typeof state !== 'object') return true;
  if (!state.metadata?.seededFromLegacy) return false;
  const entities = [
    ...(Array.isArray(state.templates) ? state.templates : []),
    ...(Array.isArray(state.assignments) ? state.assignments : []),
    ...(Array.isArray(state.campaigns) ? state.campaigns : []),
  ];
  return entities.every((entity) => isLegacyManagedScalableEntity(entity.metadata));
}

function sanitizeScalableCmsState(value) {
  if (!value || typeof value !== 'object') return null;
  const state = value;
  return {
    version: Number.isFinite(Number(state.version)) ? Number(state.version) : 1,
    templates: Array.isArray(state.templates) ? state.templates.map(sanitizeScalableTemplate).filter((template) => template.id) : [],
    assignments: Array.isArray(state.assignments) ? state.assignments.map(sanitizeTemplateAssignment).filter((assignment) => assignment.id && assignment.templateId) : [],
    campaigns: Array.isArray(state.campaigns) ? state.campaigns.map(sanitizeCampaign).filter((campaign) => campaign.id) : [],
    publishedSnapshots: Array.isArray(state.publishedSnapshots)
      ? state.publishedSnapshots.map(sanitizePublishedSnapshot).filter((snapshot) => snapshot.id && snapshot.localityId)
      : [],
    metadata: {
      seededFromLegacy: Boolean(state.metadata?.seededFromLegacy),
      notes: String(state.metadata?.notes || ''),
      updatedAt: String(state.metadata?.updatedAt || new Date().toISOString()),
    },
  };
}

function buildScalableCmsSeedFromLegacy(homepageConfig, businesses) {
  const safeConfig = sanitizeHomepageConfig(homepageConfig) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const legacyCampaignSources = buildLegacyScalableCampaignSources(safeConfig, businesses);
  const templates = (safeConfig.homepageLayouts || []).map((layout, index) => ({
    id: `tpl_${String(layout.id || layout.localityId || index + 1)}`,
    name: String(layout.name || `${layout.localityId || 'default'} Homepage Template`),
    templateScope: 'locality',
    localityIds: normalizeStringList([layout.localityId]),
    status: layout.status === 'inactive' ? 'inactive' : 'active',
    priority: 100,
    isDefault: false,
    isFallback: true,
    sections: sanitizeTemplateSections(layout.sections),
    metadata: {
      source: 'legacy_homepage_layout',
      legacyLayoutId: String(layout.id || ''),
    },
    updatedAt: String(layout.updatedAt || new Date().toISOString()),
  }));
  const assignments = templates.map((template, index) => ({
    id: `assign_${template.id}_${index + 1}`,
    localityId: template.localityIds[0] || '',
    templateId: template.id,
    status: template.status,
    priority: 100,
    isFallback: true,
    metadata: {
      source: 'legacy_homepage_layout',
    },
    updatedAt: template.updatedAt,
  })).filter((assignment) => assignment.localityId);
  const campaigns = LEGACY_SCALABLE_CAMPAIGN_SOURCE_TAGS.flatMap(
    (sourceTag) => legacyCampaignSources[sourceTag]?.campaigns || [],
  );

  return sanitizeScalableCmsState({
    version: 1,
    templates,
    assignments,
    campaigns,
    publishedSnapshots: [],
    metadata: {
      seededFromLegacy: true,
      notes: 'Seeded automatically from legacy homepage configuration and sponsored listing flags.',
      updatedAt: new Date().toISOString(),
    },
  });
}

async function readBusinessTaxonomyFromTables(client) {
  const [categoriesResult, subcategoriesResult] = await Promise.all([
    client.query(`
      SELECT id, legacy_id, name, slug, icon, status, sort_order, metadata, updated_at
      FROM business_categories
      ORDER BY sort_order ASC, name ASC
    `),
    client.query(`
      SELECT id, legacy_id, parent_legacy_id, category_id, name, slug, icon, status, sort_order, metadata, updated_at
      FROM business_subcategories
      ORDER BY category_id ASC, sort_order ASC, name ASC
    `),
  ]);

  if (categoriesResult.rows.length === 0) {
    return null;
  }

  return sanitizeBusinessTaxonomyState({
    categories: categoriesResult.rows.map((row) => ({
      id: row.id,
      legacyId: row.legacy_id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      status: row.status,
      sortOrder: row.sort_order,
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    subcategories: subcategoriesResult.rows.map((row) => ({
      id: row.id,
      legacyId: row.legacy_id,
      parentLegacyId: row.parent_legacy_id,
      categoryId: row.category_id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      status: row.status,
      sortOrder: row.sort_order,
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    metadata: {
      seededFromCode: false,
      updatedAt: new Date().toISOString(),
    },
  });
}

async function syncBusinessTaxonomyToTables(_client, taxonomy) {
  await runInPgTransaction(async (client) => {
    await client.query('DELETE FROM business_subcategories');
    await client.query('DELETE FROM business_categories');

    for (const category of taxonomy.categories) {
      await client.query(
        `INSERT INTO business_categories (id, legacy_id, name, slug, icon, status, sort_order, metadata, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())`,
        [
          category.id,
          category.legacyId,
          category.name,
          category.slug,
          category.icon,
          category.status,
          category.sortOrder,
          JSON.stringify({}),
        ],
      );
    }

    for (const subcategory of taxonomy.subcategories) {
      await client.query(
        `INSERT INTO business_subcategories (id, legacy_id, parent_legacy_id, category_id, name, slug, icon, status, sort_order, metadata, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, NOW())`,
        [
          subcategory.id,
          subcategory.legacyId,
          subcategory.parentLegacyId,
          subcategory.categoryId,
          subcategory.name,
          subcategory.slug,
          subcategory.icon,
          subcategory.status,
          subcategory.sortOrder,
          JSON.stringify({}),
        ],
      );
    }

  }, 'syncBusinessTaxonomyToTables');
}

async function readBusinessTaxonomy() {
  const client = await getPgClient();
  if (client) {
    const tableState = await readBusinessTaxonomyFromTables(client);
    if (tableState) return tableState;
    const seeded = sanitizeBusinessTaxonomyState(null);
    await syncBusinessTaxonomyToTables(client, seeded);
    return seeded;
  }

  if (memoryBusinessTaxonomy && typeof memoryBusinessTaxonomy === 'object') {
    return memoryBusinessTaxonomy;
  }

  try {
    const raw = await fs.readFile(businessTaxonomyPath, 'utf8');
    const data = JSON.parse(raw);
    const sanitized = sanitizeBusinessTaxonomyState(data);
    memoryBusinessTaxonomy = sanitized;
    return sanitized;
  } catch {
    const seeded = sanitizeBusinessTaxonomyState(null);
    memoryBusinessTaxonomy = seeded;
    return seeded;
  }
}

async function writeBusinessTaxonomy(taxonomy) {
  const sanitized = sanitizeBusinessTaxonomyState(taxonomy);
  const client = await getPgClient();
  if (client) {
    await syncBusinessTaxonomyToTables(client, sanitized);
    return sanitized;
  }

  try {
    await fs.writeFile(businessTaxonomyPath, JSON.stringify(sanitized, null, 2), 'utf8');
    memoryBusinessTaxonomy = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('business-taxonomy.json write failed, using in-memory taxonomy store:', err?.message || err);
    memoryBusinessTaxonomy = sanitized;
    return sanitized;
  }
}

async function readLocalityRoutingConfigFromTables(client) {
  const [localitiesResult, subdomainsResult, mappingsResult, defaultResult] = await Promise.all([
    client.query(`
      SELECT id, name, slug, subdomain, description, status, cover_image, stats, carousel_images, metadata, updated_at
      FROM platform_localities
      ORDER BY id ASC
    `),
    client.query(`
      SELECT domain, locality_id, ssl_enabled, dns_status, created_at
      FROM platform_subdomains
      ORDER BY domain ASC
    `),
    client.query(`
      SELECT pincode, locality_id
      FROM platform_pincode_mappings
      ORDER BY pincode ASC
    `),
    client.query(`
      SELECT value
      FROM app_state
      WHERE key = $1
      LIMIT 1
    `, ['default_locality_id']),
  ]);

  if (localitiesResult.rows.length === 0) {
    return null;
  }

  return sanitizeLocalityRoutingConfigState({
    localities: localitiesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      subdomain: row.subdomain,
      description: row.description,
      status: row.status,
      coverImage: row.cover_image,
      stats: row.stats || {},
      carouselImages: row.carousel_images || [],
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    subdomains: subdomainsResult.rows.map((row) => ({
      domain: row.domain,
      localityId: row.locality_id,
      sslEnabled: row.ssl_enabled,
      dnsStatus: row.dns_status,
      createdAt: row.created_at?.toISOString?.() || new Date().toISOString(),
    })),
    pincodeMappings: mappingsResult.rows.map((row) => ({
      pincode: row.pincode,
      localityId: row.locality_id,
    })),
    defaultLocalityId: defaultResult.rows[0]?.value || '',
    metadata: {
      seededFromCode: false,
      updatedAt: new Date().toISOString(),
    },
  });
}

async function syncLocalityRoutingConfigToTables(_client, config) {
  await runInPgTransaction(async (client) => {
    await client.query('DELETE FROM platform_pincode_mappings');
    await client.query('DELETE FROM platform_subdomains');
    await client.query('DELETE FROM platform_localities');

    for (const locality of config.localities) {
      await client.query(
        `INSERT INTO platform_localities (id, name, slug, subdomain, description, status, cover_image, stats, carousel_images, metadata, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, NOW())`,
        [
          locality.id,
          locality.name,
          locality.slug,
          locality.subdomain,
          locality.description,
          locality.status,
          locality.coverImage,
          JSON.stringify(locality.stats || {}),
          locality.carouselImages || [],
          JSON.stringify({}),
        ],
      );
    }

    for (const subdomain of config.subdomains) {
      await client.query(
        `INSERT INTO platform_subdomains (domain, locality_id, ssl_enabled, dns_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          subdomain.domain,
          subdomain.localityId,
          subdomain.sslEnabled,
          subdomain.dnsStatus,
          subdomain.createdAt,
        ],
      );
    }

    for (const mapping of config.pincodeMappings) {
      await client.query(
        `INSERT INTO platform_pincode_mappings (pincode, locality_id, updated_at)
         VALUES ($1, $2, NOW())`,
        [mapping.pincode, mapping.localityId],
      );
    }

    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['default_locality_id', JSON.stringify(config.defaultLocalityId)],
    );

  }, 'syncLocalityRoutingConfigToTables');
}

async function readLocalityRoutingConfig() {
  const client = await getPgClient();
  if (client) {
    const tableState = await readLocalityRoutingConfigFromTables(client);
    if (tableState) return tableState;
    const seeded = sanitizeLocalityRoutingConfigState(null);
    await syncLocalityRoutingConfigToTables(client, seeded);
    return seeded;
  }

  if (memoryLocalityRoutingConfig && typeof memoryLocalityRoutingConfig === 'object') {
    return memoryLocalityRoutingConfig;
  }

  try {
    const raw = await fs.readFile(localityRoutingConfigPath, 'utf8');
    const data = JSON.parse(raw);
    const sanitized = sanitizeLocalityRoutingConfigState(data);
    memoryLocalityRoutingConfig = sanitized;
    return sanitized;
  } catch {
    const seeded = sanitizeLocalityRoutingConfigState(null);
    memoryLocalityRoutingConfig = seeded;
    return seeded;
  }
}

async function writeLocalityRoutingConfig(config) {
  const sanitized = sanitizeLocalityRoutingConfigState(config);
  const client = await getPgClient();
  if (client) {
    await syncLocalityRoutingConfigToTables(client, sanitized);
    return sanitized;
  }

  try {
    await fs.writeFile(localityRoutingConfigPath, JSON.stringify(sanitized, null, 2), 'utf8');
    memoryLocalityRoutingConfig = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('locality-routing-config.json write failed, using in-memory routing store:', err?.message || err);
    memoryLocalityRoutingConfig = sanitized;
    return sanitized;
  }
}

async function readGeographyConfigFromTables(client) {
  const [statesResult, citiesResult, areasResult] = await Promise.all([
    client.query(`
      SELECT id, name, metadata, updated_at
      FROM platform_states
      ORDER BY id ASC
    `),
    client.query(`
      SELECT id, state_id, name, metadata, updated_at
      FROM platform_cities
      ORDER BY state_id ASC, id ASC
    `),
    client.query(`
      SELECT id, city_id, name, pincode, metadata, updated_at
      FROM platform_areas
      ORDER BY city_id ASC, id ASC
    `),
  ]);

  if (statesResult.rows.length === 0) {
    return null;
  }

  return sanitizeGeographyConfigState({
    states: statesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    cities: citiesResult.rows.map((row) => ({
      id: row.id,
      stateId: row.state_id,
      name: row.name,
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    areas: areasResult.rows.map((row) => ({
      id: row.id,
      cityId: row.city_id,
      name: row.name,
      pincode: row.pincode,
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    metadata: {
      seededFromCode: false,
      updatedAt: new Date().toISOString(),
    },
  });
}

async function syncGeographyConfigToTables(_client, config) {
  await runInPgTransaction(async (client) => {
    await client.query('DELETE FROM platform_areas');
    await client.query('DELETE FROM platform_cities');
    await client.query('DELETE FROM platform_states');

    for (const state of config.states) {
      await client.query(
        `INSERT INTO platform_states (id, name, metadata, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())`,
        [state.id, state.name, JSON.stringify({})],
      );
    }

    for (const city of config.cities) {
      await client.query(
        `INSERT INTO platform_cities (id, state_id, name, metadata, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW())`,
        [city.id, city.stateId, city.name, JSON.stringify({})],
      );
    }

    for (const area of config.areas) {
      await client.query(
        `INSERT INTO platform_areas (id, city_id, name, pincode, metadata, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
        [area.id, area.cityId, area.name, area.pincode, JSON.stringify({})],
      );
    }

  }, 'syncGeographyConfigToTables');
}

async function readGeographyConfig() {
  const client = await getPgClient();
  if (client) {
    const tableState = await readGeographyConfigFromTables(client);
    if (tableState) return tableState;
    const seeded = sanitizeGeographyConfigState(null);
    await syncGeographyConfigToTables(client, seeded);
    return seeded;
  }

  if (memoryGeographyConfig && typeof memoryGeographyConfig === 'object') {
    return memoryGeographyConfig;
  }

  try {
    const raw = await fs.readFile(geographyConfigPath, 'utf8');
    const data = JSON.parse(raw);
    const sanitized = sanitizeGeographyConfigState(data);
    memoryGeographyConfig = sanitized;
    return sanitized;
  } catch {
    const seeded = sanitizeGeographyConfigState(null);
    memoryGeographyConfig = seeded;
    return seeded;
  }
}

async function writeGeographyConfig(config) {
  const sanitized = sanitizeGeographyConfigState(config);
  const client = await getPgClient();
  if (client) {
    await syncGeographyConfigToTables(client, sanitized);
    return sanitized;
  }

  try {
    await fs.writeFile(geographyConfigPath, JSON.stringify(sanitized, null, 2), 'utf8');
    memoryGeographyConfig = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('geography-config.json write failed, using in-memory geography store:', err?.message || err);
    memoryGeographyConfig = sanitized;
    return sanitized;
  }
}

async function readHomepageDefaultsConfig() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['homepage_defaults_config'],
    );
    const data = result.rows[0]?.value;
    if (data) return sanitizeHomepageDefaultsConfigState(data);
    const seeded = sanitizeHomepageDefaultsConfigState(null);
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['homepage_defaults_config', JSON.stringify(seeded)],
    );
    return seeded;
  }

  if (memoryHomepageDefaultsConfig && typeof memoryHomepageDefaultsConfig === 'object') {
    return memoryHomepageDefaultsConfig;
  }

  try {
    const raw = await fs.readFile(homepageDefaultsConfigPath, 'utf8');
    const data = JSON.parse(raw);
    const sanitized = sanitizeHomepageDefaultsConfigState(data);
    memoryHomepageDefaultsConfig = sanitized;
    return sanitized;
  } catch {
    const seeded = sanitizeHomepageDefaultsConfigState(null);
    memoryHomepageDefaultsConfig = seeded;
    return seeded;
  }
}

async function writeHomepageDefaultsConfig(config) {
  const sanitized = sanitizeHomepageDefaultsConfigState(config);
  const client = await getPgClient();
  if (client) {
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['homepage_defaults_config', JSON.stringify(sanitized)],
    );
    return sanitized;
  }

  try {
    await fs.writeFile(homepageDefaultsConfigPath, JSON.stringify(sanitized, null, 2), 'utf8');
    memoryHomepageDefaultsConfig = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('homepage-defaults-config.json write failed, using in-memory homepage defaults store:', err?.message || err);
    memoryHomepageDefaultsConfig = sanitized;
    return sanitized;
  }
}

async function readSeoDiscoveryConfig() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['seo_discovery_config'],
    );
    const data = result.rows[0]?.value;
    if (data) return sanitizeSeoDiscoveryConfigState(data);
    const seeded = sanitizeSeoDiscoveryConfigState(null);
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['seo_discovery_config', JSON.stringify(seeded)],
    );
    return seeded;
  }

  if (memorySeoDiscoveryConfig && typeof memorySeoDiscoveryConfig === 'object') {
    return memorySeoDiscoveryConfig;
  }

  try {
    const raw = await fs.readFile(seoDiscoveryConfigPath, 'utf8');
    const data = JSON.parse(raw);
    const sanitized = sanitizeSeoDiscoveryConfigState(data);
    memorySeoDiscoveryConfig = sanitized;
    return sanitized;
  } catch {
    const seeded = sanitizeSeoDiscoveryConfigState(null);
    memorySeoDiscoveryConfig = seeded;
    return seeded;
  }
}

async function writeSeoDiscoveryConfig(config) {
  const sanitized = sanitizeSeoDiscoveryConfigState(config);
  const client = await getPgClient();
  if (client) {
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['seo_discovery_config', JSON.stringify(sanitized)],
    );
    return sanitized;
  }

  try {
    await fs.writeFile(seoDiscoveryConfigPath, JSON.stringify(sanitized, null, 2), 'utf8');
    memorySeoDiscoveryConfig = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('seo-discovery-config.json write failed, using in-memory seo discovery store:', err?.message || err);
    memorySeoDiscoveryConfig = sanitized;
    return sanitized;
  }
}

async function readHomepageConfig() {
  const client = await getPgClient();
  if (client) {
    const fromTables = await readHomepageConfigFromTables(client);
    if (fromTables) {
      memoryHomepageConfig = fromTables;
      return fromTables;
    }

    const result = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['homepage_config'],
    );
    const data = result.rows[0]?.value;
    const sanitized = sanitizeHomepageConfig(data);
    if (sanitized) return sanitized;
    try {
      const raw = await fs.readFile(homepageConfigPath, 'utf8');
      const fileData = JSON.parse(raw);
      const seededConfig = sanitizeHomepageConfig(fileData);
      if (!seededConfig) return null;
      await syncHomepageConfigToTables(client, seededConfig);
      return seededConfig;
    } catch {
      return null;
    }
  }

  if (memoryHomepageConfig && typeof memoryHomepageConfig === 'object') {
    return memoryHomepageConfig;
  }

  try {
    const raw = await fs.readFile(homepageConfigPath, 'utf8');
    const data = JSON.parse(raw);
    const sanitized = sanitizeHomepageConfig(data);
    memoryHomepageConfig = sanitized;
    return sanitized;
  } catch {
    return null;
  }
}

async function writeHomepageConfig(config) {
  const sanitized = sanitizeHomepageConfig(config);
  if (!sanitized) throw new Error('Invalid homepage config payload');

  const client = await getPgClient();
  if (client) {
    await syncHomepageConfigToTables(client, sanitized);
    memoryHomepageConfig = sanitized;
    return sanitized;
  }

  try {
    await fs.writeFile(homepageConfigPath, JSON.stringify(sanitized, null, 2), 'utf8');
    memoryHomepageConfig = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('homepage-config.json write failed, using in-memory homepage config store:', err?.message || err);
    memoryHomepageConfig = sanitized;
    return sanitized;
  }
}

async function mutateLegacyHomepageLayout(localityId, mutateLayout, fallbackLayoutInput) {
  const targetLocalityId = String(localityId || '').trim();
  if (!targetLocalityId) {
    throw new Error('localityId is required');
  }

  const state = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const existingLayouts = (state.homepageLayouts || []).map((layout, index) => sanitizeLegacyHomepageLayout(layout, index));
  const fallbackLayout = fallbackLayoutInput && typeof fallbackLayoutInput === 'object'
    ? sanitizeLegacyHomepageLayout({
        ...fallbackLayoutInput,
        localityId: targetLocalityId,
      })
    : null;
  const existingLayout = existingLayouts.find((layout) => layout.localityId === targetLocalityId);
  const baseLayout = existingLayout || fallbackLayout || buildDefaultLegacyHomepageLayout(targetLocalityId);
  const nextLayout = sanitizeLegacyHomepageLayout({
    ...mutateLayout(baseLayout),
    localityId: targetLocalityId,
    id: String(baseLayout.id || `homepage_${targetLocalityId}`),
    updatedAt: new Date().toISOString(),
  });
  const nextLayouts = [
    ...existingLayouts.filter((layout) => layout.localityId !== targetLocalityId),
    nextLayout,
  ];
  const savedConfig = await writeHomepageConfig({
    ...state,
    homepageLayouts: nextLayouts,
  });
  const savedLayout = sanitizeLegacyHomepageLayout(
    (savedConfig?.homepageLayouts || []).find((layout) => String(layout.localityId || '') === targetLocalityId) || nextLayout,
  );
  return {
    config: savedConfig,
    layout: savedLayout,
    sections: savedLayout.sections || [],
  };
}

async function saveLegacyHomepageLayout(localityId, layoutInput) {
  const targetLocalityId = String(localityId || '').trim();
  if (!targetLocalityId) {
    throw new Error('localityId is required');
  }

  const state = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const existingLayouts = (state.homepageLayouts || []).map((layout, index) => sanitizeLegacyHomepageLayout(layout, index));
  const currentLayout = existingLayouts.find((layout) => layout.localityId === targetLocalityId) || null;
  const sanitizedLayout = sanitizeLegacyHomepageLayout({
    ...(layoutInput && typeof layoutInput === 'object' ? layoutInput : {}),
    localityId: targetLocalityId,
    id: String(
      (layoutInput && typeof layoutInput === 'object' && layoutInput.id)
        || currentLayout?.id
        || `homepage_${targetLocalityId}`
    ),
    updatedAt: new Date().toISOString(),
  });
  const nextLayouts = [
    ...existingLayouts.filter((layout) => layout.localityId !== targetLocalityId),
    sanitizedLayout,
  ];
  const savedConfig = await writeHomepageConfig({
    ...state,
    homepageLayouts: nextLayouts,
  });
  const savedLayout = sanitizeLegacyHomepageLayout(
    (savedConfig?.homepageLayouts || []).find((layout) => String(layout.localityId || '') === targetLocalityId) || sanitizedLayout,
  );
  return {
    config: savedConfig,
    layout: savedLayout,
    sections: savedLayout.sections || [],
  };
}

async function deleteLegacyHomepageLayout(localityId) {
  const targetLocalityId = String(localityId || '').trim();
  if (!targetLocalityId) {
    throw new Error('localityId is required');
  }

  const state = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const existingLayouts = (state.homepageLayouts || []).map((layout, index) => sanitizeLegacyHomepageLayout(layout, index));
  const deletedLayout = existingLayouts.find((layout) => layout.localityId === targetLocalityId) || null;
  const savedConfig = await writeHomepageConfig({
    ...state,
    homepageLayouts: existingLayouts.filter((layout) => layout.localityId !== targetLocalityId),
  });
  return {
    config: savedConfig,
    deletedLocalityId: targetLocalityId,
    deletedLayout,
  };
}

async function saveLegacyHomepageLayouts(layoutsInput) {
  const state = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const sanitizedLayouts = Array.isArray(layoutsInput)
    ? layoutsInput.map((layout, index) => sanitizeLegacyHomepageLayout(layout, index))
    : [];
  const savedConfig = await writeHomepageConfig({
    ...state,
    homepageLayouts: sanitizedLayouts,
  });
  return {
    config: savedConfig,
    layouts: (savedConfig?.homepageLayouts || []).map((layout, index) => sanitizeLegacyHomepageLayout(layout, index)),
  };
}

async function saveHomepageApiConfiguration(apiConfigurationInput) {
  const state = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const normalizedConfiguration = sanitizeHomepageConfig({
    ...state,
    apiConfiguration: apiConfigurationInput && typeof apiConfigurationInput === 'object'
      ? apiConfigurationInput
      : state.apiConfiguration,
  })?.apiConfiguration;
  if (!normalizedConfiguration) {
    throw new Error('apiConfiguration object is required');
  }
  const savedConfig = await writeHomepageConfig({
    ...state,
    apiConfiguration: normalizedConfiguration,
  });
  return {
    config: savedConfig,
    apiConfiguration: savedConfig.apiConfiguration,
  };
}

async function mutateHomepageConfigState(mutator) {
  const state = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({}) || {
    heroBanners: [],
    listingAds: [],
    coupons: [],
    homepageLayouts: [],
    localityCategoryLinks: [],
    communityItems: [],
    apiConfiguration: {
      syncMode: 'api',
      homepageConfigEndpoint: '/api/homepage-config',
      homepageDefaultsConfigEndpoint: '/api/homepage-defaults-config',
      localityRoutingConfigEndpoint: '/api/locality-routing-config',
      geographyConfigEndpoint: '/api/geography-config',
      taxonomyConfigEndpoint: '/api/business-taxonomy',
      seoDiscoveryConfigEndpoint: '/api/seo-discovery-config',
      scalableHomepageConfigEndpoint: '/api/scalable-homepage-config',
      resolvedHomepageEndpoint: '/api/resolved-homepage',
      publishResolvedHomepageEndpoint: '/api/resolved-homepage/publish',
      businessesEndpoint: '/api/businesses',
      auditEventsEndpoint: '/api/audit-events',
      autoSyncHomepage: true,
      autoSyncBusinesses: true,
    },
  };
  const nextState = sanitizeHomepageConfig(mutator(state));
  if (!nextState) {
    throw new Error('Invalid homepage config mutation');
  }
  const savedConfig = await writeHomepageConfig(nextState);
  return {
    config: savedConfig,
  };
}

async function readScalableCmsStateFromTables(client) {
  const [templatesResult, assignmentsResult, campaignsResult, snapshotsResult, appStateResult] = await Promise.all([
    client.query(`
      SELECT id, name, template_scope, locality_ids, status, priority, is_default, is_fallback, sections, metadata, updated_at
      FROM cms_templates
      ORDER BY priority DESC, updated_at DESC
    `),
    client.query(`
      SELECT id, locality_id, template_id, category_id, subcategory_id, pincode, status, priority, is_fallback, metadata, updated_at
      FROM cms_template_assignments
      ORDER BY priority DESC, updated_at DESC
    `),
    client.query(`
      SELECT id, name, campaign_type, status, priority, is_fallback, start_date, end_date, device_target, placement_keys, targets, max_items, payload, metadata, updated_at
      FROM cms_campaigns
      ORDER BY priority DESC, updated_at DESC
    `),
    client.query(`
      SELECT id, locality_id, category_id, subcategory_id, pincode, placement_key, device_target, page_type, payload, published_at, updated_at
      FROM published_homepage_snapshots
      ORDER BY updated_at DESC
    `),
    client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['scalable_cms_state'],
    ),
  ]);
  const mirroredState = sanitizeScalableCmsState(appStateResult.rows[0]?.value);

  if (
    templatesResult.rows.length === 0 &&
    assignmentsResult.rows.length === 0 &&
    campaignsResult.rows.length === 0 &&
    snapshotsResult.rows.length === 0
  ) {
    return mirroredState || null;
  }

  return sanitizeScalableCmsState({
    version: mirroredState?.version || 1,
    templates: templatesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      templateScope: row.template_scope,
      localityIds: row.locality_ids || [],
      status: row.status,
      priority: row.priority,
      isDefault: row.is_default,
      isFallback: row.is_fallback,
      sections: row.sections || [],
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    assignments: assignmentsResult.rows.map((row) => ({
      id: row.id,
      localityId: row.locality_id,
      templateId: row.template_id,
      categoryId: row.category_id || '',
      subcategoryId: row.subcategory_id || '',
      pincode: row.pincode || '',
      status: row.status,
      priority: row.priority,
      isFallback: row.is_fallback,
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    campaigns: campaignsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      campaignType: row.campaign_type,
      status: row.status,
      priority: row.priority,
      isFallback: row.is_fallback,
      startDate: row.start_date ? String(row.start_date) : '',
      endDate: row.end_date ? String(row.end_date) : '',
      deviceTarget: row.device_target,
      placementKeys: row.placement_keys || [],
      targets: row.targets || {},
      maxItems: row.max_items ?? undefined,
      payload: row.payload || {},
      metadata: row.metadata || {},
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    publishedSnapshots: snapshotsResult.rows.map((row) => ({
      id: row.id,
      localityId: row.locality_id,
      categoryId: row.category_id || '',
      subcategoryId: row.subcategory_id || '',
      pincode: row.pincode || '',
      placementKey: row.placement_key || '',
      deviceTarget: row.device_target,
      pageType: row.page_type,
      payload: row.payload || {},
      publishedAt: row.published_at?.toISOString?.() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString(),
    })),
    metadata: {
      seededFromLegacy: Boolean(mirroredState?.metadata?.seededFromLegacy),
      notes: mirroredState?.metadata?.notes || 'Loaded from relational CMS tables.',
      updatedAt: mirroredState?.metadata?.updatedAt || new Date().toISOString(),
    },
  });
}

async function deleteRowsMissingFromIdSet(client, tableName, ids) {
  const allowedTables = new Set([
    'cms_templates',
    'cms_template_assignments',
    'cms_campaigns',
    'published_homepage_snapshots',
  ]);
  if (!allowedTables.has(tableName)) {
    throw new Error(`Unsupported prune table: ${tableName}`);
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    await client.query(`DELETE FROM ${tableName}`);
    return;
  }
  await client.query(
    `DELETE FROM ${tableName}
     WHERE NOT (id = ANY($1::text[]))`,
    [ids],
  );
}

function addSyncEntityContext(error, entityType, entityId) {
  if (!error || typeof error !== 'object') {
    return new Error(`Failed syncing ${entityType} ${entityId}`);
  }
  error.message = `Failed syncing ${entityType} ${entityId}: ${error.message || 'Unknown database error'}`;
  error.syncEntityType = entityType;
  error.syncEntityId = entityId;
  return error;
}

async function syncScalableCmsStateToTables(_client, state) {
  await runInPgTransaction(async (client) => {
    for (const template of state.templates) {
      try {
        await client.query(
          `INSERT INTO cms_templates (id, name, template_scope, locality_ids, status, priority, is_default, is_fallback, sections, metadata, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::timestamptz)
           ON CONFLICT (id)
           DO UPDATE SET
             name = EXCLUDED.name,
             template_scope = EXCLUDED.template_scope,
             locality_ids = EXCLUDED.locality_ids,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             is_default = EXCLUDED.is_default,
             is_fallback = EXCLUDED.is_fallback,
             sections = EXCLUDED.sections,
             metadata = EXCLUDED.metadata,
             updated_at = EXCLUDED.updated_at`,
          [
            template.id,
            template.name,
            template.templateScope,
            template.localityIds,
            template.status,
            template.priority,
            template.isDefault,
            template.isFallback,
            JSON.stringify(template.sections || []),
            JSON.stringify(template.metadata || {}),
            template.updatedAt || new Date().toISOString(),
          ],
        );
      } catch (error) {
        throw addSyncEntityContext(error, 'scalable template', template.id);
      }
    }

    for (const assignment of state.assignments) {
      try {
        await client.query(
          `INSERT INTO cms_template_assignments (id, locality_id, template_id, category_id, subcategory_id, pincode, status, priority, is_fallback, metadata, updated_at)
           VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), $7, $8, $9, $10::jsonb, $11::timestamptz)
           ON CONFLICT (id)
           DO UPDATE SET
             locality_id = EXCLUDED.locality_id,
             template_id = EXCLUDED.template_id,
             category_id = EXCLUDED.category_id,
             subcategory_id = EXCLUDED.subcategory_id,
             pincode = EXCLUDED.pincode,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             is_fallback = EXCLUDED.is_fallback,
             metadata = EXCLUDED.metadata,
             updated_at = EXCLUDED.updated_at`,
          [
            assignment.id,
            assignment.localityId,
            assignment.templateId,
            assignment.categoryId || '',
            assignment.subcategoryId || '',
            assignment.pincode || '',
            assignment.status,
            assignment.priority,
            assignment.isFallback,
            JSON.stringify(assignment.metadata || {}),
            assignment.updatedAt || new Date().toISOString(),
          ],
        );
      } catch (error) {
        throw addSyncEntityContext(error, 'scalable assignment', assignment.id);
      }
    }

    for (const campaign of state.campaigns) {
      try {
        await client.query(
          `INSERT INTO cms_campaigns (id, name, campaign_type, status, priority, is_fallback, start_date, end_date, device_target, placement_keys, targets, max_items, payload, metadata, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::date, NULLIF($8, '')::date, $9, $10, $11::jsonb, $12, $13::jsonb, $14::jsonb, $15::timestamptz)
           ON CONFLICT (id)
           DO UPDATE SET
             name = EXCLUDED.name,
             campaign_type = EXCLUDED.campaign_type,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             is_fallback = EXCLUDED.is_fallback,
             start_date = EXCLUDED.start_date,
             end_date = EXCLUDED.end_date,
             device_target = EXCLUDED.device_target,
             placement_keys = EXCLUDED.placement_keys,
             targets = EXCLUDED.targets,
             max_items = EXCLUDED.max_items,
             payload = EXCLUDED.payload,
             metadata = EXCLUDED.metadata,
             updated_at = EXCLUDED.updated_at`,
          [
            campaign.id,
            campaign.name,
            campaign.campaignType,
            campaign.status,
            campaign.priority,
            campaign.isFallback,
            campaign.startDate || '',
            campaign.endDate || '',
            campaign.deviceTarget || 'all',
            campaign.placementKeys || [],
            JSON.stringify(campaign.targets || {}),
            campaign.maxItems ?? null,
            JSON.stringify(campaign.payload || {}),
            JSON.stringify(campaign.metadata || {}),
            campaign.updatedAt || new Date().toISOString(),
          ],
        );
      } catch (error) {
        throw addSyncEntityContext(error, 'scalable campaign', campaign.id);
      }
    }

    for (const snapshot of state.publishedSnapshots) {
      try {
        await client.query(
          `INSERT INTO published_homepage_snapshots (id, locality_id, category_id, subcategory_id, pincode, placement_key, device_target, page_type, payload, published_at, updated_at)
           VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), $7, $8, $9::jsonb, $10::timestamptz, $11::timestamptz)
           ON CONFLICT (id)
           DO UPDATE SET
             locality_id = EXCLUDED.locality_id,
             category_id = EXCLUDED.category_id,
             subcategory_id = EXCLUDED.subcategory_id,
             pincode = EXCLUDED.pincode,
             placement_key = EXCLUDED.placement_key,
             device_target = EXCLUDED.device_target,
             page_type = EXCLUDED.page_type,
             payload = EXCLUDED.payload,
             published_at = EXCLUDED.published_at,
             updated_at = EXCLUDED.updated_at`,
          [
            snapshot.id,
            snapshot.localityId,
            snapshot.categoryId || '',
            snapshot.subcategoryId || '',
            snapshot.pincode || '',
            snapshot.placementKey || '',
            snapshot.deviceTarget || 'all',
            snapshot.pageType || 'homepage',
            JSON.stringify(snapshot.payload || {}),
            snapshot.publishedAt || new Date().toISOString(),
            snapshot.updatedAt || new Date().toISOString(),
          ],
        );
      } catch (error) {
        throw addSyncEntityContext(error, 'published snapshot', snapshot.id);
      }
    }

    await deleteRowsMissingFromIdSet(client, 'published_homepage_snapshots', state.publishedSnapshots.map((snapshot) => snapshot.id));
    await deleteRowsMissingFromIdSet(client, 'cms_campaigns', state.campaigns.map((campaign) => campaign.id));
    await deleteRowsMissingFromIdSet(client, 'cms_template_assignments', state.assignments.map((assignment) => assignment.id));
    await deleteRowsMissingFromIdSet(client, 'cms_templates', state.templates.map((template) => template.id));

    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['scalable_cms_state', JSON.stringify(state)],
    );
  }, 'syncScalableCmsStateToTables');
}

async function readScalableCmsState() {
  const client = await getPgClient();
  if (client) {
    const fromTables = await readScalableCmsStateFromTables(client);
    if (fromTables) {
      memoryScalableCmsState = fromTables;
      return fromTables;
    }

    const appStateResult = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['scalable_cms_state'],
    );
    const appStateValue = sanitizeScalableCmsState(appStateResult.rows[0]?.value);
    if (appStateValue) {
      memoryScalableCmsState = appStateValue;
      return appStateValue;
    }
  }

  if (memoryScalableCmsState && typeof memoryScalableCmsState === 'object') {
    return memoryScalableCmsState;
  }

  try {
    const raw = await fs.readFile(scalableCmsStatePath, 'utf8');
    const data = sanitizeScalableCmsState(JSON.parse(raw));
    if (data) {
      memoryScalableCmsState = data;
      return data;
    }
  } catch {
    // Continue into legacy seeding fallback.
  }

  const legacyHomepageConfig = await readHomepageConfig();
  const businesses = await readBusinessListings();
  const seeded = buildScalableCmsSeedFromLegacy(legacyHomepageConfig, businesses);
  memoryScalableCmsState = seeded;
  return seeded;
}

async function writeScalableCmsState(config) {
  const sanitized = sanitizeScalableCmsState(config);
  if (!sanitized) throw new Error('Invalid scalable CMS payload');

  const client = await getPgClient();
  if (client) {
    await syncScalableCmsStateToTables(client, sanitized);
    memoryScalableCmsState = sanitized;
    return sanitized;
  }

  try {
    await fs.writeFile(scalableCmsStatePath, JSON.stringify(sanitized, null, 2), 'utf8');
    memoryScalableCmsState = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('scalable-cms-state.json write failed, using in-memory CMS store:', err?.message || err);
    memoryScalableCmsState = sanitized;
    return sanitized;
  }
}

async function saveScalableTemplateEntity(templateInput) {
  const template = sanitizeScalableTemplate(templateInput);
  if (!template?.id) {
    throw new Error('Template id is required');
  }

  const state = await readScalableCmsState();
  const conflictingDefault = template.isDefault && template.status === 'active'
    ? state.templates.find((entry) => (
      entry.id !== template.id &&
      entry.isDefault &&
      entry.status === 'active'
    ))
    : null;
  if (conflictingDefault) {
    throw new Error(`Only one active default template is allowed. "${conflictingDefault.name}" is already active as the default template.`);
  }
  const nextTemplates = state.templates.some((entry) => entry.id === template.id)
    ? state.templates.map((entry) => (entry.id === template.id ? template : entry))
    : [template, ...state.templates];

  const nextState = await writeScalableCmsState({
    ...state,
    templates: nextTemplates,
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    config: nextState,
    template: nextState.templates.find((entry) => entry.id === template.id) || template,
  };
}

async function deleteScalableTemplateEntity(templateId) {
  const targetId = String(templateId || '').trim();
  if (!targetId) {
    throw new Error('Template id is required');
  }

  const state = await readScalableCmsState();
  const deletedAssignmentIds = state.assignments
    .filter((assignment) => assignment.templateId === targetId)
    .map((assignment) => assignment.id);
  const nextState = await writeScalableCmsState({
    ...state,
    templates: state.templates.filter((template) => template.id !== targetId),
    assignments: state.assignments.filter((assignment) => assignment.templateId !== targetId),
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    config: nextState,
    deletedTemplateId: targetId,
    deletedAssignmentIds,
  };
}

async function mutateScalableTemplateSections(templateId, mutateSections) {
  const targetId = String(templateId || '').trim();
  if (!targetId) {
    throw new Error('Template id is required');
  }

  const state = await readScalableCmsState();
  const existingTemplate = state.templates.find((template) => template.id === targetId);
  if (!existingTemplate) {
    throw new Error('Template not found');
  }

  const nextSectionsInput = mutateSections((existingTemplate.sections || []).map((section) => cloneJson(section, section)));
  if (!Array.isArray(nextSectionsInput)) {
    throw new Error('Template sections must resolve to an array');
  }

  const nextTemplate = sanitizeScalableTemplate({
    ...existingTemplate,
    sections: nextSectionsInput,
    metadata: {
      ...(existingTemplate.metadata || {}),
      updatedFrom: 'admin_console',
      detachedFromLegacySync: true,
    },
    updatedAt: new Date().toISOString(),
  });

  const result = await saveScalableTemplateEntity(nextTemplate);
  return {
    ...result,
    template: result.template,
    sections: result.template.sections || [],
  };
}

async function syncScalableTemplateSectionsFromLocality(templateId, localityId) {
  const targetId = String(templateId || '').trim();
  const sourceLocalityId = String(localityId || '').trim();
  if (!targetId) {
    throw new Error('Template id is required');
  }
  if (!sourceLocalityId) {
    throw new Error('localityId is required');
  }

  const [state, homepageConfig] = await Promise.all([
    readScalableCmsState(),
    readHomepageConfig(),
  ]);
  const targetTemplate = state.templates.find((template) => template.id === targetId);
  if (!targetTemplate) {
    throw new Error('Template not found');
  }

  const sourceLayout = (homepageConfig?.homepageLayouts || []).find((layout) => String(layout.localityId || '') === sourceLocalityId);
  if (!sourceLayout) {
    throw new Error('No homepage layout found for the selected locality');
  }

  const nextTemplate = sanitizeScalableTemplate({
    ...targetTemplate,
    sections: sanitizeTemplateSections(sourceLayout.sections),
    metadata: {
      ...(targetTemplate.metadata || {}),
      lastSectionSyncLocalityId: sourceLocalityId,
      detachedFromLegacySync: false,
    },
    updatedAt: new Date().toISOString(),
  });

  const result = await saveScalableTemplateEntity(nextTemplate);
  return {
    ...result,
    template: result.template,
    sections: result.template.sections || [],
    syncedFromLocalityId: sourceLocalityId,
  };
}

async function syncScalableLegacyLayouts(localityIds = []) {
  const [state, homepageConfig] = await Promise.all([
    readScalableCmsState(),
    readHomepageConfig(),
  ]);
  const requestedLocalityIds = normalizeStringList(localityIds);
  const sourceLayouts = (homepageConfig?.homepageLayouts || [])
    .filter((layout) => layout && typeof layout === 'object')
    .filter((layout) => requestedLocalityIds.length === 0 || requestedLocalityIds.includes(String(layout.localityId || '')));

  let nextState = syncScalableTemplatesFromLegacyLayouts(state, sourceLayouts);
  nextState = syncScalableAssignmentsFromLegacyLayouts(nextState, sourceLayouts);
  const savedState = await writeScalableCmsState(nextState);
  return {
    config: savedState,
    localityIds: sourceLayouts.map((layout) => String(layout.localityId || '')).filter(Boolean),
    summary: {
      templates: savedState.templates.length,
      assignments: savedState.assignments.length,
    },
  };
}

async function syncScalableLegacyCampaigns(options = {}) {
  const [state, homepageConfig, businesses] = await Promise.all([
    readScalableCmsState(),
    readHomepageConfig(),
    readBusinessListings(),
  ]);
  const requestedLocalityIds = normalizeStringList(options.localityIds);
  const hasExplicitSourceTags = options && Object.prototype.hasOwnProperty.call(options, 'sourceTags');
  const requestedSourceTags = hasExplicitSourceTags
    ? normalizeLegacyScalableCampaignSourceTags(options.sourceTags)
    : [...LEGACY_SCALABLE_CAMPAIGN_SOURCE_TAGS];

  if (hasExplicitSourceTags && requestedSourceTags.length === 0) {
    throw new Error('At least one supported legacy campaign source tag is required');
  }

  const legacyCampaignSources = buildLegacyScalableCampaignSources(homepageConfig, businesses);
  let nextState = state;

  for (const sourceTag of requestedSourceTags) {
    const sourceEntry = legacyCampaignSources[sourceTag];
    if (!sourceEntry) continue;
    const scopedCampaigns = requestedLocalityIds.length === 0
      ? sourceEntry.campaigns
      : sourceEntry.campaigns.filter((campaign) => {
        const campaignLocalityIds = normalizeStringList(campaign.targets?.localityIds);
        return campaignLocalityIds.some((localityId) => requestedLocalityIds.includes(localityId));
      });
    nextState = syncScalableCampaignCollection(
      nextState,
      sourceEntry.campaignType,
      scopedCampaigns,
      sourceTag,
    );
  }

  const savedState = await writeScalableCmsState(nextState);
  const effectiveLocalityIds = requestedLocalityIds.length > 0
    ? requestedLocalityIds
    : Array.from(new Set(
      requestedSourceTags.flatMap((sourceTag) => (
        legacyCampaignSources[sourceTag]?.campaigns.flatMap((campaign) => normalizeStringList(campaign.targets?.localityIds)) || []
      )),
    ));

  return {
    config: savedState,
    sourceTags: requestedSourceTags,
    localityIds: effectiveLocalityIds,
    summary: {
      campaigns: savedState.campaigns.length,
      ownership: buildScalableLegacyOwnershipSummary(savedState),
      syncedCampaignsBySource: requestedSourceTags.map((sourceTag) => ({
        sourceTag,
        campaigns: requestedLocalityIds.length === 0
          ? (legacyCampaignSources[sourceTag]?.campaigns.length || 0)
          : (legacyCampaignSources[sourceTag]?.campaigns || []).filter((campaign) => (
            normalizeStringList(campaign.targets?.localityIds).some((localityId) => requestedLocalityIds.includes(localityId))
          )).length,
      })),
    },
  };
}

async function saveScalableAssignmentEntity(assignmentInput) {
  const assignment = sanitizeTemplateAssignment(assignmentInput);
  if (!assignment?.id || !assignment.templateId) {
    throw new Error('Assignment id and templateId are required');
  }

  const state = await readScalableCmsState();
  const nextAssignments = state.assignments.some((entry) => entry.id === assignment.id)
    ? state.assignments.map((entry) => (entry.id === assignment.id ? assignment : entry))
    : [assignment, ...state.assignments];

  const nextState = await writeScalableCmsState({
    ...state,
    assignments: nextAssignments,
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    config: nextState,
    assignment: nextState.assignments.find((entry) => entry.id === assignment.id) || assignment,
  };
}

async function deleteScalableAssignmentEntity(assignmentId) {
  const targetId = String(assignmentId || '').trim();
  if (!targetId) {
    throw new Error('Assignment id is required');
  }

  const state = await readScalableCmsState();
  const nextState = await writeScalableCmsState({
    ...state,
    assignments: state.assignments.filter((assignment) => assignment.id !== targetId),
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    config: nextState,
    deletedAssignmentId: targetId,
  };
}

async function saveScalableCampaignEntity(campaignInput) {
  const campaign = sanitizeCampaign(campaignInput);
  if (!campaign?.id) {
    throw new Error('Campaign id is required');
  }

  const state = await readScalableCmsState();
  const nextCampaigns = state.campaigns.some((entry) => entry.id === campaign.id)
    ? state.campaigns.map((entry) => (entry.id === campaign.id ? campaign : entry))
    : [campaign, ...state.campaigns];

  const nextState = await writeScalableCmsState({
    ...state,
    campaigns: nextCampaigns,
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    config: nextState,
    campaign: nextState.campaigns.find((entry) => entry.id === campaign.id) || campaign,
  };
}

async function deleteScalableCampaignEntity(campaignId) {
  const targetId = String(campaignId || '').trim();
  if (!targetId) {
    throw new Error('Campaign id is required');
  }

  const state = await readScalableCmsState();
  const nextState = await writeScalableCmsState({
    ...state,
    campaigns: state.campaigns.filter((campaign) => campaign.id !== targetId),
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    config: nextState,
    deletedCampaignId: targetId,
  };
}

function mergePublishedSnapshots(existingSnapshots, nextSnapshots) {
  const snapshotMap = new Map((Array.isArray(existingSnapshots) ? existingSnapshots : []).map((snapshot) => [snapshot.id, snapshot]));
  (Array.isArray(nextSnapshots) ? nextSnapshots : []).forEach((snapshot) => {
    if (!snapshot?.id) return;
    snapshotMap.set(snapshot.id, sanitizePublishedSnapshot(snapshot));
  });
  return Array.from(snapshotMap.values())
    .map((snapshot) => sanitizePublishedSnapshot(snapshot))
    .sort((left, right) => Date.parse(right.publishedAt || right.updatedAt || '') - Date.parse(left.publishedAt || left.updatedAt || ''));
}

async function publishResolvedHomepageSnapshotsFromRequest(requestBody) {
  const [cmsState, legacyConfig, businesses] = await Promise.all([
    readScalableCmsState(),
    readHomepageConfig(),
    readBusinessListings(),
  ]);
  const knownLocalityIds = Array.from(new Set([
    ...(cmsState.assignments || []).map((assignment) => assignment.localityId).filter(Boolean),
    ...(cmsState.templates || []).flatMap((template) => template.localityIds || []).filter(Boolean),
    ...((legacyConfig?.homepageLayouts || []).map((layout) => String(layout.localityId || '')).filter(Boolean)),
    ...((Array.isArray(businesses) ? businesses : []).map((business) => String(business.localityId || '')).filter(Boolean)),
  ]));
  const contexts = buildPublishContexts(requestBody || {}, knownLocalityIds);
  if (contexts.length === 0) {
    throw new Error('No publish contexts were provided');
  }

  const nextSnapshots = [];
  for (const context of contexts) {
    const payload = await resolveHomepageForContext(context);
    nextSnapshots.push({
      id: buildSnapshotId(context),
      localityId: context.localityId,
      categoryId: context.categoryId || '',
      subcategoryId: context.subcategoryId || '',
      pincode: context.pincode || '',
      placementKey: context.placementKey || '',
      deviceTarget: context.device || 'all',
      pageType: context.pageType || 'homepage',
      payload,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const savedState = await writeScalableCmsState({
    ...cmsState,
    publishedSnapshots: mergePublishedSnapshots(cmsState.publishedSnapshots || [], nextSnapshots),
    metadata: {
      ...(cmsState.metadata || {}),
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    contexts,
    snapshots: nextSnapshots,
    publishedSnapshots: savedState.publishedSnapshots,
    totalSnapshots: savedState.publishedSnapshots.length,
  };
}

async function deleteResolvedHomepageSnapshotsFromRequest(requestBody) {
  const cmsState = await readScalableCmsState();
  const knownLocalityIds = Array.from(new Set([
    ...(cmsState.assignments || []).map((assignment) => assignment.localityId).filter(Boolean),
    ...(cmsState.templates || []).flatMap((template) => template.localityIds || []).filter(Boolean),
    ...((cmsState.publishedSnapshots || []).map((snapshot) => String(snapshot.localityId || '')).filter(Boolean)),
  ]));
  const shouldDeleteSnapshot = buildSnapshotDeletionPredicate(requestBody || {}, knownLocalityIds);
  const existingSnapshots = cmsState.publishedSnapshots || [];
  const deletedSnapshots = existingSnapshots.filter((snapshot) => shouldDeleteSnapshot(snapshot));
  const remainingSnapshots = existingSnapshots.filter((snapshot) => !shouldDeleteSnapshot(snapshot));
  const deletedCount = existingSnapshots.length - remainingSnapshots.length;

  if (deletedCount === 0) {
    throw new Error('No published snapshots matched the delete request.');
  }

  const savedState = await writeScalableCmsState({
    ...cmsState,
    publishedSnapshots: remainingSnapshots,
    metadata: {
      ...(cmsState.metadata || {}),
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    deletedCount,
    deletedSnapshotIds: deletedSnapshots.map((snapshot) => snapshot.id),
    publishedSnapshots: savedState.publishedSnapshots,
    remainingSnapshots: savedState.publishedSnapshots.length,
  };
}

function matchesDateRange(startDate, endDate, contextDate) {
  const current = String(contextDate || new Date().toISOString().slice(0, 10));
  if (startDate && String(startDate) > current) return false;
  if (endDate && String(endDate) < current) return false;
  return true;
}

function calculateTargetScore(targets, context) {
  const target = normalizeTargetingRule(targets);
  let score = 0;
  const localityId = String(context.localityId || '');
  const categoryId = String(context.categoryId || '');
  const subcategoryId = String(context.subcategoryId || '');
  const pincode = String(context.pincode || '');
  const device = String(context.device || 'all');
  const pageType = String(context.pageType || 'homepage');
  const placementKey = String(context.placementKey || '');

  if (target.localityIds.length > 0) {
    if (!localityId || !target.localityIds.includes(localityId)) return -1;
    score += 100;
  }
  if (target.categoryIds.length > 0) {
    if (!categoryId || !target.categoryIds.includes(categoryId)) return -1;
    score += 40;
  }
  if (target.subcategoryIds.length > 0) {
    if (!subcategoryId || !target.subcategoryIds.includes(subcategoryId)) return -1;
    score += 60;
  }
  if (target.pincodes.length > 0) {
    if (!pincode || !target.pincodes.includes(pincode)) return -1;
    score += 30;
  }
  if (target.devices.length > 0 && !target.devices.includes('all')) {
    if (!device || !target.devices.includes(device)) return -1;
    score += 15;
  }
  if (target.pageTypes.length > 0) {
    if (!pageType || !target.pageTypes.includes(pageType)) return -1;
    score += 10;
  }
  if (target.placementKeys.length > 0) {
    if (!placementKey || !target.placementKeys.includes(placementKey)) return -1;
    score += 10;
  }
  return score;
}

function calculateAssignmentScore(assignment, context) {
  let score = 0;
  const localityId = String(context.localityId || '');
  const categoryId = String(context.categoryId || '');
  const subcategoryId = String(context.subcategoryId || '');
  const pincode = String(context.pincode || '');
  if (!assignment.localityId || assignment.localityId !== localityId) return -1;
  score += 100;
  if (assignment.categoryId) {
    if (assignment.categoryId !== categoryId) return -1;
    score += 40;
  }
  if (assignment.subcategoryId) {
    if (assignment.subcategoryId !== subcategoryId) return -1;
    score += 60;
  }
  if (assignment.pincode) {
    if (assignment.pincode !== pincode) return -1;
    score += 30;
  }
  return score;
}

function calculateTemplateScore(template, context) {
  if (!template || template.status !== 'active') return -1;

  const localityId = String(context.localityId || '');
  const localityIds = normalizeStringList(template.localityIds);
  const templateScope = String(template.templateScope || 'locality');
  let score = 0;

  if (templateScope === 'locality') {
    if (localityIds.length > 0) {
      if (!localityId || !localityIds.includes(localityId)) return -1;
      score += 140;
    } else {
      score += template.isFallback ? 35 : 15;
    }
  } else if (templateScope === 'city') {
    if (localityIds.length === 0) return -1;
    if (!localityId || !localityIds.includes(localityId)) return -1;
    score += 100;
  } else if (templateScope === 'global') {
    if (localityIds.length > 0) {
      if (!localityId || !localityIds.includes(localityId)) return -1;
      score += 70;
    } else {
      score += 40;
    }
  }

  score += template.isFallback ? -25 : 25;
  return score;
}

function selectTemplateForContext(state, context, legacyConfig) {
  const templatesById = new Map(state.templates.map((template) => [template.id, template]));
  const matchingAssignment = state.assignments
    .filter((assignment) => assignment.status === 'active')
    .map((assignment) => ({
      assignment,
      score: calculateAssignmentScore(assignment, context),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => (right.score + right.assignment.priority) - (left.score + left.assignment.priority))[0];

  if (matchingAssignment) {
    const template = templatesById.get(matchingAssignment.assignment.templateId);
    if (template && template.status === 'active') return template;
  }

  const scopedTemplate = state.templates
    .filter((template) => template && typeof template === 'object')
    .filter((template) => !template.isDefault)
    .map((template) => ({
      template,
      score: calculateTemplateScore(template, context),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => (right.score + right.template.priority) - (left.score + left.template.priority))[0];

  if (scopedTemplate?.template) {
    return scopedTemplate.template;
  }

  const defaultTemplate = state.templates
    .filter((template) => template && typeof template === 'object')
    .filter((template) => template.isDefault && template.status === 'active')
    .sort((left, right) => right.priority - left.priority)[0];

  if (defaultTemplate) {
    return defaultTemplate;
  }

  const legacyLayout = (legacyConfig?.homepageLayouts || []).find((layout) => String(layout.localityId || '') === String(context.localityId || ''));
  if (!legacyLayout) return null;
  return sanitizeScalableTemplate({
    id: `legacy_tpl_${String(legacyLayout.id || legacyLayout.localityId || 'default')}`,
    name: String(legacyLayout.name || `${legacyLayout.localityId || 'default'} Homepage Template`),
    templateScope: 'locality',
    localityIds: [String(legacyLayout.localityId || '')],
    status: legacyLayout.status === 'inactive' ? 'inactive' : 'active',
    priority: 10,
    isDefault: false,
    isFallback: true,
    sections: legacyLayout.sections || [],
    metadata: { source: 'legacy_homepage_layout_fallback' },
    updatedAt: legacyLayout.updatedAt || new Date().toISOString(),
  });
}

function filterActiveTemplateSections(template, context) {
  return (template?.sections || [])
    .filter((section) => section && typeof section === 'object')
    .filter((section) => String(section.status || 'active') === 'active')
    .filter((section) => section.visible !== false)
    .filter((section) => matchesDateRange(section.startDate, section.endDate, context.date))
    .filter((section) => {
      const localityIds = normalizeStringList(section.localityIds);
      if (localityIds.length > 0 && !localityIds.includes(String(context.localityId || ''))) return false;
      const pincodes = normalizeStringList(section.pincodes);
      if (pincodes.length > 0 && (!context.pincode || !pincodes.includes(String(context.pincode || '')))) return false;
      return true;
    })
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
}

function resolveCampaignPayloads(state, context, campaignType) {
  return state.campaigns
    .filter((campaign) => campaign.campaignType === campaignType)
    .filter((campaign) => campaign.status === 'active')
    .filter((campaign) => matchesDateRange(campaign.startDate, campaign.endDate, context.date))
    .map((campaign) => ({
      campaign,
      score: calculateTargetScore(campaign.targets, context),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => (right.score + right.campaign.priority) - (left.score + left.campaign.priority))
    .map((entry) => entry.campaign);
}

function buildSnapshotId(context) {
  const locality = String(context.localityId || 'global');
  const category = String(context.categoryId || 'all');
  const subcategory = String(context.subcategoryId || 'all');
  const pincode = String(context.pincode || 'all');
  const placementKey = String(context.placementKey || 'all');
  const device = String(context.device || 'all');
  const pageType = String(context.pageType || 'homepage');
  return `snapshot_${locality}_${category}_${subcategory}_${pincode}_${placementKey}_${device}_${pageType}`;
}

function buildLegacySnapshotId(context) {
  const locality = String(context.localityId || 'global');
  const category = String(context.categoryId || 'all');
  const subcategory = String(context.subcategoryId || 'all');
  const pincode = String(context.pincode || 'all');
  const device = String(context.device || 'all');
  const pageType = String(context.pageType || 'homepage');
  return `snapshot_${locality}_${category}_${subcategory}_${pincode}_${device}_${pageType}`;
}

function sortBusinessesForHomepage(businesses, sponsoredBusinessIds) {
  const sponsoredIds = sponsoredBusinessIds instanceof Set ? sponsoredBusinessIds : new Set();
  return [...businesses].sort((left, right) => {
    if (sponsoredIds.has(left.id) && !sponsoredIds.has(right.id)) return -1;
    if (!sponsoredIds.has(left.id) && sponsoredIds.has(right.id)) return 1;
    if (left.isSponsored && !right.isSponsored) return -1;
    if (!left.isSponsored && right.isSponsored) return 1;
    if (left.featured && !right.featured) return -1;
    if (!left.featured && right.featured) return 1;
    if (Number(right.rating || 0) !== Number(left.rating || 0)) return Number(right.rating || 0) - Number(left.rating || 0);
    return String(left.name || '').localeCompare(String(right.name || ''));
  });
}

function getResolvedSectionBusinessLimit(section) {
  const numericCandidates = [
    Number(section?.maxItems || 0),
    Number(section?.visibleSlots || 0),
    Number(section?.desktopCardCount || 0),
    Number(section?.mobileCardCount || 0),
  ].filter((value) => Number.isFinite(value) && value > 0);
  const base = numericCandidates.length > 0 ? Math.max(...numericCandidates) : 6;
  return Math.min(Math.max(base * 3, base), 24);
}

function resolveSectionBusinessIdsBySection(sections, businesses, sponsoredListings, context) {
  const homepageBusinessSections = new Set([
    'featured_businesses',
    'business_shelf',
    'text_business_strip',
    'verified_business_grid',
  ]);
  const sponsoredBusinessIds = new Set((sponsoredListings || []).map((business) => String(business.id || '')).filter(Boolean));
  const approvedBusinesses = Array.isArray(businesses)
    ? businesses.filter((business) => business && typeof business === 'object')
        .filter((business) => String(business.status || '') === 'approved')
        .filter((business) => String(business.localityId || '') === String(context.localityId || ''))
    : [];
  const sortedBusinesses = sortBusinessesForHomepage(approvedBusinesses, sponsoredBusinessIds);
  const lookup = new Map(sortedBusinesses.map((business) => [String(business.id || ''), business]));

  return Object.fromEntries((sections || [])
    .filter((section) => section && typeof section === 'object')
    .filter((section) => homepageBusinessSections.has(String(section.sectionType || '')))
    .map((section) => {
      const scopedBusinesses = sortedBusinesses
        .filter((business) => !section.categoryId || String(business.categoryId || '') === String(section.categoryId || ''))
        .filter((business) => !section.subcategoryId || String(business.subcategoryId || '') === String(section.subcategoryId || ''));

      let sectionBusinesses = [];
      if (String(section.listingSourceMode || 'auto') === 'manual' && Array.isArray(section.pinnedBusinessIds) && section.pinnedBusinessIds.length > 0) {
        sectionBusinesses = section.pinnedBusinessIds
          .map((businessId) => lookup.get(String(businessId || '')))
          .filter(Boolean);
      } else if (String(section.sectionType || '') === 'featured_businesses') {
        sectionBusinesses = scopedBusinesses.filter((business) => business.featured);
      } else if (String(section.sectionType || '') === 'verified_business_grid') {
        sectionBusinesses = scopedBusinesses.filter((business) => business.featured !== true);
      } else {
        sectionBusinesses = scopedBusinesses;
      }

      return [
        String(section.id || ''),
        sectionBusinesses
          .slice(0, getResolvedSectionBusinessLimit(section))
          .map((business) => String(business.id || ''))
          .filter(Boolean),
      ];
    })
    .filter(([sectionId]) => Boolean(sectionId)));
}

async function resolveHomepageForContext(context, preloaded = {}) {
  const [state, legacyConfig, businesses] = await Promise.all([
    preloaded.state || readScalableCmsState(),
    preloaded.legacyConfig || readHomepageConfig(),
    preloaded.businesses || readBusinessListings(),
  ]);
  const effectiveContext = {
    localityId: String(context.localityId || ''),
    categoryId: String(context.categoryId || ''),
    subcategoryId: String(context.subcategoryId || ''),
    pincode: String(context.pincode || ''),
    device: ['mobile', 'desktop'].includes(String(context.device || '')) ? String(context.device) : 'all',
    pageType: String(context.pageType || 'homepage'),
    placementKey: String(context.placementKey || ''),
    date: String(context.date || new Date().toISOString().slice(0, 10)),
  };
  const template = selectTemplateForContext(state, effectiveContext, legacyConfig || {});
  const sections = filterActiveTemplateSections(template, effectiveContext);
  const sponsoredCampaigns = resolveCampaignPayloads(state, effectiveContext, 'sponsored_listing');
  const businessMap = new Map((Array.isArray(businesses) ? businesses : []).map((business) => [String(business.id || ''), business]));
  const sponsoredListings = sponsoredCampaigns
    .flatMap((campaign) => normalizeStringList(campaign.payload?.businessIds).map((businessId) => businessMap.get(businessId)).filter(Boolean))
    .slice(0, 10);
  const sectionBusinessIdsBySection = resolveSectionBusinessIdsBySection(
    sections,
    Array.isArray(businesses) ? businesses : [],
    sponsoredListings,
    effectiveContext,
  );

  return {
    context: effectiveContext,
    template: template ? {
      id: template.id,
      name: template.name,
      templateScope: template.templateScope,
      isFallback: template.isFallback,
    } : null,
    sections,
    sectionBusinessIdsBySection,
    heroBanners: resolveCampaignPayloads(state, effectiveContext, 'hero_banner').map((campaign) => campaign.payload),
    listingAds: resolveCampaignPayloads(state, effectiveContext, 'listing_ad').map((campaign) => campaign.payload),
    sponsoredListings,
    sponsoredCampaigns: sponsoredCampaigns.map((campaign) => campaign.payload),
    offers: resolveCampaignPayloads(state, effectiveContext, 'offer').map((campaign) => campaign.payload),
    contentBlocks: resolveCampaignPayloads(state, effectiveContext, 'content_block').map((campaign) => campaign.payload),
    resolvedAt: new Date().toISOString(),
  };
}

function calculatePublishedSnapshotScore(snapshot, context) {
  if (!snapshot || typeof snapshot !== 'object') return -1;

  const localityId = String(context.localityId || '');
  const categoryId = String(context.categoryId || '');
  const subcategoryId = String(context.subcategoryId || '');
  const pincode = String(context.pincode || '');
  const placementKey = String(context.placementKey || '');
  const device = String(context.device || 'all');
  const pageType = String(context.pageType || 'homepage');

  if (String(snapshot.localityId || '') !== localityId) return -1;

  let score = 100;
  const snapshotCategoryId = String(snapshot.categoryId || '');
  const snapshotSubcategoryId = String(snapshot.subcategoryId || '');
  const snapshotPincode = String(snapshot.pincode || '');
  const snapshotPlacementKey = String(snapshot.placementKey || '');
  const snapshotDeviceTarget = String(snapshot.deviceTarget || 'all');
  const snapshotPageType = String(snapshot.pageType || 'homepage');

  if (snapshotCategoryId) {
    if (!categoryId || snapshotCategoryId !== categoryId) return -1;
    score += 40;
  }
  if (snapshotSubcategoryId) {
    if (!subcategoryId || snapshotSubcategoryId !== subcategoryId) return -1;
    score += 60;
  }
  if (snapshotPincode) {
    if (!pincode || snapshotPincode !== pincode) return -1;
    score += 30;
  }
  if (snapshotPlacementKey) {
    if (!placementKey || snapshotPlacementKey !== placementKey) return -1;
    score += 10;
  }
  if (snapshotDeviceTarget && snapshotDeviceTarget !== 'all') {
    if (!device || snapshotDeviceTarget !== device) return -1;
    score += 15;
  }
  if (snapshotPageType) {
    if (!pageType || snapshotPageType !== pageType) return -1;
    score += 10;
  }

  return score;
}

function findPublishedSnapshotMatch(state, context) {
  const snapshotId = buildSnapshotId(context);
  const exactSnapshot = (state.publishedSnapshots || []).find((snapshot) => snapshot.id === snapshotId);
  if (exactSnapshot) {
    return {
      snapshot: exactSnapshot,
      strategy: 'exact_snapshot_id',
      score: calculatePublishedSnapshotScore(exactSnapshot, context),
      requestedSnapshotId: snapshotId,
      legacySnapshotId: buildLegacySnapshotId(context),
    };
  }

  const legacySnapshotId = buildLegacySnapshotId(context);
  const legacySnapshot = (state.publishedSnapshots || []).find((snapshot) => snapshot.id === legacySnapshotId);
  if (legacySnapshot) {
    return {
      snapshot: legacySnapshot,
      strategy: 'legacy_snapshot_id',
      score: calculatePublishedSnapshotScore(legacySnapshot, context),
      requestedSnapshotId: snapshotId,
      legacySnapshotId,
    };
  }

  const matchingSnapshot = (state.publishedSnapshots || [])
    .map((snapshot) => ({
      snapshot,
      score: calculatePublishedSnapshotScore(snapshot, context),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.snapshot.updatedAt || right.snapshot.publishedAt || 0).getTime()
        - new Date(left.snapshot.updatedAt || left.snapshot.publishedAt || 0).getTime();
    })[0];

  if (!matchingSnapshot?.snapshot) return null;
  return {
    snapshot: matchingSnapshot.snapshot,
    strategy: 'best_matching_snapshot',
    score: matchingSnapshot.score,
    requestedSnapshotId: snapshotId,
    legacySnapshotId,
  };
}

function buildPublishContexts(input, localityIds) {
  if (Array.isArray(input?.contexts) && input.contexts.length > 0) {
    return input.contexts
      .filter((context) => context && typeof context === 'object')
      .map((context) => ({
        localityId: String(context.localityId || ''),
        categoryId: String(context.categoryId || ''),
        subcategoryId: String(context.subcategoryId || ''),
        pincode: String(context.pincode || ''),
        placementKey: String(context.placementKey || ''),
        device: ['mobile', 'desktop'].includes(String(context.device || '')) ? String(context.device) : 'all',
        pageType: String(context.pageType || 'homepage'),
      }))
      .filter((context) => context.localityId);
  }

  const requestedLocalities = Array.isArray(input?.localityIds) && input.localityIds.length > 0
    ? normalizeStringList(input.localityIds)
    : localityIds;
  const categoryIds = Array.isArray(input?.categoryIds) && input.categoryIds.length > 0
    ? [''].concat(normalizeStringList(input.categoryIds))
    : [''];
  const subcategoryIds = Array.isArray(input?.subcategoryIds) && input.subcategoryIds.length > 0
    ? [''].concat(normalizeStringList(input.subcategoryIds))
    : [''];
  const pincodes = Array.isArray(input?.pincodes) && input.pincodes.length > 0
    ? [''].concat(normalizeStringList(input.pincodes))
    : [''];
  const placementKeys = Array.isArray(input?.placementKeys) && input.placementKeys.length > 0
    ? [''].concat(normalizeStringList(input.placementKeys))
    : [''];
  const devices = Array.isArray(input?.deviceTargets) && input.deviceTargets.length > 0
    ? normalizeStringList(input.deviceTargets).filter((device) => ['all', 'mobile', 'desktop'].includes(device))
    : ['all'];
  const pageTypes = Array.isArray(input?.pageTypes) && input.pageTypes.length > 0
    ? normalizeStringList(input.pageTypes)
    : ['homepage'];

  return requestedLocalities.flatMap((localityId) => (
    categoryIds.flatMap((categoryId) => (
      subcategoryIds.flatMap((subcategoryId) => (
        pincodes.flatMap((pincode) => (
          placementKeys.flatMap((placementKey) => (
            devices.flatMap((device) => (
              pageTypes.map((pageType) => ({
                localityId,
                categoryId,
                subcategoryId,
                pincode,
                placementKey,
                device,
                pageType,
              }))
            ))
          ))
        ))
      ))
    ))
  )).filter((context) => context.localityId);
}

function doesSnapshotMatchContext(snapshot, context) {
  return String(snapshot.localityId || '') === String(context.localityId || '')
    && String(snapshot.categoryId || '') === String(context.categoryId || '')
    && String(snapshot.subcategoryId || '') === String(context.subcategoryId || '')
    && String(snapshot.pincode || '') === String(context.pincode || '')
    && String(snapshot.placementKey || '') === String(context.placementKey || '')
    && String(snapshot.deviceTarget || 'all') === String(context.device || 'all')
    && String(snapshot.pageType || 'homepage') === String(context.pageType || 'homepage');
}

function buildSnapshotDeletionPredicate(input, knownLocalityIds) {
  const snapshotIds = Array.isArray(input?.snapshotIds) && input.snapshotIds.length > 0
    ? new Set(normalizeStringList(input.snapshotIds))
    : null;

  if (snapshotIds && snapshotIds.size > 0) {
    return (snapshot) => snapshotIds.has(String(snapshot.id || ''));
  }

  const contexts = buildPublishContexts(input || {}, knownLocalityIds);
  if (contexts.length > 0) {
    return (snapshot) => contexts.some((context) => doesSnapshotMatchContext(snapshot, context));
  }

  return () => false;
}

async function ensureBootstrapUsers() {
  const users = await readUsers();
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@localsy.test';
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@12345';
  const devEmail = process.env.BOOTSTRAP_DEV_EMAIL || 'dev@localsy.test';
  const devPassword = process.env.BOOTSTRAP_DEV_PASSWORD || 'Dev@12345';
  const seed = users.length > 0 ? users : [
    {
      id: randomId('usr'),
      name: 'Platform Admin',
      email: adminEmail.toLowerCase(),
      phone: '+91 9999900000',
      userType: 'platform_admin',
      role: normalizeRoleForType('platform_admin'),
      passwordHash: await hashPassword(adminPassword),
      createdAt: nowIso(),
      status: 'active',
    },
    {
      id: randomId('usr'),
      name: 'Developer User',
      email: devEmail.toLowerCase(),
      phone: '+91 9999911111',
      userType: 'developer',
      role: normalizeRoleForType('developer'),
      passwordHash: await hashPassword(devPassword),
      createdAt: nowIso(),
      status: 'active',
    },
  ];
  const byEmail = new Set(seed.map((u) => u.email));
  if (!byEmail.has(adminEmail.toLowerCase())) {
    seed.push({
      id: randomId('usr'),
      name: 'Platform Admin',
      email: adminEmail.toLowerCase(),
      phone: '+91 9999900000',
      userType: 'platform_admin',
      role: normalizeRoleForType('platform_admin'),
      passwordHash: await hashPassword(adminPassword),
      createdAt: nowIso(),
      status: 'active',
    });
  }
  if (!byEmail.has(devEmail.toLowerCase())) {
    seed.push({
      id: randomId('usr'),
      name: 'Developer User',
      email: devEmail.toLowerCase(),
      phone: '+91 9999911111',
      userType: 'developer',
      role: normalizeRoleForType('developer'),
      passwordHash: await hashPassword(devPassword),
      createdAt: nowIso(),
      status: 'active',
    });
  }
  await writeUsers(seed);
}

function authFromHeader(req) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return verifyToken(token);
}

function requirePrivilegedWriteAccess(req, res) {
  if (!enforceTrustedWriteOrigin(req, res)) {
    return null;
  }
  const payload = authFromHeader(req);
  if (!payload) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return null;
  }
  if (!['platform_admin', 'developer'].includes(payload.userType)) {
    res.status(403).json({ ok: false, error: 'Insufficient privileges' });
    return null;
  }
  return payload;
}

function requirePrivilegedReadAccess(req, res) {
  const payload = authFromHeader(req);
  if (!payload) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return null;
  }
  if (!['platform_admin', 'developer'].includes(payload.userType)) {
    res.status(403).json({ ok: false, error: 'Insufficient privileges' });
    return null;
  }
  return payload;
}

function normalizeStorageFolder(value) {
  const parts = String(value || '')
    .split('/')
    .map((part) => slugifyForUrl(part))
    .filter(Boolean);
  return parts.length > 0 ? parts.join('/') : 'homepage-banners';
}

function sanitizeStorageFileName(fileName, fallbackExtension = '') {
  const parsed = path.parse(String(fileName || 'banner'));
  const base = parsed.name.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'banner';
  const extension = (parsed.ext || fallbackExtension || '').toLowerCase();
  return `${base}${extension}`;
}

function buildStorageObjectKey(folder, fileName) {
  const normalizedFolder = normalizeStorageFolder(folder);
  const safeFileName = sanitizeStorageFileName(fileName, '.png');
  const dateToken = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nonce = crypto.randomUUID().slice(0, 8);
  return `${normalizedFolder}/${dateToken}/${nonce}-${safeFileName}`;
}

function encodeStoragePath(key) {
  return String(key)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function getStorageHost() {
  if (!STORAGE_ENDPOINT_URL || !STORAGE_BUCKET_NAME) return null;
  const parsed = new URL(STORAGE_ENDPOINT_URL);
  return STORAGE_FORCE_PATH_STYLE ? parsed.host : `${STORAGE_BUCKET_NAME}.${parsed.host}`;
}

function getStorageRequestUrl(key) {
  if (!STORAGE_ENDPOINT_URL || !STORAGE_BUCKET_NAME) return null;
  const parsed = new URL(STORAGE_ENDPOINT_URL);
  const encodedPath = encodeStoragePath(key);
  if (STORAGE_FORCE_PATH_STYLE) {
    return `${parsed.origin}/${encodeURIComponent(STORAGE_BUCKET_NAME)}/${encodedPath}`;
  }
  return `${parsed.protocol}//${getStorageHost()}/${encodedPath}`;
}

function getStoragePublicUrl(key) {
  if (STORAGE_PUBLIC_BASE_URL) {
    return `${STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${encodeStoragePath(key)}`;
  }
  return `/api/media/proxy?key=${encodeURIComponent(String(key || ''))}`;
}

function getStorageMediaProxyUrl(key) {
  return `/api/media/proxy?key=${encodeURIComponent(String(key || ''))}`;
}

function getSigningKey(secretKey, dateStamp, region, service = 's3') {
  const kDate = crypto.createHmac('sha256', `AWS4${secretKey}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  return crypto.createHmac('sha256', kService).update('aws4_request').digest();
}

function getAwsTimestamp() {
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { dateStamp, amzDate };
}

async function uploadObjectToStorage({ key, body, contentType }) {
  if (!STORAGE_ENDPOINT_URL || !STORAGE_BUCKET_NAME || !STORAGE_ACCESS_KEY_ID || !STORAGE_SECRET_ACCESS_KEY) {
    throw new Error('Storage credentials are not configured');
  }

  const requestUrl = getStorageRequestUrl(key);
  if (!requestUrl) {
    throw new Error('Storage endpoint is not configured');
  }

  const { dateStamp, amzDate } = getAwsTimestamp();
  const parsed = new URL(requestUrl);
  const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
  const canonicalHeaders = [
    `host:${parsed.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ];
  const signedHeaders = ['host', 'x-amz-content-sha256', 'x-amz-date'];

  if (STORAGE_OBJECT_ACL) {
    canonicalHeaders.push(`x-amz-acl:${STORAGE_OBJECT_ACL}`);
    signedHeaders.push('x-amz-acl');
  }

  const canonicalRequest = [
    'PUT',
    parsed.pathname,
    '',
    `${canonicalHeaders.join('\n')}\n`,
    signedHeaders.join(';'),
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${STORAGE_REGION}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const signingKey = getSigningKey(STORAGE_SECRET_ACCESS_KEY, dateStamp, STORAGE_REGION);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${STORAGE_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`;

  const headers = {
    Authorization: authorizationHeader,
    Host: parsed.host,
    'Content-Type': contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };

  if (STORAGE_OBJECT_ACL) {
    headers['x-amz-acl'] = STORAGE_OBJECT_ACL;
  }

  const response = await fetch(requestUrl, {
    method: 'PUT',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Storage upload failed (${response.status}): ${errorText || response.statusText}`);
  }

  return {
    requestUrl,
    publicUrl: getStoragePublicUrl(key),
    proxyUrl: getStorageMediaProxyUrl(key),
  };
}

async function fetchObjectFromStorage({ key }) {
  if (!STORAGE_ENDPOINT_URL || !STORAGE_BUCKET_NAME || !STORAGE_ACCESS_KEY_ID || !STORAGE_SECRET_ACCESS_KEY) {
    throw new Error('Storage credentials are not configured');
  }

  const requestUrl = getStorageRequestUrl(key);
  if (!requestUrl) {
    throw new Error('Storage endpoint is not configured');
  }

  const { dateStamp, amzDate } = getAwsTimestamp();
  const parsed = new URL(requestUrl);
  const payloadHash = crypto.createHash('sha256').update('').digest('hex');
  const canonicalHeaders = [
    `host:${parsed.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ];
  const signedHeaders = ['host', 'x-amz-content-sha256', 'x-amz-date'];

  const canonicalRequest = [
    'GET',
    parsed.pathname,
    '',
    `${canonicalHeaders.join('\n')}\n`,
    signedHeaders.join(';'),
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${STORAGE_REGION}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const signingKey = getSigningKey(STORAGE_SECRET_ACCESS_KEY, dateStamp, STORAGE_REGION);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${STORAGE_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`;

  const headers = {
    Authorization: authorizationHeader,
    Host: parsed.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };

  return fetch(requestUrl, {
    method: 'GET',
    headers,
  });
}

async function getPgClient() {
  if (pgInitAttempted) return pgPool;
  pgInitAttempted = true;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  try {
    const { Pool } = await import('pg');
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      max: Math.max(2, parseInt(process.env.PG_POOL_MAX || '10', 10) || 10),
    });
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS compliance_audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        action_type TEXT NOT NULL,
        description TEXT NOT NULL,
        details TEXT,
        ip_address TEXT NOT NULL,
        device_code TEXT NOT NULL,
        user_name TEXT NOT NULL
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL DEFAULT '',
        user_type TEXT NOT NULL,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS auth_otp_challenges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_type TEXT NOT NULL,
        mobile TEXT NOT NULL,
        purpose TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS contact_view_events (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        login_key TEXT NOT NULL,
        viewer_name TEXT,
        viewer_phone TEXT,
        ip_address TEXT NOT NULL,
        device_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS business_categories (
        id TEXT PRIMARY KEY,
        legacy_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'category_icon',
        status TEXT NOT NULL DEFAULT 'active',
        sort_order INT NOT NULL DEFAULT 1,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS business_subcategories (
        id TEXT PRIMARY KEY,
        legacy_id BIGINT NOT NULL,
        parent_legacy_id BIGINT NOT NULL,
        category_id TEXT NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'subcategory_icon',
        status TEXT NOT NULL DEFAULT 'active',
        sort_order INT NOT NULL DEFAULT 1,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS platform_localities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        subdomain TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        cover_image TEXT NOT NULL DEFAULT '',
        stats JSONB NOT NULL DEFAULT '{}'::jsonb,
        carousel_images TEXT[] NOT NULL DEFAULT '{}',
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS platform_states (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS platform_cities (
        id TEXT PRIMARY KEY,
        state_id TEXT NOT NULL REFERENCES platform_states(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS platform_areas (
        id TEXT PRIMARY KEY,
        city_id TEXT NOT NULL REFERENCES platform_cities(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        pincode TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS platform_subdomains (
        domain TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL REFERENCES platform_localities(id) ON DELETE CASCADE,
        ssl_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        dns_status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS platform_pincode_mappings (
        pincode TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL REFERENCES platform_localities(id) ON DELETE CASCADE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS cms_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template_scope TEXT NOT NULL DEFAULT 'locality',
        locality_ids TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        priority INT NOT NULL DEFAULT 100,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
        sections JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`ALTER TABLE cms_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE`);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS cms_template_assignments (
        id TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL,
        template_id TEXT NOT NULL REFERENCES cms_templates(id) ON DELETE CASCADE,
        category_id TEXT,
        subcategory_id TEXT,
        pincode TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        priority INT NOT NULL DEFAULT 100,
        is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS cms_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        campaign_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        priority INT NOT NULL DEFAULT 100,
        is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
        start_date DATE,
        end_date DATE,
        device_target TEXT NOT NULL DEFAULT 'all',
        placement_keys TEXT[] NOT NULL DEFAULT '{}',
        targets JSONB NOT NULL DEFAULT '{}'::jsonb,
        max_items INT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS published_homepage_snapshots (
        id TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL,
        category_id TEXT,
        subcategory_id TEXT,
        pincode TEXT,
        placement_key TEXT,
        device_target TEXT NOT NULL DEFAULT 'all',
        page_type TEXT NOT NULL DEFAULT 'homepage',
        payload JSONB NOT NULL,
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS homepage_layouts (
        id TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        visible BOOLEAN NOT NULL DEFAULT TRUE,
        sections JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS homepage_hero_banners (
        id TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS homepage_listing_ads (
        id TEXT PRIMARY KEY,
        placement_key TEXT,
        device_target TEXT NOT NULL DEFAULT 'all',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        locality_ids TEXT[] NOT NULL DEFAULT '{}',
        category_ids TEXT[] NOT NULL DEFAULT '{}',
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS homepage_coupons (
        id TEXT PRIMARY KEY,
        business_id TEXT,
        target_business_id TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        locality_ids TEXT[] NOT NULL DEFAULT '{}',
        category_ids TEXT[] NOT NULL DEFAULT '{}',
        end_date DATE,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS homepage_community_items (
        id TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL,
        item_type TEXT,
        status TEXT NOT NULL DEFAULT 'published',
        publish_at TIMESTAMPTZ,
        expire_at TIMESTAMPTZ,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS homepage_locality_category_links (
        id TEXT PRIMARY KEY,
        locality_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        subcategory_id TEXT,
        slug TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgPool.query(`ALTER TABLE published_homepage_snapshots ADD COLUMN IF NOT EXISTS placement_key TEXT`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_business_subcategories_category ON business_subcategories(category_id, sort_order)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_platform_cities_state ON platform_cities(state_id)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_platform_areas_city ON platform_areas(city_id)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_platform_areas_pincode ON platform_areas(pincode)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_platform_subdomains_locality ON platform_subdomains(locality_id)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_platform_pincode_locality ON platform_pincode_mappings(locality_id)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_cms_template_assignments_locality ON cms_template_assignments(locality_id)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_cms_template_assignments_targeting ON cms_template_assignments(locality_id, category_id, subcategory_id, pincode)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_cms_campaigns_type_status ON cms_campaigns(campaign_type, status, priority DESC)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_published_homepage_snapshots_lookup ON published_homepage_snapshots(locality_id, category_id, subcategory_id, pincode, placement_key, device_target, page_type)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_homepage_layouts_locality ON homepage_layouts(locality_id)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_homepage_hero_banners_locality ON homepage_hero_banners(locality_id, is_active)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_homepage_listing_ads_lookup ON homepage_listing_ads(placement_key, device_target, is_active)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_homepage_coupons_business ON homepage_coupons(target_business_id, is_active)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_homepage_community_items_locality ON homepage_community_items(locality_id, status)`);
    await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_homepage_locality_category_links_lookup ON homepage_locality_category_links(locality_id, category_id, subcategory_id)`);
    return pgPool;
  } catch (err) {
    console.error('Postgres audit logging unavailable, using file fallback:', err?.message || err);
    pgPool = null;
    return null;
  }
}

async function runInPgTransaction(work, label = 'transaction') {
  const db = await getPgClient();
  if (!db || typeof db.connect !== 'function') {
    throw new Error(`Postgres is unavailable for ${label}`);
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(`Rollback failed during ${label}:`, rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'localsy-web' });
});

app.get('/api/businesses', async (_req, res) => {
  try {
    const businesses = await readBusinessListings();
    res.json({ ok: true, businesses });
  } catch (err) {
    console.error('Failed to read business listings:', err);
    res.status(500).json({ ok: false, error: 'Failed to read business listings' });
  }
});

app.put('/api/businesses', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  const incoming = sanitizeBusinessListings(req.body?.businesses);
  if (!incoming) {
    return res.status(400).json({ ok: false, error: 'businesses array is required' });
  }

  try {
    const existing = await readBusinessListings();
    const businesses = mergeBusinessListings(existing, incoming);
    await writeBusinessListings(businesses);
    res.json({ ok: true, businesses });
  } catch (err) {
    console.error('Failed to sync business listings:', err);
    res.status(500).json({ ok: false, error: 'Failed to sync business listings' });
  }
});

app.get('/api/ad-leads', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const adLeads = await readAdLeads();
    res.json({ ok: true, adLeads });
  } catch (err) {
    console.error('Failed to read ad leads:', err);
    res.status(500).json({ ok: false, error: 'Failed to read ad leads' });
  }
});

app.post('/api/ad-leads', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'ad-leads:create',
    limit: 8,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.adLead?.adId || ''),
  })) {
    return;
  }
  const incomingLead = sanitizeAdLead(req.body?.adLead);
  if (!incomingLead) {
    return res.status(400).json({ ok: false, error: 'adLead object is required' });
  }

  try {
    const existingLeads = await readAdLeads();
    const adLeads = [incomingLead, ...existingLeads];
    const savedAdLeads = await writeAdLeads(adLeads);
    res.status(201).json({ ok: true, adLead: incomingLead, adLeads: savedAdLeads });
  } catch (err) {
    console.error('Failed to save ad lead:', err);
    res.status(500).json({ ok: false, error: 'Failed to save ad lead' });
  }
});

app.delete('/api/ad-leads/by-ad/:adId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const targetAdId = String(req.params.adId || '').trim();
    const existingLeads = await readAdLeads();
    const nextAdLeads = existingLeads.filter((lead) => String(lead.adId || '') !== targetAdId);
    const savedAdLeads = await writeAdLeads(nextAdLeads);
    res.json({
      ok: true,
      deletedAdId: targetAdId,
      adLeads: savedAdLeads,
      deletedCount: existingLeads.length - nextAdLeads.length,
    });
  } catch (err) {
    console.error('Failed to delete ad leads by ad:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete ad leads by ad' });
  }
});

app.get('/api/locality-routing-config', async (_req, res) => {
  try {
    const config = await readLocalityRoutingConfig();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('Failed to read locality routing config:', err);
    res.status(500).json({ ok: false, error: 'Failed to read locality routing config' });
  }
});

app.put('/api/locality-routing-config', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const config = sanitizeLocalityRoutingConfigState(req.body?.config);
    const saved = await writeLocalityRoutingConfig(config);
    res.json({ ok: true, config: saved });
  } catch (err) {
    console.error('Failed to save locality routing config:', err);
    res.status(500).json({ ok: false, error: 'Failed to save locality routing config' });
  }
});

app.get('/api/geography-config', async (_req, res) => {
  try {
    const config = await readGeographyConfig();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('Failed to read geography config:', err);
    res.status(500).json({ ok: false, error: 'Failed to read geography config' });
  }
});

app.put('/api/geography-config', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const config = sanitizeGeographyConfigState(req.body?.config);
    const saved = await writeGeographyConfig(config);
    res.json({ ok: true, config: saved });
  } catch (err) {
    console.error('Failed to save geography config:', err);
    res.status(500).json({ ok: false, error: 'Failed to save geography config' });
  }
});

app.get('/api/homepage-defaults-config', async (_req, res) => {
  try {
    const config = await readHomepageDefaultsConfig();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('Failed to read homepage defaults config:', err);
    res.status(500).json({ ok: false, error: 'Failed to read homepage defaults config' });
  }
});

app.put('/api/homepage-defaults-config', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const config = sanitizeHomepageDefaultsConfigState(req.body?.config);
    const saved = await writeHomepageDefaultsConfig(config);
    res.json({ ok: true, config: saved });
  } catch (err) {
    console.error('Failed to save homepage defaults config:', err);
    res.status(500).json({ ok: false, error: 'Failed to save homepage defaults config' });
  }
});

app.get('/api/seo-discovery-config', async (_req, res) => {
  try {
    const config = await readSeoDiscoveryConfig();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('Failed to read SEO discovery config:', err);
    res.status(500).json({ ok: false, error: 'Failed to read SEO discovery config' });
  }
});

app.put('/api/seo-discovery-config', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const config = sanitizeSeoDiscoveryConfigState(req.body?.config);
    const saved = await writeSeoDiscoveryConfig(config);
    res.json({ ok: true, config: saved });
  } catch (err) {
    console.error('Failed to save SEO discovery config:', err);
    res.status(500).json({ ok: false, error: 'Failed to save SEO discovery config' });
  }
});

app.get('/api/business-taxonomy', async (_req, res) => {
  try {
    const taxonomy = await readBusinessTaxonomy();
    res.json({ ok: true, taxonomy });
  } catch (err) {
    console.error('Failed to read business taxonomy:', err);
    res.status(500).json({ ok: false, error: 'Failed to read business taxonomy' });
  }
});

app.put('/api/business-taxonomy', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const taxonomy = sanitizeBusinessTaxonomyState(req.body?.taxonomy);
    const saved = await writeBusinessTaxonomy(taxonomy);
    res.json({ ok: true, taxonomy: saved });
  } catch (err) {
    console.error('Failed to save business taxonomy:', err);
    res.status(500).json({ ok: false, error: 'Failed to save business taxonomy' });
  }
});

app.post('/api/media/upload', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  const folder = normalizeStorageFolder(req.body?.folder);
  const fileName = String(req.body?.fileName || 'banner.png');
  const mimeType = String(req.body?.mimeType || 'application/octet-stream');
  const dataUrl = String(req.body?.dataUrl || '');
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/i);
  const base64Payload = match ? match[2] : dataUrl.replace(/^base64:/i, '');

  if (!base64Payload) {
    return res.status(400).json({ ok: false, error: 'Image data is required' });
  }

  const buffer = Buffer.from(base64Payload, 'base64');
  if (buffer.length === 0) {
    return res.status(400).json({ ok: false, error: 'Invalid image data' });
  }

  try {
    const key = buildStorageObjectKey(folder, fileName);
    const uploaded = await uploadObjectToStorage({
      key,
      body: buffer,
      contentType: mimeType,
    });
    res.json({
      ok: true,
      folder,
      key,
      url: uploaded.proxyUrl || uploaded.publicUrl || uploaded.requestUrl,
    });
  } catch (err) {
    console.error('Failed to upload media:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to upload media' });
  }
});

app.get('/api/media/proxy', async (req, res) => {
  const source = String(req.query?.source || '').trim();
  const keyFromQuery = String(req.query?.key || '').trim();
  let key = keyFromQuery;

  if (!key && source) {
    try {
      const sourceUrl = new URL(source);
      const storageEndpointUrl = new URL(STORAGE_ENDPOINT_URL);
      const sourcePath = decodeURIComponent(sourceUrl.pathname.replace(/^\/+/, ''));
      if (!sourceUrl.hostname.endsWith(storageEndpointUrl.hostname)) {
        return res.status(400).json({ ok: false, error: 'Unsupported media source' });
      }
      key = sourcePath;
      if (sourceUrl.hostname === storageEndpointUrl.hostname && key.startsWith(`${STORAGE_BUCKET_NAME}/`)) {
        key = key.slice(STORAGE_BUCKET_NAME.length + 1);
      }
    } catch (err) {
      return res.status(400).json({ ok: false, error: 'Invalid media source' });
    }
  }

  if (!key) {
    return res.status(400).json({ ok: false, error: 'key or source is required' });
  }

  try {
    const response = await fetchObjectFromStorage({ key });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return res.status(response.status).json({
        ok: false,
        error: errorText || response.statusText || 'Failed to fetch media',
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(buffer);
  } catch (err) {
    console.error('Failed to proxy media:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to proxy media' });
  }
});

app.get('/api/homepage-config', async (req, res) => {
  const access = requirePrivilegedReadAccess(req, res);
  if (!access) return;

  try {
    const config = await readHomepageConfig();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('Failed to read homepage config:', err);
    res.status(500).json({ ok: false, error: 'Failed to read homepage config' });
  }
});

app.get('/api/homepage-config/api-configuration', async (_req, res) => {
  try {
    const config = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({});
    res.json({ ok: true, apiConfiguration: config?.apiConfiguration || null });
  } catch (err) {
    console.error('Failed to read homepage API configuration:', err);
    res.status(500).json({ ok: false, error: 'Failed to read homepage API configuration' });
  }
});

app.get('/api/homepage-config/layouts', async (_req, res) => {
  try {
    const config = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({});
    res.json({ ok: true, layouts: Array.isArray(config?.homepageLayouts) ? config.homepageLayouts : [] });
  } catch (err) {
    console.error('Failed to read homepage layouts:', err);
    res.status(500).json({ ok: false, error: 'Failed to read homepage layouts' });
  }
});

app.get('/api/homepage-config/hero-banners', async (_req, res) => {
  try {
    const config = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({});
    res.json({ ok: true, heroBanners: Array.isArray(config?.heroBanners) ? config.heroBanners : [] });
  } catch (err) {
    console.error('Failed to read hero banners:', err);
    res.status(500).json({ ok: false, error: 'Failed to read hero banners' });
  }
});

app.get('/api/homepage-config/listing-ads', async (_req, res) => {
  try {
    const config = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({});
    res.json({ ok: true, listingAds: Array.isArray(config?.listingAds) ? config.listingAds : [] });
  } catch (err) {
    console.error('Failed to read listing ads:', err);
    res.status(500).json({ ok: false, error: 'Failed to read listing ads' });
  }
});

app.get('/api/homepage-config/coupons', async (_req, res) => {
  try {
    const config = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({});
    res.json({ ok: true, coupons: Array.isArray(config?.coupons) ? config.coupons : [] });
  } catch (err) {
    console.error('Failed to read coupons:', err);
    res.status(500).json({ ok: false, error: 'Failed to read coupons' });
  }
});

app.get('/api/homepage-config/community-items', async (_req, res) => {
  try {
    const config = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({});
    res.json({ ok: true, communityItems: Array.isArray(config?.communityItems) ? config.communityItems : [] });
  } catch (err) {
    console.error('Failed to read community items:', err);
    res.status(500).json({ ok: false, error: 'Failed to read community items' });
  }
});

app.get('/api/homepage-config/locality-category-links', async (_req, res) => {
  try {
    const config = sanitizeHomepageConfig(await readHomepageConfig()) || sanitizeHomepageConfig({});
    res.json({ ok: true, localityCategoryLinks: Array.isArray(config?.localityCategoryLinks) ? config.localityCategoryLinks : [] });
  } catch (err) {
    console.error('Failed to read locality-category links:', err);
    res.status(500).json({ ok: false, error: 'Failed to read locality-category links' });
  }
});

app.put('/api/homepage-config', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  const config = sanitizeHomepageConfig(req.body?.config);
  if (!config) {
    return res.status(400).json({ ok: false, error: 'config object is required' });
  }

  try {
    const savedConfig = await writeHomepageConfig(config);
    res.json({ ok: true, config: savedConfig });
  } catch (err) {
    console.error('Failed to sync homepage config:', err);
    res.status(500).json({ ok: false, error: 'Failed to sync homepage config' });
  }
});

app.put('/api/homepage-config/layouts/:localityId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await saveLegacyHomepageLayout(req.params.localityId, req.body?.layout);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to save homepage layout:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save homepage layout' });
  }
});

app.put('/api/homepage-config/layouts', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await saveLegacyHomepageLayouts(req.body?.layouts);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to save homepage layouts:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save homepage layouts' });
  }
});

app.delete('/api/homepage-config/layouts/:localityId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await deleteLegacyHomepageLayout(req.params.localityId);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to delete homepage layout:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete homepage layout' });
  }
});

app.put('/api/homepage-config/api-configuration', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await saveHomepageApiConfiguration(req.body?.apiConfiguration);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to save homepage API configuration:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save homepage API configuration' });
  }
});

app.post('/api/homepage-config/layouts/:localityId/sections', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const incomingSection = sanitizeTemplateSections([req.body?.section])[0];
    if (!incomingSection) {
      return res.status(400).json({ ok: false, error: 'section object is required' });
    }
    const result = await mutateLegacyHomepageLayout(
      req.params.localityId,
      (layout) => ({
        ...layout,
        sections: [...(layout.sections || []), incomingSection],
      }),
      req.body?.layout,
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to create homepage layout section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to create homepage layout section' });
  }
});

app.put('/api/homepage-config/layouts/:localityId/sections/reorder', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const sections = sanitizeTemplateSections(req.body?.sections);
    const result = await mutateLegacyHomepageLayout(
      req.params.localityId,
      (layout) => ({
        ...layout,
        sections,
      }),
      req.body?.layout,
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to reorder homepage layout sections:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to reorder homepage layout sections' });
  }
});

app.put('/api/homepage-config/layouts/:localityId/sections/:sectionId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const incomingSection = sanitizeTemplateSections([{
      ...(req.body?.section && typeof req.body.section === 'object' ? req.body.section : {}),
      id: String(req.params.sectionId || '').trim(),
    }])[0];
    if (!incomingSection) {
      return res.status(400).json({ ok: false, error: 'section object is required' });
    }
    const result = await mutateLegacyHomepageLayout(
      req.params.localityId,
      (layout) => ({
        ...layout,
        sections: (layout.sections || []).map((section) => (
          String(section.id || '') === String(req.params.sectionId || '')
            ? incomingSection
            : section
        )),
      }),
      req.body?.layout,
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to update homepage layout section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update homepage layout section' });
  }
});

app.post('/api/homepage-config/layouts/:localityId/sections/:sectionId/duplicate', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    let duplicatedSection = null;
    const result = await mutateLegacyHomepageLayout(
      req.params.localityId,
      (layout) => {
        const sourceSection = (layout.sections || []).find((section) => String(section.id || '') === String(req.params.sectionId || ''));
        if (!sourceSection) {
          throw new Error('Section not found');
        }
        duplicatedSection = sanitizeTemplateSections([{
          ...sourceSection,
          id: `home_section_${crypto.randomUUID()}`,
          title: `${String(sourceSection.title || sourceSection.sectionType || 'Section')} Copy`,
        }])[0];
        return {
          ...layout,
          sections: [...(layout.sections || []), duplicatedSection],
        };
      },
      req.body?.layout,
    );
    res.json({ ok: true, ...result, section: duplicatedSection });
  } catch (err) {
    console.error('Failed to duplicate homepage layout section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to duplicate homepage layout section' });
  }
});

app.delete('/api/homepage-config/layouts/:localityId/sections/:sectionId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const targetSectionId = String(req.params.sectionId || '').trim();
    const result = await mutateLegacyHomepageLayout(
      req.params.localityId,
      (layout) => ({
        ...layout,
        sections: (layout.sections || []).filter((section) => String(section.id || '') !== targetSectionId),
      }),
      req.body?.layout,
    );
    res.json({ ok: true, ...result, deletedSectionId: targetSectionId });
  } catch (err) {
    console.error('Failed to delete homepage layout section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete homepage layout section' });
  }
});

app.post('/api/homepage-config/hero-banners', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const banner = cloneJson(req.body?.banner, {}) || {};
    banner.id = String(banner.id || `hero_${crypto.randomUUID()}`);
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      heroBanners: [banner, ...(state.heroBanners || []).filter((entry) => String(entry?.id || '') !== banner.id)],
    }));
    res.json({ ok: true, ...result, banner });
  } catch (err) {
    console.error('Failed to save homepage hero banner:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save homepage hero banner' });
  }
});

app.put('/api/homepage-config/hero-banners/:bannerId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const bannerId = String(req.params.bannerId || '').trim();
    const banner = {
      ...(cloneJson(req.body?.banner, {}) || {}),
      id: bannerId,
    };
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      heroBanners: (state.heroBanners || []).some((entry) => String(entry?.id || '') === bannerId)
        ? (state.heroBanners || []).map((entry) => (String(entry?.id || '') === bannerId ? banner : entry))
        : [banner, ...(state.heroBanners || [])],
    }));
    res.json({ ok: true, ...result, banner });
  } catch (err) {
    console.error('Failed to update homepage hero banner:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update homepage hero banner' });
  }
});

app.delete('/api/homepage-config/hero-banners/:bannerId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const bannerId = String(req.params.bannerId || '').trim();
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      heroBanners: (state.heroBanners || []).filter((entry) => String(entry?.id || '') !== bannerId),
    }));
    res.json({ ok: true, ...result, deletedBannerId: bannerId });
  } catch (err) {
    console.error('Failed to delete homepage hero banner:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete homepage hero banner' });
  }
});

app.post('/api/homepage-config/listing-ads', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const listingAd = cloneJson(req.body?.listingAd, {}) || {};
    listingAd.id = String(listingAd.id || `ad_${crypto.randomUUID()}`);
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      listingAds: [listingAd, ...(state.listingAds || []).filter((entry) => String(entry?.id || '') !== listingAd.id)],
    }));
    res.json({ ok: true, ...result, listingAd });
  } catch (err) {
    console.error('Failed to save homepage listing ad:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save homepage listing ad' });
  }
});

app.put('/api/homepage-config/listing-ads/:adId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const adId = String(req.params.adId || '').trim();
    const listingAd = {
      ...(cloneJson(req.body?.listingAd, {}) || {}),
      id: adId,
    };
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      listingAds: (state.listingAds || []).some((entry) => String(entry?.id || '') === adId)
        ? (state.listingAds || []).map((entry) => (String(entry?.id || '') === adId ? listingAd : entry))
        : [listingAd, ...(state.listingAds || [])],
    }));
    res.json({ ok: true, ...result, listingAd });
  } catch (err) {
    console.error('Failed to update homepage listing ad:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update homepage listing ad' });
  }
});

app.delete('/api/homepage-config/listing-ads/:adId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const adId = String(req.params.adId || '').trim();
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      listingAds: (state.listingAds || []).filter((entry) => String(entry?.id || '') !== adId),
    }));
    res.json({ ok: true, ...result, deletedAdId: adId });
  } catch (err) {
    console.error('Failed to delete homepage listing ad:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete homepage listing ad' });
  }
});

app.post('/api/homepage-config/coupons', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const coupon = cloneJson(req.body?.coupon, {}) || {};
    coupon.id = String(coupon.id || `cpn_${crypto.randomUUID()}`);
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      coupons: [coupon, ...(state.coupons || []).filter((entry) => String(entry?.id || '') !== coupon.id)],
    }));
    res.json({ ok: true, ...result, coupon });
  } catch (err) {
    console.error('Failed to save homepage coupon:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save homepage coupon' });
  }
});

app.put('/api/homepage-config/coupons/:couponId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const couponId = String(req.params.couponId || '').trim();
    const coupon = {
      ...(cloneJson(req.body?.coupon, {}) || {}),
      id: couponId,
    };
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      coupons: (state.coupons || []).some((entry) => String(entry?.id || '') === couponId)
        ? (state.coupons || []).map((entry) => (String(entry?.id || '') === couponId ? coupon : entry))
        : [coupon, ...(state.coupons || [])],
    }));
    res.json({ ok: true, ...result, coupon });
  } catch (err) {
    console.error('Failed to update homepage coupon:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update homepage coupon' });
  }
});

app.delete('/api/homepage-config/coupons/:couponId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const couponId = String(req.params.couponId || '').trim();
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      coupons: (state.coupons || []).filter((entry) => String(entry?.id || '') !== couponId),
    }));
    res.json({ ok: true, ...result, deletedCouponId: couponId });
  } catch (err) {
    console.error('Failed to delete homepage coupon:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete homepage coupon' });
  }
});

app.post('/api/homepage-config/community-items', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const communityItem = cloneJson(req.body?.communityItem, {}) || {};
    communityItem.id = String(communityItem.id || `comm_${crypto.randomUUID()}`);
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      communityItems: [communityItem, ...(state.communityItems || []).filter((entry) => String(entry?.id || '') !== communityItem.id)],
    }));
    res.json({ ok: true, ...result, communityItem });
  } catch (err) {
    console.error('Failed to save homepage community item:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save homepage community item' });
  }
});

app.put('/api/homepage-config/community-items/:itemId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const itemId = String(req.params.itemId || '').trim();
    const communityItem = {
      ...(cloneJson(req.body?.communityItem, {}) || {}),
      id: itemId,
    };
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      communityItems: (state.communityItems || []).some((entry) => String(entry?.id || '') === itemId)
        ? (state.communityItems || []).map((entry) => (String(entry?.id || '') === itemId ? communityItem : entry))
        : [communityItem, ...(state.communityItems || [])],
    }));
    res.json({ ok: true, ...result, communityItem });
  } catch (err) {
    console.error('Failed to update homepage community item:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update homepage community item' });
  }
});

app.delete('/api/homepage-config/community-items/:itemId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const itemId = String(req.params.itemId || '').trim();
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      communityItems: (state.communityItems || []).filter((entry) => String(entry?.id || '') !== itemId),
    }));
    res.json({ ok: true, ...result, deletedItemId: itemId });
  } catch (err) {
    console.error('Failed to delete homepage community item:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete homepage community item' });
  }
});

app.post('/api/homepage-config/locality-category-links', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const localityCategoryLink = cloneJson(req.body?.localityCategoryLink, {}) || {};
    localityCategoryLink.id = String(localityCategoryLink.id || `lc_${crypto.randomUUID()}`);
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      localityCategoryLinks: [localityCategoryLink, ...(state.localityCategoryLinks || []).filter((entry) => String(entry?.id || '') !== localityCategoryLink.id)],
    }));
    res.json({ ok: true, ...result, localityCategoryLink });
  } catch (err) {
    console.error('Failed to save locality-category link:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save locality-category link' });
  }
});

app.delete('/api/homepage-config/locality-category-links/:linkId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const linkId = String(req.params.linkId || '').trim();
    const result = await mutateHomepageConfigState((state) => ({
      ...state,
      localityCategoryLinks: (state.localityCategoryLinks || []).filter((entry) => String(entry?.id || '') !== linkId),
    }));
    res.json({ ok: true, ...result, deletedLinkId: linkId });
  } catch (err) {
    console.error('Failed to delete locality-category link:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete locality-category link' });
  }
});

app.get('/api/scalable-homepage-config', async (req, res) => {
  const access = requirePrivilegedReadAccess(req, res);
  if (!access) return;

  try {
    const config = await readScalableCmsState();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('Failed to read scalable homepage config:', err);
    res.status(500).json({ ok: false, error: 'Failed to read scalable homepage config' });
  }
});

app.put('/api/scalable-homepage-config', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  const config = sanitizeScalableCmsState(req.body?.config);
  if (!config) {
    return res.status(400).json({ ok: false, error: 'config object is required' });
  }

  try {
    const savedConfig = await writeScalableCmsState(config);
    res.json({ ok: true, config: savedConfig });
  } catch (err) {
    console.error('Failed to save scalable homepage config:', err);
    res.status(500).json({ ok: false, error: 'Failed to save scalable homepage config' });
  }
});

app.post('/api/scalable-homepage-config/templates', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await saveScalableTemplateEntity(req.body?.template);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to save scalable template:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save scalable template' });
  }
});

app.put('/api/scalable-homepage-config/templates/:templateId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const templateId = String(req.params.templateId || '').trim();
    const result = await saveScalableTemplateEntity({
      ...(req.body?.template && typeof req.body.template === 'object' ? req.body.template : {}),
      id: templateId,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to update scalable template:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update scalable template' });
  }
});

app.delete('/api/scalable-homepage-config/templates/:templateId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await deleteScalableTemplateEntity(req.params.templateId);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to delete scalable template:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete scalable template' });
  }
});

app.post('/api/scalable-homepage-config/templates/:templateId/sections', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const incomingSection = sanitizeTemplateSections([req.body?.section])[0];
    if (!incomingSection?.id) {
      return res.status(400).json({ ok: false, error: 'section is required' });
    }
    const result = await mutateScalableTemplateSections(req.params.templateId, (sections) => [
      ...sections,
      incomingSection,
    ]);
    res.json({ ok: true, ...result, section: incomingSection });
  } catch (err) {
    console.error('Failed to create scalable template section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to create scalable template section' });
  }
});

app.put('/api/scalable-homepage-config/templates/:templateId/sections/reorder', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const sections = sanitizeTemplateSections(req.body?.sections);
    const result = await mutateScalableTemplateSections(req.params.templateId, () => sections);
    res.json({ ok: true, ...result, sections: result.sections });
  } catch (err) {
    console.error('Failed to reorder scalable template sections:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to reorder scalable template sections' });
  }
});

app.post('/api/scalable-homepage-config/templates/:templateId/sections/sync-locality', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await syncScalableTemplateSectionsFromLocality(req.params.templateId, req.body?.localityId);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to sync scalable template sections from locality:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to sync scalable template sections from locality' });
  }
});

app.put('/api/scalable-homepage-config/templates/:templateId/sections/:sectionId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const sectionId = String(req.params.sectionId || '').trim();
    const incomingSection = sanitizeTemplateSections([{
      ...(req.body?.section && typeof req.body.section === 'object' ? req.body.section : {}),
      id: sectionId,
    }])[0];
    const result = await mutateScalableTemplateSections(req.params.templateId, (sections) => {
      const exists = sections.some((section) => String(section.id || '') === sectionId);
      if (!exists) {
        throw new Error('Template section not found');
      }
      return sections.map((section) => (
        String(section.id || '') === sectionId
          ? { ...section, ...incomingSection, id: sectionId }
          : section
      ));
    });
    res.json({ ok: true, ...result, section: result.sections.find((section) => String(section.id || '') === sectionId) || incomingSection });
  } catch (err) {
    console.error('Failed to update scalable template section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update scalable template section' });
  }
});

app.post('/api/scalable-homepage-config/templates/:templateId/sections/:sectionId/duplicate', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const sectionId = String(req.params.sectionId || '').trim();
    let duplicatedSection = null;
    const result = await mutateScalableTemplateSections(req.params.templateId, (sections) => {
      const sourceSection = sections.find((section) => String(section.id || '') === sectionId);
      if (!sourceSection) {
        throw new Error('Template section not found');
      }
      duplicatedSection = sanitizeTemplateSections([{
        ...cloneJson(sourceSection, {}),
        id: req.body?.sectionId || `tpl_section_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: `${String(sourceSection.title || 'Section').trim()} Copy`,
      }])[0];
      return [...sections, duplicatedSection];
    });
    res.json({ ok: true, ...result, section: duplicatedSection });
  } catch (err) {
    console.error('Failed to duplicate scalable template section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to duplicate scalable template section' });
  }
});

app.delete('/api/scalable-homepage-config/templates/:templateId/sections/:sectionId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const sectionId = String(req.params.sectionId || '').trim();
    const result = await mutateScalableTemplateSections(req.params.templateId, (sections) => {
      const nextSections = sections.filter((section) => String(section.id || '') !== sectionId);
      if (nextSections.length === sections.length) {
        throw new Error('Template section not found');
      }
      return nextSections;
    });
    res.json({ ok: true, ...result, deletedSectionId: sectionId });
  } catch (err) {
    console.error('Failed to delete scalable template section:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete scalable template section' });
  }
});

app.post('/api/scalable-homepage-config/assignments', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await saveScalableAssignmentEntity(req.body?.assignment);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to save scalable assignment:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save scalable assignment' });
  }
});

app.put('/api/scalable-homepage-config/assignments/:assignmentId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const assignmentId = String(req.params.assignmentId || '').trim();
    const result = await saveScalableAssignmentEntity({
      ...(req.body?.assignment && typeof req.body.assignment === 'object' ? req.body.assignment : {}),
      id: assignmentId,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to update scalable assignment:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update scalable assignment' });
  }
});

app.delete('/api/scalable-homepage-config/assignments/:assignmentId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await deleteScalableAssignmentEntity(req.params.assignmentId);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to delete scalable assignment:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete scalable assignment' });
  }
});

app.post('/api/scalable-homepage-config/campaigns', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await saveScalableCampaignEntity(req.body?.campaign);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to save scalable campaign:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save scalable campaign' });
  }
});

app.put('/api/scalable-homepage-config/campaigns/:campaignId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const campaignId = String(req.params.campaignId || '').trim();
    const result = await saveScalableCampaignEntity({
      ...(req.body?.campaign && typeof req.body.campaign === 'object' ? req.body.campaign : {}),
      id: campaignId,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to update scalable campaign:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to update scalable campaign' });
  }
});

app.delete('/api/scalable-homepage-config/campaigns/:campaignId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await deleteScalableCampaignEntity(req.params.campaignId);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to delete scalable campaign:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete scalable campaign' });
  }
});

app.get('/api/scalable-homepage-config/snapshots', async (req, res) => {
  const access = requirePrivilegedReadAccess(req, res);
  if (!access) return;

  try {
    const config = await readScalableCmsState();
    res.json({ ok: true, snapshots: config.publishedSnapshots || [] });
  } catch (err) {
    console.error('Failed to read scalable homepage snapshots:', err);
    res.status(500).json({ ok: false, error: 'Failed to read scalable homepage snapshots' });
  }
});

app.delete('/api/scalable-homepage-config/snapshots/:snapshotId', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const snapshotId = String(req.params.snapshotId || '').trim();
    const result = await deleteResolvedHomepageSnapshotsFromRequest({
      snapshotIds: snapshotId ? [snapshotId] : [],
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to delete scalable homepage snapshot:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete scalable homepage snapshot' });
  }
});

app.post('/api/scalable-homepage-config/sync-legacy-layouts', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await syncScalableLegacyLayouts(req.body?.localityIds);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to sync scalable legacy layouts:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to sync scalable legacy layouts' });
  }
});

app.post('/api/scalable-homepage-config/sync-legacy-campaigns', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await syncScalableLegacyCampaigns({
      localityIds: req.body?.localityIds,
      sourceTags: req.body?.sourceTags,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Failed to sync scalable legacy campaigns:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to sync scalable legacy campaigns' });
  }
});

app.post('/api/scalable-homepage-config/reseed-legacy', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const force = req.body?.force === true;
    const [cmsState, legacyConfig, businesses] = await Promise.all([
      readScalableCmsState(),
      readHomepageConfig(),
      readBusinessListings(),
    ]);
    const ownership = buildScalableLegacyOwnershipSummary(cmsState);
    if (!force && !shouldAllowLegacyScalableReseed(cmsState)) {
      return res.status(409).json({
        ok: false,
        error: 'Scalable CMS contains detached entities. Use a force reseed only if you intentionally want to overwrite scalable-authored state with legacy homepage data.',
        ownership,
      });
    }
    const reseededConfig = buildScalableCmsSeedFromLegacy(legacyConfig, businesses);
    const savedConfig = await writeScalableCmsState(reseededConfig);
    res.json({
      ok: true,
      config: savedConfig,
      forced: force,
      ownership,
      summary: {
        templates: savedConfig.templates.length,
        assignments: savedConfig.assignments.length,
        campaigns: savedConfig.campaigns.length,
        snapshots: savedConfig.publishedSnapshots.length,
      },
    });
  } catch (err) {
    console.error('Failed to reseed scalable homepage config from legacy data:', err);
    res.status(500).json({ ok: false, error: 'Failed to reseed scalable homepage config from legacy data' });
  }
});

app.get('/api/resolved-homepage', async (req, res) => {
  try {
    const context = {
      localityId: String(req.query.localityId || ''),
      categoryId: String(req.query.categoryId || ''),
      subcategoryId: String(req.query.subcategoryId || ''),
      pincode: String(req.query.pincode || ''),
      device: String(req.query.device || 'all'),
      pageType: String(req.query.pageType || 'homepage'),
      placementKey: String(req.query.placementKey || ''),
      date: String(req.query.date || new Date().toISOString().slice(0, 10)),
    };

    if (!context.localityId) {
      return res.status(400).json({ ok: false, error: 'localityId is required' });
    }

    const cmsState = await readScalableCmsState();
    const usePublished = String(req.query.usePublished || 'true') !== 'false';
    const publishedSnapshotMatch = usePublished ? findPublishedSnapshotMatch(cmsState, context) : null;
    const payload = publishedSnapshotMatch?.snapshot?.payload || await resolveHomepageForContext(context, { state: cmsState });
    const resolution = {
      source: publishedSnapshotMatch ? 'published_snapshot' : 'live_resolver',
      strategy: publishedSnapshotMatch?.strategy || 'live_resolver',
      usedPublished: Boolean(publishedSnapshotMatch),
      requestedContext: context,
      requestedSnapshotId: publishedSnapshotMatch?.requestedSnapshotId || buildSnapshotId(context),
      legacySnapshotId: publishedSnapshotMatch?.legacySnapshotId || buildLegacySnapshotId(context),
      snapshot: publishedSnapshotMatch ? {
        id: publishedSnapshotMatch.snapshot.id,
        localityId: publishedSnapshotMatch.snapshot.localityId,
        categoryId: publishedSnapshotMatch.snapshot.categoryId || '',
        subcategoryId: publishedSnapshotMatch.snapshot.subcategoryId || '',
        pincode: publishedSnapshotMatch.snapshot.pincode || '',
        placementKey: publishedSnapshotMatch.snapshot.placementKey || '',
        deviceTarget: publishedSnapshotMatch.snapshot.deviceTarget || 'all',
        pageType: publishedSnapshotMatch.snapshot.pageType || 'homepage',
        publishedAt: publishedSnapshotMatch.snapshot.publishedAt || '',
        updatedAt: publishedSnapshotMatch.snapshot.updatedAt || '',
        score: publishedSnapshotMatch.score,
      } : null,
      template: payload?.template || null,
      resolvedAt: payload?.resolvedAt || new Date().toISOString(),
    };

    res.setHeader('X-Resolved-Homepage-Source', resolution.source);
    res.setHeader('X-Resolved-Homepage-Strategy', resolution.strategy);
    if (resolution.snapshot?.id) {
      res.setHeader('X-Resolved-Homepage-Snapshot-Id', resolution.snapshot.id);
    }
    if (resolution.template?.id) {
      res.setHeader('X-Resolved-Homepage-Template-Id', String(resolution.template.id));
    }

    res.json({
      ok: true,
      source: resolution.source,
      resolution,
      payload,
    });
  } catch (err) {
    console.error('Failed to resolve homepage:', err);
    res.status(500).json({ ok: false, error: 'Failed to resolve homepage' });
  }
});

app.post('/api/resolved-homepage/publish', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await publishResolvedHomepageSnapshotsFromRequest(req.body || {});
    res.json({
      ok: true,
      publishedCount: result.snapshots.length,
      snapshots: result.snapshots,
      publishedSnapshots: result.publishedSnapshots,
      totalSnapshots: result.totalSnapshots,
    });
  } catch (err) {
    console.error('Failed to publish resolved homepage snapshots:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to publish resolved homepage snapshots' });
  }
});

app.post('/api/resolved-homepage/snapshots/delete', async (req, res) => {
  const access = requirePrivilegedWriteAccess(req, res);
  if (!access) return;

  try {
    const result = await deleteResolvedHomepageSnapshotsFromRequest(req.body || {});
    res.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error('Failed to delete published homepage snapshots:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete published homepage snapshots' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  if (!enforceTrustedWriteOrigin(req, res)) {
    return;
  }
  const { name, email, phone, password, userType } = req.body || {};
  if (!name || !email || !userType) {
    return res.status(400).json({ ok: false, error: 'name, email and userType are required' });
  }
  if (!ALL_USER_TYPES.includes(userType)) {
    return res.status(400).json({ ok: false, error: 'Invalid userType' });
  }

  const requester = authFromHeader(req);
  const canCreatePrivileged = requester && ['platform_admin', 'developer'].includes(requester.userType);
  if (!canCreatePrivileged) {
    return res.status(403).json({ ok: false, error: 'Only platform_admin/developer can create this user type' });
  }
  if (PUBLIC_USER_TYPES.includes(userType)) {
    return res.status(410).json({ ok: false, error: 'Use /api/auth/register/request-otp for public OTP registration' });
  }
  if (!String(password || '').trim()) {
    return res.status(400).json({ ok: false, error: 'password is required for platform users' });
  }

  const users = await readUsers();
  const normalizedEmail = String(email).toLowerCase().trim();
  if (users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ ok: false, error: 'Email already registered' });
  }

  const created = {
    id: randomId('usr'),
    name: String(name).trim(),
    email: normalizedEmail,
    phone: String(phone || '').trim(),
    userType,
    role: normalizeRoleForType(userType),
    passwordHash: await hashPassword(String(password || crypto.randomBytes(12).toString('hex'))),
    createdAt: nowIso(),
    status: 'active',
  };
  users.push(created);
  await writeUsers(users);

  res.status(201).json({
    ok: true,
    user: buildAuthUserResponse(created),
  });
});

app.post('/api/auth/register/request-otp', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'auth:register-request-otp',
    limit: 5,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.email || req.body?.phone || ''),
  })) {
    return;
  }
  const { name, email, phone, userType } = req.body || {};
  if (!name || !email || !phone || !userType) {
    return res.status(400).json({ ok: false, error: 'name, email, phone and userType are required' });
  }
  if (!PUBLIC_USER_TYPES.includes(userType)) {
    return res.status(400).json({ ok: false, error: 'Public registration is only for buyer, seller, and resource users' });
  }

  const users = await readUsers();
  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedPhone = normalizePhoneDigits(phone);
  if (users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ ok: false, error: 'Email already registered' });
  }
  if (!normalizedPhone) {
    return res.status(400).json({ ok: false, error: 'Invalid mobile number' });
  }
  if (users.some((u) => normalizePhoneDigits(u.phone) === normalizedPhone)) {
    return res.status(409).json({ ok: false, error: 'Mobile number already registered' });
  }

  try {
    await sendMsg91Otp(normalizedPhone);
    const challenge = await createOtpChallenge({
      userId: `pending:${randomId('usr')}`,
      userType,
      mobile: normalizedPhone,
      purpose: 'register',
    });
    const challengeToken = buildOtpChallengeToken({
      challengeId: challenge.id,
      userId: challenge.userId,
      userType,
      mobile: normalizedPhone,
      purpose: 'register',
      context: {
        pendingName: String(name).trim(),
        pendingEmail: normalizedEmail,
        pendingPhone: normalizedPhone,
        pendingUserType: userType,
      },
    });
    res.json({ ok: true, challengeToken, mobile: normalizedPhone });
  } catch (err) {
    console.error('Failed to send registration OTP:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to send OTP' });
  }
});

app.post('/api/auth/register/verify-otp', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'auth:register-verify-otp',
    limit: 12,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.challengeToken || '').slice(0, 48),
  })) {
    return;
  }
  const { challengeToken, otp } = req.body || {};
  if (!challengeToken || !otp) {
    return res.status(400).json({ ok: false, error: 'challengeToken and otp are required' });
  }

  const challenge = verifyOtpChallengeToken(String(challengeToken), 'register');
  if (!challenge) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired OTP challenge' });
  }
  const persistedChallenge = await readOtpChallenge(challenge.challengeId);
  if (!persistedChallenge) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired OTP challenge' });
  }
  if (
    persistedChallenge.purpose !== challenge.purpose ||
    persistedChallenge.userId !== challenge.sub ||
    persistedChallenge.mobile !== challenge.mobile
  ) {
    return res.status(401).json({ ok: false, error: 'Invalid OTP challenge' });
  }

  try {
    await verifyMsg91Otp(challenge.mobile, String(otp).trim());
    await markOtpChallengeUsed(challenge.challengeId);

    const users = await readUsers();
    const normalizedEmail = String(challenge.pendingEmail || '').toLowerCase().trim();
    const normalizedPhone = normalizePhoneDigits(challenge.pendingPhone || challenge.mobile);
    if (!normalizedEmail || !normalizedPhone) {
      return res.status(400).json({ ok: false, error: 'Invalid registration payload' });
    }
    if (users.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }

    const created = {
      id: randomId('usr'),
      name: String(challenge.pendingName || '').trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      userType: challenge.pendingUserType || 'buyer',
      role: normalizeRoleForType(challenge.pendingUserType || 'buyer'),
      passwordHash: await hashPassword(crypto.randomBytes(12).toString('hex')),
      createdAt: nowIso(),
      status: 'active',
    };
    users.push(created);
    await writeUsers(users);

    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
    const token = signToken({
      sub: created.id,
      email: created.email,
      role: created.role,
      userType: created.userType,
      exp,
    });

    res.json({
      ok: true,
      token,
      user: buildAuthUserResponse(created),
    });
  } catch (err) {
    console.error('Failed to verify registration OTP:', err);
    res.status(401).json({ ok: false, error: err?.message || 'Invalid OTP' });
  }
});

app.post('/api/auth/request-otp', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'auth:public-request-otp',
    limit: 5,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.phone || ''),
  })) {
    return;
  }
  const { phone } = req.body || {};
  const users = await readUsers();
  const user = findUserByMobile(users, phone);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'No account found for that mobile number' });
  }
  if (!PUBLIC_USER_TYPES.includes(user.userType)) {
    return res.status(403).json({ ok: false, error: 'Use platform login for admin accounts' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ ok: false, error: 'User is not active' });
  }

  const mobile = normalizePhoneDigits(user.phone);
  try {
    await sendMsg91Otp(mobile);
    const challenge = await createOtpChallenge({
      userId: user.id,
      userType: user.userType,
      mobile,
      purpose: 'public-login',
    });
    const challengeToken = buildOtpChallengeToken({
      challengeId: challenge.id,
      userId: user.id,
      userType: user.userType,
      mobile,
      purpose: 'public-login',
    });
    res.json({
      ok: true,
      challengeToken,
      mobile,
      user: buildAuthUserResponse(user),
    });
  } catch (err) {
    console.error('Failed to send public OTP:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to send OTP' });
  }
});

app.post('/api/contact-unlock/request-otp', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'contact-unlock:request-otp',
    limit: 5,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.phone || ''),
  })) {
    return;
  }
  const { phone } = req.body || {};
  const normalizedPhone = normalizePhoneDigits(phone);
  if (!normalizedPhone) {
    return res.status(400).json({ ok: false, error: 'phone is required' });
  }

  try {
    await sendMsg91Otp(normalizedPhone);
    const challenge = await createOtpChallenge({
      userId: `contact:${normalizedPhone}`,
      userType: 'buyer',
      mobile: normalizedPhone,
      purpose: 'contact-unlock',
    });
    const challengeToken = buildOtpChallengeToken({
      challengeId: challenge.id,
      userId: challenge.userId,
      userType: 'buyer',
      mobile: normalizedPhone,
      purpose: 'contact-unlock',
    });
    res.json({ ok: true, challengeToken, mobile: normalizedPhone });
  } catch (err) {
    console.error('Failed to send contact unlock OTP:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to send OTP' });
  }
});

app.post('/api/contact-unlock/verify-otp', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'contact-unlock:verify-otp',
    limit: 12,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.challengeToken || '').slice(0, 48),
  })) {
    return;
  }
  const { challengeToken, otp } = req.body || {};
  if (!challengeToken || !otp) {
    return res.status(400).json({ ok: false, error: 'challengeToken and otp are required' });
  }

  const challenge = verifyOtpChallengeToken(String(challengeToken), 'contact-unlock');
  if (!challenge) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired OTP challenge' });
  }
  const persistedChallenge = await readOtpChallenge(challenge.challengeId);
  if (!persistedChallenge) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired OTP challenge' });
  }
  if (
    persistedChallenge.purpose !== challenge.purpose ||
    persistedChallenge.userId !== challenge.sub ||
    persistedChallenge.mobile !== challenge.mobile
  ) {
    return res.status(401).json({ ok: false, error: 'Invalid OTP challenge' });
  }

  try {
    await verifyMsg91Otp(challenge.mobile, String(otp).trim());
    await markOtpChallengeUsed(challenge.challengeId);
    const unlockToken = buildContactUnlockGrantToken({
      challengeId: challenge.challengeId,
      mobile: challenge.mobile,
    });
    res.json({ ok: true, mobile: challenge.mobile, unlockToken });
  } catch (err) {
    console.error('Failed to verify contact unlock OTP:', err);
    res.status(401).json({ ok: false, error: err?.message || 'Invalid OTP' });
  }
});

app.post('/api/contact-unlock/record-view', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'contact-unlock:record-view',
    limit: 20,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.businessId || ''),
  })) {
    return;
  }
  const { businessId, viewerPhone, viewerName, deviceId } = req.body || {};
  const normalizedBusinessId = String(businessId || '').trim();
  const normalizedDeviceId = normalizeDeviceId(deviceId || req.headers['x-device-id']);
  const normalizedPhone = normalizePhoneDigits(viewerPhone);
  const payload = authFromHeader(req);
  const unlockTokenPayload = verifyContactUnlockGrantToken(String(req.body?.unlockToken || ''));
  const loginKey = payload?.sub ? `user:${payload.sub}` : normalizedPhone ? `phone:${normalizedPhone}` : '';
  const ipAddress = normalizeRequestIp(req);

  if (!normalizedBusinessId) {
    return res.status(400).json({ ok: false, error: 'businessId is required' });
  }
  if (!payload?.sub && !normalizedPhone) {
    return res.status(400).json({ ok: false, error: 'viewerPhone or authenticated session is required' });
  }
  if (!normalizedDeviceId) {
    return res.status(400).json({ ok: false, error: 'deviceId is required' });
  }
  if (!payload?.sub) {
    if (!unlockTokenPayload) {
      return res.status(401).json({ ok: false, error: 'Verified contact unlock token is required' });
    }
    const grantPhone = normalizePhoneDigits(unlockTokenPayload.mobile);
    if (!grantPhone || grantPhone !== normalizedPhone) {
      return res.status(401).json({ ok: false, error: 'Contact unlock token does not match the verified phone number' });
    }
  }
  if (!loginKey) {
    return res.status(400).json({ ok: false, error: 'Unable to resolve contact unlock identity' });
  }

  const businesses = await readBusinessListings();
  const business = businesses.find((entry) => entry.id === normalizedBusinessId);
  if (!business) {
    return res.status(404).json({ ok: false, error: 'Business not found' });
  }
  const users = await readUsers();
  const authenticatedUser = payload?.sub ? users.find((entry) => entry.id === payload.sub) : null;

  try {
    const counts = await getContactViewCountsToday({
      loginKey,
      ipAddress,
      deviceId: normalizedDeviceId,
    });

    const exceeded = [];
    if (counts.loginCount >= CONTACT_VIEW_DAILY_LIMIT) exceeded.push('same login');
    if (counts.ipCount >= CONTACT_VIEW_DAILY_LIMIT) exceeded.push('same IP');
    if (counts.deviceCount >= CONTACT_VIEW_DAILY_LIMIT) exceeded.push('same device');

    if (exceeded.length > 0) {
      return res.status(429).json({
        ok: false,
        error: `Daily contact view limit reached for ${exceeded.join(', ')}.`,
        limit: CONTACT_VIEW_DAILY_LIMIT,
        counts,
      });
    }

    await recordContactViewEvent({
      businessId: normalizedBusinessId,
      loginKey,
      viewerName: String(viewerName || authenticatedUser?.name || authenticatedUser?.email || payload?.sub || 'Anonymous').trim(),
      viewerPhone: normalizedPhone,
      ipAddress,
      deviceId: normalizedDeviceId,
    });

    res.json({
      ok: true,
      businessId: normalizedBusinessId,
      limit: CONTACT_VIEW_DAILY_LIMIT,
      counts: {
        login: counts.loginCount + 1,
        ip: counts.ipCount + 1,
        device: counts.deviceCount + 1,
      },
    });
  } catch (err) {
    console.error('Failed to record contact view:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to record contact view' });
  }
});

app.post('/api/auth/platform/request-otp', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'auth:platform-request-otp',
    limit: 6,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.identifier || ''),
  })) {
    return;
  }
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ ok: false, error: 'identifier and password are required' });
  }

  const users = await readUsers();
  const user = findUserByLoginIdentifier(users, identifier);
  if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  if (!['platform_admin', 'developer'].includes(user.userType)) {
    return res.status(403).json({ ok: false, error: 'Use OTP login for non-platform accounts' });
  }
  const valid = await verifyPassword(String(password), user.passwordHash);
  if (!valid) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  if (user.status !== 'active') return res.status(403).json({ ok: false, error: 'User is not active' });

  const mobile = normalizePhoneDigits(user.phone);
  if (!mobile) {
    return res.status(400).json({ ok: false, error: 'Platform account does not have a mobile number for OTP' });
  }

  try {
    await sendMsg91Otp(mobile);
    const challenge = await createOtpChallenge({
      userId: user.id,
      userType: user.userType,
      mobile,
      purpose: 'platform-login',
    });
    const challengeToken = buildOtpChallengeToken({
      challengeId: challenge.id,
      userId: user.id,
      userType: user.userType,
      mobile,
      purpose: 'platform-login',
    });
    res.json({
      ok: true,
      challengeToken,
      mobile,
      user: buildAuthUserResponse(user),
    });
  } catch (err) {
    console.error('Failed to send platform OTP:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'auth:verify-otp',
    limit: 12,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.challengeToken || '').slice(0, 48),
  })) {
    return;
  }
  const { challengeToken, otp } = req.body || {};
  if (!challengeToken || !otp) {
    return res.status(400).json({ ok: false, error: 'challengeToken and otp are required' });
  }

  const challenge = verifyOtpChallengeToken(String(challengeToken), undefined);
  if (!challenge) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired OTP challenge' });
  }
  const persistedChallenge = await readOtpChallenge(challenge.challengeId);
  if (!persistedChallenge) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired OTP challenge' });
  }
  if (persistedChallenge.purpose !== challenge.purpose || persistedChallenge.userId !== challenge.sub || persistedChallenge.mobile !== challenge.mobile) {
    return res.status(401).json({ ok: false, error: 'Invalid OTP challenge' });
  }

  const users = await readUsers();
  const user = users.find((entry) => entry.id === challenge.sub);
  if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  if (user.status !== 'active') return res.status(403).json({ ok: false, error: 'User is not active' });

  const mobile = normalizePhoneDigits(user.phone);
  if (mobile !== challenge.mobile) {
    return res.status(401).json({ ok: false, error: 'Invalid OTP challenge' });
  }

  try {
    await verifyMsg91Otp(mobile, String(otp).trim());
    await markOtpChallengeUsed(challenge.challengeId);
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      exp,
    });

    res.json({
      ok: true,
      token,
      user: buildAuthUserResponse(user),
    });
  } catch (err) {
    console.error('Failed to verify OTP:', err);
    res.status(401).json({ ok: false, error: err?.message || 'Invalid OTP' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  res.status(410).json({
    ok: false,
    error: 'Use /api/auth/request-otp for public logins and /api/auth/platform/request-otp for platform logins.',
  });
});

app.get('/api/auth/me', async (req, res) => {
  const payload = authFromHeader(req);
  if (!payload) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const users = await readUsers();
  const user = users.find((u) => u.id === payload.sub);
  if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  res.json({
    ok: true,
    user: buildAuthUserResponse(user),
  });
});

app.post('/api/audit-events', async (req, res) => {
  if (!enforcePublicWriteThrottle(req, res, {
    bucket: 'audit-events:create',
    limit: 120,
    windowMs: 10 * 60 * 1000,
    keySuffix: String(req.body?.actionType || ''),
  })) {
    return;
  }
  const payload = req.body || {};
  const required = ['timestamp', 'actionType', 'description', 'details'];
  const missing = required.filter((k) => payload[k] === undefined || payload[k] === null);
  if (missing.length > 0) {
    return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` });
  }

  const authenticated = authFromHeader(req);
  let resolvedUserName = normalizeAuditText(payload.userName || 'Anonymous Explorer', 120) || 'Anonymous Explorer';
  if (authenticated?.sub) {
    const users = await readUsers();
    const user = users.find((entry) => entry.id === authenticated.sub);
    if (user) {
      resolvedUserName = normalizeAuditText(user.name || user.email || resolvedUserName, 120) || resolvedUserName;
    }
  }

  const ipAddress = normalizeRequestIp(req);
  const userAgent = String(req.headers['user-agent'] || payload.deviceCode || 'unknown');
  const auditDecision = evaluateAuditEventThrottle({
    ipAddress,
    userAgent,
    actionType: payload.actionType,
    description: payload.description,
    details: payload.details,
    userName: resolvedUserName,
    isAuthenticated: Boolean(authenticated?.sub),
  });
  if (!auditDecision.accept) {
    return res.status(202).json({
      ok: true,
      skipped: true,
      reason: auditDecision.status,
      automated: auditDecision.automated,
      retryAfterMs: auditDecision.retryAfterMs,
    });
  }

  const event = {
    id: normalizeAuditText(payload.id || `audit_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`, 96),
    timestamp: String(payload.timestamp),
    actionType: String(payload.actionType),
    description: normalizeAuditText(payload.description, 240),
    details: normalizeAuditText(payload.details, 1000),
    ipAddress,
    deviceCode: normalizeAuditText(userAgent, 240) || 'unknown',
    userName: resolvedUserName,
  };

  try {
    const client = await getPgClient();
    if (client) {
      await client.query(
        `INSERT INTO compliance_audit_logs (id, timestamp, action_type, description, details, ip_address, device_code, user_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [
          event.id,
          event.timestamp,
          event.actionType,
          event.description,
          event.details,
          event.ipAddress,
          event.deviceCode,
          event.userName,
        ],
      );
    } else {
      await fs.appendFile(auditLogPath, JSON.stringify(event) + '\n', 'utf8');
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Failed to persist audit event:', err);
    res.status(500).json({ ok: false, error: 'Failed to persist audit event' });
  }
});

app.get('/', async (req, res, next) => {
  const seoConfig = await readSeoDiscoveryConfig();
  const seoContext = buildSeoDiscoveryContext(seoConfig);
  const redirectPath = resolveLegacySeoRedirectPath(req.query || {}, seoContext);
  if (redirectPath) {
    const passthroughParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === 'locality' || key === 'category' || key === 'q') continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null && String(item) !== '') {
            passthroughParams.append(key, String(item));
          }
        }
        continue;
      }
      if (value !== undefined && value !== null && String(value) !== '') {
        passthroughParams.set(key, String(value));
      }
    }

    const suffix = passthroughParams.toString();
    const target = suffix ? `${redirectPath}?${suffix}` : redirectPath;
    return res.redirect(301, target);
  }

  const hostLocality = getLocalityFromHost(req, seoContext);
  if (hostLocality) {
    return res.redirect(301, buildLocalityPath(hostLocality));
  }
  return next();
});

app.get('/:pageSlug', async (req, res, next) => {
  const seoConfig = await readSeoDiscoveryConfig();
  const seoContext = buildSeoDiscoveryContext(seoConfig);
  const hostLocality = getLocalityFromHost(req, seoContext);
  if (!hostLocality) return next();

  const pageSlug = slugifyForUrl(req.params.pageSlug || '');
  if (!pageSlug) return next();
  if (pageSlug === hostLocality) return next();
  if (pageSlug === 'robots-txt' || pageSlug === 'sitemap-xml' || pageSlug.startsWith('api')) return next();

  if (seoContext.intentBySlug.has(pageSlug) || seoContext.categoryIdSet.has(pageSlug)) {
    return res.redirect(301, `${buildLocalityPath(hostLocality)}/${pageSlug}`);
  }
  return next();
});

app.get(['/:localitySlug', '/:localitySlug/:pageSlug', '/:localitySlug/:pageSlug/:listingSlug'], async (req, res, next) => {
  const seoConfig = await readSeoDiscoveryConfig();
  const seoContext = buildSeoDiscoveryContext(seoConfig);
  const hostLocality = getLocalityFromHost(req, seoContext);
  const route = parseSeoRoute(req.path, seoContext, hostLocality);
  if (!route) return next();

  const canonicalPath = buildSeoPath(seoContext, route.localityId, route.categoryId, route.intent?.q || null);
  const requestPath = req.path.endsWith('/') && req.path.length > 1 ? req.path.slice(0, -1) : req.path;
  const canonicalMatch = requestPath === canonicalPath || requestPath.startsWith(`${canonicalPath}/`);
  if (!canonicalMatch) {
    const suffix = route.listingSlug ? `/${route.listingSlug}` : '';
    return res.redirect(301, `${canonicalPath}${suffix}`);
  }

  const template = await getIndexTemplate();
  if (!template) return next();

  const origin = getOrigin(req);
  const model = buildSeoRouteModel(origin, route, seoContext);
  if (!model) return next();
  const jsonLd = renderSeoJsonLd(origin, model);
  const seoBodyHtml = renderSeoBodyHtml(model);
  const withBody = template.replace('<div id="root"></div>', `<div id="root">${seoBodyHtml}</div>`);
  const renderedHtml = applySeoHeadTags(withBody, model, jsonLd);
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  return res.type('text/html').send(renderedHtml);
});

app.get('/robots.txt', async (req, res) => {
  const origin = getOrigin(req);
  const seoConfig = await readSeoDiscoveryConfig();
  const seoContext = buildSeoDiscoveryContext(seoConfig);
  const hostLocality = getLocalityFromHost(req, seoContext);
  const lines = [
    'User-agent: *',
    'Allow: /',
  ];
  if (hostLocality) {
    lines.push(`Host: ${seoContext.localityMetaById.get(hostLocality)?.subdomain || req.hostname}`);
  }
  lines.push('', `Sitemap: ${origin}/sitemap.xml`);
  res.type('text/plain').send(lines.join('\n'));
});

app.get('/seo-image.svg', async (req, res) => {
  const rawTitle = String(req.query.title || SEO_SITE_NAME).slice(0, 120);
  const rawSubtitle = String(req.query.subtitle || 'Verified local businesses across Navi Mumbai').slice(0, 160);
  const rawBrand = String(req.query.brand || SEO_SITE_NAME).slice(0, 80);
  const rawTagline = String(req.query.tagline || SEO_SITE_PROMISE).slice(0, 120);
  const seoConfig = await readSeoDiscoveryConfig();
  const seoContext = buildSeoDiscoveryContext(seoConfig);
  const localityLine = seoContext.config.localityMetadata.map((locality) => locality.name).join(', ');

  const title = htmlEscape(rawTitle);
  const subtitle = htmlEscape(rawSubtitle);
  const brand = htmlEscape(rawBrand);
  const tagline = htmlEscape(rawTagline);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${subtitle}</desc>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="55%" stop-color="#1d4ed8" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
    <radialGradient id="glow" cx="18%" cy="22%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <circle cx="1020" cy="132" r="120" fill="#f59e0b" fill-opacity="0.14" />
  <circle cx="1088" cy="508" r="150" fill="#22c55e" fill-opacity="0.12" />
  <text x="84" y="112" fill="#dbeafe" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="2">${brand}</text>
  <text x="84" y="180" fill="#bfdbfe" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="600">${tagline}</text>
  <text x="84" y="252" fill="#ffffff" font-family="Inter,Arial,sans-serif" font-size="58" font-weight="800">${title}</text>
  <text x="84" y="336" fill="#e2e8f0" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="500">${subtitle}</text>
  <text x="84" y="510" fill="#bfdbfe" font-family="Inter,Arial,sans-serif" font-size="26" font-weight="600">${htmlEscape(localityLine)}</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.send(svg);
});

app.get('/sitemap.xml', async (req, res) => {
  const origin = getOrigin(req);
  const seoConfig = await readSeoDiscoveryConfig();
  const seoContext = buildSeoDiscoveryContext(seoConfig);
  const hostLocality = getLocalityFromHost(req, seoContext);
  const urlSet = new Set(['/']);

  const localityTargets = hostLocality ? [hostLocality] : seoContext.localityIds;
  for (const localityId of localityTargets) {
    urlSet.add(buildLocalityPath(localityId));
    for (const categoryId of seoContext.categoryIds) {
      urlSet.add(buildSeoPath(seoContext, localityId, categoryId, null));
    }
    for (const intent of seoContext.config.routeIntents) {
      urlSet.add(buildSeoPath(seoContext, localityId, intent.categoryId, intent.q));
    }
  }

  const lastmod = new Date().toISOString().split('T')[0];
  const urlsXml = Array.from(urlSet)
    .map((pathWithQuery) => `  <url><loc>${xmlEscape(`${origin}${pathWithQuery}`)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.type('application/xml').send(xml);
});

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

function resolvePort() {
  const rawPort = Number(process.env.PORT);
  const rawPgPort = Number(process.env.PGPORT);
  if (!Number.isFinite(rawPort) || rawPort <= 0) return 3000;
  // Guard against misconfigured environments where app PORT is set to DB port.
  if (rawPort === 5432 || (Number.isFinite(rawPgPort) && rawPort === rawPgPort)) {
    return 3000;
  }
  return rawPort;
}

const port = resolvePort();
ensureBootstrapUsers()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('User bootstrap failed, starting without seeded users:', err);
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port} (bootstrap fallback mode)`);
    });
  });
