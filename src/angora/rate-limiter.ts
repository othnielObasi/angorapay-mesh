import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type express from "express";

const RATE_FILE = stateFile("rate-limits.json");

interface BucketRecord { key: string; timestamps: number[]; }

function load(): BucketRecord[] {
  return readJsonFile<BucketRecord[]>(RATE_FILE, []);
}

function save(records: BucketRecord[]) {
  writeJsonFile(RATE_FILE, records.slice(0, 2000));
}

export function rateLimitKey(req: express.Request, scope: string) {
  const token = String(req.headers.authorization || req.headers["x-angora-api-key"] || "anonymous");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex").slice(0, 16);
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return `${scope}:${tokenHash}:${ip}`;
}

export function checkRateLimit(key: string, options: { windowMs?: number; max?: number } = {}) {
  const windowMs = options.windowMs || Number(process.env.ANGORA_RATE_LIMIT_WINDOW_MS || 60_000);
  const max = options.max || Number(process.env.ANGORA_RATE_LIMIT_MAX || 120);
  const now = Date.now();
  const records = load();
  const record = records.find((item) => item.key === key) || { key, timestamps: [] };
  record.timestamps = record.timestamps.filter((timestamp) => now - timestamp < windowMs);
  if (record.timestamps.length >= max) {
    const retryAfterMs = Math.max(0, windowMs - (now - record.timestamps[0]));
    return { allowed: false, remaining: 0, retryAfterMs };
  }
  record.timestamps.push(now);
  const nextRecords = records.filter((item) => item.key !== key);
  nextRecords.unshift(record);
  save(nextRecords);
  return { allowed: true, remaining: Math.max(0, max - record.timestamps.length), retryAfterMs: 0 };
}
