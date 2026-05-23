import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const auditLogPath = path.join(__dirname, 'audit-events.jsonl');
const usersPath = path.join(__dirname, 'users.json');
const businessesPath = path.join(__dirname, 'businesses.json');
const TOKEN_SECRET = process.env.AUTH_SECRET || 'replace-this-in-production';
const TOKEN_TTL_SEC = 60 * 60 * 12; // 12 hours

app.use(express.json({ limit: '5mb' }));
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

let pgClient = null;
let pgInitAttempted = false;
let memoryUsers = null;
let memoryBusinesses = null;

const PUBLIC_USER_TYPES = ['buyer', 'seller', 'resource'];
const ALL_USER_TYPES = ['platform_admin', 'developer', 'buyer', 'seller', 'resource'];

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  const [header, body, sig] = token.split('.');
  if (!header || !body || !sig) return null;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `${salt}:${Buffer.from(key).toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, keyHex] = String(stored).split(':');
  if (!salt || !keyHex) return false;
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return crypto.timingSafeEqual(Buffer.from(keyHex, 'hex'), Buffer.from(key));
}

function normalizeRoleForType(userType) {
  if (userType === 'platform_admin') return 'admin';
  if (userType === 'developer') return 'developer';
  if (userType === 'seller') return 'seller';
  if (userType === 'buyer') return 'buyer';
  return 'resource';
}

async function readUsers() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT id, name, email, phone, user_type, role, password_hash, created_at, status
       FROM app_users
       ORDER BY created_at ASC`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      userType: row.user_type,
      role: row.role,
      passwordHash: row.password_hash,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      status: row.status,
    }));
  }

  if (Array.isArray(memoryUsers)) return memoryUsers;
  try {
    const raw = await fs.readFile(usersPath, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  const client = await getPgClient();
  if (client) {
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM app_users');
      for (const user of users) {
        await client.query(
          `INSERT INTO app_users (id, name, email, phone, user_type, role, password_hash, created_at, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            user.id,
            user.name,
            user.email,
            user.phone || '',
            user.userType,
            user.role,
            user.passwordHash,
            user.createdAt,
            user.status || 'active',
          ],
        );
      }
      await client.query('COMMIT');
      return;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  try {
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8');
    memoryUsers = users;
  } catch (err) {
    // In some container runtimes the app dir can be read-only. Keep app available.
    console.warn('users.json write failed, using in-memory user store:', err?.message || err);
    memoryUsers = users;
  }
}

function sanitizeBusinessListings(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((business) => business && business.id && business.name)
    .map((business) => ({
      ...business,
      id: String(business.id),
      name: String(business.name),
      status: ['approved', 'pending', 'rejected'].includes(business.status)
        ? business.status
        : 'pending',
    }));
}

function mergeBusinessListings(existing, incoming) {
  const merged = new Map();
  for (const business of existing) merged.set(business.id, business);
  for (const business of incoming) merged.set(business.id, business);
  return Array.from(merged.values());
}

async function readBusinessListings() {
  const client = await getPgClient();
  if (client) {
    const result = await client.query(
      `SELECT value
       FROM app_state
       WHERE key = $1
       LIMIT 1`,
      ['businesses'],
    );
    const data = result.rows[0]?.value;
    const listings = sanitizeBusinessListings(data);
    return listings || [];
  }

  if (Array.isArray(memoryBusinesses)) return memoryBusinesses;
  try {
    const raw = await fs.readFile(businessesPath, 'utf8');
    const data = JSON.parse(raw);
    return sanitizeBusinessListings(data) || [];
  } catch {
    return [];
  }
}

async function writeBusinessListings(businesses) {
  const listings = sanitizeBusinessListings(businesses) || [];
  const client = await getPgClient();
  if (client) {
    await client.query(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['businesses', JSON.stringify(listings)],
    );
    return;
  }

  try {
    await fs.writeFile(businessesPath, JSON.stringify(listings, null, 2), 'utf8');
    memoryBusinesses = listings;
  } catch (err) {
    console.warn('businesses.json write failed, using in-memory listing store:', err?.message || err);
    memoryBusinesses = listings;
  }
}

async function ensureBootstrapUsers() {
  const users = await readUsers();
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@localsy.test';
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@12345';
  const devEmail = process.env.BOOTSTRAP_DEV_EMAIL || 'dev@localsy.test';
  const devPassword = process.env.BOOTSTRAP_DEV_PASSWORD || 'Dev@12345';
  const seed = users.length > 0 ? users : [
    {
      id: randomId('usr'),
      name: 'Platform Admin',
      email: adminEmail.toLowerCase(),
      phone: '+91 9999900000',
      userType: 'platform_admin',
      role: normalizeRoleForType('platform_admin'),
      passwordHash: await hashPassword(adminPassword),
      createdAt: nowIso(),
      status: 'active',
    },
    {
      id: randomId('usr'),
      name: 'Developer User',
      email: devEmail.toLowerCase(),
      phone: '+91 9999911111',
      userType: 'developer',
      role: normalizeRoleForType('developer'),
      passwordHash: await hashPassword(devPassword),
      createdAt: nowIso(),
      status: 'active',
    },
  ];
  const byEmail = new Set(seed.map((u) => u.email));
  if (!byEmail.has(adminEmail.toLowerCase())) {
    seed.push({
      id: randomId('usr'),
      name: 'Platform Admin',
      email: adminEmail.toLowerCase(),
      phone: '+91 9999900000',
      userType: 'platform_admin',
      role: normalizeRoleForType('platform_admin'),
      passwordHash: await hashPassword(adminPassword),
      createdAt: nowIso(),
      status: 'active',
    });
  }
  if (!byEmail.has(devEmail.toLowerCase())) {
    seed.push({
      id: randomId('usr'),
      name: 'Developer User',
      email: devEmail.toLowerCase(),
      phone: '+91 9999911111',
      userType: 'developer',
      role: normalizeRoleForType('developer'),
      passwordHash: await hashPassword(devPassword),
      createdAt: nowIso(),
      status: 'active',
    });
  }
  await writeUsers(seed);
}

function authFromHeader(req) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return verifyToken(token);
}

async function getPgClient() {
  if (pgInitAttempted) return pgClient;
  pgInitAttempted = true;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  try {
    const { Client } = await import('pg');
    pgClient = new Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    });
    await pgClient.connect();
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS compliance_audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        action_type TEXT NOT NULL,
        description TEXT NOT NULL,
        details TEXT,
        ip_address TEXT NOT NULL,
        device_code TEXT NOT NULL,
        user_name TEXT NOT NULL
      )
    `);
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL DEFAULT '',
        user_type TEXT NOT NULL,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    return pgClient;
  } catch (err) {
    console.error('Postgres audit logging unavailable, using file fallback:', err?.message || err);
    pgClient = null;
    return null;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'localsy-web' });
});

app.get('/api/businesses', async (_req, res) => {
  try {
    const businesses = await readBusinessListings();
    res.json({ ok: true, businesses });
  } catch (err) {
    console.error('Failed to read business listings:', err);
    res.status(500).json({ ok: false, error: 'Failed to read business listings' });
  }
});

app.put('/api/businesses', async (req, res) => {
  const incoming = sanitizeBusinessListings(req.body?.businesses);
  if (!incoming) {
    return res.status(400).json({ ok: false, error: 'businesses array is required' });
  }

  try {
    const existing = await readBusinessListings();
    const businesses = mergeBusinessListings(existing, incoming);
    await writeBusinessListings(businesses);
    res.json({ ok: true, businesses });
  } catch (err) {
    console.error('Failed to sync business listings:', err);
    res.status(500).json({ ok: false, error: 'Failed to sync business listings' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, userType } = req.body || {};
  if (!name || !email || !password || !userType) {
    return res.status(400).json({ ok: false, error: 'name, email, password and userType are required' });
  }
  if (!ALL_USER_TYPES.includes(userType)) {
    return res.status(400).json({ ok: false, error: 'Invalid userType' });
  }

  const requester = authFromHeader(req);
  const canCreatePrivileged = requester && ['platform_admin', 'developer'].includes(requester.userType);
  if (!PUBLIC_USER_TYPES.includes(userType) && !canCreatePrivileged) {
    return res.status(403).json({ ok: false, error: 'Only platform_admin/developer can create this user type' });
  }

  const users = await readUsers();
  const normalizedEmail = String(email).toLowerCase().trim();
  if (users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ ok: false, error: 'Email already registered' });
  }

  const created = {
    id: randomId('usr'),
    name: String(name).trim(),
    email: normalizedEmail,
    phone: String(phone || '').trim(),
    userType,
    role: normalizeRoleForType(userType),
    passwordHash: await hashPassword(String(password)),
    createdAt: nowIso(),
    status: 'active',
  };
  users.push(created);
  await writeUsers(users);

  res.status(201).json({
    ok: true,
    user: {
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      userType: created.userType,
      role: created.role,
      status: created.status,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'email and password are required' });
  }
  const users = await readUsers();
  const user = users.find((u) => u.email === String(email).toLowerCase().trim());
  if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  const valid = await verifyPassword(String(password), user.passwordHash);
  if (!valid) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  if (user.status !== 'active') return res.status(403).json({ ok: false, error: 'User is not active' });

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    userType: user.userType,
    exp,
  });

  res.json({
    ok: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      role: user.role,
      status: user.status,
    },
  });
});

app.get('/api/auth/me', async (req, res) => {
  const payload = authFromHeader(req);
  if (!payload) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const users = await readUsers();
  const user = users.find((u) => u.id === payload.sub);
  if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  res.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      role: user.role,
      status: user.status,
    },
  });
});

app.post('/api/audit-events', async (req, res) => {
  const payload = req.body || {};
  const required = ['id', 'timestamp', 'actionType', 'description', 'details', 'ipAddress', 'deviceCode', 'userName'];
  const missing = required.filter((k) => payload[k] === undefined || payload[k] === null);
  if (missing.length > 0) {
    return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` });
  }

  const event = {
    id: String(payload.id),
    timestamp: String(payload.timestamp),
    actionType: String(payload.actionType),
    description: String(payload.description),
    details: String(payload.details),
    ipAddress: String(payload.ipAddress),
    deviceCode: String(payload.deviceCode),
    userName: String(payload.userName),
  };

  try {
    const client = await getPgClient();
    if (client) {
      await client.query(
        `INSERT INTO compliance_audit_logs (id, timestamp, action_type, description, details, ip_address, device_code, user_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [
          event.id,
          event.timestamp,
          event.actionType,
          event.description,
          event.details,
          event.ipAddress,
          event.deviceCode,
          event.userName,
        ],
      );
    } else {
      await fs.appendFile(auditLogPath, JSON.stringify(event) + '\n', 'utf8');
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Failed to persist audit event:', err);
    res.status(500).json({ ok: false, error: 'Failed to persist audit event' });
  }
});

app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

function resolvePort() {
  const rawPort = Number(process.env.PORT);
  const rawPgPort = Number(process.env.PGPORT);
  if (!Number.isFinite(rawPort) || rawPort <= 0) return 3000;
  // Guard against misconfigured environments where app PORT is set to DB port.
  if (rawPort === 5432 || (Number.isFinite(rawPgPort) && rawPort === rawPgPort)) {
    return 3000;
  }
  return rawPort;
}

const port = resolvePort();
ensureBootstrapUsers()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('User bootstrap failed, starting without seeded users:', err);
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port} (bootstrap fallback mode)`);
    });
  });
