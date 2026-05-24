<p align="center">
  <h1 align="center">AngoraPay Mesh</h1>
  <p align="center"><strong>Paid-intelligence routing for market-agent workflows — real data, Circle nanopayments, Arc testnet settlement.</strong></p>
  <p align="center">
    <a href="#core-thesis">Core Thesis</a> &bull;
    <a href="#what-angorapay-mesh-proves">What It Proves</a> &bull;
    <a href="#live-data-sources">Live Data</a> &bull;
    <a href="#circle-nanopayments--arc-testnet">Circle & Arc</a> &bull;
    <a href="#specialist-agents">Specialist Agents</a> &bull;
    <a href="#runtime-architecture">Architecture</a> &bull;
    <a href="#api-highlights">API</a> &bull;
    <a href="#local-development">Development</a>
  </p>
</p>

---

AngoraPay Mesh is a paid-intelligence gateway for market-agent workflows.

Specialist agents buy real data from Polymarket, Kraken, and the Fear & Greed Index, paying each provider in USDC on Arc testnet via Circle nanopayments. GPT-4o mini synthesises the live signals into an actionable recommendation. Every provider call produces a Circle payment receipt with an output hash.

The demo runs live at:

```
http://108.61.173.24/
```

Agent wallet on Arc testnet: `0x4991dd462f7672b737571b194b6cd6f271773d9b`  
[View wallet on ArcScan →](https://testnet.arcscan.app/address/0x4991dd462f7672b737571b194b6cd6f271773d9b)

---

## Core Thesis

Market-facing agents will consume paid signals at high frequency — odds, prices, sentiment, risk, arbitrage data — through providers they cannot pre-vet.

If those calls are handled as opaque subscriptions or unverified API requests, teams cannot answer:

- what did the agent buy?
- why did it trust that provider?
- what policy allowed or blocked the call?
- did payment reconcile with delivery?
- can an auditor inspect the full path later?

AngoraPay Mesh makes the full path inspectable at the level of the individual provider call.

## What AngoraPay Mesh Proves

| Claim | Proof Surface |
| --- | --- |
| Agents can run concrete market-intelligence missions | Agent Missions, Conversations, Traces |
| Live data is bought from real external APIs | Polymarket gamma API, Kraken public Ticker + OHLC, Alternative.me Fear & Greed |
| Providers are paid per call in USDC on Arc testnet | Circle nanopayments, Arc testnet transactions, ArcScan links |
| Weak or non-compliant providers are blocked before payment | Policy Engine, Spend Limits, Provider Access |
| Approved calls produce Circle payment receipts | Payment Intents, Receipts, Output Hashes |
| GPT-4o mini produces evidence-grounded recommendations | LLM Reasoning Layer, Deterministic Fallback |
| Developers can integrate without using the UI | TypeScript SDK, Python SDK, `/v1/angora/*` APIs |

## Live Data Sources

When `ANGORA_LIVE_DATA=true`, each specialist agent buys real data from the following external sources before generating a recommendation.

| Category | Source | API |
| --- | --- | --- |
| Odds | Polymarket | `gamma-api.polymarket.com/markets` |
| Sentiment | Alternative.me | `api.alternative.me/fng` |
| Risk | Kraken | `api.kraken.com/0/public/OHLC` (hourly, annualised vol) |
| Market data | Kraken | `api.kraken.com/0/public/Ticker` |
| Social | Alternative.me | `api.alternative.me/fng` (7-day window) |
| Arbitrage | Kraken + CoinGecko | Ticker spread vs CoinGecko simple price |

Each live call is wrapped in the Circle/x402 payment boundary. If a live call fails, the system falls back to deterministic mock data and records the fallback in the mission trace.

## Circle Nanopayments & Arc Testnet

AngoraPay Mesh integrates with Circle's nanopayment infrastructure for per-call provider settlement on Arc testnet.

**Settlement path:**

```text
Agent mission triggers provider call
        |
        v
Circle/x402 payment boundary
        |
        v
USDC nanopayment on Arc testnet (Chain ID 5042002)
        |
        v
Circle payment receipt with output hash
        |
        v
ArcScan confirmation
```

**Configuration:**

```text
CIRCLE_API_KEY=...
CIRCLE_ENTITY_SECRET=...
CIRCLE_WALLET_ID=...
AGENT_WALLET_ADDRESS=0x4991dd462f7672b737571b194b6cd6f271773d9b
GOVERNANCE_BILLING_ADDRESS=0x4991dd462f7672b737571b194b6cd6f271773d9b
ANGORA_DEMO_ARC_TESTNET=true
```

**Arc testnet details:**

```text
RPC:    https://rpc.testnet.arc.network
Chain:  5042002
USDC:   0x3600000000000000000000000000000000000000
```

**Circle Agent Marketplace:**

AngoraPay Mesh mirrors the pattern from [agents.circle.com/services](https://agents.circle.com/services) — each provider in the service registry exposes an x402 endpoint that delivers data only after USDC payment clears. Real marketplace providers can be added without changing the mission orchestration layer.

## Specialist Agents

Three specialist market-intelligence agents ship as the reference application.

| Agent | Purpose | Data Bought |
| --- | --- | --- |
| Prediction Market Intelligence | Evaluate whether a prediction market is mispriced or positive expected value | Polymarket odds, Fear & Greed sentiment, Kraken volatility |
| Cross-Venue Arbitrage | Evaluate whether a price gap survives fees, slippage, liquidity, and risk | Kraken ticker, Kraken OHLC risk, Kraken vs CoinGecko arbitrage |
| Social Trading Intelligence | Evaluate whether a trader or social-alpha signal is reliable enough to follow | Fear & Greed (7-day), sentiment index, Kraken volatility |

### Running a mission

```bash
curl -X POST http://108.61.173.24/v1/angora/agent-missions/run \
  -H "Content-Type: application/json" \
  -d '{
    "userGoal": "Is this BTC prediction market mispriced after the news shift?",
    "context": { "asset": "BTC" }
  }'
```

The response includes:

- `decisions[]` — which providers were selected, scored, and approved or blocked
- `recommendation` — action, confidence, summary, reasons, and guardrail from GPT-4o mini
- `receipts[]` — Circle payment receipts with output hashes
- `totals` — USDC routed, receipts created

## Platform Layers

| Layer | Role |
| --- | --- |
| AngoraPay Mesh | Core infrastructure: provider discovery, trust scoring, route scorecards, policy, spend control, Circle/x402 payment boundary, receipts, reconciliation, workspace controls, SDK/API access |
| Market Intelligence Agents | Reference app: Prediction Market Intelligence, Cross-Venue Arbitrage, Social Trading Intelligence |

## Runtime Architecture

```text
Product UI / SDK / External Agent
        |
        v
Angora API Routes  (/v1/angora/*)
        |
        v
Mission Orchestrator + Mission Classifier
        |
        v
Specialist Agent Runtime
        |
        v
LLM Reasoning (GPT-4o mini) + Deterministic Fallback
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
Live Data Fetcher → Polymarket / Kraken / Alternative.me
        |
        v
Provider Delivery + Output Hash + Circle Receipt
        |
        v
Arc Testnet Nanopayment Settlement
        |
        v
Conversation History + Traces + Reconciliation Ledger
```

## AI Reasoning

When `OPENAI_API_KEY` is configured, agent missions use GPT-4o mini for:

- mission interpretation and specialist agent selection,
- practical market target and asset extraction,
- evidence-based recommendation summaries grounded in live data,
- human-readable risk flags and guardrails.

The LLM does not control money movement. These remain deterministic:

- provider discovery and route scoring,
- trust and policy gates,
- spend limits,
- Circle/x402 payment boundary,
- receipt creation,
- output hashes,
- reconciliation.

Recommended configuration:

```text
ANGORA_LLM_ENABLED=true
ANGORA_LLM_MODEL=gpt-4o-mini
ANGORA_LLM_TIMEOUT_MS=12000
OPENAI_API_KEY=sk-...
```

If no key is configured, Angora continues with deterministic fallback reasoning and records the fallback in the mission trace.

## API Highlights

### Mission Run

```http
POST /v1/angora/agent-missions/run
```

Body:

```json
{
  "userGoal": "Is this ETH prediction market mispriced after the Fed announcement?",
  "context": { "asset": "ETH" }
}
```

### Gateway Call

```http
POST /v1/angora/gateway/call
```

Routes one paid provider call through policy evaluation, spend limit check, Circle/x402 payment boundary, delivery, and receipt creation.

### Reconciliation

```http
POST /v1/angora/reconciliation/run
GET  /v1/angora/reconciliation/runs
```

Compares payment intents, payment events, provider deliveries, receipts, output hashes, and idempotency keys.

### Health

```http
GET /v1/angora/health
GET /v1/angora/ready
GET /v1/angora/openapi.json
```

## Product Surfaces

| Surface | Path | Purpose |
| --- | --- | --- |
| Angora console | `/` | Gateway console: Demo Apps, Overview, Executions, Providers |
| API root | `/v1/angora` | Canonical API prefix |
| Agent missions | `/v1/angora/agent-missions/run` | Run specialist market-intelligence missions |
| Gateway call | `/v1/angora/gateway/call` | Route one paid provider call |
| Receipts | `/v1/angora/receipts` | Inspect proof records |
| Reconciliation | `/v1/angora/reconciliation/run` | Compare payment, delivery, and receipt state |
| OpenAPI | `/v1/angora/openapi.json` | Public API contract |
| TypeScript SDK | `sdk/typescript` | JS/TS integration client |
| Python SDK | `sdk/python` | Python integration client |

## Payment Modes

```text
arc_testnet      — live USDC on Arc testnet via Circle nanopayments
real_x402        — real x402 endpoint with signed authorization
demo_fallback    — deterministic mock, no real payment
blocked          — provider blocked by policy before payment
failed           — payment or delivery failed
pending          — awaiting batch settlement
```

## Local Development

Install dependencies:

```bash
npm install
```

Build backend and frontend:

```bash
npm run build
```

Start the dashboard and API server:

```bash
npm run start:dashboard
```

Open:

```
http://localhost:3000/
```

Health check:

```bash
curl http://localhost:3000/v1/angora/health
```

Run a mission locally:

```bash
curl -X POST http://localhost:3000/v1/angora/agent-missions/run \
  -H "Content-Type: application/json" \
  -d '{"userGoal": "Check ETH prediction market for mispricing."}'
```

Key environment variables:

```text
ANGORA_LIVE_DATA=true          # enable real Polymarket/Kraken/FNG calls
ANGORA_DEMO_ARC_TESTNET=true   # enable Arc testnet payment mode
ANGORA_LLM_ENABLED=true        # enable GPT-4o mini reasoning
ANGORA_LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=...
CIRCLE_API_KEY=...
CIRCLE_ENTITY_SECRET=...
CIRCLE_WALLET_ID=...
AGENT_WALLET_ADDRESS=...
```

## Docker

Build and start:

```bash
docker compose -f docker-compose.angora.yml up --build
```

Production (Vultr):

```bash
docker compose -f docker-compose.vultr.yml up --build -d
```

Frontend rebuild (local, then copy into container):

```bash
npm run build:frontend
docker cp src/dashboard/public/angora-app/ angorapay:/app/src/dashboard/public/angora-app/
```

## SDKs

TypeScript:

```ts
import { AngoraPay } from "@angorapay/sdk";

const angora = new AngoraPay({
  apiKey: process.env.ANGORA_API_KEY!,
  baseUrl: "http://108.61.173.24",
});

const result = await angora.runAgentMission({
  userGoal: "Check whether this BTC prediction market is mispriced.",
});
```

Install: `npm install @angorapay/sdk`

Python:

```python
from angorapay import AngoraPay

client = AngoraPay(
    api_key="ag_live_xxx",
    gateway_url="http://108.61.173.24",
)

result = client.run_agent_mission({
    "userGoal": "Check whether this BTC prediction market is mispriced.",
})
```

Install: `pip install angorapay`

## Current Status

| Area | Status |
| --- | --- |
| Angora backend | Live under `src/angora` |
| Angora console | Live at `http://108.61.173.24/` |
| API routes | Mounted at `/v1/angora/*` |
| Live data | Polymarket, Kraken (Ticker + OHLC), Alternative.me Fear & Greed |
| Circle nanopayments | Integrated — real USDC on Arc testnet per provider call |
| Arc testnet wallet | `0x4991dd462f7672b737571b194b6cd6f271773d9b` (20 USDC funded) |
| GPT-4o mini reasoning | Live — `ANGORA_LLM_ENABLED=true`, `ANGORA_LLM_MODEL=gpt-4o-mini` |
| TypeScript SDK | Published — `npm install @angorapay/sdk` |
| Python SDK | Published — `pip install angorapay` |
| PostgreSQL schema | Included at `src/angora/db/migrations/001_angora_platform.sql` |
| Local JSON storage | Implemented |
| Real x402 production config | Not completed |
| PostgreSQL repository adapters | Not completed |

## Validation

```bash
npm run build
npm run angora:typecheck
npm run angora:self-test
npm run angora:agentic-smoke
npm run angora:reconciliation-smoke
npm run angora:full-check
```
