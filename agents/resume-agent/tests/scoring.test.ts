import { describe, it, expect } from "vitest";
import { computeAtsScore } from "../src/engine/scoring.js";

describe("ATS Scoring Engine", () => {
  it("should calculate score correctly with fully matched keywords", () => {
    const keywords = [
      { keyword: "TypeScript", category: "TECHNOLOGY", status: "MATCHED" as const },
      { keyword: "Node.js", category: "TECHNOLOGY", status: "MATCHED" as const },
      { keyword: "Backend Engineer", category: "ROLE", status: "MATCHED" as const },
    ];

    const markdown = `# Yash Rana\n## Experience\n- Built backend services in TypeScript and Node.js.\n- Acted as lead Backend Engineer.`;

    const { scores, suggestions } = computeAtsScore(keywords, markdown);

    expect(scores.overallScore).toBeGreaterThanOrEqual(80);
    expect(scores.keywordMatchScore).toBe(100);
    expect(scores.roleAlignmentScore).toBe(100);
    expect(suggestions.missingKeywords).toHaveLength(0);
  });

  it("should deduct formatting score for tables and raw HTML markup", () => {
    const keywords = [{ keyword: "React", category: "TECHNOLOGY", status: "MATCHED" as const }];
    const markdownWithTable = `# Name\n| Skill | Years |\n|---|---|\n| React | 3 |\n<div>Raw HTML</div>`;

    const { scores, suggestions } = computeAtsScore(keywords, markdownWithTable);

    expect(scores.formattingScore).toBeLessThan(80);
    expect(suggestions.weakSections).toContain(
      "Contains tables, which can disrupt some parser parsing engines.",
    );
    expect(suggestions.weakSections).toContain("Contains HTML markup. Keep it plain markdown.");
  });

  it("should warn about low bullet point count under readability criteria", () => {
    const keywords: {
      keyword: string;
      category: string;
      status: "MATCHED" | "MISSING" | "HIGH_IMPACT";
    }[] = [];
    const plainMarkdown = `# Name\nThis is paragraph text without any bullets. Just a short description.`;

    const { scores, suggestions } = computeAtsScore(keywords, plainMarkdown);

    expect(scores.readabilityScore).toBeLessThan(80);
    expect(suggestions.weakSections).toContain(
      "Low bullet point density. Use bullet points for accomplishments.",
    );
  });
});
