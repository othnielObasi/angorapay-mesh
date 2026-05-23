import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { ExecutionHistoryRecord, ServiceCategory } from "./types.js";

const EXECUTION_FILE = stateFile("execution-history.json");

export interface ExecutionHistoryFilter {
  workspaceId?: string;
  tenantId?: string;
  missionId?: string;
  status?: string;
  agentId?: string;
  providerId?: string;
  category?: ServiceCategory;
  executionMode?: string;
  q?: string;
  from?: string;
  to?: string;
}

export interface ExecutionHistoryPage extends ExecutionHistoryFilter {
  limit?: number;
  offset?: number;
}

function load(): ExecutionHistoryRecord[] {
  return readJsonFile<ExecutionHistoryRecord[]>(EXECUTION_FILE, []);
}

function save(records: ExecutionHistoryRecord[]) {
  writeJsonFile(EXECUTION_FILE, records);
}

function applyFilter(records: ExecutionHistoryRecord[], filter: ExecutionHistoryFilter = {}) {
  const query = filter.q?.toLowerCase();
  const fromTs = filter.from ? Date.parse(filter.from) : undefined;
  const toTs = filter.to ? Date.parse(filter.to) : undefined;
  return records.filter((record) => {
    if (filter.workspaceId && record.workspaceId !== filter.workspaceId) return false;
    if (filter.tenantId && record.tenantId !== filter.tenantId) return false;
    if (filter.missionId && record.missionId !== filter.missionId) return false;
    if (filter.status && record.status !== filter.status) return false;
    if (filter.agentId && record.agentId !== filter.agentId) return false;
    if (filter.providerId && record.providerId !== filter.providerId) return false;
    if (filter.category && record.category !== filter.category) return false;
    if (filter.executionMode && record.executionMode !== filter.executionMode) return false;
    if (fromTs && Date.parse(record.timestamp) < fromTs) return false;
    if (toTs && Date.parse(record.timestamp) > toTs) return false;
    if (query) {
      const haystack = [record.id, record.missionId, record.agentId, record.consumerId, record.providerId, record.serviceId, record.serviceName, record.receiptId, record.x402Reference, record.routeReason, record.policyVerdict].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function addExecutionRecord(record: ExecutionHistoryRecord): ExecutionHistoryRecord {
  const records = load();
  if (record.idempotencyKey) {
    const existing = records.find((item) => item.idempotencyKey === record.idempotencyKey);
    if (existing) return existing;
  }
  records.unshift(record);
  save(records.slice(0, 5000));
  return record;
}

export function updateExecutionRecord(id: string, patch: Partial<ExecutionHistoryRecord>): ExecutionHistoryRecord | undefined {
  const records = load();
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) return undefined;
  records[index] = { ...records[index], ...patch };
  save(records);
  return records[index];
}

export function listExecutionHistory(filter: ExecutionHistoryFilter = {}): ExecutionHistoryRecord[] {
  return applyFilter(load(), filter);
}

export function listExecutionHistoryPage(filter: ExecutionHistoryPage = {}) {
  const limit = Math.min(Math.max(Number(filter.limit || 50), 1), 200);
  const offset = Math.max(Number(filter.offset || 0), 0);
  const filtered = applyFilter(load(), filter);
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
    nextOffset: offset + limit < filtered.length ? offset + limit : null,
  };
}

export function findByIdempotencyKey(idempotencyKey?: string): ExecutionHistoryRecord | undefined {
  if (!idempotencyKey) return undefined;
  return load().find((record) => record.idempotencyKey === idempotencyKey);
}

export function executionSummary() {
  const records = load();
  const spend = records
    .filter((record) => !["blocked", "failed"].includes(record.status))
    .reduce((sum, record) => sum + Number(record.amountUSDC || 0), 0);
  return {
    totalExecutions: records.length,
    delivered: records.filter((record) => record.status === "delivered").length,
    settled: records.filter((record) => record.status === "settled").length,
    blocked: records.filter((record) => record.status === "blocked").length,
    failed: records.filter((record) => record.status === "failed").length,
    realX402: records.filter((record) => record.executionMode === "real_x402").length,
    arcTestnet: records.filter((record) => record.executionMode === "arc_testnet").length,
    fallback: records.filter((record) => record.executionMode === "demo_fallback").length,
    totalVolumeUSDC: spend.toFixed(6),
    recent: records.slice(0, 20),
  };
}
