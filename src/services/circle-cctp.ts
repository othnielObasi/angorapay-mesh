/**
 * Circle CCTP v2 — Cross-Chain Transfer Protocol
 *
 * CCTP enables native USDC to move across blockchains in a single atomic
 * operation: burn on the source chain → Circle attests the burn → mint on
 * the destination chain. No bridging risk; Circle guarantees the mint.
 *
 * Used by the cross_venue_arbitrage agent when a trade opportunity spans
 * multiple chains (e.g., Arc testnet → Base Sepolia → Sepolia).
 *
 * Sources:
 *   developers.circle.com/stablecoins/docs/cctp-getting-started
 *   iris-api-sandbox.circle.com  (attestation API, testnet)
 *   iris-api.circle.com          (attestation API, mainnet)
 */

import { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData, decodeEventLog } from "viem";
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";

// ── Chain definitions ─────────────────────────────────────────────────────────

const ARC_TESTNET = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.OWS_RPC_URL || "https://rpc.testnet.arc.network"] } },
} as const;

// Destination testnet chains for cross-venue arbitrage
export const CCTP_DESTINATIONS = {
  "base-sepolia": {
    id: 84532,
    name: "Base Sepolia",
    domain: 6,
    rpcUrl: "https://sepolia.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
    messageTransmitter: "0x7865fAfC2db2093669d92c0197e5d6f4Bf30Cf3" as `0x${string}`,
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5" as `0x${string}`,
  },
  "sepolia": {
    id: 11155111,
    name: "Sepolia",
    domain: 0,
    rpcUrl: "https://rpc.sepolia.org",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
    messageTransmitter: "0x26413e8157CD32011E726065a5462e97dD4d03D9" as `0x${string}`,
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5" as `0x${string}`,
  },
} as const;

export type CctpDestinationChain = keyof typeof CCTP_DESTINATIONS;

// ── Arc testnet CCTP contracts (Circle deploys on own chain) ──────────────────

// Arc testnet domain ID — Circle's own chain, CCTP-enabled
const ARC_TESTNET_DOMAIN = 9;
const ARC_USDC = "0x3600000000000000000000000000000000000000" as `0x${string}`;

// Arc testnet CCTP contracts — deployed by Circle
// Addresses match Circle's standard CCTP deployment pattern
const ARC_TOKEN_MESSENGER = (process.env.ARC_CCTP_TOKEN_MESSENGER ||
  "0xBd3fa81B58Ba92a82136038B25aDec7066af3155") as `0x${string}`;

const ARC_MESSAGE_TRANSMITTER = (process.env.ARC_CCTP_MESSAGE_TRANSMITTER ||
  "0x0a992d191DEeC32aFe36203Ad87D7d289a738F81") as `0x${string}`;

// ── ABI snippets ──────────────────────────────────────────────────────────────

const TOKEN_MESSENGER_ABI = [
  {
    name: "depositForBurn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
    ],
    outputs: [{ name: "nonce", type: "uint64" }],
  },
] as const;

const USDC_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const CIRCLE_ATTESTATION_API = process.env.CIRCLE_API_KEY?.startsWith("TEST_")
  ? "https://iris-api-sandbox.circle.com"
  : "https://iris-api.circle.com";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CctpBridgeResult {
  burnTxHash: string | null;
  attestation: string | null;
  mintTxHash: string | null;
  destinationChain: CctpDestinationChain;
  destinationDomain: number;
  amountUsdc: number;
  recipientAddress: string;
  status:
    | "burn_pending"
    | "awaiting_attestation"
    | "attestation_ready"
    | "minted"
    | "failed";
  nonce: string | null;
}

// ── Address helpers ───────────────────────────────────────────────────────────

function addressToBytes32(address: `0x${string}`): `0x${string}` {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}` as `0x${string}`;
}

// ── Signer resolution ─────────────────────────────────────────────────────────

function resolveArcWallet() {
  const mnemonic = process.env.OWS_MNEMONIC || process.env.X402_MNEMONIC;
  const pk = process.env.NANOPAYMENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (mnemonic) {
    const account = mnemonicToAccount(mnemonic);
    return createWalletClient({ account, chain: ARC_TESTNET as any, transport: http() });
  }
  if (pk) {
    const key = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
    const account = privateKeyToAccount(key);
    return createWalletClient({ account, chain: ARC_TESTNET as any, transport: http() });
  }
  return null;
}

// ── Core CCTP bridge function ─────────────────────────────────────────────────

/**
 * Bridge USDC from Arc testnet to another testnet chain via Circle CCTP v2.
 *
 * Flow:
 *   1. Approve TokenMessenger to spend USDC on Arc
 *   2. Call depositForBurn → burns USDC on Arc, emits MessageSent event
 *   3. Fetch Circle attestation for the burn message
 *   4. Caller can then relay attestation to destination chain's MessageTransmitter
 *
 * Used by cross_venue_arbitrage to settle trades across chains.
 */
export async function bridgeUSDCViaCircleCCTP(
  destinationChain: CctpDestinationChain,
  amountUsdc: number,
  recipientAddress: `0x${string}`,
): Promise<CctpBridgeResult> {
  const dest = CCTP_DESTINATIONS[destinationChain];
  const base: Omit<CctpBridgeResult, "burnTxHash" | "attestation" | "mintTxHash" | "nonce"> = {
    destinationChain,
    destinationDomain: dest.domain,
    amountUsdc,
    recipientAddress,
    status: "failed",
  };

  const wallet = resolveArcWallet();
  if (!wallet) {
    console.warn("[CCTP] No Arc signer configured — CCTP bridge unavailable");
    return { ...base, burnTxHash: null, attestation: null, mintTxHash: null, nonce: null };
  }

  const publicClient = createPublicClient({
    chain: ARC_TESTNET as any,
    transport: http(process.env.OWS_RPC_URL || "https://rpc.testnet.arc.network"),
  });

  try {
    const amountRaw = parseUnits(amountUsdc.toFixed(6), 6);
    const mintRecipientBytes32 = addressToBytes32(recipientAddress);

    // Step 1 — Approve TokenMessenger to pull USDC
    const approveHash = await wallet.writeContract({
      address: ARC_USDC,
      abi: USDC_APPROVE_ABI,
      functionName: "approve",
      args: [ARC_TOKEN_MESSENGER, amountRaw],
      chain: ARC_TESTNET as any,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    // Step 2 — Burn USDC via CCTP TokenMessenger
    const burnHash = await wallet.writeContract({
      address: ARC_TOKEN_MESSENGER,
      abi: TOKEN_MESSENGER_ABI,
      functionName: "depositForBurn",
      args: [amountRaw, dest.domain, mintRecipientBytes32, ARC_USDC],
      chain: ARC_TESTNET as any,
    });

    console.log(`[CCTP] Burn submitted: ${burnHash} → ${destinationChain}`);

    // Step 3 — Fetch Circle attestation (off-chain, usually ~20s on testnet)
    const attestation = await fetchCctpAttestation(burnHash);

    return {
      burnTxHash: burnHash,
      attestation: attestation?.attestation ?? null,
      mintTxHash: null, // recipient calls receiveMessage on destination
      nonce: attestation?.nonce ?? null,
      destinationChain,
      destinationDomain: dest.domain,
      amountUsdc,
      recipientAddress,
      status: attestation ? "attestation_ready" : "awaiting_attestation",
    };
  } catch (err) {
    console.warn("[CCTP] Bridge failed:", (err as Error).message);
    return {
      ...base, burnTxHash: null, attestation: null, mintTxHash: null, nonce: null,
    };
  }
}

async function fetchCctpAttestation(
  txHash: `0x${string}`,
  maxAttempts = 8,
  delayMs = 3000,
): Promise<{ attestation: string; nonce: string } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${CIRCLE_ATTESTATION_API}/v1/attestations/${txHash}`);
      if (res.ok) {
        const body = await res.json() as { attestation?: string; status?: string; eventNonce?: string };
        if (body.attestation && body.attestation !== "PENDING") {
          return { attestation: body.attestation, nonce: body.eventNonce || "0" };
        }
      }
    } catch {
      // not ready yet
    }
    if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

/**
 * Lightweight cross-chain arbitrage settlement record — used when CCTP
 * contracts aren't deployed on the local Arc testnet build but the
 * agent still needs to record that a cross-chain settlement was intended.
 */
export function buildCctpSettlementRecord(
  destinationChain: CctpDestinationChain,
  amountUsdc: number,
  recipientAddress: string,
  missionId: string,
): Omit<CctpBridgeResult, "burnTxHash" | "mintTxHash" | "attestation"> & {
  mode: "simulation";
  missionId: string;
} {
  return {
    destinationChain,
    destinationDomain: CCTP_DESTINATIONS[destinationChain].domain,
    amountUsdc,
    recipientAddress,
    nonce: null,
    status: "burn_pending",
    mode: "simulation",
    missionId,
  };
}
