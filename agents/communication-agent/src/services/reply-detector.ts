import { prisma } from "@job-hunter/database";
import type { ResponseCategory } from "@prisma/client";
import { cancelFollowUpsForThread } from "./scheduler.js";
import { transitionApplicationStatus } from "@job-hunter/application-manager";

/**
 * Heuristic response classifier for inbound email replies.
 */
export function classifyReplyText(body: string): {
  category: ResponseCategory;
  confidence: number;
  sentiment: string;
} {
  const text = body.toLowerCase();

  if (
    text.includes("out of office") ||
    text.includes("out of the office") ||
    text.includes("ooo") ||
    text.includes("vacation")
  ) {
    return { category: "OUT_OF_OFFICE", confidence: 0.9, sentiment: "neutral" };
  }
  if (
    text.includes("unfortunately") ||
    text.includes("not moving forward") ||
    text.includes("filled this role")
  ) {
    return { category: "REJECTED", confidence: 0.95, sentiment: "negative" };
  }
  if (
    text.includes("not interested") ||
    text.includes("no thanks") ||
    text.includes("not at this time")
  ) {
    return { category: "NOT_INTERESTED", confidence: 0.85, sentiment: "negative" };
  }
  if (
    text.includes("interview") ||
    text.includes("schedule a call") ||
    text.includes("meet") ||
    text.includes("calendar link")
  ) {
    return { category: "INTERVIEW_REQUEST", confidence: 0.9, sentiment: "positive" };
  }
  if (
    text.includes("referral") ||
    text.includes("referred") ||
    text.includes("forwarded your resume")
  ) {
    return { category: "REFERRAL_PROVIDED", confidence: 0.85, sentiment: "positive" };
  }
  if (
    text.includes("interested") ||
    text.includes("send over your resume") ||
    text.includes("details")
  ) {
    return { category: "INTERESTED", confidence: 0.8, sentiment: "positive" };
  }
  if (text.includes("follow up") || text.includes("next week") || text.includes("later")) {
    return { category: "FOLLOW_UP_REQUEST", confidence: 0.75, sentiment: "neutral" };
  }
  if (text.includes("yes") || text.includes("sounds good") || text.includes("great")) {
    return { category: "POSITIVE", confidence: 0.7, sentiment: "positive" };
  }

  return { category: "UNKNOWN", confidence: 0.5, sentiment: "neutral" };
}

/**
 * Handles receiving an inbound reply email message, matching it to thread, classifying, and halting follow-ups.
 */
export async function receiveInboundReply(params: {
  threadId: string;
  subject: string;
  body: string;
  receivedAt: Date;
}) {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: params.threadId },
    include: { communications: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  if (!thread) {
    throw new Error(`Thread with ID ${params.threadId} not found`);
  }

  // Create inbound message log
  const message = await prisma.communicationMessage.create({
    data: {
      threadId: params.threadId,
      subject: params.subject,
      body: params.body,
      direction: "INBOUND",
      receivedAt: params.receivedAt,
      status: "RECEIVED",
    },
  });

  // Run classification
  const { category, confidence, sentiment } = classifyReplyText(params.body);

  // If we have a past communication under the thread, link the reply record to it
  const parentComm = thread.communications[0];
  if (parentComm) {
    await prisma.emailReply.create({
      data: {
        communicationId: parentComm.id,
        content: params.body,
        replyTimestamp: params.receivedAt,
        sentiment,
        responseCategory: category,
        confidence,
      },
    });

    await prisma.communication.update({
      where: { id: parentComm.id },
      data: { status: "REPLIED" },
    });
  }

  // 1. RULE: Stop follow-ups after reply
  await cancelFollowUpsForThread(params.threadId);

  // 2. Transition Application status based on reply classification
  if (thread.applicationId) {
    if (category === "REJECTED") {
      // 3. RULE: Stop follow-ups after rejection (handled above, plus application status update)
      await transitionApplicationStatus(
        thread.applicationId,
        "REJECTED",
        "Received rejection email",
      );
    } else if (category === "INTERVIEW_REQUEST") {
      await transitionApplicationStatus(
        thread.applicationId,
        "REPLIED",
        "Hiring manager requested interview",
      );
    } else if (category === "INTERESTED" || category === "POSITIVE") {
      await transitionApplicationStatus(thread.applicationId, "REPLIED", "Positive reply received");
    }
  }

  return message;
}
