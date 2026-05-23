import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { AngoraGatewayCallRequest, GatewayDecision, ProviderCallResult, RuntimeReceipt, ServiceManifest } from "./types.js";

const RECEIPTS_FILE = stateFile("receipts.json");

function hashOutput(data: unknown): string {
  return `sha256:${crypto.createHash("sha256").update(JSON.stringify(data ?? null)).digest("hex")}`;
}

function load(): RuntimeReceipt[] {
  return readJsonFile<RuntimeReceipt[]>(RECEIPTS_FILE, []);
}

function save(receipts: RuntimeReceipt[]) {
  writeJsonFile(RECEIPTS_FILE, receipts);
}

export function createAngoraReceipt(input: {
  request: AngoraGatewayCallRequest;
  service: ServiceManifest;
  providerResult: ProviderCallResult;
  decision: GatewayDecision;
  policyVerdict: string;
  metadata?: Record<string, unknown>;
}): RuntimeReceipt {
  const now = new Date().toISOString();
  const receipt: RuntimeReceipt = {
    workspaceId: input.request.workspaceId,
    tenantId: input.request.tenantId,
    authKeyId: input.request.authKeyId,
    receiptId: `angora_rcpt_${crypto.randomBytes(8).toString("hex")}`,
    taskId: input.request.missionId,
    missionId: input.request.missionId,
    agentId: input.request.agentId,
    consumerId: input.request.consumerId,
    providerId: input.service.providerId,
    serviceId: input.service.serviceId,
    category: input.service.category,
    amount: input.service.price,
    amountUSDC: input.service.price,
    currency: input.service.currency,
    asset: "USDC",
    paymentRail: input.providerResult.paymentRail,
    circleTool: input.providerResult.circleTool,
    arcNetwork: input.providerResult.arcNetwork,
    policyStatus: input.providerResult.ok ? "approved" : "blocked",
    paymentStatus: input.providerResult.paymentStatus,
    settlementStatus: input.providerResult.settlementStatus,
    serviceStatus: input.providerResult.ok ? "delivered" : "failed",
    finalityStatus: input.providerResult.settlementStatus === "settled" ? "final" : input.providerResult.settlementStatus === "fallback" ? "fallback" : "not_final_yet",
    executionMode: input.providerResult.executionMode,
    outputHash: hashOutput(input.providerResult.data),
    x402Reference: input.providerResult.x402Reference,
    txHash: input.providerResult.txHash,
    explorerUrl: input.providerResult.explorerUrl,
    policyVerdict: input.policyVerdict,
    routeReason: input.decision.routeReason,
    reconciliationTag: `angora.${input.service.category}.${input.service.providerId}.${input.request.missionId}`,
    scorecard: input.decision.scorecard,
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata || {},
  };

  const receipts = load();
  receipts.unshift(receipt);
  save(receipts.slice(0, 1000));
  return receipt;
}

export function listReceipts(filter: { workspaceId?: string; tenantId?: string; missionId?: string; status?: string; executionMode?: string; limit?: number; offset?: number } = {}): RuntimeReceipt[] {
  const limit = Math.min(Math.max(Number(filter.limit || 1000), 1), 2000);
  const offset = Math.max(Number(filter.offset || 0), 0);
  return load().filter((receipt) => {
    if (filter.workspaceId && receipt.workspaceId !== filter.workspaceId) return false;
    if (filter.tenantId && receipt.tenantId !== filter.tenantId) return false;
    if (filter.missionId && receipt.missionId !== filter.missionId) return false;
    if (filter.status && receipt.serviceStatus !== filter.status && receipt.settlementStatus !== filter.status) return false;
    if (filter.executionMode && receipt.executionMode !== filter.executionMode) return false;
    return true;
  }).slice(offset, offset + limit);
}

export function getReceipt(receiptId: string): RuntimeReceipt | undefined {
  return load().find((receipt) => receipt.receiptId === receiptId);
}

export function updateReceipt(receiptId: string, patch: Partial<RuntimeReceipt>): RuntimeReceipt | undefined {
  const receipts = load();
  const index = receipts.findIndex((receipt) => receipt.receiptId === receiptId);
  if (index < 0) return undefined;
  receipts[index] = { ...receipts[index], ...patch, updatedAt: new Date().toISOString() };
  save(receipts);
  return receipts[index];
}

export function summarize() {
  const receipts = load();
  const spend = receipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
  return {
    totalReceipts: receipts.length,
    totalSpend: spend.toFixed(6),
    delivered: receipts.filter((r) => r.serviceStatus === "delivered").length,
    pendingSettlement: receipts.filter((r) => r.settlementStatus === "pending_batch_settlement").length,
    realX402: receipts.filter((r) => r.executionMode === "real_x402").length,
    arcTestnet: receipts.filter((r) => r.executionMode === "arc_testnet").length,
    fallback: receipts.filter((r) => r.executionMode === "demo_fallback").length,
    recent: receipts.slice(0, 10),
  };
}
