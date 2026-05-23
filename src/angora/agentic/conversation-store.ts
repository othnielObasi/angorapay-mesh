import { readJsonFile, stateFile, writeJsonFile } from "../state-dir.js";
import type { ConversationMessage, ConversationThread } from "./types.js";
import { agentId, nowIso, titleFromGoal } from "./util.js";

const THREADS_FILE = stateFile("agent-conversation-threads.json");
const MESSAGES_FILE = stateFile("agent-conversation-messages.json");

function loadThreads(): ConversationThread[] {
  return readJsonFile<ConversationThread[]>(THREADS_FILE, []);
}

function saveThreads(threads: ConversationThread[]) {
  writeJsonFile(THREADS_FILE, threads.slice(0, 1000));
}

function loadMessages(): ConversationMessage[] {
  return readJsonFile<ConversationMessage[]>(MESSAGES_FILE, []);
}

function saveMessages(messages: ConversationMessage[]) {
  writeJsonFile(MESSAGES_FILE, messages.slice(-5000));
}

export function createOrGetConversation(input: {
  conversationId?: string;
  workspaceId?: string;
  tenantId?: string;
  userId?: string;
  userGoal: string;
}): ConversationThread {
  const threads = loadThreads();
  const existing = input.conversationId ? threads.find((thread) => thread.conversationId === input.conversationId) : undefined;
  if (existing) return existing;

  const now = nowIso();
  const thread: ConversationThread = {
    conversationId: input.conversationId || agentId("conv"),
    workspaceId: input.workspaceId,
    tenantId: input.tenantId,
    userId: input.userId,
    title: titleFromGoal(input.userGoal),
    status: "running",
    totalUSDC: "0",
    receiptIds: [],
    traceIds: [],
    createdAt: now,
    updatedAt: now,
  };
  saveThreads([thread, ...threads]);
  return thread;
}

export function updateConversation(conversationId: string, patch: Partial<ConversationThread>): ConversationThread | undefined {
  const threads = loadThreads();
  const index = threads.findIndex((thread) => thread.conversationId === conversationId);
  if (index === -1) return undefined;
  const updated: ConversationThread = { ...threads[index], ...patch, updatedAt: nowIso() };
  threads[index] = updated;
  saveThreads(threads);
  return updated;
}

export function addConversationMessage(input: Omit<ConversationMessage, "messageId" | "createdAt">): ConversationMessage {
  const message: ConversationMessage = {
    ...input,
    messageId: agentId("msg"),
    createdAt: nowIso(),
  };
  saveMessages([...loadMessages(), message]);
  return message;
}

export function listConversations(filter: { workspaceId?: string; userId?: string; limit?: number; offset?: number } = {}) {
  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;
  const rows = loadThreads().filter((thread) => {
    if (filter.workspaceId && thread.workspaceId && thread.workspaceId !== filter.workspaceId) return false;
    if (filter.userId && thread.userId !== filter.userId) return false;
    return true;
  });
  return { rows: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
}

export function getConversation(conversationId: string) {
  return loadThreads().find((thread) => thread.conversationId === conversationId);
}

export function listConversationMessages(conversationId: string) {
  return loadMessages().filter((message) => message.conversationId === conversationId);
}
