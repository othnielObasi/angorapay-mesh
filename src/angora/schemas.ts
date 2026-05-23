import { z } from "zod";

export const serviceCategorySchema = z.enum([
  "odds",
  "news",
  "sentiment",
  "risk",
  "market_data",
  "social",
  "proof",
  "perps",
  "portfolio",
  "arbitrage",
  "creator",
  "research",
]);

export const rfpTrackSchema = z.enum([
  "RFP 01 - Perpetual Futures Trading Agent",
  "RFP 02 - Prediction Market Trader Intelligence",
  "RFP 03 - Prediction Market Verticals",
  "RFP 04 - Adaptive Portfolio Manager",
  "RFP 05 - Cross-Platform Arbitrage Agent",
  "RFP 06 - Social Trading Intelligence",
]);

export const missionCreateSchema = z.object({
  missionId: z.string().min(3).optional(),
  agentId: z.string().min(3).default("prediction-agent-01"),
  consumerId: z.string().min(2).default("demo-market-builder"),
  objective: z.string().min(5).default("Evaluate a positive expected value market opportunity using paid market intelligence services."),
  rfpTrack: rfpTrackSchema.optional(),
  asset: z.string().min(1).optional(),
  marketContext: z.string().min(2).optional(),
  budget: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  allowedCategories: z.array(serviceCategorySchema).min(1).optional(),
  blockedProviders: z.array(z.string()).optional(),
  minProviderTrustScore: z.number().min(0).max(100).optional(),
  requiresReceipts: z.boolean().optional(),
  requiresReputationUpdate: z.boolean().optional(),
  maxServicesPerMission: z.number().int().min(1).max(50).optional(),
  decisionPolicy: z.object({
    requireRouteScoreAtLeast: z.number().min(0).max(100).optional(),
    allowFallbackMode: z.boolean().optional(),
    requireArcSettlementReference: z.boolean().optional(),
    requireOutputHash: z.boolean().optional(),
  }).optional(),
});

export const gatewayCallSchema = z.object({
  missionId: z.string().min(3),
  agentId: z.string().min(3),
  consumerId: z.string().min(2),
  intent: z.string().min(5),
  category: serviceCategorySchema,
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/, "maxPrice must be a positive decimal string"),
  payload: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().min(8).max(160).optional(),
});


export const angoraScopeSchema = z.enum([
  "admin",
  "missions:read",
  "missions:write",
  "services:read",
  "gateway:call",
  "receipts:read",
  "history:read",
  "metrics:read",
  "providers:write",
  "traction:write",
  "settlement:read",
  "settlement:write",
]);

export const apiKeyCreateSchema = z.object({
  label: z.string().min(2).max(120).optional(),
  workspaceId: z.string().min(2).max(120).optional(),
  tenantId: z.string().min(2).max(120).optional(),
  subjectId: z.string().min(2).max(120).optional(),
  scopes: z.array(angoraScopeSchema).min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const apiKeyRotateSchema = z.object({
  keyId: z.string().min(3),
});

export const userSessionSchema = z.object({
  userId: z.string().min(2).optional(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
  source: z.enum(["canteen", "arc-discord", "circle", "linkedin", "x", "hackathon", "manual"]).default("manual"),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const feedbackSchema = z.object({
  userId: z.string().min(2),
  missionId: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  comment: z.string().max(2000).default(""),
});

export const executionQuerySchema = z.object({
  mission_id: z.string().optional(),
  status: z.string().optional(),
  agent_id: z.string().optional(),
  provider_id: z.string().optional(),
  category: serviceCategorySchema.optional(),
  execution_mode: z.enum(["real_x402", "arc_testnet", "demo_fallback", "blocked"]).optional(),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): { ok: true; value: z.infer<T> } | { ok: false; error: string; issues: unknown } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Request validation failed", issues: parsed.error.flatten() };
  }
  return { ok: true, value: parsed.data };
}

export function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): { ok: true; value: z.infer<T> } | { ok: false; error: string; issues: unknown } {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    return { ok: false, error: "Query validation failed", issues: parsed.error.flatten() };
  }
  return { ok: true, value: parsed.data };
}
