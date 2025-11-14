
# Tenet Routing Engine Specification

**File:** `routing-engine-spec.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define the behavior, contracts, and internal logic of the **Routing Engine (Tenet Core)** — the semantic switching fabric that routes every cognitive request.

This spec is the **source of truth** for how routing decisions are made.

- Data contracts: see `data-model.md`
- HTTP contracts: see `api-spec.md`
- Agents & SOPs: see `agents-and-sops-spec.md`

---

## 1. Role of the Routing Engine

The Routing Engine (a.k.a. **Tenet Core**) is the **semantic switch** of the system.

It:

1. Takes **user intent**, **SOP**, and **context** as inputs  
2. Selects the **appropriate hub**, **SOP**, **agent(s)**, and **model**  
3. Enforces **QoS** (latency, priority) and **cost/token budgets**  
4. Produces a structured **RoutingDecision**  
5. Optionally orchestrates **execution** via the Agent Service  

The engine does **not** own UI, DB schemas, or model calls directly — it orchestrates other services via stable contracts.

---

## 2. Inputs & Outputs

### 2.1 Inputs (Logical)

The Routing Engine consumes:

1. **Cognitive Request** (`CognitiveRequest` / `tenet_requests` row)
2. **Intent Object** (`IntentObject`)
3. **SOP Definition** (`SOPDefinition`)
4. **Graph Context** (related nodes/edges from TKG)
5. **Agent Registry** (available agents + their configs)
6. **Org/HUB Policies** (QoS, model preferences, budgets)
7. **Historical Metrics** (optional future: agent performance, latency stats)

These may be provided by:

- API server (request metadata)
- Intent engine (intent + SOP key)
- Graph service (SOP/agent nodes)
- DB (SOPs, agents, org config)
- Config service (global defaults)

---

### 2.2 Outputs

The Routing Engine produces:

1. A **RoutingDecision** object (persisted in `routing_decisions` table)
2. A **plan** for execution (which agent, model, memory, etc.)
3. Optionally, an immediate **ExecutionResult** (when invoked via `/execute`)

**RoutingDecision (API shape):**

```ts
export interface RoutingDecision {
  id: string;
  requestId: string;
  orgId: string;
  hubId?: string;
  sopId?: string;
  agentId?: string;
  modelName?: string;
  qosTier?: 'bronze' | 'silver' | 'gold';
  estimatedCost?: number;
  estimatedTokens?: number;
  estimatedLatencyMs?: number;
  decisionPayload?: Record<string, unknown>;
}

3. Routing Engine Responsibilities
3.1 Core Responsibilities
Resolve hub and SOP for a request


Select one primary agent (and optional secondary agents)


Select an LLM model (provider + variant)


Enforce QoS settings:


Priority handling for high-priority requests


Latency constraints


Enforce cost and token budgets


Maintain a trace of decision factors


Handle fallbacks when something fails:


No SOP found


No suitable agent


Model unavailable


3.2 Non-Responsibilities
It does not directly:


Render UI


Manage DB schemas


Handle raw HTTP requests


Store embeddings


Talk to LLM providers directly (that’s Model Gateway)


The engine invokes services via internal APIs / function calls.

4. Routing Flow Overview
High-level steps:
Input Normalization


Hub Resolution


SOP Resolution


Agent Candidate Selection


Model Candidate Selection


Scoring & Decision


QoS & Budget Checks


Persist RoutingDecision


(Optional) Orchestrate Execution



5. Detailed Routing Algorithm
5.1 Step 1: Input Normalization
Input:
CognitiveRequest (from DB or constructed from /execute request)


Optional IntentObject (from /intent or re-computed internally)


Tasks:
Ensure orgId, requestId, and rawInput exist.


If IntentObject is not provided, call intent engine to produce one.


If caller provided hubKey, set a hard hint for hub selection.



5.2 Step 2: Hub Resolution
Goal: Choose the most appropriate hub (Finance, Growth, etc.).
Heuristics:
If hubKey provided by client → respect it (if valid for org).


Else if intent.domain maps clearly to a hub → use that.


Else use fallback heuristic:


Simple keyword/domain mapping (e.g., invoice, payroll → Finance)


Latest used hub by this user (optional future)


If no hub resolved → ROUTING_FAILED with reason NO_HUB_RESOLVED.



5.3 Step 3: SOP Resolution
Goal: Resolve which SOP governs this request.
Steps:
If intent.sopKey is present:


Lookup sops table by org_id, sop_key, is_active = true.


Else:


Query graph_nodes for type sop in this hub.


Run simple semantic match (optional future) or name matching.


If multiple SOPs match:


Prefer:


Highest version


is_active = true


If no SOP found:


Routing engine can still proceed with a generic agent if configured.


Mark decision as sopId: null and note reason in decisionPayload.



5.4 Step 4: Agent Candidate Selection
Goal: Pick one or more agents capable of handling the SOP & intent.
Candidate selection:
Filter agents by:


orgId


hubId


isActive = true


Further filter by specialization/skills:


If SOP is finance.ap.invoice_v1, look for agents with specialization = 'payables' or skills containing validate_invoice / record_invoice.


If no agents found:


Fallback to a default hub agent (e.g., finance_general_agent) if available.


If none, ROUTING_FAILED with NO_AGENT_AVAILABLE.


Scoring (simple v0.1):
Score = base_specialization_score + skill_match_score


Optionally adjust for:


Agent load (in future)


Historical performance (in future)


Pick the highest scoring agent.

5.5 Step 5: Model Candidate Selection
Goal: Choose the best LLM model for the task, under QoS and budget constraints.
Inputs:
Org-level settings (e.g., "defaultModel": "gpt-5.1")


Hub-level settings (Finance may prefer more robust models)


SOP constraints (constraints.model, constraints.latencyMs, etc.)


Request priority (low, normal, high)


Algorithm (v0.1):
Start with SOP constraint: if constraints.model set → candidate list = [that model].


Else use:


Hub's default model


Or org's global default


Apply latency / QoS filter:


High priority tasks may choose faster models.


Estimate token usage:


Simple heuristic: length of input text + SOP steps × average tokens per step.


Compute cost estimate using model's known pricing.


If cost > org/hub budget:


Fallback to cheaper model.


If none within budget → ROUTING_FAILED with BUDGET_EXCEEDED.


Output:
modelName (e.g., 'gpt-5.1')


estimatedTokens, estimatedCost, estimatedLatencyMs



5.6 Step 6: QoS & Priority Handling
QoS tiers:
bronze — best effort


silver — prefer faster models, better routing


gold — strict latency target / dedicated capacity (future)


Rules v0.1:
Map request priority → QoS tier:


high → gold (if org plan allows) else silver


normal → silver


low → bronze


Use QoS to:


Choose model variant (fast vs quality)


Influence agent selection (future: reserved agents for gold)



5.7 Step 7: Compose RoutingDecision
Once hub, SOP, agent, and model are chosen:
const decision: RoutingDecision = {
  id: uuid(),
  requestId,
  orgId,
  hubId,
  sopId: sop?.id,
  agentId: agent?.id,
  modelName: chosenModel,
  qosTier,
  estimatedCost,
  estimatedTokens,
  estimatedLatencyMs,
  decisionPayload: {
    intent,
    sopKey: sop?.sop_key,
    agentKey: agent?.agent_key,
    reasoning: {
      hubSelection: "...",
      sopSelection: "...",
      agentSelection: "...",
      modelSelection: "...",
      qos: qosTier
    }
  }
}
This should be persisted to routing_decisions before execution begins.

5.8 Step 8: Execution (When Called via /execute)
When invoked via /execute, Routing Engine must:
Persist tenet_requests row.


Compute RoutingDecision.


Call Agent Service with:


agentId


sopId (if any)


request context (text, metadata)


modelName + constraints


Receive ExecutionResult.


Write execution_logs entries as they come back from the Agent Service.


Update tenet_requests.status:


in_progress → completed or failed.


Execution Orchestration Interface (logical):
interface AgentExecutionPayload {
  requestId: string;
  orgId: string;
  hubId?: string;
  agentId: string;
  sopId?: string;
  text: string;
  intent: IntentObject;
  modelName: string;
  qosTier: 'bronze' | 'silver' | 'gold';
}

6. Pseudocode (v0.1 Implementation)
6.1 routeRequest (Core Logic)
async function routeRequest(input: {
  request: CognitiveRequest;
  intent?: IntentObject;
}): Promise<RoutingDecision> {
  const { request } = input;
  const orgId = request.orgId;

  // 1. Ensure intent
  const intent = input.intent ?? await intentEngine.classify(request);

  // 2. Resolve hub
  const hub = await resolveHub({ orgId, request, intent });
  if (!hub) throw new RoutingError('NO_HUB_RESOLVED');

  // 3. Resolve SOP (optional)
  const sop = await resolveSOP({ orgId, hubId: hub.id, intent });

  // 4. Select agent
  const agent = await selectAgent({ orgId, hubId: hub.id, sop, intent });
  if (!agent) throw new RoutingError('NO_AGENT_AVAILABLE');

  // 5. Select model
  const modelSelection = await selectModel({
    orgId,
    hubId: hub.id,
    sop,
    intent,
    priority: request.priority ?? 'normal',
    text: request.text
  });
  if (!modelSelection) throw new RoutingError('NO_MODEL_AVAILABLE');

  const {
    modelName,
    estimatedTokens,
    estimatedCost,
    estimatedLatencyMs,
    qosTier
  } = modelSelection;

  // 6. Persist RoutingDecision
  const decision: RoutingDecision = {
    id: uuid(),
    requestId: request.id,
    orgId,
    hubId: hub.id,
    sopId: sop?.id,
    agentId: agent.id,
    modelName,
    qosTier,
    estimatedTokens,
    estimatedCost,
    estimatedLatencyMs,
    decisionPayload: {
      intent,
      sopKey: sop?.sop_key,
      agentKey: agent.agent_key
    }
  };

  await db.insertRoutingDecision(decision);

  return decision;
}

6.2 executeRequest (Used by /execute Endpoint)
async function executeRequest(reqBody: ExecuteRequestBody, userContext: { orgId: string; userId?: string; }): Promise<ExecuteResponse> {
  // 1. Create TenetRequest
  const request = await db.createTenetRequest({
    orgId: userContext.orgId,
    userId: userContext.userId,
    hubKey: reqBody.hubKey,
    rawInput: reqBody.text,
    priority: reqBody.priority ?? 'normal',
    source: 'console',
    status: 'pending'
  });

  // 2. Route
  let routing: RoutingDecision;
  try {
    routing = await routeRequest({ request });
  } catch (err) {
    await db.updateTenetRequestStatus(request.id, 'failed');
    throw err;
  }

  // 3. Execute via Agent Service
  await db.updateTenetRequestStatus(request.id, 'in_progress');

  const executionResult = await agentService.execute({
    requestId: request.id,
    orgId: request.orgId,
    hubId: routing.hubId,
    agentId: routing.agentId!,
    sopId: routing.sopId,
    text: request.text,
    modelName: routing.modelName!,
    qosTier: routing.qosTier!
  });

  // 4. Persist logs & final status
  await persistExecutionLogs(executionResult.logs);
  const finalStatus = executionResult.status === 'success' ? 'completed' : 'failed';
  await db.updateTenetRequestStatus(request.id, finalStatus);

  return {
    request: {
      id: request.id,
      status: finalStatus
    },
    routing,
    result: executionResult
  };
}

7. Error Handling
Routing errors should be represented as typed errors:
type RoutingErrorCode =
  | 'NO_HUB_RESOLVED'
  | 'NO_SOP_FOUND'
  | 'NO_AGENT_AVAILABLE'
  | 'NO_MODEL_AVAILABLE'
  | 'BUDGET_EXCEEDED'
  | 'INTERNAL_ROUTING_ERROR';

class RoutingError extends Error {
  code: RoutingErrorCode;
  details?: unknown;

  constructor(code: RoutingErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.code = code;
    this.details = details;
  }
}
The API layer should map these to HTTP responses:
NO_HUB_RESOLVED, NO_SOP_FOUND, NO_AGENT_AVAILABLE, NO_MODEL_AVAILABLE → 400 Bad Request or 422 Unprocessable Entity


BUDGET_EXCEEDED → 402 Payment Required (or 400 with specific code)


INTERNAL_ROUTING_ERROR → 500 Internal Server Error


Error payload must follow api-spec.md format.

8. Config & Extensibility
Routing behavior should be influenced by:
Org-level config:


default hub model


max cost per request


default QoS tier


Hub-level config:


hub-specific default model


SOP defaults


SOP-level constraints:


required model


max latency


Config access should be abstracted via a simple configService.get(orgId, hubId?, key) interface so behavior can be tuned without rewriting core logic.

9. Logging & Observability
For each routed request, log:
Request ID, orgId, hubId


Intent, SOP key


Agent chosen, model chosen


QoS tier, cost estimate, tokens estimate


Execution status (success/failure)


Logs should power:
Routing trace viewer in UI


Latency / performance dashboards


Cost + token analytics



10. Source of Truth
Entities & tables: data-model.md


API contracts: api-spec.md


SOP & agent semantics: agents-and-sops-spec.md


Routing logic: this routing-engine-spec.md file


Codex/engineers should treat this document as the canonical definition of routing behavior.


