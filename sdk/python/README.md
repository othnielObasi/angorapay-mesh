# angorapay

Python SDK for AngoraPay Mesh, the paid-intelligence routing, policy, payment-boundary, receipt, and reconciliation layer for market agents.

Use it from a backend, research job, trading pipeline, or agent runtime. Keep API keys server-side.

## Install

```bash
pip install angorapay
```

For the current repository build before registry publication:

```bash
cd sdk/python
python -m build
```

## Configure

```python
from angorapay import AngoraPay

client = AngoraPay(
    base_url="https://your-angora-gateway.example",
    api_key="ag_live_...",
)
```

## Run A Market-Intelligence Mission

```python
result = client.run_agent_mission(
    userGoal="Check whether this BTC prediction market is mispriced after the news shift.",
    module="prediction_market",
    paymentMode="arc_testnet",
    budgetUSDC="0.05",
)

print(result["recommendation"])
print(result["receipts"])
```

## Route One Paid Provider Call

```python
route = client.call_market_service(
    missionId="agent_mission_123",
    agentId="prediction-market-intelligence-agent",
    consumerId="enterprise-workspace",
    intent="Fetch prediction-market odds",
    category="odds",
    maxPrice="0.01",
    idempotencyKey="agent_mission_123:odds:001",
)
```

## Inspect Proof And Reconciliation

```python
payments = client.payment_intents(missionId="agent_mission_123")
runs = client.reconciliation_runs(missionId="agent_mission_123")
traces = client.agent_traces(missionId="agent_mission_123")
```

## Enterprise Notes

- Use API-key auth for production gateways.
- Treat `demo_fallback`, `arc_testnet`, and `real_x402` as distinct execution modes.
- Do not represent fallback receipts as real settlement.
- Store receipt IDs, route scores, provider decisions, output hashes, and reconciliation state with every market recommendation.
