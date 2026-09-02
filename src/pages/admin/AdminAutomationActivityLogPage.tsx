import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Routed home for admin-backend-ux-spec.md Section 5.34 "Marketing Automation: Automation
// Activity Log" — Section 9 build step 8. Net new; the spec's own note says this "should ship
// alongside 5.32, not after — automation without a visible activity trail is a support
// liability," so it's built together with Automation Rules in this same step.
//
// Per the user's "local-state UI, clearly marked" policy: there is no real automation engine
// anywhere in this app (confirmed during research — no email/SMS/push library is installed), so
// a genuinely real activity log would always be empty. Rather than leave a permanently-empty
// page, entries here are written by Automation Rules' (5.32) "Simulate fire" action — a manual
// test action an admin triggers on purpose, clearly labeled as a simulation in every row's
// detail text, never presented as a real automated run.
export const AUTOMATION_ACTIVITY_LOG_STORAGE_KEY = 'localsy_admin_automation_activity_log_v1';

export type AutomationLogOutcome = 'sent' | 'skipped' | 'failed';

export type AutomationLogEntry = {
  id: string;
  ruleId: string;
  ruleName: string;
  action: string;
  outcome: AutomationLogOutcome;
  firedAt: string; // ISO timestamp
  detail: string;
};

export function loadAutomationLog(): AutomationLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(AUTOMATION_ACTIVITY_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AutomationLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendAutomationLogEntry(entry: AutomationLogEntry) {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadAutomationLog();
    const next = [entry, ...existing].slice(0, 200);
    window.localStorage.setItem(AUTOMATION_ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort persistence only.
  }
}

const OUTCOME_OPTIONS = ['all', 'sent', 'skipped', 'failed'] as const;

export default function AdminAutomationActivityLogPage() {
  const [entries, setEntries] = useState<AutomationLogEntry[]>(() => loadAutomationLog());
  const [outcomeFilter, setOutcomeFilter] = useState<(typeof OUTCOME_OPTIONS)[number]>('all');
  const [search, setSearch] = useState('');

  // Storage is written by AdminAutomationRulesPage's "Simulate fire" action, possibly on a
  // different mount of this route. Refresh on focus so a fire made just before navigating here
  // shows up without a manual reload.
  useEffect(() => {
    const onFocus = () => setEntries(loadAutomationLog());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const filtered = useMemo(() => entries.filter((entry) => {
    if (outcomeFilter !== 'all' && entry.outcome !== outcomeFilter) return false;
    if (search.trim() && !entry.ruleName.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  }), [entries, outcomeFilter, search]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Automation Activity Log</h2>
        <p className="mt-0.5 text-xs text-slate-500">What each automation rule fired, when, and with what outcome.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">There is no real automation engine behind this log.</span> This app has no
          trigger/notification-sending infrastructure yet (no email/SMS/push library is installed anywhere in the repo), so
          nothing here fires against real users or real events. Every entry below was created by clicking "Simulate fire" on
          the Automation Rules screen — a manual test action, not a real automated run.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={outcomeFilter}
          onChange={(event) => setOutcomeFilter(event.target.value as (typeof OUTCOME_OPTIONS)[number])}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          {OUTCOME_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt === 'all' ? 'All outcomes' : opt}</option>)}
        </select>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by rule name"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {entries.length === 0
              ? 'No activity yet — use "Simulate fire" on Automation Rules to see a test entry here.'
              : 'No entries match this filter.'}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Rule</th>
                <th className="px-3 py-2 font-semibold">Action</th>
                <th className="px-3 py-2 font-semibold">Outcome</th>
                <th className="px-3 py-2 font-semibold">Detail</th>
                <th className="px-3 py-2 font-semibold">Fired at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-3 py-2 font-semibold text-slate-800">{entry.ruleName}</td>
                  <td className="px-3 py-2 text-slate-600">{entry.action}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      entry.outcome === 'sent' ? 'bg-emerald-50 text-emerald-800'
                        : entry.outcome === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}
                    >
                      {entry.outcome}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{entry.detail}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                    {new Date(entry.firedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
