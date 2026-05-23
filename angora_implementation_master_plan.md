# Angora Implementation Master Plan
## Production Roadmap for Angora Market Intelligence Agents + Angora Gateway

## 1. Purpose of This Document

This document consolidates everything that needs to be implemented for Angora to become a real-world, production-usable platform.

The goal is not to build a generic hackathon demo. The goal is to build a multi-tenant platform where teams can run specialist market-intelligence agents that buy trusted paid signals, use Circle/x402 payments, generate receipts, preserve traces, reconcile payments and provider delivery, and expose SDK/Gateway access to developers.

---

## 2. Final Product Direction

### Product Name
**Angora Market Intelligence Agents**

### Infrastructure Layer
**Angora Gateway / Angora SDK / AngoraPay Mesh**

### One-Line Positioning
Angora helps market agents buy trusted intelligence before they act.

### Expanded Positioning
Angora is a multi-tenant paid-intelligence operating layer for AI market agents. It combines specialist agents, provider routing, policy controls, Circle/x402 payments, proof receipts, traces, reconciliation, and SDK/Gateway access.

### What Angora Is Not
Angora is not simply:

- another AI trading bot
- a generic payment gateway
- a static provider marketplace
- a dashboard-only hackathon demo

### What Angora Is
Angora is:

- a specialist agent system
- a paid intelligence gateway
- a trusted provider-routing layer
- a payment/proof/reconciliation layer
- a developer platform for market-agent builders
- a multi-tenant workspace for teams using agentic market workflows

---

## 3. Core Painpoint Being Solved

AI market agents need paid external intelligence before taking or recommending market action.

They may need:

- prediction-market odds
- liquidity data
- news sentiment
- risk checks
- cross-venue price feeds
- slippage estimates
- social-trading signals
- trader performance data
- proof writers

The hard problem is not only whether an agent can pay. The real problem is:

> Which intelligence should the agent buy, which provider should it trust, what should be blocked, how should payment happen, and how can the paid signal be proven and reconciled later?

Angora solves this by managing the full workflow:

```text
Mission
→ specialist agent
→ context and policy
→ provider discovery
→ route scoring
→ policy evaluation
→ Circle/x402 payment
→ provider delivery
→ receipt/proof
→ trace
→ reconciliation
→ recommendation
```

---

## 4. Circle Commercial Value

Circle provides the payment rail. Angora creates the application and coordination layer that makes agent payments useful in real workflows.

### What Circle Enables
- USDC payments
- x402-style paid HTTP service access
- wallet/payment primitives
- Arc/USDC settlement context

### What Angora Adds Above Circle
- specialist market-agent workflows
- provider discovery
- route scoring
- trust checks
- policy and budget controls
- payment-to-delivery reconciliation
- receipts and proof
- traces and conversation history
- developer SDK adoption
- multi-tenant team/workspace usage

### Commercial Relevance to Circle
Angora can create recurring USDC/x402 transaction demand because each market mission may buy several paid signals.

Example mission:

```text
Prediction Market Agent mission
- Odds signal: 0.004 USDC
- Sentiment signal: 0.003 USDC
- Risk check: 0.005 USDC
- Proof writer: 0.001 USDC
Total: 0.013 USDC per mission
```

At scale:

```text
one mission → multiple paid signals
one agent → many missions
one workspace → many agents
many providers → many paid services
```

---

## 5. Primary Users

## 5.1 Agent Builders / Developer Teams

These users build market-facing agents and need paid intelligence inside their applications.

They use:

- SDK
- Gateway APIs
- Agent Missions API
- receipts
- traces
- reconciliation records

## 5.2 Market Teams / Analysts / Operators

These users run agent missions through the UI.

They use:

- Agent Missions workspace
- Conversations
- Proof
- Payments
- Traces
- Metrics

## 5.3 Paid Intelligence Providers

These users provide paid APIs and services.

They register:

- odds feeds
- sentiment APIs
- risk checks
- arbitrage feeds
- liquidity services
- social trading intelligence
- proof writers

## 5.4 Workspace Admins

These users manage:

- users
- roles
- API keys
- agent budgets
- payment settings
- policies
- provider access
- audit logs

## 5.5 Auditors / Evaluators

These users inspect:

- traces
- receipts
- reconciliation status
- payment history
- provider delivery records
- policy decisions

---

## 6. Specialist Agents to Implement

## 6.1 Prediction Market Intelligence Agent

### Purpose
Evaluates whether a prediction-market opportunity is mispriced or potentially +EV.

### Example Mission
“Check whether this BTC prediction market is mispriced after the news shift.”

### Required Intelligence
- odds feed
- liquidity depth
- news sentiment
- event probability movement
- risk check
- proof receipt

### Output
- recommendation: enter / monitor / avoid / reduce size
- confidence score
- signal summary
- approved providers
- blocked providers
- USDC routed
- receipts created
- trace link
- reconciliation state

---

## 6.2 Cross-Venue Arbitrage Agent

### Purpose
Evaluates whether a price gap across venues is executable after fees, slippage, liquidity, latency, and risk.

### Example Mission
“Check whether the BTC price gap across two venues survives fees and slippage.”

### Required Intelligence
- venue A price
- venue B price
- spread check
- liquidity check
- fee estimate
- slippage estimate
- execution risk
- proof receipt

### Output
- executable / monitor / reject
- gross spread
- net spread
- execution risk
- approved providers
- blocked providers
- USDC routed
- receipts created

---

## 6.3 Social Trading Intelligence Agent

### Purpose
Evaluates whether a trader, influencer, or social-alpha signal is reliable enough to follow.

### Example Mission
“Evaluate whether this trader signal is reliable enough to follow with reduced size.”

### Required Intelligence
- trader history
- signal consistency
- social sentiment
- drawdown pattern
- copy-risk score
- source credibility
- proof receipt

### Output
- follow / follow with reduced size / monitor / reject
- signal quality
- copy-risk score
- source credibility
- approved providers
- blocked providers
- receipts

---

## 7. Multi-Tenant Requirements

Angora must be built as a multi-tenant platform. A tenant should be represented as a workspace or organization.

Each workspace must own its own:

- users
- roles
- conversations
- missions
- agents
- API keys
- policies
- budgets
- provider access controls
- payment settings
- receipts
- traces
- reconciliation records
- metrics
- audit logs

### Required Roles

```text
Owner
Admin
Builder / Developer
Analyst / Operator
Provider
Viewer / Auditor
```

### Core Rule
Every major query must be scoped by `workspaceId`.

Wrong:

```ts
getReceipts();
```

Right:

```ts
getReceipts({ workspaceId });
```

### Entities That Must Include Workspace Scope

- conversations
- messages
- missions
- traces
- checkpoints
- receipts
- payment intents
- payment events
- provider deliveries
- reconciliation runs
- API keys
- budgets
- policies
- metrics
- audit logs

---

## 8. Pages to Implement

## 8.1 Landing Page

### Goal
Explain Angora clearly without burying infrastructure.

### Message
Deploy specialist market-intelligence agents powered by production-grade payment, routing, proof, and reconciliation infrastructure.

### Must Show
- product layer: specialist agents
- infrastructure layer: Gateway/SDK, provider routing, x402 payments, receipts, traces, reconciliation
- one concrete mission example
- developer adoption path

### Avoid
- too many metric cards
- noisy visuals
- hiding the infrastructure
- making it look like only a trading bot

---

## 8.2 Agent Missions Page

### Goal
Main operational surface where users run market-intelligence missions.

### Layout Recommendation

```text
Left: conversation history / mission threads
Center: chat-style mission workspace
Right: mission proof/payment panel
```

### Must Include
- specialist agent selector
- mission composer
- budget controls
- provider trust threshold
- proof required toggle
- payment mode indicator
- run mission button
- live status
- final recommendation
- providers used
- providers blocked
- USDC routed
- receipt links
- trace link
- reconciliation status

---

## 8.3 Conversations Page

### Goal
ChatGPT-style conversation history for mission threads.

### Must Include
- conversation title
- selected agent
- mission status
- last recommendation
- linked receipts
- linked traces
- total USDC routed
- created date
- last activity
- workspace/user ownership

### Requirements
- persistent across sessions
- tenant-scoped
- role-based access
- searchable
- resumable

---

## 8.4 Traces Page

### Goal
Show what happened during the agent run.

### Must Include
- mission created
- agent selected
- context prepared
- providers discovered
- route decisions
- policy outcomes
- payment attempts
- provider delivery
- receipt creation
- reconciliation events
- errors and retries
- completion state

### Advanced Inspectors Inside Traces
- route scorecard
- context and memory packet
- checkpoint state
- policy details

---

## 8.5 Marketplace Page

### Goal
Show paid intelligence services available to agents.

### Must Include
- provider name
- service name
- category
- price in USDC
- trust score
- route score
- latency
- proof support
- x402 support
- Arc support
- approval/block status

---

## 8.6 Gateway Page

### Goal
Make the infrastructure visible and credible.

### Must Include
- provider routing status
- Gateway health
- service registry status
- active provider categories
- calls processed
- payment modes
- SDK/API usage
- uptime/error indicators

---

## 8.7 Route Scorecard Page or Inspector

### Goal
Explain why a provider was selected, approved, blocked, or used as fallback.

### Should Be
Visible as both:

- a standalone infra page for developers/operators
- an expandable inspector inside mission trace/proof

### Must Include
- mission fit
- provider trust
- cost efficiency
- proof completeness
- latency score
- historical reliability
- delivery quality
- final route score
- verdict
- blocked reason

---

## 8.8 Policy Page

### Goal
Allow workspace admins to configure symbolic controls.

### Must Include
- max mission spend
- daily spend limit
- min provider trust
- min route score
- proof required
- allowed categories
- blocked providers
- allowed payment modes
- fallback allowed/disabled
- recommendation guardrails

---

## 8.9 Payments Page

### Goal
Track all provider payment activity.

### Must Include
- payment intent
- payment event
- provider
- service
- amount
- asset
- network
- payment rail
- payment status
- idempotency key
- receipt link
- reconciliation status

---

## 8.10 Reconciliation Page

### Goal
Show whether payment, provider delivery, and receipt agree.

### Must Include
- reconciliation run ID
- checked receipts
- matched count
- pending count
- failed count
- manual review count
- item-level status
- mismatch reason

### Reconciliation Statuses

```text
matched
pending_payment
pending_delivery
paid_but_not_delivered
delivered_but_payment_unconfirmed
amount_mismatch
provider_mismatch
duplicate_payment
receipt_missing
fallback
blocked
manual_review_required
```

---

## 8.11 Proof / Receipts Page

### Goal
Show audit packets for paid intelligence calls.

### Must Include
- receipt ID
- mission ID
- conversation ID
- agent ID
- provider ID
- service ID
- route score
- policy verdict
- payment provider
- payment rail
- asset
- network
- payment reference
- amount
- output hash
- reconciliation status
- trace link

---

## 8.12 Metrics Page

### Goal
Show adoption and usage.

### Must Include
- users onboarded
- workspaces created
- missions created
- conversations created
- completed missions
- paid calls
- blocked calls
- receipts created
- USDC routed
- real x402 calls
- testnet/fallback calls
- providers used
- repeat users
- SDK calls

---

## 8.13 Developers Page

### Goal
Enable SDK/Gateway adoption.

### Must Include
- API key creation
- TypeScript SDK example
- Python SDK example
- Agent Mission API
- Conversation API
- Trace API
- Receipt API
- Reconciliation API
- Provider API
- webhook docs

---

## 8.14 Providers Console

### Goal
Allow providers to register and monitor their paid services.

### Must Include
- register service
- set price
- add x402 endpoint
- add service category
- declare proof support
- declare Arc support
- delivery SLA
- call history
- revenue/usage
- reliability score
- failed validation issues

---

## 8.15 Workspace Settings Page

### Goal
Support multi-tenant real-world use.

### Must Include
- workspace profile
- team members
- roles
- policies
- spend limits
- payment modes
- API keys
- provider access
- audit logs

---

## 9. Backend Implementation Requirements

## 9.1 Core Backend Modules

Implement or upgrade:

```text
workspace-service
user-service
role-service
api-key-service
agent-mission-service
conversation-service
trace-service
provider-service
gateway-service
route-score-service
policy-service
payment-ledger-service
provider-delivery-service
receipt-service
reconciliation-service
metrics-service
audit-log-service
```

---

## 9.2 Required API Endpoints

### Workspace APIs

```text
POST /v1/workspaces
GET /v1/workspaces
GET /v1/workspaces/:workspaceId
PATCH /v1/workspaces/:workspaceId
GET /v1/workspaces/:workspaceId/members
POST /v1/workspaces/:workspaceId/members
PATCH /v1/workspaces/:workspaceId/members/:memberId
```

### API Key APIs

```text
POST /v1/workspaces/:workspaceId/api-keys
GET /v1/workspaces/:workspaceId/api-keys
PATCH /v1/workspaces/:workspaceId/api-keys/:keyId/revoke
```

### Agent Mission APIs

```text
POST /v1/agora/agent-missions/run
GET /v1/agora/agent-missions/:missionId
POST /v1/agora/agent-missions/:missionId/resume
GET /v1/agora/agent-missions/:missionId/status
```

### Conversation APIs

```text
POST /v1/agora/conversations
GET /v1/agora/conversations
GET /v1/agora/conversations/:conversationId
POST /v1/agora/conversations/:conversationId/messages
GET /v1/agora/conversations/:conversationId/messages
```

### Trace APIs

```text
GET /v1/agora/traces
GET /v1/agora/traces/:traceId
GET /v1/agora/missions/:missionId/traces
```

### Provider APIs

```text
POST /v1/agora/providers/register
GET /v1/agora/providers
GET /v1/agora/providers/:providerId
POST /v1/agora/providers/:providerId/validate
PATCH /v1/agora/providers/:providerId
```

### Route and Policy APIs

```text
POST /v1/agora/routes/score
GET /v1/agora/routes/:routeEvaluationId
POST /v1/agora/policy/evaluate
GET /v1/agora/policies
PATCH /v1/agora/policies/:policyId
```

### Payment APIs

```text
GET /v1/agora/payment-intents
GET /v1/agora/payment-events
POST /v1/agora/payments/authorize
GET /v1/agora/payments/:paymentId
```

### Provider Delivery APIs

```text
GET /v1/agora/provider-deliveries
POST /v1/agora/provider-deliveries
GET /v1/agora/provider-deliveries/:deliveryId
```

### Receipt APIs

```text
GET /v1/agora/receipts
GET /v1/agora/receipts/:receiptId
POST /v1/agora/receipts
GET /v1/agora/missions/:missionId/receipts
```

### Reconciliation APIs

```text
POST /v1/agora/reconciliation/run
GET /v1/agora/reconciliation/runs
GET /v1/agora/reconciliation/runs/:runId
GET /v1/agora/reconciliation/items
```

### Metrics APIs

```text
GET /v1/agora/metrics/summary
GET /v1/agora/metrics/workspace
GET /v1/agora/metrics/providers
```

---

## 10. Data Model Requirements

Required tables or equivalent persistent stores:

```text
users
workspaces
workspace_members
roles
api_keys
agent_profiles
conversation_threads
conversation_messages
missions
mission_steps
mission_checkpoints
agent_traces
tool_call_traces
provider_profiles
provider_services
workspace_provider_access
route_evaluations
policy_evaluations
payment_intents
payment_events
provider_deliveries
receipts
reconciliation_runs
reconciliation_items
webhook_events
usage_metrics
billing_accounts
audit_logs
```

### Minimum Required Fields on Major Tables

Every tenant-scoped table should include:

```text
workspace_id
created_at
updated_at
```

Most user-facing records should include:

```text
user_id
mission_id
conversation_id where applicable
```

Payment and receipt records must include:

```text
idempotency_key
payment_reference
provider_id
service_id
amount_usdc
asset
network
payment_rail
execution_mode
reconciliation_status
```

---

## 11. Reconciliation Requirements

The reconciliation system must compare:

```text
Angora mission ledger
Payment intent and payment events
Provider delivery record
Receipt/proof record
```

### Required Ledgers

- payment intents
- payment events
- provider deliveries
- receipts
- webhook events
- reconciliation runs
- reconciliation items

### Required Matching Keys

```text
workspace_id
mission_id
provider_id
service_id
idempotency_key
payment_reference
receipt_id
output_hash
```

### Reconciliation Rules

- If payment exists and delivery exists and receipt exists and values match → matched
- If payment missing → pending_payment
- If delivery missing → pending_delivery
- If payment exists but delivery missing → paid_but_not_delivered
- If delivery exists but payment missing → delivered_but_payment_unconfirmed
- If amount differs → amount_mismatch
- If provider differs → provider_mismatch
- If duplicate idempotency/payment reference appears → duplicate_payment
- If receipt missing → receipt_missing
- If payment mode is fallback → fallback
- If provider was blocked → blocked

---

## 12. Agent Context Engineering Requirements

Each specialist agent must receive a structured context packet.

Required context:

```text
mission details
workspace policy
agent profile
budget constraints
allowed providers
blocked providers
provider reliability
previous receipts
similar missions
payment mode
proof requirement
conversation history
```

Context must be generated by a dedicated Context Builder rather than free-form prompt construction.

---

## 13. Adaptive Retrieval Requirements

Adaptive retrieval should retrieve:

- similar missions
- previous recommendations
- provider reliability memory
- failed provider history
- prior receipts
- user/workspace preferences
- recently purchased signals
- stale signals

Storage options:

- PostgreSQL for structured memory
- pgvector or vector store for semantic retrieval
- Redis for short-lived run state

---

## 14. Long Coordination and Checkpoint Requirements

Checkpoints must preserve recoverable state after key stages:

```text
mission_created
agent_selected
context_prepared
providers_discovered
routes_scored
policy_evaluated
payment_attempted
provider_delivery_received
receipt_created
reconciliation_checked
recommendation_generated
mission_completed
mission_failed
```

Each checkpoint must include:

- checkpoint ID
- mission ID
- workspace ID
- stage
- state snapshot
- resume point
- idempotency key
- timestamp

---

## 15. Neuro-Symbolic Policy Requirements

LLMs/specialist agents should reason and explain, but symbolic rules must enforce constraints.

Required rules:

```text
IF provider.trust < minProviderTrust THEN block
IF routeScore < minRouteScore THEN block
IF proofRequired AND provider.proofSupported = false THEN block
IF budgetRemaining < provider.price THEN block payment
IF paymentStatus != authorized THEN do not unlock service
IF receiptMissing THEN mission cannot complete
IF riskCheckFailed THEN recommendation cannot be execute/enter
IF idempotencyKey already used THEN do not repeat payment
```

---

## 16. SDK Requirements

The SDK should expose:

```ts
runAgentMission()
runPredictionMarketMission()
runArbitrageMission()
runSocialTradingMission()
getConversations()
getConversationMessages()
getMissionTraces()
getReceipts()
getPaymentEvents()
runReconciliation()
registerProvider()
getMetrics()
```

SDKs should support:

- TypeScript
- Python
- API key auth
- workspace scoping
- idempotency keys
- typed responses
- retry-safe behavior

---

## 17. Authentication and Authorization Requirements

Implement:

- workspace-based auth
- API keys
- role-based access control
- scoped permissions
- team membership
- API key revocation
- audit logging

Access examples:

```text
Owner/Admin: full workspace access
Builder: missions, SDK, traces for owned apps
Analyst: run missions, view outputs and receipts
Viewer/Auditor: read-only receipts, traces, and metrics
Provider: only provider-owned delivery/payment records
```

---

## 18. Observability Requirements

Implement:

- structured logging
- trace IDs
- mission IDs in all logs
- payment reference logging
- provider latency tracking
- reconciliation logs
- API error logs
- audit logs

Recommended integrations:

- OpenTelemetry
- Sentry
- PostHog or similar product analytics
- Prometheus/Grafana if self-hosted

---

## 19. Testing Requirements

Required tests:

### Unit Tests
- mission classifier
- route scorer
- policy engine
- context builder
- reconciliation status resolver
- idempotency service

### Integration Tests
- run prediction mission
- run arbitrage mission
- run social trading mission
- provider blocked before payment
- payment intent created
- provider delivery recorded
- receipt created
- reconciliation matched
- reconciliation pending
- duplicate payment blocked

### API Tests
- workspace scoping
- API key auth
- conversation history
- traces
- receipts
- reconciliation
- provider registration

### Security Tests
- tenant data isolation
- role access enforcement
- API key revocation
- idempotency replay protection

---

## 20. Deployment Requirements

Production deployment should include:

- Dockerfile
- docker-compose for local development
- environment variable template
- database migration script
- seed script
- health endpoint
- readiness endpoint
- background worker support
- deployment README

Required environments:

```text
local
testnet/staging
production
```

Payment modes must remain explicit:

```text
real_x402
arc_testnet
fallback
blocked
local_proof
failed
pending
```

---

## 21. What Needs to Change in the Existing v6 Codebase

The current v6 codebase already contains important foundations:

- agent missions
- conversations
- traces
- checkpoints
- receipts
- payment ledger
- provider delivery store
- reconciliation service
- SDK updates

But to reach real production readiness, it needs these upgrades:

### Multi-Tenancy
- add workspace model
- add workspace member roles
- scope all stores by workspaceId
- scope all APIs by workspaceId/API key
- add tenant isolation tests

### Persistent Storage
- replace or wrap in-memory stores with durable storage adapters
- add PostgreSQL implementation
- add migrations
- add repository layer interfaces

### UI Alignment
- implement product pages in actual frontend, not only canvas
- Agent Missions
- Conversations
- Traces
- Gateway
- Marketplace
- Route Scorecard
- Policy
- Payments
- Reconciliation
- Proof
- Metrics
- Developers
- Providers
- Settings

### Real Gateway Integration
- ensure agentic layer calls existing Angora Gateway routes
- avoid duplicate logic between agent runtime and gateway
- keep Gateway as source of truth for provider routing, payment, and receipts

### Reconciliation Completion
- ensure all payment events, provider deliveries, receipts, and webhook events share matching keys
- add manual review workflow
- add duplicate payment handling
- add reconciliation UI

### Auth and API Keys
- implement workspace API keys
- role-based user access
- API key permission scopes
- revocation and audit logs

### Documentation
- update README
- add production setup guide
- add API docs
- add SDK docs
- add provider onboarding docs
- add architecture diagrams

---

## 22. Implementation Priority

### Priority 1 — Multi-Tenant Foundation
- workspaces
- users/members/roles
- API keys
- workspace-scoped stores
- tenant isolation tests

### Priority 2 — Persistence Layer
- PostgreSQL schema
- migrations
- repository interfaces
- durable conversation/mission/trace/payment/receipt stores

### Priority 3 — Agent Mission Runtime
- ensure three specialist agents run through Gateway
- context builder
- policy enforcement
- checkpoint creation
- traces
- receipts

### Priority 4 — Payment and Reconciliation
- payment intents/events
- provider deliveries
- webhook events
- reconciliation runs/items
- reconciliation statuses
- manual review flow

### Priority 5 — Product UI
- Agent Missions
- Conversations
- Traces
- Gateway
- Marketplace
- Payments
- Reconciliation
- Proof
- Metrics
- Developers
- Providers
- Settings

### Priority 6 — SDK and Developer Platform
- TypeScript SDK
- Python SDK
- docs
- examples
- provider registration flow

### Priority 7 — Observability and Production Hardening
- logging
- tracing
- rate limits
- audit logs
- error handling
- tests
- deployment configs

---

## 23. Definition of Done

Angora is ready for real beta users when:

- users can create workspaces
- workspace members have roles
- API keys are workspace-scoped
- conversations persist
- missions persist
- traces persist
- receipts persist
- payment events persist
- provider deliveries persist
- reconciliation runs persist
- three specialist agents run end-to-end
- provider routing is explainable
- policy blocks unsafe providers
- payment modes are honest and visible
- receipts link mission, provider, payment, output, and recommendation
- reconciliation statuses are computed
- SDK can run missions
- UI supports Agent Missions, Conversations, Traces, Payments, Proof, Metrics, Developers, Providers, and Settings
- tests cover tenant isolation, idempotency, policy blocking, receipt creation, and reconciliation

---

## 24. Final North Star

Angora should become the production-grade paid-intelligence operating layer for market agents.

The product surface is specialist agents.

The infrastructure foundation is Gateway/SDK, provider routing, policy, Circle/x402 payments, proof receipts, traces, reconciliation, and multi-tenant controls.

The value to users is simple:

> They can run market-intelligence agents that buy trusted signals, block weak providers, control spend, prove what happened, and reuse the workflow through UI or SDK.

