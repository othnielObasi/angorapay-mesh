# Agentic Merge Notes

## Summary

This v0.5 package merges the Angora specialist agent layer into the existing Kairos/Angora integration kit. The result is no longer only a Gateway/SDK integration. It is now a production-oriented agentic market-intelligence system built on top of the Gateway.

## New backend modules

```text
src/angora/agentic/types.ts
src/angora/agentic/util.ts
src/angora/agentic/conversation-store.ts
src/angora/agentic/trace-store.ts
src/angora/agentic/checkpoint-store.ts
src/angora/agentic/adaptive-memory.ts
src/angora/agentic/mission-classifier.ts
src/angora/agentic/recommendation-engine.ts
src/angora/agentic/agent-mission-service.ts
```

## New routes

```text
POST /v1/angora/agent-missions/run
GET  /v1/angora/conversations
GET  /v1/angora/conversations/:conversationId
GET  /v1/angora/agent-traces
GET  /v1/angora/agent-checkpoints
```

## Design decision

The agentic layer was merged inside the existing codebase instead of kept as a standalone package because it depends directly on:

- provider registry
- route scoring
- policy engine
- Circle/x402 adapter
- receipts
- execution history
- reputation engine
- state persistence
- metrics

This avoids duplicate schemas and prevents a later rewrite.

## User-facing pages this enables

- Agent Missions
- Conversations
- Traces
- Marketplace
- Payments / History
- Proof
- Metrics
- Developers
- Providers

## Internal inspectors this enables

- Route scorecard
- Context and memory packet
- Checkpoints
- Policy outcome details

These should be expandable inside Agent Missions, Traces, Proof, or Developer views rather than promoted as ordinary user pages.
