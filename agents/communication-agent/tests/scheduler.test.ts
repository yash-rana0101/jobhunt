/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  scheduleCommunication,
  approveCommunication,
  cancelFollowUpsForThread,
  getApprovalMode,
} from "../src/services/scheduler.js";
import { prisma } from "@job-hunter/database";
import { MockProvider, setProvider } from "../src/providers/index.js";

vi.mock("@job-hunter/database", () => ({
  prisma: {
    emailTemplate: { findUnique: vi.fn() },
    application: { findUnique: vi.fn() },
    companyContact: { findUnique: vi.fn() },
    communicationThread: { findFirst: vi.fn(), create: vi.fn() },
    communication: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    communicationRecipient: { create: vi.fn() },
    communicationMessage: { create: vi.fn(), update: vi.fn() },
    emailDelivery: { create: vi.fn() },
    applicationActivity: { create: vi.fn() },
    followUpSchedule: { updateMany: vi.fn() },
  },
}));

describe("Queue Scheduler Service", () => {
  let mockProvider: MockProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = new MockProvider();
    setProvider(mockProvider);
    delete process.env.EMAIL_APPROVAL_MODE;
  });

  it("should determine approval mode from environment", () => {
    expect(getApprovalMode()).toBe("MANUAL");
    process.env.EMAIL_APPROVAL_MODE = "AUTO";
    expect(getApprovalMode()).toBe("AUTO");
  });

  it("should create draft communication when approval mode is MANUAL", async () => {
    vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue({
      id: "tpl-1",
      subjectTemplate: "Hello",
      bodyTemplate: "Hi recruiter",
    } as any);

    vi.mocked(prisma.application.findUnique).mockResolvedValue({
      id: "app-1",
      candidateId: "cand-1",
      job: { title: "Dev", company: "Company" },
      candidate: { fullName: "Yash", skills: [], projects: [] },
    } as any);

    vi.mocked(prisma.communicationThread.findFirst).mockResolvedValue({ id: "thread-1" } as any);

    vi.mocked(prisma.communication.create).mockResolvedValue({
      id: "comm-1",
      status: "DRAFT",
    } as any);

    process.env.EMAIL_APPROVAL_MODE = "MANUAL";

    const result = await scheduleCommunication({
      applicationId: "app-1",
      templateId: "tpl-1",
      type: "RECRUITER_OUTREACH",
    });

    expect(result.status).toBe("DRAFT");
    expect(prisma.communication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "DRAFT",
        }),
      }),
    );
    expect(mockProvider.sentEmails).toHaveLength(0); // Should not send immediately
  });

  it("should approve a draft communication and send it immediately", async () => {
    const mockComm = {
      id: "comm-1",
      status: "DRAFT",
      subject: "Outreach Subject",
      applicationId: "app-1",
      provider: "MOCK",
      recipients: [{ role: "TO", email: "recruiter@example.com" }],
      thread: {
        messages: [{ id: "msg-1", direction: "OUTBOUND", status: "DRAFT", body: "Draft Body" }],
      },
    };

    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any);

    await approveCommunication("comm-1");

    expect(prisma.communication.update).toHaveBeenCalledWith({
      where: { id: "comm-1" },
      data: { status: "APPROVED" },
    });

    expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
      where: { id: "msg-1" },
      data: { status: "PENDING" },
    });

    const sentEmail = mockProvider.sentEmails[0];
    expect(sentEmail).toBeDefined();
    expect(sentEmail!.to).toContain("recruiter@example.com");
    expect(sentEmail!.body).toBe("Draft Body");
  });

  it("should cancel scheduled follow-ups for a thread", async () => {
    await cancelFollowUpsForThread("thread-123");

    expect(prisma.communication.updateMany).toHaveBeenCalledWith({
      where: {
        threadId: "thread-123",
        status: { in: ["DRAFT", "APPROVED", "SCHEDULED"] },
        type: "FOLLOW_UP",
      },
      data: { status: "CANCELLED" },
    });

    expect(prisma.followUpSchedule.updateMany).toHaveBeenCalledWith({
      where: { threadId: "thread-123", status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  });
});
