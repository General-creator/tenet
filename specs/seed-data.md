
# Tenet Seed Data Specification

**File:** `seed-data.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define the initial data that should be created in a fresh Tenet environment (local, staging, demo) so that the app is **immediately usable and demo-able** without manual setup.

This doc tells Codex/engineers *exactly* what the `scripts/seed.ts` (or equivalent) should create.

---

## 0. Goals of Seeding

When you spin up Tenet in a fresh environment, you should:

- Be able to log in as a demo user.
- See a **demo organization** with:
  - Hubs (Finance, Growth, People, Ops)
  - SOPs (AP, AR, MEC)
  - Agents (AP, AR, MEC)
- Have a few sample requests and traces so the UI isn’t empty.

Seed data is **non-sensitive** and can be safely used in local & staging.

---

## 1. Seed Script Overview

**Script path (suggested):**

```txt
scripts/
  seed.ts
Invocation examples:
# Local
pnpm ts-node scripts/seed.ts --env=local

# Staging
pnpm ts-node scripts/seed.ts --env=staging
High-level steps:
Upsert demo org & users.


Upsert hubs.


Upsert agents.


Upsert SOPs (definitions as JSON).


Link agents ↔ SOPs via graph nodes/edges.


Insert a few demo requests + routing decisions + execution logs.


Insert a few memory records (for RAG demo, optional).



2. Seed Entities
2.1 Organization
Table: organizations
Seed one demo org:
{
  "name": "Tenet Demo Corp",
  "slug": "tenet-demo"   // unique, stable slug
}
Implementation hint (pseudo-code):
const org = await upsertOrganization({
  slug: 'tenet-demo',
  name: 'Tenet Demo Corp'
});

2.2 Users
Table: users
For local/staging, create a couple of users bound to the demo org.
[
  {
    "email": "demo.admin@tenet.local",
    "name": "Demo Admin",
    "role": "admin"
  },
  {
    "email": "demo.finance@tenet.local",
    "name": "Finance User",
    "role": "member"
  }
]
The actual auth provider (Supabase Auth, NextAuth, etc.) should also be seeded or configured so you can log in as at least Demo Admin.

2.3 Hubs
Table: hubs
Seed the core four hubs, with at least Finance fully “live”:
[
  {
    "key": "finance",
    "name": "Finance Hub",
    "description": "Accounts Payable, Accounts Receivable, and Month-End Close."
  },
  {
    "key": "growth",
    "name": "Growth Hub",
    "description": "Marketing, sales, and growth experiments."
  },
  {
    "key": "people",
    "name": "People Hub",
    "description": "HR, onboarding, and internal communication."
  },
  {
    "key": "ops",
    "name": "Ops Hub",
    "description": "Operations, logistics, and field workflows."
  }
]
For v0, only Finance needs fully wired SOPs/agents.

3. Finance Hub – Seed SOPs
Table: sops (with definition JSON from agents-and-sops-spec.md)
We’ll seed 3 SOPs:
finance.ap.invoice_v1 – AP: Process Invoice


finance.ar.collection_v1 – AR: Collection Workflow


finance.mec.close_month_v1 – Month-End Close


3.1 finance.ap.invoice_v1
Minimal seed row:
{
  "sop_key": "finance.ap.invoice_v1",
  "name": "AP - Process Invoice",
  "description": "Standard AP invoice intake & posting",
  "version": 1,
  "is_active": true,
  "definition": {
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
}

3.2 finance.ar.collection_v1
{
  "sop_key": "finance.ar.collection_v1",
  "name": "AR - Collection Workflow",
  "description": "Standard AR communication flow for overdue invoices",
  "version": 1,
  "is_active": true,
  "definition": {
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
}

3.3 finance.mec.close_month_v1
{
  "sop_key": "finance.mec.close_month_v1",
  "name": "Month-End Close",
  "description": "Checklist-style SOP for month-end close",
  "version": 1,
  "is_active": true,
  "definition": {
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
}

4. Finance Hub – Seed Agents
Table: agents (see agents-and-sops-spec.md)
Seed 3 agents:
finance_ap_agent


finance_ar_agent


finance_mec_agent


4.1 AP Agent
{
  "agent_key": "finance_ap_agent",
  "name": "Finance AP Agent",
  "description": "Handles accounts payable invoice intake and posting.",
  "specialization": "payables",
  "skills": ["extract_invoice_fields", "validate_invoice", "record_invoice"],
  "memory_profile": "short",
  "max_tokens": 32000,
  "is_active": true,
  "config": {
    "systemPrompt": "You are the Finance AP Agent for Tenet. Your role is to extract invoice fields, validate them using SOP rules, and prepare structured invoice objects. Never guess missing values; ask for clarification if required fields are missing.",
    "supportedSopKeys": ["finance.ap.invoice_v1"]
  }
}
4.2 AR Agent
{
  "agent_key": "finance_ar_agent",
  "name": "Finance AR Agent",
  "description": "Handles accounts receivable follow-up and communication.",
  "specialization": "receivables",
  "skills": ["generate_collection_email", "summarize_payment_status"],
  "memory_profile": "medium",
  "max_tokens": 32000,
  "is_active": true,
  "config": {
    "systemPrompt": "You are the Finance AR Agent for Tenet. You prepare polite but firm collection emails and summarize AR status. Never fabricate payment data; only use what is provided or in memory.",
    "supportedSopKeys": ["finance.ar.collection_v1"]
  }
}
4.3 MEC Agent
{
  "agent_key": "finance_mec_agent",
  "name": "Finance MEC Agent",
  "description": "Coordinates month-end close tasks and checklists.",
  "specialization": "month_end_close",
  "skills": ["prepare_mec_checklist", "summarize_mec_status"],
  "memory_profile": "long",
  "max_tokens": 64000,
  "is_active": true,
  "config": {
    "systemPrompt": "You are the Finance MEC Agent for Tenet. You orchestrate month-end close SOPs and prepare summaries. Mark tasks incomplete when data is missing; do not fabricate balances.",
    "supportedSopKeys": ["finance.mec.close_month_v1"]
  }
}
The seed script should map these agents to the finance hub and the demo org.

5. Knowledge Graph Nodes & Edges
Tables: graph_nodes, graph_edges
5.1 Nodes
Seed nodes for each SOP & Agent:
[
  {
    "node_key": "sop.finance.ap.invoice_v1",
    "node_type": "sop",
    "label": "AP - Process Invoice"
  },
  {
    "node_key": "sop.finance.ar.collection_v1",
    "node_type": "sop",
    "label": "AR - Collection Workflow"
  },
  {
    "node_key": "sop.finance.mec.close_month_v1",
    "node_type": "sop",
    "label": "Month-End Close"
  },
  {
    "node_key": "agent.finance_ap_agent",
    "node_type": "agent",
    "label": "Finance AP Agent"
  },
  {
    "node_key": "agent.finance_ar_agent",
    "node_type": "agent",
    "label": "Finance AR Agent"
  },
  {
    "node_key": "agent.finance_mec_agent",
    "node_type": "agent",
    "label": "Finance MEC Agent"
  }
]
5.2 Edges
Seed edges that reflect handling relationships and dependencies:
[
  {
    "from_node_key": "sop.finance.ap.invoice_v1",
    "to_node_key": "agent.finance_ap_agent",
    "relation_type": "handled_by"
  },
  {
    "from_node_key": "sop.finance.ar.collection_v1",
    "to_node_key": "agent.finance_ar_agent",
    "relation_type": "handled_by"
  },
  {
    "from_node_key": "sop.finance.mec.close_month_v1",
    "to_node_key": "agent.finance_mec_agent",
    "relation_type": "handled_by"
  },
  {
    "from_node_key": "sop.finance.mec.close_month_v1",
    "to_node_key": "sop.finance.ap.invoice_v1",
    "relation_type": "depends_on"
  },
  {
    "from_node_key": "sop.finance.mec.close_month_v1",
    "to_node_key": "sop.finance.ar.collection_v1",
    "relation_type": "depends_on"
  }
]
Implementation detail: in the seed script you’ll look up graph_nodes.id by node_key and then insert edges using from_node_id / to_node_id.

6. Demo Requests, Routing, and Logs
This makes the UI “alive” immediately.
6.1 Example AP Request
Table: tenet_requests
{
  "raw_input": "Process this invoice from Scott Ventures for $600, due Dec 1.",
  "intent": "process_invoice",
  "sop_key": "finance.ap.invoice_v1",
  "priority": "normal",
  "status": "completed",
  "source": "console",
  "metadata": {
    "seed": true
  }
}
Table: routing_decisions
{
  "hub_id": "<finance_hub_id>",
  "sop_id": "<ap_sop_id>",
  "agent_id": "<ap_agent_id>",
  "model_name": "gpt-5.1",
  "qos_tier": "silver",
  "estimated_cost": 0.0042,
  "estimated_tokens": 620,
  "estimated_latency_ms": 1200,
  "decision_payload": {
    "intent": {
      "intent": "process_invoice",
      "domain": "finance",
      "sopKey": "finance.ap.invoice_v1",
      "confidence": 0.93
    },
    "reasoning": {
      "hubSelection": "finance",
      "sopSelection": "AP - Process Invoice",
      "agentSelection": "Finance AP Agent",
      "modelSelection": "gpt-5.1"
    }
  }
}
Table: execution_logs
A small chain of steps:
[
  {
    "step_name": "extract_fields",
    "status": "success",
    "detail": "Extracted vendor, amount, and due date.",
    "tokens_used": 200,
    "latency_ms": 450
  },
  {
    "step_name": "validate",
    "status": "success",
    "detail": "amount > 0 and due_date >= invoice_date",
    "tokens_used": 130,
    "latency_ms": 320
  },
  {
    "step_name": "record_invoice",
    "status": "success",
    "detail": "Prepared invoice record object.",
    "tokens_used": 170,
    "latency_ms": 380
  }
]
These logs will make the Routing Trace Viewer nice on day one.

6.2 Example AR Request
Similar pattern:
Input: “Draft a collection email for an overdue invoice #1235 for $1,200 from ACME, due 30 days ago.”


SOP: finance.ar.collection_v1


Agent: finance_ar_agent


Status: completed


Execution logs: extract → validate → generate_collection_email → notify.



6.3 Example MEC Request
Input: “Run month-end close checklist.”


SOP: finance.mec.close_month_v1


Agent: finance_mec_agent


Logs showing prepare_mec_checklist and route steps.



7. Demo Memory Records (Optional but Nice)
Table: memory_records
Seed a couple for Finance to demonstrate RAG in the future:
[
  {
    "scope": "hub",
    "entity_key": "continuum_health_ar",
    "content": "Invoice from Scott Ventures for $600 processed on 2025-11-01.",
    "metadata": {
      "tags": ["invoice", "Scott Ventures", "AP"]
    }
  },
  {
    "scope": "hub",
    "entity_key": "ar_policy",
    "content": "For invoices over 30 days overdue, AR emails should be firm but polite and include a summary of outstanding balance.",
    "metadata": {
      "tags": ["policy", "AR"]
    }
  }
]
(Actual embeddings will be computed by the memory service at insert time.)

8. Seed Script Behavior & Idempotency
The seed script must be idempotent:
If you run it twice, it should:


Reuse existing org/hubs/users/SOPs/agents by slug/key/email.


Not create duplicates.


Strategy:


upsert() by key fields (slug, email, sop_key, agent_key, node_key).


Only insert demo tenet_requests if none with metadata.seed = true exist.



9. Where This Fits in the System
This seed-data.md works alongside:
data-model.md – defines the tables/fields.


agents-and-sops-spec.md – source for SOP & Agent semantics.


ux-flows.md – explains why these particular requests are great demo flows.


deployment-and-env.md & infra/README.md – explain where/when to run seed.


Together, they allow you (or Codex) to:
Bring up a fully demoable Tenet instance locally or in staging,


With real-looking data,


And end-to-end flows ready to show: AP, AR, MEC, routing traces, and usage.




