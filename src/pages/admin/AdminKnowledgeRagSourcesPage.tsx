import React from 'react';
import { AlertTriangle, Database, FileWarning, RefreshCw } from 'lucide-react';

// Routed home for admin-backend-ux-spec.md Section 5.36 "AI & Integrations: Knowledge & RAG
// Sources" — Section 9 build step 8. Section 5.36 itself marks this screen *(reserved — Phase
// 3)*: it depends on the document ingestion pipeline (PDF/Excel/CSV → chunking → embedding)
// described in the AI Knowledge Platform architecture docs, which does not exist in this app
// today — there is no source registry, no chunk count, and no embedding-status signal anywhere
// to read.
//
// Per the user's explicit decision (same treatment as Merchant Claims, Search & AI Performance):
// built as a real page matching the spec's intended layout (source list with ingestion/chunk/
// embedding columns, re-ingest action, failure detail), but every section honestly shows its true
// state — no data — instead of inventing plausible-looking rows. Same judgment call as Search &
// AI Performance: no local-state manual data entry here either, since there's nothing meaningful
// for an admin to hand-enter for a document's "chunk count" or "embedding status" ahead of a real
// ingestion pipeline existing.
const TABLE_COLUMNS = ['Document', 'Type', 'Ingestion status', 'Chunk count', 'Embedding status', 'Last updated'];

export default function AdminKnowledgeRagSourcesPage() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Knowledge &amp; RAG Sources</h2>
        <p className="mt-0.5 text-xs text-slate-500">Admin view of the document ingestion pipeline feeding retrieval-augmented AI answers.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">There is no ingestion pipeline to report on yet.</span> The PDF/Excel/CSV → chunking
          → embedding pipeline this page is meant to manage doesn't exist in the product today — there is no source registry,
          no chunk count, and no embedding-status signal anywhere in this app. Everything below is an honest empty state, not
          a placeholder with invented rows.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="text-xs font-semibold text-slate-600">Sources</span>
          <button
            type="button"
            disabled
            title="Disabled — no ingestion pipeline exists to trigger"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300"
          >
            <RefreshCw className="h-3 w-3" /> Re-ingest / reindex
          </button>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              {TABLE_COLUMNS.map((col) => <th key={col} className="px-3 py-2 font-semibold">{col}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={TABLE_COLUMNS.length} className="px-3 py-8 text-center text-slate-400">
                <Database className="mx-auto mb-1.5 h-5 w-5 text-slate-300" />
                No sources have been ingested — this appears once the ingestion pipeline exists.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-400">
        <FileWarning className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>Failure detail panel appears here once a real ingestion run exists to fail.</p>
      </div>
    </div>
  );
}
