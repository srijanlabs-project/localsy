import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const projectRoot = process.cwd();
const port = 3217;
const baseUrl = `http://127.0.0.1:${port}`;
const tokenSecret = process.env.AUTH_SECRET || 'replace-this-in-production';
const backupTargets = ['users.json', 'scalable-cms-state.json'];
const backups = new Map();

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signToken(payload) {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', tokenSecret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${body}.${signature}`;
}

async function backupStateFiles() {
  for (const relPath of backupTargets) {
    const absPath = path.join(projectRoot, relPath);
    try {
      const content = await fs.readFile(absPath);
      backups.set(absPath, { existed: true, content });
    } catch {
      backups.set(absPath, { existed: false, content: null });
    }
  }
}

async function restoreStateFiles() {
  for (const [absPath, snapshot] of backups.entries()) {
    if (snapshot.existed) {
      await fs.writeFile(absPath, snapshot.content);
    } else {
      await fs.rm(absPath, { force: true });
    }
  }
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Timed out waiting for local server health endpoint');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return { payload, response };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  await backupStateFiles();

  const exp = Math.floor(Date.now() / 1000) + (60 * 30);
  const authToken = signToken({
    sub: 'runtime-smoke-admin',
    email: 'admin@localsy.test',
    role: 'admin',
    userType: 'platform_admin',
    exp,
  });

  const serverProcess = spawn('node', ['server.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: '',
      PGHOST: '',
      PGPORT: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let combinedOutput = '';
  serverProcess.stdout.on('data', (chunk) => {
    combinedOutput += chunk.toString();
  });
  serverProcess.stderr.on('data', (chunk) => {
    combinedOutput += chunk.toString();
  });

  try {
    await waitForServer();

    const liveHomepage = await requestJson(
      `${baseUrl}/api/resolved-homepage?localityId=roadpali&device=desktop&pageType=homepage&usePublished=false`,
    );
    assert(liveHomepage.payload.source === 'live_resolver', 'Expected live_resolver source before publish');
    assert(liveHomepage.payload.resolution?.strategy === 'live_resolver', 'Expected live resolver provenance strategy before publish');
    assert(liveHomepage.response.headers.get('x-resolved-homepage-source') === 'live_resolver', 'Expected live resolver source header before publish');
    assert(Array.isArray(liveHomepage.payload.payload?.sections) && liveHomepage.payload.payload.sections.length > 0, 'Expected live resolver homepage sections for Roadpali');

    const publishPayload = {
      contexts: [
        {
          localityId: 'roadpali',
          device: 'desktop',
          pageType: 'homepage',
        },
        {
          localityId: 'roadpali',
          categoryId: 'beauty-wellness',
          device: 'desktop',
          pageType: 'listing_results',
        },
      ],
    };

    const publishResult = await requestJson(`${baseUrl}/api/resolved-homepage/publish`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(publishPayload),
    });
    assert(publishResult.payload.publishedCount === 2, 'Expected two published resolved homepage snapshots');

    const publishedHomepage = await requestJson(
      `${baseUrl}/api/resolved-homepage?localityId=roadpali&device=desktop&pageType=homepage`,
    );
    assert(publishedHomepage.payload.source === 'published_snapshot', 'Expected published_snapshot source for published homepage context');
    assert(publishedHomepage.payload.resolution?.strategy === 'exact_snapshot_id', 'Expected exact snapshot provenance for published homepage context');
    assert(publishedHomepage.response.headers.get('x-resolved-homepage-source') === 'published_snapshot', 'Expected published snapshot source header for homepage context');
    assert(Boolean(publishedHomepage.response.headers.get('x-resolved-homepage-snapshot-id')), 'Expected published homepage snapshot id header');
    assert(Array.isArray(publishedHomepage.payload.payload?.sections) && publishedHomepage.payload.payload.sections.length > 0, 'Expected published homepage snapshot payload to include sections');

    const publishedCategoryResults = await requestJson(
      `${baseUrl}/api/resolved-homepage?localityId=roadpali&categoryId=beauty-wellness&device=desktop&pageType=listing_results`,
    );
    assert(publishedCategoryResults.payload.source === 'published_snapshot', 'Expected published_snapshot source for published category results context');
    assert(publishedCategoryResults.payload.resolution?.usedPublished === true, 'Expected published category results provenance to report published usage');
    assert(
      String(publishedCategoryResults.payload.payload?.context?.categoryId || '') === 'beauty-wellness',
      'Expected published category results snapshot to preserve category context',
    );

    const snapshotsList = await requestJson(`${baseUrl}/api/scalable-homepage-config/snapshots`, {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
    assert(Array.isArray(snapshotsList.payload.snapshots) && snapshotsList.payload.snapshots.length >= 2, 'Expected snapshot list to include published runtime smoke snapshots');

    console.log('Resolved homepage runtime smoke check passed.');
  } finally {
    serverProcess.kill('SIGTERM');
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        serverProcess.kill('SIGKILL');
        resolve();
      }, 5_000);
      serverProcess.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    await restoreStateFiles();
  }
}

run().catch(async (error) => {
  try {
    await restoreStateFiles();
  } catch {
    // ignore restore failures in the failure path
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
