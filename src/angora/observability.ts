import crypto from "crypto";
import { appendFileSync } from "fs";
import { readJsonFile, stateFile, writeJsonFile, ensureAngoraStateDir } from "./state-dir.js";
import type express from "express";

const METRICS_FILE = stateFile("runtime-metrics.json");
const LOG_FILE = stateFile("runtime.log");

export interface RuntimeMetrics {
  requests: number;
  gatewayCalls: number;
  validationFailures: number;
  authFailures: number;
  rateLimited: number;
  idempotentReplays: number;
  policyBlocks: number;
  providerFailures: number;
  receiptsCreated: number;
  settlementReconciliations: number;
  updatedAt: string;
}

function ensureDir() {
  ensureAngoraStateDir();
}

function defaultMetrics(): RuntimeMetrics {
  return {
    requests: 0,
    gatewayCalls: 0,
    validationFailures: 0,
    authFailures: 0,
    rateLimited: 0,
    idempotentReplays: 0,
    policyBlocks: 0,
    providerFailures: 0,
    receiptsCreated: 0,
    settlementReconciliations: 0,
    updatedAt: new Date().toISOString(),
  };
}

function load(): RuntimeMetrics {
  return { ...defaultMetrics(), ...readJsonFile<Partial<RuntimeMetrics>>(METRICS_FILE, {}) };
}

function save(metrics: RuntimeMetrics) {
  writeJsonFile(METRICS_FILE, metrics);
}

export function incrementMetric(key: keyof RuntimeMetrics, amount = 1) {
  if (key === "updatedAt") return;
  const metrics = load();
  const current = Number(metrics[key] || 0);
  (metrics as unknown as Record<string, unknown>)[key] = current + amount;
  metrics.updatedAt = new Date().toISOString();
  save(metrics);
}

export function getRuntimeMetrics() {
  return load();
}

export function writeStructuredLog(event: string, data: Record<string, unknown> = {}) {
  ensureDir();
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data });
  appendFileSync(LOG_FILE, `${line}\n`);
  if (process.env.ANGORA_LOG_TO_CONSOLE === "true") console.log(line);
}

export function requestContext(req: express.Request) {
  const requestId = String(req.headers["x-request-id"] || `req_${crypto.randomBytes(8).toString("hex")}`);
  return { requestId, startedAt: Date.now() };
}
