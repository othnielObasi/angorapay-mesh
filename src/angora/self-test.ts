import assert from "assert";
import { evaluateAngoraCall } from "./policy-engine.js";
import { ensureDefaultMission } from "./mission-store.js";
import { searchServices, categoriesForRfp } from "./service-registry.js";
import { buildTrustScorecard } from "./trust-scorecard.js";
import { getSubmissionMetrics } from "./submission-metrics.js";
import { RFP_AREAS } from "./rfp-catalog.js";
import { simulateRoutePlan } from "./route-simulator.js";
import { recordUserSession, recordFeedback, tractionSummary } from "./traction-store.js";
import { gatewayCallSchema } from "./schemas.js";
import { beginIdempotentRequest, completeIdempotentRequest, getIdempotencyRecord } from "./idempotency-store.js";
import { checkRateLimit } from "./rate-limiter.js";
import { addExecutionRecord, listExecutionHistoryPage } from "./execution-history.js";
import { reconcileSettlementStates } from "./settlement-reconciler.js";
import { issueAngoraApiKey, listAngoraApiKeys, revokeAngoraApiKey } from "./auth-manager.js";
import { angoraStateDir } from "./state-dir.js";
import { runAgentMission } from "./agentic/agent-mission-service.js";
import { listConversations, listConversationMessages } from "./agentic/conversation-store.js";
import { listTraceEvents } from "./agentic/trace-store.js";
import { listCheckpoints } from "./agentic/checkpoint-store.js";
import { listPaymentIntents, listPaymentEvents } from "./payment-ledger.js";
import { listProviderDeliveries } from "./provider-delivery-store.js";
import { runProductionReconciliation } from "./reconciliation-service.js";
import { listReconciliationRuns } from "./reconciliation-ledger.js";
import { addWorkspaceMember, createWorkspace, getWorkspaceBudget, getWorkspacePolicy, listWorkspaceMembers, listWorkspaces, updateWorkspacePolicy, upsertWorkspaceProviderAccess, listWorkspaceProviderAccess } from "./workspace-store.js";
import { listAuditLogs, recordAuditLog } from "./audit-log.js";
import { registerProviderService, validateProviderService } from "./service-registry.js";

async function main() {


  const workspace = createWorkspace({ name: "Self Test Workspace", createdBy: "self-test-owner", tenantId: "self-test-tenant-root" });
  assert.ok(workspace.workspaceId.startsWith("ws_"), "workspace creation should return a workspace ID");
  addWorkspaceMember({ workspaceId: workspace.workspaceId, userId: "self-test-builder", role: "builder" });
  assert.ok(listWorkspaceMembers(workspace.workspaceId).length >= 2, "workspace should persist members and owner");
  const policy = updateWorkspacePolicy(workspace.workspaceId, { minProviderTrustScore: 82, blockedProviders: ["unknown-alpha"] });
  assert.equal(policy.minProviderTrustScore, 82, "workspace policy should be updateable");
  assert.ok(getWorkspacePolicy(workspace.workspaceId).blockedProviders.includes("unknown-alpha"), "workspace policy should persist blocked providers");
  assert.ok(Number(getWorkspaceBudget(workspace.workspaceId).dailyLimitUSDC) > 0, "workspace budget should exist");
  upsertWorkspaceProviderAccess({ workspaceId: workspace.workspaceId, providerId: "oddsnode", status: "preferred", reason: "self-test" });
  assert.ok(listWorkspaceProviderAccess(workspace.workspaceId).some((row) => row.providerId === "oddsnode"), "workspace provider access should persist");
  recordAuditLog({ workspaceId: workspace.workspaceId, actorId: "self-test-owner", action: "self_test.completed", resourceType: "workspace", resourceId: workspace.workspaceId, metadata: {} });
  assert.ok(listAuditLogs({ workspaceId: workspace.workspaceId }).rows.length >= 1, "audit logs should be workspace scoped");
  assert.ok(listWorkspaces({ subjectId: "self-test-owner" }).rows.some((row) => row.workspaceId === workspace.workspaceId), "owner should list their workspace");
  const customService = registerProviderService({
    serviceId: `self-test-service-${Date.now()}`,
    providerId: "self-test-provider",
    name: "Self Test Provider Service",
    category: "odds",
    description: "Self-test registered paid market intelligence service.",
    price: "0.001",
    currency: "USDC",
    x402Url: "mock://self-test/provider",
    proofRequired: true,
    verified: false,
    trustScore: 86,
    avgLatencyMs: 300,
    policyTags: ["self_test"],
    rfpTracks: ["RFP 02 - Prediction Market Trader Intelligence"],
    inputSchema: {},
    outputSchema: {},
  });
  assert.equal(validateProviderService(customService).ok, true, "registered provider service should validate");

  const mission = ensureDefaultMission();
  assert.equal(mission.rfpTrack, "RFP 02 - Prediction Market Trader Intelligence", "default mission should align to RFP 02");
  assert.ok(RFP_AREAS.length === 6, "all six Angora RFP areas should be represented");
  assert.ok(categoriesForRfp("RFP 05 - Cross-Platform Arbitrage Agent").includes("arbitrage"), "RFP 05 should map to arbitrage category");

  const odds = searchServices({ category: "odds", maxPrice: "0.01", requireVerified: false, minTrustScore: 0 });
  assert.ok(odds.length >= 1, "expected at least one odds service");

  const decision = evaluateAngoraCall(
    mission,
    {
      missionId: mission.missionId,
      agentId: mission.agentId,
      consumerId: mission.consumerId,
      intent: "Evaluate prediction market odds",
      category: "odds",
      maxPrice: "0.01",
      payload: { market: mission.marketContext },
    },
    odds,
  );

  assert.equal(decision.allowed, true, "odds service should be allowed by default mission");
  assert.ok(decision.scorecard && decision.scorecard.routeScore >= 80, "allowed route should have strong route score");

  const blocked = evaluateAngoraCall(
    mission,
    {
      missionId: mission.missionId,
      agentId: mission.agentId,
      consumerId: mission.consumerId,
      intent: "Use unverified alpha",
      category: "research",
      maxPrice: "0.01",
      payload: { market: mission.marketContext },
    },
    searchServices({ category: "research", maxPrice: "0.01", requireVerified: false, minTrustScore: 0 }),
  );
  assert.equal(blocked.allowed, false, "unverified alpha should be blocked by default mission");

  const score = buildTrustScorecard({ mission, service: odds[0], maxPrice: "0.01" });
  assert.ok(score.policyCompliance >= 75, "scorecard should include policy compliance");

  const simulation = simulateRoutePlan(mission, "0.01");
  assert.ok(simulation.steps.length >= 4, "route simulation should produce a multi-service plan");
  assert.ok(Number(simulation.totalEstimatedSpendUSDC) > 0, "route simulation should estimate spend");

  const user = recordUserSession({ userId: "self-test-user", source: "manual" });
  recordFeedback({ userId: user.userId, missionId: mission.missionId, rating: 5, comment: "self-test feedback" });
  const traction = tractionSummary();
  assert.ok(traction.usersOnboarded >= 1, "traction should include at least one user session after test record");

  const metrics = getSubmissionMetrics();
  assert.equal(metrics.product, "AngoraPay Mesh for Angora market agents", "metrics should expose product positioning");
  assert.ok(metrics.rfpCoverage.length === 6, "metrics should expose RFP coverage");
  assert.ok(metrics.usersOnboarded >= 1, "metrics should include traction users");



  const agenticResult = await runAgentMission({
    workspaceId: "self-test-workspace",
    tenantId: "self-test-tenant",
    userId: "self-test-agent-user",
    userGoal: "Evaluate whether this BTC prediction market is mispriced after a breaking news shift.",
    module: "prediction_market",
    paymentMode: "demo_fallback",
  });
  assert.equal(agenticResult.specialistAgent, "prediction_market", "agentic mission should use prediction market specialist");
  assert.ok(agenticResult.receipts.length >= 1, "agentic mission should create receipts");
  assert.ok(agenticResult.traces.length >= 5, "agentic mission should create traces");
  assert.ok(agenticResult.checkpoints.length >= 5, "agentic mission should create checkpoints");
  assert.ok(listConversations({ workspaceId: "self-test-workspace" }).rows.length >= 1, "conversation history should persist agent missions");
  assert.ok(listConversationMessages(agenticResult.conversation.conversationId).length >= 2, "conversation messages should include user and assistant turns");
  assert.ok(listTraceEvents({ missionId: agenticResult.missionId }).rows.length >= 5, "trace store should return mission traces");
  assert.ok(listCheckpoints({ missionId: agenticResult.missionId }).rows.length >= 5, "checkpoint store should return mission checkpoints");
  assert.ok(listPaymentIntents({ missionId: agenticResult.missionId }).length >= 1, "agentic mission should create payment intents");
  assert.ok(listPaymentEvents({ missionId: agenticResult.missionId }).length >= 1, "agentic mission should create payment events");
  assert.ok(listProviderDeliveries({ missionId: agenticResult.missionId }).length >= 1, "agentic mission should create provider delivery records");
  const productionReconciliation = runProductionReconciliation({ missionId: agenticResult.missionId });
  assert.ok(productionReconciliation.checked >= agenticResult.receipts.length, "production reconciliation should check mission receipts");
  assert.ok(listReconciliationRuns({ missionId: agenticResult.missionId }).length >= 1, "reconciliation runs should be persisted");

  console.log("Angora integration self-tests passed");


  const validGatewayPayload = {
    missionId: mission.missionId,
    agentId: mission.agentId,
    consumerId: mission.consumerId,
    intent: "Evaluate prediction market odds with proof",
    category: "odds",
    maxPrice: "0.01",
    payload: { market: mission.marketContext },
    idempotencyKey: "self-test-idempotency-key",
  };
  assert.equal(gatewayCallSchema.safeParse(validGatewayPayload).success, true, "gateway schema should accept valid market-agent payload");
  assert.equal(gatewayCallSchema.safeParse({ ...validGatewayPayload, maxPrice: "free" }).success, false, "gateway schema should reject invalid price strings");

  const idemStart = beginIdempotentRequest("self-test-idempotency-key-2", validGatewayPayload);
  assert.ok(idemStart.started || idemStart.replay || idemStart.conflict, "idempotency store should return a state");
  completeIdempotentRequest("self-test-idempotency-key-2", { status: "completed", httpStatus: 200, responseBody: { ok: true } });
  assert.ok(getIdempotencyRecord("self-test-idempotency-key-2"), "idempotency record should be persisted without SQLite");

  const rate = checkRateLimit("self-test-rate-key", { windowMs: 1000, max: 10 });
  assert.equal(rate.allowed, true, "rate limiter should allow first request");

  addExecutionRecord({
    id: "self-test-exec",
    timestamp: new Date().toISOString(),
    missionId: mission.missionId,
    agentId: mission.agentId,
    consumerId: mission.consumerId,
    serviceId: "self-test-service",
    serviceName: "Self Test Odds",
    providerId: "self-test-provider",
    category: "odds",
    amountUSDC: "0.001",
    routeScore: 95,
    status: "delivered",
    paymentRail: "Circle/x402",
    circleTool: "Demo Adapter",
    arcNetwork: "arc-testnet",
    executionMode: "demo_fallback",
    policyVerdict: "approved",
    routeReason: "self-test route",
  });
  const page = listExecutionHistoryPage({ missionId: mission.missionId, limit: 5, offset: 0 });
  assert.ok(page.items.length >= 1, "execution history pagination should return records");
  assert.ok(typeof page.total === "number", "execution history pagination should include total");

  const reconciliation = await reconcileSettlementStates();
  assert.ok(typeof reconciliation.checked === "number", "settlement reconciler should return a result object");

  const issuedKey = issueAngoraApiKey({ label: "self-test-key", workspaceId: "self-test-workspace", scopes: ["gateway:call", "metrics:read"] });
  assert.ok(issuedKey.apiKey.startsWith(process.env.ANGORA_API_KEY_PREFIX || "ag_live"), "issued key should return raw token once");
  assert.ok(listAngoraApiKeys("self-test-workspace").some((key) => key.keyId === issuedKey.key.keyId), "hashed API key metadata should be persisted");
  assert.ok(revokeAngoraApiKey(issuedKey.key.keyId), "API key should be revocable");
  assert.ok(angoraStateDir().includes(process.env.KAIROS_DATA_DIR ? "angora" : ".kairos-angora"), "state dir should support Kairos persistent data dir");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
