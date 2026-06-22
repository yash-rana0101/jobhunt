import { prisma } from "@job-hunter/database";
import type { CommunicationStatus, CommunicationType } from "@prisma/client";
import { getProvider } from "../providers/index.js";
import { renderTemplate, resolveTemplateVariables } from "./template-engine.js";

export type ScheduleParams = {
  applicationId: string;
  contactId?: string;
  templateId: string;
  customVars?: Record<string, string>;
  scheduledAt?: Date;
  type: CommunicationType;
};

/**
 * Gets approval configuration based on environment settings.
 */
export function getApprovalMode(): "AUTO" | "MANUAL" | "HYBRID" {
  const mode = process.env.EMAIL_APPROVAL_MODE || "MANUAL";
  return mode as "AUTO" | "MANUAL" | "HYBRID";
}

/**
 * Schedules a communication based on templates and approval flows.
 */
export async function scheduleCommunication(params: ScheduleParams) {
  const template = await prisma.emailTemplate.findUnique({ where: { id: params.templateId } });
  if (!template) throw new Error("Template not found");

  const app = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { job: true, contact: true },
  });
  if (!app) throw new Error("Application not found");

  const variables = await resolveTemplateVariables(
    params.applicationId,
    params.contactId,
    params.customVars,
  );
  const { subject, body } = renderTemplate(
    template.subjectTemplate,
    template.bodyTemplate,
    variables,
  );

  const approvalMode = getApprovalMode();
  let status: CommunicationStatus = "SCHEDULED";

  // Hybrid mode: Auto-approves FOLLOW_UP, but cold outreach requires manual approval
  if (approvalMode === "MANUAL") {
    status = "DRAFT";
  } else if (approvalMode === "HYBRID" && params.type !== "FOLLOW_UP") {
    status = "DRAFT";
  }

  // Create communication recipient record (fallback to contact email or template placeholder)
  const recipientEmail = variables["contactEmail"] || "placeholder@hiringcompany.com";

  // Find or create communication thread
  let thread = await prisma.communicationThread.findFirst({
    where: { applicationId: params.applicationId, contactId: params.contactId || app.contactId },
  });

  if (!thread) {
    thread = await prisma.communicationThread.create({
      data: {
        applicationId: params.applicationId,
        contactId: params.contactId || app.contactId,
        companyId: app.companyId,
        subject: subject,
      },
    });
  }

  const communication = await prisma.communication.create({
    data: {
      threadId: thread.id,
      applicationId: params.applicationId,
      contactId: params.contactId || app.contactId,
      companyId: app.companyId,
      candidateId: app.candidateId,
      type: params.type,
      subject,
      status,
      provider: getProvider().name,
      createdAt: new Date(),
    },
  });

  // Create recipient TO record
  await prisma.communicationRecipient.create({
    data: {
      communicationId: communication.id,
      email: recipientEmail,
      role: "TO",
    },
  });

  // Store outbound message draft/approved state on message logs
  await prisma.communicationMessage.create({
    data: {
      threadId: thread.id,
      subject,
      body,
      direction: "OUTBOUND",
      status: status === "DRAFT" ? "DRAFT" : "PENDING",
      createdAt: new Date(),
    },
  });

  // If auto-approved and scheduledAt is not specified (meaning immediate send), we can trigger it
  if (status === "SCHEDULED" && !params.scheduledAt) {
    void sendCommunicationImmediately(communication.id, body, recipientEmail);
  }

  return communication;
}

/**
 * Executes direct Resend/mock provider email send.
 */
async function sendCommunicationImmediately(
  communicationId: string,
  body: string,
  recipientEmail: string,
) {
  await prisma.communication.update({
    where: { id: communicationId },
    data: { status: "SENDING" },
  });

  const comm = await prisma.communication.findUnique({
    where: { id: communicationId },
  });
  if (!comm) return;

  const res = await getProvider().sendEmail({
    from: process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev",
    to: [recipientEmail],
    subject: comm.subject,
    body,
  });

  if (res.success) {
    await prisma.communication.update({
      where: { id: communicationId },
      data: { status: "SENT" },
    });

    await prisma.emailDelivery.create({
      data: {
        communicationId,
        providerMessageId: res.providerMessageId,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    // Log Activity log to timeline
    await prisma.applicationActivity.create({
      data: {
        applicationId: comm.applicationId!,
        activityType: "EMAIL_SENT",
        title: "Outreach Email Sent",
        description: `Sent "${comm.subject}" via ${comm.provider}`,
      },
    });
  } else {
    await prisma.communication.update({
      where: { id: communicationId },
      data: { status: "FAILED" },
    });

    await prisma.emailDelivery.create({
      data: {
        communicationId,
        status: "FAILED",
        failedAt: new Date(),
        errorMessage: res.errorMessage,
      },
    });
  }
}

/**
 * Approves a draft communication.
 */
export async function approveCommunication(communicationId: string) {
  const comm = await prisma.communication.findUnique({
    where: { id: communicationId },
    include: {
      recipients: true,
      thread: {
        include: {
          messages: {
            where: { direction: "OUTBOUND", status: "DRAFT" },
          },
        },
      },
    },
  });

  if (!comm || comm.status !== "DRAFT") {
    throw new Error("Communication not eligible for approval");
  }

  await prisma.communication.update({
    where: { id: communicationId },
    data: { status: "APPROVED" },
  });

  const message = comm.thread?.messages[0];
  const toRecipient =
    comm.recipients.find((r) => r.role === "TO")?.email || "placeholder@hiringcompany.com";

  if (message) {
    await prisma.communicationMessage.update({
      where: { id: message.id },
      data: { status: "PENDING" },
    });
    await sendCommunicationImmediately(communicationId, message.body, toRecipient);
  }
}

/**
 * Cancels all scheduled/draft follow-ups for a thread.
 */
export async function cancelFollowUpsForThread(threadId: string) {
  await prisma.communication.updateMany({
    where: {
      threadId,
      status: { in: ["DRAFT", "APPROVED", "SCHEDULED"] },
      type: "FOLLOW_UP",
    },
    data: { status: "CANCELLED" },
  });

  await prisma.followUpSchedule.updateMany({
    where: { threadId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
