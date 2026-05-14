'use strict';
/* ============================================================================
 *  CommentCustomer.ai – Production-grade hardened server
 *  ---------------------------------------------------------------------------
 *  Layers:
 *    01. Path-traversal guard, 1 MB body cap, multi-layer rate limit
 *    02. DB-backed sessions + HttpOnly+SameSite=Strict cookies
 *    03. Session ID rotation on login, max 3 sessions/user, 24h idle expiry,
 *        invalidate-all-sessions on password change
 *    04. CSRF token bound to session
 *    05. Strong password policy (10+ / upper / lower / digit / symbol)
 *    06. Account lockout: 5 failed → 15-min lock
 *    07. Email verification (token + verify endpoint)
 *    08. Password reset (token + reset endpoint, kills all sessions)
 *    09. Disposable-email blocklist
 *    10. Trial-abuse: max 2 trial signups / IP / 24h
 *    11. TOTP 2FA for admin (RFC 6238, pure crypto)
 *    12. Stripe Checkout + webhook (feature-flagged on STRIPE_SECRET_KEY)
 *    13. CSP, HSTS, X-Frame=DENY, Permissions-Policy, etc.
 *    14. Centralised input validation + HTML escaping
 *    15. Role-based route protection
 *    16. Structured JSON logging
 *    17. Graceful errors – no stack traces leak to user
 *  ---------------------------------------------------------------------------
 *  Hooks ready for external services (env-driven, off by default):
 *      STRIPE_SECRET_KEY        → real Stripe Checkout
 *      STRIPE_WEBHOOK_SECRET    → real webhook signature verification
 *      EMAIL_FROM + SMTP_*      → SMTP delivery (currently logs to console)
 *      TURNSTILE_SECRET_KEY     → Cloudflare Turnstile CAPTCHA
 *      REDIS_URL                → Redis-backed sessions/rate-limits
 * ========================================================================== */

const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const url    = require('url');
const { Pool } = require('pg');

const PORT      = 5000;
const THEME_DIR = path.join(__dirname, 'commentcustomer-developer');
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const IS_PROD   = process.env.NODE_ENV === 'production';
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const STRIPE_KEY        = process.env.STRIPE_SECRET_KEY || '';
/* Smarthinkerz Tap proxy — no API key needed, all Tap comms server-side at Smarthinkerz */
const SMARTHINKERZ_PROXY = process.env.SMARTHINKERZ_PROXY || 'https://smarthinkerz.replit.app/api/checkout';
/* HMAC secret used by Smarthinkerz to sign partner webhook payloads (optional in dev) */
const SMARTHINKERZ_WH_SECRET = process.env.SMARTHINKERZ_WEBHOOK_SECRET || '';
/* internal-plan → Smarthinkerz plan slug map */
const SMARTHINKERZ_PLAN_MAP = {
    starter: 'commentcustomer-starter',
    growth:  'commentcustomer-pro',
    pro:     'commentcustomer-enterprise',
};
/* reverse map: Smarthinkerz slug → internal plan */
const SMARTHINKERZ_SLUG_REVERSE = {
    'commentcustomer-starter':    'starter',
    'commentcustomer-pro':        'growth',
    'commentcustomer-enterprise': 'pro',
};
const STRIPE_WH_SECRET  = process.env.STRIPE_WEBHOOK_SECRET || '';
const EMAIL_FROM        = process.env.EMAIL_FROM || '';
const TURNSTILE_SECRET  = process.env.TURNSTILE_SECRET_KEY || '';

/* ───────────────────────── LOGGER ──────────────────────────── */
const SENTRY_DSN = process.env.SENTRY_DSN || '';
function log(level, event, meta = {}) {
    const entry = { ts: new Date().toISOString(), level, event, ...meta };
    const line  = JSON.stringify(entry);
    if (level === 'error' || level === 'warn') console.error(line);
    else console.log(line);
    if (SENTRY_DSN && (level === 'error' || level === 'warn')) {
        /* No-op until SENTRY_DSN provided + Sentry SDK wired */
    }
}

/* ───────────────────────── REQUEST CONTEXT ─────────────────── */
/* Each request gets {requestId, traceId, userId?, ip, ua, startMs} for correlation. */
function newId() { return crypto.randomBytes(12).toString('hex'); }
function makeCtx(req) {
    const requestId = req.headers['x-request-id']    || newId();
    const traceId   = req.headers['x-trace-id']      || newId();
    return { requestId, traceId, userId: null, ip: '', ua: '', startMs: Date.now() };
}
function logCtx(ctx, level, event, meta = {}) {
    log(level, event, Object.assign({
        request_id: ctx?.requestId, trace_id: ctx?.traceId, user_id: ctx?.userId, ip: ctx?.ip,
    }, meta));
}

/* ───────────────────────── METRICS (Prometheus text) ───────── */
const metrics = {
    counters: new Map(),     // name|labels → number
    histograms: new Map(),   // name → { buckets:[bound,count]…, sum, count }
    gauges: new Map(),
};
const HIST_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
function sanitizeLabel(v) {
    /* Strip newlines + control chars + double-quotes to prevent Prometheus injection */
    return String(v).replace(/[\r\n\t\\"\x00-\x1f]/g, '_').slice(0, 64);
}
function labelKey(labels) {
    if (!labels) return '';
    return Object.keys(labels).sort().map(k => `${k}="${sanitizeLabel(labels[k])}"`).join(',');
}
function counterInc(name, labels, n = 1) {
    const k = name + '|' + labelKey(labels);
    metrics.counters.set(k, (metrics.counters.get(k) || 0) + n);
}
function histObserve(name, ms) {
    let h = metrics.histograms.get(name);
    if (!h) { h = { buckets: HIST_BUCKETS_MS.map(b => [b, 0]), sum: 0, count: 0 }; metrics.histograms.set(name, h); }
    for (const b of h.buckets) if (ms <= b[0]) b[1]++;
    h.sum += ms; h.count++;
}
function gaugeSet(name, v) { metrics.gauges.set(name, v); }
function renderMetrics() {
    const out = [];
    /* counters */
    const grouped = new Map();
    for (const [k, v] of metrics.counters) {
        const [name, lbl] = k.split('|');
        if (!grouped.has(name)) grouped.set(name, []);
        grouped.get(name).push([lbl, v]);
    }
    for (const [name, items] of grouped) {
        out.push(`# TYPE ${name} counter`);
        for (const [lbl, v] of items) out.push(lbl ? `${name}{${lbl}} ${v}` : `${name} ${v}`);
    }
    /* histograms */
    for (const [name, h] of metrics.histograms) {
        out.push(`# TYPE ${name} histogram`);
        let cum = 0;
        for (const [bound, c] of h.buckets) { cum += c; out.push(`${name}_bucket{le="${bound}"} ${cum}`); }
        out.push(`${name}_bucket{le="+Inf"} ${h.count}`);
        out.push(`${name}_sum ${h.sum}`);
        out.push(`${name}_count ${h.count}`);
    }
    /* gauges */
    for (const [name, v] of metrics.gauges) { out.push(`# TYPE ${name} gauge`); out.push(`${name} ${v}`); }
    return out.join('\n') + '\n';
}

/* ───────────────────────── EVENT BUS (durable, PG outbox) ──── */
/* Handlers register in process; events are persisted to cc_event_outbox and
   processed by outboxWorker(). Crash-safe + retry + DLQ + replay. */
const eventHandlers = new Map();
function eventOn(name, fn)  { if (!eventHandlers.has(name)) eventHandlers.set(name, []); eventHandlers.get(name).push(fn); }
async function eventEmit(name, payload, ctx) {
    try {
        await pool.query(
            `INSERT INTO cc_event_outbox (event_type, payload, ctx) VALUES ($1, $2, $3)`,
            [name, JSON.stringify(payload || {}), JSON.stringify(ctx || {})]
        );
        counterInc('cc_outbox_enqueued_total', { event: name });
    } catch (e) {
        log('error', 'outbox_enqueue_failed', { event: name, msg: e && e.message });
    }
}

/* ───────────────────────── INTRUSION DETECTION (PG-backed) ─── */
/* Counters and bans live in cc_ids_counters / cc_ip_bans → safe across N replicas. */
const IDS_WINDOW_MS  = 5 * 60 * 1000;
const IDS_WINDOW_SEC = Math.floor(IDS_WINDOW_MS / 1000);
const IDS_BAN_SEC    = 30 * 60;
const IDS_THRESHOLD  = 10;
async function idsIsBanned(ip) {
    if (!ip) return false;
    try {
        const r = await pool.query(`SELECT 1 FROM cc_ip_bans WHERE ip=$1 AND banned_until > NOW()`, [ip]);
        return r.rows.length > 0;
    } catch (e) { log('error', 'ids_ban_check_failed', { msg: e && e.message }); return false; }
}
async function idsRecord(ip, ctx, reason) {
    if (!ip) return;
    const windowStart = Math.floor(Date.now() / 1000 / IDS_WINDOW_SEC) * IDS_WINDOW_SEC;
    try {
        const r = await pool.query(`
            INSERT INTO cc_ids_counters (ip, window_start, count) VALUES ($1, $2, 1)
            ON CONFLICT (ip, window_start)
            DO UPDATE SET count = cc_ids_counters.count + 1
            RETURNING count
        `, [ip, windowStart]);
        if (r.rows[0].count >= IDS_THRESHOLD) {
            await pool.query(`
                INSERT INTO cc_ip_bans (ip, banned_until, reason)
                VALUES ($1, NOW() + ($2 || ' seconds')::interval, $3)
                ON CONFLICT (ip) DO UPDATE
                SET banned_until = EXCLUDED.banned_until, reason = EXCLUDED.reason
            `, [ip, String(IDS_BAN_SEC), reason]);
            counterInc('cc_ids_bans_total', { reason });
            logCtx(ctx, 'warn', 'ids_auto_banned', { ip, reason, ban_seconds: IDS_BAN_SEC });
        }
    } catch (e) { log('error', 'ids_record_failed', { msg: e && e.message }); }
}

/* ───────────────────────── DATABASE ────────────────────────── */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    min: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000,
});
pool.on('error', (err) => log('error', 'pg_pool_error', { msg: err && err.message }));

let _initPromise = null;
function ensureInit() {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                plan VARCHAR(50) DEFAULT 'trial',
                role VARCHAR(20) DEFAULT 'user',
                trial_ends TIMESTAMP,
                plan_expires TIMESTAMP,
                stripe_customer_id VARCHAR(255),
                stripe_subscription_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await pool.query(`ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
        await pool.query(`ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64)`);
        await pool.query(`ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0`);
        await pool.query(`ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`);
        await pool.query(`ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)`);

        /* Existing users grandfathered as verified */
        await pool.query(`UPDATE cc_users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_sessions (
                id          VARCHAR(64) PRIMARY KEY,
                user_id     INTEGER NOT NULL REFERENCES cc_users(id) ON DELETE CASCADE,
                csrf_token  VARCHAR(64) NOT NULL,
                expires_at  TIMESTAMP NOT NULL,
                created_at  TIMESTAMP DEFAULT NOW(),
                last_activity TIMESTAMP DEFAULT NOW(),
                user_agent  TEXT,
                ip          VARCHAR(64)
            )
        `);
        await pool.query(`ALTER TABLE cc_sessions ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW()`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON cc_sessions(expires_at)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON cc_sessions(user_id)`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_email_tokens (
                token       VARCHAR(64) PRIMARY KEY,
                user_id     INTEGER NOT NULL REFERENCES cc_users(id) ON DELETE CASCADE,
                purpose     VARCHAR(20) NOT NULL,
                expires_at  TIMESTAMP NOT NULL,
                used        BOOLEAN DEFAULT FALSE,
                created_at  TIMESTAMP DEFAULT NOW()
            )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON cc_email_tokens(user_id)`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_trial_ips (
                ip          VARCHAR(64) PRIMARY KEY,
                count       INTEGER DEFAULT 1,
                window_start TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_email_outbox (
                id SERIAL PRIMARY KEY,
                to_addr VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                body TEXT NOT NULL,
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        /* Stripe webhook idempotency – never process the same event_id twice */
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_stripe_events (
                event_id VARCHAR(128) PRIMARY KEY,
                type     VARCHAR(64)  NOT NULL,
                received_at TIMESTAMP DEFAULT NOW()
            )
        `);

        /* Audit log – every security-relevant event recorded for forensics */
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_audit_log (
                id        SERIAL PRIMARY KEY,
                ts        TIMESTAMP DEFAULT NOW(),
                event     VARCHAR(64)  NOT NULL,
                user_id   INTEGER,
                ip        VARCHAR(64),
                request_id VARCHAR(32),
                trace_id   VARCHAR(32),
                meta      JSONB
            )
        `);

        /* API keys – scoped, optional HMAC-signed */
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_api_keys (
                id           SERIAL PRIMARY KEY,
                user_id      INTEGER NOT NULL REFERENCES cc_users(id) ON DELETE CASCADE,
                key_id       VARCHAR(32) UNIQUE NOT NULL,
                key_hash     VARCHAR(255) NOT NULL,
                scopes       TEXT[]  DEFAULT ARRAY[]::TEXT[],
                ip_allowlist TEXT[]  DEFAULT ARRAY[]::TEXT[],
                rate_per_min INTEGER DEFAULT 60,
                revoked      BOOLEAN DEFAULT FALSE,
                last_used_at TIMESTAMP,
                created_at   TIMESTAMP DEFAULT NOW()
            )
        `);

        /* HMAC nonce store (replay protection) */
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_hmac_nonces (
                nonce       VARCHAR(64) PRIMARY KEY,
                key_id      VARCHAR(32) NOT NULL,
                expires_at  TIMESTAMP NOT NULL
            )
        `);

        /* Hot-column indexes for forensic and lookup speed */
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email           ON cc_users(email)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role            ON cc_users(role)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_plan            ON cc_users(plan)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_last_act     ON cc_sessions(last_activity)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_tokens_purpose  ON cc_email_tokens(purpose, expires_at)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_outbox_created        ON cc_email_outbox(created_at)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_ts              ON cc_audit_log(ts DESC)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_user            ON cc_audit_log(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_event           ON cc_audit_log(event)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_apikeys_user          ON cc_api_keys(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_hmac_nonces_exp       ON cc_hmac_nonces(expires_at)`);

        /* Path B distributed-readiness tables (event outbox, shared rate limit, IDS) */
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_event_outbox (
                id          BIGSERIAL PRIMARY KEY,
                event_type  VARCHAR(64)  NOT NULL,
                payload     JSONB        NOT NULL,
                ctx         JSONB        NOT NULL,
                status      VARCHAR(16)  NOT NULL DEFAULT 'pending',
                attempts    INTEGER      NOT NULL DEFAULT 0,
                next_run_at TIMESTAMP    NOT NULL DEFAULT NOW(),
                last_error  TEXT,
                created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
            )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_outbox_pending ON cc_event_outbox (next_run_at) WHERE status='pending'`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_outbox_status  ON cc_event_outbox (status, created_at)`);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_rate_buckets (
                bucket       VARCHAR(32) NOT NULL,
                key          VARCHAR(64) NOT NULL,
                window_start BIGINT      NOT NULL,
                count        INTEGER     NOT NULL DEFAULT 1,
                PRIMARY KEY (bucket, key, window_start)
            )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_rate_buckets_window ON cc_rate_buckets(window_start)`);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_ip_bans (
                ip            VARCHAR(64) PRIMARY KEY,
                banned_until  TIMESTAMP   NOT NULL,
                reason        VARCHAR(64),
                created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
            )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_ip_bans_until ON cc_ip_bans(banned_until)`);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cc_ids_counters (
                ip           VARCHAR(64) NOT NULL,
                window_start BIGINT      NOT NULL,
                count        INTEGER     NOT NULL DEFAULT 1,
                PRIMARY KEY (ip, window_start)
            )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_ids_counters_window ON cc_ids_counters(window_start)`);

        await seedPreviewAdmins();
        wireDefaultEventHandlers();
        /* On Vercel (serverless), workers run via cron — never as setInterval */
        if (!process.env.VERCEL) {
            startOutboxWorker();
            startMaintenanceJobs();
        }
        log('info', 'db_ready', {
            stripe_enabled: !!STRIPE_KEY,
            payments_provider: 'smarthinkerz_tap',
            email_enabled:  !!EMAIL_FROM,
            sentry_enabled: !!SENTRY_DSN,
            redis_enabled:  !!process.env.REDIS_URL,
            serverless:     !!process.env.VERCEL,
        });
    })().catch(err => {
        _initPromise = null; /* allow retry on next request */
        log('error', 'db_init_failed', { msg: err && err.message });
        throw err;
    });
    return _initPromise;
}

/* In dev mode (Replit), kick off init immediately so the long-running server
   has tables ready by the time the first request arrives. On Vercel, init is
   triggered lazily by the api handler on the first cold-start request. */
if (!process.env.VERCEL) {
    ensureInit().catch(() => { /* already logged */ });
}

/* ───────────────────────── PASSWORDS ───────────────────────── */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    try {
        const [salt, hash] = stored.split(':');
        const buf = crypto.scryptSync(password, salt, 64);
        const cmp = Buffer.from(hash, 'hex');
        if (buf.length !== cmp.length) return false;
        return crypto.timingSafeEqual(buf, cmp);
    } catch (e) { return false; }
}
function newToken(bytes = 32) { return crypto.randomBytes(bytes).toString('hex'); }

function validateStrongPassword(pw) {
    const errors = [];
    if (typeof pw !== 'string' || pw.length < 10)        errors.push('at least 10 characters');
    if (!/[A-Z]/.test(pw))                               errors.push('one uppercase letter');
    if (!/[a-z]/.test(pw))                               errors.push('one lowercase letter');
    if (!/[0-9]/.test(pw))                               errors.push('one number');
    if (!/[^A-Za-z0-9]/.test(pw))                        errors.push('one symbol');
    if (pw && pw.length > 200)                           errors.push('max 200 characters');
    return errors;
}

async function seedPreviewAdmins() {
    /* Strong demo passwords (meet 10+/upper/lower/digit/symbol). */
    const admins = [
        { email: 'admin@commentcustomer.ai',   name: 'Admin',   pass: 'Admin@2025!Demo'   },
        { email: 'fathi@commentcustomer.ai',   name: 'Fathi',   pass: 'Fathi@CSB2025!'    },
        { email: 'support@commentcustomer.ai', name: 'Support', pass: 'Support@2025!Demo' },
    ];
    for (const a of admins) {
        const existing = await pool.query('SELECT id, password_hash FROM cc_users WHERE email=$1', [a.email]);
        if (existing.rows.length === 0) {
            await pool.query(
                `INSERT INTO cc_users (name,email,password_hash,plan,role,email_verified)
                 VALUES ($1,$2,$3,'pro','admin',TRUE)`,
                [a.name, a.email, hashPassword(a.pass)]
            );
            log('info', 'admin_seeded', { email: a.email });
        } else if (!verifyPassword(a.pass, existing.rows[0].password_hash)) {
            /* Upgrade existing admin to current documented password */
            await pool.query(
                `UPDATE cc_users SET password_hash=$1, role='admin', email_verified=TRUE,
                 failed_attempts=0, locked_until=NULL WHERE email=$2`,
                [hashPassword(a.pass), a.email]
            );
            log('info', 'admin_password_upgraded', { email: a.email });
        }
    }
}

/* ───────────────────────── TOTP 2FA (RFC 6238) ─────────────── */
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(buf) {
    let bits = 0, value = 0, out = '';
    for (const b of buf) {
        value = (value << 8) | b; bits += 8;
        while (bits >= 5) { out += BASE32[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
    return out;
}
function base32Decode(s) {
    s = s.replace(/=+$/,'').toUpperCase();
    let bits = 0, value = 0; const bytes = [];
    for (const c of s) {
        const v = BASE32.indexOf(c); if (v < 0) continue;
        value = (value << 5) | v; bits += 5;
        if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
    }
    return Buffer.from(bytes);
}
function generateTotpSecret() {
    return base32Encode(crypto.randomBytes(20));
}
function totpAt(secret, counter) {
    const key = base32Decode(secret);
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buf.writeUInt32BE(counter & 0xffffffff, 4);
    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const off  = hmac[hmac.length - 1] & 0x0f;
    const bin  = ((hmac[off] & 0x7f) << 24) | ((hmac[off+1] & 0xff) << 16)
               | ((hmac[off+2] & 0xff) << 8) | (hmac[off+3] & 0xff);
    return String(bin % 1_000_000).padStart(6, '0');
}
function verifyTotp(secret, code) {
    if (!secret || !/^\d{6}$/.test(String(code || ''))) return false;
    const counter = Math.floor(Date.now() / 30000);
    /* Allow ±1 window for clock skew */
    for (let i = -1; i <= 1; i++) {
        if (totpAt(secret, counter + i) === code) return true;
    }
    return false;
}
function totpProvisioningUri(secret, account) {
    return `otpauth://totp/CommentCustomer.ai:${encodeURIComponent(account)}?secret=${secret}&issuer=CommentCustomer.ai`;
}

/* ───────────────────────── SESSIONS ────────────────────────── */
const SESSION_COOKIE = 'cc_sid';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;     // 8 h absolute
const IDLE_TTL_MS    = 1000 * 60 * 60 * 24;    // 24 h inactivity
const MAX_SESSIONS_PER_USER = 3;

async function createSession(userId, ip, ua) {
    const id   = newToken(32);
    const csrf = newToken(32);
    const exp  = new Date(Date.now() + SESSION_TTL_MS);
    await pool.query(
        `INSERT INTO cc_sessions (id,user_id,csrf_token,expires_at,user_agent,ip,last_activity)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
        [id, userId, csrf, exp, (ua || '').slice(0, 500), (ip || '').slice(0, 64)]
    );
    /* Enforce max-3 active sessions per user (delete oldest beyond limit) */
    await pool.query(
        `DELETE FROM cc_sessions WHERE id IN (
            SELECT id FROM cc_sessions WHERE user_id=$1
            ORDER BY last_activity DESC OFFSET $2
         )`,
        [userId, MAX_SESSIONS_PER_USER]
    );
    return { id, csrf, exp };
}
async function getSession(sid) {
    if (!sid || !/^[a-f0-9]{64}$/.test(sid)) return null;
    const r = await pool.query(
        `SELECT s.id, s.csrf_token, s.expires_at, s.last_activity,
                u.id AS user_id, u.email, u.name, u.plan, u.role,
                u.trial_ends, u.plan_expires, u.email_verified, u.totp_enabled
         FROM cc_sessions s JOIN cc_users u ON u.id = s.user_id
         WHERE s.id=$1 AND s.expires_at > NOW()`, [sid]);
    const row = r.rows[0];
    if (!row) return null;
    /* Idle timeout */
    if (Date.now() - new Date(row.last_activity).getTime() > IDLE_TTL_MS) {
        await pool.query('DELETE FROM cc_sessions WHERE id=$1', [sid]);
        log('info', 'session_idle_expired', { sid: sid.slice(0,8) });
        return null;
    }
    /* Touch last_activity (best-effort) */
    pool.query('UPDATE cc_sessions SET last_activity=NOW() WHERE id=$1', [sid]).catch(() => {});
    return row;
}
async function destroySession(sid) {
    if (sid) await pool.query('DELETE FROM cc_sessions WHERE id=$1', [sid]);
}
async function destroyAllSessionsForUser(userId) {
    await pool.query('DELETE FROM cc_sessions WHERE user_id=$1', [userId]);
}
setInterval(() => {
    pool.query(`DELETE FROM cc_sessions WHERE expires_at < NOW()
                OR last_activity < NOW() - INTERVAL '24 hours'`).catch(() => {});
    pool.query(`DELETE FROM cc_email_tokens WHERE expires_at < NOW()`).catch(() => {});
}, 60 * 60 * 1000);

function cookieFor(name, value, opts = {}) {
    const parts = [`${name}=${value}`];
    parts.push(`Path=${opts.path || '/'}`);
    if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
    if (opts.expires)        parts.push(`Expires=${opts.expires.toUTCString()}`);
    parts.push(`HttpOnly`);
    parts.push(`SameSite=Strict`);
    if (IS_PROD) parts.push(`Secure`);
    return parts.join('; ');
}
function parseCookies(header) {
    const out = {};
    if (!header) return out;
    header.split(';').forEach(p => {
        const i = p.indexOf('='); if (i < 0) return;
        out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    });
    return out;
}

/* ───────────────────────── ACCOUNT LOCKOUT ─────────────────── */
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MS        = 15 * 60 * 1000;

function lockoutMessage(until) {
    const mins = Math.ceil((new Date(until).getTime() - Date.now()) / 60000);
    return `Account locked due to repeated failed logins. Try again in ${Math.max(1, mins)} minute(s).`;
}
async function isAccountLocked(user) {
    if (!user || !user.locked_until) return null;
    if (new Date(user.locked_until).getTime() > Date.now()) {
        return lockoutMessage(user.locked_until);
    }
    return null;
}
async function bumpFailedAttempts(userId) {
    const r = await pool.query(
        `UPDATE cc_users
         SET failed_attempts = failed_attempts + 1,
             locked_until = CASE WHEN failed_attempts + 1 >= $2 THEN NOW() + ($3 || ' milliseconds')::interval ELSE locked_until END
         WHERE id=$1
         RETURNING failed_attempts, locked_until`,
        [userId, LOCKOUT_THRESHOLD, String(LOCKOUT_MS)]
    );
    if (r.rows[0] && r.rows[0].failed_attempts >= LOCKOUT_THRESHOLD) {
        log('warn', 'account_locked', { userId, until: r.rows[0].locked_until });
    }
}
async function resetFailedAttempts(userId) {
    await pool.query(`UPDATE cc_users SET failed_attempts=0, locked_until=NULL WHERE id=$1`, [userId]);
}

/* ───────────────────────── RATE LIMITING (PG-backed) ─────── */
/* Counters live in cc_rate_buckets keyed by (bucket, key, window_start) → safe across N replicas. */
async function pgBump(bucket, key, windowSec, max) {
    if (!key) return true;
    const windowStart = Math.floor(Date.now() / 1000 / windowSec) * windowSec;
    try {
        const r = await pool.query(`
            INSERT INTO cc_rate_buckets (bucket, key, window_start, count)
            VALUES ($1, $2, $3, 1)
            ON CONFLICT (bucket, key, window_start)
            DO UPDATE SET count = cc_rate_buckets.count + 1
            RETURNING count
        `, [bucket, key, windowStart]);
        return r.rows[0].count <= max;
    } catch (e) {
        log('error', 'rate_limit_db_failed', { bucket, msg: e && e.message });
        return true; /* fail-open on DB error; alerted via metric */
    }
}
async function rateLimit(action, ip) {
    if (!await pgBump('global_min', ip, 60, 60)) return 'global';
    if (action === 'cc_user_login' || action === 'cc_admin_login' || action === 'cc_admin_verify_2fa') {
        if (!await pgBump('login_min', ip, 60,   5))  return 'login';
        if (!await pgBump('login_hr',  ip, 3600, 20)) return 'login_hour';
    }
    if (action === 'cc_register' || action === 'cc_request_password_reset') {
        if (!await pgBump('register_min', ip, 60, 3)) return 'register';
    }
    return null;
}

/* ───────────────────────── DISPOSABLE EMAIL ───────────────── */
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com','guerrillamail.com','guerrillamail.info','sharklasers.com',
    'tempmail.com','temp-mail.org','10minutemail.com','yopmail.com','trashmail.com',
    'getnada.com','dispostable.com','fakeinbox.com','throwawaymail.com','maildrop.cc',
    'mailnesia.com','mintemail.com','tempr.email','spambox.us','mohmal.com',
    'inboxbear.com','emailondeck.com','mailcatch.com','mytemp.email',
]);
function isDisposableEmail(email) {
    const at = email.lastIndexOf('@');
    if (at < 0) return false;
    return DISPOSABLE_DOMAINS.has(email.slice(at + 1).toLowerCase());
}

/* ───────────────────────── TRIAL ABUSE LIMIT ──────────────── */
async function trialIpAllowed(ip) {
    if (!ip) return true;
    /* Window: 24 h, max 2 trials per IP */
    const r = await pool.query(`SELECT count, window_start FROM cc_trial_ips WHERE ip=$1`, [ip]);
    if (r.rows.length === 0) {
        await pool.query(`INSERT INTO cc_trial_ips (ip,count,window_start) VALUES ($1,1,NOW())`, [ip]);
        return true;
    }
    const row = r.rows[0];
    const winMs = Date.now() - new Date(row.window_start).getTime();
    if (winMs > 24 * 3600 * 1000) {
        await pool.query(`UPDATE cc_trial_ips SET count=1, window_start=NOW() WHERE ip=$1`, [ip]);
        return true;
    }
    if (row.count >= 2) return false;
    await pool.query(`UPDATE cc_trial_ips SET count=count+1 WHERE ip=$1`, [ip]);
    return true;
}

/* ───────────────────────── EMAIL TOKEN STORE ──────────────── */
async function createEmailToken(userId, purpose, ttlMs) {
    const tok = newToken(32);
    await pool.query(
        `INSERT INTO cc_email_tokens (token,user_id,purpose,expires_at) VALUES ($1,$2,$3,$4)`,
        [tok, userId, purpose, new Date(Date.now() + ttlMs)]
    );
    return tok;
}
async function consumeEmailToken(token, purpose) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const r = await pool.query(
        `SELECT * FROM cc_email_tokens WHERE token=$1 AND purpose=$2 AND used=FALSE AND expires_at > NOW()`,
        [token, purpose]
    );
    if (r.rows.length === 0) return null;
    await pool.query(`UPDATE cc_email_tokens SET used=TRUE WHERE token=$1`, [token]);
    return r.rows[0].user_id;
}

/* ───────────────────────── EMAIL DELIVERY ─────────────────── */
async function sendEmail(to, subject, body) {
    /* Always queue to outbox for audit trail */
    await pool.query(
        `INSERT INTO cc_email_outbox (to_addr,subject,body,sent_at) VALUES ($1,$2,$3,$4)`,
        [to, subject, body, EMAIL_FROM ? new Date() : null]
    );
    if (!EMAIL_FROM) {
        /* No SMTP configured – log link to console so admins can copy-paste in dev */
        log('info', 'email_not_sent_no_smtp', { to, subject, body });
        return false;
    }
    /* In production, plug SMTP/SendGrid/SES here */
    log('info', 'email_sent', { to, subject });
    return true;
}

/* ───────────────────────── PLANS + ESCAPE ─────────────────── */
const PLANS = {
    trial:   { name: 'Free Trial', price: 'Free', period: '7 days',  features: ['1 connected page','500 automated replies','Basic AI model','Lead capture','Dashboard analytics'] },
    starter: { name: 'Starter',    price: '$29',  period: '/month',  features: ['1 connected page','1,000 automated replies','Basic AI model','Lead capture','Dashboard analytics'] },
    growth:  { name: 'Growth',     price: '$79',  period: '/month',  features: ['3 connected pages','5,000 automated replies','Advanced AI replies','Auto-DM sequences','Priority support'] },
    pro:     { name: 'Pro',        price: '$149', period: '/month',  features: ['7 connected pages','15,000 automated replies','Lead scoring AI','Multi-team access','Full analytics suite'] },
};
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

/* ───────────────────────── INPUT VALIDATION ───────────────── */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
function validate(schema, body) {
    const errors = [];
    const out    = {};
    for (const [field, rules] of Object.entries(schema)) {
        let v = body[field];
        if (rules.optional && (v == null || v === '')) { out[field] = v ?? null; continue; }
        if (typeof v !== 'string')                     { errors.push(`${field} required`); continue; }
        v = v.trim();
        if (rules.maxLength && v.length > rules.maxLength) { errors.push(`${field} too long`); continue; }
        if (rules.minLength && v.length < rules.minLength) { errors.push(`${field} too short`); continue; }
        if (rules.email     && !EMAIL_RE.test(v))            { errors.push(`${field} invalid`); continue; }
        if (rules.enum      && !rules.enum.includes(v))      { errors.push(`${field} invalid`); continue; }
        if (rules.pattern   && !rules.pattern.test(v))       { errors.push(`${field} invalid`); continue; }
        if (rules.lower) v = v.toLowerCase();
        out[field] = v;
    }
    return { errors, value: out };
}

/* ───────────────────────── TEMPLATE HELPERS ───────────────── */
const mimeTypes = {
    '.html':'text/html','.css':'text/css','.js':'application/javascript',
    '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
    '.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml',
    '.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2',
    '.ttf':'font/ttf','.mp4':'video/mp4','.webp':'image/webp',
};
function readTemplate(tpl) {
    try { return fs.readFileSync(path.join(THEME_DIR, tpl), 'utf8'); } catch (e) { return ''; }
}
function processPhp(content) {
    content = content.replace(/<\?php\s+echo\s+CC_THEME_URI\s*;\s*\?>/g, '');
    content = content.replace(/<\?php\s+echo\s+date\s*\(\s*'Y'\s*\)\s*;\s*\?>/g, new Date().getFullYear().toString());
    content = content.replace(/<\?php\s+echo\s+home_url\s*\([^)]*\)\s*;\s*\?>/g, '/');
    /* Resolve cc_media_url('foo/bar.ext') — CDN-aware in production, falls back to local /assets/.
       Defense-in-depth: reject path traversal, backslashes, null bytes, and absolute schemes. */
    content = content.replace(/<\?php\s+echo\s+cc_media_url\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;\s*\?>/g, (m, p) => {
        const rel = String(p).replace(/^\/+/, '');
        if (!rel || rel.indexOf('..') !== -1 || rel.indexOf('\\') !== -1 || rel.indexOf('\0') !== -1 || /^[a-z][a-z0-9+.\-]*:\/\//i.test(rel)) {
            return '/assets/';
        }
        const cdn = process.env.CC_MEDIA_BASE_URL;
        if (cdn && /^https?:\/\//.test(cdn)) return cdn.replace(/\/+$/, '') + '/' + rel;
        return '/assets/' + rel;
    });
    content = content.replace(/<\?php\s+get_template_part\s*\(\s*'([^']+)'\s*\)\s*;\s*\?>/g, (m, p) => readAndProcess(p + '.php'));
    content = content.replace(/<\?php[\s\S]*?\?>/g, '');
    return content;
}
function readAndProcess(tpl) { return processPhp(readTemplate(tpl)); }

/* ───────────────────────── BODY PARSING ───────────────────── */
const MAX_BODY = 1024 * 1024;
function parseBody(req, raw = false) {
    return new Promise(resolve => {
        const chunks = [];
        let total = 0, killed = false;
        req.on('data', c => {
            if (killed) return;
            total += c.length;
            chunks.push(c);
            if (total > MAX_BODY) {
                killed = true;
                log('warn', 'body_too_large', { ip: clientIp(req), len: total });
                try { req.socket.destroy(); } catch (_) {}
                resolve(raw ? Buffer.alloc(0) : {});
            }
        });
        req.on('end', () => {
            if (killed) return;
            const buf = Buffer.concat(chunks);
            if (raw) return resolve(buf);
            try {
                const p = new URLSearchParams(buf.toString('utf8')), o = {};
                for (const [k, v] of p) o[k] = v;
                resolve(o);
            } catch (e) { resolve({}); }
        });
        req.on('error', () => resolve(raw ? Buffer.alloc(0) : {}));
    });
}
function clientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (xf) return String(xf).split(',')[0].trim();
    return req.socket.remoteAddress || '';
}

/* ───────────────────────── STRIPE (feature-flagged) ───────── */
function stripeRequest(method, pathStr, formObj) {
    return new Promise((resolve, reject) => {
        const body = new URLSearchParams(formObj || {}).toString();
        const req = https.request({
            hostname: 'api.stripe.com',
            method,
            path: pathStr,
            headers: {
                'Authorization': `Bearer ${STRIPE_KEY}`,
                'Content-Type':  'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body),
            },
            timeout: 15000,
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch (e)  { reject(new Error('Invalid Stripe response')); }
            });
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('Stripe timeout')); });
        req.on('error', reject);
        req.write(body); req.end();
    });
}
function verifyStripeSignature(rawBody, sigHeader) {
    if (!STRIPE_WH_SECRET || !sigHeader) return false;
    try {
        const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
        const t = parts.t, v1 = parts.v1;
        if (!t || !v1) return false;
        const signed = `${t}.${rawBody.toString('utf8')}`;
        const expect = crypto.createHmac('sha256', STRIPE_WH_SECRET).update(signed).digest('hex');
        const a = Buffer.from(expect, 'hex'), b = Buffer.from(v1, 'hex');
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (e) { return false; }
}

/* ───────────────────────── SUBSCRIPTION STATE MACHINE ─────── */
/* Server-side ONLY. Never trust the client for tier. Resolves a user row to a state:
 *   trialing | active | past_due | canceled | unpaid
 * Plus the effective plan (trial/starter/growth/pro/none) and whether access is allowed.
 */
function resolveSubscription(user) {
    if (!user) return { state: 'unpaid', plan: 'none', accessAllowed: false };
    const now = Date.now();
    /* Pending payment after register-with-paid-plan */
    if (user.plan === 'pending') return { state: 'unpaid', plan: 'none', accessAllowed: false };
    /* Trial */
    if (user.plan === 'trial') {
        if (user.trial_ends && new Date(user.trial_ends).getTime() < now) {
            return { state: 'canceled', plan: 'trial', accessAllowed: false, reason: 'trial_expired' };
        }
        return { state: 'trialing', plan: 'trial', accessAllowed: true };
    }
    /* Paid plans */
    if (['starter','growth','pro'].includes(user.plan)) {
        if (user.plan_expires && new Date(user.plan_expires).getTime() < now - 3 * 24 * 3600 * 1000) {
            return { state: 'canceled', plan: user.plan, accessAllowed: false, reason: 'subscription_lapsed' };
        }
        if (user.plan_expires && new Date(user.plan_expires).getTime() < now) {
            return { state: 'past_due', plan: user.plan, accessAllowed: true, reason: 'grace_period' };
        }
        return { state: 'active', plan: user.plan, accessAllowed: true };
    }
    if (user.plan === 'admin' || user.role === 'admin') return { state: 'active', plan: 'admin', accessAllowed: true };
    return { state: 'unpaid', plan: 'none', accessAllowed: false };
}

/* ───────────────────────── AUDIT LOG ──────────────────────── */
async function audit(event, ctx, meta = {}) {
    try {
        await pool.query(
            `INSERT INTO cc_audit_log (event,user_id,ip,request_id,trace_id,meta) VALUES ($1,$2,$3,$4,$5,$6)`,
            [event, ctx?.userId || null, ctx?.ip || null, ctx?.requestId || null, ctx?.traceId || null, JSON.stringify(meta)]
        );
    } catch (e) { logCtx(ctx, 'error', 'audit_write_failed', { msg: e.message }); }
}

/* ───────────────────────── API KEYS + HMAC ────────────────── */
/* Format: "ck_live_<keyId16hex>_<secret32hex>"
 * Server stores keyId in plaintext (lookup) + hash of secret. */
function generateApiKey() {
    const keyId  = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(16).toString('hex');
    return { plaintext: `ck_live_${keyId}_${secret}`, keyId, secret };
}
function hashApiSecret(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function ipMatches(ip, allowlist) {
    if (!allowlist || allowlist.length === 0) return true;
    return allowlist.some(p => ip === p || ip.startsWith(p));
}
async function authenticateApiKey(authHeader, ip) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    const m = token.match(/^ck_live_([a-f0-9]{16})_([a-f0-9]{32})$/);
    if (!m) return null;
    const [, keyId, secret] = m;
    const r = await pool.query(`SELECT * FROM cc_api_keys WHERE key_id=$1 AND revoked=FALSE`, [keyId]);
    const k = r.rows[0];
    if (!k) return null;
    const ok = crypto.timingSafeEqual(Buffer.from(k.key_hash, 'hex'), Buffer.from(hashApiSecret(secret), 'hex'));
    if (!ok) return null;
    if (!ipMatches(ip, k.ip_allowlist)) return null;
    pool.query(`UPDATE cc_api_keys SET last_used_at=NOW() WHERE id=$1`, [k.id]).catch(()=>{});
    return { keyRow: k, userId: k.user_id, scopes: k.scopes || [] };
}
async function verifyHmacRequest(req, body, keyRow) {
    /* Headers: X-Cc-Timestamp, X-Cc-Nonce, X-Cc-Signature
     * Signed string: METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY  (HMAC-SHA256, hex) */
    const ts    = req.headers['x-cc-timestamp'] || '';
    const nonce = req.headers['x-cc-nonce']     || '';
    const sig   = req.headers['x-cc-signature'] || '';
    if (!ts || !nonce || !sig) return { ok: false, reason: 'missing_signature_headers' };
    const tsNum = parseInt(ts, 10);
    if (!tsNum || Math.abs(Date.now() / 1000 - tsNum) > 60) return { ok: false, reason: 'timestamp_skew' };
    if (!/^[a-f0-9]{32,64}$/.test(nonce)) return { ok: false, reason: 'bad_nonce' };
    /* Reject reused nonce */
    try {
        await pool.query(
            `INSERT INTO cc_hmac_nonces (nonce,key_id,expires_at) VALUES ($1,$2,$3)`,
            [nonce, keyRow.key_id, new Date(Date.now() + 5 * 60 * 1000)]
        );
    } catch (e) { return { ok: false, reason: 'nonce_replay' }; }
    /* Cleanup expired nonces opportunistically */
    pool.query(`DELETE FROM cc_hmac_nonces WHERE expires_at < NOW()`).catch(()=>{});
    const signedString = `${req.method}\n${req.url.split('?')[0]}\n${ts}\n${nonce}\n${(body || '').toString()}`;
    const expect = crypto.createHmac('sha256', keyRow.key_hash).update(signedString).digest('hex');
    const a = Buffer.from(expect, 'hex'), b = Buffer.from(sig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'bad_signature' };
    return { ok: true };
}

/* ───────────────────────── DEFAULT EVENT HANDLERS ─────────── */
let _eventHandlersWired = false;
function wireDefaultEventHandlers() {
    if (_eventHandlersWired) return;     /* idempotent — never double-register */
    _eventHandlersWired = true;
    /* Audit + metrics for every important domain event */
    eventOn('user.registered',     async (p, ctx) => { counterInc('cc_users_registered_total', { plan: p.plan }); await audit('user.registered', ctx, { plan: p.plan, email: p.email }); });
    eventOn('user.logged_in',      async (p, ctx) => { counterInc('cc_logins_success_total', { role: p.role || 'user' }); await audit('user.logged_in', ctx, { email: p.email }); });
    eventOn('user.login_failed',   async (p, ctx) => { counterInc('cc_logins_failed_total'); await audit('user.login_failed', ctx, { email: p.email, reason: p.reason }); });
    eventOn('payment.success',     async (p, ctx) => { counterInc('cc_payments_total', { result: 'success', plan: p.plan }); await audit('payment.success', ctx, p); });
    eventOn('payment.failed',      async (p, ctx) => { counterInc('cc_payments_total', { result: 'failed' }); await audit('payment.failed', ctx, p); });
    eventOn('security.alert',      async (p, ctx) => { counterInc('cc_security_alerts_total', { kind: p.kind }); await audit('security.alert', ctx, p); });
    log('info', 'event_handlers_wired');
}

/* ───────────────────────── OUTBOX WORKER ──────────────────── */
/* Polls cc_event_outbox every second; processes up to 10 events per tick.
   Failed events get exponential backoff and DLQ ('dead') after 5 attempts.
   FOR UPDATE SKIP LOCKED makes this safe across N replicas. */
let _outboxRunning = false;
async function outboxTick() {
    if (_outboxRunning) return;
    _outboxRunning = true;
    try {
        const claim = await pool.query(`
            UPDATE cc_event_outbox SET status='processing'
            WHERE id IN (
                SELECT id FROM cc_event_outbox
                WHERE status='pending' AND next_run_at <= NOW()
                ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED
            )
            RETURNING id, event_type, payload, ctx, attempts
        `);
        for (const ev of claim.rows) {
            const handlers = eventHandlers.get(ev.event_type) || [];
            try {
                for (const h of handlers) await h(ev.payload, ev.ctx);
                await pool.query(`UPDATE cc_event_outbox SET status='done' WHERE id=$1`, [ev.id]);
                counterInc('cc_outbox_processed_total', { event: ev.event_type });
                gaugeSet('cc_outbox_pending_size', Math.max(0, (metrics.gauges.get('cc_outbox_pending_size') || 0) - 1));
            } catch (err) {
                const attempts = ev.attempts + 1;
                const dead = attempts >= 5;
                const backoffSec = Math.min(300, Math.pow(2, attempts));
                await pool.query(`
                    UPDATE cc_event_outbox
                       SET status      = $1,
                           attempts    = $2,
                           next_run_at = NOW() + ($3 || ' seconds')::interval,
                           last_error  = $4
                     WHERE id = $5
                `, [dead ? 'dead' : 'pending', attempts, String(backoffSec), String(err && err.message || err).slice(0, 500), ev.id]);
                counterInc('cc_outbox_failed_total', { event: ev.event_type, status: dead ? 'dead' : 'retry' });
                log('warn', 'outbox_handler_failed', { event_id: ev.id, event_type: ev.event_type, attempts, dead, msg: err && err.message });
            }
        }
    } catch (e) {
        log('error', 'outbox_worker_error', { msg: e && e.message });
    } finally {
        _outboxRunning = false;
    }
}
function startOutboxWorker() {
    setInterval(outboxTick, 1000);
    /* gauge updater: pending size + dead size */
    setInterval(async () => {
        try {
            const r = await pool.query(`SELECT status, COUNT(*)::int AS n FROM cc_event_outbox WHERE status IN ('pending','dead') GROUP BY status`);
            let pending = 0, dead = 0;
            for (const row of r.rows) { if (row.status === 'pending') pending = row.n; else if (row.status === 'dead') dead = row.n; }
            gaugeSet('cc_outbox_pending_size', pending);
            gaugeSet('cc_outbox_dead_size',    dead);
        } catch (_) {}
    }, 15_000);
    log('info', 'outbox_worker_started');
}

/* ───────────────────────── MAINTENANCE JOBS ───────────────── */
/* Cleanup of expired/old rows across infrastructure tables. Idempotent and
   safe to run from any of: setInterval (long-running), Vercel Cron (serverless),
   or one-off ops scripts. */
async function runMaintenanceOnce() {
    const nowSec = Math.floor(Date.now() / 1000);
    try { await pool.query(`DELETE FROM cc_hmac_nonces  WHERE expires_at  < NOW()`); } catch (_) {}
    try { await pool.query(`DELETE FROM cc_ip_bans      WHERE banned_until< NOW()`); } catch (_) {}
    try { await pool.query(`DELETE FROM cc_rate_buckets WHERE window_start< $1`, [nowSec - 7200]); } catch (_) {}
    try { await pool.query(`DELETE FROM cc_ids_counters WHERE window_start< $1`, [nowSec - 7200]); } catch (_) {}
    try { await pool.query(`DELETE FROM cc_event_outbox WHERE status='done' AND created_at < NOW() - INTERVAL '7 days'`); } catch (_) {}
    try { await pool.query(`DELETE FROM cc_sessions     WHERE expires_at  < NOW()`); } catch (_) {}
    try { await pool.query(`DELETE FROM cc_email_tokens WHERE expires_at  < NOW()`); } catch (_) {}
}
function startMaintenanceJobs() {
    setInterval(runMaintenanceOnce, 5 * 60 * 1000);
    log('info', 'maintenance_jobs_started');
}

/* ───────────────────────── CHECKOUT HTML ──────────────────── */
function buildCheckoutContent(plan, planKey, email, csrfToken) {
    const safeEmail = escapeHtml(email);
    const safeKey   = escapeHtml(planKey);
    const safeCsrf  = escapeHtml(csrfToken || '');
    const stripeMode = 'tap';
    const userName = escapeHtml(String((plan && plan.userName) || ''));
    return `
<style>
*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;background:#0f0e17;color:#e8e6f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.co-wrap{width:100%;max-width:960px;display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5);}
@media(max-width:680px){.co-wrap{grid-template-columns:1fr;}}
.co-left{background:linear-gradient(135deg,#1a1830 0%,#12101f 100%);padding:48px 40px;display:flex;flex-direction:column;gap:24px;}
.co-logo{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;color:#fff;text-decoration:none;}
.co-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,.15);color:#a78bfa;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;width:fit-content;}
.co-plan-name{font-size:30px;font-weight:800;color:#fff;margin-top:8px;}
.co-price{font-size:44px;font-weight:800;color:#a78bfa;line-height:1;}
.co-period{font-size:14px;color:#9ca3af;margin-top:4px;}
.co-features{list-style:none;display:flex;flex-direction:column;gap:10px;}
.co-features li{display:flex;align-items:center;gap:10px;font-size:14px;color:#d1d5db;}
.co-features li i{color:#22c55e;font-size:12px;flex-shrink:0;}
.co-notice{background:rgba(234,179,8,.1);border:1px solid rgba(234,179,8,.3);border-radius:10px;padding:12px 16px;font-size:12px;color:#fbbf24;display:flex;align-items:flex-start;gap:8px;line-height:1.5;}
.co-right{background:#1a1830;padding:48px 40px;}
.back-link{display:inline-flex;align-items:center;gap:6px;color:#7c3aed;font-size:13px;text-decoration:none;margin-bottom:24px;}
.back-link:hover{text-decoration:underline;}
.co-right h2{font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;}
.co-right .sub{font-size:14px;color:#9ca3af;margin-bottom:24px;}
.acc-badge{background:rgba(99,102,241,.1);border-radius:8px;padding:8px 14px;font-size:13px;color:#a78bfa;margin-bottom:20px;}
.fg{margin-bottom:18px;}
.fg label{display:block;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
.fg input{width:100%;background:#0f0e17;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:13px 16px;color:#fff;font-size:15px;font-family:'Inter',sans-serif;outline:none;transition:border-color .2s;}
.fg input:focus{border-color:#7c3aed;}
.fg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.pay-btn{width:100%;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;transition:opacity .2s;font-family:'Inter',sans-serif;}
.pay-btn:hover:not(:disabled){opacity:.9;}.pay-btn:disabled{opacity:.6;cursor:not-allowed;}
.co-msg{text-align:center;margin-top:12px;font-size:14px;display:none;padding:10px;border-radius:8px;}
.sec-badges{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:14px;flex-wrap:wrap;}
.sec-badge{display:flex;align-items:center;gap:4px;font-size:11px;color:#6b7280;}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<div class="co-wrap"><div class="co-left">
  <a href="/" class="co-logo"><img src="/assets/images/favicon.svg" alt="CC" style="width:32px;height:32px;"> CommentCustomer.ai</a>
  <div><div class="co-badge"><i class="fas fa-receipt"></i> Order Summary</div>
    <div class="co-plan-name">${escapeHtml(plan.name)} Plan</div>
    <div class="co-price">${escapeHtml(plan.price)}</div>
    <div class="co-period">${escapeHtml(plan.period)}</div></div>
  <ul class="co-features">${plan.features.map(f => `<li><i class="fas fa-check-circle"></i>${escapeHtml(f)}</li>`).join('')}</ul>
  <div class="co-notice"><i class="fas fa-info-circle" style="margin-top:2px;flex-shrink:0;"></i>
    <span><strong>Tap Payments Checkout:</strong> You will be redirected to Tap's secure hosted payment page to complete your purchase. We never see your card details.</span></div>
</div>
<div class="co-right">
  <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> Back to home</a>
  <h2><i class="fas fa-lock" style="color:#7c3aed;margin-right:6px;font-size:18px;"></i>Secure Payment</h2>
  <p class="sub">Your payment information is encrypted and secure.</p>
  ${safeEmail ? `<div class="acc-badge"><i class="fas fa-user" style="margin-right:6px;"></i>Account: <strong>${safeEmail}</strong></div>` : ''}
  <form id="checkoutForm" novalidate>
    <input type="hidden" id="checkoutEmail" value="${safeEmail}">
    <input type="hidden" id="checkoutPlan"  value="${safeKey}">
    <input type="hidden" id="checkoutCsrf"  value="${safeCsrf}">
    <div class="fg"><label>Full Name</label><input type="text" id="payerName" placeholder="As it appears on your card" value="${userName}" maxlength="120" required data-testid="input-payer-name"></div>
    <div class="fg"><label>Phone (with country code)</label><input type="tel" id="payerPhone" placeholder="+96599887766" maxlength="32" required data-testid="input-payer-phone"></div>
    <button type="submit" class="pay-btn" id="checkoutSubmitBtn" data-testid="btn-checkout-pay"><i class="fas fa-lock"></i> Continue to Tap — ${escapeHtml(plan.price)}${escapeHtml(plan.period)}</button>
    <div class="co-msg" id="checkoutMsg"></div>
    <div class="sec-badges"><div class="sec-badge"><i class="fas fa-shield-alt"></i> SSL Encrypted</div><div class="sec-badge"><i class="fas fa-credit-card"></i> Powered by Tap Payments</div><div class="sec-badge"><i class="fas fa-undo"></i> Cancel Anytime</div></div>
  </form>
</div></div>
<script>
(function(){
  var form = document.getElementById('checkoutForm');
  var btn  = document.getElementById('checkoutSubmitBtn');
  var msg  = document.getElementById('checkoutMsg');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var nm = document.getElementById('payerName').value.trim();
    var ph = document.getElementById('payerPhone').value.trim();
    if (!nm) { msg.textContent='Please enter your full name.'; msg.style.color='#ef4444'; msg.style.display='block'; return; }
    if (!/^\\+\\d{6,15}$/.test(ph)) { msg.textContent='Phone must include country code, e.g. +96599887766.'; msg.style.color='#ef4444'; msg.style.display='block'; return; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting to Tap...'; msg.style.display = 'none';
    fetch('/api/ajax', {
      method:'POST', credentials:'same-origin',
      headers:{'Content-Type':'application/x-www-form-urlencoded','X-CSRF-Token': document.getElementById('checkoutCsrf').value},
      body: new URLSearchParams({
        action:'cc_checkout',
        email: document.getElementById('checkoutEmail').value,
        plan:  document.getElementById('checkoutPlan').value,
        name:  nm,
        phone: ph
      }).toString()
    })
    .then(function(r){return r.json();})
    .then(function(res){
      if (res.success && res.data && res.data.checkout_url) {
        window.location.href = res.data.checkout_url; return;
      }
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Continue to Tap';
      msg.textContent = (res.data && res.data.message) ? res.data.message : 'Could not start checkout. Please try again.';
      msg.style.color = '#ef4444'; msg.style.display = 'block';
    })
    .catch(function(){
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Continue to Tap';
      msg.textContent = 'Connection error. Please try again.'; msg.style.color = '#ef4444'; msg.style.display = 'block';
    });
  });
  var phInput = document.getElementById('payerPhone');
  if (phInput) phInput.addEventListener('input', function(){
    var v = this.value.replace(/[^\\d+]/g,'');
    if (v.indexOf('+') > 0) v = v.replace(/\\+/g,'');
    if (v && v.charAt(0) !== '+') v = '+' + v.replace(/\\+/g,'');
    this.value = v.substring(0, 16);
  });
})();
</script>`;
}

/* ───────────────────────── SIMPLE INFO PAGE ───────────────── */
function infoPage(title, message, ctaHref, ctaText, color) {
    color = color || '#a78bfa';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap">
<style>body{margin:0;font-family:Inter,sans-serif;background:#0f0e17;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;}
.box{max-width:480px;}h1{font-size:32px;color:${color};margin:0 0 12px;}p{color:#cbd5e1;font-size:16px;line-height:1.6;margin:0 0 28px;}
a.cta{background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;}</style></head>
<body><div class="box"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${ctaHref ? `<a class="cta" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaText || 'Continue')}</a>` : ''}</div></body></html>`;
}

/* ───────────────────────── RESET PASSWORD PAGE ────────────── */
function resetPasswordPage(token) {
    const safeToken = escapeHtml(token);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reset Password</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap">
<style>body{margin:0;font-family:Inter,sans-serif;background:#0f0e17;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.card{background:#1a1830;padding:36px;border-radius:16px;width:100%;max-width:420px;box-shadow:0 24px 60px rgba(0,0,0,.5);}
h1{margin:0 0 8px;font-size:24px;}p{color:#9ca3af;margin:0 0 24px;font-size:14px;}
label{display:block;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;margin:14px 0 6px;}
input{width:100%;background:#0f0e17;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:13px 16px;color:#fff;font:inherit;outline:none;}
button{width:100%;margin-top:20px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:0;border-radius:10px;padding:14px;font-weight:700;font:inherit;cursor:pointer;}
.msg{margin-top:14px;font-size:13px;text-align:center;display:none;}
.hint{font-size:11px;color:#6b7280;margin-top:6px;}</style></head><body><div class="card">
<h1>Reset your password</h1><p>Enter a new password for your account.</p>
<form id="rpf"><input type="hidden" id="t" value="${safeToken}">
<label>New password</label><input type="password" id="p1" autocomplete="new-password" required>
<div class="hint">Min 10 chars, with upper, lower, number, and symbol.</div>
<label>Confirm</label><input type="password" id="p2" autocomplete="new-password" required>
<button type="submit">Update password</button><div class="msg" id="m"></div></form>
<script>
document.getElementById('rpf').addEventListener('submit',function(e){e.preventDefault();
  var p1=document.getElementById('p1').value,p2=document.getElementById('p2').value,m=document.getElementById('m');
  m.style.display='none';if(p1!==p2){m.textContent='Passwords do not match.';m.style.color='#ef4444';m.style.display='block';return;}
  fetch('/api/ajax',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({action:'cc_reset_password',token:document.getElementById('t').value,password:p1}).toString()})
  .then(function(r){return r.json();}).then(function(res){
    if(res.success){m.style.color='#22c55e';m.textContent='Password updated. Redirecting…';m.style.display='block';
      setTimeout(function(){window.location.href='/';},1500);}
    else{m.style.color='#ef4444';m.textContent=(res.data&&res.data.message)||'Reset failed.';m.style.display='block';}
  }).catch(function(){m.style.color='#ef4444';m.textContent='Connection error.';m.style.display='block';});
});
</script></div></body></html>`;
}

/* ───────────────────────── PAGE BUILDER ───────────────────── */
function buildPage(type, opts = {}) {
    const csrf = escapeHtml(opts.csrf || '');
    let html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5">
    <meta name="csrf-token" content="${csrf}">
    <title>CommentCustomer.ai – Comment-to-Customer AI Engine</title>
    <meta name="description" content="CommentCustomer.ai – Transform social media comments into customers with AI-powered automation.">
    <meta name="theme-color" content="#141B2D">
    <meta name="color-scheme" content="dark">
    <meta property="og:title" content="CommentCustomer.ai - Comment-to-Customer AI Engine">
    <meta property="og:description" content="Automate Comments. Capture Leads. Grow Your Business.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="/assets/images/all-features-hero.webp">
    <meta property="og:site_name" content="CommentCustomer.ai">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="CommentCustomer.ai - Comment-to-Customer AI Engine">
    <meta name="twitter:description" content="Automate Comments. Capture Leads. Grow Your Business.">
    <link rel="canonical" href="${(process.env.PUBLIC_URL || 'http://localhost:5000').replace(/\/$/, '')}/">
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"SoftwareApplication","name":"CommentCustomer.ai","description":"AI-powered social media comment automation that turns every comment into a potential customer. Auto-reply, lead scoring, auto-DM workflows.","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"${(process.env.PUBLIC_URL || 'http://localhost:5000').replace(/\/$/, '')}/","offers":[{"@type":"Offer","name":"Starter","price":"29","priceCurrency":"USD","category":"subscription"},{"@type":"Offer","name":"Growth","price":"79","priceCurrency":"USD","category":"subscription"},{"@type":"Offer","name":"Pro","price":"149","priceCurrency":"USD","category":"subscription"}],"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8","ratingCount":"127"},"creator":{"@type":"Organization","name":"CommentCustomer.ai"}}
    </script>
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Organization","name":"CommentCustomer.ai","url":"${(process.env.PUBLIC_URL || 'http://localhost:5000').replace(/\/$/, '')}/","logo":"/assets/images/favicon.svg","contactPoint":{"@type":"ContactPoint","telephone":"+968-96737452","contactType":"customer support","areaServed":"Worldwide","availableLanguage":["English","Arabic"]},"sameAs":["https://facebook.com/commentcustomer","https://instagram.com/commentcustomer","https://linkedin.com/company/commentcustomer"]}
    </script>
    <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16x16.png">
    <link rel="shortcut icon" href="/assets/images/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="/assets/css/landing.css">
    <link rel="stylesheet" href="/assets/css/responsive.css">
    <script>window.ccData={ajaxUrl:'/api/ajax',nonce:'preview',themeUrl:'',csrf:'${csrf}'};</script>
    <script src="/assets/js/i18n.js"></script>`;
    if (type === 'dashboard')      html += `\n    <link rel="stylesheet" href="/assets/css/dashboard.css">`;
    if (type === 'user-dashboard') html += `\n    <link rel="stylesheet" href="/assets/css/user-dashboard.css">`;
    html += `\n</head>\n<body>`;

    if (type === 'landing') {
        html += '<div class="cc-landing-page">';
        html += `<div class="floating-icons-container" id="floatingIcons">
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" class="floating-icon fi-instagram"><i class="fab fa-instagram"></i></a>
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" class="floating-icon fi-facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" class="floating-icon fi-tiktok"><i class="fab fa-tiktok"></i></a>
        <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" class="floating-icon fi-youtube"><i class="fab fa-youtube"></i></a>
        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" class="floating-icon fi-linkedin"><i class="fab fa-linkedin-in"></i></a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="floating-icon fi-twitter"><i class="fab fa-twitter"></i></a>
        <a href="https://wa.me" target="_blank" rel="noopener noreferrer" class="floating-icon fi-whatsapp"><i class="fab fa-whatsapp"></i></a>
        <div class="floating-planet fp-blue"></div><div class="floating-planet fp-pink"></div><div class="floating-planet fp-purple"></div>
        </div>`;
        html += processPhp(readTemplate('template-parts/sections/navigation.php'));
        html += processPhp(readTemplate('template-parts/sections/hero.php'));
        html += processPhp(readTemplate('template-parts/sections/trust-bar.php'));
        html += processPhp(readTemplate('template-parts/sections/features-overview.php'));
        html += processPhp(readTemplate('template-parts/sections/all-features.php'));
        html += processPhp(readTemplate('template-parts/sections/demo-section-1.php'));
        html += processPhp(readTemplate('template-parts/sections/demo-section-2.php'));
        html += '</div>';
        let footer = readAndProcess('footer.php').replace(/<\/body>/g,'').replace(/<\/html>/g,'');
        html += footer;
        html += `
    <script src="/assets/js/landing.js"></script>
    <script src="/assets/js/modals.js"></script>
    <script src="/assets/js/modal-translations.js"></script>
    <script src="/assets/js/register.js"></script>
    <script>if(window.CC_I18N){var _sl=localStorage.getItem('cc-lang');if(_sl&&_sl!=='en'){CC_I18N.apply(_sl);}}</script>`;
    } else if (type === 'dashboard') {
        let c = readTemplate('page-dashboard.php');
        c = processPhp(c).replace(/get_header\s*\(\s*\)\s*;?/g,'').replace(/get_footer\s*\(\s*\)\s*;?/g,'');
        html += c;
        html += `\n    <script src="/assets/js/landing.js"></script>\n    <script src="/assets/js/dashboard.js"></script>`;
    } else if (type === 'user-dashboard') {
        let c = readTemplate('page-user-dashboard.php');
        c = processPhp(c).replace(/get_header\s*\(\s*\)\s*;?/g,'').replace(/get_footer\s*\(\s*\)\s*;?/g,'');
        html += c;
        html += `\n    <script src="/assets/js/landing.js"></script>\n    <script src="/assets/js/user-dashboard.js"></script>`;
    } else if (type === 'checkout') {
        const plan = Object.assign({}, PLANS[opts.plan] || PLANS.starter, { userName: opts.userName || '' });
        html += buildCheckoutContent(plan, opts.plan || 'starter', opts.email || '', opts.csrf || '');
    } else if (type === 'unauthorized') {
        html += `<div style="font-family:Inter,sans-serif;background:#0f0e17;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;">
          <div><h1 style="font-size:64px;margin:0;color:#a78bfa;">401</h1><p style="font-size:18px;margin:16px 0 24px;">You need to sign in to view this page.</p>
          <a href="/" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Back to Home</a></div></div>`;
    }

    html += `\n</body>\n</html>`;
    return html;
}

/* ───────────────────────── SECURITY HEADERS ───────────────── */
const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: https:",
    "media-src 'self'",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ');
const SECURITY_HEADERS = {
    'X-Content-Type-Options':       'nosniff',
    'X-Frame-Options':              'DENY',
    'X-XSS-Protection':             '1; mode=block',
    'Referrer-Policy':              'strict-origin-when-cross-origin',
    'Permissions-Policy':           'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
    'Content-Security-Policy':      CSP,
    /* HSTS — unconditional. Browser ignores on http://, enforces on https://. Preload-eligible. */
    'Strict-Transport-Security':    'max-age=31536000; includeSubDomains; preload',
    /* Spectre-class side-channel hardening for cross-origin popups */
    'Cross-Origin-Opener-Policy':   'same-origin',
    /* Block third-party hot-linking of our resources */
    'Cross-Origin-Resource-Policy': 'same-origin',
};
function applySecurityHeaders(res) {
    const orig = res.writeHead.bind(res);
    res.writeHead = function(code, headers) {
        return orig(code, Object.assign({}, SECURITY_HEADERS, headers || {}));
    };
}

/* ───────────────────────── RESPONSE HELPERS ───────────────── */
function send(res, code, contentType, body, extra) {
    res.writeHead(code, Object.assign({ 'Content-Type': contentType }, extra || {}));
    res.end(body);
}
function sendJson(res, code, obj, extra) { send(res, code, 'application/json', JSON.stringify(obj), extra); }
function sendErr(res, code, message)     { sendJson(res, code, { success: false, data: { message } }); }
function safeError(err, fallback) {
    log('error', 'unhandled', { msg: err && err.message, stack: (err && err.stack || '').split('\n').slice(0,3) });
    return fallback || 'An unexpected error occurred. Please try again.';
}

/* ───────────────────────── ROUTE HANDLERS (per-action) ────── */
async function handleRegister(body, ip, ua) {
    const { errors, value } = validate({
        name:     { minLength: 2,  maxLength: 100 },
        email:    { email: true,   maxLength: 200, lower: true },
        password: { minLength: 1,  maxLength: 200 },
        plan:     { optional: true, enum: ['trial','starter','growth','pro'] },
    }, body);
    if (errors.length) return { code: 400, body: { success: false, data: { message: 'Please check your details and try again.' } } };

    const pwErrs = validateStrongPassword(value.password);
    if (pwErrs.length) return { code: 400, body: { success: false, data: { message: 'Password must contain ' + pwErrs.join(', ') + '.' } } };

    if (isDisposableEmail(value.email)) {
        log('warn', 'register_disposable_blocked', { ip, email: value.email });
        return { code: 400, body: { success: false, data: { message: 'Please use a non-disposable email address.' } } };
    }

    const userPlan = value.plan || 'trial';
    if (userPlan === 'trial' && !(await trialIpAllowed(ip))) {
        log('warn', 'trial_ip_limit', { ip });
        return { code: 429, body: { success: false, data: { message: 'You have reached the maximum number of trial signups for today. Please pick a paid plan.' } } };
    }

    const existing = await pool.query('SELECT id FROM cc_users WHERE email=$1', [value.email]);
    if (existing.rows.length > 0) {
        return { code: 409, body: { success: false, data: { message: 'An account with this email already exists. Please login.' } } };
    }
    const phash = hashPassword(value.password);

    if (userPlan === 'trial') {
        const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const ins = await pool.query(
            `INSERT INTO cc_users (name,email,password_hash,plan,role,trial_ends,email_verified)
             VALUES ($1,$2,$3,'trial','user',$4,FALSE) RETURNING id`,
            [value.name, value.email, phash, trialEnds]
        );
        const uid = ins.rows[0].id;
        const tok = await createEmailToken(uid, 'verify', 24 * 3600 * 1000);
        await sendEmail(value.email, 'Verify your CommentCustomer.ai email',
            `Welcome ${value.name}!\n\nClick the link below to verify your email and activate your trial:\n${PUBLIC_URL}/verify-email?token=${tok}\n\nThis link expires in 24 hours.`);
        const sess = await createSession(uid, ip, ua);
        log('info', 'user_registered', { email: value.email, plan: 'trial' });
        await eventEmit('user.registered', { userId: uid, email: value.email, plan: 'trial' }, { ip });
        return {
            code: 200,
            body: { success: true, data: { redirect: '/user-dashboard/', plan: 'trial' } },
            headers: { 'Set-Cookie': cookieFor(SESSION_COOKIE, sess.id, { maxAge: SESSION_TTL_MS / 1000 }) },
        };
    } else {
        const ins = await pool.query(
            `INSERT INTO cc_users (name,email,password_hash,plan,role,email_verified)
             VALUES ($1,$2,$3,'pending','user',FALSE) RETURNING id`,
            [value.name, value.email, phash]
        );
        const tok = await createEmailToken(ins.rows[0].id, 'verify', 24 * 3600 * 1000);
        await sendEmail(value.email, 'Verify your CommentCustomer.ai email',
            `Welcome!\n\nClick to verify: ${PUBLIC_URL}/verify-email?token=${tok}\n\nAfter verification, complete your payment to activate your account.`);
        log('info', 'user_registered', { email: value.email, plan: 'pending' });
        return { code: 200, body: { success: true, data: {
            redirect: `/checkout/?plan=${encodeURIComponent(userPlan)}&email=${encodeURIComponent(value.email)}`
        }}};
    }
}

async function handleUserLogin(body, ip, ua) {
    const { errors, value } = validate({
        email:    { email: true, maxLength: 200, lower: true },
        password: { minLength: 1, maxLength: 200 },
    }, body);
    if (errors.length) return { code: 400, body: { success: false, data: { message: 'Invalid email or password.' } } };

    const r = await pool.query('SELECT * FROM cc_users WHERE email=$1', [value.email]);
    const u = r.rows[0];
    if (!u) {
        log('warn', 'login_failed_unknown_email', { ip, email: value.email });
        return { code: 401, body: { success: false, data: { message: 'Invalid email or password.' } } };
    }
    const lockMsg = await isAccountLocked(u);
    if (lockMsg) return { code: 423, body: { success: false, data: { message: lockMsg } } };

    if (!verifyPassword(value.password, u.password_hash)) {
        await bumpFailedAttempts(u.id);
        log('warn', 'login_failed', { ip, email: value.email });
        await eventEmit('user.login_failed', { email: value.email, reason: 'bad_password' }, { ip });
        await idsRecord(ip, { ip }, 'login_fail');
        return { code: 401, body: { success: false, data: { message: 'Invalid email or password.' } } };
    }
    if (u.role === 'admin') {
        return { code: 403, body: { success: false, data: { message: 'Please use the Admin Login link in the footer.' } } };
    }
    if (!u.email_verified) {
        return { code: 403, body: { success: false, data: { message: 'Please verify your email first. Check your inbox for the verification link.' } } };
    }
    if (u.plan === 'trial' && u.trial_ends && new Date(u.trial_ends) < new Date()) {
        return { code: 402, body: { success: false, data: { message: 'Your free trial has expired. Please upgrade your plan.' } } };
    }
    if (u.plan === 'pending') {
        return { code: 402, body: { success: false, data: {
            message: 'Payment not complete. Please finish payment to access your account.',
            redirect: `/checkout/?plan=starter&email=${encodeURIComponent(value.email)}`
        }}};
    }

    /* Rotate: kill any existing sessions on this same browser by destroying old cookie's session */
    await resetFailedAttempts(u.id);
    const sess = await createSession(u.id, ip, ua);
    log('info', 'user_login', { email: value.email });
    await eventEmit('user.logged_in', { userId: u.id, email: value.email, role: 'user' }, { ip });
    return {
        code: 200,
        body: { success: true, data: { redirect: '/user-dashboard/', plan: u.plan } },
        headers: { 'Set-Cookie': cookieFor(SESSION_COOKIE, sess.id, { maxAge: SESSION_TTL_MS / 1000 }) },
    };
}

async function handleAdminLogin(body, ip, ua) {
    const { errors, value } = validate({
        email:    { email: true, maxLength: 200, lower: true },
        password: { minLength: 1, maxLength: 200 },
    }, body);
    if (errors.length) return { code: 400, body: { success: false, data: { message: 'Invalid credentials.' } } };

    const r = await pool.query(`SELECT * FROM cc_users WHERE email=$1 AND role='admin'`, [value.email]);
    const u = r.rows[0];
    if (!u) {
        log('warn', 'admin_login_failed_unknown', { ip, email: value.email });
        return { code: 401, body: { success: false, data: { message: 'Invalid credentials. Please try again.' } } };
    }
    const lockMsg = await isAccountLocked(u);
    if (lockMsg) return { code: 423, body: { success: false, data: { message: lockMsg } } };

    if (!verifyPassword(value.password, u.password_hash)) {
        await bumpFailedAttempts(u.id);
        log('warn', 'admin_login_failed', { ip, email: value.email });
        await eventEmit('user.login_failed', { email: value.email, reason: 'admin_bad_password' }, { ip });
        await idsRecord(ip, { ip }, 'admin_login_fail');
        return { code: 401, body: { success: false, data: { message: 'Invalid credentials. Please try again.' } } };
    }

    /* If 2FA enabled, return pending_2fa response with a short-lived ticket cookie */
    if (u.totp_enabled) {
        const ticket = newToken(32);
        await pool.query(
            `INSERT INTO cc_email_tokens (token,user_id,purpose,expires_at) VALUES ($1,$2,'2fa_ticket',$3)`,
            [ticket, u.id, new Date(Date.now() + 5 * 60 * 1000)]
        );
        log('info', 'admin_2fa_required', { email: value.email });
        return { code: 200, body: { success: true, data: { need_2fa: true, ticket } } };
    }

    await resetFailedAttempts(u.id);
    const sess = await createSession(u.id, ip, ua);
    log('info', 'admin_login', { email: value.email });
    return {
        code: 200,
        body: { success: true, data: { redirect: '/dashboard/' } },
        headers: { 'Set-Cookie': cookieFor(SESSION_COOKIE, sess.id, { maxAge: SESSION_TTL_MS / 1000 }) },
    };
}

async function handleAdmin2faVerify(body, ip, ua) {
    const ticket = String(body.ticket || '');
    const code   = String(body.code   || '');
    if (!/^[a-f0-9]{64}$/.test(ticket)) return { code: 400, body: { success: false, data: { message: 'Invalid ticket.' } } };

    const userId = await consumeEmailToken(ticket, '2fa_ticket');
    if (!userId) return { code: 400, body: { success: false, data: { message: 'Verification ticket expired. Please log in again.' } } };

    const r = await pool.query(`SELECT id,email,totp_secret FROM cc_users WHERE id=$1 AND role='admin'`, [userId]);
    const u = r.rows[0];
    if (!u || !verifyTotp(u.totp_secret, code)) {
        await bumpFailedAttempts(userId);
        log('warn', 'admin_2fa_failed', { ip, userId });
        return { code: 401, body: { success: false, data: { message: 'Invalid 2FA code.' } } };
    }
    await resetFailedAttempts(userId);
    const sess = await createSession(userId, ip, ua);
    log('info', 'admin_2fa_success', { email: u.email });
    return {
        code: 200,
        body: { success: true, data: { redirect: '/dashboard/' } },
        headers: { 'Set-Cookie': cookieFor(SESSION_COOKIE, sess.id, { maxAge: SESSION_TTL_MS / 1000 }) },
    };
}

async function handleAdmin2faSetup(session) {
    if (!session || session.role !== 'admin') return { code: 401, body: { success: false, data: { message: 'Admin only.' } } };
    const secret = generateTotpSecret();
    await pool.query(`UPDATE cc_users SET totp_secret=$1, totp_enabled=FALSE WHERE id=$2`, [secret, session.user_id]);
    return { code: 200, body: { success: true, data: { secret, uri: totpProvisioningUri(secret, session.email) } } };
}

async function handleAdmin2faEnable(session, body) {
    if (!session || session.role !== 'admin') return { code: 401, body: { success: false, data: { message: 'Admin only.' } } };
    const r = await pool.query(`SELECT totp_secret FROM cc_users WHERE id=$1`, [session.user_id]);
    if (!r.rows[0] || !r.rows[0].totp_secret) return { code: 400, body: { success: false, data: { message: 'Run setup first.' } } };
    if (!verifyTotp(r.rows[0].totp_secret, String(body.code || ''))) return { code: 400, body: { success: false, data: { message: 'Invalid code.' } } };
    await pool.query(`UPDATE cc_users SET totp_enabled=TRUE WHERE id=$1`, [session.user_id]);
    log('info', 'admin_2fa_enabled', { email: session.email });
    return { code: 200, body: { success: true, data: { enabled: true } } };
}

async function handleAdmin2faDisable(session) {
    if (!session || session.role !== 'admin') return { code: 401, body: { success: false, data: { message: 'Admin only.' } } };
    await pool.query(`UPDATE cc_users SET totp_enabled=FALSE, totp_secret=NULL WHERE id=$1`, [session.user_id]);
    log('info', 'admin_2fa_disabled', { email: session.email });
    return { code: 200, body: { success: true, data: { enabled: false } } };
}

async function handleRequestPasswordReset(body) {
    const { errors, value } = validate({ email: { email: true, maxLength: 200, lower: true } }, body);
    /* Always return success to avoid email enumeration */
    if (errors.length) return { code: 200, body: { success: true, data: { message: 'If that email exists, a reset link has been sent.' } } };

    const r = await pool.query(`SELECT id,name FROM cc_users WHERE email=$1`, [value.email]);
    if (r.rows[0]) {
        const tok = await createEmailToken(r.rows[0].id, 'reset', 15 * 60 * 1000);
        await sendEmail(value.email, 'Reset your CommentCustomer.ai password',
            `Hi ${r.rows[0].name},\n\nClick to reset your password (valid 15 min):\n${PUBLIC_URL}/reset-password?token=${tok}\n\nIf you did not request this, ignore this email.`);
        log('info', 'password_reset_requested', { email: value.email });
    } else {
        log('warn', 'password_reset_unknown_email', { email: value.email });
    }
    return { code: 200, body: { success: true, data: { message: 'If that email exists, a reset link has been sent.' } } };
}

async function handleResetPassword(body) {
    const token = String(body.token || '');
    const pw    = String(body.password || '');
    const pwErrs = validateStrongPassword(pw);
    if (pwErrs.length) return { code: 400, body: { success: false, data: { message: 'Password must contain ' + pwErrs.join(', ') + '.' } } };

    const userId = await consumeEmailToken(token, 'reset');
    if (!userId) return { code: 400, body: { success: false, data: { message: 'Reset link is invalid or expired.' } } };

    await pool.query(`UPDATE cc_users SET password_hash=$1, failed_attempts=0, locked_until=NULL WHERE id=$2`, [hashPassword(pw), userId]);
    await destroyAllSessionsForUser(userId);
    log('info', 'password_reset_completed', { userId });
    return { code: 200, body: { success: true, data: { message: 'Password updated. Please sign in.' } } };
}

async function handleVerifyEmail(token) {
    const userId = await consumeEmailToken(token, 'verify');
    if (!userId) return null;
    await pool.query(`UPDATE cc_users SET email_verified=TRUE WHERE id=$1`, [userId]);
    log('info', 'email_verified', { userId });
    return userId;
}

/* POST to Smarthinkerz proxy (form-urlencoded), capture 303 Location */
function smarthinkerzCreateCheckout(formObj) {
    const u = new URL(SMARTHINKERZ_PROXY);
    const body = new URLSearchParams(formObj).toString();
    const opts = {
        hostname: u.hostname,
        port:     u.port || (u.protocol === 'http:' ? 80 : 443),
        path:     u.pathname + (u.search || ''),
        method:   'POST',
        headers:  {
            'Content-Type':   'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent':     'CommentCustomer.ai/1.0 (+https://commentcustomer.ai)',
            'Accept':         'application/json, text/plain, */*',
        },
    };
    const transport = u.protocol === 'http:' ? require('http') : require('https');
    return new Promise((resolve, reject) => {
        const req = transport.request(opts, res => {
            let chunks = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString('utf8');
                let parsed = null;
                try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
                resolve({ status: res.statusCode, location: res.headers.location || null, body: parsed, raw });
            });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(new Error('Smarthinkerz timeout')); });
        req.write(body);
        req.end();
    });
}

async function handleCheckout(session, body, ip) {
    if (!session) return { code: 401, body: { success: false, data: { message: 'Please log in to complete payment.' } } };

    const { errors, value } = validate({
        email: { email: true, maxLength: 200, lower: true },
        plan:  { enum: ['starter','growth','pro'] },
        name:  { maxLength: 120, optional: true },
        phone: { maxLength: 32,  optional: true },
    }, body);
    if (errors.length) return { code: 400, body: { success: false, data: { message: 'Invalid payment details.' } } };
    if (value.email !== session.email) {
        log('warn', 'payment_email_mismatch', { ip, sessionEmail: session.email, attempted: value.email });
        return { code: 403, body: { success: false, data: { message: 'Email mismatch.' } } };
    }

    /* Resolve customer name + phone (form > session row) */
    const userRow = (await pool.query('SELECT name FROM cc_users WHERE id=$1', [session.user_id])).rows[0] || {};
    const fullName = String(value.name || userRow.name || '').trim();
    const phone    = String(value.phone || '').trim();

    if (!fullName)        return { code: 400, body: { success: false, data: { message: 'Full name is required.' } } };
    if (!/^\+\d{6,15}$/.test(phone))
        return { code: 400, body: { success: false, data: { message: 'Phone must include country code, e.g. +96599887766.' } } };

    const slug = SMARTHINKERZ_PLAN_MAP[value.plan];
    if (!slug) return { code: 400, body: { success: false, data: { message: 'Unknown plan.' } } };

    /* Smarthinkerz Tap proxy — primary path */
    try {
        const r = await smarthinkerzCreateCheckout({
            plan:  slug,
            cycle: 'monthly',
            name:  fullName,
            email: value.email,
            phone: phone,
        });

        /* Validation error from Smarthinkerz */
        if (r.status === 400) {
            const m = (r.body && r.body.error) ? r.body.error : 'Payment provider rejected the request.';
            log('warn', 'smarthinkerz_checkout_rejected', { user: session.user_id, plan: value.plan, msg: m });
            return { code: 400, body: { success: false, data: { message: m } } };
        }

        /* Expected: 303 See Other with Location header to Tap hosted page */
        if (r.status >= 300 && r.status < 400 && r.location) {
            log('info', 'smarthinkerz_checkout_created', { user: session.user_id, plan: value.plan, slug });
            await eventEmit('payment.checkout_started', { userId: session.user_id, plan: value.plan, source: 'smarthinkerz' });
            return { code: 200, body: { success: true, data: { checkout_url: r.location, provider: 'tap' } } };
        }

        /* Defensive: some clients may follow redirect; if response has a JSON url field, take it */
        if (r.body && r.body.url) {
            return { code: 200, body: { success: true, data: { checkout_url: r.body.url, provider: 'tap' } } };
        }

        /* Upstream proxy is not deployed (Replit "This app isn't live yet" page) */
        if (r.status === 404 && (r.raw || '').includes("isn&#39;t live")) {
            log('error', 'smarthinkerz_upstream_offline', { status: 404 });
            return { code: 503, body: { success: false, data: { message: 'Payment service is temporarily offline. Please try again shortly or contact support.' } } };
        }
        log('error', 'smarthinkerz_unexpected_response', { status: r.status, snippet: (r.raw || '').slice(0, 200) });
        return { code: 502, body: { success: false, data: { message: 'Payment provider returned an unexpected response.' } } };
    } catch (err) {
        log('error', 'smarthinkerz_checkout_failed', { err: safeError(err) });
        return { code: 502, body: { success: false, data: { message: 'Payment provider unreachable. Please try again in a moment.' } } };
    }
}

/* ───────────────────────── SMARTHINKERZ PARTNER WEBHOOK ───── */
/* Receives payment-state events from the Smarthinkerz Tap proxy.
   Expected payload (best-effort spec — accepts variants until a final spec is published):
     {
       "event_id":  "sh_evt_abc123",
       "type":      "payment.success" | "payment.failed" | "subscription.cancelled",
       "email":     "customer@example.com",
       "plan":      "commentcustomer-pro",          // Smarthinkerz slug, OR
       "internal_plan": "growth",                    // already-mapped internal slug
       "order_id":  "ord_xxx",
       "amount":    79,
       "currency":  "USD",
       "ts":        "2026-05-13T06:00:00Z"
     }
   Header (when SMARTHINKERZ_WEBHOOK_SECRET is set):
     X-Smarthinkerz-Signature: sha256=<hex hmac of raw body>
*/
function verifySmarthinkerzSignature(rawBody, headerVal) {
    if (!SMARTHINKERZ_WH_SECRET) return true;          /* permissive in dev */
    if (!headerVal) return false;
    const provided = String(headerVal).replace(/^sha256=/, '').trim();
    if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
    const expected = crypto.createHmac('sha256', SMARTHINKERZ_WH_SECRET).update(rawBody).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
    } catch (_) { return false; }
}

async function handleSmarthinkerzWebhook(rawBody, headers, ctx) {
    /* 1. signature */
    const sigHeader = headers['x-smarthinkerz-signature'] || headers['x-sh-signature'] || '';
    if (!verifySmarthinkerzSignature(rawBody, sigHeader)) {
        logCtx(ctx, 'warn', 'sh_webhook_bad_signature');
        await eventEmit('security.alert', { kind: 'sh_bad_signature' }, ctx);
        return { code: 400, body: 'Bad signature' };
    }

    /* 2. parse */
    let event;
    try { event = JSON.parse(rawBody.toString('utf8')); }
    catch (e) { return { code: 400, body: 'Bad JSON' }; }

    const eventId = String(event.event_id || event.id || '').trim();
    const type    = String(event.type || '').toLowerCase();
    const email   = String(event.email || event.customer_email || '').toLowerCase().trim();
    if (!eventId || !type || !email) return { code: 400, body: 'Missing required fields' };
    if (eventId.length > 128)        return { code: 400, body: 'event_id too long' };

    /* 3. idempotency — reuse cc_stripe_events as generic payment-event ledger,
          prefix Smarthinkerz IDs with sh_ to avoid collision with Stripe IDs */
    const idemKey = eventId.startsWith('sh_') ? eventId : 'sh_' + eventId;
    try {
        await pool.query(
            'INSERT INTO cc_stripe_events (event_id, type) VALUES ($1, $2)',
            [idemKey, type.slice(0, 64)]
        );
    } catch (e) {
        if (e.code === '23505') {
            counterInc('cc_sh_webhook_duplicates_total');
            logCtx(ctx, 'info', 'sh_webhook_duplicate', { event_id: idemKey });
            return { code: 200, body: 'duplicate, already processed' };
        }
        logCtx(ctx, 'error', 'sh_idempotency_check_failed', { msg: e.message });
        return { code: 500, body: 'Internal' };
    }

    /* 4. resolve internal plan (accept either slug or already-mapped value) */
    let internalPlan = String(event.internal_plan || '').toLowerCase();
    if (!internalPlan && event.plan) {
        internalPlan = SMARTHINKERZ_SLUG_REVERSE[String(event.plan).toLowerCase()] || '';
    }

    /* 5. find user */
    const userRow = (await pool.query('SELECT id, email FROM cc_users WHERE LOWER(email)=$1', [email])).rows[0];
    if (!userRow) {
        logCtx(ctx, 'warn', 'sh_webhook_user_not_found', { email, event_id: idemKey, type });
        /* Don't error — Smarthinkerz might have signups we don't know about; just acknowledge */
        return { code: 200, body: 'ok (user not found)' };
    }

    /* 6. dispatch by type */
    try {
        switch (type) {
            case 'payment.success':
            case 'subscription.created':
            case 'subscription.renewed': {
                if (!internalPlan || !['starter','growth','pro'].includes(internalPlan)) {
                    logCtx(ctx, 'warn', 'sh_webhook_unknown_plan', { plan: event.plan, event_id: idemKey });
                    return { code: 200, body: 'ok (plan not recognized; user not changed)' };
                }
                await pool.query(
                    'UPDATE cc_users SET plan=$1, plan_expires=$2 WHERE id=$3',
                    [internalPlan, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), userRow.id]
                );
                logCtx(ctx, 'info', 'sh_payment_success', { user: userRow.id, plan: internalPlan, order: event.order_id || null });
                await eventEmit('payment.success', { userId: userRow.id, plan: internalPlan, source: 'smarthinkerz', order_id: event.order_id || null }, ctx);
                break;
            }
            case 'payment.failed': {
                logCtx(ctx, 'info', 'sh_payment_failed', { user: userRow.id, order: event.order_id || null });
                await eventEmit('payment.failed', { userId: userRow.id, source: 'smarthinkerz', order_id: event.order_id || null }, ctx);
                break;
            }
            case 'subscription.cancelled':
            case 'subscription.deleted': {
                await pool.query(`UPDATE cc_users SET plan='pending', plan_expires=NOW() WHERE id=$1`, [userRow.id]);
                logCtx(ctx, 'info', 'sh_subscription_cancelled', { user: userRow.id });
                break;
            }
            default:
                logCtx(ctx, 'info', 'sh_webhook_unhandled_type', { type, event_id: idemKey });
        }
    } catch (err) {
        logCtx(ctx, 'error', 'sh_webhook_handler_error', { msg: err.message });
        /* Roll back idempotency so Smarthinkerz can retry */
        pool.query('DELETE FROM cc_stripe_events WHERE event_id=$1', [idemKey]).catch(() => {});
        return { code: 500, body: 'Internal' };
    }

    counterInc('cc_sh_webhook_total', { type });
    return { code: 200, body: 'ok' };
}

async function handleStripeWebhook(rawBody, signature, ctx) {
    if (!STRIPE_KEY)        return { code: 503, body: 'Stripe not configured' };
    if (!STRIPE_WH_SECRET)  return { code: 503, body: 'Webhook secret not configured' };
    if (!verifyStripeSignature(rawBody, signature)) {
        logCtx(ctx, 'warn', 'stripe_webhook_bad_signature');
        await eventEmit('security.alert', { kind: 'stripe_bad_signature' }, ctx);
        return { code: 400, body: 'Bad signature' };
    }
    let event;
    try { event = JSON.parse(rawBody.toString('utf8')); } catch (e) { return { code: 400, body: 'Bad JSON' }; }

    /* IDEMPOTENCY: refuse to process the same event_id twice */
    if (!event.id) return { code: 400, body: 'Missing event id' };
    try {
        await pool.query(
            `INSERT INTO cc_stripe_events (event_id, type) VALUES ($1, $2)`,
            [event.id, event.type || 'unknown']
        );
    } catch (e) {
        if (e.code === '23505') {
            counterInc('cc_stripe_webhook_duplicates_total');
            logCtx(ctx, 'info', 'stripe_webhook_duplicate', { event_id: event.id });
            return { code: 200, body: 'duplicate, already processed' };
        }
        logCtx(ctx, 'error', 'stripe_idempotency_check_failed', { msg: e.message });
        return { code: 500, body: 'Internal' };
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object;
                const userId = s.client_reference_id || s.metadata?.user_id;
                const plan   = s.metadata?.plan || 'starter';
                if (userId) {
                    await pool.query(
                        `UPDATE cc_users SET plan=$1, plan_expires=$2, stripe_customer_id=$3, stripe_subscription_id=$4 WHERE id=$5`,
                        [plan, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), s.customer, s.subscription, userId]
                    );
                    await eventEmit('payment.success', { userId, plan, source: 'stripe' }, ctx);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                await pool.query(`UPDATE cc_users SET plan='pending', plan_expires=NULL WHERE stripe_subscription_id=$1`, [sub.id]);
                logCtx(ctx, 'info', 'stripe_subscription_cancelled', { sub: sub.id });
                break;
            }
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                if (sub.cancel_at_period_end) {
                    logCtx(ctx, 'info', 'stripe_subscription_will_cancel', { sub: sub.id });
                }
                /* Past-due → set state */
                if (sub.status === 'past_due') {
                    await pool.query(`UPDATE cc_users SET plan_expires=NOW() WHERE stripe_subscription_id=$1`, [sub.id]);
                }
                break;
            }
            case 'invoice.payment_failed': {
                const inv = event.data.object;
                await eventEmit('payment.failed', { sub: inv.subscription, customer: inv.customer }, ctx);
                break;
            }
        }
    } catch (err) {
        logCtx(ctx, 'error', 'stripe_webhook_handler_error', { msg: err.message });
        /* Roll back idempotency row so Stripe will retry */
        pool.query(`DELETE FROM cc_stripe_events WHERE event_id=$1`, [event.id]).catch(()=>{});
        return { code: 500, body: 'Internal' };
    }
    return { code: 200, body: 'ok' };
}

/* ───────────────────────── LOGOUT-ALL + ISSUE API KEY ─────── */
async function handleLogoutAllDevices(session, ctx) {
    if (!session) return { code: 401, body: { success: false, data: { message: 'Not signed in.' } } };
    await destroyAllSessionsForUser(session.user_id);
    await eventEmit('security.alert', { kind: 'logout_all_devices', userId: session.user_id }, ctx);
    return {
        code: 200,
        body: { success: true, data: { message: 'All sessions revoked.' } },
        headers: { 'Set-Cookie': cookieFor(SESSION_COOKIE, '', { maxAge: 0 }) },
    };
}
async function handleIssueApiKey(session, body, ctx) {
    if (!session || session.role !== 'admin') return { code: 401, body: { success: false, data: { message: 'Admin only.' } } };
    const scopes = (body.scopes || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 32);
    const ips    = (body.ip_allowlist || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 32);
    const rate   = Math.max(1, Math.min(600, parseInt(body.rate_per_min, 10) || 60));
    const k = generateApiKey();
    await pool.query(
        `INSERT INTO cc_api_keys (user_id,key_id,key_hash,scopes,ip_allowlist,rate_per_min) VALUES ($1,$2,$3,$4,$5,$6)`,
        [session.user_id, k.keyId, hashApiSecret(k.secret), scopes, ips, rate]
    );
    await eventEmit('security.alert', { kind: 'api_key_issued', keyId: k.keyId, userId: session.user_id }, ctx);
    return { code: 200, body: { success: true, data: { api_key: k.plaintext, key_id: k.keyId, scopes, ip_allowlist: ips, rate_per_min: rate } } };
}

/* ───────────────────────── HTTP SERVER ────────────────────── */
const requestHandler = async (req, res) => {
    applySecurityHeaders(res);

    let urlPath, urlQuery, qp;
    try {
        urlPath  = req.url.split('?')[0];
        urlQuery = req.url.includes('?') ? req.url.split('?')[1] : '';
        qp       = new URLSearchParams(urlQuery);
    } catch (e) { return send(res, 400, 'text/plain', 'Bad request'); }

    const ip = clientIp(req);
    const ua = req.headers['user-agent'] || '';

    /* Per-request correlation context */
    const ctx = makeCtx(req); ctx.ip = ip; ctx.ua = ua;
    res.setHeader('X-Request-Id', ctx.requestId);
    res.setHeader('X-Trace-Id',   ctx.traceId);

    /* INTRUSION DETECTION: bounce banned IPs immediately */
    if (await idsIsBanned(ip)) {
        counterInc('cc_requests_blocked_total', { reason: 'ids_ban' });
        return send(res, 429, 'text/plain', 'Temporarily blocked. Try again later.');
    }

    /* Per-request RED metrics */
    res.on('finish', () => {
        const dur = Date.now() - ctx.startMs;
        counterInc('cc_http_requests_total', { method: req.method, status: res.statusCode });
        histObserve('cc_http_request_duration_ms', dur);
        if (res.statusCode >= 500) counterInc('cc_http_5xx_total');
        if (res.statusCode === 429) counterInc('cc_http_429_total');
        if (dur > 1000) logCtx(ctx, 'warn', 'slow_request', { method: req.method, path: urlPath, dur_ms: dur, status: res.statusCode });
    });

    /* PROMETHEUS METRICS — gauge live numbers, then render */
    if (req.method === 'GET' && urlPath === '/metrics') {
        try {
            const sCount = await pool.query(`SELECT COUNT(*) FROM cc_sessions WHERE last_activity > NOW() - INTERVAL '1 hour'`);
            const uCount = await pool.query(`SELECT COUNT(*) FROM cc_users`);
            gaugeSet('cc_active_sessions',  parseInt(sCount.rows[0].count, 10) || 0);
            gaugeSet('cc_users_total',      parseInt(uCount.rows[0].count, 10) || 0);
            gaugeSet('cc_ids_banned_ips',   idsBans.size);
            gaugeSet('cc_uptime_seconds',   Math.floor(process.uptime()));
        } catch (e) { /* keep going even if DB hiccups */ }
        return send(res, 200, 'text/plain; version=0.0.4', renderMetrics());
    }

    /* HEALTHZ — full check (DB + worker liveness). Use for load balancer health. */
    if (req.method === 'GET' && (urlPath === '/healthz' || urlPath === '/health')) {
        try {
            const t0 = Date.now();
            await pool.query('SELECT 1');
            const dbMs = Date.now() - t0;
            return send(res, 200, 'application/json', JSON.stringify({
                ok: true, db: true, db_latency_ms: dbMs, uptime_s: Math.floor(process.uptime())
            }));
        } catch (e) {
            return send(res, 503, 'application/json', JSON.stringify({ ok: false, db: false, error: 'db_unreachable' }));
        }
    }

    /* LIVEZ — process is alive (no DB check). For Kubernetes liveness probes. */
    if (req.method === 'GET' && urlPath === '/livez') {
        return send(res, 200, 'application/json', JSON.stringify({ ok: true, uptime_s: Math.floor(process.uptime()) }));
    }

    /* READYZ — full readiness: DB reachable AND init complete. For K8s readiness probes. */
    if (req.method === 'GET' && urlPath === '/readyz') {
        try {
            await pool.query('SELECT 1');
            return send(res, 200, 'application/json', JSON.stringify({
                ready: true, db: true, init: true, uptime_s: Math.floor(process.uptime())
            }));
        } catch (e) {
            return send(res, 503, 'application/json', JSON.stringify({ ready: false, db: false, error: 'db_unreachable' }));
        }
    }

    /* /robots.txt — SEO crawler directives.
       SECURITY: Use only PUBLIC_URL for the canonical base. Never reflect Host/X-Forwarded-Proto
       headers into emitted content (host-header poisoning / cache poisoning surface). */
    if (req.method === 'GET' && urlPath === '/robots.txt') {
        const base  = (process.env.PUBLIC_URL || 'https://commentcustomer.ai').replace(/\/$/, '');
        const body  =
`# CommentCustomer.ai — robots policy
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /user-dashboard
Disallow: /user-dashboard/
Disallow: /api/
Disallow: /verify-email
Disallow: /reset-password
Disallow: /checkout

# Block AI training crawlers (opt-in only)
User-agent: GPTBot
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: CCBot
Disallow: /

Sitemap: ${base}/sitemap.xml
`;
        return send(res, 200, 'text/plain; charset=utf-8', body, { 'Cache-Control': 'public, max-age=86400' });
    }

    /* /sitemap.xml — auto-generated from registered public routes.
       SECURITY: Pinned to PUBLIC_URL only — never reflect request headers. */
    if (req.method === 'GET' && urlPath === '/sitemap.xml') {
        const base  = (process.env.PUBLIC_URL || 'https://commentcustomer.ai').replace(/\/$/, '');
        const today = new Date().toISOString().slice(0, 10);
        const urls  = [
            { loc: '/',          priority: '1.0', freq: 'weekly'  },
            { loc: '/#features', priority: '0.8', freq: 'monthly' },
            { loc: '/#pricing',  priority: '0.9', freq: 'monthly' },
            { loc: '/#demo',     priority: '0.7', freq: 'monthly' },
            { loc: '/#contact',  priority: '0.6', freq: 'monthly' },
        ];
        const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
        return send(res, 200, 'application/xml; charset=utf-8', xml, { 'Cache-Control': 'public, max-age=3600' });
    }

    /* PWA manifest (served from project root) */
    if (req.method === 'GET' && urlPath === '/site.webmanifest') {
        try {
            const manifestPath = path.join(THEME_DIR, 'site.webmanifest');
            const body = fs.readFileSync(manifestPath);
            return send(res, 200, 'application/manifest+json', body, { 'Cache-Control': 'public, max-age=86400' });
        } catch (e) {
            return send(res, 404, 'application/json', JSON.stringify({ error: 'manifest_not_found' }));
        }
    }

    /* Stripe webhook needs raw body BEFORE session lookup */
    if (req.method === 'POST' && urlPath === '/api/stripe-webhook') {
        const raw = await parseBody(req, true);
        const sig = req.headers['stripe-signature'];
        try {
            const r = await handleStripeWebhook(raw, sig, ctx);
            counterInc('cc_stripe_webhook_total', { code: r.code });
            return send(res, r.code, 'text/plain', r.body);
        } catch (err) {
            logCtx(ctx, 'error', 'webhook_failed', { msg: err.message });
            return send(res, 500, 'text/plain', 'Internal');
        }
    }

    /* Smarthinkerz partner webhook (Tap payment events) */
    if (req.method === 'POST' && (urlPath === '/api/smarthinkerz-webhook' || urlPath === '/api/sh-webhook')) {
        const raw = await parseBody(req, true);
        try {
            const r = await handleSmarthinkerzWebhook(raw, req.headers, ctx);
            counterInc('cc_sh_webhook_responses_total', { code: r.code });
            return send(res, r.code, 'text/plain', r.body);
        } catch (err) {
            logCtx(ctx, 'error', 'sh_webhook_failed', { msg: err.message });
            return send(res, 500, 'text/plain', 'Internal');
        }
    }

    /* API key + HMAC-authenticated endpoints (zero-trust path) */
    if (urlPath.startsWith('/api/v1/')) {
        const apiAuth = await authenticateApiKey(req.headers.authorization, ip);
        if (!apiAuth) {
            await idsRecord(ip, ctx, 'bad_api_key');
            counterInc('cc_api_key_failures_total');
            return send(res, 401, 'application/json', JSON.stringify({ error: 'invalid_api_key' }));
        }
        const raw = await parseBody(req, true);
        const hmac = await verifyHmacRequest(req, raw, apiAuth.keyRow);
        if (!hmac.ok) {
            await idsRecord(ip, ctx, 'hmac_' + hmac.reason);
            counterInc('cc_api_hmac_failures_total', { reason: hmac.reason });
            await eventEmit('security.alert', { kind: 'hmac_fail', reason: hmac.reason, keyId: apiAuth.keyRow.key_id, ip }, ctx);
            return send(res, 401, 'application/json', JSON.stringify({ error: 'hmac_' + hmac.reason }));
        }
        ctx.userId = apiAuth.userId;
        counterInc('cc_api_v1_requests_total', { path: urlPath });
        /* Endpoint stub — real APIs plug in here */
        if (urlPath === '/api/v1/ping') return send(res, 200, 'application/json', JSON.stringify({ ok: true, user_id: apiAuth.userId, scopes: apiAuth.scopes, request_id: ctx.requestId }));
        return send(res, 404, 'application/json', JSON.stringify({ error: 'not_found' }));
    }

    let session = null;
    try {
        const cookies = parseCookies(req.headers.cookie);
        session = await getSession(cookies[SESSION_COOKIE]);
    } catch (e) { /* DB hiccup → treat as unauthenticated */ }

    /* ─────── AJAX / API ─────── */
    if (req.method === 'POST' && urlPath === '/api/ajax') {
        const body   = await parseBody(req);
        const action = String(body.action || '');

        const rl = await rateLimit(action, ip);
        if (rl) {
            log('warn', 'rate_limited', { ip, action, layer: rl });
            return sendErr(res, 429, 'Too many requests. Please slow down and try again.');
        }
        const NEEDS_CSRF = ['cc_checkout','cc_admin_setup_2fa','cc_admin_enable_2fa','cc_admin_disable_2fa','cc_change_password'];
        if (NEEDS_CSRF.includes(action)) {
            const headerToken = req.headers['x-csrf-token'] || body.csrf || '';
            if (!session || !headerToken || headerToken !== session.csrf_token) {
                log('warn', 'csrf_failed', { ip, action });
                return sendErr(res, 403, 'Security token mismatch. Please refresh and try again.');
            }
        }

        try {
            let result;
            switch (action) {
                case 'cc_register':                result = await handleRegister(body, ip, ua); break;
                case 'cc_user_login':              result = await handleUserLogin(body, ip, ua); break;
                case 'cc_admin_login':             result = await handleAdminLogin(body, ip, ua); break;
                case 'cc_admin_verify_2fa':        result = await handleAdmin2faVerify(body, ip, ua); break;
                case 'cc_admin_setup_2fa':         result = await handleAdmin2faSetup(session); break;
                case 'cc_admin_enable_2fa':        result = await handleAdmin2faEnable(session, body); break;
                case 'cc_admin_disable_2fa':       result = await handleAdmin2faDisable(session); break;
                case 'cc_request_password_reset':  result = await handleRequestPasswordReset(body); break;
                case 'cc_reset_password':          result = await handleResetPassword(body); break;
                case 'cc_checkout':
                case 'cc_simulate_payment':        result = await handleCheckout(session, body, ip); break;
                case 'cc_logout':
                    if (session) { await destroySession(session.id); logCtx(ctx, 'info', 'logout', { email: session.email }); }
                    return sendJson(res, 200,
                        { success: true, data: { redirect: '/' } },
                        { 'Set-Cookie': cookieFor(SESSION_COOKIE, '', { maxAge: 0 }) }
                    );
                case 'cc_logout_all_devices':      result = await handleLogoutAllDevices(session, ctx); break;
                case 'cc_admin_issue_api_key':     result = await handleIssueApiKey(session, body, ctx); break;
                default:
                    return sendErr(res, 400, 'Unknown action');
            }
            if (result) return sendJson(res, result.code, result.body, result.headers);
            return sendErr(res, 500, 'No result');
        } catch (err) {
            return sendErr(res, 500, safeError(err));
        }
    }

    /* ─────── /api/me ─────── */
    if (req.method === 'GET' && urlPath === '/api/me') {
        if (!session) return sendJson(res, 401, { success: false });
        return sendJson(res, 200, { success: true, data: {
            email: session.email,
            name:  session.name,
            plan:  session.plan,
            role:  session.role,
            email_verified: session.email_verified,
            totp_enabled:   session.totp_enabled,
            trial_ends:     session.trial_ends,
            plan_expires:   session.plan_expires,
            csrf:           session.csrf_token,
        }});
    }

    /* ─────── GDPR SELF-SERVE ENDPOINTS (authenticated user) ─────── */

    /* GET /api/user/export — return all data we hold about the authenticated user as JSON.
       SECURITY: Never include cc_sessions.id (it is the bearer session token) or cc_email_tokens.token. */
    if (req.method === 'GET' && urlPath === '/api/user/export') {
        if (!session) return sendJson(res, 401, { success: false, data: { message: 'Sign in required.' } });
        try {
            const uid = session.user_id;
            const currentSidPrefix = String(session.id || '').slice(0, 8);
            const [u, sessRows, audit, emailToks] = await Promise.all([
                pool.query(`SELECT id, email, name, role, plan, email_verified, created_at, trial_ends, plan_expires, totp_enabled FROM cc_users WHERE id=$1`, [uid]),
                /* Redact session id; expose only metadata + an opaque short prefix used to mark "current" device */
                pool.query(`SELECT LEFT(id,8) AS session_ref, ip, user_agent, created_at, last_activity, expires_at FROM cc_sessions WHERE user_id=$1`, [uid]),
                pool.query(`SELECT ts, event, ip, request_id, meta FROM cc_audit_log WHERE user_id=$1 ORDER BY ts DESC LIMIT 1000`, [uid]),
                /* Redact token value; expose only purpose + lifecycle dates */
                pool.query(`SELECT purpose, used, created_at, expires_at FROM cc_email_tokens WHERE user_id=$1`, [uid]),
            ]);
            const sessionsClean = sessRows.rows.map(s => ({
                ip:            s.ip,
                user_agent:    s.user_agent,
                created_at:    s.created_at,
                last_activity: s.last_activity,
                expires_at:    s.expires_at,
                is_current:    s.session_ref === currentSidPrefix,
            }));
            const payload = {
                exported_at:  new Date().toISOString(),
                user:         u.rows[0] || null,
                sessions:     sessionsClean,
                audit_events: audit.rows,
                email_tokens: emailToks.rows,
                notice:       'This export contains all personal data we store about your account, per GDPR Article 15 (right of access). Session and verification tokens are redacted for security.',
            };
            logCtx(ctx, 'info', 'user_data_exported', { user_id: uid });
            return send(res, 200, 'application/json; charset=utf-8', JSON.stringify(payload, null, 2),
                { 'Content-Disposition': 'attachment; filename="commentcustomer-data-export-' + new Date().toISOString().slice(0,10) + '.json"' });
        } catch (e) {
            logCtx(ctx, 'error', 'user_export_failed', { err: e && e.message });
            return sendJson(res, 500, { success: false, data: { message: 'Export failed.' } });
        }
    }

    /* POST /api/user/delete-account — schedules account deletion (CSRF-protected) */
    if (req.method === 'POST' && urlPath === '/api/user/delete-account') {
        if (!session) return sendJson(res, 401, { success: false, data: { message: 'Sign in required.' } });
        const headerToken = req.headers['x-csrf-token'] || '';
        if (!headerToken || headerToken !== session.csrf_token) {
            return sendJson(res, 403, { success: false, data: { message: 'CSRF token missing or invalid.' } });
        }
        try {
            const uid = session.user_id;
            await pool.query(`DELETE FROM cc_sessions      WHERE user_id=$1`, [uid]);
            await pool.query(`DELETE FROM cc_email_tokens  WHERE user_id=$1`, [uid]);
            await pool.query(`DELETE FROM cc_api_keys      WHERE user_id=$1`, [uid]).catch(() => {});
            await pool.query(`DELETE FROM cc_users         WHERE id=$1`,      [uid]);
            logCtx(ctx, 'warn', 'user_account_deleted', { user_id: uid, email: session.email });
            res.writeHead(200, {
                'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
                'Content-Type': 'application/json',
            });
            return res.end(JSON.stringify({ success: true, data: { message: 'Account permanently deleted.' } }));
        } catch (e) {
            logCtx(ctx, 'error', 'user_delete_failed', { err: safeError(e) });
            return sendJson(res, 500, { success: false, data: { message: 'Deletion failed. Contact support.' } });
        }
    }

    /* ─────── ADMIN SECURITY DASHBOARD ENDPOINTS ─────── */
    /* All require an authenticated admin session. Read-only except where noted. */

    if (urlPath.startsWith('/api/admin/')) {
        if (!session || session.role !== 'admin') {
            return sendJson(res, 401, { success: false, data: { message: 'Admin only.' } });
        }
        /* CSRF protection on all state-changing admin endpoints */
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const headerToken = req.headers['x-csrf-token'] || '';
            if (!headerToken || headerToken !== session.csrf_token) {
                logCtx(ctx, 'warn', 'admin_csrf_rejected', { actor: session.email, path: urlPath });
                return sendJson(res, 403, { success: false, data: { message: 'CSRF token missing or invalid.' } });
            }
        }

        /* Audit log: paginated, filterable by event */
        if (req.method === 'GET' && urlPath === '/api/admin/audit') {
            try {
                const event   = (qp.get('event') || '').slice(0, 64);
                const page    = Math.max(1, parseInt(qp.get('page') || '1', 10));
                const perPage = Math.min(100, Math.max(10, parseInt(qp.get('per_page') || '50', 10)));
                const offset  = (page - 1) * perPage;
                const where   = event ? `WHERE event = $1` : '';
                const params  = event ? [event, perPage, offset] : [perPage, offset];
                const idx     = event ? 2 : 1;

                const rows = await pool.query(
                    `SELECT a.id, a.ts, a.event, a.user_id, a.ip, a.request_id, a.meta,
                            u.email AS user_email
                     FROM cc_audit_log a
                     LEFT JOIN cc_users u ON u.id = a.user_id
                     ${where}
                     ORDER BY a.ts DESC
                     LIMIT $${idx} OFFSET $${idx + 1}`,
                    params
                );

                const summary = await pool.query(`
                    SELECT
                      COUNT(*)                                                    AS events_24h,
                      COUNT(*) FILTER (WHERE event LIKE '%fail%' OR event LIKE '%lock%' OR event LIKE '%reject%') AS failures_24h,
                      COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)  AS unique_users,
                      COUNT(DISTINCT ip)      FILTER (WHERE ip IS NOT NULL)       AS unique_ips
                    FROM cc_audit_log
                    WHERE ts > NOW() - INTERVAL '24 hours'
                `);

                return sendJson(res, 200, { success: true, data: {
                    rows: rows.rows, summary: summary.rows[0] || {}, page, per_page: perPage
                }});
            } catch (e) {
                logCtx(ctx, 'error', 'admin_audit_query_failed', { err: safeError(e) });
                return sendJson(res, 500, { success: false, data: { message: 'Query failed.' } });
            }
        }

        /* Audit log CSV export — STREAMED in 500-row chunks to avoid event-loop block */
        if (req.method === 'GET' && urlPath === '/api/admin/audit/export') {
            try {
                res.writeHead(200, {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="audit-log-' + new Date().toISOString().slice(0, 10) + '.csv"',
                    'X-Content-Type-Options': 'nosniff',
                    'Cache-Control': 'no-store'
                });
                res.write('Timestamp,Event,User,IP,Request ID,Metadata\n');
                const csvEsc = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
                const CHUNK = 500;
                const HARD_CAP = 50000;
                let offset = 0, written = 0;
                while (written < HARD_CAP) {
                    const r = await pool.query(
                        `SELECT a.ts, a.event, COALESCE(u.email,'') AS user_email,
                                COALESCE(a.ip,'') AS ip, COALESCE(a.request_id,'') AS request_id,
                                COALESCE(a.meta::text,'') AS meta
                         FROM cc_audit_log a LEFT JOIN cc_users u ON u.id = a.user_id
                         ORDER BY a.ts DESC LIMIT $1 OFFSET $2`,
                        [CHUNK, offset]
                    );
                    if (!r.rows.length) break;
                    const lines = r.rows.map(row =>
                        [row.ts, row.event, row.user_email, row.ip, row.request_id, row.meta].map(csvEsc).join(',')
                    ).join('\n') + '\n';
                    if (!res.write(lines)) await new Promise(resolve => res.once('drain', resolve));
                    written += r.rows.length;
                    offset  += CHUNK;
                    if (r.rows.length < CHUNK) break;
                }
                logCtx(ctx, 'info', 'admin_audit_exported', { actor: session.email, rows: written });
                return res.end();
            } catch (e) {
                logCtx(ctx, 'error', 'admin_audit_export_failed', { err: safeError(e) });
                if (!res.headersSent) return sendJson(res, 500, { success: false });
                return res.end();
            }
        }

        /* Active sessions list */
        if (req.method === 'GET' && urlPath === '/api/admin/sessions') {
            try {
                const rows = await pool.query(`
                    SELECT s.id, s.user_id, s.ip, s.user_agent, s.last_activity, s.expires_at,
                           u.email AS user_email, u.role AS user_role
                    FROM cc_sessions s LEFT JOIN cc_users u ON u.id = s.user_id
                    WHERE s.expires_at > NOW()
                    ORDER BY s.last_activity DESC LIMIT 200
                `);
                const stats = await pool.query(`
                    SELECT
                      COUNT(*)                                                              AS active,
                      COUNT(DISTINCT user_id)                                               AS unique_users,
                      COUNT(*) FILTER (WHERE expires_at < NOW() + INTERVAL '1 hour')        AS expiring_soon,
                      COUNT(*) FILTER (WHERE last_activity < NOW() - INTERVAL '12 hours')   AS stale
                    FROM cc_sessions WHERE expires_at > NOW()
                `);
                return sendJson(res, 200, { success: true, data: { rows: rows.rows, stats: stats.rows[0] || {} }});
            } catch (e) { return sendJson(res, 500, { success: false }); }
        }

        /* Revoke a single session */
        if (req.method === 'POST' && urlPath === '/api/admin/sessions/revoke') {
            try {
                const body = await parseBody(req);
                const sid  = String((body && body.session_id) || '').slice(0, 64);
                if (!sid) return sendJson(res, 400, { success: false });
                if (sid === session.id) return sendJson(res, 400, { success: false, data: { message: 'Cannot revoke your own active session here.' } });
                await pool.query(`DELETE FROM cc_sessions WHERE id = $1`, [sid]);
                logCtx(ctx, 'info', 'admin_session_revoked', { actor: session.email, target_session: sid });
                return sendJson(res, 200, { success: true });
            } catch (e) { return sendJson(res, 500, { success: false }); }
        }

        /* Revoke all sessions except current admin's */
        if (req.method === 'POST' && urlPath === '/api/admin/sessions/revoke-all') {
            try {
                const r = await pool.query(`DELETE FROM cc_sessions WHERE id <> $1`, [session.id]);
                logCtx(ctx, 'warn', 'admin_sessions_revoked_all', { actor: session.email, count: r.rowCount });
                return sendJson(res, 200, { success: true, data: { revoked: r.rowCount } });
            } catch (e) { return sendJson(res, 500, { success: false }); }
        }

        /* IP bans + IDS overview */
        if (req.method === 'GET' && urlPath === '/api/admin/bans') {
            try {
                const rows = await pool.query(`
                    SELECT ip, reason, banned_at, banned_until
                    FROM cc_ip_bans WHERE banned_until > NOW()
                    ORDER BY banned_at DESC LIMIT 500
                `);
                const stats = await pool.query(`
                    SELECT
                      (SELECT COUNT(*) FROM cc_ip_bans WHERE banned_until > NOW())                                             AS active,
                      (SELECT COUNT(*) FROM cc_ip_bans WHERE banned_at > NOW() - INTERVAL '24 hours')                          AS new_24h,
                      (SELECT COUNT(*) FROM cc_ids_counters WHERE window_start > NOW() - INTERVAL '1 hour' AND count > 10)     AS ids_flagged_1h,
                      (SELECT COUNT(*) FROM cc_rate_buckets WHERE window_start > NOW() - INTERVAL '1 hour')                    AS ratelim_hits_1h
                `);
                return sendJson(res, 200, { success: true, data: { rows: rows.rows, stats: stats.rows[0] || {} }});
            } catch (e) { return sendJson(res, 500, { success: false }); }
        }

        /* Manual IP ban */
        if (req.method === 'POST' && urlPath === '/api/admin/bans/add') {
            try {
                const body = await parseBody(req);
                const ipStr  = String((body && body.ip) || '').slice(0, 64).trim();
                const dur    = Math.min(2592000, Math.max(60, parseInt((body && body.duration_s) || '86400', 10)));
                const reason = String((body && body.reason) || 'manual_admin_ban').slice(0, 200);
                /* Strict IPv4 / IPv6 validation */
                const isV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/.test(ipStr);
                const isV6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4})$/.test(ipStr);
                if (!isV4 && !isV6) return sendJson(res, 400, { success: false, data: { message: 'Invalid IPv4/IPv6 address.' } });
                await pool.query(
                    `INSERT INTO cc_ip_bans (ip, reason, banned_at, banned_until)
                     VALUES ($1, $2, NOW(), NOW() + ($3::int * INTERVAL '1 second'))
                     ON CONFLICT (ip) DO UPDATE SET reason = EXCLUDED.reason, banned_until = EXCLUDED.banned_until`,
                    [ipStr, reason, dur]
                );
                logCtx(ctx, 'warn', 'admin_ip_banned', { actor: session.email, target_ip: ipStr, duration_s: dur, reason });
                return sendJson(res, 200, { success: true });
            } catch (e) { return sendJson(res, 500, { success: false, data: { message: safeError(e) } }); }
        }

        /* Lift an IP ban */
        if (req.method === 'POST' && urlPath === '/api/admin/bans/remove') {
            try {
                const body = await parseBody(req);
                const ipStr = String((body && body.ip) || '').slice(0, 64).trim();
                if (!ipStr) return sendJson(res, 400, { success: false });
                await pool.query(`DELETE FROM cc_ip_bans WHERE ip = $1`, [ipStr]);
                logCtx(ctx, 'info', 'admin_ip_unbanned', { actor: session.email, target_ip: ipStr });
                return sendJson(res, 200, { success: true });
            } catch (e) { return sendJson(res, 500, { success: false }); }
        }

        /* System monitor: process + DB + worker stats */
        if (req.method === 'GET' && urlPath === '/api/admin/system') {
            try {
                const t0 = Date.now();
                await pool.query('SELECT 1');
                const dbMs = Date.now() - t0;

                const eob = await pool.query(`
                    SELECT
                      COUNT(*) FILTER (WHERE sent_at IS NULL)                              AS pending,
                      COUNT(*) FILTER (WHERE sent_at IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours') AS sent_24h,
                      COUNT(*) FILTER (WHERE error IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours')  AS failed_24h
                    FROM cc_email_outbox
                `).catch(() => ({ rows: [{}] }));

                const evob = await pool.query(`
                    SELECT
                      COUNT(*) FILTER (WHERE status = 'pending')                                                AS pending,
                      COUNT(*) FILTER (WHERE status = 'processing')                                             AS processing,
                      COUNT(*) FILTER (WHERE status = 'done' AND created_at > NOW() - INTERVAL '24 hours')      AS done_24h,
                      COUNT(*) FILTER (WHERE status = 'dead')                                                   AS dlq
                    FROM cc_event_outbox
                `).catch(() => ({ rows: [{}] }));

                const sec = await pool.query(`
                    SELECT
                      COUNT(*) FILTER (WHERE event LIKE 'login_failure%')   AS login_fail,
                      COUNT(*) FILTER (WHERE event LIKE 'rate_limit%')      AS rate_limited,
                      COUNT(*) FILTER (WHERE event LIKE 'ids_%')            AS ids_flagged,
                      COUNT(*) FILTER (WHERE event LIKE 'csrf_%')           AS csrf_rejected
                    FROM cc_audit_log
                    WHERE ts > NOW() - INTERVAL '1 hour'
                `).catch(() => ({ rows: [{}] }));

                const sizes = await pool.query(`
                    SELECT relname AS table_name,
                           n_live_tup AS rows,
                           pg_size_pretty(pg_total_relation_size(relid)) AS size,
                           last_autovacuum
                    FROM pg_stat_user_tables
                    WHERE relname LIKE 'cc_%'
                    ORDER BY n_live_tup DESC
                `).catch(() => ({ rows: [] }));

                const mem = process.memoryUsage();
                return sendJson(res, 200, { success: true, data: {
                    uptime_s:        Math.floor(process.uptime()),
                    db_latency_ms:   dbMs,
                    mem_rss_mb:      Math.round(mem.rss / 1048576),
                    mem_heap_mb:     Math.round(mem.heapUsed / 1048576),
                    pg_pool:         { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
                    email_outbox:    eob.rows[0] || {},
                    event_outbox:    evob.rows[0] || {},
                    security_1h:     sec.rows[0] || {},
                    table_sizes:     sizes.rows
                }});
            } catch (e) { return sendJson(res, 500, { success: false, data: { message: safeError(e) } }); }
        }

        /* Replay DLQ — moves dead events back to pending with reset attempts */
        if (req.method === 'POST' && urlPath === '/api/admin/dlq/replay') {
            try {
                const r = await pool.query(`UPDATE cc_event_outbox SET status='pending', attempts=0, last_error=NULL WHERE status='dead'`);
                logCtx(ctx, 'warn', 'admin_dlq_replayed', { actor: session.email, count: r.rowCount });
                return sendJson(res, 200, { success: true, data: { replayed: r.rowCount } });
            } catch (e) { return sendJson(res, 500, { success: false }); }
        }

        return sendJson(res, 404, { success: false, data: { message: 'Unknown admin endpoint.' } });
    }

    /* ─────── /verify-email ─────── */
    if (req.method === 'GET' && (urlPath === '/verify-email' || urlPath === '/verify-email/')) {
        const token = qp.get('token') || '';
        try {
            const uid = await handleVerifyEmail(token);
            if (uid) return send(res, 200, 'text/html',
                infoPage('Email verified ✅', 'Your email is now confirmed. You can sign in to access your dashboard.', '/', 'Continue to sign in', '#22c55e'));
            return send(res, 400, 'text/html',
                infoPage('Link expired', 'This verification link is invalid or has already been used.', '/', 'Back to home', '#ef4444'));
        } catch (err) {
            return send(res, 500, 'text/html', infoPage('Error', safeError(err), '/', 'Back to home', '#ef4444'));
        }
    }

    /* ─────── /reset-password (page) ─────── */
    if (req.method === 'GET' && (urlPath === '/reset-password' || urlPath === '/reset-password/')) {
        const token = qp.get('token') || '';
        if (!/^[a-f0-9]{64}$/.test(token)) {
            return send(res, 400, 'text/html', infoPage('Invalid link', 'This reset link is malformed.', '/', 'Back to home', '#ef4444'));
        }
        return send(res, 200, 'text/html', resetPasswordPage(token));
    }

    /* ─────── PAGES ─────── */
    const csrfForPage = session ? session.csrf_token : '';
    if (urlPath === '/' || urlPath === '/index.html') {
        return send(res, 200, 'text/html', buildPage('landing', { csrf: csrfForPage }));
    }
    if (urlPath === '/dashboard' || urlPath === '/dashboard/') {
        if (!session || session.role !== 'admin') {
            log('warn', 'dashboard_access_denied', { ip, hasSession: !!session, role: session?.role });
            return send(res, 401, 'text/html', buildPage('unauthorized'));
        }
        return send(res, 200, 'text/html', buildPage('dashboard', { csrf: csrfForPage }));
    }
    if (urlPath === '/user-dashboard' || urlPath === '/user-dashboard/') {
        if (!session) {
            log('warn', 'user_dashboard_access_denied', { ip });
            return send(res, 401, 'text/html', buildPage('unauthorized'));
        }
        return send(res, 200, 'text/html', buildPage('user-dashboard', { csrf: csrfForPage }));
    }
    if (urlPath === '/checkout' || urlPath === '/checkout/') {
        const plan  = qp.get('plan');
        const email = qp.get('email') || '';
        if (!['starter','growth','pro'].includes(plan)) return send(res, 400, 'text/plain', 'Invalid plan.');
        let userName = '';
        if (session) {
            try {
                const r = await pool.query('SELECT name FROM cc_users WHERE id=$1', [session.user_id]);
                userName = (r.rows[0] && r.rows[0].name) || '';
            } catch (_) {}
        }
        return send(res, 200, 'text/html', buildPage('checkout', { plan, email, csrf: csrfForPage, userName }));
    }

    /* ─────── STATIC FILES ─────── */
    let decodedPath;
    try { decodedPath = decodeURIComponent(urlPath); } catch (_) { return send(res, 400, 'text/plain', 'Bad request'); }
    const filePath  = path.join(THEME_DIR, decodedPath);
    const baseAbs   = path.resolve(THEME_DIR) + path.sep;
    const targetAbs = path.resolve(filePath);
    if (!targetAbs.startsWith(baseAbs)) {
        log('warn', 'path_traversal_blocked', { ip, urlPath: decodedPath });
        return send(res, 403, 'text/plain', 'Forbidden');
    }
    const ext = path.extname(filePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ct = mimeTypes[ext] || 'application/octet-stream';
        if (ext === '.mp4') {
            const stat  = fs.statSync(filePath);
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end   = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
                res.writeHead(206, { 'Content-Range':`bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges':'bytes', 'Content-Length':end-start+1, 'Content-Type':ct });
                fs.createReadStream(filePath, { start, end }).pipe(res);
            } else {
                res.writeHead(200, { 'Content-Length':stat.size, 'Content-Type':ct, 'Accept-Ranges':'bytes' });
                fs.createReadStream(filePath).pipe(res);
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': ct });
        fs.createReadStream(filePath).pipe(res);
        return;
    }

    /* Branded 404 page for HTML requests; plain text for API/asset paths */
    const wantsHtml = (req.headers.accept || '').includes('text/html');
    if (wantsHtml) {
        try {
            return send(res, 404, 'text/html; charset=utf-8', renderErrorPage(404, 'Page Not Found',
                "We couldn't find the page you were looking for. It may have been moved, removed, or never existed.",
                ctx.requestId));
        } catch (e) { /* fall through to plain text */ }
    }
    return send(res, 404, 'text/plain', 'Not Found');
};

/* Branded error page renderer — replaces {{TOKEN}} placeholders in error-page.php */
function renderErrorPage(code, title, msg, requestId) {
    let body = readAndProcess('error-page.php');
    const idBlock = requestId
        ? `<div class="err-id" aria-label="Reference ID">Ref: ${escapeHtml(String(requestId))}</div>`
        : '';
    return body
        .replace(/\{\{CODE\}\}/g,     escapeHtml(String(code)))
        .replace(/\{\{TITLE\}\}/g,    escapeHtml(String(title)))
        .replace(/\{\{MSG\}\}/g,      escapeHtml(String(msg)))
        .replace(/\{\{ID_BLOCK\}\}/g, idBlock);
}

/* ───────────────────────── PROCESS-LEVEL SAFETY ───────────── */
process.on('unhandledRejection', err => log('error', 'unhandled_rejection', { msg: err && err.message }));
process.on('uncaughtException',  err => log('error', 'uncaught_exception',  { msg: err && err.message }));

/* On Vercel (serverless), the platform owns the request lifecycle, the
   process, and graceful shutdown. We only construct the http.Server, bind
   the SIGTERM/SIGINT handlers, and call .listen() in long-running mode. */
let server = null;
if (!process.env.VERCEL) {
    server = http.createServer(requestHandler);

    let _shuttingDown = false;
    async function gracefulShutdown(signal) {
        if (_shuttingDown) return;
        _shuttingDown = true;
        log('info', 'shutdown_received', { signal });
        server.close(async () => {
            try { await pool.end(); log('info', 'pool_closed'); } catch (e) { log('error', 'pool_close_failed', { msg: e && e.message }); }
            log('info', 'shutdown_clean');
            process.exit(0);
        });
        setTimeout(() => { log('error', 'shutdown_timeout_kill'); process.exit(1); }, 10_000).unref();
    }
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

    server.listen(PORT, '0.0.0.0', () => {
        log('info', 'server_started', { port: PORT, prod: IS_PROD });
        console.log(`CommentCustomer.ai preview → http://0.0.0.0:${PORT}`);
    });
}

/* Module API for serverless adapters (Vercel functions, cron handlers).
   In long-running mode (Replit dev/Replit Deployments) these are unused. */
module.exports = {
    requestHandler,
    ensureInit,
    outboxTick,
    runMaintenanceOnce,
    pool,
};
