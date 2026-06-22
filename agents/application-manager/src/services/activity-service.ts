import { prisma } from "@job-hunter/database";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import { updateApplicationPriority } from "./priority-engine.js";

/**
 * Logs an action to the application activity timeline.
 */
export async function logActivity(
  applicationId: string,
  activityType: string,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.applicationActivity.create({
    data: {
      applicationId,
      activityType,
      title,
      description,
      metadata: (metadata || {}) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Transitions application status, logs history, logs activity, and recalculates priority.
 */
export async function transitionApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  reason?: string,
  changedBy: string = "USER",
): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error(`Application with ID ${applicationId} not found`);
  }

  const oldStatus = application.status;
  if (oldStatus === newStatus) return;

  // 1. Update Application status
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: newStatus },
  });

  // 2. Log to Status History
  await prisma.applicationStatusHistory.create({
    data: {
      applicationId,
      oldStatus,
      newStatus,
      changedBy,
      reason,
    },
  });

  // 3. Log to Activity Timeline
  await logActivity(
    applicationId,
    "STATUS_CHANGED",
    `Status changed to ${newStatus.replace(/_/g, " ")}`,
    reason ||
      `Status updated from ${oldStatus.replace(/_/g, " ")} to ${newStatus.replace(/_/g, " ")}`,
    { oldStatus, newStatus, reason, changedBy },
  );

  // 4. Update Priority Score (since status impacts priority)
  await updateApplicationPriority(applicationId);
}
