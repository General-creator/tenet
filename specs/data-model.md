
# Tenet Data Model

**File:** `data-model.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define the core data structures, tables, and JSON objects that power Tenet, so Codex/engineers can implement a consistent, production-ready schema (Postgres/Supabase + TypeScript types).

---

## 0. Conventions

- **Database:** Postgres (via Supabase)
- **Naming:**
  - Tables: `snake_case` plural (e.g., `tenet_requests`)
  - Columns: `snake_case`
  - JSON fields: `camelCase` for API payloads
- **IDs:** `uuid` for primary keys unless noted
- **Timestamps:** `created_at`, `updated_at` (UTC)

---

## 1. Entity Overview

Core entities in Tenet:

1. `Organization` — A company/tenant using Tenet.
2. `User` — A human user belonging to an organization.
3. `Hub` — Domain “cells” (Finance, Growth, People, Ops).
4. `SOP` — Standard Operating Procedures (semantic protocols).
5. `Agent` — Domain-specific micro-agents that execute tasks.
6. `TenetRequest` — A logical user request (cognitive request).
7. `RoutingDecision` — How Tenet decided to route a request.
8. `ExecutionLog` — Step-by-step execution details.
9. `GraphNode` — Node in the Tenet Knowledge Graph (TKG).
10. `GraphEdge` — Edge/relationship between graph nodes.
11. `MemoryRecord` — Vector-based memory/context entries.
12. `UsageRecord` — Token usage & billing.
13. `Plan` / `Subscription` — Cognitive bandwidth plans (later).

---

## 2. ERD (Text Description)

**Organizations** have many **Users**, **Hubs**, **SOPs**, **Agents**, **Requests**, **GraphNodes**, **MemoryRecords**, and **UsageRecords**.

**Hubs** belong to an **Organization**, and group **SOPs**, **Agents**, **Requests**, and **MemoryRecords**.

**SOPs** are linked to **Hubs**, and appear as **GraphNodes**.

**Agents** are linked to **Hubs**, and appear as **GraphNodes**.

Each **TenetRequest** leads to zero or many **RoutingDecisions** and **ExecutionLogs**.

**GraphNodes** connect via **GraphEdges**.

**MemoryRecords** can be associated with an org, hub, agent, SOP, or user.

---

## 3. Table Definitions (Postgres)

### 3.1 `organizations`

```sql
CREATE TABLE organizations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

3.2 users
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  email           text NOT NULL,
  name            text,
  role            text NOT NULL DEFAULT 'member', -- 'admin', 'member', 'viewer'
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

3.3 hubs
Represents domain cells like Finance, Growth, People, Ops.
CREATE TABLE hubs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  key             text NOT NULL, -- 'finance', 'growth', 'people', 'ops', etc.
  name            text NOT NULL, -- display name
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

3.4 sops
Semantic SOP definitions (protocols).
CREATE TABLE sops (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  sop_key         text NOT NULL, -- e.g. 'finance.ap.invoice_v1'
  name            text NOT NULL,
  description     text,
  version         int NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  definition      jsonb NOT NULL, -- JSON structure of steps/protocol
  created_by      uuid REFERENCES users (id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, sop_key, version)
);

3.5 agents
Micro-agents that execute SOP steps or domain tasks.
CREATE TABLE agents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  agent_key       text NOT NULL, -- e.g. 'finance_ap_agent'
  name            text NOT NULL,
  description     text,
  specialization  text,          -- e.g. 'payables', 'receivables'
  skills          jsonb,         -- e.g. ["validate_invoice", "post_to_ledger"]
  memory_profile  text,          -- 'short', 'medium', 'long'
  max_tokens      int,           -- recommended max usage per call
  config          jsonb,         -- additional agent config
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, agent_key)
);

3.6 tenet_requests
Each user-initiated cognitive request.
CREATE TABLE tenet_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  user_id         uuid REFERENCES users (id),
  source          text NOT NULL DEFAULT 'console',  -- 'console', 'api', 'integration'
  raw_input       text NOT NULL,                    -- original user text
  intent          text,                             -- high-level intent classification
  sop_key         text,                             -- resolved SOP key (optional)
  priority        text DEFAULT 'normal',            -- 'low', 'normal', 'high'
  status          text NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'failed'
  metadata        jsonb,                            -- arbitrary metadata (e.g., channel)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

3.7 routing_decisions
Stores how Tenet Core routed a request.
CREATE TABLE routing_decisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES tenet_requests (id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  sop_id          uuid REFERENCES sops (id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES agents (id) ON DELETE SET NULL,
  model_name      text,                   -- e.g. 'gpt-5.1', 'gpt-4.1-mini'
  qos_tier        text,                   -- 'bronze', 'silver', 'gold'
  estimated_cost  numeric(12,6),          -- e.g. dollars
  estimated_tokens int,
  estimated_latency_ms int,
  decision_payload jsonb,                 -- full decision context
  created_at      timestamptz NOT NULL DEFAULT now()
);

3.8 execution_logs
Execution events as the request is processed.
CREATE TABLE execution_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES tenet_requests (id) ON DELETE CASCADE,
  routing_id      uuid REFERENCES routing_decisions (id) ON DELETE SET NULL,
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES agents (id) ON DELETE SET NULL,
  sop_id          uuid REFERENCES sops (id) ON DELETE SET NULL,
  step_name       text,
  status          text NOT NULL,             -- 'started', 'success', 'error'
  detail          text,                      -- human-readable
  payload         jsonb,                     -- structured details for debugging
  tokens_used     int,
  latency_ms      int,
  created_at      timestamptz NOT NULL DEFAULT now()
);

3.9 graph_nodes
Nodes in the Tenet Knowledge Graph (TKG).
CREATE TABLE graph_nodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  node_key        text NOT NULL,      -- e.g. 'sop.finance.ap.invoice_v1'
  node_type       text NOT NULL,      -- 'sop', 'agent', 'workflow', 'doc', 'concept'
  label           text,               -- human-readable label
  metadata        jsonb,              -- arbitrary node metadata
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, node_key)
);

3.10 graph_edges
Edges/relationships between graph nodes.
CREATE TABLE graph_edges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  from_node_id    uuid NOT NULL REFERENCES graph_nodes (id) ON DELETE CASCADE,
  to_node_id      uuid NOT NULL REFERENCES graph_nodes (id) ON DELETE CASCADE,
  relation_type   text NOT NULL,         -- e.g. 'uses', 'depends_on', 'adjacent_to'
  weight          numeric(6,3),          -- optional edge strength
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

3.11 memory_records
Vector-based memory for RAG/context.
CREATE TABLE memory_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES agents (id) ON DELETE SET NULL,
  sop_id          uuid REFERENCES sops (id) ON DELETE SET NULL,
  user_id         uuid REFERENCES users (id) ON DELETE SET NULL,
  scope           text NOT NULL,          -- 'org', 'hub', 'agent', 'user', etc.
  entity_key      text,                   -- logical key (e.g. 'continuum_health_ar')
  content         text NOT NULL,          -- original text or summary
  embedding       vector,                 -- pgvector column
  metadata        jsonb,                  -- e.g. tags, timestamps
  created_at      timestamptz NOT NULL DEFAULT now()
);
Note: embedding assumes CREATE EXTENSION IF NOT EXISTS vector; in Postgres.

3.12 usage_records
Token usage & billing.
CREATE TABLE usage_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id          uuid REFERENCES hubs (id) ON DELETE SET NULL,
  user_id         uuid REFERENCES users (id) ON DELETE SET NULL,
  request_id      uuid REFERENCES tenet_requests (id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES agents (id) ON DELETE SET NULL,
  model_name      text,
  qos_tier        text,
  tokens_prompt   int NOT NULL DEFAULT 0,
  tokens_completion int NOT NULL DEFAULT 0,
  tokens_total    int NOT NULL DEFAULT 0,
  cost            numeric(12,6),       -- computed cost in dollars
  period_start    date NOT NULL,       -- billing period bucket (e.g. day)
  period_end      date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

4. JSON Schemas (API-Level)
These are logical schemas for API payloads/TypeScript types (not necessarily 1:1 with DB).

4.1 CognitiveRequest (API)
export interface CognitiveRequest {
  id: string;                 // maps to tenet_requests.id
  orgId: string;
  hubId?: string;
  userId?: string;
  source: 'console' | 'api' | 'integration';
  text: string;               // user raw input
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, unknown>;
}

4.2 IntentObject
export interface IntentObject {
  intent: string;                  // e.g. 'process_invoice'
  domain?: string;                 // e.g. 'finance'
  sopKey?: string;                 // e.g. 'finance.ap.invoice_v1'
  priority?: 'low' | 'normal' | 'high';
  confidence: number;              // 0.0 - 1.0
}

4.3 RoutingDecision (API)
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

4.4 ExecutionResult
export interface ExecutionResult {
  requestId: string;
  routingId?: string;
  status: 'success' | 'partial' | 'failed';
  output: unknown;           // structured payload depending on SOP
  logs: ExecutionLogEntry[];
}

export interface ExecutionLogEntry {
  stepName?: string;
  status: 'started' | 'success' | 'error';
  detail?: string;
  payload?: unknown;
  tokensUsed?: number;
  latencyMs?: number;
  timestamp: string;
}

4.5 SOPDefinition
export interface SOPDefinition {
  sopId: string;             // 'finance.ap.invoice_v1'
  name: string;
  description?: string;
  version: number;
  steps: SOPStep[];
  constraints?: {
    latencyMs?: number;
    model?: string;
    maxTokens?: number;
  };
}

export interface SOPStep {
  id: number;
  type: 'extract_fields' | 'validate' | 'execute' | 'route' | 'notify' | 'custom';
  action?: string;                   // e.g. 'record_invoice'
  fields?: string[];                 // for extract_fields
  rules?: string[];                  // for validate
  nextStepId?: number | null;        // explicit next step override
  config?: Record<string, unknown>;  // step-specific config
}

4.6 AgentConfig
export interface AgentConfig {
  agentId: string;
  orgId: string;
  hubId?: string;
  agentKey: string;
  name: string;
  description?: string;
  specialization?: string;
  skills?: string[];
  memoryProfile?: 'short' | 'medium' | 'long';
  maxTokens?: number;
  config?: Record<string, unknown>;  // e.g. prompt templates, tool config
}

4.7 GraphNode (API)
export interface GraphNode {
  id: string;
  orgId: string;
  hubId?: string;
  nodeKey: string;
  nodeType: 'sop' | 'agent' | 'workflow' | 'doc' | 'concept';
  label?: string;
  metadata?: Record<string, unknown>;
}

4.8 GraphEdge (API)
export interface GraphEdge {
  id: string;
  orgId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;    // 'uses', 'depends_on', 'adjacent_to', etc.
  weight?: number;
  metadata?: Record<string, unknown>;
}

4.9 MemoryRecord (API)
export interface MemoryRecord {
  id: string;
  orgId: string;
  hubId?: string;
  agentId?: string;
  sopId?: string;
  userId?: string;
  scope: 'org' | 'hub' | 'agent' | 'user';
  entityKey?: string;
  content: string;
  embedding: number[];              // vector representation
  metadata?: Record<string, unknown>;
  createdAt: string;
}

5. Indexing & Performance Notes
Index tenet_requests on (org_id, created_at) and (org_id, hub_id, created_at).


Index routing_decisions on (request_id) and (org_id, created_at).


Index execution_logs on (request_id) and (org_id, created_at).


Index graph_nodes on (org_id, node_key) and (org_id, node_type).


Index graph_edges on (org_id, from_node_id) and (org_id, to_node_id).


Use pgvector indexes on memory_records.embedding with cosine/inner product.



6. Source of Truth
This data-model.md file is the source of truth for:
Database schema (Postgres / Supabase)


Core entity relationships


API-level TypeScript interfaces


Other files (api-spec.md, routing-engine-spec.md, etc.) should reference the IDs and fields defined here rather than redefining them differently.

