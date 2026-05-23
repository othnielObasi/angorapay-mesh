# angorapay

Python SDK starter for AngoraPay Mesh.

```python
from angorapay import AngoraPay

client = AngoraPay(api_key="ag_live_...")
result = client.run_market_mission(
    mission_id="prediction-market-intel-demo",
    agent_id="prediction-agent-01",
    intent="evaluate +EV market opportunity",
    max_spend_usdc="0.05",
    required_proof=True,
)
```
