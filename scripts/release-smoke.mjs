import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function mustExist(relPath) {
  const abs = path.join(projectRoot, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
  return abs;
}

function mustContain(relPath, pattern, label) {
  const abs = mustExist(relPath);
  const text = fs.readFileSync(abs, 'utf8');
  if (!pattern.test(text)) {
    throw new Error(`Release check failed: ${label} not found in ${relPath}`);
  }
}

// Critical production route and admin access checks.
mustContain('server.js', /app\.get\('\/api\/health'/, 'health endpoint');
mustContain('server.js', /CREATE TABLE IF NOT EXISTS app_users/, 'app_users table bootstrap');
mustContain('src/App.tsx', /const PRODUCTION_MODE = true;/, 'production mode guard');
mustContain('src/App.tsx', /const canAccessAdmin = \['admin', 'moderator', 'developer'\]/, 'admin role access gate');
mustContain('src/App.tsx', /Admin Console/, 'admin console entry label');
mustContain('src/components/AdminConsole.tsx', /Bulk Import Businesses \(CSV\)/, 'bulk import module');

console.log('Release smoke check passed.');
