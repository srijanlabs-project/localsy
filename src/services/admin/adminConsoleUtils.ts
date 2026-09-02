import homepageDefaultsBootstrap from '../../../homepage-defaults-config.json';
import type {
  Business,
  HeroBannerStat,
  HomepageDefaultsConfigState,
  Locality,
} from '../../types';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
  getCategoryById,
  getSubcategoryById,
} from '../../categoryMaster';

const HOMEPAGE_DEFAULTS_BOOTSTRAP = homepageDefaultsBootstrap as Partial<HomepageDefaultsConfigState>;

export type HeroStatDraft = {
  enabled: boolean;
  label: string;
  value: string;
  localityIds: string;
  pincodes: string;
};

export const slugifyForPath = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Failed to read image file'));
  reader.readAsDataURL(file);
});

export const splitTagSource = (value: string) => (
  String(value || '')
    .split(/[|,/]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
);

export const getFutureDateIso = (durationDays: number) => {
  const target = new Date();
  target.setDate(target.getDate() + Math.max(1, durationDays));
  return target.toISOString().slice(0, 10);
};

export const buildHeroStatDraftsFromTemplates = (heroStatTemplates?: HeroBannerStat[]): HeroStatDraft[] => {
  const templates = Array.isArray(heroStatTemplates) && heroStatTemplates.length > 0
    ? heroStatTemplates
    : ((Array.isArray(HOMEPAGE_DEFAULTS_BOOTSTRAP.heroStatTemplates) ? HOMEPAGE_DEFAULTS_BOOTSTRAP.heroStatTemplates : []) as HeroBannerStat[]);
  return templates.map((stat) => ({
    enabled: stat.enabled ?? true,
    label: String(stat.label || '').trim(),
    value: String(stat.value || '').trim(),
    localityIds: (stat.localityIds || []).join(', '),
    pincodes: (stat.pincodes || []).join(', '),
  }));
};

export const getScalableEntityMetadataSource = (metadata?: Record<string, unknown>) => (
  String(metadata?.source || metadata?.updatedFrom || '').trim()
);

export const isScalableEntityDetachedFromLegacySync = (metadata?: Record<string, unknown>) => (
  Boolean(metadata?.detachedFromLegacySync)
);

export const isLegacyManagedScalableEntity = (metadata?: Record<string, unknown>) => (
  getScalableEntityMetadataSource(metadata).startsWith('legacy_') && !isScalableEntityDetachedFromLegacySync(metadata)
);

export const getScalableEntityOwnershipPresentation = (metadata?: Record<string, unknown>) => {
  const source = getScalableEntityMetadataSource(metadata);
  if (isScalableEntityDetachedFromLegacySync(metadata)) {
    return {
      label: 'Detached',
      detail: source || 'protected from legacy sync',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  if (source.startsWith('legacy_')) {
    return {
      label: 'Legacy Sync',
      detail: source.replace(/^legacy_/, '') || 'legacy-managed',
      className: 'border-sky-200 bg-sky-50 text-sky-800',
    };
  }
  return {
    label: 'Scalable Owned',
    detail: source || 'admin-managed',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  };
};

export const getHeroBannerDraftDefaults = (config?: HomepageDefaultsConfigState) => ({
  ctaLabel: String(config?.heroBannerDraftDefaults?.ctaLabel || HOMEPAGE_DEFAULTS_BOOTSTRAP.heroBannerDraftDefaults?.ctaLabel || 'Explore Businesses').trim() || String(HOMEPAGE_DEFAULTS_BOOTSTRAP.heroBannerDraftDefaults?.ctaLabel || 'Explore Businesses'),
  ctaType: config?.heroBannerDraftDefaults?.ctaType || HOMEPAGE_DEFAULTS_BOOTSTRAP.heroBannerDraftDefaults?.ctaType || 'search_category',
  ctaTarget: String(config?.heroBannerDraftDefaults?.ctaTarget || HOMEPAGE_DEFAULTS_BOOTSTRAP.heroBannerDraftDefaults?.ctaTarget || 'all').trim() || String(HOMEPAGE_DEFAULTS_BOOTSTRAP.heroBannerDraftDefaults?.ctaTarget || 'all'),
  durationDays: Math.max(1, Number(config?.heroBannerDraftDefaults?.durationDays || HOMEPAGE_DEFAULTS_BOOTSTRAP.heroBannerDraftDefaults?.durationDays || 30)),
});

export const buildListingTags = (...sources: Array<string | string[] | undefined>) => {
  const seen = new Set<string>();
  const tags: string[] = [];
  sources.forEach((source) => {
    const values = Array.isArray(source)
      ? source
      : splitTagSource(String(source || ''));
    values.forEach((value) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      tags.push(trimmed);
    });
  });
  return tags.slice(0, 25);
};

export const isBusinessTaxonomyMapped = (
  business: Pick<Business, 'categoryId' | 'subcategoryId'> | { categoryId?: string; subcategoryId?: string }
) => (
  BUSINESS_CATEGORIES.some((category) => category.id === String(business.categoryId || '')) &&
  BUSINESS_SUBCATEGORIES.some((subcategory) => (
    subcategory.categoryId === String(business.categoryId || '') &&
    subcategory.id === String(business.subcategoryId || '')
  ))
);

export const getBusinessTaxonomyLabel = (
  business: Pick<Business, 'categoryId' | 'subcategoryId'> & { sourceCategoryLabel?: string; sourceSubcategoryLabel?: string }
) => {
  const mappedCategory = getCategoryById(business.categoryId || '')?.name;
  const mappedSubcategory = getSubcategoryById(business.subcategoryId || '')?.name;
  return {
    category: mappedCategory || business.sourceCategoryLabel || business.categoryId || 'Unmapped',
    subcategory: mappedSubcategory || business.sourceSubcategoryLabel || business.subcategoryId || 'Unmapped',
  };
};

export const getPublicLocalityUrl = (locality?: Locality | null) => {
  const localitySlug = locality?.slug || locality?.id || '';
  return localitySlug ? `https://www.localisy.in/${localitySlug}` : 'https://www.localisy.in';
};

export const slugifyAdminValue = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/** Ported verbatim from AdminConsole.tsx's local `parsePincodeList` (Homepage CMS split, Section 9 Step 4). */
export const parsePincodeList = (raw: string) => (
  raw
    .split(/[\s,]+/)
    .map((entry) => entry.replace(/\D/g, '').trim())
    .filter((entry, index, items) => entry.length === 6 && items.indexOf(entry) === index)
);

/** Ported verbatim from AdminConsole.tsx's local `parseIdList` (Homepage CMS split, Section 9 Step 4). */
export const parseIdList = (raw: string) => (
  raw
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter((entry, index, items) => entry.length > 0 && items.indexOf(entry) === index)
);

/** Ported verbatim from AdminConsole.tsx's local `createAdminId` (Homepage CMS split, Section 9 Step 4). */
export const createAdminId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

/** Ported verbatim from AdminConsole.tsx's local `pruneEmptyPayload` (Homepage CMS split, Section 9 Step 4). */
export const pruneEmptyPayload = (value: Record<string, unknown>) => (
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null || entry === '') return false;
      if (Array.isArray(entry) && entry.length === 0) return false;
      return true;
    })
  )
);

/**
 * Ported from AdminConsole.tsx's local `uploadBannerImage` (Homepage CMS split, Section 9 Step
 * 4) — same `/api/media/upload` call, generalized to accept an auth token instead of closing
 * over `userSession` directly, so the new Homepage CMS pages can each supply their own.
 */
export const uploadAdminMediaImage = async (file: File, folder: string, authToken?: string) => {
  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('yp_auth_token') : null);
  if (!token) {
    throw new Error('Please sign in with a platform admin or developer account before uploading images.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      folder,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      dataUrl,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok || !payload?.url) {
    const serverMessage = payload?.error || 'Failed to upload banner image';
    if (response.status === 401 || response.status === 403) {
      throw new Error(`${serverMessage}. Uploads require a platform admin or developer login.`);
    }
    throw new Error(serverMessage);
  }

  return String(payload.url);
};

export const buildUniqueAdminId = (seed: string, takenIds: Set<string>) => {
  const baseId = slugifyAdminValue(seed);
  if (!baseId) return '';
  if (!takenIds.has(baseId)) return baseId;
  let suffix = 2;
  while (takenIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
};
