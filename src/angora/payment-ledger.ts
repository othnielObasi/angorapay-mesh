import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { GatewayDecision, ProviderCallResult, RuntimeReceipt } from "./types.js";
import type { PaymentEventRecord, PaymentIntentRecord, PaymentIntentStatus } from "./reconciliation-types.js";
import type { AngoraGatewayCallRequest, ServiceManifest } from "./types.js";

const PAYMENT_INTENTS_FILE = stateFile("payment-intents.json");
const PAYMENT_EVENTS_FILE = stateFile("payment-events.json");

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function loadIntents() {
  return readJsonFile<PaymentIntentRecord[]>(PAYMENT_INTENTS_FILE, []);
}

function saveIntents(records: PaymentIntentRecord[]) {
  writeJsonFile(PAYMENT_INTENTS_FILE, records.slice(0, 5000));
}

function loadEvents() {
  return readJsonFile<PaymentEventRecord[]>(PAYMENT_EVENTS_FILE, []);
}

function saveEvents(records: PaymentEventRecord[]) {
  writeJsonFile(PAYMENT_EVENTS_FILE, records.slice(0, 10000));
}

/**
 * Create or return the existing payment intent for an idempotent provider call.
 *
 * This is intentionally file-backed in the integration kit, but the interface is
 * narrow so it can be replaced with PostgreSQL in the host Kairos deployment.
 */
export function createPaymentIntent(input: {
  request: AngoraGatewayCallRequest;
  service?: ServiceManifest;
  decision: GatewayDecision;
  status?: PaymentIntentStatus;
  metadata?: Record<string, unknown>;
}): PaymentIntentRecord {
  const records = loadIntents();
  const idem = input.request.idempotencyKey || `${input.request.missionId}:${input.request.category}:${input.service?.serviceId || "blocked"}`;
  const existing = records.find((record) => record.idempotencyKey === idem);
  if (existing) return existing;

  const record: PaymentIntentRecord = {
    paymentIntentId: id("pay_intent"),
    workspaceId: input.request.workspaceId,
    tenantId: input.request.tenantId,
    missionId: input.request.missionId,
    agentId: input.request.agentId,
    consumerId: input.request.consumerId,
    providerId: input.service?.providerId,
    serviceId: input.service?.serviceId,
    category: input.request.category,
    amountUSDC: input.service?.price || "0",
    asset: "USDC",
    paymentRail: "Circle/x402",
    network: "Arc",
    executionMode: input.status === "blocked" ? "blocked" : "demo_fallback",
    idempotencyKey: idem,
    status: input.status || "created",
    routeScore: input.decision.scorecard?.routeScore,
    policyVerdict: input.decision.reason,
    createdAt: now(),
    updatedAt: now(),
    metadata: input.metadata || {},
  };

  records.unshift(record);
  saveIntents(records);
  addPaymentEvent({
    paymentIntentId: record.paymentIntentId,
    missionId: record.missionId,
    providerId: record.providerId,
    serviceId: record.serviceId,
    eventType: "intent_created",
    paymentStatus: record.status === "blocked" ? "not_required" : "mock_authorized",
    settlementStatus: record.status === "blocked" ? "not_applicable" : "pending_batch_settlement",
    amountUSDC: record.amountUSDC,
    raw: { source: "createPaymentIntent", status: record.status },
  });
  return record;
}

export function updatePaymentIntent(paymentIntentId: string, patch: Partial<PaymentIntentRecord>): PaymentIntentRecord | undefined {
  const records = loadIntents();
  const index = records.findIndex((record) => record.paymentIntentId === paymentIntentId);
  if (index < 0) return undefined;
  records[index] = { ...records[index], ...patch, updatedAt: now() };
  saveIntents(records);
  return records[index];
}

export function attachProviderResultToPaymentIntent(input: {
  paymentIntentId: string;
  providerResult: ProviderCallResult;
  receipt?: RuntimeReceipt;
}): PaymentIntentRecord | undefined {
  const status: PaymentIntentStatus = input.providerResult.ok
    ? input.providerResult.settlementStatus === "settled"
      ? "settled"
      : "authorized"
    : "failed";
  const updated = updatePaymentIntent(input.paymentIntentId, {
    status,
    executionMode: input.providerResult.executionMode,
    paymentReference: input.providerResult.x402Reference,
    receiptId: input.receipt?.receiptId,
    network: input.providerResult.arcNetwork || "Arc",
  });

  addPaymentEvent({
    paymentIntentId: input.paymentIntentId,
    receiptId: input.receipt?.receiptId,
    missionId: updated?.missionId || input.receipt?.missionId,
    providerId: updated?.providerId || input.receipt?.providerId,
    serviceId: updated?.serviceId || input.receipt?.serviceId,
    eventType: input.providerResult.ok ? "authorized" : "failed",
    paymentStatus: input.providerResult.paymentStatus,
    settlementStatus: input.providerResult.settlementStatus,
    amountUSDC: input.providerResult.amountUSDC,
    paymentReference: input.providerResult.x402Reference,
    txHash: input.providerResult.txHash,
    explorerUrl: input.providerResult.explorerUrl,
    raw: { providerResult: input.providerResult },
  });
  return updated;
}

export function addPaymentEvent(input: Omit<PaymentEventRecord, "paymentEventId" | "createdAt">): PaymentEventRecord {
  const events = loadEvents();
  const record: PaymentEventRecord = { paymentEventId: id("pay_evt"), createdAt: now(), ...input };
  events.unshift(record);
  saveEvents(events);
  return record;
}

export function listPaymentIntents(filter: { workspaceId?: string; missionId?: string; receiptId?: string; status?: string; paymentReference?: string; limit?: number; offset?: number } = {}) {
  const limit = Math.min(Math.max(Number(filter.limit || 1000), 1), 2000);
  const offset = Math.max(Number(filter.offset || 0), 0);
  return loadIntents().filter((record) => {
    if (filter.workspaceId && record.workspaceId !== filter.workspaceId) return false;
    if (filter.missionId && record.missionId !== filter.missionId) return false;
    if (filter.receiptId && record.receiptId !== filter.receiptId) return false;
    if (filter.status && record.status !== filter.status) return false;
    if (filter.paymentReference && record.paymentReference !== filter.paymentReference) return false;
    return true;
  }).slice(offset, offset + limit);
}

export function listPaymentEvents(filter: { missionId?: string; receiptId?: string; paymentIntentId?: string; paymentReference?: string; limit?: number; offset?: number } = {}) {
  const limit = Math.min(Math.max(Number(filter.limit || 1000), 1), 2000);
  const offset = Math.max(Number(filter.offset || 0), 0);
  return loadEvents().filter((event) => {
    if (filter.missionId && event.missionId !== filter.missionId) return false;
    if (filter.receiptId && event.receiptId !== filter.receiptId) return false;
    if (filter.paymentIntentId && event.paymentIntentId !== filter.paymentIntentId) return false;
    if (filter.paymentReference && event.paymentReference !== filter.paymentReference) return false;
    return true;
  }).slice(offset, offset + limit);
}
