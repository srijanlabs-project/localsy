import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Sparkles } from 'lucide-react';

// Routed home for admin-backend-ux-spec.md Section 5.35 "AI & Integrations: AI Provider
// Configuration" — Section 9 build step 8. The spec's own note calls this "a small, buildable
// first step even before the full RAG/chat feature ships, since it just formalizes what's
// currently a raw env var." Research confirmed exactly that: `GEMINI_API_KEY` is referenced only
// in setup docs (README.md, DEPLOYMENT_GUIDE.md, RELEASE_CHECKLIST.md) and is never actually read
// by `server.js` or anywhere in `src/` today — `@google/genai` is an installed dependency with no
// call site. There is no backend endpoint this page could call to read or write a real key.
//
// Per the user's "local-state UI, clearly marked" policy: this page is a real, interactive
// mockup of what an AI provider settings screen would look like (add/rotate a masked key, set a
// default model per use case), persisted to `localStorage` — but it cannot and does not touch the
// real environment variable. The banner says so plainly, and the Gemini row's status line makes
// clear the real key still only lives in server-side config.
const STORAGE_KEY = 'localsy_admin_ai_provider_config_v1';

type UseCase = 'chat' | 'embeddings' | 'classification';

type ProviderConfig = {
  localApiKeyDraft: string; // never a real credential — always empty unless the admin types a placeholder value
  defaultModelByUseCase: Record<UseCase, string>;
};

type StoredConfig = Record<'gemini' | 'openai', ProviderConfig>;

const USE_CASES: { key: UseCase; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'embeddings', label: 'Embeddings' },
  { key: 'classification', label: 'Classification' },
];

const PROVIDERS: { key: 'gemini' | 'openai'; label: string; modelOptions: string[]; realStatus: string; isConnected: boolean }[] = [
  {
    key: 'gemini',
    label: 'Google Gemini',
    modelOptions: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    realStatus: '`GEMINI_API_KEY` is set as a raw server env var today — this screen cannot read, change, or rotate it.',
    isConnected: true,
  },
  {
    key: 'openai',
    label: 'OpenAI',
    modelOptions: ['gpt-4o', 'gpt-4o-mini', 'text-embedding-3-large'],
    realStatus: 'Not integrated anywhere in this app yet — no dependency, no env var, no call site.',
    isConnected: false,
  },
];

const DEFAULT_CONFIG: StoredConfig = {
  gemini: { localApiKeyDraft: '', defaultModelByUseCase: { chat: 'gemini-2.0-flash', embeddings: 'gemini-1.5-flash', classification: 'gemini-1.5-flash' } },
  openai: { localApiKeyDraft: '', defaultModelByUseCase: { chat: 'gpt-4o-mini', embeddings: 'text-embedding-3-large', classification: 'gpt-4o-mini' } },
};

const loadConfig = (): StoredConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export default function AdminAiProviderConfigPage() {
  const [config, setConfig] = useState<StoredConfig>(() => loadConfig());
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Best-effort persistence only.
    }
  }, [config]);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateProvider = (key: 'gemini' | 'openai', patch: Partial<ProviderConfig>) => {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const updateModel = (key: 'gemini' | 'openai', useCase: UseCase, model: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], defaultModelByUseCase: { ...prev[key].defaultModelByUseCase, [useCase]: model } },
    }));
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">AI Provider Configuration</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage the AI providers in use — models, keys, and usage.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">This screen cannot read or change the real API key.</span> The live `GEMINI_API_KEY`
          is a server-side environment variable (set in `.env.local` / deployment config) with no admin-facing endpoint to
          manage it from a browser. Anything you type below — key drafts, default models — is saved locally to this browser
          only, as a preview of what a real settings screen would look like; it does not reach the server.
        </p>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const providerConfig = config[provider.key];
          const isRevealed = Boolean(revealed[provider.key]);
          return (
            <div key={provider.key} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#1E3A8A]" />
                  <span className="text-sm font-semibold text-slate-800">{provider.label}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  provider.isConnected ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
                >
                  {provider.isConnected ? 'Configured server-side' : 'Not integrated'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{provider.realStatus}</p>

              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={isRevealed ? 'text' : 'password'}
                    value={providerConfig.localApiKeyDraft}
                    onChange={(event) => updateProvider(provider.key, { localApiKeyDraft: event.target.value })}
                    placeholder="Local-only key draft (illustrative — not sent anywhere)"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => setRevealed((prev) => ({ ...prev, [provider.key]: !prev[provider.key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={isRevealed ? 'Hide' : 'Reveal'}
                  >
                    {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => notify(`Saved locally only — the real ${provider.label} key on the server is unchanged.`)}
                  className="rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B82F6]"
                >
                  Save (local only)
                </button>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {USE_CASES.map((useCase) => (
                  <label key={useCase.key} className="text-[10px] uppercase tracking-wide text-slate-400">
                    Default model — {useCase.label}
                    <select
                      value={providerConfig.defaultModelByUseCase[useCase.key]}
                      onChange={(event) => updateModel(provider.key, useCase.key, event.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs normal-case focus:outline-none"
                    >
                      {provider.modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-xs font-semibold text-slate-500">Usage &amp; cost summary</p>
        <p className="mt-1 text-[11px] text-slate-400">
          No usage or spend tracking exists for either provider today — this section will populate once that instrumentation is built.
        </p>
      </div>
    </div>
  );
}
