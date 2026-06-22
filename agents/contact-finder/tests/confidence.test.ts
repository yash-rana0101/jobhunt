import { describe, it, expect } from "vitest";
import { calculateConfidenceScore } from "../src/services/confidence-engine.js";
import type { Job } from "@job-hunter/database";

describe("Confidence Score Calculations", () => {
  const mockJob = {
    id: "job-1",
    title: "React Frontend Developer",
    company: "Retool",
    description: "Looking for an expert React and TypeScript developer.",
  } as unknown as Job;

  it("should score high confidence for a direct LinkedIn profile match with correct company", () => {
    const contact = {
      fullName: "Bob Smith",
      jobTitle: "Senior React Engineer",
      linkedinUrl: "https://linkedin.com/in/bobsmith-retool",
      companyName: "Retool",
      source: "TAVILY",
      category: "ENGINEER" as const,
      seniority: "SENIOR",
    };

    const result = calculateConfidenceScore(contact, mockJob);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.factors.profileMatch).toBe(20);
    expect(result.factors.sourceQuality).toBe(20);
  });

  it("should penalize score when contact category is completely unrelated", () => {
    const contact = {
      fullName: "Tom Marketing",
      jobTitle: "Marketing Manager",
      linkedinUrl: "https://linkedin.com/in/tom-marketing",
      companyName: "Retool",
      source: "TAVILY",
      category: "OTHER" as const,
      seniority: "MID",
    };

    const result = calculateConfidenceScore(contact, mockJob);
    expect(result.factors.departmentMatch).toBeLessThan(20);
    expect(result.factors.roleMatch).toBe(10);
  });
});
