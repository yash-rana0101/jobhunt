import { describe, it, expect } from "vitest";
import { analyzeGap } from "../src/engine/gap-analysis.js";

describe("Gap Analysis Engine", () => {
  it("should handle empty inputs gracefully", () => {
    const result = analyzeGap([], []);
    expect(result.missingSkills).toEqual([]);
    expect(result.presentSkills).toEqual([]);
    expect(result.improvementRecommendations).toContain(
      "No technology gaps detected. Highlight your senior mastery of the stack in your resume.",
    );
  });

  it("should classify skills as present when candidate possesses them case-insensitively", () => {
    const candidateSkills = ["React", "TypeScript", "Node.js", "Postgres"];
    const jobTech = ["react", "typescript", "postgres"];
    const result = analyzeGap(candidateSkills, jobTech);

    expect(result.presentSkills).toContain("react");
    expect(result.presentSkills).toContain("typescript");
    expect(result.presentSkills).toContain("postgres");
    expect(result.missingSkills).toEqual([]);
    expect(result.improvementRecommendations[0]).toContain("No technology gaps detected");
  });

  it("should classify skills as missing when candidate does not possess them", () => {
    const candidateSkills = ["React", "TypeScript"];
    const jobTech = ["React", "Go", "Docker"];
    const result = analyzeGap(candidateSkills, jobTech);

    expect(result.presentSkills).toEqual(["React"]);
    expect(result.missingSkills).toEqual(["Go", "Docker"]);
    expect(result.improvementRecommendations).toHaveLength(2);
    expect(result.improvementRecommendations[0]).toContain("Acquire basic familiarity with Go");
    expect(result.improvementRecommendations[1]).toContain("Acquire basic familiarity with Docker");
  });
});
