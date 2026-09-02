import type { HomepageSectionType, ScalableHomepageTemplate } from '../../types';

/** Ported verbatim from AdminConsole.tsx's local `homepageSectionLabels` map — shared by the
 * Layout Builder and Templates pages, both of which render `<EditableHomepageSectionCard>`. */
export const HOMEPAGE_SECTION_TYPE_LABELS: Record<HomepageSectionType, string> = {
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
  trust_strip: 'Trust Strip',
};

// Shared save/delete-with-optional-publish helpers for the Homepage CMS "scalable" entities
// (Templates, Assignments, Campaigns). Ported from AdminConsole.tsx's local
// persistScalableTemplateEntity/persistScalableAssignmentEntity/persistScalableCampaignEntity
// and their delete counterparts (Section 9 Step 4, Homepage CMS split) — those three legacy
// helpers were structurally identical except for which save/delete prop they called, so this
// module generalizes them into one pair of functions each of the three new pages calls with
// its own prop. Templates gets a dedicated function (see below) because its legacy version has
// extra save/publish-phase error copy (`formatTemplateWorkflowError`) the other two don't.

/**
 * Generic "save an entity, then optionally publish affected localities" flow, matching the
 * legacy persistScalableAssignmentEntity / persistScalableCampaignEntity behavior exactly.
 */
export async function persistScalableEntity<T>(options: {
  save?: (entity: T) => Promise<unknown> | void;
  entity: T;
  successMessage: string;
  notify: (message: string) => void;
  publish?: (localityIds: string[]) => Promise<unknown> | void;
  publishLocalityIds?: string[];
  missingCallbackMessage?: string;
  genericErrorMessage?: string;
}): Promise<void> {
  const { save, entity, successMessage, notify, publish, publishLocalityIds, missingCallbackMessage, genericErrorMessage } = options;
  if (!save) {
    notify(missingCallbackMessage || 'Save callback is not configured.');
    return;
  }
  try {
    await save(entity);
    if (publishLocalityIds && publishLocalityIds.length > 0 && publish) {
      await publish(publishLocalityIds);
    }
    notify(successMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : (genericErrorMessage || 'Failed to save.');
    notify(message);
  }
}

/** Generic "delete an entity, then optionally publish affected localities" flow. */
export async function deleteScalableEntity(options: {
  deleteFn?: (id: string) => Promise<unknown> | void;
  id: string;
  successMessage: string;
  notify: (message: string) => void;
  publish?: (localityIds: string[]) => Promise<unknown> | void;
  publishLocalityIds?: string[];
  missingCallbackMessage?: string;
  genericErrorMessage?: string;
}): Promise<void> {
  const { deleteFn, id, successMessage, notify, publish, publishLocalityIds, missingCallbackMessage, genericErrorMessage } = options;
  if (!deleteFn) {
    notify(missingCallbackMessage || 'Delete callback is not configured.');
    return;
  }
  try {
    await deleteFn(id);
    if (publishLocalityIds && publishLocalityIds.length > 0 && publish) {
      await publish(publishLocalityIds);
    }
    notify(successMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : (genericErrorMessage || 'Failed to delete.');
    notify(message);
  }
}

/** Ported verbatim from AdminConsole.tsx's local `formatTemplateWorkflowError`. */
export const formatTemplateWorkflowError = (error: unknown, phase: 'save' | 'publish'): string => {
  const rawMessage = (error instanceof Error ? error.message : String(error || '')).trim();
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes('only one active default template is allowed')) {
    const existingTemplateNameMatch = rawMessage.match(/"([^"]+)"/);
    const existingTemplateName = existingTemplateNameMatch?.[1];
    return existingTemplateName
      ? `Another default template is already active: ${existingTemplateName}. Open that template first and remove Default fallback or set it inactive, then try again.`
      : 'Another default template is already active. Remove Default fallback from the current default template or set it inactive, then try again.';
  }

  if (normalized === 'unauthorized' || normalized.includes('401') || normalized.includes('forbidden')) {
    return 'Your admin session has expired or you do not have permission for this action. Please log in again and retry.';
  }

  if (normalized.includes('save callback is not configured')) {
    return 'Template save is not available in this environment right now. Please inform the tech team.';
  }

  if (normalized.includes('publish failed after template save')) {
    return 'Template was saved, but the publish step failed. The template exists in admin, but the live page may still show the old version.';
  }

  if (normalized.includes('failed to save scalable template')) {
    return 'Template could not be saved. Please retry once. If it still fails, inform the tech team.';
  }

  if (normalized.includes('failed to publish') || (normalized.includes('publish') && normalized.includes('failed'))) {
    return 'Template was saved, but publish did not complete. Please retry publish or ask the tech team to check the publish service.';
  }

  if (normalized.includes('networkerror') || normalized.includes('failed to fetch') || normalized.includes('fetch failed')) {
    return `Could not reach the server during template ${phase}. Check internet or server availability, then try again.`;
  }

  if (!rawMessage) {
    return phase === 'save'
      ? 'Template could not be saved due to an unexpected error.'
      : 'Template publish could not be completed due to an unexpected error.';
  }

  return phase === 'save'
    ? `Template could not be saved. Technical detail: ${rawMessage}`
    : `Template publish could not be completed. Technical detail: ${rawMessage}`;
};

/**
 * Ported verbatim from AdminConsole.tsx's local `persistScalableTemplateEntity` — kept as its
 * own function (rather than folded into the generic `persistScalableEntity` above) because it
 * has template-specific save-vs-publish phase error copy via `formatTemplateWorkflowError`.
 */
export async function persistScalableTemplateEntity(options: {
  save?: (template: ScalableHomepageTemplate) => Promise<unknown> | void;
  template: ScalableHomepageTemplate;
  successMessage: string;
  notify: (message: string) => void;
  publish?: (localityIds: string[]) => Promise<unknown> | void;
  publishLocalityIds?: string[];
}): Promise<{ saved: boolean; published: boolean }> {
  const { save, template, successMessage, notify, publish, publishLocalityIds } = options;
  if (!save) {
    notify(formatTemplateWorkflowError('Scalable template save callback is not configured.', 'save'));
    return { saved: false, published: false };
  }
  try {
    await save(template);
    try {
      if (publishLocalityIds && publishLocalityIds.length > 0 && publish) {
        await publish(publishLocalityIds);
      }
    } catch (error) {
      notify(formatTemplateWorkflowError(error, 'publish'));
      return { saved: true, published: false };
    }
    notify(successMessage);
    return { saved: true, published: true };
  } catch (error) {
    notify(formatTemplateWorkflowError(error, 'save'));
    return { saved: false, published: false };
  }
}

/** Ported verbatim from AdminConsole.tsx's local `deleteScalableTemplateEntity`. */
export async function deleteScalableTemplateEntity(options: {
  deleteFn?: (templateId: string) => Promise<unknown> | void;
  templateId: string;
  successMessage: string;
  notify: (message: string) => void;
  publish?: (localityIds: string[]) => Promise<unknown> | void;
  publishLocalityIds?: string[];
}): Promise<void> {
  const { deleteFn, templateId, successMessage, notify, publish, publishLocalityIds } = options;
  if (!deleteFn) {
    notify('Scalable template delete callback is not configured.');
    return;
  }
  try {
    await deleteFn(templateId);
    if (publishLocalityIds && publishLocalityIds.length > 0 && publish) {
      await publish(publishLocalityIds);
    }
    notify(successMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete scalable template.';
    notify(message);
  }
}
