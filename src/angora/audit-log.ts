import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";

export interface AuditLogRecord {
  auditId: string;
  workspaceId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const FILE = stateFile("audit-logs.json");
function now() { return new Date().toISOString(); }
function id() { return `audit_${crypto.randomBytes(8).toString("hex")}`; }
function load() { return readJsonFile<AuditLogRecord[]>(FILE, []); }
function save(rows: AuditLogRecord[]) { writeJsonFile(FILE, rows.slice(-50000)); }

/** Records a tenant-scoped audit event for security, billing, and support review. */
export function recordAuditLog(input: Omit<AuditLogRecord, "auditId" | "createdAt">) {
  const row: AuditLogRecord = { ...input, auditId: id(), createdAt: now() };
  save([...load(), row]);
  return row;
}

export function listAuditLogs(filter: { workspaceId: string; action?: string; resourceType?: string; limit?: number; offset?: number }) {
  const limit = filter.limit ?? 100; const offset = filter.offset ?? 0;
  const rows = load().filter((row) => row.workspaceId === filter.workspaceId && (!filter.action || row.action === filter.action) && (!filter.resourceType || row.resourceType === filter.resourceType));
  return { rows: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
}
