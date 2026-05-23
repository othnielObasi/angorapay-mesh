# Angora Market Intelligence Agents
## Harmonized BRD and Technical Implementation Document

## 1. Executive Summary

Angora Market Intelligence Agents is a production-grade multi-agent system built on top of the Angora Gateway and SDK. It helps AI market agents buy trusted paid intelligence before taking or recommending market action.

The system is not only a payment gateway. It is a coordinated intelligence, routing, payment, proof, and memory layer for market-facing agents. It supports three specialised agent modules:

1. Prediction Market Intelligence Agent
2. Cross-Venue Arbitrage Agent
3. Social Trading Intelligence Agent

Each specialist agent uses the same underlying Angora infrastructure:

- Mission orchestration
- Agent context engineering
- Adaptive retrieval
- Long coordination and checkpoints
- Neuro-symbolic policy enforcement
- Provider discovery and route scoring
- Circle/x402 payment execution on Arc/USDC context
- Proof receipts and execution history
- SDK/Gateway access for external builders

The product goal is to make paid intelligence usable, trusted, auditable, and adoptable for real market-agent workflows.

---

# PART A — BUSINESS REQUIREMENTS DOCUMENT

## 2. Product Vision

Angora Market Intelligence Agents enables AI agents, trading builders, and market-intelligence teams to decide which external intelligence services to buy, who to trust, what to block, when to pay, and how to prove every decision-supporting call.

### Product Positioning

**Angora is a specialised multi-agent paid-intelligence system for market agents.**

It helps prediction-market, arbitrage, and social-trading agents buy trusted signals before acting.

### Infrastructure Positioning

**Angora Gateway / SDK / Mesh** is the infrastructure layer powering provider discovery, route scoring, policy checks, Circle/x402 payment, proof receipts, and execution history.

### User-facing Product Name

**Angora Market Intelligence Agents**

### Infrastructure Name

**Angora Gateway / Angora SDK / AngoraPay Mesh**

---

## 3. Business Problem

AI market agents increasingly need paid external intelligence before making decisions. They may need odds data, sentiment feeds, liquidity checks, risk signals, arbitrage spreads, trader-performance feeds, social-alpha signals, or proof-generation services.

However, a production agent cannot blindly pay any provider. It must answer:

- Which provider is trusted enough?
- Which signal is relevant to this mission?
- Which providers should be blocked?
- Does the service support proof?
- Does the payment fit the mission budget?
- Was the paid signal actually used in the decision?
- Can the user audit what happened later?
- Can the mission recover if a provider, payment, or receipt step fails?

Angora addresses this gap by combining specialised market-intelligence agents with a governed paid-service gateway.

---

## 4. Target Users

### 4.1 Primary Users

#### Prediction-market builders
Teams building agents or dashboards that evaluate event markets, +EV opportunities, odds movement, and market mispricing.

#### Trading-agent builders
Developers building market agents that need external price feeds, risk checks, liquidity signals, and execution readiness checks.

#### Social/copy-trading builders
Teams building agents that evaluate traders, influencers, social signals, or crowd-alpha sources.

#### x402 service providers
Data/API providers who want to expose paid market-intelligence services to autonomous agents.

### 4.2 Secondary Users

- Hackathon judges and evaluators
- Market research communities
- Quant teams
- Agent-framework builders
- Developer teams integrating paid market services
- Product teams needing proof of agent decisions

---

## 5. Core Use Cases

## 5.1 Use Case 1 — Prediction Market Intelligence Agent

### Problem
A prediction-market agent needs to evaluate whether a market is mispriced before recommending or entering a position.

### Example Mission
“Evaluate whether this BTC election-market contract is mispriced after a breaking news shift.”

### Required Intelligence
- Live odds
- Liquidity depth
- News sentiment
- Event probability movement
- Source credibility
- Risk check
- Proof receipt

### Agent Output
- Signal classification: likely +EV, neutral, weak, avoid
- Confidence score
- Key evidence used
- Approved providers
- Blocked providers
- USDC routed
- Receipts created
- Recommendation: enter, monitor, avoid, or reduce size

### Business Value
Helps prediction-market agents avoid weak signals, unsupported data, and non-auditable recommendations.

---

## 5.2 Use Case 2 — Cross-Venue Arbitrage Agent

### Problem
An arbitrage agent detects a price difference across venues but must verify whether the opportunity survives fees, slippage, latency, liquidity, and execution risk.

### Example Mission
“Check whether BTC price difference between Venue A and Venue B is executable after fees and slippage.”

### Required Intelligence
- Venue A price feed
- Venue B price feed
- Spread check
- Liquidity check
- Fee estimate
- Slippage estimate
- Execution-risk check
- Proof receipt

### Agent Output
- Arbitrage status: executable, monitor, reject
- Gross spread
- Net spread after estimated cost
- Execution risk
- Approved providers
- Blocked providers
- USDC routed
- Receipts created

### Business Value
Prevents agents from acting on stale, low-quality, or unprofitable arbitrage signals.

---

## 5.3 Use Case 3 — Social Trading Intelligence Agent

### Problem
A social/copy-trading agent wants to know whether a trader, influencer, or social-alpha signal is reliable enough to follow.

### Example Mission
“Evaluate whether this trader signal is reliable enough to follow for a short-term market position.”

### Required Intelligence
- Trader-performance feed
- Social sentiment
- Signal reliability check
- Copy-risk score
- Drawdown history
- Source credibility
- Proof receipt

### Agent Output
- Signal quality: weak, moderate, strong
- Copy-risk score
- Source credibility
- Recommendation: reject, monitor, follow with reduced size
- Approved providers
- Blocked providers
- USDC routed
- Receipts created

### Business Value
Helps agents avoid blindly following noisy, manipulated, or unreliable social-alpha sources.

---

## 6. Product Modules

### 6.1 Mission Orchestrator
Receives user missions and routes them to the appropriate specialist agent.

### 6.2 Specialist Agents
- Prediction Market Intelligence Agent
- Cross-Venue Arbitrage Agent
- Social Trading Intelligence Agent

### 6.3 Context Builder
Builds structured agent context from mission details, user/workspace policies, provider state, memory, prior receipts, and payment constraints.

### 6.4 Adaptive Retrieval Layer
Retrieves similar missions, previous receipts, provider reliability, blocked-provider history, market signal memory, and user preferences.

### 6.5 Long Coordination Layer
Tracks multi-step mission progress over time, including current step, pending calls, retries, failures, payment state, receipt state, and recovery points.

### 6.6 Checkpoint Layer
Creates durable checkpoints after each critical mission stage so the system can resume safely without duplicate payments or lost context.

### 6.7 Neuro-symbolic Policy Engine
Combines LLM-based reasoning with explicit symbolic rules for budgets, provider trust, route scores, proof requirements, payment authorization, and recommendation boundaries.

### 6.8 Provider Marketplace
Allows providers to list x402-enabled paid intelligence services.

### 6.9 Route Scorecard
Scores providers by mission fit, trust, cost, latency, proof support, reliability, and delivery quality.

### 6.10 Payment Executor
Executes approved payments through Circle/x402 with Arc/USDC context.

### 6.11 Proof and Receipt Engine
Creates receipts linking mission, provider route, payment, output hash, policy verdict, and recommendation evidence.

### 6.12 Conversation History, Traces, Execution History and Metrics
Tracks user-agent conversations, mission threads, agent traces, provider calls, payments, receipts, blocked providers, USDC volume, repeat users, and adoption metrics.

### 6.13 Internal Coordination Observability
Context, memory, route scorecards, and checkpoints are primarily internal system capabilities. They should not be presented as main user-facing pages by default. Instead, they should appear as expandable inspection panels inside a mission run, proof receipt, or developer/debug view.

User-facing users should see a simple story: mission, agent response, sources/signals bought, provider decisions, payment state, proof, and recommendation. Technical users can expand the underlying route score, retrieved context, memory references, checkpoints, and trace events when they need auditability or debugging.

### 6.14 SDK and Gateway
Provides programmatic access for external builders and internal agents.

---

## 7. Business Goals

### Primary Goals
- Enable market agents to buy trusted intelligence before action.
- Make paid service routing explainable and auditable.
- Support real Circle/x402/Arc/USDC payment flows where available.
- Enable provider onboarding and paid-service discoverability.
- Generate proof receipts for every decision-supporting call.
- Support production adoption through SDK/Gateway integration.

### Hackathon-Compatible Goals
- Demonstrate agentic sophistication through specialist agents.
- Show traction through users, missions, paid calls, receipts, and USDC volume.
- Demonstrate Circle/x402 usage clearly.
- Show innovation through route scoring, proof, checkpoints, adaptive retrieval, and multi-agent coordination.

---

## 8. Success Metrics

### Product Metrics
- Number of onboarded users
- Number of created missions
- Number of active workspaces
- Number of repeat users
- Number of providers onboarded
- Number of paid service calls
- Number of completed missions
- Number of blocked unsafe providers
- Number of generated receipts
- Total USDC routed
- Real x402 calls versus fallback/testnet calls

### Quality Metrics
- Provider delivery success rate
- Payment success rate
- Receipt creation success rate
- Mission completion rate
- Average mission latency
- Average route score
- Blocked-provider accuracy
- User satisfaction feedback

### Agent Metrics
- Correct mission classification rate
- Specialist-agent completion rate
- Recommendation explainability score
- Policy violation prevention count
- Checkpoint recovery success rate
- Adaptive retrieval usefulness rating

---

## 9. User Journeys

## 9.1 Agent Builder Journey

1. User creates an Angora account.
2. User creates a workspace.
3. User chooses a specialist mission type or enters a natural-language market question.
4. Mission Orchestrator selects a specialist agent.
5. Context Builder prepares mission context.
6. Adaptive Retrieval pulls relevant memory and provider history.
7. Specialist agent plans required intelligence.
8. Gateway discovers providers.
9. Route Scorecard ranks providers.
10. Policy Engine approves or blocks providers.
11. Payment Executor pays approved services.
12. Proof Engine generates receipts.
13. Specialist agent returns recommendation.
14. Mission History stores all events and checkpoints.

## 9.2 Provider Journey

1. Provider registers a service.
2. Provider submits endpoint, category, price, proof support, Arc/x402 support, and SLA.
3. Gateway validates schema and x402 endpoint.
4. Provider receives a trust profile.
5. Provider becomes available for matching missions.
6. Provider receives routed demand.
7. Provider can view call history, revenue, and reliability score.

## 9.3 Developer Journey

1. Developer creates API key.
2. Developer installs SDK.
3. Developer calls a mission endpoint.
4. Angora runs specialist agents and gateway flow.
5. Developer receives recommendation, receipts, and route details.
6. Developer can fetch execution history and proof packets.

---

## 10. Functional Requirements

### 10.1 Mission Management
- Users must be able to create a mission.
- Missions must support three specialist types: prediction market, arbitrage, and social trading.
- Missions must define budget, required signals, policy constraints, and proof requirements.
- Missions must be resumable from checkpoints.

### 10.2 Agent Orchestration
- The system must classify missions into the correct specialist agent.
- The system must allow manual module selection.
- Each specialist agent must have module-specific planning logic.
- The orchestrator must enforce shared constraints.

### 10.3 Context Engineering
- The system must build structured context packets.
- Context must include mission, constraints, memory, provider state, payment settings, and proof requirements.
- Context must be visible in the UI for transparency.

### 10.4 Adaptive Retrieval
- The system must retrieve similar missions.
- The system must retrieve provider reliability history.
- The system must retrieve previous receipts and blocked-provider records.
- Retrieval results must influence route scoring.

### 10.5 Long Coordination and Checkpoints
- The system must create checkpoints after major mission stages.
- The system must resume from the last safe checkpoint.
- The system must avoid duplicate payments using idempotency keys.
- The system must record pending, failed, completed, and blocked states.

### 10.6 Provider Marketplace
- Providers must be able to register services.
- Provider services must include category, price, endpoint, proof support, Arc support, and SLA.
- The system must validate provider metadata.
- Providers must have reliability and trust profiles.

### 10.7 Route Scoring
- The system must score providers using mission fit, trust, cost, proof support, latency, reliability, and quality.
- The system must block providers below threshold.
- The system must explain why providers are approved or blocked.

### 10.8 Policy Evaluation
- The system must enforce budget limits.
- The system must enforce minimum provider trust.
- The system must enforce minimum route score.
- The system must enforce proof requirements.
- The system must prevent payment to blocked providers.

### 10.9 Payment Execution
- Approved calls must use Circle/x402 where available.
- Payment mode must be clearly labelled as real_x402, arc_testnet, fallback, blocked, or local_proof.
- Payment references must be linked to receipts.

### 10.10 Proof Receipts
- Every paid service call must generate a receipt.
- Receipts must include mission ID, agent ID, provider ID, route score, policy verdict, payment reference, USDC amount, output hash, timestamp, and execution mode.
- Receipts must be exportable.

### 10.11 Metrics and Analytics
- The system must track users, missions, providers, paid calls, blocked calls, receipts, and USDC volume.
- Metrics must support hackathon and production adoption reporting.

---

## 11. Non-Functional Requirements

### Reliability
- Missions must recover from provider failures, payment failures, and receipt failures.
- Checkpoints must prevent lost state.

### Security
- API keys must be scoped by workspace and allowed modules.
- Payment calls must require idempotency keys.
- Provider endpoints must be validated.

### Observability
- Every mission step must produce an execution event.
- Logs must support debugging and audit.
- Metrics must support product analytics.

### Scalability
- Provider discovery, route scoring, and mission execution should support asynchronous processing.
- Long-running missions should not block the main API thread.

### Auditability
- Every recommendation must be traceable to provider calls, policy checks, payments, and receipts.

### Usability
- The UI must make the mission goal, selected specialist agent, provider decisions, blocked providers, payment state, receipts, and final recommendation easy to understand.

---

# PART B — TECHNICAL IMPLEMENTATION DOCUMENT

## 12. Target Architecture

```text
Frontend
  ↓
API Gateway / Backend
  ↓
Mission Orchestrator
  ↓
Context Builder + Adaptive Retrieval
  ↓
Specialist Agents
  ↓
Angora Gateway / SDK
  ↓
Provider Discovery → Route Scoring → Policy Engine → Payment Executor → Receipt Engine
  ↓
PostgreSQL + Redis + Vector Store + Object Storage
```

---

## 13. Core Services

### 13.1 Frontend Web App
Recommended stack:
- React / Next.js
- Tailwind CSS
- shadcn-style components where appropriate
- Mission workspace
- Agent mission selector
- Provider marketplace
- Route scorecard
- Checkpoints panel
- Context and memory panel
- Proof receipts
- Execution history
- Metrics dashboard
- Developer console

### 13.2 Backend API
Recommended stack:
- FastAPI or Node.js/NestJS
- PostgreSQL
- Redis
- pgvector or external vector store
- Object storage for proof bundles
- Background worker for long-running missions

### 13.3 Agent Runtime
Recommended:
- LangGraph for orchestration and checkpoint-aware flows
- Tool-calling agents for specialist modules
- Deterministic service calls through Angora Gateway
- Policy engine before all payment/tool execution

### 13.4 Angora Gateway
Responsibilities:
- Provider search
- Route scoring
- Policy evaluation
- Payment authorization
- Receipt generation
- Execution history
- Metrics

### 13.5 SDKs
Recommended SDKs:
- TypeScript SDK
- Python SDK

SDK functions:
```ts
runPredictionMarketMission()
runArbitrageMission()
runSocialTradingMission()
registerProvider()
scoreProviderRoute()
createReceipt()
listExecutionHistory()
getMissionStatus()
resumeMission()
```

---

## 14. Multi-Agent Design

## 14.1 Mission Orchestrator

### Responsibilities
- Receive user mission
- Classify mission type
- Select specialist agent
- Create initial checkpoint
- Build high-level execution plan
- Coordinate long-running flow

### Classification Targets
```ts
type MissionType =
  | "prediction_market"
  | "cross_venue_arbitrage"
  | "social_trading";
```

### Example Routing
```text
“Is this BTC event market mispriced?”
→ Prediction Market Intelligence Agent

“Is there arbitrage between Venue A and Venue B?”
→ Cross-Venue Arbitrage Agent

“Should I follow this trader signal?”
→ Social Trading Intelligence Agent
```

---

## 14.2 Prediction Market Intelligence Agent

### Inputs
- Market/event question
- Target market
- Required signals
- Mission budget
- User risk preference
- Provider memory

### Required Tools
- Odds provider search
- Sentiment provider search
- Liquidity provider search
- Risk check
- Receipt writer

### Output Schema
```ts
type PredictionMarketResult = {
  signal: "likely_positive_ev" | "neutral" | "weak" | "avoid";
  confidence: number;
  recommendation: "enter" | "monitor" | "avoid" | "reduce_size";
  approvedProviders: string[];
  blockedProviders: string[];
  usdcRouted: number;
  receiptIds: string[];
  explanation: string;
};
```

---

## 14.3 Cross-Venue Arbitrage Agent

### Inputs
- Asset
- Venue A
- Venue B
- Trade size assumption
- Fee/slippage assumptions
- Mission budget

### Required Tools
- Venue price feeds
- Liquidity check
- Fee estimator
- Slippage estimator
- Execution-risk provider
- Receipt writer

### Output Schema
```ts
type ArbitrageResult = {
  status: "executable" | "monitor" | "reject";
  grossSpreadPct: number;
  estimatedNetSpreadPct: number;
  executionRisk: "low" | "medium" | "high";
  recommendation: "execute" | "monitor" | "reject";
  approvedProviders: string[];
  blockedProviders: string[];
  usdcRouted: number;
  receiptIds: string[];
  explanation: string;
};
```

---

## 14.4 Social Trading Intelligence Agent

### Inputs
- Trader ID, signal ID, or social-alpha source
- Market/asset context
- User risk preference
- Mission budget

### Required Tools
- Trader performance feed
- Social sentiment feed
- Drawdown/risk feed
- Copy-risk scoring provider
- Receipt writer

### Output Schema
```ts
type SocialTradingResult = {
  signalQuality: "weak" | "moderate" | "strong";
  copyRisk: "low" | "medium" | "high";
  recommendation: "follow" | "follow_reduced_size" | "monitor" | "reject";
  approvedProviders: string[];
  blockedProviders: string[];
  usdcRouted: number;
  receiptIds: string[];
  explanation: string;
};
```

---

## 15. Agent Context Engineering

## 15.1 Purpose

Agent context engineering ensures each specialist agent receives the right mission context, constraints, memory, provider state, payment settings, and proof requirements.

It prevents agents from acting like generic LLMs and grounds them in production state.

## 15.2 Context Packet

```ts
type AgentContext = {
  mission: {
    id: string;
    type: "prediction_market" | "cross_venue_arbitrage" | "social_trading";
    userGoal: string;
    marketTarget?: string;
    desiredOutput: string;
  };
  constraints: {
    maxSpendUSDC: number;
    minProviderTrust: number;
    minRouteScore: number;
    proofRequired: boolean;
    allowedCategories: string[];
    blockedProviders: string[];
  };
  memory: {
    previousReceipts: string[];
    similarMissionIds: string[];
    providerReliability: Record<string, number>;
    previousBlockedReasons: string[];
  };
  providerState: {
    availableProviders: ProviderService[];
    latencyProfile?: Record<string, number>;
    reliabilityProfile?: Record<string, number>;
  };
  payment: {
    rail: "x402";
    asset: "USDC";
    network: "Arc";
    mode: "real_x402" | "arc_testnet" | "fallback";
  };
};
```

---

## 16. Adaptive Retrieval

## 16.1 Purpose

Adaptive retrieval gives agents the right historical evidence for the current mission.

It should retrieve:
- Similar previous missions
- Provider reliability records
- Prior blocked-provider reasons
- Previous receipts
- User/workspace preferences
- Stale or reusable market signals
- Prior mission outcomes

## 16.2 Retrieval Sources

### Mission Memory
- Mission summaries
- Final recommendations
- Similar event/market missions
- Prior outputs

### Provider Memory
- Delivery success rate
- Average latency
- Proof completion rate
- Payment failure rate
- Past route scores
- User feedback

### Receipt Memory
- Receipt IDs
- Provider outputs
- Output hashes
- Payment references
- Recommendation linkage

### Policy Memory
- Workspace-level rules
- Agent-level rules
- Blocked providers
- Budget limits

## 16.3 Storage Options

Recommended:
- PostgreSQL for structured mission and provider records
- pgvector for semantic retrieval
- Redis for short-lived run state
- Object storage for proof bundles

---

## 17. Long Coordination and Checkpoints

## 17.1 Purpose

Long coordination allows missions to run across multiple steps, provider calls, payment states, user approvals, retries, and delayed responses.

Checkpoints preserve recoverable state after each major stage.

## 17.2 Checkpoint Stages

```text
mission_created
agent_selected
context_prepared
providers_discovered
routes_scored
policy_evaluated
payment_attempted
receipt_created
recommendation_generated
mission_completed
mission_failed
```

## 17.3 Checkpoint Schema

```ts
type MissionCheckpoint = {
  checkpointId: string;
  missionId: string;
  agentId: string;
  module: "prediction_market" | "cross_venue_arbitrage" | "social_trading";
  stage:
    | "mission_created"
    | "agent_selected"
    | "context_prepared"
    | "providers_discovered"
    | "routes_scored"
    | "policy_evaluated"
    | "payment_attempted"
    | "receipt_created"
    | "recommendation_generated"
    | "mission_completed"
    | "mission_failed";
  state: {
    userGoal: string;
    budgetUSDC: number;
    budgetSpentUSDC: number;
    budgetRemainingUSDC: number;
    requiredSignals: string[];
    providerCandidates: unknown[];
    approvedProviders: unknown[];
    blockedProviders: unknown[];
    routeScores: unknown[];
    paymentRefs: string[];
    receiptIds: string[];
    retrievedMemoryIds: string[];
    currentRecommendation?: string;
  };
  resumeFrom: string;
  idempotencyKey: string;
  createdAt: string;
};
```

## 17.4 Idempotency Rule

Before every external call:
- Create or verify an idempotency key.

After every external call:
- Write a checkpoint.

This prevents duplicate payments and repeated provider calls during retries.

---

## 18. Neuro-Symbolic Architecture

## 18.1 Purpose

The LLM/specialist agent handles flexible mission understanding and explanation. The symbolic layer enforces hard rules around trust, budget, payment, proof, and recommendation boundaries.

## 18.2 LLM Responsibilities

- Interpret user mission
- Select needed intelligence
- Summarize provider outputs
- Explain recommendation
- Generate user-facing reasoning

## 18.3 Symbolic Responsibilities

- Enforce budget limits
- Enforce provider trust thresholds
- Enforce route score thresholds
- Enforce proof requirements
- Prevent duplicate payments
- Prevent payments to blocked providers
- Prevent mission completion if receipt is missing
- Guard final recommendation if required checks fail

## 18.4 Example Rules

```text
IF provider.trust < minProviderTrust THEN block provider
IF routeScore < minRouteScore THEN block route
IF proofRequired = true AND provider.proofSupported = false THEN block provider
IF budgetRemaining < provider.price THEN block payment
IF paymentStatus != authorized THEN do not unlock service
IF receiptMissing = true THEN mission cannot complete
IF riskCheckFailed = true THEN recommendation cannot be execute/enter
```

---

## 19. Provider Route Scoring

## 19.1 Score Dimensions

```text
mission_fit: 0–100
provider_trust: 0–100
cost_efficiency: 0–100
proof_completeness: 0–100
latency_score: 0–100
historical_reliability: 0–100
delivery_quality: 0–100
```

## 19.2 Weighted Score Example

```ts
routeScore =
  missionFit * 0.25 +
  providerTrust * 0.20 +
  proofCompleteness * 0.20 +
  costEfficiency * 0.10 +
  latencyScore * 0.10 +
  historicalReliability * 0.10 +
  deliveryQuality * 0.05;
```

## 19.3 Verdicts

```ts
type RouteVerdict = "selected" | "approved" | "blocked" | "fallback";
```

---

## 20. Payment Flow

## 20.1 Payment Modes

```ts
type PaymentMode =
  | "real_x402"
  | "arc_testnet"
  | "fallback"
  | "blocked"
  | "local_proof";
```

## 20.2 Flow

```text
Provider route approved
  ↓
Idempotency key created
  ↓
Payment request initiated through Circle/x402
  ↓
Payment reference returned
  ↓
Provider service unlocked
  ↓
Output captured and hashed
  ↓
Receipt created
  ↓
Checkpoint saved
```

## 20.3 Payment Constraints

- No payment if provider is blocked.
- No payment if budget is exceeded.
- No payment if required proof is unsupported.
- No duplicate payment for the same mission/provider/service call.

---

## 21. Receipt and Proof Design

## 21.1 Receipt Schema

```ts
type Receipt = {
  receiptId: string;
  missionId: string;
  agentId: string;
  specialistAgent: "prediction_market" | "cross_venue_arbitrage" | "social_trading";
  serviceId: string;
  providerId: string;
  routeScore: number;
  policyStatus: "approved" | "blocked" | "fallback";
  paymentProvider: "Circle";
  paymentRail: "x402";
  asset: "USDC";
  network: "Arc";
  paymentReference: string;
  amountUSDC: number;
  executionMode: PaymentMode;
  outputHash: string;
  recommendationId?: string;
  createdAt: string;
};
```

## 21.2 Proof Bundle

A proof bundle should include:
- Mission summary
- Context summary
- Provider scorecard
- Policy verdicts
- Payment references
- Provider outputs or output hashes
- Receipts
- Final recommendation
- Execution history

---

## 22. Data Model

Recommended PostgreSQL tables:

```text
users
workspaces
api_keys
agent_profiles
conversation_threads
conversation_messages
missions
mission_steps
mission_checkpoints
agent_traces
tool_call_traces
provider_services
provider_profiles
route_evaluations
policy_evaluations
payment_events
receipts
execution_events
mission_memory
provider_memory
feedback
usage_metrics
```

## 22.1 Mission Table

```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  mission_type TEXT NOT NULL,
  user_goal TEXT NOT NULL,
  status TEXT NOT NULL,
  max_spend_usdc NUMERIC(18, 6) NOT NULL,
  budget_spent_usdc NUMERIC(18, 6) DEFAULT 0,
  min_provider_trust INT DEFAULT 85,
  min_route_score INT DEFAULT 80,
  proof_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 22.2 Checkpoint Table

```sql
CREATE TABLE mission_checkpoints (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES missions(id),
  stage TEXT NOT NULL,
  state JSONB NOT NULL,
  resume_from TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 22.3 Receipt Table

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES missions(id),
  agent_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  route_score INT NOT NULL,
  policy_status TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  payment_rail TEXT NOT NULL,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  amount_usdc NUMERIC(18, 6),
  payment_reference TEXT,
  execution_mode TEXT NOT NULL,
  output_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 23. API Design

## 23.1 Mission and Conversation APIs

```text
POST /v1/conversations
GET /v1/conversations
GET /v1/conversations/{conversation_id}
POST /v1/conversations/{conversation_id}/messages
GET /v1/conversations/{conversation_id}/messages

POST /v1/missions
GET /v1/missions/{mission_id}
POST /v1/missions/{mission_id}/run
POST /v1/missions/{mission_id}/resume
GET /v1/missions/{mission_id}/checkpoints
GET /v1/missions/{mission_id}/history
GET /v1/missions/{mission_id}/receipts
GET /v1/missions/{mission_id}/traces
```

## 23.2 Specialist Agent APIs

```text
POST /v1/agents/prediction-market/run
POST /v1/agents/arbitrage/run
POST /v1/agents/social-trading/run
```

## 23.3 Provider APIs

```text
POST /v1/providers/register
GET /v1/providers/search
GET /v1/providers/{provider_id}
POST /v1/providers/{provider_id}/validate
```

## 23.4 Route and Policy APIs

```text
POST /v1/routes/score
POST /v1/policy/evaluate
```

## 23.5 Payment and Receipt APIs

```text
POST /v1/payments/authorize
GET /v1/payments/{payment_id}
POST /v1/receipts
GET /v1/receipts/{receipt_id}
```

## 23.6 Metrics APIs

```text
GET /v1/metrics/summary
GET /v1/metrics/workspace
GET /v1/metrics/providers
```

---

## 24. UI Implementation Plan

## 24.1 Landing Page

Update positioning to:

**Specialised market intelligence agents powered by Angora Gateway.**

Subtext:

**Angora helps prediction-market, arbitrage, and social-trading agents buy trusted paid intelligence, block weak providers, pay through Circle/x402, and prove every decision-supporting call.**

## 24.2 Console Information Architecture

Recommended primary navigation:

1. Agent Missions
2. Use Cases
3. Marketplace
4. Conversations
5. Traces
6. Payments / History
7. Proof
8. Metrics
9. Developers

Internal inspection views should not be promoted as primary product pages for ordinary users:

- Route Scorecard should appear inside Agent Missions, Provider Details, Proof Receipts, and Traces.
- Context & Memory should appear as an expandable mission inspector or developer/debug panel.
- Checkpoints should appear inside Traces, Mission Recovery, or Developer/Operations views.
- Policy may be a configuration page for admins/developers, but ordinary users should see policy outcomes inside the mission run.

This keeps the interface usable while preserving production-grade auditability.

## 24.3 Agent Missions Page

This is the main chat-style mission workspace. It should behave more like a production AI assistant than a static dashboard.

Should include:
- Chat-style mission composer
- Specialist agent selector
- Conversation thread
- Mission input
- Budget and policy controls
- Required intelligence checklist
- Run intelligence mission button
- Live progress
- Final recommendation
- Source/provider cards
- Receipts created
- USDC routed
- Blocked providers
- Expandable route scorecard
- Expandable context and memory inspector for technical users
- Next-action buttons: View Proof, View History, View Trace

Conversation history must persist across sessions so users can return to prior agent missions like they would return to a ChatGPT conversation.

## 24.4 Conversations Page

Should show:
- Persistent chat history
- Mission title
- Specialist agent used
- Last recommendation
- Status: draft, running, completed, failed, resumed
- Created date and last activity
- Linked receipts
- Linked traces
- Total USDC routed

## 24.5 Traces Page

Should show mission-level operational traces, including:
- Agent selected
- Tools called
- Providers discovered
- Route decisions
- Policy outcomes
- Payment attempts
- Receipt creation
- Errors and fallbacks
- Retry events
- Completion state

Traces should include expandable detail for route scorecards, context packets, adaptive retrieval results, and checkpoints.

## 24.6 Internal Inspectors

### Route Scorecard Inspector
Shows why a provider was selected, approved, blocked, or used as fallback.

### Context & Memory Inspector
Shows selected mission context, retrieved similar missions, provider memory, prior blocked providers, and receipt references. This is mainly for developers, auditors, and advanced users.

### Checkpoint Inspector
Shows recovery state: checkpoint stage, timestamp, status, resume point, idempotency key, linked receipts, payment references, and blocked providers. This is mainly for operations, debugging, and mission recovery.

---

## 25. Implementation Roadmap

## Phase 1 — Production Foundation

- PostgreSQL schema
- API auth and API keys
- Mission creation
- Provider registry
- Route scoring
- Policy evaluation
- Execution history
- Basic receipts
- SDK skeleton

## Phase 2 — Specialist Agents

- Mission Orchestrator
- Prediction Market Intelligence Agent
- Cross-Venue Arbitrage Agent
- Social Trading Intelligence Agent
- Context Builder
- Module-specific result schemas

## Phase 3 — Long Coordination and Checkpoints

- Mission checkpointing
- Resume mission
- Idempotency keys
- Retry/fallback handling
- Pending payment handling
- Recovery UI

## Phase 4 — Adaptive Retrieval and Memory

- Mission memory
- Provider memory
- Receipt retrieval
- pgvector integration
- Similar mission retrieval
- Provider reliability learning

## Phase 5 — Circle/x402 Integration

- Payment authorization flow
- Payment mode labels
- Payment reference storage
- Receipt payment linkage
- Real/testnet/fallback separation

## Phase 6 — UI Upgrade

- Reframe landing page
- Rename Live Demo to Agent Missions
- Add use-case modules
- Add Context & Memory
- Add Checkpoints
- Add Recommendation Summary
- Add provider onboarding UI

## Phase 7 — Adoption and Traction

- Onboard early users
- Onboard test providers
- Collect usage metrics
- Collect feedback
- Track real x402 calls
- Track USDC volume
- Publish developer docs

---

## 26. Risks and Mitigations

### Risk: Product feels too infrastructure-heavy
Mitigation: Lead with specialist agents and concrete use cases; keep SDK/Gateway as foundation.

### Risk: Agents produce unsupported market recommendations
Mitigation: Use neuro-symbolic recommendation guardrails and require evidence receipts.

### Risk: Duplicate payments during retries
Mitigation: Enforce idempotency keys and checkpoint after every external call.

### Risk: Provider quality is inconsistent
Mitigation: Maintain provider memory, proof checks, trust scoring, and blocking rules.

### Risk: x402/Arc integration is incomplete during early deployment
Mitigation: Clearly label payment modes: real_x402, arc_testnet, fallback, blocked, local_proof.

### Risk: User trust is low
Mitigation: Show route scorecards, receipts, payment references, and checkpoint history.

---

## 27. Definition of Done

The system is production-ready for beta when:

- Users can create missions for all three specialist agents.
- The orchestrator can select the correct specialist agent.
- Context packets are built and visible.
- Providers can be discovered and scored.
- Policy engine can approve/block providers.
- Payments are executed or clearly labelled by mode.
- Receipts are created for paid calls.
- Checkpoints are stored after major stages.
- Missions can resume safely after failure.
- Execution history and metrics are persisted.
- SDK can run at least one mission end-to-end.
- UI clearly explains mission, agent, provider decisions, payment state, proof, and recommendation.

---

## 28. Final Product Narrative

Angora Market Intelligence Agents gives market-facing AI systems a trusted way to buy intelligence before acting.

Instead of allowing agents to blindly call and pay external providers, Angora coordinates specialist agents, retrieves relevant memory, applies symbolic rules, routes trusted providers, pays approved services through Circle/x402, stores checkpoints, and creates proof receipts.

The result is a production system where prediction-market, arbitrage, and social-trading agents can use paid intelligence with trust, control, memory, and auditability.

