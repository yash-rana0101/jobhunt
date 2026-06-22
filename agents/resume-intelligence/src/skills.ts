import { skillCatalog, skillSearchTerms } from "./skill-catalog.js";
import { includesTerm } from "./text-utils.js";
import type { ExtractedSkill } from "./types.js";

export function extractSkills(resumeText: string): ExtractedSkill[] {
  return skillCatalog
    .filter((definition) =>
      skillSearchTerms(definition).some((term) => includesTerm(resumeText, term)),
    )
    .map((definition) => ({
      skillName: definition.name,
      category: definition.category,
      confidenceScore: calculateSkillConfidence(resumeText, definition.name),
      yearsOfExperience: estimateYearsOfExperience(resumeText, definition.name),
    }))
    .sort((left, right) => right.confidenceScore - left.confidenceScore);
}

function calculateSkillConfidence(text: string, skillName: string): number {
  const matches = text.match(new RegExp(skillName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
  const count = matches?.length ?? 0;

  if (count >= 3) {
    return 0.95;
  }

  if (count === 2) {
    return 0.9;
  }

  return 0.82;
}

function estimateYearsOfExperience(text: string, skillName: string): number | undefined {
  const escapedSkill = skillName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const skillNearYears = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\+?\\s+years?[^.\\n]{0,60}${escapedSkill}`,
    "i",
  );
  const yearsNearSkill = new RegExp(
    `${escapedSkill}[^.\\n]{0,60}(\\d+(?:\\.\\d+)?)\\+?\\s+years?`,
    "i",
  );
  const match = text.match(skillNearYears) ?? text.match(yearsNearSkill);

  if (!match?.[1]) {
    return undefined;
  }

  return Number.parseFloat(match[1]);
}
