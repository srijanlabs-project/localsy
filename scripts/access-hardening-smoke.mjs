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
  appText,
  /const canReadPrivilegedHomepageConfig = Boolean\(userSession\.authToken\) && \['admin', 'developer'\]\.includes\(userSession\.role\);/,
  'privileged homepage config client read gate',
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
  adminConsoleText,
  /const canUsePrivilegedAdminWorkspace = \['admin', 'developer'\]\.includes\(consoleRole\);/,
  'role-aware admin workspace gate',
  'src/components/AdminConsole.tsx',
);

console.log('Access hardening smoke check passed.');
