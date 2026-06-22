/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyReplyText, receiveInboundReply } from "../src/services/reply-detector.js";
import { prisma } from "@job-hunter/database";
import { transitionApplicationStatus } from "@job-hunter/application-manager";

vi.mock("@job-hunter/database", () => ({
  prisma: {
    communicationThread: { findUnique: vi.fn() },
    communicationMessage: { create: vi.fn() },
    emailReply: { create: vi.fn() },
    communication: { update: vi.fn(), updateMany: vi.fn() },
    followUpSchedule: { updateMany: vi.fn() },
  },
}));

vi.mock("@job-hunter/application-manager", () => ({
  transitionApplicationStatus: vi.fn(),
}));

describe("Reply Detection & Classification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("classifyReplyText", () => {
    it("should classify out-of-office autoreply replies", () => {
      const res = classifyReplyText(
        "I am currently out of the office and will return next Monday.",
      );
      expect(res.category).toBe("OUT_OF_OFFICE");
      expect(res.sentiment).toBe("neutral");
    });

    it("should classify rejections", () => {
      const res = classifyReplyText(
        "Thank you for your interest. Unfortunately, we are not moving forward with your application.",
      );
      expect(res.category).toBe("REJECTED");
      expect(res.sentiment).toBe("negative");
    });

    it("should classify interview requests", () => {
      const res = classifyReplyText(
        "We would love to schedule a call with you. Please choose a slot from my calendar link.",
      );
      expect(res.category).toBe("INTERVIEW_REQUEST");
      expect(res.sentiment).toBe("positive");
    });

    it("should classify interest responses", () => {
      const res = classifyReplyText(
        "This sounds interesting. Can you send over your resume and more details?",
      );
      expect(res.category).toBe("INTERESTED");
      expect(res.sentiment).toBe("positive");
    });
  });

  describe("receiveInboundReply", () => {
    it("should create inbound logs and trigger progression updates", async () => {
      const mockThread = {
        id: "thread-123",
        applicationId: "app-789",
        communications: [{ id: "comm-555" }],
      };

      vi.mocked(prisma.communicationThread.findUnique).mockResolvedValue(mockThread as any);
      vi.mocked(prisma.communicationMessage.create).mockResolvedValue({ id: "msg-999" } as any);

      const result = await receiveInboundReply({
        threadId: "thread-123",
        subject: "Re: Staff Engineer Role",
        body: "I would love to schedule a call next week.",
        receivedAt: new Date(),
      });

      expect(result).toBeDefined();
      expect(prisma.communicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            threadId: "thread-123",
            direction: "INBOUND",
            status: "RECEIVED",
          }),
        }),
      );

      // Verify that email reply model log is written
      expect(prisma.emailReply.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            communicationId: "comm-555",
            responseCategory: "INTERVIEW_REQUEST",
            sentiment: "positive",
          }),
        }),
      );

      // Verify follow-ups are cancelled
      expect(prisma.communication.updateMany).toHaveBeenCalled();

      // Verify application status is transitioned
      expect(transitionApplicationStatus).toHaveBeenCalledWith(
        "app-789",
        "REPLIED",
        "Hiring manager requested interview",
      );
    });
  });
});
