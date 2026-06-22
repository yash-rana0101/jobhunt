import { describe, it, expect } from "vitest";
import { RemoteStatus } from "@prisma/client";
import {
  calculateSkillsMatch,
  calculateExperienceMatch,
  calculateProjectMatch,
  calculateRoleMatch,
  calculateStartupFit,
  calculateLocationFit,
  calculateCompensationFit,
  calculateMatchScore,
} from "../src/engine/scorer.js";
import type { CandidateData, JobData } from "../src/engine/scorer.js";
import { calculateRankingScore } from "../src/engine/ranker.js";
import { generateRecommendation } from "../src/engine/recommendation.js";

const mockCandidate: CandidateData = {
  id: "cand-123",
  fullName: "John Doe",
  skills: [
    { skillName: "React", confidenceScore: 0.9, yearsOfExperience: 5 },
    { skillName: "TypeScript", confidenceScore: 0.8, yearsOfExperience: 4 },
    { skillName: "Node.js", confidenceScore: 0.7, yearsOfExperience: 3 },
  ],
  experiences: [
    {
      role: "Senior Software Engineer",
      company: "Tech Corp",
      responsibilities: ["Built scalable React applications", "Designed Node.js APIs"],
    },
  ],
  projects: [
    {
      projectName: "Personal Portfolio",
      description: "A React and TypeScript showcase site.",
      techStack: ["React", "TypeScript"],
    },
  ],
  roles: [
    { roleName: "Full Stack Engineer", confidenceScore: 0.9 },
    { roleName: "Frontend Engineer", confidenceScore: 0.8 },
  ],
  startupFitScore: 85,
  remoteWorkFitScore: 90,
};

const mockJob: JobData = {
  id: "job-456",
  title: "Frontend Engineer",
  company: "Startup Co",
  description: "Looking for a Frontend Engineer skilled in React, TypeScript, and CSS.",
  experienceClassification: "3-5 Years",
  remoteStatus: RemoteStatus.REMOTE,
  salaryMin: 120000,
  salaryMax: 160000,
  source: "Wellfound",
  technologies: [{ name: "React" }, { name: "TypeScript" }, { name: "CSS" }],
};

describe("Scorer Engine", () => {
  it("should calculate skills match based on technologies", () => {
    // React & TypeScript are present in candidate. CSS is missing. (2 / 3) -> 67%
    const score = calculateSkillsMatch(mockCandidate, mockJob);
    expect(score).toBe(67);
  });

  it("should handle job with no technologies by returning a default", () => {
    const jobNoTech = { ...mockJob, technologies: [] };
    const score = calculateSkillsMatch(mockCandidate, jobNoTech);
    expect(score).toBe(80);
  });

  it("should match experience classification correctly", () => {
    // candidate max experience is 5 years. Job requirements: 3-5 Years -> 100%
    const score = calculateExperienceMatch(mockCandidate, mockJob);
    expect(score).toBe(100);
  });

  it("should handle senior and underqualified experience classifications", () => {
    const jobSenior = { ...mockJob, experienceClassification: "Senior" }; // min 5, max 9 -> candidate has 5, fits min -> 100%
    const scoreSenior = calculateExperienceMatch(mockCandidate, jobSenior);
    expect(scoreSenior).toBe(100);

    const jobLead = { ...mockJob, experienceClassification: "Lead" }; // min 7, max 12 -> candidate has 5, misses min by 2 years
    const scoreLead = calculateExperienceMatch(mockCandidate, jobLead);
    expect(scoreLead).toBeLessThan(100);
  });

  it("should calculate project match using cosine similarity", () => {
    const score = calculateProjectMatch(mockCandidate, mockJob);
    expect(score).toBeGreaterThanOrEqual(30);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should calculate role match based on targets", () => {
    const scoreExact = calculateRoleMatch(mockCandidate, mockJob);
    expect(scoreExact).toBe(100); // "Frontend Engineer" is exact target

    const jobDiff = { ...mockJob, title: "Data Scientist" };
    const scoreDiff = calculateRoleMatch(mockCandidate, jobDiff);
    expect(scoreDiff).toBe(40); // default fallback / low similarity
  });

  it("should calculate startup fit", () => {
    const score = calculateStartupFit(mockCandidate, mockJob);
    expect(score).toBe(85); // Startup fit score from candidate

    const jobCorp = {
      ...mockJob,
      source: "LinkedIn",
      description: "Established corporation with 10000 employees.",
    };
    const scoreCorp = calculateStartupFit(mockCandidate, jobCorp);
    expect(scoreCorp).toBe(58); // 100 - 85/2 = 57.5 ~ 58
  });

  it("should calculate location fit", () => {
    const score = calculateLocationFit(mockCandidate, mockJob);
    expect(score).toBe(90); // remote match

    const jobOnsite = { ...mockJob, remoteStatus: RemoteStatus.ONSITE };
    const scoreOnsite = calculateLocationFit(mockCandidate, jobOnsite);
    expect(scoreOnsite).toBe(30); // max(30, 100 - 90) = 30
  });

  it("should calculate compensation fit", () => {
    const score = calculateCompensationFit(mockCandidate, mockJob);
    expect(score).toBe(100); // max >= 150000

    const jobLow = { ...mockJob, salaryMin: 50000, salaryMax: 80000 };
    const scoreLow = calculateCompensationFit(mockCandidate, jobLow);
    expect(scoreLow).toBe(60);
  });

  it("should calculate overall weighted match score", () => {
    const { score, subScores } = calculateMatchScore(mockCandidate, mockJob);
    expect(score).toBeGreaterThan(50);
    expect(subScores).toHaveProperty("skills");
    expect(subScores).toHaveProperty("experience");
  });
});

describe("Ranker Engine", () => {
  it("should calculate ranking score with salary and remote bonuses", () => {
    const finalScore = calculateRankingScore(80, 10, RemoteStatus.REMOTE, 160000);
    // 80 (match) + 10 (freshness) + 10 (salary >= 150000) + 10 (remote) = 110
    expect(finalScore).toBe(110);
  });
});

describe("Recommendation Engine", () => {
  it("should generate structured recommendations", () => {
    const subScores = {
      skills: 85,
      experience: 90,
      projects: 75,
      role: 100,
      startup: 80,
      location: 90,
      compensation: 100,
    };
    const rec = generateRecommendation(
      subScores,
      ["CSS"],
      ["React", "TypeScript"],
      RemoteStatus.REMOTE,
      "Startup Co",
    );

    expect(rec.whyApply.length).toBeGreaterThan(0);
    expect(rec.whyNotApply).toContain("Requires technologies you haven't mastered: CSS.");
    expect(rec.preparationTips).toContain("Review basic concepts and architecture of CSS.");
    expect(rec.interviewReadinessScore).toBeGreaterThan(60);
  });
});
