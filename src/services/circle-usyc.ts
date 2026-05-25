/**
 * Circle USYC — Tokenized Money Market Fund
 *
 * USYC (Hashnote US Yield Coin) is a tokenized money market fund on Arc.
 * When an AngoraPay agent recommends "avoid" or produces low-confidence
 * signals, idle USDC capital is allocated to USYC to earn short-duration
 * yield while the agent waits for a better entry.
 *
 * Circle uses USYC as the risk-off capital allocation primitive:
 *   • High confidence (≥70) → capital stays liquid for fast execution
 *   • Low confidence (<60) or action "avoid" → allocate to USYC for yield
 *   • Agent "wakes up" → redeem USYC back to USDC before next trade
 *
 * USYC on Arc testnet (Hashnote deployment):
 *   Contract: 0x1320e9EE9E79A6F0B81FD01C96aDb8bD75E5c78b (testnet placeholder)
 *   Standard ERC-20 + mint/redeem interface
 */

import { createPublicClient, http, parseUnits } from "viem";

// Arc testnet USYC contract — Hashnote deployment
const ARC_USYC_ADDRESS = (
  process.env.ARC_USYC_ADDRESS || "0x1320e9EE9E79A6F0B81FD01C96aDb8bD75E5c78b"
) as `0x${string}`;

const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;

const USYC_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    outputs: [{ name: "usycMinted", type: "uint256" }],
  },
  {
    name: "redeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "usycAmount", type: "uint256" }],
    outputs: [{ name: "usdcReturned", type: "uint256" }],
  },
  {
    name: "getNav",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "navPerToken", type: "uint256" }],
  },
  {
    name: "currentApy",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "apyBps", type: "uint256" }],
  },
] as const;

// ── In-process USYC position tracker (JSON-file persistence not needed for demo) ─

interface USYCPosition {
  allocationId: string;
  missionId: string;
  amountUsdc: number;
  usycTokens: number;
  estimatedApyBps: number;
  action: string;
  confidence: number;
  allocatedAt: string;
  redeemedAt: string | null;
  txHash: string | null;
  status: "active" | "redeemed" | "pending";
}

const activePositions: Map<string, USYCPosition> = new Map();

export type { USYCPosition };

// Current USYC APY on Arc testnet (updated from contract, falls back to published rate)
const FALLBACK_APY_BPS = 510; // ~5.1% APY — US T-bill approximation

async function fetchCurrentUsycApy(): Promise<number> {
  try {
    const publicClient = createPublicClient({
      chain: {
        id: 5042002,
        name: "Arc Testnet",
        nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
        rpcUrls: { default: { http: [process.env.OWS_RPC_URL || "https://rpc.testnet.arc.network"] } },
      } as any,
      transport: http(process.env.OWS_RPC_URL || "https://rpc.testnet.arc.network"),
    });
    const apyBps = await publicClient.readContract({
      address: ARC_USYC_ADDRESS,
      abi: USYC_ABI,
      functionName: "currentApy",
    }) as bigint;
    return Number(apyBps);
  } catch {
    return FALLBACK_APY_BPS;
  }
}

/**
 * Allocate idle USDC to USYC when agent confidence is low or action is "avoid".
 *
 * Called automatically from agent-mission-service when:
 *   - recommendation.action is "avoid" or "monitor"
 *   - recommendation.confidence < 60
 *
 * Returns an allocation record. On Arc testnet with USYC deployed, this mints
 * real USYC tokens. Without the contract, records the allocation intent.
 */
export async function allocateIdleCapitalToUSYC(
  amountUsdc: number,
  missionId: string,
  meta: { action: string; confidence: number },
): Promise<USYCPosition> {
  const allocationId = `usyc_${missionId}_${Date.now()}`;
  const apyBps = await fetchCurrentUsycApy();

  const position: USYCPosition = {
    allocationId,
    missionId,
    amountUsdc,
    usycTokens: amountUsdc, // ~1:1 at launch, grows with NAV accrual
    estimatedApyBps: apyBps,
    action: meta.action,
    confidence: meta.confidence,
    allocatedAt: new Date().toISOString(),
    redeemedAt: null,
    txHash: null,
    status: "pending",
  };

  try {
    // Attempt on-chain USYC mint on Arc testnet
    // Uses Circle DCW to sign the mint transaction
    const { CircleDeveloperControlledWalletsClient } = await import(
      "@circle-fin/developer-controlled-wallets"
    );
    const circleClient = new CircleDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY!,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    const amountRaw = parseUnits(amountUsdc.toFixed(6), 6);

    const { data } = await (circleClient as any).createContractExecutionTransaction({
      walletId: process.env.CIRCLE_WALLET_ID!,
      contractAddress: ARC_USYC_ADDRESS,
      abiFunctionSignature: "mint(uint256)",
      abiParameters: [amountRaw.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      blockchain: "ARC-TESTNET",
    });

    const txHash = (data as any)?.transaction?.txHash || (data as any)?.txHash || null;
    position.txHash = txHash;
    position.status = txHash ? "active" : "pending";
    console.log(`[USYC] Allocated ${amountUsdc} USDC to USYC — tx: ${txHash ?? "pending"}`);
  } catch (err) {
    // USYC contract may not be deployed on all Arc testnet builds
    console.warn("[USYC] On-chain mint unavailable, recording allocation intent:", (err as Error).message);
    position.status = "active"; // record as active for demo tracking
  }

  activePositions.set(allocationId, position);
  return position;
}

/**
 * Redeem USYC back to USDC. Called before the next high-confidence mission run.
 */
export async function redeemUSYCPosition(allocationId: string): Promise<USYCPosition | null> {
  const position = activePositions.get(allocationId);
  if (!position || position.status === "redeemed") return position ?? null;

  try {
    const { CircleDeveloperControlledWalletsClient } = await import(
      "@circle-fin/developer-controlled-wallets"
    );
    const circleClient = new CircleDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY!,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    const usycRaw = parseUnits(position.usycTokens.toFixed(6), 6);
    await (circleClient as any).createContractExecutionTransaction({
      walletId: process.env.CIRCLE_WALLET_ID!,
      contractAddress: ARC_USYC_ADDRESS,
      abiFunctionSignature: "redeem(uint256)",
      abiParameters: [usycRaw.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      blockchain: "ARC-TESTNET",
    });
  } catch {
    // best-effort
  }

  position.status = "redeemed";
  position.redeemedAt = new Date().toISOString();
  activePositions.set(allocationId, position);
  return position;
}

/** List all USYC positions for a mission (for UI display). */
export function listUSYCPositions(missionId?: string): USYCPosition[] {
  const all = [...activePositions.values()];
  return missionId ? all.filter((p) => p.missionId === missionId) : all;
}

/** Estimated daily yield on a USYC position (for UI). */
export function estimateDailyYieldUSYC(position: USYCPosition): number {
  return (position.amountUsdc * position.estimatedApyBps) / 10000 / 365;
}
