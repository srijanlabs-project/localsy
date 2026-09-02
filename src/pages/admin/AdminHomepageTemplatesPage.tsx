import React, { useMemo, useState } from 'react';
import type { Business, HomepageLayout, HomepageSection, Locality, ScalableHomepageConfigState, ScalableHomepageTemplate } from '../../types';
import EditableHomepageSectionCard from '../../components/admin/EditableHomepageSectionCard';
import { OrderedSelectionPicker } from '../../components/admin/AdminConsoleSharedControls';
import {
  createAdminId,
  getScalableEntityOwnershipPresentation,
  isLegacyManagedScalableEntity,
  parseIdList,
  parsePincodeList,
} from '../../services/admin/adminConsoleUtils';
import {
  deleteScalableTemplateEntity,
  HOMEPAGE_SECTION_TYPE_LABELS,
  persistScalableTemplateEntity,
} from '../../services/admin/homepageCms';

type AdminHomepageTemplatesPageProps = {
  localities: Locality[];
  businesses: Business[];
  homepageLayouts?: HomepageLayout[];
  scalableHomepageConfig?: ScalableHomepageConfigState;
  onSaveScalableTemplate?: (template: ScalableHomepageTemplate) => Promise<unknown> | void;
  onDeleteScalableTemplate?: (templateId: string) => Promise<unknown> | void;
  onCreateScalableTemplateSection?: (templateId: string, section: HomepageSection) => Promise<unknown> | void;
  onUpdateScalableTemplateSection?: (templateId: string, sectionId: string, section: HomepageSection) => Promise<unknown> | void;
  onReorderScalableTemplateSections?: (templateId: string, sections: HomepageSection[]) => Promise<unknown> | void;
  onDuplicateScalableTemplateSection?: (templateId: string, sectionId: string) => Promise<unknown> | void;
  onDeleteScalableTemplateSection?: (templateId: string, sectionId: string) => Promise<unknown> | void;
  onSyncScalableTemplateSectionsFromLocality?: (templateId: string, localityId: string) => Promise<unknown> | void;
  onPublishResolvedHomepages?: (localityIds: string[]) => Promise<unknown> | void;
};

const emptyTemplateDraft = (localityId: string) => ({
  id: '',
  name: '',
  templateScope: 'locality' as ScalableHomepageTemplate['templateScope'],
  localityIds: localityId,
  status: 'active' as ScalableHomepageTemplate['status'],
  priority: '100',
  isDefault: false,
  isFallback: false,
});

// Routed home for admin-backend-ux-spec.md Section 5.16 "Homepage CMS: Templates" — Section 9
// build step 4. Ported from AdminConsole.tsx's Homepage CMS > Templates subtab (lines
// ~5292-5459), unchanged behavior, new location. Reuses the same <EditableHomepageSectionCard>
// component the legacy Layout Builder subtab also uses, wired to the template-section CRUD
// props instead of the layout-section ones. Also fixes a pre-existing mojibake separator
// artifact in the template list row, same kind of fix already made during the Geography step.
//
// Cross-screen note: the legacy "Add To Active Template" button on the Layout Builder subtab
// (a shortcut to push a homepage-section draft straight into whichever template was selected
// here) depended on shared in-memory state between the two subtabs. Since each routed page now
// owns fresh, independent state, that shortcut doesn't carry over — Layout Builder's page
// (AdminHomepageLayoutPage.tsx) only keeps its own "Add Section" flow. Authoring sections
// directly onto a template still works fully from this page's own "Template Sections" editor
// below, so no capability is lost — only the one-click bridge between the two screens.
export default function AdminHomepageTemplatesPage({
  localities,
  businesses,
  homepageLayouts = [],
  scalableHomepageConfig,
  onSaveScalableTemplate,
  onDeleteScalableTemplate,
  onCreateScalableTemplateSection,
  onUpdateScalableTemplateSection,
  onReorderScalableTemplateSections,
  onDuplicateScalableTemplateSection,
  onDeleteScalableTemplateSection,
  onSyncScalableTemplateSectionsFromLocality,
  onPublishResolvedHomepages,
}: AdminHomepageTemplatesPageProps) {
  const primaryLocalityId = localities[0]?.id || '';
  const [templateDraft, setTemplateDraft] = useState(() => emptyTemplateDraft(primaryLocalityId));
  const [expandedSectionCardIds, setExpandedSectionCardIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const sortedScalableTemplates = useMemo(
    () => [...(scalableHomepageConfig?.templates || [])].sort((a, b) => b.priority - a.priority),
    [scalableHomepageConfig?.templates]
  );
  const activeDefaultTemplate = useMemo(
    () => sortedScalableTemplates.find((template) => template.isDefault && template.status === 'active') || null,
    [sortedScalableTemplates]
  );
  const localitySelectionOptions = useMemo(() => localities.map((locality) => ({
    id: locality.id,
    label: locality.name,
    meta: locality.slug,
  })), [localities]);
  const localityNameById = useMemo(() => new Map(localities.map((locality) => [locality.id, locality.name])), [localities]);
  const formatLocalityLabel = (localityId: string) => localityNameById.get(localityId) || localityId;

  const selectedScalableTemplate = scalableHomepageConfig?.templates.find((template) => template.id === templateDraft.id) || null;
  const selectedScalableTemplateSections = useMemo(
    () => [...(selectedScalableTemplate?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [selectedScalableTemplate]
  );

  const resetTemplateDraft = () => setTemplateDraft(emptyTemplateDraft(primaryLocalityId));

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
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!templateDraft.name.trim()) {
      notify('Template name is required.');
      return;
    }
    if (
      templateDraft.isDefault &&
      templateDraft.status === 'active' &&
      activeDefaultTemplate &&
      activeDefaultTemplate.id !== templateDraft.id
    ) {
      notify(`Another default template is already active: ${activeDefaultTemplate.name}. Open that template first and remove Default fallback or set it inactive, then try again.`);
      return;
    }

    const existing = scalableHomepageConfig.templates.find((template) => template.id === templateDraft.id);
    const nextTemplate: ScalableHomepageTemplate = {
      id: templateDraft.id || createAdminId('tpl'),
      name: templateDraft.name.trim(),
      templateScope: templateDraft.templateScope,
      localityIds: parseIdList(templateDraft.localityIds),
      status: templateDraft.status,
      priority: Number(templateDraft.priority) || 100,
      isDefault: templateDraft.isDefault,
      isFallback: templateDraft.isFallback,
      sections: existing?.sections || [],
      metadata: {
        ...(existing?.metadata || {}),
        updatedFrom: 'admin_console',
        detachedFromLegacySync: true,
      },
      updatedAt: new Date().toISOString(),
    };

    const result = await persistScalableTemplateEntity({
      save: onSaveScalableTemplate,
      template: nextTemplate,
      successMessage: templateDraft.id ? 'Template updated and published.' : 'Template created and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: nextTemplate.localityIds.length > 0 ? nextTemplate.localityIds : [primaryLocalityId],
    });
    if (result.saved) {
      resetTemplateDraft();
    }
  };

  const handleSyncTemplateSectionsFromLocality = async () => {
    if (!scalableHomepageConfig || !templateDraft.id) {
      notify('Select an existing template before syncing sections.');
      return;
    }
    const targetTemplate = scalableHomepageConfig.templates.find((template) => template.id === templateDraft.id);
    if (!targetTemplate) {
      notify('Template not found.');
      return;
    }
    const syncLocalityId = targetTemplate.localityIds[0] || primaryLocalityId;
    if (onSyncScalableTemplateSectionsFromLocality) {
      try {
        await onSyncScalableTemplateSectionsFromLocality(targetTemplate.id, syncLocalityId);
        if (onPublishResolvedHomepages) {
          await onPublishResolvedHomepages([syncLocalityId]);
        }
        notify(`Template sections synced and published from ${syncLocalityId}.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync template sections from locality.';
        notify(message);
      }
      return;
    }
    const sourceLayout = homepageLayouts.find((layout) => layout.localityId === syncLocalityId);
    if (!sourceLayout) {
      notify('No homepage layout found for the selected locality.');
      return;
    }
    await persistScalableTemplateEntity({
      save: onSaveScalableTemplate,
      template: {
        ...targetTemplate,
        sections: sourceLayout.sections,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(targetTemplate.metadata || {}),
          lastSectionSyncLocalityId: syncLocalityId,
          detachedFromLegacySync: false,
        },
      },
      successMessage: `Template sections synced and published from ${syncLocalityId}.`,
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: [syncLocalityId],
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!scalableHomepageConfig) {
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    const template = scalableHomepageConfig.templates.find((entry) => entry.id === templateId);
    await deleteScalableTemplateEntity({
      deleteFn: onDeleteScalableTemplate,
      templateId,
      successMessage: 'Template deleted and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: template?.localityIds.length ? template.localityIds : [primaryLocalityId],
    });
    if (templateDraft.id === templateId) resetTemplateDraft();
  };

  const handleDetachTemplateFromLegacySync = async (template: ScalableHomepageTemplate) => {
    if (!scalableHomepageConfig) {
      notify('Scalable CMS state is not loaded yet.');
      return;
    }
    if (!isLegacyManagedScalableEntity(template.metadata)) {
      notify('This template is already detached or scalable-owned.');
      return;
    }
    const detachedAt = new Date().toISOString();
    await persistScalableTemplateEntity({
      save: onSaveScalableTemplate,
      template: {
        ...template,
        metadata: {
          ...(template.metadata || {}),
          updatedFrom: 'admin_console',
          detachedFromLegacySync: true,
          detachedAt,
          detachedReason: 'manual_admin_detach',
        },
        updatedAt: detachedAt,
      },
      successMessage: `Template "${template.name}" detached from legacy sync.`,
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: template.localityIds.length > 0 ? template.localityIds : [primaryLocalityId],
    });
  };

  const updateScalableTemplateSection = async (section: HomepageSection, patch: Partial<HomepageSection>) => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      notify('Select a scalable template before editing sections.');
      return;
    }
    const nextSection = { ...section, ...patch };
    if (onUpdateScalableTemplateSection) {
      try {
        await onUpdateScalableTemplateSection(selectedScalableTemplate.id, section.id, nextSection);
        if (selectedScalableTemplate.localityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(selectedScalableTemplate.localityIds);
        }
        notify('Template section updated and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update scalable template section.';
        notify(message);
        return;
      }
    }
    await persistScalableTemplateEntity({
      save: onSaveScalableTemplate,
      template: {
        ...selectedScalableTemplate,
        sections: selectedScalableTemplate.sections.map((entry) => (entry.id === section.id ? nextSection : entry)),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(selectedScalableTemplate.metadata || {}),
          updatedFrom: 'admin_console',
          detachedFromLegacySync: true,
        },
      },
      successMessage: 'Template section updated and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [primaryLocalityId],
    });
  };

  const handleMoveScalableTemplateSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      notify('Select a scalable template before reordering sections.');
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
        notify('Template section reordered and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reorder scalable template sections.';
        notify(message);
        return;
      }
    }
    await persistScalableTemplateEntity({
      save: onSaveScalableTemplate,
      template: {
        ...selectedScalableTemplate,
        sections: normalizedSections,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(selectedScalableTemplate.metadata || {}),
          updatedFrom: 'admin_console',
          detachedFromLegacySync: true,
        },
      },
      successMessage: 'Template section reordered and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [primaryLocalityId],
    });
  };

  const handleDuplicateScalableTemplateSection = async (sectionId: string) => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      notify('Select a scalable template before duplicating sections.');
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
        notify('Template section duplicated and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to duplicate scalable template section.';
        notify(message);
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
      save: onSaveScalableTemplate,
      template: {
        ...selectedScalableTemplate,
        sections: [...selectedScalableTemplate.sections, nextSection],
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(selectedScalableTemplate.metadata || {}),
          updatedFrom: 'admin_console',
          detachedFromLegacySync: true,
        },
      },
      successMessage: 'Template section duplicated and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [primaryLocalityId],
    });
  };

  const handleDeleteScalableTemplateSection = async (sectionId: string) => {
    if (!scalableHomepageConfig || !selectedScalableTemplate) {
      notify('Select a scalable template before deleting sections.');
      return;
    }
    if (onDeleteScalableTemplateSection) {
      try {
        await onDeleteScalableTemplateSection(selectedScalableTemplate.id, sectionId);
        if (selectedScalableTemplate.localityIds.length > 0 && onPublishResolvedHomepages) {
          await onPublishResolvedHomepages(selectedScalableTemplate.localityIds);
        }
        notify('Template section deleted and published.');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete scalable template section.';
        notify(message);
        return;
      }
    }
    await persistScalableTemplateEntity({
      save: onSaveScalableTemplate,
      template: {
        ...selectedScalableTemplate,
        sections: selectedScalableTemplate.sections.filter((section) => section.id !== sectionId),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(selectedScalableTemplate.metadata || {}),
          updatedFrom: 'admin_console',
          detachedFromLegacySync: true,
        },
      },
      successMessage: 'Template section deleted and published.',
      notify,
      publish: onPublishResolvedHomepages,
      publishLocalityIds: selectedScalableTemplate.localityIds.length > 0 ? selectedScalableTemplate.localityIds : [primaryLocalityId],
    });
  };

  const toggleSectionCardExpanded = (sectionId: string) => {
    setExpandedSectionCardIds((prev) => (
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    ));
  };

  const renderSectionCard = (section: HomepageSection, index: number) => (
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
        onMoveUp={() => { void handleMoveScalableTemplateSection(section.id, 'up'); }}
        onMoveDown={() => { void handleMoveScalableTemplateSection(section.id, 'down'); }}
        onDuplicate={() => { void handleDuplicateScalableTemplateSection(section.id); }}
        onDelete={() => { void handleDeleteScalableTemplateSection(section.id); }}
        onUpdate={(patch) => updateScalableTemplateSection(section, patch)}
      />
    </React.Fragment>
  );

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Templates</h2>
        <p className="mt-0.5 text-xs text-slate-500">Reusable homepage structures assigned by locality and context.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

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
              onClick={() => { void handleSaveTemplateDraft(); }}
              className="flex-1 rounded-lg bg-[#1E3A8A] py-2 font-bold text-white hover:bg-[#1E3A8A]/90"
            >
              {templateDraft.id ? 'Update Template' : 'Create Template'}
            </button>
            <button
              type="button"
              onClick={() => { void handleSyncTemplateSectionsFromLocality(); }}
              disabled={!templateDraft.id}
              className="flex-1 rounded-lg border border-emerald-200 bg-white py-2 font-bold text-emerald-800 disabled:opacity-40"
            >
              Sync Sections
            </button>
          </div>
          {selectedScalableTemplate && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-900">
              Active template selected. Use the "Template Sections" editor below to add, edit, or reorder sections directly on this template.
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
                  <div className="text-[10px] text-slate-500">{template.templateScope} · priority {template.priority} · {template.sections.length} sections</div>
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
                  <button type="button" onClick={() => { void handleDeleteTemplate(template.id); }} className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {sortedScalableTemplates.length === 0 && (
            <div className="py-4 text-center text-xs italic text-slate-400">No templates created yet.</div>
          )}
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
              {selectedScalableTemplateSections.map((section, index) => renderSectionCard(section, index))}
              {selectedScalableTemplateSections.length === 0 && (
                <div className="text-xs text-slate-400">No sections authored directly on this template yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
