# Production Reconciliation Ledger

This document explains the production-grade reconciliation layer added in v0.6.

## Why this exists

Angora missions may involve real paid provider calls through Circle/x402. A production system must not only create receipts; it must reconcile what was expected, paid, delivered, and stored.

The system therefore maintains four separate records:

1. Payment intent — what Angora expected to pay.
2. Payment event — what the payment layer reported.
3. Provider delivery — what the provider returned.
4. Receipt — what Angora stored as proof.

A reconciliation run compares those records and stores the result.

## Core files

- `src/angora/reconciliation-types.ts`
- `src/angora/payment-ledger.ts`
- `src/angora/provider-delivery-store.ts`
- `src/angora/webhook-event-store.ts`
- `src/angora/reconciliation-ledger.ts`
- `src/angora/reconciliation-service.ts`

## How the flow works

```text
Route approved
  ↓
Payment intent created
  ↓
Circle/x402 provider call attempted
  ↓
Payment event recorded
  ↓
Provider delivery recorded
  ↓
Receipt created
  ↓
Reconciliation run compares all records
```

## Reconciliation statuses

- `matched`: payment, provider delivery, and receipt are consistent.
- `pending_payment`: delivery/receipt exists but payment settlement is not final.
- `pending_delivery`: payment exists but delivery is not confirmed.
- `paid_but_not_delivered`: payment was observed but provider failed/missed delivery.
- `delivered_but_payment_unconfirmed`: provider delivered but payment reference/event is missing.
- `amount_mismatch`: expected and observed amounts differ.
- `provider_mismatch`: payment intent provider differs from receipt provider.
- `duplicate_payment`: multiple payment records map to one receipt/idempotency key.
- `receipt_missing`: payment or delivery exists without a receipt.
- `fallback`: demo/fallback mode, no real settlement required.
- `blocked`: policy blocked payment before execution.
- `manual_review_required`: no deterministic safe state could be inferred.

## Production deployment note

The kit uses JSON file stores for portability. For production, back these interfaces with PostgreSQL tables:

- `payment_intents`
- `payment_events`
- `provider_deliveries`
- `webhook_events`
- `reconciliation_runs`
- `reconciliation_items`

Keep the same domain boundaries even when replacing file persistence.
