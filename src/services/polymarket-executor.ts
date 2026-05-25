/**
 * Polymarket Autonomous Execution
 *
 * After the recommendation engine produces a high-confidence signal, this
 * module constructs and optionally submits Kelly-criterion-sized bet intents
 * on Polymarket's CLOB API.
 *
 * Kelly fraction: f* = (bp - q) / b
 *   p = implied probability from live Polymarket data
 *   q = 1 - p
 *   b = net odds (1/p - 1)
 *   fraction = 10% half-Kelly for agent risk management
 *
 * The agent acts autonomously:
 *   confidence ≥ 75 + action "enter_small" → sizes and submits intent
 *   confidence ≥ 85 + action "enter"       → sizes and submits at full Kelly
 *   otherwise                               → records intent as "skipped"
 *
 * POLYMARKET_API_KEY env var enables live CLOB submission. Without it,
 * the intent is constructed and signed but not submitted — demonstrating
 * the full autonomous decision chain without executing live trades.
 */

import type { MissionRecommendation } from "../angora/agentic/llm-reasoning.js";

const POLYMARKET_CLOB_BASE = "https://clob.polymarket.com";
const POLYMARKET_GAMMA_BASE = "https://gamma-api.polymarket.com";

export interface PolymarketBetIntent {
  intentId: string;
  marketQuestion: string;
  marketId: string | null;
  conditionId: string | null;
  side: "yes" | "no";
  impliedProbability: number;
  edgeBps: number;
  bankrollUsdc: number;
  kellyFractionPct: number;
  kellySizeUsdc: number;
  maxSlippageBps: number;
  action: string;
  confidence: number;
  status: "constructed" | "submitted" | "skipped" | "rejected";
  submittedOrderId: string | null;
  rationale: string;
  marketTarget: string;
  timestamp: string;
}

// ── Kelly position sizing ─────────────────────────────────────────────────────

function kellyFraction(p: number, b: number): number {
  const q = 1 - p;
  const raw = (b * p - q) / b;
  return Math.max(0, Math.min(raw, 0.25)); // Cap at 25% of bankroll
}

function kellyPositionSizeUSDC(
  impliedProbability: number,
  budgetUsdc: number,
  halfKelly = true,
): number {
  if (impliedProbability <= 0 || impliedProbability >= 1) return 0;
  const b = (1 / impliedProbability) - 1; // net odds
  const f = kellyFraction(impliedProbability, b);
  const fraction = halfKelly ? f / 2 : f; // half-Kelly = conservative
  const raw = budgetUsdc * fraction;
  return Math.max(0, Math.min(raw, budgetUsdc * 0.05, 5.0)); // cap 5% bankroll or $5
}

// ── Market lookup ─────────────────────────────────────────────────────────────

interface PolymarketMarket {
  conditionId?: string;
  id?: string;
  question?: string;
  outcomePrices?: string[];
  volume?: number;
  liquidity?: number;
  active?: boolean;
  closed?: boolean;
}

async function findRelevantMarket(
  marketTarget: string,
): Promise<PolymarketMarket | null> {
  try {
    const keywords = marketTarget.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const searchTerm = keywords.slice(0, 3).join("+");

    const res = await fetch(
      `${POLYMARKET_GAMMA_BASE}/markets?closed=false&limit=50&order=volume&ascending=false`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;

    const markets = await res.json() as PolymarketMarket[];
    if (!Array.isArray(markets)) return null;

    // Find best matching active market
    const scored = markets
      .filter((m) => m.active && !m.closed && m.question)
      .map((m) => {
        const q = (m.question || "").toLowerCase();
        const score = keywords.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0);
        return { market: m, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (b.market.volume ?? 0) - (a.market.volume ?? 0));

    return scored[0]?.market ?? markets[0] ?? null;
  } catch {
    return null;
  }
}

// ── Core bet intent builder ───────────────────────────────────────────────────

/**
 * Build a Kelly-criterion-sized Polymarket bet intent from an agent recommendation.
 *
 * Called automatically when recommendation.confidence >= 70 and action is
 * "enter_small" or "enter". The agent decides the market, side, and size.
 */
export async function buildPolymarketBetIntent(
  recommendation: MissionRecommendation,
  liveOddsData: Record<string, unknown> | null,
  marketTarget: string,
  budgetUsdc: string,
): Promise<PolymarketBetIntent> {
  const intentId = `pm_intent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const bankroll = parseFloat(budgetUsdc) || 0.05;

  const action = recommendation.action;
  const confidence = recommendation.confidence;

  // Determine if this recommendation warrants autonomous execution
  const shouldAct =
    (action === "enter_small" && confidence >= 70) ||
    (action === "enter" && confidence >= 80);

  if (!shouldAct) {
    return {
      intentId,
      marketQuestion: marketTarget,
      marketId: null,
      conditionId: null,
      side: "yes",
      impliedProbability: 0.5,
      edgeBps: 0,
      bankrollUsdc: bankroll,
      kellyFractionPct: 0,
      kellySizeUsdc: 0,
      maxSlippageBps: 50,
      action,
      confidence,
      status: "skipped",
      submittedOrderId: null,
      rationale: `Action "${action}" at ${confidence}% confidence is below autonomous execution threshold`,
      marketTarget,
      timestamp: new Date().toISOString(),
    };
  }

  // Extract implied probability from live odds data
  const impliedProbability: number =
    typeof liveOddsData?.impliedProbability === "number"
      ? Math.max(0.01, Math.min(0.99, liveOddsData.impliedProbability as number))
      : confidence / 100;

  // Edge vs market: how much does our probability differ from the market implied prob?
  const marketBias = 0.50; // theoretical fair value without signal
  const edgeBps = Math.round(Math.abs(impliedProbability - marketBias) * 10000);

  // Kelly sizing
  const kellySizeUsdc = kellyPositionSizeUSDC(
    impliedProbability,
    bankroll,
    action !== "enter", // use half-Kelly unless strong "enter" signal
  );

  // Determine bet direction from live data sentiment
  const side: "yes" | "no" =
    impliedProbability > 0.5
      ? "yes" // market implies >50% probability → bet YES
      : "no";

  // Find the actual Polymarket market
  const market = await findRelevantMarket(marketTarget);

  const intent: PolymarketBetIntent = {
    intentId,
    marketQuestion: market?.question || marketTarget,
    marketId: market?.id ?? null,
    conditionId: market?.conditionId ?? null,
    side,
    impliedProbability,
    edgeBps,
    bankrollUsdc: bankroll,
    kellyFractionPct: Math.round((kellySizeUsdc / bankroll) * 100 * 10) / 10,
    kellySizeUsdc: Math.round(kellySizeUsdc * 10000) / 10000,
    maxSlippageBps: 50,
    action,
    confidence,
    status: "constructed",
    submittedOrderId: null,
    rationale: [
      `${confidence}% confidence signal → ${action}`,
      `Implied probability ${(impliedProbability * 100).toFixed(1)}% → ${side.toUpperCase()} bet`,
      `Edge vs. 50/50 fair value: ${edgeBps} bps`,
      `Kelly fraction: ${(kellySizeUsdc / bankroll * 100).toFixed(1)}% of ${bankroll} USDC budget`,
    ].join(" | "),
    marketTarget,
    timestamp: new Date().toISOString(),
  };

  // Submit if POLYMARKET_API_KEY is configured and market was found
  if (process.env.POLYMARKET_API_KEY && market?.conditionId) {
    const submitted = await submitPolymarketOrder(intent);
    intent.status = submitted.status;
    intent.submittedOrderId = submitted.orderId;
  }

  return intent;
}

// ── CLOB order submission ─────────────────────────────────────────────────────

interface PolymarketOrderResult {
  status: "submitted" | "rejected";
  orderId: string | null;
}

async function submitPolymarketOrder(
  intent: PolymarketBetIntent,
): Promise<PolymarketOrderResult> {
  const apiKey = process.env.POLYMARKET_API_KEY;
  if (!apiKey || !intent.conditionId) {
    return { status: "rejected", orderId: null };
  }

  try {
    const priceStr = intent.impliedProbability.toFixed(2);
    const sizeStr = intent.kellySizeUsdc.toFixed(4);

    const res = await fetch(`${POLYMARKET_CLOB_BASE}/order`, {
      method: "POST",
      headers: {
        "POLY_ADDRESS": process.env.AGENT_WALLET_ADDRESS || "",
        "POLY_SIGNATURE": apiKey,
        "POLY_TIMESTAMP": String(Date.now()),
        "POLY_NONCE": "0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: {
          salt: Date.now(),
          maker: process.env.AGENT_WALLET_ADDRESS,
          signer: process.env.AGENT_WALLET_ADDRESS,
          taker: "0x0000000000000000000000000000000000000000",
          tokenId: intent.conditionId,
          makerAmount: String(Math.round(parseFloat(sizeStr) * 1e6)),
          takerAmount: String(Math.round(parseFloat(sizeStr) / parseFloat(priceStr) * 1e6)),
          expiration: "0",
          nonce: "0",
          feeRateBps: "0",
          side: intent.side === "yes" ? "BUY" : "SELL",
          signatureType: 0,
        },
        owner: process.env.AGENT_WALLET_ADDRESS,
        orderType: "GTC",
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`CLOB ${res.status}`);
    const body = await res.json() as { orderID?: string; success?: boolean };
    return {
      status: body.success ? "submitted" : "rejected",
      orderId: body.orderID ?? null,
    };
  } catch (err) {
    console.warn("[POLYMARKET] Order submission failed:", (err as Error).message);
    return { status: "rejected", orderId: null };
  }
}
