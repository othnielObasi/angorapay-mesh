import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { ServiceManifest, ServiceCategory } from "./types.js";

const LIVE_DATA_SOURCES: Partial<Record<ServiceCategory, string[]>> = {
  odds:        ["Polymarket Gamma API"],
  kalshi_odds: ["Kalshi REST API (trading-api.kalshi.com)"],
  sentiment:   ["Alternative.me Fear & Greed Index"],
  risk:        ["Kraken OHLC"],
  market_data: ["Kraken Ticker"],
  social:      ["Alternative.me Fear & Greed Index"],
  arbitrage:   ["Kraken Ticker", "CoinGecko simple price"],
};

function realX402Enabled() { return process.env.ANGORA_ENABLE_REAL_X402 === "true"; }
function liveDataEnabled()  { return process.env.ANGORA_LIVE_DATA === "true"; }
function paidMarketplaceSignerConfigured() {
  const mnemonicSigner = Boolean(process.env.OWS_MNEMONIC || process.env.X402_MNEMONIC);
  const circleWalletChain = (process.env.CIRCLE_WALLET_BLOCKCHAIN || "").toLowerCase();
  const circlePolygonSigner = Boolean(
    process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET &&
    process.env.CIRCLE_WALLET_ID && process.env.AGENT_WALLET_ADDRESS &&
    (circleWalletChain.includes("polygon") || circleWalletChain.includes("matic")),
  );
  return mnemonicSigner || circlePolygonSigner;
}

export function providerRuntime(service: ServiceManifest) {
  const marketplaceProvider  = !service.x402Url.startsWith("mock://");
  const freeMarketplaceProvider = marketplaceProvider && Number(service.price) === 0;
  const liveSources = LIVE_DATA_SOURCES[service.category] ?? [];
  const realX402Ready   = marketplaceProvider && !freeMarketplaceProvider && realX402Enabled() && paidMarketplaceSignerConfigured();
  const liveDataReady   = !marketplaceProvider && liveDataEnabled() && liveSources.length > 0;
  const routeable       = freeMarketplaceProvider || realX402Ready || !marketplaceProvider;
  const mode = freeMarketplaceProvider ? "live_free"
    : realX402Ready ? "real_x402"
    : marketplaceProvider ? "unavailable_x402"
    : liveDataReady ? "live_data_adapter"
    : "demo_fallback";
  return {
    marketplaceProvider, routeable, mode,
    live: freeMarketplaceProvider || realX402Ready || liveDataReady,
    liveSources, realX402Ready, liveDataReady,
    fallbackOnly: !freeMarketplaceProvider && !realX402Ready && !liveDataReady,
    reason: freeMarketplaceProvider
      ? "Free marketplace provider endpoint is routeable without x402 payment."
      : realX402Ready
      ? "Real x402 provider endpoint is enabled with a configured signer."
      : marketplaceProvider
      ? "Marketplace endpoint is listed but not routeable until ANGORA_ENABLE_REAL_X402 and a compatible signer are configured."
      : liveDataReady
      ? `Built-in provider is backed by ${liveSources.join(", ")} when ANGORA_LIVE_DATA=true.`
      : "Built-in provider is routeable through deterministic demo fallback until live data is enabled.",
  };
}

export function enrichServiceRuntime(service: ServiceManifest) {
  return { ...service, runtime: providerRuntime(service) };
}

// Circle Agent Marketplace providers (agents.circle.com/services)
// These use real x402 payment-gated endpoints — active when KAIROS_ENABLE_REAL_X402=true.
const CIRCLE_MARKETPLACE_SERVICES: ServiceManifest[] = [
  {
    serviceId: "blockrun-polymarket-odds",
    providerId: "blockrun",
    name: "BlockRun — Polymarket Odds",
    category: "odds",
    description: "Live Polymarket prediction market odds via Circle Agent Marketplace. $0.001 USDC per call on Arc testnet.",
    price: "0.001",
    currency: "USDC",
    x402Url: "https://nano.blockrun.ai/v1/polymarket/markets",
    proofRequired: true,
    verified: true,
    trustScore: 96,
    avgLatencyMs: 320,
    policyTags: ["prediction_market", "odds", "proof_enabled", "circle_marketplace", "polymarket"],
    rfpTracks: ["RFP 02 - Prediction Market Trader Intelligence", "RFP 03 - Prediction Market Verticals"],
    inputSchema: { market: "string", limit: "number" },
    outputSchema: { impliedProbability: "number", bestVenue: "string", confidence: "number" },
  },
  {
    serviceId: "blockrun-kalshi-odds",
    providerId: "blockrun",
    name: "BlockRun — Kalshi Odds",
    category: "kalshi_odds",
    description: "Live Kalshi regulated prediction market odds via Circle Agent Marketplace. Enables cross-market divergence detection vs Polymarket. $0.001 USDC per call on Arc testnet.",
    price: "0.001",
    currency: "USDC",
    x402Url: "https://trading-api.kalshi.com/trade-api/v2/markets",
    proofRequired: true,
    verified: true,
    trustScore: 95,
    avgLatencyMs: 350,
    policyTags: ["prediction_market", "kalshi_odds", "proof_enabled", "circle_marketplace", "kalshi", "regulated"],
    rfpTracks: ["RFP 02 - Prediction Market Trader Intelligence", "RFP 03 - Prediction Market Verticals"],
    inputSchema: { event: "string", asset: "string" },
    outputSchema: { impliedProbability: "number", divergenceBps: "number", kalshiMarket: "string", confidence: "number" },
  },
  {
    serviceId: "quicknode-market-data",
    providerId: "quicknode",
    name: "QuickNode — Blockchain Market Data",
    category: "market_data",
    description: "On-chain market data and token pricing via QuickNode x402 API on Circle Marketplace. $0.0001 USDC per call.",
    price: "0.0001",
    currency: "USDC",
    x402Url: "https://x402.api.quicknode.com/addon/v1/market/prices",
    proofRequired: true,
    verified: true,
    trustScore: 97,
    avgLatencyMs: 180,
    policyTags: ["market_data", "on_chain", "low_latency", "proof_enabled", "circle_marketplace"],
    rfpTracks: ["RFP 01 - Perpetual Futures Trading Agent", "RFP 04 - Adaptive Portfolio Manager", "RFP 05 - Cross-Platform Arbitrage Agent"],
    inputSchema: { asset: "string", chain: "string" },
    outputSchema: { asset: "string", price: "number", source: "string" },
  },
];

const SERVICES: ServiceManifest[] = [
  {
    serviceId: "prediction-market-odds",
    providerId: "oddsnode",
    name: "Prediction Market Odds API",
    category: "odds",
    description: "Paid odds and implied-probability snapshot for prediction-market trader agents.",
    price: "0.004",
    currency: "USDC",
    x402Url: "mock://oddsnode/prediction-market-odds",
    proofRequired: true,
    verified: true,
    trustScore: 94,
    avgLatencyMs: 280,
    policyTags: ["prediction_market", "odds", "proof_enabled", "low_latency"],
    rfpTracks: ["RFP 02 - Prediction Market Trader Intelligence", "RFP 03 - Prediction Market Verticals"],
    inputSchema: { market: "string", horizon: "string" },
    outputSchema: { impliedProbability: "number", bestVenue: "string", confidence: "number" },
  },
  {
    serviceId: "news-sentiment-feed",
    providerId: "sentimentmesh",
    name: "News Sentiment Feed",
    category: "sentiment",
    description: "Paid news and social sentiment signal for market agents evaluating noisy events.",
    price: "0.005",
    currency: "USDC",
    x402Url: "mock://sentimentmesh/news-sentiment",
    proofRequired: true,
    verified: true,
    trustScore: 91,
    avgLatencyMs: 520,
    policyTags: ["sentiment", "news", "market_signal", "proof_enabled"],
    rfpTracks: ["RFP 02 - Prediction Market Trader Intelligence", "RFP 03 - Prediction Market Verticals", "RFP 06 - Social Trading Intelligence"],
    inputSchema: { market: "string", asset: "string", timeframe: "string" },
    outputSchema: { sentiment: "string", confidence: "number", sources: "array" },
  },
  {
    serviceId: "volatility-signal-engine",
    providerId: "volguard",
    name: "Volatility Signal Engine",
    category: "risk",
    description: "Paid volatility and execution-risk signal before a market-moving agent action.",
    price: "0.006",
    currency: "USDC",
    x402Url: "mock://volguard/volatility-signal",
    proofRequired: true,
    verified: true,
    trustScore: 92,
    avgLatencyMs: 450,
    policyTags: ["risk", "volatility", "execution_readiness", "proof_enabled"],
    rfpTracks: ["RFP 01 - Perpetual Futures Trading Agent", "RFP 02 - Prediction Market Trader Intelligence", "RFP 04 - Adaptive Portfolio Manager", "RFP 05 - Cross-Platform Arbitrage Agent"],
    inputSchema: { market: "string", signal: "string", confidence: "number" },
    outputSchema: { riskScore: "number", volatilityRegime: "string", flags: "array" },
  },
  {
    serviceId: "cross-venue-price-feed",
    providerId: "pricegrid",
    name: "Cross-Venue Price Feed",
    category: "market_data",
    description: "Paid cross-venue price and liquidity snapshot for arbitrage and portfolio agents.",
    price: "0.003",
    currency: "USDC",
    x402Url: "mock://pricegrid/cross-venue-price",
    proofRequired: true,
    verified: true,
    trustScore: 93,
    avgLatencyMs: 310,
    policyTags: ["market_data", "arbitrage", "low_latency", "proof_enabled"],
    rfpTracks: ["RFP 01 - Perpetual Futures Trading Agent", "RFP 04 - Adaptive Portfolio Manager", "RFP 05 - Cross-Platform Arbitrage Agent"],
    inputSchema: { asset: "string", venues: "array" },
    outputSchema: { asset: "string", bestBid: "number", bestAsk: "number", spreadBps: "number" },
  },
  {
    serviceId: "social-trading-intelligence",
    providerId: "socialalpha",
    name: "Social Trading Intelligence",
    category: "social",
    description: "Paid signal quality and crowd-positioning analysis for social trading agents.",
    price: "0.004",
    currency: "USDC",
    x402Url: "mock://socialalpha/trading-intel",
    proofRequired: true,
    verified: true,
    trustScore: 89,
    avgLatencyMs: 640,
    policyTags: ["social", "trading_intelligence", "proof_enabled"],
    rfpTracks: ["RFP 06 - Social Trading Intelligence", "RFP 02 - Prediction Market Trader Intelligence"],
    inputSchema: { asset: "string", community: "string" },
    outputSchema: { crowdBias: "string", confidence: "number", manipulationRisk: "number" },
  },
  {
    serviceId: "perps-funding-basis-feed",
    providerId: "futurescope",
    name: "Perps Funding + Basis Feed",
    category: "perps",
    description: "Funding, basis, and liquidation-pressure signal for perpetual futures agents.",
    price: "0.006",
    currency: "USDC",
    x402Url: "mock://futurescope/perps-funding-basis",
    proofRequired: true,
    verified: true,
    trustScore: 90,
    avgLatencyMs: 360,
    policyTags: ["perps", "funding", "basis", "risk"],
    rfpTracks: ["RFP 01 - Perpetual Futures Trading Agent"],
    inputSchema: { asset: "string", venue: "string", timeframe: "string" },
    outputSchema: { fundingRate: "number", basisBps: "number", liquidationRisk: "number" },
  },
  {
    serviceId: "adaptive-portfolio-risk",
    providerId: "portfolioguard",
    name: "Adaptive Portfolio Risk Check",
    category: "portfolio",
    description: "Paid portfolio risk and rebalance-readiness service for adaptive portfolio agents.",
    price: "0.007",
    currency: "USDC",
    x402Url: "mock://portfolioguard/adaptive-risk",
    proofRequired: true,
    verified: true,
    trustScore: 88,
    avgLatencyMs: 700,
    policyTags: ["portfolio", "rebalance", "risk", "proof_enabled"],
    rfpTracks: ["RFP 04 - Adaptive Portfolio Manager"],
    inputSchema: { portfolio: "array", constraints: "object" },
    outputSchema: { rebalanceNeeded: "boolean", riskDelta: "number", recommendedCaps: "object" },
  },
  {
    serviceId: "arbitrage-route-scanner",
    providerId: "spreadseer",
    name: "Cross-Platform Arbitrage Scanner",
    category: "arbitrage",
    description: "Paid arbitrage opportunity scanner across venues, fees, latency, and liquidity.",
    price: "0.008",
    currency: "USDC",
    x402Url: "mock://spreadseer/arbitrage-scan",
    proofRequired: true,
    verified: true,
    trustScore: 90,
    avgLatencyMs: 340,
    policyTags: ["arbitrage", "cross_platform", "market_data", "proof_enabled"],
    rfpTracks: ["RFP 05 - Cross-Platform Arbitrage Agent"],
    inputSchema: { asset: "string", venues: "array", feeModel: "object" },
    outputSchema: { opportunityBps: "number", venueA: "string", venueB: "string", feasible: "boolean" },
  },
  {
    serviceId: "vertical-market-creator-kit",
    providerId: "marketmakerkit",
    name: "Prediction Market Vertical Creator Kit",
    category: "creator",
    description: "Paid vertical-market research and question-building pack for domain prediction markets.",
    price: "0.004",
    currency: "USDC",
    x402Url: "mock://marketmakerkit/vertical-creator",
    proofRequired: true,
    verified: true,
    trustScore: 87,
    avgLatencyMs: 820,
    policyTags: ["prediction_market", "verticals", "creator", "proof_enabled"],
    rfpTracks: ["RFP 03 - Prediction Market Verticals"],
    inputSchema: { vertical: "string", topic: "string" },
    outputSchema: { marketQuestion: "string", resolutionSource: "string", riskNotes: "array" },
  },
  {
    serviceId: "proof-bundle-writer",
    providerId: "proofsmith",
    name: "Proof Bundle Writer",
    category: "proof",
    description: "Creates proof bundle metadata for agent service calls and market-decision evidence.",
    price: "0.001",
    currency: "USDC",
    x402Url: "mock://proofsmith/proof-bundle",
    proofRequired: true,
    verified: true,
    trustScore: 97,
    avgLatencyMs: 190,
    policyTags: ["proof", "audit", "receipt_bundle"],
    rfpTracks: ["RFP 01 - Perpetual Futures Trading Agent", "RFP 02 - Prediction Market Trader Intelligence", "RFP 03 - Prediction Market Verticals", "RFP 04 - Adaptive Portfolio Manager", "RFP 05 - Cross-Platform Arbitrage Agent", "RFP 06 - Social Trading Intelligence"],
    inputSchema: { receiptId: "string", missionId: "string" },
    outputSchema: { proofBundleStatus: "string", documentRef: "string" },
  },
  {
    serviceId: "unverified-alpha-signal",
    providerId: "unknown-alpha",
    name: "Unverified Alpha Signal",
    category: "research",
    description: "Deliberately blocked demo service to show provider trust filtering.",
    price: "0.002",
    currency: "USDC",
    x402Url: "mock://unknown-alpha/signal",
    proofRequired: false,
    verified: false,
    trustScore: 41,
    avgLatencyMs: 120,
    policyTags: ["unverified", "blocked_demo"],
    rfpTracks: ["RFP 06 - Social Trading Intelligence"],
    inputSchema: { asset: "string" },
    outputSchema: { signal: "string" },
  },
];

const CUSTOM_SERVICES_FILE = stateFile("custom-provider-services.json");
function loadCustomServices(): ServiceManifest[] { return readJsonFile<ServiceManifest[]>(CUSTOM_SERVICES_FILE, []); }
function saveCustomServices(rows: ServiceManifest[]) { writeJsonFile(CUSTOM_SERVICES_FILE, rows); }

/** Lists Circle marketplace, built-in demo, and tenant/provider-registered services. */
export function listServices(): ServiceManifest[] {
  return [...CIRCLE_MARKETPLACE_SERVICES, ...SERVICES, ...loadCustomServices()];
}

/** Registers or updates a provider service without requiring a redeploy. */
export function registerProviderService(service: ServiceManifest): ServiceManifest {
  const rows = loadCustomServices();
  const index = rows.findIndex((row) => row.serviceId === service.serviceId);
  if (index >= 0) rows[index] = service;
  else rows.unshift(service);
  saveCustomServices(rows);
  return service;
}

/** Performs lightweight validation before a provider becomes routeable. */
export function validateProviderService(service: ServiceManifest) {
  const issues: string[] = [];
  if (!service.serviceId) issues.push("serviceId is required");
  if (!service.providerId) issues.push("providerId is required");
  if (!service.x402Url) issues.push("x402Url is required");
  if (Number.isNaN(Number(service.price)) || Number(service.price) < 0) issues.push("price must be a valid non-negative USDC amount");
  if (!service.proofRequired) issues.push("proofRequired should be true for production market-intelligence services");
  if (service.trustScore < 0 || service.trustScore > 100) issues.push("trustScore must be between 0 and 100");
  return { ok: issues.length === 0, issues };
}

export function searchServices(input: {
  category?: string;
  maxPrice?: string;
  requireVerified?: boolean;
  minTrustScore?: number;
  rfpTrack?: string;
}): ServiceManifest[] {
  const max = input.maxPrice ? Number(input.maxPrice) : Number.POSITIVE_INFINITY;
  const minTrust = input.minTrustScore ?? 0;
  const category = (input.category || "").toLowerCase();
  const rfpTrack = input.rfpTrack || "";

  return listServices()
    .filter((service) => !category || service.category.toLowerCase() === category || service.category.toLowerCase().includes(category) || service.policyTags.some((tag) => tag.toLowerCase().includes(category)))
    .filter((service) => !rfpTrack || service.rfpTracks.includes(rfpTrack as never))
    .filter((service) => Number(service.price) <= max)
    .filter((service) => !input.requireVerified || service.verified)
    .filter((service) => service.trustScore >= minTrust)
    .sort((a, b) => b.trustScore - a.trustScore || Number(a.price) - Number(b.price));
}

export function categoriesForRfp(rfpTrack: string): ServiceCategory[] {
  const categories = new Set<ServiceCategory>();
  listServices().filter((service) => service.rfpTracks.includes(rfpTrack as never)).forEach((service) => categories.add(service.category));
  return [...categories];
}
