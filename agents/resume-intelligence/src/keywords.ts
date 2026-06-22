import { uniqueStrings } from "./text-utils.js";
import type {
  ExtractedExperience,
  ExtractedKeyword,
  ExtractedProject,
  ExtractedSkill,
  PredictedRole,
} from "./types.js";

export function generateAtsKeywords(input: {
  skills: readonly ExtractedSkill[];
  experiences: readonly ExtractedExperience[];
  projects: readonly ExtractedProject[];
  roles: readonly PredictedRole[];
}): ExtractedKeyword[] {
  const keywordCandidates: ExtractedKeyword[] = [
    ...input.skills.map((skill) => ({
      keyword: skill.skillName,
      category: skill.category === "TOOLS" ? ("TOOL" as const) : ("SKILL" as const),
      weight: Math.round(skill.confidenceScore * 100) / 100,
      source: "skill_extraction",
    })),
    ...input.experiences.flatMap((experience) =>
      uniqueStrings([...experience.technologiesUsed, ...experience.impactMetrics]).map(
        (keyword) => ({
          keyword,
          category: "EXPERIENCE" as const,
          weight: 0.85,
          source: experience.company,
        }),
      ),
    ),
    ...input.projects.flatMap((project) =>
      uniqueStrings(project.techStack).map((keyword) => ({
        keyword,
        category: "PROJECT" as const,
        weight: 0.8,
        source: project.projectName,
      })),
    ),
    ...input.roles.map((role) => ({
      keyword: role.roleName,
      category: "ROLE" as const,
      weight: role.confidenceScore / 100,
      source: "role_prediction",
    })),
  ];

  const deduped = new Map<string, ExtractedKeyword>();

  for (const keyword of keywordCandidates) {
    const key = keyword.keyword.toLowerCase();
    const existing = deduped.get(key);

    if (!existing || keyword.weight > existing.weight) {
      deduped.set(key, keyword);
    }
  }

  return [...deduped.values()].sort((left, right) => right.weight - left.weight);
}
