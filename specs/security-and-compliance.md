
# Tenet Security & Compliance Specification

**File:** `security-and-compliance.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Provide a full security, privacy, compliance, and governance blueprint for a production-grade deployment of Tenet.  
This file guides both **Codex implementation** and **organizational policy**.

---

# 0. Security Principles

Tenet is a **cognitive telecom system** — meaning it processes sensitive business information across hubs (Finance, Growth, People, Ops).  
Security must follow:

1. **Zero Trust by default**  
2. **Least privilege** (agent, user, model access)  
3. **End-to-end encryption**  
4. **Separation of duties** (routing, execution, storage)  
5. **Explainability + auditability** as first-class features  
6. **Configurable data residency**  
7. **Model safety & data minimization**  
8. **Full lifecycle governance** (intake → routing → execution → storage → deletion/retention)

---

# 1. Architecture-Level Safeguards

## 1.1 Network Segmentation

Tenet runs as multi-tier architecture:

- **Public API Layer**
- **Routing Engine (Core)**
- **Agent Service**
- **Model Gateway**
- **Supabase/Postgres**
- **Vector DB (Embeddings)**
- **Storage (blobs, temp files)**

Each layer has isolated access rules:

- Routing Engine can access SOP/Agent tables but **not raw memory embeddings** directly.
- Agents can read/write memory but cannot modify SOP definitions.
- API cannot directly call LLMs — must go through Routing Engine → Agent → Model Gateway.

---

## 1.2 Encryption

| Layer | Encryption | Notes |
|-------|------------|-------|
| In transit | TLS 1.2+ | API, internal services, model calls |
| At rest (DB) | AES-256 | Supabase/Postgres encryption |
| At rest (Blob storage) | AES-256 | For files, SOP docs, exports |
| Vector embeddings | AES-256 | Only semantic data, no raw sensitive text |
| Secrets | KMS/HSM | Rotated every 30 or 90 days |

**Sensitive attributes** (financial, HR, personal data) should use optional **field-level encryption** via Supabase pgcrypto.

---

## 1.3 Authentication

**Primary methods:**
- Google Workspace SSO
- Email/password with 2FA
- API key (for programmatic access)

Technical:

- JWTs signed with rotating keys
- Tokens expire every 1 hour
- Refresh tokens are hashed and stored server-side

---

## 1.4 Authorization (RBAC / ABAC)

Roles:

| Role | Permission Scope |
|------|------------------|
| Org Admin | Full access, configure hubs, create agents/SOPs |
| Hub Owner | Manage SOPs, agents, memory within hub |
| Contributor | Execute commands, view results |
| Viewer | Read-only access to traces, dashboards |
| API Consumer | Programmatic access only |

Rules:

- Users can ONLY access hubs they explicitly belong to.
- Agents are scoped to a hub — an agent in Finance cannot read People data.
- SOPs can be cross-hub, but only with explicit linking + audit logs.

---

# 2. Data Governance

## 2.1 Data Classes

### **Class A — Highly Sensitive**
- Financial records
- HR data (employees, payroll)
- Contracts, invoices
- Customer PII

### **Class B — Sensitive**
- SOP definitions
- Agent configs
- Internal prompts

### **Class C — Operational**
- Routing decisions
- Logs
- Usage data
- Embeddings (derived)

### **Class D — Non-sensitive**
- UI metadata
- Configurations
- Static docs

**Different classes use different retention rules.**

---

## 2.2 Data Minimization

Tenet follows:

- **No raw financial/PII data stored in embeddings**
- **No unnecessary caching** at the model gateway
- **No long-term logs containing sensitive content**
- **Optional ephemeral mode** for high-security clients

---

## 2.3 Data Residency

Supported strategies:

1. **Global default (US-based)**  
2. **EU residency (GDPR)**  
3. **Client-specific Postgres instance**  
4. **Strict partitioning:** each org gets separate schemas at minimum

---

## 2.4 Data Retention & Deletion

Retention defaults:

| Data Type | Default Retention | Deletion Capability |
|----------|-------------------|----------------------|
| Requests | 30–180 days | per-request delete |
| Execution logs | 30–180 days | org-level or hub-level purge |
| Memory | Indefinite | item-level delete |
| SOPs | Indefinite | versioned, but deletable |
| Agents | Indefinite | deletable |

External compliance (GDPR/CCPA):

- Right to be forgotten → delete all memory + logs for relevant PII/hub.

---

# 3. LLM Safety & Model Security

## 3.1 Model Gateway Controls

The model gateway enforces:

1. **Data trimming**: remove unnecessary fields before sending to model.
2. **Redaction** rules:
   - Strip PII unless SOP explicitly requires it.
   - Clip values to prevent prompt injection.
3. **Model selection policies**:
   - Only allow approved models per hub.
   - High-sensitivity hubs (Finance/People) must use vetted models.
4. **Rate limiting**: per org, per hub, per QoS tier.

---

## 3.2 Prompt Injection Protection

Techniques:

- Strict system prompts pre-pended by Model Gateway (cannot be modified).
- Escape all user-provided content as structured objects.
- Input sanitization:
  - Remove suspicious control tokens
  - Ensure no override instructions (“ignore previous instructions”)
- Validation of LLM output:
  - Must be valid JSON for structured tasks
  - Must match SOP schema

---

## 3.3 Hallucination & Output Safety

Agents must implement the following:

- **Confidence scoring**: fallback when confidence low
- **Validation phases**: SOP `validate` steps must always run
- **Fallback logic**:
  - If model output fails schema validation, retry with clarifying prompt
  - Flag risky outputs for human review

---

# 4. Observability & Audit Trails

## 4.1 What must be logged

Every request must produce:

- Timestamps (start, end)
- User ID (or API key)
- Hub
- Intent
- SOP key
- Agent used
- Model used
- QoS tier
- Tokens used
- Latency
- Step-by-step execution logs
- Error events or retries

No raw input should appear in logs unless explicitly allowed by admin.

---

## 4.2 Trace Viewer Requirements (UI)

The Trace Viewer must:

- Provide a complete chain-of-custody
- Show routing decisions
- Show SOP step results
- Redact sensitive values based on role
- Allow export for compliance audits

---

# 5. Compliance Frameworks

Tenet must support compliance alignment for:

### Core Standards (MVP)
- **SOC 2 Type I & II**
- **GDPR**
- **CCPA**
- **PCI-DSS (partial, if dealing with payments)**

### Optional/Advanced
- **HIPAA** (for health entities)
- **ISO 27001**
- **FedRAMP Moderate** (future government clients)

---

## 5.1 SOC 2 Mapping

| SOC 2 Principle | How Tenet Satisfies |
|-----------------|----------------------|
| Security | RBAC, logs, encryption, isolation |
| Availability | Multi-region failover, SLAs |
| Confidentiality | Encryption + data minimization |
| Processing Integrity | SOP validation + routing trace |
| Privacy | Data retention + deletion policies |

---

## 5.2 GDPR Mapping

| Requirement | How Tenet Satisfies |
|------------|----------------------|
| Data portability | Export request history |
| Right to be forgotten | Delete memory + logs per user/entity |
| Consent | SSO/OAuth flows |
| Data residency | EU region deployment |
| Minimization | No raw PII in non-sensitive logs |

---

# 6. Secure Development Guidelines

### Required practices:

- TypeScript everywhere  
- zod schema validation for every endpoint  
- API rate limiting  
- OWASP scanning in CI  
- SAST (Static Analysis) and DAST  
- No embedding of secrets in client code  
- Hash API keys using `bcrypt` or `argon2`  

### Branch policies:

- PRs require:
  - unit tests
  - security review
  - schema review
  - no failing lint/type errors

---

# 7. Incident Response

### Steps:

1. **Detect** anomaly from logs or monitoring  
2. **Classify** severity  
3. **Contain** (disable affected hub/agent)  
4. **Eradicate** (rotate keys, block IPs)  
5. **Recover** (restart affected services)  
6. **Review + Improve** (updated SOPs/policies)  

### Notification Obligations:

- Notify affected org admins within **72 hours**
- For regulated orgs (EU), may require 48-hour notices

---

# 8. Example Threat Model

| Threat | Mitigation |
|--------|------------|
| Prompt injection | Sanitization, schema validation, system prompt overrides |
| Multi-tenant data leakage | Strong RLS, tenant isolation |
| Agent mis-execution | SOP validation, trace viewer |
| LLM hallucination | Confidence scoring, fallback prompts |
| Rogue admin or compromised account | MFA, audit logs, session expiry |
| Data exfiltration via embeddings | Redaction, limits on sensitive fields |
| DoS via large requests | Token limits + rate limiting |

---

# 9. Source of Truth

- Data models → `data-model.md`
- APIs → `api-spec.md`
- Routing → `routing-engine-spec.md`
- Agents & SOPs → `agents-and-sops-spec.md`
- UX → `ux-flows.md`
- Security → **this file**

This completes the full **Tenet Security & Compliance specification** for a production-ready Cognitive Telecom system.

