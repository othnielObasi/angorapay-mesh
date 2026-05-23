export type Currency = "USDC";
export type PaymentStatus = "not_required" | "authorized_by_x402" | "mock_authorized" | "failed";
export type SettlementStatus = "pending_batch_settlement" | "settled" | "fallback" | "not_applicable";
export type ServiceStatus = "not_called" | "delivered" | "failed" | "blocked";
export type FinalityStatus = "not_final_yet" | "final" | "fallback";
export type ExecutionMode = "real_x402" | "arc_testnet" | "demo_fallback" | "blocked";
export type CircleTool = "Circle Gateway" | "Circle x402" | "Circle Nanopayments" | "Circle Wallets" | "Demo Adapter";
export type RfpTrack =
  | "RFP 01 - Perpetual Futures Trading Agent"
  | "RFP 02 - Prediction Market Trader Intelligence"
  | "RFP 03 - Prediction Market Verticals"
  | "RFP 04 - Adaptive Portfolio Manager"
  | "RFP 05 - Cross-Platform Arbitrage Agent"
  | "RFP 06 - Social Trading Intelligence";

export type ServiceCategory =
  | "odds"
  | "news"
  | "sentiment"
  | "risk"
  | "market_data"
  | "social"
  | "proof"
  | "perps"
  | "portfolio"
  | "arbitrage"
  | "creator"
  | "research";

export interface RfpArea {
  id: RfpTrack;
  title: string;
  fit: "direct" | "supporting";
  defaultCategories: ServiceCategory[];
  demoMission: string;
  adoptionWedge: string;
}

export interface ServiceManifest {
  serviceId: string;
  providerId: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: string;
  currency: Currency;
  x402Url: string;
  proofRequired: boolean;
  verified: boolean;
  trustScore: number;
  avgLatencyMs: number;
  policyTags: string[];
  rfpTracks: RfpTrack[];
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
}

export interface TrustScorecard {
  policyCompliance: number;
  costDiscipline: number;
  proofCompleteness: number;
  deliveryQuality: number;
  routeScore: number;
  explanation: string[];
}

export interface GatewayDecision {
  allowed: boolean;
  reason: string;
  routeReason: string;
  policyChecks: Array<{ check: string; passed: boolean; detail: string }>;
  selectedService?: ServiceManifest;
  candidates: ServiceManifest[];
  blockedCandidates: Array<{ service: ServiceManifest; reason: string }>;
  scorecard?: TrustScorecard;
}

export interface ProviderCallResult {
  ok: boolean;
  status: number;
  data: unknown;
  paymentStatus: PaymentStatus;
  settlementStatus: SettlementStatus;
  executionMode: ExecutionMode;
  paymentRail: "Circle/x402";
  circleTool: CircleTool;
  arcNetwork: string;
  asset: Currency;
  amountUSDC: string;
  x402Reference?: string;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export interface RuntimeReceipt {
  workspaceId?: string;
  tenantId?: string;
  authKeyId?: string;
  receiptId: string;
  taskId: string;
  missionId: string;
  agentId: string;
  consumerId: string;
  providerId: string;
  serviceId: string;
  category: ServiceCategory;
  amount: string;
  amountUSDC: string;
  currency: Currency;
  asset: Currency;
  paymentRail: "Circle/x402";
  circleTool: CircleTool;
  arcNetwork: string;
  policyStatus: "approved" | "blocked";
  paymentStatus: PaymentStatus;
  settlementStatus: SettlementStatus;
  serviceStatus: ServiceStatus;
  finalityStatus: FinalityStatus;
  executionMode: ExecutionMode;
  outputHash: string;
  x402Reference?: string;
  txHash?: string;
  explorerUrl?: string;
  policyVerdict: string;
  routeReason: string;
  reconciliationTag: string;
  scorecard?: TrustScorecard;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface MarketMission {
  workspaceId?: string;
  tenantId?: string;
  missionId: string;
  agentId: string;
  consumerId: string;
  objective: string;
  rfpTrack: RfpTrack;
  asset: string;
  marketContext: string;
  budget: string;
  currency: Currency;
  allowedCategories: ServiceCategory[];
  blockedProviders: string[];
  minProviderTrustScore: number;
  requiresReceipts: boolean;
  requiresReputationUpdate: boolean;
  maxServicesPerMission: number;
  decisionPolicy: {
    requireRouteScoreAtLeast: number;
    allowFallbackMode: boolean;
    requireArcSettlementReference: boolean;
    requireOutputHash: boolean;
  };
  status: "created" | "running" | "completed" | "blocked";
  createdAt: string;
  updatedAt: string;
}

export interface AngoraGatewayCallRequest {
  workspaceId?: string;
  tenantId?: string;
  authKeyId?: string;
  missionId: string;
  agentId: string;
  consumerId: string;
  intent: string;
  category: ServiceCategory;
  maxPrice: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface ReputationProfile {
  subjectId: string;
  subjectType: "agent" | "provider";
  score: number;
  status: "new" | "verified" | "preferred" | "elite_provider" | "watchlisted" | "trusted_market_agent";
  successfulDeliveries: number;
  failedDeliveries: number;
  blockedAttempts: number;
  policyComplianceRate: number;
  proofCompleteness: number;
  averageLatencyMs: number;
  disputeRate: number;
  updatedAt: string;
}

export interface ExecutionHistoryRecord {
  workspaceId?: string;
  tenantId?: string;
  authKeyId?: string;
  id: string;
  timestamp: string;
  missionId: string;
  agentId: string;
  consumerId: string;
  serviceId?: string;
  serviceName?: string;
  providerId?: string;
  category: ServiceCategory;
  amountUSDC: string;
  routeScore?: number;
  status: "approved" | "blocked" | "delivered" | "failed" | "settled" | "fallback" | "pending";
  paymentRail: "Circle/x402";
  circleTool: CircleTool;
  arcNetwork: string;
  executionMode: ExecutionMode;
  policyVerdict: string;
  routeReason: string;
  receiptId?: string;
  x402Reference?: string;
  txHash?: string;
  explorerUrl?: string;
  outputHash?: string;
  idempotencyKey?: string;
}

export interface RouteSimulationStep {
  category: ServiceCategory;
  intent: string;
  bestProvider?: string;
  bestService?: string;
  estimatedPriceUSDC: string;
  routeScore?: number;
  allowed: boolean;
  reason: string;
}

export interface RouteSimulation {
  missionId: string;
  rfpTrack: RfpTrack;
  objective: string;
  totalEstimatedSpendUSDC: string;
  steps: RouteSimulationStep[];
  blockedProviderCount: number;
  summary: string;
}

export interface UserSessionRecord {
  userId: string;
  displayName?: string;
  email?: string;
  walletAddress?: string;
  source: "canteen" | "arc-discord" | "circle" | "linkedin" | "x" | "hackathon" | "manual";
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface UserFeedbackRecord {
  feedbackId: string;
  userId: string;
  missionId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SubmissionMetrics {
  product: string;
  eventWindow: { start: string; end: string };
  usersOnboarded: number;
  feedbackCount: number;
  averageFeedbackRating: number;
  missionsCreated: number;
  gatewayCalls: number;
  paidServiceCalls: number;
  blockedCalls: number;
  receiptsCreated: number;
  totalVolumeUSDC: string;
  realX402Calls: number;
  arcTestnetCalls: number;
  fallbackCalls: number;
  providersUsed: number;
  providerRoutesRanked: number;
  rfpCoverage: Array<{ rfpTrack: RfpTrack; missions: number; services: number }>;
  recentExecutions: ExecutionHistoryRecord[];
}

export interface WorkspaceScoped {
  workspaceId?: string;
  tenantId?: string;
  authKeyId?: string;
}
