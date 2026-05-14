# Multi-Tenancy PRD — Decision Document
**Status:** DRAFT — needs your decisions before implementation
**Estimated implementation:** 2–3 days after decisions are made

---

## What "multi-tenancy" means here
Today, every account on CommentCustomer.ai is an **isolated user** with a single tier (trial/starter/growth/pro). Multi-tenancy would let **organizations** sign up, invite teammates, share a connected Facebook/Instagram page list, and centralize billing.

Without multi-tenancy:
- "Multi-Team Access" listed in the Pro tier is currently a UI-only feature with no backing schema
- Agencies managing 10+ clients can't onboard them under one umbrella

---

## Decisions YOU need to make

### Q1 — Tenant model
- [ ] **A. Soft-tenancy** — keep `cc_users` flat, add `cc_organizations` + `cc_org_members` tables. Each user can belong to N orgs. *(Recommended — least invasive)*
- [ ] **B. Hard-tenancy** — every row in every table gets `org_id`, RLS enforced at PG level. *(Most secure, biggest refactor)*
- [ ] **C. Sub-domain isolation** — `acme.commentcustomer.ai` per tenant. *(Most "enterprise-feeling", needs DNS automation)*

### Q2 — Billing model
- [ ] **A. One subscription per user** (today's model — keep)
- [ ] **B. One subscription per org, seats charged per member** (Stripe per-seat pricing)
- [ ] **C. Hybrid** — orgs pay base + per-seat; individual users still possible

### Q3 — Roles within an org
Suggest minimum: `owner`, `admin`, `member`, `viewer`. Customizable RBAC?
- [ ] **A. Fixed 4-role system** *(simpler)*
- [ ] **B. Custom roles** with granular permissions *(enterprise-grade)*

### Q4 — SSO requirements
- [ ] **A. Defer SSO** — email/password only for v1
- [ ] **B. SAML** (enterprise standard, complex)
- [ ] **C. OIDC via Google/Microsoft** (easier, covers 80% of demand)
- [ ] **D. SCIM** (auto-provision users from Okta/Azure AD)

### Q5 — Data isolation guarantee
- [ ] **A. Application-level** — every query filtered by `org_id` in code
- [ ] **B. Postgres RLS** — row-level security policies enforced by DB *(strongest)*
- [ ] **C. Schema-per-tenant** — separate Postgres schema per org *(strongest, ops overhead)*

### Q6 — Migration plan for existing users
- [ ] Auto-create a personal org for every existing `cc_users` row
- [ ] Existing user becomes owner of their personal org
- [ ] Existing subscription transfers to the personal org

---

## Schema sketch (Option A + B + B + C/A + B + ✅)
```sql
CREATE TABLE cc_organizations (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(64) UNIQUE NOT NULL,
    name         VARCHAR(255) NOT NULL,
    plan         VARCHAR(32) DEFAULT 'trial',
    seats        INTEGER DEFAULT 1,
    stripe_customer_id VARCHAR(64),
    stripe_subscription_id VARCHAR(64),
    sso_provider VARCHAR(32),     -- 'google' | 'azure' | 'saml' | NULL
    sso_config   JSONB,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cc_org_members (
    org_id       INTEGER REFERENCES cc_organizations(id) ON DELETE CASCADE,
    user_id      INTEGER REFERENCES cc_users(id) ON DELETE CASCADE,
    role         VARCHAR(32) NOT NULL,      -- 'owner' | 'admin' | 'member' | 'viewer'
    invited_by   INTEGER REFERENCES cc_users(id),
    invited_at   TIMESTAMP DEFAULT NOW(),
    accepted_at  TIMESTAMP,
    PRIMARY KEY (org_id, user_id)
);

CREATE TABLE cc_org_invites (
    token        VARCHAR(64) PRIMARY KEY,
    org_id       INTEGER REFERENCES cc_organizations(id) ON DELETE CASCADE,
    email        VARCHAR(255) NOT NULL,
    role         VARCHAR(32) NOT NULL,
    invited_by   INTEGER REFERENCES cc_users(id),
    expires_at   TIMESTAMP NOT NULL,
    accepted     BOOLEAN DEFAULT FALSE
);

-- Add org_id to all tenant-owned tables
ALTER TABLE cc_audit_log ADD COLUMN org_id INTEGER REFERENCES cc_organizations(id);
-- ...repeat for cc_api_keys, cc_email_outbox, cc_event_outbox, etc.

-- Optional: enable RLS
ALTER TABLE cc_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON cc_audit_log
  USING (org_id = current_setting('app.current_org_id')::int);
```

---

## Effort estimate by option
| Option Set | Effort | Risk |
|---|---|---|
| A1 + A2 + A3 + A4 (no SSO) + A5 + ✅ | **2 days** | LOW |
| B1 + B2 + B3 + C4 (OIDC) + B5 + ✅ | **3–4 days** | MEDIUM |
| C1 + B2 + B3 + B4 (SAML) + C5 + ✅ | **2 weeks** | HIGH (enterprise-grade) |

---

## My recommendation
**Start with `A1 + B2 + A3 + C4 + B5`:**
- Soft tenancy (orgs are an overlay, not a refactor)
- Per-seat billing (industry standard)
- Fixed 4 roles (owner/admin/member/viewer)
- Google + Microsoft OIDC (covers 80% of B2B demand)
- Postgres RLS (strongest data isolation, minimal code change)

This positions you for enterprise sales without bogging down v1.

---

## Action required from you
Reply with your choices for Q1–Q6 (or just "use your recommendation"), and I'll implement it as a separate task.
