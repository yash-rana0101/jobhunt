import { describe, expect, it } from "vitest";

import { buildCandidateProfile } from "../src/profile.js";
import { sampleResumeText } from "./fixtures.js";

describe("resume intelligence pipeline", () => {
  it("builds a complete profile without requiring external AI services", async () => {
    const profile = await buildCandidateProfile(sampleResumeText);

    expect(profile.candidate.summary).toContain("Full stack software engineer");
    expect(profile.analysis.startupFitScore).toBeGreaterThan(50);
    expect(profile.analysis.ownershipScore).toBeGreaterThan(50);
    expect(profile.keywords.length).toBeGreaterThanOrEqual(profile.skills.length);
    expect(
      profile.embeddings.every((embedding) => embedding.provider === "deterministic-local"),
    ).toBe(true);
  });
});
