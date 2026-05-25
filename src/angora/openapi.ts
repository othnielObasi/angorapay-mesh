export function buildAngoraOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "AngoraPay Mesh Gateway API",
      version: "0.1.0",
      description:
        "Public API contract for market-agent routing, provider discovery, trust policy, Circle/x402 payment context, receipts, and reconciliation.",
      contact: {
        name: "AngoraPay Mesh",
        url: "https://github.com/othnielObasi/angorapay-mesh",
      },
      license: {
        name: "MIT",
      },
    },
    servers: [
      {
        url: process.env.ANGORA_PUBLIC_BASE_URL || "http://108.61.173.24",
        description: "Hosted Angora Gateway",
      },
      {
        url: "http://localhost:3000",
        description: "Local development",
      },
    ],
    security: [{ bearerAuth: [] }, { angoraApiKey: [] }],
    tags: [
      { name: "Operations", description: "Health, readiness, and product summary." },
      { name: "Missions", description: "Specialist market-intelligence missions." },
      { name: "Gateway", description: "Single paid-provider route execution." },
      { name: "Providers", description: "Provider discovery, registration, and validation." },
      { name: "Proof", description: "Receipts, reconciliation, payment events, and provider deliveries." },
      { name: "Workspace", description: "Workspace policy, budget, provider access, and audit controls." },
    ],
    paths: {
      "/v1/angora/health": {
        get: {
          tags: ["Operations"],
          security: [],
          summary: "Health check",
          responses: { "200": { description: "Gateway is healthy." } },
        },
      },
      "/v1/angora/ready": {
        get: {
          tags: ["Operations"],
          security: [],
          summary: "Runtime readiness",
          responses: { "200": { description: "Storage/runtime readiness." } },
        },
      },
      "/v1/angora/production/readiness": {
        get: {
          tags: ["Operations"],
          summary: "Enterprise production-readiness gates",
          responses: { "200": { description: "Current production-readiness checks." } },
        },
      },
      "/v1/angora/dashboard/summary": {
        get: {
          tags: ["Operations"],
          security: [],
          summary: "Public dashboard summary",
          responses: { "200": { description: "Aggregate product, metrics, readiness, and traction summary." } },
        },
      },
      "/v1/angora/agent-missions/run": {
        post: {
          tags: ["Missions"],
          summary: "Run a specialist market-intelligence mission",
          description:
            "Classifies the mission, selects a specialist agent, discovers paid providers, applies trust and spend policy, routes approved provider calls, creates receipts, runs reconciliation, and returns a proof-backed recommendation.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentMissionRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Mission completed with route decisions, provider outputs, receipts, and recommendation." },
            "400": { description: "Invalid mission request." },
            "401": { description: "Missing or insufficient API key." },
          },
        },
      },
      "/v1/angora/gateway/call": {
        post: {
          tags: ["Gateway"],
          summary: "Route one paid provider call",
          description:
            "Evaluates candidate providers against mission policy, spend limits, trust, proof support, and route score before calling the selected Circle/x402 provider path.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GatewayCallRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Provider call delivered and receipt created." },
            "403": { description: "Provider call blocked by policy or spend controls." },
            "409": { description: "Idempotency key conflict." },
          },
        },
      },
      "/v1/angora/services/search": {
        get: {
          tags: ["Providers"],
          summary: "Search paid intelligence providers",
          parameters: [
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "max_price", in: "query", schema: { type: "string" } },
            { name: "min_trust", in: "query", schema: { type: "number" } },
            { name: "require_verified", in: "query", schema: { type: "boolean" } },
          ],
          responses: { "200": { description: "Matching and blocked provider candidates." } },
        },
      },
      "/v1/angora/providers/register": {
        post: {
          tags: ["Providers"],
          summary: "Register a paid intelligence provider",
          responses: {
            "201": { description: "Provider service registered." },
            "400": { description: "Provider manifest failed validation." },
            "401": { description: "Missing or insufficient API key." },
          },
        },
      },
      "/v1/angora/receipts": {
        get: {
          tags: ["Proof"],
          summary: "List proof receipts",
          parameters: [
            { name: "mission_id", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "execution_mode", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 500 } },
            { name: "offset", in: "query", schema: { type: "integer", minimum: 0 } },
          ],
          responses: { "200": { description: "Workspace-scoped proof receipts." } },
        },
      },
      "/v1/angora/reconciliation/run": {
        post: {
          tags: ["Proof"],
          summary: "Run reconciliation",
          description: "Matches payment intents, provider deliveries, receipts, payment events, and settlement status.",
          responses: {
            "200": { description: "Reconciliation run result." },
            "401": { description: "Missing or insufficient API key." },
          },
        },
      },
      "/v1/angora/payment-intents": {
        get: {
          tags: ["Proof"],
          summary: "List payment intents",
          responses: { "200": { description: "Workspace-scoped payment intents." } },
        },
      },
      "/v1/angora/provider-deliveries": {
        get: {
          tags: ["Proof"],
          summary: "List provider deliveries",
          responses: { "200": { description: "Workspace-scoped provider delivery records." } },
        },
      },
      "/v1/angora/workspaces/current/policy": {
        get: { tags: ["Workspace"], summary: "Read workspace policy", responses: { "200": { description: "Workspace policy." } } },
        patch: { tags: ["Workspace"], summary: "Update workspace policy", responses: { "200": { description: "Updated policy." } } },
      },
      "/v1/angora/workspaces/current/budget": {
        get: { tags: ["Workspace"], summary: "Read workspace budget", responses: { "200": { description: "Workspace budget." } } },
        patch: { tags: ["Workspace"], summary: "Update workspace budget", responses: { "200": { description: "Updated budget." } } },
      },
      "/v1/angora/auth/keys": {
        get: { tags: ["Workspace"], summary: "List API keys", responses: { "200": { description: "Sanitized API-key metadata." } } },
        post: { tags: ["Workspace"], summary: "Issue API key", responses: { "201": { description: "New API key; returned once." } } },
      },
      "/v1/angora/openapi.json": {
        get: {
          tags: ["Operations"],
          security: [],
          summary: "OpenAPI contract",
          responses: { "200": { description: "OpenAPI 3.1 specification for AngoraPay Mesh Gateway." } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Use `Authorization: Bearer <ANGORA_API_KEY>`.",
        },
        angoraApiKey: {
          type: "apiKey",
          in: "header",
          name: "x-angora-api-key",
          description: "Workspace API key for server-side SDK/Gateway usage.",
        },
      },
      schemas: {
        AgentMissionRequest: {
          type: "object",
          required: ["userGoal"],
          properties: {
            userGoal: { type: "string", minLength: 8 },
            module: { type: "string", enum: ["prediction_market", "cross_venue_arbitrage", "social_trading"] },
            marketTarget: { type: "string" },
            budgetUSDC: { type: "string", default: "0.05" },
            maxPricePerCallUSDC: { type: "string", default: "0.01" },
            minProviderTrustScore: { type: "number", default: 85 },
            minRouteScore: { type: "number", default: 80 },
            proofRequired: { type: "boolean", default: true },
            paymentMode: { type: "string", enum: ["demo_fallback", "arc_testnet", "real_x402"] },
            payload: { type: "object", additionalProperties: true },
          },
        },
        GatewayCallRequest: {
          type: "object",
          required: ["missionId", "agentId", "consumerId", "intent", "category", "maxPrice"],
          properties: {
            missionId: { type: "string" },
            agentId: { type: "string" },
            consumerId: { type: "string" },
            intent: { type: "string" },
            category: { type: "string", enum: ["odds", "sentiment", "risk", "liquidity", "arbitrage", "research", "proof"] },
            maxPrice: { type: "string" },
            idempotencyKey: { type: "string" },
            payload: { type: "object", additionalProperties: true },
          },
        },
      },
    },
  };
}
