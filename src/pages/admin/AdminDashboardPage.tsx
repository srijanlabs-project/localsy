import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, CheckCircle2, ClipboardList, Megaphone, ShieldAlert } from 'lucide-react';
import type { AuditEvent, Business, Locality, ScalableHomepageConfigState } from '../../types';
import { computeDuplicateReviewCandidates } from '../../services/admin/duplicateReview';
import { useAdminBackgroundJobs } from '../../contexts/AdminBackgroundJobsContext';

type AdminDashboardPageProps = {
  businesses: Business[];
  localities: Locality[];
  auditLogs?: AuditEvent[];
  scalableHomepageConfig?: ScalableHomepageConfigState;
};

type StatTile = {
  label: string;
  value: number;
  to: string;
  icon: React.ReactNode;
  tone: string;
};

// Routed home for admin-backend-ux-spec.md Section 5.1 "Dashboard — Overview" —
// this screen didn't exist before this Phase 1 pass; it's entirely new.
export default function AdminDashboardPage({ businesses, localities, auditLogs = [], scalableHomepageConfig }: AdminDashboardPageProps) {
  const { jobs } = useAdminBackgroundJobs();

  const pendingCount = businesses.filter((b) => b.status === 'pending').length;
  const activeLocalityCount = localities.filter((l) => l.status === 'active').length;
  const liveCampaignCount = (scalableHomepageConfig?.campaigns || []).filter((c) => c.status === 'active').length;
  const runningJobCount = jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length;
  const failedJobCount = jobs.filter((j) => j.status === 'failed').length;
  const duplicateReviewCandidates = useMemo(() => computeDuplicateReviewCandidates(businesses), [businesses]);

  const tiles: StatTile[] = [
    { label: 'Pending moderation', value: pendingCount, to: '/moderation', icon: <ClipboardList className="h-4 w-4" />, tone: 'border-amber-100 bg-amber-50 text-amber-900' },
    { label: 'Duplicate candidates', value: duplicateReviewCandidates.length, to: '/duplicate-review', icon: <ShieldAlert className="h-4 w-4" />, tone: 'border-rose-100 bg-rose-50 text-rose-900' },
    { label: 'Active localities', value: activeLocalityCount, to: '/legacy', icon: <Building2 className="h-4 w-4" />, tone: 'border-sky-100 bg-sky-50 text-sky-900' },
    { label: 'Live campaigns', value: liveCampaignCount, to: '/legacy', icon: <Megaphone className="h-4 w-4" />, tone: 'border-indigo-100 bg-indigo-50 text-indigo-900' },
    { label: 'Running import jobs', value: runningJobCount, to: '/bulk-upload', icon: <CheckCircle2 className="h-4 w-4" />, tone: 'border-emerald-100 bg-emerald-50 text-emerald-900' },
    { label: 'Failed jobs', value: failedJobCount, to: '/bulk-upload', icon: <AlertTriangle className="h-4 w-4" />, tone: 'border-slate-200 bg-slate-50 text-slate-700' },
  ];

  const needsReview = [
    ...duplicateReviewCandidates.slice(0, 5).map((candidate) => ({
      key: `dup_${candidate.id}`,
      label: `Possible duplicate: "${candidate.canonical.name}" ↔ "${candidate.duplicate.name}"`,
      to: '/duplicate-review',
    })),
    ...jobs.filter((job) => job.status === 'needs_review' && !job.acknowledged).map((job) => ({
      key: job.id,
      label: `Import "${job.fileName}" needs review`,
      to: '/bulk-upload',
    })),
  ].slice(0, 8);

  const recentActivity = [...auditLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Dashboard</h2>
        <p className="mt-0.5 text-xs text-slate-500">What needs your attention right now.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className={`rounded-2xl border p-4 transition hover:shadow-sm ${tile.tone}`}
          >
            <div className="flex items-center justify-between">
              {tile.icon}
              <span className="text-2xl font-extrabold">{tile.value}</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide">{tile.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-950">Needs review</h3>
          <p className="mt-0.5 text-xs text-slate-500">Merged list from moderation, duplicates, and jobs needing review.</p>
          <div className="mt-3 space-y-2">
            {needsReview.length === 0 ? (
              <p className="text-xs text-slate-400">Nothing needs review right now — you're caught up.</p>
            ) : (
              needsReview.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  className="block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-950">Recent activity</h3>
          <p className="mt-0.5 text-xs text-slate-500">Latest audit log entries.</p>
          <div className="mt-3 space-y-2">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400">No audit activity recorded yet.</p>
            ) : (
              recentActivity.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{event.description}</span>
                    <span className="font-mono text-[10px] text-slate-400">{new Date(event.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{event.userName} · {event.actionType}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
