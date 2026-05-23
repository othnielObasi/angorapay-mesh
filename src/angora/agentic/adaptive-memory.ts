import { listExecutionHistoryPage } from "../execution-history.js";
import { listReputation } from "../reputation-engine.js";
import type { AgentMissionType, RetrievedMemoryItem } from "./types.js";

export function retrieveAdaptiveMemory(input: { userGoal: string; module: AgentMissionType; workspaceId?: string }): RetrievedMemoryItem[] {
  const reputation = listReputation().slice(0, 8).map((profile): RetrievedMemoryItem => ({
    id: `provider:${profile.subjectId}`,
    type: "provider_reliability",
    summary: `${profile.subjectId} has ${profile.status} status, ${profile.successfulDeliveries} successful deliveries, ${profile.blockedAttempts} blocked attempts, and ${profile.proofCompleteness}% proof completeness.`,
    relevance: Math.min(0.95, Math.max(0.4, profile.score / 100)),
    metadata: profile as unknown as Record<string, unknown>,
  }));

  const history = listExecutionHistoryPage({ workspaceId: input.workspaceId, limit: 8, offset: 0 }).items.map((record): RetrievedMemoryItem => ({
    id: `execution:${record.id}`,
    type: record.status === "blocked" ? "blocked_provider" : "similar_mission",
    summary: `${record.status} ${record.category} call for ${record.providerId || "unknown provider"} on mission ${record.missionId}.`,
    relevance: record.status === "blocked" ? 0.82 : 0.68,
    metadata: record as unknown as Record<string, unknown>,
  }));

  return [...reputation, ...history]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10);
}
