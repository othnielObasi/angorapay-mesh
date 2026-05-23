# AngoraPay Mesh close-out plan

This kit is intended to be layered into a cloned Kairos repo.

## Must-show product flow

```text
market mission -> route simulation -> provider ranking -> policy gate -> Circle/x402 call -> Arc/USDC receipt -> execution history -> submission metrics
```

## RFP alignment

Primary track: RFP 02 - Prediction Market Trader Intelligence.
Secondary support: RFP 03, RFP 05, RFP 06, with supporting services for RFP 01 and RFP 04.

## Traction capture

Use these endpoints during the event window:

- POST /v1/angora/traction/users
- POST /v1/angora/traction/feedback
- GET /v1/angora/submission/metrics
- GET /v1/angora/execution-history

## Honest execution modes

- real_x402: real x402/Circle route
- arc_testnet: simulated provider call labelled as Arc testnet proof mode
- demo_fallback: local demo call
- blocked: denied by policy before payment

Do not mix these modes in reporting. Judges should see the split.
