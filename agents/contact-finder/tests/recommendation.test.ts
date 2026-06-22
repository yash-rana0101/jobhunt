import { describe, it, expect } from "vitest";
import { generateRecommendations } from "../src/services/recommendation-engine.js";
import type { CompanyContact, ReferralTarget } from "@job-hunter/database";

describe("Recommendation Engine", () => {
  it("should categorize contacts by their roles and priority scores", () => {
    const mockContacts: CompanyContact[] = [
      {
        id: "c-recruiter",
        fullName: "Sarah Talent",
        jobTitle: "Senior Technical Recruiter",
        category: "RECRUITER",
        contactPriority: 60,
        confidenceScore: 80,
      },
      {
        id: "c-cto",
        fullName: "Alex Tech",
        jobTitle: "CTO",
        category: "CTO",
        contactPriority: 85,
        confidenceScore: 90,
      },
      {
        id: "c-hm",
        fullName: "Jane Manager",
        jobTitle: "Hiring Manager",
        category: "HIRING_MANAGER",
        contactPriority: 95,
        confidenceScore: 95,
      },
    ] as unknown as CompanyContact[];

    const mockReferrals: ReferralTarget[] = [
      {
        id: "ref-1",
        contactId: "c-cto",
        candidateId: "cand-1",
        jobId: "job-1",
        ranking: 2, // SAME_DEPARTMENT
        type: "SAME_DEPARTMENT",
      },
    ] as unknown as ReferralTarget[];

    const recommendations = generateRecommendations(mockContacts, mockReferrals);

    expect(recommendations.bestOverall?.fullName).toBe("Jane Manager");
    expect(recommendations.bestRecruiter?.fullName).toBe("Sarah Talent");
    expect(recommendations.bestTechnical?.fullName).toBe("Alex Tech");
    expect(recommendations.bestExecutive?.fullName).toBe("Alex Tech");
    expect(recommendations.bestReferral?.fullName).toBe("Alex Tech");
  });
});
