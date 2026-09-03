// Exercises the real blob snapshot worker against a real database.
//
// Not part of `npm run qa:uat` — it needs a live Postgres and a server started
// against it. To run:
//
//   createdb snapguard   # then seed app_state.businesses with N listings
//   DATABASE_URL=... NODE_ENV=production PORT=4400 \
//   AUTH_SECRET=snapguard-test-secret-value-long-enough-1234567890 \
//   BLOB_SNAPSHOT_INTERVAL_MS=2000 node server.js &
//   SNAPGUARD_PSQL_PORT=5599 node scripts/blob-snapshot-guard-test.mjs
//
// Scenario reproduced: the businesses table is empty (a first boot where the
// stage 1 backfill did not complete) while the blob still holds the whole
// directory. A privileged write marks the blob dirty, the worker wakes, and
// before the guard it replaced 100 listings with an empty array.
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const PORT = Number(process.env.SNAPGUARD_PORT || 4400);
const BASE = `http://localhost:${PORT}`;
const AUTH_SECRET = 'snapguard-test-secret-value-long-enough-1234567890';
const DB = process.env.SNAPGUARD_DB || 'snapguard';
const PSQL_PORT = Number(process.env.SNAPGUARD_PSQL_PORT || 5599);

const b64url = (value) => Buffer.from(value).toString('base64url');
const signToken = (payload) => {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
};
const token = signToken({
  sub: 'qa-admin',
  userType: 'platform_admin',
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const psql = (sql) => execFileSync('su', ['postgres', '-c',
  `psql -h /tmp -p ${PSQL_PORT} -d ${DB} -At -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`],
{ encoding: 'utf8' }).trim();

const blobCount = () => Number(psql(
  `SELECT CASE WHEN jsonb_typeof(value)='array' THEN jsonb_array_length(value) ELSE -1 END FROM app_state WHERE key='businesses'`) || -1);
const rowCount = () => Number(psql(`SELECT count(*) FROM businesses`) || 0);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const patchOne = async (id, name) => {
  const response = await fetch(`${BASE}/api/businesses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ business: {
      id, name, categoryId: 'food-restaurants', subcategoryId: 'cafes',
      localityId: 'nerul', stateId: 'mh', cityId: 'panvel', areaId: '',
      areasOfOperation: [], address: 'Test address', pincode: '400706',
      phone: '9000000000', status: 'approved', rating: 0, reviewCount: 0,
    } }),
  });
  return response.status;
};

const results = [];
const check = (label, actual, expected) => {
  const pass = actual === expected;
  results.push({ label, actual, expected, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: got ${actual}, expected ${expected}`);
};

// Seed the fixture so the test is repeatable: 100 listings in the blob, no
// rows. Without this a second run inherits the first run's end state.
const SEED = 100;
psql('TRUNCATE businesses');
psql(`INSERT INTO app_state (key, value) VALUES ('businesses', (
  SELECT jsonb_agg(jsonb_build_object(
    'id', 'guard' || lpad(i::text, 6, '0'), 'name', 'Guard Listing ' || i,
    'categoryId', 'food-restaurants', 'subcategoryId', 'cafes',
    'localityId', 'nerul', 'stateId', 'mh', 'cityId', 'panvel', 'areaId', '',
    'areasOfOperation', '[]'::jsonb, 'address', 'Test address ' || i,
    'pincode', '400706', 'phone', '9000000000', 'status', 'approved',
    'rating', 0, 'reviewCount', 0, 'featured', false, 'verifiedBadge', false,
    'createdAt', '2026-09-01T00:00:00.000Z', 'tags', '[]'::jsonb
  )) FROM generate_series(1::bigint, ${SEED}::bigint) AS i))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`);
check('fixture seeded', blobCount(), SEED);

// The server caches the blob, so make it repopulate the rows from the seed
// rather than from whatever it read at boot.
const seeded = await fetch(`${BASE}/api/admin/businesses/backfill-rows`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: JSON.stringify({ force: true }),
});
console.log(`seed backfill: HTTP ${seeded.status} ${JSON.stringify(await seeded.json().catch(() => ({})))}`);
check('rows match the fixture', rowCount(), SEED);

// ---- Case 1: rows collapse to almost nothing. The guard must refuse. ----
psql('TRUNCATE businesses');
check('table emptied for the test', rowCount(), 0);
const status1 = await patchOne('guard000001', 'Guard Listing 1 edited');
check('privileged PATCH accepted', status1, 200);
console.log(`rows after the PATCH: ${rowCount()}`);   // 1: the upserted row
await sleep(5000);                                    // worker interval is 2s
check('BLOB SURVIVED the collapse', blobCount(), 100);

// ---- Case 2: rows are trustworthy again. The snapshot must proceed. ----
// force: true is required — a partially populated table is "already populated"
// otherwise, which is precisely the state that needs repairing.
const backfill = await fetch(`${BASE}/api/admin/businesses/backfill-rows`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: JSON.stringify({ force: true }),
});
console.log(`backfill-rows: HTTP ${backfill.status} ${JSON.stringify(await backfill.json().catch(() => ({})))}`);
check('forced backfill restored the rows from the blob', rowCount(), 100);

// A legitimate snapshot must still go through, otherwise the guard has simply
// broken the worker. Deleting one listing is a real shrink the guard allows.
psql(`DELETE FROM businesses WHERE id = 'guard000100'`);
check('one listing deleted', rowCount(), 99);
await patchOne('guard000002', 'Guard Listing 2 edited');
await sleep(5000);
check('blob rewritten to match the rows', blobCount(), 99);
console.log(`final: blob=${blobCount()} rows=${rowCount()}`);

const failed = results.filter((entry) => !entry.pass);
console.log(failed.length === 0 ? '\nALL CHECKS PASSED' : `\n${failed.length} CHECK(S) FAILED`);
process.exit(failed.length === 0 ? 0 : 1);
