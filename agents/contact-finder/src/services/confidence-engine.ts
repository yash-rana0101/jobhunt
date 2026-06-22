import type { DiscoveredContact, ConfidenceFactors } from "../types/index.js";
import type { Job } from "@job-hunter/database";

export function calculateConfidenceScore(
  contact: Omit<DiscoveredContact, "confidenceScore" | "contactPriority">,
  job: Job,
): { score: number; factors: ConfidenceFactors } {
  let profileMatch = 5;
  let departmentMatch = 10;
  let roleMatch = 10;
  let jobMatch = 5;
  let sourceQuality = 10;

  const titleLower = contact.jobTitle.toLowerCase();
  const companyLower = contact.companyName.toLowerCase();
  const jobTitleLower = job.title.toLowerCase();
  const jobDescLower = job.description.toLowerCase();

  // 1. Profile Match (Max 20)
  // Check if LinkedIn URL or snippet contains the company name
  if (contact.linkedinUrl?.toLowerCase().includes(companyLower.replace(/\s/g, ""))) {
    profileMatch = 20;
  } else if (titleLower.includes(companyLower)) {
    profileMatch = 18;
  } else {
    profileMatch = 15; // default since we searched specifically for the company
  }

  // 2. Department Match (Max 20)
  // Check if contact belongs to Engineering / Product / Tech or HR / recruiting
  const isTechRole =
    titleLower.includes("engineer") ||
    titleLower.includes("developer") ||
    titleLower.includes("programmer") ||
    titleLower.includes("architect") ||
    titleLower.includes("cto") ||
    titleLower.includes("technology") ||
    titleLower.includes("data scientist") ||
    titleLower.includes("product") ||
    titleLower.includes("em");

  const isRecruiterRole =
    titleLower.includes("recruiter") ||
    titleLower.includes("talent acquisition") ||
    titleLower.includes("hr") ||
    titleLower.includes("people");

  // Determine target department of the job
  const isJobTech =
    jobTitleLower.includes("engineer") ||
    jobTitleLower.includes("developer") ||
    jobTitleLower.includes("cto") ||
    jobTitleLower.includes("tech") ||
    jobTitleLower.includes("architect") ||
    jobTitleLower.includes("data");

  if (isJobTech && isTechRole) {
    departmentMatch = 20;
  } else if (!isJobTech && isRecruiterRole) {
    departmentMatch = 20;
  } else if (isTechRole || isRecruiterRole) {
    departmentMatch = 15;
  }

  // 3. Role Match (Max 20)
  // Check if category is classified and not OTHER
  if (contact.category !== "OTHER") {
    roleMatch = 20;
  } else if (
    titleLower.includes("vp") ||
    titleLower.includes("director") ||
    titleLower.includes("head")
  ) {
    roleMatch = 15;
  }

  // 4. Job Match (Max 20)
  // Check matching tech stacks or classification from job info
  // e.g. Frontend vs Backend vs Full Stack, or languages like React, Node, Python
  const techKeywords = [
    "react",
    "node",
    "typescript",
    "javascript",
    "python",
    "aws",
    "docker",
    "kubernetes",
    "postgres",
    "redis",
    "ruby",
    "go",
    "java",
  ];
  let matchedKeywordsCount = 0;

  for (const tech of techKeywords) {
    if (
      titleLower.includes(tech) &&
      (jobTitleLower.includes(tech) || jobDescLower.includes(tech))
    ) {
      matchedKeywordsCount++;
    }
  }

  // Frontend / Backend specificity matching
  const hasFrontendMatch = titleLower.includes("frontend") && jobTitleLower.includes("frontend");
  const hasBackendMatch = titleLower.includes("backend") && jobTitleLower.includes("backend");
  const hasFullStackMatch = titleLower.includes("full") && jobTitleLower.includes("full");

  if (hasFrontendMatch || hasBackendMatch || hasFullStackMatch) {
    jobMatch = 15;
  } else if (matchedKeywordsCount > 0) {
    jobMatch = Math.min(20, 10 + matchedKeywordsCount * 5);
  } else {
    // Check if both are technical roles
    const isContactTech = isTechRole;
    const isJobTechRole = isJobTech;
    if (isContactTech && isJobTechRole) {
      jobMatch = 12;
    }
  }

  // 5. Source Quality (Max 20)
  if (contact.linkedinUrl?.includes("linkedin.com/in/")) {
    sourceQuality = 20;
  } else if (contact.source === "FIRECRAWL") {
    sourceQuality = 18;
  } else {
    sourceQuality = 15;
  }

  const score = profileMatch + departmentMatch + roleMatch + jobMatch + sourceQuality;

  return {
    score: Math.min(100, Math.max(0, score)),
    factors: {
      profileMatch,
      departmentMatch,
      roleMatch,
      jobMatch,
      sourceQuality,
    },
  };
}
