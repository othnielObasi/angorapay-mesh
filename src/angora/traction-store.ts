import crypto from "crypto";
import { readJsonFile, stateFile, writeJsonFile } from "./state-dir.js";
import type { UserFeedbackRecord, UserSessionRecord } from "./types.js";

const USERS_FILE = stateFile("traction-users.json");
const FEEDBACK_FILE = stateFile("traction-feedback.json");

function loadJson<T>(file: string): T[] {
  return readJsonFile<T[]>(file, []);
}

function saveJson<T>(file: string, data: T[]) {
  writeJsonFile(file, data);
}

export function recordUserSession(input: Partial<UserSessionRecord>): UserSessionRecord {
  const now = new Date().toISOString();
  const user: UserSessionRecord = {
    userId: input.userId || `user_${crypto.randomBytes(5).toString("hex")}`,
    displayName: input.displayName,
    email: input.email,
    walletAddress: input.walletAddress,
    source: input.source || "manual",
    createdAt: input.createdAt || now,
    metadata: input.metadata || {},
  };
  const users = loadJson<UserSessionRecord>(USERS_FILE).filter((item) => item.userId !== user.userId);
  users.unshift(user);
  saveJson(USERS_FILE, users.slice(0, 1000));
  return user;
}

export function recordFeedback(input: { userId: string; missionId?: string; rating: number; comment: string }): UserFeedbackRecord {
  const feedback: UserFeedbackRecord = {
    feedbackId: `fb_${crypto.randomBytes(6).toString("hex")}`,
    userId: input.userId,
    missionId: input.missionId,
    rating: Math.max(1, Math.min(5, Number(input.rating || 1))),
    comment: input.comment || "",
    createdAt: new Date().toISOString(),
  };
  const items = loadJson<UserFeedbackRecord>(FEEDBACK_FILE);
  items.unshift(feedback);
  saveJson(FEEDBACK_FILE, items.slice(0, 1000));
  return feedback;
}

export function listUserSessions(): UserSessionRecord[] {
  return loadJson<UserSessionRecord>(USERS_FILE);
}

export function listFeedback(): UserFeedbackRecord[] {
  return loadJson<UserFeedbackRecord>(FEEDBACK_FILE);
}

export function tractionSummary() {
  const users = listUserSessions();
  const feedback = listFeedback();
  const averageRating = feedback.length ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length : 0;
  return {
    usersOnboarded: users.length,
    feedbackCount: feedback.length,
    averageFeedbackRating: Number(averageRating.toFixed(2)),
    usersBySource: users.reduce<Record<string, number>>((acc, user) => {
      acc[user.source] = (acc[user.source] || 0) + 1;
      return acc;
    }, {}),
    recentUsers: users.slice(0, 20),
    recentFeedback: feedback.slice(0, 20),
  };
}
