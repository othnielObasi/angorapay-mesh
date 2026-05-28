import type { AgentMissionInput, AgentMissionType, AgentProviderDecision, AgentContextPacket } from "./types.js";
import type { ServiceCategory } from "../types.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const VALID_MODULES: AgentMissionType[] = ["prediction_market", "cross_venue_arbitrage", "social_trading"];

export interface LlmMissionPlan {
  specialistAgent: AgentMissionType;
  asset?: string;
  marketTarget?: string;
  rationale: string;
  riskFlags: string[];
  source: "openai" | "deterministic_fallback";
  model?: string;
}

export interface MissionRecommendation {
  action: string;
  confidence: number;
  summary: string;
  reasons: string[];
  guardrail: string;
}

export interface LlmRecommendationResult {
  recommendation: MissionRecommendation;
  source: "openai" | "deterministic_fallback";
  model?: string;
  error?: string;
}

interface OpenAiConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

function getOpenAiConfig(): OpenAiConfig | null {
  if (process.env.ANGORA_LLM_ENABLED === "false") return null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    model: process.env.ANGORA_LLM_MODEL || DEFAULT_MODEL,
    timeoutMs: Number(process.env.ANGORA_LLM_TIMEOUT_MS || 12000),
  };
}

function clampConfidence(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function stringArray(value: unknown, fallback: string[], maxItems = 5): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, maxItems);
  return cleaned.length ? cleaned : fallback;
}

function cleanText(value: unknown, fallback: string, maxLength = 700): string {
  const text = String(value || "").trim();
  return (text || fallback).slice(0, maxLength);
}

async function callOpenAiJson<T>(input: { config: OpenAiConfig; system: string; user: Record<string, unknown>; responseName: string }): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.config.timeoutMs);
  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${input.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: JSON.stringify(input.user) },
        ],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI ${input.responseName} failed with ${response.status}: ${body.slice(0, 240)}`);
    }
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error(`OpenAI ${input.responseName} returned no content`);
    return JSON.parse(content) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function buildLlmMissionPlan(input: {
  mission: AgentMissionInput;
  deterministicModule: AgentMissionType;
  allowedCategories: ServiceCategory[];
}): Promise<LlmMissionPlan | null> {
  const config = getOpenAiConfig();
  if (!config) return null;
  const system = [
    "You are AngoraPay Mesh's enterprise market-agent planner.",
    "Return strict JSON only.",
    "Choose exactly one specialistAgent from: prediction_market, cross_venue_arbitrage, social_trading.",
    "You may interpret mission intent and market target, but you must not approve spend, bypass policy, or invent provider/payment results.",
  ].join(" ");
  const raw = await callOpenAiJson<Record<string, unknown>>({
    config,
    responseName: "mission plan",
    system,
    user: {
      userGoal: input.mission.userGoal,
      explicitModule: input.mission.module,
      deterministicModule: input.deterministicModule,
      allowedCategories: input.allowedCategories,
      requestedAsset: input.mission.asset,
      requestedMarketTarget: input.mission.marketTarget,
      budgetUSDC: input.mission.budgetUSDC || "0.05",
      expectedJson: {
        specialistAgent: "prediction_market | cross_venue_arbitrage | social_trading",
        asset: "short asset or pair",
        marketTarget: "specific market being evaluated",
        rationale: "why this specialist is the right one",
        riskFlags: ["practical risk to consider"],
      },
    },
  });
  const specialistAgent = VALID_MODULES.includes(raw.specialistAgent as AgentMissionType)
    ? raw.specialistAgent as AgentMissionType
    : input.deterministicModule;
  return {
    specialistAgent,
    asset: cleanText(raw.asset, input.mission.asset || "", 80) || undefined,
    marketTarget: cleanText(raw.marketTarget, input.mission.marketTarget || "", 180) || undefined,
    rationale: cleanText(raw.rationale, "LLM selected a specialist based on mission intent.", 500),
    riskFlags: stringArray(raw.riskFlags, [], 6),
    source: "openai",
    model: config.model,
  };
}

export async function buildLlmRecommendation(input: {
  context: AgentContextPacket;
  decisions: AgentProviderDecision[];
  fallback: MissionRecommendation;
}): Promise<LlmRecommendationResult> {
  const config = getOpenAiConfig();
  if (!config) return { recommendation: input.fallback, source: "deterministic_fallback" };
  const system = [
    "You are AngoraPay Mesh's enterprise market-intelligence recommendation layer.",
    "Return strict JSON only.",
    "Base your answer only on the supplied verified provider decisions, route scores, receipts, and policy verdicts.",
    "You must not claim a trade was executed. You must not override policy, spend limits, or proof requirements.",
    "Give decision-support language suitable for a production financial workflow.",
  ].join(" ");
  try {
    const raw = await callOpenAiJson<Record<string, unknown>>({
      config,
      responseName: "recommendation",
      system,
      user: {
        userGoal: input.context.userGoal,
        specialistAgent: input.context.specialistAgent,
        marketTarget: input.context.marketTarget,
        providerDecisions: input.decisions.map((decision) => ({
          category: decision.category,
          status: decision.status,
          providerId: decision.providerId,
          serviceId: decision.serviceId,
          amountUSDC: decision.amountUSDC,
          routeScore: decision.routeScore,
          policyVerdict: decision.policyVerdict,
          routeReason: decision.routeReason,
          receiptId: decision.receipt?.receiptId,
          outputHash: decision.receipt?.outputHash,
          settlementStatus: decision.receipt?.settlementStatus,
          liveData: (decision.execution as Record<string, unknown> | undefined)?.data ?? null,
        })),
        instructions: "Derive confidence (0-100) independently from the live provider data and route scores above. Do not copy from any provided example values.",
        expectedJson: {
          action: "short action id e.g. enter_small, monitor, avoid, follow_reduced_size, reject",
          confidence: "integer 0-100 based on evidence strength",
          summary: "2-3 sentence plain English recommendation grounded in the live data",
          reasons: ["specific evidence-based reason from provider data"],
          guardrail: "one clear production safety condition",
        },
      },
    });
    return {
      source: "openai",
      model: config.model,
      recommendation: {
        action: cleanText(raw.action, input.fallback.action, 80),
        confidence: clampConfidence(raw.confidence, input.fallback.confidence),
        summary: cleanText(raw.summary, input.fallback.summary, 700),
        reasons: stringArray(raw.reasons, input.fallback.reasons, 5),
        guardrail: cleanText(raw.guardrail, input.fallback.guardrail, 700),
      },
    };
  } catch (error) {
    return {
      recommendation: input.fallback,
      source: "deterministic_fallback",
      model: config.model,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
