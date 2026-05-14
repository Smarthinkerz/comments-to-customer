# CommentCustomer.ai WordPress Theme

## Overview
Complete WordPress theme for CommentCustomer.ai - an AI-powered social media comment automation platform. Built as a self-hosted WordPress theme with landing page, user dashboard (free tier), admin dashboard (CRM-enhanced), and login system.

## Project Structure
```
commentcustomer-developer/          # WordPress theme directory (ready to zip & install)
├── style.css                       # Theme info header (required by WordPress)
├── screenshot.png                  # Theme screenshot (shown in WP admin)
├── functions.php                   # Theme setup, enqueues, AJAX handlers, sidebars, page creation
├── header.php                      # HTML head with wp_head()
├── footer.php                      # Footer with 38 link modals + social links + wp_footer()
├── index.php                       # Default fallback template
├── front-page.php                  # Landing page template (static front page)
├── page.php                        # Generic page template
├── single.php                      # Single post template
├── 404.php                         # 404 error page
├── sidebar.php                     # Sidebar widget area
├── page-dashboard.php              # Admin Dashboard template (15 sub-pages: 12 original + CRM + Site Editor + Media)
├── page-user-dashboard.php         # User Dashboard template (free tier, 7 pages)
├── page-login.php                  # Login page template
├── assets/
│   ├── css/
│   │   ├── landing.css             # Landing page styles (all sections + modals + stars + shooting stars)
│   │   ├── responsive.css          # Mobile responsive (360px - 1024px breakpoints)
│   │   ├── dashboard.css           # Admin Dashboard styles (sidebar, tables, forms, charts, CRM, site editor, media)
│   │   └── user-dashboard.css      # User Dashboard styles (free tier layout, feature cards, upgrade modal)
│   ├── js/
│   │   ├── landing.js              # Nav dropdowns, user/admin login, tab filters, demos, floating icons, twinkle stars, shooting stars
│   │   ├── modals.js               # Event-delegated modal open/close/ESC (38 footer modals + nav dropdown modals)
│   │   ├── dashboard.js            # Admin dashboard sidebar toggle, page switching, button interactions
│   │   └── user-dashboard.js       # User dashboard navigation, upgrade modal, toast notifications
│   ├── videos/
│   │   ├── ai-replies-demo.mp4     # Product Demo section video
│   │   └── realtime-lead-demo.mp4  # See It In Action section video
│   └── images/                     # 36+ feature card images, favicon
├── template-parts/
│   ├── sections/                   # Landing page sections
│   │   ├── navigation.php          # Header nav + 3 dropdown menus (Product/Features/Solutions) + user login + admin login popups
│   │   ├── hero.php                # Hero with orbital animation (larger slanted tablet), 3 planets, 5 social icons, 30 twinkle stars
│   │   ├── trust-bar.php           # Platform logos bar
│   │   ├── features-overview.php   # 4 feature cards with neon borders
│   │   ├── all-features.php        # 6 category tabs, 32 feature cards with mixed neon borders
│   │   ├── demo-section-1.php      # See It In Action (video + interactive chat)
│   │   └── demo-section-2.php      # Product Demo (video + chat) + Pricing section (4 cards)
│   ├── modals/
│   │   └── footer-modals.php       # All 38 popup modals with real content
│   └── dashboard/                  # Dashboard sub-pages
│       ├── comments.php, leads.php, analytics.php, inbox.php
│       ├── workflows.php, templates.php, profile.php, settings.php
│       ├── security.php, connected.php, billing.php, team.php
│       ├── crm.php                 # CRM Overview (stats, quick actions, activity, system status, traffic sources)
│       ├── site-editor.php         # Site Editor (header editor, content sections, theme/design, SEO)
│       └── media.php               # Media Library (upload zone, media grid, storage stats)
server.cjs                          # Preview server (renders PHP templates as HTML for Replit preview)
```

## Key Features
- **Landing Page**: Navigation with 3 dropdowns, hero with orbital animation (slanted tablet), trust bar, features overview, all features with tabs, 2 demo sections with real videos, pricing, footer
- **45 Modals (38 unique footer links + 7 shared nav modals)**: All popup modals with full spec-compliant content including expand/collapse sections
- **Footer**: 7 columns (Product 5, Features 7, Resources 7, Company 6, Support 6, Legal 6, Admin 1) = 38 total links
- **Nav Dropdown Modals**: Product (7 items), Features (8 items incl. Human Fallback & Analytics), Solutions (5 items with dedicated solution-* modals)
- **Contact Modal**: Phone +968 96737452, Mon-Fri 9AM-6PM GST, social channels (Facebook/Instagram/LinkedIn)
- **Expand/Collapse**: All modals with expandable content use btn-expand-more toggling modal-expanded-content sections
- **2 Interactive AI Demos**: Chat-based demos with 3 free tries each
- **User Dashboard** (Tier-Aware): 11 pages — Dashboard Home, Connected Pages, AI Replies, Lead Capture, Analytics, Auto-DM (Growth+), Lead Scoring (Pro+), Multi-Team (Pro+), Usage, Profile, Billing. Dashboard adapts per tier (Trial/Starter/Growth/Pro): feature cards lock/unlock matching exact tier features, usage limits change, badges update, nav items gate behind tier requirements
- **Admin Dashboard** (CRM-enhanced): 15 pages — Comments, Leads, Analytics, Inbox, Workflows, Templates, CRM Overview, Site Editor, Media Library, Profile, Settings, Security, Connected Accounts, Billing, Team
- **Dual Login System**: Navigation "Login" → User Dashboard (/user-dashboard/), Footer "Admin Login" → Admin Dashboard (/dashboard/)
- **Fully Responsive**: Breakpoints at 1024px, 768px, 480px, 360px
- **Visual Effects**: Neon glowing borders (green/red/cyan/pink/gold/purple), twinkle stars across all sections, shooting stars
- **Floating Elements**: 7 social icons + 3 planets drift across the page

## Hero Section
- Background: Dark blue-gray gradient (#141B2D → #1A1F35 → #151928)
- Grayish-white haze overlay via radial-gradient pseudo-elements
- Orbital animation with larger slanted tablet (240px, rotated -8deg with perspective)
- Reduced purple glow on orbital rim for cleaner look

## WordPress Theme Features
- Uses `wp_head()`, `wp_footer()`, `wp_enqueue_style/script()`
- Registers nav menus (primary + footer)
- Registers sidebar widget area
- Auto-creates Home, Dashboard, Login pages on theme activation
- Sets static front page automatically
- Custom body classes for front page and dashboard
- AJAX handlers for admin login and AI demo chat
- Custom MIME type support (SVG, MP4, WebP)
- Uses `CC_THEME_URI` constant for all asset paths
- `get_template_part()` for modular template loading

## Tier System
- **Trial**: 1 page, 30/day replies, AI view-only, 7-day analytics
- **Starter** ($29/mo): 1 connected page, 1,000 automated replies, Basic AI model, Lead capture, Dashboard analytics
- **Growth** ($79/mo): 3 connected pages, 5,000 automated replies, Advanced AI replies, Auto-DM sequences, Priority support
- **Pro** ($149/mo): 7 connected pages, 15,000 automated replies, Lead scoring AI, Multi-team access, Full analytics suite
- Plan is stored in the user's PostgreSQL row and surfaced via `/api/me` (server-session driven). Dashboard fetches `/api/me` on load and customizes all sections dynamically.

## User Login Credentials (Navigation "Login" button → Customer Login → /user-dashboard/)
- Register via the registration form (stored in PostgreSQL cc_users table)
- Plan assigned: trial (free signup), starter/growth/pro (after checkout payment)

## Admin Login Credentials (Footer "Admin Login" link → Admin Login → /dashboard/)
- admin@commentcustomer.ai / Admin@2025!Demo
- fathi@commentcustomer.ai / Fathi@CSB2025!
- support@commentcustomer.ai / Support@2025!Demo
- Admins can optionally enable TOTP 2FA (RFC 6238). When enabled, login requires a 6-digit code from any authenticator app.

## Security Posture (server.cjs)
- DB-backed sessions (cc_sessions), HttpOnly + SameSite=Strict cookies; rotated on every login; max 3 concurrent per user; 24h idle expiry; killed on password reset.
- Account lockout: 5 failed logins → locked 15 minutes.
- Strong password policy: ≥10 chars + upper + lower + digit + symbol.
- Email verification required before login (token in cc_email_tokens, 24h TTL).
- Password reset via emailed token (15 min TTL, single-use, kills all sessions).
- Disposable-email blocklist; trial-IP limit (max 2 trials per IP per 24h).
- TOTP 2FA for admins (cc_admin_setup_2fa / cc_admin_enable_2fa / cc_admin_verify_2fa / cc_admin_disable_2fa).
- Real Stripe Checkout + signed webhook (activates when STRIPE_SECRET_KEY is set; otherwise simulated).
- Email outbox (cc_email_outbox) for audit; sendEmail() ready for SMTP/SendGrid drop-in.
- CSRF, multi-layer rate limit, strict CSP, HSTS in prod, X-Frame-Options=DENY, path-traversal guard, 1MB body cap.

## Distributed Readiness (Path B — PG-only, no new infra)
All critical state is in PostgreSQL → safe across N replicas:
- **Durable event bus:** `cc_event_outbox` + `outboxTick()` polling worker (1s, `FOR UPDATE SKIP LOCKED`, exp backoff, DLQ at 5 attempts). Replaces `setImmediate` fire-and-forget.
- **Shared rate limiter:** `cc_rate_buckets` keyed on `(bucket,key,window_start)` with atomic `INSERT … ON CONFLICT DO UPDATE`. Replaces in-memory Map.
- **Shared IDS:** `cc_ids_counters` + `cc_ip_bans` (PG-checked on every request). Replaces in-memory Maps.
- **Graceful shutdown:** SIGTERM/SIGINT → `server.close()` → `pool.end()` with 10s hard-kill safety net.
- **PG pool tuning:** `max:20, min:2, idleTimeoutMillis:30s, connectionTimeoutMillis:5s, statement_timeout:30s`.
- **Maintenance loop:** every 5 min — purges expired nonces, bans, rate buckets, IDS counters, done outbox >7d, expired sessions/email tokens.
- **New metrics:** `cc_outbox_enqueued/processed/failed_total`, `cc_outbox_pending_size`, `cc_outbox_dead_size`.

## Preview Server
`server.cjs` serves a static preview by processing PHP templates into HTML. Runs on port 5000.
- Landing page: `/`
- User Dashboard: `/user-dashboard/` (requires session)
- Admin Dashboard: `/dashboard/` (requires admin role + optional 2FA)
- Verify email: `/verify-email?token=…`
- Reset password: `/reset-password?token=…`
- Stripe webhook: `POST /api/stripe-webhook`
- Session info: `GET /api/me`

## Production Feature Flags (env vars)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER/GROWTH/PRO` — real Stripe
- `EMAIL_FROM` — switches sendEmail() from console-log to real delivery (SMTP integration is a one-line drop-in inside sendEmail)
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile CAPTCHA hook
- `REDIS_URL` — Redis-backed sessions/rate-limits (currently uses Postgres + in-memory; fine for single instance)
- `PUBLIC_URL` — base URL used inside email links

## WordPress Installation
1. Zip the `commentcustomer-developer/` folder
2. In WordPress admin: Appearance > Themes > Add New > Upload Theme
3. Upload the zip and activate
4. Theme auto-creates Home, Dashboard, and Login pages
5. Sets the static front page to Home automatically

## Deployment Targets
The same `server.cjs` runs in three modes (gated by `process.env.VERCEL`):

### Path A: Vercel (free Hobby tier) + Neon
- `vercel.json` — rewrite `/(.*) → /api/all`, includes `commentcustomer-developer/**`
- `api/all.cjs` — catch-all that calls `ensureInit()` then `requestHandler`
- `api/cron/outbox.cjs` — runs `outboxTick()` every 1 min
- `api/cron/maintenance.cjs` — runs `runMaintenanceOnce()` every 5 min
- Optional `CRON_SECRET` Bearer auth on cron endpoints
- Env vars to set in Vercel UI: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `PUBLIC_URL`

### Path B: Self-hosted VPS (~$5/mo Hetzner/DigitalOcean)
- `scripts/install.sh` — one-shot Ubuntu installer (Node 20, nginx, certbot, ufw, fail2ban, optional local Postgres, systemd unit, TLS)
- `scripts/commentcustomer.service` — hardened systemd unit (NoNewPrivileges, ProtectSystem=strict, MemoryMax=512M, auto-restart)
- `scripts/nginx.conf.example` — reverse proxy with `__DOMAIN__` placeholder, gzip, static asset caching, security headers
- `.env.example` — template of all env vars (copied to `/opt/commentcustomer/.env` mode 600)
- Workers (outbox + maintenance) run inside the same Node process — no external scheduler needed

### Path C: Replit (current dev mode)
- Workflow `Start application` → `node server.cjs` on port 5000
- Workers run as setInterval inside the process
- `.local/bootstrap-neon.cjs` — gitignored bootstrap script that creates all 13 cc_* tables + 19 indexes on a fresh Neon DB
