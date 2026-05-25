export type AngoraSource = "canteen" | "arc-discord" | "circle" | "linkedin" | "x" | "hackathon" | "manual";

export const ANGORAPAY_SDK_VERSION = "0.1.0";

export interface AngoraClientOptions {
  baseUrl?: string;
  gatewayUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export interface MarketMissionRequest {
  agentId: string;
  consumerId: string;
  objective: string;
  rfpTrack?: string;
  asset?: string;
  marketContext?: string;
  budget?: string;
  allowedCategories?: string[];
  minProviderTrustScore?: number;
  requiresReceipts?: boolean;
}

export interface GatewayCallRequest {
  missionId: string;
  agentId: string;
  consumerId: string;
  intent: string;
  category: string;
  maxPrice: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
}

export class AngoraPay {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AngoraClientOptions) {
    const baseUrl = options.baseUrl || options.gatewayUrl;
    if (!baseUrl) throw new Error("AngoraPay requires baseUrl or gatewayUrl");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl || fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", "application/json");
    if (this.apiKey) headers.set("Authorization", `Bearer ${this.apiKey}`);

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error || `Angora request failed with ${response.status}`;
      throw new Error(message);
    }
    return body as T;
  }

  createMission(input: MarketMissionRequest) {
    return this.request("/v1/angora/missions", { method: "POST", body: JSON.stringify(input) });
  }

  discoverMarketServices(params: { missionId?: string; category?: string; maxPrice?: string; rfpTrack?: string } = {}) {
    const query = new URLSearchParams();
    if (params.missionId) query.set("mission_id", params.missionId);
    if (params.category) query.set("category", params.category);
    if (params.maxPrice) query.set("max_price", params.maxPrice);
    if (params.rfpTrack) query.set("rfp_track", params.rfpTrack);
    return this.request(`/v1/angora/services/search?${query.toString()}`);
  }

  simulateRoute(missionId?: string, maxPrice = "0.01") {
    const query = new URLSearchParams();
    if (missionId) query.set("mission_id", missionId);
    query.set("max_price", maxPrice);
    return this.request(`/v1/angora/route/simulate?${query.toString()}`);
  }

  callMarketService(input: GatewayCallRequest) {
    return this.request("/v1/angora/gateway/call", { method: "POST", body: JSON.stringify(input) });
  }

  runDemoMarketMission(payload: Record<string, unknown> = {}) {
    return this.request("/v1/angora/demo/market-mission", { method: "POST", body: JSON.stringify({ payload }) });
  }

  recordUser(input: { userId?: string; displayName?: string; email?: string; walletAddress?: string; source?: AngoraSource; metadata?: Record<string, unknown> }) {
    return this.request("/v1/angora/traction/users", { method: "POST", body: JSON.stringify(input) });
  }

  recordFeedback(input: { userId: string; missionId?: string; rating: number; comment: string }) {
    return this.request("/v1/angora/traction/feedback", { method: "POST", body: JSON.stringify(input) });
  }

  getExecutionHistory(params: { missionId?: string; status?: string; agentId?: string; providerId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.missionId) query.set("mission_id", params.missionId);
    if (params.status) query.set("status", params.status);
    if (params.agentId) query.set("agent_id", params.agentId);
    if (params.providerId) query.set("provider_id", params.providerId);
    return this.request(`/v1/angora/execution-history?${query.toString()}`);
  }

  getSubmissionMetrics() {
    return this.request("/v1/angora/submission/metrics");
  }

  getProductionReadiness() {
    return this.request("/v1/angora/production/readiness");
  }

  listReceipts(params: { missionId?: string; status?: string; executionMode?: string; limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.missionId) query.set("mission_id", params.missionId);
    if (params.status) query.set("status", params.status);
    if (params.executionMode) query.set("execution_mode", params.executionMode);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.offset != null) query.set("offset", String(params.offset));
    return this.request(`/v1/angora/receipts?${query.toString()}`);
  }

  runAgentMission(input: { userGoal: string; module?: "prediction_market" | "cross_venue_arbitrage" | "social_trading"; conversationId?: string; userId?: string; budgetUSDC?: string; paymentMode?: "real_x402" | "arc_testnet" | "demo_fallback"; payload?: Record<string, unknown> }) {
    return this.request("/v1/angora/agent-missions/run", { method: "POST", body: JSON.stringify(input) });
  }

  listConversations(params: { userId?: string; limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.userId) query.set("user_id", params.userId);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.offset != null) query.set("offset", String(params.offset));
    return this.request(`/v1/angora/conversations?${query.toString()}`);
  }

  getConversation(conversationId: string) {
    return this.request(`/v1/angora/conversations/${conversationId}`);
  }

  getAgentTraces(params: { conversationId?: string; missionId?: string; limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.conversationId) query.set("conversation_id", params.conversationId);
    if (params.missionId) query.set("mission_id", params.missionId);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.offset != null) query.set("offset", String(params.offset));
    return this.request(`/v1/angora/agent-traces?${query.toString()}`);
  }

  runReconciliation(input: { missionId?: string; receiptId?: string } = {}) {
    return this.request("/v1/angora/reconciliation/run", { method: "POST", body: JSON.stringify(input) });
  }

  listReconciliationRuns(params: { missionId?: string; receiptId?: string; limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.missionId) query.set("mission_id", params.missionId);
    if (params.receiptId) query.set("receipt_id", params.receiptId);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.offset != null) query.set("offset", String(params.offset));
    return this.request(`/v1/angora/reconciliation/runs?${query.toString()}`);
  }

  listPaymentIntents(params: { missionId?: string; receiptId?: string; status?: string; limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.missionId) query.set("mission_id", params.missionId);
    if (params.receiptId) query.set("receipt_id", params.receiptId);
    if (params.status) query.set("status", params.status);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.offset != null) query.set("offset", String(params.offset));
    return this.request(`/v1/angora/payment-intents?${query.toString()}`);
  }
}

