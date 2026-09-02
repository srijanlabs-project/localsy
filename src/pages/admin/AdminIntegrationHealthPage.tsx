import React from 'react';
import { AlertTriangle, MessagesSquare, Plug, Sparkles } from 'lucide-react';

// Routed home for admin-backend-ux-spec.md Section 5.37 "AI & Integrations: Integration
// Health" — Section 9 build step 8, the final screen from the user's original "5,6,7,&8" ask.
// Net new; purpose is "one screen to see whether external integrations are actually working —
// AI provider uptime, WhatsApp Cloud API status once live, any future connector."
//
// Per the user's "local-state UI, clearly marked" policy: there is no health-check mechanism
// anywhere in this app for any of these integrations — no uptime ping, no WhatsApp Cloud API
// connection at all (confirmed during Step 7/8 research: no WhatsApp dependency or credential
// exists in this repo), and no generic connector-health framework. Rather than show fabricated
// green checkmarks, every tile below honestly reports "Unknown — no health check exists yet"
// instead of a fake status.
type IntegrationRow = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; detail: string };

const INTEGRATIONS: IntegrationRow[] = [
  { key: 'gemini', label: 'Google Gemini', icon: Sparkles, detail: 'API key is set server-side, but no uptime/latency health check calls it from this app.' },
  { key: 'openai', label: 'OpenAI', icon: Sparkles, detail: 'Not integrated anywhere in this app yet — no dependency, no credential, nothing to check.' },
  { key: 'whatsapp', label: 'WhatsApp Cloud API', icon: MessagesSquare, detail: 'Not integrated — no WhatsApp credential or client exists in this app.' },
];

export default function AdminIntegrationHealthPage() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Integration Health</h2>
        <p className="mt-0.5 text-xs text-slate-500">Whether external integrations are actually working.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">No real health checks exist for any integration below.</span> This app has no
          uptime-ping or connector-health framework — the statuses shown are honestly labeled "Unknown," not a fabricated
          "healthy" state. Build this once an actual health-check mechanism exists to back it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {INTEGRATIONS.map(({ key, label, icon: Icon, detail }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-[#1E3A8A]" />
              <span className="text-sm font-semibold text-slate-800">{label}</span>
            </div>
            <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              Unknown — no health check yet
            </span>
            <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-400">
        <Plug className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>Future connectors will appear here once they exist and a real health-check call can be wired up for them.</p>
      </div>
    </div>
  );
}
