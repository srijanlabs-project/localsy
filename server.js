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
const TOKEN_SECRET = process.env.AUTH_SECRET || 'replace-this-in-production';
const TOKEN_TTL_SEC = 60 * 60 * 12; // 12 hours

app.use(express.json({ limit: '5mb' }));
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

const PUBLIC_USER_TYPES = ['buyer', 'seller', 'resource'];
const ALL_USER_TYPES = ['platform_admin', 'developer', 'buyer', 'seller', 'resource'];
const SEO_LOCALITY_IDS = ['roadpali', 'kalamboli', 'kharghar', 'kamothe', 'panvel', 'taloja'];
const SEO_CATEGORY_IDS = ['salon', 'food', 'retail', 'health', 'home', 'services'];
const SEO_CATEGORY_LABELS = {
  salon: 'Salons & Wellness',
  food: 'Food & Dining',
  retail: 'Shops & Retail',
  health: 'Health & Medical',
  home: 'Home Services',
  services: 'Professional Services',
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
    ? `${listingLabel} in ${localityMeta.name} | Happy Gifting Businesses`
    : route.categoryId
    ? `${routeHeading} in ${localityMeta.name} | Happy Gifting Businesses`
    : `${localityMeta.name} Local Business Directory | Happy Gifting Businesses`;
  const pageDescription = listingLabel
    ? `View business details, service profile, and verified local context for ${listingLabel} in ${localityMeta.name}, ${localityMeta.city}.`
    : route.categoryId
    ? `Explore verified ${routeHeading.toLowerCase()} in ${localityMeta.name}, ${localityMeta.city}. Check ratings, service areas, contact options, and trusted local providers.`
    : `Discover verified businesses in ${localityMeta.name}, ${localityMeta.city}. Compare local services, clinics, restaurants, and neighborhood stores in one place.`;

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
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:card["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:title["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<meta\s+name=["']twitter:description["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/ig, '');
  updatedHtml = updatedHtml.replace(/<script[^>]*id=["']server-seo-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/ig, '');

  const escapedDescription = htmlEscape(model.pageDescription);
  const escapedCanonical = htmlEscape(model.canonicalUrl);
  const keywordContent = [
    `${model.localityMeta.name} businesses`,
    model.categoryLabel ? `${model.categoryLabel} in ${model.localityMeta.name}` : '',
    ...model.internalLinks.slice(0, 4).map((item) => item.label),
  ]
    .filter(Boolean)
    .join(', ');
  const escapedKeywords = htmlEscape(keywordContent);
  const seoHeadTags = [
    `<meta name="description" content="${escapedDescription}">`,
    `<meta name="keywords" content="${escapedKeywords}">`,
    `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Happy Gifting Businesses">`,
    `<meta property="og:title" content="${escapedTitle}">`,
    `<meta property="og:description" content="${escapedDescription}">`,
    `<meta property="og:url" content="${escapedCanonical}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapedTitle}">`,
    `<meta name="twitter:description" content="${escapedDescription}">`,
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

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, userType } = req.body || {};
  if (!name || !email || !password || !userType) {
    return res.status(400).json({ ok: false, error: 'name, email, password and userType are required' });
  }
  if (!ALL_USER_TYPES.includes(userType)) {
    return res.status(400).json({ ok: false, error: 'Invalid userType' });
  }

  const requester = authFromHeader(req);
  const canCreatePrivileged = requester && ['platform_admin', 'developer'].includes(requester.userType);
  if (!PUBLIC_USER_TYPES.includes(userType) && !canCreatePrivileged) {
    return res.status(403).json({ ok: false, error: 'Only platform_admin/developer can create this user type' });
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
    passwordHash: await hashPassword(String(password)),
    createdAt: nowIso(),
    status: 'active',
  };
  users.push(created);
  await writeUsers(users);

  res.status(201).json({
    ok: true,
    user: {
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      userType: created.userType,
      role: created.role,
      status: created.status,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'email and password are required' });
  }
  const users = await readUsers();
  const user = users.find((u) => u.email === String(email).toLowerCase().trim());
  if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  const valid = await verifyPassword(String(password), user.passwordHash);
  if (!valid) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  if (user.status !== 'active') return res.status(403).json({ ok: false, error: 'User is not active' });

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
  const required = ['id', 'timestamp', 'actionType', 'description', 'details', 'ipAddress', 'deviceCode', 'userName'];
  const missing = required.filter((k) => payload[k] === undefined || payload[k] === null);
  if (missing.length > 0) {
    return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` });
  }

  const event = {
    id: String(payload.id),
    timestamp: String(payload.timestamp),
    actionType: String(payload.actionType),
    description: String(payload.description),
    details: String(payload.details),
    ipAddress: String(payload.ipAddress),
    deviceCode: String(payload.deviceCode),
    userName: String(payload.userName),
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
