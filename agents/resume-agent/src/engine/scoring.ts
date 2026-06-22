import type { AtsScores, ImprovementSuggestions } from "../types/index.js";

interface KeywordInput {
  keyword: string;
  category: string;
  status: "MATCHED" | "MISSING" | "HIGH_IMPACT";
}

export function computeAtsScore(
  keywords: KeywordInput[],
  markdownContent: string,
): { scores: AtsScores; suggestions: ImprovementSuggestions } {
  // 1. Keyword Match Score
  const matchedKeywords = keywords.filter(
    (k) => k.status === "MATCHED" || k.status === "HIGH_IMPACT",
  );
  const totalKeywords = keywords.length;
  const keywordMatchScore =
    totalKeywords > 0 ? Math.round((matchedKeywords.length / totalKeywords) * 100) : 70;

  // 2. Role Alignment Score
  const roleKeywords = keywords.filter((k) => k.category === "ROLE");
  const matchedRoles = roleKeywords.filter(
    (k) => k.status === "MATCHED" || k.status === "HIGH_IMPACT",
  );
  const roleAlignmentScore =
    roleKeywords.length > 0 ? Math.round((matchedRoles.length / roleKeywords.length) * 100) : 80;

  // 3. Skills Match Score
  const techKeywords = keywords.filter(
    (k) => k.category === "TECHNOLOGY" || k.category === "PRIMARY" || k.category === "SECONDARY",
  );
  const matchedTech = techKeywords.filter(
    (k) => k.status === "MATCHED" || k.status === "HIGH_IMPACT",
  );
  const skillsMatchScore =
    techKeywords.length > 0 ? Math.round((matchedTech.length / techKeywords.length) * 100) : 75;

  // 4. Project Match Score
  // Base it on project matches or keywords flagged as PROJECT
  const projectKeywords = keywords.filter((k) => k.category === "PROJECT");
  const matchedProjects = projectKeywords.filter(
    (k) => k.status === "MATCHED" || k.status === "HIGH_IMPACT",
  );
  const projectMatchScore =
    projectKeywords.length > 0
      ? Math.round((matchedProjects.length / projectKeywords.length) * 100)
      : 85;

  // 5. Formatting Score
  let formattingScore = 100;
  const weakSections: string[] = [];

  // Check for multi-column or table markers (Markdown tables)
  if (markdownContent.includes("|---|") || markdownContent.includes("| :---")) {
    formattingScore -= 20;
    weakSections.push("Contains tables, which can disrupt some parser parsing engines.");
  }
  // Check for HTML elements or icons
  if (/<[a-z][\s\S]*>/i.test(markdownContent)) {
    formattingScore -= 10;
    weakSections.push("Contains HTML markup. Keep it plain markdown.");
  }
  // Check for reasonable length (too long or too short)
  const lineCount = markdownContent.split("\n").length;
  if (lineCount < 30) {
    formattingScore -= 15;
    weakSections.push(
      "Resume is very short. Ensure you include projects, experience, and education.",
    );
  } else if (lineCount > 250) {
    formattingScore -= 10;
    weakSections.push("Resume is excessively long. Try to keep it concise and under 2 pages.");
  }

  // 6. Readability Score
  let readabilityScore = 90;
  // Check bullet point density
  const bulletMatches = markdownContent.match(/^\s*[-*+]\s+/gm);
  const bulletCount = bulletMatches ? bulletMatches.length : 0;
  if (bulletCount < 5) {
    readabilityScore -= 20;
    weakSections.push("Low bullet point density. Use bullet points for accomplishments.");
  }

  // Calculate overall score (weighted average)
  // Weights: Keyword Match (25%), Role Alignment (20%), Skills Match (20%), Project Match (15%), Formatting (10%), Readability (10%)
  const overallScore = Math.round(
    keywordMatchScore * 0.25 +
      roleAlignmentScore * 0.2 +
      skillsMatchScore * 0.2 +
      projectMatchScore * 0.15 +
      formattingScore * 0.1 +
      readabilityScore * 0.1,
  );

  // Compile suggestions
  const missingKeywords = keywords.filter((k) => k.status === "MISSING").map((k) => k.keyword);
  const missingSkills = keywords
    .filter(
      (k) => k.status === "MISSING" && (k.category === "TECHNOLOGY" || k.category === "PRIMARY"),
    )
    .map((k) => k.keyword);

  const improvementOpportunities: string[] = [];
  if (keywordMatchScore < 80) {
    improvementOpportunities.push(
      "Incorporate missing high impact keywords in your responsibilities.",
    );
  }
  if (skillsMatchScore < 85 && missingSkills.length > 0) {
    improvementOpportunities.push(
      `Acquire or highlight exposure to missing skills: ${missingSkills.slice(0, 3).join(", ")}.`,
    );
  }
  if (projectMatchScore < 80) {
    improvementOpportunities.push(
      "Highlight projects utilizing the key technologies requested in the job description.",
    );
  }
  if (formattingScore < 90) {
    improvementOpportunities.push(
      "Refactor resume structure to be strictly single-column without tables or raw HTML.",
    );
  }

  return {
    scores: {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      keywordMatchScore: Math.min(100, Math.max(0, keywordMatchScore)),
      roleAlignmentScore: Math.min(100, Math.max(0, roleAlignmentScore)),
      skillsMatchScore: Math.min(100, Math.max(0, skillsMatchScore)),
      projectMatchScore: Math.min(100, Math.max(0, projectMatchScore)),
      formattingScore: Math.min(100, Math.max(0, formattingScore)),
      readabilityScore: Math.min(100, Math.max(0, readabilityScore)),
    },
    suggestions: {
      missingSkills: missingSkills.slice(0, 10),
      missingKeywords: missingKeywords.slice(0, 15),
      weakSections,
      improvementOpportunities,
    },
  };
}
