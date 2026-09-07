// Reads the duplicate queue the server already decided, instead of deciding it
// again in the browser.
//
// computeDuplicateReviewCandidates used to run in five places — the admin
// dashboard, the listing directory, AdminApp's render body, the legacy console
// and the duplicate review page — every one of them comparing every listing
// against every other one. That is n(n-1)/2 pairs: 21 million at 6,515
// listings, 337 million at the 25,965 the directory is heading for, on every
// admin page load. It is what made the platform landing page unresponsive with
// its links unclickable.
//
// Duplicates are now decided ONCE, on the server, when a listing is written,
// scoped to the listing's own pincode, and stored on the row. Opening the admin
// console reads that verdict. Logging in costs one small GET.
import { useCallback, useEffect, useState } from 'react';
import type { DuplicateReviewCandidate } from '../../components/admin/DuplicateReviewQueue';

export type DuplicateQueueSnapshot = {
  candidates: DuplicateReviewCandidate[];
  /** Listings currently flagged and awaiting a decision — the notification count. */
  flaggedListings: number;
  /** Listings written before detection existed. Non-zero means a scan is owed. */
  uncheckedListings: number;
  loaded: boolean;
};

export const EMPTY_DUPLICATE_QUEUE: DuplicateQueueSnapshot = {
  candidates: [],
  flaggedListings: 0,
  uncheckedListings: 0,
  loaded: false,
};

// One snapshot shared by every screen. Six components mounting at once must not
// mean six requests, and switching between admin tabs must not refetch.
let cachedSnapshot: DuplicateQueueSnapshot = EMPTY_DUPLICATE_QUEUE;
let inFlight: Promise<DuplicateQueueSnapshot> | null = null;
const subscribers = new Set<(snapshot: DuplicateQueueSnapshot) => void>();

const publish = (snapshot: DuplicateQueueSnapshot) => {
  cachedSnapshot = snapshot;
  subscribers.forEach((notify) => notify(snapshot));
};

const authHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('yp_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

/** Fetches the queue, sharing one request between concurrent callers. */
export const loadDuplicateQueue = (options: { force?: boolean } = {}): Promise<DuplicateQueueSnapshot> => {
  if (!options.force && cachedSnapshot.loaded) return Promise.resolve(cachedSnapshot);
  if (inFlight) return inFlight;

  inFlight = fetch('/api/admin/directory-quality/duplicates?limit=50', { headers: authHeaders() })
    .then(async (response) => {
      if (!response.ok) throw new Error(`duplicate queue request failed: ${response.status}`);
      const body = await response.json();
      const snapshot: DuplicateQueueSnapshot = {
        candidates: Array.isArray(body?.candidates) ? body.candidates : [],
        flaggedListings: Number(body?.flaggedListings || 0),
        uncheckedListings: Number(body?.uncheckedListings || 0),
        loaded: true,
      };
      publish(snapshot);
      return snapshot;
    })
    .catch((error) => {
      // An empty queue is the right failure mode: it shows nothing rather than
      // showing a wrong count, and it never blocks the page.
      console.warn('[duplicates] queue unavailable:', error?.message || error);
      const snapshot: DuplicateQueueSnapshot = { ...EMPTY_DUPLICATE_QUEUE, loaded: true };
      publish(snapshot);
      return snapshot;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

// Decisions go to the server, which owns the arithmetic.
//
// They used to be computed in the browser and persisted by PUTting the whole
// client listing collection. Three things were wrong with that: the client
// collection is a partial slice, so listings it did not hold were silently
// skipped; the merge re-ran its own arithmetic on every click, inflating the
// canonical's review count (39 + 38 -> 77 -> 115 was reproduced); and reviews
// belonging to the merged listing were never reassigned, which only the server
// path does.
const postDecision = async (path: string, canonicalId: string, duplicateId: string) => {
  const response = await fetch(`/api/admin/directory-quality/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ canonicalId, duplicateId }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.ok) throw new Error(body?.error || `Request failed (${response.status})`);
  return body as { ok: true; alreadyMerged?: boolean; canonical?: unknown; duplicate?: unknown; business?: unknown };
};

export const mergeDuplicatePair = (canonicalId: string, duplicateId: string) => postDecision('merge', canonicalId, duplicateId);

export const keepDuplicatePairSeparate = (canonicalId: string, duplicateId: string) => postDecision('keep-separate', canonicalId, duplicateId);

export type DuplicateScanResult = {
  scanned: number;
  flagged: number;
  remaining: number;
  durationMs: number;
};

/**
 * Checks one page of never-checked listings. Bounded per call so the request
 * cannot run for minutes; the caller loops while `remaining` is above zero.
 */
export const runDuplicateScan = async (limit = 2000): Promise<DuplicateScanResult> => {
  const response = await fetch('/api/admin/directory-quality/duplicate-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ limit }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.ok) throw new Error(body?.error || `Duplicate scan failed (${response.status})`);
  return {
    scanned: Number(body.scanned || 0),
    flagged: Number(body.flagged || 0),
    remaining: Number(body.remaining || 0),
    durationMs: Number(body.durationMs || 0),
  };
};

/** Drops the cache so the next read refetches — call after a merge or a scan. */
export const invalidateDuplicateQueue = () => {
  cachedSnapshot = EMPTY_DUPLICATE_QUEUE;
  loadDuplicateQueue({ force: true });
};

export function useDuplicateQueue(): DuplicateQueueSnapshot & { refresh: () => void } {
  const [snapshot, setSnapshot] = useState<DuplicateQueueSnapshot>(cachedSnapshot);

  useEffect(() => {
    subscribers.add(setSnapshot);
    loadDuplicateQueue().then(setSnapshot);
    return () => {
      subscribers.delete(setSnapshot);
    };
  }, []);

  const refresh = useCallback(() => {
    loadDuplicateQueue({ force: true }).then(setSnapshot);
  }, []);

  return { ...snapshot, refresh };
}
