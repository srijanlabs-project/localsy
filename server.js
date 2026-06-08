import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const auditLogPath = path.join(__dirname, 'audit-events.jsonl');
const usersPath = path.join(__dirname, 'users.json');
const businessesPath = path.join(__dirname, 'businesses.json');
const homepageConfigPath = path.join(__dirname, 'homepage-config.json');
const TOKEN_SECRET = process.env.AUTH_SECRET || 'replace-this-in-production';
const TOKEN_TTL_SEC = 60 * 60 * 12; // 12 hours

app.use(express.json({ limit: '20mb' }));
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

let pgClient = null;
let pgInitAttempted = false;
let memoryUsers = null;
let memoryBusinesses = null;
let memoryHomepageConfig = null;
let memoryOtpChallenges = null;
let memoryContactViewEvents = null;
const auditEventThrottleBuckets = new Map();
const auditEventRecentWrites = new Map();

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

const PUBLIC_USER_TYPES = ['buyer', 'seller', 'resource'];
const ALL_USER_TYPES = ['platform_admin', 'developer', 'buyer', 'seller', 'resource'];
const SEO_SITE_NAME = 'Localisy';
const SEO_SITE_TAGLINE = 'A Hyper Local Business Directory';
const SEO_SITE_PROMISE = 'Discover Local. Support Local. Grow Local.';
const SEO_LOCALITY_IDS = ['roadpali', 'kalamboli', 'kharghar', 'kamothe', 'panvel', 'taloja'];
const SEO_CATEGORY_IDS = [
  'food-restaurants',
  'health-medical',
  'beauty-wellness',
  'home-services',
  'automotive',
  'real-estate',
  'education-training',
  'shopping-retail',
  'professional-services',
  'travel-hospitality',
  'event-services',
  'repair-maintenance',
  'financial-services',
  'pets-animals',
  'industrial-b2b',
  'agriculture',
  'entertainment-leisure',
  'digital-technology',
  'government-public-services',
];
const SEO_CATEGORY_LABELS = {
  'food-restaurants': 'Food & Restaurants',
  'health-medical': 'Health & Medical',
  'beauty-wellness': 'Beauty & Wellness',
  'home-services': 'Home Services',
  automotive: 'Automotive',
  'real-estate': 'Real Estate',
  'education-training': 'Education & Training',
  'shopping-retail': 'Shopping & Retail',
  'professional-services': 'Professional Services',
  'travel-hospitality': 'Travel & Hospitality',
  'event-services': 'Event Services',
  'repair-maintenance': 'Repair & Maintenance',
  'financial-services': 'Financial Services',
  'pets-animals': 'Pets & Animals',
  'industrial-b2b': 'Industrial & B2B',
  agriculture: 'Agriculture',
  'entertainment-leisure': 'Entertainment & Leisure',
  'digital-technology': 'Digital & Technology',
  'government-public-services': 'Government & Public Services',
};
const SEO_LOCALITY_META = {
  roadpali: {
    name: 'Roadpali',
    city: 'Navi Mumbai',
    intro: 'Roadpali is one of the most active residential and service corridors in Navi Mumbai, with trusted options across salons, food, home services, and clinics.',
    pincodes: ['410101', '410218'],
    subdomain: 'roadpali.happygifting.in',
  },
  kalamboli: {
    name: 'Kalamboli',
    city: 'Navi Mumbai',
    intro: 'Kalamboli has a strong mix of education-led neighborhoods and high-demand local services, especially wellness, retail, and family dining.',
    pincodes: ['410218'],
    subdomain: 'kalamboli.happygifting.in',
  },
  kharghar: {
    name: 'Kharghar',
    city: 'Navi Mumbai',
    intro: 'Kharghar serves a fast-growing residential population with high-intent demand for modern clinics, food outlets, and professional services.',
    pincodes: ['410210'],
    subdomain: 'kharghar.happygifting.in',
  },
  kamothe: {
    name: 'Kamothe',
    city: 'Navi Mumbai',
    intro: 'Kamothe is a strong locality for practical everyday services, neighborhood healthcare, household support, and value retail businesses.',
    pincodes: ['410209'],
    subdomain: 'kamothe.happygifting.in',
  },
  panvel: {
    name: 'Panvel',
    city: 'Navi Mumbai',
    intro: 'Panvel combines legacy marketplaces with new residential hubs, making it an important local search destination for both services and commerce.',
    pincodes: ['410206', '410221'],
    subdomain: 'panvel.happygifting.in',
  },
  taloja: {
    name: 'Taloja',
    city: 'Navi Mumbai',
    intro: 'Taloja supports expanding residential clusters and industrial-adjacent demand, with rising discovery needs for home and professional services.',
    pincodes: ['410208'],
    subdomain: 'taloja.happygifting.in',
  },
};
const SEO_ROUTE_INTENTS = [
  { slug: 'electrician', categoryId: 'home', q: 'Electrician' },
  { slug: 'salon', categoryId: 'salon', q: 'Salon' },
  { slug: 'dental-clinic', categoryId: 'health', q: 'Dental Clinic' },
  { slug: 'restaurant', categoryId: 'food', q: 'Restaurant' },
  { slug: 'grocery-store', categoryId: 'retail', q: 'Grocery Store' },
  { slug: 'ca', categoryId: 'services', q: 'Chartered Accountant' },
];
const SEO_TOP_LISTINGS = {
  roadpali: {
    salon: ['5 Elements Family Salon', 'ColorQ International Salon', 'Barberry Bliss Family Salon'],
    food: ['Utsav Grand Pure Veg Restaurant', 'Bombay Tandoori House', 'Kalamboli Food Square'],
    home: ['Roadpali Electric Works', 'Sector 17 Plumbing Services', 'Navi Mumbai Home Fix'],
    health: ['Roadpali Dental & Care', 'Kalamboli Family Clinic', 'Navi Smile Dental Hub'],
    retail: ['Roadpali Daily Grocery', 'Sector 15 Mega Mart', 'Kalamboli Essentials Store'],
    services: ['Panvel Tax & CA Services', 'Roadpali Legal Desk', 'Navi Mumbai Business Advisor'],
  },
  kalamboli: {
    salon: ['Majestic Salon Spa & Academy', 'Kalamboli Beauty Lounge', 'Style Studio Sector 11'],
    food: ['Kalamboli Food Station', 'Sector 5E Dine House', 'Navi Mumbai Spice Hub'],
    home: ['Kalamboli Electric & Repair', 'Fast Home Support Kalamboli', 'Navi Service Grid'],
    health: ['Kalamboli Dental Point', 'Sector 11 Family Clinic', 'Metro Health Kalamboli'],
    retail: ['Kalamboli Retail Bazaar', 'Sector 2E Grocery House', 'Everyday Needs Kalamboli'],
    services: ['Kalamboli CA Support', 'Business Services Kalamboli', 'SME Desk Navi Mumbai'],
  },
};
const SEO_DEFAULT_LISTING_NAMES = {
  salon: ['Trusted Family Salon', 'Premium Wellness Studio', 'Neighbourhood Grooming Hub'],
  food: ['Popular Dining Destination', 'Top-Rated Family Restaurant', 'Local Food Specialist'],
  retail: ['Reliable Neighborhood Store', 'Daily Essentials Mart', 'High-Rating Retail Outlet'],
  health: ['Verified Local Clinic', 'Top Rated Dental Center', 'Trusted Healthcare Point'],
  home: ['Verified Electrician Services', 'Home Repair Specialist', 'Local Maintenance Partner'],
  services: ['Certified Professional Services', 'Business Advisory Partner', 'Trusted Local Consultant'],
};

let cachedIndexTemplate = null;

const seoIntentBySlug = new Map(SEO_ROUTE_INTENTS.map((intent) => [intent.slug, intent]));
const seoIntentByCategoryAndQuery = new Map(
  SEO_ROUTE_INTENTS.map((intent) => [`${intent.categoryId}::${intent.q.toLowerCase()}`, intent]),
);
const seoDefaultIntentByCategory = new Map();
for (const intent of SEO_ROUTE_INTENTS) {
  if (!seoDefaultIntentByCategory.has(intent.categoryId)) {
    seoDefaultIntentByCategory.set(intent.categoryId, intent);
  }
}

function getOrigin(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : String(forwardedProto || '').split(',')[0]) || req.protocol;
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
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

function buildSeoPath(localityId, categoryId, q) {
  const localityPath = buildLocalityPath(localityId);
  if (!categoryId || categoryId === 'all') return localityPath;
  const normalizedQuery = (q || '').trim().toLowerCase();
  if (normalizedQuery) {
    const matchedIntent = seoIntentByCategoryAndQuery.get(`${categoryId}::${normalizedQuery}`);
    if (matchedIntent) return `${localityPath}/${matchedIntent.slug}`;
  }
  const defaultIntent = seoDefaultIntentByCategory.get(categoryId);
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

function resolveLegacySeoRedirectPath(query) {
  const localitySlug = slugifyForUrl(queryValueAsString(query.locality));
  if (!localitySlug || !SEO_LOCALITY_IDS.includes(localitySlug)) return null;

  const categorySlug = slugifyForUrl(queryValueAsString(query.category));
  let categoryId = SEO_CATEGORY_IDS.includes(categorySlug) ? categorySlug : null;
  let searchQuery = queryValueAsString(query.q).trim();

  if (!categoryId && searchQuery) {
    const searchIntent = seoIntentBySlug.get(slugifyForUrl(searchQuery));
    if (!searchIntent) return null;
    categoryId = searchIntent.categoryId;
    searchQuery = searchIntent.q;
  }

  if (categoryId && searchQuery) {
    const matchedIntent = seoIntentByCategoryAndQuery.get(`${categoryId}::${searchQuery.toLowerCase()}`);
    if (matchedIntent) {
      return buildSeoPath(localitySlug, matchedIntent.categoryId, matchedIntent.q);
    }
  }

  return buildSeoPath(localitySlug, categoryId, null);
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

function getLocalityFromHost(req) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const rawHost = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get('host') || '';
  const hostname = String(rawHost).split(',')[0].split(':')[0].toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return null;
  const parts = hostname.split('.');
  if (parts.length < 2) return null;
  const candidate = slugifyForUrl(parts[0]);
  return SEO_LOCALITY_IDS.includes(candidate) ? candidate : null;
}

function parseSeoRoute(pathname, forcedLocalityId = null) {
  const segments = String(pathname || '/')
    .split('/')
    .filter(Boolean)
    .map((segment) => slugifyForUrl(decodeURIComponent(segment)));

  const localityId = forcedLocalityId || segments[0] || null;
  if (!localityId || !SEO_LOCALITY_IDS.includes(localityId)) return null;

  let localSegments = segments;
  if (forcedLocalityId) {
    if (segments[0] === forcedLocalityId) {
      localSegments = segments.slice(1);
    } else if (SEO_LOCALITY_IDS.includes(segments[0])) {
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
    intent = seoIntentBySlug.get(pageSlug) || null;
    if (intent) {
      categoryId = intent.categoryId;
    } else if (SEO_CATEGORY_IDS.includes(pageSlug)) {
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

function getListingNamesForRoute(localityId, categoryId) {
  const localityListings = SEO_TOP_LISTINGS[localityId] || {};
  const fromLocality = categoryId ? localityListings[categoryId] : null;
  if (Array.isArray(fromLocality) && fromLocality.length > 0) return fromLocality;
  if (categoryId && SEO_DEFAULT_LISTING_NAMES[categoryId]) return SEO_DEFAULT_LISTING_NAMES[categoryId];
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

function buildSeoRouteModel(origin, route) {
  const localityMeta = SEO_LOCALITY_META[route.localityId];
  if (!localityMeta) return null;

  const localityPath = buildLocalityPath(route.localityId);
  const canonicalPath = buildSeoPath(route.localityId, route.categoryId, route.intent?.q || null);
  const listingSuffix = route.listingSlug ? `/${route.listingSlug}` : '';
  const canonicalUrl = `${origin}${canonicalPath}${listingSuffix}`;
  const categoryLabel = route.categoryId ? (SEO_CATEGORY_LABELS[route.categoryId] || humanizeSlug(route.categoryId)) : null;
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

  const listingNames = getListingNamesForRoute(route.localityId, route.categoryId || 'salon');
  const listingLinks = listingNames.map((name, index) => ({
    name,
    href: `${buildSeoPath(route.localityId, route.categoryId || 'salon', route.intent?.q || null)}/${buildListingSlug(name, `${route.localityId}-${index + 1}`)}`,
  }));

  const internalLinks = SEO_ROUTE_INTENTS.map((intent) => ({
    label: `${intent.q} in ${localityMeta.name}`,
    href: buildSeoPath(route.localityId, intent.categoryId, intent.q),
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
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM app_users');
      for (const user of users) {
        await client.query(
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
      await client.query('COMMIT');
      return;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
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
    return listings || [];
  }

  if (Array.isArray(memoryBusinesses)) return memoryBusinesses;
  try {
    const raw = await fs.readFile(businessesPath, 'utf8');
    const data = JSON.parse(raw);
    return sanitizeBusinessListings(data) || [];
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
          businessesEndpoint: '/api/businesses',
          auditEventsEndpoint: '/api/audit-events',
          autoSyncHomepage: true,
          autoSyncBusinesses: true,
        },
  };
}

async function readHomepageConfig() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['homepage_config'],
    );
    const data = result.rows[0]?.value;
    return sanitizeHomepageConfig(data);
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
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['homepage_config', JSON.stringify(sanitized)],
    );
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
  if (pgInitAttempted) return pgClient;
  pgInitAttempted = true;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  try {
    const { Client } = await import('pg');
    pgClient = new Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    });
    await pgClient.connect();
    await pgClient.query(`
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
    await pgClient.query(`
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
    await pgClient.query(`
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
    await pgClient.query(`
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
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    return pgClient;
  } catch (err) {
    console.error('Postgres audit logging unavailable, using file fallback:', err?.message || err);
    pgClient = null;
    return null;
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

app.get('/api/homepage-config', async (_req, res) => {
  try {
    const config = await readHomepageConfig();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('Failed to read homepage config:', err);
    res.status(500).json({ ok: false, error: 'Failed to read homepage config' });
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

app.post('/api/auth/register', async (req, res) => {
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

  try {
    await verifyMsg91Otp(challenge.mobile, String(otp).trim());
    await markOtpChallengeUsed(challenge.challengeId);
    res.json({ ok: true, mobile: challenge.mobile });
  } catch (err) {
    console.error('Failed to verify contact unlock OTP:', err);
    res.status(401).json({ ok: false, error: err?.message || 'Invalid OTP' });
  }
});

app.post('/api/contact-unlock/record-view', async (req, res) => {
  const { businessId, viewerPhone, viewerName, deviceId } = req.body || {};
  const normalizedBusinessId = String(businessId || '').trim();
  const normalizedDeviceId = normalizeDeviceId(deviceId || req.headers['x-device-id']);
  const normalizedPhone = normalizePhoneDigits(viewerPhone);
  const payload = authFromHeader(req);
  const loginKey = payload?.sub ? `user:${payload.sub}` : normalizedPhone ? `phone:${normalizedPhone}` : '';
  const ipAddress = normalizeRequestIp(req);

  if (!normalizedBusinessId) {
    return res.status(400).json({ ok: false, error: 'businessId is required' });
  }
  if (!loginKey) {
    return res.status(400).json({ ok: false, error: 'viewerPhone or authenticated session is required' });
  }
  if (!normalizedDeviceId) {
    return res.status(400).json({ ok: false, error: 'deviceId is required' });
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
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      role: user.role,
      status: user.status,
    },
  });
});

app.post('/api/audit-events', async (req, res) => {
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

app.get('/', (req, res, next) => {
  const redirectPath = resolveLegacySeoRedirectPath(req.query || {});
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

  const hostLocality = getLocalityFromHost(req);
  if (hostLocality) {
    return res.redirect(301, buildLocalityPath(hostLocality));
  }
  return next();
});

app.get('/:pageSlug', (req, res, next) => {
  const hostLocality = getLocalityFromHost(req);
  if (!hostLocality) return next();

  const pageSlug = slugifyForUrl(req.params.pageSlug || '');
  if (!pageSlug) return next();
  if (pageSlug === hostLocality) return next();
  if (pageSlug === 'robots-txt' || pageSlug === 'sitemap-xml' || pageSlug.startsWith('api')) return next();

  if (seoIntentBySlug.has(pageSlug) || SEO_CATEGORY_IDS.includes(pageSlug)) {
    return res.redirect(301, `${buildLocalityPath(hostLocality)}/${pageSlug}`);
  }
  return next();
});

app.get(['/:localitySlug', '/:localitySlug/:pageSlug', '/:localitySlug/:pageSlug/:listingSlug'], async (req, res, next) => {
  const hostLocality = getLocalityFromHost(req);
  const route = parseSeoRoute(req.path, hostLocality);
  if (!route) return next();

  const canonicalPath = buildSeoPath(route.localityId, route.categoryId, route.intent?.q || null);
  const requestPath = req.path.endsWith('/') && req.path.length > 1 ? req.path.slice(0, -1) : req.path;
  const canonicalMatch = requestPath === canonicalPath || requestPath.startsWith(`${canonicalPath}/`);
  if (!canonicalMatch) {
    const suffix = route.listingSlug ? `/${route.listingSlug}` : '';
    return res.redirect(301, `${canonicalPath}${suffix}`);
  }

  const template = await getIndexTemplate();
  if (!template) return next();

  const origin = getOrigin(req);
  const model = buildSeoRouteModel(origin, route);
  if (!model) return next();
  const jsonLd = renderSeoJsonLd(origin, model);
  const seoBodyHtml = renderSeoBodyHtml(model);
  const withBody = template.replace('<div id="root"></div>', `<div id="root">${seoBodyHtml}</div>`);
  const renderedHtml = applySeoHeadTags(withBody, model, jsonLd);
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  return res.type('text/html').send(renderedHtml);
});

app.get('/robots.txt', (req, res) => {
  const origin = getOrigin(req);
  const hostLocality = getLocalityFromHost(req);
  const lines = [
    'User-agent: *',
    'Allow: /',
  ];
  if (hostLocality) {
    lines.push(`Host: ${SEO_LOCALITY_META[hostLocality]?.subdomain || req.hostname}`);
  }
  lines.push('', `Sitemap: ${origin}/sitemap.xml`);
  res.type('text/plain').send(lines.join('\n'));
});

app.get('/seo-image.svg', (req, res) => {
  const rawTitle = String(req.query.title || SEO_SITE_NAME).slice(0, 120);
  const rawSubtitle = String(req.query.subtitle || 'Verified local businesses across Navi Mumbai').slice(0, 160);
  const rawBrand = String(req.query.brand || SEO_SITE_NAME).slice(0, 80);
  const rawTagline = String(req.query.tagline || SEO_SITE_PROMISE).slice(0, 120);

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
  <text x="84" y="510" fill="#bfdbfe" font-family="Inter,Arial,sans-serif" font-size="26" font-weight="600">Roadpali, Kalamboli, Kharghar, Kamothe, Panvel and Taloja</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.send(svg);
});

app.get('/sitemap.xml', (req, res) => {
  const origin = getOrigin(req);
  const hostLocality = getLocalityFromHost(req);
  const urlSet = new Set(['/']);

  const localityTargets = hostLocality ? [hostLocality] : SEO_LOCALITY_IDS;
  for (const localityId of localityTargets) {
    urlSet.add(buildLocalityPath(localityId));
    for (const categoryId of SEO_CATEGORY_IDS) {
      urlSet.add(buildSeoPath(localityId, categoryId, null));
    }
    for (const intent of SEO_ROUTE_INTENTS) {
      urlSet.add(buildSeoPath(localityId, intent.categoryId, intent.q));
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
