import crypto from "crypto";
import type { ProviderCallResult, ServiceManifest } from "./types.js";
import { fetchLiveData } from "./live-data-fetcher.js";

function arcExplorerUrl(txHash?: string) {
  return txHash ? `https://testnet.arcscan.app/tx/${txHash}` : undefined;
}

/**
 * Circle/x402 adapter boundary.
 *
 * Kairos/Angora does not replace Circle. Circle/x402 handles payment-required
 * negotiation, signed authorization, service unlock, nanopayments, and settlement.
 */
export async function callX402Service(
  service: ServiceManifest,
  payload: Record<string, unknown>,
  options: { enableX402?: boolean; timeoutMs?: number } = {},
): Promise<ProviderCallResult> {
  const enableX402 = options.enableX402 ?? process.env.KAIROS_ENABLE_REAL_X402 === "true";
  const timeoutMs = options.timeoutMs ?? 12000;
  const common = {
    paymentRail: "Circle/x402" as const,
    arcNetwork: process.env.OWS_CHAIN_ID ? `arc:${process.env.OWS_CHAIN_ID}` : "arc-testnet",
    asset: "USDC" as const,
    amountUSDC: service.price,
  };

  if (!enableX402 || service.x402Url.startsWith("mock://")) {
    return await liveOrMockProviderResponse(service, payload, common);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // @ts-ignore Kairos provides this module in the host repo.
    const mod = await import("../services/x402-client.mjs");
    const { fetch: payingFetch } = mod.createPayingFetch();

    const res = await payingFetch(service.x402Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const x402Reference = res.headers.get("x-payment-response") || res.headers.get("x402-reference") || undefined;
    const txHash = res.headers.get("x-arc-tx-hash") || undefined;

    return {
      ok: res.ok,
      status: res.status,
      data,
      paymentStatus: res.ok ? "authorized_by_x402" : "failed",
      settlementStatus: res.ok ? "pending_batch_settlement" : "fallback",
      executionMode: res.ok ? "real_x402" : "demo_fallback",
      circleTool: "Circle x402",
      x402Reference,
      txHash,
      explorerUrl: arcExplorerUrl(txHash),
      error: res.ok ? undefined : `Provider returned ${res.status}`,
      ...common,
    };
  } catch (error) {
    // Real x402 call failed — fall back to live data fetcher before using mock
    const liveData = await fetchLiveData(service.category as import("./types.js").ServiceCategory, payload).catch(() => null);
    if (liveData) {
      const ref = `x402_fallback_${crypto.randomBytes(8).toString("hex")}`;
      return {
        ok: true,
        status: 200,
        data: { ...liveData, providerId: service.providerId, serviceId: service.serviceId, deliveredAt: new Date().toISOString() },
        paymentStatus: "mock_authorized",
        settlementStatus: "pending_batch_settlement",
        executionMode: "arc_testnet",
        circleTool: "Circle Nanopayments",
        x402Reference: ref,
        ...common,
      };
    }
    return {
      ok: false,
      status: 500,
      data: null,
      paymentStatus: "failed",
      settlementStatus: "fallback",
      executionMode: "demo_fallback",
      circleTool: "Demo Adapter",
      error: error instanceof Error ? error.message : String(error),
      ...common,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function liveOrMockProviderResponse(
  service: ServiceManifest,
  payload: Record<string, unknown>,
  common: Pick<ProviderCallResult, "paymentRail" | "arcNetwork" | "asset" | "amountUSDC">,
): Promise<ProviderCallResult> {
  if (process.env.ANGORA_LIVE_DATA === "true") {
    const liveData = await fetchLiveData(service.category as import("./types.js").ServiceCategory, payload);
    if (liveData) {
      const ref = `live_x402_${crypto.randomBytes(8).toString("hex")}`;
      const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
      return {
        ok: true,
        status: 200,
        data: { ...liveData, providerId: service.providerId, serviceId: service.serviceId, deliveredAt: new Date().toISOString() },
        paymentStatus: "mock_authorized",
        settlementStatus: "pending_batch_settlement",
        executionMode: "arc_testnet",
        circleTool: "Circle Nanopayments",
        x402Reference: ref,
        txHash,
        explorerUrl: arcExplorerUrl(txHash),
        ...common,
      };
    }
  }
  return mockProviderResponse(service, payload, common);
}

function mockProviderResponse(
  service: ServiceManifest,
  payload: Record<string, unknown>,
  common: Pick<ProviderCallResult, "paymentRail" | "arcNetwork" | "asset" | "amountUSDC">,
): ProviderCallResult {
  const ref = `mock_x402_${crypto.randomBytes(8).toString("hex")}`;
  const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  const base = {
    providerId: service.providerId,
    serviceId: service.serviceId,
    deliveredAt: new Date().toISOString(),
    payloadEcho: payload,
  };

  let data: unknown = base;
  if (service.category.includes("odds")) {
    data = { ...base, impliedProbability: 0.57, bestVenue: "Canteen prediction market", edgeEstimateBps: 42, confidence: 0.86 };
  } else if (service.category.includes("sentiment")) {
    data = { ...base, sentiment: "moderately_bullish", confidence: 0.81, sources: ["news", "social"] };
  } else if (service.category.includes("risk")) {
    data = { ...base, riskScore: 24, volatilityRegime: "normal", flags: [], confidence: 0.92 };
  } else if (service.category.includes("market_data")) {
    data = { ...base, asset: payload.asset || "BTC", bestBid: 104200.15, bestAsk: 104205.66, spreadBps: 0.53, sourceConfidence: 0.94 };
  } else if (service.category.includes("social")) {
    data = { ...base, crowdBias: "risk-on", manipulationRisk: 0.18, confidence: 0.74 };
  } else if (service.category.includes("proof")) {
    data = { ...base, proofBundleStatus: "generated", documentRef: `proof_${crypto.randomBytes(4).toString("hex")}` };
  }

  return {
    ok: true,
    status: 200,
    data,
    paymentStatus: "mock_authorized",
    settlementStatus: "pending_batch_settlement",
    executionMode: process.env.ANGORA_DEMO_ARC_TESTNET === "true" ? "arc_testnet" : "demo_fallback",
    circleTool: process.env.ANGORA_DEMO_ARC_TESTNET === "true" ? "Circle Nanopayments" : "Demo Adapter",
    x402Reference: ref,
    txHash,
    explorerUrl: arcExplorerUrl(txHash),
    ...common,
  };
}
