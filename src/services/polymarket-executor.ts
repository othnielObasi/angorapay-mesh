/**
 * Polymarket Autonomous Execution
 *
 * Builds Kelly-criterion-sized bet intents from agent recommendations and
 * submits real limit orders to Polymarket's CLOB API.
 *
 * Order signing: EIP-712 typed data signed with POLYMARKET_PRIVATE_KEY (Polygon)
 * API auth:      HMAC-SHA256 L2 keys (POLYMARKET_API_KEY / SECRET / PASSPHRASE)
 */

import crypto from "crypto";
import type { MissionRecommendation } from "../angora/agentic/llm-reasoning.js";

const POLYMARKET_CLOB_BASE  = "https://clob.polymarket.com";
const POLYMARKET_GAMMA_BASE = "https://gamma-api.polymarket.com";

// Polymarket CTF Exchange on Polygon mainnet
const CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const;
const POLYGON_CHAIN_ID = 137;

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface PolymarketBetIntent {
  intentId:          string;
  marketQuestion:    string;
  marketId:          string | null;
  conditionId:       string | null;
  tokenId:           string | null;
  side:              "yes" | "no";
  impliedProbability: number;
  marketPrice:       number;
  edgeBps:           number;
  bankrollUsdc:      number;
  kellyFractionPct:  number;
  kellySizeUsdc:     number;
  maxSlippageBps:    number;
  action:            string;
  confidence:        number;
  status:            "constructed" | "submitted" | "skipped" | "rejected";
  submittedOrderId:  string | null;
  rationale:         string;
  marketTarget:      string;
  timestamp:         string;
}

// ── Kelly position sizing ─────────────────────────────────────────────────────
//
// Binary prediction market:
//   marketPrice = current YES token price (market's implied probability)
//   b           = net payoff odds = (1 - marketPrice) / marketPrice
//   p           = our belief (agent confidence / 100)
//   f*          = (b·p - (1−p)) / b
//
// Edge = how much our belief diverges from the market price.

function kellyFractionBinary(ourBelief: number, marketPrice: number): number {
  if (marketPrice <= 0 || marketPrice >= 1) return 0;
  const b = (1 - marketPrice) / marketPrice;
  const q = 1 - ourBelief;
  const raw = (b * ourBelief - q) / b;
  return Math.max(0, Math.min(raw, 0.25));
}

function kellyPositionSizeUSDC(
  ourBelief: number,
  marketPrice: number,
  budgetUsdc: number,
  halfKelly = true,
): number {
  const f   = kellyFractionBinary(ourBelief, marketPrice);
  const frac = halfKelly ? f / 2 : f;
  const raw  = budgetUsdc * frac;
  // Cap: 5% of bankroll, $1 max for demo safety, minimum $0.10 if acting
  return Math.max(0, Math.min(raw, budgetUsdc * 0.05, 1.0));
}

// ── HMAC-SHA256 L2 API auth ───────────────────────────────────────────────────

function polymarketAuthHeaders(
  method: string,
  path: string,
  body: string,
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce     = "0";
  const msg       = timestamp + method.toUpperCase() + path + body;
  const secret    = Buffer.from(process.env.POLYMARKET_API_SECRET ?? "", "base64");
  const sig       = crypto.createHmac("sha256", secret).update(msg).digest("base64");
  return {
    "POLY_ADDRESS":    process.env.POLYMARKET_WALLET_ADDRESS ?? "",
    "POLY_SIGNATURE":  sig,
    "POLY_TIMESTAMP":  timestamp,
    "POLY_NONCE":      nonce,
    "POLY_PASSPHRASE": process.env.POLYMARKET_API_PASSPHRASE ?? "",
    "Content-Type":    "application/json",
  };
}

// ── EIP-712 order signing ─────────────────────────────────────────────────────

async function signPolymarketOrder(orderMsg: {
  salt:           bigint;
  maker:          `0x${string}`;
  signer:         `0x${string}`;
  taker:          `0x${string}`;
  tokenId:        bigint;
  makerAmount:    bigint;
  takerAmount:    bigint;
  expiration:     bigint;
  nonce:          bigint;
  feeRateBps:     bigint;
  side:           number;
  signatureType:  number;
}): Promise<string> {
  const { createWalletClient, http } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");

  const pk      = (process.env.POLYMARKET_PRIVATE_KEY ?? "") as `0x${string}`;
  const account = privateKeyToAccount(pk);

  const walletClient = createWalletClient({
    account,
    chain: {
      id: POLYGON_CHAIN_ID,
      name: "Polygon",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
    } as any,
    transport: http("https://polygon-rpc.com"),
  });

  return walletClient.signTypedData({
    domain: {
      name:              "Polymarket CTF Exchange",
      version:           "1",
      chainId:           POLYGON_CHAIN_ID,
      verifyingContract: CTF_EXCHANGE,
    },
    types: {
      Order: [
        { name: "salt",          type: "uint256" },
        { name: "maker",         type: "address" },
        { name: "signer",        type: "address" },
        { name: "taker",         type: "address" },
        { name: "tokenId",       type: "uint256" },
        { name: "makerAmount",   type: "uint256" },
        { name: "takerAmount",   type: "uint256" },
        { name: "expiration",    type: "uint256" },
        { name: "nonce",         type: "uint256" },
        { name: "feeRateBps",    type: "uint256" },
        { name: "side",          type: "uint8"   },
        { name: "signatureType", type: "uint8"   },
      ],
    },
    primaryType: "Order",
    message: orderMsg,
  });
}

// ── Market lookup ─────────────────────────────────────────────────────────────

interface PolymarketMarket {
  conditionId?:    string;
  id?:             string;
  question?:       string;
  outcomePrices?:  string[];
  volume?:         number;
  active?:         boolean;
  closed?:         boolean;
  tokens?:         Array<{ token_id?: string; outcome?: string; price?: number }>;
}

async function findRelevantMarket(marketTarget: string): Promise<PolymarketMarket | null> {
  try {
    const res = await fetch(
      `${POLYMARKET_GAMMA_BASE}/markets?closed=false&limit=50&order=volume&ascending=false`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;

    const markets = await res.json() as PolymarketMarket[];
    if (!Array.isArray(markets)) return null;

    // Generic words that appear in sports/unrelated markets — exclude from scoring.
    const NOISE_WORDS = new Set(["cross", "venue", "spread", "market", "price", "check", "odds", "rate", "target", "year", "end", "whether", "will", "the", "for", "approval"]);

    // Include short tokens like "ETF", "SOL", "BTC" (length > 2) so tickers match.
    const keywords = marketTarget.toLowerCase().split(/\s+/)
      .filter((w) => w.length > 2 && !NOISE_WORDS.has(w));

    // If no meaningful keywords remain (e.g. generic mission descriptions), skip.
    if (keywords.length === 0) return null;

    // Only score against crypto/financial/macro markets — reject sports/entertainment.
    const CRYPTO_FIN_SIGNALS = ["bitcoin", "btc", "ethereum", "eth", "crypto", "solana", "sol", "fed", "rate", "etf", "price", "coinbase", "usd", "defi", "nft", "token", "inflation", "recession"];
    const scored = markets
      .filter((m) => m.active && !m.closed && m.question)
      .filter((m) => CRYPTO_FIN_SIGNALS.some((sig) => (m.question ?? "").toLowerCase().includes(sig)))
      .map((m) => ({
        market: m,
        score: keywords.reduce((a, kw) => a + ((m.question ?? "").toLowerCase().includes(kw) ? 1 : 0), 0),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (b.market.volume ?? 0) - (a.market.volume ?? 0));

    // Return null when nothing matches — never fall back to a random market.
    return scored[0]?.market ?? null;
  } catch {
    return null;
  }
}

// ── CLOB order submission ─────────────────────────────────────────────────────

async function submitPolymarketOrder(intent: PolymarketBetIntent): Promise<{ status: "submitted" | "rejected"; orderId: string | null }> {
  const pk      = process.env.POLYMARKET_PRIVATE_KEY;
  const apiKey  = process.env.POLYMARKET_API_KEY;
  const walletAddr = (process.env.POLYMARKET_WALLET_ADDRESS ?? "") as `0x${string}`;

  if (!pk || !apiKey || !intent.tokenId || intent.kellySizeUsdc < 0.01) {
    return { status: "rejected", orderId: null };
  }

  try {
    const marketPrice  = intent.marketPrice;
    const usdcAmount   = intent.kellySizeUsdc;
    const makerAmount  = BigInt(Math.round(usdcAmount * 1e6));
    const takerAmount  = BigInt(Math.round((usdcAmount / marketPrice) * 1e6));
    const salt         = BigInt(Date.now());
    const taker        = "0x0000000000000000000000000000000000000000" as `0x${string}`;
    const sideNum      = intent.side === "yes" ? 0 : 1; // 0 = BUY, 1 = SELL

    const orderMsg = {
      salt,
      maker:         walletAddr,
      signer:        walletAddr,
      taker,
      tokenId:       BigInt(intent.tokenId),
      makerAmount,
      takerAmount,
      expiration:    BigInt(0),
      nonce:         BigInt(0),
      feeRateBps:    BigInt(0),
      side:          sideNum,
      signatureType: 0,
    };

    const signature = await signPolymarketOrder(orderMsg);

    const body = JSON.stringify({
      order: {
        salt:          salt.toString(),
        maker:         walletAddr,
        signer:        walletAddr,
        taker,
        tokenId:       intent.tokenId,
        makerAmount:   makerAmount.toString(),
        takerAmount:   takerAmount.toString(),
        expiration:    "0",
        nonce:         "0",
        feeRateBps:    "0",
        side:          intent.side === "yes" ? "BUY" : "SELL",
        signatureType: 0,
        signature,
      },
      owner:     walletAddr,
      orderType: "GTC",
    });

    const path = "/order";
    const res = await fetch(`${POLYMARKET_CLOB_BASE}${path}`, {
      method:  "POST",
      headers: polymarketAuthHeaders("POST", path, body),
      body,
      signal:  AbortSignal.timeout(10000),
    });

    const data = await res.json() as { orderID?: string; success?: boolean; errorMsg?: string };
    console.log(`[POLYMARKET] Order submission: status=${res.status} success=${data.success} orderId=${data.orderID ?? "—"} err=${data.errorMsg ?? "—"}`);

    return {
      status:  data.success ? "submitted" : "rejected",
      orderId: data.orderID ?? null,
    };
  } catch (err) {
    console.warn("[POLYMARKET] Order submission failed:", (err as Error).message?.slice(0, 100));
    return { status: "rejected", orderId: null };
  }
}

// ── Core bet intent builder ───────────────────────────────────────────────────

export async function buildPolymarketBetIntent(
  recommendation: MissionRecommendation,
  liveOddsData:   Record<string, unknown> | null,
  marketTarget:   string,
  budgetUsdc:     string,
): Promise<PolymarketBetIntent> {
  const intentId = `pm_intent_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const bankroll  = Math.max(parseFloat(budgetUsdc) || 0.05, 0.05);
  const action    = recommendation.action;
  const confidence = recommendation.confidence;

  const shouldAct =
    (action === "enter_small" && confidence >= 70) ||
    (action === "enter"       && confidence >= 78) ||
    (action === "monitor"     && confidence >= 80);

  if (!shouldAct) {
    return {
      intentId, marketQuestion: marketTarget, marketId: null,
      conditionId: null, tokenId: null, side: "yes",
      impliedProbability: confidence / 100, marketPrice: 0.5,
      edgeBps: 0, bankrollUsdc: bankroll,
      kellyFractionPct: 0, kellySizeUsdc: 0, maxSlippageBps: 50,
      action, confidence, status: "skipped", submittedOrderId: null,
      rationale: `Action "${action}" at ${confidence}% confidence is below autonomous execution threshold`,
      marketTarget, timestamp: new Date().toISOString(),
    };
  }

  // Market price from live Polymarket data (what we'd pay per YES token)
  const marketPrice: number =
    typeof liveOddsData?.impliedProbability === "number"
      ? Math.max(0.01, Math.min(0.99, liveOddsData.impliedProbability as number))
      : 0.5;

  // Our belief from agent confidence
  const agentBelief = Math.min(0.95, confidence / 100);
  const edgeBps     = Math.round(Math.abs(agentBelief - marketPrice) * 10000);
  const side: "yes" | "no" = agentBelief > marketPrice ? "yes" : "no";

  const kellySizeUsdc = kellyPositionSizeUSDC(agentBelief, marketPrice, bankroll, action !== "enter");

  // Look up live market and YES token ID
  const market   = await findRelevantMarket(marketTarget);
  const yesToken = market?.tokens?.find((t) => (t.outcome ?? "").toLowerCase() === "yes");
  const noToken  = market?.tokens?.find((t)  => (t.outcome ?? "").toLowerCase() === "no");
  const tokenId  = (side === "yes" ? yesToken?.token_id : noToken?.token_id) ?? null;

  const intent: PolymarketBetIntent = {
    intentId,
    marketQuestion:     market?.question ?? marketTarget,
    marketId:           market?.id ?? null,
    conditionId:        market?.conditionId ?? null,
    tokenId,
    side,
    impliedProbability: agentBelief,
    marketPrice,
    edgeBps,
    bankrollUsdc:       bankroll,
    kellyFractionPct:   Math.round((kellySizeUsdc / bankroll) * 1000) / 10,
    kellySizeUsdc:      Math.round(kellySizeUsdc * 10000) / 10000,
    maxSlippageBps:     50,
    action,
    confidence,
    status:             "constructed",
    submittedOrderId:   null,
    rationale: [
      `${confidence}% confidence → ${action}`,
      `Agent belief ${(agentBelief * 100).toFixed(1)}% vs market ${(marketPrice * 100).toFixed(1)}%`,
      `Edge ${edgeBps} bps → ${side.toUpperCase()} bet`,
      `Kelly: ${(kellySizeUsdc / bankroll * 100).toFixed(1)}% of budget = $${kellySizeUsdc.toFixed(4)} USDC`,
    ].join(" | "),
    marketTarget,
    timestamp: new Date().toISOString(),
  };

  // Submit if we have credentials and a real token ID
  if (process.env.POLYMARKET_API_KEY && tokenId && kellySizeUsdc >= 0.01) {
    const result = await submitPolymarketOrder(intent);
    intent.status           = result.status;
    intent.submittedOrderId = result.orderId;
    console.log(`[POLYMARKET] Intent ${intentId}: ${result.status} orderId=${result.orderId ?? "—"}`);
  } else {
    const reason = !process.env.POLYMARKET_API_KEY ? "no API key"
      : !tokenId ? "no tokenId found"
      : `kelly size $${kellySizeUsdc.toFixed(4)} < $0.01 minimum`;
    console.log(`[POLYMARKET] Skipping submission: ${reason}`);
  }

  return intent;
}
