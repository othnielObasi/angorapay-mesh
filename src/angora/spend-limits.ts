import { listExecutionHistory } from "./execution-history.js";
import type { MarketMission } from "./types.js";

export function evaluateSpendLimit(input: { mission: MarketMission; consumerId: string; requestedAmountUSDC: string }) {
  const currentSpend = listExecutionHistory({ missionId: input.mission.missionId })
    .filter((record) => !["blocked", "failed"].includes(record.status))
    .reduce((sum, record) => sum + Number(record.amountUSDC || 0), 0);
  const requested = Number(input.requestedAmountUSDC || 0);
  const budget = Number(input.mission.budget || 0);
  const nextSpend = currentSpend + requested;
  return {
    allowed: nextSpend <= budget,
    budgetUSDC: budget.toFixed(6),
    currentSpendUSDC: currentSpend.toFixed(6),
    requestedUSDC: requested.toFixed(6),
    projectedSpendUSDC: nextSpend.toFixed(6),
    remainingUSDC: Math.max(0, budget - currentSpend).toFixed(6),
  };
}
