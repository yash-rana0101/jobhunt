import { computeCosineSimilarity } from "./similarity.js";
import type { MatchSubScores } from "../types.js";
import { RemoteStatus } from "@prisma/client";

// Define Candidate interface for scoring inputs
export interface CandidateData {
  id: string;
  fullName: string;
  skills: { skillName: string; confidenceScore: number; yearsOfExperience: number | null }[];
  experiences: { role: string; company: string; responsibilities: string[] }[];
  projects: { projectName: string; description: string | null; techStack: string[] }[];
  roles: { roleName: string; confidenceScore: number }[];
  startupFitScore: number;
  remoteWorkFitScore: number;
}

// Define Job interface for scoring inputs
export interface JobData {
  id: string;
  title: string;
  company: string;
  description: string;
  experienceClassification: string | null;
  remoteStatus: RemoteStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  source: string;
  technologies: { name: string }[];
}

export function calculateSkillsMatch(candidate: CandidateData, job: JobData): number {
  if (job.technologies.length === 0) return 80; // default benchmark

  const jobTechs = job.technologies.map((t) => t.name.toLowerCase());
  const candSkills = candidate.skills.map((s) => s.skillName.toLowerCase());

  let matched = 0;
  for (const tech of jobTechs) {
    if (candSkills.includes(tech)) {
      matched++;
    }
  }

  return Math.round((matched / jobTechs.length) * 100);
}

export function calculateExperienceMatch(candidate: CandidateData, job: JobData): number {
  // Estimate candidate experience in years based on skills/experiences
  let candYears = 3.0; // standard default baseline
  const skillYears = candidate.skills.map((s) => s.yearsOfExperience || 0);
  if (skillYears.length > 0) {
    candYears = Math.max(...skillYears, 3.0);
  }

  const classification = job.experienceClassification || "3-5 Years";
  let targetMin = 3;
  let targetMax = 5;

  if (classification === "Internship") {
    targetMin = 0;
    targetMax = 1;
  } else if (classification === "Entry Level") {
    targetMin = 0;
    targetMax = 2;
  } else if (classification === "1-2 Years") {
    targetMin = 1;
    targetMax = 3;
  } else if (classification === "3-5 Years") {
    targetMin = 3;
    targetMax = 6;
  } else if (classification === "Senior") {
    targetMin = 5;
    targetMax = 9;
  } else if (classification === "Lead") {
    targetMin = 7;
    targetMax = 12;
  } else if (classification === "Principal") {
    targetMin = 10;
    targetMax = 20;
  }

  if (candYears >= targetMin && candYears <= targetMax) {
    return 100;
  } else if (candYears > targetMax) {
    return 95; // slightly overqualified but high fit
  } else {
    // Underqualified penalty
    const diff = targetMin - candYears;
    return Math.max(40, Math.round(100 - diff * 15));
  }
}

export function calculateProjectMatch(candidate: CandidateData, job: JobData): number {
  if (candidate.projects.length === 0) return 50;

  // Concat all project information into a single text block
  const projectsText = candidate.projects
    .map((p) => `${p.projectName} ${p.description || ""} ${p.techStack.join(" ")}`)
    .join(" ");

  const similarity = computeCosineSimilarity(projectsText, job.description);
  // Scale cosine similarity (0 to 1) to a 0 to 100 score
  return Math.round(Math.min(100, similarity * 180 + 30));
}

export function calculateRoleMatch(candidate: CandidateData, job: JobData): number {
  if (candidate.roles.length === 0) return 60;

  const jobTitle = job.title.toLowerCase();
  let maxScore = 40;

  for (const target of candidate.roles) {
    const targetName = target.roleName.toLowerCase();
    if (jobTitle.includes(targetName) || targetName.includes(jobTitle)) {
      maxScore = Math.max(maxScore, 100);
    } else {
      const similarity = computeCosineSimilarity(targetName, jobTitle);
      maxScore = Math.max(maxScore, Math.round(similarity * 100));
    }
  }

  return Math.max(40, maxScore);
}

export function calculateStartupFit(candidate: CandidateData, job: JobData): number {
  const isJobStartup =
    job.source.toLowerCase().includes("yc") ||
    job.source.toLowerCase().includes("wellfound") ||
    job.description.toLowerCase().includes("startup") ||
    job.description.toLowerCase().includes("founding");

  const candStartupFit = candidate.startupFitScore;

  if (isJobStartup) {
    return candStartupFit;
  } else {
    // Large enterprise fit check
    return Math.round(100 - candStartupFit / 2);
  }
}

export function calculateLocationFit(candidate: CandidateData, job: JobData): number {
  const candRemoteFit = candidate.remoteWorkFitScore;
  const status = job.remoteStatus;

  if (status === RemoteStatus.REMOTE) {
    return candRemoteFit;
  } else if (status === RemoteStatus.HYBRID) {
    return Math.round(candRemoteFit * 0.8);
  } else if (status === RemoteStatus.ONSITE) {
    return Math.max(30, 100 - candRemoteFit);
  }

  return 70;
}

export function calculateCompensationFit(candidate: CandidateData, job: JobData): number {
  if (job.salaryMin === null && job.salaryMax === null) {
    return 80; // Standard baseline for unspecified salaries
  }

  // Standard benchmark compensation mapping
  const min = job.salaryMin || 100000;
  const max = job.salaryMax || 150000;

  if (max >= 130000) {
    return 100;
  } else if (min >= 90000) {
    return 85;
  }

  return 60;
}

export function calculateMatchScore(
  candidate: CandidateData,
  job: JobData,
): { score: number; subScores: MatchSubScores } {
  const subScores: MatchSubScores = {
    skills: calculateSkillsMatch(candidate, job),
    experience: calculateExperienceMatch(candidate, job),
    projects: calculateProjectMatch(candidate, job),
    role: calculateRoleMatch(candidate, job),
    startup: calculateStartupFit(candidate, job),
    location: calculateLocationFit(candidate, job),
    compensation: calculateCompensationFit(candidate, job),
  };

  // Weighted score calculation
  const weighted =
    subScores.skills * 0.3 +
    subScores.experience * 0.2 +
    subScores.projects * 0.15 +
    subScores.role * 0.15 +
    subScores.startup * 0.1 +
    subScores.location * 0.05 +
    subScores.compensation * 0.05;

  return {
    score: Math.min(100, Math.max(0, Math.round(weighted))),
    subScores,
  };
}
