import React, { useMemo, useState } from 'react';
import type { Locality, ScalableHomepageAssignment, ScalableHomepageConfigState } from '../../types';
import { BUSINESS_CATEGORIES, getSubcategoriesForCategory } from '../../categoryMaster';
import {
  createAdminId,
  getScalableEntityOwnershipPresentation,
  isLegacyManagedScalableEntity,
} from '../../services/admin/adminConsoleUtils';
import { deleteScalableEntity, persistScalableEntity } from '../../services/admin/homepageCms';

type AdminHomepageAssignmentsPageProps = {
  localities: Locality[];
  scalableHomepageConfig?: ScalableHomepageConfigState;
  onSaveScalableAssignment?: (assignment: ScalableHomepageAssignment) => Promise<unknown> | void;
  onDeleteScalableAssignment?: (assignmentId: string) => Promise<unknown> | void;
  onPublishResolvedHomepages?: (localityIds: string[]) => Promise<unknown> | void;
};

const emptyAssignmentDraft = (localityId: string) => ({
  id: '',
  localityId,
  templateId: '',
  categoryId: '',
  subcategoryId: '',
  pincode: '',
  status: 'active' as ScalableHomepageAssignment['status'],
  priority: '100',
  isFallback: false,
});

// Routed home for admin-backend-ux-spec.md Section 5.17 "Homepage CMS: Assignments" —
// Section 9 build step 4. Ported from AdminConsole.tsx's Homepage CMS > Assignments subtab
// (lines ~5461-5589), unchanged behavior, new location — the smallest of the "content
// authoring" Homepage CMS subtabs (single form + single list, no nested sub-editor). Also
// fixes a pre-existing mojibake separator artifact in the assignment list rows (encoding
// corruption in the legacy tab's JSX), replaced here with plain "→" / "·" characters, same
// kind of fix already made in AdminCategoryUrlsPage.tsx during the Geography step.
export default function AdminHomepageAssignmentsPage({
  localities,
  scalableHomepageConfig,
  onSaveScalableAssignment,
  onDeleteScalableAssignment,
  onPublishResolvedHomepages,
}: AdminHomepageAssignmentsPageProps) {
  const primaryLocalityId = localities[0]?.id || '';
  const [assignmentDraft, setAssignmentDraft] = useState(() => emptyAssignmentDraft(primaryLocalityId));
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const sortedScalableTemplates = useMemo(
    () => [...(scalableHomepageConfig?.templates || [])].sort((a, b) => b.priority - a.priority),
    [scalableHomepageConfig?.templates]
  );
  const sortedScalableAssignments = useMemo(
    () => [...(scalableHomepageConfig?.assignments || [])].sort((a, b) => b.priority - a.priority),
    [scalableHomepageConfig?.assignments]
  );
  const templateNameById = useMemo(
    () => new Map(sortedScalableTemplates.map((template) => [template.id, template.name])),
    [sortedScalableTemplates]
  );
  const localityNameById = useMemo(
    () => new Map(localities.map((locality) => [locality.id, locality.name])),
    [localities]
  );
  const formatLocalityLabel = (localityId: string) => localityNameById.get(localityId) || localityId;

  const resetAssignmentDraft = () => setAssignmentDraft(emptyAssignmentDraft(primaryLocalityId));

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
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!assignmentDraft.localityId || !assignmentDraft.templateId) {
      notify('Assignment needs a locality and template.');
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

    await persistScalableEntity({
      save: onSaveScalableAssignment,
      entity: nextAssignment,
      successMessage: assignmentDraft.id ? 'Assignment updated and published.' : 'Assignment created and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: [nextAssignment.localityId],
      missingCallbackMessage: 'Scalable assignment save callback is not configured.',
      genericErrorMessage: 'Failed to save scalable assignment.',
    });
    resetAssignmentDraft();
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!scalableHomepageConfig) {
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    const assignment = scalableHomepageConfig.assignments.find((entry) => entry.id === assignmentId);
    await deleteScalableEntity({
      deleteFn: onDeleteScalableAssignment,
      id: assignmentId,
      successMessage: 'Assignment deleted and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: [assignment?.localityId || primaryLocalityId],
      missingCallbackMessage: 'Scalable assignment delete callback is not configured.',
      genericErrorMessage: 'Failed to delete scalable assignment.',
    });
    if (assignmentDraft.id === assignmentId) resetAssignmentDraft();
  };

  const handleDetachAssignmentFromLegacySync = async (assignment: ScalableHomepageAssignment) => {
    if (!scalableHomepageConfig) {
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!isLegacyManagedScalableEntity(assignment.metadata)) {
      notify('This assignment is already detached or scalable-owned.');
      return;
    }
    const detachedAt = new Date().toISOString();
    await persistScalableEntity({
      save: onSaveScalableAssignment,
      entity: {
        ...assignment,
        metadata: {
          ...(assignment.metadata || {}),
          updatedFrom: 'admin_console',
          detachedFromLegacySync: true,
          detachedAt,
          detachedReason: 'manual_admin_detach',
        },
        updatedAt: detachedAt,
      },
      successMessage: `Assignment for ${formatLocalityLabel(assignment.localityId)} detached from legacy sync.`,
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: [assignment.localityId],
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Assignments</h2>
        <p className="mt-0.5 text-xs text-slate-500">Map templates to locality/category/subcategory/pincode targeting.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

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
            onClick={() => { void handleSaveAssignmentDraft(); }}
            className="w-full rounded-lg bg-[#1E3A8A] py-2 font-bold text-white hover:bg-[#1E3A8A]/90"
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
                  <div className="text-[10px] text-slate-500">{assignment.categoryId || 'all'} / {assignment.subcategoryId || 'all'} / {assignment.pincode || 'all'} · priority {assignment.priority}</div>
                  <div className="text-[10px] text-slate-500">Source: {getScalableEntityOwnershipPresentation(assignment.metadata).detail}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {isLegacyManagedScalableEntity(assignment.metadata) && (
                    <button type="button" onClick={() => { void handleDetachAssignmentFromLegacySync(assignment); }} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Detach</button>
                  )}
                  <button type="button" onClick={() => beginEditAssignment(assignment)} className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700">Edit</button>
                  <button type="button" onClick={() => { void handleDeleteAssignment(assignment.id); }} className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {sortedScalableAssignments.length === 0 && (
            <div className="py-4 text-center text-xs italic text-slate-400">No assignments created yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
