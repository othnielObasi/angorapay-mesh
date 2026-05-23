import { readJsonFile, stateFile, writeJsonFile } from "../state-dir.js";
import type { MissionCheckpoint } from "./types.js";
import { agentId, nowIso } from "./util.js";

const CHECKPOINT_FILE = stateFile("agent-mission-checkpoints.json");

function load(): MissionCheckpoint[] {
  return readJsonFile<MissionCheckpoint[]>(CHECKPOINT_FILE, []);
}

function save(rows: MissionCheckpoint[]) {
  writeJsonFile(CHECKPOINT_FILE, rows.slice(-10000));
}

export function saveCheckpoint(input: Omit<MissionCheckpoint, "checkpointId" | "createdAt">): MissionCheckpoint {
  const checkpoint: MissionCheckpoint = { ...input, checkpointId: agentId("chk"), createdAt: nowIso() };
  save([...load(), checkpoint]);
  return checkpoint;
}

export function listCheckpoints(filter: { workspaceId?: string; conversationId?: string; missionId?: string; limit?: number; offset?: number } = {}) {
  const limit = filter.limit ?? 100;
  const offset = filter.offset ?? 0;
  const rows = load().filter((checkpoint) => {
    if (filter.workspaceId && checkpoint.workspaceId && checkpoint.workspaceId !== filter.workspaceId) return false;
    if (filter.conversationId && checkpoint.conversationId !== filter.conversationId) return false;
    if (filter.missionId && checkpoint.missionId !== filter.missionId) return false;
    return true;
  });
  return { rows: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
}
