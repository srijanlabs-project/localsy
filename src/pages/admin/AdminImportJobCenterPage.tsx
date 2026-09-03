import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { useAdminBackgroundJobs, type AdminBackgroundJob, type AdminJobStatus } from '../../contexts/AdminBackgroundJobsContext';

// Routed home for admin-backend-ux-spec.md Section 5.38 "Platform Config: Import & Job
// Center" — this screen is NET NEW; there is no legacy console tab to port, it did not
// exist before this Phase 1 pass.
//
// Real limitation (do not paper over): the spec describes this as a full-history view
// across "every upload surface" (hero banners, ad creatives, community posts, taxonomy
// Excel import, geography Excel import, bulk import). In practice, only
// AdminBulkImportPage.tsx calls createJob/updateJob on the shared AdminBackgroundJobsContext
// today — every other upload surface still uses its own local component state and does not
// report into this shared job list. So this screen will, in practice, only ever show Bulk
// Import jobs right now. Wiring those other surfaces into the shared context is out of scope
// for this task (separate follow-up) — we do NOT invent fake job rows for them here. A
// visible banner below (not just this comment) says so honestly.
//
// Also per the context's own doc comment (see AdminBackgroundJobsContext.tsx): full
// row-level import preview data is memory-only, not persisted here. So this page only ever
// has job metadata to show — it deliberately does not offer "download original file" or
// "download error report" actions, since AdminBackgroundJob has no data backing either of
// those. For needs_review jobs, we link back to /bulk-upload, where the real preview table
// (and its own download actions) lives.
export default function AdminImportJobCenterPage() {
  const { jobs, acknowledgeJob, clearFinishedJobs } = useAdminBackgroundJobs();
  const [statusFilter, setStatusFilter] = useState<'all' | AdminJobStatus>('all');
  const [search, setSearch] = useState('');

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (!query) return true;
      return (
        job.fileName.toLowerCase().includes(query) ||
        job.originScreen.toLowerCase().includes(query)
      );
    });
  }, [jobs, statusFilter, search]);

  const finishedCount = jobs.filter((job) => job.status === 'done' || job.status === 'failed').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Import &amp; Job Center</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Full history of background jobs — status, timestamps, and row counts for imports run from this console.
          </p>
        </div>
        <button
          type="button"
          onClick={clearFinishedJobs}
          disabled={finishedCount === 0}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear {finishedCount > 0 ? finishedCount : ''} finished job{finishedCount === 1 ? '' : 's'} (done/failed)
        </button>
      </div>

      <ServerImportQueue />

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">This browser session</h3>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">The list below is parse/validation progress only, held in this tab.</span>{' '}
          It covers Bulk Import; other upload surfaces — hero banners, ad creatives, community posts, and
          taxonomy/geography Excel imports — track their own progress on their own screens. Once rows are applied,
          the durable record is the server queue above, which survives a reload.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-1">
          {(['all', 'queued', 'processing', 'needs_review', 'done', 'failed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                statusFilter === status
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search file name or origin screen…"
          className="ml-auto w-full max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-[#3B82F6] focus:outline-none"
        />
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No background jobs yet</p>
          <p className="max-w-sm text-xs text-slate-400">
            Run a Bulk Import from the Bulk Import screen and it will show up here with live status.
          </p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-400">
          No jobs match this filter/search.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">File</th>
                <th className="px-4 py-2.5 font-semibold">Origin</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Counts</th>
                <th className="px-4 py-2.5 font-semibold">Created</th>
                <th className="px-4 py-2.5 font-semibold">Updated</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <React.Fragment key={job.id}>
                  <JobRow job={job} onAcknowledge={() => acknowledgeJob(job.id)} />
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function JobRow({ job, onAcknowledge }: { job: AdminBackgroundJob; onAcknowledge: () => void }) {
  const counts: string[] = [];
  if (typeof job.readyCount === 'number') counts.push(`${job.readyCount} ready`);
  if (typeof job.updateCount === 'number') counts.push(`${job.updateCount} updates`);
  if (typeof job.failedCount === 'number') counts.push(`${job.failedCount} failed`);

  return (
    <tr className="align-top">
      <td className="px-4 py-2.5 font-semibold text-slate-800">{job.fileName}</td>
      <td className="px-4 py-2.5 text-slate-600">{job.originScreen}</td>
      <td className="px-4 py-2.5">
        <StatusBadge status={job.status} />
        {job.status === 'needs_review' && job.acknowledged && (
          <div className="mt-1 text-[10px] font-medium text-slate-400">Acknowledged</div>
        )}
      </td>
      <td className="px-4 py-2.5 text-slate-600">
        {counts.length > 0 ? counts.join(' · ') : <span className="text-slate-300">—</span>}
        {job.summary && <div className="mt-0.5 max-w-xs text-[11px] text-slate-400">{job.summary}</div>}
      </td>
      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{formatTimestamp(job.createdAt)}</td>
      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{formatTimestamp(job.updatedAt)}</td>
      <td className="px-4 py-2.5">
        <div className="flex flex-col items-end gap-1.5">
          {job.status === 'needs_review' && (
            <Link
              to="/bulk-upload"
              className="rounded-lg bg-[#1E3A8A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#3B82F6]"
            >
              Review in Bulk Import
            </Link>
          )}
          {job.status === 'needs_review' && !job.acknowledged && (
            <button
              type="button"
              onClick={onAcknowledge}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Acknowledge
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

const STATUS_STYLES: Record<AdminJobStatus, string> = {
  queued: 'border-slate-200 bg-slate-100 text-slate-700',
  processing: 'border-slate-200 bg-slate-100 text-slate-700',
  needs_review: 'border-amber-200 bg-amber-50 text-amber-900',
  done: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  failed: 'border-rose-100 bg-rose-50 text-rose-700',
};

function StatusBadge({ status }: { status: AdminJobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status === 'done' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'failed' && <AlertTriangle className="h-3 w-3" />}
      {status.replace('_', ' ')}
    </span>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---- Server-side import queue -------------------------------------------
// The list above is this tab's memory: it tracks parsing and validation, and it
// is gone on reload. Applying a preview hands the rows to the server queue
// (POST /api/admin/imports), which writes them to the listings table in
// batches in the background. This section is that queue — the durable record,
// readable from any browser, and the only place to see whether the rows
// actually landed.
type ServerImportJob = {
  id: string;
  label: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  totalRows: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

const SERVER_STATUS_STYLES: Record<ServerImportJob['status'], string> = {
  queued: 'border-slate-200 bg-slate-100 text-slate-700',
  running: 'border-sky-200 bg-sky-50 text-sky-800',
  completed: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  failed: 'border-rose-100 bg-rose-50 text-rose-700',
};

function ServerImportQueue() {
  const [jobs, setJobs] = useState<ServerImportJob[]>([]);
  const [databaseAvailable, setDatabaseAvailable] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState('');

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('yp_auth_token') || '';
      const response = await fetch('/api/admin/imports?limit=20', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        setError(response.status === 404 ? 'This server build has no import queue yet.' : `Could not read the queue (${response.status}).`);
        return;
      }
      const data = await response.json();
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      setDatabaseAvailable(data?.database !== false);
      setError('');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll while anything is still in flight; idle queues do not need refreshing.
  const hasActiveJob = jobs.some((job) => job.status === 'queued' || job.status === 'running');
  useEffect(() => {
    if (!hasActiveJob) return undefined;
    const timer = setInterval(() => { void load(); }, 2500);
    return () => clearInterval(timer);
  }, [hasActiveJob, load]);

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Server import queue</h3>
          <p className="text-[11px] text-slate-500">
            Rows written to the listings table in the background. Survives a reload and is shared across admins.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void load(); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          {hasActiveJob ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">{error}</p>
      )}
      {!databaseAvailable && !error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
          This deployment has no database configured, so imports are applied directly instead of queued.
        </p>
      )}

      {loading ? (
        <p className="py-4 text-center text-[11px] text-slate-400">Loading queue…</p>
      ) : jobs.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-slate-400">No server imports yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-1.5 font-semibold">Job</th>
                <th className="px-2 py-1.5 font-semibold">Status</th>
                <th className="px-2 py-1.5 font-semibold">Progress</th>
                <th className="px-2 py-1.5 font-semibold">Written</th>
                <th className="px-2 py-1.5 font-semibold">Failed</th>
                <th className="px-2 py-1.5 font-semibold" title="Rows listed more than once in the file — the later row was used">Superseded</th>
                <th className="px-2 py-1.5 font-semibold">Queued at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const percent = job.totalRows > 0
                  ? Math.min(100, Math.round((job.processed / job.totalRows) * 100))
                  : 0;
                return (
                  <React.Fragment key={job.id}>
                    <tr className="align-top">
                      <td className="px-2 py-2">
                        <div className="font-semibold text-slate-800">{job.label || 'Listing import'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{job.id}</div>
                        {job.createdBy && <div className="text-[10px] text-slate-400">{job.createdBy}</div>}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize ${SERVER_STATUS_STYLES[job.status]}`}>
                          {job.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                          {job.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                          {job.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                          {job.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="font-mono text-[10px]">{job.processed}/{job.totalRows}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 font-mono text-[11px] text-emerald-700">{job.succeeded}</td>
                      <td className="px-2 py-2">
                        {job.failed > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedJobId((prev) => (prev === job.id ? '' : job.id))}
                            className="font-mono text-[11px] font-semibold text-rose-700 underline decoration-dotted"
                          >
                            {job.failed}
                          </button>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-2 py-2 font-mono text-[11px] text-slate-500">{job.skipped || 0}</td>
                      <td className="px-2 py-2 font-mono text-[10px] text-slate-500">{formatTimestamp(job.createdAt)}</td>
                    </tr>
                    {expandedJobId === job.id && job.errors.length > 0 && (
                      <tr>
                        <td colSpan={7} className="bg-rose-50/60 px-3 py-2">
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                            First {job.errors.length} failure{job.errors.length === 1 ? '' : 's'}
                          </div>
                          <ul className="space-y-0.5">
                            {job.errors.map((entry, index) => (
                              <li key={`${entry.id}-${index}`} className="font-mono text-[10px] text-rose-800">
                                {entry.id || '(no id)'} — {entry.error}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
