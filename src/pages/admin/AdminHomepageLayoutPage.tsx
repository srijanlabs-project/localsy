import React, { useMemo, useState } from 'react';
import type { Business, HomepageLayout, HomepageSection, HomepageSectionType, Locality } from '../../types';
import EditableHomepageSectionCard from '../../components/admin/EditableHomepageSectionCard';
import { OrderedCategoryPicker, OrderedSelectionPicker } from '../../components/admin/AdminConsoleSharedControls';
import { BUSINESS_CATEGORIES, getCategoryById, getSubcategoriesForCategory } from '../../categoryMaster';
import { parsePincodeList } from '../../services/admin/adminConsoleUtils';
import { HOMEPAGE_SECTION_TYPE_LABELS } from '../../services/admin/homepageCms';

type AdminHomepageLayoutPageProps = {
  localities: Locality[];
  businesses: Business[];
  homepageLayouts?: HomepageLayout[];
  onCreateHomepageSection?: (localityId: string, section: Omit<HomepageSection, 'id' | 'sortOrder'>, insertPosition?: number) => Promise<unknown> | void;
  onUpdateHomepageSection?: (localityId: string, section: HomepageSection) => Promise<unknown> | void;
  onDeleteHomepageSection?: (localityId: string, sectionId: string) => Promise<unknown> | void;
  onDuplicateHomepageSection?: (localityId: string, sectionId: string) => Promise<unknown> | void;
  onMoveHomepageSection?: (localityId: string, sectionId: string, direction: 'up' | 'down') => Promise<unknown> | void;
};

const HOMEPAGE_SECTION_OPTIONS = (Object.keys(HOMEPAGE_SECTION_TYPE_LABELS) as HomepageSectionType[]).map((sectionType) => ({
  id: sectionType,
  label: HOMEPAGE_SECTION_TYPE_LABELS[sectionType],
}));

// Routed home for admin-backend-ux-spec.md Section 5.14 "Homepage CMS: Layout Builder" —
// Section 9 build step 4. Ported from AdminConsole.tsx's Homepage CMS > Layout subtab (lines
// ~4260-4548), unchanged behavior, new location.
//
// One dropped capability, documented per this session's established pattern for cross-screen
// couplings that don't survive a split into independent pages: the legacy "Add To Active
// Template" button (which pushed this form's draft straight into whichever scalable template
// was selected on the Templates subtab) depended on shared in-memory state between the two
// subtabs. Since this page and AdminHomepageTemplatesPage.tsx now each own fresh, independent
// state, that one-click bridge doesn't carry over — section authoring directly onto a template
// still works fully from the Templates page's own "Template Sections" editor, so the
// capability isn't lost, just no longer reachable from this screen in one click.
export default function AdminHomepageLayoutPage({
  localities,
  businesses,
  homepageLayouts = [],
  onCreateHomepageSection,
  onUpdateHomepageSection,
  onDeleteHomepageSection,
  onDuplicateHomepageSection,
  onMoveHomepageSection,
}: AdminHomepageLayoutPageProps) {
  const primaryLocalityId = localities[0]?.id || '';
  const [homepageLocalityId, setHomepageLocalityId] = useState(primaryLocalityId);
  const [newSectionLocalityIds, setNewSectionLocalityIds] = useState<string[]>(primaryLocalityId ? [primaryLocalityId] : []);
  const [newSectionType, setNewSectionType] = useState<HomepageSectionType>('hero_banner');
  const [newSectionTitle, setNewSectionTitle] = useState('Hero Banner');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionCategoryId, setNewSectionCategoryId] = useState(BUSINESS_CATEGORIES[0]?.id || '');
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
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const selectedHomepageLayout = homepageLayouts.find((layout) => layout.localityId === homepageLocalityId);
  const homepageSections = useMemo(
    () => [...(selectedHomepageLayout?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [selectedHomepageLayout]
  );

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
    rotationIntervalSec: Number(newSectionRotationIntervalSec) > 0 ? Number(newSectionRotationIntervalSec) : 3,
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

  const handleCreateHomepageSectionSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!homepageLocalityId || !newSectionTitle.trim()) {
      notify('Choose locality and section title before adding a homepage section.');
      return;
    }
    const insertPosition = Number(newSectionInsertPosition);
    onCreateHomepageSection?.(
      homepageLocalityId,
      buildHomepageSectionDraftPayload(),
      Number.isFinite(insertPosition) && insertPosition > 0 ? insertPosition : 1
    );
    resetHomepageSectionDraftForm();
    notify('Homepage section added.');
  };

  const updateHomepageSection = (section: HomepageSection, patch: Partial<HomepageSection>) => {
    onUpdateHomepageSection?.(homepageLocalityId, { ...section, ...patch });
  };

  const toggleSectionCardExpanded = (sectionId: string) => {
    setExpandedSectionCardIds((prev) => (
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    ));
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Layout Builder</h2>
        <p className="mt-0.5 text-xs text-slate-500">Arrange homepage sections for the selected locality.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-950">Homepage Layout Manager</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Arrange repeatable sections for each locality page. Sections can be scheduled, hidden, duplicated, and targeted by pincode.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
            {homepageSections.length} sections
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
                  setNewSectionTitle(HOMEPAGE_SECTION_TYPE_LABELS[nextType]);
                  setNewSectionMobileDisplayMode(nextType === 'verified_business_grid' ? 'stack' : 'carousel');
                  setNewSectionDesktopCardCount(nextType === 'featured_businesses' ? '3' : nextType === 'verified_business_grid' ? '5' : '4');
                  setNewSectionMobileCardCount('2');
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
              >
                {HOMEPAGE_SECTION_OPTIONS.map((option) => (
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
                meta: locality.slug || locality.id,
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
                options={businesses.filter((business) => business.status === 'approved').map((business) => ({
                  id: business.id,
                  label: business.name,
                  meta: `${getCategoryById(business.categoryId)?.name || business.categoryId} | ${business.pincode || 'No PIN'}`,
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
            <button type="submit" className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold py-2 rounded-lg">
              Add Homepage Section
            </button>
          </form>

          <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1">
            {homepageSections.map((section, index) => (
              <React.Fragment key={section.id}>
              <EditableHomepageSectionCard
                section={section}
                index={index}
                isExpanded={expandedSectionCardIds.includes(section.id)}
                sectionTypeLabel={HOMEPAGE_SECTION_TYPE_LABELS[section.sectionType]}
                localities={localities}
                filteredBusinesses={businesses}
                parsePincodeList={parsePincodeList}
                onToggleExpanded={() => toggleSectionCardExpanded(section.id)}
                onMoveUp={() => onMoveHomepageSection?.(homepageLocalityId, section.id, 'up')}
                onMoveDown={() => onMoveHomepageSection?.(homepageLocalityId, section.id, 'down')}
                onDuplicate={() => onDuplicateHomepageSection?.(homepageLocalityId, section.id)}
                onDelete={() => onDeleteHomepageSection?.(homepageLocalityId, section.id)}
                onUpdate={(patch) => updateHomepageSection(section, patch)}
              />
              </React.Fragment>
            ))}
            {homepageSections.length === 0 && (
              <div className="text-xs text-slate-400">No homepage sections configured yet for this locality.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
