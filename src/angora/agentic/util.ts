import crypto from "crypto";

export function agentId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function titleFromGoal(goal: string): string {
  const cleaned = goal.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 72) return cleaned || "Untitled market-intelligence mission";
  return `${cleaned.slice(0, 69)}...`;
}

export function decimalSum(values: string[]): string {
  const sum = values.reduce((acc, value) => acc + Number(value || "0"), 0);
  return sum.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
