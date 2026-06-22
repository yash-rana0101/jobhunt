import { describe, it, expect } from "vitest";
import { calculatePriorityScore } from "../src/services/ranking-engine.js";
import type { Job } from "@job-hunter/database";

describe("Priority Score Calculations", () => {
  const mockJob = {
    id: "job-1",
    title: "Senior Backend Engineer",
    company: "Stripe",
    description: "We are looking for a Node.js / TypeScript developer.",
    experienceClassification: "MID",
  } as unknown as Job;

  it("should rank Hiring Manager as the highest priority", () => {
    const contact = {
      fullName: "Jane Doe",
      jobTitle: "Hiring Manager",
      companyName: "Stripe",
      source: "TAVILY",
      category: "HIRING_MANAGER" as const,
      seniority: "EXECUTIVE",
      confidenceScore: 0,
    };

    const result = calculatePriorityScore(contact, mockJob);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.factors.hiringAuthority).toBe(25);
  });

  it("should rank executive CTO high in engineering relevance", () => {
    const contact = {
      fullName: "John CTO",
      jobTitle: "CTO",
      companyName: "Stripe",
      source: "TAVILY",
      category: "CTO" as const,
      seniority: "EXECUTIVE",
      confidenceScore: 0,
    };

    const result = calculatePriorityScore(contact, mockJob);
    expect(result.score).toBeGreaterThan(60);
    expect(result.factors.engineeringRelevance).toBe(15);
  });

  it("should rank technical recruiters high in response rate but moderate authority", () => {
    const contact = {
      fullName: "Alice Recruiter",
      jobTitle: "Technical Recruiter",
      companyName: "Stripe",
      source: "TAVILY",
      category: "RECRUITER" as const,
      seniority: "MID",
      confidenceScore: 0,
    };

    const result = calculatePriorityScore(contact, mockJob);
    expect(result.factors.likelihoodToRespond).toBe(15);
    expect(result.factors.hiringAuthority).toBe(12);
  });
});
