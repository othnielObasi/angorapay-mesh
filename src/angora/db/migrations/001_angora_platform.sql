-- Angora production schema skeleton.
-- Use this as the durable PostgreSQL target when replacing local JSON stores.

CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  member_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  user_id TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_policies (
  policy_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(workspace_id),
  policy JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_budgets (
  budget_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(workspace_id),
  budget JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  key_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  tenant_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  label TEXT NOT NULL,
  hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversation_threads (
  conversation_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  specialist_agent TEXT,
  mission_id TEXT,
  total_usdc NUMERIC(18, 6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  message_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversation_threads(conversation_id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  mission_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_traces (
  trace_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  conversation_id TEXT,
  mission_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mission_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  conversation_id TEXT,
  mission_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  resume_from TEXT NOT NULL,
  idempotency_key TEXT,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS provider_services (
  service_id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  manifest JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_provider_access (
  access_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, provider_id)
);

CREATE TABLE IF NOT EXISTS payment_intents (
  payment_intent_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  mission_id TEXT NOT NULL,
  provider_id TEXT,
  service_id TEXT,
  idempotency_key TEXT,
  amount_usdc NUMERIC(18, 6),
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS payment_events (
  payment_event_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  payment_intent_id TEXT,
  receipt_id TEXT,
  mission_id TEXT,
  payment_reference TEXT,
  payment_status TEXT NOT NULL,
  settlement_status TEXT NOT NULL,
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_deliveries (
  provider_delivery_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  payment_intent_id TEXT,
  receipt_id TEXT,
  mission_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  status TEXT NOT NULL,
  output_hash TEXT,
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  mission_id TEXT NOT NULL,
  provider_id TEXT,
  service_id TEXT,
  payment_reference TEXT,
  amount_usdc NUMERIC(18, 6),
  output_hash TEXT,
  reconciliation_status TEXT,
  receipt JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconciliation_runs (
  reconciliation_run_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  checked INT NOT NULL DEFAULT 0,
  matched INT NOT NULL DEFAULT 0,
  pending INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconciliation_items (
  reconciliation_item_id TEXT PRIMARY KEY,
  reconciliation_run_id TEXT NOT NULL REFERENCES reconciliation_runs(reconciliation_run_id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  receipt_id TEXT,
  status TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traces_workspace_mission ON agent_traces(workspace_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_receipts_workspace_mission ON receipts(workspace_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_payments_workspace_mission ON payment_intents(workspace_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_logs(workspace_id, created_at DESC);
