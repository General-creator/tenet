
# Tenet UX Flows

**File:** `ux-flows.md`  
**Context:** Tenet — Cognitive Telecom Network  
**Purpose:** Define core user journeys, screens, and interaction patterns for the Tenet web app so Codex/engineers can implement a coherent, production-ready UI.

This file focuses on **flows and structure**, not visual styling.  
(Visual system can be layered on with Tailwind/shadcn later.)

---

## 0. UX Principles

1. **Network, not app**  
   - Tenet should *feel* like a control panel for a network (hubs, agents, traffic), not a traditional CRUD SaaS.

2. **Explainability by default**  
   - Every “AI action” must have a trace:
     - Which SOP?
     - Which agent?
     - Which model?
     - What steps?

3. **Progressive complexity**  
   - Basic users: just the **Command Console**.  
   - Power users: access to **Hubs**, **SOP Library**, **Agent Registry**, **Graph**, **Usage**.

4. **Semantic-first UI**  
   - Speak in business terms (invoice, AR workflow, month-end close), not technical ones (tokens, embeddings) unless user is in admin/tech views.

---

## 1. Core Screens

Tenet v0.1 needs the following primary screens:

1. **Command Console**
2. **Hub Dashboard(s)** (Finance, Growth, People, Ops)
3. **SOP Library**
4. **Agent Registry**
5. **Routing Trace Viewer**
6. **Usage/Bandwidth Dashboard**
7. **Org & Hub Settings (Admin)** (light for MVP)

---

## 2. Command Console

### 2.1 Purpose

- Main entry point for everyday users.
- Allow a user to “talk to” Tenet:
  - Run tasks (e.g., “Process this invoice”)
  - Ask for summaries (e.g., “What’s the AR status?”)
  - Trigger SOPs directly (e.g., “Run month-end close checklist”)

### 2.2 Layout

**Sections:**

1. **Header**
   - Org name
   - Current hub selector (dropdown: Finance, Growth, People, Ops)
   - User menu (profile/settings)

2. **Main Panel**
   - **Input box** (chat-style)
   - **History** list of past commands (left or below input)
   - **Response area** with:
     - Result (summary, structured output)
     - “View routing trace” link
     - “Save as SOP” / “Pin as pattern” actions (future)

3. **Right Sidebar (Optional)**
   - Context panel:
     - Active hub information
     - Key SOPs for this hub
     - Recently used agents
     - Quick actions (buttons):
       - “New AP invoice”
       - “AR follow-up email”
       - “Month-end checklist”

### 2.3 Example Flow: Process an Invoice

1. User selects **Finance Hub** from dropdown.
2. User types in console:  
   > “Process this invoice from Scott for $600, due Dec 1.”

3. On **submit**:
   - API: `POST /execute { text, hubKey: 'finance' }`
   - UI shows:
     - A loading state
     - Then:
       - A structured recap:
         - Vendor: Scott  
         - Amount: $600  
         - Suggested GL: Accounts Payable  
         - Status: Draft invoice created
       - Buttons:
         - “Approve & finalize”
         - “Edit fields”
         - “View routing trace”

4. If user clicks “View routing trace” → goes to **Routing Trace Viewer** for this request.

---

## 3. Hub Dashboards

One dashboard per **Hub** (domain cell).

Initial hubs for v0.1:
- Finance
- (Growth, People, Ops can be placeholders with minimal functionality)

### 3.1 Purpose

- Give a **functional overview** of what’s happening in that domain.
- Show:
  - Recent requests
  - Key SOPs
  - Key agents
  - Status/summaries (e.g., AR aging, invoice throughput)

### 3.2 Finance Hub Dashboard Layout

**Sections:**

1. **Header**
   - Hub title: “Finance Hub”
   - Hub description
   - Quick filters:
     - Time range (Today, 7d, 30d)
     - Sub-area (AP, AR, MEC, Payroll)

2. **Top Row Summary Cards**
   - “Requests (7d)”  
   - “Invoices processed (7d)”  
   - “AR follow-ups (7d)”  
   - “Estimated tokens used (7d)”

3. **Main Content (Tabs)**

Tabs:

- **Activity**
  - Table of recent `tenet_requests` for this hub.
  - Columns:
    - Time
    - User
    - Intent
    - SOP (if any)
    - Status
    - “View trace” action

- **SOPs**
  - Short list of top SOPs (AP, AR, MEC).
  - Actions:
    - “View SOP”
    - “Duplicate”
    - “Create new SOP”

- **Agents**
  - List of agents in this hub:
    - Name, specialization, active/inactive
    - Chips for skills
    - “View config” action

---

## 4. SOP Library

### 4.1 Purpose

- UI for managing SOPs:
  - Browse
  - Create
  - Edit
  - Version

### 4.2 Layout

**Sections:**

1. **Header**
   - Title: “SOP Library”
   - Filters:
     - Hub filter: dropdown (All, Finance, Growth, People, Ops)
     - Search: text input (search by name, key)
     - Status filter: active / inactive

2. **SOP List Table**
   - Columns:
     - Name
     - Key (`sopKey`)
     - Hub
     - Version
     - Active?
     - Last updated
     - Actions:
       - View
       - Edit
       - Duplicate

3. **“Create SOP” Button**
   - Opens SOP editor modal/page.

---

### 4.3 SOP Detail View

**URL:** `/sops/:id`

**Sections:**

1. **Header**
   - SOP name
   - Key  
   - Version  
   - Hub  
   - Toggle: Active / Inactive

2. **Definition Panel**
   - View (and later edit) JSON structure of SOP.
   - For v0.1, this can be a read-only code viewer with:
     - Steps list
     - Constraints

3. **Steps List (Friendly View)**
   - Cards for each step:
     - `id`, `type`, `action`, `fields`, `rules`
   - This is helpful for non-technical users.

4. **Related Agents & Graph Section**
   - List of agents that handle this SOP.
   - Link: “View in graph” (goes to Graph/Trace UI later).

---

## 5. Agent Registry

### 5.1 Purpose

- Manage and inspect agents:
  - What hubs they belong to
  - What SOPs they support
  - Their specialization and skills

### 5.2 Layout

**Sections:**

1. **Header**
   - Title: “Agents”
   - Filters:
     - Hub filter
     - Status: active/inactive
     - Search (by name, key, specialization)

2. **Agent Table**
   - Columns:
     - Name
     - Key
     - Hub
     - Specialization
     - Skills (chips)
     - Memory profile
     - Active toggle
     - Actions: “View config”

---

### 5.3 Agent Detail View

**URL:** `/agents/:id`

**Sections:**

1. **Header**
   - Agent name
   - Key  
   - Hub  
   - Active toggle

2. **Summary Cards**
   - Specialization
   - Memory profile
   - Max tokens
   - # of requests last 7 days

3. **Config Panel**
   - Code editor or JSON viewer for `agents.config`:
     - system prompt
     - supported SOP keys
     - tools

4. **Related SOPs**
   - List of SOPs where agent is a handler.

5. **Recent Activity**
   - Recent requests handled by this agent + link to traces.

---

## 6. Routing Trace Viewer

### 6.1 Purpose

- Give an explainable view of **how Tenet handled a request**:
  - Intent
  - Hub
  - SOP
  - Agent
  - Model
  - Steps performed
  - Tokens used
  - Latency

### 6.2 Entry Points

- From Command Console result → “View routing trace”
- From Request tables in Hub Dashboard → “View trace”
- From Agent detail page → click on a specific past request

### 6.3 Layout

**Sections:**

1. **Header**
   - Title: “Routing Trace”
   - Request ID
   - Timestamp
   - Status (badge: success/failed)

2. **Summary Bar**
   - Hub
   - Intent
   - SOP key
   - Agent
   - Model
   - QoS tier

3. **Timeline / Steps View**
   - Vertical timeline showing:
     - “Intent classified”
     - “Hub resolved”
     - “SOP resolved”
     - “Agent selected”
     - “Model selected”
     - SOP steps:
       - step name
       - type
       - tokens used
       - latency
       - status

4. **Raw Logs (Advanced tab)**
   - JSON view of `execution_logs.payload`
   - For debugging.

---

## 7. Usage / Bandwidth Dashboard

### 7.1 Purpose

- Visualize usage of **cognitive bandwidth**:
  - tokens
  - cost
  - by hub, agent, model

### 7.2 Layout

**Sections:**

1. **Header**
   - Title: “Usage & Bandwidth”
   - Filters:
     - Date range
     - Hub
     - Model
     - QoS tier

2. **Top Summary Cards**
   - Total tokens (period)
   - Estimated cost
   - Requests count
   - Avg tokens/request

3. **Charts**
   - Tokens over time (line chart)
   - Tokens by hub (bar/pie)
   - Tokens by model (bar/pie)

4. **Table: Detailed Usage**
   - By:
     - Date
     - Hub
     - Model
     - Agent
     - Tokens total
     - Cost

---

## 8. Org & Hub Settings (Admin)

### 8.1 Purpose

- Let admins configure:
  - Default models
  - QoS policies
  - Per-hub preferences
  - Plan/limits (view only for now)

### 8.2 Layout

**Sections:**

1. **Org Settings**
   - Default model
   - Max cost per request (soft limit)
   - Default QoS tier

2. **Hub Settings**
   - One row per hub:
     - Hub name
     - Default model
     - Allowed SOPs (optional)
     - Enabled QoS tiers (bronze/silver/gold)

---

## 9. Key User Journeys

### 9.1 Journey: “Non-technical finance user processes an invoice”

1. Logs into Tenet.
2. Lands on **Command Console**, Finance Hub selected.
3. Uploads or pastes invoice text.
4. Hits **Run**.
5. Sees:
   - Fields extracted (vendor, amount, due date).
   - Draft “recorded invoice” ready to post.
6. Optionally:
   - Clicks “View routing trace” to see which SOP and agent handled it.
7. Approves result → (future) will sync to external systems.

---

### 9.2 Journey: “Admin creates a new SOP”

1. Opens **SOP Library**.
2. Clicks “Create SOP”.
3. Enters:
   - Hub: Finance
   - Name
   - Key (`finance.ap.vendor_onboarding_v1`)
4. Uses step builder (or JSON editor) to define:
   - extract -> validate -> execute -> notify
5. Saves SOP.
6. Navigates to **Agents**, picks `finance_ap_agent`, adds new SOP key to `supportedSopKeys` in config.
7. Test via Command Console:  
   > “Onboard vendor ACME Corp for AP.”

---

### 9.3 Journey: “Ops person inspects how Tenet made a decision”

1. In **Finance Hub Dashboard**, opens “Activity” tab.
2. Clicks on a recent request.
3. Goes to **Routing Trace Viewer**.
4. Reviews:
   - Which SOP was used
   - Which agent executed
   - Each SOP step outcome
   - Timing/tokens
5. Uses this as:
   - proof-of-work for clients
   - debugging tool for mis-routed cases

---

## 10. Frontend Implementation Notes

- Framework: **Next.js + TypeScript**
- UI libraries:
  - TailwindCSS  
  - shadcn/ui components if desired (cards, tables, tabs, modals)
- State:
  - Use React Query or SWR for data fetching from `/api` routes.
- Routing:
  - App Router (e.g., `/console`, `/hubs/finance`, `/sops`, `/agents`, `/requests/:id`)

---

## 11. Source of Truth

- Behavior & flows: this `ux-flows.md`
- Data & types: `data-model.md`
- API contracts: `api-spec.md`
- Routing logic: `routing-engine-spec.md`
- SOPs & agents: `agents-and-sops-spec.md`

Codex/engineers should use **all of the above** to build UI components and flows that align with Tenet’s **Cognitive Telecom** model.

