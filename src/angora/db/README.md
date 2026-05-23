# Angora Database Layer

The integration kit keeps a file-backed adapter for local and hackathon deployments, but production deployments should use PostgreSQL. The service modules are intentionally separated by domain (`workspace-store`, `conversation-store`, `payment-ledger`, `receipt-store`, `reconciliation-ledger`) so each can be swapped for a PostgreSQL repository without changing agent orchestration logic.

Recommended production mode:

```bash
ANGORA_STORAGE_DRIVER=postgres
DATABASE_URL=postgres://...
```

The SQL migration in `migrations/001_angora_platform.sql` defines the durable tables required for multi-tenant workspaces, conversations, missions, traces, payments, receipts, provider deliveries, reconciliation, and audit logs.
