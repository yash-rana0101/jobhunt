import { describe, expect, it } from "vitest";

import { predictTargetRoles } from "../src/roles.js";
import type { ExtractedSkill } from "../src/types.js";

describe("predictTargetRoles", () => {
  it("scores backend and full stack roles from skill signals", () => {
    const skills: ExtractedSkill[] = [
      { skillName: "TypeScript", category: "PROGRAMMING_LANGUAGES", confidenceScore: 0.95 },
      { skillName: "Node.js", category: "BACKEND", confidenceScore: 0.95 },
      { skillName: "React", category: "FRONTEND", confidenceScore: 0.9 },
      { skillName: "PostgreSQL", category: "DATABASES", confidenceScore: 0.9 },
      { skillName: "Docker", category: "DEVOPS", confidenceScore: 0.85 },
    ];

    const roles = predictTargetRoles(skills, "Built APIs, React apps, and Docker services.");

    expect(roles.map((role) => role.roleName)).toContain("Backend Engineer");
    expect(roles.map((role) => role.roleName)).toContain("Full Stack Engineer");
    expect(roles[0]?.confidenceScore).toBeGreaterThanOrEqual(60);
  });
});
