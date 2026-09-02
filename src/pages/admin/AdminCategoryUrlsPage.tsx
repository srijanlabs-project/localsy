import React, { useState } from 'react';
import type { Locality } from '../../types';
import type { LocalityCategoryLink } from '../../components/AdminConsole';
import { BUSINESS_CATEGORIES, getSubcategoriesForCategory } from '../../categoryMaster';

type AdminCategoryUrlsPageProps = {
  localities: Locality[];
  localityCategoryLinks?: LocalityCategoryLink[];
  onCreateLocalityCategoryLink?: (payload: Omit<LocalityCategoryLink, 'id'>) => void;
  onDeleteLocalityCategoryLink?: (id: string) => void;
};

// Routed home for admin-backend-ux-spec.md Section 5.12 "Geography: Category URLs" —
// Section 9 build step 3. Ported from AdminConsole.tsx's Geography & Routing > Category
// URLs subtab. Also fixes a pre-existing mojibake bullet separator in the link list (an
// encoding artifact in the legacy tab's JSX, replaced here with a plain middot).
export default function AdminCategoryUrlsPage({
  localities,
  localityCategoryLinks = [],
  onCreateLocalityCategoryLink,
  onDeleteLocalityCategoryLink,
}: AdminCategoryUrlsPageProps) {
  const [linkLocalityId, setLinkLocalityId] = useState(localities[0]?.id || '');
  const [linkCategoryId, setLinkCategoryId] = useState(BUSINESS_CATEGORIES[0]?.id || '');
  const [linkSubcategoryId, setLinkSubcategoryId] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const localitySlug = localities.find((locality) => locality.id === linkLocalityId)?.slug || linkLocalityId;
    const filterSlug = linkSubcategoryId || linkCategoryId;
    const slug = `locality/${localitySlug}/${filterSlug}`;
    onCreateLocalityCategoryLink?.({
      localityId: linkLocalityId,
      categoryId: linkCategoryId,
      subcategoryId: linkSubcategoryId || undefined,
      slug,
    });
    notify('Locality + category URL mapping created.');
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Category URLs</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage locality+category landing routes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-950">Locality + Category URL Mapper</h3>

        {notification && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            {notification}
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
          <select
            value={linkLocalityId}
            onChange={(event) => setLinkLocalityId(event.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
          >
            {localities.map((locality) => (
              <option key={locality.id} value={locality.id}>{locality.name}</option>
            ))}
          </select>
          <select
            value={linkCategoryId}
            onChange={(event) => setLinkCategoryId(event.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
          >
            {BUSINESS_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select
            value={linkSubcategoryId}
            onChange={(event) => setLinkSubcategoryId(event.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
          >
            <option value="">All subcategories under selected category</option>
            {getSubcategoriesForCategory(linkCategoryId).map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
          </select>
          <button type="submit" className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold py-2 rounded-lg">
            Create Locality + Category URL
          </button>
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {localityCategoryLinks.map((link) => {
            const fullUrl = `${window.location.origin}/${link.slug}`;
            return (
              <div key={link.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-xs">
                <a href={fullUrl} target="_blank" rel="noreferrer" className="text-[#1E3A8A] font-mono break-all hover:underline">
                  {fullUrl}
                </a>
                <div className="text-[10px] text-slate-500 mt-1">
                  {localities.find((locality) => locality.id === link.localityId)?.name || link.localityId} · {link.subcategoryId || link.categoryId}
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
          {localityCategoryLinks.length === 0 && <div className="text-xs text-slate-400">No locality-category URLs created yet.</div>}
        </div>
      </div>
    </div>
  );
}
