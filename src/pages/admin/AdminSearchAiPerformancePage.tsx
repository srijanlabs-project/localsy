import React from 'react';
import { AlertTriangle, Bot, Gauge, Languages, MessagesSquare } from 'lucide-react';

// Routed home for admin-backend-ux-spec.md Section 5.30 "Analytics & Insights: Search & AI
// Performance" — Section 9 build step 7. Section 5.30 itself marks this screen *(reserved —
// Phase 3)*: "Cannot be built ahead of the AI chat/search features themselves." Those features
// (hybrid search/RAG/chat, WhatsApp) don't exist in this app yet — there is no query log, no
// answer-accuracy signal, no transcript store, nothing to compute a real metric from.
//
// Per the user's explicit decision (Section 9 Step 6/7 scoping — same treatment as Merchant
// Claims, Role Builder, User Directory): rather than skip this route or leave a bare "coming
// soon" stub, it's built as a real page matching the spec's intended layout (metric tiles,
// query-volume/failure breakdown, sample-transcript review), but every section honestly shows
// its true state — no data — instead of inventing plausible-looking numbers. There is
// deliberately no "local-state" data entry here (unlike Role Builder/User Directory): there is
// nothing for an admin to usefully input by hand for a metric like "answer accuracy" or
// "WhatsApp resolution rate" ahead of the real feature, so faking manual entry would be more
// misleading than an honest empty state.
const METRIC_TILES = [
  { key: 'accuracy', label: 'Answer accuracy', icon: Bot },
  { key: 'response_time', label: 'Response time', icon: Gauge },
  { key: 'multilingual', label: 'Multilingual quality', icon: Languages },
  { key: 'whatsapp', label: 'WhatsApp resolution rate', icon: MessagesSquare },
];

export default function AdminSearchAiPerformancePage() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Search &amp; AI Performance</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Report the platform's named AI success metrics once hybrid search/RAG/chat and WhatsApp ship.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">This screen has nothing to measure yet.</span> The hybrid search/RAG/chat
          feature and WhatsApp integration this page is meant to report on don't exist in the product today — there
          is no query log, no answer-accuracy signal, and no transcript store anywhere in this app. Everything below
          is an honest empty state, not a placeholder with invented numbers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRIC_TILES.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">
              <Icon className="h-3 w-3" /> {label}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-300">No data yet</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-xs font-semibold text-slate-500">Query-volume &amp; failure-reason breakdown</p>
        <p className="mt-1 text-[11px] text-slate-400">Appears once query logging exists for a real search/chat feature.</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-xs font-semibold text-slate-500">Sample transcript review</p>
        <p className="mt-1 text-[11px] text-slate-400">Appears once conversations are actually being logged somewhere to sample from.</p>
      </div>
    </div>
  );
}
