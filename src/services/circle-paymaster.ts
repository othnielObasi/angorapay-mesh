/**
 * Circle Paymaster — USDC Gas Abstraction
 *
 * Circle's Paymaster enables agent transactions to pay gas fees in USDC,
 * removing the need to hold volatile gas tokens (ETH/MATIC/etc.) alongside
 * the agent's USDC treasury. Every agent transaction cost is denominated
 * in the same stablecoin the agent is trading.
 *
 * On Arc testnet, gas is natively paid in USDC — but on destination chains
 * (Sepolia, Base Sepolia) reached via CCTP, the Paymaster sponsors gas.
 *
 * Integration points:
 *   • CCTP bridge transactions on destination chains — Paymaster covers gas
 *   • Any agent action on non-Arc chains during cross-venue arbitrage
 *
 * Circle Paymaster API: POST /v1/w3s/paymaster/sponsorUserOp
 * ERC-4337 UserOperation sponsorship — gas paid in USDC from agent wallet
 */

const CIRCLE_API_BASE = process.env.CIRCLE_API_KEY?.startsWith("TEST_")
  ? "https://api-sandbox.circle.com"
  : "https://api.circle.com";

// Arc-native USDC Paymaster (gas is native USDC, no sponsorship needed)
// This Paymaster activates for destination chain transactions post-CCTP
const PAYMASTER_ADDRESS_BASE_SEPOLIA = (
  process.env.PAYMASTER_ADDRESS_BASE_SEPOLIA || "0x00000000000000000000000000000000000DEAD0"
) as `0x${string}`;

const PAYMASTER_ADDRESS_SEPOLIA = (
  process.env.PAYMASTER_ADDRESS_SEPOLIA || "0x00000000000000000000000000000000000DEAD1"
) as `0x${string}`;

export interface PaymasterSponsorshipResult {
  sponsored: boolean;
  paymasterAddress: string | null;
  userOpHash: string | null;
  feeUSDC: number;
  gasSponsorMode: "circle_paymaster" | "arc_native" | "unsupported";
  chain: string;
}

export interface UserOpRequest {
  sender: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  signature?: string;
}

/**
 * Sponsor a UserOperation via Circle Paymaster.
 * On Arc testnet, gas is native USDC — Paymaster activates for cross-chain ops.
 */
export async function sponsorTransactionWithCirclePaymaster(
  chain: "arc-testnet" | "base-sepolia" | "sepolia",
  userOp: UserOpRequest,
): Promise<PaymasterSponsorshipResult> {
  // Arc testnet uses native USDC gas — no Paymaster needed
  if (chain === "arc-testnet") {
    return {
      sponsored: true,
      paymasterAddress: null,
      userOpHash: null,
      feeUSDC: 0.01, // Arc ~$0.01 per transaction in native USDC
      gasSponsorMode: "arc_native",
      chain,
    };
  }

  const paymasterAddress =
    chain === "base-sepolia" ? PAYMASTER_ADDRESS_BASE_SEPOLIA : PAYMASTER_ADDRESS_SEPOLIA;

  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) {
    return {
      sponsored: false,
      paymasterAddress: null,
      userOpHash: null,
      feeUSDC: 0,
      gasSponsorMode: "unsupported",
      chain,
    };
  }

  try {
    const res = await fetch(`${CIRCLE_API_BASE}/v1/w3s/paymaster/sponsorUserOp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userOperation: userOp,
        entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        chainId: chain === "base-sepolia" ? 84532 : 11155111,
        paymasterContext: {
          type: "CIRCLE_PAYMASTER",
          paymentToken: "USDC",
          walletId: process.env.CIRCLE_WALLET_ID,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Paymaster ${res.status}`);
    }

    const body = await res.json() as {
      data?: {
        paymasterAndData?: string;
        userOpHash?: string;
        preVerificationGas?: string;
        estimatedFeeUsdc?: string;
      };
    };

    const data = body.data;
    return {
      sponsored: Boolean(data?.paymasterAndData),
      paymasterAddress,
      userOpHash: data?.userOpHash ?? null,
      feeUSDC: parseFloat(data?.estimatedFeeUsdc ?? "0.01"),
      gasSponsorMode: "circle_paymaster",
      chain,
    };
  } catch (err) {
    console.warn("[PAYMASTER] Sponsorship request failed:", (err as Error).message);
    return {
      sponsored: false,
      paymasterAddress,
      userOpHash: null,
      feeUSDC: 0,
      gasSponsorMode: "unsupported",
      chain,
    };
  }
}

/**
 * Build a minimal ERC-4337 UserOperation for an agent action.
 * Used when the agent executes a cross-chain action and needs gas sponsorship.
 */
export function buildUserOperation(
  sender: string,
  callData: string,
  options: { gasLimit?: string } = {},
): UserOpRequest {
  return {
    sender,
    callData,
    callGasLimit: options.gasLimit || "0x100000",
    verificationGasLimit: "0x20000",
    preVerificationGas: "0xC000",
    maxFeePerGas: "0x174876E800", // 100 gwei
    maxPriorityFeePerGas: "0x3B9ACA00", // 1 gwei
  };
}

/**
 * Estimate USDC gas cost for an agent action on a given chain.
 * Arc testnet is always ~$0.01 native USDC.
 */
export function estimateGasCostUSDC(chain: string): number {
  if (chain === "arc-testnet") return 0.01;
  if (chain === "base-sepolia") return 0.015;
  if (chain === "sepolia") return 0.05;
  return 0.02;
}
