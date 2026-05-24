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
| Agents run market-intelligence missions with persistent multi-turn conversation | Agent Missions, Conversations, Traces, Checkpoints |
| Live data bought from real external APIs per call | Polymarket gamma API, Kraken Ticker + OHLC, Alternative.me Fear & Greed |
| Every provider call fires a real USDC micro-transfer on Arc testnet | Circle Developer-Controlled Wallets, Circle Gateway nanopayments, ArcScan tx links |
| Weak or non-compliant providers are blocked before payment | Policy Engine, Spend Limits, Trust Scorecard |
| Approved calls produce Circle payment receipts with output hashes | Payment Intents, Receipts, x402Reference, Circle tx UUIDs |
| GPT-4o mini produces evidence-grounded recommendations | LLM Reasoning Layer, Deterministic Fallback |
| Mission output is cryptographically anchored to Arc testnet | sha256(recommendation + receipts + bet intent) recorded via Circle DCW; `onChainProof.proofHash` and ArcScan link in every mission result |
| Agent submits autonomous Polymarket positions when confidence and edge thresholds are met | Kelly criterion position sizing; EIP-712 typed-data order signing on Polygon (chain 137); GTC limit orders submitted to Polymarket CLOB |
| Idle capital earns yield when signal is weak | USYC allocation (Hashnote tokenised money market, ~5% APY) when action is `monitor`/`avoid` at confidence < 65% |
| Cross-chain settlement for arbitrage opportunities | Circle CCTP v2: USDC burn on Arc testnet, mint on Base Sepolia; no bridging risk |
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
GOVERNANCE_BILLING_ADDRESS=0x000000000000000000000000000000000000dEaD
ANGORA_DEMO_ARC_TESTNET=true
```

**Arc testnet details:**

```text
RPC:    https://rpc.testnet.arc.network
Chain:  5042002
USDC:   0x3600000000000000000000000000000000000000
```

**Circle Developer Stack:**

Every Circle primitive is wired into the mission flow, not just referenced:

| Primitive | Role |
| --- | --- |
| Developer-Controlled Wallets (DCW) | Agent wallet (`0x4991…d9b`) signs all USDC transfers and x402 authorizations |
| Gateway nanopayments | Gas-free batched settlement for sub-$0.01 provider calls; Circle absorbs gas via batch netting |
| CCTP v2 | Cross-chain USDC transfer for arbitrage missions (Arc testnet → Base Sepolia) |
| USYC / Hashnote | Idle capital allocation at ~5% APY when agent confidence is low |
| Paymaster | Gas sponsorship in USDC for post-CCTP destination-chain transactions |
| App Kit | Bridge, Swap, and Send primitives in the agent dashboard |

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
Circle DCW Payment Boundary (real USDC micro-transfer per provider call)
        |
        v
Live Data Fetcher → Polymarket / Kraken / Alternative.me
        |
        v
Provider Delivery + Output Hash + Circle Receipt
        |
        v
GPT-4o mini Recommendation (action, confidence, guardrail)
        |
        v
Kelly Criterion → Polymarket CLOB (EIP-712 GTC order, if edge ≥ threshold)
        |
        v
sha256(mission bundle) anchored on Arc testnet via Circle DCW proof transfer
        |
        v
Conversation History + Traces + Reconciliation Ledger + onChainProof
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
  "marketTarget": "ETH year-end price target",
  "budgetUSDC": "0.05",
  "proofRequired": true
}
```

Response includes:

- `recommendation` — action, confidence (0–100), summary, reasons, guardrail from GPT-4o mini
- `decisions[]` — provider selection, route score, policy verdict, Circle receipt per call
- `receipts[]` — Circle DCW transaction UUIDs and ArcScan links
- `betIntent` — Kelly-criterion position: side, `kellySizeUsdc`, `edgeBps`, `submittedOrderId`, `status`
- `onChainProof` — `proofHash` (sha256 of mission bundle), `anchorTxId` (Circle UUID), `explorerUrl` (ArcScan)
- `usycPosition` — USYC allocation amount and estimated APY (when confidence < 65%)
- `cctpSettlement` — CCTP burn record and destination chain (cross-venue arbitrage missions)
- `totals` — USDC routed, receipts created, providers approved/blocked

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
| Live data | Polymarket gamma API, Kraken (Ticker + OHLC), Alternative.me Fear & Greed |
| Circle DCW nanopayments | Live — real USDC per provider call via Circle Developer-Controlled Wallets on Arc testnet |
| Circle Gateway settlement | Live — gas-free batched nanopayment settlement per call |
| Arc testnet wallet | `0x4991dd462f7672b737571b194b6cd6f271773d9b` ([ArcScan](https://testnet.arcscan.app/address/0x4991dd462f7672b737571b194b6cd6f271773d9b)) |
| GPT-4o mini reasoning | Live — multi-turn conversation with persistent history |
| On-chain proof anchoring | Live — sha256(mission bundle) recorded on Arc testnet via Circle DCW on every mission |
| Autonomous Polymarket execution | Live — Kelly criterion sizing, EIP-712 order signing, CLOB submission |
| USYC idle capital allocation | Live — Hashnote USYC when confidence < 65% |
| Circle CCTP cross-chain | Live — USDC burn on Arc, mint on Base Sepolia for arbitrage missions |
| TypeScript SDK | Published — `npm install @angorapay/sdk` |
| Python SDK | Published — `pip install angorapay` |
| PostgreSQL schema | Included at `src/angora/db/migrations/001_angora_platform.sql` |
| Local JSON storage | Implemented |
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
