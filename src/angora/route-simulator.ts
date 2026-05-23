import { evaluateAngoraCall } from "./policy-engine.js";
import { getRfpArea } from "./rfp-catalog.js";
import { searchServices } from "./service-registry.js";
import type { MarketMission, RouteSimulation, ServiceCategory } from "./types.js";

function intentForCategory(category: ServiceCategory, mission: MarketMission): string {
  const map: Record<string, string> = {
    odds: `Fetch odds and implied probability for ${mission.marketContext}`,
    news: `Fetch news context for ${mission.marketContext}`,
    sentiment: `Fetch sentiment signal for ${mission.asset}`,
    risk: `Check market and execution risk for ${mission.asset}`,
    market_data: `Fetch cross-venue market data for ${mission.asset}`,
    social: `Evaluate social-trading signal quality for ${mission.asset}`,
    proof: `Generate proof bundle for ${mission.missionId}`,
    perps: `Fetch funding, basis, and liquidation signal for ${mission.asset}`,
    portfolio: `Evaluate adaptive portfolio risk around ${mission.asset}`,
    arbitrage: `Scan cross-platform arbitrage routes for ${mission.asset}`,
    creator: `Create a vertical prediction market research pack for ${mission.marketContext}`,
    research: `Fetch research signal for ${mission.asset}`,
  };
  return map[category] || `Fetch ${category} service for ${mission.marketContext}`;
}

export function simulateRoutePlan(mission: MarketMission, maxPrice = "0.01"): RouteSimulation {
  const rfp = getRfpArea(mission.rfpTrack);
  const categories = rfp?.defaultCategories || mission.allowedCategories;
  const steps = categories.slice(0, mission.maxServicesPerMission).map((category) => {
    const candidates = searchServices({ category, maxPrice, requireVerified: false, minTrustScore: 0 });
    const decision = evaluateAngoraCall(
      mission,
      {
        missionId: mission.missionId,
        agentId: mission.agentId,
        consumerId: mission.consumerId,
        intent: intentForCategory(category, mission),
        category,
        maxPrice,
        payload: { asset: mission.asset, market: mission.marketContext },
      },
      candidates,
    );
    return {
      category,
      intent: intentForCategory(category, mission),
      bestProvider: decision.selectedService?.providerId,
      bestService: decision.selectedService?.name,
      estimatedPriceUSDC: decision.selectedService?.price || "0",
      routeScore: decision.scorecard?.routeScore,
      allowed: decision.allowed,
      reason: decision.routeReason,
    };
  });
  const total = steps.reduce((sum, step) => sum + Number(step.allowed ? step.estimatedPriceUSDC : 0), 0);
  return {
    missionId: mission.missionId,
    rfpTrack: mission.rfpTrack,
    objective: mission.objective,
    totalEstimatedSpendUSDC: total.toFixed(6),
    steps,
    blockedProviderCount: steps.filter((step) => !step.allowed).length,
    summary: `Simulated ${steps.length} paid market-service routes for ${mission.rfpTrack}; estimated approved spend ${total.toFixed(6)} USDC.`,
  };
}
