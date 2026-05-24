<p align="center">
  <h1 align="center">AngoraPay Mesh</h1>
  <p align="center"><strong>Market agents buy trusted intelligence before they act.</strong></p>
  <p align="center">
    <a href="#core-thesis">Core Thesis</a> &bull;
    <a href="#what-angorapay-mesh-proves">What It Proves</a> &bull;
    <a href="#specialist-agents">Specialist Agents</a> &bull;
    <a href="#product-surfaces">Product Surfaces</a> &bull;
    <a href="#runtime-architecture">Architecture</a> &bull;
    <a href="#api-highlights">API</a> &bull;
    <a href="#local-development">Development</a> &bull;
    <a href="#production-path">Production</a>
  </p>
</p>

---

AngoraPay Mesh is a market-intelligence agent platform for paid provider routing, policy enforcement, Circle/x402 payment boundaries, receipts, traces, and reconciliation.

It is built for real market-facing agents that need to buy trusted intelligence before making or recommending action. The inherited runtime foundation supplies Arc, USDC, x402, proof, and long-running agent infrastructure. The product is AngoraPay Mesh.

The core question is simple:

> Which intelligence should the agent buy, which provider should it trust, what should be blocked, how should payment happen, and how can the paid signal be proven later?

AngoraPay Mesh is not a generic trading bot. The specialist agents are the product surface. The gateway, SDK, payment, proof, policy, and reconciliation layers are the infrastructure that makes those agents trustworthy.

## Core Thesis

Market-facing agents will consume paid signals, data feeds, risk checks, liquidity context, social intelligence, proof writers, and execution-readiness tools at high frequency.

If those calls are handled as opaque subscriptions or unverified API requests, teams cannot easily answer:

- what did the agent buy?
- why did it trust that provider?
- what policy allowed or blocked the call?
- what did the provider deliver?
- did payment reconcile with delivery?
- can an auditor inspect the full path later?

AngoraPay Mesh makes that flow inspectable at the level of the individual provider call.

In one mission, AngoraPay Mesh can:

1. classify the user goal,
2. select the right specialist agent,
3. build context and checkpoints,
4. discover paid providers,
5. score routes by trust, fit, cost, proof support, and latency,
6. enforce workspace policy and spend limits,
7. pass approved calls through the Circle/x402 payment boundary,
8. record delivery and output hashes,
9. generate receipts and traces,
10. reconcile payment, delivery, and proof records.

This creates the operating model:

> The agent buys intelligence only after trust, policy, and spend checks pass.

## What AngoraPay Mesh Proves

AngoraPay Mesh is built to prove a commercial workflow, not only to render a dashboard.

| Claim | Proof Surface |
| --- | --- |
| Agents can run concrete market-intelligence missions | Agent Missions, Conversations, Traces |
| Paid providers can be discovered and scored | Marketplace, Services Search, Route Scorecard |
| Weak or non-compliant providers can be blocked before payment | Policy Engine, Spend Limits, Provider Access |
| Approved calls can create payment and proof records | Payment Intents, Payment Events, Receipts |
| Provider delivery can be matched against payment state | Provider Deliveries, Reconciliation Runs |
| Developers can integrate without using the UI | TypeScript SDK, Python SDK, `/v1/angora/*` APIs |
| Teams can operate the system safely | Workspaces, API Keys, Roles, Budgets, Audit Logs |

The value proposition:

> Teams can run market-intelligence agents that buy trusted paid signals, block weak providers, control spend, generate proof, and reconcile payment with delivery through a UI or SDK.

## Primary Users

| User | What They Need |
| --- | --- |
| Agent builders | SDK/API access for paid intelligence missions and receipts |
| Prediction-market teams | odds, liquidity, event movement, news shifts, and mispricing checks |
| Trading-agent teams | cross-venue price, spread, fee, slippage, liquidity, and risk checks |
| Social/copy-trading teams | trader reliability, signal quality, drawdown, and credibility checks |
| Paid intelligence providers | service registration, validation, usage, receipts, and reputation |
| Workspace admins | API keys, roles, policies, budgets, provider access, and audit logs |
| Auditors and evaluators | traces, receipts, payment records, delivery records, and reconciliation |

## Specialist Agents

AngoraPay Mesh starts with three specialist market-intelligence agents.

| Agent | Purpose | Typical Output |
| --- | --- | --- |
| Prediction Market Intelligence | Evaluate whether a prediction market is mispriced or positive expected value | `enter`, `monitor`, `avoid`, or `reduce_size` with confidence and receipts |
| Cross-Venue Arbitrage | Evaluate whether a price gap survives fees, slippage, liquidity, latency, and risk | `execute`, `monitor`, or `reject` with net spread and risk |
| Social Trading Intelligence | Evaluate whether a trader, influencer, or social-alpha signal is reliable enough to follow | `follow`, `follow_reduced_size`, `monitor`, or `reject` |

### Prediction Market Intelligence

Typical intelligence:

- odds feed
- liquidity depth
- news and sentiment movement
- probability shift
- risk check
- proof receipt

Example mission:

```text
Check whether this BTC prediction market is mispriced after the news shift.
```

### Cross-Venue Arbitrage

Typical intelligence:

- venue A and venue B price feeds
- spread check
- liquidity check
- fee estimate
- slippage estimate
- execution-risk check
- proof receipt

Example mission:

```text
Check whether the BTC price gap across two venues survives fees and slippage.
```

### Social Trading Intelligence

Typical intelligence:

- trader history
- signal consistency
- social sentiment
- drawdown pattern
- copy-risk score
- source credibility
- proof receipt

Example mission:

```text
Evaluate whether this trader signal is reliable enough to follow with reduced size.
```

## Product Surfaces

| Surface | Route or Path | Purpose |
| --- | --- | --- |
| Angora workspace | `/angora.html` | Primary product UI for missions, providers, proof, traces, metrics, and settings |
| API root | `/v1/angora` | Canonical Angora API prefix |
| Health | `/v1/angora/health` | Service health check |
| Readiness | `/v1/angora/ready` | Storage and runtime readiness |
| Dashboard summary | `/v1/angora/dashboard/summary` | Product overview data for the UI |
| Agent missions | `/v1/angora/agent-missions/run` | Run specialist market-intelligence missions |
| Gateway call | `/v1/angora/gateway/call` | Route one paid provider call through policy and payment boundaries |
| Receipts | `/v1/angora/receipts` | Inspect proof records for paid calls |
| Reconciliation | `/v1/angora/reconciliation/run` | Compare payment, delivery, receipt, and webhook state |
| TypeScript SDK | `sdk/typescript` | JS/TS integration client |
| Python SDK | `sdk/python` | Python integration client |

## Runtime Architecture

```text
Product UI / SDK / External Agent
        |
        v
Angora API Routes
        |
        v
Mission Orchestrator
        |
        v
Mission Classifier + Specialist Agent Runtime
        |
        v
Context Builder + Adaptive Memory + Checkpoints
        |
        v
Provider Discovery + Route Scorecard
        |
        v
Policy, Trust, Spend, and Idempotency Checks
        |
        v
Circle/x402 Payment Boundary
        |
        v
Provider Delivery + Output Hash + Receipt
        |
        v
Payment Ledger + Delivery Ledger + Reconciliation Ledger
        |
        v
Conversation History + Traces + Metrics + Audit Logs
```

The main product implementation lives in:

```text
src/angora/
src/dashboard/public/angora.html
sdk/
docs/ANGORA_*.md
```

## Key Capabilities

| Capability | Description |
| --- | --- |
| Mission orchestration | Classifies user goals and selects specialist agents |
| Context engineering | Builds mission packets from goal, provider history, policy, memory, and receipts |
| Adaptive retrieval | Uses mission, provider, receipt, and policy memory to improve routing |
| Long coordination | Stores checkpoints so long-running missions can be inspected and resumed |
| Provider marketplace | Registers, validates, searches, and scores paid intelligence services |
| Route scorecard | Scores providers by fit, trust, proof, cost, reliability, and latency |
| Policy engine | Blocks providers that fail trust, proof, category, payment, or budget rules |
| Payment executor | Isolates Circle/x402 payment behavior from agent logic |
| Receipt engine | Stores mission, provider, payment, output hash, and settlement proof data |
| Reconciliation | Detects pending payment, missing delivery, mismatches, duplicates, and missing receipts |
| Workspace controls | Scopes API keys, roles, policies, budgets, provider access, and audit records |
| SDK access | Lets external apps run missions, call the gateway, and inspect receipts/traces |

## API Highlights

### Mission Run

```http
POST /v1/angora/agent-missions/run
```

Example body:

```json
{
  "userGoal": "Check whether this BTC prediction market is mispriced after the news shift.",
  "paymentMode": "demo_fallback",
  "maxSpendUSDC": "0.05",
  "minProviderTrustScore": 85,
  "proofRequired": true
}
```

### Gateway Call

```http
POST /v1/angora/gateway/call
```

The gateway handles:

- auth and rate limits
- idempotency
- mission lookup
- provider discovery
- policy evaluation
- spend limit evaluation
- x402 payment boundary
- provider delivery
- receipt creation
- execution history

### Reconciliation

```http
POST /v1/angora/reconciliation/run
GET  /v1/angora/reconciliation/runs
```

Reconciliation compares:

- payment intents
- payment events
- provider deliveries
- receipts
- webhook events
- output hashes
- idempotency keys

## Payment Modes

Payment modes are explicit by design:

```text
real_x402
arc_testnet
demo_fallback
blocked
failed
pending
local_proof
```

Demo mode must not pretend to be real settlement. Real x402 should only be enabled after Circle credentials, provider endpoint verification, webhook signature verification, idempotency protection, and reconciliation checks are configured.

## Storage Model

The current runtime uses JSON-backed stores for fast local and demo deployment.

Default local state paths:

```text
.kairos-angora/
ANGORA_STATE_DIR
KAIROS_ANGORA_STATE_DIR
KAIROS_DATA_DIR/angora
```

Production database target:

```text
src/angora/db/migrations/001_angora_platform.sql
```

The included PostgreSQL schema covers:

- workspaces and members
- API keys
- conversations and messages
- missions and checkpoints
- traces
- provider services
- route evaluations
- policy evaluations
- payment intents and events
- provider deliveries
- receipts
- reconciliation runs and items
- audit logs

## Local Development

Install dependencies:

```bash
npm install
```

Run full checks:

```bash
npm run build
npm run angora:full-check
```

Start the dashboard and API server:

```bash
npm run dashboard
```

Open:

```text
http://localhost:3000/angora.html
```

Health check:

```bash
curl http://localhost:3000/v1/angora/health
```

Run a demo mission in local open mode:

```bash
ANGORA_AUTH_DISABLED=true npm run dashboard
```

```bash
curl -X POST http://localhost:3000/v1/angora/demo/market-mission \
  -H "Content-Type: application/json" \
  -d "{\"payload\":{\"asset\":\"BTC\",\"market\":\"BTC prediction market\",\"horizon\":\"intraday\"}}"
```

## SDKs

### TypeScript

Location:

```text
sdk/typescript
```

Example:

```ts
import { AngoraPay } from "@angorapay/sdk";

const angora = new AngoraPay({
  apiKey: process.env.ANGORA_API_KEY!,
  gatewayUrl: process.env.ANGORA_GATEWAY_URL!,
});

const result = await angora.runAgentMission({
  userGoal: "Check whether this BTC prediction market is mispriced.",
  paymentMode: "demo_fallback",
});
```

### Python

Location:

```text
sdk/python
```

Example:

```python
from angorapay import AngoraPay

client = AngoraPay(
    api_key="ag_live_xxx",
    gateway_url="https://your-domain.example",
)

result = client.run_agent_mission({
    "userGoal": "Check whether this BTC prediction market is mispriced.",
    "paymentMode": "demo_fallback",
})
```

The SDKs are integrated in this repository but are not yet published externally.

## Production Path

Docker assets:

```text
Dockerfile.angora
docker-compose.angora.yml
```

Environment templates:

```text
.env.angora.example
.env.angora.production.example
```

Recommended production values:

```text
ANGORA_REQUIRE_AUTH=true
ANGORA_API_KEY_PREFIX=ag_live
ANGORA_DEFAULT_WORKSPACE_ID=<workspace>
ANGORA_DEFAULT_TENANT_ID=<tenant>
ANGORA_STATE_DIR=/var/lib/angora/state
ANGORA_STORAGE_DRIVER=postgres
DATABASE_URL=postgres://...
REDIS_URL=redis://...
CIRCLE_API_KEY=...
CIRCLE_WALLET_ID=...
CIRCLE_ENTITY_SECRET=...
WEBHOOK_SIGNING_SECRET=...
```

## Current Status

| Area | Status |
| --- | --- |
| Angora backend | Integrated under `src/angora` |
| Angora UI | Available at `/angora.html` |
| API routes | Mounted at `/v1/angora/*` |
| Local JSON storage | Implemented |
| PostgreSQL schema | Included |
| TypeScript SDK | Builds and packs locally |
| Python SDK | Builds locally |
| Full checks | Passing |
| npm publishing | Not completed |
| PyPI publishing | Not completed |
| hosted gateway deployment | Not completed |
| real Circle/x402 production config | Not completed |
| PostgreSQL repository adapters | Not completed |
| merge into `main` | Not completed |

## Validation Commands

```bash
npm run build
npm run angora:typecheck
npm run angora:self-test
npm run angora:sdk:python:check
npm run angora:agentic-smoke
npm run angora:reconciliation-smoke
npm run angora:full-check
```

## Documentation

Angora-specific documentation lives under:

```text
docs/ANGORA_*.md
```

Useful entry points:

- `docs/ANGORA_AGENTIC_MERGE_NOTES.md`
- `docs/ANGORA_PRODUCTION_HARDENING_NOTES.md`
- `docs/ANGORA_PRODUCTION_RECONCILIATION_LEDGER.md`
- `docs/ANGORA_UI_PRODUCT_UPGRADE_V8.md`

## Strategic Summary

AngoraPay Mesh is the paid-intelligence operating layer for market agents.

Specialist agents make the product usable.

Gateway, SDK, policy, payment, proof, and reconciliation infrastructure make it credible.

Workspaces, API keys, budgets, roles, and audit logs make it usable by real teams.

Circle/x402/USDC make the paid-service workflow commercially meaningful.
