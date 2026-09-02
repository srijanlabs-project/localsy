// Shared parsing helpers for turning `AuditEvent` records (types.ts) into per-business metrics.
// Extracted from `ListingAnalyticsPanel.tsx` (spec 5.8) verbatim, no behavior change — done so
// the new Platform Analytics Overview page (spec 5.29, Section 9 build step 7) can attribute
// the same audit events to a locality (via each event's business) without duplicating this
// parsing logic a second time. `ListingAnalyticsPanel.tsx` now imports from here instead of
// declaring its own private copies.
import type { AuditEvent, Business } from '../../types';

export function normalizeText(value: unknown) {
  return String(value || '').trim();
}

export function normalizeLower(value: unknown) {
  return normalizeText(value).toLowerCase();
}

export function normalizeKey(value: unknown) {
  return normalizeLower(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function parseAuditDetails(details: unknown) {
  const raw = normalizeText(details);
  if (!raw) return {} as Record<string, string>;
  return raw
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((acc, segment) => {
      const separatorIndex = segment.indexOf(':');
      if (separatorIndex === -1) return acc;
      const key = normalizeKey(segment.slice(0, separatorIndex));
      const rawValue = segment.slice(separatorIndex + 1).trim();
      if (!key) return acc;
      acc[key] = rawValue.replace(/^"(.*)"$/, '$1').trim();
      return acc;
    }, {} as Record<string, string>);
}

export function getDetailValue(details: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = details[normalizeKey(key)];
    if (value) return value;
  }
  return '';
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(Math.max(0, Number(value) || 0));
}

export function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
}

/** Same business-name lookup keying scheme `ListingAnalyticsPanel` builds inline. */
export function buildBusinessNameLookup(businesses: Business[]) {
  const lookup = new Map<string, string>();
  businesses.forEach((business) => {
    lookup.set(`${normalizeLower(business.name)}::${normalizeLower(business.localityId)}`, business.id);
    lookup.set(normalizeLower(business.name), business.id);
  });
  return lookup;
}

/**
 * Same businessId-attribution logic `ListingAnalyticsPanel` runs per event (listing id in the
 * details blob, or a business-name match for "opened WhatsApp intent" events) — pulled out so
 * the new Platform Analytics Overview page (5.29) can roll audit events up to a LOCALITY
 * (via the attributed business's `localityId`), something the per-business panel never needed.
 */
export function attributeEventToBusinessId(event: AuditEvent, businessNameLookup: Map<string, string>) {
  const parsedDetails = parseAuditDetails(event.details);
  const description = normalizeLower(event.description);
  let businessId = getDetailValue(parsedDetails, 'listing id', 'listingid', 'business id', 'businessid');

  if (!businessId && description.includes('opened whatsapp intent')) {
    const businessName = getDetailValue(parsedDetails, 'business');
    const localityId = getDetailValue(parsedDetails, 'locality');
    businessId = businessNameLookup.get(`${normalizeLower(businessName)}::${normalizeLower(localityId)}`)
      || businessNameLookup.get(normalizeLower(businessName))
      || '';
  }

  return businessId;
}
