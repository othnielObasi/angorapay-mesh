import { readJsonFile, stateFile, writeJsonFile } from "../state-dir.js";
import type { AgentTraceEvent, TraceEventType } from "./types.js";
import { agentId, nowIso } from "./util.js";

const TRACE_FILE = stateFile("agent-traces.json");

function load(): AgentTraceEvent[] {
  return readJsonFile<AgentTraceEvent[]>(TRACE_FILE, []);
}

function save(rows: AgentTraceEvent[]) {
  writeJsonFile(TRACE_FILE, rows.slice(-10000));
}

export function addTraceEvent(input: Omit<AgentTraceEvent, "traceId" | "createdAt">): AgentTraceEvent {
  const event: AgentTraceEvent = { ...input, traceId: agentId("trace"), createdAt: nowIso() };
  save([...load(), event]);
  return event;
}

export function listTraceEvents(filter: { workspaceId?: string; conversationId?: string; missionId?: string; eventType?: TraceEventType; limit?: number; offset?: number } = {}) {
  const limit = filter.limit ?? 100;
  const offset = filter.offset ?? 0;
  const rows = load().filter((event) => {
    if (filter.workspaceId && event.workspaceId && event.workspaceId !== filter.workspaceId) return false;
    if (filter.conversationId && event.conversationId !== filter.conversationId) return false;
    if (filter.missionId && event.missionId !== filter.missionId) return false;
    if (filter.eventType && event.eventType !== filter.eventType) return false;
    return true;
  });
  return { rows: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
}
