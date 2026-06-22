import { clampScore, uniqueStrings } from "./text-utils.js";
import type { ExtractedSkill, PredictedRole } from "./types.js";

type RoleRule = {
  roleName: string;
  requiredSignals: string[];
  bonusSignals: string[];
};

const roleRules: readonly RoleRule[] = [
  {
    roleName: "Software Engineer",
    requiredSignals: ["TypeScript", "JavaScript", "Python", "Java"],
    bonusSignals: ["System Design", "Testing", "Git"],
  },
  {
    roleName: "Backend Engineer",
    requiredSignals: ["Node.js", "Fastify", "Express", "REST APIs", "PostgreSQL"],
    bonusSignals: ["Microservices", "Redis", "Docker", "AWS"],
  },
  {
    roleName: "Full Stack Engineer",
    requiredSignals: ["React", "Next.js", "Node.js", "TypeScript"],
    bonusSignals: ["PostgreSQL", "Tailwind CSS", "REST APIs"],
  },
  {
    roleName: "Node.js Engineer",
    requiredSignals: ["Node.js", "TypeScript", "JavaScript"],
    bonusSignals: ["Fastify", "Express", "PostgreSQL", "Redis"],
  },
  {
    roleName: "TypeScript Engineer",
    requiredSignals: ["TypeScript", "JavaScript"],
    bonusSignals: ["Node.js", "React", "Next.js"],
  },
  {
    roleName: "Python Engineer",
    requiredSignals: ["Python"],
    bonusSignals: ["AI", "ETL", "Data Engineering"],
  },
  {
    roleName: "AI Engineer",
    requiredSignals: ["OpenAI", "LLMs", "Vector Databases", "Python"],
    bonusSignals: ["LangChain", "TypeScript", "Node.js"],
  },
  {
    roleName: "Founding Engineer",
    requiredSignals: ["Full Stack", "Node.js", "React", "System Design"],
    bonusSignals: ["AWS", "Docker", "Ownership", "Startup"],
  },
  {
    roleName: "Platform Engineer",
    requiredSignals: ["Docker", "Kubernetes", "CI/CD", "AWS"],
    bonusSignals: ["Microservices", "Distributed Systems", "Redis"],
  },
  {
    roleName: "DevOps Engineer",
    requiredSignals: ["Docker", "Kubernetes", "CI/CD", "GitHub Actions"],
    bonusSignals: ["AWS", "Linux"],
  },
];

export function predictTargetRoles(
  skills: readonly ExtractedSkill[],
  resumeText: string,
): PredictedRole[] {
  const skillNames = new Set(skills.map((skill) => skill.skillName.toLowerCase()));
  const lowerResume = resumeText.toLowerCase();

  return roleRules
    .map((rule) => {
      const requiredMatches = countSignals(rule.requiredSignals, skillNames, lowerResume);
      const bonusMatches = countSignals(rule.bonusSignals, skillNames, lowerResume);
      const requiredRatio = requiredMatches / Math.max(rule.requiredSignals.length, 1);
      const bonusRatio = bonusMatches / Math.max(rule.bonusSignals.length, 1);
      const confidenceScore = clampScore(25 + requiredRatio * 55 + bonusRatio * 20);

      return {
        roleName: rule.roleName,
        confidenceScore,
        searchQueries: buildSearchQueries(rule.roleName, skills),
      };
    })
    .sort((left, right) => right.confidenceScore - left.confidenceScore);
}

export function generateSearchProfile(
  roles: readonly PredictedRole[],
  skills: readonly ExtractedSkill[],
): string[] {
  return uniqueStrings(
    roles.slice(0, 6).flatMap((role) => buildSearchQueries(role.roleName, skills)),
  ).slice(0, 20);
}

function countSignals(
  signals: readonly string[],
  skillNames: ReadonlySet<string>,
  resumeText: string,
): number {
  return signals.filter(
    (signal) => skillNames.has(signal.toLowerCase()) || resumeText.includes(signal.toLowerCase()),
  ).length;
}

function buildSearchQueries(roleName: string, skills: readonly ExtractedSkill[]): string[] {
  const topSkills = skills.slice(0, 4).map((skill) => skill.skillName);
  const primarySkill = topSkills[0] ?? "Software";
  const secondarySkill = topSkills[1] ?? "Engineering";
  const roleAwarePrimary = roleName.toLowerCase().includes(primarySkill.toLowerCase())
    ? roleName
    : `${primarySkill} ${roleName}`;
  const roleAwareSecondary = roleName.toLowerCase().includes(secondarySkill.toLowerCase())
    ? roleName
    : `${secondarySkill} ${roleName}`;

  return uniqueStrings([
    `${roleAwarePrimary} Remote`,
    `${roleAwareSecondary} Startup`,
    `${roleName} ${topSkills.slice(0, 3).join(" ")}`.trim(),
  ]);
}
