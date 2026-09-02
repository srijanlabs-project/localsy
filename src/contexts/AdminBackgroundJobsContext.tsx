// Minimal, real background-job framework for the admin console (spec: admin-backend-ux-spec.md
// Section 4.4 "Background jobs & notifications"). This is mounted ABOVE the admin router
// (see src/components/admin/AdminApp.tsx) so job state survives navigating between admin
// screens, not just staying on one screen.
//
// Scope note (Phase 1, honest limitation): job METADATA (status, filename, row counts,
// timestamps) is persisted to localStorage so it survives a page refresh, matching the
// spec's "jobs persist across a page refresh/re-login" requirement. The full parsed
// row-by-row preview data is memory-only for this phase — a hard refresh mid-import clears
// the detailed preview table but not the job's status/summary in the history list. Full
// row-level persistence would need IndexedDB or a server-side job queue, which is out of
// scope for this pass (see admin-backend-ux-spec.md Section 5.38 "Import & Job Center").
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AdminJobStatus = 'queued' | 'processing' | 'needs_review' | 'done' | 'failed';

export type AdminBackgroundJob = {
  id: string;
  type: 'bulk_import';
  originScreen: string;
  fileName: string;
  status: AdminJobStatus;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  readyCount?: number;
  updateCount?: number;
  failedCount?: number;
  acknowledged?: boolean;
};

const STORAGE_KEY = 'localsy_admin_background_jobs_v1';
const MAX_STORED_JOBS = 30;

type CreateJobInput = {
  type: AdminBackgroundJob['type'];
  originScreen: string;
  fileName: string;
};

type AdminBackgroundJobsContextValue = {
  jobs: AdminBackgroundJob[];
  createJob: (input: CreateJobInput) => string;
  updateJob: (jobId: string, patch: Partial<AdminBackgroundJob>) => void;
  acknowledgeJob: (jobId: string) => void;
  clearFinishedJobs: () => void;
};

const AdminBackgroundJobsContext = createContext<AdminBackgroundJobsContextValue | null>(null);

const loadStoredJobs = (): AdminBackgroundJob[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminBackgroundJob[]) : [];
  } catch {
    return [];
  }
};

let jobIdCounter = 0;
const buildJobId = () => {
  jobIdCounter += 1;
  return `job_${Date.now()}_${jobIdCounter}`;
};

export function AdminBackgroundJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<AdminBackgroundJob[]>(() => loadStoredJobs());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, MAX_STORED_JOBS)));
    } catch {
      // Best-effort persistence only; ignore quota/serialization errors.
    }
  }, [jobs]);

  const createJob = useCallback(({ type, originScreen, fileName }: CreateJobInput) => {
    const id = buildJobId();
    const nowIso = new Date().toISOString();
    setJobs((prev) => [
      { id, type, originScreen, fileName, status: 'queued' as AdminJobStatus, createdAt: nowIso, updatedAt: nowIso, acknowledged: false },
      ...prev,
    ].slice(0, MAX_STORED_JOBS));
    return id;
  }, []);

  const updateJob = useCallback((jobId: string, patch: Partial<AdminBackgroundJob>) => {
    setJobs((prev) => prev.map((job) => (
      job.id === jobId ? { ...job, ...patch, updatedAt: new Date().toISOString() } : job
    )));
  }, []);

  const acknowledgeJob = useCallback((jobId: string) => {
    updateJob(jobId, { acknowledged: true });
  }, [updateJob]);

  const clearFinishedJobs = useCallback(() => {
    setJobs((prev) => prev.filter((job) => job.status !== 'done' && job.status !== 'failed'));
  }, []);

  const value = useMemo<AdminBackgroundJobsContextValue>(
    () => ({ jobs, createJob, updateJob, acknowledgeJob, clearFinishedJobs }),
    [jobs, createJob, updateJob, acknowledgeJob, clearFinishedJobs]
  );

  return (
    <AdminBackgroundJobsContext.Provider value={value}>
      {children}
    </AdminBackgroundJobsContext.Provider>
  );
}

export function useAdminBackgroundJobs() {
  const ctx = useContext(AdminBackgroundJobsContext);
  if (!ctx) {
    throw new Error('useAdminBackgroundJobs must be used within an AdminBackgroundJobsProvider');
  }
  return ctx;
}
