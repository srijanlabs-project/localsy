import React, { useMemo, useState } from 'react';
import type { CommunityItem, Locality, UserSession } from '../../types';
import { slugifyForPath, uploadAdminMediaImage } from '../../services/admin/adminConsoleUtils';
import { getMediaProxyUrl } from '../../utils/mediaUrl';

type AdminUpdatesFeedPageProps = {
  localities: Locality[];
  communityItems?: CommunityItem[];
  userSession?: UserSession;
  onAddCommunityItem?: (item: Omit<CommunityItem, 'id' | 'createdAt' | 'likes'>) => void;
  onUpdateCommunityItem?: (item: CommunityItem) => void;
  onDeleteCommunityItem?: (itemId: string) => void;
};

const emptyCommunityDraft = (): Partial<CommunityItem> => ({
  type: 'post',
  title: '',
  content: '',
  authorName: 'Localisy Team',
});

// Routed home for admin-backend-ux-spec.md Section 5.22 "Content: Updates Feed". Unlike most
// other split pages, there was no pre-extracted component for this screen to move — it was
// ~340 lines of inline JSX directly in AdminConsole.tsx's "content" operations section. Ported
// directly from AdminConsole.tsx:
//   - local state block (lines 633-651): communityTypeFilter/communityStatusFilter/
//     communityDateFilter/communityEditId/communityEditDraft/communityImageUrl/
//     communityImageFile/communityImageUploading/communityFormError/communityEditImageUrl/
//     communityEditImageFile/communityEditImageUploading/communityEditError/communityDraft —
//     all recreated fresh here as independent local state.
//   - inline JSX (lines 5949-6289): filter row -> create-update form -> inline edit panel ->
//     scrollable list with Edit/Delete.
//   - filteredCommunityItems derivation (line 1332).
//   - handleCreateCommunityItemSubmit (lines 3048-3097), beginEditCommunityItem /
//     cancelEditCommunityItem / saveEditCommunityItem (lines 3099-3154).
//   - getCommunityItemFolder helper (line 748), ported verbatim.
//   - the inline delete handler (~line 6276) remains a direct onDeleteCommunityItem passthrough.
//
// Two deliberate, capability-preserving changes from the legacy behavior:
//   1. Dedicated locality picker. Legacy `handleCreateCommunityItemSubmit` sourced its locality
//      from the console's SHARED filter bar (`adminLocalityFilter`) and refused to submit unless
//      it was set to a specific locality — an unrelated global control gated an otherwise
//      self-contained form. This page has no shared filter bar, so the create form gets its own
//      `communityLocalityId` select (defaulting to `localities[0]?.id`) and uses it directly as
//      the update's `localityId`. This is actually an improvement over the legacy flow, not just
//      a workaround: locality selection now lives where it's used, instead of requiring the
//      admin to first go set an unrelated shared filter before the form would accept a submit.
//   2. Local list-filter state. The list view keeps its own type/status/date filters (the same
//      three the legacy tab exposed) rather than the shared `adminLocalityFilter`; the legacy
//      tab's search-box filtering (bound to the console's shared search bar, `adminSearchQuery`)
//      has no equivalent shared control here and is dropped rather than faked.
//
// Also fixes a mojibake encoding artifact found in the legacy list-row separators (corrupted
// multi-byte "->"/"." characters), replaced here with plain "->" text and a clean "·" bullet,
// the same kind of fix already made in AdminHomepageAssignmentsPage.tsx and
// AdminCategoryUrlsPage.tsx during earlier split steps.
export default function AdminUpdatesFeedPage({
  localities,
  communityItems = [],
  userSession,
  onAddCommunityItem,
  onUpdateCommunityItem,
  onDeleteCommunityItem,
}: AdminUpdatesFeedPageProps) {
  const primaryLocalityId = localities[0]?.id || '';

  const [communityLocalityId, setCommunityLocalityId] = useState(primaryLocalityId);
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
  const [communityDraft, setCommunityDraft] = useState<Partial<CommunityItem>>(emptyCommunityDraft());
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const localityNameById = useMemo(
    () => new Map(localities.map((locality) => [locality.id, locality.name])),
    [localities]
  );

  const filteredCommunityItems = useMemo(
    () => communityItems.filter((item) => {
      if (communityTypeFilter !== 'all' && item.type !== communityTypeFilter) return false;
      if (communityStatusFilter !== 'all' && (item.status || 'published') !== communityStatusFilter) return false;
      if (communityDateFilter) {
        const selectedDate = communityDateFilter;
        const publishAt = item.publishAt || item.createdAt;
        const expireAt = item.expireAt || '';
        if (publishAt && publishAt > `${selectedDate}T23:59:59.999Z`) return false;
        if (expireAt && expireAt < `${selectedDate}T00:00:00.000Z`) return false;
      }
      return true;
    }),
    [communityItems, communityTypeFilter, communityStatusFilter, communityDateFilter]
  );

  // Ported verbatim from AdminConsole.tsx line 748.
  const getCommunityItemFolder = (localityId: string, type: CommunityItem['type']) =>
    `homepage-content/community/${slugifyForPath(localityId || 'global')}/${slugifyForPath(type || 'post')}`;

  const handleCreateCommunityItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommunityFormError('');
    if (!communityDraft.title?.trim() || !communityDraft.content?.trim() || !communityLocalityId) {
      const message = 'Choose a locality and add title/content for the update.';
      setCommunityFormError(message);
      notify(message);
      return;
    }
    setCommunityImageUploading(true);
    try {
      const type = communityDraft.type || 'post';
      const uploadedImageUrl = communityImageFile
        ? await uploadAdminMediaImage(communityImageFile, getCommunityItemFolder(communityLocalityId, type), userSession?.authToken)
        : getMediaProxyUrl(communityImageUrl.trim());
      const nextStatus = communityDraft.status || 'published';
      onAddCommunityItem?.({
        type,
        title: communityDraft.title.trim(),
        content: communityDraft.content.trim(),
        authorName: communityDraft.authorName?.trim() || 'Localisy Team',
        localityId: communityLocalityId,
        status: nextStatus,
        publishAt: communityDraft.publishAt || new Date().toISOString(),
        expireAt: communityDraft.expireAt || undefined,
        businessId: communityDraft.businessId || undefined,
        image: uploadedImageUrl || undefined,
      });
      setCommunityDraft({
        type: 'post',
        title: '',
        content: '',
        authorName: 'Localisy Team',
        status: 'published',
        publishAt: new Date().toISOString(),
        expireAt: '',
        image: '',
      });
      setCommunityImageUrl('');
      setCommunityImageFile(null);
      setCommunityFormError('');
      notify('Locality update created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Community image upload failed.';
      setCommunityFormError(message);
      notify(message);
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
      expireAt: item.expireAt || '',
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
      notify(message);
      return;
    }
    setCommunityEditImageUploading(true);
    setCommunityEditError('');
    try {
      const uploadedImageUrl = communityEditImageFile
        ? await uploadAdminMediaImage(communityEditImageFile, getCommunityItemFolder(communityEditDraft.localityId, communityEditDraft.type), userSession?.authToken)
        : getMediaProxyUrl(communityEditImageUrl.trim());
      onUpdateCommunityItem?.({
        ...communityEditDraft,
        title: communityEditDraft.title.trim(),
        content: communityEditDraft.content.trim(),
        authorName: communityEditDraft.authorName?.trim() || 'Localisy Team',
        status: communityEditDraft.status || 'published',
        publishAt: communityEditDraft.publishAt || new Date().toISOString(),
        expireAt: communityEditDraft.expireAt || undefined,
        image: uploadedImageUrl || getMediaProxyUrl(communityEditDraft.image?.trim() || '') || undefined,
      });
      notify('Locality update saved.');
      cancelEditCommunityItem();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Community image upload failed.';
      setCommunityEditError(message);
      notify(message);
    } finally {
      setCommunityEditImageUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Updates Feed</h2>
        <p className="mt-0.5 text-xs text-slate-500">Create and manage locality-specific updates for the homepage updates feed.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-950">Updates Feed Manager</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Create and manage locality-specific updates for the homepage updates feed.
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
          <select
            value={communityLocalityId}
            onChange={(e) => setCommunityLocalityId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            {localities.map((locality) => (
              <option key={locality.id} value={locality.id}>{locality.name}</option>
            ))}
          </select>
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
              {communityImageUploading && <span className="text-[10px] font-semibold text-[#1E3A8A]">Uploading...</span>}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCommunityImageFile(e.target.files?.[0] || null)}
              className="w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#1E3A8A]"
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
          <button type="submit" className="w-full rounded-lg bg-[#1E3A8A] py-2 font-bold text-white hover:bg-[#1E3A8A]/90">
            Create Locality Update
          </button>
          {communityFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{communityFormError}</div>}
        </form>

        {communityEditDraft && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs space-y-2">
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
            <div className="space-y-2 rounded-lg border border-dashed border-blue-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Image</span>
                {communityEditImageUploading && <span className="text-[10px] font-semibold text-[#1E3A8A]">Uploading...</span>}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCommunityEditImageFile(e.target.files?.[0] || null)}
                className="w-full text-[11px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#1E3A8A]"
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
            <input
              value={communityEditDraft.businessId || ''}
              onChange={(e) => setCommunityEditDraft((prev) => prev ? ({ ...prev, businessId: e.target.value }) : prev)}
              placeholder="Optional business ID"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-500">
                {localityNameById.get(communityEditDraft.localityId) || communityEditDraft.localityId}
              </div>
              <button
                type="button"
                onClick={() => { void saveEditCommunityItem(); }}
                className="rounded bg-[#1E3A8A] px-3 py-1.5 text-[10px] font-bold text-white"
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
                    {localityNameById.get(item.localityId) || item.localityId} · {item.type}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {(item.status || 'published').toUpperCase()} · {(item.publishAt || item.createdAt).slice(0, 10)}
                    {item.expireAt ? ` · Ends ${item.expireAt.slice(0, 10)}` : ''}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600 line-clamp-2">{item.content}</div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => beginEditCommunityItem(item)}
                    className="rounded bg-white px-2 py-1 text-[10px] font-bold text-[#1E3A8A] border border-blue-200"
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
      </div>
    </div>
  );
}
