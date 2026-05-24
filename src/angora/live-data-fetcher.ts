import type { ServiceCategory } from "./types.js";

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeAsset(raw: unknown): string {
  return String(raw || "ETH").replace(/\/USDC|\/USD/i, "").toUpperCase().trim();
}

function krakenPair(asset: string): string {
  const map: Record<string, string> = { BTC: "XBTUSDC", ETH: "ETHUSDC", SOL: "SOLUSDC", MATIC: "MATICUSDC" };
  return map[asset] ?? `${asset}USDC`;
}

async function fetchLiveOdds(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const asset = normalizeAsset(payload.asset ?? payload.marketContext);
  const res = await fetchWithTimeout(
    "https://gamma-api.polymarket.com/markets?closed=false&limit=100&order=volume&ascending=false"
  );
  if (!res.ok) throw new Error(`Polymarket ${res.status}`);
  const markets = await res.json() as Array<{ question?: string; outcomePrices?: string[]; volume?: number; liquidity?: number }>;
  const relevant = markets.filter(m =>
    m.question && (
      m.question.toUpperCase().includes(asset) ||
      m.question.toLowerCase().includes("crypto") ||
      m.question.toLowerCase().includes("bitcoin") ||
      m.question.toLowerCase().includes("ethereum")
    )
  );
  const market = relevant[0] ?? markets[0];
  if (!market) throw new Error("No Polymarket data");
  const probability = market.outcomePrices ? Number(market.outcomePrices[0]) : 0.5;
  return {
    source: "polymarket",
    market: market.question,
    impliedProbability: Number(probability.toFixed(4)),
    bestVenue: "Polymarket",
    edgeEstimateBps: Math.round(Math.abs(probability - 0.5) * 200),
    confidence: Number(Math.min(0.95, 0.6 + (market.liquidity ?? 0) / 100000).toFixed(3)),
    volume: market.volume ?? 0,
    liquidity: market.liquidity ?? 0,
  };
}

async function fetchLiveMarketData(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const asset = normalizeAsset(payload.asset);
  const pair = krakenPair(asset);
  const res = await fetchWithTimeout(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
  if (!res.ok) throw new Error(`Kraken ${res.status}`);
  const json = await res.json() as { result?: Record<string, { b?: string[]; a?: string[]; h?: string[]; l?: string[]; v?: string[] }> };
  const result = json.result ? Object.values(json.result)[0] : null;
  if (!result) throw new Error("No Kraken ticker data");
  const bid = Number(result.b?.[0] ?? 0);
  const ask = Number(result.a?.[0] ?? 0);
  const spreadBps = bid > 0 ? Math.round(((ask - bid) / bid) * 10000) : 5;
  return {
    source: "kraken",
    asset: pair,
    bestBid: bid,
    bestAsk: ask,
    spreadBps,
    high24h: Number(result.h?.[1] ?? 0),
    low24h: Number(result.l?.[1] ?? 0),
    volume24h: Number(result.v?.[1] ?? 0),
    sourceConfidence: 0.97,
  };
}

async function fetchLiveSentiment(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const asset = normalizeAsset(payload.asset);
  const res = await fetchWithTimeout("https://api.alternative.me/fng/?limit=3");
  if (!res.ok) throw new Error(`FNG API ${res.status}`);
  const fng = await res.json() as { data?: Array<{ value?: string; value_classification?: string }> };
  const current = fng.data?.[0];
  const fngValue = Number(current?.value ?? 50);
  const sentiment = fngValue >= 60 ? "bullish" : fngValue >= 45 ? "neutral" : "bearish";
  return {
    source: "alternative.me",
    asset,
    sentiment,
    fearGreedIndex: fngValue,
    fearGreedLabel: current?.value_classification ?? "Neutral",
    confidence: Number(Math.min(0.92, 0.5 + Math.abs(fngValue - 50) / 100).toFixed(3)),
    sources: ["fear_greed_index", "market_momentum"],
  };
}

async function fetchLiveRisk(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const asset = normalizeAsset(payload.asset);
  const pair = krakenPair(asset);
  const since = Math.floor(Date.now() / 1000) - 86400;
  const res = await fetchWithTimeout(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=60&since=${since}`);
  if (!res.ok) throw new Error(`Kraken OHLC ${res.status}`);
  const json = await res.json() as { result?: Record<string, Array<[number, string, string, string, string, string, string, number]>> };
  const ohlc = json.result ? Object.values(json.result).find(v => Array.isArray(v)) : null;
  if (!ohlc || ohlc.length < 5) throw new Error("Insufficient OHLC data");
  const closes = ohlc.map(c => Number(c[4]));
  const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  const annualizedVol = Math.sqrt(variance) * Math.sqrt(8760) * 100;
  const riskScore = Math.min(100, Math.round(annualizedVol * 1.5));
  const volatilityRegime = annualizedVol > 80 ? "high" : annualizedVol > 40 ? "elevated" : "normal";
  return {
    source: "kraken_ohlc",
    asset: pair,
    riskScore,
    volatilityRegime,
    annualizedVolatilityPct: Number(annualizedVol.toFixed(1)),
    flags: riskScore > 70 ? ["high_volatility"] : [],
    confidence: 0.91,
  };
}

async function fetchLiveSocial(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const asset = normalizeAsset(payload.asset);
  const res = await fetchWithTimeout("https://api.alternative.me/fng/?limit=7");
  if (!res.ok) throw new Error(`FNG API ${res.status}`);
  const fng = await res.json() as { data?: Array<{ value?: string }> };
  const values = (fng.data ?? []).map(d => Number(d.value ?? 50));
  const current = values[0] ?? 50;
  const weekAvg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  const crowdBias = current > weekAvg + 5 ? "risk-on" : current < weekAvg - 5 ? "risk-off" : "neutral";
  return {
    source: "alternative.me",
    asset,
    crowdBias,
    fearGreedIndex: current,
    weeklyAvg: Math.round(weekAvg),
    manipulationRisk: Number(Math.max(0, Math.min(1, Math.abs(current - 50) / 100)).toFixed(2)),
    confidence: 0.77,
  };
}

interface KalshiMarket {
  ticker?: string;
  title?: string;
  yes_ask_dollars?: string;
  yes_bid_dollars?: string;
  liquidity_dollars?: string;
  volume_24h_fp?: string;
  open_interest_fp?: string;
  status?: string;
  close_time?: string;
}

async function fetchKalshiOdds(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const asset = normalizeAsset(payload.asset ?? payload.marketContext ?? "BTC");
  const cryptoKeywords = [
    asset.toLowerCase(),
    "bitcoin", "btc", "ethereum", "eth", "crypto",
    "fed rate", "interest rate", "cpi", "inflation",
    "recession", "gdp", "employment",
  ];

  const res = await fetchWithTimeout(
    "https://trading-api.kalshi.com/trade-api/v2/markets?limit=200&status=active",
    10000,
  );
  if (!res.ok) throw new Error(`Kalshi API ${res.status}`);
  const json = await res.json() as { markets?: KalshiMarket[] };
  if (!json.markets?.length) throw new Error("No Kalshi markets");

  const relevant = json.markets
    .filter((m) => cryptoKeywords.some((kw) => m.title?.toLowerCase().includes(kw)))
    .sort((a, b) => Number(b.liquidity_dollars ?? 0) - Number(a.liquidity_dollars ?? 0));

  const market = relevant[0] ?? null;
  if (!market) {
    // Fall back to most liquid active market if no keyword match (still real Kalshi data)
    const fallback = [...json.markets].sort(
      (a, b) => Number(b.liquidity_dollars ?? 0) - Number(a.liquidity_dollars ?? 0),
    )[0];
    if (!fallback) throw new Error("No Kalshi markets available");
    const yesBid = Number(fallback.yes_bid_dollars ?? 0);
    const yesAsk = Number(fallback.yes_ask_dollars ?? 0);
    const midPrice = (yesBid + yesAsk) / 2;
    return {
      source: "kalshi",
      market: fallback.title,
      ticker: fallback.ticker,
      yesBid, yesAsk,
      impliedProbability: midPrice,
      liquidity: Number(fallback.liquidity_dollars ?? 0),
      volume24h: Number(fallback.volume_24h_fp ?? 0),
      closeTime: fallback.close_time,
      divergenceBps: null,
      confidence: 0.72,
      note: "No crypto/macro keyword match — showing most liquid active Kalshi market",
    };
  }

  const yesBid = Number(market.yes_bid_dollars ?? 0);
  const yesAsk = Number(market.yes_ask_dollars ?? 0);
  const midPrice = (yesBid + yesAsk) / 2;

  return {
    source: "kalshi",
    market: market.title,
    ticker: market.ticker,
    yesBid,
    yesAsk,
    impliedProbability: Number(midPrice.toFixed(4)),
    liquidity: Number(market.liquidity_dollars ?? 0),
    volume24h: Number(market.volume_24h_fp ?? 0),
    openInterest: Number(market.open_interest_fp ?? 0),
    closeTime: market.close_time,
    divergenceBps: null, // filled in by LLM reasoning when Polymarket data is also present
    confidence: 0.93,
  };
}

async function fetchLiveArbitrage(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const asset = normalizeAsset(payload.asset);
  const pair = krakenPair(asset);
  const cgId = asset === "BTC" ? "bitcoin" : asset === "ETH" ? "ethereum" : asset.toLowerCase();
  const [krakenRes, cgRes] = await Promise.allSettled([
    fetchWithTimeout(`https://api.kraken.com/0/public/Ticker?pair=${pair}`),
    fetchWithTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`),
  ]);
  let krakenPrice = 0;
  let cgPrice = 0;
  if (krakenRes.status === "fulfilled" && krakenRes.value.ok) {
    const json = await krakenRes.value.json() as { result?: Record<string, { b?: string[] }> };
    krakenPrice = json.result ? Number(Object.values(json.result)[0]?.b?.[0] ?? 0) : 0;
  }
  if (cgRes.status === "fulfilled" && cgRes.value.ok) {
    const json = await cgRes.value.json() as Record<string, { usd?: number }>;
    cgPrice = json[cgId]?.usd ?? 0;
  }
  const bothAvailable = krakenPrice > 0 && cgPrice > 0;
  const spreadPct = bothAvailable ? Math.abs(krakenPrice - cgPrice) / ((krakenPrice + cgPrice) / 2) * 100 : 0;
  const opportunityBps = Math.round(spreadPct * 100);
  return {
    source: "kraken_vs_coingecko",
    asset,
    krakenPrice,
    coingeckoPrice: cgPrice,
    spreadPct: Number(spreadPct.toFixed(4)),
    opportunityBps,
    venueA: "Kraken",
    venueB: "CoinGecko",
    feasible: opportunityBps > 15 && opportunityBps < 500,
    confidence: bothAvailable ? 0.88 : 0.45,
  };
}

export async function fetchLiveData(
  category: ServiceCategory,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  try {
    switch (category) {
      case "odds":        return await fetchLiveOdds(payload);
      case "kalshi_odds": return await fetchKalshiOdds(payload);
      case "market_data": return await fetchLiveMarketData(payload);
      case "sentiment":   return await fetchLiveSentiment(payload);
      case "risk":        return await fetchLiveRisk(payload);
      case "social":      return await fetchLiveSocial(payload);
      case "arbitrage":   return await fetchLiveArbitrage(payload);
      default:            return null;
    }
  } catch {
    return null;
  }
}
