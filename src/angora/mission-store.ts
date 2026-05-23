import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { MarketMission, RfpTrack, ServiceCategory } from "./types.js";
import { getRfpArea } from "./rfp-catalog.js";

const MISSIONS_FILE = stateFile("missions.json");

function load(): MarketMission[] {
  return readJsonFile<MarketMission[]>(MISSIONS_FILE, []);
}

function save(missions: MarketMission[]) {
  writeJsonFile(MISSIONS_FILE, missions);
}

function defaultCategories(rfpTrack: RfpTrack | undefined): ServiceCategory[] {
  return getRfpArea(rfpTrack)?.defaultCategories || ["odds", "news", "sentiment", "market_data", "risk", "social", "proof"];
}

export function createMission(input: Partial<Omit<MarketMission, "decisionPolicy">> & { agentId: string; consumerId: string; objective: string; decisionPolicy?: Partial<MarketMission["decisionPolicy"]> }): MarketMission {
  const now = new Date().toISOString();
  const rfpTrack = (input.rfpTrack || "RFP 02 - Prediction Market Trader Intelligence") as RfpTrack;
  const mission: MarketMission = {
    workspaceId: input.workspaceId,
    tenantId: input.tenantId,
    missionId: input.missionId || `mission_${Date.now()}`,
    agentId: input.agentId,
    consumerId: input.consumerId,
    objective: input.objective,
    rfpTrack: rfpTrack,
    asset: input.asset || "BTC",
    marketContext: input.marketContext || "BTC election odds market",
    budget: input.budget || "0.05",
    currency: "USDC",
    allowedCategories: input.allowedCategories || defaultCategories(rfpTrack),
    blockedProviders: input.blockedProviders || ["unknown-alpha"],
    minProviderTrustScore: input.minProviderTrustScore ?? 85,
    requiresReceipts: input.requiresReceipts ?? true,
    requiresReputationUpdate: input.requiresReputationUpdate ?? true,
    maxServicesPerMission: input.maxServicesPerMission ?? 6,
    decisionPolicy: {
      requireRouteScoreAtLeast: input.decisionPolicy?.requireRouteScoreAtLeast ?? 80,
      allowFallbackMode: input.decisionPolicy?.allowFallbackMode ?? true,
      requireArcSettlementReference: input.decisionPolicy?.requireArcSettlementReference ?? true,
      requireOutputHash: input.decisionPolicy?.requireOutputHash ?? true,
    },
    status: input.status || "running",
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
  const missions = load().filter((m) => m.missionId !== mission.missionId);
  missions.unshift(mission);
  save(missions.slice(0, 250));
  return mission;
}

export function getMission(missionId: string): MarketMission | undefined {
  return load().find((mission) => mission.missionId === missionId);
}

export function listMissions(filter: { workspaceId?: string; tenantId?: string } = {}): MarketMission[] {
  return load().filter((mission) => {
    if (filter.workspaceId && mission.workspaceId && mission.workspaceId !== filter.workspaceId) return false;
    if (filter.tenantId && mission.tenantId && mission.tenantId !== filter.tenantId) return false;
    return true;
  });
}

export function ensureDefaultMission(): MarketMission {
  return getMission("mission_prediction_market_001") || createMission({
    missionId: "mission_prediction_market_001",
    agentId: "prediction-agent-01",
    consumerId: "demo-market-builder",
    objective: "Find a positive expected value prediction-market opportunity using odds, news, sentiment, social, and risk checks before any market action.",
    rfpTrack: "RFP 02 - Prediction Market Trader Intelligence",
    asset: "BTC",
    marketContext: "BTC election odds market",
    budget: "0.05",
  });
}
