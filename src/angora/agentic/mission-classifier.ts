import type { AgentMissionType } from "./types.js";
import type { RfpTrack, ServiceCategory } from "../types.js";

export function classifyAgentMission(goal: string, explicit?: AgentMissionType): AgentMissionType {
  if (explicit) return explicit;
  const text = goal.toLowerCase();
  if (/(arbitrage|spread|venue|price gap|slippage|bridge|dex|cex)/.test(text)) return "cross_venue_arbitrage";
  if (/(copy|trader|influencer|social|alpha|signal|follow|leaderboard)/.test(text)) return "social_trading";
  return "prediction_market";
}

export function rfpTrackForModule(module: AgentMissionType): RfpTrack {
  if (module === "cross_venue_arbitrage") return "RFP 05 - Cross-Platform Arbitrage Agent";
  if (module === "social_trading") return "RFP 06 - Social Trading Intelligence";
  return "RFP 02 - Prediction Market Trader Intelligence";
}

export function categoriesForModule(module: AgentMissionType): ServiceCategory[] {
  if (module === "cross_venue_arbitrage") return ["market_data", "arbitrage", "risk", "proof"];
  if (module === "social_trading") return ["social", "sentiment", "risk", "proof"];
  return ["odds", "sentiment", "risk", "proof"];
}

export function agentIdForModule(module: AgentMissionType): string {
  if (module === "cross_venue_arbitrage") return "cross-venue-arbitrage-agent";
  if (module === "social_trading") return "social-trading-intelligence-agent";
  return "prediction-market-intelligence-agent";
}

export function intentsForModule(module: AgentMissionType): Array<{ category: ServiceCategory; intent: string }> {
  if (module === "cross_venue_arbitrage") {
    return [
      { category: "market_data", intent: "Fetch venue pricing and liquidity snapshots for arbitrage validation" },
      { category: "arbitrage", intent: "Evaluate cross-venue spread after fees and routing constraints" },
      { category: "risk", intent: "Estimate execution risk, slippage exposure, and failure probability" },
      { category: "proof", intent: "Generate proof bundle for arbitrage intelligence mission" },
    ];
  }
  if (module === "social_trading") {
    return [
      { category: "social", intent: "Evaluate social or trader signal quality and source credibility" },
      { category: "sentiment", intent: "Fetch market sentiment context around the social trading signal" },
      { category: "risk", intent: "Score copy-trading risk, drawdown exposure, and signal degradation" },
      { category: "proof", intent: "Generate proof bundle for social trading intelligence mission" },
    ];
  }
  return [
    { category: "odds", intent: "Fetch live prediction-market odds and implied probability" },
    { category: "sentiment", intent: "Fetch news and sentiment evidence for the prediction market" },
    { category: "risk", intent: "Check liquidity, volatility, and execution readiness before market action" },
    { category: "proof", intent: "Generate proof bundle for prediction-market intelligence mission" },
  ];
}
