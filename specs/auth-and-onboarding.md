
# Tenet Auth & Org Onboarding Specification

**File:** `auth-and-onboarding.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define how **authentication**, **organization membership**, and **first-time onboarding** work in Tenet so that:

- RLS and multi-tenant isolation are enforceable
- New customers can self-serve into Tenet
- You can invite teammates and control access to Hubs (Finance, Growth, etc.)

This spec is the source of truth for:

- Auth stack & JWT contents  
- Org/user data model  
- Onboarding & invite flows  
- UI states and edge cases  

---

## 0. Principles

1. **Org-first**  
   Every user operates *in the context of an organization*. No “orphan” users in prod.

2. **One identity, many orgs (future-ready)**  
   A single email can belong to multiple orgs over time, but v0 can assume **one primary org** per user to simplify UX.

3. **Least privilege**  
   Roles and hub memberships control what a user can see/do:
   - Org Admin
   - Hub Owner
   - Member
   - Viewer

4. **RLS alignment**  
   Whatever we put in the JWT must map cleanly to RLS policies in Postgres/Supabase.

5. **Simple first-run experience**  
   Brand new environment:
   - Create org
   - Create first admin
   - Seed demo finance flows (driven by `seed-data.md`)

---

## 1. Auth Stack

### 1.1 Primary Auth Provider

v0: **Supabase Auth** (email/password + magic link), with option to add Google SSO later.

- Supabase manages:
  - Users table (`auth.users`)
  - Email verification
  - Password reset
- Tenet app uses:
  - Supabase JS client (frontend)
  - JWTs emitted by Supabase for RLS (`auth.jwt()` in Postgres)

### 1.2 Supported Auth Methods (v0)

- Email + password
- Magic link login (optional; can be toggled)
- Google SSO (later)

### 1.3 JWT Contents

We extend Supabase JWT with custom claims via a Postgres function to include:

```jsonc
{
  "sub": "<supabase_user_id>",
  "email": "demo.admin@tenet.local",
  "org_id": "<uuid of organization>",
  "roles": ["org_admin", "finance_member"],
  "hubs": ["finance", "growth"]  // optional, for RLS convenience
}
Implementation detail:
Use Supabase’s “JWT custom claims” feature:


A Postgres function auth.jwt() that returns a JSON with org_id, roles, hubs based on user_org_memberships and hub_memberships tables.



2. Org & User Data Model
2.1 Core Tables (Logical)
(Exact columns defined in data-model.md; here is the conceptual model.)
organizations
id (uuid, PK)


name


slug (unique)


created_at


created_by_user_id


users
Supabase’s auth.users table is the identity source. Tenet may have an internal app_users table for metadata:
id (uuid, PK, matches auth.users.id)


primary_org_id (nullable; strongly recommended to set)


display_name


avatar_url


created_at


user_org_memberships
id


user_id


org_id


role enum:


org_admin


hub_owner


member


viewer


status:


active


invited


disabled


hubs
id


org_id


key (finance, growth, people, ops)


name


description


is_active


hub_memberships (optional in v0; or we infer from role)
id


hub_id


user_id


role:


hub_owner


member


viewer



3. High-Level Flows
Tenet supports four main flows:
Environment bootstrap (first ever org + admin)


Self-serve signup → create org


Invite user to existing org


User accepts invite → join org



4. Flow 1 – Environment Bootstrap
Purpose: for a brand new deployment (local/staging/prod), create:
First org


First admin user


Seed data


4.1 Bootstrap Script
scripts/seed.ts (see seed-data.md) should:


Create Tenet Demo Corp org (idempotent).


Create Supabase user demo.admin@tenet.local (if not exists).


Create user_org_memberships record:


user_id = demo-admin-id


org_id = demo-org-id


role = 'org_admin'


status = 'active'


Set app_users.primary_org_id for this user.


4.2 First Login (Demo Admin)
Demo Admin logs in via Supabase.


JWT gains org_id + roles=["org_admin"].


Frontend sees there’s exactly one org membership → auto-select it.


User is taken directly to:


Onboarding checklist or


Finance Hub / Command Console with seeded data.



5. Flow 2 – Self-Serve Signup → Create Org
This is the main SaaS-style onboarding.
5.1 UI: Sign Up Screen
Route: /auth/signup
Fields:
Email


Password


Full name


Org name


(Optional) Subdomain/slug


Behavior:
Call Supabase signUp({ email, password }).


On success:


Create app_users record for auth.users.id.


Create new organizations row:


name = orgName


slug = sanitized(orgName) or user-provided.


Create user_org_memberships:


role = 'org_admin'


status = 'active'


Set app_users.primary_org_id.


Supabase may require email confirmation (configurable):


If email confirmation ON:


Show “Check your email to confirm your account.”


After confirmation, user logs in → we detect org membership and proceed.


If OFF (for local testing), redirect immediately.


5.2 Post-Signup Onboarding Steps
After first log-in:
Org context set


Use org_id from JWT or user_org_memberships to pick current org.


First-run wizard (optional but recommended):


Step 1: Confirm org name & hub choices (Finance on by default).


Step 2: Invite colleagues (optional).


Step 3: Jump into Finance Hub console with a short guided tour.



6. Flow 3 – Invite User to Existing Org
Only org_admin (and optionally hub_owner) can invite new users.
6.1 UI: Org Members Page
Route: /settings/members
Components:
Table listing:


Email


Role


Status (Active / Invited / Disabled)


Hubs


“Invite member” button.


6.2 Invite Modal
Fields:
Email


Org role:


org_admin


member


viewer


Optional: Hub access toggles:


Finance / Growth / People / Ops


Behavior:
Create or update user_org_memberships row:


If user exists (by email):
  Create membership with status 'invited'
Else:
  Create a placeholder membership record with status 'invited' and a null user_id + pending_email

(Implementation detail: you can either store pending_email or require user creation on invite acceptance; choose simplest consistent approach.)


Generate an invite token row:

 Table: org_invites


id (uuid)


org_id


email


role


hubs (JSON array of hub keys)


status (pending, accepted, expired)


expires_at (e.g., 7 days)


Send invite email (v0: just log + show link in UI):


Invite link: ${APP_URL}/auth/invite?token=<invite-id>



7. Flow 4 – Accept Invite & Join Org
7.1 User Clicks Invite Link
Route: /auth/invite?token=<id>
Backend:
Lookup org_invites by id.


Validate:


Invite exists


Status = pending


Not expired


7.2 Branch: User Has Existing Account?
Case A: User is not logged in
Show combined:


“Create account to join {Org Name}”


Fields:


Email (prefilled, read-only)


Password


Full name


On submit:


Sign up via Supabase.


Create app_users row.


Create user_org_memberships:


With user_id


role & status = 'active'


Set org_invites.status = 'accepted'.


Case B: User is logged in
Ensure auth.users.email matches invite email (or allow override with warning if you want advanced behavior).


Show confirmation screen:


“Join {Org Name} as {role}?”


On confirm:


Create user_org_memberships with status = 'active'.


Mark invite as accepted.


7.3 Post-Acceptance Redirect
Set current org context to this org.


Redirect to:


/console (Command Console) for members


or /hubs/finance if they’re finance-only.



8. Org Context & Switching
Even if v0 is “one user → one org”, it’s worth planning multi-org.
8.1 Current Org Resolution
On every request, we determine current org from:


URL query or subdomain (future): tenantSlug.tenet.app


Local storage / user preference


Fallback: first active membership


Frontend sets X-Tenet-Org-Id header in API calls if needed.


Backend ignores any org_id claims that don’t match JWT or RLS rules.


8.2 Org Switching UI
Top-right menu:


“Switch Org” dropdown listing organizations where user is active.


On switch:


Update local state and call an endpoint if needed to re-issue JWT with updated org_id claim (depending on how Supabase custom claims are wired).



9. Roles, Permissions, and Hubs
Roles define capabilities; Hubs define scope.
9.1 Org-Level Roles
org_admin:


Manage org settings


Manage members


Enable/disable hubs


Create/edit SOPs and Agents


View usage & billing


hub_owner:


Manage SOPs & agents in specific hubs


View routing traces for those hubs


member:


Use Command Console


Run SOPs & avail agents


View traces for own requests


viewer:


View dashboards & traces (read-only)


Mapping to RLS:
Org-level checks: org_id = jwt.org_id.


Hub-level checks: user must have membership or role that includes that hub_id.


9.2 Hub Access
For simplicity in v0:
org_admin has access to all hubs.


member has access to all active hubs (or use hub_memberships table).


Later:


Add granular per-hub memberships.



10. RLS Policies & JWT Mapping (High-Level)
RLS examples (pseudo-SQL):
-- Example: tenet_requests
ALTER TABLE tenet_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON tenet_requests
  USING (org_id = auth.jwt()->>'org_id');

-- Example: sops (org-specific)
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_sops ON sops
  USING (org_id = auth.jwt()->>'org_id');
Optional: per-hub restriction:
-- If you put hub keys in JWT (e.g. 'hubs' claim)
CREATE POLICY hub_restriction ON tenet_requests
  USING (
    hub_key = ANY( string_to_array(auth.jwt()->>'hubs', ',') )
  );
Actual implementation details live in security-and-compliance.md; this file ensures the auth + onboarding flows produce the right data and claims.

11. UI States & Edge Cases
11.1 Email Not Verified (if enabled)
If user logs in but email isn’t verified:


Block access to app.


Show screen:


“Please verify your email to continue. [Resend verification link]”


11.2 No Org Membership
If a logged-in user has no active user_org_memberships:


Path A (allowed): Prompt “Create a new organization”.


Path B (strict SaaS): Show “You have no orgs – please contact your admin or accept an invite”.


For v0, we can allow:
If email ends with @tenet.local or a dev domain → always show “Create org” button.


For real prod: possibly restrict creating orgs to certain flows.


11.3 Disabled Membership
If membership status is disabled:


User can log in for identity, but block access to that org.


Show “Your access to this organization has been disabled.”


11.4 Multiple Org Memberships (Future)
On login:


If multiple active memberships:


Show “Choose an organization” screen.


Or infer from subdomain: orgslug.tenet.app.



12. Where This Connects
This auth/onboarding spec ties into:
data-model.md


organizations, users, user_org_memberships, hubs, etc.


security-and-compliance.md


RLS, JWT custom claims, RBAC.


ux-flows.md


Login, settings, and basic navigation states.


seed-data.md


Demo org + admin + seed users.


deployment-and-env.md & infra/README.md


How Supabase/auth is configured per environment.


Together, they give Codex/engineers enough detail to:
Implement Supabase Auth integration


Wire org + user data flows


Build self-serve org creation


Support invites and hub-based access


Enforce tenant isolation via JWT + RLS




