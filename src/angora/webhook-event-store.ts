import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { WebhookEventRecord } from "./reconciliation-types.js";

const WEBHOOK_EVENTS_FILE = stateFile("webhook-events.json");

function now() {
  return new Date().toISOString();
}

function load() {
  return readJsonFile<WebhookEventRecord[]>(WEBHOOK_EVENTS_FILE, []);
}

function save(records: WebhookEventRecord[]) {
  writeJsonFile(WEBHOOK_EVENTS_FILE, records.slice(0, 10000));
}

/**
 * Store webhook events idempotently. Payment providers may retry webhook
 * notifications and deliver them out of order, so this store de-duplicates by
 * source + external event id.
 */
export function recordWebhookEvent(input: {
  source: WebhookEventRecord["source"];
  externalEventId?: string;
  paymentReference?: string;
  receiptId?: string;
  missionId?: string;
  raw: Record<string, unknown>;
}): WebhookEventRecord {
  const records = load();
  const externalEventId = input.externalEventId || String(input.raw.id || input.raw.eventId || input.raw.notificationId || crypto.createHash("sha256").update(JSON.stringify(input.raw)).digest("hex"));
  const existing = records.find((record) => record.source === input.source && record.externalEventId === externalEventId);
  if (existing) {
    const duplicate: WebhookEventRecord = { ...existing, webhookEventId: `wh_dup_${crypto.randomBytes(8).toString("hex")}`, duplicate: true, processed: true, createdAt: now(), processedAt: now() };
    records.unshift(duplicate);
    save(records);
    return duplicate;
  }

  const record: WebhookEventRecord = {
    webhookEventId: `wh_${crypto.randomBytes(8).toString("hex")}`,
    source: input.source,
    externalEventId,
    paymentReference: input.paymentReference,
    receiptId: input.receiptId,
    missionId: input.missionId,
    processed: false,
    duplicate: false,
    raw: input.raw,
    createdAt: now(),
  };
  records.unshift(record);
  save(records);
  return record;
}

export function markWebhookProcessed(webhookEventId: string): WebhookEventRecord | undefined {
  const records = load();
  const index = records.findIndex((record) => record.webhookEventId === webhookEventId);
  if (index < 0) return undefined;
  records[index] = { ...records[index], processed: true, processedAt: now() };
  save(records);
  return records[index];
}

export function listWebhookEvents(filter: { source?: string; processed?: boolean; duplicate?: boolean; limit?: number; offset?: number } = {}) {
  const limit = Math.min(Math.max(Number(filter.limit || 1000), 1), 2000);
  const offset = Math.max(Number(filter.offset || 0), 0);
  return load().filter((record) => {
    if (filter.source && record.source !== filter.source) return false;
    if (typeof filter.processed === "boolean" && record.processed !== filter.processed) return false;
    if (typeof filter.duplicate === "boolean" && record.duplicate !== filter.duplicate) return false;
    return true;
  }).slice(offset, offset + limit);
}
