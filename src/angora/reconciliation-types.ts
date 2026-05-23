import type { ExecutionMode, PaymentStatus, SettlementStatus, ServiceStatus } from "./types.js";

/**
 * Canonical reconciliation status for one paid intelligence call.
 *
 * The platform keeps this status separate from payment status and service
 * delivery status because a provider call can be paid, delivered, and receipted
 * at different times.
 */
export type ReconciliationStatus =
  | "matched"
  | "pending_payment"
  | "pending_delivery"
  | "paid_but_not_delivered"
  | "delivered_but_payment_unconfirmed"
  | "amount_mismatch"
  | "provider_mismatch"
  | "duplicate_payment"
  | "receipt_missing"
  | "failed"
  | "fallback"
  | "blocked"
  | "manual_review_required";

export type PaymentIntentStatus = "created" | "authorized" | "settled" | "failed" | "blocked" | "cancelled";
export type PaymentEventType = "intent_created" | "authorized" | "settled" | "failed" | "refunded" | "webhook_received" | "manual_adjustment";
export type ProviderDeliveryStatus = "pending" | "delivered" | "failed" | "not_called";

/**
 * PaymentIntent is Angora's expected payment record before or during a provider
 * call. This is the source of truth for what the mission intended to pay.
 */
export interface PaymentIntentRecord {
  paymentIntentId: string;
  workspaceId?: string;
  tenantId?: string;
  missionId: string;
  agentId: string;
  consumerId: string;
  providerId?: string;
  serviceId?: string;
  category: string;
  amountUSDC: string;
  asset: "USDC";
  paymentRail: "Circle/x402";
  network: string;
  executionMode: ExecutionMode;
  idempotencyKey: string;
  status: PaymentIntentStatus;
  paymentReference?: string;
  receiptId?: string;
  routeScore?: number;
  policyVerdict: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * PaymentEvent records the observed payment lifecycle from internal code,
 * x402 responses, webhooks, or manual review.
 */
export interface PaymentEventRecord {
  paymentEventId: string;
  paymentIntentId?: string;
  receiptId?: string;
  missionId?: string;
  providerId?: string;
  serviceId?: string;
  eventType: PaymentEventType;
  paymentStatus: PaymentStatus;
  settlementStatus: SettlementStatus;
  amountUSDC?: string;
  paymentReference?: string;
  txHash?: string;
  explorerUrl?: string;
  raw: Record<string, unknown>;
  createdAt: string;
}

/**
 * ProviderDelivery is the platform-side record of whether a paid service
 * actually returned a usable result and what hash was captured.
 */
export interface ProviderDeliveryRecord {
  providerDeliveryId: string;
  paymentIntentId?: string;
  receiptId?: string;
  missionId: string;
  providerId?: string;
  serviceId?: string;
  status: ProviderDeliveryStatus;
  serviceStatus: ServiceStatus;
  outputHash?: string;
  latencyMs?: number;
  schemaValid?: boolean;
  proofSupported?: boolean;
  error?: string;
  deliveredAt?: string;
  raw: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Stored copy of external webhook notifications. Notification IDs are
 * de-duplicated so retries/out-of-order delivery do not corrupt the ledger.
 */
export interface WebhookEventRecord {
  webhookEventId: string;
  source: "circle" | "x402" | "provider" | "manual";
  externalEventId: string;
  paymentReference?: string;
  receiptId?: string;
  missionId?: string;
  processed: boolean;
  duplicate: boolean;
  raw: Record<string, unknown>;
  createdAt: string;
  processedAt?: string;
}

export interface ReconciliationItemRecord {
  reconciliationItemId: string;
  reconciliationRunId: string;
  missionId?: string;
  receiptId?: string;
  paymentIntentId?: string;
  providerDeliveryId?: string;
  status: ReconciliationStatus;
  reason: string;
  expectedAmountUSDC?: string;
  observedAmountUSDC?: string;
  expectedProviderId?: string;
  observedProviderId?: string;
  actionRequired?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface ReconciliationRunRecord {
  reconciliationRunId: string;
  workspaceId?: string;
  tenantId?: string;
  missionId?: string;
  receiptId?: string;
  status: "completed" | "failed";
  checked: number;
  matched: number;
  pending: number;
  failed: number;
  manualReviewRequired: number;
  startedAt: string;
  completedAt: string;
  items: ReconciliationItemRecord[];
}
