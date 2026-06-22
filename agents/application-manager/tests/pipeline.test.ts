import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@job-hunter/database";
import {
  createApplication,
  getApplicationDetails,
  updateApplication,
  createInterview,
  createOrUpdateOffer,
} from "../src/index.js";

describe("Application Management & Pipeline Integration", () => {
  let candidateId: string;
  let jobId: string;
  let applicationId: string;

  beforeAll(async () => {
    // Create test candidate
    const candidate = await prisma.candidate.create({
      data: {
        fullName: "Test Candidate",
        email: "test@candidate.com",
      },
    });
    candidateId = candidate.id;

    // Create test job
    const job = await prisma.job.create({
      data: {
        title: "Staff Software Engineer",
        company: "Acme Corp",
        description: "Looking for a staff backend engineer.",
        source: "YC",
      },
    });
    jobId = job.id;
  });

  afterAll(async () => {
    // Clean up
    if (applicationId) {
      await prisma.application.deleteMany({ where: { id: applicationId } });
    }
    if (jobId) {
      await prisma.job.deleteMany({ where: { id: jobId } });
    }
    if (candidateId) {
      await prisma.candidate.deleteMany({ where: { id: candidateId } });
    }
  });

  it("should create application, calculate default priority, and schedule default reminders", async () => {
    const app = await createApplication({
      jobId,
      candidateId,
      status: "DISCOVERED",
    });
    applicationId = app.id;

    expect(app.id).toBeDefined();
    expect(app.status).toBe("DISCOVERED");

    // Fetch details
    const details = await getApplicationDetails(app.id);
    expect(details).toBeDefined();
    expect(details?.reminders).toHaveLength(3); // Day 3, 7, 14
    expect(details?.activities).toHaveLength(1); // Application tracked activity
    expect(details?.priority).toBeGreaterThan(0); // Priority score calculated
  });

  it("should transition status and log transitions in status history & timeline", async () => {
    const updated = await updateApplication(applicationId, {
      status: "SHORTLISTED",
      reason: "Matched candidate requirements",
    });

    expect(updated?.status).toBe("SHORTLISTED");
    expect(updated?.statusHistory).toHaveLength(1);
    expect(updated?.statusHistory[0].oldStatus).toBe("DISCOVERED");
    expect(updated?.statusHistory[0].newStatus).toBe("SHORTLISTED");
    expect(updated?.statusHistory[0].reason).toBe("Matched candidate requirements");
  });

  it("should schedule interview and transition application status", async () => {
    const interview = await createInterview({
      applicationId,
      roundName: "Technical Screen",
      interviewerName: "Alice EM",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      duration: 60,
    });

    expect(interview.id).toBeDefined();
    expect(interview.roundName).toBe("Technical Screen");

    // The application status should automatically transition to TECHNICAL_ROUND
    const details = await getApplicationDetails(applicationId);
    expect(details?.status).toBe("TECHNICAL_ROUND");
  });

  it("should log offer details and transition status to OFFER_RECEIVED", async () => {
    const offer = await createOrUpdateOffer({
      applicationId,
      baseSalary: 150000,
      bonus: 20000,
      equity: "0.05%",
      status: "PENDING",
    });

    expect(offer.id).toBeDefined();
    expect(offer.baseSalary).toBe(150000);

    const details = await getApplicationDetails(applicationId);
    expect(details?.status).toBe("OFFER_RECEIVED");
  });
});
