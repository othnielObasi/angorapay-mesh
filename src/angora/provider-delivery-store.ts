import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { ProviderCallResult, RuntimeReceipt } from "./types.js";
import type { ProviderDeliveryRecord } from "./reconciliation-types.js";

const PROVIDER_DELIVERIES_FILE = stateFile("provider-deliveries.json");

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function load() {
  return readJsonFile<ProviderDeliveryRecord[]>(PROVIDER_DELIVERIES_FILE, []);
}

function save(records: ProviderDeliveryRecord[]) {
  writeJsonFile(PROVIDER_DELIVERIES_FILE, records.slice(0, 10000));
}

/**
 * Records provider delivery independently from payment and receipt state.
 * This is what lets reconciliation detect paid-but-not-delivered or
 * delivered-but-payment-unconfirmed states.
 */
export function recordProviderDelivery(input: {
  paymentIntentId?: string;
  receipt?: RuntimeReceipt;
  missionId: string;
  providerId?: string;
  serviceId?: string;
  providerResult: ProviderCallResult;
  latencyMs?: number;
  proofSupported?: boolean;
}): ProviderDeliveryRecord {
  const records = load();
  const record: ProviderDeliveryRecord = {
    providerDeliveryId: id("delivery"),
    paymentIntentId: input.paymentIntentId,
    receiptId: input.receipt?.receiptId,
    missionId: input.missionId,
    providerId: input.providerId || input.receipt?.providerId,
    serviceId: input.serviceId || input.receipt?.serviceId,
    status: input.providerResult.ok ? "delivered" : "failed",
    serviceStatus: input.providerResult.ok ? "delivered" : "failed",
    outputHash: input.receipt?.outputHash,
    latencyMs: input.latencyMs,
    schemaValid: input.providerResult.ok,
    proofSupported: input.proofSupported,
    error: input.providerResult.error,
    deliveredAt: input.providerResult.ok ? now() : undefined,
    raw: { providerResult: input.providerResult },
    createdAt: now(),
    updatedAt: now(),
  };
  records.unshift(record);
  save(records);
  return record;
}

export function listProviderDeliveries(filter: { missionId?: string; receiptId?: string; paymentIntentId?: string; providerId?: string; status?: string; limit?: number; offset?: number } = {}) {
  const limit = Math.min(Math.max(Number(filter.limit || 1000), 1), 2000);
  const offset = Math.max(Number(filter.offset || 0), 0);
  return load().filter((record) => {
    if (filter.missionId && record.missionId !== filter.missionId) return false;
    if (filter.receiptId && record.receiptId !== filter.receiptId) return false;
    if (filter.paymentIntentId && record.paymentIntentId !== filter.paymentIntentId) return false;
    if (filter.providerId && record.providerId !== filter.providerId) return false;
    if (filter.status && record.status !== filter.status) return false;
    return true;
  }).slice(offset, offset + limit);
}
