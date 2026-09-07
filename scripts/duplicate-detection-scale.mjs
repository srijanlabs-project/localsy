// Measures duplicate detection at the size the directory is actually heading
// for: imports ~20,000 listings with detection on, then times the admin queue
// read. The browser version of this comparison was 337 million pairs.
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const DB = process.env.DUPTEST_DB || 'postgres://postgres:pw@localhost:5599/dupscale';
const PORT = Number(process.env.DUPTEST_PORT || 5178);
const BASE = `http://127.0.0.1:${PORT}`;
const TOTAL = Number(process.env.DUPTEST_TOTAL || 20000);
const PINCODES = 400;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NAMES = ['Sharma Sweets', 'Kumar Electricals', 'Gupta Traders', 'Verma Motors', 'Singh Bakery', 'Patel Hardware', 'Jain Pharmacy', 'Iyer Tiffins'];

const build = (index) => {
  const pincode = String(110001 + (index % PINCODES));
  // Every 40th listing is a deliberate duplicate of the one before it: same
  // pincode, same phone, same name.
  const twin = index % 40 === 39;
  const seed = twin ? index - 1 : index;
  return {
    id: `scale_${String(index).padStart(6, '0')}`,
    name: `${NAMES[seed % NAMES.length]} ${twin ? '' : seed}`.trim(),
    slug: `scale-${index}`,
    status: 'approved',
    localityId: `loc_${index % 12}`,
    areaId: `area_${index % 60}`,
    cityId: 'city_1',
    stateId: 'state_1',
    pincode: twin ? String(110001 + ((index - 1) % PINCODES)) : pincode,
    categoryId: `cat_${seed % 20}`,
    subcategoryId: `sub_${seed % 45}`,
    phone: `+91 9${String(800000000 + (seed % 900000)).slice(0, 9)}`,
    address: `${seed % 200} Market Road`,
    rating: 3 + (index % 20) / 10,
    reviewCount: index % 90,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
};

const main = async () => {
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, DATABASE_URL: DB, PORT: String(PORT), AUTH_SECRET: 'dupscale', BLOB_SNAPSHOT_INTERVAL_MS: '600000', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (chunk) => { log += chunk; });
  server.stderr.on('data', (chunk) => { log += chunk; });

  try {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      try { if ((await fetch(`${BASE}/api/db-status`)).ok) break; } catch { /* waiting */ }
      await sleep(500);
    }

    const challenge = await (await fetch(`${BASE}/api/auth/platform/request-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@localsy.test', password: 'Admin@12345' }),
    })).json();
    const loginBody = await (await fetch(`${BASE}/api/auth/verify-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken: challenge.challengeToken, otp: challenge.devOtp || '123456' }),
    })).json();
    const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${loginBody.token}` };

    const listings = Array.from({ length: TOTAL }, (_unused, index) => build(index));
    const CHUNK = 5000;
    let importMs = 0;
    for (let index = 0; index < listings.length; index += CHUNK) {
      const startedAt = Date.now();
      const queued = await (await fetch(`${BASE}/api/admin/imports`, {
        method: 'POST', headers: auth,
        body: JSON.stringify({ businesses: listings.slice(index, index + CHUNK), label: `scale ${index}` }),
      })).json();
      if (!queued?.ok) throw new Error(`import not queued: ${JSON.stringify(queued).slice(0, 300)}`);
      let job = null;
      for (let attempt = 0; attempt < 600; attempt += 1) {
        job = (await (await fetch(`${BASE}/api/admin/imports/${queued.jobId}`, { headers: auth })).json())?.job;
        if (job && (job.status === 'completed' || job.status === 'failed')) break;
        await sleep(250);
      }
      importMs += Date.now() - startedAt;
      console.log(`  imported ${index + CHUNK} of ${TOTAL} (${job?.status}, succeeded ${job?.succeeded}) — ${(Date.now() - startedAt)}ms`);
    }

    // Backfill measurement: with detection skipped during import (the state
    // the live directory's 6,515 existing rows are in), how long does the scan
    // endpoint take to catch up?
    if (process.env.DUPTEST_MEASURE_SCAN) {
      let scanMs = 0;
      let scanned = 0;
      let flagged = 0;
      for (let pass = 0; pass < 40; pass += 1) {
        const startedAt = Date.now();
        const scan = await (await fetch(`${BASE}/api/admin/directory-quality/duplicate-scan`, {
          method: 'POST', headers: auth, body: JSON.stringify({ limit: 2000 }),
        })).json();
        scanMs += Date.now() - startedAt;
        scanned += scan.scanned || 0;
        flagged += scan.flagged || 0;
        if (!scan.ok || scan.remaining === 0 || scan.scanned === 0) break;
      }
      console.log(`\nbackfill scan              ${scanned.toLocaleString()} listings in ${(scanMs / 1000).toFixed(1)}s, ${flagged.toLocaleString()} flagged`);
    }

    const queueStartedAt = Date.now();
    const queue = await (await fetch(`${BASE}/api/admin/directory-quality/duplicates`, { headers: auth })).json();
    const queueMs = Date.now() - queueStartedAt;

    const secondStartedAt = Date.now();
    await fetch(`${BASE}/api/admin/directory-quality/duplicates`, { headers: auth });
    const secondMs = Date.now() - secondStartedAt;

    console.log('');
    console.log(`listings imported          ${TOTAL.toLocaleString()}`);
    console.log(`total import time          ${(importMs / 1000).toFixed(1)}s (detection included)`);
    console.log(`flagged pairs              ${queue.flaggedListings?.toLocaleString?.() || queue.flaggedListings}`);
    console.log(`never-checked listings     ${queue.uncheckedListings}`);
    console.log(`pairs returned             ${(queue.candidates || []).length}`);
    console.log(`admin queue read           ${queueMs}ms (second read ${secondMs}ms)`);
    console.log(`top score                  ${(queue.candidates || [])[0]?.score}`);
  } finally {
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => {});
    if (process.env.DUPTEST_VERBOSE) console.log(log.slice(-3000));
  }
};

main().catch((error) => { console.error(error); process.exit(1); });
