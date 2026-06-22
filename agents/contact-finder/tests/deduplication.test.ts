import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CompanyContact, ContactDiscoveryRun, Company, JobMatch } from "@prisma/client";

// Mock @job-hunter/database prisma client
vi.mock("@job-hunter/database", () => {
  const mockPrisma = {
    companyContact: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    jobMatch: {
      findUnique: vi.fn(),
    },
    contactDiscoveryRun: {
      create: vi.fn(),
      update: vi.fn(),
    },
    referralTarget: {
      upsert: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

import { runContactDiscovery } from "../src/services/discovery-pipeline.js";
import { prisma } from "@job-hunter/database";

describe("Contact Deduplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update contact if a duplicate is found by LinkedIn URL", async () => {
    // Setup mock return values using vi.spyOn to avoid unbound-method errors
    vi.spyOn(prisma.jobMatch, "findUnique").mockResolvedValue({
      id: "match-1",
      jobId: "job-1",
      candidateId: "cand-1",
      job: {
        id: "job-1",
        title: "Staff Software Engineer",
        company: "Vercel",
        description: "Need Next.js expertise.",
      },
      candidate: {
        id: "cand-1",
        experiences: [],
        education: [],
      },
    } as unknown as JobMatch);

    vi.spyOn(prisma.contactDiscoveryRun, "create").mockResolvedValue({
      id: "run-1",
    } as unknown as ContactDiscoveryRun);

    vi.spyOn(prisma.company, "findUnique").mockResolvedValue({
      id: "company-1",
      companyName: "Vercel",
    } as unknown as Company);

    vi.spyOn(prisma.companyContact, "findFirst").mockResolvedValue({
      id: "existing-contact-1",
      fullName: "Jane Doe",
      jobTitle: "Hiring Manager",
      linkedinUrl: "https://linkedin.com/in/janedoe",
      companyId: "company-1",
      category: "HIRING_MANAGER",
    } as unknown as CompanyContact);

    const updateSpy = vi.spyOn(prisma.companyContact, "update").mockResolvedValue({
      id: "existing-contact-1",
      fullName: "Jane Doe",
      jobTitle: "Hiring Manager",
      linkedinUrl: "https://linkedin.com/in/janedoe",
      companyId: "company-1",
      category: "HIRING_MANAGER",
      confidenceScore: 90,
      contactPriority: 85,
      source: "TAVILY",
      companyName: "Vercel",
      status: "DISCOVERED",
    } as unknown as CompanyContact);

    const createSpy = vi.spyOn(prisma.companyContact, "create").mockResolvedValue({
      id: "new-contact-1",
      fullName: "Jane Doe",
      jobTitle: "Hiring Manager",
      linkedinUrl: "https://linkedin.com/in/janedoe",
      companyId: "company-1",
      category: "HIRING_MANAGER",
      confidenceScore: 90,
      contactPriority: 85,
      source: "TAVILY",
      companyName: "Vercel",
      status: "DISCOVERED",
    } as unknown as CompanyContact);

    // Mock search results by mocking the fetch API response with proper typing
    const mockFetch = vi.fn().mockImplementation((url: unknown) => {
      if (typeof url === "string" && url.includes("tavily.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  title: "Jane Doe - Hiring Manager - Vercel | LinkedIn",
                  url: "https://linkedin.com/in/janedoe",
                  content: "Jane is a Hiring Manager at Vercel.",
                  score: 0.95,
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    vi.stubGlobal("fetch", mockFetch);

    // Inject dummy api key so it runs the search
    process.env.TAVILY_API_KEY = "test-key";

    await runContactDiscovery("match-1");

    // Verify update was called instead of create
    expect(updateSpy).toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
