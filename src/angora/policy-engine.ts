import type { AngoraGatewayCallRequest, GatewayDecision, MarketMission, ServiceManifest } from "./types.js";
import { buildTrustScorecard, rankServices } from "./trust-scorecard.js";

function blockReason(mission: MarketMission, service: ServiceManifest, request: AngoraGatewayCallRequest): string | null {
  const scorecard = buildTrustScorecard({ mission, service, maxPrice: request.maxPrice });
  if (!mission.allowedCategories.includes(service.category)) return `category_not_allowed:${service.category}`;
  if (mission.blockedProviders.includes(service.providerId)) return `provider_blocked:${service.providerId}`;
  if (service.trustScore < mission.minProviderTrustScore) return `trust_below_threshold:${service.trustScore}`;
  if (scorecard.routeScore < mission.decisionPolicy.requireRouteScoreAtLeast) return `route_score_below_threshold:${scorecard.routeScore}`;
  if (Number(service.price) > Number(request.maxPrice)) return `price_above_request_cap:${service.price}`;
  if (Number(service.price) > Number(mission.budget)) return `price_above_mission_budget:${service.price}`;
  if (mission.requiresReceipts && !service.proofRequired) return "proof_missing";
  return null;
}

export function evaluateAngoraCall(
  mission: MarketMission,
  request: AngoraGatewayCallRequest,
  candidates: ServiceManifest[],
): GatewayDecision {
  const allRanked = rankServices(mission, candidates, request.maxPrice);
  const blockedCandidates: GatewayDecision["blockedCandidates"] = [];
  const eligible = allRanked.filter((service) => {
    const reason = blockReason(mission, service, request);
    if (reason) blockedCandidates.push({ service, reason });
    return !reason;
  });
  const selected = eligible[0];
  const checks: GatewayDecision["policyChecks"] = [];
  const add = (check: string, passed: boolean, detail: string) => checks.push({ check, passed, detail });

  add("mission_exists", Boolean(mission), `Mission ${request.missionId}.`);
  add("agent_matches_mission", mission.agentId === request.agentId, `Mission agent ${mission.agentId}.`);
  add("consumer_matches_mission", mission.consumerId === request.consumerId, `Mission consumer ${mission.consumerId}.`);
  add("category_allowed", mission.allowedCategories.includes(request.category), `Requested category ${request.category}.`);

  if (!selected) {
    add("service_found", false, "No eligible market service found.");
    return {
      allowed: false,
      reason: "No eligible service found",
      routeReason: "No provider satisfied mission policy, price, proof, route-score, and trust constraints.",
      policyChecks: checks,
      candidates: allRanked,
      blockedCandidates,
    };
  }

  const scorecard = buildTrustScorecard({ mission, service: selected, maxPrice: request.maxPrice });
  add("service_found", true, `Selected ${selected.name}.`);
  add("provider_not_blocked", !mission.blockedProviders.includes(selected.providerId), `Provider ${selected.providerId}.`);
  add("provider_trust_ok", selected.trustScore >= mission.minProviderTrustScore, `${selected.trustScore} >= ${mission.minProviderTrustScore}.`);
  add("route_score_ok", scorecard.routeScore >= mission.decisionPolicy.requireRouteScoreAtLeast, `${scorecard.routeScore} >= ${mission.decisionPolicy.requireRouteScoreAtLeast}.`);
  add("price_within_request_max", Number(selected.price) <= Number(request.maxPrice), `${selected.price} <= ${request.maxPrice}.`);
  add("price_within_mission_budget", Number(selected.price) <= Number(mission.budget), `${selected.price} <= ${mission.budget}.`);
  add("receipt_supported", !mission.requiresReceipts || selected.proofRequired, `Proof required=${selected.proofRequired}.`);

  const allowed = checks.every((check) => check.passed);
  return {
    allowed,
    reason: allowed ? "Approved by Angora mission policy gate" : "Blocked by Angora mission policy gate",
    routeReason: allowed
      ? `${selected.name} selected because it has route score ${scorecard.routeScore}, trust ${selected.trustScore}, proof support, and price ${selected.price} USDC within policy.`
      : "The best candidate failed at least one mission policy check.",
    policyChecks: checks,
    selectedService: allowed ? selected : undefined,
    candidates: allRanked,
    blockedCandidates,
    scorecard,
  };
}
