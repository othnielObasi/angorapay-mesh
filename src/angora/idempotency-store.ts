import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";

const IDEMPOTENCY_FILE = stateFile("idempotency-keys.json");
const DEFAULT_TTL_MS = Number(process.env.ANGORA_IDEMPOTENCY_TTL_MS || 24 * 60 * 60 * 1000);

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  status: "started" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  executionId?: string;
  receiptId?: string;
  httpStatus?: number;
  responseBody?: unknown;
}

function load(): IdempotencyRecord[] {
  const now = Date.now();
  return readJsonFile<IdempotencyRecord[]>(IDEMPOTENCY_FILE, []).filter((record) => Date.parse(record.expiresAt) > now);
}

function save(records: IdempotencyRecord[]) {
  writeJsonFile(IDEMPOTENCY_FILE, records.slice(0, 5000));
}

export function hashRequest(body: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(body ?? null)).digest("hex");
}

export function getIdempotencyRecord(key?: string): IdempotencyRecord | undefined {
  if (!key) return undefined;
  return load().find((record) => record.key === key);
}

export function beginIdempotentRequest(key: string | undefined, body: unknown): { replay?: IdempotencyRecord; conflict?: IdempotencyRecord; started?: IdempotencyRecord } {
  if (!key) return {};
  const records = load();
  const requestHash = hashRequest(body);
  const existing = records.find((record) => record.key === key);
  if (existing && existing.requestHash !== requestHash) return { conflict: existing };
  if (existing && existing.status === "completed") return { replay: existing };
  if (existing && existing.status === "started") return { conflict: existing };
  const now = new Date();
  const started: IdempotencyRecord = {
    key,
    requestHash,
    status: "started",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS).toISOString(),
  };
  records.unshift(started);
  save(records);
  return { started };
}

export function completeIdempotentRequest(key: string | undefined, patch: Partial<IdempotencyRecord>) {
  if (!key) return;
  const records = load();
  const index = records.findIndex((record) => record.key === key);
  if (index < 0) return;
  records[index] = { ...records[index], ...patch, status: patch.status || "completed", updatedAt: new Date().toISOString() };
  save(records);
}

export function listIdempotencyRecords() {
  return load();
}
