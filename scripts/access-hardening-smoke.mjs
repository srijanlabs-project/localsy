import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function readFile(relPath) {
  const abs = path.join(projectRoot, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
  return fs.readFileSync(abs, 'utf8');
}

function mustContain(text, pattern, label, relPath) {
  if (!pattern.test(text)) {
    throw new Error(`Access smoke failed: ${label} not found in ${relPath}`);
  }
}

const serverText = readFile('server.js');
const appText = readFile('src/App.tsx');
const adminConsoleText = readFile('src/components/AdminConsole.tsx');

mustContain(
  serverText,
  /Content-Security-Policy/,
  'CSP header middleware',
  'server.js',
);
mustContain(
  serverText,
  /Strict-Transport-Security/,
  'HSTS header middleware',
  'server.js',
);
mustContain(
  serverText,
  /function requirePrivilegedWriteAccess\(req, res\)\s*\{\s*if \(!enforceTrustedWriteOrigin\(req, res\)\)/s,
  'trusted-origin enforcement on privileged writes',
  'server.js',
);
mustContain(
  serverText,
  /app\.get\('\/api\/homepage-config', async \(req, res\) => \{\s*const access = requirePrivilegedReadAccess\(req, res\);/s,
  'privileged homepage-config read gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.get\('\/api\/scalable-homepage-config', async \(req, res\) => \{\s*const access = requirePrivilegedReadAccess\(req, res\);/s,
  'privileged scalable CMS read gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.get\('\/api\/scalable-homepage-config\/snapshots', async \(req, res\) => \{\s*const access = requirePrivilegedReadAccess\(req, res\);/s,
  'privileged scalable snapshot read gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.get\('\/api\/audit-events', async \(req, res\) => \{\s*const access = requirePrivilegedReadAccess\(req, res\);/s,
  'privileged audit-events read gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.get\('\/api\/buyer-state', async \(req, res\) => \{\s*const authenticated = await readAuthenticatedUserFromRequest\(req, res\);/s,
  'authenticated buyer-state read gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.put\('\/api\/buyer-state', async \(req, res\) => \{\s*if \(!enforceTrustedWriteOrigin\(req, res\)\)\s*\{\s*return;\s*\}\s*\s*const authenticated = await readAuthenticatedUserFromRequest\(req, res\);/s,
  'trusted-origin and authenticated buyer-state write gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.get\('\/api\/crm-contacts', async \(req, res\) => \{\s*const access = await resolveSellerOrPrivilegedAccess\(req, res\);/s,
  'seller-or-privileged CRM read gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.post\('\/api\/crm-contacts', async \(req, res\) => \{\s*const access = await resolveSellerOrPrivilegedAccess\(req, res, \{ write: true \}\);/s,
  'seller-or-privileged CRM write gate',
  'server.js',
);
mustContain(
  serverText,
  /app\.get\('\/api\/ad-leads', async \(req, res\) => \{\s*const access = await resolveSellerOrPrivilegedAccess\(req, res\);/s,
  'seller-or-privileged ad lead read gate',
  'server.js',
);
mustContain(
  appText,
  /const canReadPrivilegedHomepageConfig = Boolean\(userSession\.authToken\) && \['admin', 'developer'\]\.includes\(userSession\.role\);/,
  'privileged homepage config client read gate',
  'src/App.tsx',
);
mustContain(
  appText,
  /const canReadAuditLogs = Boolean\(userSession\.authToken\) && \['admin', 'developer'\]\.includes\(userSession\.role\);/,
  'privileged audit log client read gate',
  'src/App.tsx',
);
mustContain(
  appText,
  /const buyerStateScopeKey = getBuyerStateScopeKey\(userSession, apiConfiguration\);\s*const canUseManagedBuyerState = buyerStateScopeKey !== 'guest';/s,
  'buyer-state client scope gate',
  'src/App.tsx',
);
mustContain(
  appText,
  /const canReadScalableHomepageConfig = Boolean\(userSession\.authToken\) && \['admin', 'developer'\]\.includes\(userSession\.role\);/,
  'privileged scalable CMS client read gate',
  'src/App.tsx',
);
mustContain(
  appText,
  /const canWriteLocalityRouting = Boolean\(userSession\.authToken\) && \['admin', 'developer'\]\.includes\(userSession\.role\);/,
  'privileged locality routing client write gate',
  'src/App.tsx',
);
mustContain(
  appText,
  /const canWriteScalableCms = Boolean\(userSession\.authToken\) && \['admin', 'developer'\]\.includes\(userSession\.role\);/,
  'privileged scalable CMS client write gate',
  'src/App.tsx',
);
mustContain(
  appText,
  /const canReadAdLeads = Boolean\(userSession\.authToken\) && \(\s*\['admin', 'developer'\]\.includes\(userSession\.role\)\s*\|\|\s*\(userSession\.role === 'seller' && Boolean\(userSession\.sellerBusinessId\)\)\s*\);/s,
  'seller-aware ad lead client read gate',
  'src/App.tsx',
);
mustContain(
  appText,
  /const canReadCrmContacts = Boolean\(userSession\.authToken\) && \(\s*\['admin', 'developer'\]\.includes\(userSession\.role\)\s*\|\|\s*\(userSession\.role === 'seller' && Boolean\(userSession\.sellerBusinessId\)\)\s*\);/s,
  'seller-aware CRM client read gate',
  'src/App.tsx',
);
mustContain(
  adminConsoleText,
  /const canUsePrivilegedAdminWorkspace = \['admin', 'developer'\]\.includes\(consoleRole\);/,
  'role-aware admin workspace gate',
  'src/components/AdminConsole.tsx',
);

console.log('Access hardening smoke check passed.');
