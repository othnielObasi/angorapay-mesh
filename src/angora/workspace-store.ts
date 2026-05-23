import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";

/**
 * Multi-tenant workspace store.
 *
 * The current kit intentionally keeps a file-backed adapter for local/Vultr/demo
 * deployments while exposing production-grade domain boundaries. A PostgreSQL
 * adapter can implement the same shapes in src/angora/db without changing route
 * or agent code. Every record carries workspaceId so all reads can be tenant
 * scoped before returning data to a caller.
 */
export type WorkspaceRole = "owner" | "admin" | "builder" | "analyst" | "provider" | "viewer" | "auditor";
export type WorkspaceMemberStatus = "active" | "invited" | "disabled";

export interface Workspace {
  workspaceId: string;
  tenantId: string;
  name: string;
  slug: string;
  status: "active" | "suspended";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  memberId: string;
  workspaceId: string;
  userId: string;
  email?: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspacePolicy {
  policyId: string;
  workspaceId: string;
  maxMissionSpendUSDC: string;
  dailySpendLimitUSDC: string;
  minProviderTrustScore: number;
  minRouteScore: number;
  proofRequired: boolean;
  allowedPaymentModes: Array<"real_x402" | "arc_testnet" | "demo_fallback">;
  fallbackAllowed: boolean;
  allowedCategories: string[];
  blockedProviders: string[];
  updatedAt: string;
}

export interface WorkspaceBudget {
  budgetId: string;
  workspaceId: string;
  dailyLimitUSDC: string;
  monthlyLimitUSDC: string;
  agentLimitsUSDC: Record<string, string>;
  spentTodayUSDC: string;
  spentMonthUSDC: string;
  updatedAt: string;
}

export interface WorkspaceProviderAccess {
  accessId: string;
  workspaceId: string;
  providerId: string;
  status: "allowed" | "blocked" | "preferred";
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

const WORKSPACES_FILE = stateFile("workspaces.json");
const MEMBERS_FILE = stateFile("workspace-members.json");
const POLICIES_FILE = stateFile("workspace-policies.json");
const BUDGETS_FILE = stateFile("workspace-budgets.json");
const PROVIDER_ACCESS_FILE = stateFile("workspace-provider-access.json");

function now() { return new Date().toISOString(); }
function id(prefix: string) { return `${prefix}_${crypto.randomBytes(8).toString("hex")}`; }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64) || "workspace"; }

function loadWorkspaces() { return readJsonFile<Workspace[]>(WORKSPACES_FILE, []); }
function saveWorkspaces(rows: Workspace[]) { writeJsonFile(WORKSPACES_FILE, rows); }
function loadMembers() { return readJsonFile<WorkspaceMember[]>(MEMBERS_FILE, []); }
function saveMembers(rows: WorkspaceMember[]) { writeJsonFile(MEMBERS_FILE, rows); }
function loadPolicies() { return readJsonFile<WorkspacePolicy[]>(POLICIES_FILE, []); }
function savePolicies(rows: WorkspacePolicy[]) { writeJsonFile(POLICIES_FILE, rows); }
function loadBudgets() { return readJsonFile<WorkspaceBudget[]>(BUDGETS_FILE, []); }
function saveBudgets(rows: WorkspaceBudget[]) { writeJsonFile(BUDGETS_FILE, rows); }
function loadProviderAccess() { return readJsonFile<WorkspaceProviderAccess[]>(PROVIDER_ACCESS_FILE, []); }
function saveProviderAccess(rows: WorkspaceProviderAccess[]) { writeJsonFile(PROVIDER_ACCESS_FILE, rows); }

export function defaultWorkspacePolicy(workspaceId: string): WorkspacePolicy {
  return {
    policyId: id("wpol"),
    workspaceId,
    maxMissionSpendUSDC: "0.05",
    dailySpendLimitUSDC: "10",
    minProviderTrustScore: 85,
    minRouteScore: 80,
    proofRequired: true,
    allowedPaymentModes: ["demo_fallback", "arc_testnet", "real_x402"],
    fallbackAllowed: true,
    allowedCategories: ["odds", "sentiment", "risk", "proof", "market_data", "arbitrage", "social"],
    blockedProviders: [],
    updatedAt: now(),
  };
}

export function defaultWorkspaceBudget(workspaceId: string): WorkspaceBudget {
  return {
    budgetId: id("wbud"),
    workspaceId,
    dailyLimitUSDC: "10",
    monthlyLimitUSDC: "250",
    agentLimitsUSDC: {
      "prediction-market-intelligence-agent": "3",
      "cross-venue-arbitrage-agent": "5",
      "social-trading-intelligence-agent": "2",
    },
    spentTodayUSDC: "0",
    spentMonthUSDC: "0",
    updatedAt: now(),
  };
}

export function createWorkspace(input: { name: string; createdBy: string; tenantId?: string; slug?: string }) {
  const at = now();
  const workspace: Workspace = {
    workspaceId: id("ws"),
    tenantId: input.tenantId || id("tenant"),
    name: input.name.trim(),
    slug: input.slug || slugify(input.name),
    status: "active",
    createdBy: input.createdBy,
    createdAt: at,
    updatedAt: at,
  };
  saveWorkspaces([workspace, ...loadWorkspaces()]);
  addWorkspaceMember({ workspaceId: workspace.workspaceId, userId: input.createdBy, role: "owner", status: "active" });
  savePolicies([defaultWorkspacePolicy(workspace.workspaceId), ...loadPolicies()]);
  saveBudgets([defaultWorkspaceBudget(workspace.workspaceId), ...loadBudgets()]);
  return workspace;
}

export function ensureWorkspace(workspaceId: string, subjectId = "system") {
  const found = getWorkspace(workspaceId);
  if (found) return found;
  const at = now();
  const workspace: Workspace = { workspaceId, tenantId: workspaceId, name: workspaceId, slug: slugify(workspaceId), status: "active", createdBy: subjectId, createdAt: at, updatedAt: at };
  saveWorkspaces([workspace, ...loadWorkspaces()]);
  savePolicies([defaultWorkspacePolicy(workspace.workspaceId), ...loadPolicies()]);
  saveBudgets([defaultWorkspaceBudget(workspace.workspaceId), ...loadBudgets()]);
  return workspace;
}

export function listWorkspaces(filter: { subjectId?: string; limit?: number; offset?: number } = {}) {
  const memberships = filter.subjectId ? loadMembers().filter((m) => m.userId === filter.subjectId && m.status === "active") : undefined;
  const allowed = memberships ? new Set(memberships.map((m) => m.workspaceId)) : undefined;
  const rows = loadWorkspaces().filter((w) => !allowed || allowed.has(w.workspaceId));
  const limit = filter.limit ?? 50; const offset = filter.offset ?? 0;
  return { rows: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
}

export function getWorkspace(workspaceId: string) { return loadWorkspaces().find((w) => w.workspaceId === workspaceId); }

export function updateWorkspace(workspaceId: string, patch: Partial<Pick<Workspace, "name" | "slug" | "status">>) {
  const rows = loadWorkspaces(); const idx = rows.findIndex((w) => w.workspaceId === workspaceId); if (idx < 0) return undefined;
  rows[idx] = { ...rows[idx], ...patch, updatedAt: now() };
  saveWorkspaces(rows); return rows[idx];
}

export function addWorkspaceMember(input: { workspaceId: string; userId: string; email?: string; role: WorkspaceRole; status?: WorkspaceMemberStatus }) {
  const at = now();
  const rows = loadMembers();
  const existing = rows.find((m) => m.workspaceId === input.workspaceId && m.userId === input.userId);
  if (existing) {
    existing.role = input.role; existing.status = input.status || existing.status; existing.email = input.email || existing.email; existing.updatedAt = at;
    saveMembers(rows); return existing;
  }
  const member: WorkspaceMember = { memberId: id("wmem"), workspaceId: input.workspaceId, userId: input.userId, email: input.email, role: input.role, status: input.status || "active", createdAt: at, updatedAt: at };
  saveMembers([member, ...rows]); return member;
}

export function listWorkspaceMembers(workspaceId: string) { return loadMembers().filter((m) => m.workspaceId === workspaceId); }
export function getMemberRole(workspaceId: string, userId: string) { return loadMembers().find((m) => m.workspaceId === workspaceId && m.userId === userId && m.status === "active")?.role; }

export function userCanAccessWorkspace(workspaceId: string, userId: string, requireRoles?: WorkspaceRole[]) {
  const role = getMemberRole(workspaceId, userId);
  if (!role) return false;
  if (!requireRoles || requireRoles.length === 0) return true;
  return requireRoles.includes(role);
}

export function getWorkspacePolicy(workspaceId: string) {
  const existing = loadPolicies().find((p) => p.workspaceId === workspaceId);
  if (existing) return existing;
  const policy = defaultWorkspacePolicy(workspaceId); savePolicies([policy, ...loadPolicies()]); return policy;
}

export function updateWorkspacePolicy(workspaceId: string, patch: Partial<Omit<WorkspacePolicy, "policyId" | "workspaceId" | "updatedAt">>) {
  const rows = loadPolicies(); const idx = rows.findIndex((p) => p.workspaceId === workspaceId);
  const base = idx >= 0 ? rows[idx] : defaultWorkspacePolicy(workspaceId);
  const updated: WorkspacePolicy = { ...base, ...patch, workspaceId, updatedAt: now() };
  if (idx >= 0) rows[idx] = updated; else rows.unshift(updated);
  savePolicies(rows); return updated;
}

export function getWorkspaceBudget(workspaceId: string) {
  const existing = loadBudgets().find((b) => b.workspaceId === workspaceId);
  if (existing) return existing;
  const budget = defaultWorkspaceBudget(workspaceId); saveBudgets([budget, ...loadBudgets()]); return budget;
}

export function updateWorkspaceBudget(workspaceId: string, patch: Partial<Omit<WorkspaceBudget, "budgetId" | "workspaceId" | "updatedAt">>) {
  const rows = loadBudgets(); const idx = rows.findIndex((b) => b.workspaceId === workspaceId);
  const base = idx >= 0 ? rows[idx] : defaultWorkspaceBudget(workspaceId);
  const updated: WorkspaceBudget = { ...base, ...patch, workspaceId, updatedAt: now() };
  if (idx >= 0) rows[idx] = updated; else rows.unshift(updated);
  saveBudgets(rows); return updated;
}

export function upsertWorkspaceProviderAccess(input: { workspaceId: string; providerId: string; status: WorkspaceProviderAccess["status"]; reason?: string }) {
  const rows = loadProviderAccess(); const at = now();
  const idx = rows.findIndex((a) => a.workspaceId === input.workspaceId && a.providerId === input.providerId);
  const updated: WorkspaceProviderAccess = idx >= 0 ? { ...rows[idx], status: input.status, reason: input.reason, updatedAt: at } : { accessId: id("wpacc"), workspaceId: input.workspaceId, providerId: input.providerId, status: input.status, reason: input.reason, createdAt: at, updatedAt: at };
  if (idx >= 0) rows[idx] = updated; else rows.unshift(updated);
  saveProviderAccess(rows); return updated;
}

export function listWorkspaceProviderAccess(workspaceId: string) { return loadProviderAccess().filter((a) => a.workspaceId === workspaceId); }
