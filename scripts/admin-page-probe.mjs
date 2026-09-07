// Loads the built admin platform page against the seeded database and measures
// whether the main thread stays free. This is the page that used to lock up.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';

const DB = process.env.PROBE_DB || 'postgres://postgres:pw@localhost:5599/dupscale';
const PORT = Number(process.env.PROBE_PORT || 5179);
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, DATABASE_URL: DB, PORT: String(PORT), AUTH_SECRET: 'probe', BLOB_SNAPSHOT_INTERVAL_MS: '600000', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (chunk) => { log += chunk; });
  server.stderr.on('data', (chunk) => { log += chunk; });

  const browser = await chromium.launch({ executablePath: process.env.PROBE_CHROMIUM || '/opt/pw-browsers/chromium/chrome-linux/chrome' });
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

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error.message || error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text().slice(0, 200)}`);
    });

    await page.goto(`${BASE}/platform`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(([token, session]) => {
      localStorage.setItem('yp_auth_token', token);
      localStorage.setItem('yp_user_session', JSON.stringify(session));
    }, [loginBody.token, { ...(loginBody.user || {}), authToken: loginBody.token, isLoggedIn: true }]);

    // Blocked time is measured INSIDE the page over a window anchored on the
    // page's own performance.now(), as the union of long-task intervals. A
    // figure polled from outside understates elapsed time when the thread is
    // saturated, which is exactly the case being measured.
    await page.addInitScript(() => {
      window.__blocking = { tasks: [] };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__blocking.tasks.push([entry.startTime, entry.startTime + entry.duration]);
        }
      }).observe({ entryTypes: ['longtask'] });
    });

    // /admin is where the all-pairs duplicate scan used to run: AdminApp's
    // render body and the dashboard page both called it.
    await page.goto(`${BASE}${process.env.PROBE_PATH || '/admin'}`, { waitUntil: 'domcontentloaded' });
    const windowStart = await page.evaluate(() => performance.now());
    await sleep(15000);

    const report = await page.evaluate((start) => {
      const end = performance.now();
      const clipped = (window.__blocking?.tasks || [])
        .map(([from, to]) => [Math.max(from, start), Math.min(to, end)])
        .filter(([from, to]) => to > from)
        .sort((left, right) => left[0] - right[0]);
      let blocked = 0;
      let cursor = -1;
      let cursorEnd = -1;
      for (const [from, to] of clipped) {
        if (from > cursorEnd) {
          if (cursor >= 0) blocked += cursorEnd - cursor;
          cursor = from;
          cursorEnd = to;
        } else if (to > cursorEnd) cursorEnd = to;
      }
      if (cursor >= 0) blocked += cursorEnd - cursor;
      return {
        windowMs: Math.round(end - start),
        blockedMs: Math.round(blocked),
        longTasks: clipped.length,
        bodyText: (document.body.innerText || '').slice(0, 400),
        clickableLinks: document.querySelectorAll('a[href], button').length,
      };
    }, windowStart);

    // Is the page actually interactive? "Unclickable links" was the symptom, so
    // this drives a real navigation click and watches for the view to change.
    const clickStartedAt = Date.now();
    let clicked = 'no clickable target';
    try {
      const label = process.env.PROBE_CLICK || 'Listing Directory';
      const target = page.getByText(label, { exact: false }).first();
      const before = (document => document)((await page.evaluate(() => document.body.innerText.slice(0, 2000))));
      await target.click({ timeout: 6000 });
      await sleep(600);
      const after = await page.evaluate(() => document.body.innerText.slice(0, 2000));
      clicked = `clicked "${label}" in ${Date.now() - clickStartedAt}ms, view ${after === before ? 'UNCHANGED' : 'changed'}`;
    } catch (error) {
      clicked = `click failed after ${Date.now() - clickStartedAt}ms: ${(error.message || '').split('\n')[0].slice(0, 160)}`;
    }

    console.log(`window                 ${report.windowMs}ms`);
    console.log(`blocked (union)        ${report.blockedMs}ms  (${((report.blockedMs / report.windowMs) * 100).toFixed(1)}% of the window)`);
    console.log(`long tasks             ${report.longTasks}`);
    console.log(`clickable elements     ${report.clickableLinks}`);
    console.log(`interaction            ${clicked}`);
    console.log(`page errors            ${errors.length ? errors.slice(0, 5).join(' | ') : 'none'}`);
    console.log(`\nrendered text:\n${report.bodyText}`);
  } finally {
    await browser.close();
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => {});
    if (process.env.PROBE_VERBOSE) console.log(log.slice(-3000));
  }
};

main().catch((error) => { console.error(error); process.exit(1); });
