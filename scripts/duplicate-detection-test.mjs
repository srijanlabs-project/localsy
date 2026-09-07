// End-to-end test for server-side, pincode-scoped duplicate detection.
//
// It boots the real server against a throwaway database, imports listings
// through the real import queue, and then asserts on what the real endpoints
// return. The point is to prove four things the user asked for:
//
//   1. A duplicate is flagged when the listing is imported, not on login.
//   2. The check is scoped to the pincode — an identical business in a
//      different pincode is NOT flagged.
//   3. Nothing is hidden: a flagged listing is still served by the public API.
//   4. An operator's decision is never reopened by a later write.
//
// Run: DUPTEST_DB=postgres://... node scripts/duplicate-detection-test.mjs
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const DB = process.env.DUPTEST_DB || 'postgres://postgres:pw@localhost:5599/duptest';
const PORT = Number(process.env.DUPTEST_PORT || 5177);
const BASE = `http://127.0.0.1:${PORT}`;

const failures = [];
const check = (label, condition, detail = '') => {
  if (condition) console.log(`  ok    ${label}`);
  else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(label);
  }
};

const listing = (id, over = {}) => ({
  id,
  name: 'Sharma Sweets',
  slug: id,
  status: 'approved',
  localityId: 'loc_test',
  areaId: 'area_1',
  cityId: 'city_1',
  stateId: 'state_1',
  pincode: '110001',
  categoryId: 'cat_food',
  subcategoryId: 'sub_sweets',
  phone: '+91 98100 11111',
  address: '12 Main Bazaar Road',
  rating: 4.2,
  reviewCount: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/api/db-status`);
      if (response.ok) return true;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  return false;
};

const main = async () => {
  const server = spawn(process.execPath, ['server.js'], {
    env: {
      ...process.env,
      DATABASE_URL: DB,
      PORT: String(PORT),
      AUTH_SECRET: 'duptest-secret',
      // Keeps the snapshot worker out of the way of the assertions.
      BLOB_SNAPSHOT_INTERVAL_MS: '600000',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', (chunk) => { serverLog += chunk; });
  server.stderr.on('data', (chunk) => { serverLog += chunk; });

  try {
    if (!await waitForServer()) throw new Error(`server did not start:\n${serverLog}`);

    // Platform login is password + OTP; over loopback with NODE_ENV unset to
    // production the server accepts the fixed local dev OTP.
    const challenge = await (await fetch(`${BASE}/api/auth/platform/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@localsy.test', password: 'Admin@12345' }),
    })).json();
    if (!challenge?.challengeToken) throw new Error(`no OTP challenge: ${JSON.stringify(challenge).slice(0, 400)}`);
    const loginBody = await (await fetch(`${BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken: challenge.challengeToken, otp: challenge.devOtp || '123456' }),
    })).json();
    const token = loginBody?.token || loginBody?.session?.authToken || loginBody?.user?.authToken;
    if (!token) throw new Error(`no auth token: ${JSON.stringify(loginBody).slice(0, 400)}`);
    const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // ---- Import: two true duplicates in one pincode, one look-alike in another.
    const payload = [
      listing('dup_a'),
      // Same phone, same name, same pincode → 48 + 10 + 20 + 20 + 14 + 8 + 6 + 6.
      listing('dup_b', { id: 'dup_b', slug: 'dup_b', reviewCount: 3 }),
      // Identical business, DIFFERENT pincode. Must not be flagged: the user
      // asked for the check to stay inside the pincode.
      listing('other_pin', { id: 'other_pin', slug: 'other_pin', pincode: '560001' }),
      // A second true pair, reserved for the merge path (dup_a/dup_b are used
      // by the keep-separate assertions below).
      listing('merge_a', { id: 'merge_a', slug: 'merge_a', name: 'Verma Motors', phone: '+91 98200 22222', reviewCount: 20 }),
      listing('merge_b', { id: 'merge_b', slug: 'merge_b', name: 'Verma Motors', phone: '+91 98200 22222', reviewCount: 7 }),
      // Same pincode, nothing else in common → cannot reach 68.
      listing('unrelated', {
        id: 'unrelated',
        slug: 'unrelated',
        name: 'Kumar Electricals',
        phone: '+91 98100 99999',
        address: '4 Station Approach',
        categoryId: 'cat_home',
        subcategoryId: 'sub_electrical',
      }),
    ];

    const queued = await fetch(`${BASE}/api/admin/imports`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ businesses: payload, label: 'duplicate detection test' }),
    });
    const queuedBody = await queued.json();
    if (!queuedBody?.ok) throw new Error(`import not queued: ${JSON.stringify(queuedBody).slice(0, 400)}`);

    let job = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const status = await fetch(`${BASE}/api/admin/imports/${queuedBody.jobId}`, { headers: auth });
      job = (await status.json())?.job;
      if (job && (job.status === 'completed' || job.status === 'failed')) break;
      await sleep(400);
    }
    check('import completed', job?.status === 'completed', JSON.stringify(job).slice(0, 300));
    check('all six listings written', job?.succeeded === 6, `succeeded=${job?.succeeded}`);

    // ---- 1 & 2: the verdict is already there, and it is pincode-scoped.
    const queue = await (await fetch(`${BASE}/api/admin/directory-quality/duplicates`, { headers: auth })).json();
    const pairIds = (queue.candidates || []).map((candidate) => [candidate.canonical.id, candidate.duplicate.id].sort().join('+'));
    check('duplicate found at import time, with no scan', pairIds.includes('dup_a+dup_b'), JSON.stringify(pairIds));
    check('each pair appears once, not once per row', pairIds.length === 2, JSON.stringify(pairIds));
    check(
      'identical listing in another pincode is not flagged',
      !pairIds.some((pair) => pair.includes('other_pin')),
      JSON.stringify(pairIds),
    );
    check('nothing left unchecked after an import', queue.uncheckedListings === 0, `unchecked=${queue.uncheckedListings}`);
    const candidate = (queue.candidates || []).find((entry) => [entry.canonical.id, entry.duplicate.id].includes('dup_a'));
    check('score is above the flag threshold', Number(candidate?.score) >= 68, `score=${candidate?.score}`);
    check(
      'canonical is the better-established side',
      candidate?.canonical?.id === 'dup_a',
      `canonical=${candidate?.canonical?.id}`,
    );
    check('reasons name the phone match', (candidate?.reasons || []).includes('same phone'), JSON.stringify(candidate?.reasons));

    // ---- 3: flagged, but not hidden. The user chose "flag but never hide".
    const publicList = await (await fetch(`${BASE}/api/businesses?fields=lite&limit=100`)).json();
    const publicIds = new Set((publicList.businesses || []).map((business) => business.id));
    check('flagged listing still in the public list', publicIds.has('dup_b'), `ids=${[...publicIds].join(',')}`);
    const detail = await fetch(`${BASE}/api/businesses/dup_b`);
    check('flagged listing still has a detail page', detail.ok, `status=${detail.status}`);

    // ---- Merge: the pair must leave the queue, and merging twice must not
    // apply the arithmetic twice. Both were broken: the decision was computed
    // in the browser and persisted by PUTting the whole client collection, so
    // the canonical stayed 'pending' and pointing at the listing it had just
    // absorbed — the card never left, and each click re-added the duplicate's
    // review count (39 -> 77 -> 115 was reproduced).
    const readListing = async (id) => (await (await fetch(`${BASE}/api/businesses/${id}`, { headers: auth })).json())?.business || null;
    const pairsBefore = (await (await fetch(`${BASE}/api/admin/directory-quality/duplicates?limit=1`, { headers: auth })).json()).flaggedListings;

    const merged = await (await fetch(`${BASE}/api/admin/directory-quality/merge`, {
      method: 'POST', headers: auth, body: JSON.stringify({ canonicalId: 'merge_a', duplicateId: 'merge_b' }),
    })).json();
    check('merge accepted', merged.ok === true, JSON.stringify(merged).slice(0, 200));

    const afterMerge = await (await fetch(`${BASE}/api/admin/directory-quality/duplicates?limit=50`, { headers: auth })).json();
    check(
      'merged pair leaves the queue',
      !(afterMerge.candidates || []).some((entry) => [entry.canonical.id, entry.duplicate.id].includes('merge_b')),
      JSON.stringify((afterMerge.candidates || []).map((entry) => entry.id)),
    );
    check('pair count drops by one', afterMerge.flaggedListings === pairsBefore - 1, `${pairsBefore} -> ${afterMerge.flaggedListings}`);

    const mergedCanonical = await readListing('merge_a');
    const mergedDuplicate = await readListing('merge_b');
    check('canonical absorbed the review counts', mergedCanonical?.reviewCount === 27, `reviewCount=${mergedCanonical?.reviewCount}`);
    check('duplicate is rejected and marked merged',
      mergedDuplicate?.status === 'rejected' && mergedDuplicate?.duplicateReviewStatus === 'merged',
      `status=${mergedDuplicate?.status} review=${mergedDuplicate?.duplicateReviewStatus}`);

    const remerge = await (await fetch(`${BASE}/api/admin/directory-quality/merge`, {
      method: 'POST', headers: auth, body: JSON.stringify({ canonicalId: 'merge_a', duplicateId: 'merge_b' }),
    })).json();
    check('merging again is reported as already merged', remerge.ok === true && remerge.alreadyMerged === true, JSON.stringify(remerge).slice(0, 200));
    const afterRemerge = await readListing('merge_a');
    check('merging again does not inflate the review count', afterRemerge?.reviewCount === 27, `reviewCount=${afterRemerge?.reviewCount}`);

    // ---- 4: a decision is final.
    const decision = await fetch(`${BASE}/api/admin/directory-quality/keep-separate`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ canonicalId: 'dup_a', duplicateId: 'dup_b' }),
    });
    check('keep-separate accepted', decision.ok, `status=${decision.status}`);

    const afterDecision = await (await fetch(`${BASE}/api/admin/directory-quality/duplicates`, { headers: auth })).json();
    check(
      'decided pair leaves the queue',
      !(afterDecision.candidates || []).some((entry) => [entry.canonical.id, entry.duplicate.id].includes('dup_b')),
      JSON.stringify((afterDecision.candidates || []).map((entry) => entry.id)),
    );

    // Re-import the same listings. The pair must NOT come back — this is the
    // "should not be done every time" guarantee, tested rather than asserted.
    const requeued = await fetch(`${BASE}/api/admin/imports`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ businesses: payload, label: 'duplicate detection re-import' }),
    });
    const requeuedBody = await requeued.json();
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const status = await fetch(`${BASE}/api/admin/imports/${requeuedBody.jobId}`, { headers: auth });
      const requeuedJob = (await status.json())?.job;
      if (requeuedJob && (requeuedJob.status === 'completed' || requeuedJob.status === 'failed')) break;
      await sleep(400);
    }
    const afterReimport = await (await fetch(`${BASE}/api/admin/directory-quality/duplicates`, { headers: auth })).json();
    check(
      'a re-import does not reopen a settled decision',
      !(afterReimport.candidates || []).some((entry) => [entry.canonical.id, entry.duplicate.id].includes('dup_b')),
      JSON.stringify((afterReimport.candidates || []).map((entry) => entry.id)),
    );

    // ---- The backfill scan is idempotent and terminates.
    const scan = await (await fetch(`${BASE}/api/admin/directory-quality/duplicate-scan`, {
      method: 'POST', headers: auth, body: JSON.stringify({ limit: 1000 }),
    })).json();
    check('scan finds nothing left to check', scan.ok && scan.scanned === 0 && scan.remaining === 0, JSON.stringify(scan));
  } finally {
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => {});
    if (failures.length > 0 || process.env.DUPTEST_VERBOSE) {
      console.log('\n--- server log ---\n', serverLog.slice(-4000));
    }
  }

  console.log(failures.length === 0 ? '\nall checks passed' : `\n${failures.length} check(s) failed`);
  process.exit(failures.length === 0 ? 0 : 1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
