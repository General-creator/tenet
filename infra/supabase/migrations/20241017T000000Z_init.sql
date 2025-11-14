BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE request_source AS ENUM ('console', 'api', 'integration');
CREATE TYPE request_priority AS ENUM ('low', 'normal', 'high');
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE qos_tier AS ENUM ('bronze', 'silver', 'gold');
CREATE TYPE execution_status AS ENUM ('started', 'success', 'error');
CREATE TYPE memory_scope AS ENUM ('org', 'hub', 'agent', 'user');

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role user_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

CREATE TABLE hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

CREATE TABLE sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  sop_key text NOT NULL,
  name text NOT NULL,
  description text,
  version int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  definition jsonb NOT NULL,
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, sop_key, version)
);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  agent_key text NOT NULL,
  name text NOT NULL,
  description text,
  specialization text,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  memory_profile text,
  max_tokens int,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, agent_key)
);

CREATE TABLE tenet_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  source request_source NOT NULL DEFAULT 'console',
  raw_input text NOT NULL,
  intent text,
  sop_key text,
  priority request_priority NOT NULL DEFAULT 'normal',
  status request_status NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routing_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES tenet_requests (id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  sop_id uuid REFERENCES sops (id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents (id) ON DELETE SET NULL,
  model_name text,
  qos_tier qos_tier,
  estimated_cost numeric(12,6) DEFAULT 0,
  estimated_tokens int DEFAULT 0,
  estimated_latency_ms int,
  decision_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES tenet_requests (id) ON DELETE CASCADE,
  routing_id uuid REFERENCES routing_decisions (id) ON DELETE SET NULL,
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents (id) ON DELETE SET NULL,
  sop_id uuid REFERENCES sops (id) ON DELETE SET NULL,
  step_name text,
  status execution_status NOT NULL,
  detail text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  tokens_used int,
  latency_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  node_key text NOT NULL,
  node_type text NOT NULL,
  label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, node_key)
);

CREATE TABLE graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  from_node_id uuid NOT NULL REFERENCES graph_nodes (id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES graph_nodes (id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  weight numeric(6,3),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, from_node_id, to_node_id, relation_type)
);

CREATE TABLE memory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents (id) ON DELETE SET NULL,
  sop_id uuid REFERENCES sops (id) ON DELETE SET NULL,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  scope memory_scope NOT NULL,
  entity_key text,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  hub_id uuid REFERENCES hubs (id) ON DELETE SET NULL,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  request_id uuid REFERENCES tenet_requests (id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents (id) ON DELETE SET NULL,
  model_name text,
  qos_tier qos_tier,
  tokens_prompt int NOT NULL DEFAULT 0,
  tokens_completion int NOT NULL DEFAULT 0,
  tokens_total int NOT NULL DEFAULT 0,
  cost numeric(12,6),
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tenet_requests_org_created_at_idx ON tenet_requests (org_id, created_at DESC);
CREATE INDEX tenet_requests_org_hub_created_at_idx ON tenet_requests (org_id, hub_id, created_at DESC);
CREATE INDEX routing_decisions_request_idx ON routing_decisions (request_id);
CREATE INDEX routing_decisions_org_created_at_idx ON routing_decisions (org_id, created_at DESC);
CREATE INDEX execution_logs_request_idx ON execution_logs (request_id);
CREATE INDEX execution_logs_org_created_at_idx ON execution_logs (org_id, created_at DESC);
CREATE INDEX graph_nodes_org_type_idx ON graph_nodes (org_id, node_type);
CREATE INDEX graph_edges_org_from_idx ON graph_edges (org_id, from_node_id);
CREATE INDEX graph_edges_org_to_idx ON graph_edges (org_id, to_node_id);
CREATE INDEX memory_records_org_scope_idx ON memory_records (org_id, scope);
CREATE INDEX memory_records_embedding_idx ON memory_records USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON organizations
  FOR SELECT
  USING (id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY organizations_insert_service ON organizations
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY organizations_update ON organizations
  FOR UPDATE
  USING (id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY organizations_delete_service ON organizations
  FOR DELETE
  USING (auth.role() = 'service_role');

CREATE POLICY users_org_access ON users
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY hubs_org_access ON hubs
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY sops_org_access ON sops
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY agents_org_access ON agents
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY tenet_requests_org_access ON tenet_requests
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY routing_decisions_org_access ON routing_decisions
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY execution_logs_org_access ON execution_logs
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY graph_nodes_org_access ON graph_nodes
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY graph_edges_org_access ON graph_edges
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY memory_records_org_access ON memory_records
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

CREATE POLICY usage_records_org_access ON usage_records
  FOR ALL
  USING (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role')
  WITH CHECK (org_id::text = coalesce(auth.jwt()->>'org_id', '') OR auth.role() = 'service_role');

DO $$
DECLARE
  demo_org_id uuid;
  admin_user_id uuid;
  finance_user_id uuid;
  hub_finance uuid;
  hub_growth uuid;
  hub_people uuid;
  hub_ops uuid;
  sop_ap_id uuid;
  sop_ar_id uuid;
  sop_mec_id uuid;
  agent_ap_id uuid;
  agent_ar_id uuid;
  agent_mec_id uuid;
  node_sop_ap uuid;
  node_sop_ar uuid;
  node_sop_mec uuid;
  node_agent_ap uuid;
  node_agent_ar uuid;
  node_agent_mec uuid;
  request_ap_id uuid;
  request_ar_id uuid;
  request_mec_id uuid;
  routing_ap_id uuid;
  routing_ar_id uuid;
  routing_mec_id uuid;
BEGIN
  INSERT INTO organizations (name, slug)
  VALUES ('Tenet Demo Corp', 'tenet-demo')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO demo_org_id;

  INSERT INTO users (org_id, email, name, role)
  VALUES
    (demo_org_id, 'demo.admin@tenet.local', 'Demo Admin', 'admin')
  ON CONFLICT (org_id, email) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO users (org_id, email, name, role)
  VALUES
    (demo_org_id, 'demo.finance@tenet.local', 'Finance User', 'member')
  ON CONFLICT (org_id, email) DO UPDATE SET name = EXCLUDED.name;

  SELECT id INTO admin_user_id FROM users WHERE org_id = demo_org_id AND email = 'demo.admin@tenet.local';
  SELECT id INTO finance_user_id FROM users WHERE org_id = demo_org_id AND email = 'demo.finance@tenet.local';

  INSERT INTO hubs (org_id, key, name, description)
  VALUES (demo_org_id, 'finance', 'Finance Hub', 'Accounts Payable, Accounts Receivable, and Month-End Close.')
  ON CONFLICT (org_id, key) DO UPDATE SET name = EXCLUDED.name;
  INSERT INTO hubs (org_id, key, name, description)
  VALUES (demo_org_id, 'growth', 'Growth Hub', 'Marketing, sales, and growth experiments.')
  ON CONFLICT (org_id, key) DO UPDATE SET name = EXCLUDED.name;
  INSERT INTO hubs (org_id, key, name, description)
  VALUES (demo_org_id, 'people', 'People Hub', 'HR, onboarding, and internal communication.')
  ON CONFLICT (org_id, key) DO UPDATE SET name = EXCLUDED.name;
  INSERT INTO hubs (org_id, key, name, description)
  VALUES (demo_org_id, 'ops', 'Ops Hub', 'Operations, logistics, and field workflows.')
  ON CONFLICT (org_id, key) DO UPDATE SET name = EXCLUDED.name;

  SELECT id INTO hub_finance FROM hubs WHERE org_id = demo_org_id AND key = 'finance';
  SELECT id INTO hub_growth FROM hubs WHERE org_id = demo_org_id AND key = 'growth';
  SELECT id INTO hub_people FROM hubs WHERE org_id = demo_org_id AND key = 'people';
  SELECT id INTO hub_ops FROM hubs WHERE org_id = demo_org_id AND key = 'ops';

  INSERT INTO sops (org_id, hub_id, sop_key, name, description, version, is_active, definition, created_by)
  VALUES
    (demo_org_id, hub_finance, 'finance.ap.invoice_v1', 'AP - Process Invoice', 'Standard AP invoice intake & posting', 1, true,
     '{"sopId":"finance.ap.invoice_v1","name":"AP - Process Invoice","description":"Standard AP invoice intake & posting","version":1,"steps":[{"id":1,"type":"extract_fields","fields":["vendor","amount","invoice_date","due_date","invoice_number"]},{"id":2,"type":"validate","rules":["amount > 0","invoice_date <= today","due_date >= invoice_date"]},{"id":3,"type":"execute","action":"record_invoice","config":{"targetSystem":"quickbooks","glAccount":"accounts_payable"}},{"id":4,"type":"notify","config":{"channel":"log","template":"ap_invoice_processed"}}],"constraints":{"latencyMs":5000,"model":"gpt-5.1","maxTokens":8000}}'::jsonb,
     admin_user_id)
  ON CONFLICT (org_id, sop_key, version) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO sops (org_id, hub_id, sop_key, name, description, version, is_active, definition, created_by)
  VALUES
    (demo_org_id, hub_finance, 'finance.ar.collection_v1', 'AR - Collection Workflow', 'Standard AR communication flow for overdue invoices', 1, true,
     '{"sopId":"finance.ar.collection_v1","name":"AR - Collection Workflow","description":"Standard AR communication flow for overdue invoices","version":1,"steps":[{"id":1,"type":"extract_fields","fields":["customer_name","invoice_number","amount","due_date"]},{"id":2,"type":"validate","rules":["amount > 0"]},{"id":3,"type":"execute","action":"generate_collection_email","config":{"tone":"firm_but_polite"}},{"id":4,"type":"notify","config":{"channel":"log","template":"ar_collection_email_draft"}}]}'::jsonb,
     admin_user_id)
  ON CONFLICT (org_id, sop_key, version) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO sops (org_id, hub_id, sop_key, name, description, version, is_active, definition, created_by)
  VALUES
    (demo_org_id, hub_finance, 'finance.mec.close_month_v1', 'Month-End Close', 'Checklist-style SOP for month-end close', 1, true,
     '{"sopId":"finance.mec.close_month_v1","name":"Month-End Close","description":"Checklist-style SOP for month-end close","version":1,"steps":[{"id":1,"type":"execute","action":"prepare_mec_checklist","config":{"sections":["AP","AR","bank_recon","journal_entries"]}},{"id":2,"type":"route","config":{"sopKey":"finance.ap.invoice_v1"}},{"id":3,"type":"route","config":{"sopKey":"finance.ar.collection_v1"}},{"id":4,"type":"notify","config":{"channel":"log","template":"mec_summary"}}]}'::jsonb,
     admin_user_id)
  ON CONFLICT (org_id, sop_key, version) DO UPDATE SET name = EXCLUDED.name;

  SELECT id INTO sop_ap_id FROM sops WHERE org_id = demo_org_id AND sop_key = 'finance.ap.invoice_v1' AND version = 1;
  SELECT id INTO sop_ar_id FROM sops WHERE org_id = demo_org_id AND sop_key = 'finance.ar.collection_v1' AND version = 1;
  SELECT id INTO sop_mec_id FROM sops WHERE org_id = demo_org_id AND sop_key = 'finance.mec.close_month_v1' AND version = 1;

  INSERT INTO agents (org_id, hub_id, agent_key, name, description, specialization, skills, memory_profile, max_tokens, config, is_active)
  VALUES
    (demo_org_id, hub_finance, 'finance_ap_agent', 'Finance AP Agent', 'Handles accounts payable invoice intake and posting.', 'payables',
     '["extract_invoice_fields","validate_invoice","record_invoice"]'::jsonb, 'short', 32000,
     '{"systemPrompt":"You are the Finance AP Agent for Tenet. Your role is to extract invoice fields, validate them using SOP rules, and prepare structured invoice objects. Never guess missing values; ask for clarification if required fields are missing.","supportedSopKeys":["finance.ap.invoice_v1"]}'::jsonb, true)
  ON CONFLICT (org_id, agent_key) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO agents (org_id, hub_id, agent_key, name, description, specialization, skills, memory_profile, max_tokens, config, is_active)
  VALUES
    (demo_org_id, hub_finance, 'finance_ar_agent', 'Finance AR Agent', 'Handles accounts receivable follow-up and communication.', 'receivables',
     '["generate_collection_email","summarize_payment_status"]'::jsonb, 'medium', 32000,
     '{"systemPrompt":"You are the Finance AR Agent for Tenet. You prepare polite but firm collection emails and summarize AR status. Never fabricate payment data; only use what is provided or in memory.","supportedSopKeys":["finance.ar.collection_v1"]}'::jsonb, true)
  ON CONFLICT (org_id, agent_key) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO agents (org_id, hub_id, agent_key, name, description, specialization, skills, memory_profile, max_tokens, config, is_active)
  VALUES
    (demo_org_id, hub_finance, 'finance_mec_agent', 'Finance MEC Agent', 'Coordinates month-end close tasks and checklists.', 'month_end_close',
     '["prepare_mec_checklist","summarize_mec_status"]'::jsonb, 'long', 64000,
     '{"systemPrompt":"You are the Finance MEC Agent for Tenet. You orchestrate month-end close SOPs and prepare summaries. Mark tasks incomplete when data is missing; do not fabricate balances.","supportedSopKeys":["finance.mec.close_month_v1"]}'::jsonb, true)
  ON CONFLICT (org_id, agent_key) DO UPDATE SET name = EXCLUDED.name;

  SELECT id INTO agent_ap_id FROM agents WHERE org_id = demo_org_id AND agent_key = 'finance_ap_agent';
  SELECT id INTO agent_ar_id FROM agents WHERE org_id = demo_org_id AND agent_key = 'finance_ar_agent';
  SELECT id INTO agent_mec_id FROM agents WHERE org_id = demo_org_id AND agent_key = 'finance_mec_agent';

  INSERT INTO graph_nodes (org_id, hub_id, node_key, node_type, label)
  VALUES
    (demo_org_id, hub_finance, 'sop.finance.ap.invoice_v1', 'sop', 'AP - Process Invoice')
  ON CONFLICT (org_id, node_key) DO UPDATE SET label = EXCLUDED.label;

  INSERT INTO graph_nodes (org_id, hub_id, node_key, node_type, label)
  VALUES
    (demo_org_id, hub_finance, 'sop.finance.ar.collection_v1', 'sop', 'AR - Collection Workflow')
  ON CONFLICT (org_id, node_key) DO UPDATE SET label = EXCLUDED.label;

  INSERT INTO graph_nodes (org_id, hub_id, node_key, node_type, label)
  VALUES
    (demo_org_id, hub_finance, 'sop.finance.mec.close_month_v1', 'sop', 'Month-End Close')
  ON CONFLICT (org_id, node_key) DO UPDATE SET label = EXCLUDED.label;

  INSERT INTO graph_nodes (org_id, hub_id, node_key, node_type, label)
  VALUES
    (demo_org_id, hub_finance, 'agent.finance_ap_agent', 'agent', 'Finance AP Agent')
  ON CONFLICT (org_id, node_key) DO UPDATE SET label = EXCLUDED.label;

  INSERT INTO graph_nodes (org_id, hub_id, node_key, node_type, label)
  VALUES
    (demo_org_id, hub_finance, 'agent.finance_ar_agent', 'agent', 'Finance AR Agent')
  ON CONFLICT (org_id, node_key) DO UPDATE SET label = EXCLUDED.label;

  INSERT INTO graph_nodes (org_id, hub_id, node_key, node_type, label)
  VALUES
    (demo_org_id, hub_finance, 'agent.finance_mec_agent', 'agent', 'Finance MEC Agent')
  ON CONFLICT (org_id, node_key) DO UPDATE SET label = EXCLUDED.label;

  SELECT id INTO node_sop_ap FROM graph_nodes WHERE org_id = demo_org_id AND node_key = 'sop.finance.ap.invoice_v1';
  SELECT id INTO node_sop_ar FROM graph_nodes WHERE org_id = demo_org_id AND node_key = 'sop.finance.ar.collection_v1';
  SELECT id INTO node_sop_mec FROM graph_nodes WHERE org_id = demo_org_id AND node_key = 'sop.finance.mec.close_month_v1';
  SELECT id INTO node_agent_ap FROM graph_nodes WHERE org_id = demo_org_id AND node_key = 'agent.finance_ap_agent';
  SELECT id INTO node_agent_ar FROM graph_nodes WHERE org_id = demo_org_id AND node_key = 'agent.finance_ar_agent';
  SELECT id INTO node_agent_mec FROM graph_nodes WHERE org_id = demo_org_id AND node_key = 'agent.finance_mec_agent';

  INSERT INTO graph_edges (org_id, from_node_id, to_node_id, relation_type)
  VALUES (demo_org_id, node_sop_ap, node_agent_ap, 'handled_by')
  ON CONFLICT (org_id, from_node_id, to_node_id, relation_type) DO NOTHING;
  INSERT INTO graph_edges (org_id, from_node_id, to_node_id, relation_type)
  VALUES (demo_org_id, node_sop_ar, node_agent_ar, 'handled_by')
  ON CONFLICT (org_id, from_node_id, to_node_id, relation_type) DO NOTHING;
  INSERT INTO graph_edges (org_id, from_node_id, to_node_id, relation_type)
  VALUES (demo_org_id, node_sop_mec, node_agent_mec, 'handled_by')
  ON CONFLICT (org_id, from_node_id, to_node_id, relation_type) DO NOTHING;
  INSERT INTO graph_edges (org_id, from_node_id, to_node_id, relation_type)
  VALUES (demo_org_id, node_sop_mec, node_sop_ap, 'depends_on')
  ON CONFLICT (org_id, from_node_id, to_node_id, relation_type) DO NOTHING;
  INSERT INTO graph_edges (org_id, from_node_id, to_node_id, relation_type)
  VALUES (demo_org_id, node_sop_mec, node_sop_ar, 'depends_on')
  ON CONFLICT (org_id, from_node_id, to_node_id, relation_type) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM tenet_requests WHERE org_id = demo_org_id AND sop_key = 'finance.ap.invoice_v1' AND metadata ->> 'seed' = 'true') THEN
    INSERT INTO tenet_requests (org_id, hub_id, user_id, source, raw_input, intent, sop_key, priority, status, metadata)
    VALUES (demo_org_id, hub_finance, admin_user_id, 'console', 'Process this invoice from Scott Ventures for $600, due Dec 1.', 'process_invoice', 'finance.ap.invoice_v1', 'normal', 'completed', '{"seed":true}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tenet_requests WHERE org_id = demo_org_id AND sop_key = 'finance.ar.collection_v1' AND metadata ->> 'seed' = 'true') THEN
    INSERT INTO tenet_requests (org_id, hub_id, user_id, source, raw_input, intent, sop_key, priority, status, metadata)
    VALUES (demo_org_id, hub_finance, finance_user_id, 'console', 'Draft a collection email for overdue invoice #1235 for $1,200 from ACME, due 30 days ago.', 'collections_follow_up', 'finance.ar.collection_v1', 'normal', 'completed', '{"seed":true}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tenet_requests WHERE org_id = demo_org_id AND sop_key = 'finance.mec.close_month_v1' AND metadata ->> 'seed' = 'true') THEN
    INSERT INTO tenet_requests (org_id, hub_id, user_id, source, raw_input, intent, sop_key, priority, status, metadata)
    VALUES (demo_org_id, hub_finance, admin_user_id, 'console', 'Run month-end close checklist.', 'close_month', 'finance.mec.close_month_v1', 'high', 'completed', '{"seed":true}'::jsonb);
  END IF;

  SELECT id INTO request_ap_id FROM tenet_requests WHERE org_id = demo_org_id AND sop_key = 'finance.ap.invoice_v1' ORDER BY created_at LIMIT 1;
  SELECT id INTO request_ar_id FROM tenet_requests WHERE org_id = demo_org_id AND sop_key = 'finance.ar.collection_v1' ORDER BY created_at LIMIT 1;
  SELECT id INTO request_mec_id FROM tenet_requests WHERE org_id = demo_org_id AND sop_key = 'finance.mec.close_month_v1' ORDER BY created_at LIMIT 1;

  IF request_ap_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM routing_decisions WHERE request_id = request_ap_id) THEN
    INSERT INTO routing_decisions (request_id, org_id, hub_id, sop_id, agent_id, model_name, qos_tier, estimated_cost, estimated_tokens, estimated_latency_ms, decision_payload)
    VALUES (request_ap_id, demo_org_id, hub_finance, sop_ap_id, agent_ap_id, 'gpt-5.1', 'silver', 0.0042, 620, 1200,
      '{"intent":{"intent":"process_invoice","domain":"finance","sopKey":"finance.ap.invoice_v1","confidence":0.93},"reasoning":{"hubSelection":"finance","sopSelection":"AP - Process Invoice","agentSelection":"Finance AP Agent","modelSelection":"gpt-5.1"}}'::jsonb);
  END IF;

  IF request_ar_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM routing_decisions WHERE request_id = request_ar_id) THEN
    INSERT INTO routing_decisions (request_id, org_id, hub_id, sop_id, agent_id, model_name, qos_tier, estimated_cost, estimated_tokens, estimated_latency_ms, decision_payload)
    VALUES (request_ar_id, demo_org_id, hub_finance, sop_ar_id, agent_ar_id, 'gpt-5.1', 'silver', 0.0031, 540, 1100,
      '{"intent":{"intent":"collections_follow_up","domain":"finance","sopKey":"finance.ar.collection_v1","confidence":0.9},"reasoning":{"hubSelection":"finance","sopSelection":"AR - Collection Workflow","agentSelection":"Finance AR Agent","modelSelection":"gpt-5.1"}}'::jsonb);
  END IF;

  IF request_mec_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM routing_decisions WHERE request_id = request_mec_id) THEN
    INSERT INTO routing_decisions (request_id, org_id, hub_id, sop_id, agent_id, model_name, qos_tier, estimated_cost, estimated_tokens, estimated_latency_ms, decision_payload)
    VALUES (request_mec_id, demo_org_id, hub_finance, sop_mec_id, agent_mec_id, 'gpt-5.1', 'gold', 0.0105, 980, 1800,
      '{"intent":{"intent":"close_month","domain":"finance","sopKey":"finance.mec.close_month_v1","confidence":0.88},"reasoning":{"hubSelection":"finance","sopSelection":"Month-End Close","agentSelection":"Finance MEC Agent","modelSelection":"gpt-5.1"}}'::jsonb);
  END IF;

  SELECT id INTO routing_ap_id FROM routing_decisions WHERE request_id = request_ap_id ORDER BY created_at LIMIT 1;
  SELECT id INTO routing_ar_id FROM routing_decisions WHERE request_id = request_ar_id ORDER BY created_at LIMIT 1;
  SELECT id INTO routing_mec_id FROM routing_decisions WHERE request_id = request_mec_id ORDER BY created_at LIMIT 1;

  IF routing_ap_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM execution_logs WHERE routing_id = routing_ap_id) THEN
    INSERT INTO execution_logs (request_id, routing_id, org_id, hub_id, agent_id, sop_id, step_name, status, detail, tokens_used, latency_ms)
    VALUES
      (request_ap_id, routing_ap_id, demo_org_id, hub_finance, agent_ap_id, sop_ap_id, 'extract_fields', 'success', 'Extracted vendor, amount, and due date.', 200, 450),
      (request_ap_id, routing_ap_id, demo_org_id, hub_finance, agent_ap_id, sop_ap_id, 'validate', 'success', 'amount > 0 and due_date >= invoice_date', 130, 320),
      (request_ap_id, routing_ap_id, demo_org_id, hub_finance, agent_ap_id, sop_ap_id, 'record_invoice', 'success', 'Prepared invoice record object.', 170, 380);
  END IF;

  IF routing_ar_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM execution_logs WHERE routing_id = routing_ar_id) THEN
    INSERT INTO execution_logs (request_id, routing_id, org_id, hub_id, agent_id, sop_id, step_name, status, detail, tokens_used, latency_ms)
    VALUES
      (request_ar_id, routing_ar_id, demo_org_id, hub_finance, agent_ar_id, sop_ar_id, 'extract_fields', 'success', 'Captured customer, invoice, amount, and due date.', 180, 430),
      (request_ar_id, routing_ar_id, demo_org_id, hub_finance, agent_ar_id, sop_ar_id, 'validate', 'success', 'Validated amount > 0.', 120, 300),
      (request_ar_id, routing_ar_id, demo_org_id, hub_finance, agent_ar_id, sop_ar_id, 'generate_collection_email', 'success', 'Drafted firm but polite email.', 210, 420);
  END IF;

  IF routing_mec_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM execution_logs WHERE routing_id = routing_mec_id) THEN
    INSERT INTO execution_logs (request_id, routing_id, org_id, hub_id, agent_id, sop_id, step_name, status, detail, tokens_used, latency_ms)
    VALUES
      (request_mec_id, routing_mec_id, demo_org_id, hub_finance, agent_mec_id, sop_mec_id, 'prepare_mec_checklist', 'success', 'Prepared checklist covering AP, AR, bank recon, journal entries.', 260, 600),
      (request_mec_id, routing_mec_id, demo_org_id, hub_finance, agent_mec_id, sop_mec_id, 'route_finance.ap.invoice_v1', 'success', 'Delegated AP SOP.', 140, 350),
      (request_mec_id, routing_mec_id, demo_org_id, hub_finance, agent_mec_id, sop_mec_id, 'route_finance.ar.collection_v1', 'success', 'Delegated AR SOP.', 150, 360);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM memory_records WHERE org_id = demo_org_id AND entity_key = 'continuum_health_ar') THEN
    INSERT INTO memory_records (org_id, hub_id, scope, entity_key, content, metadata)
    VALUES (demo_org_id, hub_finance, 'hub', 'continuum_health_ar', 'Invoice from Scott Ventures for $600 processed on 2025-11-01.', '{"tags":["invoice","Scott Ventures","AP"]}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM memory_records WHERE org_id = demo_org_id AND entity_key = 'ar_policy') THEN
    INSERT INTO memory_records (org_id, hub_id, scope, entity_key, content, metadata)
    VALUES (demo_org_id, hub_finance, 'hub', 'ar_policy', 'For invoices over 30 days overdue, AR emails should be firm but polite and include a summary of outstanding balance.', '{"tags":["policy","AR"]}'::jsonb);
  END IF;
END
$$;

COMMIT;
