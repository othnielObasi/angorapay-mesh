# @angorapay/sdk

TypeScript SDK for AngoraPay Mesh, the paid-intelligence routing, policy, payment-boundary, receipt, and reconciliation layer for market agents.

Use it from a backend or agent runtime. Keep API keys server-side.

## Install

```bash
npm install @angorapay/sdk
```

For the current repository build before registry publication:

```bash
cd sdk/typescript
npm install
npm run build
npm pack
```

## Configure

```ts
import { AngoraPay } from "@angorapay/sdk";

const angora = new AngoraPay({
  baseUrl: process.env.ANGORA_GATEWAY_URL ?? "https://your-angora-gateway.example",
  apiKey: process.env.ANGORA_API_KEY,
});
```

## Run A Market-Intelligence Mission

```ts
const result = await angora.runAgentMission({
  userGoal: "Check whether this BTC prediction market is mispriced after the news shift.",
  module: "prediction_market",
  paymentMode: "arc_testnet",
  budgetUSDC: "0.05",
});

console.log(result.recommendation);
console.log(result.receipts);
```

## Route One Paid Provider Call

```ts
const route = await angora.callMarketService({
  missionId: "agent_mission_123",
  agentId: "prediction-market-intelligence-agent",
  consumerId: "enterprise-workspace",
  intent: "Fetch prediction-market odds",
  category: "odds",
  maxPrice: "0.01",
  idempotencyKey: "agent_mission_123:odds:001",
});
```

## Inspect Proof And Reconciliation

```ts
const payments = await angora.listPaymentIntents({ missionId: "agent_mission_123" });
const runs = await angora.listReconciliationRuns({ missionId: "agent_mission_123" });
const traces = await angora.getAgentTraces({ missionId: "agent_mission_123" });
```

## Enterprise Notes

- Use API-key auth for production gateways.
- Treat `demo_fallback`, `arc_testnet`, and `real_x402` as distinct execution modes.
- Do not represent fallback receipts as real settlement.
- Store receipt IDs, route scores, provider decisions, output hashes, and reconciliation state with every market recommendation.
