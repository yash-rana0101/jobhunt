import { describe, expect, it } from "vitest";

import { extractSkills } from "../src/skills.js";

describe("extractSkills", () => {
  it("categorizes known technical skills", () => {
    const skills = extractSkills(
      "Built TypeScript, Node.js, PostgreSQL, Docker, AWS, OpenAI systems.",
    );

    expect(skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ skillName: "TypeScript", category: "PROGRAMMING_LANGUAGES" }),
        expect.objectContaining({ skillName: "Node.js", category: "BACKEND" }),
        expect.objectContaining({ skillName: "PostgreSQL", category: "DATABASES" }),
        expect.objectContaining({ skillName: "OpenAI", category: "AI" }),
      ]),
    );
  });
});
