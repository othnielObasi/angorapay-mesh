import crypto from "crypto";
import { addExecutionRecord } from "../execution-history.js";
import { callX402Service } from "../circle-x402-adapter.js";
import { createMission } from "../mission-store.js";
import { evaluateAngoraCall } from "../policy-engine.js";
import { recordBlockedAttempt, recordFailedDelivery, recordSuccessfulDelivery } from "../reputation-engine.js";
import { searchServices } from "../service-registry.js";
import { createAngoraReceipt } from "../receipt-store.js";
import { attachProviderResultToPaymentIntent, createPaymentIntent } from "../payment-ledger.js";
import { recordProviderDelivery } from "../provider-delivery-store.js";
import { evaluateSpendLimit } from "../spend-limits.js";
import type { AngoraGatewayCallRequest, ExecutionHistoryRecord, MarketMission, ServiceCategory, ServiceManifest } from "../types.js";
import { addConversationMessage, createOrGetConversation, updateConversation } from "./conversation-store.js";
import { saveCheckpoint, listCheckpoints } from "./checkpoint-store.js";
import { retrieveAdaptiveMemory } from "./adaptive-memory.js";
import { agentIdForModule, categoriesForModule, classifyAgentMission, intentsForModule, rfpTrackForModule } from "./mission-classifier.js";
import { buildRecommendation } from "./recommendation-engine.js";
import { addTraceEvent, listTraceEvents } from "./trace-store.js";
import type { AgentContextPacket, AgentMissionInput, AgentMissionResult, AgentProviderDecision, AgentTraceEvent, MissionCheckpoint } from "./types.js";
import { agentId, decimalSum, nowIso } from "./util.js";

function makeExecutionRecord(input: {
  request: AngoraGatewayCallRequest;
  status: ExecutionHistoryRecord["status"];
  decision: ReturnType<typeof evaluateAngoraCall>;
  receiptId?: string;
  outputHash?: string;
  providerResult?: Awaited<ReturnType<typeof callX402Service>>;
}): ExecutionHistoryRecord {
  const selected = input.decision.selectedService;
  const providerResult = input.providerResult;
  return {
    workspaceId: input.request.workspaceId,
    tenantId: input.request.tenantId,
    authKeyId: input.request.authKeyId,
    id: agentId("exec"),
    timestamp: nowIso(),
    missionId: input.request.missionId,
    agentId: input.request.agentId,
    consumerId: input.request.consumerId,
    serviceId: selected?.serviceId,
    serviceName: selected?.name,
    providerId: selected?.providerId,
    category: input.request.category,
    amountUSDC: selected?.price || "0",
    routeScore: input.decision.scorecard?.routeScore,
    status: input.status,
    paymentRail: "Circle/x402",
    circleTool: providerResult?.circleTool || "Demo Adapter",
    arcNetwork: providerResult?.arcNetwork || "arc-testnet",
    executionMode: providerResult?.executionMode || (input.status === "blocked" ? "blocked" : "demo_fallback"),
    policyVerdict: input.decision.reason,
    routeReason: input.decision.routeReason,
    receiptId: input.receiptId,
    x402Reference: providerResult?.x402Reference,
    txHash: providerResult?.txHash,
    explorerUrl: providerResult?.explorerUrl,
    outputHash: input.outputHash,
    idempotencyKey: input.request.idempotencyKey,
  };
}

function missionDefaults(module: ReturnType<typeof classifyAgentMission>, input: AgentMissionInput) {
  return {
    rfpTrack: rfpTrackForModule(module),
    allowedCategories: categoriesForModule(module),
    agentId: agentIdForModule(module),
    asset: input.asset || (module === "cross_venue_arbitrage" ? "BTC/USDC" : "BTC"),
    marketContext: input.marketTarget || (module === "social_trading" ? "Trader signal quality and copy-risk analysis" : module === "cross_venue_arbitrage" ? "Cross-venue BTC pricing and liquidity check" : "BTC prediction-market opportunity"),
  };
}

function createCheckpoint(input: {
  context: AgentContextPacket;
  stage: MissionCheckpoint["stage"];
  resumeFrom: string;
  state: Record<string, unknown>;
  status?: MissionCheckpoint["status"];
}) {
  return saveCheckpoint({
    conversationId: input.context.conversationId,
    missionId: input.context.missionId,
    workspaceId: input.context.workspaceId,
    tenantId: input.context.tenantId,
    specialistAgent: input.context.specialistAgent,
    stage: input.stage,
    status: input.status || "recoverable",
    resumeFrom: input.resumeFrom,
    idempotencyKey: `${input.context.missionId}:${input.stage}`,
    state: input.state,
  });
}

function trace(input: {
  context: AgentContextPacket;
  eventType: AgentTraceEvent["eventType"];
  label: string;
  status: AgentTraceEvent["status"];
  agentId?: string;
  providerId?: string;
  serviceId?: string;
  routeScore?: number;
  receiptId?: string;
  executionId?: string;
  details?: Record<string, unknown>;
}) {
  return addTraceEvent({
    conversationId: input.context.conversationId,
    missionId: input.context.missionId,
    eventType: input.eventType,
    label: input.label,
    status: input.status,
    agentId: input.agentId,
    providerId: input.providerId,
    serviceId: input.serviceId,
    routeScore: input.routeScore,
    receiptId: input.receiptId,
    executionId: input.executionId,
    details: input.details || {},
  });
}

function buildContext(input: AgentMissionInput, mission: MarketMission, conversationId: string, module: ReturnType<typeof classifyAgentMission>): AgentContextPacket {
  const memory = retrieveAdaptiveMemory({ userGoal: input.userGoal, module, workspaceId: input.workspaceId });
  return {
    missionId: mission.missionId,
    conversationId,
    workspaceId: input.workspaceId,
    tenantId: input.tenantId,
    authKeyId: input.authKeyId,
    specialistAgent: module,
    userGoal: input.userGoal,
    marketTarget: mission.marketContext,
    budgetUSDC: mission.budget,
    maxPricePerCallUSDC: input.maxPricePerCallUSDC || "0.01",
    requiredCategories: mission.allowedCategories,
    minProviderTrustScore: mission.minProviderTrustScore,
    minRouteScore: mission.decisionPolicy.requireRouteScoreAtLeast,
    proofRequired: mission.requiresReceipts,
    blockedProviders: mission.blockedProviders,
    retrievedMemory: memory,
    payment: {
      rail: "Circle/x402",
      asset: "USDC",
      network: "Arc",
      mode: input.paymentMode || "demo_fallback",
    },
  };
}

async function runProviderCall(input: {
  context: AgentContextPacket;
  mission: MarketMission;
  intent: string;
  category: ServiceCategory;
  agentId: string;
  consumerId: string;
  payload: Record<string, unknown>;
}): Promise<AgentProviderDecision> {
  const request: AngoraGatewayCallRequest = {
    workspaceId: input.context.workspaceId,
    tenantId: input.context.tenantId,
    authKeyId: input.context.authKeyId,
    missionId: input.mission.missionId,
    agentId: input.agentId,
    consumerId: input.consumerId,
    intent: input.intent,
    category: input.category,
    maxPrice: input.context.maxPricePerCallUSDC,
    payload: input.payload,
    idempotencyKey: `${input.context.conversationId}:${input.mission.missionId}:${input.category}:${crypto.createHash("sha1").update(input.intent).digest("hex").slice(0, 10)}`,
  };

  const candidates = searchServices({ category: input.category, maxPrice: request.maxPrice, requireVerified: false, minTrustScore: 0 });
  trace({ context: input.context, eventType: "provider.discovered", label: `Discovered ${candidates.length} ${input.category} provider candidates`, status: "completed", agentId: input.agentId, details: { category: input.category, candidates: candidates.map((service: ServiceManifest) => service.serviceId) } });
  const decision = evaluateAngoraCall(input.mission, request, candidates);
  trace({ context: input.context, eventType: "route.scored", label: decision.routeReason, status: decision.allowed ? "completed" : "blocked", agentId: input.agentId, providerId: decision.selectedService?.providerId, serviceId: decision.selectedService?.serviceId, routeScore: decision.scorecard?.routeScore, details: { decision } });
  trace({ context: input.context, eventType: "policy.evaluated", label: decision.reason, status: decision.allowed ? "completed" : "blocked", agentId: input.agentId, providerId: decision.selectedService?.providerId, serviceId: decision.selectedService?.serviceId, routeScore: decision.scorecard?.routeScore, details: { policyChecks: decision.policyChecks } });

  if (!decision.allowed || !decision.selectedService) {
    recordBlockedAttempt(input.agentId);
    createPaymentIntent({ request, decision, status: "blocked", metadata: { reason: decision.reason, routeReason: decision.routeReason } });
    const execution = addExecutionRecord(makeExecutionRecord({ request, status: "blocked", decision }));
    return {
      category: input.category,
      intent: input.intent,
      status: "blocked",
      amountUSDC: "0",
      routeScore: decision.scorecard?.routeScore,
      scorecard: decision.scorecard,
      policyVerdict: decision.reason,
      routeReason: decision.routeReason,
      execution,
    };
  }

  const spend = evaluateSpendLimit({ mission: input.mission, consumerId: input.consumerId, requestedAmountUSDC: decision.selectedService.price });
  if (!spend.allowed) {
    const blockedDecision = { ...decision, allowed: false, reason: "Mission spend cap exceeded", routeReason: `Projected spend ${spend.projectedSpendUSDC} USDC exceeds mission budget ${spend.budgetUSDC} USDC` };
    recordBlockedAttempt(input.agentId);
    createPaymentIntent({ request, service: decision.selectedService, decision: blockedDecision, status: "blocked", metadata: { spend } });
    const execution = addExecutionRecord(makeExecutionRecord({ request, status: "blocked", decision: blockedDecision }));
    return {
      category: input.category,
      intent: input.intent,
      status: "blocked",
      providerId: decision.selectedService.providerId,
      serviceId: decision.selectedService.serviceId,
      serviceName: decision.selectedService.name,
      amountUSDC: "0",
      routeScore: decision.scorecard?.routeScore,
      scorecard: decision.scorecard,
      policyVerdict: blockedDecision.reason,
      routeReason: blockedDecision.routeReason,
      execution,
    };
  }

  trace({ context: input.context, eventType: "payment.attempted", label: `Authorizing ${decision.selectedService.price} USDC through Circle/x402`, status: "pending", agentId: input.agentId, providerId: decision.selectedService.providerId, serviceId: decision.selectedService.serviceId, routeScore: decision.scorecard?.routeScore, details: { paymentMode: input.context.payment.mode } });
  const paymentIntent = createPaymentIntent({ request, service: decision.selectedService, decision, metadata: { specialistAgent: input.context.specialistAgent } });
  const providerResult = await callX402Service(decision.selectedService, request.payload || {});
  const reputation = providerResult.ok
    ? recordSuccessfulDelivery({ agentId: input.agentId, service: decision.selectedService, proofComplete: decision.selectedService.proofRequired, scorecard: decision.scorecard })
    : recordFailedDelivery({ agentId: input.agentId, service: decision.selectedService });
  const receipt = createAngoraReceipt({ request, service: decision.selectedService, providerResult, decision, policyVerdict: decision.reason, metadata: { reputation, agentic: true, specialistAgent: input.context.specialistAgent, context: input.context, paymentIntentId: paymentIntent.paymentIntentId } });
  attachProviderResultToPaymentIntent({ paymentIntentId: paymentIntent.paymentIntentId, providerResult, receipt });
  recordProviderDelivery({ paymentIntentId: paymentIntent.paymentIntentId, receipt, missionId: input.mission.missionId, providerId: decision.selectedService.providerId, serviceId: decision.selectedService.serviceId, providerResult, proofSupported: decision.selectedService.proofRequired });
  const execution = addExecutionRecord(makeExecutionRecord({ request, status: providerResult.ok ? "delivered" : "failed", decision, receiptId: receipt.receiptId, outputHash: receipt.outputHash, providerResult }));
  trace({ context: input.context, eventType: "receipt.created", label: `Receipt ${receipt.receiptId} created`, status: providerResult.ok ? "completed" : "failed", agentId: input.agentId, providerId: decision.selectedService.providerId, serviceId: decision.selectedService.serviceId, routeScore: decision.scorecard?.routeScore, receiptId: receipt.receiptId, executionId: execution.id, details: { receipt, providerResult } });

  return {
    category: input.category,
    intent: input.intent,
    status: providerResult.ok ? "delivered" : "failed",
    providerId: decision.selectedService.providerId,
    serviceId: decision.selectedService.serviceId,
    serviceName: decision.selectedService.name,
    amountUSDC: decision.selectedService.price,
    routeScore: decision.scorecard?.routeScore,
    scorecard: decision.scorecard,
    policyVerdict: decision.reason,
    routeReason: decision.routeReason,
    receipt,
    execution,
    error: providerResult.error,
  };
}

export async function runAgentMission(input: AgentMissionInput): Promise<AgentMissionResult> {
  const module = classifyAgentMission(input.userGoal, input.module);
  const defaults = missionDefaults(module, input);
  const conversation = createOrGetConversation({ conversationId: input.conversationId, workspaceId: input.workspaceId, tenantId: input.tenantId, userId: input.userId, userGoal: input.userGoal });
  addConversationMessage({ conversationId: conversation.conversationId, role: "user", content: input.userGoal, metadata: { module, marketTarget: input.marketTarget || defaults.marketContext } });

  const mission = createMission({
    workspaceId: input.workspaceId,
    tenantId: input.tenantId,
    missionId: `agent_mission_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    agentId: defaults.agentId,
    consumerId: input.userId || "agentic-market-builder",
    objective: input.userGoal,
    rfpTrack: defaults.rfpTrack,
    asset: defaults.asset,
    marketContext: defaults.marketContext,
    budget: input.budgetUSDC || "0.05",
    allowedCategories: categoriesForModule(module),
    blockedProviders: input.blockedProviders || ["greyalpha", "unknown-alpha"],
    minProviderTrustScore: input.minProviderTrustScore ?? 85,
    requiresReceipts: input.proofRequired ?? true,
    requiresReputationUpdate: true,
    maxServicesPerMission: 6,
    decisionPolicy: {
      requireRouteScoreAtLeast: input.minRouteScore ?? 80,
      allowFallbackMode: true,
      requireArcSettlementReference: true,
      requireOutputHash: true,
    },
    status: "running",
  });

  const context = buildContext(input, mission, conversation.conversationId, module);
  createCheckpoint({ context, stage: "mission_created", resumeFrom: "agent_selected", state: { mission }, status: "recoverable" });
  trace({ context, eventType: "mission.created", label: "Mission created", status: "completed", agentId: defaults.agentId, details: { mission } });
  createCheckpoint({ context, stage: "agent_selected", resumeFrom: "context_prepared", state: { specialistAgent: module, agentId: defaults.agentId } });
  trace({ context, eventType: "agent.selected", label: `${defaults.agentId} selected`, status: "completed", agentId: defaults.agentId, details: { module } });
  createCheckpoint({ context, stage: "context_prepared", resumeFrom: "providers_discovered", state: { context } });
  trace({ context, eventType: "context.prepared", label: "Context packet prepared", status: "completed", agentId: defaults.agentId, details: { context } });
  trace({ context, eventType: "memory.retrieved", label: `${context.retrievedMemory.length} memory records retrieved`, status: "completed", agentId: defaults.agentId, details: { memory: context.retrievedMemory } });

  const decisions: AgentProviderDecision[] = [];
  for (const planned of intentsForModule(module)) {
    const decision = await runProviderCall({ context, mission, intent: planned.intent, category: planned.category, agentId: defaults.agentId, consumerId: mission.consumerId, payload: input.payload || { asset: mission.asset, marketContext: mission.marketContext, userGoal: input.userGoal } });
    decisions.push(decision);
  }

  createCheckpoint({ context, stage: "routes_scored", resumeFrom: "policy_evaluated", state: { decisions: decisions.map((decision) => ({ providerId: decision.providerId, routeScore: decision.routeScore, status: decision.status })) } });
  createCheckpoint({ context, stage: "payment_attempted", resumeFrom: "receipt_created", state: { paid: decisions.filter((decision) => decision.status === "delivered").length, blocked: decisions.filter((decision) => decision.status === "blocked").length } });

  const receipts = decisions.map((decision) => decision.receipt).filter((receipt): receipt is NonNullable<typeof receipt> => Boolean(receipt));
  const recommendation = buildRecommendation(module, decisions);
  trace({ context, eventType: "recommendation.generated", label: recommendation.summary, status: "completed", agentId: defaults.agentId, details: { recommendation } });
  createCheckpoint({ context, stage: "recommendation_generated", resumeFrom: "mission_completed", state: { recommendation, receiptIds: receipts.map((receipt) => receipt.receiptId) } });
  trace({ context, eventType: "mission.completed", label: "Agent mission completed", status: "completed", agentId: defaults.agentId, details: { totals: { receipts: receipts.length, decisions: decisions.length } } });
  createCheckpoint({ context, stage: "mission_completed", resumeFrom: "complete", state: { completed: true }, status: "terminal" });

  const traces = listTraceEvents({ conversationId: conversation.conversationId, missionId: mission.missionId, limit: 500 }).rows;
  const checkpoints = listCheckpoints({ conversationId: conversation.conversationId, missionId: mission.missionId, limit: 500 }).rows;
  const totalUSDC = decimalSum(receipts.map((receipt) => receipt.amountUSDC));
  const updatedConversation = updateConversation(conversation.conversationId, {
    status: "completed",
    specialistAgent: module,
    missionId: mission.missionId,
    lastRecommendation: recommendation.summary,
    totalUSDC,
    receiptIds: receipts.map((receipt) => receipt.receiptId),
    traceIds: traces.map((event) => event.traceId),
  }) || conversation;
  addConversationMessage({ conversationId: conversation.conversationId, role: "assistant", content: recommendation.summary, missionId: mission.missionId, receiptIds: receipts.map((receipt) => receipt.receiptId), metadata: { recommendation, decisions } });

  return {
    conversation: updatedConversation,
    missionId: mission.missionId,
    specialistAgent: module,
    rfpTrack: defaults.rfpTrack,
    context,
    decisions,
    recommendation,
    receipts,
    traces,
    checkpoints,
    totals: {
      approvedProviders: decisions.filter((decision) => decision.status === "delivered").length,
      blockedProviders: decisions.filter((decision) => decision.status === "blocked").length,
      receiptsCreated: receipts.length,
      usdcRouted: totalUSDC,
    },
  };
}
