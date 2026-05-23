import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { ReconciliationItemRecord, ReconciliationRunRecord } from "./reconciliation-types.js";

const RECONCILIATION_RUNS_FILE = stateFile("reconciliation-runs.json");

function now() {
  return new Date().toISOString();
}

function load() {
  return readJsonFile<ReconciliationRunRecord[]>(RECONCILIATION_RUNS_FILE, []);
}

function save(records: ReconciliationRunRecord[]) {
  writeJsonFile(RECONCILIATION_RUNS_FILE, records.slice(0, 5000));
}

export function createReconciliationRun(input: {
  workspaceId?: string;
  tenantId?: string;
  missionId?: string;
  receiptId?: string;
  items: Omit<ReconciliationItemRecord, "reconciliationItemId" | "reconciliationRunId" | "createdAt">[];
  status?: "completed" | "failed";
}): ReconciliationRunRecord {
  const startedAt = now();
  const reconciliationRunId = `recon_run_${crypto.randomBytes(8).toString("hex")}`;
  const items: ReconciliationItemRecord[] = input.items.map((item) => ({
    reconciliationItemId: `recon_item_${crypto.randomBytes(8).toString("hex")}`,
    reconciliationRunId,
    createdAt: now(),
    ...item,
  }));

  const record: ReconciliationRunRecord = {
    reconciliationRunId,
    workspaceId: input.workspaceId,
    tenantId: input.tenantId,
    missionId: input.missionId,
    receiptId: input.receiptId,
    status: input.status || "completed",
    checked: items.length,
    matched: items.filter((item) => item.status === "matched").length,
    pending: items.filter((item) => item.status.startsWith("pending") || item.status === "fallback").length,
    failed: items.filter((item) => item.status === "failed" || item.status.endsWith("mismatch") || item.status === "receipt_missing" || item.status === "duplicate_payment").length,
    manualReviewRequired: items.filter((item) => item.status === "manual_review_required" || Boolean(item.actionRequired)).length,
    startedAt,
    completedAt: now(),
    items,
  };

  const records = load();
  records.unshift(record);
  save(records);
  return record;
}

export function listReconciliationRuns(filter: { missionId?: string; receiptId?: string; limit?: number; offset?: number } = {}) {
  const limit = Math.min(Math.max(Number(filter.limit || 1000), 1), 2000);
  const offset = Math.max(Number(filter.offset || 0), 0);
  return load().filter((record) => {
    if (filter.missionId && record.missionId !== filter.missionId) return false;
    if (filter.receiptId && record.receiptId !== filter.receiptId) return false;
    return true;
  }).slice(offset, offset + limit);
}
