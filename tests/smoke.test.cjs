#!/usr/bin/env node
/* CommentCustomer.ai smoke-test suite. Run: node tests/smoke.test.cjs
 *
 * Hits the live server at BASE (default http://localhost:5000) and exits 0
 * on full pass, 1 on any failure. Designed for CI use.
 */
'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:5000';
const TIMEOUT_MS = 10000;

let pass = 0, fail = 0;
const failures = [];

function request(method, urlPath, opts = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(urlPath, BASE);
        const lib = u.protocol === 'https:' ? https : http;
        const req = lib.request({
            hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
            path: u.pathname + u.search, method,
            headers: Object.assign({ 'Accept': 'text/html,application/json,*/*' }, opts.headers || {}),
            timeout: TIMEOUT_MS,
        }, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        if (opts.body) req.write(opts.body);
        req.end();
    });
}

function check(name, cond, detail) {
    if (cond) { pass++; console.log(`  \u2713 ${name}`); }
    else      { fail++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`  \u2717 ${name}${detail ? ' (' + detail + ')' : ''}`); }
}

async function section(title, fn) {
    console.log(`\n── ${title} ──`);
    try { await fn(); }
    catch (e) { fail++; failures.push(`${title} threw: ${e.message}`); console.log(`  \u2717 EXCEPTION: ${e.message}`); }
}

(async () => {
    console.log(`Smoke tests against ${BASE}\n`);

    await section('Health endpoints', async () => {
        const h = await request('GET', '/healthz');
        check('GET /healthz returns 200', h.status === 200, `got ${h.status}`);
        const l = await request('GET', '/livez');
        check('GET /livez returns 200',  l.status === 200, `got ${l.status}`);
        const r = await request('GET', '/readyz');
        check('GET /readyz returns 200', r.status === 200, `got ${r.status}`);
    });

    await section('Landing page', async () => {
        const r = await request('GET', '/');
        check('GET / returns 200',                 r.status === 200, `got ${r.status}`);
        check('Landing has <title>',               /<title[^>]*>[^<]+<\/title>/.test(r.body));
        check('Landing has CSRF meta',             /name="csrf-token"/.test(r.body));
        check('Landing has Open Graph image',      /property="og:image"/.test(r.body));
        check('Landing has canonical link',        /rel="canonical"/.test(r.body));
        check('Landing has JSON-LD schema',        /application\/ld\+json/.test(r.body));
        check('Landing has hero section',          /hero-content|class="hero/.test(r.body));
        check('Landing has pricing section',       /pricing/i.test(r.body));
    });

    await section('Security headers', async () => {
        const r = await request('GET', '/');
        check('CSP present',           !!r.headers['content-security-policy']);
        check('X-Frame-Options DENY',  r.headers['x-frame-options'] === 'DENY');
        check('X-Content-Type-Options nosniff', r.headers['x-content-type-options'] === 'nosniff');
        check('HSTS present',          !!r.headers['strict-transport-security']);
        check('COOP present',          !!r.headers['cross-origin-opener-policy']);
        check('CORP present',          !!r.headers['cross-origin-resource-policy']);
        check('Referrer-Policy set',   !!r.headers['referrer-policy']);
        check('Permissions-Policy set',!!r.headers['permissions-policy']);
    });

    await section('SEO endpoints', async () => {
        const robots = await request('GET', '/robots.txt');
        check('GET /robots.txt returns 200',       robots.status === 200, `got ${robots.status}`);
        check('robots.txt contains Sitemap line',  /Sitemap:/i.test(robots.body));
        check('robots.txt blocks admin paths',     /Disallow: \/dashboard/.test(robots.body));
        const sitemap = await request('GET', '/sitemap.xml');
        check('GET /sitemap.xml returns 200',      sitemap.status === 200, `got ${sitemap.status}`);
        check('sitemap is valid XML',              /<\?xml/.test(sitemap.body) && /<urlset/.test(sitemap.body));
    });

    await section('Static assets', async () => {
        const css = await request('GET', '/assets/css/landing.css');
        check('landing.css 200', css.status === 200);
        const js = await request('GET', '/assets/js/landing.js');
        check('landing.js 200', js.status === 200);
        const fav = await request('GET', '/assets/images/favicon.ico');
        check('favicon.ico 200', fav.status === 200);
    });

    await section('Auth gating', async () => {
        const dash = await request('GET', '/dashboard/');
        check('GET /dashboard/ returns 401 anon',       dash.status === 401, `got ${dash.status}`);
        const ud = await request('GET', '/user-dashboard/');
        check('GET /user-dashboard/ returns 401 anon',  ud.status === 401, `got ${ud.status}`);
        const me = await request('GET', '/api/me');
        check('GET /api/me returns 401 anon',           me.status === 401, `got ${me.status}`);
    });

    await section('Admin endpoints (CSRF-gated)', async () => {
        for (const p of ['/api/admin/audit', '/api/admin/sessions', '/api/admin/bans', '/api/admin/system']) {
            const r = await request('GET', p);
            check(`GET ${p} returns 401 anon`, r.status === 401, `got ${r.status}`);
        }
        const post = await request('POST', '/api/admin/dlq/replay', { headers: { 'Content-Type': 'application/json' }, body: '{}' });
        check('POST /api/admin/dlq/replay returns 401 anon', post.status === 401, `got ${post.status}`);
    });

    await section('GDPR endpoints', async () => {
        const ex = await request('GET', '/api/user/export');
        check('GET /api/user/export returns 401 anon',    ex.status === 401, `got ${ex.status}`);
        const del = await request('POST', '/api/user/delete-account', { headers: { 'Content-Type': 'application/json' }, body: '{}' });
        check('POST /api/user/delete-account returns 401 anon', del.status === 401, `got ${del.status}`);
    });

    await section('Path traversal & error handling', async () => {
        const t1 = await request('GET', '/../../etc/passwd');
        check('Path traversal blocked', t1.status === 404, `got ${t1.status}`);
        const t2 = await request('GET', '/assets/../server.cjs');
        check('Source-file leak blocked', t2.status === 404, `got ${t2.status}`);
        const t3 = await request('GET', '/this-page-does-not-exist');
        check('Unknown route returns 404', t3.status === 404, `got ${t3.status}`);
    });

    await section('Metrics endpoint', async () => {
        const m = await request('GET', '/metrics');
        check('GET /metrics returns 200',              m.status === 200);
        check('metrics include http requests counter', /cc_http_requests_total/.test(m.body));
        check('metrics include outbox gauge',          /cc_outbox_pending_size/.test(m.body));
    });

    console.log(`\n══════════════════════════════════════════`);
    console.log(`PASS: ${pass}   FAIL: ${fail}   TOTAL: ${pass + fail}`);
    console.log(`══════════════════════════════════════════`);
    if (fail) {
        console.log('\nFAILURES:');
        failures.forEach(f => console.log('  ' + f));
        process.exit(1);
    } else {
        console.log('All smoke tests passed. \u2713');
        process.exit(0);
    }
})().catch(e => { console.error('Suite error:', e); process.exit(1); });
