import crypto from "crypto";
import type express from "express";
import { buildAuditArtifact } from "./artifact-builder.js";
import { authenticateAngoraRequest, issueAngoraApiKey, listAngoraApiKeys, requireAngoraScope, revokeAngoraApiKey, rotateAngoraApiKey, type AngoraAuthContext, type AngoraScope } from "./auth-manager.js";
import { callX402Service } from "./circle-x402-adapter.js";
import { addExecutionRecord, executionSummary, listExecutionHistoryPage } from "./execution-history.js";
import { beginIdempotentRequest, completeIdempotentRequest } from "./idempotency-store.js";
import { attachProviderResultToPaymentIntent, createPaymentIntent, listPaymentEvents, listPaymentIntents, addPaymentEvent, updatePaymentIntent } from "./payment-ledger.js";
import { recordProviderDelivery, listProviderDeliveries } from "./provider-delivery-store.js";
import { runProductionReconciliation } from "./reconciliation-service.js";
import { listReconciliationRuns } from "./reconciliation-ledger.js";
import { recordWebhookEvent, markWebhookProcessed, listWebhookEvents } from "./webhook-event-store.js";
import { ensureDefaultMission, createMission, getMission, listMissions } from "./mission-store.js";
import { incrementMetric, getRuntimeMetrics, requestContext, writeStructuredLog } from "./observability.js";
import { evaluateAngoraCall } from "./policy-engine.js";
import { checkRateLimit, rateLimitKey } from "./rate-limiter.js";
import { recordBlockedAttempt, recordFailedDelivery, recordSuccessfulDelivery, listReputation } from "./reputation-engine.js";
import { listServices, registerProviderService, searchServices, validateProviderService } from "./service-registry.js";
import { createAngoraReceipt, getReceipt, listReceipts, summarize } from "./receipt-store.js";
import { reconcileSettlementStates } from "./settlement-reconciler.js";
import { getSubmissionMetrics } from "./submission-metrics.js";
import { evaluateSpendLimit } from "./spend-limits.js";
import { RFP_AREAS } from "./rfp-catalog.js";
import { addWorkspaceMember, createWorkspace, ensureWorkspace, getWorkspace, getWorkspaceBudget, getWorkspacePolicy, listWorkspaceMembers, listWorkspaceProviderAccess, listWorkspaces, updateWorkspace, updateWorkspaceBudget, updateWorkspacePolicy, upsertWorkspaceProviderAccess } from "./workspace-store.js";
import { listAuditLogs, recordAuditLog } from "./audit-log.js";
import { simulateRoutePlan } from "./route-simulator.js";
import { recordFeedback, recordUserSession, tractionSummary } from "./traction-store.js";
import { buildAngoraOpenApiSpec } from "./openapi.js";
import { apiKeyCreateSchema, apiKeyRotateSchema, executionQuerySchema, feedbackSchema, gatewayCallSchema, missionCreateSchema, parseBody, parseQuery, userSessionSchema } from "./schemas.js";
import type { AngoraGatewayCallRequest, ExecutionHistoryRecord, ServiceCategory } from "./types.js";

import { runAgentMission } from "./agentic/agent-mission-service.js";
import { getConversation, listConversationMessages, listConversations } from "./agentic/conversation-store.js";
import { listTraceEvents } from "./agentic/trace-store.js";
import { listCheckpoints } from "./agentic/checkpoint-store.js";
import type { AgentMissionInput, AgentMissionType } from "./agentic/types.js";

type AngoraExpressRequest = express.Request & {
  angoraContext?: ReturnType<typeof requestContext>;
  angoraAuth?: AngoraAuthContext;
};

function getAuthContext(req: express.Request): AngoraAuthContext {
  const existing = (req as AngoraExpressRequest).angoraAuth;
  if (existing) return existing;
  const context = authenticateAngoraRequest(req) || {
    authenticated: false,
    authMode: "disabled" as const,
    keyId: "unauthenticated",
    workspaceId: "unauthenticated",
    tenantId: "unauthenticated",
    subjectId: "unauthenticated",
    scopes: [] as AngoraScope[],
    isAdmin: false,
  };
  (req as AngoraExpressRequest).angoraAuth = context;
  return context;
}

function requireApiKey(req: express.Request, res: express.Response, scope: AngoraScope = "gateway:call") {
  const context = getAuthContext(req);
  if (requireAngoraScope(context, scope)) return true;
  incrementMetric("authFailures");
  writeStructuredLog("auth.failed", { path: req.path, scope, workspaceId: context.workspaceId, keyId: context.keyId });
  res.status(401).json({ error: "Invalid or insufficient Angora API key", requiredScope: scope });
  return false;
}

function enrichRequestWithAuth<T extends object>(req: express.Request, value: T): T & { workspaceId?: string; tenantId?: string; authKeyId?: string } {
  const context = getAuthContext(req);
  const enriched = value as T & { workspaceId?: string; tenantId?: string; authKeyId?: string };
  enriched.workspaceId = context.workspaceId;
  enriched.tenantId = context.tenantId;
  enriched.authKeyId = context.keyId;
  return enriched;
}

function enforceRateLimit(req: express.Request, res: express.Response, scope: string) {
  const limit = checkRateLimit(rateLimitKey(req, scope), {
    max: scope === "gateway" ? Number(process.env.ANGORA_GATEWAY_RATE_LIMIT_MAX || 60) : undefined,
  });
  if (limit.allowed) {
    res.setHeader("x-angora-ratelimit-remaining", String(limit.remaining));
    return true;
  }
  incrementMetric("rateLimited");
  res.setHeader("retry-after", String(Math.ceil(limit.retryAfterMs / 1000)));
  res.status(429).json({ error: "Rate limit exceeded", retryAfterMs: limit.retryAfterMs });
  return false;
}

function configured(...names: string[]) {
  return names.some((name) => Boolean(process.env[name]?.trim()));
}

function buildProductionReadiness() {
  const services = listServices();
  const realProviderCount = services.filter((service) => !service.x402Url.startsWith("mock://")).length;
  const receiptSummary = summarize();
  const execution = executionSummary();
  const reconciliationRuns = listReconciliationRuns({ limit: 1 });
  const authRequired = process.env.ANGORA_REQUIRE_AUTH === "true" && process.env.ANGORA_AUTH_DISABLED !== "true";
  const storageDriver = process.env.ANGORA_STORAGE_DRIVER || "json-file";
  const realX402Enabled = process.env.KAIROS_ENABLE_REAL_X402 === "true";
  const circleSignerConfigured = configured("CIRCLE_API_KEY") && configured("CIRCLE_ENTITY_SECRET") && configured("CIRCLE_WALLET_ID");
  const walletSignerConfigured = circleSignerConfigured || configured("PRIVATE_KEY", "OWS_MNEMONIC", "X402_MNEMONIC");
  const openAiConfigured = configured("OPENAI_API_KEY");
  const hasReceipts = receiptSummary.totalReceipts > 0;
  const hasReconciliation = reconciliationRuns.length > 0;

  const checks = [
    {
      id: "core_workflow",
      label: "Mission routing workflow",
      status: "ready",
      detail: "Mission classification, provider discovery, route scoring, policy checks, provider delivery, receipts, recommendation, and reconciliation routes are implemented.",
    },
    {
      id: "auth",
      label: "Production auth boundary",
      status: authRequired ? "ready" : "attention",
      detail: authRequired ? "API-key auth is required for protected Angora routes." : "Demo mode is passwordless/auth-disabled. Enable ANGORA_REQUIRE_AUTH=true and ANGORA_AUTH_DISABLED=false before real users or spend.",
    },
    {
      id: "storage",
      label: "Durable storage",
      status: storageDriver === "postgres" ? "ready" : "attention",
      detail: storageDriver === "postgres" ? "Postgres storage driver is selected." : `Current storage driver is ${storageDriver}; JSON volume is acceptable for testnet/demo, not enterprise production.`,
    },
    {
      id: "llm",
      label: "LLM reasoning",
      status: openAiConfigured ? "ready" : "attention",
      detail: openAiConfigured ? "OPENAI_API_KEY is configured for LLM mission planning and recommendations." : "No OPENAI_API_KEY detected; deterministic recommendation fallback is active.",
    },
    {
      id: "real_x402",
      label: "Real x402 provider calls",
      status: realX402Enabled && realProviderCount > 0 && walletSignerConfigured ? "ready" : "attention",
      detail: realX402Enabled && realProviderCount > 0 && walletSignerConfigured
        ? `${realProviderCount} non-mock provider endpoint(s) can use the x402 adapter with a configured signer.`
        : `Real x402 requires KAIROS_ENABLE_REAL_X402=true, a signer, and non-mock provider URLs. Current non-mock providers: ${realProviderCount}.`,
    },
    {
      id: "circle_signer",
      label: "Circle/Arc signer",
      status: walletSignerConfigured ? "ready" : "attention",
      detail: circleSignerConfigured ? "Circle Wallet signer variables are configured." : walletSignerConfigured ? "EOA signer variables are configured." : "No Circle Wallet or EOA signer variables detected for real x402/Arc payment paths.",
    },
    {
      id: "receipts",
      label: "Receipt and proof trail",
      status: hasReceipts ? "ready" : "pending",
      detail: hasReceipts ? `${receiptSummary.totalReceipts} receipt(s) recorded with output hashes and reconciliation tags.` : "No receipts recorded yet. Run a mission to create proof artifacts.",
    },
    {
      id: "reconciliation",
      label: "Reconciliation",
      status: hasReconciliation ? "ready" : "pending",
      detail: hasReconciliation ? `Latest reconciliation checked ${reconciliationRuns[0].checked} item(s).` : "No reconciliation run recorded yet.",
    },
  ];

  const productionReady = checks.every((check) => check.status === "ready");
  return {
    target: "Production-grade paid-intelligence routing, payment, trust, and proof layer for market agents",
    currentStage: productionReady ? "production_ready" : "production_testnet_ready",
    productionReady,
    summary: productionReady
      ? "All production gates are ready."
      : "Core product workflow is live, but one or more external production gates still need configuration.",
    runtime: {
      nodeEnv: process.env.NODE_ENV || "development",
      mode: process.env.MODE || "simulation",
      storageDriver,
      authRequired,
      realX402Enabled,
      openAiConfigured,
      circleSignerConfigured,
      walletSignerConfigured,
      providerCount: services.length,
      realProviderCount,
      receiptCount: receiptSummary.totalReceipts,
      executionCount: execution.totalExecutions,
      latestReconciliationRunId: reconciliationRuns[0]?.reconciliationRunId || null,
    },
    checks,
  };
}

function workspaceIdForRequest(req: express.Request) {
  return getAuthContext(req).workspaceId;
}

function ensureRequestWorkspace(req: express.Request) {
  const auth = getAuthContext(req);
  return ensureWorkspace(auth.workspaceId, auth.subjectId);
}

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
    id: `exec_${crypto.randomBytes(8).toString("hex")}`,
    timestamp: new Date().toISOString(),
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

export function registerAngoraRoutes(app: express.Express) {
  app.use("/v1/angora", (req, _res, next) => {
    incrementMetric("requests");
    const ctx = requestContext(req);
    (req as AngoraExpressRequest).angoraContext = ctx;
    const auth = getAuthContext(req);
    writeStructuredLog("request.started", { requestId: ctx.requestId, method: req.method, path: req.path, workspaceId: auth.workspaceId, keyId: auth.keyId });
    next();
  });


  app.get("/v1/angora/health", (_req, res) => res.json({ ok: true, service: "angora", status: "healthy", timestamp: new Date().toISOString() }));
  app.get("/v1/angora/ready", (_req, res) => res.json({ ok: true, storage: process.env.ANGORA_STORAGE_DRIVER || "json-file", stateDir: process.env.ANGORA_STATE_DIR || process.env.KAIROS_ANGORA_STATE_DIR || ".kairos-angora" }));
  app.get("/v1/angora/openapi.json", (_req, res) => res.json(buildAngoraOpenApiSpec()));

  app.post("/v1/angora/workspaces", (req, res) => {
    if (!requireApiKey(req, res, "workspace:write")) return;
    const auth = getAuthContext(req);
    const name = typeof req.body?.name === "string" && req.body.name.trim() ? req.body.name.trim() : undefined;
    if (!name) return res.status(400).json({ error: "workspace name is required" });
    const workspace = createWorkspace({ name, createdBy: auth.subjectId, tenantId: req.body?.tenantId });
    recordAuditLog({ workspaceId: workspace.workspaceId, actorId: auth.subjectId, action: "workspace.created", resourceType: "workspace", resourceId: workspace.workspaceId, metadata: { name } });
    res.status(201).json({ workspace, policy: getWorkspacePolicy(workspace.workspaceId), budget: getWorkspaceBudget(workspace.workspaceId) });
  });

  app.get("/v1/angora/workspaces", (req, res) => {
    if (!requireApiKey(req, res, "workspace:read")) return;
    const auth = getAuthContext(req);
    ensureRequestWorkspace(req);
    res.json({ workspaces: listWorkspaces({ subjectId: auth.subjectId, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.get("/v1/angora/workspaces/current", (req, res) => {
    if (!requireApiKey(req, res, "workspace:read")) return;
    const workspace = ensureRequestWorkspace(req);
    res.json({ workspace, members: listWorkspaceMembers(workspace.workspaceId), policy: getWorkspacePolicy(workspace.workspaceId), budget: getWorkspaceBudget(workspace.workspaceId), providerAccess: listWorkspaceProviderAccess(workspace.workspaceId) });
  });

  app.patch("/v1/angora/workspaces/current", (req, res) => {
    if (!requireApiKey(req, res, "workspace:write")) return;
    const auth = getAuthContext(req);
    ensureRequestWorkspace(req);
    const workspace = updateWorkspace(auth.workspaceId, { name: req.body?.name, slug: req.body?.slug, status: req.body?.status });
    recordAuditLog({ workspaceId: auth.workspaceId, actorId: auth.subjectId, action: "workspace.updated", resourceType: "workspace", resourceId: auth.workspaceId, metadata: req.body || {} });
    res.json({ workspace });
  });

  app.get("/v1/angora/workspaces/current/members", (req, res) => {
    if (!requireApiKey(req, res, "workspace:read")) return;
    const workspace = ensureRequestWorkspace(req);
    res.json({ members: listWorkspaceMembers(workspace.workspaceId) });
  });

  app.post("/v1/angora/workspaces/current/members", (req, res) => {
    if (!requireApiKey(req, res, "workspace:write")) return;
    const auth = getAuthContext(req);
    ensureRequestWorkspace(req);
    if (typeof req.body?.userId !== "string") return res.status(400).json({ error: "userId is required" });
    const member = addWorkspaceMember({ workspaceId: auth.workspaceId, userId: req.body.userId, email: req.body?.email, role: req.body?.role || "viewer", status: req.body?.status || "active" });
    recordAuditLog({ workspaceId: auth.workspaceId, actorId: auth.subjectId, action: "workspace.member.upserted", resourceType: "workspace_member", resourceId: member.memberId, metadata: { userId: member.userId, role: member.role } });
    res.status(201).json({ member });
  });

  app.get("/v1/angora/workspaces/current/policy", (req, res) => {
    if (!requireApiKey(req, res, "policy:read")) return;
    res.json({ policy: getWorkspacePolicy(workspaceIdForRequest(req)) });
  });

  app.patch("/v1/angora/workspaces/current/policy", (req, res) => {
    if (!requireApiKey(req, res, "policy:write")) return;
    const auth = getAuthContext(req);
    const policy = updateWorkspacePolicy(auth.workspaceId, req.body || {});
    recordAuditLog({ workspaceId: auth.workspaceId, actorId: auth.subjectId, action: "workspace.policy.updated", resourceType: "workspace_policy", resourceId: policy.policyId, metadata: req.body || {} });
    res.json({ policy });
  });

  app.get("/v1/angora/workspaces/current/budget", (req, res) => {
    if (!requireApiKey(req, res, "policy:read")) return;
    res.json({ budget: getWorkspaceBudget(workspaceIdForRequest(req)) });
  });

  app.patch("/v1/angora/workspaces/current/budget", (req, res) => {
    if (!requireApiKey(req, res, "policy:write")) return;
    const auth = getAuthContext(req);
    const budget = updateWorkspaceBudget(auth.workspaceId, req.body || {});
    recordAuditLog({ workspaceId: auth.workspaceId, actorId: auth.subjectId, action: "workspace.budget.updated", resourceType: "workspace_budget", resourceId: budget.budgetId, metadata: req.body || {} });
    res.json({ budget });
  });

  app.get("/v1/angora/workspaces/current/provider-access", (req, res) => {
    if (!requireApiKey(req, res, "services:read")) return;
    res.json({ providerAccess: listWorkspaceProviderAccess(workspaceIdForRequest(req)) });
  });

  app.post("/v1/angora/workspaces/current/provider-access", (req, res) => {
    if (!requireApiKey(req, res, "policy:write")) return;
    const auth = getAuthContext(req);
    if (typeof req.body?.providerId !== "string") return res.status(400).json({ error: "providerId is required" });
    const access = upsertWorkspaceProviderAccess({ workspaceId: auth.workspaceId, providerId: req.body.providerId, status: req.body?.status || "allowed", reason: req.body?.reason });
    recordAuditLog({ workspaceId: auth.workspaceId, actorId: auth.subjectId, action: "workspace.provider_access.updated", resourceType: "workspace_provider_access", resourceId: access.accessId, metadata: access as unknown as Record<string, unknown> });
    res.status(201).json({ access });
  });

  app.get("/v1/angora/audit-logs", (req, res) => {
    if (!requireApiKey(req, res, "audit:read")) return;
    res.json({ auditLogs: listAuditLogs({ workspaceId: workspaceIdForRequest(req), action: req.query.action ? String(req.query.action) : undefined, resourceType: req.query.resource_type ? String(req.query.resource_type) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.post("/v1/angora/auth/keys", (req, res) => {
    if (!requireApiKey(req, res, "admin")) return;
    const parsed = parseBody(apiKeyCreateSchema, req.body || {});
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
    const auth = getAuthContext(req);
    const issued = issueAngoraApiKey({
      ...parsed.value,
      workspaceId: parsed.value.workspaceId || auth.workspaceId,
      tenantId: parsed.value.tenantId || auth.tenantId,
    });
    res.status(201).json({ ...issued, warning: "Store apiKey now. It is returned only once." });
  });

  app.get("/v1/angora/auth/keys", (req, res) => {
    if (!requireApiKey(req, res, "admin")) return;
    const auth = getAuthContext(req);
    res.json({ keys: listAngoraApiKeys(auth.workspaceId) });
  });

  app.post("/v1/angora/auth/keys/rotate", (req, res) => {
    if (!requireApiKey(req, res, "admin")) return;
    const parsed = parseBody(apiKeyRotateSchema, req.body || {});
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
    const rotated = rotateAngoraApiKey(parsed.value.keyId);
    if (!rotated) return res.status(404).json({ error: "API key not found or already revoked" });
    res.json({ ...rotated, warning: "Store apiKey now. It is returned only once." });
  });

  app.post("/v1/angora/auth/keys/:keyId/revoke", (req, res) => {
    if (!requireApiKey(req, res, "admin")) return;
    const revoked = revokeAngoraApiKey(req.params.keyId);
    if (!revoked) return res.status(404).json({ error: "API key not found" });
    res.json({ revoked });
  });

  app.post("/v1/angora/missions", (req, res) => {
    if (!requireApiKey(req, res, "missions:write") || !enforceRateLimit(req, res, "missions")) return;
    const parsed = parseBody(missionCreateSchema, req.body || {});
    if (parsed.ok === false) {
      incrementMetric("validationFailures");
      return res.status(400).json({ error: parsed.error, issues: parsed.issues });
    }
    const mission = createMission(enrichRequestWithAuth(req, parsed.value));
    res.json({ mission });
  });

  app.get("/v1/angora/missions", (req, res) => {
    const auth = getAuthContext(req);
    res.json({ missions: listMissions({ workspaceId: auth.workspaceId }), workspaceId: auth.workspaceId });
  });

  app.get("/v1/angora/services/search", (req, res) => {
    const mission = req.query.mission_id ? getMission(String(req.query.mission_id)) : undefined;
    if (req.query.mission_id && !mission) return res.status(404).json({ error: "Mission not found" });
    const services = searchServices({
      category: String(req.query.category || ""),
      maxPrice: String(req.query.max_price || req.query.maxPrice || mission?.budget || "999"),
      requireVerified: String(req.query.require_verified || "true") !== "false",
      minTrustScore: Number(req.query.min_trust || mission?.minProviderTrustScore || 0),
      rfpTrack: req.query.rfp_track ? String(req.query.rfp_track) : undefined,
    });
    const blocked = searchServices({ category: String(req.query.category || ""), maxPrice: "999", requireVerified: false, minTrustScore: 0 }).filter((service) => !services.some((s) => s.serviceId === service.serviceId));
    res.json({ mission: mission || null, services, blocked });
  });

  app.get("/v1/angora/rfps", (_req, res) => {
    res.json({ product: "AngoraPay Mesh", positioning: "Market-agent service discovery, route scoring, Circle/x402 payment, and Arc/USDC proof for Angora RFP tracks.", rfps: RFP_AREAS });
  });

  app.get("/v1/angora/route/simulate", (req, res) => {
    if (!req.query.mission_id) return res.status(400).json({ error: "mission_id is required for route simulation." });
    const mission = getMission(String(req.query.mission_id));
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    res.json({ simulation: simulateRoutePlan(mission, String(req.query.max_price || "0.01")) });
  });

  app.post("/v1/angora/traction/users", (req, res) => {
    if (!requireApiKey(req, res, "traction:write") || !enforceRateLimit(req, res, "traction")) return;
    const parsed = parseBody(userSessionSchema, req.body || {});
    if (parsed.ok === false) {
      incrementMetric("validationFailures");
      return res.status(400).json({ error: parsed.error, issues: parsed.issues });
    }
    const user = recordUserSession(parsed.value);
    res.json({ user, traction: tractionSummary(), metrics: getSubmissionMetrics() });
  });

  app.post("/v1/angora/traction/feedback", (req, res) => {
    if (!requireApiKey(req, res, "traction:write") || !enforceRateLimit(req, res, "traction")) return;
    const parsed = parseBody(feedbackSchema, req.body || {});
    if (parsed.ok === false) {
      incrementMetric("validationFailures");
      return res.status(400).json({ error: parsed.error, issues: parsed.issues });
    }
    const feedback = recordFeedback(parsed.value);
    res.json({ feedback, traction: tractionSummary(), metrics: getSubmissionMetrics() });
  });

  app.get("/v1/angora/traction/summary", (_req, res) => {
    res.json({ traction: tractionSummary(), metrics: getSubmissionMetrics() });
  });

  app.post("/v1/angora/gateway/call", async (req, res) => {
    if (!requireApiKey(req, res, "gateway:call") || !enforceRateLimit(req, res, "gateway")) return;
    incrementMetric("gatewayCalls");
    const parsed = parseBody(gatewayCallSchema, req.body);
    if (parsed.ok === false) {
      incrementMetric("validationFailures");
      return res.status(400).json({ error: parsed.error, issues: parsed.issues });
    }
    const request = enrichRequestWithAuth(req, parsed.value);

    const scopedIdempotencyKey = request.idempotencyKey ? `${request.workspaceId || "default"}:${request.idempotencyKey}` : undefined;
    const idem = beginIdempotentRequest(scopedIdempotencyKey, req.body);
    if (idem.replay) {
      incrementMetric("idempotentReplays");
      return res.status(idem.replay.httpStatus || 200).json({ status: "idempotent_replay", replay: true, executionId: idem.replay.executionId, receiptId: idem.replay.receiptId, response: idem.replay.responseBody });
    }
    if (idem.conflict) return res.status(409).json({ error: "Idempotency key is already in use for a different or in-flight request" });

    const mission = getMission(request.missionId);
    if (!mission) return res.status(404).json({ error: "Mission not found" });

    const candidates = searchServices({ category: request.category, maxPrice: request.maxPrice, requireVerified: false, minTrustScore: 0 });
    const decision = evaluateAngoraCall(mission, request, candidates);
    if (!decision.allowed || !decision.selectedService) {
      incrementMetric("policyBlocks");
      const agentReputation = recordBlockedAttempt(request.agentId);
      createPaymentIntent({ request, decision, status: "blocked", metadata: { source: "gateway.call", reason: decision.reason } });
      const execution = addExecutionRecord(makeExecutionRecord({ request, status: "blocked", decision }));
      const artifact = buildAuditArtifact({ mission, decision });
      const responseBody = { status: "blocked", decision, agentReputation, execution, artifact };
      completeIdempotentRequest(scopedIdempotencyKey, { status: "completed", executionId: execution.id, httpStatus: 403, responseBody });
      return res.status(403).json(responseBody);
    }

    const spendLimit = evaluateSpendLimit({ mission, consumerId: request.consumerId, requestedAmountUSDC: decision.selectedService.price });
    if (!spendLimit.allowed) {
      incrementMetric("policyBlocks");
      const blockedDecision = { ...decision, allowed: false, reason: "Mission spend cap exceeded", routeReason: `Projected spend ${spendLimit.projectedSpendUSDC} USDC exceeds mission budget ${spendLimit.budgetUSDC} USDC` };
      createPaymentIntent({ request, service: decision.selectedService, decision: blockedDecision, status: "blocked", metadata: { source: "gateway.call", spendLimit } });
      const execution = addExecutionRecord(makeExecutionRecord({ request, status: "blocked", decision: blockedDecision }));
      const responseBody = { status: "blocked", decision: blockedDecision, spendLimit, execution };
      completeIdempotentRequest(scopedIdempotencyKey, { status: "completed", executionId: execution.id, httpStatus: 403, responseBody });
      return res.status(403).json(responseBody);
    }

    const paymentIntent = createPaymentIntent({ request, service: decision.selectedService, decision, metadata: { source: "gateway.call" } });
    const providerResult = await callX402Service(decision.selectedService, request.payload || {});
    if (!providerResult.ok) incrementMetric("providerFailures");
    const reputation = providerResult.ok
      ? recordSuccessfulDelivery({ agentId: request.agentId, service: decision.selectedService, proofComplete: decision.selectedService.proofRequired, scorecard: decision.scorecard })
      : recordFailedDelivery({ agentId: request.agentId, service: decision.selectedService });

    const receipt = createAngoraReceipt({ request, service: decision.selectedService, providerResult, decision, policyVerdict: decision.reason, metadata: { policyChecks: decision.policyChecks, intent: request.intent, reputation, spendLimit, candidates: decision.candidates.map((candidate) => candidate.serviceId), paymentIntentId: paymentIntent.paymentIntentId } });
    attachProviderResultToPaymentIntent({ paymentIntentId: paymentIntent.paymentIntentId, providerResult, receipt });
    recordProviderDelivery({ paymentIntentId: paymentIntent.paymentIntentId, receipt, missionId: request.missionId, providerId: decision.selectedService.providerId, serviceId: decision.selectedService.serviceId, providerResult, proofSupported: decision.selectedService.proofRequired });
    incrementMetric("receiptsCreated");
    const execution = addExecutionRecord(makeExecutionRecord({ request, status: providerResult.ok ? "delivered" : "failed", decision, receiptId: receipt.receiptId, outputHash: receipt.outputHash, providerResult }));
    const artifact = buildAuditArtifact({ mission, decision, providerResult, receipt });
    const httpStatus = providerResult.ok ? 200 : 502;
    const responseBody = { status: providerResult.ok ? "delivered" : "failed", decision, providerResult, reputation, receipt, execution, artifact };
    completeIdempotentRequest(scopedIdempotencyKey, { status: "completed", executionId: execution.id, receiptId: receipt.receiptId, httpStatus, responseBody });
    res.status(httpStatus).json(responseBody);
  });

  app.post("/v1/angora/demo/market-mission", async (req, res) => {
    if (!requireApiKey(req, res, "gateway:call") || !enforceRateLimit(req, res, "demo")) return;
    const mission = ensureDefaultMission();
    const basePayload = req.body?.payload || { asset: mission.asset, market: mission.marketContext, timeframe: "1h", horizon: "intraday" };
    const calls: Array<[ServiceCategory, string]> = [["odds", "Fetch prediction-market odds and implied probability"], ["sentiment", "Fetch news and social sentiment signal"], ["risk", "Check volatility and execution readiness"], ["proof", "Generate proof bundle for the market mission"]];
    const results = [];
    for (const [category, intent] of calls) {
      const request: AngoraGatewayCallRequest = enrichRequestWithAuth(req, { missionId: mission.missionId, agentId: mission.agentId, consumerId: mission.consumerId, intent, category, maxPrice: "0.01", payload: basePayload, idempotencyKey: `${mission.missionId}:${category}:${Date.now()}` });
      const candidates = searchServices({ category, maxPrice: request.maxPrice, requireVerified: false, minTrustScore: 0 });
      const decision = evaluateAngoraCall(mission, request, candidates);
      if (!decision.allowed || !decision.selectedService) {
        const execution = addExecutionRecord(makeExecutionRecord({ request, status: "blocked", decision }));
        results.push({ status: "blocked", decision, execution });
        continue;
      }
      const paymentIntent = createPaymentIntent({ request, service: decision.selectedService, decision, metadata: { source: "demo.market-mission" } });
      const providerResult = await callX402Service(decision.selectedService, request.payload || {});
      const reputation = providerResult.ok ? recordSuccessfulDelivery({ agentId: request.agentId, service: decision.selectedService, proofComplete: decision.selectedService.proofRequired, scorecard: decision.scorecard }) : recordFailedDelivery({ agentId: request.agentId, service: decision.selectedService });
      const receipt = createAngoraReceipt({ request, service: decision.selectedService, providerResult, decision, policyVerdict: decision.reason, metadata: { reputation, paymentIntentId: paymentIntent.paymentIntentId } });
      attachProviderResultToPaymentIntent({ paymentIntentId: paymentIntent.paymentIntentId, providerResult, receipt });
      recordProviderDelivery({ paymentIntentId: paymentIntent.paymentIntentId, receipt, missionId: request.missionId, providerId: decision.selectedService.providerId, serviceId: decision.selectedService.serviceId, providerResult, proofSupported: decision.selectedService.proofRequired });
      incrementMetric("receiptsCreated");
      const execution = addExecutionRecord(makeExecutionRecord({ request, status: providerResult.ok ? "delivered" : "failed", decision, receiptId: receipt.receiptId, outputHash: receipt.outputHash, providerResult }));
      results.push({ status: providerResult.ok ? "delivered" : "failed", decision, providerResult, reputation, receipt, execution });
    }
    res.json({ mission, results, metrics: getSubmissionMetrics() });
  });


  app.post("/v1/angora/providers/register", (req, res) => {
    if (!requireApiKey(req, res, "providers:write")) return;
    const auth = getAuthContext(req);
    const service = req.body || {};
    const manifest = {
      serviceId: String(service.serviceId || service.service_id || `custom-${Date.now()}`),
      providerId: String(service.providerId || service.provider_id || "custom-provider"),
      name: String(service.name || service.serviceName || service.service_name || "Custom Market Intelligence Service"),
      category: String(service.category || "research") as ServiceCategory,
      description: String(service.description || "Workspace registered paid market-intelligence service."),
      price: String(service.price || service.priceUSDC || service.price_usdc || "0.001"),
      currency: "USDC" as const,
      x402Url: String(service.x402Url || service.x402_endpoint || service.x402Endpoint || "mock://custom/service"),
      proofRequired: service.proofRequired !== false && service.proof_supported !== false,
      verified: service.verified === true,
      trustScore: Number(service.trustScore || service.trust_score || 75),
      avgLatencyMs: Number(service.avgLatencyMs || service.latency_sla_ms || 500),
      policyTags: Array.isArray(service.policyTags) ? service.policyTags.map(String) : ["custom", "provider_registered"],
      rfpTracks: Array.isArray(service.rfpTracks) ? service.rfpTracks : ["RFP 02 - Prediction Market Trader Intelligence"],
      inputSchema: service.inputSchema && typeof service.inputSchema === "object" ? service.inputSchema : {},
      outputSchema: service.outputSchema && typeof service.outputSchema === "object" ? service.outputSchema : {},
    };
    const validation = validateProviderService(manifest);
    if (!validation.ok) return res.status(400).json({ error: "Provider service validation failed", issues: validation.issues });
    const registered = registerProviderService(manifest);
    recordAuditLog({ workspaceId: auth.workspaceId, actorId: auth.subjectId, action: "provider.service.registered", resourceType: "provider_service", resourceId: registered.serviceId, metadata: { providerId: registered.providerId } });
    res.status(201).json({ service: registered, validation });
  });

  app.post("/v1/angora/providers/:providerId/validate", (req, res) => {
    if (!requireApiKey(req, res, "providers:write")) return;
    const auth = getAuthContext(req);
    const services = searchServices({ requireVerified: false, minTrustScore: 0 }).filter((service) => service.providerId === req.params.providerId);
    const results = services.map((service) => ({ serviceId: service.serviceId, validation: validateProviderService(service) }));
    recordAuditLog({ workspaceId: auth.workspaceId, actorId: auth.subjectId, action: "provider.validated", resourceType: "provider", resourceId: req.params.providerId, metadata: { services: results.length } });
    res.json({ providerId: req.params.providerId, results });
  });

  app.get("/v1/angora/reputation", (_req, res) => res.json({ reputation: listReputation() }));
  app.get("/v1/angora/receipts", (req, res) => res.json({ receipts: listReceipts({ workspaceId: getAuthContext(req).workspaceId, missionId: req.query.mission_id ? String(req.query.mission_id) : undefined, status: req.query.status ? String(req.query.status) : undefined, executionMode: req.query.execution_mode ? String(req.query.execution_mode) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) }));
  app.get("/v1/angora/receipts/:receiptId", (req, res) => {
    const receipt = getReceipt(req.params.receiptId);
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    const auth = getAuthContext(req);
    if (receipt.workspaceId && receipt.workspaceId !== auth.workspaceId) return res.status(404).json({ error: "Receipt not found" });
    res.json({ receipt });
  });
  app.get("/v1/angora/execution-history", (req, res) => {
    const parsed = parseQuery(executionQuerySchema, req.query);
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
    const query = parsed.value;
    res.json({
      execution: listExecutionHistoryPage({ workspaceId: getAuthContext(req).workspaceId, missionId: query.mission_id, status: query.status, agentId: query.agent_id, providerId: query.provider_id, category: query.category, executionMode: query.execution_mode, q: query.q, from: query.from, to: query.to, limit: query.limit, offset: query.offset }),
      summary: executionSummary(),
    });
  });
  app.post("/v1/angora/settlement/reconcile", (req, res) => {
    if (!requireApiKey(req, res, "settlement:write") || !enforceRateLimit(req, res, "settlement")) return;
    reconcileSettlementStates().then((reconciliation) => res.json({ reconciliation, summary: executionSummary(), receipts: summarize() })).catch((error) => res.status(500).json({ error: error instanceof Error ? error.message : String(error) }));
  });

  app.post("/v1/angora/reconciliation/run", (req, res) => {
    if (!requireApiKey(req, res, "settlement:write") || !enforceRateLimit(req, res, "reconciliation")) return;
    const auth = getAuthContext(req);
    const run = runProductionReconciliation({
      workspaceId: auth.workspaceId,
      tenantId: auth.tenantId,
      missionId: req.body?.mission_id || req.body?.missionId,
      receiptId: req.body?.receipt_id || req.body?.receiptId,
    });
    res.json({ reconciliation: run });
  });

  app.get("/v1/angora/reconciliation/runs", (req, res) => {
    if (!requireApiKey(req, res, "settlement:read")) return;
    res.json({ runs: listReconciliationRuns({ missionId: req.query.mission_id ? String(req.query.mission_id) : undefined, receiptId: req.query.receipt_id ? String(req.query.receipt_id) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.get("/v1/angora/payment-intents", (req, res) => {
    if (!requireApiKey(req, res, "settlement:read")) return;
    res.json({ paymentIntents: listPaymentIntents({ workspaceId: getAuthContext(req).workspaceId, missionId: req.query.mission_id ? String(req.query.mission_id) : undefined, receiptId: req.query.receipt_id ? String(req.query.receipt_id) : undefined, status: req.query.status ? String(req.query.status) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.get("/v1/angora/payment-events", (req, res) => {
    if (!requireApiKey(req, res, "settlement:read")) return;
    res.json({ paymentEvents: listPaymentEvents({ missionId: req.query.mission_id ? String(req.query.mission_id) : undefined, receiptId: req.query.receipt_id ? String(req.query.receipt_id) : undefined, paymentIntentId: req.query.payment_intent_id ? String(req.query.payment_intent_id) : undefined, paymentReference: req.query.payment_reference ? String(req.query.payment_reference) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.get("/v1/angora/provider-deliveries", (req, res) => {
    if (!requireApiKey(req, res, "settlement:read")) return;
    res.json({ providerDeliveries: listProviderDeliveries({ missionId: req.query.mission_id ? String(req.query.mission_id) : undefined, receiptId: req.query.receipt_id ? String(req.query.receipt_id) : undefined, providerId: req.query.provider_id ? String(req.query.provider_id) : undefined, status: req.query.status ? String(req.query.status) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.post("/v1/angora/webhooks/payment", (req, res) => {
    const source = req.body?.source === "provider" || req.body?.source === "x402" || req.body?.source === "manual" ? req.body.source : "circle";
    const webhook = recordWebhookEvent({ source, externalEventId: req.body?.id || req.body?.eventId || req.body?.notificationId, paymentReference: req.body?.paymentReference || req.body?.x402Reference, receiptId: req.body?.receiptId, missionId: req.body?.missionId, raw: req.body || {} });
    if (!webhook.duplicate) {
      addPaymentEvent({
        receiptId: webhook.receiptId,
        missionId: webhook.missionId,
        eventType: "webhook_received",
        paymentStatus: req.body?.paymentStatus || "authorized_by_x402",
        settlementStatus: req.body?.settlementStatus || "pending_batch_settlement",
        amountUSDC: req.body?.amountUSDC,
        paymentReference: webhook.paymentReference,
        txHash: req.body?.txHash,
        explorerUrl: req.body?.explorerUrl,
        raw: req.body || {},
      });
      if (req.body?.paymentIntentId && req.body?.settlementStatus === "settled") updatePaymentIntent(String(req.body.paymentIntentId), { status: "settled" });
      markWebhookProcessed(webhook.webhookEventId);
    }
    res.status(webhook.duplicate ? 200 : 202).json({ webhook });
  });

  app.get("/v1/angora/webhooks", (req, res) => {
    if (!requireApiKey(req, res, "settlement:read")) return;
    res.json({ webhooks: listWebhookEvents({ source: req.query.source ? String(req.query.source) : undefined, processed: req.query.processed === undefined ? undefined : String(req.query.processed) === "true", duplicate: req.query.duplicate === undefined ? undefined : String(req.query.duplicate) === "true", limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });
  app.get("/v1/angora/runtime/metrics", (_req, res) => res.json({ runtime: getRuntimeMetrics(), submission: getSubmissionMetrics(), execution: executionSummary() }));
  app.get("/v1/angora/submission/metrics", (_req, res) => res.json({ metrics: getSubmissionMetrics() }));
  app.get("/v1/angora/production/readiness", (req, res) => {
    if (process.env.ANGORA_REQUIRE_AUTH === "true" && !requireApiKey(req, res, "metrics:read")) return;
    res.json({ readiness: buildProductionReadiness() });
  });
  app.get("/v1/angora/dashboard/summary", (_req, res) => {
    const mission = listMissions()[0] || null;
    res.json({ product: "AngoraPay Mesh for Angora market agents", positioning: "Mission-aware trust, routing, and proof layer for market agents using Circle/x402 on Arc", mission, summary: summarize(), execution: executionSummary(), metrics: getSubmissionMetrics(), runtime: getRuntimeMetrics(), readiness: buildProductionReadiness(), traction: tractionSummary(), routeSimulation: mission ? simulateRoutePlan(mission) : null, rfpAreas: RFP_AREAS, reputation: listReputation() });
  });

  app.post("/v1/angora/agent-missions/run", async (req, res) => {
    if (!requireApiKey(req, res, "gateway:call") || !enforceRateLimit(req, res, "agent-missions")) return;
    const body = req.body || {};
    if (typeof body.userGoal !== "string" || body.userGoal.trim().length < 8) {
      return res.status(400).json({ error: "userGoal is required and must describe the market-intelligence mission." });
    }
    const allowedModules = new Set(["prediction_market", "cross_venue_arbitrage", "social_trading"]);
    if (body.module && !allowedModules.has(String(body.module))) {
      return res.status(400).json({ error: "module must be prediction_market, cross_venue_arbitrage, or social_trading." });
    }
    try {
      const auth = getAuthContext(req);
      const input: AgentMissionInput = {
        workspaceId: auth.workspaceId,
        tenantId: auth.tenantId,
        authKeyId: auth.keyId,
        conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined,
        userId: typeof body.userId === "string" ? body.userId : auth.subjectId,
        userGoal: body.userGoal,
        module: body.module as AgentMissionType | undefined,
        marketTarget: typeof body.marketTarget === "string" ? body.marketTarget : undefined,
        asset: typeof body.asset === "string" ? body.asset : undefined,
        budgetUSDC: typeof body.budgetUSDC === "string" ? body.budgetUSDC : undefined,
        maxPricePerCallUSDC: typeof body.maxPricePerCallUSDC === "string" ? body.maxPricePerCallUSDC : undefined,
        minProviderTrustScore: typeof body.minProviderTrustScore === "number" ? body.minProviderTrustScore : undefined,
        minRouteScore: typeof body.minRouteScore === "number" ? body.minRouteScore : undefined,
        proofRequired: typeof body.proofRequired === "boolean" ? body.proofRequired : undefined,
        blockedProviders: Array.isArray(body.blockedProviders) ? body.blockedProviders.map(String) : undefined,
        paymentMode: body.paymentMode === "real_x402" || body.paymentMode === "arc_testnet" || body.paymentMode === "demo_fallback" ? body.paymentMode : undefined,
        payload: body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? body.payload : undefined,
      };
      const result = await runAgentMission(input);
      res.status(201).json({ result });
    } catch (error) {
      incrementMetric("providerFailures");
      writeStructuredLog("agent_mission.failed", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/v1/angora/conversations", (req, res) => {
    if (!requireApiKey(req, res, "history:read")) return;
    const auth = getAuthContext(req);
    res.json({ conversations: listConversations({ workspaceId: auth.workspaceId, userId: req.query.user_id ? String(req.query.user_id) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.get("/v1/angora/conversations/:conversationId", (req, res) => {
    if (!requireApiKey(req, res, "history:read")) return;
    const conversation = getConversation(req.params.conversationId);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json({ conversation, messages: listConversationMessages(req.params.conversationId), traces: listTraceEvents({ workspaceId: getAuthContext(req).workspaceId, conversationId: req.params.conversationId, limit: 200 }), checkpoints: listCheckpoints({ workspaceId: getAuthContext(req).workspaceId, conversationId: req.params.conversationId, limit: 200 }) });
  });

  app.get("/v1/angora/agent-traces", (req, res) => {
    if (!requireApiKey(req, res, "history:read")) return;
    res.json({ traces: listTraceEvents({ workspaceId: getAuthContext(req).workspaceId, conversationId: req.query.conversation_id ? String(req.query.conversation_id) : undefined, missionId: req.query.mission_id ? String(req.query.mission_id) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

  app.get("/v1/angora/agent-checkpoints", (req, res) => {
    if (!requireApiKey(req, res, "history:read")) return;
    res.json({ checkpoints: listCheckpoints({ workspaceId: getAuthContext(req).workspaceId, conversationId: req.query.conversation_id ? String(req.query.conversation_id) : undefined, missionId: req.query.mission_id ? String(req.query.mission_id) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined, offset: req.query.offset ? Number(req.query.offset) : undefined }) });
  });

}
