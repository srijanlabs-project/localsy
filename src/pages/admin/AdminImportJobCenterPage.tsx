import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';
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

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">Currently shows Bulk Import jobs only.</span> Other upload surfaces —
          hero banners, ad creatives, community posts, and taxonomy/geography Excel imports — don't yet report into
          this shared job list; they track their own progress locally on their own screens. This isn't a bug in this
          screen, it's a gap in how those surfaces report status.
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
