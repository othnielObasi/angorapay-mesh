// src/services/nanopayments.ts
// ───────────────────────────────────────────────────────────────────────────────
// Circle Nanopayments via Gateway — real USDC micro-transfers on Arc testnet.
//
// Payment path priority (first available wins):
//   1. Circle Gateway Transfer API — batched nanopayment settlement, gas-free
//      for sub-$0.01 amounts. Uses /v1/w3s/developer/transactions/transfer.
//   2. Circle DCW contract execution — direct ERC-20 transfer via Circle
//      Developer-Controlled Wallets (fallback when Gateway API unavailable).
//   3. viem EOA mnemonic — raw Arc wallet transfer (final fallback).
//
// Every governance stage and compute event sends a real USDC micro-transfer
// on Arc testnet, producing a genuine on-chain transaction visible on ArcScan.
//
// NEVER throws — billing is fire-and-forget. Governance logic is always
// unaffected by billing outcomes.
// ───────────────────────────────────────────────────────────────────────────────

import { createPublicClient, createWalletClient, http, parseUnits, getAddress, type Hash } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { sendGatewayNanopayment, resolveGatewayTransferHash } from './circle-gateway.js';

// ── Arc Testnet chain definition ─────────────────────────────────────────────
const ARC_RPC   = process.env.OWS_RPC_URL || 'https://rpc.testnet.arc.network';
const ARC_CHAIN = {
  id:             5042002,
  name:           'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls:        { default: { http: [ARC_RPC] } },
} as const;

// Arc USDC ERC-20 contract (also the native gas token)
const ARC_USDC = '0x3600000000000000000000000000000000000000';

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ── Configuration ────────────────────────────────────────────────────────────

export const NANO_AMOUNT = parseFloat(
  process.env.NANOPAYMENT_AMOUNT_USDC || '0.001'
);

export const TRACK4_SETTLEMENT_AMOUNT = parseFloat(
  process.env.TRACK4_SETTLEMENT_AMOUNT_USDC || '0.009'
);

/** Governance billing address — receives nanopayment USDC on each stage */
const BILLING_ADDRESS = getAddress(
  process.env.GOVERNANCE_BILLING_ADDRESS || process.env.AGENT_WALLET_ADDRESS || '0x0000000000000000000000000000000000000001'
);

/** Track 4 settlement address — receives Arc USDC micro-commerce receipts */
const TRACK4_SETTLEMENT_ADDRESS = getAddress(
  process.env.MICRO_COMMERCE_SETTLEMENT_ADDRESS
  || process.env.GOVERNANCE_BILLING_ADDRESS
  || process.env.AGENT_WALLET_ADDRESS
  || '0x0000000000000000000000000000000000000001'
);

// ── Receipt type ─────────────────────────────────────────────────────────────

export interface NanopaymentReceipt {
  eventName:   string;
  source?:     string;
  model?:      string;
  type?:       string;  // 'governance' | 'data' | 'inference' | 'reflection'
  mode?:       string;  // 'x402' | 'nanopayment' | 'fallback'
  txHash:      string;
  referenceId?: string;
  verificationState?: 'confirmed' | 'pending' | 'fallback';
  amount:      number;
  confirmedAt: number;
}

interface TransferResult {
  txHash: Hash | null;
  referenceId: string | null;
}

export function hasVerifiedTxHash(receipt: Pick<NanopaymentReceipt, 'txHash'>): boolean {
  return typeof receipt.txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(receipt.txHash);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveCircleTransactionHash(transactionId: string): Promise<Hash | null> {
  if (!circleClient) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { data } = await circleClient.getTransaction({ id: transactionId } as any);
      const txHash = (data as any)?.transaction?.txHash || (data as any)?.txHash || null;
      if (txHash && /^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return txHash as Hash;
      }
    } catch (error) {
      if (attempt === 4) {
        console.warn(`[NANO] Failed to resolve Circle txHash for ${transactionId}:`, (error as Error).message || error);
      }
    }

    await sleep(1500);
  }

  return null;
}

async function hydrateCircleReceipt(receipt: NanopaymentReceipt): Promise<void> {
  if (!receipt.referenceId || hasVerifiedTxHash(receipt)) return;

  const resolved = await resolveCircleTransactionHash(receipt.referenceId);
  if (resolved) {
    receipt.txHash = resolved;
    receipt.verificationState = 'confirmed';
  }
}

// ── Signer initialisation ────────────────────────────────────────────────────
// Prefer Circle Wallets (DCW) → fallback to OWS_MNEMONIC → fallback to PRIVATE_KEY.
// We use viem directly (not ethers) so we get first-class Arc chain support
// without fighting ethers.js provider quirks.

let arcWallet: any = null;
let arcPublic: any = null;
let circleWalletMode = false;

// Circle DCW — imported lazily so the module loads even without the package
let circleClient: any = null;

async function ensureSigner(): Promise<boolean> {
  if (arcWallet) return true;

  // ── Path 1: Circle Developer-Controlled Wallets ─────────────────────────
  if (process.env.CIRCLE_API_KEY && process.env.CIRCLE_WALLET_ID) {
    try {
      const { CircleDeveloperControlledWalletsClient } = await import(
        '@circle-fin/developer-controlled-wallets'
      );
      circleClient = new CircleDeveloperControlledWalletsClient({
        apiKey:       process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
      });
      circleWalletMode = true;

      // We still need a viem public client for gas estimation / receipts
      arcPublic = createPublicClient({ chain: ARC_CHAIN as any, transport: http(ARC_RPC) });
      console.log('[NANO] Circle Wallets signer active for Arc nanopayments');
      return true;
    } catch (e) {
      console.warn('[NANO] Circle Wallets init failed — trying mnemonic fallback', e);
    }
  }

  // ── Path 2: BIP-39 Mnemonic (OWS_MNEMONIC) ─────────────────────────────
  const mnemonic = process.env.OWS_MNEMONIC;
  if (mnemonic) {
    try {
      const account = mnemonicToAccount(mnemonic);
      arcWallet = createWalletClient({ account, chain: ARC_CHAIN as any, transport: http(ARC_RPC) });
      arcPublic = createPublicClient({ chain: ARC_CHAIN as any, transport: http(ARC_RPC) });
      console.log(`[NANO] Mnemonic signer active for Arc nanopayments (${account.address})`);
      return true;
    } catch (e) {
      console.warn('[NANO] Mnemonic signer failed', e);
    }
  }

  // ── Path 3: Raw private key ─────────────────────────────────────────────
  const pk = process.env.NANOPAYMENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (pk) {
    try {
      const key = (pk.startsWith('0x') ? pk : `0x${pk}`) as `0x${string}`;
      const account = privateKeyToAccount(key);
      arcWallet = createWalletClient({ account, chain: ARC_CHAIN as any, transport: http(ARC_RPC) });
      arcPublic = createPublicClient({ chain: ARC_CHAIN as any, transport: http(ARC_RPC) });
      console.log(`[NANO] PK signer active for Arc nanopayments (${account.address})`);
      return true;
    } catch (e) {
      console.warn('[NANO] PK signer failed', e);
    }
  }

  console.warn('[NANO] No signer available — nanopayments will be stub-only');
  return false;
}

// ── Core transfer function ───────────────────────────────────────────────────

async function sendUSDCTransfer(to: string, amountUsdc: number): Promise<TransferResult> {
  // USDC on Arc has 6 decimals for ERC-20 transfers
  const amountRaw = parseUnits(amountUsdc.toFixed(6), 6);

  // ── Circle DCW path ─────────────────────────────────────────────────────
  if (circleWalletMode && circleClient) {
    const { data } = await circleClient.createContractExecutionTransaction({
      walletId:             process.env.CIRCLE_WALLET_ID!,
      contractAddress:      ARC_USDC,
      abiFunctionSignature: 'transfer(address,uint256)',
      abiParameters:        [to, amountRaw.toString()],
      fee:                  { type: 'level', config: { feeLevel: 'LOW' } },
      blockchain:           'ARC-TESTNET',
    } as any);
    const txHash = (data as any)?.transaction?.txHash || (data as any)?.txHash || null;
    const referenceId = (data as any)?.transaction?.id
      || (data as any)?.transactionId
      || (data as any)?.id
      || null;
    return {
      txHash: txHash && /^0x[a-fA-F0-9]{64}$/.test(txHash) ? txHash as Hash : null,
      referenceId,
    };
  }

  // ── viem EOA path ───────────────────────────────────────────────────────
  if (!arcWallet) throw new Error('No Arc signer available');
  const hash = await arcWallet.writeContract({
    address: ARC_USDC as `0x${string}`,
    abi:     ERC20_ABI,
    functionName: 'transfer',
    args: [getAddress(to), amountRaw],
    chain: ARC_CHAIN,
  });
  return {
    txHash: hash,
    referenceId: hash,
  };
}

async function createSettlementReceipt(
  eventName: string,
  to: string,
  amountUsdc: number,
  meta: {
    source?: string;
    model?: string;
    type?: string;
    mode?: string;
  } = {},
  waitForVerifiedHash = false,
): Promise<NanopaymentReceipt> {
  // ── Path 1: Circle Gateway Transfer API (nanopayment batch settlement) ──────
  // Gas-free for sub-$0.01 amounts; routed through Circle Gateway infrastructure
  if (process.env.CIRCLE_API_KEY && process.env.CIRCLE_WALLET_ID) {
    const gwResult = await sendGatewayNanopayment(to, amountUsdc, {
      eventName,
      type: (meta.type || 'governance') as 'governance' | 'data' | 'inference' | 'settlement',
    });

    if (gwResult.mode === 'gateway') {
      const receipt: NanopaymentReceipt = {
        eventName,
        ...meta,
        mode: 'circle-gateway',
        txHash: gwResult.txHash ?? `gw_pending_${gwResult.transferId ?? Date.now()}`,
        referenceId: gwResult.transferId ?? undefined,
        verificationState: gwResult.txHash ? 'confirmed' : 'pending',
        amount: amountUsdc,
        confirmedAt: Date.now(),
      };
      // Hydrate txHash async if pending
      if (!gwResult.txHash && gwResult.transferId) {
        void resolveGatewayTransferHash(gwResult.transferId).then((hash) => {
          if (hash) {
            receipt.txHash = hash;
            receipt.verificationState = 'confirmed';
          }
        });
      }
      return receipt;
    }
  }

  // ── Path 2: Circle DCW contract execution (direct ERC-20 transfer) ──────────
  const ready = await ensureSigner();
  if (!ready) throw new Error('no signer');

  const transfer = await sendUSDCTransfer(to, amountUsdc);
  let txHash = transfer.txHash;

  if (waitForVerifiedHash && circleWalletMode && transfer.referenceId && !txHash) {
    txHash = await resolveCircleTransactionHash(transfer.referenceId);
  }

  const receipt: NanopaymentReceipt = {
    eventName,
    ...meta,
    mode: meta.mode || (circleWalletMode ? 'circle-wallets' : 'nanopayment'),
    txHash: txHash ?? `pending_${transfer.referenceId ?? Date.now()}`,
    referenceId: transfer.referenceId ?? undefined,
    verificationState: txHash ? 'confirmed' : 'pending',
    amount: amountUsdc,
    confirmedAt: Date.now(),
  };

  if (circleWalletMode && transfer.referenceId && !txHash) {
    void hydrateCircleReceipt(receipt);
  }

  return receipt;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Bill a governance or compute event via a real USDC micro-transfer on Arc.
 * NEVER throws — billing failure returns a pending receipt.
 * Governance logic is always unaffected by billing outcomes.
 */
export async function billEvent(
  eventName: string,
  meta: {
    source?: string;
    model?:  string;
    type?:   string;
    mode?:   string;
  } = {}
): Promise<NanopaymentReceipt> {
  try {
    return await createSettlementReceipt(eventName, BILLING_ADDRESS, NANO_AMOUNT, meta);
  } catch (err) {
    // Log but never block — return pending receipt
    console.warn(`[NANO] billEvent failed (${eventName}):`, (err as Error).message || err);
    return {
      eventName,
      ...meta,
      mode:        'fallback',
      txHash:      'pending_' + Date.now(),
      verificationState: 'fallback',
      amount:      NANO_AMOUNT,
      confirmedAt: Date.now(),
    };
  }
}

export async function settleMicroCommerceEvent(
  eventName: string,
  meta: {
    source?: string;
    model?: string;
    type?: string;
  } = {},
): Promise<NanopaymentReceipt> {
  try {
    return await createSettlementReceipt(
      eventName,
      TRACK4_SETTLEMENT_ADDRESS,
      TRACK4_SETTLEMENT_AMOUNT,
      {
        ...meta,
        type: meta.type || 'micro-commerce',
      },
      true,
    );
  } catch (err) {
    console.warn(`[NANO] settleMicroCommerceEvent failed (${eventName}):`, (err as Error).message || err);
    return {
      eventName,
      ...meta,
      type: meta.type || 'micro-commerce',
      mode: 'fallback',
      txHash: 'pending_' + Date.now(),
      verificationState: 'fallback',
      amount: TRACK4_SETTLEMENT_AMOUNT,
      confirmedAt: Date.now(),
    };
  }
}

export async function settleCommerceEventAmount(
  eventName: string,
  amountUsdc: number,
  meta: {
    source?: string;
    model?: string;
    type?: string;
  } = {},
): Promise<NanopaymentReceipt> {
  try {
    return await createSettlementReceipt(
      eventName,
      TRACK4_SETTLEMENT_ADDRESS,
      amountUsdc,
      {
        ...meta,
        type: meta.type || 'micro-commerce',
      },
      true,
    );
  } catch (err) {
    console.warn(`[NANO] settleCommerceEventAmount failed (${eventName}):`, (err as Error).message || err);
    return {
      eventName,
      ...meta,
      type: meta.type || 'micro-commerce',
      mode: 'fallback',
      txHash: 'pending_' + Date.now(),
      verificationState: 'fallback',
      amount: amountUsdc,
      confirmedAt: Date.now(),
    };
  }
}

// ── Transaction count helper for demo proof ──────────────────────────────────

/** Return the total number of real (non-pending) nanopayment tx hashes seen. */
export function getRealTxCount(receipts: NanopaymentReceipt[]): number {
  return receipts.filter(hasVerifiedTxHash).length;
}

// ───────────────────────────────────────────────────────────────────────────────
