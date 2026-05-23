# @angorapay/sdk

TypeScript SDK for AngoraPay Mesh. It calls the Angora Gateway on top of Kairos so market agents can discover, route, pay for, and prove paid market-service calls using Circle/x402 on Arc.

```ts
import { AngoraPay } from "@angorapay/sdk";

const angora = new AngoraPay({ apiKey: process.env.ANGORA_API_KEY! });
const result = await angora.runMarketMission({
  missionId: "prediction-market-intel-demo",
  agentId: "prediction-agent-01",
  intent: "evaluate +EV market opportunity",
  maxSpendUSDC: "0.05",
  requiredProof: true,
});
```
