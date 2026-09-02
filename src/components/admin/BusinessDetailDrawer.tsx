import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Business, Locality } from '../../types';

type BusinessDetailDrawerProps = {
  business: Business;
  locality?: Locality;
  canEdit: boolean;
  onClose: () => void;
  onSave: (business: Business) => void;
  onOpenFullEditor: () => void;
};

type EditableFields = Pick<Business, 'name' | 'ownerName' | 'phone' | 'email' | 'website' | 'address' | 'hours' | 'description' | 'featured' | 'verifiedBadge'>;

const toDraft = (business: Business): EditableFields => ({
  name: business.name,
  ownerName: business.ownerName || '',
  phone: business.phone,
  email: business.email || '',
  website: business.website,
  address: business.address,
  hours: business.hours || '',
  description: business.description,
  featured: business.featured,
  verifiedBadge: business.verifiedBadge || false,
});

// Right-side detail/edit panel per design-language.md Section 11.4 ("used for single-record
// detail/edit instead of full-page navigation... slide in from the right"). This covers the
// day-to-day profile fields an operator edits most often; category/subcategory and
// approve/suspend/reject stay on the Listing Directory row itself (already there), and
// anything not covered here (geography reassignment, gallery images, GPS, tags) still routes
// to "Open full editor" in the legacy console — this is a scoped drawer, not full parity yet.
export default function BusinessDetailDrawer({ business, locality, canEdit, onClose, onSave, onOpenFullEditor }: BusinessDetailDrawerProps) {
  const [draft, setDraft] = useState<EditableFields>(() => toDraft(business));

  useEffect(() => {
    setDraft(toDraft(business));
  }, [business.id]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(toDraft(business));

  const field = (label: string, key: keyof EditableFields, type: 'text' | 'textarea' = 'text') => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={String(draft[key] ?? '')}
          disabled={!canEdit}
          onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
        />
      ) : (
        <input
          type="text"
          value={String(draft[key] ?? '')}
          disabled={!canEdit}
          onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[480px] flex-col bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-950">{business.name}</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">{locality?.name || business.localityId} · {business.id}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {!canEdit && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
              Your role has view-only access to listings.
            </div>
          )}
          {field('Business name', 'name')}
          {field('Proprietor', 'ownerName')}
          <div className="grid grid-cols-2 gap-3">
            {field('Phone', 'phone')}
            {field('Email', 'email')}
          </div>
          {field('Website', 'website')}
          {field('Address', 'address')}
          {field('Hours', 'hours')}
          {field('Description', 'description', 'textarea')}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={draft.featured}
                disabled={!canEdit}
                onChange={(e) => setDraft((prev) => ({ ...prev, featured: e.target.checked }))}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={draft.verifiedBadge}
                disabled={!canEdit}
                onChange={(e) => setDraft((prev) => ({ ...prev, verifiedBadge: e.target.checked }))}
              />
              Verified badge
            </label>
          </div>

          <button
            type="button"
            onClick={onOpenFullEditor}
            className="text-[11px] font-semibold text-[#1E3A8A] underline underline-offset-2"
          >
            Open full editor in legacy console (geography, taxonomy, gallery, GPS, tags)...
          </button>
        </div>

        {canEdit && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isDirty}
              onClick={() => onSave({ ...business, ...draft })}
              className="rounded-lg bg-[#1E3A8A] px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
