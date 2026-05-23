import { listExecutionHistory } from "./execution-history.js";
import { listMissions } from "./mission-store.js";
import { listReceipts } from "./receipt-store.js";
import { listReputation } from "./reputation-engine.js";
import { listServices } from "./service-registry.js";
import { tractionSummary } from "./traction-store.js";
import { RFP_AREAS } from "./rfp-catalog.js";
import type { SubmissionMetrics } from "./types.js";

export function getSubmissionMetrics(): SubmissionMetrics {
  const executions = listExecutionHistory();
  const missions = listMissions();
  const receipts = listReceipts();
  const reputation = listReputation();
  const services = listServices();
  const traction = tractionSummary();
  const paid = executions.filter((record) => !["blocked", "failed"].includes(record.status));
  const providersUsed = new Set(paid.map((record) => record.providerId).filter(Boolean));
  const missionUsers = new Set([...missions.map((mission) => mission.consumerId), ...executions.map((record) => record.consumerId)].filter(Boolean));
  const total = paid.reduce((sum, record) => sum + Number(record.amountUSDC || 0), 0);

  return {
    product: "AngoraPay Mesh for Angora market agents",
    eventWindow: {
      start: process.env.ANGORA_EVENT_START || "2026-05-11",
      end: process.env.ANGORA_EVENT_END || "2026-05-25",
    },
    usersOnboarded: Math.max(traction.usersOnboarded, missionUsers.size),
    feedbackCount: traction.feedbackCount,
    averageFeedbackRating: traction.averageFeedbackRating,
    missionsCreated: missions.length,
    gatewayCalls: executions.length,
    paidServiceCalls: paid.length,
    blockedCalls: executions.filter((record) => record.status === "blocked").length,
    receiptsCreated: receipts.length,
    totalVolumeUSDC: total.toFixed(6),
    realX402Calls: executions.filter((record) => record.executionMode === "real_x402").length,
    arcTestnetCalls: executions.filter((record) => record.executionMode === "arc_testnet").length,
    fallbackCalls: executions.filter((record) => record.executionMode === "demo_fallback").length,
    providersUsed: providersUsed.size,
    providerRoutesRanked: services.length + reputation.filter((profile) => profile.subjectType === "provider").length,
    rfpCoverage: RFP_AREAS.map((rfp) => ({
      rfpTrack: rfp.id,
      missions: missions.filter((mission) => mission.rfpTrack === rfp.id).length,
      services: services.filter((service) => service.rfpTracks.includes(rfp.id)).length,
    })),
    recentExecutions: executions.slice(0, 20),
  };
}
