import { BusinessCategory, BusinessSubcategory } from './types';
import {
  buildBusinessTaxonomySeed,
  LEGACY_CATEGORY_TO_DEFAULT_SUBCATEGORY,
  LEGACY_CATEGORY_TO_MASTER_CATEGORY,
} from '../shared/businessTaxonomySeed.js';

const fallbackTaxonomy = buildBusinessTaxonomySeed();

export let BUSINESS_CATEGORIES: BusinessCategory[] = fallbackTaxonomy.categories as BusinessCategory[];
export let BUSINESS_SUBCATEGORIES: BusinessSubcategory[] = fallbackTaxonomy.subcategories as BusinessSubcategory[];

const rebuildDefaultSubcategoryMap = (categories: BusinessCategory[], subcategories: BusinessSubcategory[]) => (
  Object.fromEntries(
    categories.map((category) => [
      category.id,
      subcategories.find((subcategory) => subcategory.categoryId === category.id)?.id || '',
    ])
  )
);

export let DEFAULT_SUBCATEGORY_BY_CATEGORY: Record<string, string> = rebuildDefaultSubcategoryMap(
  BUSINESS_CATEGORIES,
  BUSINESS_SUBCATEGORIES,
);

export const setBusinessTaxonomyCatalog = (
  categories: BusinessCategory[],
  subcategories: BusinessSubcategory[],
) => {
  BUSINESS_CATEGORIES = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  BUSINESS_SUBCATEGORIES = [...subcategories].sort((a, b) => {
    if (a.categoryId !== b.categoryId) return a.categoryId.localeCompare(b.categoryId);
    return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  });
  DEFAULT_SUBCATEGORY_BY_CATEGORY = rebuildDefaultSubcategoryMap(BUSINESS_CATEGORIES, BUSINESS_SUBCATEGORIES);
};

export const resetBusinessTaxonomyCatalog = () => {
  setBusinessTaxonomyCatalog(
    fallbackTaxonomy.categories as BusinessCategory[],
    fallbackTaxonomy.subcategories as BusinessSubcategory[],
  );
};

export const getSubcategoriesForCategory = (categoryId: string) =>
  BUSINESS_SUBCATEGORIES.filter((subcategory) => subcategory.categoryId === categoryId);

export const getCategoryById = (categoryId: string) =>
  BUSINESS_CATEGORIES.find((category) => category.id === categoryId);

export const getSubcategoryById = (subcategoryId: string) =>
  BUSINESS_SUBCATEGORIES.find((subcategory) => subcategory.id === subcategoryId);

export const resolveMasterCategoryId = (categoryId: string) =>
  LEGACY_CATEGORY_TO_MASTER_CATEGORY[categoryId] || categoryId;

export const resolveDefaultSubcategoryId = (categoryId: string) => {
  const masterCategoryId = resolveMasterCategoryId(categoryId);
  return (
    LEGACY_CATEGORY_TO_DEFAULT_SUBCATEGORY[categoryId] ||
    DEFAULT_SUBCATEGORY_BY_CATEGORY[masterCategoryId] ||
    ''
  );
};
