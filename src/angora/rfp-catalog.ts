import type { RfpArea } from "./types.js";

export const RFP_AREAS: RfpArea[] = [
  {
    id: "RFP 01 - Perpetual Futures Trading Agent",
    title: "Perpetual Futures Trading Agent",
    fit: "supporting",
    defaultCategories: ["perps", "market_data", "risk", "proof"],
    demoMission: "Buy paid perps signals, market data, and execution-risk checks before a futures action.",
    adoptionWedge: "Perps agents need paid signals and risk services before executing market-moving actions.",
  },
  {
    id: "RFP 02 - Prediction Market Trader Intelligence",
    title: "Prediction Market Trader Intelligence",
    fit: "direct",
    defaultCategories: ["odds", "news", "sentiment", "risk", "proof"],
    demoMission: "Find a +EV prediction-market opportunity using odds, news, sentiment, and risk checks.",
    adoptionWedge: "Prediction agents need paid intelligence but must prove which signals influenced a trade idea.",
  },
  {
    id: "RFP 03 - Prediction Market Verticals",
    title: "Prediction Market Verticals",
    fit: "direct",
    defaultCategories: ["odds", "news", "sentiment", "creator", "proof"],
    demoMission: "Run a vertical-specific prediction-market research mission for crypto, politics, sports, or AI events.",
    adoptionWedge: "Vertical agents need domain-specific paid feeds with receipts and source accountability.",
  },
  {
    id: "RFP 04 - Adaptive Portfolio Manager",
    title: "Adaptive Portfolio Manager",
    fit: "supporting",
    defaultCategories: ["portfolio", "market_data", "risk", "sentiment", "proof"],
    demoMission: "Buy paid risk and market-data services before a portfolio rebalance recommendation.",
    adoptionWedge: "Portfolio agents need explainable service spend attached to every rebalance rationale.",
  },
  {
    id: "RFP 05 - Cross-Platform Arbitrage Agent",
    title: "Cross-Platform Arbitrage Agent",
    fit: "supporting",
    defaultCategories: ["arbitrage", "market_data", "risk", "proof"],
    demoMission: "Buy cross-venue prices, liquidity, and risk signals before an arbitrage decision.",
    adoptionWedge: "Arbitrage agents need fast paid data without losing traceability of which feed was used.",
  },
  {
    id: "RFP 06 - Social Trading Intelligence",
    title: "Social Trading Intelligence",
    fit: "direct",
    defaultCategories: ["social", "sentiment", "news", "risk", "proof"],
    demoMission: "Buy social trading signals and manipulation-risk checks before following a crowd signal.",
    adoptionWedge: "Social agents need a way to pay for crowd intelligence while filtering low-trust alpha providers.",
  },
];

export function getRfpArea(id: string | undefined): RfpArea | undefined {
  return RFP_AREAS.find((area) => area.id === id);
}
