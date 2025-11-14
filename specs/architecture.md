\# Tenet Architecture

\*\*File:\*\* \`architecture.md\`    
\*\*Context:\*\* Tenet — Cognitive Telecom Network    
\*\*Purpose:\*\* Describe the high-level software and system architecture for Tenet so it can be implemented by an engineering team (or Codex) in a consistent, production-ready way.

\---

\#\# 1\. High-Level Concept

Tenet is a \*\*Cognitive Telecom Network\*\* — a semantic communication layer that routes, structures, and delivers intelligent conversations between humans, AI agents, and enterprise data.

Tenet is implemented as:

\- A \*\*web application\*\* for users (Command Console, SOP Library, Hubs, etc.)  
\- A \*\*backend API\*\* that exposes core functions (\`/intent\`, \`/route\`, \`/execute\`, \`/graph\`, \`/memory\`)  
\- A \*\*routing engine service\*\* (“Tenet Core”) that acts as the \*\*semantic switching fabric\*\*  
\- A \*\*knowledge graph service\*\* for representing SOPs, agents, workflows, and relationships  
\- A \*\*memory service\*\* for long/short-term context (vector store \+ metadata)  
\- A \*\*model gateway\*\* for talking to LLM providers (OpenAI, Anthropic, etc.)  
\- A \*\*database layer\*\* for persistent storage (Supabase/Postgres)  
\- An \*\*observability and billing layer\*\* for monitoring and metering “cognitive bandwidth”

\---

\#\# 2\. Core Components Overview

At a high level, Tenet consists of the following components:

1\. \*\*Web App (\`web-app\`)\*\*  
   \- Stack: Next.js (React), TypeScript  
   \- Purpose: User-facing UI for:  
     \- Command Console  
     \- Hubs (Finance, Growth, People, Ops)  
     \- SOP Library  
     \- Agent Registry  
     \- Routing Trace Viewer  
     \- Usage/Bandwidth dashboards

2\. \*\*API Server (\`api-server\`)\*\*  
   \- Stack: Node.js / TypeScript (e.g., Express, Fastify, or Next.js API routes)  
   \- Purpose: Public HTTP API surface:  
     \- \`/intent\`  
     \- \`/route\`  
     \- \`/execute\`  
     \- \`/graph\`  
     \- \`/memory\`  
   \- Handles auth, request validation, and delegates to services.

3\. \*\*Routing Engine / Tenet Core (\`routing-engine\`)\*\*  
   \- Stack: Node.js or Go (TypeScript preferred for repo consistency)  
   \- Purpose: Core “semantic switching fabric” that:  
     \- Takes intent \+ SOP \+ context  
     \- Selects appropriate agent(s)  
     \- Selects appropriate LLM model  
     \- Enforces QoS, cost, and latency rules  
     \- Produces \`RoutingDecision\` and orchestrates execution

4\. \*\*Agent Service (\`agent-service\`)\*\*  
   \- Purpose: Manages agent definitions and executes agent logic.  
   \- Responsibilities:  
     \- Maintain registry of agents (domain, skills, capabilities)  
     \- Execute agent-specific workflows (call out to LLMs \+ memory)  
     \- Support agent handoff (agent → agent)  
     \- Report back results and logs to the routing engine

5\. \*\*Knowledge Graph Service (\`graph-service\`)\*\*  
   \- Purpose: Represent Tenet Knowledge Graph (TKG).  
   \- Responsibilities:  
     \- Store SOP nodes, agent nodes, workflow nodes, knowledge assets  
     \- Manage edges (semantic relationships, dependencies, adjacency)  
     \- Provide query API for:  
       \- Node lookups  
       \- Pathfinding / adjacency search  
       \- Graph-based routing hints

6\. \*\*Memory Service (\`memory-service\`)\*\*  
   \- Purpose: Provide vector-based and structured memory for:  
     \- Organizations  
     \- Hubs  
     \- Agents  
     \- Users  
   \- Responsibilities:  
     \- Store vector embeddings (pgvector / vector DB)  
     \- Store associated metadata (entity, hub, scope, timestamps)  
     \- Provide retrieval APIs for RAG-style context injection

7\. \*\*Model Gateway (\`model-gateway\`)\*\*  
   \- Purpose: Unified abstraction for calling LLMs.  
   \- Responsibilities:  
     \- Route requests to OpenAI, Anthropic, Google, local models, etc.  
     \- Apply common prompt templates  
     \- Enforce global settings (max tokens, temperature, etc.)  
     \- Provide structured errors \+ token usage metrics

8\. \*\*Database Layer (\`db\`)\*\*  
   \- Platform: Supabase / Postgres  
   \- Responsibilities:  
     \- Store users, orgs, hubs  
     \- SOP definitions  
     \- Agent configurations  
     \- Requests, routing decisions, execution logs  
     \- Billing and usage records

9\. \*\*Observability & Billing Layer (\`observability\`, \`billing\`)\*\*  
   \- Purpose:  
     \- Log all major events (routing, execution, errors)  
     \- Track token usage / cognitive bandwidth per org/hub/user  
     \- Power dashboards in the web app

\---

\#\# 3\. Layered Architecture (Semantic OSI Model)

Tenet is conceptually built as a 7-layer semantic stack:

1\. \*\*L7 — Business Intent Layer\*\*  
   \- Components:  
     \- Web App (Command Console)  
     \- \`/intent\` endpoint  
   \- Responsibilities:  
     \- Parse natural language from users  
     \- Classify intent, domain, priority

2\. \*\*L6 — SOP Protocol Layer\*\*  
   \- Components:  
     \- SOP Registry (DB)  
     \- Graph Service (SOP nodes)  
     \- SOP Interpreter  
   \- Responsibilities:  
     \- Convert intent into a specific SOP protocol  
     \- Validate SOP schema and readiness

3\. \*\*L5 — Tenet Core (Semantic Switching Fabric)\*\*  
   \- Components:  
     \- Routing Engine  
     \- QoS Manager  
     \- Cost/Latency Evaluator  
   \- Responsibilities:  
     \- Decide which agent(s) and model(s) will execute the task  
     \- Plan the execution route across hubs and agents

4\. \*\*L4 — Agent Execution Layer\*\*  
   \- Components:  
     \- Agent Service  
   \- Responsibilities:  
     \- Run domain-specific logic  
     \- Call memory \+ models as needed  
     \- Support agent chaining / handoff

5\. \*\*L3 — Knowledge Graph Layer\*\*  
   \- Components:  
     \- Graph Service  
   \- Responsibilities:  
     \- Represent nodes and edges  
     \- Enable graph queries for:  
       \- “Which SOPs relate to this?”  
       \- “Which agent is adjacent to this domain?”  
       \- “What workflows depend on this SOP?”

6\. \*\*L2 — Model Network Layer\*\*  
   \- Components:  
     \- Model Gateway  
   \- Responsibilities:  
     \- Call out to LLM providers (OpenAI, etc.)  
     \- Apply model routing policies (cost/accuracy/latency)

7\. \*\*L1 — Token/Bandwidth Layer\*\*  
   \- Components:  
     \- Billing/Usage tracking  
     \- Internal counters / DB tables  
   \- Responsibilities:  
     \- Track tokens used per request  
     \- Power cognitive bandwidth plans

\---

\#\# 4\. Service-to-Service Interactions

\#\#\# 4.1 Typical Request Flow

1\. \*\*User\*\* submits a request via Web App or API:  
   \- \`POST /intent\` or \`POST /execute\` (high-level command)

2\. \*\*API Server\*\*:  
   \- Authenticates user/org  
   \- Validates payload  
   \- Calls Intent Engine (could be part of routing-engine or a submodule)

3\. \*\*Intent Engine\*\*:  
   \- Classifies intent, domain, and candidate SOP  
   \- Returns \`IntentObject\` to API Server / Routing Engine

4\. \*\*Routing Engine\*\*:  
   \- Fetches SOP definition from DB / Graph Service  
   \- Queries Knowledge Graph for related nodes (agents, workflows)  
   \- Consults Memory Service for relevant context (optional)  
   \- Scores agents (availability, specialization, historical performance)  
   \- Selects model via Model Gateway policies  
   \- Produces a \`RoutingDecision\` object

5\. \*\*Agent Service\*\*:  
   \- Receives execution plan from Routing Engine  
   \- Executes one or more steps:  
     \- Calls Model Gateway with prompts \+ context  
     \- Reads/writes Memory Service  
     \- Emits intermediate logs  
   \- Returns structured \`ExecutionResult\` to Routing Engine

6\. \*\*Routing Engine\*\*:  
   \- Assembles final result  
   \- Logs routing \+ execution details (Observability layer)  
   \- Returns response to API Server

7\. \*\*API Server\*\*:  
   \- Responds to client (Web App, integration, etc.)

\---

\#\# 5\. Component Responsibilities & Boundaries

\#\#\# 5.1 Web App (\`web-app\`)  
\- Displays:  
  \- Command Console  
  \- Hubs (Finance, Growth, People, Ops)  
  \- SOP Library (CRUD UI)  
  \- Agent Registry (view/edit agents)  
  \- Routing Trace Viewer (visual execution traces)  
  \- Usage/Bandwidth dashboards  
\- Interacts with:  
  \- API Server endpoints (\`/intent\`, \`/execute\`, \`/graph\`, \`/usage\`)

\#\#\# 5.2 API Server (\`api-server\`)  
\- Single entry point for:  
  \- External clients  
  \- Web App frontend  
\- Responsibilities:  
  \- Authentication & authorization  
  \- Input validation  
  \- Rate limiting  
  \- Delegating to internal services  
  \- Standardizing error formats

\#\#\# 5.3 Routing Engine (\`routing-engine\`)  
\- The \*\*central decision-maker\*\*:  
  \- No direct UI  
  \- Called only by API Server / internal services  
\- Responsibilities:  
  \- Decide \*\*who\*\* should handle a request (agent, model)  
  \- Decide \*\*how\*\* the task should be broken down (SOP steps, agent chain)  
  \- Select \*\*where\*\* the computation happens (model provider)  
  \- Enforce QoS (priority queue, limits)  
  \- Enforce budget (tokens, time)  
  \- Record routing decisions in DB

\#\#\# 5.4 Agent Service (\`agent-service\`)  
\- Encapsulates:  
  \- Agent definitions (skills, domains, memory profiles)  
  \- Execution of SOP steps  
\- Responsibilities:  
  \- Provide a simple \`execute(agent\_id, step, context)\` interface  
  \- Handle multi-step SOP sequences (possibly orchestrated by routing-engine)  
  \- Provide logs and performance metrics

\#\#\# 5.5 Knowledge Graph Service (\`graph-service\`)  
\- Encapsulates:  
  \- Graph database or adjacency tables in Postgres  
\- Responsibilities:  
  \- CRUD operations for graph nodes/edges  
  \- Queries:  
    \- \`get\_related\_nodes(node\_id)\`  
    \- \`get\_sops\_for\_domain(hub)\`  
    \- \`get\_agents\_for\_sop(sop\_id)\`  
  \- Provide hints to routing engine for decisioning

\#\#\# 5.6 Memory Service (\`memory-service\`)  
\- Encapsulates:  
  \- Vector search (pgvector in Supabase or separate vector DB)  
  \- Metadata store for memory slots  
\- Responsibilities:  
  \- \`store\_memory(entity, embedding, metadata)\`  
  \- \`retrieve\_memory(query\_embedding, filters)\`  
  \- Avoid leaking cross-org or cross-hub data

\#\#\# 5.7 Model Gateway (\`model-gateway\`)  
\- Encapsulates:  
  \- All direct calls to OpenAI, Anthropic, etc.  
\- Responsibilities:  
  \- Expose a stable function:  
    \- \`generate(model\_name, prompt, options)\`  
  \- Manage model-level config (temperature, max tokens)  
  \- Handle retries, timeouts, errors  
  \- Log raw usage (tokens, timing)

\---

\#\# 6\. Technology Choices (Initial Version)

These are recommended defaults and can be adjusted later:

\- \*\*Frontend\*\*  
  \- Next.js (App Router)  
  \- TypeScript  
  \- TailwindCSS

\- \*\*Backend\*\*  
  \- Node.js (TypeScript)  
  \- Either:  
    \- Next.js API routes, or  
    \- A dedicated Express/Fastify server

\- \*\*Database\*\*  
  \- Supabase (Postgres \+ pgvector)

\- \*\*Knowledge Graph\*\*  
  \- Option 1: Implement as relational tables in Postgres (nodes & edges)  
  \- Option 2: Later, swap to Neo4j or a graph DB once complexity grows

\- \*\*Memory / Vector Storage\*\*  
  \- pgvector extension in Supabase

\- \*\*LLM Providers\*\*  
  \- OpenAI (initial)  
  \- Later: Anthropic, Google, local models via dedicated connectors

\- \*\*Deployment\*\*  
  \- MVP: Single region, containerized or serverless (e.g., Vercel for frontend, Supabase for backend DB, Fly.io/Render/other for backend services)  
  \- Later: Multi-region / dedicated infra for enterprise QoS

\---

\#\# 7\. Environments

\- \*\*Local\*\*  
  \- All services run via Docker Compose or a monorepo with \`npm dev\` scripts.  
  \- Uses a local or dev Supabase instance.

\- \*\*Staging\*\*  
  \- Mirrors production architecture with lower quotas.  
  \- Used for QA and integration testing.

\- \*\*Production\*\*  
  \- Hardened configuration.  
  \- Real usage metering.  
  \- Observability and alerting enabled.

\---

\#\# 8\. Cross-Cutting Concerns

\#\#\# 8.1 Authentication & Authorization  
\- All external calls go through API Server with:  
  \- Org \+ user identification  
  \- Role-based access (admin, editor, viewer)  
\- Routing engine, graph service, agent service are internal-only (no direct external access).

\#\#\# 8.2 Logging & Observability  
\- Each major step (intent parsing, routing, agent execution, model call) logs:  
  \- Request IDs  
  \- Org and hub  
  \- Timing info  
  \- Error states  
\- Logs feed into:  
  \- Application logs (e.g., structured JSON)  
  \- Aggregated metrics (latency, throughput)  
  \- Dashboards in the Web App

\#\#\# 8.3 Error Handling  
\- Standardized error format:  
  \- \`error\_code\`, \`message\`, \`details\`  
\- Layers should transform internal errors into safe messages for clients.  
\- The routing engine should handle:  
  \- Model failures  
  \- Missing SOPs  
  \- Agent misconfigurations  
  \- Timeouts

\---

\#\# 9\. Future Extensions (v0.2+)

\- \*\*Multi-tenant Enterprise\*\*  
  \- Strict org isolation  
  \- Per-org routing policies

\- \*\*Advanced QoS\*\*  
  \- Priority queues  
  \- Dedicated agent/model pools for enterprise customers

\- \*\*Telecom-Style Topology UI\*\*  
  \- Visual maps of hubs → agents → SOPs → models

\- \*\*Plugins / Integrations\*\*  
  \- Direct connectors to:  
    \- QuickBooks  
    \- Notion  
    \- Slack  
    \- Google Drive / Sheets

\---

This \`architecture.md\` file should be treated as the \*\*source of truth\*\* for how Tenet is structured at the system level. Other docs (\`data-model.md\`, \`api-spec.md\`, etc.) will drill into specific parts of this architecture.

