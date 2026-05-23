# AngoraPay Mesh — Production hardening notes

This kit is designed to be layered onto the deployed Kairos runtime. SQLite/Postgres persistence is intentionally deferred because the current Kairos deployment already runs on Vultr with persistent data available.

## Completed in v4 without SQLite

- Market-agent framing aligned to Angora: prediction markets, perps, arbitrage, portfolio, social trading, and market-service proof.
- Zod validation for missions, gateway calls, execution-history queries, user traction, feedback, and API-key operations.
- Hashed API-key management with one-time raw key return, key rotation, revocation, scopes, and workspace/tenant metadata.
- Workspace-aware request enrichment for gateway calls, receipts, execution history, and missions.
- JSON-backed durable state now respects `ANGORA_STATE_DIR`, `KAIROS_ANGORA_STATE_DIR`, or `KAIROS_DATA_DIR/angora`, so it can run on the existing Vultr persistent volume.
- Durable idempotency records with request hashing, replay protection, and conflict detection.
- Execution History with pagination/filtering and workspace-aware reads.
- Settlement reconciliation skeleton with optional external hydration endpoint (`ANGORA_SETTLEMENT_HYDRATION_URL` / `KAIROS_SETTLEMENT_HYDRATION_URL`).
- Structured logs and runtime metrics.
- Rate limiting without storing raw API keys in the rate-limit ledger.
- Mission spend-limit enforcement.
- TypeScript SDK package skeleton and Python SDK package skeleton.
- Dockerfile and GitHub Actions workflow.

## Deliberately deferred

- SQLite/Postgres migrations and relational persistence.
- Full production tenant billing/accounting model.
- Final Circle settlement hydration against the live production Circle/Kairos adapter once deployed.
- Publishing SDK packages to npm/PyPI.

## Recommended Vultr/Kairos env

```bash
KAIROS_DATA_DIR=/var/lib/kairos
ANGORA_REQUIRE_AUTH=true
ANGORA_DEFAULT_TENANT_ID=novtia
ANGORA_DEFAULT_WORKSPACE_ID=novtia-demo
KAIROS_ENABLE_REAL_X402=true
ANGORA_SETTLEMENT_HYDRATION_URL=https://<kairos-api>/v1/settlement/hydrate
```

## Auth model

Use the legacy env key only for bootstrap/admin. Then create scoped keys:

```bash
curl -X POST "$KAIROS_URL/v1/angora/auth/keys" \
  -H "Authorization: Bearer $ANGORA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"label":"demo builder","scopes":["gateway:call","missions:read","services:read","receipts:read","history:read","metrics:read"]}'
```

The raw key is returned once. Only PBKDF2 hashes are stored.
