import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, Trash2, Zap } from 'lucide-react';
import { AUDIENCE_SEGMENTS_STORAGE_KEY } from './AdminAudienceSegmentsPage';
import type { AudienceSegment } from './AdminAudienceSegmentsPage';
import { appendAutomationLogEntry } from './AdminAutomationActivityLogPage';

// Routed home for admin-backend-ux-spec.md Section 5.32 "Marketing Automation: Automation
// Rules" — Section 9 build step 8. NET NEW, Phase 3; the spec's own note says this "depends on
// ... a notification-sending capability already existing before rules can act on them." Research
// confirmed no such capability exists anywhere in this repo — no email/SMS/push library is
// installed at all.
//
// Per the user's "local-state UI, clearly marked" policy: a real, interactive rule builder
// (localStorage-persisted), whose audience picker reads real segment definitions/live counts
// from Audience Segments (5.33). What's honestly NOT real, disclosed in the banner: there is no
// trigger engine watching for "business approved" or "lead unactioned 3 days" events, and
// enabling a rule does not make it actually fire. "Simulate fire" lets an admin manually create a
// test entry in the Automation Activity Log (5.34) to see what that log would look like — every
// such entry is explicitly labeled as a simulation, never presented as a real automated run.
export const AUTOMATION_RULES_STORAGE_KEY = 'localsy_admin_automation_rules_v1';

type TriggerType = 'business_approved' | 'lead_unactioned_3d' | 'review_left';
type ActionType = 'send_coupon' | 'notify_operator' | 'tag_business';

type AutomationRule = {
  id: string;
  name: string;
  trigger: TriggerType;
  segmentId: string; // 'all' or an AudienceSegment id
  action: ActionType;
  actionDetail: string;
  enabled: boolean;
};

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'business_approved', label: 'Business approved' },
  { value: 'lead_unactioned_3d', label: 'Lead unactioned 3+ days' },
  { value: 'review_left', label: 'Review left' },
];

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: 'send_coupon', label: 'Send coupon' },
  { value: 'notify_operator', label: 'Notify operator' },
  { value: 'tag_business', label: 'Tag business' },
];

let idCounter = 0;
const buildId = () => {
  idCounter += 1;
  return `rule_${idCounter}`;
};

const loadRules = (): AutomationRule[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(AUTOMATION_RULES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AutomationRule[]) : [];
  } catch {
    return [];
  }
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

export default function AdminAutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>(() => loadRules());
  const [segments, setSegments] = useState<AudienceSegment[]>(() => loadSegments());
  const [notification, setNotification] = useState<string | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(AUTOMATION_RULES_STORAGE_KEY, JSON.stringify(rules));
    } catch {
      // Best-effort persistence only.
    }
  }, [rules]);

  useEffect(() => {
    const onFocus = () => setSegments(loadSegments());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const segmentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    segments.forEach((segment) => { map[segment.id] = segment.name; });
    return map;
  }, [segments]);

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      notify('Give the rule a name first.');
      return;
    }
    const newRule: AutomationRule = {
      id: buildId(),
      name: name.trim(),
      trigger: TRIGGER_OPTIONS[0].value,
      segmentId: 'all',
      action: ACTION_OPTIONS[0].value,
      actionDetail: '',
      enabled: false,
    };
    setRules((prev) => [newRule, ...prev]);
    setName('');
  };

  const updateRule = (id: string, patch: Partial<AutomationRule>) => {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (rule: AutomationRule) => {
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    notify(`Removed "${rule.name}".`);
  };

  const simulateFire = (rule: AutomationRule) => {
    const actionLabel = ACTION_OPTIONS.find((opt) => opt.value === rule.action)?.label || rule.action;
    const segmentLabel = rule.segmentId === 'all' ? 'all businesses' : (segmentNameById[rule.segmentId] || 'an unknown segment');
    appendAutomationLogEntry({
      id: `log_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      action: actionLabel,
      outcome: 'skipped',
      firedAt: new Date().toISOString(),
      detail: `Simulated only — targeted "${segmentLabel}"; no real ${actionLabel.toLowerCase()} was sent.`,
    });
    notify(`Logged a simulated fire for "${rule.name}" — see Automation Activity Log.`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Automation Rules</h2>
        <p className="mt-0.5 text-xs text-slate-500">Trigger-based actions instead of manual, one-off campaign work.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">There is no trigger engine behind this yet.</span> This app has no
          notification-sending infrastructure (no email/SMS/push library is installed anywhere in the repo), so enabling a
          rule below does not make it actually watch for events or send anything. Rules are saved locally to this browser.
          Use "Simulate fire" to see what a real firing would look like in the Automation Activity Log — it's clearly logged
          as a simulation, not a real run.
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
          placeholder='New rule name, e.g. "Welcome coupon on approval"'
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B82F6]"
        >
          <Plus className="h-3.5 w-3.5" /> New rule
        </button>
      </form>

      {rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-xs text-slate-400">
          No rules yet — create one above.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  value={rule.name}
                  onChange={(event) => updateRule(rule.id, { name: event.target.value })}
                  className="rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-200 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${
                      rule.enabled ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button type="button" onClick={() => removeRule(rule)} title="Delete rule">
                    <Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-rose-600" />
                  </button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                <label className="text-[10px] uppercase tracking-wide text-slate-400">
                  Trigger
                  <select
                    value={rule.trigger}
                    onChange={(event) => updateRule(rule.id, { trigger: event.target.value as TriggerType })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs normal-case focus:outline-none"
                  >
                    {TRIGGER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="text-[10px] uppercase tracking-wide text-slate-400">
                  Audience
                  <select
                    value={rule.segmentId}
                    onChange={(event) => updateRule(rule.id, { segmentId: event.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs normal-case focus:outline-none"
                  >
                    <option value="all">All businesses</option>
                    {segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}
                  </select>
                  {segments.length === 0 && (
                    <span className="mt-0.5 block text-[10px] normal-case text-slate-400">No segments yet — see Audience Segments.</span>
                  )}
                </label>
                <label className="text-[10px] uppercase tracking-wide text-slate-400">
                  Action
                  <select
                    value={rule.action}
                    onChange={(event) => updateRule(rule.id, { action: event.target.value as ActionType })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs normal-case focus:outline-none"
                  >
                    {ACTION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="text-[10px] uppercase tracking-wide text-slate-400">
                  Action detail
                  <input
                    value={rule.actionDetail}
                    onChange={(event) => updateRule(rule.id, { actionDetail: event.target.value })}
                    placeholder="e.g. coupon code"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs normal-case focus:outline-none"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => simulateFire(rule)}
                className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                <Zap className="h-3 w-3" /> Simulate fire
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
