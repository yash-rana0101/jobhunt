import type { GapAnalysisDetails } from "../types.js";

export function analyzeGap(
  candidateSkills: string[],
  jobTechnologies: string[],
): GapAnalysisDetails {
  const cSkillsLower = candidateSkills.map((s) => s.toLowerCase());
  const present: string[] = [];
  const missing: string[] = [];

  for (const tech of jobTechnologies) {
    if (cSkillsLower.includes(tech.toLowerCase())) {
      present.push(tech);
    } else {
      missing.push(tech);
    }
  }

  const improvements: string[] = [];
  if (missing.length > 0) {
    missing.forEach((skill) => {
      improvements.push(
        `Acquire basic familiarity with ${skill} or document related work under projects.`,
      );
    });
  } else {
    improvements.push(
      "No technology gaps detected. Highlight your senior mastery of the stack in your resume.",
    );
  }

  return {
    missingSkills: missing,
    presentSkills: present,
    improvementRecommendations: improvements,
  };
}
