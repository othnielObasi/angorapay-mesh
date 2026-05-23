import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { ReputationProfile, ServiceManifest, TrustScorecard } from "./types.js";

const REPUTATION_FILE = stateFile("reputation.json");

function defaultProfile(subjectId: string, subjectType: "agent" | "provider"): ReputationProfile {
  return {
    subjectId,
    subjectType,
    score: subjectType === "provider" ? 80 : 75,
    status: subjectType === "provider" ? "verified" : "new",
    successfulDeliveries: 0,
    failedDeliveries: 0,
    blockedAttempts: 0,
    policyComplianceRate: 1,
    proofCompleteness: 1,
    averageLatencyMs: 0,
    disputeRate: 0,
    updatedAt: new Date().toISOString(),
  };
}

function load(): ReputationProfile[] {
  return readJsonFile<ReputationProfile[]>(REPUTATION_FILE, []);
}

function save(items: ReputationProfile[]) {
  writeJsonFile(REPUTATION_FILE, items);
}

export function getReputation(subjectId: string, subjectType: "agent" | "provider"): ReputationProfile {
  return load().find((profile) => profile.subjectId === subjectId && profile.subjectType === subjectType) || defaultProfile(subjectId, subjectType);
}

export function listReputation(): ReputationProfile[] {
  return load();
}

function persist(profile: ReputationProfile) {
  const items = load().filter((p) => !(p.subjectId === profile.subjectId && p.subjectType === profile.subjectType));
  items.unshift(profile);
  save(items);
}

function providerStatus(score: number): ReputationProfile["status"] {
  if (score >= 96) return "elite_provider";
  if (score >= 90) return "preferred";
  if (score >= 60) return "verified";
  return "watchlisted";
}

export function recordSuccessfulDelivery(input: {
  agentId: string;
  service: ServiceManifest;
  proofComplete: boolean;
  scorecard?: TrustScorecard;
}) {
  const provider = getReputation(input.service.providerId, "provider");
  provider.successfulDeliveries += 1;
  provider.averageLatencyMs = provider.averageLatencyMs
    ? Math.round((provider.averageLatencyMs + input.service.avgLatencyMs) / 2)
    : input.service.avgLatencyMs;
  provider.proofCompleteness = input.proofComplete ? Math.min(1, provider.proofCompleteness + 0.004) : Math.max(0, provider.proofCompleteness - 0.02);
  provider.score = Math.min(100, provider.score + (input.scorecard?.routeScore && input.scorecard.routeScore >= 90 ? 2 : 1));
  provider.status = providerStatus(provider.score);
  provider.updatedAt = new Date().toISOString();
  persist(provider);

  const agent = getReputation(input.agentId, "agent");
  agent.successfulDeliveries += 1;
  agent.score = Math.min(100, agent.score + 1);
  agent.status = agent.score >= 85 ? "trusted_market_agent" : "verified";
  agent.updatedAt = new Date().toISOString();
  persist(agent);

  return { provider, agent };
}

export function recordBlockedAttempt(agentId: string) {
  const agent = getReputation(agentId, "agent");
  agent.blockedAttempts += 1;
  agent.score = Math.max(0, agent.score - 2);
  agent.policyComplianceRate = Math.max(0, agent.policyComplianceRate - 0.02);
  agent.updatedAt = new Date().toISOString();
  persist(agent);
  return agent;
}

export function recordFailedDelivery(input: { agentId: string; service: ServiceManifest }) {
  const provider = getReputation(input.service.providerId, "provider");
  provider.failedDeliveries += 1;
  provider.score = Math.max(0, provider.score - 3);
  provider.status = providerStatus(provider.score);
  provider.updatedAt = new Date().toISOString();
  persist(provider);

  const agent = getReputation(input.agentId, "agent");
  agent.failedDeliveries += 1;
  agent.updatedAt = new Date().toISOString();
  persist(agent);

  return { provider, agent };
}
