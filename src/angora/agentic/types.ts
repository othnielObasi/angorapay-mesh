import type { ExecutionHistoryRecord, RfpTrack, RuntimeReceipt, ServiceCategory, TrustScorecard } from "../types.js";

export type AgentMissionType = "prediction_market" | "cross_venue_arbitrage" | "social_trading";
export type AgentMissionStatus = "draft" | "running" | "completed" | "failed" | "resumed";
export type ConversationRole = "user" | "assistant" | "system" | "tool";
export type TraceEventType =
  | "mission.created"
  | "agent.selected"
  | "context.prepared"
  | "memory.retrieved"
  | "provider.discovered"
  | "route.scored"
  | "policy.evaluated"
  | "payment.attempted"
  | "receipt.created"
  | "llm.reasoning"
  | "recommendation.generated"
  | "mission.completed"
  | "mission.failed";

export interface AgentMissionInput {
  workspaceId?: string;
  tenantId?: string;
  authKeyId?: string;
  conversationId?: string;
  userId?: string;
  userGoal: string;
  module?: AgentMissionType;
  marketTarget?: string;
  asset?: string;
  budgetUSDC?: string;
  maxPricePerCallUSDC?: string;
  minProviderTrustScore?: number;
  minRouteScore?: number;
  proofRequired?: boolean;
  blockedProviders?: string[];
  paymentMode?: "real_x402" | "arc_testnet" | "demo_fallback";
  payload?: Record<string, unknown>;
}

export interface ConversationThread {
  conversationId: string;
  workspaceId?: string;
  tenantId?: string;
  userId?: string;
  title: string;
  status: AgentMissionStatus;
  specialistAgent?: AgentMissionType;
  missionId?: string;
  lastRecommendation?: string;
  totalUSDC: string;
  receiptIds: string[];
  traceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  messageId: string;
  conversationId: string;
  role: ConversationRole;
  content: string;
  missionId?: string;
  traceId?: string;
  receiptIds?: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AgentTraceEvent {
  traceId: string;
  conversationId: string;
  missionId: string;
  workspaceId?: string;
  tenantId?: string;
  eventType: TraceEventType;
  label: string;
  status: "pending" | "completed" | "failed" | "blocked";
  agentId?: string;
  providerId?: string;
  serviceId?: string;
  routeScore?: number;
  receiptId?: string;
  executionId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface MissionCheckpoint {
  checkpointId: string;
  conversationId: string;
  missionId: string;
  workspaceId?: string;
  tenantId?: string;
  specialistAgent: AgentMissionType;
  stage:
    | "mission_created"
    | "agent_selected"
    | "context_prepared"
    | "providers_discovered"
    | "routes_scored"
    | "policy_evaluated"
    | "payment_attempted"
    | "receipt_created"
    | "recommendation_generated"
    | "mission_completed"
    | "mission_failed";
  status: "saved" | "recoverable" | "terminal";
  resumeFrom: string;
  idempotencyKey: string;
  state: Record<string, unknown>;
  createdAt: string;
}

export interface RetrievedMemoryItem {
  id: string;
  type: "similar_mission" | "provider_reliability" | "blocked_provider" | "receipt";
  summary: string;
  relevance: number;
  metadata: Record<string, unknown>;
}

export interface AgentContextPacket {
  missionId: string;
  conversationId: string;
  workspaceId?: string;
  tenantId?: string;
  authKeyId?: string;
  specialistAgent: AgentMissionType;
  userGoal: string;
  marketTarget: string;
  budgetUSDC: string;
  maxPricePerCallUSDC: string;
  requiredCategories: ServiceCategory[];
  minProviderTrustScore: number;
  minRouteScore: number;
  proofRequired: boolean;
  blockedProviders: string[];
  retrievedMemory: RetrievedMemoryItem[];
  payment: {
    rail: "Circle/x402";
    asset: "USDC";
    network: "Arc";
    mode: "real_x402" | "arc_testnet" | "demo_fallback";
  };
}

export interface AgentProviderDecision {
  category: ServiceCategory;
  intent: string;
  status: "delivered" | "blocked" | "failed";
  providerId?: string;
  serviceId?: string;
  serviceName?: string;
  amountUSDC: string;
  routeScore?: number;
  scorecard?: TrustScorecard;
  policyVerdict: string;
  routeReason: string;
  receipt?: RuntimeReceipt;
  execution?: ExecutionHistoryRecord;
  error?: string;
}

export interface AgentMissionResult {
  conversation: ConversationThread;
  missionId: string;
  specialistAgent: AgentMissionType;
  rfpTrack: RfpTrack;
  context: AgentContextPacket;
  decisions: AgentProviderDecision[];
  recommendation: {
    action: string;
    confidence: number;
    summary: string;
    reasons: string[];
    guardrail: string;
  };
  llmSource: "openai" | "deterministic_fallback";
  llmModel: string | null;
  receipts: RuntimeReceipt[];
  traces: AgentTraceEvent[];
  checkpoints: MissionCheckpoint[];
  /** Autonomous Polymarket bet intent built by Kelly criterion after recommendation. */
  betIntent?: import("../../services/polymarket-executor.js").PolymarketBetIntent;
  /** USYC position opened when agent confidence is low (risk-off capital allocation). */
  usycPosition?: import("../../services/circle-usyc.js").USYCPosition;
  /** CCTP cross-chain settlement record for cross-venue arbitrage missions. */
  cctpSettlement?: ReturnType<typeof import("../../services/circle-cctp.js").buildCctpSettlementRecord>;
  /** On-chain proof: sha256 of mission bundle anchored to an Arc testnet tx via Circle DCW. */
  onChainProof?: import("../../services/nanopayments.js").OnChainProof;
  totals: {
    approvedProviders: number;
    blockedProviders: number;
    receiptsCreated: number;
    usdcRouted: string;
  };
}
