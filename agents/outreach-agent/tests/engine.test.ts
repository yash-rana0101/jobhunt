import { describe, it, expect } from "vitest";
import { selectRelevantProjects, selectRelevantStrengths } from "../src/engine/prompt.js";
import { evaluateDraftScores } from "../src/engine/reviewer.js";
import { ProviderFactory } from "../src/engine/provider.js";
import type { CandidateProject } from "@prisma/client";

describe("Outreach Agent Engine Tests", () => {
  describe("Prompt Engine - selectRelevantProjects", () => {
    it("should select AI projects for an AI job", () => {
      const projects: CandidateProject[] = [
        {
          id: "p1",
          candidateId: "c1",
          projectName: "DevOps Deployer",
          description: "AWS cloud terraform infrastructure automation",
          techStack: ["AWS", "Terraform"],
          projectType: "DevOps",
          role: "Engineer",
          githubLink: null,
          liveLink: null,
          businessImpact: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "p2",
          candidateId: "c1",
          projectName: "LLM Chat",
          description: "Building an agentic RAG with OpenAI gpt-4o-mini",
          techStack: ["OpenAI", "Python"],
          projectType: "AI",
          role: "ML Engineer",
          githubLink: null,
          liveLink: null,
          businessImpact: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const selected = selectRelevantProjects(
        projects,
        "AI Research Engineer",
        "Working on LLMs and GPT technologies",
      );
      expect(selected.length).toBe(1);
      expect(selected[0].projectName).toBe("LLM Chat");
    });
  });

  describe("Prompt Engine - selectRelevantStrengths", () => {
    it("should select strengths related to the job", () => {
      const strengths = [
        "Python Programming",
        "React Development",
        "AWS Cloud Infrastructure",
        "Machine Learning",
      ];
      const selected = selectRelevantStrengths(
        strengths,
        "AI Research Engineer",
        "Working on LLMs and GPT machine learning technologies",
      );
      expect(selected).toContain("Machine Learning");
    });
  });

  describe("Reviewer Engine - evaluateDraftScores", () => {
    it("should mark draft READY when scores are high", () => {
      const scores = {
        qualityScore: 80,
        personalizationScore: 80,
        relevanceScore: 80,
        spamRiskScore: 10,
        professionalismScore: 85,
        clarityScore: 90,
      };

      const result = evaluateDraftScores(scores);
      expect(result.status).toBe("READY");
    });

    it("should mark draft REVIEW_REQUIRED when spam risk is high", () => {
      const scores = {
        qualityScore: 80,
        personalizationScore: 80,
        relevanceScore: 80,
        spamRiskScore: 40,
        professionalismScore: 85,
        clarityScore: 90,
      };

      const result = evaluateDraftScores(scores);
      expect(result.status).toBe("REVIEW_REQUIRED");
    });
  });

  describe("ProviderFactory", () => {
    it("should return the correct provider instance", () => {
      const provider = ProviderFactory.getProvider("openai");
      expect(provider.constructor.name).toBe("OpenAiProvider");
    });
  });
});
