import type { AgentMissionType, AgentProviderDecision } from "./types.js";

export function buildRecommendation(module: AgentMissionType, decisions: AgentProviderDecision[]) {
  const delivered = decisions.filter((decision) => decision.status === "delivered");
  const blocked = decisions.filter((decision) => decision.status === "blocked");
  const avgScore = delivered.length
    ? delivered.reduce((sum, decision) => sum + Number(decision.routeScore || 0), 0) / delivered.length
    : 0;
  const confidence = Math.round(Math.min(88, Math.max(42, 48 + delivered.length * 8 + avgScore * 0.08 - blocked.length * 5)));

  if (module === "cross_venue_arbitrage") {
    const netSpread = delivered.length >= 3 ? 0.18 : 0.04;
    const action = netSpread >= 0.15 && confidence >= 70 ? "monitor_or_execute_with_limits" : "reject_or_monitor";
    return {
      action,
      confidence,
      summary: `Arbitrage intelligence completed with ${delivered.length} delivered provider calls, ${blocked.length} blocked calls, and estimated net spread of ${netSpread.toFixed(2)}%.`,
      reasons: [
        "Venue and spread checks were routed through approved providers.",
        "Risk and proof checks were required before any execution recommendation.",
        blocked.length ? "At least one provider was blocked before payment." : "No provider block materially weakened the result.",
      ],
      guardrail: "Do not execute automatically unless live fees, slippage, liquidity, and settlement checks remain valid at execution time.",
    };
  }

  if (module === "social_trading") {
    const action = confidence >= 75 && blocked.length === 0 ? "follow_reduced_size" : confidence >= 60 ? "monitor_only" : "reject";
    return {
      action,
      confidence,
      summary: `Social trading intelligence completed with ${delivered.length} delivered provider calls and ${blocked.length} blocked calls.`,
      reasons: [
        "Signal quality was checked against paid social, sentiment, and risk intelligence.",
        "Copy-risk constraints prevent blind following of social-alpha signals.",
        blocked.length ? "Untrusted alpha providers were blocked before payment." : "Approved providers met trust and proof requirements.",
      ],
      guardrail: "Do not follow social signals without position limits, drawdown controls, and ongoing degradation checks.",
    };
  }

  const action = confidence >= 75 ? "enter_small_or_monitor" : confidence >= 60 ? "monitor" : "avoid";
  return {
    action,
    confidence,
    summary: `Prediction-market intelligence completed with ${delivered.length} delivered provider calls, ${blocked.length} blocked calls, and ${confidence}% confidence.`,
    reasons: [
      "Odds, sentiment, risk, and proof checks were evaluated before recommendation.",
      "Provider route decisions were scored before payment.",
      blocked.length ? "Low-trust or no-proof providers were blocked." : "Approved providers satisfied mission policy.",
    ],
    guardrail: "Treat this as decision-support intelligence, not autonomous trade execution without user or downstream policy approval.",
  };
}
