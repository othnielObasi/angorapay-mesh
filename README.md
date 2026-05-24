# AngoraPay Mesh

Market-intelligence agents that can buy trusted paid signals, enforce policy, generate receipts, and reconcile payment with provider delivery.

AngoraPay Mesh is the product layer for real market-facing agents. The inherited runtime remains useful as an Arc/Circle/x402 proof foundation, but the application identity, API, SDKs, and operator experience are AngoraPay Mesh.

## What AngoraPay Mesh Does

AngoraPay Mesh helps agents answer one operational question before they act:

> Which intelligence should the agent buy, which provider should it trust, what should be blocked, how should payment happen, and how can the paid signal be proven later?

The platform combines:

- specialist market-intelligence agents
- provider discovery and route scoring
- policy, trust, and spend controls
- Circle/x402 payment boundaries
- receipts, traces, checkpoints, and proof bundles
- reconciliation between payment and provider delivery
- workspace-scoped API keys and audit logs
- TypeScript and Python SDKs

## Primary Users

AngoraPay Mesh is built for:

- agent builders integrating paid intelligence into autonomous workflows
- prediction-market teams evaluating odds, liquidity, event movement, and news shifts
- trading-agent teams checking cross-venue arbitrage, fees, slippage, and execution risk
- social/copy-trading teams evaluating trader reliability and signal quality
- paid intelligence providers exposing x402-compatible services
- workspace admins managing policies, budgets, API keys, and provider access
- auditors reviewing traces, receipts, payment records, and reconciliation outcomes

## Specialist Agents

### Prediction Market Intelligence Agent

Evaluates whether a prediction market may be mispriced or positive expected value.

Typical paid intelligence:

- odds feed
- liquidity depth
- news or sentiment movement
- probability shift
- risk check
- proof receipt

### Cross-Venue Arbitrage Agent

Evaluates whether a price gap across venues survives fees, slippage, liquidity, latency, and risk.

Typical paid intelligence:

- venue price feeds
- spread check
- liquidity check
- fee estimate
- slippage estimate
- execution-risk check
- proof receipt

### Social Trading Intelligence Agent

Evaluates whether a trader, influencer, or social-alpha signal is reliable enough to follow.

Typical paid intelligence:

- trader history
- signal consistency
- social sentiment
- drawdown pattern
- copy-risk score
- source credibility
- proof receipt

## Architecture

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
Specialist Agent Runtime
        |
        v
Context, Memory, Checkpoints, Policy
        |
        v
Provider Discovery and Route Scoring
        |
        v
Circle/x402 Payment Boundary
        |
        v
Provider Delivery, Receipt, Trace
        |
        v
Payment Ledger and Reconciliation
```

The product layer lives in `src/angora`. The dashboard page is served from `src/dashboard/public/angora.html`.

## API Surface

The canonical API prefix is:

```text
/v1/angora
```

Core routes include:

```text
GET  /v1/angora/health
GET  /v1/angora/ready
GET  /v1/angora/dashboard/summary

POST /v1/angora/agent-missions/run
GET  /v1/angora/conversations
GET  /v1/angora/agent-traces
GET  /v1/angora/agent-checkpoints

POST /v1/angora/gateway/call
GET  /v1/angora/services/search
GET  /v1/angora/route/simulate

POST /v1/angora/providers/register
POST /v1/angora/providers/:providerId/validate

GET  /v1/angora/payment-intents
GET  /v1/angora/payment-events
GET  /v1/angora/provider-deliveries
GET  /v1/angora/receipts
POST /v1/angora/reconciliation/run
GET  /v1/angora/reconciliation/runs

POST /v1/angora/auth/keys
GET  /v1/angora/auth/keys
POST /v1/angora/auth/keys/rotate
POST /v1/angora/auth/keys/:keyId/revoke
```

## Local Development

Install dependencies:

```bash
npm install
```

Run checks:

```bash
npm run build
npm run angora:full-check
```

Start the dashboard/API server:

```bash
npm run dashboard
```

Open:

```text
http://localhost:3000/angora.html
```

Check health:

```bash
curl http://localhost:3000/v1/angora/health
```

Run a local demo mission with auth disabled:

```bash
ANGORA_AUTH_DISABLED=true npm run dashboard
```

```bash
curl -X POST http://localhost:3000/v1/angora/demo/market-mission \
  -H "Content-Type: application/json" \
  -d "{\"payload\":{\"asset\":\"BTC\",\"market\":\"BTC prediction market\",\"horizon\":\"intraday\"}}"
```

## Payment Modes

Payment modes must remain explicit:

```text
demo_fallback
arc_testnet
real_x402
blocked
failed
pending
local_proof
```

Demo mode must not pretend to be real settlement. Real x402 should only be enabled after provider endpoints, Circle credentials, webhook verification, idempotency, and settlement reconciliation are configured.

## Storage

The current local runtime uses JSON-backed state so it can run immediately.

Default state paths:

```text
.kairos-angora/
ANGORA_STATE_DIR
KAIROS_ANGORA_STATE_DIR
KAIROS_DATA_DIR/angora
```

For real multi-user production, use PostgreSQL. The schema target is:

```text
src/angora/db/migrations/001_angora_platform.sql
```

## SDKs

TypeScript SDK:

```text
sdk/typescript
```

Python SDK:

```text
sdk/python
```

These SDKs are integrated in this repository but are not yet published externally.

## Deployment

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

For production, configure:

```text
ANGORA_REQUIRE_AUTH=true
ANGORA_API_KEY_PREFIX=ag_live
ANGORA_STATE_DIR=/var/lib/angora/state
DATABASE_URL=postgres://...
CIRCLE_API_KEY=...
CIRCLE_WALLET_ID=...
CIRCLE_ENTITY_SECRET=...
```

## Important Status

Completed:

- Angora backend mounted at `/v1/angora/*`
- Angora dashboard available at `/angora.html`
- TypeScript and Python SDKs added
- JSON-backed local stores added
- PostgreSQL schema target added
- route scoring, policy checks, receipts, payment ledgers, traces, and reconciliation added
- local build and Angora full checks passing

Not completed yet:

- npm SDK publishing
- PyPI SDK publishing
- hosted gateway deployment
- production Circle/x402 credential configuration
- PostgreSQL repository adapter wiring
- merge from feature branch into `main`

## Documentation

Angora-specific docs live under:

```text
docs/ANGORA_*.md
```

Useful entry points:

- `docs/ANGORA_AGENTIC_MERGE_NOTES.md`
- `docs/ANGORA_PRODUCTION_HARDENING_NOTES.md`
- `docs/ANGORA_PRODUCTION_RECONCILIATION_LEDGER.md`
- `docs/ANGORA_UI_PRODUCT_UPGRADE_V8.md`

## Product Position

AngoraPay Mesh is the paid-intelligence operating layer for market agents.

Specialist agents make the product usable. The gateway, SDK, payment, proof, and reconciliation layers make it trustworthy.
