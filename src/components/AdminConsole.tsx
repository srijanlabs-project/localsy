import React, { useEffect, useMemo, useState } from 'react';
import { 
  CheckCircle, XCircle, Plus, Info, Globe, AlertCircle, 
  Trash2, PlusCircle, Check, Database, Eye, Server, RefreshCw, MapPin, Copy, ChevronUp, ChevronDown, ChevronRight
} from 'lucide-react';
import { Locality, Business, SubdomainMapping, UserSession, AuditEvent, ListingAd, HeroBanner, HeroBannerStat, AdLead, MarketingCoupon, HomepageLayout, HomepageSection, HomepageSectionType, ApiConfiguration, CommunityItem, ScalableHomepageConfigState, ScalableHomepageTemplate, ScalableHomepageAssignment, ScalableCampaign, ScalableCampaignType, ResolvedHomepagePayload, BusinessTaxonomyState, SeoDiscoveryConfigState, GeographyConfigState, HomepageDefaultsConfigState, ResolvedHomepagePublishRequest, ResolvedHomepagePublishContext, ResolvedHomepageSnapshotDeleteRequest, ScalableLegacyOwnershipSummary } from '../types';
import { MASTER_AREAS } from '../geographyMaster';
import { getBusinessImageUrl, getCategoryFallbackImage, hasUploadedBusinessImage } from '../utils/businessImage';
import { getMediaProxyUrl } from '../utils/mediaUrl';
import BusinessTaxonomyManager from './BusinessTaxonomyManager';
import GeographyConfigManager from './GeographyConfigManager';
import HomepageDefaultsManager from './HomepageDefaultsManager';
import SeoDiscoveryManager from './SeoDiscoveryManager';
import {
  DEFAULT_HERO_BANNER_DRAFT_DEFAULTS,
  DEFAULT_HERO_STAT_TEMPLATES,
} from '../../shared/homepageDefaultsSeed.js';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
  getCategoryById,
  getSubcategoriesForCategory,
  getSubcategoryById,
  resolveDefaultSubcategoryId
} from '../categoryMaster';

interface AdminConsoleProps {
  localities: Locality[];
  businesses: Business[];
  subdomains: SubdomainMapping[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onCreateLocality: (name: string, subdomain: string, description: string, image: string) => void;
  onDeleteLocality: (id: string) => void;
  onUpdateBusiness?: (b: Business) => void;
  userSession?: UserSession;
  auditLogs?: AuditEvent[];
  
  // Customizable Pincode Routing Props
  pincodeMappings?: Array<{ pincode: string; localityId: string }>;
  onAddPincodeMapping?: (pincode: string, localityId: string) => void;
  onDeletePincodeMapping?: (pincode: string) => void;
  defaultLocalityId?: string;
  onChangeDefaultLocalityId?: (localityId: string) => void;
  onBulkImportBusinesses?: (rows: Array<{
    businessName: string;
    address: string;
    area: string;
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
    sourceCategoryLabel?: string;
    sourceSubcategoryLabel?: string;
    categoryId?: string;
    subcategoryId?: string;
    taxonomyMapped?: boolean;
    tags?: string[];
  }>) => { imported: number; skipped: number };
  listingAds?: ListingAd[];
  onCreateListingAd?: (ad: Omit<ListingAd, 'id'>) => void;
  onUpdateListingAd?: (ad: ListingAd) => void;
  onDeleteListingAd?: (adId: string) => void;
  heroBanners?: HeroBanner[];
  onCreateHeroBanner?: (banner: Omit<HeroBanner, 'id'>) => void;
  onUpdateHeroBanner?: (banner: HeroBanner) => void;
  onDeleteHeroBanner?: (bannerId: string) => void;
  coupons?: MarketingCoupon[];
  onAddCoupon?: (coupon: Omit<MarketingCoupon, 'id' | 'usageCount'>) => void;
  onUpdateCoupon?: (coupon: MarketingCoupon) => Promise<unknown> | void;
  onDeleteCoupon?: (couponId: string) => Promise<unknown> | void;
  communityItems?: CommunityItem[];
  onAddCommunityItem?: (item: Omit<CommunityItem, 'id' | 'createdAt' | 'likes'>) => void;
  onUpdateCommunityItem?: (item: CommunityItem) => void;
  onDeleteCommunityItem?: (itemId: string) => void;
  homepageLayouts?: HomepageLayout[];
  onCreateHomepageSection?: (localityId: string, section: Omit<HomepageSection, 'id' | 'sortOrder'>, insertPosition?: number) => Promise<unknown> | void;
  onUpdateHomepageSection?: (localityId: string, section: HomepageSection) => Promise<unknown> | void;
  onDeleteHomepageSection?: (localityId: string, sectionId: string) => Promise<unknown> | void;
  onDuplicateHomepageSection?: (localityId: string, sectionId: string) => Promise<unknown> | void;
  onMoveHomepageSection?: (localityId: string, sectionId: string, direction: 'up' | 'down') => Promise<unknown> | void;
  adLeads?: AdLead[];
  apiConfiguration?: ApiConfiguration;
  onUpdateApiConfiguration?: (config: ApiConfiguration) => void;
  geographyConfig?: GeographyConfigState;
  onSaveGeographyConfig?: (config: GeographyConfigState) => Promise<GeographyConfigState> | void;
  homepageDefaultsConfig?: HomepageDefaultsConfigState;
  onSaveHomepageDefaultsConfig?: (config: HomepageDefaultsConfigState) => Promise<HomepageDefaultsConfigState> | void;
  businessTaxonomy?: BusinessTaxonomyState;
  onSaveBusinessTaxonomy?: (taxonomy: BusinessTaxonomyState) => Promise<BusinessTaxonomyState> | void;
  seoDiscoveryConfig?: SeoDiscoveryConfigState;
  onSaveSeoDiscoveryConfig?: (config: SeoDiscoveryConfigState) => Promise<SeoDiscoveryConfigState> | void;
  onSyncHomepageConfig?: () => void;
  scalableHomepageConfig?: ScalableHomepageConfigState;
  onSaveScalableTemplate?: (template: ScalableHomepageTemplate) => Promise<ScalableHomepageTemplate | void> | void;
  onDeleteScalableTemplate?: (templateId: string) => Promise<unknown> | void;
  onCreateScalableTemplateSection?: (templateId: string, section: HomepageSection) => Promise<unknown> | void;
  onUpdateScalableTemplateSection?: (templateId: string, sectionId: string, section: HomepageSection) => Promise<unknown> | void;
  onReorderScalableTemplateSections?: (templateId: string, sections: HomepageSection[]) => Promise<unknown> | void;
  onDuplicateScalableTemplateSection?: (templateId: string, sectionId: string) => Promise<unknown> | void;
  onDeleteScalableTemplateSection?: (templateId: string, sectionId: string) => Promise<unknown> | void;
  onSyncScalableTemplateSectionsFromLocality?: (templateId: string, localityId: string) => Promise<unknown> | void;
  onSaveScalableAssignment?: (assignment: ScalableHomepageAssignment) => Promise<ScalableHomepageAssignment | void> | void;
  onDeleteScalableAssignment?: (assignmentId: string) => Promise<unknown> | void;
  onSaveScalableCampaign?: (campaign: ScalableCampaign) => Promise<ScalableCampaign | void> | void;
  onDeleteScalableCampaign?: (campaignId: string) => Promise<unknown> | void;
  onRefreshScalablePublishedSnapshots?: () => Promise<unknown> | void;
  onDeleteScalablePublishedSnapshot?: (snapshotId: string) => Promise<unknown> | void;
  onReseedScalableHomepageConfig?: (force?: boolean) => Promise<{ summary?: { templates?: number; assignments?: number; campaigns?: number }; ownership?: ScalableLegacyOwnershipSummary; forced?: boolean } | void> | void;
  onPublishResolvedHomepages?: (publishRequest?: string[] | ResolvedHomepagePublishRequest) => Promise<{ publishedCount?: number; totalSnapshots?: number } | void> | void;
  onDeleteResolvedHomepageSnapshots?: (deleteRequest?: ResolvedHomepageSnapshotDeleteRequest) => Promise<{ deletedCount?: number; remainingSnapshots?: number } | void> | void;
  localityCategoryLinks?: LocalityCategoryLink[];
  onCreateLocalityCategoryLink?: (payload: Omit<LocalityCategoryLink, 'id'>) => void;
  onDeleteLocalityCategoryLink?: (id: string) => void;
}

type BulkImportRow = {
  businessName: string;
  address: string;
  area: string;
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

type ImportPreviewRow = BulkImportRow & {
  rowNumber: number;
  previewStatus: 'ready' | 'update' | 'fail';
  errors: string[];
  normalizedPhone: string;
  resolvedPincode: string;
  resolvedLocalityId: string;
  requiresTaxonomyMapping: boolean;
  taxonomyStatusLabel: string;
};

type LocalityCategoryLink = {
  id: string;
  localityId: string;
  categoryId: string;
  subcategoryId?: string;
  slug: string;
};

type HeroStatDraft = {
  enabled: boolean;
  label: string;
  value: string;
  localityIds: string;
  pincodes: string;
};

const slugifyForPath = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Failed to read image file'));
  reader.readAsDataURL(file);
});

const splitTagSource = (value: string) => (
  String(value || '')
    .split(/[|,/]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const getFutureDateIso = (durationDays: number) => {
  const target = new Date();
  target.setDate(target.getDate() + Math.max(1, durationDays));
  return target.toISOString().slice(0, 10);
};

const buildHeroStatDraftsFromTemplates = (heroStatTemplates?: HeroBannerStat[]): HeroStatDraft[] => {
  const templates = Array.isArray(heroStatTemplates) && heroStatTemplates.length > 0
    ? heroStatTemplates
    : (DEFAULT_HERO_STAT_TEMPLATES as HeroBannerStat[]);
  return templates.map((stat) => ({
    enabled: stat.enabled ?? true,
    label: String(stat.label || '').trim(),
    value: String(stat.value || '').trim(),
    localityIds: (stat.localityIds || []).join(', '),
    pincodes: (stat.pincodes || []).join(', '),
  }));
};

const getScalableEntityMetadataSource = (metadata?: Record<string, unknown>) => String(metadata?.source || metadata?.updatedFrom || '').trim();

const isScalableEntityDetachedFromLegacySync = (metadata?: Record<string, unknown>) => Boolean(metadata?.detachedFromLegacySync);

const isLegacyManagedScalableEntity = (metadata?: Record<string, unknown>) => (
  getScalableEntityMetadataSource(metadata).startsWith('legacy_') && !isScalableEntityDetachedFromLegacySync(metadata)
);

const getScalableEntityOwnershipPresentation = (metadata?: Record<string, unknown>) => {
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

const getHeroBannerDraftDefaults = (config?: HomepageDefaultsConfigState) => ({
  ctaLabel: String(config?.heroBannerDraftDefaults?.ctaLabel || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaLabel).trim() || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaLabel,
  ctaType: config?.heroBannerDraftDefaults?.ctaType || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaType,
  ctaTarget: String(config?.heroBannerDraftDefaults?.ctaTarget || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaTarget).trim() || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.ctaTarget,
  durationDays: Math.max(1, Number(config?.heroBannerDraftDefaults?.durationDays || DEFAULT_HERO_BANNER_DRAFT_DEFAULTS.durationDays)),
});

const buildListingTags = (...sources: Array<string | string[] | undefined>) => {
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

const isBusinessTaxonomyMapped = (business: Pick<Business, 'categoryId' | 'subcategoryId'> | { categoryId?: string; subcategoryId?: string }) => (
  BUSINESS_CATEGORIES.some((category) => category.id === String(business.categoryId || '')) &&
  BUSINESS_SUBCATEGORIES.some((subcategory) => (
    subcategory.categoryId === String(business.categoryId || '') &&
    subcategory.id === String(business.subcategoryId || '')
  ))
);

const getBusinessTaxonomyLabel = (business: Pick<Business, 'categoryId' | 'subcategoryId'> & { sourceCategoryLabel?: string; sourceSubcategoryLabel?: string }) => {
  const mappedCategory = getCategoryById(business.categoryId || '')?.name;
  const mappedSubcategory = getSubcategoryById(business.subcategoryId || '')?.name;
  return {
    category: mappedCategory || business.sourceCategoryLabel || business.categoryId || 'Unmapped',
    subcategory: mappedSubcategory || business.sourceSubcategoryLabel || business.subcategoryId || 'Unmapped',
  };
};

const getPublicLocalityUrl = (locality?: Locality | null) => {
  const localitySlug = locality?.slug || locality?.id || 'roadpali';
  return `https://www.localisy.in/${localitySlug}`;
};

const slugifyAdminValue = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const buildUniqueAdminId = (seed: string, takenIds: Set<string>) => {
  const baseId = slugifyAdminValue(seed);
  if (!baseId) return '';
  if (!takenIds.has(baseId)) return baseId;
  let suffix = 2;
  while (takenIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
};

type AdminWorkspaceTab = 'moderation' | 'listing-status' | 'bulk-upload' | 'taxonomy-mapping' | 'data-audit';
type ListingStatusFilter = 'all' | 'approved' | 'rejected' | 'pending';
type AdminConsoleSurface = 'admin' | 'operations';
type AdminOperationsSection = 'listings' | 'homepage' | 'campaigns' | 'geography' | 'content' | 'platform';
type HomepageCmsSubtab = 'layout' | 'hero' | 'publish' | 'templates' | 'assignments' | 'campaigns' | 'insights';
type PlatformConfigSubtab = 'api' | 'taxonomy' | 'geography' | 'defaults' | 'seo';
type GeographyWorkspaceSubtab = 'localities' | 'routing' | 'links';
type CampaignWorkspaceSubtab = 'offers' | 'ads' | 'leads';

type InlineSubcategoryCreatorProps = {
  categoryId: string;
  disabled?: boolean;
  canCreate: boolean;
  onAssign: (subcategoryId: string) => void;
  onCreate: (categoryId: string, name: string) => Promise<string | null>;
};

function InlineSubcategoryCreator({
  categoryId,
  disabled,
  canCreate,
  onAssign,
  onCreate,
}: InlineSubcategoryCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  if (!canCreate) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={!categoryId || disabled}
        onClick={() => {
          setIsOpen((previous) => !previous);
          setErrorText('');
        }}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-indigo-300 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <PlusCircle className="h-3 w-3" />
        <span>Create subcategory</span>
      </button>

      {isOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            disabled={isSaving || disabled}
            onChange={(event) => setName(event.target.value)}
            placeholder="New subcategory name"
            className="min-w-[12rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
          />
          <button
            type="button"
            disabled={!name.trim() || isSaving || disabled}
            onClick={async () => {
              setIsSaving(true);
              setErrorText('');
              try {
                const nextSubcategoryId = await onCreate(categoryId, name);
                if (nextSubcategoryId) {
                  onAssign(nextSubcategoryId);
                  setName('');
                  setIsOpen(false);
                }
              } catch (error) {
                setErrorText(error instanceof Error ? error.message : 'Failed to create subcategory.');
              } finally {
                setIsSaving(false);
              }
            }}
            className="rounded-md bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setIsOpen(false);
              setName('');
              setErrorText('');
            }}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {errorText && (
        <div className="text-[10px] text-rose-600">{errorText}</div>
      )}
    </div>
  );
}

type OrderedCategoryPickerProps = {
  label: string;
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  helperText?: string;
};

function OrderedCategoryPicker({
  label,
  selectedIds,
  onChange,
  helperText = 'Use the order below to control how this section appears on the page.'
}: OrderedCategoryPickerProps) {
  const [newCategoryId, setNewCategoryId] = useState(() => (
    BUSINESS_CATEGORIES.find((category) => !selectedIds.includes(category.id))?.id
    || BUSINESS_CATEGORIES[0]?.id
    || ''
  ));

  const selectedCategories = selectedIds
    .map((categoryId) => getCategoryById(categoryId))
    .filter(Boolean) as (typeof BUSINESS_CATEGORIES)[number][];

  const availableCategories = BUSINESS_CATEGORIES.filter((category) => !selectedIds.includes(category.id));

  useEffect(() => {
    if (availableCategories.some((category) => category.id === newCategoryId)) return;
    const nextAvailable = availableCategories[0]?.id || BUSINESS_CATEGORIES[0]?.id || '';
    setNewCategoryId(nextAvailable);
  }, [availableCategories, newCategoryId]);

  const addCategory = () => {
    if (!newCategoryId || selectedIds.includes(newCategoryId)) return;
    onChange([...selectedIds, newCategoryId]);
  };

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedIds.indexOf(categoryId);
    if (currentIndex < 0) return;
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return;
    const nextIds = [...selectedIds];
    [nextIds[currentIndex], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[currentIndex]];
    onChange(nextIds);
  };

  const removeCategory = (categoryId: string) => {
    onChange(selectedIds.filter((id) => id !== categoryId));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-500">{helperText}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          >
            {(availableCategories.length > 0 ? availableCategories : BUSINESS_CATEGORIES).map((category) => (
              <option key={category.id} value={category.id} disabled={selectedIds.includes(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addCategory}
            disabled={!newCategoryId || selectedIds.includes(newCategoryId)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {selectedCategories.length > 0 ? (
        <div className="space-y-2">
          {selectedCategories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-slate-800">{index + 1}. {category.name}</div>
                <div className="truncate text-[10px] text-slate-500">{category.id}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveCategory(category.id, 'up')}
                  disabled={index === 0}
                  className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Move category up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={index === selectedCategories.length - 1}
                  className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Move category down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="rounded border border-rose-200 bg-rose-50 p-1.5 text-rose-700"
                  title="Remove category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-[11px] text-slate-500">
          No categories selected yet. Add one to define how this section should render.
        </div>
      )}
    </div>
  );
}

type OrderedSelectionOption = {
  id: string;
  label: string;
  meta?: string;
};

type OrderedSelectionPickerProps = {
  label: string;
  selectedIds: string[];
  options: OrderedSelectionOption[];
  onChange: (nextIds: string[]) => void;
  helperText?: string;
  emptyText?: string;
};

function OrderedSelectionPicker({
  label,
  selectedIds,
  options,
  onChange,
  helperText = 'Select a value, click Add, and remove it from the selected list when it is no longer needed.',
  emptyText = 'No values selected yet.'
}: OrderedSelectionPickerProps) {
  const availableOptions = options.filter((option) => !selectedIds.includes(option.id));
  const [draftId, setDraftId] = useState(availableOptions[0]?.id || options[0]?.id || '');

  useEffect(() => {
    if (availableOptions.some((option) => option.id === draftId)) return;
    setDraftId(availableOptions[0]?.id || options[0]?.id || '');
  }, [availableOptions, draftId, options]);

  const selectedOptions = selectedIds
    .map((id) => options.find((option) => option.id === id) || { id, label: id })
    .filter(Boolean);

  const addSelection = () => {
    if (!draftId || selectedIds.includes(draftId)) return;
    onChange([...selectedIds, draftId]);
  };

  const removeSelection = (id: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-500">{helperText}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            className="min-w-[190px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          >
            {(availableOptions.length > 0 ? availableOptions : options).map((option) => (
              <option key={option.id} value={option.id} disabled={selectedIds.includes(option.id)}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addSelection}
            disabled={!draftId || selectedIds.includes(draftId)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {selectedOptions.length > 0 ? (
        <div className="space-y-2">
          {selectedOptions.map((option, index) => (
            <div key={`${option.id}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-slate-800">{index + 1}. {option.label}</div>
                {option.meta && <div className="truncate text-[10px] text-slate-500">{option.meta}</div>}
              </div>
              <button
                type="button"
                onClick={() => removeSelection(option.id)}
                className="rounded border border-rose-200 bg-rose-50 p-1.5 text-rose-700"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-[11px] text-slate-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export default function AdminConsole({
  localities,
  businesses,
  subdomains,
  onApprove,
  onReject,
  onCreateLocality,
  onDeleteLocality,
  onUpdateBusiness,
  userSession,
  auditLogs = [],
  
  pincodeMappings = [],
  onAddPincodeMapping,
  onDeletePincodeMapping,
  defaultLocalityId = 'roadpali',
  onChangeDefaultLocalityId,
  onBulkImportBusinesses,
  listingAds = [],
  onCreateListingAd,
  onUpdateListingAd,
  onDeleteListingAd,
  heroBanners = [],
  onCreateHeroBanner,
  onUpdateHeroBanner,
  onDeleteHeroBanner,
  coupons = [],
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  communityItems = [],
  onAddCommunityItem,
  onUpdateCommunityItem,
  onDeleteCommunityItem,
  homepageLayouts = [],
  onCreateHomepageSection,
  onUpdateHomepageSection,
  onDeleteHomepageSection,
  onDuplicateHomepageSection,
  onMoveHomepageSection,
  adLeads = [],
  apiConfiguration,
  onUpdateApiConfiguration,
  geographyConfig,
  onSaveGeographyConfig,
  homepageDefaultsConfig,
  onSaveHomepageDefaultsConfig,
  businessTaxonomy,
  onSaveBusinessTaxonomy,
  seoDiscoveryConfig,
  onSaveSeoDiscoveryConfig,
  onSyncHomepageConfig,
  scalableHomepageConfig,
  onSaveScalableTemplate,
  onDeleteScalableTemplate,
  onCreateScalableTemplateSection,
  onUpdateScalableTemplateSection,
  onReorderScalableTemplateSections,
  onDuplicateScalableTemplateSection,
  onDeleteScalableTemplateSection,
  onSyncScalableTemplateSectionsFromLocality,
  onSaveScalableAssignment,
  onDeleteScalableAssignment,
  onSaveScalableCampaign,
  onDeleteScalableCampaign,
  onRefreshScalablePublishedSnapshots,
  onDeleteScalablePublishedSnapshot,
  onReseedScalableHomepageConfig,
  onPublishResolvedHomepages,
  onDeleteResolvedHomepageSnapshots,
  localityCategoryLinks = [],
  onCreateLocalityCategoryLink,
  onDeleteLocalityCategoryLink
}: AdminConsoleProps) {
  // Internal infrastructure controls are hidden from public-facing admin UI.
  const showInternalTopology = false;
  const consoleRole = String(userSession?.role || '');
  const canUsePrivilegedAdminWorkspace = ['admin', 'developer'].includes(consoleRole);
  const [newLocName, setNewLocName] = useState('');
  const [newLocSubdomain, setNewLocSubdomain] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocImg, setNewLocImg] = useState('');
  const [newLocPincodes, setNewLocPincodes] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectionActive, setRejectionActive] = useState<Record<string, boolean>>({});
  const [adminNotification, setAdminNotification] = useState<string | null>(null);
  const [editedHrs, setEditedHrs] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<string>('');
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);
  const [consoleSurface, setConsoleSurface] = useState<AdminConsoleSurface>('admin');
  const [adminWorkspaceTab, setAdminWorkspaceTab] = useState<AdminWorkspaceTab>('moderation');
  const [listingStatusFilter, setListingStatusFilter] = useState<ListingStatusFilter>('all');
  const [operationsSection, setOperationsSection] = useState<AdminOperationsSection>('homepage');
  const [homepageCmsSubtab, setHomepageCmsSubtab] = useState<HomepageCmsSubtab>('layout');
  const [platformConfigSubtab, setPlatformConfigSubtab] = useState<PlatformConfigSubtab>('api');
  const [geographyWorkspaceSubtab, setGeographyWorkspaceSubtab] = useState<GeographyWorkspaceSubtab>('localities');
  const [campaignWorkspaceSubtab, setCampaignWorkspaceSubtab] = useState<CampaignWorkspaceSubtab>('offers');
  const [listingStatusPage, setListingStatusPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [importPreviewPage, setImportPreviewPage] = useState(1);
  const [taxonomyDrafts, setTaxonomyDrafts] = useState<Record<string, { categoryId: string; subcategoryId: string }>>({});
  const [selectedBackendBiz, setSelectedBackendBiz] = useState<Business | null>(null);
  const [backendDraft, setBackendDraft] = useState<Business | null>(null);
  const [backendEditMode, setBackendEditMode] = useState(false);
  const [uploadedTab, setUploadedTab] = useState<'active' | 'deactivated' | 'pending'>('active');
  const [uploadedPage, setUploadedPage] = useState(1);
  const initialHeroBannerDraftDefaults = getHeroBannerDraftDefaults(homepageDefaultsConfig);
  const initialHeroStatDrafts = buildHeroStatDraftsFromTemplates(homepageDefaultsConfig?.heroStatTemplates);

  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adBadge, setAdBadge] = useState('Sponsored');
  const [adCtaText, setAdCtaText] = useState('Know More');
  const [adBgColor, setAdBgColor] = useState('#1d4ed8');
  const [adStartDate, setAdStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [adEndDate, setAdEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [adActionType, setAdActionType] = useState<ListingAd['actionType']>('landing_page');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adTargetBusinessId, setAdTargetBusinessId] = useState('');
  const [adSellerBusinessId, setAdSellerBusinessId] = useState('');
  const [adLocalityId, setAdLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [adPincodes, setAdPincodes] = useState('');
  const [adCategoryIds, setAdCategoryIds] = useState<string[]>([]);
  const [adTags, setAdTags] = useState('');
  const [adPlacementKey, setAdPlacementKey] = useState('homepage_inline_primary');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adImageUploading, setAdImageUploading] = useState(false);
  const [adDeviceTarget, setAdDeviceTarget] = useState<NonNullable<ListingAd['deviceTarget']>>('all');
  const [adMobileRowPosition, setAdMobileRowPosition] = useState('3');
  const [adEditId, setAdEditId] = useState<string | null>(null);
  const [adFormError, setAdFormError] = useState('');

  const [heroLocalityId, setHeroLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [heroEditId, setHeroEditId] = useState<string | null>(null);
  const [heroFormError, setHeroFormError] = useState('');
  const [heroStartDate, setHeroStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [heroEndDate, setHeroEndDate] = useState(getFutureDateIso(initialHeroBannerDraftDefaults.durationDays));
  const [heroCtaLabel, setHeroCtaLabel] = useState(initialHeroBannerDraftDefaults.ctaLabel);
  const [heroCtaType, setHeroCtaType] = useState<NonNullable<HeroBanner['ctaType']>>(initialHeroBannerDraftDefaults.ctaType);
  const [heroCtaTarget, setHeroCtaTarget] = useState(initialHeroBannerDraftDefaults.ctaTarget);
  const [heroPincodes, setHeroPincodes] = useState('');
  const [heroStatsDraft, setHeroStatsDraft] = useState<HeroStatDraft[]>(() => initialHeroStatDrafts.map((stat) => ({ ...stat })));
  const managedHeroBannerDraftDefaults = useMemo(
    () => getHeroBannerDraftDefaults(homepageDefaultsConfig),
    [homepageDefaultsConfig]
  );
  const managedHeroStatDraftDefaults = useMemo(
    () => buildHeroStatDraftsFromTemplates(homepageDefaultsConfig?.heroStatTemplates),
    [homepageDefaultsConfig]
  );

  useEffect(() => {
    if (!canUsePrivilegedAdminWorkspace && consoleSurface !== 'admin') {
      setConsoleSurface('admin');
    }
  }, [canUsePrivilegedAdminWorkspace, consoleSurface]);

  useEffect(() => {
    if (!canUsePrivilegedAdminWorkspace && ['bulk-upload', 'taxonomy-mapping'].includes(adminWorkspaceTab)) {
      setAdminWorkspaceTab('moderation');
    }
  }, [adminWorkspaceTab, canUsePrivilegedAdminWorkspace]);

  const [couponBusinessId, setCouponBusinessId] = useState('');
  const [couponTitle, setCouponTitle] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [couponStartDate, setCouponStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [couponEndDate, setCouponEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [couponLocalityId, setCouponLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [couponPincodes, setCouponPincodes] = useState('');
  const [couponEditId, setCouponEditId] = useState<string | null>(null);

  const [homepageLocalityId, setHomepageLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [newSectionLocalityIds, setNewSectionLocalityIds] = useState<string[]>([localities[0]?.id || 'roadpali']);
  const [newSectionType, setNewSectionType] = useState<HomepageSectionType>('hero_banner');
  const [newSectionTitle, setNewSectionTitle] = useState('Hero Banner');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionCategoryId, setNewSectionCategoryId] = useState(BUSINESS_CATEGORIES[0]?.id || 'food-restaurants');
  const [newSectionSubcategoryId, setNewSectionSubcategoryId] = useState('');
  const [newSectionPlacementKey, setNewSectionPlacementKey] = useState('homepage_inline_primary');
  const [newSectionMaxItems, setNewSectionMaxItems] = useState('6');
  const [newSectionInsertPosition, setNewSectionInsertPosition] = useState('1');
  const [newSectionCtaLabel, setNewSectionCtaLabel] = useState('');
  const [newSectionCtaType, setNewSectionCtaType] = useState<HomepageSection['ctaType']>('none');
  const [newSectionCtaTarget, setNewSectionCtaTarget] = useState('');
  const [newSectionBackgroundColor, setNewSectionBackgroundColor] = useState('#ffffff');
  const [newSectionStartDate, setNewSectionStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSectionEndDate, setNewSectionEndDate] = useState('');
  const [newSectionPincodes, setNewSectionPincodes] = useState('');
  const [newSectionShowViewAll, setNewSectionShowViewAll] = useState(true);
  const [newSectionVisibleSlots, setNewSectionVisibleSlots] = useState('4');
  const [newSectionDesktopCardCount, setNewSectionDesktopCardCount] = useState('4');
  const [newSectionMobileCardCount, setNewSectionMobileCardCount] = useState('2');
  const [newSectionMobileDisplayMode, setNewSectionMobileDisplayMode] = useState<NonNullable<HomepageSection['mobileDisplayMode']>>('carousel');
  const [newSectionCategoryIds, setNewSectionCategoryIds] = useState<string[]>([]);
  const [newSectionListingSourceMode, setNewSectionListingSourceMode] = useState<HomepageSection['listingSourceMode']>('auto');
  const [newSectionPinnedBusinessIds, setNewSectionPinnedBusinessIds] = useState<string[]>([]);
  const [newSectionAutoRotate, setNewSectionAutoRotate] = useState(true);
  const [newSectionRotationIntervalSec, setNewSectionRotationIntervalSec] = useState('3');
  const [expandedSectionCardIds, setExpandedSectionCardIds] = useState<string[]>([]);
  const [apiConfigDraft, setApiConfigDraft] = useState<ApiConfiguration>(() => apiConfiguration || {
    syncMode: 'api',
    homepageConfigEndpoint: '/api/homepage-config',
    adLeadsEndpoint: '/api/ad-leads',
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
    autoSyncBusinesses: true
  });
  const [templateDraft, setTemplateDraft] = useState<{
    id: string;
    name: string;
    templateScope: ScalableHomepageTemplate['templateScope'];
    localityIds: string;
    status: ScalableHomepageTemplate['status'];
    priority: string;
    isDefault: boolean;
    isFallback: boolean;
  }>({
    id: '',
    name: '',
    templateScope: 'locality',
    localityIds: '',
    status: 'active',
    priority: '100',
    isDefault: false,
    isFallback: false,
  });
  const [assignmentDraft, setAssignmentDraft] = useState<{
    id: string;
    localityId: string;
    templateId: string;
    categoryId: string;
    subcategoryId: string;
    pincode: string;
    status: ScalableHomepageAssignment['status'];
    priority: string;
    isFallback: boolean;
  }>({
    id: '',
    localityId: localities[0]?.id || 'roadpali',
    templateId: '',
    categoryId: '',
    subcategoryId: '',
    pincode: '',
    status: 'active',
    priority: '100',
    isFallback: false,
  });
  const [campaignDraft, setCampaignDraft] = useState<{
    id: string;
    name: string;
    campaignType: ScalableCampaignType;
    status: ScalableCampaign['status'];
    priority: string;
    startDate: string;
    endDate: string;
    deviceTarget: NonNullable<ListingAd['deviceTarget']>;
    placementKeys: string;
    localityIds: string;
    categoryIds: string;
    subcategoryIds: string;
    pincodes: string;
    payloadTitle: string;
    payloadSubtitle: string;
    payloadDescription: string;
    payloadImageUrl: string;
    payloadBadge: string;
    payloadCtaLabel: string;
    payloadCtaText: string;
    payloadTargetUrl: string;
    payloadTargetBusinessId: string;
    payloadBusinessIds: string;
    payloadCode: string;
    payloadDiscount: string;
    payloadAuthorName: string;
    payloadContent: string;
    payloadBackgroundColor: string;
    payloadActionType: 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category';
    payloadText: string;
    isFallback: boolean;
  }>({
    id: '',
    name: '',
    campaignType: 'hero_banner',
    status: 'active',
    priority: '100',
    startDate: '',
    endDate: '',
    deviceTarget: 'all',
    placementKeys: '',
    localityIds: '',
    categoryIds: '',
    subcategoryIds: '',
    pincodes: '',
    payloadTitle: '',
    payloadSubtitle: '',
    payloadDescription: '',
    payloadImageUrl: '',
    payloadBadge: '',
    payloadCtaLabel: '',
    payloadCtaText: '',
    payloadTargetUrl: '',
    payloadTargetBusinessId: '',
    payloadBusinessIds: '',
    payloadCode: '',
    payloadDiscount: '',
    payloadAuthorName: '',
    payloadContent: '',
    payloadBackgroundColor: '#1d4ed8',
    payloadActionType: 'landing_page',
    payloadText: '{}',
    isFallback: false,
  });
  const [resolvedPreviewDraft, setResolvedPreviewDraft] = useState<{
    localityId: string;
    categoryId: string;
    subcategoryId: string;
    pincode: string;
    device: 'all' | 'mobile' | 'desktop';
    pageType: 'homepage' | 'listing_results';
    placementKey: string;
    date: string;
    usePublished: boolean;
  }>({
    localityId: localities[0]?.id || 'roadpali',
    categoryId: '',
    subcategoryId: '',
    pincode: '',
    device: 'all',
    pageType: 'homepage',
    placementKey: '',
    date: new Date().toISOString().slice(0, 10),
    usePublished: true,
  });
  const [resolvedPreviewResult, setResolvedPreviewResult] = useState<{
    source: 'published_snapshot' | 'live_resolver' | 'legacy_fallback';
    payload: ResolvedHomepagePayload;
    resolution?: {
      source: 'published_snapshot' | 'live_resolver';
      strategy: string;
      usedPublished: boolean;
      requestedSnapshotId: string;
      legacySnapshotId: string;
      snapshot?: {
        id: string;
        localityId: string;
        categoryId: string;
        subcategoryId: string;
        pincode: string;
        placementKey: string;
        deviceTarget: string;
        pageType: string;
        publishedAt: string;
        updatedAt: string;
        score: number;
      } | null;
      template?: {
        id?: string;
        name?: string;
        templateScope?: string;
        isFallback?: boolean;
      } | null;
      resolvedAt?: string;
    };
  } | null>(null);
  const [resolvedPreviewLoading, setResolvedPreviewLoading] = useState(false);
  const [publishScopeDraft, setPublishScopeDraft] = useState<{
    localityIds: string;
    categoryIds: string;
    subcategoryIds: string;
    pincodes: string;
    placementKeys: string;
    deviceTargets: string;
    pageTypes: string;
  }>({
    localityIds: localities[0]?.id || 'roadpali',
    categoryIds: '',
    subcategoryIds: '',
    pincodes: '',
    placementKeys: '',
    deviceTargets: 'all',
    pageTypes: 'homepage',
  });

  const [linkLocalityId, setLinkLocalityId] = useState(localities[0]?.id || 'roadpali');
  const [linkCategoryId, setLinkCategoryId] = useState(BUSINESS_CATEGORIES[0]?.id || 'food-restaurants');
  const [linkSubcategoryId, setLinkSubcategoryId] = useState('');
  const [adminLocalityFilter, setAdminLocalityFilter] = useState('all');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('all');
  const [adminSubcategoryFilter, setAdminSubcategoryFilter] = useState('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminPincodeFilter, setAdminPincodeFilter] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [communityTypeFilter, setCommunityTypeFilter] = useState<'all' | CommunityItem['type']>('all');
  const [communityStatusFilter, setCommunityStatusFilter] = useState<'all' | NonNullable<CommunityItem['status']>>('all');
  const [communityDateFilter, setCommunityDateFilter] = useState('');
  const [communityEditId, setCommunityEditId] = useState<string | null>(null);
  const [communityEditDraft, setCommunityEditDraft] = useState<CommunityItem | null>(null);
  const [communityImageUrl, setCommunityImageUrl] = useState('');
  const [communityImageFile, setCommunityImageFile] = useState<File | null>(null);
  const [communityImageUploading, setCommunityImageUploading] = useState(false);
  const [communityFormError, setCommunityFormError] = useState('');
  const [communityEditImageUrl, setCommunityEditImageUrl] = useState('');
  const [communityEditImageFile, setCommunityEditImageFile] = useState<File | null>(null);
  const [communityEditImageUploading, setCommunityEditImageUploading] = useState(false);
  const [communityEditError, setCommunityEditError] = useState('');
  const [communityDraft, setCommunityDraft] = useState<Partial<CommunityItem>>({
    type: 'post',
    title: '',
    content: '',
    authorName: 'Localisy Team'
  });

  useEffect(() => {
    if (localities.length === 0) return;
    if (!localities.some((locality) => locality.id === heroLocalityId)) {
      setHeroLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === adLocalityId)) {
      setAdLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === couponLocalityId)) {
      setCouponLocalityId(localities[0].id);
    }
    if (!localities.some((locality) => locality.id === homepageLocalityId)) {
      setHomepageLocalityId(localities[0].id);
    }
    if (!newSectionLocalityIds.length) {
      setNewSectionLocalityIds([localities[0].id]);
    }
    if (!localities.some((locality) => locality.id === linkLocalityId)) {
      setLinkLocalityId(localities[0].id);
    }
  }, [localities, heroLocalityId, adLocalityId, couponLocalityId, homepageLocalityId, linkLocalityId, newSectionLocalityIds.length]);

  useEffect(() => {
    if (!homepageLocalityId) return;
    setNewSectionLocalityIds((prev) => (
      prev.includes(homepageLocalityId) ? prev : [homepageLocalityId, ...prev]
    ));
  }, [homepageLocalityId]);

  useEffect(() => {
    if (!linkSubcategoryId) return;
    if (!getSubcategoriesForCategory(linkCategoryId).some((subcategory) => subcategory.id === linkSubcategoryId)) {
      setLinkSubcategoryId('');
    }
  }, [linkCategoryId, linkSubcategoryId]);

  useEffect(() => {
    if (!newSectionSubcategoryId) return;
    if (!getSubcategoriesForCategory(newSectionCategoryId).some((subcategory) => subcategory.id === newSectionSubcategoryId)) {
      setNewSectionSubcategoryId('');
    }
  }, [newSectionCategoryId, newSectionSubcategoryId]);

  const uploadBannerImage = async (file: File, folder: string) => {
    const token = userSession?.authToken || localStorage.getItem('yp_auth_token');
    if (!token) {
      throw new Error('Please sign in with a platform admin or developer account before uploading images.');
    }

    const dataUrl = await readFileAsDataUrl(file);
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        folder,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl
      })
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

  const getHeroBannerFolder = () => `homepage-banners/hero/${slugifyForPath(heroLocalityId || 'global')}`;
  const getListingAdFolder = () => `homepage-banners/listing-ads/${slugifyForPath(adPlacementKey || 'homepage_inline_primary')}`;
  const getCommunityItemFolder = (localityId: string, type: CommunityItem['type']) => `homepage-content/community/${slugifyForPath(localityId || 'global')}/${slugifyForPath(type || 'post')}`;

  const resetCouponForm = () => {
    setCouponBusinessId('');
    setCouponTitle('');
    setCouponCode('');
    setCouponDiscount('');
    setCouponDescription('');
    setCouponStartDate(new Date().toISOString().slice(0, 10));
    setCouponEndDate(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
    setCouponLocalityId(localities[0]?.id || 'roadpali');
    setCouponPincodes('');
    setCouponEditId(null);
  };

  const beginEditCoupon = (coupon: MarketingCoupon) => {
    setCouponEditId(coupon.id);
    setCouponBusinessId(coupon.businessId);
    setCouponTitle(coupon.title || '');
    setCouponCode(coupon.code);
    setCouponDiscount(coupon.discount);
    setCouponDescription(coupon.description);
    setCouponStartDate(coupon.startDate || new Date().toISOString().slice(0, 10));
    setCouponEndDate(coupon.endDate || coupon.expiryDate || new Date().toISOString().slice(0, 10));
    setCouponLocalityId(coupon.localityIds?.[0] || localities[0]?.id || 'roadpali');
    setCouponPincodes((coupon.pincodes || []).join(', '));
  };

  const resetListingAdForm = () => {
    setAdTitle('');
    setAdDescription('');
    setAdBadge('Sponsored');
    setAdCtaText('Know More');
    setAdTargetUrl('');
    setAdTargetBusinessId('');
    setAdSellerBusinessId('');
    setAdPincodes('');
    setAdCategoryIds([]);
    setAdTags('');
    setAdPlacementKey('homepage_inline_primary');
    setAdImageUrl('');
    setAdImageFile(null);
    setAdDeviceTarget('all');
    setAdMobileRowPosition('3');
    setAdEditId(null);
    setAdFormError('');
  };

  const beginEditListingAd = (ad: ListingAd) => {
    setAdEditId(ad.id);
    setAdTitle(ad.title);
    setAdDescription(ad.description);
    setAdBadge(ad.badge || 'Sponsored');
    setAdCtaText(ad.ctaText || 'Know More');
    setAdBgColor(ad.backgroundColor || '#1d4ed8');
    setAdStartDate(ad.startDate);
    setAdEndDate(ad.endDate);
    setAdActionType(ad.actionType);
    setAdTargetUrl(ad.targetUrl || '');
    setAdTargetBusinessId(ad.targetBusinessId || '');
    setAdSellerBusinessId(ad.sellerBusinessId || '');
    setAdLocalityId(ad.localityIds?.[0] || localities[0]?.id || 'roadpali');
    setAdPincodes((ad.pincodes || []).join(', '));
    setAdCategoryIds(ad.categoryIds || []);
    setAdTags((ad.tags || []).join(', '));
    setAdPlacementKey(ad.placementKey || 'homepage_inline_primary');
    setAdImageUrl(ad.imageUrl || '');
    setAdImageFile(null);
    setAdDeviceTarget(ad.deviceTarget || 'all');
    setAdMobileRowPosition(String(ad.mobileRowPosition || '3'));
    setAdFormError('');
  };

  const resetHeroBannerForm = () => {
    setHeroLocalityId(localities[0]?.id || 'roadpali');
    setHeroTitle('');
    setHeroSubtitle('');
    setHeroImageUrl('');
    setHeroImageFile(null);
    setHeroImageUploading(false);
    setHeroEditId(null);
    setHeroFormError('');
    setHeroStartDate(new Date().toISOString().slice(0, 10));
    setHeroEndDate(getFutureDateIso(managedHeroBannerDraftDefaults.durationDays));
    setHeroCtaLabel(managedHeroBannerDraftDefaults.ctaLabel);
    setHeroCtaType(managedHeroBannerDraftDefaults.ctaType);
    setHeroCtaTarget(managedHeroBannerDraftDefaults.ctaTarget);
    setHeroPincodes('');
    setHeroStatsDraft(managedHeroStatDraftDefaults.map((stat) => ({ ...stat })));
  };

  const beginEditHeroBanner = (hero: HeroBanner) => {
    setHeroEditId(hero.id);
    setHeroLocalityId(hero.localityId);
    setHeroTitle(hero.title);
    setHeroSubtitle(hero.subtitle);
    setHeroImageUrl(hero.imageUrl || '');
    setHeroImageFile(null);
    setHeroStartDate(hero.startDate);
    setHeroEndDate(hero.endDate);
    setHeroCtaLabel(hero.ctaLabel || managedHeroBannerDraftDefaults.ctaLabel);
    setHeroCtaType(hero.ctaType || managedHeroBannerDraftDefaults.ctaType);
    setHeroCtaTarget(hero.ctaTarget || managedHeroBannerDraftDefaults.ctaTarget);
    setHeroPincodes((hero.pincodes || []).join(', '));
    setHeroStatsDraft(managedHeroStatDraftDefaults.map((fallback, index) => {
      const stat = hero.heroStats?.[index];
      return {
        enabled: stat?.enabled ?? fallback.enabled,
        label: stat?.label || fallback.label,
        value: stat?.value || fallback.value,
        localityIds: (stat?.localityIds || []).join(', '),
        pincodes: (stat?.pincodes || []).join(', ')
      };
    }));
    setHeroFormError('');
  };

  useEffect(() => {
    if (adminCategoryFilter === 'all') {
      setAdminSubcategoryFilter('all');
      return;
    }
    if (!getSubcategoriesForCategory(adminCategoryFilter).some((subcategory) => subcategory.id === adminSubcategoryFilter)) {
      setAdminSubcategoryFilter('all');
    }
  }, [adminCategoryFilter, adminSubcategoryFilter]);

  useEffect(() => {
    if (!couponBusinessId) {
      const firstApproved = businesses.find((business) => business.status === 'approved');
      if (firstApproved) {
        setCouponBusinessId(firstApproved.id);
      }
    }
  }, [businesses, couponBusinessId]);

  useEffect(() => {
    if (!apiConfiguration) return;
    setApiConfigDraft(apiConfiguration);
  }, [apiConfiguration]);

  useEffect(() => {
    if (!homepageLocalityId) return;
    setTemplateDraft((prev) => prev.id ? prev : ({
      ...prev,
      localityIds: prev.localityIds || homepageLocalityId,
    }));
    setAssignmentDraft((prev) => prev.id ? prev : ({
      ...prev,
      localityId: prev.localityId || homepageLocalityId,
      templateId: prev.templateId || scalableHomepageConfig?.templates[0]?.id || '',
    }));
    setCampaignDraft((prev) => prev.id ? prev : ({
      ...prev,
      localityIds: prev.localityIds || homepageLocalityId,
    }));
    setResolvedPreviewDraft((prev) => ({
      ...prev,
      localityId: prev.localityId || homepageLocalityId,
    }));
    setPublishScopeDraft((prev) => ({
      ...prev,
      localityIds: prev.localityIds || homepageLocalityId,
    }));
  }, [homepageLocalityId, scalableHomepageConfig?.templates]);

  const parsePincodeList = (raw: string) => (
    raw
      .split(/[\s,]+/)
      .map((entry) => entry.replace(/\D/g, '').trim())
      .filter((entry, index, items) => entry.length === 6 && items.indexOf(entry) === index)
  );
  const parseIdList = (raw: string) => (
    raw
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter((entry, index, items) => entry.length > 0 && items.indexOf(entry) === index)
  );
  const createAdminId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const pruneEmptyPayload = (value: Record<string, unknown>) => (
    Object.fromEntries(
      Object.entries(value).filter(([, entry]) => {
        if (entry === undefined || entry === null || entry === '') return false;
        if (Array.isArray(entry) && entry.length === 0) return false;
        return true;
      })
    )
  );
  const buildPublishContextsFromDraft = (draft = publishScopeDraft): ResolvedHomepagePublishContext[] => {
    const localityIds = parseIdList(draft.localityIds);
    const categoryIds = parseIdList(draft.categoryIds);
    const subcategoryIds = parseIdList(draft.subcategoryIds);
    const pincodes = parsePincodeList(draft.pincodes);
    const placementKeys = parseIdList(draft.placementKeys);
    const deviceTargets = parseIdList(draft.deviceTargets).filter((device): device is 'all' | 'mobile' | 'desktop' => ['all', 'mobile', 'desktop'].includes(device));
    const pageTypes = parseIdList(draft.pageTypes);

    const scopedSubcategoryEntries = subcategoryIds
      .map((subcategoryId) => BUSINESS_SUBCATEGORIES.find((subcategory) => subcategory.id === subcategoryId))
      .filter(Boolean)
      .filter((subcategory) => categoryIds.length === 0 || categoryIds.includes(subcategory!.categoryId))
      .map((subcategory) => ({
        categoryId: subcategory!.categoryId,
        subcategoryId: subcategory!.id,
      }));

    const unscopedCategoryEntries = categoryIds
      .filter((categoryId) => !scopedSubcategoryEntries.some((entry) => entry.categoryId === categoryId))
      .map((categoryId) => ({
        categoryId,
        subcategoryId: '',
      }));

    const categoryContextEntries = [
      ...unscopedCategoryEntries,
      ...scopedSubcategoryEntries,
    ];

    const normalizedCategoryEntries = categoryContextEntries.length > 0
      ? categoryContextEntries
      : [{ categoryId: '', subcategoryId: '' }];
    const normalizedPincodes = pincodes.length > 0 ? pincodes : [''];
    const normalizedPlacementKeys = placementKeys.length > 0 ? placementKeys : [''];
    const normalizedDevices: Array<'all' | 'mobile' | 'desktop'> = deviceTargets.length > 0 ? deviceTargets : ['all'];
    const normalizedPageTypes = pageTypes.length > 0 ? pageTypes : ['homepage'];

    return localityIds.flatMap((localityId) => (
      normalizedCategoryEntries.flatMap((categoryEntry) => (
        normalizedPincodes.flatMap((pincode) => (
          normalizedPlacementKeys.flatMap((placementKey) => (
            normalizedDevices.flatMap((device) => (
              normalizedPageTypes.map((pageType) => ({
                localityId,
                categoryId: categoryEntry.categoryId || undefined,
                subcategoryId: categoryEntry.subcategoryId || undefined,
                pincode: pincode || undefined,
                placementKey: placementKey || undefined,
                device,
                pageType,
              }))
            ))
          ))
        ))
      ))
    ));
  };

  const homepageSectionLabels: Record<HomepageSectionType, string> = {
    hero_banner: 'Hero Banner',
    search_discovery: 'Search & Discovery',
    emergency_grid: 'Emergency Services',
    promo_banner: 'Promo Banner',
    featured_businesses: 'Featured Businesses',
    business_shelf: 'Business Shelf',
    text_business_strip: 'Compact Service Strip',
    offers_list: 'Offers & Deals',
    updates_feed: 'Locality Updates',
    category_grid: 'Category Grid',
    verified_business_grid: 'Verified Businesses',
    trust_strip: 'Trust Strip'
  };

  const homepageSectionOptions = (Object.keys(homepageSectionLabels) as HomepageSectionType[]).map((sectionType) => ({
    id: sectionType,
    label: homepageSectionLabels[sectionType]
  }));
  const allOperationsSectionTabs: Array<{ id: AdminOperationsSection; label: string; description: string }> = [
    { id: 'listings', label: 'Listings', description: 'Activate, deactivate, and review uploaded business records.' },
    { id: 'homepage', label: 'Homepage CMS', description: 'Manage layouts, hero banners, publishing, templates, and preview states.' },
    { id: 'campaigns', label: 'Ads & Offers', description: 'Run ad banners, offers, campaigns, and monitor incoming ad leads.' },
    { id: 'geography', label: 'Geography & Routing', description: 'Manage localities, pincode routing, and locality-category URL mapping.' },
    { id: 'content', label: 'Updates & Community', description: 'Publish locality updates and community-led content blocks.' },
    { id: 'platform', label: 'Platform Config', description: 'Control API sync, taxonomy, defaults, SEO discovery, and core configuration.' }
  ];
  const operationsSectionTabs = allOperationsSectionTabs.filter((tab) => canUsePrivilegedAdminWorkspace || tab.id === 'listings');
  const selectedOperationsTab = operationsSectionTabs.find((tab) => tab.id === operationsSection) || operationsSectionTabs[0];
  const allHomepageCmsSubtabs: Array<{ id: HomepageCmsSubtab; label: string; description: string }> = [
    { id: 'layout', label: 'Layout', description: 'Arrange homepage sections for the selected locality.' },
    { id: 'hero', label: 'Hero Banners', description: 'Manage hero banners and top stat cards.' },
    { id: 'publish', label: 'Publish', description: 'Publish locality pages, reseed legacy data, and manage scope-based releases.' },
    { id: 'templates', label: 'Templates', description: 'Create and maintain reusable scalable homepage templates.' },
    { id: 'assignments', label: 'Assignments', description: 'Map templates to locality, category, subcategory, and pincode contexts.' },
    { id: 'campaigns', label: 'Campaign Builder', description: 'Manage scalable campaigns for hero, ads, offers, content, and sponsorships.' },
    { id: 'insights', label: 'Snapshots & Preview', description: 'Review published snapshots and load resolved homepage previews.' },
  ];
  const homepageCmsSubtabs = allHomepageCmsSubtabs.filter((tab) => canUsePrivilegedAdminWorkspace || ['layout', 'hero'].includes(tab.id));
  const selectedHomepageCmsSubtab = homepageCmsSubtabs.find((tab) => tab.id === homepageCmsSubtab) || homepageCmsSubtabs[0];
  const allPlatformConfigSubtabs: Array<{ id: PlatformConfigSubtab; label: string; description: string }> = [
    { id: 'api', label: 'API & Sync', description: 'Control platform endpoints, sync mode, and publish service paths.' },
    { id: 'taxonomy', label: 'Taxonomy', description: 'Manage categories, subcategories, and spreadsheet-driven taxonomy imports.' },
    { id: 'geography', label: 'Geography Master', description: 'Manage states, cities, localities, and Excel-friendly geography uploads.' },
    { id: 'defaults', label: 'Homepage Defaults', description: 'Control shared hero defaults and reusable homepage preset values.' },
    { id: 'seo', label: 'SEO Discovery', description: 'Manage discovery and SEO defaults for locality/category page generation.' },
  ];
  const geographyWorkspaceSubtabs: Array<{ id: GeographyWorkspaceSubtab; label: string; description: string }> = [
    { id: 'localities', label: 'Locality Pages', description: 'Create locality pages and review the live locality catalog in one place.' },
    { id: 'routing', label: 'Pincode Routing', description: 'Maintain fallback routing, active pincode bindings, and manual area mapping.' },
    { id: 'links', label: 'Category URLs', description: 'Create and manage locality plus category landing routes without scrolling through routing tools.' },
  ];
  const selectedGeographyWorkspaceSubtab = geographyWorkspaceSubtabs.find((tab) => tab.id === geographyWorkspaceSubtab) || geographyWorkspaceSubtabs[0];
  const campaignWorkspaceSubtabs: Array<{ id: CampaignWorkspaceSubtab; label: string; description: string }> = [
    { id: 'offers', label: 'Offers', description: 'Create and manage locality-targeted offers and deal inventory.' },
    { id: 'ads', label: 'Ad Banners', description: 'Configure banner creatives, placements, targeting, and run states.' },
    { id: 'leads', label: 'Lead Inbox', description: 'Review enquiries generated from banner lead forms without mixing them into authoring.' },
  ];
  const selectedCampaignWorkspaceSubtab = campaignWorkspaceSubtabs.find((tab) => tab.id === campaignWorkspaceSubtab) || campaignWorkspaceSubtabs[0];
  const platformConfigSubtabs = allPlatformConfigSubtabs.filter((tab) => {
    if (tab.id === 'taxonomy') return Boolean(businessTaxonomy);
    if (tab.id === 'geography') return Boolean(geographyConfig);
    if (tab.id === 'defaults') return Boolean(homepageDefaultsConfig);
    if (tab.id === 'seo') return Boolean(seoDiscoveryConfig);
    return true;
  });
  const selectedPlatformConfigSubtab = platformConfigSubtabs.find((tab) => tab.id === platformConfigSubtab) || platformConfigSubtabs[0];
  const workspaceSurfaceTabs = [
    { id: 'admin', label: 'Admin Workspace' },
    { id: 'operations', label: 'Operations Workspace' },
  ].filter((surface) => canUsePrivilegedAdminWorkspace || surface.id === 'admin');

  const selectedHomepageLayout = homepageLayouts.find((layout) => layout.localityId === homepageLocalityId);
  const homepageSections = [...(selectedHomepageLayout?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedScalableTemplate = scalableHomepageConfig?.templates.find((template) => template.id === templateDraft.id) || null;
  const selectedScalableTemplateSections = [...(selectedScalableTemplate?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    setExpandedSectionCardIds([]);
  }, [homepageLocalityId, selectedScalableTemplate?.id]);
  const scalableTemplateCount = scalableHomepageConfig?.templates.length || 0;
  const scalableAssignmentCount = scalableHomepageConfig?.assignments.length || 0;
  const scalableCampaignCount = scalableHomepageConfig?.campaigns.length || 0;
  const scalableSnapshotCount = scalableHomepageConfig?.publishedSnapshots.length || 0;
  const scalableLegacyOwnershipSummary: ScalableLegacyOwnershipSummary = {
    legacyManagedTemplates: (scalableHomepageConfig?.templates || []).filter((template) => String(template.metadata?.source || '').startsWith('legacy_') && !template.metadata?.detachedFromLegacySync).length,
    detachedTemplates: (scalableHomepageConfig?.templates || []).filter((template) => Boolean(template.metadata?.detachedFromLegacySync)).length,
    legacyManagedAssignments: (scalableHomepageConfig?.assignments || []).filter((assignment) => String(assignment.metadata?.source || '').startsWith('legacy_') && !assignment.metadata?.detachedFromLegacySync).length,
    detachedAssignments: (scalableHomepageConfig?.assignments || []).filter((assignment) => Boolean(assignment.metadata?.detachedFromLegacySync)).length,
    legacyManagedCampaigns: (scalableHomepageConfig?.campaigns || []).filter((campaign) => String(campaign.metadata?.source || '').startsWith('legacy_') && !campaign.metadata?.detachedFromLegacySync).length,
    detachedCampaigns: (scalableHomepageConfig?.campaigns || []).filter((campaign) => Boolean(campaign.metadata?.detachedFromLegacySync)).length,
  };
  const recentPublishedSnapshots = [...(scalableHomepageConfig?.publishedSnapshots || [])]
    .sort((left, right) => Date.parse(right.publishedAt || right.updatedAt || '') - Date.parse(left.publishedAt || left.updatedAt || ''))
    .slice(0, 12);
  const sortedScalableTemplates = [...(scalableHomepageConfig?.templates || [])].sort((a, b) => b.priority - a.priority);
  const sortedScalableAssignments = [...(scalableHomepageConfig?.assignments || [])].sort((a, b) => b.priority - a.priority);
  const sortedScalableCampaigns = [...(scalableHomepageConfig?.campaigns || [])].sort((a, b) => b.priority - a.priority);
  const activeDefaultTemplate = sortedScalableTemplates.find((template) => template.isDefault && template.status === 'active') || null;
  const localitySelectionOptions = localities.map((locality) => ({
    id: locality.id,
    label: locality.name,
    meta: locality.slug,
  }));
  const localityNameById = new Map(localities.map((locality) => [locality.id, locality.name]));
  const templateNameById = new Map(sortedScalableTemplates.map((template) => [template.id, template.name]));
  const formatLocalityLabel = (localityId: string) => localityNameById.get(localityId) || localityId;
  const templateSelectionOptions = sortedScalableTemplates.map((template) => ({
    id: template.id,
    label: template.name,
    meta: `${template.templateScope} • priority ${template.priority}`,
  }));
  const categorySelectionOptions = BUSINESS_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.name,
  }));
  const subcategorySelectionOptions = BUSINESS_SUBCATEGORIES
    .filter((subcategory) => {
      const scopedCategoryIds = parseIdList(campaignDraft.categoryIds);
      return scopedCategoryIds.length === 0 || scopedCategoryIds.includes(subcategory.categoryId);
    })
    .map((subcategory) => ({
      id: subcategory.id,
      label: subcategory.name,
      meta: getCategoryById(subcategory.categoryId)?.name || subcategory.categoryId,
    }));
  const publishSubcategorySelectionOptions = BUSINESS_SUBCATEGORIES
    .filter((subcategory) => {
      const scopedCategoryIds = parseIdList(publishScopeDraft.categoryIds);
      return scopedCategoryIds.length === 0 || scopedCategoryIds.includes(subcategory.categoryId);
    })
    .map((subcategory) => ({
      id: subcategory.id,
      label: subcategory.name,
      meta: getCategoryById(subcategory.categoryId)?.name || subcategory.categoryId,
    }));
  const placementKeySelectionOptions = Array.from(new Set([
    'homepage_inline_primary',
    'homepage_sidebar_top',
    'homepage_sidebar_food',
    'homepage_sidebar_clinic',
    'homepage_sidebar_marketing',
    ...(listingAds || []).map((ad) => String(ad.placementKey || '').trim()),
    ...((homepageDefaultsConfig?.fallbackListingAds || []).map((ad) => String(ad.placementKey || '').trim())),
    ...(homepageSections || []).map((section) => String(section.placementKey || '').trim()),
    ...sortedScalableCampaigns.flatMap((campaign) => campaign.placementKeys || []),
  ].filter(Boolean))).sort().map((placementKey) => ({
    id: placementKey,
    label: placementKey,
  }));
  const pincodeSelectionOptions = Array.from(new Set([
    ...pincodeMappings.map((mapping) => String(mapping.pincode || '').trim()),
    ...MASTER_AREAS.map((area) => String(area.pincode || '').trim()),
    ...businesses.map((business) => String(business.pincode || '').trim()),
  ].filter((entry) => entry.length === 6))).sort().map((pincode) => ({
    id: pincode,
    label: pincode,
  }));
  const deviceSelectionOptions: OrderedSelectionOption[] = [
    { id: 'all', label: 'All devices' },
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
  ];
  const pageTypeSelectionOptions: OrderedSelectionOption[] = [
    { id: 'homepage', label: 'Homepage' },
    { id: 'listing_results', label: 'Listing results' },
  ];
  const publishScopeContexts = buildPublishContextsFromDraft();
  const publishScopeCombinationCount = publishScopeContexts.length;
  const filteredBusinesses = businesses.filter((business) => {
    if (adminLocalityFilter !== 'all' && business.localityId !== adminLocalityFilter) return false;
    if (adminCategoryFilter !== 'all' && business.categoryId !== adminCategoryFilter) return false;
    if (adminSubcategoryFilter !== 'all' && business.subcategoryId !== adminSubcategoryFilter) return false;
    if (adminStatusFilter !== 'all' && business.status !== adminStatusFilter) return false;
    if (adminPincodeFilter.trim()) {
      const businessPincode = business.pincode || MASTER_AREAS.find((area) => area.id === business.areaId)?.pincode || '';
      if (!businessPincode.includes(adminPincodeFilter.trim())) return false;
    }
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${business.name} ${business.phone} ${business.address} ${business.ownerName || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const approvedBusinessSelectionOptions = filteredBusinesses
    .filter((business) => business.status === 'approved')
    .map((business) => ({
      id: business.id,
      label: business.name,
      meta: `${getCategoryById(business.categoryId)?.name || business.categoryId} • ${localities.find((locality) => locality.id === business.localityId)?.name || business.localityId}`,
    }));
  const filteredCoupons = coupons.filter((coupon) => {
    const business = businesses.find((entry) => entry.id === coupon.businessId);
    if (adminLocalityFilter !== 'all' && !(coupon.localityIds || []).includes(adminLocalityFilter) && business?.localityId !== adminLocalityFilter) return false;
    if (adminCategoryFilter !== 'all' && business?.categoryId !== adminCategoryFilter) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${coupon.title || ''} ${coupon.code} ${coupon.description} ${business?.name || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredListingAds = listingAds.filter((ad) => {
    if (adminLocalityFilter !== 'all' && !(ad.localityIds || []).includes(adminLocalityFilter)) return false;
    if (adminStatusFilter === 'active' && !ad.isActive) return false;
    if (adminStatusFilter === 'inactive' && ad.isActive) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${ad.title} ${ad.description} ${ad.badge} ${ad.placementKey || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredHeroBanners = heroBanners.filter((hero) => {
    if (adminLocalityFilter !== 'all' && hero.localityId !== adminLocalityFilter) return false;
    if (adminStatusFilter === 'active' && !hero.isActive) return false;
    if (adminStatusFilter === 'inactive' && hero.isActive) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${hero.title} ${hero.subtitle}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredCommunityItems = communityItems.filter((item) => {
    if (adminLocalityFilter !== 'all' && item.localityId !== adminLocalityFilter) return false;
    if (communityTypeFilter !== 'all' && item.type !== communityTypeFilter) return false;
    if (communityStatusFilter !== 'all' && (item.status || 'published') !== communityStatusFilter) return false;
    if (communityDateFilter) {
      const selectedDate = communityDateFilter;
      const publishAt = item.publishAt || item.createdAt;
      const expireAt = item.expireAt || '';
      if (publishAt && publishAt > `${selectedDate}T23:59:59.999Z`) return false;
      if (expireAt && expireAt < `${selectedDate}T00:00:00.000Z`) return false;
    }
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${item.title} ${item.content} ${item.authorName} ${item.type} ${(item.status || 'published')}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredAdLeads = adLeads.filter((lead) => {
    if (adminLocalityFilter !== 'all' && lead.localityId !== adminLocalityFilter) return false;
    if (adminPincodeFilter.trim() && !lead.pincode.includes(adminPincodeFilter.trim())) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${lead.name} ${lead.mobile} ${lead.adId}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredHomepageSections = homepageSections.filter((section) => {
    if (adminStatusFilter === 'active' && section.status !== 'active') return false;
    if (adminStatusFilter === 'inactive' && section.status === 'active') return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${section.title} ${section.subtitle || ''} ${section.sectionType}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredLocalities = localities.filter((locality) => {
    if (adminLocalityFilter !== 'all' && locality.id !== adminLocalityFilter) return false;
    if (adminSearchQuery.trim()) {
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${locality.name} ${locality.subdomain} ${locality.slug}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
  const filteredPincodeMappings = pincodeMappings.filter((mapping) => {
    if (adminLocalityFilter !== 'all' && mapping.localityId !== adminLocalityFilter) return false;
    if (adminPincodeFilter.trim() && !mapping.pincode.includes(adminPincodeFilter.trim())) return false;
    if (adminSearchQuery.trim()) {
      const localityName = localities.find((locality) => locality.id === mapping.localityId)?.name || mapping.localityId;
      const query = adminSearchQuery.trim().toLowerCase();
      if (!`${mapping.pincode} ${localityName}`.toLowerCase().includes(query)) return false;
    }
    return true;
  });
  const filteredLocalityCategoryLinks = localityCategoryLinks.filter((link) => {
    if (adminLocalityFilter !== 'all' && link.localityId !== adminLocalityFilter) return false;
    if (adminCategoryFilter !== 'all' && link.categoryId !== adminCategoryFilter) return false;
    if (adminSubcategoryFilter !== 'all' && link.subcategoryId !== adminSubcategoryFilter) return false;
    if (adminSearchQuery.trim()) {
      const localityName = localities.find((locality) => locality.id === link.localityId)?.name || link.localityId;
      const query = adminSearchQuery.trim().toLowerCase();
      const searchable = `${localityName} ${link.slug} ${link.categoryId} ${link.subcategoryId || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });

  const parseCsvLine = (line: string) => {
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((s) => s.trim().replace(/^"|"$/g, ''));
  };

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

  const resolveCategoryFromImport = (categoryName: string | undefined) => {
    const normalized = String(categoryName || '').trim().toLowerCase();
    if (!normalized) return '';
    const direct = BUSINESS_CATEGORIES.find((category) => (
      [category.id, category.slug, category.name.toLowerCase()].includes(normalized)
    ));
    return direct?.id || '';
  };

  const resolveSubcategoryFromImport = (subcategoryName: string | undefined, categoryId: string) => {
    const normalized = String(subcategoryName || '').trim().toLowerCase();
    if (!normalized || !categoryId) return '';
    const direct = BUSINESS_SUBCATEGORIES.find((subcategory) => (
      subcategory.categoryId === categoryId &&
      [subcategory.id, subcategory.slug, subcategory.name.toLowerCase()].includes(normalized)
    ));
    return direct?.id || '';
  };

  const inferLocality = (area: string) => {
    const a = area.toLowerCase();
    if (a.includes('kharghar')) return 'kharghar';
    if (a.includes('kamothe')) return 'kamothe';
    if (a.includes('panvel')) return 'panvel';
    if (a.includes('taloja')) return 'taloja';
    if (a.includes('kalamboli')) return 'kalamboli';
    return 'roadpali';
  };

  const buildImportPreview = (rows: BulkImportRow[]) => rows.map((row, idx): ImportPreviewRow => {
    const errors: string[] = [];
    const normalizedPhone = normalizePhone(row.mobile);
    const areaMatch =
      MASTER_AREAS.find(a => a.name.toLowerCase().includes((row.area || '').toLowerCase()) && row.area.trim()) ||
      MASTER_AREAS.find(a => a.pincode === row.pin.replace(/\D/g, ''));
    const resolvedPincode = row.pin.replace(/\D/g, '') || areaMatch?.pincode || '';
    const mappedLocality = pincodeMappings.find(m => m.pincode === resolvedPincode)?.localityId;
    const resolvedLocalityId = mappedLocality || inferLocality(`${row.area} ${row.city}`);
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
    const tagPayload = buildListingTags(
      row.services || '',
      row.category || '',
      row.subcategory || '',
      getCategoryById(categoryId)?.name || '',
      getSubcategoryById(subcategoryId)?.name || '',
      normalizedPhone,
      row.businessName
    );

    if (!row.businessName.trim()) errors.push('Business Name is required.');
    if (normalizedPhone.length > 0 && normalizedPhone.length !== 10) errors.push('Mobile must be blank or a valid 10-digit number.');
    if (resolvedPincode.length !== 6) errors.push('Valid 6-digit PIN is required or must match a known area.');
    if (!localities.some(l => l.id === resolvedLocalityId)) errors.push(`Mapped locality "${resolvedLocalityId}" does not exist.`);

    const duplicate = businesses.find((biz) => {
      const bizPincode = biz.pincode || MASTER_AREAS.find(a => a.id === biz.areaId)?.pincode || '';
      return (
        biz.name.trim().toLowerCase() === row.businessName.trim().toLowerCase() &&
        normalizedPhone.length > 0 &&
        normalizePhone(biz.phone) === normalizedPhone &&
        bizPincode === resolvedPincode &&
        biz.localityId === resolvedLocalityId
      );
    });

    const previewStatus: ImportPreviewRow['previewStatus'] = errors.length ? 'fail' : duplicate ? 'update' : 'ready';
    return {
      ...row,
      rowNumber: idx + 2,
      previewStatus,
      errors,
      normalizedPhone,
      resolvedPincode,
      resolvedLocalityId,
      requiresTaxonomyMapping,
      taxonomyStatusLabel,
      importAction: duplicate ? 'update' : 'create',
      existingBusinessId: duplicate?.id,
      localityId: resolvedLocalityId,
      areaId: areaMatch?.id || 'roadpali-sec17',
      categoryId,
      subcategoryId,
      sourceCategoryLabel: row.category?.trim() || undefined,
      sourceSubcategoryLabel: row.subcategory?.trim() || undefined,
      taxonomyMapped: !requiresTaxonomyMapping,
      tags: tagPayload
    };
  });

  const handleCsvImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setImportResult('CSV appears empty or missing rows.');
      setImportPreview([]);
      return;
    }
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      const get = (name: string) => {
        const idx = headers.indexOf(name.toLowerCase());
        return idx >= 0 ? (cols[idx] || '') : '';
      };
      return {
        businessName: get('Business Name'),
        address: get('Address'),
        area: get('Area'),
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

    const preview = buildImportPreview(rows);
    setImportPreview(preview);
    setImportPreviewPage(1);
    const ready = preview.filter(r => r.previewStatus === 'ready').length;
    const updates = preview.filter(r => r.previewStatus === 'update').length;
    const failed = preview.filter(r => r.previewStatus === 'fail').length;
    const queuedForMapping = preview.filter((row) => row.requiresTaxonomyMapping && row.previewStatus !== 'fail').length;
    setImportResult(`Preview generated: ${ready} ready, ${updates} existing matches need update confirmation, ${queuedForMapping} queued for taxonomy mapping, ${failed} failed.`);
  };

  const handleApplyImportPreview = () => {
    if (!onBulkImportBusinesses) {
      setImportResult('Bulk import callback is not configured.');
      return;
    }
    const validRows = importPreview.filter(r => r.previewStatus !== 'fail');
    const updateRows = validRows.filter(r => r.previewStatus === 'update');
    if (updateRows.length > 0 && !confirm(`${updateRows.length} listing(s) already exist with the same business name, phone, pincode, and locality. Update those records instead of creating duplicates?`)) {
      return;
    }
    const result = onBulkImportBusinesses(validRows);
    const failed = importPreview.filter(r => r.previewStatus === 'fail').length;
    setImportPreview(importPreview.filter(r => r.previewStatus === 'fail'));
    setImportPreviewPage(1);
    setImportResult(`Upload complete: ${result.imported} created, ${result.skipped} updated/skipped, ${failed} failed rows kept below with error details.`);
  };

  const downloadFailedImportCsv = () => {
    const failedRows = importPreview.filter(r => r.previewStatus === 'fail');
    const header = ['Row', 'Business Name', 'Address', 'Area', 'City', 'State', 'PIN', 'Mobile', 'Rating', 'Reviews', 'Services', 'Category', 'Subcategory', 'Latitude', 'Longitude', 'Error Details'];
    const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const body = failedRows.map(r => [
      r.rowNumber, r.businessName, r.address, r.area, r.city, r.state, r.pin, r.mobile, r.rating, r.reviews, r.services, r.category || '', r.subcategory || '', r.latitude, r.longitude, r.errors.join('; ')
    ].map(escapeCsv).join(','));
    const blob = new Blob([[header.map(escapeCsv).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'failed-business-imports.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const pendingBusinesses = businesses.filter(b => b.status === 'pending');
  const listingStatusItems = [...businesses]
    .filter((business) => listingStatusFilter === 'all' ? true : business.status === listingStatusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unmappedTaxonomyBusinesses = businesses
    .filter((business) => !isBusinessTaxonomyMapped(business))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const LISTING_STATUS_PAGE_SIZE = 20;
  const listingStatusTotalPages = Math.max(1, Math.ceil(listingStatusItems.length / LISTING_STATUS_PAGE_SIZE));
  const safeListingStatusPage = Math.min(listingStatusPage, listingStatusTotalPages);
  const listingStatusPageItems = listingStatusItems.slice(
    (safeListingStatusPage - 1) * LISTING_STATUS_PAGE_SIZE,
    safeListingStatusPage * LISTING_STATUS_PAGE_SIZE
  );
  const allAdminWorkspaceTabs: Array<{ id: AdminWorkspaceTab; label: string; count?: number }> = [
    { id: 'moderation', label: 'Moderation', count: pendingBusinesses.length },
    { id: 'listing-status', label: 'Listing Status', count: businesses.length },
    { id: 'bulk-upload', label: 'Bulk Upload' },
    { id: 'taxonomy-mapping', label: 'Taxonomy Mapping', count: unmappedTaxonomyBusinesses.length },
    { id: 'data-audit', label: 'Data Audit', count: auditLogs.length }
  ];
  const adminWorkspaceTabs = allAdminWorkspaceTabs.filter((tab) => (
    canUsePrivilegedAdminWorkspace
      ? true
      : !['bulk-upload', 'taxonomy-mapping'].includes(tab.id)
  ));
  const AUDIT_PAGE_SIZE = 20;
  const auditTotalPages = Math.max(1, Math.ceil(auditLogs.length / AUDIT_PAGE_SIZE));
  const safeAuditPage = Math.min(auditPage, auditTotalPages);
  const pagedAuditLogs = auditLogs.slice((safeAuditPage - 1) * AUDIT_PAGE_SIZE, safeAuditPage * AUDIT_PAGE_SIZE);
  const IMPORT_PREVIEW_PAGE_SIZE = 20;
  const importPreviewTotalPages = Math.max(1, Math.ceil(importPreview.length / IMPORT_PREVIEW_PAGE_SIZE));
  const safeImportPreviewPage = Math.min(importPreviewPage, importPreviewTotalPages);
  const pagedImportPreview = importPreview.slice(
    (safeImportPreviewPage - 1) * IMPORT_PREVIEW_PAGE_SIZE,
    safeImportPreviewPage * IMPORT_PREVIEW_PAGE_SIZE
  );

  const triggerNotification = (msg: string) => {
    setAdminNotification(msg);
    setTimeout(() => setAdminNotification(null), 3000);
  };

  const createInlineSubcategory = async (categoryId: string, rawName: string) => {
    if (!businessTaxonomy || !onSaveBusinessTaxonomy) {
      throw new Error('Taxonomy save is not available in this workspace.');
    }

    const category = businessTaxonomy.categories.find((entry) => entry.id === categoryId);
    if (!category) {
      throw new Error('Choose a valid category before creating a subcategory.');
    }

    const name = rawName.trim();
    if (!name) {
      throw new Error('Subcategory name is required.');
    }

    const existingMatch = businessTaxonomy.subcategories.find((subcategory) => (
      subcategory.categoryId === categoryId &&
      subcategory.name.toLowerCase() === name.toLowerCase()
    ));
    if (existingMatch) {
      triggerNotification(`Subcategory already exists: ${existingMatch.name}`);
      return existingMatch.id;
    }

    const nextId = buildUniqueAdminId(name, new Set(businessTaxonomy.subcategories.map((subcategory) => subcategory.id)));
    if (!nextId) {
      throw new Error('Could not generate a valid subcategory ID.');
    }

    const siblingCount = businessTaxonomy.subcategories.filter((subcategory) => subcategory.categoryId === categoryId).length;
    const nextTaxonomy: BusinessTaxonomyState = {
      ...businessTaxonomy,
      subcategories: [
        ...businessTaxonomy.subcategories,
        {
          id: nextId,
          legacyId: Date.now(),
          parentLegacyId: category.legacyId,
          categoryId,
          name,
          slug: nextId,
          icon: 'subcategory_icon',
          status: 'active',
          sortOrder: siblingCount + 1,
        },
      ],
      metadata: {
        ...businessTaxonomy.metadata,
        seededFromCode: false,
        updatedAt: new Date().toISOString(),
      },
    };

    await onSaveBusinessTaxonomy(nextTaxonomy);
    triggerNotification(`Created subcategory: ${name}`);
    return nextId;
  };

  const getTaxonomyDraft = (biz: Business) => (
    taxonomyDrafts[biz.id] || {
      categoryId: biz.categoryId || '',
      subcategoryId: biz.subcategoryId || '',
    }
  );

  const updateTaxonomyDraft = (businessId: string, patch: Partial<{ categoryId: string; subcategoryId: string }>) => {
    setTaxonomyDrafts((prev) => ({
      ...prev,
      [businessId]: {
        categoryId: patch.categoryId ?? prev[businessId]?.categoryId ?? '',
        subcategoryId: patch.subcategoryId ?? prev[businessId]?.subcategoryId ?? '',
      }
    }));
  };

  const saveTaxonomyMapping = (biz: Business) => {
    if (!onUpdateBusiness) return;
    const draft = getTaxonomyDraft(biz);
    if (!draft.categoryId || !draft.subcategoryId) {
      triggerNotification(`Select both category and subcategory for ${biz.name}.`);
      return;
    }
    onUpdateBusiness({
      ...biz,
      categoryId: draft.categoryId,
      subcategoryId: draft.subcategoryId,
      taxonomyMapped: true,
      tags: buildListingTags(
        biz.tags || [],
        biz.sourceCategoryLabel || '',
        biz.sourceSubcategoryLabel || '',
        getCategoryById(draft.categoryId)?.name || '',
        getSubcategoryById(draft.subcategoryId)?.name || '',
      ),
    });
    setTaxonomyDrafts((prev) => {
      const next = { ...prev };
      delete next[biz.id];
      return next;
    });
    triggerNotification(`Mapped taxonomy for ${biz.name}.`);
  };

  const openBackendListing = (biz: Business) => {
    setSelectedBackendBiz(biz);
    setBackendDraft({
      ...biz,
      pincode: biz.pincode || MASTER_AREAS.find((area) => area.id === biz.areaId)?.pincode || '',
      areasOfOperation: [...(biz.areasOfOperation || [])]
    });
    setBackendEditMode(false);
  };

  const closeBackendListing = () => {
    setSelectedBackendBiz(null);
    setBackendDraft(null);
    setBackendEditMode(false);
  };

  const saveBackendListing = () => {
    if (!backendDraft || !onUpdateBusiness) return;
    const normalizedDraft = {
      ...backendDraft,
      pincode: backendDraft.pincode || MASTER_AREAS.find((area) => area.id === backendDraft.areaId)?.pincode || ''
    };
    onUpdateBusiness(normalizedDraft);
    setSelectedBackendBiz(normalizedDraft);
    setBackendDraft(normalizedDraft);
    setBackendEditMode(false);
    triggerNotification(`Saved listing: ${normalizedDraft.name}`);
  };

  const handleLocalitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocSubdomain) {
      triggerNotification("Please fill in Name and Subdomain!");
      return;
    }
    
    // Clean subdomain format
    let cleanSub = newLocSubdomain.toLowerCase().trim();
    if (!cleanSub.includes('.')) {
      cleanSub = `${cleanSub}.yellowpages.io`;
    }

    const defaultImg = newLocImg.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80';

    const newLocalityId = newLocName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mappedPins = newLocPincodes
      .split(/[\s,]+/)
      .map((pin) => pin.replace(/\D/g, '').trim())
      .filter((pin, index, arr) => pin.length === 6 && arr.indexOf(pin) === index);

    onCreateLocality(newLocName, cleanSub, newLocDesc || 'Dynamic regional yellow pages listings catalog.', defaultImg);
    mappedPins.forEach((pin) => onAddPincodeMapping?.(pin, newLocalityId));
    triggerNotification(`Successfully spun up locality: ${newLocName}`);
    setNewLocName('');
    setNewLocSubdomain('');
    setNewLocDesc('');
    setNewLocImg('');
    setNewLocPincodes('');
  };

  const uploadedListings = businesses.filter((business) => (
    business.id.startsWith('csv_') ||
    business.id.startsWith('b_dynamic_') ||
    business.ownerName === 'Imported via CSV'
  ));
  const uploadedStatusFiltered = uploadedListings.filter((business) => {
    if (uploadedTab === 'active') return business.status === 'approved';
    if (uploadedTab === 'deactivated') return business.status === 'rejected';
    return business.status === 'pending';
  });
  const UPLOADED_PAGE_SIZE = 20;
  const uploadedTotalPages = Math.max(1, Math.ceil(uploadedStatusFiltered.length / UPLOADED_PAGE_SIZE));
  const safeUploadedPage = Math.min(uploadedPage, uploadedTotalPages);
  const uploadedPageItems = uploadedStatusFiltered.slice((safeUploadedPage - 1) * UPLOADED_PAGE_SIZE, safeUploadedPage * UPLOADED_PAGE_SIZE);

  const handleCreateListingAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdFormError('');
    if (!adTitle.trim() || !adDescription.trim() || !adCtaText.trim()) {
      const message = 'Please fill Ad title, description, and CTA text.';
      setAdFormError(message);
      triggerNotification(message);
      return;
    }
    if (adActionType === 'landing_page' && !adTargetUrl.trim()) {
      const message = 'Please provide a landing page URL.';
      setAdFormError(message);
      triggerNotification(message);
      return;
    }
    if (adActionType === 'landing_listing' && !adTargetBusinessId) {
      const message = 'Please choose a landing listing.';
      setAdFormError(message);
      triggerNotification(message);
      return;
    }

    setAdImageUploading(true);
    try {
      const nextPlacementKey = adPlacementKey.trim() || 'homepage_inline_primary';
      const uploadedImageUrl = adImageFile
        ? await uploadBannerImage(adImageFile, getListingAdFolder())
        : getMediaProxyUrl(adImageUrl.trim());

      if (!uploadedImageUrl) {
        const message = 'Please upload an ad image or provide a banner image URL.';
        setAdFormError(message);
        triggerNotification(message);
        return;
      }

      const payload: Omit<ListingAd, 'id'> = {
        title: adTitle.trim(),
        description: adDescription.trim(),
        badge: adBadge.trim() || 'Sponsored',
        ctaText: adCtaText.trim(),
        backgroundColor: adBgColor || '#1d4ed8',
        imageUrl: uploadedImageUrl || undefined,
        startDate: adStartDate,
        endDate: adEndDate,
        actionType: adActionType,
        targetUrl: adActionType === 'landing_page' ? adTargetUrl.trim() : undefined,
        targetBusinessId: adActionType === 'landing_listing' ? adTargetBusinessId : undefined,
        sellerBusinessId: adSellerBusinessId || undefined,
        localityIds: adLocalityId ? [adLocalityId] : [],
        pincodes: parsePincodeList(adPincodes),
        categoryIds: adCategoryIds,
        tags: buildListingTags(adTags),
        placementKey: nextPlacementKey,
        deviceTarget: adDeviceTarget,
        mobileRowPosition: adDeviceTarget !== 'desktop' && Number(adMobileRowPosition) > 0 ? Number(adMobileRowPosition) : undefined,
        isActive: true
      };

      if (adEditId) {
        onUpdateListingAd?.({ ...payload, id: adEditId });
        triggerNotification('Listing ad updated successfully.');
      } else {
        onCreateListingAd?.(payload);
        triggerNotification('Listing ad created successfully.');
      }
      resetListingAdForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ad image upload failed.';
      setAdFormError(message);
      triggerNotification(message);
    } finally {
      setAdImageUploading(false);
    }
  };

  const handleCreateHeroBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeroFormError('');
    if (!heroTitle.trim() || !heroSubtitle.trim()) {
      const message = 'Please fill hero title and subtitle.';
      setHeroFormError(message);
      triggerNotification(message);
      return;
    }

    setHeroImageUploading(true);
    try {
      const uploadedImageUrl = heroImageFile
        ? await uploadBannerImage(heroImageFile, getHeroBannerFolder())
        : getMediaProxyUrl(heroImageUrl.trim());

      if (!uploadedImageUrl) {
        const message = 'Please upload a hero image or provide a hero image URL.';
        setHeroFormError(message);
        triggerNotification(message);
        return;
      }

      const payload: Omit<HeroBanner, 'id'> = {
        localityId: heroLocalityId,
        title: heroTitle.trim(),
        subtitle: heroSubtitle.trim(),
        imageUrl: uploadedImageUrl,
        startDate: heroStartDate,
        endDate: heroEndDate,
        ctaLabel: heroCtaLabel.trim() || 'Explore Businesses',
        ctaType: heroCtaType,
        ctaTarget: heroCtaTarget.trim() || 'all',
        pincodes: parsePincodeList(heroPincodes),
        heroStats: heroStatsDraft.map((stat) => ({
          enabled: stat.enabled,
          label: stat.label.trim(),
          value: stat.value.trim(),
          localityIds: parseIdList(stat.localityIds),
          pincodes: parsePincodeList(stat.pincodes)
        })),
        isActive: true
      };
      if (heroEditId) {
        onUpdateHeroBanner?.({ ...payload, id: heroEditId });
        triggerNotification('Hero banner updated.');
      } else {
        onCreateHeroBanner?.(payload);
        triggerNotification('Hero banner created.');
      }
      resetHeroBannerForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hero image upload failed.';
      setHeroFormError(message);
      triggerNotification(message);
    } finally {
      setHeroImageUploading(false);
    }
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponBusinessId || !couponTitle.trim() || !couponCode.trim() || !couponDiscount.trim() || !couponDescription.trim()) {
      triggerNotification('Please fill offer business, title, code, discount, and description.');
      return;
    }

    const couponPayload = {
      businessId: couponBusinessId,
      title: couponTitle.trim(),
      code: couponCode.trim(),
      discount: couponDiscount.trim(),
      description: couponDescription.trim(),
      startDate: couponStartDate,
      expiryDate: couponEndDate,
      endDate: couponEndDate,
      isActive: true,
      localityIds: couponLocalityId ? [couponLocalityId] : [],
      pincodes: parsePincodeList(couponPincodes),
      badgeText: couponDiscount.trim(),
      ctaText: 'Claim Offer',
      targetBusinessId: couponBusinessId
    };

    if (couponEditId) {
      onUpdateCoupon?.({
        ...couponPayload,
        id: couponEditId,
        usageCount: coupons.find((coupon) => coupon.id === couponEditId)?.usageCount || 0,
      });
      triggerNotification('Offer updated successfully.');
    } else {
      onAddCoupon?.(couponPayload);
      triggerNotification('Offer created successfully.');
    }

    resetCouponForm();
  };

  const handleCreateHomepageSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homepageLocalityId || !newSectionTitle.trim()) {
      triggerNotification('Choose locality and section title before adding a homepage section.');
      return;
    }

    const insertPosition = Number(newSectionInsertPosition);
    onCreateHomepageSection?.(
      homepageLocalityId,
      buildHomepageSectionDraftPayload(),
      Number.isFinite(insertPosition) && insertPosition > 0 ? insertPosition : 1
    );

    resetHomepageSectionDraftForm();
    triggerNotification('Homepage section added.');
  };

  const handleSaveApiConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiConfiguration?.(apiConfigDraft);
    triggerNotification('API configuration saved.');
  };

  const handlePublishResolvedHomepages = async (publishRequest?: string[] | ResolvedHomepagePublishRequest) => {
    if (!onPublishResolvedHomepages) {
      triggerNotification('Resolved homepage publish callback is not configured.');
      return;
    }

    try {
      const result = await onPublishResolvedHomepages(publishRequest);
      const publishedCount = typeof result === 'object' && result && 'publishedCount' in result
        ? result.publishedCount
        : undefined;
      triggerNotification(
        publishedCount
          ? `Published ${publishedCount} resolved homepage snapshot(s).`
          : 'Resolved homepage publish completed.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish resolved homepages.';
      triggerNotification(message);
    }
  };

  const handlePublishPreviewContext = async () => {
    await handlePublishResolvedHomepages({
      contexts: [{
        localityId: resolvedPreviewDraft.localityId,
        categoryId: resolvedPreviewDraft.categoryId || undefined,
        subcategoryId: resolvedPreviewDraft.subcategoryId || undefined,
        pincode: resolvedPreviewDraft.pincode || undefined,
        placementKey: resolvedPreviewDraft.placementKey || undefined,
        device: resolvedPreviewDraft.device,
        pageType: resolvedPreviewDraft.pageType,
      }]
    });
  };

  const handlePublishScopedContexts = async () => {
    const localityIds = parseIdList(publishScopeDraft.localityIds);
    if (localityIds.length === 0) {
      triggerNotification('Select at least one locality before publishing a scoped snapshot set.');
      return;
    }

    if (publishScopeContexts.length === 0) {
      triggerNotification('No publish contexts were generated from the selected scope.');
      return;
    }

    await handlePublishResolvedHomepages({
      contexts: publishScopeContexts,
    });
  };

  const handleDeleteResolvedHomepageSnapshotSet = async (deleteRequest?: ResolvedHomepageSnapshotDeleteRequest) => {
    if (!onDeleteResolvedHomepageSnapshots) {
      triggerNotification('Resolved homepage snapshot delete callback is not configured.');
      return;
    }

    try {
      const result = await onDeleteResolvedHomepageSnapshots(deleteRequest);
      const deletedCount = typeof result === 'object' && result && 'deletedCount' in result
        ? result.deletedCount
        : undefined;
      triggerNotification(
        deletedCount
          ? `Deleted ${deletedCount} resolved homepage snapshot(s).`
          : 'Resolved homepage snapshot delete completed.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete resolved homepage snapshots.';
      triggerNotification(message);
    }
  };

  const handleDeleteScopedSnapshots = async () => {
    if (publishScopeContexts.length === 0) {
      triggerNotification('No snapshot contexts are generated from the current scope.');
      return;
    }
    if (!confirm(`Delete ${publishScopeContexts.length} published snapshot context(s) from the current scope?`)) {
      return;
    }
    await handleDeleteResolvedHomepageSnapshotSet({
      contexts: publishScopeContexts,
    });
  };

  const handleDeleteSingleSnapshot = async (snapshotId: string) => {
    if (!snapshotId) return;
    if (!confirm('Delete this published snapshot?')) {
      return;
    }
    if (onDeleteScalablePublishedSnapshot) {
      try {
        await onDeleteScalablePublishedSnapshot(snapshotId);
        triggerNotification('Snapshot deleted.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete published snapshot.';
        triggerNotification(message);
      }
      return;
    }
    await handleDeleteResolvedHomepageSnapshotSet({
      snapshotIds: [snapshotId],
    });
  };

  const handleRefreshPublishedSnapshots = async () => {
    if (!onRefreshScalablePublishedSnapshots) {
      triggerNotification('Snapshot refresh callback is not configured.');
      return;
    }

    try {
      await onRefreshScalablePublishedSnapshots();
      triggerNotification('Published snapshots refreshed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh published snapshots.';
      triggerNotification(message);
    }
  };

  const handleReseedScalableHomepageConfig = async (force = false) => {
    if (!onReseedScalableHomepageConfig) {
      triggerNotification('Scalable CMS reseed callback is not configured.');
      return;
    }

    try {
      const result = await onReseedScalableHomepageConfig(force);
      const summary = typeof result === 'object' && result && 'summary' in result ? result.summary : undefined;
      triggerNotification(
        summary
          ? `${force ? 'Force reseeded' : 'Reseeded'} scalable CMS: ${summary.templates || 0} templates, ${summary.campaigns || 0} campaigns.`
          : 'Scalable CMS reseeded from current homepage data.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reseed scalable homepage config.';
      triggerNotification(message);
    }
  };

  const persistScalableTemplateEntity = async (
    nextTemplate: ScalableHomepageTemplate,
    successMessage: string,
    publishLocalityIds?: string[]
  ) => {
    if (!onSaveScalableTemplate) {
      triggerNotification('Scalable template save callback is not configured.');
      return { saved: false, published: false };
    }
    try {
      await onSaveScalableTemplate(nextTemplate);
      try {
        if (publishLocalityIds && publishLocalityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(publishLocalityIds);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Publish failed after template save.';
        triggerNotification(`Template saved, but publish failed: ${message}`);
        return { saved: true, published: false };
      }
      triggerNotification(successMessage);
      return { saved: true, published: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save scalable template.';
      triggerNotification(message);
      return { saved: false, published: false };
    }
  };

  const deleteScalableTemplateEntity = async (
    templateId: string,
    successMessage: string,
    publishLocalityIds?: string[]
  ) => {
    if (!onDeleteScalableTemplate) {
      triggerNotification('Scalable template delete callback is not configured.');
      return;
    }
    try {
      await onDeleteScalableTemplate(templateId);
      if (publishLocalityIds && publishLocalityIds.length > 0 && onPublishResolvedHomepages) {
        await onPublishResolvedHomepages(publishLocalityIds);
      }
      triggerNotification(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete scalable template.';
      triggerNotification(message);
    }
  };

  const persistScalableAssignmentEntity = async (
    nextAssignment: ScalableHomepageAssignment,
    successMessage: string,
    publishLocalityIds?: string[]
  ) => {
    if (!onSaveScalableAssignment) {
      triggerNotification('Scalable assignment save callback is not configured.');
      return;
    }
    try {
      await onSaveScalableAssignment(nextAssignment);
      if (publishLocalityIds && publishLocalityIds.length > 0 && onPublishResolvedHomepages) {
        await onPublishResolvedHomepages(publishLocalityIds);
      }
      triggerNotification(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save scalable assignment.';
      triggerNotification(message);
    }
  };

  const deleteScalableAssignmentEntity = async (
    assignmentId: string,
    successMessage: string,
    publishLocalityIds?: string[]
  ) => {
    if (!onDeleteScalableAssignment) {
      triggerNotification('Scalable assignment delete callback is not configured.');
      return;
    }
    try {
      await onDeleteScalableAssignment(assignmentId);
      if (publishLocalityIds && publishLocalityIds.length > 0 && onPublishResolvedHomepages) {
        await onPublishResolvedHomepages(publishLocalityIds);
      }
      triggerNotification(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete scalable assignment.';
      triggerNotification(message);
    }
  };

  const persistScalableCampaignEntity = async (
    nextCampaign: ScalableCampaign,
    successMessage: string,
    publishLocalityIds?: string[]
  ) => {
    if (!onSaveScalableCampaign) {
      triggerNotification('Scalable campaign save callback is not configured.');
      return;
    }
    try {
      await onSaveScalableCampaign(nextCampaign);
      if (publishLocalityIds && publishLocalityIds.length > 0 && onPublishResolvedHomepages) {
        await onPublishResolvedHomepages(publishLocalityIds);
      }
      triggerNotification(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save scalable campaign.';
      triggerNotification(message);
    }
  };

  const deleteScalableCampaignEntity = async (
    campaignId: string,
    successMessage: string,
    publishLocalityIds?: string[]
  ) => {
    if (!onDeleteScalableCampaign) {
      triggerNotification('Scalable campaign delete callback is not configured.');
      return;
    }
    try {
      await onDeleteScalableCampaign(campaignId);
      if (publishLocalityIds && publishLocalityIds.length > 0 && onPublishResolvedHomepages) {
        await onPublishResolvedHomepages(publishLocalityIds);
      }
      triggerNotification(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete scalable campaign.';
      triggerNotification(message);
    }
  };

  const resetTemplateDraft = () => {
    setTemplateDraft({
      id: '',
      name: '',
      templateScope: 'locality',
      localityIds: homepageLocalityId || localities[0]?.id || 'roadpali',
      status: 'active',
      priority: '100',
      isDefault: false,
      isFallback: false,
    });
  };

  const beginEditTemplate = (template: ScalableHomepageTemplate) => {
    setTemplateDraft({
      id: template.id,
      name: template.name,
      templateScope: template.templateScope,
      localityIds: (template.localityIds || []).join(', '),
      status: template.status,
      priority: String(template.priority),
      isDefault: template.isDefault,
      isFallback: template.isFallback,
    });
  };

  const handleSaveTemplateDraft = async () => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!templateDraft.name.trim()) {
      triggerNotification('Template name is required.');
      return;
    }
    if (
      templateDraft.isDefault &&
      templateDraft.status === 'active' &&
      activeDefaultTemplate &&
      activeDefaultTemplate.id !== templateDraft.id
    ) {
      triggerNotification(`Only one active default template is allowed. "${activeDefaultTemplate.name}" is already active as default.`);
      return;
    }

    const nextTemplate: ScalableHomepageTemplate = {
      id: templateDraft.id || createAdminId('tpl'),
      name: templateDraft.name.trim(),
      templateScope: templateDraft.templateScope,
      localityIds: parseIdList(templateDraft.localityIds),
      status: templateDraft.status,
      priority: Number(templateDraft.priority) || 100,
      isDefault: templateDraft.isDefault,
      isFallback: templateDraft.isFallback,
      sections: scalableHomepageConfig.templates.find((template) => template.id === templateDraft.id)?.sections || [],
      metadata: {
        ...(scalableHomepageConfig.templates.find((template) => template.id === templateDraft.id)?.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
      updatedAt: new Date().toISOString(),
    };

    const result = await persistScalableTemplateEntity(
      nextTemplate,
      templateDraft.id ? 'Template updated and published.' : 'Template created and published.',
      nextTemplate.localityIds.length > 0 ? nextTemplate.localityIds : [homepageLocalityId]
    );
    if (result?.saved) {
      resetTemplateDraft();
    }
  };

  const handleSyncTemplateSectionsFromLocality = async () => {
    if (!scalableHomepageConfig || !templateDraft.id) {
      triggerNotification('Select an existing template before syncing sections.');
      return;
    }
    const targetTemplate = scalableHomepageConfig.templates.find((template) => template.id === templateDraft.id);
    if (!targetTemplate) {
      triggerNotification('Template not found.');
      return;
    }
    if (onSyncScalableTemplateSectionsFromLocality) {
      try {
        await onSyncScalableTemplateSectionsFromLocality(targetTemplate.id, homepageLocalityId);
        if (onPublishResolvedHomepages) {
          await onPublishResolvedHomepages([homepageLocalityId]);
        }
        triggerNotification(`Template sections synced and published from ${homepageLocalityId}.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync template sections from locality.';
        triggerNotification(message);
      }
      return;
    }
    const sourceLayout = homepageLayouts.find((layout) => layout.localityId === homepageLocalityId);
    if (!sourceLayout) {
      triggerNotification('No homepage layout found for the selected locality.');
      return;
    }

    await persistScalableTemplateEntity({
      ...targetTemplate,
      sections: sourceLayout.sections,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(targetTemplate.metadata || {}),
        lastSectionSyncLocalityId: homepageLocalityId,
        detachedFromLegacySync: false,
      },
    }, `Template sections synced and published from ${homepageLocalityId}.`, [homepageLocalityId]);
  };

  const buildHomepageSectionDraftPayload = (): Omit<HomepageSection, 'id' | 'sortOrder'> => ({
    sectionType: newSectionType,
    title: newSectionTitle.trim(),
    subtitle: newSectionSubtitle.trim() || undefined,
    status: 'active',
    visible: true,
    startDate: newSectionStartDate || undefined,
    endDate: newSectionEndDate || undefined,
    localityIds: newSectionLocalityIds.length > 0 ? newSectionLocalityIds : [homepageLocalityId],
    pincodes: parsePincodeList(newSectionPincodes),
    categoryId: ['business_shelf', 'text_business_strip'].includes(newSectionType) ? newSectionCategoryId : undefined,
    categoryIds: ['category_grid', 'emergency_grid'].includes(newSectionType) ? newSectionCategoryIds : undefined,
    subcategoryId: ['business_shelf', 'text_business_strip'].includes(newSectionType) ? (newSectionSubcategoryId || undefined) : undefined,
    placementKey: newSectionType === 'promo_banner' ? newSectionPlacementKey.trim() || 'homepage_inline_primary' : undefined,
    maxItems: Number(newSectionMaxItems) > 0 ? Number(newSectionMaxItems) : undefined,
    visibleSlots: Number(newSectionVisibleSlots) > 0 ? Number(newSectionVisibleSlots) : undefined,
    desktopCardCount: Number(newSectionDesktopCardCount) > 0 ? Number(newSectionDesktopCardCount) : undefined,
    mobileCardCount: Number(newSectionMobileCardCount) > 0 ? Number(newSectionMobileCardCount) : undefined,
    mobileDisplayMode: ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) ? newSectionMobileDisplayMode : undefined,
    ctaLabel: newSectionCtaLabel.trim() || undefined,
    ctaType: newSectionCtaType || 'none',
    ctaTarget: newSectionCtaTarget.trim() || undefined,
    backgroundColor: newSectionBackgroundColor || undefined,
    showViewAll: newSectionShowViewAll,
    listingSourceMode: ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) ? (newSectionListingSourceMode || 'auto') : undefined,
    pinnedBusinessIds: newSectionListingSourceMode === 'manual' ? newSectionPinnedBusinessIds : undefined,
    autoRotate: newSectionAutoRotate,
    rotationIntervalSec: Number(newSectionRotationIntervalSec) > 0 ? Number(newSectionRotationIntervalSec) : 3
  });

  const resetHomepageSectionDraftForm = () => {
    setNewSectionSubtitle('');
    setNewSectionLocalityIds([homepageLocalityId]);
    setNewSectionPincodes('');
    setNewSectionInsertPosition('1');
    setNewSectionCtaLabel('');
    setNewSectionCtaType('none');
    setNewSectionCtaTarget('');
    setNewSectionBackgroundColor('#ffffff');
    setNewSectionEndDate('');
    setNewSectionMaxItems('6');
    setNewSectionVisibleSlots('4');
    setNewSectionDesktopCardCount('4');
    setNewSectionMobileCardCount('2');
    setNewSectionMobileDisplayMode('carousel');
    setNewSectionCategoryIds([]);
    setNewSectionListingSourceMode('auto');
    setNewSectionPinnedBusinessIds([]);
    setNewSectionAutoRotate(true);
    setNewSectionRotationIntervalSec('3');
  };

  const toggleSectionCardExpanded = (sectionId: string) => {
    setExpandedSectionCardIds((prev) => (
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    ));
  };

  const handleCreateScalableTemplateSection = async () => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      triggerNotification('Select a scalable template before adding sections to it.');
      return;
    }
    if (!newSectionTitle.trim()) {
      triggerNotification('Section title is required before adding to a template.');
      return;
    }

    const nextSection: HomepageSection = {
      ...buildHomepageSectionDraftPayload(),
      id: `tpl_section_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      sortOrder: (selectedScalableTemplate.sections.length + 1) * 10,
    };
    if (onCreateScalableTemplateSection) {
      try {
        await onCreateScalableTemplateSection(selectedScalableTemplate.id, nextSection);
        if (selectedScalableTemplate.localityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(selectedScalableTemplate.localityIds);
        }
        triggerNotification('Template section created and published.');
        resetHomepageSectionDraftForm();
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create scalable template section.';
        triggerNotification(message);
        return;
      }
    }
    await persistScalableTemplateEntity({
      ...selectedScalableTemplate,
      sections: [...selectedScalableTemplate.sections, nextSection],
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(selectedScalableTemplate.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
    }, 'Template section created and published.', selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [homepageLocalityId]);
    resetHomepageSectionDraftForm();
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    const template = scalableHomepageConfig.templates.find((entry) => entry.id === templateId);
    await deleteScalableTemplateEntity(templateId, 'Template deleted and published.', template?.localityIds.length ? template.localityIds : [homepageLocalityId]);
    if (templateDraft.id === templateId) resetTemplateDraft();
  };

  const handleDetachTemplateFromLegacySync = async (template: ScalableHomepageTemplate) => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!isLegacyManagedScalableEntity(template.metadata)) {
      triggerNotification('This template is already detached or scalable-owned.');
      return;
    }
    const detachedAt = new Date().toISOString();
    await persistScalableTemplateEntity({
      ...template,
      metadata: {
        ...(template.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
        detachedAt,
        detachedReason: 'manual_admin_detach',
      },
      updatedAt: detachedAt,
    }, `Template "${template.name}" detached from legacy sync.`, template.localityIds.length > 0 ? template.localityIds : [homepageLocalityId]);
  };

  const updateScalableTemplateSection = async (section: HomepageSection, patch: Partial<HomepageSection>) => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      triggerNotification('Select a scalable template before editing sections.');
      return;
    }
    const nextSection = { ...section, ...patch };
    if (onUpdateScalableTemplateSection) {
      try {
        await onUpdateScalableTemplateSection(selectedScalableTemplate.id, section.id, nextSection);
        if (selectedScalableTemplate.localityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(selectedScalableTemplate.localityIds);
        }
        triggerNotification('Template section updated and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update scalable template section.';
        triggerNotification(message);
        return;
      }
    }
    await persistScalableTemplateEntity({
      ...selectedScalableTemplate,
      sections: selectedScalableTemplate.sections.map((entry) => entry.id === section.id ? nextSection : entry),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(selectedScalableTemplate.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
    }, 'Template section updated and published.', selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [homepageLocalityId]);
  };

  const handleMoveScalableTemplateSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      triggerNotification('Select a scalable template before reordering sections.');
      return;
    }
    const orderedSections = [...selectedScalableTemplate.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = orderedSections.findIndex((section) => section.id === sectionId);
    if (currentIndex < 0) return;
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= orderedSections.length) return;
    [orderedSections[currentIndex], orderedSections[nextIndex]] = [orderedSections[nextIndex], orderedSections[currentIndex]];
    const normalizedSections = orderedSections.map((section, index) => ({ ...section, sortOrder: (index + 1) * 10 }));
    if (onReorderScalableTemplateSections) {
      try {
        await onReorderScalableTemplateSections(selectedScalableTemplate.id, normalizedSections);
        if (selectedScalableTemplate.localityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(selectedScalableTemplate.localityIds);
        }
        triggerNotification('Template section reordered and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reorder scalable template sections.';
        triggerNotification(message);
        return;
      }
    }
    await persistScalableTemplateEntity({
      ...selectedScalableTemplate,
      sections: normalizedSections,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(selectedScalableTemplate.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
    }, 'Template section reordered and published.', selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [homepageLocalityId]);
  };

  const handleDuplicateScalableTemplateSection = async (sectionId: string) => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      triggerNotification('Select a scalable template before duplicating sections.');
      return;
    }
    const sourceSection = selectedScalableTemplate.sections.find((section) => section.id === sectionId);
    if (!sourceSection) return;
    if (onDuplicateScalableTemplateSection) {
      try {
        await onDuplicateScalableTemplateSection(selectedScalableTemplate.id, sectionId);
        if (selectedScalableTemplate.localityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(selectedScalableTemplate.localityIds);
        }
        triggerNotification('Template section duplicated and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to duplicate scalable template section.';
        triggerNotification(message);
        return;
      }
    }
    const nextSection: HomepageSection = {
      ...sourceSection,
      id: `tpl_section_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: `${sourceSection.title} Copy`,
      sortOrder: (selectedScalableTemplate.sections.length + 1) * 10,
    };
    await persistScalableTemplateEntity({
      ...selectedScalableTemplate,
      sections: [...selectedScalableTemplate.sections, nextSection],
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(selectedScalableTemplate.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
    }, 'Template section duplicated and published.', selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [homepageLocalityId]);
  };

  const handleDeleteScalableTemplateSection = async (sectionId: string) => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      triggerNotification('Select a scalable template before deleting sections.');
      return;
    }
    if (onDeleteScalableTemplateSection) {
      try {
        await onDeleteScalableTemplateSection(selectedScalableTemplate.id, sectionId);
        if (selectedScalableTemplate.localityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(selectedScalableTemplate.localityIds);
        }
        triggerNotification('Template section deleted and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete scalable template section.';
        triggerNotification(message);
        return;
      }
    }
    await persistScalableTemplateEntity({
      ...selectedScalableTemplate,
      sections: selectedScalableTemplate.sections.filter((section) => section.id !== sectionId),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(selectedScalableTemplate.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
    }, 'Template section deleted and published.', selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [homepageLocalityId]);
  };

  const resetAssignmentDraft = () => {
    setAssignmentDraft({
      id: '',
      localityId: homepageLocalityId || localities[0]?.id || 'roadpali',
      templateId: scalableHomepageConfig?.templates[0]?.id || '',
      categoryId: '',
      subcategoryId: '',
      pincode: '',
      status: 'active',
      priority: '100',
      isFallback: false,
    });
  };

  const beginEditAssignment = (assignment: ScalableHomepageAssignment) => {
    setAssignmentDraft({
      id: assignment.id,
      localityId: assignment.localityId,
      templateId: assignment.templateId,
      categoryId: assignment.categoryId || '',
      subcategoryId: assignment.subcategoryId || '',
      pincode: assignment.pincode || '',
      status: assignment.status,
      priority: String(assignment.priority),
      isFallback: assignment.isFallback,
    });
  };

  const handleSaveAssignmentDraft = async () => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!assignmentDraft.localityId || !assignmentDraft.templateId) {
      triggerNotification('Assignment needs a locality and template.');
      return;
    }

    const nextAssignment: ScalableHomepageAssignment = {
      id: assignmentDraft.id || createAdminId('assign'),
      localityId: assignmentDraft.localityId,
      templateId: assignmentDraft.templateId,
      categoryId: assignmentDraft.categoryId || undefined,
      subcategoryId: assignmentDraft.subcategoryId || undefined,
      pincode: assignmentDraft.pincode || undefined,
      status: assignmentDraft.status,
      priority: Number(assignmentDraft.priority) || 100,
      isFallback: assignmentDraft.isFallback,
      metadata: {
        ...(scalableHomepageConfig.assignments.find((assignment) => assignment.id === assignmentDraft.id)?.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
      updatedAt: new Date().toISOString(),
    };

    await persistScalableAssignmentEntity(
      nextAssignment,
      assignmentDraft.id ? 'Assignment updated and published.' : 'Assignment created and published.',
      [nextAssignment.localityId]
    );
    resetAssignmentDraft();
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    const assignment = scalableHomepageConfig.assignments.find((entry) => entry.id === assignmentId);
    await deleteScalableAssignmentEntity(assignmentId, 'Assignment deleted and published.', [assignment?.localityId || homepageLocalityId]);
    if (assignmentDraft.id === assignmentId) resetAssignmentDraft();
  };

  const handleDetachAssignmentFromLegacySync = async (assignment: ScalableHomepageAssignment) => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!isLegacyManagedScalableEntity(assignment.metadata)) {
      triggerNotification('This assignment is already detached or scalable-owned.');
      return;
    }
    const detachedAt = new Date().toISOString();
    await persistScalableAssignmentEntity({
      ...assignment,
      metadata: {
        ...(assignment.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
        detachedAt,
        detachedReason: 'manual_admin_detach',
      },
      updatedAt: detachedAt,
    }, `Assignment for ${formatLocalityLabel(assignment.localityId)} detached from legacy sync.`, [assignment.localityId]);
  };

  const resetCampaignDraft = () => {
    setCampaignDraft({
      id: '',
      name: '',
      campaignType: 'hero_banner',
      status: 'active',
      priority: '100',
      startDate: '',
      endDate: '',
      deviceTarget: 'all',
      placementKeys: '',
      localityIds: homepageLocalityId || localities[0]?.id || 'roadpali',
      categoryIds: '',
      subcategoryIds: '',
      pincodes: '',
      payloadTitle: '',
      payloadSubtitle: '',
      payloadDescription: '',
      payloadImageUrl: '',
      payloadBadge: '',
      payloadCtaLabel: '',
      payloadCtaText: '',
      payloadTargetUrl: '',
      payloadTargetBusinessId: '',
      payloadBusinessIds: '',
      payloadCode: '',
      payloadDiscount: '',
      payloadAuthorName: '',
      payloadContent: '',
      payloadBackgroundColor: '#1d4ed8',
      payloadActionType: 'landing_page',
      payloadText: '{}',
      isFallback: false,
    });
  };

  const beginEditCampaign = (campaign: ScalableCampaign) => {
    const payload = (campaign.payload || {}) as Record<string, unknown>;
    setCampaignDraft({
      id: campaign.id,
      name: campaign.name,
      campaignType: campaign.campaignType,
      status: campaign.status,
      priority: String(campaign.priority),
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      deviceTarget: campaign.deviceTarget || 'all',
      placementKeys: (campaign.placementKeys || []).join(', '),
      localityIds: (campaign.targets.localityIds || []).join(', '),
      categoryIds: (campaign.targets.categoryIds || []).join(', '),
      subcategoryIds: (campaign.targets.subcategoryIds || []).join(', '),
      pincodes: (campaign.targets.pincodes || []).join(', '),
      payloadTitle: String(payload.title || ''),
      payloadSubtitle: String(payload.subtitle || ''),
      payloadDescription: String(payload.description || ''),
      payloadImageUrl: String(payload.imageUrl || payload.image || ''),
      payloadBadge: String(payload.badge || payload.badgeText || ''),
      payloadCtaLabel: String(payload.ctaLabel || ''),
      payloadCtaText: String(payload.ctaText || ''),
      payloadTargetUrl: String(payload.targetUrl || payload.ctaTarget || ''),
      payloadTargetBusinessId: String(payload.targetBusinessId || ''),
      payloadBusinessIds: Array.isArray(payload.businessIds) ? payload.businessIds.join(', ') : '',
      payloadCode: String(payload.code || ''),
      payloadDiscount: String(payload.discount || ''),
      payloadAuthorName: String(payload.authorName || ''),
      payloadContent: String(payload.content || ''),
      payloadBackgroundColor: String(payload.backgroundColor || '#1d4ed8'),
      payloadActionType: ['landing_page', 'landing_listing', 'lead_form', 'search_category'].includes(String(payload.actionType || payload.ctaType || ''))
        ? String(payload.actionType || payload.ctaType) as 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category'
        : 'landing_page',
      payloadText: JSON.stringify(campaign.payload || {}, null, 2),
      isFallback: campaign.isFallback,
    });
  };

  const handleSaveCampaignDraft = async () => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!campaignDraft.name.trim()) {
      triggerNotification('Campaign name is required.');
      return;
    }

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(campaignDraft.payloadText || '{}');
    } catch {
      triggerNotification('Campaign payload must be valid JSON.');
      return;
    }

    const localityIds = parseIdList(campaignDraft.localityIds);
    const categoryIds = parseIdList(campaignDraft.categoryIds);
    const subcategoryIds = parseIdList(campaignDraft.subcategoryIds);
    const pincodes = parsePincodeList(campaignDraft.pincodes);
    const placementKeys = parseIdList(campaignDraft.placementKeys);
    const businessIds = parseIdList(campaignDraft.payloadBusinessIds);

    const guidedPayload = (() => {
      if (campaignDraft.campaignType === 'hero_banner') {
        return pruneEmptyPayload({
          id: campaignDraft.id || undefined,
          localityId: localityIds[0] || '',
          title: campaignDraft.payloadTitle || campaignDraft.name,
          subtitle: campaignDraft.payloadSubtitle,
          imageUrl: campaignDraft.payloadImageUrl,
          startDate: campaignDraft.startDate || undefined,
          endDate: campaignDraft.endDate || undefined,
          ctaLabel: campaignDraft.payloadCtaLabel || 'Explore Businesses',
          ctaType: campaignDraft.payloadActionType,
          ctaTarget: campaignDraft.payloadTargetUrl || 'all',
          pincodes,
          isActive: campaignDraft.status === 'active',
        });
      }
      if (campaignDraft.campaignType === 'listing_ad') {
        return pruneEmptyPayload({
          id: campaignDraft.id || undefined,
          title: campaignDraft.payloadTitle || campaignDraft.name,
          description: campaignDraft.payloadDescription,
          badge: campaignDraft.payloadBadge || 'Sponsored',
          ctaText: campaignDraft.payloadCtaText || 'Know More',
          backgroundColor: campaignDraft.payloadBackgroundColor || '#1d4ed8',
          imageUrl: campaignDraft.payloadImageUrl || undefined,
          startDate: campaignDraft.startDate || undefined,
          endDate: campaignDraft.endDate || undefined,
          actionType: campaignDraft.payloadActionType === 'search_category' ? 'landing_page' : campaignDraft.payloadActionType,
          targetUrl: campaignDraft.payloadActionType === 'landing_page' ? campaignDraft.payloadTargetUrl || undefined : undefined,
          targetBusinessId: campaignDraft.payloadActionType === 'landing_listing' ? campaignDraft.payloadTargetBusinessId || undefined : undefined,
          localityIds,
          pincodes,
          categoryIds,
          placementKey: placementKeys[0] || undefined,
          deviceTarget: campaignDraft.deviceTarget,
          isActive: campaignDraft.status === 'active',
        });
      }
      if (campaignDraft.campaignType === 'offer') {
        return pruneEmptyPayload({
          id: campaignDraft.id || undefined,
          businessId: campaignDraft.payloadTargetBusinessId || '',
          title: campaignDraft.payloadTitle || campaignDraft.name,
          code: campaignDraft.payloadCode,
          discount: campaignDraft.payloadDiscount,
          description: campaignDraft.payloadDescription,
          startDate: campaignDraft.startDate || undefined,
          expiryDate: campaignDraft.endDate || undefined,
          endDate: campaignDraft.endDate || undefined,
          usageCount: 0,
          isActive: campaignDraft.status === 'active',
          localityIds,
          pincodes,
          categoryIds,
          badgeText: campaignDraft.payloadDiscount || undefined,
          ctaText: campaignDraft.payloadCtaText || 'Claim Offer',
          targetBusinessId: campaignDraft.payloadTargetBusinessId || undefined,
        });
      }
      if (campaignDraft.campaignType === 'sponsored_listing') {
        return pruneEmptyPayload({
          businessIds,
          sellerBusinessId: businessIds[0] || undefined,
          title: campaignDraft.payloadTitle || campaignDraft.name,
          description: campaignDraft.payloadDescription,
        });
      }
      return pruneEmptyPayload({
        id: campaignDraft.id || undefined,
        localityId: localityIds[0] || '',
        title: campaignDraft.payloadTitle || campaignDraft.name,
        content: campaignDraft.payloadContent || campaignDraft.payloadDescription,
        authorName: campaignDraft.payloadAuthorName || 'Localisy Team',
        type: 'post',
        createdAt: new Date().toISOString(),
        likes: 0,
        image: campaignDraft.payloadImageUrl || undefined,
        status: campaignDraft.status === 'draft' ? 'draft' : campaignDraft.status === 'archived' ? 'archived' : 'published',
        publishAt: campaignDraft.startDate ? new Date(campaignDraft.startDate).toISOString() : new Date().toISOString(),
        expireAt: campaignDraft.endDate ? new Date(campaignDraft.endDate).toISOString() : undefined,
      });
    })();

    const nextPayload = pruneEmptyPayload({
      ...parsedPayload,
      ...guidedPayload,
    });

    const nextCampaign: ScalableCampaign = {
      id: campaignDraft.id || createAdminId('campaign'),
      name: campaignDraft.name.trim(),
      campaignType: campaignDraft.campaignType,
      status: campaignDraft.status,
      priority: Number(campaignDraft.priority) || 100,
      isFallback: campaignDraft.isFallback,
      startDate: campaignDraft.startDate || undefined,
      endDate: campaignDraft.endDate || undefined,
      deviceTarget: campaignDraft.deviceTarget,
      placementKeys,
      targets: {
        localityIds,
        categoryIds,
        subcategoryIds,
        pincodes,
        devices: [campaignDraft.deviceTarget],
        pageTypes: ['homepage', 'listing_results'],
        placementKeys,
      },
      payload: nextPayload,
      metadata: {
        ...(scalableHomepageConfig.campaigns.find((campaign) => campaign.id === campaignDraft.id)?.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
      updatedAt: new Date().toISOString(),
    };

    await persistScalableCampaignEntity(
      nextCampaign,
      campaignDraft.id ? 'Campaign updated and published.' : 'Campaign created and published.',
      localityIds.length > 0 ? localityIds : [homepageLocalityId]
    );
    resetCampaignDraft();
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    const campaign = scalableHomepageConfig.campaigns.find((entry) => entry.id === campaignId);
    await deleteScalableCampaignEntity(
      campaignId,
      'Campaign deleted and published.',
      campaign?.targets.localityIds && campaign.targets.localityIds.length > 0 ? campaign.targets.localityIds : [homepageLocalityId]
    );
    if (campaignDraft.id === campaignId) resetCampaignDraft();
  };

  const handleDetachCampaignFromLegacySync = async (campaign: ScalableCampaign) => {
    if (!scalableHomepageConfig) {
      triggerNotification('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!isLegacyManagedScalableEntity(campaign.metadata)) {
      triggerNotification('This campaign is already detached or scalable-owned.');
      return;
    }
    const detachedAt = new Date().toISOString();
    await persistScalableCampaignEntity({
      ...campaign,
      metadata: {
        ...(campaign.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
        detachedAt,
        detachedReason: 'manual_admin_detach',
      },
      updatedAt: detachedAt,
    }, `Campaign "${campaign.name}" detached from legacy sync.`, campaign.targets.localityIds && campaign.targets.localityIds.length > 0 ? campaign.targets.localityIds : [homepageLocalityId]);
  };

  const handleLoadResolvedPreview = async () => {
    if (!apiConfigDraft.resolvedHomepageEndpoint) {
      triggerNotification('Resolved homepage endpoint is not configured.');
      return;
    }
    if (!resolvedPreviewDraft.localityId) {
      triggerNotification('Select a locality for preview.');
      return;
    }

    setResolvedPreviewLoading(true);
    try {
      const params = new URLSearchParams({
        localityId: resolvedPreviewDraft.localityId,
        device: resolvedPreviewDraft.device,
        pageType: resolvedPreviewDraft.pageType,
        date: resolvedPreviewDraft.date || new Date().toISOString().slice(0, 10),
        usePublished: resolvedPreviewDraft.usePublished ? 'true' : 'false',
      });
      if (resolvedPreviewDraft.categoryId) params.set('categoryId', resolvedPreviewDraft.categoryId);
      if (resolvedPreviewDraft.subcategoryId) params.set('subcategoryId', resolvedPreviewDraft.subcategoryId);
      if (resolvedPreviewDraft.pincode) params.set('pincode', resolvedPreviewDraft.pincode);
      if (resolvedPreviewDraft.placementKey.trim()) params.set('placementKey', resolvedPreviewDraft.placementKey.trim());

      const response = await fetch(`${apiConfigDraft.resolvedHomepageEndpoint}?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.payload) {
        throw new Error(payload?.error || 'Failed to load resolved homepage preview.');
      }

      setResolvedPreviewResult({
        source: payload.source || 'live_resolver',
        payload: payload.payload,
        resolution: payload.resolution,
      });
      triggerNotification(`Loaded ${payload.source || 'resolved'} homepage preview.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load resolved homepage preview.';
      triggerNotification(message);
    } finally {
      setResolvedPreviewLoading(false);
    }
  };

  const handleCreateCommunityItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommunityFormError('');
    if (!communityDraft.title?.trim() || !communityDraft.content?.trim() || !adminLocalityFilter || adminLocalityFilter === 'all') {
      const message = 'Choose a locality and add title/content for the update.';
      setCommunityFormError(message);
      triggerNotification(message);
      return;
    }
    setCommunityImageUploading(true);
    try {
      const type = communityDraft.type || 'post';
      const uploadedImageUrl = communityImageFile
        ? await uploadBannerImage(communityImageFile, getCommunityItemFolder(adminLocalityFilter, type))
        : getMediaProxyUrl(communityImageUrl.trim());
      const nextStatus = communityDraft.status || 'published';
      onAddCommunityItem?.({
        type,
        title: communityDraft.title.trim(),
        content: communityDraft.content.trim(),
        authorName: communityDraft.authorName?.trim() || 'Localisy Team',
        localityId: adminLocalityFilter,
        status: nextStatus,
        publishAt: communityDraft.publishAt || new Date().toISOString(),
        expireAt: communityDraft.expireAt || undefined,
        businessId: communityDraft.businessId || undefined,
        image: uploadedImageUrl || undefined
      });
      setCommunityDraft({
        type: 'post',
        title: '',
        content: '',
        authorName: 'Localisy Team',
        status: 'published',
        publishAt: new Date().toISOString(),
        expireAt: '',
        image: ''
      });
      setCommunityImageUrl('');
      setCommunityImageFile(null);
      setCommunityFormError('');
      triggerNotification('Locality update created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Community image upload failed.';
      setCommunityFormError(message);
      triggerNotification(message);
    } finally {
      setCommunityImageUploading(false);
    }
  };

  const beginEditCommunityItem = (item: CommunityItem) => {
    setCommunityEditId(item.id);
    setCommunityEditDraft({
      ...item,
      status: item.status || 'published',
      publishAt: item.publishAt || item.createdAt,
      expireAt: item.expireAt || ''
    });
    setCommunityEditImageUrl(item.image || '');
    setCommunityEditImageFile(null);
    setCommunityEditError('');
  };

  const cancelEditCommunityItem = () => {
    setCommunityEditId(null);
    setCommunityEditDraft(null);
    setCommunityEditImageUrl('');
    setCommunityEditImageFile(null);
    setCommunityEditImageUploading(false);
    setCommunityEditError('');
  };

  const saveEditCommunityItem = async () => {
    if (!communityEditDraft) return;
    if (!communityEditDraft.title?.trim() || !communityEditDraft.content?.trim()) {
      const message = 'Title and content are required.';
      setCommunityEditError(message);
      triggerNotification(message);
      return;
    }
    setCommunityEditImageUploading(true);
    setCommunityEditError('');
    try {
      const uploadedImageUrl = communityEditImageFile
        ? await uploadBannerImage(communityEditImageFile, getCommunityItemFolder(communityEditDraft.localityId, communityEditDraft.type))
        : getMediaProxyUrl(communityEditImageUrl.trim());
      onUpdateCommunityItem?.({
        ...communityEditDraft,
        title: communityEditDraft.title.trim(),
        content: communityEditDraft.content.trim(),
        authorName: communityEditDraft.authorName?.trim() || 'Localisy Team',
        status: communityEditDraft.status || 'published',
        publishAt: communityEditDraft.publishAt || new Date().toISOString(),
        expireAt: communityEditDraft.expireAt || undefined,
        image: uploadedImageUrl || getMediaProxyUrl(communityEditDraft.image?.trim() || '') || undefined
      });
      triggerNotification('Locality update saved.');
      cancelEditCommunityItem();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Community image upload failed.';
      setCommunityEditError(message);
      triggerNotification(message);
    } finally {
      setCommunityEditImageUploading(false);
    }
  };

  const updateHomepageSection = (section: HomepageSection, patch: Partial<HomepageSection>) => {
    onUpdateHomepageSection?.(homepageLocalityId, {
      ...section,
      ...patch
    });
  };

  const renderEditableHomepageSectionCard = (
    section: HomepageSection,
    index: number,
    handlers: {
      onMoveUp: () => void;
      onMoveDown: () => void;
      onDuplicate: () => void;
      onDelete: () => void;
      onUpdate: (patch: Partial<HomepageSection>) => void | Promise<void>;
    }
  ) => {
    const isExpanded = expandedSectionCardIds.includes(section.id);
    const targetingSummary = section.localityIds?.length
      ? `${section.localityIds.length} localit${section.localityIds.length === 1 ? 'y' : 'ies'}`
      : 'all localities';

    return (
      <div key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSectionCardExpanded(section.id)}
              className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"
              title={isExpanded ? 'Collapse section' : 'Expand section'}
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-500">#{index + 1}</span>
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {homepageSectionLabels[section.sectionType]}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${section.visible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                  {section.visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-slate-900">{section.title}</div>
              <div className="truncate text-[10px] text-slate-500">
                {targetingSummary} • {section.pincodes?.length ? `${section.pincodes.length} pincodes` : 'all pincodes'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={handlers.onMoveUp} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><ChevronUp className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={handlers.onMoveDown} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={handlers.onDuplicate} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600"><Copy className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={handlers.onDelete} className="rounded border border-rose-200 bg-rose-50 p-1.5 text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {isExpanded && (
          <>
            <input
              value={section.title}
              onChange={(e) => { void handlers.onUpdate({ title: e.target.value }); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
            />
            <textarea
              value={section.subtitle || ''}
              onChange={(e) => { void handlers.onUpdate({ subtitle: e.target.value }); }}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={section.status}
                onChange={(e) => { void handlers.onUpdate({ status: e.target.value as HomepageSection['status'] }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={section.visible ? 'visible' : 'hidden'}
                onChange={(e) => { void handlers.onUpdate({ visible: e.target.value === 'visible' }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
              <input
                type="date"
                value={section.startDate || ''}
                onChange={(e) => { void handlers.onUpdate({ startDate: e.target.value || undefined }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <input
                type="date"
                value={section.endDate || ''}
                onChange={(e) => { void handlers.onUpdate({ endDate: e.target.value || undefined }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <input
                value={String(section.maxItems || '')}
                onChange={(e) => { void handlers.onUpdate({ maxItems: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
                placeholder="Max items"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <input
                value={String(section.visibleSlots || '')}
                onChange={(e) => { void handlers.onUpdate({ visibleSlots: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
                placeholder="Visible slots"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <input
                value={String(section.desktopCardCount || '')}
                onChange={(e) => { void handlers.onUpdate({ desktopCardCount: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
                placeholder="Desktop cards"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <input
                value={String(section.mobileCardCount || '')}
                onChange={(e) => { void handlers.onUpdate({ mobileCardCount: Number(e.target.value.replace(/\D/g, '')) || undefined }); }}
                placeholder="Mobile cards"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <input
                value={section.pincodes?.join(', ') || ''}
                onChange={(e) => { void handlers.onUpdate({ pincodes: parsePincodeList(e.target.value) }); }}
                placeholder="Pincodes"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
              />
              <input
                value={String(section.rotationIntervalSec || 3)}
                onChange={(e) => { void handlers.onUpdate({ rotationIntervalSec: Number(e.target.value.replace(/\D/g, '')) || 3 }); }}
                placeholder="Rotate seconds"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </div>
            {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(section.sectionType) && (
              <select
                value={section.mobileDisplayMode || 'carousel'}
                onChange={(e) => { void handlers.onUpdate({ mobileDisplayMode: e.target.value as NonNullable<HomepageSection['mobileDisplayMode']> }); }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="carousel">Mobile Carousel</option>
                <option value="stack">Mobile Stack</option>
              </select>
            )}
            {['business_shelf', 'text_business_strip'].includes(section.sectionType) && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={section.categoryId || ''}
                  onChange={(e) => { void handlers.onUpdate({ categoryId: e.target.value, subcategoryId: '' }); }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  {BUSINESS_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <select
                  value={section.subcategoryId || ''}
                  onChange={(e) => { void handlers.onUpdate({ subcategoryId: e.target.value || undefined }); }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <option value="">All subcategories</option>
                  {getSubcategoriesForCategory(section.categoryId || BUSINESS_CATEGORIES[0]?.id || '').map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
              </div>
            )}
            {['category_grid', 'emergency_grid'].includes(section.sectionType) && (
              <OrderedCategoryPicker
                label="Configured categories"
                selectedIds={section.categoryIds || []}
                onChange={(nextIds) => { void handlers.onUpdate({ categoryIds: nextIds }); }}
                helperText="Reorder the selected categories here to control the exact row order on the homepage."
              />
            )}
            {section.sectionType === 'promo_banner' && (
              <input
                value={section.placementKey || ''}
                onChange={(e) => { void handlers.onUpdate({ placementKey: e.target.value }); }}
                placeholder="Placement key"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <OrderedSelectionPicker
                  label="Target localities"
                  selectedIds={section.localityIds || []}
                  options={localities.map((locality) => ({
                    id: locality.id,
                    label: locality.name,
                    meta: locality.slug || locality.id
                  }))}
                  onChange={(nextIds) => { void handlers.onUpdate({ localityIds: nextIds }); }}
                  helperText="Select a locality and click Add. Remove all selected localities to make this section unrestricted."
                  emptyText="No locality targeting selected. This section can show for any locality context that loads this layout."
                />
              </div>
              {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(section.sectionType) && (
                <select
                  value={section.listingSourceMode || 'auto'}
                  onChange={(e) => { void handlers.onUpdate({ listingSourceMode: e.target.value as HomepageSection['listingSourceMode'] }); }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <option value="auto">Auto listings</option>
                  <option value="manual">Manual pinned listings</option>
                </select>
              )}
              <select
                value={section.ctaType || 'none'}
                onChange={(e) => { void handlers.onUpdate({ ctaType: e.target.value as HomepageSection['ctaType'] }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="none">No CTA</option>
                <option value="landing_page">Landing Page</option>
                <option value="landing_listing">Landing Listing</option>
                <option value="lead_form">Lead Form</option>
                <option value="search_category">Search Category</option>
              </select>
              <input
                value={section.ctaLabel || ''}
                onChange={(e) => { void handlers.onUpdate({ ctaLabel: e.target.value }); }}
                placeholder="CTA label"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <input
                value={section.ctaTarget || ''}
                onChange={(e) => { void handlers.onUpdate({ ctaTarget: e.target.value }); }}
                placeholder="CTA target"
                className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </div>
            {section.listingSourceMode === 'manual' && ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(section.sectionType) && (
              <OrderedSelectionPicker
                label="Pinned listings"
                selectedIds={section.pinnedBusinessIds || []}
                options={filteredBusinesses.filter((business) => business.status === 'approved').map((business) => ({
                  id: business.id,
                  label: business.name,
                  meta: `${getCategoryById(business.categoryId)?.name || business.categoryId} | ${business.pincode || 'No PIN'}`
                }))}
                onChange={(nextIds) => { void handlers.onUpdate({ pinnedBusinessIds: nextIds }); }}
                helperText="Select a listing and click Add. The selected order is used for manual homepage sections."
                emptyText="No listings pinned yet."
              />
            )}
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={section.showViewAll ?? true}
                  onChange={(e) => { void handlers.onUpdate({ showViewAll: e.target.checked }); }}
                />
                <span>Show View All</span>
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={section.autoRotate ?? true}
                  onChange={(e) => { void handlers.onUpdate({ autoRotate: e.target.checked }); }}
                />
                <span>Auto rotate</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Background</span>
                <input
                  type="color"
                  value={section.backgroundColor || '#ffffff'}
                  onChange={(e) => { void handlers.onUpdate({ backgroundColor: e.target.value }); }}
                  className="h-8 w-12 rounded border border-slate-200 bg-white"
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const handleCreateLocalityCategoryLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const localitySlug = localities.find((locality) => locality.id === linkLocalityId)?.slug || linkLocalityId;
    const filterSlug = linkSubcategoryId || linkCategoryId;
    const slug = `locality/${localitySlug}/${filterSlug}`;
    onCreateLocalityCategoryLink?.({
      localityId: linkLocalityId,
      categoryId: linkCategoryId,
      subcategoryId: linkSubcategoryId || undefined,
      slug
    });
    triggerNotification('Locality + category URL mapping created.');
  };

  return (
    <div id="admin-console-root" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Console Workspace</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Open admin review tools and operations management in separate full-width tabs so each workspace has enough room.
            </p>
            {!canUsePrivilegedAdminWorkspace && (
              <p className="mt-1 text-[11px] font-semibold text-amber-700">
                Limited role access: advanced CMS, imports, taxonomy, and platform configuration stay hidden until you sign in as a platform admin or developer.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {workspaceSurfaceTabs.map((surface) => (
              <button
                key={surface.id}
                type="button"
                onClick={() => setConsoleSurface(surface.id as AdminConsoleSurface)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  consoleSurface === surface.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {surface.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Moderation Module */}
      {consoleSurface === 'admin' && (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Admin Workspace</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch between moderation, listing status, imports, and audit activity without stacking everything in one long view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {adminWorkspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAdminWorkspaceTab(tab.id);
                    if (tab.id === 'listing-status') setListingStatusPage(1);
                    if (tab.id === 'data-audit') setAuditPage(1);
                    if (tab.id === 'bulk-upload') setImportPreviewPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    adminWorkspaceTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      adminWorkspaceTab === tab.id ? 'bg-white/15 text-white' : 'bg-white text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {adminWorkspaceTab === 'moderation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Intake Moderation Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted business requests from Hyper Local proprietors. Real-time verification simulator.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
              {pendingBusinesses.length} Pending Approval
            </span>
          </div>

          {pendingBusinesses.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-700">All applications processed!</p>
              <p className="text-xs text-slate-400 mt-1">No new Hyper Local businesses waiting in the moderation queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBusinesses.map((biz) => {
                const locality = localities.find(l => l.id === biz.localityId);
                const isRejecting = rejectionActive[biz.id];

                return (
                  <div key={biz.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row tracking-tight gap-4">
                    <img 
                      src={getBusinessImageUrl(biz)}
                      alt={biz.name}
                      onError={(e)=>{
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(biz.categoryId);
                      }}
                      className={`w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 self-start md:self-center ${hasUploadedBusinessImage(biz) ? 'object-cover' : 'object-contain p-2'}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{biz.name}</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {getCategoryById(biz.categoryId)?.name || biz.categoryId}
                          {biz.subcategoryId && ` / ${getSubcategoryById(biz.subcategoryId)?.name || biz.subcategoryId}`}
                        </span>
                        {onUpdateBusiness && (
                          <>
                            <select
                              value={biz.categoryId}
                              onChange={(e) => {
                                const nextCategory = e.target.value;
                                onUpdateBusiness({ ...biz, categoryId: nextCategory, subcategoryId: resolveDefaultSubcategoryId(nextCategory) });
                              }}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-semibold text-slate-700"
                              title="Change listing category"
                            >
                              {BUSINESS_CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={biz.subcategoryId}
                              onChange={(e) => onUpdateBusiness({ ...biz, subcategoryId: e.target.value })}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-semibold text-slate-700"
                              title="Change listing subcategory"
                            >
                              {getSubcategoriesForCategory(biz.categoryId).map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                        {locality && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-medium">
                            📌 Locality target: {locality.name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        {biz.description}
                      </p>

                      {/* Display geographical operational areas & coordinates */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {biz.areasOfOperation && biz.areasOfOperation.map(aid => {
                          const area = MASTER_AREAS.find(a => a.id === aid);
                          return (
                            <span key={aid} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              🏠 Area: {area ? area.name : aid}
                            </span>
                          );
                        })}
                        {biz.gpsCoordinates && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100 font-mono">
                            📡 GPS: {biz.gpsCoordinates.lat}, {biz.gpsCoordinates.lng}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono text-slate-500 pt-2 bg-slate-100/40 p-2.5 rounded-lg border border-slate-200/50">
                        <div className="truncate">📞 {biz.phone || 'Not provided'}</div>
                        <div className="truncate">
                          ✉️ {biz.email ? biz.email : <span className="text-slate-400 italic">No Email Specified</span>}
                        </div>
                        <div className="truncate text-blue-600 font-sans hover:underline">
                          🔗 <a href={biz.website} hrefLang="en" target="_blank" rel="noreferrer">{biz.website}</a>
                        </div>
                        <div className="col-span-full font-sans text-slate-600 mt-1">
                          📍 Address: {biz.address}
                        </div>
                        
                        {/* Interactive edit trigger context */}
                        <div className="col-span-full mt-2.5 flex items-center gap-2">
                          <span className="font-sans text-[11px] text-slate-400">Hours Adjustment:</span>
                          <input
                            type="text"
                            value={editedHrs[biz.id] !== undefined ? editedHrs[biz.id] : biz.hours || '10:00 AM - 08:30 PM'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedHrs(prev => ({ ...prev, [biz.id]: val }));
                              if (onUpdateBusiness) {
                                onUpdateBusiness({ ...biz, hours: val });
                              }
                            }}
                            className="bg-white border border-slate-300 rounded text-[11px] px-2 py-0.5 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                          />
                        </div>

                        {biz.ownerName && (
                          <div className="col-span-full font-sans text-slate-700 italic mt-0.5">
                            👤 Applicant Proprietor: {biz.ownerName}
                          </div>
                        )}
                      </div>

                      {isRejecting && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                          <label className="block text-xs font-semibold text-slate-700">Specify Rejection Reason:</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={rejectionReasons[biz.id] || ''}
                              onChange={(e) => setRejectionReasons({ ...rejectionReasons, [biz.id]: e.target.value })}
                              placeholder="e.g. Missing license documentation, incorrect address or invalid category"
                              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-red-400"
                            />
                            <button
                              onClick={() => {
                                onReject(biz.id, rejectionReasons[biz.id] || 'Rejected after auditing review guidelines.');
                                setRejectionActive({ ...rejectionActive, [biz.id]: false });
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs px-3 py-1.5 rounded-lg font-bold"
                            >
                              Confirm Rejection
                            </button>
                            <button
                              onClick={() => setRejectionActive({ ...rejectionActive, [biz.id]: false })}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-xs px-3 py-1.5 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!isRejecting && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            onClick={() => onApprove(biz.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Entry
                          </button>
                          <button
                            onClick={() => setRejectionActive({ ...rejectionActive, [biz.id]: true })}
                            className="text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {adminWorkspaceTab === 'listing-status' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-blue-600" />
                Other Listings Status
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review listing states in one place. This tab now paginates 20 listings per page.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 self-start">
              {listingStatusItems.length} listings • 20 per page
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'approved', label: 'Active' },
              { id: 'rejected', label: 'Deactivated' },
              { id: 'pending', label: 'Pending' }
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setListingStatusFilter(filter.id as ListingStatusFilter);
                  setListingStatusPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  listingStatusFilter === filter.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                  <th className="py-2">Business</th>
                  <th className="py-2">Category / Subcategory</th>
                  <th className="py-2">Public Route</th>
                  <th className="py-2">Proprietor</th>
                  <th className="py-2">Decision Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listingStatusPageItems.map((business) => {
                  const locality = localities.find((candidate) => candidate.id === business.localityId);
                  const isRejected = business.status === 'rejected';
                  const isPending = business.status === 'pending';
                  return (
                    <tr
                      key={business.id}
                      onClick={() => openBackendListing(business)}
                      className="hover:bg-slate-50/50 cursor-pointer"
                    >
                      <td className={`py-2.5 font-semibold ${isRejected ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {business.name}
                      </td>
                      <td className="py-2.5">
                        {onUpdateBusiness ? (
                          <div className="flex flex-col gap-1">
                            <select
                              value={business.categoryId}
                              required
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const nextCategory = e.target.value;
                                onUpdateBusiness({ ...business, categoryId: nextCategory, subcategoryId: resolveDefaultSubcategoryId(nextCategory) });
                              }}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700"
                              title="Update listing category"
                            >
                              {BUSINESS_CATEGORIES.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                            <select
                              value={business.subcategoryId}
                              required
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => onUpdateBusiness({ ...business, subcategoryId: e.target.value })}
                              className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700"
                              title="Update listing subcategory"
                            >
                              {getSubcategoriesForCategory(business.categoryId).map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                              ))}
                            </select>
                            <InlineSubcategoryCreator
                              categoryId={business.categoryId}
                              canCreate={Boolean(onSaveBusinessTaxonomy && businessTaxonomy)}
                              onCreate={createInlineSubcategory}
                              onAssign={(subcategoryId) => onUpdateBusiness({ ...business, subcategoryId })}
                            />
                          </div>
                        ) : (
                          <span>{getCategoryById(business.categoryId)?.name || business.categoryId} / {getSubcategoryById(business.subcategoryId)?.name || business.subcategoryId}</span>
                        )}
                      </td>
                      <td className={`py-2.5 font-mono ${isRejected ? 'text-slate-400' : 'text-slate-600'}`}>
                        {locality ? getPublicLocalityUrl(locality) : 'https://www.localisy.in/roadpali'}
                      </td>
                      <td className="py-2.5">{business.ownerName || 'Self-Registered'}</td>
                      <td className="py-2.5">
                        {business.status === 'approved' && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Approved
                          </span>
                        )}
                        {business.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Pending
                          </span>
                        )}
                        {business.status === 'rejected' && (
                          <div className="text-red-500 font-semibold flex flex-col">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Rejected
                            </span>
                            <span className="text-[10px] font-sans text-slate-400 max-w-[180px] truncate" title={business.rejectionReason}>
                              {business.rejectionReason || 'No reason recorded'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {listingStatusPageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No listings found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setListingStatusPage((prev) => Math.max(1, prev - 1))}
              disabled={safeListingStatusPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-mono text-slate-500">
              Page {safeListingStatusPage} / {listingStatusTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setListingStatusPage((prev) => Math.min(listingStatusTotalPages, prev + 1))}
              disabled={safeListingStatusPage >= listingStatusTotalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        )}

        {adminWorkspaceTab === 'data-audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                🇮🇳 Compliance &amp; Data Privacy Audit Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mandatory privacy logs tracking human &amp; AI conversational searches, OTP validated contact unlocks, and listing mutations.
              </p>
            </div>
            <div className="bg-slate-100 text-[10px] font-mono px-3 py-1 rounded-lg text-slate-600 border border-slate-200 uppercase tracking-tight self-start md:self-auto">
              SLA Compliant • GDPR Safeguarded
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No security compliance logs registered in current shard session.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-500 border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-550">
                    <th className="p-3">Logged Date/Time</th>
                    <th className="p-3">Actor &amp; Scope</th>
                    <th className="p-3">Audited Action description</th>
                    <th className="p-3">Trace IP Address</th>
                    <th className="p-3">Device Signature Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedAuditLogs.map((log) => {
                    const badgeColor = 
                      log.actionType === 'search' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200/50' 
                        : log.actionType === 'contact_view'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/50';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/35 transition text-[11px] whitespace-nowrap md:whitespace-normal">
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{log.userName}</span>
                          <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border mt-0.5 uppercase tracking-wide font-mono ${badgeColor}`}>
                            {log.actionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 max-w-[280px]">
                          <span className="font-bold text-slate-700 block">{log.description}</span>
                          <span className="text-slate-500 text-[10px] leading-relaxed block overflow-hidden text-ellipsis">{log.details}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            {log.ipAddress}
                          </span>
                          <span className="block text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Zone B-West (IN)</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400 max-w-[150px] truncate" title={log.deviceCode}>
                          {log.deviceCode}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {auditLogs.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                disabled={safeAuditPage <= 1}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-mono text-slate-500">
                Page {safeAuditPage} / {auditTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))}
                disabled={safeAuditPage >= auditTotalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
        )}

        {adminWorkspaceTab === 'bulk-upload' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-md font-bold text-slate-950">Bulk Import Businesses (CSV)</h3>
          <p className="text-xs text-slate-500">
            Upload CSV with columns: Business Name, Address, Area, City, State, PIN, Mobile, Rating, Reviews, Services, Category, Subcategory, Latitude, Longitude. Invalid category/subcategory values will not be auto-guessed anymore; those listings go to the taxonomy mapping queue.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsvImport(f);
            }}
            className="w-full text-xs border border-slate-200 rounded-lg p-2"
          />
          {importResult && (
            <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-3 py-2">
              {importResult}
            </div>
          )}
          {importPreview.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg">
                    Ready: {importPreview.filter(r => r.previewStatus === 'ready').length}
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg">
                    Updates: {importPreview.filter(r => r.previewStatus === 'update').length}
                  </span>
                  <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-1 rounded-lg">
                    Failed: {importPreview.filter(r => r.previewStatus === 'fail').length}
                  </span>
                </div>
                <div className="flex gap-2">
                  {importPreview.some(r => r.previewStatus === 'fail') && (
                    <button
                      type="button"
                      onClick={downloadFailedImportCsv}
                      className="text-[10px] bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50"
                    >
                      Export Failed CSV
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyImportPreview}
                    disabled={!importPreview.some(r => r.previewStatus !== 'fail')}
                    className="text-[10px] bg-indigo-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700"
                  >
                    Upload Ready Items
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-72">
                <table className="w-full text-left text-[10px] text-slate-600">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="uppercase font-mono text-slate-400">
                      <th className="p-2">Row</th>
                      <th className="p-2">Business</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Pincode</th>
                      <th className="p-2">Locality</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Subcategory</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 min-w-[220px]">Error Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedImportPreview.map((row) => (
                      <tr key={`${row.rowNumber}-${row.businessName}`} className="hover:bg-slate-50/60">
                        <td className="p-2 font-mono">{row.rowNumber}</td>
                        <td className="p-2 font-semibold text-slate-800">{row.businessName}</td>
                        <td className="p-2 font-mono">{row.normalizedPhone || 'Not provided'}</td>
                        <td className="p-2 font-mono">{row.resolvedPincode || '-'}</td>
                        <td className="p-2">{localities.find(l => l.id === row.resolvedLocalityId)?.name.split(',')[0] || row.resolvedLocalityId}</td>
                        <td className="p-2 align-top">
                          <span className="block text-slate-800">{row.category?.trim() || 'Not supplied'}</span>
                          <span className={`block text-[9px] ${row.categoryId ? 'text-emerald-700' : 'text-amber-700 font-semibold'}`}>
                            {row.categoryId ? `Mapped: ${getCategoryById(row.categoryId || '')?.name || row.categoryId}` : 'Unmapped - saved to tags'}
                          </span>
                        </td>
                        <td className="p-2 align-top">
                          <span className="block text-slate-800">{row.subcategory?.trim() || 'Not supplied'}</span>
                          <span className={`block text-[9px] ${row.subcategoryId ? 'text-emerald-700' : 'text-amber-700 font-semibold'}`}>
                            {row.subcategoryId ? `Mapped: ${getSubcategoryById(row.subcategoryId || '')?.name || row.subcategoryId}` : 'Unmapped - send to queue'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            row.previewStatus === 'ready'
                              ? 'bg-emerald-50 text-emerald-700'
                              : row.previewStatus === 'update'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700'
                          }`}>
                            {row.previewStatus === 'ready' ? 'Ready' : row.previewStatus === 'update' ? 'Update existing' : 'Fail'}
                          </span>
                        </td>
                        <td className="p-2 align-top">
                          <div className="space-y-1">
                            {row.errors.length > 0 ? (
                              <div className="text-rose-600">{row.errors.join('; ')}</div>
                            ) : row.previewStatus === 'update' ? (
                              <div className="text-blue-700">Existing ID: {row.existingBusinessId}</div>
                            ) : (
                              <div className="text-slate-400">-</div>
                            )}
                            {row.requiresTaxonomyMapping && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[9px] font-semibold text-amber-800">
                                {row.taxonomyStatusLabel}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setImportPreviewPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeImportPreviewPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="font-mono text-slate-500">
                  Page {safeImportPreviewPage} / {importPreviewTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setImportPreviewPage((prev) => Math.min(importPreviewTotalPages, prev + 1))}
                  disabled={safeImportPreviewPage >= importPreviewTotalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {adminWorkspaceTab === 'taxonomy-mapping' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-md font-bold text-slate-950">Unmapped Category / Subcategory Queue</h3>
              <p className="text-xs text-slate-500">
                Listings are saved even when upload taxonomy does not match master data. Use this queue to map them later. Raw upload values are preserved and also added to tags.
              </p>
            </div>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
              {unmappedTaxonomyBusinesses.length} pending mapping
            </span>
          </div>

          {unmappedTaxonomyBusinesses.length === 0 ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              Nice and clean. No listings are waiting for taxonomy mapping right now.
            </div>
          ) : (
            <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1">
              {unmappedTaxonomyBusinesses.map((biz) => {
                const draft = getTaxonomyDraft(biz);
                const taxonomyLabel = getBusinessTaxonomyLabel(biz);
                return (
                  <div key={biz.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{biz.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {localities.find((locality) => locality.id === biz.localityId)?.name || biz.localityId}
                          {' • '}
                          {biz.phone || 'Phone not provided'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBackendListing(biz)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Open details
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 text-[11px]">
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="font-bold text-slate-500 mb-1">Uploaded Category</div>
                        <div className="text-slate-900">{biz.sourceCategoryLabel || taxonomyLabel.category}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="font-bold text-slate-500 mb-1">Uploaded Subcategory</div>
                        <div className="text-slate-900">{biz.sourceSubcategoryLabel || taxonomyLabel.subcategory}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="font-bold text-slate-500 mb-1">Current Tags</div>
                        <div className="text-slate-900 line-clamp-2">{(biz.tags || []).join(', ') || 'No tags yet'}</div>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <select
                        value={draft.categoryId}
                        onChange={(e) => updateTaxonomyDraft(biz.id, { categoryId: e.target.value, subcategoryId: '' })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        <option value="">Select master category</option>
                        {BUSINESS_CATEGORIES.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                      <div className="space-y-2">
                        <select
                          value={draft.subcategoryId}
                          onChange={(e) => updateTaxonomyDraft(biz.id, { subcategoryId: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                          disabled={!draft.categoryId}
                        >
                          <option value="">{draft.categoryId ? 'Select master subcategory' : 'Choose category first'}</option>
                          {getSubcategoriesForCategory(draft.categoryId).map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                          ))}
                        </select>
                        <InlineSubcategoryCreator
                          categoryId={draft.categoryId}
                          canCreate={Boolean(onSaveBusinessTaxonomy && businessTaxonomy)}
                          onCreate={createInlineSubcategory}
                          onAssign={(subcategoryId) => updateTaxonomyDraft(biz.id, { subcategoryId })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => saveTaxonomyMapping(biz)}
                        disabled={!draft.categoryId || !draft.subcategoryId}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Save mapping
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>
      )}

      {/* Domain Mapping Panel and Locality Spinner */}
      {consoleSurface === 'operations' && (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">Operations Workspace</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Switch manager groups in a dedicated full-width view instead of squeezing every control into the old sidebar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {operationsSectionTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setOperationsSection(tab.id);
                    if (tab.id === 'homepage') {
                      setHomepageCmsSubtab('layout');
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    operationsSection === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 text-xs">
            <select
              value={adminLocalityFilter}
              onChange={(e) => setAdminLocalityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All localities</option>
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>
            <select
              value={adminCategoryFilter}
              onChange={(e) => setAdminCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All categories</option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={adminSubcategoryFilter}
              onChange={(e) => setAdminSubcategoryFilter(e.target.value)}
              disabled={adminCategoryFilter === 'all'}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 disabled:text-slate-400"
            >
              <option value="all">All subcategories</option>
              {adminCategoryFilter !== 'all' && getSubcategoriesForCategory(adminCategoryFilter).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
            <input
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              placeholder="Search name, phone, title..."
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            />
            <input
              value={adminPincodeFilter}
              onChange={(e) => setAdminPincodeFilter(e.target.value.replace(/\D/g, ''))}
              placeholder="Pincode"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono"
            />
            <select
              value={adminStatusFilter}
              onChange={(e) => setAdminStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] text-indigo-900">
            <span className="font-bold">{selectedOperationsTab.label}:</span> {selectedOperationsTab.description}
          </div>
        </div>

        {operationsSection === 'homepage' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-950">Homepage CMS Sections</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Switch one homepage subsection at a time so the page stays fast to scan and easier to operate.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {homepageCmsSubtabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHomepageCmsSubtab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      homepageCmsSubtab === tab.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
              <span className="font-bold">{selectedHomepageCmsSubtab.label}:</span> {selectedHomepageCmsSubtab.description}
            </div>
          </div>
        )}

        {operationsSection === 'platform' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-950">Platform Config Sections</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Split platform settings into smaller operational views so updates are faster and safer to review.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {platformConfigSubtabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPlatformConfigSubtab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      platformConfigSubtab === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {selectedPlatformConfigSubtab && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] text-indigo-900">
                <span className="font-bold">{selectedPlatformConfigSubtab.label}:</span> {selectedPlatformConfigSubtab.description}
              </div>
            )}
          </div>
        )}

        {operationsSection === 'geography' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-950">Geography & Routing Sections</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Keep page provisioning, routing, and landing-path management separated so ops work stays faster to scan.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {geographyWorkspaceSubtabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGeographyWorkspaceSubtab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      geographyWorkspaceSubtab === tab.id
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] text-sky-900">
              <span className="font-bold">{selectedGeographyWorkspaceSubtab.label}:</span> {selectedGeographyWorkspaceSubtab.description}
            </div>
          </div>
        )}

        {operationsSection === 'campaigns' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-950">Ads & Offers Sections</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Separate offer creation, banner authoring, and lead review so campaign operations do not pile into one long screen.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {campaignWorkspaceSubtabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCampaignWorkspaceSubtab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      campaignWorkspaceSubtab === tab.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
              <span className="font-bold">{selectedCampaignWorkspaceSubtab.label}:</span> {selectedCampaignWorkspaceSubtab.description}
            </div>
          </div>
        )}

        {/* Dynamic Mapping and DNS Status */}
        {showInternalTopology && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              Mapped Subdomains Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify NGINX virtual host headers mapping custom domains to physical PostgreSQL databases.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Active Gateways</span>
              <span className="text-emerald-400 text-[10px] bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 uppercase tracking-wide">
                Nginx Alive
              </span>
            </div>
            {subdomains.map(sub => {
              const loc = localities.find(l => l.id === sub.localityId);
              return (
                <div key={sub.domain} className="space-y-1 py-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      🌐 {sub.domain}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      sub.dnsStatus === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {sub.dnsStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 pl-5 flex items-center justify-between">
                    <span>Database: {loc ? `db_${loc.slug}_yellow` : 'db_unassigned'}</span>
                    <span className="text-indigo-400">SSL Enabled ✔️</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg space-y-1 border border-indigo-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 leading-normal">
              In a full production deploy, these routes dynamically intercept the host header variables inside the <strong>Express Router Request payload</strong> to query records strictly matching the subdomain.
            </p>
          </div>
        </div>}

        {/* Locality Spinner Form */}
        {operationsSection === 'geography' && geographyWorkspaceSubtab === 'localities' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950 mb-1 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Create Hyper Local Business Page
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Provision a page, public route, and optional pincode group for a municipality or neighbourhood cluster.
          </p>

          {adminNotification && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 border border-emerald-100 text-xs transition-all animate-bounce">
              <Check className="w-4 h-4" /> {adminNotification}
            </div>
          )}

          <form onSubmit={handleLocalitySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / City Name</label>
              <input
                type="text"
                required
                value={newLocName}
                onChange={(e) => {
                  setNewLocName(e.target.value);
                  if (!newLocSubdomain) {
                    setNewLocSubdomain(`${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}.yellowpages.io`);
                  }
                }}
                placeholder="e.g. San Francisco"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Public Route / legacy domain mapping</label>
              <input
                type="text"
                required
                value={newLocSubdomain}
                onChange={(e) => setNewLocSubdomain(e.target.value)}
                placeholder="e.g. roadpali.localisy.in or legacy route"
                className="w-full text-xs px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This legacy route record maps to the public page; mapped pincodes below decide which visitors are routed here after location detection or pincode selection.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Regional Description</label>
              <textarea
                value={newLocDesc}
                onChange={(e) => setNewLocDesc(e.target.value)}
                rows={2}
                placeholder="Help local searchers understand what they will find here..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City Image (Unsplash URL - optional)</label>
              <input
                type="url"
                value={newLocImg}
                onChange={(e) => setNewLocImg(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mapped Pincodes</label>
              <input
                type="text"
                value={newLocPincodes}
                onChange={(e) => setNewLocPincodes(e.target.value)}
                placeholder="e.g. 410218, 410101"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Users entering any mapped pincode will open this Hyper Local page. Separate multiple pincodes with commas or spaces.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Provision Network Domain
            </button>
          </form>
        </div>}

        {/* Existing Localities Grid Panel */}
        {operationsSection === 'geography' && geographyWorkspaceSubtab === 'localities' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
            Localities Databases ({filteredLocalities.length})
          </h4>
          <div className="space-y-2.5">
            {filteredLocalities.map(loc => {
              const locCount = businesses.filter(b => b.localityId === loc.id && b.status === "approved").length;
              return (
                <div key={loc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="truncate pr-2">
                    <span className="block text-xs font-bold text-slate-800 truncate">{loc.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono truncate">{getPublicLocalityUrl(loc)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
                      {locCount} approved
                    </span>
                    <button
                      onClick={() => onDeleteLocality(loc.id)}
                      disabled={localities.length <= 1}
                      title="Decommission locality database"
                      className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>}

        {/* Pincode Routing Master Config Panel */}
        {operationsSection === 'geography' && geographyWorkspaceSubtab === 'routing' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Pincode Routing Engine
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure 1:1 or many:1 static bindings mapping postal codes to active Hyper Local pages and their public locality routes.
            </p>
          </div>

          {/* Form to change current Default fallback locality */}
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/70 space-y-1.5">
            <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-tight">Default Fallback Page:</label>
            <select
              value={defaultLocalityId}
              onChange={(e) => onChangeDefaultLocalityId?.(e.target.value)}
              className="w-full bg-white border border-indigo-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer text-indigo-950 font-semibold"
            >
              {localities.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name.split(',')[0]} (Fallback Default)
                </option>
              ))}
            </select>
            <span className="text-[9px] text-indigo-600 block leading-tight">This page opens automatically on first visit when a user enters an unactivated pincode, clicks skip, or views general landing info.</span>
          </div>

          {/* List of current mappings */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Active Mappings ({filteredPincodeMappings.length})</span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredPincodeMappings.map(mapping => {
                const matchedLoc = localities.find(l => l.id === mapping.localityId);
                return (
                  <div key={mapping.pincode} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-150 rounded-xl font-mono">
                    <span className="font-bold text-slate-800">📪 {mapping.pincode}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[11px] text-slate-600 font-semibold">{matchedLoc?.name.split(',')[0] || mapping.localityId}</span>
                      <button
                        onClick={() => onDeletePincodeMapping?.(mapping.pincode)}
                        className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete this binding mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredPincodeMappings.length === 0 && (
                <div className="text-center py-4 text-slate-405 text-xs italic">No postal codes mapped yet.</div>
              )}
            </div>
          </div>

          {/* Form to add a new pairing */}
          <div className="border-t border-slate-200/80 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Custom Entry</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 410210"
                  id="admin-new-pincode"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Open Page</label>
                <select
                  id="admin-new-locality"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-slate-700 cursor-pointer text-ellipsis whitespace-nowrap overflow-hidden"
                >
                  {localities.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name.split(',')[0]}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const pinInput = document.getElementById('admin-new-pincode') as HTMLInputElement;
                const locSelect = document.getElementById('admin-new-locality') as HTMLSelectElement;
                if (!pinInput || !locSelect) return;
                const pin = pinInput.value.replace(/\D/g, '').trim();
                const locId = locSelect.value;
                if (pin.length !== 6) {
                  alert("Please supply a valid 6-digit Indian Pincode code.");
                  return;
                }
                const existing = pincodeMappings.find(m => m.pincode === pin);
                if (existing) {
                  alert(`Pincode ${pin} is already assigned to a directory node. Clear the existing route first!`);
                  return;
                }
                onAddPincodeMapping?.(pin, locId);
                pinInput.value = '';
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-indigo-500/25 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Set Area Binding
            </button>
          </div>
        </div>}

        {operationsSection === 'listings' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-950">Uploaded Listings</h3>
            <span className="text-[10px] font-mono text-slate-500">20 per page</span>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'active', label: 'Active' },
              { id: 'deactivated', label: 'Deactivated' },
              { id: 'pending', label: 'Pending' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setUploadedTab(tab.id as 'active' | 'deactivated' | 'pending');
                  setUploadedPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  uploadedTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {uploadedPageItems.length === 0 ? (
              <div className="text-xs text-slate-400">No listings in this tab.</div>
            ) : (
              uploadedPageItems.map((listing) => (
                <div key={listing.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800 truncate">{listing.name}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        PIN {listing.pincode || MASTER_AREAS.find((area) => area.id === listing.areaId)?.pincode || 'NA'}
                      </span>
                    </div>
                    {onUpdateBusiness && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = listing.status === 'approved' ? 'rejected' : 'approved';
                          onUpdateBusiness({
                            ...listing,
                            status: nextStatus,
                            rejectionReason: nextStatus === 'rejected' ? (listing.rejectionReason || 'Deactivated from uploaded listings tab.') : undefined
                          });
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                          listing.status === 'approved'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {listing.status === 'approved' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setUploadedPage((prev) => Math.max(1, prev - 1))}
              disabled={safeUploadedPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-mono text-slate-500">
              Page {safeUploadedPage} / {uploadedTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setUploadedPage((prev) => Math.min(uploadedTotalPages, prev + 1))}
              disabled={safeUploadedPage >= uploadedTotalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>}

        {operationsSection === 'homepage' && homepageCmsSubtab === 'layout' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">Homepage Layout Manager</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Arrange repeatable sections for each locality page. Sections can be scheduled, hidden, duplicated, and targeted by pincode.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
              {filteredHomepageSections.length} sections
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <select
              value={homepageLocalityId}
              onChange={(e) => setHomepageLocalityId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>

            <form onSubmit={handleCreateHomepageSectionSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSectionType}
                  onChange={(e) => {
                    const nextType = e.target.value as HomepageSectionType;
                    setNewSectionType(nextType);
                    setNewSectionTitle(homepageSectionLabels[nextType]);
                    setNewSectionMobileDisplayMode(nextType === 'verified_business_grid' ? 'stack' : 'carousel');
                    setNewSectionDesktopCardCount(nextType === 'featured_businesses' ? '3' : nextType === 'verified_business_grid' ? '5' : '4');
                    setNewSectionMobileCardCount('2');
                  }}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  {homepageSectionOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <input
                  value={newSectionMaxItems}
                  onChange={(e) => setNewSectionMaxItems(e.target.value.replace(/\D/g, ''))}
                  placeholder="Max items"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                  New sections default to position `1`, so they appear at the top immediately. Enter a larger number to place the section lower.
                </div>
                <input
                  value={newSectionInsertPosition}
                  onChange={(e) => setNewSectionInsertPosition(e.target.value.replace(/\D/g, ''))}
                  placeholder="Insert position"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <OrderedSelectionPicker
                label="Target localities"
                selectedIds={newSectionLocalityIds}
                options={localities.map((locality) => ({
                  id: locality.id,
                  label: locality.name,
                  meta: locality.slug || locality.id
                }))}
                onChange={setNewSectionLocalityIds}
                helperText="Select one locality at a time and click Add. Empty is avoided for new sections so targeting stays explicit."
                emptyText="No localities selected yet."
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newSectionVisibleSlots}
                  onChange={(e) => setNewSectionVisibleSlots(e.target.value.replace(/\D/g, ''))}
                  placeholder="Visible slots"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
                <input
                  value={newSectionRotationIntervalSec}
                  onChange={(e) => setNewSectionRotationIntervalSec(e.target.value.replace(/\D/g, ''))}
                  placeholder="Rotate seconds"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) && (
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={newSectionDesktopCardCount}
                    onChange={(e) => setNewSectionDesktopCardCount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Desktop cards"
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  />
                  <input
                    value={newSectionMobileCardCount}
                    onChange={(e) => setNewSectionMobileCardCount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Mobile cards"
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  />
                  <select
                    value={newSectionMobileDisplayMode}
                    onChange={(e) => setNewSectionMobileDisplayMode(e.target.value as NonNullable<HomepageSection['mobileDisplayMode']>)}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="carousel">Mobile Carousel</option>
                    <option value="stack">Mobile Stack</option>
                  </select>
                </div>
              )}
              <input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Section title"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
              <textarea
                value={newSectionSubtitle}
                onChange={(e) => setNewSectionSubtitle(e.target.value)}
                placeholder="Section subtitle"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
              {['business_shelf', 'text_business_strip'].includes(newSectionType) && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newSectionCategoryId}
                    onChange={(e) => setNewSectionCategoryId(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select
                    value={newSectionSubcategoryId}
                    onChange={(e) => setNewSectionSubcategoryId(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">All subcategories</option>
                    {getSubcategoriesForCategory(newSectionCategoryId).map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {['category_grid', 'emergency_grid'].includes(newSectionType) && (
                <OrderedCategoryPicker
                  label="Category selection and order"
                  selectedIds={newSectionCategoryIds}
                  onChange={setNewSectionCategoryIds}
                  helperText="The backend stores the selected category order and uses it when rendering the section."
                />
              )}
              {['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newSectionListingSourceMode || 'auto'}
                    onChange={(e) => setNewSectionListingSourceMode(e.target.value as HomepageSection['listingSourceMode'])}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="auto">Auto listings</option>
                    <option value="manual">Manual pinned listings</option>
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={newSectionAutoRotate}
                      onChange={(e) => setNewSectionAutoRotate(e.target.checked)}
                    />
                    <span>Auto rotate overflow</span>
                  </label>
                </div>
              )}
              {newSectionListingSourceMode === 'manual' && ['business_shelf', 'text_business_strip', 'featured_businesses', 'verified_business_grid'].includes(newSectionType) && (
                <OrderedSelectionPicker
                  label="Pinned listings"
                  selectedIds={newSectionPinnedBusinessIds}
                  options={filteredBusinesses.filter((business) => business.status === 'approved').map((business) => ({
                    id: business.id,
                    label: business.name,
                    meta: `${getCategoryById(business.categoryId)?.name || business.categoryId} | ${business.pincode || 'No PIN'}`
                  }))}
                  onChange={setNewSectionPinnedBusinessIds}
                  helperText="Select a listing and click Add. The selected order is used for manual homepage sections."
                  emptyText="No listings pinned yet."
                />
              )}
              {newSectionType === 'promo_banner' && (
                <input
                  value={newSectionPlacementKey}
                  onChange={(e) => setNewSectionPlacementKey(e.target.value)}
                  placeholder="Placement key"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newSectionStartDate}
                  onChange={(e) => setNewSectionStartDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
                <input
                  type="date"
                  value={newSectionEndDate}
                  onChange={(e) => setNewSectionEndDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSectionCtaType || 'none'}
                  onChange={(e) => setNewSectionCtaType(e.target.value as HomepageSection['ctaType'])}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="none">No CTA</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="landing_listing">Landing Listing</option>
                  <option value="lead_form">Lead Form</option>
                  <option value="search_category">Search Category</option>
                </select>
                <input
                  value={newSectionCtaLabel}
                  onChange={(e) => setNewSectionCtaLabel(e.target.value)}
                  placeholder="CTA label"
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <input
                value={newSectionCtaTarget}
                onChange={(e) => setNewSectionCtaTarget(e.target.value)}
                placeholder="CTA target"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              />
              <input
                value={newSectionPincodes}
                onChange={(e) => setNewSectionPincodes(e.target.value)}
                placeholder="Target pincodes"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={newSectionShowViewAll}
                    onChange={(e) => setNewSectionShowViewAll(e.target.checked)}
                  />
                  <span>Show View All</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Background</span>
                  <input
                    type="color"
                    value={newSectionBackgroundColor}
                    onChange={(e) => setNewSectionBackgroundColor(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-200 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
                  Add Homepage Section
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateScalableTemplateSection()}
                  disabled={!selectedScalableTemplate}
                  className="w-full rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add To Active Template
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1">
              {filteredHomepageSections.map((section, index) => renderEditableHomepageSectionCard(section, index, {
                onMoveUp: () => onMoveHomepageSection?.(homepageLocalityId, section.id, 'up'),
                onMoveDown: () => onMoveHomepageSection?.(homepageLocalityId, section.id, 'down'),
                onDuplicate: () => onDuplicateHomepageSection?.(homepageLocalityId, section.id),
                onDelete: () => onDeleteHomepageSection?.(homepageLocalityId, section.id),
                onUpdate: (patch) => updateHomepageSection(section, patch),
              }))}
              {filteredHomepageSections.length === 0 && (
                <div className="text-xs text-slate-400">No homepage sections configured yet for this locality.</div>
              )}
            </div>
          </div>
        </div>}

        {operationsSection === 'platform' && <div className="space-y-4">
          {platformConfigSubtab === 'api' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Platform API & Sync</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Control sync endpoints, resolved homepage routes, and publish service paths.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
                  {apiConfigDraft.syncMode.toUpperCase()}
                </span>
              </div>

              <form onSubmit={handleSaveApiConfiguration} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="font-semibold text-slate-700">Sync mode</span>
                    <select
                      value={apiConfigDraft.syncMode}
                      onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, syncMode: e.target.value as ApiConfiguration['syncMode'] }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <option value="api">API + Local Fallback</option>
                      <option value="local">Local Only</option>
                    </select>
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="font-semibold text-slate-700">Last sync</div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {apiConfigDraft.lastHomepageSyncAt ? new Date(apiConfigDraft.lastHomepageSyncAt).toLocaleString() : 'Not synced yet'}
                    </div>
                  </div>
                </div>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Homepage config endpoint</span>
                  <input
                    value={apiConfigDraft.homepageConfigEndpoint}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, homepageConfigEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Ad leads endpoint</span>
                  <input
                    value={apiConfigDraft.adLeadsEndpoint || ''}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, adLeadsEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Homepage defaults endpoint</span>
                  <input
                    value={apiConfigDraft.homepageDefaultsConfigEndpoint || ''}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, homepageDefaultsConfigEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Locality routing endpoint</span>
                  <input
                    value={apiConfigDraft.localityRoutingConfigEndpoint || ''}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, localityRoutingConfigEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Geography endpoint</span>
                  <input
                    value={apiConfigDraft.geographyConfigEndpoint || ''}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, geographyConfigEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Taxonomy endpoint</span>
                  <input
                    value={apiConfigDraft.taxonomyConfigEndpoint || ''}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, taxonomyConfigEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">SEO discovery endpoint</span>
                  <input
                    value={apiConfigDraft.seoDiscoveryConfigEndpoint || ''}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, seoDiscoveryConfigEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="font-semibold text-slate-700">Scalable CMS endpoint</span>
                    <input
                      value={apiConfigDraft.scalableHomepageConfigEndpoint || ''}
                      onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, scalableHomepageConfigEndpoint: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-semibold text-slate-700">Resolved homepage endpoint</span>
                    <input
                      value={apiConfigDraft.resolvedHomepageEndpoint || ''}
                      onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, resolvedHomepageEndpoint: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Publish snapshots endpoint</span>
                  <input
                    value={apiConfigDraft.publishResolvedHomepageEndpoint || ''}
                    onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, publishResolvedHomepageEndpoint: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="font-semibold text-slate-700">Businesses endpoint</span>
                    <input
                      value={apiConfigDraft.businessesEndpoint}
                      onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, businessesEndpoint: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-semibold text-slate-700">Audit endpoint</span>
                    <input
                      value={apiConfigDraft.auditEventsEndpoint}
                      onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, auditEventsEndpoint: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={apiConfigDraft.autoSyncHomepage}
                      onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, autoSyncHomepage: e.target.checked }))}
                    />
                    <span>Auto-sync homepage config</span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={apiConfigDraft.autoSyncBusinesses}
                      onChange={(e) => setApiConfigDraft((prev) => ({ ...prev, autoSyncBusinesses: e.target.checked }))}
                    />
                    <span>Auto-sync businesses</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700">
                    Save API Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateApiConfiguration?.(apiConfigDraft);
                      onSyncHomepageConfig?.();
                      triggerNotification('Homepage sync started.');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Sync Now</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {platformConfigSubtab === 'taxonomy' && businessTaxonomy && (
            <BusinessTaxonomyManager
              taxonomy={businessTaxonomy}
              onSave={onSaveBusinessTaxonomy}
            />
          )}

          {platformConfigSubtab === 'geography' && geographyConfig && (
            <GeographyConfigManager
              config={geographyConfig}
              onSave={onSaveGeographyConfig}
            />
          )}

          {platformConfigSubtab === 'defaults' && homepageDefaultsConfig && (
            <HomepageDefaultsManager
              config={homepageDefaultsConfig}
              onSave={onSaveHomepageDefaultsConfig}
            />
          )}

          {platformConfigSubtab === 'seo' && seoDiscoveryConfig && (
            <SeoDiscoveryManager
              config={seoDiscoveryConfig}
              localities={localities}
              onSave={onSaveSeoDiscoveryConfig}
            />
          )}
        </div>}

        {operationsSection === 'homepage' && ['publish', 'templates', 'assignments', 'campaigns', 'insights'].includes(homepageCmsSubtab) && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">{selectedHomepageCmsSubtab.label}</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {selectedHomepageCmsSubtab.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] md:w-[22rem]">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-emerald-700">Snapshots</div>
                <div className="mt-1 text-lg font-extrabold text-emerald-950">{scalableSnapshotCount}</div>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-indigo-700">Templates</div>
                <div className="mt-1 text-lg font-extrabold text-indigo-950">{scalableTemplateCount}</div>
              </div>
            </div>
          </div>

          {['publish', 'templates', 'assignments', 'campaigns', 'insights'].includes(homepageCmsSubtab) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-emerald-950">Scalable Homepage CMS</div>
                <div className="mt-1 text-[11px] text-emerald-800">
                  Track templates, targeting assignments, campaigns, and published locality snapshots.
                </div>
              </div>
              <span className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-mono text-emerald-800">
                {scalableSnapshotCount} snapshots
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Templates</div>
                <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableTemplateCount}</div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Assignments</div>
                <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableAssignmentCount}</div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Campaigns</div>
                <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableCampaignCount}</div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Snapshots</div>
                <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableSnapshotCount}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              <div className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Legacy Templates</div>
                <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableLegacyOwnershipSummary.legacyManagedTemplates}</div>
                <div className="text-[10px] text-slate-500">Detached: {scalableLegacyOwnershipSummary.detachedTemplates}</div>
              </div>
              <div className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Legacy Assignments</div>
                <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableLegacyOwnershipSummary.legacyManagedAssignments}</div>
                <div className="text-[10px] text-slate-500">Detached: {scalableLegacyOwnershipSummary.detachedAssignments}</div>
              </div>
              <div className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Legacy Campaigns</div>
                <div className="mt-1 text-lg font-extrabold text-slate-950">{scalableLegacyOwnershipSummary.legacyManagedCampaigns}</div>
                <div className="text-[10px] text-slate-500">Detached: {scalableLegacyOwnershipSummary.detachedCampaigns}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { void handleReseedScalableHomepageConfig(false); }}
                className="flex-1 rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
              >
                Safe Reseed From Legacy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm('Force reseed from legacy data? This can overwrite scalable-authored state that was detached from legacy sync.')) return;
                  void handleReseedScalableHomepageConfig(true);
                }}
                className="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 font-bold text-rose-700 hover:bg-rose-100"
              >
                Force Legacy Reseed
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePublishResolvedHomepages([homepageLocalityId])}
                className="flex-1 rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700"
              >
                Publish Selected Locality
              </button>
              <button
                type="button"
                onClick={() => handlePublishResolvedHomepages(localities.map((locality) => locality.id))}
                className="flex-1 rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
              >
                Publish All Localities
              </button>
            </div>

            {homepageCmsSubtab === 'insights' && (
            <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Bulk Publish Scope</div>
                  <div className="text-[10px] text-slate-500">Build a structured publish set for locality, category, subcategory, pincode, placement, device, and page-type rollout.</div>
                </div>
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-mono text-emerald-800">
                  {publishScopeCombinationCount} contexts
                </span>
              </div>
              <OrderedSelectionPicker
                label="Publish localities"
                selectedIds={parseIdList(publishScopeDraft.localityIds)}
                options={localitySelectionOptions}
                onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, localityIds: nextIds.join(', ') }))}
                helperText="Choose the localities that should receive published snapshots in this batch."
                emptyText="No localities selected yet."
              />
              <OrderedCategoryPicker
                label="Publish categories"
                selectedIds={parseIdList(publishScopeDraft.categoryIds)}
                onChange={(nextIds) => setPublishScopeDraft((prev) => ({
                  ...prev,
                  categoryIds: nextIds.join(', '),
                  subcategoryIds: parseIdList(prev.subcategoryIds)
                    .filter((subcategoryId) => {
                      const subcategory = getSubcategoryById(subcategoryId);
                      return subcategory ? nextIds.includes(subcategory.categoryId) : false;
                    })
                    .join(', '),
                }))}
                helperText="Optional category scopes for publishing. Leave empty to publish locality-wide snapshots."
              />
              <OrderedSelectionPicker
                label="Publish subcategories"
                selectedIds={parseIdList(publishScopeDraft.subcategoryIds)}
                options={publishSubcategorySelectionOptions}
                onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, subcategoryIds: nextIds.join(', ') }))}
                helperText="Optional subcategory scopes. These stay aligned to their parent categories during context generation."
                emptyText="No subcategories selected. Category-only or locality-only snapshots will be published."
              />
              <div className="grid gap-3 md:grid-cols-2">
                <OrderedSelectionPicker
                  label="Publish pincodes"
                  selectedIds={parsePincodeList(publishScopeDraft.pincodes)}
                  options={pincodeSelectionOptions}
                  onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, pincodes: nextIds.join(', ') }))}
                  helperText="Optional pincode-specific publishes."
                  emptyText="No pincodes selected. Snapshot contexts will not be pincode-scoped."
                />
                <OrderedSelectionPicker
                  label="Publish placements"
                  selectedIds={parseIdList(publishScopeDraft.placementKeys)}
                  options={placementKeySelectionOptions}
                  onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, placementKeys: nextIds.join(', ') }))}
                  helperText="Optional placement-aware snapshot publishes."
                  emptyText="No placement keys selected. Default placement context will be used."
                />
                <OrderedSelectionPicker
                  label="Publish devices"
                  selectedIds={parseIdList(publishScopeDraft.deviceTargets)}
                  options={deviceSelectionOptions}
                  onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, deviceTargets: nextIds.join(', ') }))}
                  helperText="Choose which device targets should get snapshots."
                  emptyText="No devices selected. The publish flow will fall back to all devices."
                />
                <OrderedSelectionPicker
                  label="Publish page types"
                  selectedIds={parseIdList(publishScopeDraft.pageTypes)}
                  options={pageTypeSelectionOptions}
                  onChange={(nextIds) => setPublishScopeDraft((prev) => ({ ...prev, pageTypes: nextIds.join(', ') }))}
                  helperText="Choose which page types should be published in this batch."
                  emptyText="No page types selected. The publish flow will default to homepage."
                />
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-900">
                {publishScopeCombinationCount > 0
                  ? `Ready to publish ${publishScopeCombinationCount} context${publishScopeCombinationCount === 1 ? '' : 's'} across the selected scope.`
                  : 'No valid publish contexts are currently generated from this scope.'}
              </div>
              <button
                type="button"
                onClick={() => { void handlePublishScopedContexts(); }}
                className="w-full rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
              >
                Publish Scoped Snapshot Set
              </button>
              <button
                type="button"
                onClick={() => { void handleDeleteScopedSnapshots(); }}
                className="w-full rounded-lg border border-rose-200 bg-rose-50 py-2 font-bold text-rose-700 hover:bg-rose-100"
              >
                Delete Scoped Snapshot Set
              </button>
            </div>
            )}

            {homepageCmsSubtab === 'insights' && (
            <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Published Snapshots</div>
                  <div className="text-[10px] text-slate-500">Recent resolved payloads saved by the publish workflow.</div>
                </div>
                <div className="flex items-center gap-2">
                  {onRefreshScalablePublishedSnapshots && (
                    <button
                      type="button"
                      onClick={() => { void handleRefreshPublishedSnapshots(); }}
                      className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-50"
                    >
                      Refresh
                    </button>
                  )}
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-mono text-emerald-800">
                    {recentPublishedSnapshots.length} recent
                  </span>
                </div>
              </div>
              {recentPublishedSnapshots.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {recentPublishedSnapshots.map((snapshot) => (
                    <div key={snapshot.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-700">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700">
                          {snapshot.localityId}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700">
                          {snapshot.deviceTarget}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700">
                          {snapshot.pageType}
                        </span>
                      </div>
                      <div className="mt-2 font-semibold text-slate-900">
                        {snapshot.payload.template?.name || 'No template'}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {snapshot.categoryId || 'all'} / {snapshot.subcategoryId || 'all'} / {snapshot.pincode || 'all'} / {snapshot.placementKey || 'default'}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded border border-slate-200 bg-white px-2 py-1">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500">Sections</div>
                          <div className="font-bold text-slate-900">{snapshot.payload.sections.length}</div>
                        </div>
                        <div className="rounded border border-slate-200 bg-white px-2 py-1">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500">Ads</div>
                          <div className="font-bold text-slate-900">{snapshot.payload.listingAds.length}</div>
                        </div>
                        <div className="rounded border border-slate-200 bg-white px-2 py-1">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500">Sponsored</div>
                          <div className="font-bold text-slate-900">{snapshot.payload.sponsoredListings.length}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500">
                        Published {String(snapshot.publishedAt || snapshot.updatedAt || '').replace('T', ' ').slice(0, 16)}
                      </div>
                      <button
                        type="button"
                        onClick={() => { void handleDeleteSingleSnapshot(snapshot.id); }}
                        className="mt-2 w-full rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                      >
                        Delete Snapshot
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-[11px] text-slate-500">
                  No published snapshots yet. Publish a locality to persist and inspect resolved payloads.
                </div>
              )}
            </div>
            )}

            {homepageCmsSubtab === 'insights' && (
            <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
              <div>
                <div className="text-xs font-bold text-slate-900">Resolved Homepage Preview</div>
                <div className="text-[10px] text-slate-500">Preview the final locality-aware payload returned by the resolver or published snapshot layer.</div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <select
                  value={resolvedPreviewDraft.localityId}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, localityId: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
                >
                  {localities.map((locality) => (
                    <option key={locality.id} value={locality.id}>{locality.name}</option>
                  ))}
                </select>
                <select
                  value={resolvedPreviewDraft.device}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, device: e.target.value as 'all' | 'mobile' | 'desktop' }))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
                >
                  <option value="all">All devices</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                </select>
                <select
                  value={resolvedPreviewDraft.pageType}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, pageType: e.target.value as 'homepage' | 'listing_results' }))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
                >
                  <option value="homepage">Homepage</option>
                  <option value="listing_results">Listing results</option>
                </select>
                <input
                  type="date"
                  value={resolvedPreviewDraft.date}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, date: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
                />
                <select
                  value={resolvedPreviewDraft.categoryId}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
                >
                  <option value="">All categories</option>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <select
                  value={resolvedPreviewDraft.subcategoryId}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
                >
                  <option value="">All subcategories</option>
                  {getSubcategoriesForCategory(resolvedPreviewDraft.categoryId || BUSINESS_CATEGORIES[0]?.id || '').map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
                <input
                  value={resolvedPreviewDraft.pincode}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="Pincode"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-mono"
                />
                <input
                  value={resolvedPreviewDraft.placementKey}
                  onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, placementKey: e.target.value }))}
                  placeholder="Placement key (optional)"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-mono"
                />
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={resolvedPreviewDraft.usePublished}
                    onChange={(e) => setResolvedPreviewDraft((prev) => ({ ...prev, usePublished: e.target.checked }))}
                  />
                  <span>Use published snapshots</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleLoadResolvedPreview}
                disabled={resolvedPreviewLoading}
                className="w-full rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {resolvedPreviewLoading ? 'Loading preview...' : 'Load Resolved Preview'}
              </button>
              <button
                type="button"
                onClick={() => { void handlePublishPreviewContext(); }}
                className="w-full rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 hover:bg-emerald-100"
              >
                Publish This Preview Context
              </button>
              {resolvedPreviewResult && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-[11px] text-slate-700 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 font-mono text-emerald-800">
                      {resolvedPreviewResult.source}
                    </span>
                    {resolvedPreviewResult.resolution?.strategy && (
                      <span className="rounded-full border border-sky-200 bg-white px-2 py-0.5 font-mono text-sky-700">
                        {resolvedPreviewResult.resolution.strategy}
                      </span>
                    )}
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-slate-600">
                      {resolvedPreviewResult.payload.template?.name || 'No template'}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-slate-600">
                      {resolvedPreviewResult.payload.context.pageType}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-slate-600">
                      {resolvedPreviewResult.payload.context.date}
                    </span>
                  </div>
                  {resolvedPreviewResult.resolution && (
                    <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[10px] text-sky-900 space-y-1">
                      <div>
                        <span className="font-bold">Resolver provenance:</span>{' '}
                        {resolvedPreviewResult.resolution.usedPublished ? 'Published snapshot served' : 'Live resolver served'}
                      </div>
                      <div className="font-mono break-all">
                        requested={resolvedPreviewResult.resolution.requestedSnapshotId}
                        {resolvedPreviewResult.resolution.snapshot?.id ? ` | served=${resolvedPreviewResult.resolution.snapshot.id}` : ''}
                        {resolvedPreviewResult.resolution.template?.id ? ` | template=${resolvedPreviewResult.resolution.template.id}` : ''}
                      </div>
                      {resolvedPreviewResult.resolution.snapshot && (
                        <div className="font-mono break-all">
                          score={resolvedPreviewResult.resolution.snapshot.score} | published={String(resolvedPreviewResult.resolution.snapshot.publishedAt || resolvedPreviewResult.resolution.snapshot.updatedAt || '').replace('T', ' ').slice(0, 16)}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-[10px] font-mono text-slate-600">
                    {[
                      `locality=${resolvedPreviewResult.payload.context.localityId}`,
                      `category=${resolvedPreviewResult.payload.context.categoryId || 'all'}`,
                      `subcategory=${resolvedPreviewResult.payload.context.subcategoryId || 'all'}`,
                      `pincode=${resolvedPreviewResult.payload.context.pincode || 'all'}`,
                      `device=${resolvedPreviewResult.payload.context.device}`,
                      `placement=${resolvedPreviewResult.payload.context.placementKey || 'default'}`,
                    ].join(' | ')}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Sections</div>
                      <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.sections.length}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Hero Banners</div>
                      <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.heroBanners.length}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Ads</div>
                      <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.listingAds.length}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Sponsored</div>
                      <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.sponsoredListings.length}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Offers</div>
                      <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.offers.length}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Content</div>
                      <div className="mt-1 font-extrabold text-slate-950">{resolvedPreviewResult.payload.contentBlocks.length}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Section Pools</div>
                      <div className="mt-1 font-extrabold text-slate-950">{Object.keys(resolvedPreviewResult.payload.sectionBusinessIdsBySection || {}).length}</div>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Section Titles</div>
                      <div className="mt-1 text-[11px] text-slate-700">
                        {resolvedPreviewResult.payload.sections.length > 0
                          ? resolvedPreviewResult.payload.sections.slice(0, 8).map((section) => section.title).join(', ')
                          : 'No sections'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Hero Titles</div>
                      <div className="mt-1 text-[11px] text-slate-700">
                        {resolvedPreviewResult.payload.heroBanners.length > 0
                          ? resolvedPreviewResult.payload.heroBanners.slice(0, 5).map((hero) => hero.title).join(', ')
                          : 'No hero banners'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Ad Titles</div>
                      <div className="mt-1 text-[11px] text-slate-700">
                        {resolvedPreviewResult.payload.listingAds.length > 0
                          ? resolvedPreviewResult.payload.listingAds.slice(0, 5).map((ad) => ad.title).join(', ')
                          : 'No ads'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Sponsored Listings</div>
                      <div className="mt-1 text-[11px] text-slate-700">
                        {resolvedPreviewResult.payload.sponsoredListings.length > 0
                          ? resolvedPreviewResult.payload.sponsoredListings.slice(0, 5).map((business) => business.name).join(', ')
                          : 'No sponsored listings'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Offers</div>
                      <div className="mt-1 text-[11px] text-slate-700">
                        {resolvedPreviewResult.payload.offers.length > 0
                          ? resolvedPreviewResult.payload.offers.slice(0, 5).map((offer) => offer.title || offer.code).join(', ')
                          : 'No offers'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Content Blocks</div>
                      <div className="mt-1 text-[11px] text-slate-700">
                        {resolvedPreviewResult.payload.contentBlocks.length > 0
                          ? resolvedPreviewResult.payload.contentBlocks.slice(0, 5).map((item) => item.title).join(', ')
                          : 'No content blocks'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 md:col-span-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Section Inventory</div>
                      <div className="mt-1 text-[11px] text-slate-700">
                        {resolvedPreviewResult.payload.sections.length > 0
                          ? resolvedPreviewResult.payload.sections.slice(0, 8).map((section) => {
                              const inventoryCount = (resolvedPreviewResult.payload.sectionBusinessIdsBySection?.[section.id] || []).length;
                              return `${section.title}: ${inventoryCount}`;
                            }).join(' | ')
                          : 'No sections'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {['templates', 'assignments', 'campaigns'].includes(homepageCmsSubtab) && (
            <div className="grid gap-4 xl:grid-cols-1">
              {homepageCmsSubtab === 'templates' && (
              <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Templates</div>
                    <div className="text-[10px] text-slate-500">Reusable homepage structures assigned by locality and context.</div>
                  </div>
                  <button
                    type="button"
                    onClick={resetTemplateDraft}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700"
                  >
                    New
                  </button>
                </div>
                <div className="space-y-2 text-[11px]">
                  <input
                    value={templateDraft.name}
                    onChange={(e) => setTemplateDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Template name"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={templateDraft.templateScope}
                      onChange={(e) => setTemplateDraft((prev) => ({ ...prev, templateScope: e.target.value as ScalableHomepageTemplate['templateScope'] }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="global">Global</option>
                      <option value="city">City</option>
                      <option value="locality">Locality</option>
                    </select>
                    <input
                      value={templateDraft.priority}
                      onChange={(e) => setTemplateDraft((prev) => ({ ...prev, priority: e.target.value }))}
                      placeholder="Priority"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    />
                  </div>
                  <OrderedSelectionPicker
                    label="Template localities"
                    selectedIds={parseIdList(templateDraft.localityIds)}
                    options={localitySelectionOptions}
                    onChange={(nextIds) => setTemplateDraft((prev) => ({ ...prev, localityIds: nextIds.join(', ') }))}
                    helperText="Choose where this template can resolve directly before assignment-level overrides are applied."
                    emptyText="No locality restrictions selected. Global templates can stay broad, but locality/city templates should normally pick at least one locality."
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={templateDraft.status}
                      onChange={(e) => setTemplateDraft((prev) => ({ ...prev, status: e.target.value as ScalableHomepageTemplate['status'] }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={templateDraft.isDefault}
                        onChange={(e) => setTemplateDraft((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      />
                      <span>Default fallback</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={templateDraft.isFallback}
                        onChange={(e) => setTemplateDraft((prev) => ({ ...prev, isFallback: e.target.checked }))}
                      />
                      <span>Fallback</span>
                    </label>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">
                    Default fallback is used only when no assignment, locality, city, or global targeted template matches. Only one active default template is allowed at a time.
                  </div>
                  {activeDefaultTemplate && (
                    <div className="text-[10px] text-slate-500">
                      Current active default: <span className="font-semibold text-slate-700">{activeDefaultTemplate.name}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveTemplateDraft}
                      className="flex-1 rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700"
                    >
                      {templateDraft.id ? 'Update Template' : 'Create Template'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncTemplateSectionsFromLocality}
                      disabled={!templateDraft.id}
                      className="flex-1 rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 disabled:opacity-40"
                    >
                      Sync Sections
                    </button>
                  </div>
                  {selectedScalableTemplate && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-900">
                      Active template selected. Use the homepage section form below to add a section directly into this scalable template, or edit its sections in the template section editor.
                    </div>
                  )}
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {sortedScalableTemplates.slice(0, 20).map((template) => (
                    <div key={template.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-800">{template.name}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getScalableEntityOwnershipPresentation(template.metadata).className}`}>
                              {getScalableEntityOwnershipPresentation(template.metadata).label}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">{template.status}</span>
                            {template.isDefault && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Default</span>}
                            {template.isFallback && <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Fallback</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">{template.templateScope} • priority {template.priority} • {template.sections.length} sections</div>
                          <div className="text-[10px] text-slate-500">Source: {getScalableEntityOwnershipPresentation(template.metadata).detail}</div>
                          {template.localityIds.length > 0 && (
                            <div className="text-[10px] text-slate-500">
                              Localities: {template.localityIds.slice(0, 3).map((localityId) => formatLocalityLabel(localityId)).join(', ')}{template.localityIds.length > 3 ? ` +${template.localityIds.length - 3} more` : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
                          {isLegacyManagedScalableEntity(template.metadata) && (
                            <button type="button" onClick={() => { void handleDetachTemplateFromLegacySync(template); }} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Detach</button>
                          )}
                          <button type="button" onClick={() => beginEditTemplate(template)} className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700">Edit</button>
                          <button type="button" onClick={() => handleDeleteTemplate(template.id)} className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedScalableTemplate && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Template Sections</div>
                        <div className="text-[10px] text-slate-500">Direct section authoring for the selected scalable template.</div>
                      </div>
                      <span className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-mono text-emerald-800">
                        {selectedScalableTemplateSections.length} sections
                      </span>
                    </div>
                    <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                      {selectedScalableTemplateSections.map((section, index) => renderEditableHomepageSectionCard(section, index, {
                        onMoveUp: () => { void handleMoveScalableTemplateSection(section.id, 'up'); },
                        onMoveDown: () => { void handleMoveScalableTemplateSection(section.id, 'down'); },
                        onDuplicate: () => { void handleDuplicateScalableTemplateSection(section.id); },
                        onDelete: () => { void handleDeleteScalableTemplateSection(section.id); },
                        onUpdate: (patch) => updateScalableTemplateSection(section, patch),
                      }))}
                      {selectedScalableTemplateSections.length === 0 && (
                        <div className="text-xs text-slate-400">No sections authored directly on this template yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}

              {homepageCmsSubtab === 'assignments' && (
              <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Assignments</div>
                    <div className="text-[10px] text-slate-500">Map templates to locality, category, subcategory, and pincode context.</div>
                  </div>
                  <button
                    type="button"
                    onClick={resetAssignmentDraft}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700"
                  >
                    New
                  </button>
                </div>
                <div className="space-y-2 text-[11px]">
                  <select
                    value={assignmentDraft.localityId}
                    onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, localityId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    {localities.map((locality) => (
                      <option key={locality.id} value={locality.id}>{locality.name}</option>
                    ))}
                  </select>
                  <select
                    value={assignmentDraft.templateId}
                    onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, templateId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <option value="">Select template</option>
                    {sortedScalableTemplates.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={assignmentDraft.categoryId}
                      onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="">All categories</option>
                      {BUSINESS_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <select
                      value={assignmentDraft.subcategoryId}
                      onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="">All subcategories</option>
                      {getSubcategoriesForCategory(assignmentDraft.categoryId || BUSINESS_CATEGORIES[0]?.id || '').map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={assignmentDraft.pincode}
                      onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="Pincode"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono"
                    />
                    <input
                      value={assignmentDraft.priority}
                      onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, priority: e.target.value }))}
                      placeholder="Priority"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={assignmentDraft.status}
                      onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, status: e.target.value as ScalableHomepageAssignment['status'] }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={assignmentDraft.isFallback}
                        onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, isFallback: e.target.checked }))}
                      />
                      <span>Fallback</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAssignmentDraft}
                    className="w-full rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700"
                  >
                    {assignmentDraft.id ? 'Update Assignment' : 'Create Assignment'}
                  </button>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {sortedScalableAssignments.slice(0, 20).map((assignment) => (
                    <div key={assignment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500">{formatLocalityLabel(assignment.localityId)} mapped to {templateNameById.get(assignment.templateId) || assignment.templateId}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getScalableEntityOwnershipPresentation(assignment.metadata).className}`}>
                              {getScalableEntityOwnershipPresentation(assignment.metadata).label}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">{assignment.status}</span>
                            {assignment.isFallback && <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Fallback</span>}
                          </div>
                          <div className="truncate font-semibold text-slate-800">{assignment.localityId} → {assignment.templateId}</div>
                          <div className="text-[10px] text-slate-500">{assignment.categoryId || 'all'} / {assignment.subcategoryId || 'all'} / {assignment.pincode || 'all'} • priority {assignment.priority}</div>
                          <div className="text-[10px] text-slate-500">Source: {getScalableEntityOwnershipPresentation(assignment.metadata).detail}</div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
                          {isLegacyManagedScalableEntity(assignment.metadata) && (
                            <button type="button" onClick={() => { void handleDetachAssignmentFromLegacySync(assignment); }} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Detach</button>
                          )}
                          <button type="button" onClick={() => beginEditAssignment(assignment)} className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700">Edit</button>
                          <button type="button" onClick={() => handleDeleteAssignment(assignment.id)} className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {homepageCmsSubtab === 'campaigns' && (
              <div className="rounded-xl border border-emerald-100 bg-white p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Campaigns</div>
                    <div className="text-[10px] text-slate-500">Manage hero, ads, offers, sponsored listings, and content targeting.</div>
                  </div>
                  <button
                    type="button"
                    onClick={resetCampaignDraft}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700"
                  >
                    New
                  </button>
                </div>
                <div className="space-y-2 text-[11px]">
                  <input
                    value={campaignDraft.name}
                    onChange={(e) => setCampaignDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Campaign name"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={campaignDraft.campaignType}
                      onChange={(e) => setCampaignDraft((prev) => ({ ...prev, campaignType: e.target.value as ScalableCampaignType }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="hero_banner">Hero banner</option>
                      <option value="listing_ad">Listing ad</option>
                      <option value="sponsored_listing">Sponsored listing</option>
                      <option value="offer">Offer</option>
                      <option value="content_block">Content block</option>
                    </select>
                    <input
                      value={campaignDraft.priority}
                      onChange={(e) => setCampaignDraft((prev) => ({ ...prev, priority: e.target.value }))}
                      placeholder="Priority"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={campaignDraft.startDate} onChange={(e) => setCampaignDraft((prev) => ({ ...prev, startDate: e.target.value }))} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
                    <input type="date" value={campaignDraft.endDate} onChange={(e) => setCampaignDraft((prev) => ({ ...prev, endDate: e.target.value }))} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={campaignDraft.status}
                      onChange={(e) => setCampaignDraft((prev) => ({ ...prev, status: e.target.value as ScalableCampaign['status'] }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                    <select
                      value={campaignDraft.deviceTarget}
                      onChange={(e) => setCampaignDraft((prev) => ({ ...prev, deviceTarget: e.target.value as NonNullable<ListingAd['deviceTarget']> }))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="all">All devices</option>
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                    </select>
                  </div>
                  <OrderedSelectionPicker
                    label="Placement keys"
                    selectedIds={parseIdList(campaignDraft.placementKeys)}
                    options={placementKeySelectionOptions}
                    onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, placementKeys: nextIds.join(', ') }))}
                    helperText="Limit the campaign to one or more resolver placement keys when needed."
                    emptyText="No placement keys selected. The campaign can resolve anywhere else the targeting rules match."
                  />
                  <OrderedSelectionPicker
                    label="Target localities"
                    selectedIds={parseIdList(campaignDraft.localityIds)}
                    options={localitySelectionOptions}
                    onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, localityIds: nextIds.join(', ') }))}
                    helperText="Pick the localities this campaign should serve."
                    emptyText="No locality restrictions selected yet."
                  />
                  <OrderedCategoryPicker
                    label="Target categories"
                    selectedIds={parseIdList(campaignDraft.categoryIds)}
                    onChange={(nextIds) => setCampaignDraft((prev) => ({
                      ...prev,
                      categoryIds: nextIds.join(', '),
                      subcategoryIds: parseIdList(prev.subcategoryIds)
                        .filter((subcategoryId) => {
                          const subcategory = getSubcategoryById(subcategoryId);
                          return subcategory ? nextIds.includes(subcategory.categoryId) : false;
                        })
                        .join(', '),
                    }))}
                    helperText="Category targeting can be broad or ordered. Any selected subcategory must belong to one of these categories."
                  />
                  <OrderedSelectionPicker
                    label="Target subcategories"
                    selectedIds={parseIdList(campaignDraft.subcategoryIds)}
                    options={subcategorySelectionOptions}
                    onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, subcategoryIds: nextIds.join(', ') }))}
                    helperText="Refine campaign delivery to specific subcategories within the selected category scope."
                    emptyText="No subcategories selected. The campaign will apply at the category or locality level instead."
                  />
                  <input value={campaignDraft.pincodes} onChange={(e) => setCampaignDraft((prev) => ({ ...prev, pincodes: e.target.value }))} placeholder="Pincodes" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono" />
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Guided Payload Fields</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={campaignDraft.payloadTitle}
                        onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTitle: e.target.value }))}
                        placeholder="Payload title"
                        className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                      />
                      <input
                        value={campaignDraft.payloadImageUrl}
                        onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadImageUrl: e.target.value }))}
                        placeholder="Image URL"
                        className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                      />
                    </div>
                    {(campaignDraft.campaignType === 'hero_banner' || campaignDraft.campaignType === 'listing_ad' || campaignDraft.campaignType === 'offer') && (
                      <textarea
                        value={campaignDraft.payloadDescription}
                        onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadDescription: e.target.value }))}
                        placeholder={campaignDraft.campaignType === 'hero_banner' ? 'Hero subtitle/summary' : 'Description'}
                        rows={2}
                        className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2"
                      />
                    )}
                    {campaignDraft.campaignType === 'hero_banner' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={campaignDraft.payloadSubtitle}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadSubtitle: e.target.value }))}
                          placeholder="Hero subtitle"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                        <input
                          value={campaignDraft.payloadCtaLabel}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCtaLabel: e.target.value }))}
                          placeholder="CTA label"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                      </div>
                    )}
                    {(campaignDraft.campaignType === 'hero_banner' || campaignDraft.campaignType === 'listing_ad') && (
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={campaignDraft.payloadActionType}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadActionType: e.target.value as 'landing_page' | 'landing_listing' | 'lead_form' | 'search_category' }))}
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        >
                          <option value="landing_page">Landing Page</option>
                          <option value="landing_listing">Landing Listing</option>
                          <option value="lead_form">Lead Form</option>
                          {campaignDraft.campaignType === 'hero_banner' && <option value="search_category">Search Category</option>}
                        </select>
                        <input
                          value={campaignDraft.payloadTargetUrl}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTargetUrl: e.target.value }))}
                          placeholder="CTA / target URL"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                      </div>
                    )}
                    {campaignDraft.campaignType === 'listing_ad' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={campaignDraft.payloadBadge}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadBadge: e.target.value }))}
                          placeholder="Badge"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                        <input
                          value={campaignDraft.payloadCtaText}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCtaText: e.target.value }))}
                          placeholder="CTA text"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                        <input
                          value={campaignDraft.payloadBackgroundColor}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadBackgroundColor: e.target.value }))}
                          placeholder="Background color"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono"
                        />
                        <input
                          value={campaignDraft.payloadTargetBusinessId}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTargetBusinessId: e.target.value }))}
                          placeholder="Target business ID"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono"
                        />
                      </div>
                    )}
                    {campaignDraft.campaignType === 'offer' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={campaignDraft.payloadCode}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCode: e.target.value }))}
                          placeholder="Offer code"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                        <input
                          value={campaignDraft.payloadDiscount}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadDiscount: e.target.value }))}
                          placeholder="Discount label"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                        <input
                          value={campaignDraft.payloadTargetBusinessId}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadTargetBusinessId: e.target.value }))}
                          placeholder="Business ID"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2 font-mono"
                        />
                        <input
                          value={campaignDraft.payloadCtaText}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadCtaText: e.target.value }))}
                          placeholder="CTA text"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                      </div>
                    )}
                    {campaignDraft.campaignType === 'sponsored_listing' && (
                      <div className="space-y-2">
                        <OrderedSelectionPicker
                          label="Sponsored businesses"
                          selectedIds={parseIdList(campaignDraft.payloadBusinessIds)}
                          options={approvedBusinessSelectionOptions}
                          onChange={(nextIds) => setCampaignDraft((prev) => ({ ...prev, payloadBusinessIds: nextIds.join(', ') }))}
                          helperText="Choose the businesses to pin into this sponsored listing campaign."
                          emptyText="No sponsored businesses selected yet."
                        />
                        <input
                          value={campaignDraft.payloadDescription}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadDescription: e.target.value }))}
                          placeholder="Description"
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                      </div>
                    )}
                    {campaignDraft.campaignType === 'content_block' && (
                      <>
                        <input
                          value={campaignDraft.payloadAuthorName}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadAuthorName: e.target.value }))}
                          placeholder="Author name"
                          className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                        <textarea
                          value={campaignDraft.payloadContent}
                          onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadContent: e.target.value }))}
                          placeholder="Content"
                          rows={3}
                          className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        />
                      </>
                    )}
                  </div>
                  <textarea
                    value={campaignDraft.payloadText}
                    onChange={(e) => setCampaignDraft((prev) => ({ ...prev, payloadText: e.target.value }))}
                    rows={7}
                    placeholder="Campaign payload JSON"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono"
                  />
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={campaignDraft.isFallback}
                      onChange={(e) => setCampaignDraft((prev) => ({ ...prev, isFallback: e.target.checked }))}
                    />
                    <span>Fallback campaign</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveCampaignDraft}
                    className="w-full rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700"
                  >
                    {campaignDraft.id ? 'Update Campaign' : 'Create Campaign'}
                  </button>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {sortedScalableCampaigns.slice(0, 20).map((campaign) => (
                    <div key={campaign.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-800">{campaign.name}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getScalableEntityOwnershipPresentation(campaign.metadata).className}`}>
                              {getScalableEntityOwnershipPresentation(campaign.metadata).label}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">{campaign.status}</span>
                            {campaign.isFallback && <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Fallback</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">{campaign.campaignType} • {campaign.status} • priority {campaign.priority}</div>
                          <div className="text-[10px] text-slate-500">Source: {getScalableEntityOwnershipPresentation(campaign.metadata).detail}</div>
                          <div className="text-[10px] text-slate-500">
                            Targets: {(campaign.targets.localityIds || []).slice(0, 2).map((localityId) => formatLocalityLabel(localityId)).join(', ') || 'all localities'}{(campaign.targets.localityIds || []).length > 2 ? ` +${(campaign.targets.localityIds || []).length - 2} more` : ''}{(campaign.placementKeys || []).length > 0 ? ` | placements: ${(campaign.placementKeys || []).slice(0, 2).join(', ')}${(campaign.placementKeys || []).length > 2 ? ` +${(campaign.placementKeys || []).length - 2}` : ''}` : ''}
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
                          {isLegacyManagedScalableEntity(campaign.metadata) && (
                            <button type="button" onClick={() => { void handleDetachCampaignFromLegacySync(campaign); }} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Detach</button>
                          )}
                          <button type="button" onClick={() => beginEditCampaign(campaign)} className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700">Edit</button>
                          <button type="button" onClick={() => handleDeleteCampaign(campaign.id)} className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
            )}
          </div>
          )}
        </div>}

        {operationsSection === 'campaigns' && campaignWorkspaceSubtab === 'offers' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Offers & Deals Manager</h3>
          <form onSubmit={handleCreateCouponSubmit} className="space-y-3 text-xs">
            <select
              value={couponBusinessId}
              onChange={(e) => setCouponBusinessId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">Select business</option>
              {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
            <input
              value={couponTitle}
              onChange={(e) => setCouponTitle(e.target.value)}
              placeholder="Offer title"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(e.target.value)}
                placeholder="Discount label"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <textarea
              value={couponDescription}
              onChange={(e) => setCouponDescription(e.target.value)}
              placeholder="Offer description"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={couponLocalityId}
                onChange={(e) => setCouponLocalityId(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                {localities.map((locality) => (
                  <option key={locality.id} value={locality.id}>{locality.name}</option>
                ))}
              </select>
              <input
                value={couponPincodes}
                onChange={(e) => setCouponPincodes(e.target.value)}
                placeholder="Pincodes"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={couponStartDate}
                onChange={(e) => setCouponStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                type="date"
                value={couponEndDate}
                onChange={(e) => setCouponEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
              {couponEditId ? 'Update Offer' : 'Create Offer'}
            </button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredCoupons.map((coupon) => (
              <div key={coupon.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                <span className="block font-semibold text-slate-800 truncate">{coupon.title || coupon.code}</span>
                <span className="block text-[10px] text-slate-500">
                  {businesses.find((business) => business.id === coupon.businessId)?.name || coupon.businessId}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">
                  {(coupon.startDate || coupon.expiryDate)} {'->'} {(coupon.endDate || coupon.expiryDate)}
                </span>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => beginEditCoupon(coupon)}
                    className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCoupon?.(coupon.id);
                      if (couponEditId === coupon.id) {
                        resetCouponForm();
                      }
                      triggerNotification('Offer deleted successfully.');
                    }}
                    className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {coupons.length === 0 && <div className="text-xs text-slate-400">No offers created yet.</div>}
          </div>
        </div>}

        {operationsSection === 'content' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-950">Updates Feed Manager</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Create and manage locality-specific updates for the homepage updates feed. Choose a locality in the shared filter bar first.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
              {filteredCommunityItems.length} items
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={communityTypeFilter}
              onChange={(e) => setCommunityTypeFilter(e.target.value as typeof communityTypeFilter)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All types</option>
              <option value="post">Post</option>
              <option value="event">Event</option>
              <option value="deal">Deal</option>
              <option value="recommendation">Recommendation</option>
              <option value="qa">Q&amp;A</option>
            </select>
            <select
              value={communityStatusFilter}
              onChange={(e) => setCommunityStatusFilter(e.target.value as typeof communityStatusFilter)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <input
              type="date"
              value={communityDateFilter}
              onChange={(e) => setCommunityDateFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                setCommunityTypeFilter('all');
                setCommunityStatusFilter('all');
                setCommunityDateFilter('');
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700"
            >
              Clear Filters
            </button>
          </div>
          <form onSubmit={handleCreateCommunityItemSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={communityDraft.type || 'post'}
                onChange={(e) => setCommunityDraft((prev) => ({ ...prev, type: e.target.value as CommunityItem['type'] }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="post">Post</option>
                <option value="event">Event</option>
                <option value="deal">Deal</option>
                <option value="recommendation">Recommendation</option>
                <option value="qa">Q&A</option>
              </select>
              <input
                value={communityDraft.authorName || ''}
                onChange={(e) => setCommunityDraft((prev) => ({ ...prev, authorName: e.target.value }))}
                placeholder="Author"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={communityDraft.status || 'published'}
                onChange={(e) => setCommunityDraft((prev) => ({ ...prev, status: e.target.value as NonNullable<CommunityItem['status']> }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <input
                type="date"
                value={(communityDraft.publishAt || '').slice(0, 10)}
                onChange={(e) => setCommunityDraft((prev) => ({ ...prev, publishAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </div>
            <input
              type="date"
              value={(communityDraft.expireAt || '').slice(0, 10)}
              onChange={(e) => setCommunityDraft((prev) => ({ ...prev, expireAt: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <div className="space-y-2 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Image</span>
                {communityImageUploading && <span className="text-[10px] font-semibold text-indigo-600">Uploading...</span>}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCommunityImageFile(e.target.files?.[0] || null)}
                className="w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-indigo-700"
              />
              <input
                value={communityImageUrl}
                onChange={(e) => setCommunityImageUrl(e.target.value)}
                placeholder="Or paste an image URL"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              />
              {(communityImageFile || communityImageUrl) && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img
                    src={communityImageFile ? URL.createObjectURL(communityImageFile) : communityImageUrl}
                    alt="Community update preview"
                    className="h-28 w-full object-cover"
                  />
                </div>
              )}
            </div>
            <input
              value={communityDraft.businessId || ''}
              onChange={(e) => setCommunityDraft((prev) => ({ ...prev, businessId: e.target.value }))}
              placeholder="Optional business ID"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <input
              value={communityDraft.title || ''}
              onChange={(e) => setCommunityDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Update title"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <textarea
              value={communityDraft.content || ''}
              onChange={(e) => setCommunityDraft((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Update content"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700">
              Create Locality Update
            </button>
            {communityFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{communityFormError}</div>}
          </form>
          {communityEditDraft && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900">Edit locality update</div>
                  <div className="text-[10px] text-slate-500">Update the content, status, and schedule for the selected item.</div>
                </div>
                <button
                  type="button"
                  onClick={cancelEditCommunityItem}
                  className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-700 border border-slate-200"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={communityEditDraft.type}
                  onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, type: e.target.value as CommunityItem['type'] }) : prev)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <option value="post">Post</option>
                  <option value="event">Event</option>
                  <option value="deal">Deal</option>
                  <option value="recommendation">Recommendation</option>
                  <option value="qa">Q&amp;A</option>
                </select>
                <select
                  value={communityEditDraft.status || 'published'}
                  onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, status: e.target.value as NonNullable<CommunityItem['status']> }) : prev)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <input
                value={communityEditDraft.title}
                onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, title: e.target.value }) : prev)}
                placeholder="Update title"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <textarea
                value={communityEditDraft.content}
                onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, content: e.target.value }) : prev)}
                placeholder="Update content"
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={(communityEditDraft.publishAt || '').slice(0, 10)}
                  onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, publishAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined }) : prev)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                />
                <input
                  type="date"
                  value={(communityEditDraft.expireAt || '').slice(0, 10)}
                  onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, expireAt: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined }) : prev)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                />
              </div>
              <div className="space-y-2 rounded-lg border border-dashed border-indigo-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Image</span>
                  {communityEditImageUploading && <span className="text-[10px] font-semibold text-indigo-600">Uploading...</span>}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCommunityEditImageFile(e.target.files?.[0] || null)}
                  className="w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-indigo-700"
                />
                <input
                  value={communityEditImageUrl}
                  onChange={(e) => setCommunityEditImageUrl(e.target.value)}
                  placeholder="Or paste an image URL"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                />
                {(communityEditImageFile || communityEditImageUrl) && (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      src={communityEditImageFile ? URL.createObjectURL(communityEditImageFile) : communityEditImageUrl}
                      alt="Community update preview"
                      className="h-28 w-full object-cover"
                    />
                  </div>
                )}
              </div>
              <input
                value={communityEditDraft.authorName || ''}
                onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, authorName: e.target.value }) : prev)}
                placeholder="Author"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <div className="space-y-2 rounded-lg border border-dashed border-indigo-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Image</span>
                  {communityEditImageUploading && <span className="text-[10px] font-semibold text-indigo-600">Uploading...</span>}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCommunityEditImageFile(e.target.files?.[0] || null)}
                  className="w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-indigo-700"
                />
                <input
                  value={communityEditImageUrl}
                  onChange={(e) => setCommunityEditImageUrl(e.target.value)}
                  placeholder="Or paste an image URL"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                />
                {(communityEditImageFile || communityEditImageUrl) && (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      src={communityEditImageFile ? URL.createObjectURL(communityEditImageFile) : communityEditImageUrl}
                      alt="Community update preview"
                      className="h-28 w-full object-cover"
                    />
                  </div>
                )}
              </div>
              <input
                value={communityEditDraft.businessId || ''}
                onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, businessId: e.target.value }) : prev)}
                placeholder="Optional business ID"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] text-slate-500">
                  {localities.find((locality) => locality.id === communityEditDraft.localityId)?.name || communityEditDraft.localityId}
                </div>
                <button
                  type="button"
                  onClick={saveEditCommunityItem}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white"
                >
                  Save Changes
                </button>
              </div>
              {communityEditError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{communityEditError}</div>}
            </div>
          )}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredCommunityItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="mb-2 h-24 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="font-bold text-slate-900 truncate">{item.title}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {localities.find((locality) => locality.id === item.localityId)?.name || item.localityId} • {item.type}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {(item.status || 'published').toUpperCase()} • {(item.publishAt || item.createdAt).slice(0, 10)}
                      {item.expireAt ? ` • Ends ${item.expireAt.slice(0, 10)}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 line-clamp-2">{item.content}</div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => beginEditCommunityItem(item)}
                      className="rounded bg-white px-2 py-1 text-[10px] font-bold text-indigo-700 border border-indigo-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCommunityItem?.(item.id)}
                      className="rounded bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCommunityItems.length === 0 && (
              <div className="text-xs text-slate-400">No locality updates found for the current filters.</div>
            )}
          </div>
        </div>}

        {operationsSection === 'campaigns' && campaignWorkspaceSubtab === 'ads' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Ad Banner Manager</h3>
          <form onSubmit={handleCreateListingAdSubmit} className="space-y-3 text-xs">
            <input
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
              placeholder="Ad title"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <textarea
              value={adDescription}
              onChange={(e) => setAdDescription(e.target.value)}
              placeholder="Ad description"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={adBadge}
                onChange={(e) => setAdBadge(e.target.value)}
                placeholder="Badge"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                value={adCtaText}
                onChange={(e) => setAdCtaText(e.target.value)}
                placeholder="CTA text"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={adStartDate}
                onChange={(e) => setAdStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                type="date"
                value={adEndDate}
                onChange={(e) => setAdEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={adActionType}
                onChange={(e) => setAdActionType(e.target.value as ListingAd['actionType'])}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="landing_page">Landing Page</option>
                <option value="landing_listing">Landing Listing</option>
                <option value="lead_form">Lead Generation Form</option>
              </select>
              <input
                type="color"
                value={adBgColor}
                onChange={(e) => setAdBgColor(e.target.value)}
                className="border border-slate-200 rounded-lg h-9 w-full bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={adLocalityId}
                onChange={(e) => setAdLocalityId(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                {localities.map((locality) => (
                  <option key={locality.id} value={locality.id}>{locality.name}</option>
                ))}
              </select>
              <input
                value={adPlacementKey}
                onChange={(e) => setAdPlacementKey(e.target.value)}
                placeholder="Placement key"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <OrderedCategoryPicker
              label="Ad category targeting"
              selectedIds={adCategoryIds}
              onChange={setAdCategoryIds}
              helperText="Add categories this ad should match on search results. Leave empty to allow all categories."
            />
            <input
              value={adTags}
              onChange={(e) => setAdTags(e.target.value)}
              placeholder="Target tags, comma separated (pickle, food, salon)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                value={adImageUrl}
                onChange={(e) => setAdImageUrl(e.target.value)}
                placeholder="Banner image URL (optional if uploading)"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 md:col-span-2"
              />
              <select
                value={adDeviceTarget}
                onChange={(e) => setAdDeviceTarget(e.target.value as NonNullable<ListingAd['deviceTarget']>)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="all">Desktop + Mobile</option>
                <option value="desktop">Desktop Only</option>
                <option value="mobile">Mobile Only</option>
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
              <div className="font-semibold text-slate-700">Upload ad image</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAdImageFile(e.target.files?.[0] || null)}
                className="mt-2 block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-indigo-700"
              />
              <div className="mt-1 text-[10px] text-slate-500">
                Uploads to <span className="font-mono">{getListingAdFolder()}</span>
              </div>
            </div>
            {adDeviceTarget !== 'desktop' && (
              <input
                value={adMobileRowPosition}
                onChange={(e) => setAdMobileRowPosition(e.target.value.replace(/\D/g, ''))}
                placeholder="Mobile row position (after section row)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            )}
            <input
              value={adPincodes}
              onChange={(e) => setAdPincodes(e.target.value)}
              placeholder="Target pincodes"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
            />
            {adActionType === 'landing_page' && (
              <input
                type="url"
                value={adTargetUrl}
                onChange={(e) => setAdTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            )}
            {adActionType === 'landing_listing' && (
              <select
                value={adTargetBusinessId}
                onChange={(e) => setAdTargetBusinessId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="">Select target listing</option>
                {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            )}
            <select
              value={adSellerBusinessId}
              onChange={(e) => setAdSellerBusinessId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">No seller mapping (platform only)</option>
              {filteredBusinesses.filter((business) => business.status === 'approved').map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={adImageUploading}
              className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adImageUploading ? 'Uploading...' : (adEditId ? 'Update Ad Banner' : 'Create Ad Banner')}
            </button>
            {adFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{adFormError}</div>}
            {adEditId && (
              <button
                type="button"
                onClick={resetListingAdForm}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredListingAds.map((ad) => (
              <div key={ad.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-semibold text-slate-800 truncate">{ad.title}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{ad.startDate} → {ad.endDate}</span>
                    <span className="block text-[10px] text-slate-500">
                      {(ad.localityIds || []).join(', ') || 'All localities'} • {ad.placementKey || 'homepage_inline_primary'}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {ad.deviceTarget || 'all'}{ad.mobileRowPosition ? ` • mobile row ${ad.mobileRowPosition}` : ''}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Categories: {(ad.categoryIds || []).map((categoryId) => getCategoryById(categoryId)?.name || categoryId).join(', ') || 'All'} | Tags: {(ad.tags || []).join(', ') || 'Any'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => beginEditListingAd(ad)}
                      className="text-[10px] px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateListingAd?.({ ...ad, isActive: !ad.isActive })}
                      className={`text-[10px] px-2 py-1 rounded ${ad.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {ad.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteListingAd?.(ad.id)}
                      className="text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <select
                    value={ad.deviceTarget || 'all'}
                    onChange={(e) => {
                      const nextTarget = e.target.value as NonNullable<ListingAd['deviceTarget']>;
                      onUpdateListingAd?.({
                        ...ad,
                        deviceTarget: nextTarget,
                        mobileRowPosition: nextTarget === 'desktop' ? undefined : (ad.mobileRowPosition || 3)
                      });
                    }}
                    className="border border-slate-200 rounded px-2 py-1.5 bg-white text-[11px]"
                  >
                    <option value="all">Desktop + Mobile</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                  {(ad.deviceTarget || 'all') !== 'desktop' && (
                    <input
                      value={String(ad.mobileRowPosition || '')}
                      onChange={(e) => onUpdateListingAd?.({ ...ad, mobileRowPosition: Number(e.target.value.replace(/\D/g, '')) || undefined })}
                      placeholder="Mobile row"
                      className="border border-slate-200 rounded px-2 py-1.5 bg-white text-[11px]"
                    />
                  )}
                </div>
              </div>
            ))}
            {listingAds.length === 0 && <div className="text-xs text-slate-400">No ads created yet.</div>}
          </div>
        </div>}

        {operationsSection === 'homepage' && homepageCmsSubtab === 'hero' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Hero Banner Manager</h3>
          <form onSubmit={handleCreateHeroBannerSubmit} className="space-y-3 text-xs">
            <select
              value={heroLocalityId}
              onChange={(e) => setHeroLocalityId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>
            <input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Hero title"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Hero subtitle"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <input
              type="url"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="Hero image URL (optional if uploading)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
              <div className="font-semibold text-slate-700">Upload hero image</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)}
                className="mt-2 block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-indigo-700"
              />
              <div className="mt-1 text-[10px] text-slate-500">
                Uploads to <span className="font-mono">{getHeroBannerFolder()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={heroStartDate}
                onChange={(e) => setHeroStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <input
                type="date"
                value={heroEndDate}
                onChange={(e) => setHeroEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={heroCtaLabel}
                onChange={(e) => setHeroCtaLabel(e.target.value)}
                placeholder="CTA label"
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              />
              <select
                value={heroCtaType}
                onChange={(e) => setHeroCtaType(e.target.value as NonNullable<HeroBanner['ctaType']>)}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
              >
                <option value="landing_page">Landing Page</option>
                <option value="landing_listing">Landing Listing</option>
                <option value="lead_form">Lead Form</option>
                <option value="search_category">Search Category</option>
              </select>
            </div>
            <input
              value={heroCtaTarget}
              onChange={(e) => setHeroCtaTarget(e.target.value)}
              placeholder="CTA target"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            />
            <input
              value={heroPincodes}
              onChange={(e) => setHeroPincodes(e.target.value)}
              placeholder="Target pincodes"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
            />
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-800">Hero stat cards</div>
                  <div className="text-[10px] text-slate-500">Toggle each card and target it by locality or pincode.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setHeroStatsDraft((prev) => prev.map((stat) => ({ ...stat, enabled: !stat.enabled })))}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700"
                >
                  Toggle all
                </button>
              </div>
              <div className="space-y-2">
                {heroStatsDraft.map((stat, index) => (
                  <div key={`hero-stat-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={stat.enabled}
                          onChange={() => setHeroStatsDraft((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: !item.enabled } : item))}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        Card {index + 1}
                      </label>
                      <span className="text-[10px] text-slate-500">{stat.enabled ? 'Visible' : 'Hidden'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={stat.value}
                        onChange={(e) => setHeroStatsDraft((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item))}
                        placeholder="Value"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      />
                      <input
                        value={stat.label}
                        onChange={(e) => setHeroStatsDraft((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item))}
                        placeholder="Label"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={stat.localityIds}
                        onChange={(e) => setHeroStatsDraft((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, localityIds: e.target.value } : item))}
                        placeholder="Locality IDs"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                      />
                      <input
                        value={stat.pincodes}
                        onChange={(e) => setHeroStatsDraft((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, pincodes: e.target.value } : item))}
                        placeholder="Pincodes"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={heroImageUploading}
              className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {heroImageUploading ? 'Uploading...' : (heroEditId ? 'Update Hero Banner' : 'Create Hero Banner')}
            </button>
            {heroFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{heroFormError}</div>}
            {heroEditId && (
              <button
                type="button"
                onClick={resetHeroBannerForm}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredHeroBanners.map((hero) => (
              <div key={hero.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-semibold text-slate-800 truncate">{hero.title}</span>
                    <span className="block text-[10px] text-slate-500">{localities.find((locality) => locality.id === hero.localityId)?.name || hero.localityId}</span>
                    <span className="block text-[10px] text-slate-500">
                      {hero.ctaLabel || 'No CTA'} • {(hero.pincodes || []).join(', ') || 'All pincodes'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => beginEditHeroBanner(hero)}
                      className="text-[10px] px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateHeroBanner?.({ ...hero, isActive: !hero.isActive })}
                      className={`text-[10px] px-2 py-1 rounded ${hero.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {hero.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHeroBanner?.(hero.id)}
                      className="text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {heroBanners.length === 0 && <div className="text-xs text-slate-400">No hero banners configured.</div>}
          </div>
        </div>}

        {operationsSection === 'campaigns' && campaignWorkspaceSubtab === 'leads' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-base font-extrabold text-slate-950">Ad Lead Inbox</h3>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {adLeads.length === 0 ? (
              <div className="text-xs text-slate-400">No ad leads submitted yet.</div>
            ) : (
              filteredAdLeads.slice(0, 50).map((lead) => (
                <div key={lead.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{lead.name}</span>
                    <span className="font-mono text-slate-500">{lead.pincode}</span>
                  </div>
                  <div className="text-slate-600 font-mono">{lead.mobile}</div>
                  <div className="text-[10px] text-slate-400">
                    Seller: {lead.sellerBusinessId || 'Platform'} • {new Date(lead.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>}

        {operationsSection === 'geography' && geographyWorkspaceSubtab === 'links' && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-950">Locality + Category URL Mapper</h3>
          <form onSubmit={handleCreateLocalityCategoryLinkSubmit} className="space-y-3 text-xs">
            <select
              value={linkLocalityId}
              onChange={(e) => setLinkLocalityId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>
            <select
              value={linkCategoryId}
              onChange={(e) => setLinkCategoryId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={linkSubcategoryId}
              onChange={(e) => setLinkSubcategoryId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">All subcategories under selected category</option>
              {getSubcategoriesForCategory(linkCategoryId).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
              Create Locality + Category URL
            </button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredLocalityCategoryLinks.map((link) => {
              const fullUrl = `${window.location.origin}/${link.slug}`;
              return (
                <div key={link.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                  <a href={fullUrl} target="_blank" rel="noreferrer" className="text-indigo-700 font-mono break-all hover:underline">
                    {fullUrl}
                  </a>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {localities.find((locality) => locality.id === link.localityId)?.name || link.localityId} • {link.subcategoryId || link.categoryId}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteLocalityCategoryLink?.(link.id)}
                    className="mt-2 text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
            {filteredLocalityCategoryLinks.length === 0 && <div className="text-xs text-slate-400">No locality-category URLs created yet.</div>}
          </div>
        </div>}
      </div>
      )}
      {selectedBackendBiz && backendDraft && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Backend Listing</span>
                <h3 className="font-extrabold text-lg leading-tight">{backendDraft.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeBackendListing}
                className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Business Name</label>
                  <input
                    value={backendDraft.name}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Category</label>
                  <select
                    value={backendDraft.categoryId}
                    disabled={!backendEditMode}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      setBackendDraft({ ...backendDraft, categoryId: nextCategory, subcategoryId: nextCategory ? resolveDefaultSubcategoryId(nextCategory) : '' });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    <option value="">Unmapped / not set</option>
                    {BUSINESS_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Subcategory</label>
                  <select
                    value={backendDraft.subcategoryId}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, subcategoryId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    <option value="">{backendDraft.categoryId ? 'Unmapped / not set' : 'Select category first'}</option>
                    {getSubcategoriesForCategory(backendDraft.categoryId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <InlineSubcategoryCreator
                      categoryId={backendDraft.categoryId}
                      disabled={!backendEditMode}
                      canCreate={Boolean(onSaveBusinessTaxonomy && businessTaxonomy)}
                      onCreate={createInlineSubcategory}
                      onAssign={(subcategoryId) => setBackendDraft({ ...backendDraft, subcategoryId })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Uploaded Category Label</label>
                  <input
                    value={backendDraft.sourceCategoryLabel || ''}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, sourceCategoryLabel: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Uploaded Subcategory Label</label>
                  <input
                    value={backendDraft.sourceSubcategoryLabel || ''}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, sourceSubcategoryLabel: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Phone</label>
                  <input
                    value={backendDraft.phone}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Website</label>
                  <input
                    value={backendDraft.website}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, website: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Locality</label>
                  <select
                    value={backendDraft.localityId}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, localityId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    {localities.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Primary Area / Pincode</label>
                  <select
                    value={backendDraft.areaId}
                    disabled={!backendEditMode}
                    onChange={(e) => {
                      const nextAreaId = e.target.value;
                      const nextPincode = MASTER_AREAS.find((area) => area.id === nextAreaId)?.pincode || backendDraft.pincode || '';
                      setBackendDraft({ ...backendDraft, areaId: nextAreaId, pincode: nextPincode });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  >
                    {MASTER_AREAS.map(area => (
                      <option key={area.id} value={area.id}>{area.name} ({area.pincode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Pincode</label>
                  <input
                    value={backendDraft.pincode || ''}
                    disabled={!backendEditMode}
                    maxLength={6}
                    onChange={(e) => setBackendDraft({ ...backendDraft, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Address</label>
                  <input
                    value={backendDraft.address}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={backendDraft.description}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({ ...backendDraft, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Tags (comma separated)</label>
                  <textarea
                    rows={3}
                    value={(backendDraft.tags || []).join(', ')}
                    disabled={!backendEditMode}
                    onChange={(e) => setBackendDraft({
                      ...backendDraft,
                      tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean)
                    })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 p-4 flex justify-end gap-2 bg-slate-50">
              {!backendEditMode ? (
                <button
                  type="button"
                  onClick={() => setBackendEditMode(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setBackendDraft({
                        ...selectedBackendBiz,
                        pincode: selectedBackendBiz.pincode || MASTER_AREAS.find((area) => area.id === selectedBackendBiz.areaId)?.pincode || '',
                        areasOfOperation: [...(selectedBackendBiz.areasOfOperation || [])]
                      });
                      setBackendEditMode(false);
                    }}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveBackendListing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
