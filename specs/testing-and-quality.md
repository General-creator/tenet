
# Tenet Testing & Quality Specification

**File:** `testing-and-quality.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define the testing philosophy, quality standards, coverage strategy, environments, and CI/CD gates required to ship Tenet as a production-grade cognitive telecom system.

Tenet is a **mission-critical network** that handles sensitive financial/operational workflows.  
Testing must therefore ensure:

- determinism in routing  
- correctness of SOP execution  
- auditability of every step  
- safety of agent behavior  
- reliability under load  

This document defines **what must be tested, how, and where**.

---

# 0. Quality Principles

1. **Safety first**  
   No model output enters a system of record without validation.

2. **Deterministic routing**  
   The same request → same hub + SOP + agent + model.

3. **Explainability as a test artifact**  
   Every decision must be traceable and validated.

4. **Modern testing pyramid**  
   - 60% **unit tests**  
   - 30% **integration tests**  
   - 10% **E2E tests**  

5. **Continuous verification**  
   - Every PR → run full unit + integration test suite  
   - Staging environment → run E2E + load tests nightly  

---

# 1. Test Coverage Map

Tenet requires testing across **6 subsystems**:

1. **Data layer (DB + models)**  
2. **Routing Engine**  
3. **Agent Service**  
4. **Model Gateway**  
5. **API Layer**  
6. **Frontend UI**

And **4 cross-cutting domains**:

- Security tests  
- Performance tests  
- LLM evaluations  
- Compliance tests  

---

# 2. Testing Environments

| Environment | Purpose | Data | LLMs |
|-------------|---------|------|------|
| **Local** | Development | Seed/test data | Mock or sandbox models |
| **CI** | Automated tests | Ephemeral DB | Mock + lightweight real calls (rate-limited) |
| **Staging** | Pre-production validation | Mirrored production schemas | Full model access |
| **Production** | Live traffic | Real data | Real model routing |

---

# 3. Unit Testing

Unit tests MUST cover:

## 3.1 Routing Engine Units
- Hub resolution  
- SOP resolution  
- Agent selection  
- Model selection  
- QoS logic  
- Budget validation  
- Error handling cases

**Example:**  
- Given an invoice request, routing must choose:
  - Finance Hub  
  - AP SOP  
  - AP Agent  
  - Default model  

## 3.2 SOP Step Execution Units
For each step type:
- `extract_fields`
- `validate`
- `execute`
- `route`
- `notify`

Test inputs → expected outputs (mocked).

## 3.3 Intent Classification (Mocked)
- Mapping input → IntentObject  

## 3.4 Data Models
- Schema validation for:
  - `CognitiveRequest`
  - `RoutingDecision`
  - `ExecutionResult`

## 3.5 Security Units
- Permission/role checks  
- API key hashing  
- Input validation / schema guards (zod)  

---

# 4. Integration Testing

Integration tests validate **subsystem-to-subsystem** interactions.

## 4.1 Routing Engine ↔ Database
Tests:
- SOP lookup  
- Agent lookup  
- Graph node lookup  
- RLS enforcement  

## 4.2 Routing Engine ↔ Agent Service
- Routing decision is correctly passed into agent  
- Agent returns structured output  
- Logs are persisted  

## 4.3 Agent Service ↔ Model Gateway
- System prompt applied  
- Safety filters applied  
- Output validated against schema  

## 4.4 API ↔ DB (Supabase)
- CRUD for SOPs  
- CRUD for agents  
- Request lifecycle:
  - pending → in_progress → completed  

## 4.5 Memory System
- Create memory  
- Query memory  
- Delete memory  
- RLS security validation  

---

# 5. End-to-End Testing (E2E)

E2E tests simulate **real workflows**.

Tools:  
- Playwright (preferred) or Cypress

## 5.1 Core E2E Workflows

### Workflow A: Process Invoice
1. User enters invoice text in console  
2. Routing triggers Finance/AP SOP  
3. Agent extracts fields  
4. Result returned  
5. Trace matches expected SOP steps  

### Workflow B: AR Follow-up
1. User asks Tenet to “send overdue email”  
2. Routing → AR SOP  
3. Email draft generated  
4. Notification logged  

### Workflow C: Month-End Close
1. User runs “close month”  
2. SOP triggers nested SOPs  
3. Agent orchestrates checklist  
4. Summary returned  

### Workflow D: SOP/Agent Management
- Create new SOP  
- Assign agent  
- Run via console  

### Workflow E: Permissions / Access Controls
- User A (Finance only) → allowed  
- User B (Ops only) → forbidden  

---

# 6. LLM Evaluation Testing

LLM behavior must be **validated regularly** because models update.

Tenet uses 3 forms of LLM evals:

## 6.1 Schema Validation Checks
For each SOP:
- LLM output must match expected structure  
- Missing fields → fail test  
- Invalid types → fail test  

## 6.2 Regression Tests
Snapshot-based:
- Feed known prompts  
- Validate routing + agent outputs  
- Ensure no “silent drift”

## 6.3 Performance Benchmarks
Monthly:
- Latency  
- Token usage  
- Accuracy in extraction/validation  
- Cost-per-task  

---

# 7. Load & Performance Testing

Tools:  
- k6  
- Locust  
- Artillery  

## 7.1 Routing Engine Load Tests
Simulate:
- 1K requests/sec  
- Verify:
  - Latency < 50ms for routing  
  - No hub misclassification  

## 7.2 Model Gateway Backpressure Tests
- Throttle burst traffic  
- Ensure graceful degradation  
- Fallback to cheaper/faster models if needed  

## 7.3 DB Stress Tests
- High throughput on:
  - `tenet_requests`  
  - `routing_decisions`  
  - `execution_logs`  

## 7.4 Memory Query Load
- Vector search under load  
- Latency < 200ms  

---

# 8. Security Testing

## 8.1 Automated Scans
- OWASP ZAP  
- SAST (ESLint + TypeScript checks)  
- DAST in CI  

## 8.2 Manual Test Cases
- Role escalation attempt  
- SOP editing without permission  
- Agent config overwrite  
- Model prompt injection attempts  
- SQL injection  
- Path traversal (file upload)  

---

# 9. Compliance Testing

## 9.1 SOC 2 Controls Testing
Verify:

- RLS enforced  
- Logs immutable  
- Access reviews  
- Change management workflows  
- Incident response documentation  

## 9.2 GDPR Testing
- Right to erasure  
- Data export  
- Consent flows  
- Data residency rules  

---

# 10. CI/CD Quality Gates

A PR can only merge if all are met:

| Category | Requirement |
|----------|-------------|
| Unit Tests | 90% coverage on routing + agent logic |
| Integration Tests | All pass |
| E2E Tests | Key workflows pass on staging |
| Security | No high-severity vulnerabilities |
| Linting | No errors |
| Types | No TS errors |
| Migrations | Safe + backward compatible |
| Performance | Routing < 50ms p99 (CI benchmark) |

---

# 11. QA Automation Strategy

Tenet uses a **hybrid automation model**:

### Automated (High Priority)
- Routing tests  
- SOP tests  
- Security tests  
- Memory tests  
- Model Gateway tests  

### Partially Automated
- LLM behavioral evals  
- E2E UI tests  

### Manual
- Prompt-level UX review  
- Visual polish  
- Accessibility testing  

---

# 12. Release Process

### 12.1 Development → Staging

1. Developer merges PR → CI runs  
2. Staging deploy automatic  
3. Staging runs:
   - E2E  
   - Load tests  
   - Regression (LLM eval)  
4. QA signs off

### 12.2 Staging → Production

1. Release notes auto-generated  
2. Approver reviews:  
   - DB migrations  
   - Security updates  
3. Blue/Green deployment  
4. Monitoring for 2 hours  
5. If stable → fully cut over  

---

# 13. Monitoring & Alerts

Use Datadog/Grafana/Sentry for:

- API latency  
- Routing errors  
- Model gateway errors  
- Token spikes  
- Hub-level anomalies  
- Failed SOP steps  
- 400/500 rates

### Alerts Required:
- p99 latency > threshold  
- LLM gateway failures > 2%  
- Routing mismatches  
- SQL deadlocks  
- Memory search failures  

---

# 14. Quality Scorecard

Every release gets a score:

| Category | Weight | Scored On |
|----------|--------|-----------|
| Reliability | 30% | uptime, routing accuracy |
| Safety | 25% | failed validations, injection attempts |
| Performance | 20% | latency, consumption |
| UX Quality | 15% | E2E pass, manual QA |
| LLM Accuracy | 10% | extraction, validation, eval tasks |

Release approved only if score ≥ **85%**.

---

# 15. Source of Truth

- Architecture → `architecture.md`  
- Data model → `data-model.md`  
- Routing → `routing-engine-spec.md`  
- Agents & SOPs → `agents-and-sops-spec.md`  
- API → `api-spec.md`  
- Security → `security-and-compliance.md`  
- UX → `ux-flows.md`  
- **Testing & quality** → this file

This document completes the Tenet **Testing & Quality** specification for production readiness.

