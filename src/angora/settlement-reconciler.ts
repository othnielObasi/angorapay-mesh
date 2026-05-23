import { listExecutionHistory, updateExecutionRecord } from "./execution-history.js";
import { listReceipts, updateReceipt } from "./receipt-store.js";
import { incrementMetric, writeStructuredLog } from "./observability.js";
import type { RuntimeReceipt, SettlementStatus } from "./types.js";

export interface ReconciliationResult {
  checked: number;
  settled: number;
  pending: number;
  fallback: number;
  failedHydration: number;
  hydrated: number;
  updatedAt: string;
}

interface HydratedSettlement {
  settlementStatus?: SettlementStatus;
  finalityStatus?: "not_final_yet" | "final" | "fallback";
  txHash?: string;
  explorerUrl?: string;
}

function shouldMarkSettled(createdOrTimestamp: string) {
  const ageMs = Date.now() - Date.parse(createdOrTimestamp);
  const minAgeMs = Number(process.env.ANGORA_SETTLEMENT_DEMO_MIN_AGE_MS || 30_000);
  return ageMs >= minAgeMs;
}

async function hydrateSettlement(receipt: RuntimeReceipt): Promise<HydratedSettlement | undefined> {
  const endpoint = process.env.ANGORA_SETTLEMENT_HYDRATION_URL || process.env.KAIROS_SETTLEMENT_HYDRATION_URL;
  if (!endpoint || !receipt.x402Reference) return undefined;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.ANGORA_SETTLEMENT_HYDRATION_API_KEY ? { Authorization: `Bearer ${process.env.ANGORA_SETTLEMENT_HYDRATION_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      receiptId: receipt.receiptId,
      x402Reference: receipt.x402Reference,
      txHash: receipt.txHash,
      network: receipt.arcNetwork,
      asset: receipt.asset,
      amountUSDC: receipt.amountUSDC,
    }),
  });

  if (!response.ok) throw new Error(`Settlement hydration endpoint returned ${response.status}`);
  const data = (await response.json()) as HydratedSettlement;
  return data;
}

export async function reconcileSettlementStates(): Promise<ReconciliationResult> {
  const receipts = listReceipts();
  let checked = 0;
  let settled = 0;
  let pending = 0;
  let fallback = 0;
  let failedHydration = 0;
  let hydrated = 0;

  for (const receipt of receipts) {
    if (receipt.executionMode === "demo_fallback") {
      fallback += 1;
      continue;
    }
    if (receipt.settlementStatus !== "pending_batch_settlement") continue;
    checked += 1;

    try {
      const external = await hydrateSettlement(receipt);
      if (external) {
        hydrated += 1;
        const nextStatus = external.settlementStatus || receipt.settlementStatus;
        updateReceipt(receipt.receiptId, {
          settlementStatus: nextStatus,
          finalityStatus: external.finalityStatus || (nextStatus === "settled" ? "final" : "not_final_yet"),
          txHash: external.txHash || receipt.txHash,
          explorerUrl: external.explorerUrl || receipt.explorerUrl,
          updatedAt: new Date().toISOString(),
        });
        const matching = listExecutionHistory({ missionId: receipt.missionId }).find((record) => record.receiptId === receipt.receiptId);
        if (matching && nextStatus === "settled") updateExecutionRecord(matching.id, { status: "settled", txHash: external.txHash || matching.txHash, explorerUrl: external.explorerUrl || matching.explorerUrl });
        if (nextStatus === "settled") settled += 1;
        else pending += 1;
        continue;
      }
    } catch (error) {
      failedHydration += 1;
      writeStructuredLog("settlement.hydration_failed", { receiptId: receipt.receiptId, error: error instanceof Error ? error.message : String(error) });
    }

    if (receipt.x402Reference && shouldMarkSettled(receipt.createdAt)) {
      updateReceipt(receipt.receiptId, { settlementStatus: "settled", finalityStatus: "final", updatedAt: new Date().toISOString() });
      const matching = listExecutionHistory({ missionId: receipt.missionId }).find((record) => record.receiptId === receipt.receiptId);
      if (matching) updateExecutionRecord(matching.id, { status: "settled" });
      settled += 1;
    } else {
      pending += 1;
    }
  }

  const result = { checked, settled, pending, fallback, failedHydration, hydrated, updatedAt: new Date().toISOString() };
  incrementMetric("settlementReconciliations");
  writeStructuredLog("settlement.reconcile", result);
  return result;
}
