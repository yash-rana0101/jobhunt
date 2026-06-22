import { clampScore } from "./text-utils.js";
import type {
  CandidateStrengthAnalysis,
  ExtractedExperience,
  ExtractedProject,
  ExtractedSkill,
} from "./types.js";

export function analyzeCandidateStrengths(input: {
  resumeText: string;
  skills: readonly ExtractedSkill[];
  experiences: readonly ExtractedExperience[];
  projects: readonly ExtractedProject[];
}): CandidateStrengthAnalysis {
  const categories = new Set(input.skills.map((skill) => skill.category));
  const hasImpactMetrics = input.experiences.some(
    (experience) => experience.impactMetrics.length > 0,
  );
  const hasProjects = input.projects.length > 0;
  const text = input.resumeText.toLowerCase();

  return {
    topStrengths: [
      categories.has("BACKEND") ? "Backend API and service development" : undefined,
      categories.has("FRONTEND") ? "Frontend product development" : undefined,
      categories.has("AI") ? "AI-native product and automation exposure" : undefined,
      hasImpactMetrics ? "Impact-oriented execution with measurable outcomes" : undefined,
      hasProjects ? "Project-based proof of practical delivery" : undefined,
    ].filter((value): value is string => value !== undefined),
    uniqueAdvantages: [
      categories.has("AI") && categories.has("BACKEND")
        ? "Combines AI implementation with backend engineering"
        : undefined,
      categories.has("FRONTEND") && categories.has("BACKEND")
        ? "Can move across full-stack product surfaces"
        : undefined,
      text.includes("startup") ? "Signals comfort with startup ambiguity" : undefined,
    ].filter((value): value is string => value !== undefined),
    competitiveAdvantages: [
      "Structured technical skill set for ATS matching",
      hasImpactMetrics
        ? "Resume includes quantified achievements"
        : "Resume can be improved with quantified outcomes",
      input.skills.length >= 8 ? "Broad searchable keyword surface" : "Focused technical profile",
    ],
    startupFitScore: clampScore(
      50 + scoreIf(text, ["startup", "founding", "ownership", "built"]) + categories.size * 3,
    ),
    enterpriseFitScore: clampScore(
      45 +
        scoreIf(text, ["scale", "security", "compliance", "enterprise"]) +
        input.experiences.length * 8,
    ),
    remoteWorkFitScore: clampScore(
      45 + scoreIf(text, ["remote", "distributed", "async", "cross-functional"]),
    ),
    leadershipScore: clampScore(
      40 + scoreIf(text, ["led", "mentored", "managed", "owned", "architected"]),
    ),
    ownershipScore: clampScore(
      50 + scoreIf(text, ["owned", "built", "launched", "delivered", "end-to-end"]),
    ),
  };
}

function scoreIf(text: string, signals: readonly string[]): number {
  return signals.filter((signal) => text.includes(signal)).length * 10;
}
