import crypto from "crypto";
import type express from "express";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";

export type AngoraScope =
  | "admin"
  | "missions:read"
  | "missions:write"
  | "services:read"
  | "gateway:call"
  | "receipts:read"
  | "history:read"
  | "metrics:read"
  | "providers:write"
  | "traction:write"
  | "settlement:read"
  | "settlement:write"
  | "workspace:read"
  | "workspace:write"
  | "policy:read"
  | "policy:write"
  | "audit:read";

export interface AngoraAuthContext {
  authenticated: boolean;
  authMode: "disabled" | "legacy_env" | "hashed_key";
  keyId: string;
  workspaceId: string;
  tenantId: string;
  subjectId: string;
  scopes: AngoraScope[];
  isAdmin: boolean;
}

interface StoredApiKey {
  keyId: string;
  label: string;
  workspaceId: string;
  tenantId: string;
  subjectId: string;
  hash: string;
  salt: string;
  scopes: AngoraScope[];
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  rotatedFromKeyId?: string;
}

const KEYS_FILE = stateFile("api-keys.json");
const ALL_SCOPES: AngoraScope[] = [
  "admin",
  "missions:read",
  "missions:write",
  "services:read",
  "gateway:call",
  "receipts:read",
  "history:read",
  "metrics:read",
  "providers:write",
  "traction:write",
  "settlement:read",
  "settlement:write",
  "workspace:read",
  "workspace:write",
  "policy:read",
  "policy:write",
  "audit:read",
];

function now() {
  return new Date().toISOString();
}

function loadKeys(): StoredApiKey[] {
  return readJsonFile<StoredApiKey[]>(KEYS_FILE, []);
}

function saveKeys(keys: StoredApiKey[]) {
  writeJsonFile(KEYS_FILE, keys);
}

function pbkdf2Hash(token: string, salt: string) {
  return crypto.pbkdf2Sync(token, salt, 210_000, 32, "sha256").toString("hex");
}

function constantEquals(a?: string, b?: string) {
  if (!a || !b) return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function extractToken(req: express.Request) {
  const header = req.headers.authorization || "";
  if (typeof header === "string" && header.startsWith("Bearer ")) return header.slice("Bearer ".length).trim();
  const apiKey = req.headers["x-angora-api-key"] || req.headers["x-api-key"];
  return Array.isArray(apiKey) ? apiKey[0] : apiKey;
}

function legacyEnvKey() {
  return process.env.ANGORA_API_KEY || process.env.KAIROS_ANGORA_API_KEY || "";
}

function authDisabled() {
  return process.env.ANGORA_AUTH_DISABLED === "true" || (!legacyEnvKey() && loadKeys().length === 0 && process.env.ANGORA_REQUIRE_AUTH !== "true");
}

function normalizeScopes(scopes?: AngoraScope[]) {
  if (!scopes || scopes.length === 0) return ALL_SCOPES.filter((scope) => scope !== "admin");
  return Array.from(new Set(scopes));
}

export function issueAngoraApiKey(input: {
  label?: string;
  workspaceId?: string;
  tenantId?: string;
  subjectId?: string;
  scopes?: AngoraScope[];
  expiresAt?: string;
}) {
  const keyId = `ag_key_${crypto.randomBytes(8).toString("hex")}`;
  const token = `${process.env.ANGORA_API_KEY_PREFIX || "ag_live"}_${crypto.randomBytes(28).toString("base64url")}`;
  const salt = crypto.randomBytes(16).toString("hex");
  const at = now();
  const workspaceId = input.workspaceId || process.env.ANGORA_DEFAULT_WORKSPACE_ID || "default-workspace";
  const tenantId = input.tenantId || process.env.ANGORA_DEFAULT_TENANT_ID || workspaceId;
  const record: StoredApiKey = {
    keyId,
    label: input.label || "Generated Angora API key",
    workspaceId,
    tenantId,
    subjectId: input.subjectId || "generated-key",
    hash: pbkdf2Hash(token, salt),
    salt,
    scopes: normalizeScopes(input.scopes),
    status: "active",
    createdAt: at,
    updatedAt: at,
    expiresAt: input.expiresAt,
  };
  const keys = loadKeys();
  keys.unshift(record);
  saveKeys(keys);
  return { apiKey: token, key: sanitizeKey(record) };
}

export function rotateAngoraApiKey(keyId: string) {
  const keys = loadKeys();
  const current = keys.find((key) => key.keyId === keyId && key.status === "active");
  if (!current) return undefined;
  current.status = "revoked";
  current.updatedAt = now();
  const issued = issueAngoraApiKey({
    label: `${current.label} rotated`,
    workspaceId: current.workspaceId,
    tenantId: current.tenantId,
    subjectId: current.subjectId,
    scopes: current.scopes,
    expiresAt: current.expiresAt,
  });
  const refreshed = loadKeys();
  const rotated = refreshed.find((key) => key.keyId === issued.key.keyId);
  if (rotated) rotated.rotatedFromKeyId = keyId;
  saveKeys(refreshed);
  return issued;
}

export function revokeAngoraApiKey(keyId: string) {
  const keys = loadKeys();
  const key = keys.find((item) => item.keyId === keyId);
  if (!key) return undefined;
  key.status = "revoked";
  key.updatedAt = now();
  saveKeys(keys);
  return sanitizeKey(key);
}

export function listAngoraApiKeys(workspaceId?: string) {
  return loadKeys()
    .filter((key) => !workspaceId || key.workspaceId === workspaceId)
    .map(sanitizeKey);
}

function sanitizeKey(key: StoredApiKey) {
  const { hash: _hash, salt: _salt, ...safe } = key;
  return safe;
}

function hasScope(context: AngoraAuthContext, scope: AngoraScope) {
  return context.isAdmin || context.scopes.includes(scope);
}

export function authenticateAngoraRequest(req: express.Request): AngoraAuthContext | undefined {
  if (authDisabled()) {
    return {
      authenticated: true,
      authMode: "disabled",
      keyId: "auth_disabled",
      workspaceId: process.env.ANGORA_DEFAULT_WORKSPACE_ID || "demo-workspace",
      tenantId: process.env.ANGORA_DEFAULT_TENANT_ID || process.env.ANGORA_DEFAULT_WORKSPACE_ID || "demo-tenant",
      subjectId: "anonymous-dev",
      scopes: ALL_SCOPES,
      isAdmin: true,
    };
  }

  const token = extractToken(req);
  if (!token) return undefined;

  const legacy = legacyEnvKey();
  if (legacy && constantEquals(token, legacy)) {
    return {
      authenticated: true,
      authMode: "legacy_env",
      keyId: "legacy_env_key",
      workspaceId: process.env.ANGORA_DEFAULT_WORKSPACE_ID || "default-workspace",
      tenantId: process.env.ANGORA_DEFAULT_TENANT_ID || process.env.ANGORA_DEFAULT_WORKSPACE_ID || "default-tenant",
      subjectId: "legacy-env-key",
      scopes: ALL_SCOPES,
      isAdmin: true,
    };
  }

  const keys = loadKeys();
  const at = now();
  for (const key of keys) {
    if (key.status !== "active") continue;
    if (key.expiresAt && Date.parse(key.expiresAt) < Date.now()) continue;
    if (!constantEquals(pbkdf2Hash(token, key.salt), key.hash)) continue;
    key.lastUsedAt = at;
    key.updatedAt = at;
    saveKeys(keys);
    return {
      authenticated: true,
      authMode: "hashed_key",
      keyId: key.keyId,
      workspaceId: key.workspaceId,
      tenantId: key.tenantId,
      subjectId: key.subjectId,
      scopes: key.scopes,
      isAdmin: key.scopes.includes("admin"),
    };
  }

  return undefined;
}

export function requireAngoraScope(context: AngoraAuthContext | undefined, scope: AngoraScope) {
  return Boolean(context?.authenticated && hasScope(context, scope));
}
