import React, { useMemo, useState } from 'react';
import { BusinessCategory, BusinessSubcategory, BusinessTaxonomyState } from '../types';
import { downloadCsvTemplate, getTabularValue, readTabularFile, TabularRow } from '../utils/tabularImport';

type BusinessTaxonomyManagerProps = {
  taxonomy: BusinessTaxonomyState;
  onSave?: (taxonomy: BusinessTaxonomyState) => Promise<BusinessTaxonomyState> | BusinessTaxonomyState | void;
};

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const emptyCategoryDraft = {
  id: '',
  name: '',
  slug: '',
  icon: 'category_icon',
  status: 'active' as BusinessCategory['status'],
  sortOrder: '',
};

const emptySubcategoryDraft = {
  id: '',
  categoryId: '',
  name: '',
  slug: '',
  icon: 'subcategory_icon',
  status: 'active' as BusinessSubcategory['status'],
  sortOrder: '',
};

const buildUniqueId = (seed: string, takenIds: Set<string>) => {
  const baseId = slugify(seed);
  if (!baseId) return '';
  if (!takenIds.has(baseId)) return baseId;
  let suffix = 2;
  while (takenIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
};

const resolveCategoryFromRow = (row: TabularRow, categories: BusinessCategory[]) => {
  const requestedId = getTabularValue(row, ['categoryId', 'category id', 'parentCategoryId', 'parent category id']);
  if (requestedId) {
    const directMatch = categories.find((category) => category.id === requestedId);
    if (directMatch) return directMatch;
  }

  const requestedName = getTabularValue(row, ['categoryName', 'category', 'parentCategoryName', 'parent category']);
  if (!requestedName) return null;

  return categories.find((category) => category.name.toLowerCase() === requestedName.toLowerCase()) || null;
};

export default function BusinessTaxonomyManager({
  taxonomy,
  onSave,
}: BusinessTaxonomyManagerProps) {
  const [categoryDraft, setCategoryDraft] = useState(emptyCategoryDraft);
  const [subcategoryDraft, setSubcategoryDraft] = useState(emptySubcategoryDraft);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const activeCategories = useMemo(
    () => [...taxonomy.categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [taxonomy.categories]
  );

  const groupedSubcategories = useMemo(() => {
    const groups = new Map<string, BusinessSubcategory[]>();
    taxonomy.subcategories.forEach((subcategory) => {
      if (!groups.has(subcategory.categoryId)) groups.set(subcategory.categoryId, []);
      groups.get(subcategory.categoryId)?.push(subcategory);
    });
    groups.forEach((items) => items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
    return groups;
  }, [taxonomy.subcategories]);

  const persist = async (nextTaxonomy: BusinessTaxonomyState, successMessage: string) => {
    if (!onSave) {
      setStatusText('Taxonomy save callback is not configured.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(nextTaxonomy);
      setStatusText(successMessage);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to save taxonomy.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    const name = categoryDraft.name.trim();
    const slug = slugify(categoryDraft.slug || name);
    const existingCategory = editingCategoryId
      ? taxonomy.categories.find((category) => category.id === editingCategoryId)
      : null;
    const id = existingCategory?.id || slugify(categoryDraft.id || slug || name);
    if (!name || !id) {
      setStatusText('Category name is required.');
      return;
    }

    const nextCategory: BusinessCategory = {
      id,
      legacyId: existingCategory?.legacyId || Date.now(),
      name,
      slug,
      icon: categoryDraft.icon.trim() || 'category_icon',
      status: categoryDraft.status,
      sortOrder: Number(categoryDraft.sortOrder || taxonomy.categories.length + 1),
    };

    const nextCategories = editingCategoryId
      ? taxonomy.categories.map((category) => (category.id === editingCategoryId ? nextCategory : category))
      : [...taxonomy.categories, nextCategory];

    await persist(
      {
        ...taxonomy,
        categories: nextCategories,
        metadata: { ...taxonomy.metadata, updatedAt: new Date().toISOString(), seededFromCode: false },
      },
      editingCategoryId ? 'Category updated.' : 'Category created.'
    );
    setCategoryDraft(emptyCategoryDraft);
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const nextTaxonomy: BusinessTaxonomyState = {
      ...taxonomy,
      categories: taxonomy.categories.filter((category) => category.id !== categoryId),
      subcategories: taxonomy.subcategories.filter((subcategory) => subcategory.categoryId !== categoryId),
      metadata: { ...taxonomy.metadata, updatedAt: new Date().toISOString(), seededFromCode: false },
    };
    await persist(nextTaxonomy, 'Category removed.');
    if (editingCategoryId === categoryId) {
      setCategoryDraft(emptyCategoryDraft);
      setEditingCategoryId(null);
    }
  };

  const handleSaveSubcategory = async () => {
    const name = subcategoryDraft.name.trim();
    const slug = slugify(subcategoryDraft.slug || name);
    const existingSubcategory = editingSubcategoryId
      ? taxonomy.subcategories.find((subcategory) => subcategory.id === editingSubcategoryId)
      : null;
    const id = existingSubcategory?.id || slugify(subcategoryDraft.id || slug || name);
    if (!name || !id || !subcategoryDraft.categoryId) {
      setStatusText('Subcategory name and parent category are required.');
      return;
    }

    const parentCategory = taxonomy.categories.find((category) => category.id === subcategoryDraft.categoryId);
    if (!parentCategory) {
      setStatusText('Please select a valid parent category.');
      return;
    }

    const nextSubcategory: BusinessSubcategory = {
      id,
      legacyId: existingSubcategory?.legacyId || Date.now(),
      parentLegacyId: parentCategory.legacyId,
      categoryId: subcategoryDraft.categoryId,
      name,
      slug,
      icon: subcategoryDraft.icon.trim() || 'subcategory_icon',
      status: subcategoryDraft.status,
      sortOrder: Number(subcategoryDraft.sortOrder || (groupedSubcategories.get(subcategoryDraft.categoryId)?.length || 0) + 1),
    };

    const nextSubcategories = editingSubcategoryId
      ? taxonomy.subcategories.map((subcategory) => (subcategory.id === editingSubcategoryId ? nextSubcategory : subcategory))
      : [...taxonomy.subcategories, nextSubcategory];

    await persist(
      {
        ...taxonomy,
        subcategories: nextSubcategories,
        metadata: { ...taxonomy.metadata, updatedAt: new Date().toISOString(), seededFromCode: false },
      },
      editingSubcategoryId ? 'Subcategory updated.' : 'Subcategory created.'
    );
    setSubcategoryDraft(emptySubcategoryDraft);
    setEditingSubcategoryId(null);
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    await persist(
      {
        ...taxonomy,
        subcategories: taxonomy.subcategories.filter((subcategory) => subcategory.id !== subcategoryId),
        metadata: { ...taxonomy.metadata, updatedAt: new Date().toISOString(), seededFromCode: false },
      },
      'Subcategory removed.'
    );
    if (editingSubcategoryId === subcategoryId) {
      setSubcategoryDraft(emptySubcategoryDraft);
      setEditingSubcategoryId(null);
    }
  };

  const importCategories = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await readTabularFile(file);
      const takenIds = new Set(taxonomy.categories.map((category) => category.id));
      let imported = 0;
      let skipped = 0;
      const nextCategories = [...taxonomy.categories];

      rows.forEach((row, index) => {
        const name = getTabularValue(row, ['name', 'categoryName', 'category']);
        const explicitId = getTabularValue(row, ['id', 'categoryId', 'slug']);
        const id = slugify(explicitId || name);
        if (!name || !id) {
          skipped += 1;
          return;
        }

        const existingCategory = nextCategories.find((category) => category.id === id);
        const uniqueId = existingCategory ? existingCategory.id : buildUniqueId(id, takenIds);
        if (!existingCategory && !uniqueId) {
          skipped += 1;
          return;
        }

        const nextCategory: BusinessCategory = {
          id: uniqueId,
          legacyId: existingCategory?.legacyId || Date.now() + index,
          name,
          slug: slugify(getTabularValue(row, ['slug']) || name),
          icon: getTabularValue(row, ['icon']) || existingCategory?.icon || 'category_icon',
          status: getTabularValue(row, ['status']).toLowerCase() === 'inactive' ? 'inactive' : (existingCategory?.status || 'active'),
          sortOrder: Number(getTabularValue(row, ['sortOrder', 'sort order']) || existingCategory?.sortOrder || nextCategories.length + 1),
        };

        if (existingCategory) {
          const targetIndex = nextCategories.findIndex((category) => category.id === existingCategory.id);
          nextCategories[targetIndex] = nextCategory;
        } else {
          takenIds.add(uniqueId);
          nextCategories.push(nextCategory);
        }
        imported += 1;
      });

      if (imported === 0) {
        setStatusText('No valid category rows found in the uploaded file.');
        return;
      }

      await persist(
        {
          ...taxonomy,
          categories: nextCategories,
          metadata: { ...taxonomy.metadata, updatedAt: new Date().toISOString(), seededFromCode: false },
        },
        `Imported ${imported} categories${skipped ? `, skipped ${skipped} rows.` : '.'}`
      );
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to import category file.');
    } finally {
      setIsImporting(false);
    }
  };

  const importSubcategories = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await readTabularFile(file);
      const takenIds = new Set(taxonomy.subcategories.map((subcategory) => subcategory.id));
      let imported = 0;
      let skipped = 0;
      const nextSubcategories = [...taxonomy.subcategories];

      rows.forEach((row, index) => {
        const name = getTabularValue(row, ['name', 'subcategoryName', 'subcategory', 'serviceName']);
        const parentCategory = resolveCategoryFromRow(row, taxonomy.categories);
        const explicitId = getTabularValue(row, ['id', 'subcategoryId', 'slug']);
        const id = slugify(explicitId || name);

        if (!name || !id || !parentCategory) {
          skipped += 1;
          return;
        }

        const existingSubcategory = nextSubcategories.find((subcategory) => subcategory.id === id);
        const uniqueId = existingSubcategory ? existingSubcategory.id : buildUniqueId(id, takenIds);
        if (!existingSubcategory && !uniqueId) {
          skipped += 1;
          return;
        }

        const siblingCount = nextSubcategories.filter((subcategory) => subcategory.categoryId === parentCategory.id).length;
        const nextSubcategory: BusinessSubcategory = {
          id: uniqueId,
          legacyId: existingSubcategory?.legacyId || Date.now() + index,
          parentLegacyId: parentCategory.legacyId,
          categoryId: parentCategory.id,
          name,
          slug: slugify(getTabularValue(row, ['slug']) || name),
          icon: getTabularValue(row, ['icon']) || existingSubcategory?.icon || 'subcategory_icon',
          status: getTabularValue(row, ['status']).toLowerCase() === 'inactive' ? 'inactive' : (existingSubcategory?.status || 'active'),
          sortOrder: Number(getTabularValue(row, ['sortOrder', 'sort order']) || existingSubcategory?.sortOrder || siblingCount + 1),
        };

        if (existingSubcategory) {
          const targetIndex = nextSubcategories.findIndex((subcategory) => subcategory.id === existingSubcategory.id);
          nextSubcategories[targetIndex] = nextSubcategory;
        } else {
          takenIds.add(uniqueId);
          nextSubcategories.push(nextSubcategory);
        }
        imported += 1;
      });

      if (imported === 0) {
        setStatusText('No valid subcategory rows found in the uploaded file.');
        return;
      }

      await persist(
        {
          ...taxonomy,
          subcategories: nextSubcategories,
          metadata: { ...taxonomy.metadata, updatedAt: new Date().toISOString(), seededFromCode: false },
        },
        `Imported ${imported} subcategories${skipped ? `, skipped ${skipped} rows.` : '.'}`
      );
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to import subcategory file.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Master Category Data</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Categories and subcategories now come from managed taxonomy state instead of hardcoded UI-only lists.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <div>Categories: <span className="font-bold text-slate-900">{taxonomy.categories.length}</span></div>
          <div>Subcategories: <span className="font-bold text-slate-900">{taxonomy.subcategories.length}</span></div>
        </div>
      </div>

      {statusText && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          {statusText}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Excel Import: Categories</div>
            <p className="mt-1 text-[11px] text-slate-500">
              Upload native `.xlsx` / `.xls` files or Excel-exported `.csv`, `.tsv`, and tab-separated files. Existing IDs update in place; new IDs are added.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsvTemplate('category-template.csv', ['id', 'name', 'slug', 'icon', 'status', 'sortOrder'], [['health-medical', 'Health & Medical', 'health-medical', 'category_icon', 'active', '1']])}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
            >
              Download Category Template
            </button>
            <label className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Upload Category File
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importCategories(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Excel Import: Subcategories</div>
            <p className="mt-1 text-[11px] text-slate-500">
              Supported headers include `categoryId`, `categoryName`, `id`, `name`, `slug`, `icon`, `status`, and `sortOrder`.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsvTemplate('subcategory-template.csv', ['categoryId', 'id', 'name', 'slug', 'icon', 'status', 'sortOrder'], [['health-medical', 'dental-clinic', 'Dental Clinic', 'dental-clinic', 'subcategory_icon', 'active', '1']])}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
            >
              Download Subcategory Template
            </button>
            <label className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Upload Subcategory File
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importSubcategories(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-900">Categories</div>
            <button
              type="button"
              onClick={() => {
                setCategoryDraft(emptyCategoryDraft);
                setEditingCategoryId(null);
              }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
            >
              New
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <input value={categoryDraft.name} onChange={(e) => setCategoryDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Category name" className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
            <input value={categoryDraft.id} onChange={(e) => setCategoryDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="ID / slug" className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono" />
            <input value={categoryDraft.icon} onChange={(e) => setCategoryDraft((prev) => ({ ...prev, icon: e.target.value }))} placeholder="Icon" className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
            <input value={categoryDraft.sortOrder} onChange={(e) => setCategoryDraft((prev) => ({ ...prev, sortOrder: e.target.value.replace(/\D/g, '') }))} placeholder="Sort order" className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono" />
            <select value={categoryDraft.status} onChange={(e) => setCategoryDraft((prev) => ({ ...prev, status: e.target.value as BusinessCategory['status'] }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button type="button" onClick={handleSaveCategory} disabled={isSaving || isImporting} className="rounded-lg bg-indigo-600 px-3 py-2 font-bold text-white disabled:opacity-50">
              {editingCategoryId ? 'Update Category' : 'Create Category'}
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {activeCategories.map((category) => (
              <div key={category.id} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{category.name}</div>
                    <div className="truncate font-mono text-[10px] text-slate-500">{category.id}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {category.status} | sort {category.sortOrder} | {groupedSubcategories.get(category.id)?.length || 0} subcategories
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setCategoryDraft({
                          id: category.id,
                          name: category.name,
                          slug: category.slug,
                          icon: category.icon,
                          status: category.status,
                          sortOrder: String(category.sortOrder),
                        });
                      }}
                      className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-900">Subcategories</div>
            <button
              type="button"
              onClick={() => {
                setSubcategoryDraft({ ...emptySubcategoryDraft, categoryId: activeCategories[0]?.id || '' });
                setEditingSubcategoryId(null);
              }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700"
            >
              New
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <select value={subcategoryDraft.categoryId} onChange={(e) => setSubcategoryDraft((prev) => ({ ...prev, categoryId: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="">Select category</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input value={subcategoryDraft.name} onChange={(e) => setSubcategoryDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Subcategory name" className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
            <input value={subcategoryDraft.id} onChange={(e) => setSubcategoryDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="ID / slug" className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono" />
            <input value={subcategoryDraft.icon} onChange={(e) => setSubcategoryDraft((prev) => ({ ...prev, icon: e.target.value }))} placeholder="Icon" className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
            <input value={subcategoryDraft.sortOrder} onChange={(e) => setSubcategoryDraft((prev) => ({ ...prev, sortOrder: e.target.value.replace(/\D/g, '') }))} placeholder="Sort order" className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono" />
            <select value={subcategoryDraft.status} onChange={(e) => setSubcategoryDraft((prev) => ({ ...prev, status: e.target.value as BusinessSubcategory['status'] }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button type="button" onClick={handleSaveSubcategory} disabled={isSaving || isImporting} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white disabled:opacity-50">
              {editingSubcategoryId ? 'Update Subcategory' : 'Create Subcategory'}
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {activeCategories.map((category) => (
              <div key={category.id} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                <div className="mb-2 font-semibold text-slate-900">{category.name}</div>
                <div className="space-y-2">
                  {(groupedSubcategories.get(category.id) || []).map((subcategory) => (
                    <div key={subcategory.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800">{subcategory.name}</div>
                        <div className="truncate font-mono text-[10px] text-slate-500">{subcategory.id}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubcategoryId(subcategory.id);
                            setSubcategoryDraft({
                              id: subcategory.id,
                              categoryId: subcategory.categoryId,
                              name: subcategory.name,
                              slug: subcategory.slug,
                              icon: subcategory.icon,
                              status: subcategory.status,
                              sortOrder: String(subcategory.sortOrder),
                            });
                          }}
                          className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                          className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {(groupedSubcategories.get(category.id) || []).length === 0 && (
                    <div className="text-[10px] text-slate-400">No subcategories yet.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
