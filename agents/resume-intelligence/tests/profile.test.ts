import { describe, expect, it } from "vitest";

import { buildCandidateProfile } from "../src/profile.js";
import { sampleResumeText } from "./fixtures.js";

describe("buildCandidateProfile", () => {
  it("extracts candidate identity, skills, roles, keywords, and search profile", async () => {
    const profile = await buildCandidateProfile(sampleResumeText);

    expect(profile.candidate.fullName).toBe("Yash Rana");
    expect(profile.candidate.email).toBe("yash@example.com");
    expect(profile.skills.map((skill) => skill.skillName)).toContain("TypeScript");
    expect(profile.skills.map((skill) => skill.skillName)).toContain("Node.js");
    expect(profile.experiences).toHaveLength(2);
    expect(profile.projects).toHaveLength(2);
    expect(profile.education[0]?.university).toBe("Example University");
    expect(profile.keywords.some((keyword) => keyword.keyword === "Node.js")).toBe(true);
    expect(profile.roles[0]?.confidenceScore).toBeGreaterThan(50);
    expect(profile.searchQueries.length).toBeGreaterThan(0);
    expect(profile.embeddings.some((embedding) => embedding.entityType === "RESUME")).toBe(true);
  });
});
