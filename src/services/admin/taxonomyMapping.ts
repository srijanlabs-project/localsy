// Shared "create a subcategory inline" logic, extracted from AdminConsole.tsx so the new,
// separately-routed Listing Directory page (admin-backend-ux-spec.md Section 5.5) can offer
// the same inline-subcategory-creation affordance as the legacy console without duplicating
// the taxonomy-mutation logic.
import type { BusinessTaxonomyState } from '../../types';
import { buildUniqueAdminId } from './adminConsoleUtils';

export async function createInlineSubcategory(
  businessTaxonomy: BusinessTaxonomyState | undefined,
  onSaveBusinessTaxonomy: ((taxonomy: BusinessTaxonomyState) => Promise<BusinessTaxonomyState> | void) | undefined,
  categoryId: string,
  rawName: string,
  notify: (message: string) => void
): Promise<string> {
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
    notify(`Subcategory already exists: ${existingMatch.name}`);
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
  notify(`Created subcategory: ${name}`);
  return nextId;
}
