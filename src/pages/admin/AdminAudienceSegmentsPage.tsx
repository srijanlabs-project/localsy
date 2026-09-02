import React, { useEffect, useState } from 'react';
import { AlertTriangle, Layers as LayersIcon, Plus, Trash2 } from 'lucide-react';
import type { Business, Locality } from '../../types';

type AdminAudienceSegmentsPageProps = {
  businesses: Business[];
  localities: Locality[];
};

// Routed home for admin-backend-ux-spec.md Section 5.33 "Marketing Automation: Audience
// Segments" — Section 9 build step 8. NET NEW, no legacy tab to port, and no automation or
// campaign-sending engine anywhere in this app to actually *use* a segment once built.
//
// Per the user's standing "local-state UI, clearly marked" policy: segment definitions are
// LOCAL-STATE (`localStorage`-persisted, same pattern as Role Builder/User Directory) — but the
// "live count" for each segment IS computed for real, against the actual `businesses` prop
// already loaded elsewhere in the app, using real fields (locality, listing status, KYC status,
// verified badge, govt-registered) rather than a fabricated number. What isn't real: there is no
// automation/campaign engine that can act on a segment once it exists — see this page's own
// banner and Automation Rules' (5.32) banner.
export const AUDIENCE_SEGMENTS_STORAGE_KEY = 'localsy_admin_audience_segments_v1';

export type SegmentField = 'localityId' | 'status' | 'kycStatus' | 'verifiedBadge' | 'govRegistered';

export type SegmentCondition = {
  id: string;
  field: SegmentField;
  value: string; // stringified match value; booleans stored as 'true'/'false'
};

export type AudienceSegment = {
  id: string;
  name: string;
  combinator: 'AND' | 'OR';
  conditions: SegmentCondition[];
};

const FIELD_OPTIONS: { value: SegmentField; label: string }[] = [
  { value: 'localityId', label: 'Locality' },
  { value: 'status', label: 'Listing status' },
  { value: 'kycStatus', label: 'KYC status' },
  { value: 'verifiedBadge', label: 'Verified badge' },
  { value: 'govRegistered', label: 'Govt. registered' },
];

let idCounter = 0;
const buildId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
};

const loadSegments = (): AudienceSegment[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(AUDIENCE_SEGMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AudienceSegment[]) : [];
  } catch {
    return [];
  }
};

function matchesCondition(business: Business, condition: SegmentCondition): boolean {
  switch (condition.field) {
    case 'localityId': return business.localityId === condition.value;
    case 'status': return business.status === condition.value;
    case 'kycStatus': return (business.kycStatus || 'none') === condition.value;
    case 'verifiedBadge': return Boolean(business.verifiedBadge) === (condition.value === 'true');
    case 'govRegistered': return Boolean(business.govRegistered) === (condition.value === 'true');
    default: return false;
  }
}

function countMatches(businesses: Business[], segment: AudienceSegment): number {
  if (segment.conditions.length === 0) return businesses.length;
  return businesses.filter((business) => (
    segment.combinator === 'AND'
      ? segment.conditions.every((condition) => matchesCondition(business, condition))
      : segment.conditions.some((condition) => matchesCondition(business, condition))
  )).length;
}

function valueOptionsFor(field: SegmentField, localities: Locality[]): { value: string; label: string }[] {
  switch (field) {
    case 'localityId': return localities.map((locality) => ({ value: locality.id, label: locality.name }));
    case 'status': return [
      { value: 'approved', label: 'Approved' },
      { value: 'pending', label: 'Pending' },
      { value: 'rejected', label: 'Rejected' },
    ];
    case 'kycStatus': return [
      { value: 'verified', label: 'Verified' },
      { value: 'pending', label: 'Pending' },
      { value: 'none', label: 'None' },
    ];
    case 'verifiedBadge':
    case 'govRegistered':
      return [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
    default: return [];
  }
}

export default function AdminAudienceSegmentsPage({ businesses, localities }: AdminAudienceSegmentsPageProps) {
  const [segments, setSegments] = useState<AudienceSegment[]>(() => loadSegments());
  const [name, setName] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(AUDIENCE_SEGMENTS_STORAGE_KEY, JSON.stringify(segments));
    } catch {
      // Best-effort persistence only.
    }
  }, [segments]);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      notify('Give the segment a name first.');
      return;
    }
    const newSegment: AudienceSegment = { id: buildId('segment'), name: name.trim(), combinator: 'AND', conditions: [] };
    setSegments((prev) => [newSegment, ...prev]);
    setName('');
  };

  const updateSegment = (id: string, patch: Partial<AudienceSegment>) => {
    setSegments((prev) => prev.map((segment) => (segment.id === id ? { ...segment, ...patch } : segment)));
  };

  const removeSegment = (segment: AudienceSegment) => {
    setSegments((prev) => prev.filter((s) => s.id !== segment.id));
    notify(`Removed "${segment.name}".`);
  };

  const addCondition = (segment: AudienceSegment) => {
    const field = FIELD_OPTIONS[0].value;
    const options = valueOptionsFor(field, localities);
    const newCondition: SegmentCondition = { id: buildId('cond'), field, value: options[0]?.value || '' };
    updateSegment(segment.id, { conditions: [...segment.conditions, newCondition] });
  };

  const updateCondition = (segment: AudienceSegment, conditionId: string, patch: Partial<SegmentCondition>) => {
    updateSegment(segment.id, {
      conditions: segment.conditions.map((condition) => {
        if (condition.id !== conditionId) return condition;
        const next = { ...condition, ...patch };
        if (patch.field && patch.field !== condition.field) {
          const options = valueOptionsFor(patch.field, localities);
          next.value = options[0]?.value || '';
        }
        return next;
      }),
    });
  };

  const removeCondition = (segment: AudienceSegment, conditionId: string) => {
    updateSegment(segment.id, { conditions: segment.conditions.filter((condition) => condition.id !== conditionId) });
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Audience Segments</h2>
        <p className="mt-0.5 text-xs text-slate-500">Define reusable audience segments for automation rules and manual campaigns.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">Segment definitions are saved locally to this browser, not to a real backend.</span>{' '}
          The "matching now" count for each segment below IS computed for real, against the actual listings currently loaded
          — it isn't a fabricated number. What isn't real: there is no automation or campaign-sending engine anywhere in this
          app yet that can actually act on a segment once it's built (see Automation Rules' own banner).
        </p>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder='New segment name, e.g. "Unverified merchants in Andheri"'
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B82F6]"
        >
          <Plus className="h-3.5 w-3.5" /> New segment
        </button>
      </form>

      {segments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-xs text-slate-400">
          No segments yet — create one above.
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((segment) => {
            const count = countMatches(businesses, segment);
            return (
              <div key={segment.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <LayersIcon className="h-4 w-4 text-[#1E3A8A]" />
                    <input
                      value={segment.name}
                      onChange={(event) => updateSegment(segment.id, { name: event.target.value })}
                      className="rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#1E3A8A]/10 px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A]">
                      {count} matching now
                    </span>
                    <button type="button" onClick={() => removeSegment(segment)} title="Delete segment">
                      <Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-rose-600" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span>Match</span>
                  <select
                    value={segment.combinator}
                    onChange={(event) => updateSegment(segment.id, { combinator: event.target.value as 'AND' | 'OR' })}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold focus:outline-none"
                  >
                    <option value="AND">ALL</option>
                    <option value="OR">ANY</option>
                  </select>
                  <span>of the conditions below:</span>
                </div>

                <div className="mt-2 space-y-2">
                  {segment.conditions.map((condition) => (
                    <div key={condition.id} className="flex flex-wrap items-center gap-2">
                      <select
                        value={condition.field}
                        onChange={(event) => updateCondition(segment, condition.id, { field: event.target.value as SegmentField })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] focus:outline-none"
                      >
                        {FIELD_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <span className="text-[11px] text-slate-400">is</span>
                      <select
                        value={condition.value}
                        onChange={(event) => updateCondition(segment, condition.id, { value: event.target.value })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] focus:outline-none"
                      >
                        {valueOptionsFor(condition.field, localities).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeCondition(segment, condition.id)} title="Remove condition">
                        <Trash2 className="h-3 w-3 text-slate-300 hover:text-rose-600" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addCondition(segment)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#1E3A8A] hover:text-[#3B82F6]"
                  >
                    <Plus className="h-3 w-3" /> Add condition
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
