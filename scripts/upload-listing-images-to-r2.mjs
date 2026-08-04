import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import xlsx from 'xlsx';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const LISTING_ID_HEADERS = ['localisy listing id', 'listing id', 'localisylistingid', 'listingid'];
const GOOGLE_PLACE_ID_HEADERS = ['google place id', 'googleplaceid', 'place id', 'placeid'];

const STORAGE_ENDPOINT_URL = process.env.S3_ENDPOINT_URL || process.env.STORAGE_ENDPOINT_URL || '';
const STORAGE_BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.STORAGE_BUCKET_NAME || '';
const STORAGE_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY_ID || '';
const STORAGE_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_ACCESS_KEY || '';
const STORAGE_REGION = process.env.S3_REGION || process.env.STORAGE_REGION || 'auto';
const STORAGE_PUBLIC_BASE_URL = process.env.STORAGE_PUBLIC_BASE_URL || '';
const STORAGE_FORCE_PATH_STYLE = String(process.env.S3_FORCE_PATH_STYLE || process.env.STORAGE_FORCE_PATH_STYLE || '').toLowerCase() === 'true';

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function usage() {
  console.log(`Usage:
node scripts/upload-listing-images-to-r2.mjs --catalog <catalog.xlsx|csv> --photos-dir <folder> [--folder-prefix listings] [--manifest uploads/listing-images.json] [--limit 25]

Folder conventions supported:
1. <photos-dir>/<listingId>/cover.jpg + more files inside that folder
2. <photos-dir>/<listingId>.jpg
3. <photos-dir>/<listingId>-1.jpg, <listingId>-2.jpg, etc.

Required env for Cloudflare R2:
- S3_ENDPOINT_URL or STORAGE_ENDPOINT_URL
- S3_BUCKET_NAME or STORAGE_BUCKET_NAME
- S3_ACCESS_KEY_ID / AWS_ACCESS_KEY_ID / STORAGE_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY / AWS_SECRET_ACCESS_KEY / STORAGE_SECRET_ACCESS_KEY

Optional:
- STORAGE_PUBLIC_BASE_URL for direct Cloudflare-delivered URLs
- S3_FORCE_PATH_STYLE=true when needed by your endpoint
`);
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase();
}

function findColumn(row, acceptedHeaders) {
  const keys = Object.keys(row || {});
  const matchedKey = keys.find((key) => acceptedHeaders.includes(normalizeHeader(key)));
  return matchedKey ? String(row[matchedKey] || '').trim() : '';
}

function ensureStorageConfigured() {
  if (!STORAGE_ENDPOINT_URL || !STORAGE_BUCKET_NAME || !STORAGE_ACCESS_KEY_ID || !STORAGE_SECRET_ACCESS_KEY) {
    throw new Error('Storage credentials are not configured for Cloudflare R2 upload.');
  }
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
  return getStorageRequestUrl(key);
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
  ensureStorageConfigured();
  const requestUrl = getStorageRequestUrl(key);
  const { dateStamp, amzDate } = getAwsTimestamp();
  const parsed = new URL(requestUrl);
  const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
  const canonicalHeaders = [
    `host:${parsed.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ];
  const signedHeaders = ['host', 'x-amz-content-sha256', 'x-amz-date'];

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

  const response = await fetch(requestUrl, {
    method: 'PUT',
    headers: {
      Authorization: authorizationHeader,
      Host: parsed.host,
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Upload failed for ${key} (${response.status}): ${errorText || response.statusText}`);
  }

  return getStoragePublicUrl(key);
}

async function getImageFilesForListing(photosDir, listingId) {
  const listingFolder = path.join(photosDir, listingId);
  const matchedFiles = [];

  try {
    const folderStat = await fs.stat(listingFolder);
    if (folderStat.isDirectory()) {
      const folderEntries = await fs.readdir(listingFolder, { withFileTypes: true });
      folderEntries
        .filter((entry) => entry.isFile())
        .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        .sort((left, right) => left.name.localeCompare(right.name))
        .forEach((entry) => matchedFiles.push(path.join(listingFolder, entry.name)));
      if (matchedFiles.length > 0) return matchedFiles;
    }
  } catch (_error) {
    // Fall back to root-level matching.
  }

  const rootEntries = await fs.readdir(photosDir, { withFileTypes: true });
  return rootEntries
    .filter((entry) => entry.isFile())
    .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .filter((entry) => {
      const baseName = path.parse(entry.name).name.toLowerCase();
      const candidateId = listingId.toLowerCase();
      return baseName === candidateId || baseName.startsWith(`${candidateId}-`) || baseName.startsWith(`${candidateId}_`);
    })
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => path.join(photosDir, entry.name));
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ];
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help === 'true' || !args.catalog || !args['photos-dir']) {
    usage();
    process.exit(args.help === 'true' ? 0 : 1);
  }

  ensureStorageConfigured();

  const catalogPath = path.resolve(args.catalog);
  const photosDir = path.resolve(args['photos-dir']);
  const folderPrefix = String(args['folder-prefix'] || 'listings').replace(/^\/+|\/+$/g, '');
  const manifestPath = path.resolve(args.manifest || path.join(process.cwd(), 'tmp', 'listing-image-manifest.json'));
  const limit = Number(args.limit || 0);

  const workbook = xlsx.readFile(catalogPath);
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(firstSheet, { defval: '' });

  const catalogRows = rows
    .map((row) => ({
      listingId: findColumn(row, LISTING_ID_HEADERS),
      googlePlaceId: findColumn(row, GOOGLE_PLACE_ID_HEADERS),
    }))
    .filter((row) => row.listingId);

  const selectedRows = limit > 0 ? catalogRows.slice(0, limit) : catalogRows;
  const manifest = [];

  for (const row of selectedRows) {
    const imageFiles = await getImageFilesForListing(photosDir, row.listingId);
    if (imageFiles.length === 0) {
      manifest.push({
        listingId: row.listingId,
        googlePlaceId: row.googlePlaceId,
        uploadedCount: 0,
        coverImageUrl: '',
        galleryUrls: '',
        status: 'missing_images',
      });
      continue;
    }

    const uploadedUrls = [];
    for (let index = 0; index < imageFiles.length; index += 1) {
      const sourcePath = imageFiles[index];
      const extension = path.extname(sourcePath).toLowerCase() || '.jpg';
      const targetFileName = index === 0 ? `cover${extension}` : `gallery-${index}${extension}`;
      const targetKey = `${folderPrefix}/${row.listingId}/${targetFileName}`;
      const buffer = await fs.readFile(sourcePath);
      const mimeType =
        extension === '.png' ? 'image/png'
          : extension === '.webp' ? 'image/webp'
            : extension === '.gif' ? 'image/gif'
              : extension === '.avif' ? 'image/avif'
                : 'image/jpeg';
      const publicUrl = await uploadObjectToStorage({
        key: targetKey,
        body: buffer,
        contentType: mimeType,
      });
      uploadedUrls.push(publicUrl);
    }

    manifest.push({
      listingId: row.listingId,
      googlePlaceId: row.googlePlaceId,
      uploadedCount: uploadedUrls.length,
      coverImageUrl: uploadedUrls[0] || '',
      galleryUrls: uploadedUrls.slice(1).join(' | '),
      status: 'uploaded',
    });
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  const csvManifestPath = manifestPath.replace(/\.json$/i, '.csv');
  await fs.writeFile(csvManifestPath, toCsv(manifest), 'utf8');

  console.log(`Processed ${selectedRows.length} listings.`);
  console.log(`JSON manifest: ${manifestPath}`);
  console.log(`CSV manifest: ${csvManifestPath}`);
  console.log(`Uploaded: ${manifest.filter((row) => row.status === 'uploaded').length}`);
  console.log(`Missing images: ${manifest.filter((row) => row.status === 'missing_images').length}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
