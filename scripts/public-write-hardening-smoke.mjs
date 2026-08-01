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
    throw new Error(`Public-write smoke failed: ${label} not found in ${relPath}`);
  }
}

const serverText = readFile('server.js');

const throttledPublicRoutes = [
  ['/api/ad-leads', 'ad lead create throttle'],
  ['/api/reviews', 'review create throttle'],
  ['/api/auth/register/request-otp', 'public registration OTP request throttle'],
  ['/api/auth/register/verify-otp', 'public registration OTP verify throttle'],
  ['/api/auth/request-otp', 'public login OTP request throttle'],
  ['/api/contact-unlock/request-otp', 'contact unlock OTP request throttle'],
  ['/api/contact-unlock/verify-otp', 'contact unlock OTP verify throttle'],
  ['/api/contact-unlock/record-view', 'contact unlock record-view throttle'],
  ['/api/auth/platform/request-otp', 'platform OTP request throttle'],
  ['/api/auth/verify-otp', 'shared OTP verify throttle'],
  ['/api/audit-events', 'audit write throttle'],
];

for (const [route, label] of throttledPublicRoutes) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  mustContain(
    serverText,
    new RegExp(`app\\.post\\('${escapedRoute}', async \\(req, res\\) => \\{[\\s\\S]*enforcePublicWriteThrottle\\(req, res`, 's'),
    label,
    'server.js',
  );
}

mustContain(
  serverText,
  /app\.post\('\/api\/reviews', async \(req, res\) => \{\s*if \(!enforceTrustedWriteOrigin\(req, res\)\)/s,
  'trusted-origin enforcement on public review writes',
  'server.js',
);
mustContain(
  serverText,
  /app\.post\('\/api\/auth\/register', async \(req, res\) => \{\s*if \(!enforceTrustedWriteOrigin\(req, res\)\)/s,
  'trusted-origin enforcement on privileged auth register',
  'server.js',
);
mustContain(
  serverText,
  /function buildContactUnlockGrantToken\(\{ challengeId, mobile \}\)/,
  'contact unlock grant token issuer',
  'server.js',
);
mustContain(
  serverText,
  /function verifyContactUnlockGrantToken\(token\)/,
  'contact unlock grant token verifier',
  'server.js',
);
mustContain(
  serverText,
  /app\.post\('\/api\/contact-unlock\/verify-otp', async \(req, res\) => \{[\s\S]*persistedChallenge\.purpose !== challenge\.purpose[\s\S]*persistedChallenge\.mobile !== challenge\.mobile[\s\S]*res\.json\(\{ ok: true, mobile: challenge\.mobile, unlockToken \}\);/s,
  'contact unlock verify challenge consistency and unlock token response',
  'server.js',
);
mustContain(
  serverText,
  /app\.post\('\/api\/contact-unlock\/record-view', async \(req, res\) => \{[\s\S]*const unlockTokenPayload = verifyContactUnlockGrantToken\(String\(req\.body\?\.unlockToken \|\| ''\)\);[\s\S]*Verified contact unlock token is required[\s\S]*Contact unlock token does not match the verified phone number/s,
  'contact unlock record-view requires verified unlock token',
  'server.js',
);
mustContain(
  serverText,
  /app\.post\('\/api\/auth\/register\/verify-otp', async \(req, res\) => \{[\s\S]*persistedChallenge\.purpose !== challenge\.purpose[\s\S]*persistedChallenge\.mobile !== challenge\.mobile/s,
  'registration verify challenge consistency checks',
  'server.js',
);

console.log('Public write hardening smoke check passed.');
