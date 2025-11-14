
# Tenet API Specification

**File:** `api-spec.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define the HTTP API surface for Tenet so Codex/engineers can implement a consistent backend and frontend integration.

This spec assumes the **data model** in `data-model.md` as the source of truth for entities and IDs.

---

## 0. Conventions

- **Base URL (example):** `https://api.tenet.app/v1`
- **Format:** JSON over HTTPS only.
- **Auth:** Bearer JWT or API key in header.
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Errors:**
  - Non-2xx responses follow a standard error shape:
    ```json
    {
      "error": {
        "code": "STRING_CODE",
        "message": "Human-readable error message",
        "details": {...}
      }
    }
    ```

---

## 1. Authentication & Identity

> Auth implementation details (SSO, OAuth, etc.) can be handled separately, but the API should always know:
> - `orgId`
> - `userId` (optional for machine-to-machine or system integrations)

For now, assume `orgId` and `userId` are derived from the auth token, not passed explicitly in every call (except in admin/internal endpoints).

---

## 2. Core Public Endpoints

These are the main endpoints external clients and the web app will use.

- `POST /intent` — Classify user input into an intent object.
- `POST /execute` — High-level entry: parse intent, route, execute, return result.
- `POST /route` — Compute routing decision without executing (optional).
- `GET /requests/:id` — Get a request + status + last result.
- `GET /requests/:id/logs` — Get execution logs for a request.

---

### 2.1 `POST /intent`

**Description:**  
Given a piece of natural language input, return a structured `IntentObject`.

**Request:**

```http
POST /intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Process this invoice from Scott for $600",
  "hubKey": "finance",         // optional domain hint
  "metadata": {
    "channel": "console"
  }
}
Request Body:
interface IntentRequestBody {
  text: string;
  hubKey?: string; // e.g. 'finance', 'growth'
  metadata?: Record<string, unknown>;
}
Response: 200 OK
{
  "intent": {
    "intent": "process_invoice",
    "domain": "finance",
    "sopKey": "finance.ap.invoice_v1",
    "priority": "normal",
    "confidence": 0.92
  }
}
Response Type:
interface IntentResponse {
  intent: IntentObject;
}

interface IntentObject {
  intent: string;
  domain?: string;
  sopKey?: string;
  priority?: 'low' | 'normal' | 'high';
  confidence: number; // 0.0 - 1.0
}

2.2 POST /execute
Description:
 Primary high-level endpoint. Accepts user input, resolves intent, routes, executes, and returns the final ExecutionResult.
Request:
POST /execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Process this invoice from Scott for $600",
  "hubKey": "finance",
  "priority": "normal",
  "metadata": {
    "source": "console"
  }
}
Request Body:
interface ExecuteRequestBody {
  text: string;
  hubKey?: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, unknown>;
}
Response: 200 OK
{
  "request": {
    "id": "5f8cba35-6c3d-4ba9-9813-2a27162a6e61",
    "status": "completed"
  },
  "routing": {
    "id": "1019c452-8a72-4ce1-b497-b4c021d4f89e",
    "agentId": "a123...",
    "modelName": "gpt-5.1",
    "qosTier": "bronze",
    "estimatedTokens": 620
  },
  "result": {
    "status": "success",
    "output": {
      "actionTaken": "invoice_recorded",
      "amount": 600,
      "vendor": "Scott"
    },
    "logs": [
      {
        "stepName": "extract_fields",
        "status": "success",
        "tokensUsed": 200,
        "latencyMs": 450,
        "timestamp": "2025-11-13T20:00:00Z"
      }
    ]
  }
}
Response Type:
interface ExecuteResponse {
  request: {
    id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  };
  routing?: RoutingDecision;
  result?: ExecutionResult;
}

2.3 POST /route
Description:
 Compute a routing decision without executing the full SOP. Useful for debugging, simulation, or dry-run planning.
Request:
POST /route
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Process this invoice from Scott for $600",
  "hubKey": "finance",
  "priority": "normal",
  "metadata": {
    "simulate": true
  }
}
Request Body:
interface RouteRequestBody {
  text: string;
  hubKey?: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, unknown>;
}
Response: 200 OK
{
  "intent": {
    "intent": "process_invoice",
    "domain": "finance",
    "sopKey": "finance.ap.invoice_v1",
    "priority": "normal",
    "confidence": 0.9
  },
  "routing": {
    "id": "rt_123",
    "requestId": "req_001",
    "orgId": "org_001",
    "hubId": "hub_finance_001",
    "sopId": "sop_001",
    "agentId": "agent_finance_ap",
    "modelName": "gpt-5.1",
    "qosTier": "bronze",
    "estimatedCost": 0.0042,
    "estimatedTokens": 632,
    "estimatedLatencyMs": 1200
  }
}
Response Type:
interface RouteResponse {
  intent: IntentObject;
  routing: RoutingDecision;
}

2.4 GET /requests/:id
Description:
 Fetch a request + its status + latest routing + latest result (if available).
Request:
GET /requests/5f8cba35-6c3d-4ba9-9813-2a27162a6e61
Authorization: Bearer <token>
Accept: application/json
Response: 200 OK
{
  "request": {
    "id": "5f8cba35-6c3d-4ba9-9813-2a27162a6e61",
    "hubId": "hub_finance_001",
    "userId": "user_123",
    "rawInput": "Process this invoice from Scott for $600",
    "intent": "process_invoice",
    "sopKey": "finance.ap.invoice_v1",
    "priority": "normal",
    "status": "completed",
    "createdAt": "2025-11-13T19:59:58Z"
  },
  "routing": {
    "id": "1019c452-8a72-4ce1-b497-b4c021d4f89e",
    "agentId": "agent_finance_ap",
    "modelName": "gpt-5.1",
    "qosTier": "bronze",
    "estimatedTokens": 620
  },
  "result": {
    "status": "success",
    "output": {
      "actionTaken": "invoice_recorded",
      "amount": 600,
      "vendor": "Scott"
    }
  }
}
Response Type:
interface GetRequestResponse {
  request: {
    id: string;
    hubId?: string;
    userId?: string;
    rawInput: string;
    intent?: string;
    sopKey?: string;
    priority?: 'low' | 'normal' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: string;
  };
  routing?: Partial<RoutingDecision>;
  result?: {
    status: 'success' | 'partial' | 'failed';
    output: unknown;
  };
}

2.5 GET /requests/:id/logs
Description:
 Fetch execution logs for a given request, for debugging and trace visualization.
Request:
GET /requests/5f8cba35-6c3d-4ba9-9813-2a27162a6e61/logs
Authorization: Bearer <token>
Accept: application/json
Response: 200 OK
{
  "logs": [
    {
      "stepName": "extract_fields",
      "status": "success",
      "detail": "Extracted vendor and amount.",
      "tokensUsed": 200,
      "latencyMs": 450,
      "timestamp": "2025-11-13T20:00:00Z"
    },
    {
      "stepName": "validate",
      "status": "success",
      "detail": "Validated amount > 0.",
      "tokensUsed": 130,
      "latencyMs": 320,
      "timestamp": "2025-11-13T20:00:01Z"
    }
  ]
}
Response Type:
interface GetRequestLogsResponse {
  logs: ExecutionLogEntry[];
}

3. SOP & Agent Management Endpoints
These will be primarily used by the web app for managing Tenet configuration.

3.1 GET /sops
Description:
 List SOPs for the current organization and optional hub.
Request:
GET /sops?hubKey=finance
Authorization: Bearer <token>
Accept: application/json
Query Params:
hubKey (optional): filter by hub key


search (optional): free-text search by name/description


Response: 200 OK
{
  "sops": [
    {
      "id": "sop_001",
      "sopKey": "finance.ap.invoice_v1",
      "name": "AP - Process Invoice",
      "description": "Standard AP invoice intake & posting",
      "version": 1,
      "isActive": true
    }
  ]
}

3.2 POST /sops
Description:
 Create a new SOP.
POST /sops
Authorization: Bearer <token>
Content-Type: application/json

{
  "hubKey": "finance",
  "sopKey": "finance.ap.invoice_v1",
  "name": "AP - Process Invoice",
  "description": "Standard AP invoice intake & posting",
  "definition": {
    "steps": [
      {
        "id": 1,
        "type": "extract_fields",
        "fields": ["vendor", "amount", "date"]
      },
      {
        "id": 2,
        "type": "validate",
        "rules": ["amount > 0"]
      },
      {
        "id": 3,
        "type": "execute",
        "action": "record_invoice"
      }
    ]
  }
}
Response: 201 Created
{
  "sop": {
    "id": "sop_001",
    "sopKey": "finance.ap.invoice_v1",
    "name": "AP - Process Invoice",
    "version": 1,
    "isActive": true
  }
}

3.3 GET /sops/:id
Fetch full SOP definition, including steps/constraints.

3.4 PATCH /sops/:id
Update SOP metadata or definition.

3.5 GET /agents
List agents (optionally filtered by hub).
GET /agents?hubKey=finance
Authorization: Bearer <token>
Response Example:
{
  "agents": [
    {
      "id": "agent_finance_ap",
      "agentKey": "finance_ap_agent",
      "name": "Finance AP Agent",
      "specialization": "payables",
      "skills": ["validate_invoice", "post_to_ledger"],
      "memoryProfile": "short",
      "isActive": true
    }
  ]
}

3.6 POST /agents
Create an agent.
POST /agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "hubKey": "finance",
  "agentKey": "finance_ap_agent",
  "name": "Finance AP Agent",
  "description": "Handles AP invoice intake and posting.",
  "specialization": "payables",
  "skills": ["validate_invoice", "post_to_ledger"],
  "memoryProfile": "short",
  "maxTokens": 32000
}
Response: 201 Created, returns created agent.

4. Knowledge Graph & Memory Endpoints

4.1 GET /graph/nodes
List graph nodes for the current org/hub.
GET /graph/nodes?hubKey=finance&nodeType=sop
Authorization: Bearer <token>
Response Example:
{
  "nodes": [
    {
      "id": "node_sop_001",
      "nodeKey": "sop.finance.ap.invoice_v1",
      "nodeType": "sop",
      "label": "AP - Process Invoice"
    }
  ]
}

4.2 GET /graph/nodes/:id
Get a single graph node’s details + its immediate neighbors (optionally).
GET /graph/nodes/node_sop_001?includeNeighbors=true
Authorization: Bearer <token>
Response Example:
{
  "node": {
    "id": "node_sop_001",
    "nodeKey": "sop.finance.ap.invoice_v1",
    "nodeType": "sop",
    "label": "AP - Process Invoice"
  },
  "neighbors": [
    {
      "id": "node_agent_001",
      "nodeKey": "agent.finance_ap_agent",
      "nodeType": "agent",
      "label": "Finance AP Agent",
      "relationType": "handled_by"
    }
  ]
}

4.3 GET /memory
Search memory records via text query.
GET /memory?hubKey=finance&q=Scott%20invoice
Authorization: Bearer <token>
Response Example:
{
  "records": [
    {
      "id": "mem_001",
      "scope": "hub",
      "entityKey": "continuum_health_ar",
      "content": "Invoice from Scott for $600 processed on 2025-11-01.",
      "metadata": {
        "tags": ["invoice", "Scott"]
      },
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ]
}
Implementation detail: text query can be implemented by embedding the query and performing a vector similarity search.

5. Usage & Billing Endpoints

5.1 GET /usage/summary
Description:
 Return usage summary for current organization (or hub-level filter).
GET /usage/summary?hubKey=finance&periodStart=2025-11-01&periodEnd=2025-11-30
Authorization: Bearer <token>
Response Example:
{
  "orgId": "org_001",
  "hubKey": "finance",
  "periodStart": "2025-11-01",
  "periodEnd": "2025-11-30",
  "totalTokens": 120345,
  "totalCost": 24.07,
  "byModel": [
    {
      "modelName": "gpt-5.1",
      "tokens": 100345,
      "cost": 22.0
    },
    {
      "modelName": "gpt-4.1-mini",
      "tokens": 20000,
      "cost": 2.07
    }
  ],
  "byAgent": [
    {
      "agentId": "agent_finance_ap",
      "tokens": 80000
    }
  ]
}

6. Error Handling & Codes
All errors follow:
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable",
    "details": { "field": "optional context" }
  }
}
Examples:
AUTH_REQUIRED — no or invalid token


FORBIDDEN — user not allowed to access org/hub


VALIDATION_ERROR — payload incorrect


INTENT_FAILED — LLM or logic error in intent parsing


ROUTING_FAILED — unable to pick agent/model/SOP


EXECUTION_FAILED — downstream agent/model error


NOT_FOUND — entity not found



7. Internal Service APIs (Optional)
These are internal; they may not be exposed externally but are useful for Codex / microservice design.
Examples:
POST /internal/routing/decide


POST /internal/agents/execute


POST /internal/models/generate


POST /internal/memory/search


Each of these should consume/produce the TypeScript interfaces defined in data-model.md.

8. Source of Truth
All IDs & entity fields: see data-model.md.


All behavioral semantics (intent, routing, agents, SOPs): see routing-engine-spec.md and agents-and-sops-spec.md.


This api-spec.md defines only the HTTP contract: endpoints, request/response shapes, and error formats.




