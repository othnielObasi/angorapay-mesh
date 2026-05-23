import { updateExecutionRecord, listExecutionHistory } from "./execution-history.js";
import { listPaymentEvents, listPaymentIntents, updatePaymentIntent } from "./payment-ledger.js";
import { listProviderDeliveries } from "./provider-delivery-store.js";
import { createReconciliationRun } from "./reconciliation-ledger.js";
import { listReceipts, updateReceipt } from "./receipt-store.js";
import { incrementMetric, writeStructuredLog } from "./observability.js";
import type { ReconciliationItemRecord, ReconciliationStatus } from "./reconciliation-types.js";

function amountEqual(a?: string, b?: string) {
  if (a == null || b == null) return false;
  return Math.abs(Number(a) - Number(b)) < 0.000001;
}

function statusFor(input: {
  receipt?: ReturnType<typeof listReceipts>[number];
  intent?: ReturnType<typeof listPaymentIntents>[number];
  paymentEvents: ReturnType<typeof listPaymentEvents>;
  delivery?: ReturnType<typeof listProviderDeliveries>[number];
  duplicatePaymentCount: number;
}): { status: ReconciliationStatus; reason: string; actionRequired?: string } {
  const { receipt, intent, paymentEvents, delivery, duplicatePaymentCount } = input;

  if (intent?.status === "blocked" || receipt?.serviceStatus === "blocked") return { status: "blocked", reason: "Provider call was blocked by policy; payment was not attempted." };
  if (!receipt) return { status: "receipt_missing", reason: "Payment/provider state exists but no receipt is linked.", actionRequired: "Create or repair receipt linkage." };
  if (receipt.executionMode === "demo_fallback") return { status: "fallback", reason: "Call used fallback mode; no real settlement reconciliation is required." };
  if (duplicatePaymentCount > 1) return { status: "duplicate_payment", reason: "Multiple payment intents/events are linked to the same receipt or idempotency key.", actionRequired: "Review duplicate payment and refund/void if needed." };
  if (intent && intent.providerId && receipt.providerId && intent.providerId !== receipt.providerId) return { status: "provider_mismatch", reason: "Payment intent provider does not match receipt provider.", actionRequired: "Manual review required." };
  if (intent && !amountEqual(intent.amountUSDC, receipt.amountUSDC)) return { status: "amount_mismatch", reason: "Expected payment amount does not match receipt amount.", actionRequired: "Manual review required." };

  const paid = Boolean(receipt.x402Reference || intent?.paymentReference || paymentEvents.some((event) => event.paymentStatus === "authorized_by_x402" || event.paymentStatus === "mock_authorized"));
  const settled = receipt.settlementStatus === "settled" || intent?.status === "settled" || paymentEvents.some((event) => event.settlementStatus === "settled");
  const delivered = receipt.serviceStatus === "delivered" || delivery?.status === "delivered";

  if (!paid && delivered) return { status: "delivered_but_payment_unconfirmed", reason: "Provider returned a result but payment is not confirmed yet.", actionRequired: "Wait for payment event or review provider access rules." };
  if (paid && !delivered) return { status: "paid_but_not_delivered", reason: "Payment was authorized but provider delivery is missing or failed.", actionRequired: "Retry provider, request credit/refund, or mark provider reliability down." };
  if (!paid) return { status: "pending_payment", reason: "Payment event/reference has not been observed yet." };
  if (!delivered) return { status: "pending_delivery", reason: "Provider delivery is not confirmed yet." };
  if (paid && delivered && (settled || receipt.settlementStatus === "pending_batch_settlement")) return { status: settled ? "matched" : "pending_payment", reason: settled ? "Payment, delivery, receipt, and settlement are matched." : "Payment and delivery are matched; final settlement is still pending." };

  return { status: "manual_review_required", reason: "Unable to derive a deterministic reconciliation state.", actionRequired: "Manual review required." };
}

/**
 * Production reconciliation pass.
 *
 * This compares Angora's expected payment intents, observed payment events,
 * provider deliveries, and receipts. It deliberately keeps a durable run record
 * so auditors can inspect how every receipt was reconciled at a point in time.
 */
export function runProductionReconciliation(filter: { workspaceId?: string; tenantId?: string; missionId?: string; receiptId?: string } = {}) {
  const receipts = listReceipts({ workspaceId: filter.workspaceId, tenantId: filter.tenantId, missionId: filter.missionId, limit: 5000 }).filter((receipt) => !filter.receiptId || receipt.receiptId === filter.receiptId);
  const intents = listPaymentIntents({ missionId: filter.missionId, receiptId: filter.receiptId, limit: 5000 });
  const receiptIds = new Set([...receipts.map((receipt) => receipt.receiptId), ...intents.map((intent) => intent.receiptId).filter(Boolean) as string[]]);

  const items: Omit<ReconciliationItemRecord, "reconciliationItemId" | "reconciliationRunId" | "createdAt">[] = [];

  for (const receiptId of receiptIds) {
    const receipt = receipts.find((candidate) => candidate.receiptId === receiptId);
    const intentMatches = listPaymentIntents({ receiptId, limit: 20 });
    const intent = intentMatches[0] || intents.find((candidate) => candidate.receiptId === receiptId);
    const paymentEvents = listPaymentEvents({ receiptId, limit: 50 });
    const delivery = listProviderDeliveries({ receiptId, limit: 10 })[0];
    const outcome = statusFor({ receipt, intent, paymentEvents, delivery, duplicatePaymentCount: intentMatches.length });

    if (receipt) {
      const nextSettlement = outcome.status === "matched" ? "settled" : receipt.settlementStatus;
      updateReceipt(receipt.receiptId, {
        settlementStatus: nextSettlement,
        finalityStatus: outcome.status === "matched" ? "final" : receipt.finalityStatus,
        metadata: { ...receipt.metadata, reconciliationStatus: outcome.status, reconciliationReason: outcome.reason, reconciliationActionRequired: outcome.actionRequired },
      });
      const matching = listExecutionHistory({ missionId: receipt.missionId }).find((record) => record.receiptId === receipt.receiptId);
      if (matching && outcome.status === "matched") updateExecutionRecord(matching.id, { status: "settled" });
    }

    if (intent && outcome.status === "matched") updatePaymentIntent(intent.paymentIntentId, { status: "settled" });

    items.push({
      missionId: receipt?.missionId || intent?.missionId,
      receiptId,
      paymentIntentId: intent?.paymentIntentId,
      providerDeliveryId: delivery?.providerDeliveryId,
      status: outcome.status,
      reason: outcome.reason,
      expectedAmountUSDC: intent?.amountUSDC,
      observedAmountUSDC: receipt?.amountUSDC,
      expectedProviderId: intent?.providerId,
      observedProviderId: receipt?.providerId,
      actionRequired: outcome.actionRequired,
      metadata: { paymentEvents, receipt, intent, delivery },
    });
  }

  const run = createReconciliationRun({ workspaceId: filter.workspaceId, tenantId: filter.tenantId, missionId: filter.missionId, receiptId: filter.receiptId, items });
  incrementMetric("settlementReconciliations");
  writeStructuredLog("reconciliation.run", { reconciliationRunId: run.reconciliationRunId, checked: run.checked, matched: run.matched, failed: run.failed, manualReviewRequired: run.manualReviewRequired });
  return run;
}
