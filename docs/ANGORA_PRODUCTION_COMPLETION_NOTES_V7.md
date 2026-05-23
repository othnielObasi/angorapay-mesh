# Angora v0.7 Production Completion Notes

This upgrade moves the merged Angora/Kairos agentic kit closer to real beta use by adding the missing production platform pieces around the v0.6 agentic/reconciliation core.

## Added in v0.7

### Multi-tenant workspace foundation
- `src/angora/workspace-store.ts`
- Workspaces
- Workspace members and roles
- Workspace policy
- Workspace budgets
- Workspace provider access
- Workspace-scoped API endpoints

### Auditability
- `src/angora/audit-log.ts`
- Workspace-scoped audit log records for workspace, policy, budget, provider access, and provider onboarding changes.

### Provider onboarding
- Dynamic provider-service registration in `service-registry.ts`
- Provider validation helper
- `POST /v1/angora/providers/register`
- `POST /v1/angora/providers/:providerId/validate`

### Production database target
- `src/angora/db/migrations/001_angora_platform.sql`
- Durable PostgreSQL target schema for workspaces, members, conversations, traces, checkpoints, provider services, payment ledgers, provider deliveries, receipts, reconciliation, and audit logs.

### Product UI
- Replaced `src/dashboard/public/angora.html` with a cleaner production-oriented platform UI:
  - Agent Missions
  - Conversations
  - Traces
  - Gateway
  - Marketplace
  - Payments
  - Reconciliation
  - Proof
  - Metrics
  - Providers
  - Settings
  - Developers

### Deployment assets
- `docker-compose.angora.yml`
- `.env.production.example`
- Health/readiness endpoints:
  - `GET /v1/angora/health`
  - `GET /v1/angora/ready`

### Tests
- Extended self-test coverage for:
  - workspace creation
  - membership
  - policy updates
  - budget defaults
  - provider access
  - audit logs
  - dynamic provider service registration

## Remaining Production Choices

The kit still keeps JSON-backed local storage as the default to stay deployable in simple hackathon/Vultr environments. The PostgreSQL migration and repository boundaries are now present, but the next hardening pass should replace each file-backed store with a PostgreSQL repository implementation when `ANGORA_STORAGE_DRIVER=postgres`.

## Validation Commands

```bash
npm run angora:typecheck
npm run angora:self-test
npm run angora:agentic-smoke
npm run angora:reconciliation-smoke
npm run angora:full-check
```
