import crypto from "crypto";
import type { GatewayDecision, MarketMission, ProviderCallResult, RuntimeReceipt } from "./types.js";

function hash(data: unknown): string {
  return `sha256:${crypto.createHash("sha256").update(JSON.stringify(data ?? null)).digest("hex")}`;
}

export function buildAuditArtifact(input: {
  mission: MarketMission;
  decision: GatewayDecision;
  providerResult?: ProviderCallResult;
  receipt?: RuntimeReceipt;
}) {
  const artifact = {
    artifactType: "angora_market_service_call",
    generatedAt: new Date().toISOString(),
    missionId: input.mission.missionId,
    rfpTrack: input.mission.rfpTrack,
    agentId: input.mission.agentId,
    consumerId: input.mission.consumerId,
    marketContext: input.mission.marketContext,
    objective: input.mission.objective,
    selectedProvider: input.decision.selectedService?.providerId || null,
    selectedService: input.decision.selectedService?.serviceId || null,
    blockedProviders: input.decision.blockedCandidates.map((candidate) => ({
      providerId: candidate.service.providerId,
      serviceId: candidate.service.serviceId,
      reason: candidate.reason,
    })),
    policyVerdict: input.decision.reason,
    routeReason: input.decision.routeReason,
    scorecard: input.decision.scorecard,
    paymentRail: input.providerResult?.paymentRail || "Circle/x402",
    circleTool: input.providerResult?.circleTool || "Demo Adapter",
    network: input.providerResult?.arcNetwork || "arc-testnet",
    asset: input.providerResult?.asset || "USDC",
    amountUSDC: input.providerResult?.amountUSDC || input.decision.selectedService?.price || "0",
    settlementStatus: input.providerResult?.settlementStatus || "not_applicable",
    x402Reference: input.providerResult?.x402Reference,
    txHash: input.providerResult?.txHash,
    receiptId: input.receipt?.receiptId,
    outputHash: input.receipt?.outputHash,
  };

  return { ...artifact, artifactHash: hash(artifact) };
}
