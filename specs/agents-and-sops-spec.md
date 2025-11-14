
# Tenet Agents & SOPs Specification

**File:** `agents-and-sops-spec.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define how **SOPs (semantic protocols)** and **Agents (domain micro-services)** are represented, related, and executed inside Tenet.

This spec is the **source of truth** for:

- SOP definition format  
- Agent definition format  
- How agents execute SOPs  
- How handoff and delegation work  

---

## 0. Conventions

- SOPs are **protocols**: machine-readable, versioned, testable.
- Agents are **executors**: domain-specific reasoning units that:
  - interpret SOP steps
  - call models & memory
  - coordinate with other agents if needed.

Data types reference `data-model.md` when relevant.

---

## 1. SOPs (Standard Operating Procedures)

### 1.1 SOP Definition — Concept

A **SOP** in Tenet is:

- A **semantic protocol** that describes *how* a specific business task is handled.
- Structured as ordered steps of different types (extract, validate, execute, route, notify, etc.).
- Linked to:
  - a **Hub** (domain: Finance, Growth, etc.)
  - one or more **Agents** capable of executing it
  - a **GraphNode** in the Tenet Knowledge Graph (TKG)

SOPs are stored in the `sops` table with a `definition` JSON body.

---

### 1.2 SOPDefinition Type (Logical)

```ts
export interface SOPDefinition {
  sopId: string;                 // logical key: 'finance.ap.invoice_v1'
  name: string;                  // display name
  description?: string;
  version: number;               // protocol version
  steps: SOPStep[];
  constraints?: {
    latencyMs?: number;
    model?: string;
    maxTokens?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface SOPStep {
  id: number;
  type: 'extract_fields'
      | 'validate'
      | 'execute'
      | 'route'
      | 'notify'
      | 'custom';

  // generic fields
  action?: string;                     // e.g. 'record_invoice', 'send_email'
  fields?: string[];                   // e.g. ['vendor', 'amount']
  rules?: string[];                    // validation rules (e.g. 'amount > 0')
  nextStepId?: number | null;          // explicit override for branching
  config?: Record<string, unknown>;    // step-specific config
}

1.3 SOP Storage (DB-level)
In sops.definition:
{
  "sopId": "finance.ap.invoice_v1",
  "name": "AP - Process Invoice",
  "description": "Standard AP invoice intake & posting",
  "version": 1,
  "steps": [
    {
      "id": 1,
      "type": "extract_fields",
      "fields": ["vendor", "amount", "invoice_date"]
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
  ],
  "constraints": {
    "latencyMs": 5000,
    "model": "gpt-5.1",
    "maxTokens": 8000
  }
}

1.4 Core Step Types
1.4.1 extract_fields
Purpose: Extract structured fields from input text or context.


Example:


{
  "id": 1,
  "type": "extract_fields",
  "fields": ["vendor", "amount", "invoice_date"]
}
The executing agent must:
Use LLM + heuristics to extract fields.


Emit a structured payload (e.g., { vendor: "Scott", amount: 600 }).



1.4.2 validate
Purpose: Validate fields against simple rules (string expressions).


Example:


{
  "id": 2,
  "type": "validate",
  "rules": ["amount > 0", "amount <= 100000"]
}
Validation can be:
numeric comparisons


presence/required fields


domain-specific checks (later)


If validation fails, step status = error and SOP should either:
halt execution, or


branch to error-handling SOP (future).



1.4.3 execute
Purpose: Perform domain actions (logical, not necessarily direct API calls at v0.1).


Example:


{
  "id": 3,
  "type": "execute",
  "action": "record_invoice",
  "config": {
    "postTo": "general_ledger"
  }
}
The agent decides:
whether to:


call an integration


produce a structured record


generate a confirmation message


In MVP, many execute actions may simply prepare data for a human or log into Tenet.

1.4.4 route
Purpose: Delegate to another SOP or Agent.


Example:


{
  "id": 4,
  "type": "route",
  "config": {
    "sopKey": "finance.mec.close_month_v1"
  }
}
Executing this step:
triggers a nested request to the routing engine or agent service.


The parent SOP resumes after the nested one completes (future) or just logs the delegation (v0.1).



1.4.5 notify
Purpose: Notify a human (email, Slack, etc.) or log a summary.


Example:


{
  "id": 5,
  "type": "notify",
  "config": {
    "channel": "email",
    "template": "invoice_processed",
    "to": "ap@client.com"
  }
}
MVP: This can simply log a “notification intent” that a human or integration picks up later.

1.4.6 custom
Purpose: Escape hatch for specific behaviors not yet standardized.


Example:


{
  "id": 99,
  "type": "custom",
  "action": "custom_finance_risk_scoring",
  "config": {
    "riskThreshold": 0.7
  }
}
Agent must understand how to interpret this action via its own config.

2. Example SOPs (Finance Hub)
These are concrete sample SOPs that should ship in v0.1.

2.1 SOP: AP — Process Invoice
Key: finance.ap.invoice_v1
 Purpose: Intake and post an invoice for accounts payable.
{
  "sopId": "finance.ap.invoice_v1",
  "name": "AP - Process Invoice",
  "description": "Standard AP invoice intake & posting",
  "version": 1,
  "steps": [
    {
      "id": 1,
      "type": "extract_fields",
      "fields": ["vendor", "amount", "invoice_date", "due_date", "invoice_number"]
    },
    {
      "id": 2,
      "type": "validate",
      "rules": [
        "amount > 0",
        "invoice_date <= today",
        "due_date >= invoice_date"
      ]
    },
    {
      "id": 3,
      "type": "execute",
      "action": "record_invoice",
      "config": {
        "targetSystem": "quickbooks",
        "glAccount": "accounts_payable"
      }
    },
    {
      "id": 4,
      "type": "notify",
      "config": {
        "channel": "log",
        "template": "ap_invoice_processed"
      }
    }
  ],
  "constraints": {
    "latencyMs": 5000,
    "model": "gpt-5.1",
    "maxTokens": 8000
  }
}

2.2 SOP: AR — Process Payment / Collection
Key: finance.ar.collection_v1
 Purpose: Handle AR communication / payment status.
{
  "sopId": "finance.ar.collection_v1",
  "name": "AR - Collection Workflow",
  "description": "Standard AR communication flow for overdue invoices",
  "version": 1,
  "steps": [
    {
      "id": 1,
      "type": "extract_fields",
      "fields": ["customer_name", "invoice_number", "amount", "due_date"]
    },
    {
      "id": 2,
      "type": "validate",
      "rules": ["amount > 0"]
    },
    {
      "id": 3,
      "type": "execute",
      "action": "generate_collection_email",
      "config": {
        "tone": "firm_but_polite"
      }
    },
    {
      "id": 4,
      "type": "notify",
      "config": {
        "channel": "log",
        "template": "ar_collection_email_draft"
      }
    }
  ]
}

2.3 SOP: MEC — Month-End Close
Key: finance.mec.close_month_v1
 Purpose: Guide through month-end close checklist.
{
  "sopId": "finance.mec.close_month_v1",
  "name": "Month-End Close",
  "description": "Checklist-style SOP for month-end close",
  "version": 1,
  "steps": [
    {
      "id": 1,
      "type": "execute",
      "action": "prepare_mec_checklist",
      "config": {
        "sections": ["AP", "AR", "bank_recon", "journal_entries"]
      }
    },
    {
      "id": 2,
      "type": "route",
      "config": {
        "sopKey": "finance.ap.invoice_v1"
      }
    },
    {
      "id": 3,
      "type": "route",
      "config": {
        "sopKey": "finance.ar.collection_v1"
      }
    },
    {
      "id": 4,
      "type": "notify",
      "config": {
        "channel": "log",
        "template": "mec_summary"
      }
    }
  ]
}

3. Agents
3.1 Agent Definition — Concept
Agents are domain-specific cognitive workers:
They know:


which SOPs they can handle,


what tasks they’re good at,


how to use the model + memory.


They are tied to a hub and organization.


Agents receive:
request context (text, intent, metadata)


selected SOP


selected model


QoS tier


…and return an ExecutionResult.

3.2 AgentConfig Type (Logical)
From data-model.md:
export interface AgentConfig {
  agentId: string;
  orgId: string;
  hubId?: string;
  agentKey: string;
  name: string;
  description?: string;
  specialization?: string;        // e.g. 'payables'
  skills?: string[];              // e.g. ['validate_invoice', 'post_to_ledger']
  memoryProfile?: 'short' | 'medium' | 'long';
  maxTokens?: number;
  config?: Record<string, unknown>; // e.g. system prompts, tools
}

3.3 Agent Storage (DB-level)
agents.config might contain:
{
  "systemPrompt": "You are the Finance AP Agent for Tenet. You process AP invoices and prepare data for QuickBooks. Be precise, conservative, and always ask for missing critical fields.",
  "supportedSopKeys": [
    "finance.ap.invoice_v1"
  ],
  "tools": {
    "quickbooks": {
      "enabled": false
    }
  }
}

4. Example Agents (Finance Hub)
4.1 finance_ap_agent
Purpose: Execute AP invoice processing SOPs.
Row-like JSON:
{
  "agent_key": "finance_ap_agent",
  "name": "Finance AP Agent",
  "description": "Handles accounts payable invoice intake and posting.",
  "specialization": "payables",
  "skills": ["extract_invoice_fields", "validate_invoice", "record_invoice"],
  "memory_profile": "short",
  "max_tokens": 32000,
  "config": {
    "systemPrompt": "You are the Finance AP Agent...",
    "supportedSopKeys": ["finance.ap.invoice_v1"]
  }
}

4.2 finance_ar_agent
Purpose: Execute AR collection and communication SOPs.
{
  "agent_key": "finance_ar_agent",
  "name": "Finance AR Agent",
  "description": "Handles accounts receivable follow-up and communication.",
  "specialization": "receivables",
  "skills": ["generate_collection_email", "summarize_payment_status"],
  "memory_profile": "medium",
  "max_tokens": 32000,
  "config": {
    "systemPrompt": "You are the Finance AR Agent...",
    "supportedSopKeys": ["finance.ar.collection_v1"]
  }
}

4.3 finance_mec_agent
Purpose: Orchestrate month-end close logic.
{
  "agent_key": "finance_mec_agent",
  "name": "Finance MEC Agent",
  "description": "Coordinates month-end close tasks and checklists.",
  "specialization": "month_end_close",
  "skills": ["prepare_mec_checklist", "summarize_mec_status"],
  "memory_profile": "long",
  "max_tokens": 64000,
  "config": {
    "systemPrompt": "You are the Finance MEC Agent...",
    "supportedSopKeys": ["finance.mec.close_month_v1"]
  }
}

5. Agent Execution Contract
The routing engine invokes the Agent Service with:
export interface AgentExecutionPayload {
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
The Agent Service:
Loads the agent config from DB.


Loads the SOP definition (if sopId provided).


Builds a combined prompt:


system prompt (from agent config)


SOP context (from SopDefinition)


user input text


Calls Model Gateway with appropriate model.


Interprets LLM response to:


mark each SOP step as started/success/error


construct a structured output


Logs each step to execution_logs.


Returns:
export interface ExecutionResult {
  requestId: string;
  routingId?: string;
  status: 'success' | 'partial' | 'failed';
  output: unknown;         // Usually SOP-specific structured object
  logs: ExecutionLogEntry[];
}

6. Agent Handoff & Routing Steps
Agents may need to handoff to other agents or SOPs:
A route step in a SOP triggers:


either a nested call to routeRequest() with a new CognitiveRequest


or a direct call to another agent if configured.


v0.1 Simplification:
route steps primarily:


log the routing intent


optionally call another SOP sequentially (blocking)


Full asynchronous orchestration can come later.



7. Prompts & Behavior Guidelines (High-Level)
While prompts-and-ai-config.md will go deeper, agents should adhere to:
Deterministic behavior:


Always follow SOP steps in order.


Respect constraints (latency, tokens, model).


Safe defaults:


If data is missing, ask clarifying questions or mark step as incomplete instead of guessing.


Structured outputs:


Where possible, return JSON-compatible structures for:


invoice records


checklists


AR communication drafts


Logging-first mindset:


Always log:


what was attempted


what succeeded


what failed


why



8. Graph Relationships for Agents & SOPs
For the Tenet Knowledge Graph (TKG):
Each SOP → graph_nodes.node_type = 'sop'


Each Agent → graph_nodes.node_type = 'agent'


Edges:


SOP uses Agent


SOP depends_on SOP


Agent handles SOP


Example edges:
[
  {
    "from_node": "sop.finance.ap.invoice_v1",
    "to_node": "agent.finance_ap_agent",
    "relation_type": "handled_by"
  },
  {
    "from_node": "sop.finance.mec.close_month_v1",
    "to_node": "sop.finance.ap.invoice_v1",
    "relation_type": "depends_on"
  }
]
These relationships help the Routing Engine:
Discover candidate agents.


Navigate dependencies.


Explain decisions in the trace viewer.



9. Source of Truth
Entity shapes & tables: data-model.md


Routing behavior: routing-engine-spec.md


HTTP contracts: api-spec.md


This file (agents-and-sops-spec.md):


SOP + Agent semantics


Step types


Execution patterns


Codex/engineers should rely on this spec when:
Creating new SOPs


Adding new Agents


Implementing Agent Service logic


Building the SOP/Agent UI in the Tenet web app




