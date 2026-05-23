import type { MarketMission, ServiceManifest, TrustScorecard } from "./types.js";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildTrustScorecard(input: {
  mission: MarketMission;
  service: ServiceManifest;
  maxPrice: string;
  proofComplete?: boolean;
  deliveryOk?: boolean;
}): TrustScorecard {
  const price = Number(input.service.price || 0);
  const maxPrice = Number(input.maxPrice || input.mission.budget || 0.01);
  const budget = Number(input.mission.budget || maxPrice || 0.01);
  const withinRequest = price <= maxPrice;
  const withinMissionBudget = price <= budget;
  const categoryAllowed = input.mission.allowedCategories.includes(input.service.category);
  const providerAllowed = !input.mission.blockedProviders.includes(input.service.providerId);
  const trustOk = input.service.trustScore >= input.mission.minProviderTrustScore;
  const proofOk = !input.mission.requiresReceipts || input.service.proofRequired || input.proofComplete === true;

  const policyCompliance = clamp(
    (categoryAllowed ? 25 : 0) +
      (providerAllowed ? 25 : 0) +
      (trustOk ? 25 : 0) +
      (proofOk ? 25 : 0),
  );

  const costDiscipline = clamp((withinRequest ? 50 : 0) + (withinMissionBudget ? 35 : 0) + Math.max(0, 15 - price * 100));
  const proofCompleteness = clamp(proofOk ? 100 : input.service.proofRequired ? 75 : 30);
  const deliveryQuality = clamp((input.deliveryOk === false ? 45 : 80) + Math.min(20, input.service.trustScore / 5));
  const routeScore = clamp(policyCompliance * 0.35 + costDiscipline * 0.2 + proofCompleteness * 0.25 + deliveryQuality * 0.2);

  const explanation = [
    `Provider trust ${input.service.trustScore} against threshold ${input.mission.minProviderTrustScore}`,
    `Price ${input.service.price} USDC against request cap ${input.maxPrice} and mission budget ${input.mission.budget}`,
    `Proof required=${input.mission.requiresReceipts}; provider proof=${input.service.proofRequired}`,
    `Category ${input.service.category} ${categoryAllowed ? "matches" : "does not match"} mission scope`,
  ];

  return { policyCompliance, costDiscipline, proofCompleteness, deliveryQuality, routeScore, explanation };
}

export function rankServices(mission: MarketMission, services: ServiceManifest[], maxPrice: string): ServiceManifest[] {
  return [...services].sort((a, b) => {
    const scoreA = buildTrustScorecard({ mission, service: a, maxPrice }).routeScore;
    const scoreB = buildTrustScorecard({ mission, service: b, maxPrice }).routeScore;
    return scoreB - scoreA || Number(a.price) - Number(b.price);
  });
}
