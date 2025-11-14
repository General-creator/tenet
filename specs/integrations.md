
# Tenet Integrations Specification

**File:** `integrations.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define how Tenet integrates with external systems (email, accounting, chat, etc.), what is **in-scope for v0**, how data flows, and what safety/abstraction rules apply.

This is the source of truth for:

- Which integrations exist
- What each integration can and cannot do (by phase)
- How agents/SOPs *ask* for integrations (without coupling to vendor specifics)
- How credentials and tenants are isolated

---

# 0. Integration Principles

Tenet is a **cognitive telecom fabric**, not a point-to-point automation tool.

Integrations must follow:

1. **Abstraction first**  
   - Tenet speaks in **capabilities** (`send_email`, `create_invoice_record`) not vendor APIs (Gmail, QuickBooks, Slack).

2. **Read-mostly in v0**  
   - Action side-effects are **log-only or draft-only** initially:
     - Draft emails (not auto-send)
     - Prepared invoice records (not auto-post)
     - Suggested messages (not auto-Slack)

3. **Least privilege & tenant isolation**  
   - Each org’s integration credentials are:
     - Scoped to the org.
     - Stored encrypted.
     - Limited to required scopes (no “kitchen sink” OAuth).

4. **Agent-independence**  
   - Agents do not hardcode API calls.  
   - They call internal **integration abstractions** so vendor choice can change.

5. **Explainability**  
   - Every action via a third-party must:
     - Be visible in a log / trace.
     - Be replayable / inspectable.
     - Be reversible where possible (e.g., don’t auto-delete things).

---

# 1. Integration Layers

We treat integrations as a separate “plane”:

1. **Agent/SOP Layer**  
   - Decides *what* to do: “record invoice”, “draft AR email”, “log event”.

2. **Integration Orchestrator**  
   - Maps abstract actions to concrete integration calls.
   - Handles tenant config, retries, error mapping.

3. **Provider Adapters**  
   - Vendor-specific clients:
     - Gmail/SMTP
     - QuickBooks
     - Slack
     - (future) Teams, HubSpot, etc.

4. **Audit & Logs**  
   - Logs every external call, per org, per user, per request.

---

# 2. v0 Scope vs Later Phases

## 2.1 v0 (MVP) — “Safe Demo Mode”

- **Email**:  
  - Send *drafts* only:
    - Either:
      - a) send to *internal* address (e.g. finance@tenet.demo)  
      - or b) render in UI for copy-paste.
- **Accounting (QuickBooks)**:
  - Prepare structured invoice objects, but:
    - Do **not** directly hit the QuickBooks API in v0.
    - Store `qb_payload_preview` in Tenet only.
- **Chat (Slack/Teams)**:
  - Generate message drafts only.
  - Show them in UI / logs, not auto-send.
- **Calendars**:
  - Generate `.ics` files or calendar event objects.
  - No auto-insert into calendars yet.

> v0 focus: **prove routing + SOP + explainability** with “soft integrations”.

---

## 2.2 v0.5+ — Controlled Write Integrations

Once core flows are stable:

- Email:  
  - Controlled send for:
    - AR collection emails (with human approve button).
- QuickBooks / accounting:
  - Create invoices or bills via API (with audit log + dry-run preview).
- Slack:
  - Post to configurable channels (e.g., `#finance-ar`) with clear attribution (“Tenet”).

## 2.3 v1+ — Bi-directional Sync

- Incremental sync of:
  - Chart of accounts
  - Customer/vendor lists
  - Invoice/payment status
- Webhook ingestion:
  - Push updates back into Tenet’s memory layer.

---

# 3. Abstract Capabilities

Tenet agents never call “Gmail” or “QuickBooks” directly. They call **abstract capabilities**:

## 3.1 Email Capability

Abstract method:

```ts
interface SendEmailDraftInput {
  orgId: string;
  hubId?: string;
  to: string[];
  cc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  metadata?: Record<string, unknown>;
}

interface SendEmailDraftResult {
  status: 'draft_stored' | 'sent' | 'failed';
  provider?: 'smtp' | 'gmail_api' | 'sendgrid';
  providerMessageId?: string;
  error?: string;
}
v0 behavior:
Always status: 'draft_stored'


Draft stored in Tenet’s DB and/or displayed in UI (no real send).


Future:
With org-level config: upgrade to actual send with human approval.



3.2 Accounting / Ledger Capability
Abstract method (v0):
interface CreateInvoiceDraftInput {
  orgId: string;
  hubId?: string;
  customerName: string;
  amount: number;
  currency?: string;
  invoiceDate: string;
  dueDate?: string;
  externalRef?: string; // e.g. invoice number
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  metadata?: Record<string, unknown>;
}

interface CreateInvoiceDraftResult {
  status: 'draft_stored' | 'pushed' | 'failed';
  system?: 'quickbooks' | 'xero' | 'netsuite';
  externalId?: string;          // e.g. QuickBooks Invoice Id
  previewPayload?: unknown;     // JSON payload that would be posted
  error?: string;
}
v0 behavior:
Only status: 'draft_stored', with previewPayload generated but not sent.



3.3 Chat / Notifications Capability
Abstract “notification intent”:
interface NotifyChannelInput {
  orgId: string;
  hubId?: string;
  channelType: 'log' | 'email' | 'slack' | 'teams';
  channelId?: string; // e.g. Slack channel id
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

interface NotifyChannelResult {
  status: 'logged' | 'sent' | 'failed';
  provider?: 'slack' | 'teams';
  externalId?: string;
  error?: string;
}
v0 behavior:
For channelType='log':


Store in execution_logs / notifications table only.


For others:


Still status: 'logged' with just a preview (not actually sent).



3.4 Calendar Capability
Abstract method:
interface CreateCalendarEventDraftInput {
  orgId: string;
  title: string;
  description?: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  attendees?: string[];
  location?: string;
  metadata?: Record<string, unknown>;
}

interface CreateCalendarEventDraftResult {
  status: 'draft_stored' | 'sent' | 'failed';
  icsContent?: string;
  error?: string;
}
v0 behavior:
Generate .ics content and:


Attach it to a draft email, or


Make it downloadable in the UI.



4. Provider-Specific Adapters
Each external system lives behind an adapter implementing the relevant interface.
4.1 Email Providers
Initial provider: SMTP via Gmail (org’s Google Workspace account).
Adapter signature:
interface EmailProvider {
  sendEmail(input: SendEmailDraftInput): Promise<SendEmailDraftResult>;
}
v0: implement but only use in staging/local or behind a feature flag (ENABLE_REAL_EMAIL=false).
Config fields per org:
interface OrgEmailConfig {
  provider: 'smtp';
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPasswordRef: string; // reference to secret store
  defaultFrom: string;
}

4.2 Accounting Providers
Target: QuickBooks Online (later Xero, others).
Adapter signature:
interface AccountingProvider {
  createInvoice(input: CreateInvoiceDraftInput): Promise<CreateInvoiceDraftResult>;
}
Per-org config:
interface OrgAccountingConfig {
  provider: 'quickbooks';
  realmId: string;
  clientIdRef: string;
  clientSecretRef: string;
  refreshTokenRef: string;
  defaultAccountMappings?: Record<string, string>; // e.g. "AP" -> "Accounts Payable"
}
v0 behavior:
Build previewPayload that matches QuickBooks Invoice schema.


Do not call QuickBooks.



4.3 Slack / Teams
Adapter signature:
interface ChatProvider {
  sendMessage(input: {
    channelId: string;
    text: string;
    blocks?: unknown;
  }): Promise<{ status: 'sent' | 'failed'; externalId?: string; error?: string }>;
}
Per-org config:
interface OrgChatConfig {
  provider: 'slack';
  botTokenRef: string;
  defaultChannelId?: string;
}
v0: not actually used, but adapter defined for future.

5. Credential & Secret Management
All provider credentials:
Stored in secret manager or Supabase secrets.


Referenced via *_Ref (indirect pointers) in org config.


Rules:
No creds in code or plain DB columns.


Each org has separate config rows:


org_integrations table:


org_id


type (email, accounting, chat, calendar)


provider (smtp, quickbooks, slack, etc.)


config (JSON with references to secrets).


Rotation:


If a secret changes, config references remain stable.


Service reads latest secret at runtime or via refresh.



6. SOP & Agent Integration Usage
Agents never call providers directly. They:
Follow SOP steps:


execute with action like record_invoice, generate_collection_email, send_notification.


For each execute step, the Agent Service:


Maps action → abstract capability.


Calls Integration Orchestrator with structured data.


Integration Orchestrator:


Looks up org’s integration config.


Calls appropriate provider adapter (or log-only fallback).


Returns a structured result to Agent Service.


Example:
SOP step:


{
  "id": 3,
  "type": "execute",
  "action": "record_invoice",
  "config": {
    "targetSystem": "quickbooks",
    "glAccount": "accounts_payable"
  }
}

Agent Service logic:


if (step.action === 'record_invoice') {
  const result = await accountingOrchestrator.createInvoiceDraft({
    orgId,
    customerName,
    amount,
    invoiceDate,
    dueDate,
    // ...
  });

  logStepResult(result);
}

7. Logging & Auditing for Integrations
For every integration call, log:
orgId


hubId


requestId


provider + capability (e.g., email.send, accounting.createInvoice)


direction (outbound)


status (success/failed/draft)


timestamp


Non-sensitive subset of payload (e.g., amounts, vendor name).


Do not log:
Access tokens


API keys


Full message bodies with sensitive data, unless required and encrypted.


Logs feed into:
Routing Trace Viewer (per request)


Org-level audit logs (future)



8. Feature Flags & Safety
Integration features must be controlled via feature flags:
Examples:
interface IntegrationFeatureFlags {
  enableRealEmail: boolean;
  enableAccountingWrites: boolean;
  enableSlackPosts: boolean;
}
Default for v0:
enableRealEmail = false


enableAccountingWrites = false


enableSlackPosts = false


Flags can be set:
Globally per environment (local/staging vs prod).


Per org (e.g., pilot customers).



9. Tables & Config (Data Model Hook)
This spec plugs into data-model.md via:
org_integrations table (per org, per integration type).


integration_logs table (each call).


Possibly notification_events (for generic notifications).


Exact schemas should be defined/extended in data-model.md when implementing.

10. Source of Truth
Overall architecture → architecture.md


Data shape & tables → data-model.md


API surface → api-spec.md


Routing → routing-engine-spec.md


Agents & SOPs → agents-and-sops-spec.md


Prompts → prompts-and-ai-config.md


Security → security-and-compliance.md


Deployment/infra → deployment-and-env.md, infra/README.md


Seed/demo content → seed-data.md


Integrations → this file


This completes the initial Tenet Integrations Specification, with a clear v0-safe mode and path to richer, bi-directional integrations later.


