import React from 'react';
import BusinessTaxonomyManager from '../../components/BusinessTaxonomyManager';
import type { BusinessTaxonomyState } from '../../types';

type AdminCategoryTaxonomyPageProps = {
  businessTaxonomy?: BusinessTaxonomyState;
  onSaveBusinessTaxonomy?: (taxonomy: BusinessTaxonomyState) => Promise<BusinessTaxonomyState> | void;
};

// Routed home for admin-backend-ux-spec.md Section 5.24 "Category Taxonomy" — Section 9
// build step. This one is a thin wrapper: `BusinessTaxonomyManager` already existed as a
// self-contained category/subcategory taxonomy editor (was previously only reachable via
// Platform Config > "Category Taxonomy" in the legacy console); this route gives it its own
// place in the new Platform Config nav group per the spec's migration map. No logic ported —
// same pattern as AdminGeographyMasterPage.tsx. The legacy console's Platform Config tab
// keeps mounting the same component unchanged.
export default function AdminCategoryTaxonomyPage({ businessTaxonomy, onSaveBusinessTaxonomy }: AdminCategoryTaxonomyPageProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Category Taxonomy</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage business categories and subcategories — the taxonomy listings and homepage sections are built from.</p>
      </div>
      {businessTaxonomy ? (
        <BusinessTaxonomyManager taxonomy={businessTaxonomy} onSave={onSaveBusinessTaxonomy} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
          Category taxonomy isn't configured for this environment yet.
        </div>
      )}
    </div>
  );
}
