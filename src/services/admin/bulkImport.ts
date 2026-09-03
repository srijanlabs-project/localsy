// Shared CSV bulk-import parsing/validation logic, extracted from AdminConsole.tsx so the new,
// separately-routed Bulk Import page (admin-backend-ux-spec.md Section 5.6) and the legacy
// console can share one implementation. Everything here is pure (no React) — see
// src/hooks/admin/useBulkImportWorkflow.ts for the stateful wrapper both screens use.
import type { Business, Locality, PincodeRoutingMapping } from '../../types';
import { MASTER_AREAS, MASTER_CITIES, MASTER_LOCALITIES, MASTER_STATES } from '../../geographyMaster';
import { BUSINESS_CATEGORIES, BUSINESS_SUBCATEGORIES, getCategoryById, getSubcategoryById } from '../../categoryMaster';
import { buildListingTags, buildUniqueAdminId, isBusinessTaxonomyMapped, slugifyAdminValue } from './adminConsoleUtils';

// One upload's row ceiling. It used to be 3,000 because an import was a single
// request that rewrote the whole 26,000-listing document, so a bigger file meant
// a multi-minute request that a closed tab would lose. Imports are queued now:
// measured on real listing data at 663 bytes/row, 9,000 rows is a 5.2 MB request
// that enqueues in 251ms and writes in 341ms. The remaining ceiling is the 20 MB
// express body limit (~25,000 rows), which this stays well clear of even for
// records with long descriptions and gallery URLs.
export const BULK_IMPORT_CHUNK_SIZE = 9000;

export type BulkImportRow = {
  listingId?: string;
  googlePlaceId?: string;
  imageUrl?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  galleryUrls?: string;
  businessName: string;
  address: string;
  area: string;
  locality?: string;
  city: string;
  state: string;
  pin: string;
  mobile: string;
  rating: string;
  reviews: string;
  services: string;
  category?: string;
  subcategory?: string;
  latitude: string;
  longitude: string;
  importAction?: 'create' | 'update';
  existingBusinessId?: string;
  localityId?: string;
  areaId?: string;
  categoryId?: string;
  subcategoryId?: string;
  sourceCategoryLabel?: string;
  sourceSubcategoryLabel?: string;
  taxonomyMapped?: boolean;
  tags?: string[];
};

export type ImportPreviewRow = BulkImportRow & {
  rowNumber: number;
  previewStatus: 'ready' | 'update' | 'fail';
  errors: string[];
  normalizedPhone: string;
  resolvedPincode: string;
  resolvedLocalityId: string;
  requiresTaxonomyMapping: boolean;
  taxonomyStatusLabel: string;
};

export type ResolvedImportGeography = {
  resolvedPincode: string;
  resolvedLocalityId: string;
  resolvedCityId: string;
  resolvedStateId: string;
  areaId: string;
  errors: string[];
};

type ImportContext = {
  businesses: Business[];
  localities: Locality[];
  pincodeMappings: PincodeRoutingMapping[];
};

export const parseCsvLine = (line: string) => (
  line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((s) => s.trim().replace(/^"|"$/g, ''))
);

export const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

export const resolveCategoryFromImport = (categoryName: string | undefined) => {
  const normalized = String(categoryName || '').trim().toLowerCase();
  if (!normalized) return '';
  const direct = BUSINESS_CATEGORIES.find((category) => (
    [category.id, category.slug, category.name.toLowerCase()].includes(normalized)
  ));
  return direct?.id || '';
};

export const resolveSubcategoryFromImport = (subcategoryName: string | undefined, categoryId: string) => {
  const normalized = String(subcategoryName || '').trim().toLowerCase();
  if (!normalized || !categoryId) return '';
  const direct = BUSINESS_SUBCATEGORIES.find((subcategory) => (
    subcategory.categoryId === categoryId &&
    [subcategory.id, subcategory.slug, subcategory.name.toLowerCase()].includes(normalized)
  ));
  return direct?.id || '';
};

const normalizeImportGeoLookup = (value: string) => slugifyAdminValue(String(value || ''));

export const resolveImportGeography = (row: BulkImportRow, ctx: Pick<ImportContext, 'localities' | 'pincodeMappings'>): ResolvedImportGeography => {
  const { localities, pincodeMappings } = ctx;
  const errors: string[] = [];
  const requestedPincode = String(row.pin || '').replace(/\D/g, '').slice(0, 6);
  const requestedAreaId = String(row.areaId || '').trim();
  const requestedLocalityId = String(row.localityId || '').trim();
  const requestedLocalityName = String(row.locality || '').trim();
  const requestedAreaName = String(row.area || '').trim();
  const requestedCityName = String(row.city || '').trim();
  const requestedStateName = String(row.state || '').trim();

  const explicitLocality = requestedLocalityId
    ? MASTER_LOCALITIES.find((locality) => locality.id === requestedLocalityId)
    : undefined;
  const namedLocality = requestedLocalityName
    ? MASTER_LOCALITIES.find((locality) => {
        const publicLocalityName = localities.find((entry) => entry.id === locality.id)?.name || '';
        return (
          normalizeImportGeoLookup(locality.name) === normalizeImportGeoLookup(requestedLocalityName) ||
          normalizeImportGeoLookup(publicLocalityName) === normalizeImportGeoLookup(requestedLocalityName)
        );
      })
    : undefined;
  const textMatchedLocality = !explicitLocality && !namedLocality
    ? MASTER_LOCALITIES.find((locality) => {
        const publicLocalityName = localities.find((entry) => entry.id === locality.id)?.name || '';
        const localityNeedle = normalizeImportGeoLookup(locality.name || publicLocalityName);
        const haystack = normalizeImportGeoLookup(`${requestedAreaName} ${requestedCityName} ${requestedStateName}`);
        return Boolean(localityNeedle) && haystack.includes(localityNeedle);
      })
    : undefined;

  const localityHintId = explicitLocality?.id || namedLocality?.id || textMatchedLocality?.id || '';
  const requestedAreaLookup = normalizeImportGeoLookup(requestedAreaName);
  const explicitArea = requestedAreaId
    ? MASTER_AREAS.find((area) => area.id === requestedAreaId)
    : undefined;
  const namedArea = requestedAreaLookup
    ? MASTER_AREAS.find((area) => {
        const areaName = normalizeImportGeoLookup(area.name);
        if (!areaName) return false;
        if (localityHintId && area.localityId !== localityHintId) return false;
        return areaName === requestedAreaLookup || areaName.includes(requestedAreaLookup) || requestedAreaLookup.includes(areaName);
      })
    : undefined;
  const pincodeArea = requestedPincode
    ? MASTER_AREAS.find((area) => area.pincode === requestedPincode && (!localityHintId || area.localityId === localityHintId))
    : undefined;

  const mappedLocalityId = requestedPincode
    ? pincodeMappings.find((mapping) => mapping.pincode === requestedPincode)?.localityId || ''
    : '';

  const resolvedArea = explicitArea || namedArea || pincodeArea;
  const resolvedLocality = explicitLocality
    || namedLocality
    || (resolvedArea ? MASTER_LOCALITIES.find((locality) => locality.id === resolvedArea.localityId) : undefined)
    || (mappedLocalityId ? MASTER_LOCALITIES.find((locality) => locality.id === mappedLocalityId) : undefined)
    || textMatchedLocality;
  const resolvedCity = resolvedArea
    ? MASTER_CITIES.find((city) => city.id === resolvedArea.cityId)
    : resolvedLocality
      ? MASTER_CITIES.find((city) => city.id === resolvedLocality.cityId)
      : undefined;
  const resolvedState = resolvedCity
    ? MASTER_STATES.find((state) => state.id === resolvedCity.stateId)
    : undefined;

  if (requestedLocalityId && !explicitLocality) {
    errors.push(`Locality ID "${requestedLocalityId}" was not found in geography master.`);
  }
  if (requestedLocalityName && !namedLocality) {
    errors.push(`Locality "${requestedLocalityName}" was not found in geography master.`);
  }
  if (requestedPincode.length !== 6) {
    errors.push('Valid 6-digit PIN is required.');
  }
  if (!resolvedLocality) {
    errors.push('Could not resolve locality from Locality / Area / PIN mapping. Area is optional, but Locality or a mapped PIN is still required.');
  }
  if (mappedLocalityId && resolvedLocality && mappedLocalityId !== resolvedLocality.id) {
    const mappedLocalityName = localities.find((entry) => entry.id === mappedLocalityId)?.name || mappedLocalityId;
    errors.push(`PIN ${requestedPincode} is routed to ${mappedLocalityName}, but the row points to ${resolvedLocality.name}.`);
  }
  if (requestedCityName && resolvedCity && normalizeImportGeoLookup(resolvedCity.name) !== normalizeImportGeoLookup(requestedCityName)) {
    errors.push(`City "${requestedCityName}" does not match resolved locality city "${resolvedCity.name}".`);
  }
  if (requestedStateName && resolvedState && normalizeImportGeoLookup(resolvedState.name) !== normalizeImportGeoLookup(requestedStateName)) {
    errors.push(`State "${requestedStateName}" does not match resolved locality state "${resolvedState.name}".`);
  }

  return {
    resolvedPincode: requestedPincode || resolvedArea?.pincode || '',
    resolvedLocalityId: resolvedLocality?.id || '',
    resolvedCityId: resolvedCity?.id || '',
    resolvedStateId: resolvedState?.id || '',
    areaId: resolvedArea?.id || '',
    errors,
  };
};

// Every lookup this function needs against the existing directory, built once.
//
// It used to do three `businesses.find(...)` scans per row, and the duplicate
// scan ran `MASTER_AREAS.find(...)` inside it for every candidate. Against
// 26,000 existing listings that is the dominant cost of a bulk import by a wide
// margin: measured at 14.3 s for a 2,990-row file and 35.8 s for 9,000 rows,
// all of it blocking the admin's browser — far more than the server ever spent.
// With these maps the same work is a hash lookup per row.
const buildImportLookups = (businesses: Business[]) => {
  const areaPincodeById = new Map<string, string>();
  for (const area of MASTER_AREAS) {
    areaPincodeById.set(String(area.id), String(area.pincode || ''));
  }

  const byIdKey = new Map<string, Business>();
  const byGooglePlaceIdKey = new Map<string, Business>();
  const byDuplicateKey = new Map<string, Business>();

  for (const business of businesses) {
    const idKey = String(business.id || '').trim().toLowerCase();
    // First match wins, matching the `.find()` these maps replace.
    if (idKey && !byIdKey.has(idKey)) byIdKey.set(idKey, business);

    const placeIdKey = String(business.googlePlaceId || '').trim().toLowerCase();
    if (placeIdKey && !byGooglePlaceIdKey.has(placeIdKey)) byGooglePlaceIdKey.set(placeIdKey, business);

    // The duplicate rule is name + phone + pincode + locality, and it only ever
    // matched rows with a phone number, so rows without one are not indexed.
    const phone = normalizePhone(business.phone);
    if (!phone) continue;
    const pincode = business.pincode || areaPincodeById.get(String(business.areaId)) || '';
    const duplicateKey = `${business.name.trim().toLowerCase()}|${phone}|${pincode}|${business.localityId}`;
    if (!byDuplicateKey.has(duplicateKey)) byDuplicateKey.set(duplicateKey, business);
  }

  return { byIdKey, byGooglePlaceIdKey, byDuplicateKey };
};

export const buildImportPreview = (rows: BulkImportRow[], ctx: ImportContext): ImportPreviewRow[] => {
  const { businesses, localities } = ctx;
  const { byIdKey, byGooglePlaceIdKey, byDuplicateKey } = buildImportLookups(businesses);
  const localityIds = new Set(localities.map((locality) => locality.id));
  const reservedExistingIds = new Set(
    businesses.map((business) => String(business.id || '').trim().toLowerCase()).filter(Boolean)
  );
  // One growing set rather than a fresh union per row: the old form copied every
  // existing id into a new Set for each row that needed an id generated, which
  // is what made an id-less file quadratic on its own.
  const takenIdKeys = new Set(reservedExistingIds);
  const previewAssignedIds = new Map<string, number>();
  const previewAssignedGooglePlaceIds = new Map<string, number>();

  return rows.map((row, idx): ImportPreviewRow => {
    const rowNumber = idx + 2;
    const errors: string[] = [];
    const normalizedPhone = normalizePhone(row.mobile);
    const geographyResolution = resolveImportGeography(row, ctx);
    const resolvedPincode = geographyResolution.resolvedPincode;
    const resolvedLocalityId = geographyResolution.resolvedLocalityId;
    const rawListingId = String(row.listingId || '').trim();
    const generatedListingSeed = `${row.businessName || 'listing'}-${normalizedPhone || resolvedPincode || rowNumber}`;
    const listingId = rawListingId || buildUniqueAdminId(`lst-${generatedListingSeed}`, takenIdKeys);
    const normalizedListingId = String(listingId || '').trim();
    const normalizedListingIdKey = normalizedListingId.toLowerCase();
    const normalizedGooglePlaceId = String(row.googlePlaceId || '').trim();
    const normalizedGooglePlaceIdKey = normalizedGooglePlaceId.toLowerCase();
    const categoryId = resolveCategoryFromImport(row.category);
    const subcategoryId = resolveSubcategoryFromImport(row.subcategory, categoryId);
    const requiresTaxonomyMapping = !isBusinessTaxonomyMapped({ categoryId, subcategoryId });
    const taxonomyStatusLabel = !String(row.category || '').trim()
      ? 'Category missing - send to mapping queue'
      : !categoryId
        ? `Category "${row.category}" not found in master data`
        : !String(row.subcategory || '').trim()
          ? 'Subcategory missing - send to mapping queue'
          : !subcategoryId
            ? `Subcategory "${row.subcategory}" not found under selected category`
            : 'Mapped to master taxonomy';
    // Neither the phone nor the business name belongs here: both are their own
    // fields and both are already in the search corpus, so putting them in tags
    // was pure duplication — 48,364 of the 222,751 tag entries in the current
    // set. The phone is searchable through the `phone` field instead.
    const tagPayload = buildListingTags(
      row.services || '',
      row.category || '',
      row.subcategory || '',
      getCategoryById(categoryId)?.name || '',
      getSubcategoryById(subcategoryId)?.name || ''
    );

    if (!row.businessName.trim()) errors.push('Business Name is required.');
    if (!normalizedListingId) errors.push('Localisy Listing ID is required.');
    if (normalizedPhone.length > 0 && normalizedPhone.length !== 10) errors.push('Mobile must be blank or a valid 10-digit number.');
    errors.push(...geographyResolution.errors);
    if (resolvedLocalityId && !localityIds.has(resolvedLocalityId)) {
      errors.push(`Mapped locality "${resolvedLocalityId}" does not exist.`);
    }
    const existingBusinessByListingId = normalizedListingIdKey
      ? byIdKey.get(normalizedListingIdKey)
      : undefined;
    const existingBusinessByGooglePlaceId = normalizedGooglePlaceIdKey
      ? byGooglePlaceIdKey.get(normalizedGooglePlaceIdKey)
      : undefined;
    if (normalizedListingIdKey && previewAssignedIds.has(normalizedListingIdKey)) {
      errors.push(`Localisy Listing ID "${normalizedListingId}" is duplicated in this upload sheet.`);
    }
    if (normalizedGooglePlaceIdKey && previewAssignedGooglePlaceIds.has(normalizedGooglePlaceIdKey)) {
      errors.push(`Google Place ID "${normalizedGooglePlaceId}" is duplicated in this upload sheet.`);
    }

    const duplicate = normalizedPhone.length > 0
      ? byDuplicateKey.get(
          `${row.businessName.trim().toLowerCase()}|${normalizedPhone}|${resolvedPincode}|${resolvedLocalityId}`,
        )
      : undefined;
    if (rawListingId && duplicate && existingBusinessByListingId && duplicate.id !== existingBusinessByListingId.id) {
      errors.push(`Localisy Listing ID "${normalizedListingId}" belongs to another listing. Matching listing already exists as "${duplicate.id}".`);
    }
    const allowedGooglePlaceBusinessId = existingBusinessByListingId?.id || duplicate?.id || '';
    if (
      normalizedGooglePlaceIdKey
      && existingBusinessByGooglePlaceId
      && existingBusinessByGooglePlaceId.id !== allowedGooglePlaceBusinessId
    ) {
      errors.push(`Google Place ID "${normalizedGooglePlaceId}" already exists on listing "${existingBusinessByGooglePlaceId.id}".`);
    }

    const previewStatus: ImportPreviewRow['previewStatus'] = errors.length ? 'fail' : (existingBusinessByListingId || duplicate) ? 'update' : 'ready';
    if (normalizedListingIdKey) {
      previewAssignedIds.set(normalizedListingIdKey, rowNumber);
      takenIdKeys.add(normalizedListingIdKey);
    }
    if (normalizedGooglePlaceIdKey) {
      previewAssignedGooglePlaceIds.set(normalizedGooglePlaceIdKey, rowNumber);
    }
    return {
      ...row,
      listingId: normalizedListingId,
      googlePlaceId: normalizedGooglePlaceId || undefined,
      rowNumber,
      previewStatus,
      errors,
      normalizedPhone,
      resolvedPincode,
      resolvedLocalityId,
      requiresTaxonomyMapping,
      taxonomyStatusLabel,
      importAction: (existingBusinessByListingId || duplicate) ? 'update' : 'create',
      existingBusinessId: existingBusinessByListingId?.id || duplicate?.id,
      localityId: resolvedLocalityId,
      areaId: geographyResolution.areaId || '',
      categoryId,
      subcategoryId,
      sourceCategoryLabel: row.category?.trim() || undefined,
      sourceSubcategoryLabel: row.subcategory?.trim() || undefined,
      taxonomyMapped: !requiresTaxonomyMapping,
      tags: tagPayload,
    };
  });
};

/** Parses a CSV File into raw BulkImportRow objects (unvalidated). Mirrors the column-header aliases the importer has always accepted. */
export const parseCsvFileToRows = async (file: File): Promise<BulkImportRow[]> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const get = (name: string) => {
      const idx = headers.indexOf(name.toLowerCase());
      return idx >= 0 ? (cols[idx] || '') : '';
    };
    const photoUrls = [
      get('Photo 1') || get('Photo1'),
      get('Photo 2') || get('Photo2'),
      get('Photo 3') || get('Photo3'),
      get('Photo 4') || get('Photo4'),
      get('Photo 5') || get('Photo5'),
    ].map((value) => String(value || '').trim()).filter(Boolean);
    return {
      listingId: get('Localisy Listing ID') || get('Listing ID') || get('LocalisyListingId') || get('ListingId'),
      googlePlaceId: get('Google Place ID') || get('GooglePlaceId') || get('Place ID') || get('PlaceId'),
      imageUrl: photoUrls[0] || get('Image URL') || get('ImageUrl'),
      logoUrl: get('Logo URL') || get('LogoUrl'),
      coverImageUrl: get('Cover Image URL') || get('CoverImageUrl') || photoUrls[1] || photoUrls[0] || '',
      galleryUrls: photoUrls.length > 0 ? photoUrls.join(', ') : (get('Gallery URLs') || get('GalleryUrls')),
      businessName: get('Business Name'),
      address: get('Address'),
      area: get('Area'),
      locality: get('Locality') || get('Locality Name'),
      localityId: get('Locality ID') || get('LocalityId'),
      areaId: get('Area ID') || get('AreaId'),
      city: get('City'),
      state: get('State'),
      pin: get('PIN'),
      mobile: get('Mobile'),
      rating: get('Rating'),
      reviews: get('Reviews'),
      services: get('Services'),
      category: get('Category'),
      subcategory: get('Subcategory'),
      latitude: get('Latitude'),
      longitude: get('Longitude'),
    };
  }).filter((r) => r.businessName.trim());
};

const escapeCsvValue = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;

export const buildFailedImportCsvContent = (failedRows: ImportPreviewRow[]) => {
  const header = ['Row', 'Localisy Listing ID', 'Google Place ID', 'Image URL', 'Logo URL', 'Cover Image URL', 'Gallery URLs', 'Business Name', 'Address', 'Area', 'Locality', 'Locality ID', 'Area ID', 'City', 'State', 'PIN', 'Mobile', 'Rating', 'Reviews', 'Services', 'Category', 'Subcategory', 'Latitude', 'Longitude', 'Error Details'];
  const body = failedRows.map((r) => [
    r.rowNumber, r.listingId || '', r.googlePlaceId || '', r.imageUrl || '', r.logoUrl || '', r.coverImageUrl || '', r.galleryUrls || '', r.businessName, r.address, r.area, r.locality || '', r.localityId || '', r.areaId || '', r.city, r.state, r.pin, r.mobile, r.rating, r.reviews, r.services, r.category || '', r.subcategory || '', r.latitude, r.longitude, r.errors.join('; '),
  ].map(escapeCsvValue).join(','));
  return [header.map(escapeCsvValue).join(','), ...body].join('\n');
};

export const buildImportPreviewCsvContent = (previewRows: ImportPreviewRow[]) => {
  const header = ['Row', 'Localisy Listing ID', 'Google Place ID', 'Image URL', 'Logo URL', 'Cover Image URL', 'Gallery URLs', 'Business Name', 'Address', 'Area', 'Locality', 'Locality ID', 'Area ID', 'City', 'State', 'PIN', 'Mobile', 'Rating', 'Reviews', 'Services', 'Category', 'Subcategory', 'Latitude', 'Longitude', 'Preview Status', 'Existing Business ID', 'Error Details'];
  const body = previewRows.map((row) => [
    row.rowNumber,
    row.listingId || '',
    row.googlePlaceId || '',
    row.imageUrl || '',
    row.logoUrl || '',
    row.coverImageUrl || '',
    row.galleryUrls || '',
    row.businessName,
    row.address,
    row.area,
    row.locality || '',
    row.localityId || '',
    row.areaId || '',
    row.city,
    row.state,
    row.pin,
    row.mobile,
    row.rating,
    row.reviews,
    row.services,
    row.category || '',
    row.subcategory || '',
    row.latitude,
    row.longitude,
    row.previewStatus,
    row.existingBusinessId || '',
    row.errors.join('; '),
  ].map(escapeCsvValue).join(','));
  return [header.map(escapeCsvValue).join(','), ...body].join('\n');
};

export const triggerCsvDownload = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
