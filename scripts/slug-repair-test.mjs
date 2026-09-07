// Regression test for slug collisions, built from the production case.
//
// `normalizeStoredBusiness` passes an incoming slug through unchecked and the
// column has no unique index, so an import file can give two listings the same
// slug — production had ~70 such slugs, one of them naming a different
// listing's id. An unordered `WHERE id = $1 OR slug = $1 LIMIT 1` then served
// an arbitrary one of the colliding rows.
//
// Run: node scripts/slug-repair-test.mjs
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const DB = process.env.SLUGTEST_DB || 'postgres://postgres:pw@localhost:5599/slugtest';
const PORT = Number(process.env.SLUGTEST_PORT || 5187);
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const failures = [];
const check = (label, ok, detail = '') => {
  if (ok) console.log(`  ok    ${label}`);
  else { console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); failures.push(label); }
};

const L = (id, over = {}) => ({
  id, name: 'SWASTIK MOBILE REPAIRING', status: 'approved',
  localityId: 'roadpali', areaId: '118335', cityId: 'panvel', stateId: 'mh',
  pincode: '410218', categoryId: 'repair-maintenance', subcategoryId: 'mobile-repair',
  phone: '+91 9792444413', address: 'Shop No.61, LIG 1, Sector 3, Kalamboli',
  rating: 4.7, reviewCount: 13, createdAt: '2026-01-01T00:00:00.000Z', ...over,
});

const main = async () => {
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, DATABASE_URL: DB, PORT: String(PORT), AUTH_SECRET: 'slug', BLOB_SNAPSHOT_INTERVAL_MS: '600000', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = ''; server.stdout.on('data', (c) => { log += c; }); server.stderr.on('data', (c) => { log += c; });
  try {
    for (let i = 0; i < 80; i += 1) { try { if ((await fetch(`${BASE}/api/db-status`)).ok) break; } catch {} await sleep(500); }
    const ch = await (await fetch(`${BASE}/api/auth/platform/request-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'admin@localsy.test', password: 'Admin@12345' }) })).json();
    const lb = await (await fetch(`${BASE}/api/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeToken: ch.challengeToken, otp: ch.devOtp || '123456' }) })).json();
    const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${lb.token}` };

    // The exact production shape: two listings, and BOTH carry the slug that
    // names the second one's id.
    const collided = 'swastik-mobile-repairing-localisy004183';
    const q = await (await fetch(`${BASE}/api/admin/imports`, { method: 'POST', headers: auth, body: JSON.stringify({ label: 'slug collision', businesses: [
      L('localisy007791', { slug: collided }),
      L('localisy004183', { slug: collided, address: 'Shop No.e51, LIG 1, Sector 3, Kalamboli' }),
    ] }) })).json();
    for (let i = 0; i < 60; i += 1) { const j = (await (await fetch(`${BASE}/api/admin/imports/${q.jobId}`, { headers: auth })).json())?.job; if (j && ['completed', 'failed'].includes(j.status)) break; await sleep(300); }

    // Each listing's own canonical URL must resolve to that listing, ten times
    // running — the old unordered query could return either row per request.
    const resolve = async (needle) => (await (await fetch(`${BASE}/api/businesses/${needle}`)).json())?.business?.id;
    let stable = true;
    for (let i = 0; i < 10; i += 1) {
      if (await resolve('localisy007791') !== 'localisy007791') stable = false;
      if (await resolve('localisy004183') !== 'localisy004183') stable = false;
    }
    check('an id always resolves to its own listing', stable);

    const bySlugUrl = await resolve('swastik-mobile-repairing-localisy007791');
    check('a name-id URL resolves via the id, not the stored slug', bySlugUrl === 'localisy007791', `got ${bySlugUrl}`);

    let slugStable = true;
    const first = await resolve(collided);
    for (let i = 0; i < 10; i += 1) if (await resolve(collided) !== first) slugStable = false;
    check('a duplicated slug resolves to the same row every time', slugStable, `first=${first}`);

    // The production shape: an old REJECTED row whose slug matches its own id,
    // against the new APPROVED listing for the same business. The live listing
    // must keep the clean slug; the dead row is the one rewritten.
    const q2 = await (await fetch(`${BASE}/api/admin/imports`, { method: 'POST', headers: auth, body: JSON.stringify({ label: 'rejected leftover', businesses: [
      L('csv_1779489716830_75888', { name: 'AAMNA HOSPITAL', status: 'rejected', slug: 'aamna-hospital-csv-1779489716830-75888' }),
      L('localisy015157', { name: 'AAMNA HOSPITAL', slug: 'aamna-hospital-csv-1779489716830-75888' }),
    ] }) })).json();
    for (let i = 0; i < 60; i += 1) { const j = (await (await fetch(`${BASE}/api/admin/imports/${q2.jobId}`, { headers: auth })).json())?.job; if (j && ['completed', 'failed'].includes(j.status)) break; await sleep(300); }

    const dry = await (await fetch(`${BASE}/api/admin/businesses/repair-slugs`, { method: 'POST', headers: auth, body: '{}' })).json();
    // The rejected row's slug is already its own, so it is left alone; the
    // approved row is holding a BORROWED slug, so it is the one rewritten.
    const rejectedUntouched = !(dry.sample || []).some((change) => String(change.id).startsWith('csv_'));
    const liveRewritten = (dry.sample || []).find((change) => change.id === 'localisy015157');
    check('a row already holding its own slug is left alone', rejectedUntouched, JSON.stringify(dry.sample));
    check('the row holding a borrowed slug is rewritten to its own',
      liveRewritten?.to === 'aamna-hospital-localisy015157', JSON.stringify(liveRewritten));
    check('dry run finds both collisions', dry.ok && dry.duplicatedSlugs === 2 && dry.rowsAffected === 2, JSON.stringify(dry).slice(0, 220));
    check('dry run changes nothing', dry.applied === 0, JSON.stringify(dry).slice(0, 120));
    // The invariant: every rewrite targets the row's OWN name-and-id slug.
    const allDerived = (dry.sample || []).every((change) => change.to.endsWith(`-${change.id}`));
    check('every rewrite derives the slug from the row\'s own id', allDerived, JSON.stringify(dry.sample));

    const applied = await (await fetch(`${BASE}/api/admin/businesses/repair-slugs`, { method: 'POST', headers: auth, body: '{"apply":true}' })).json();
    check('apply rewrites the offending rows', applied.applied === 2, JSON.stringify(applied).slice(0, 200));

    const after = await (await fetch(`${BASE}/api/admin/businesses/repair-slugs`, { method: 'POST', headers: auth, body: '{}' })).json();
    check('no collisions remain', after.duplicatedSlugs === 0, JSON.stringify(after).slice(0, 200));

    check('both listings still resolve after repair',
      await resolve('localisy007791') === 'localisy007791' && await resolve('localisy004183') === 'localisy004183');
  } finally {
    server.kill('SIGTERM'); await once(server, 'exit').catch(() => {});
    if (failures.length > 0) console.log('\n--- server log ---\n', log.slice(-2500));
  }
  console.log(failures.length === 0 ? '\nall slug checks passed' : `\n${failures.length} check(s) failed`);
  process.exit(failures.length === 0 ? 0 : 1);
};
main().catch((e) => { console.error(e); process.exit(1); });
