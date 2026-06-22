import type { DiscoveredContact, PriorityFactors } from "../types/index.js";
import type { Job } from "@job-hunter/database";

export function calculatePriorityScore(
  contact: Omit<DiscoveredContact, "contactPriority">,
  job: Job,
  isReferralSource = false,
): { score: number; factors: PriorityFactors } {
  let hiringAuthority = 5;
  let roleRelevance = 5;
  let engineeringRelevance = 2;
  let likelihoodToRespond = 5;
  let seniorityScore = 5;
  let connectionToPosition = 2;

  const category = contact.category;
  const seniority = contact.seniority || "MID";
  const titleLower = contact.jobTitle.toLowerCase();
  const jobTitleLower = job.title.toLowerCase();

  // 1. Hiring Authority (Max 25)
  if (category === "HIRING_MANAGER") hiringAuthority = 25;
  else if (category === "FOUNDER") hiringAuthority = 22;
  else if (category === "CTO") hiringAuthority = 20;
  else if (category === "ENGINEERING_MANAGER") hiringAuthority = 18;
  else if (category === "TEAM_LEAD") hiringAuthority = 14;
  else if (category === "RECRUITER") hiringAuthority = 12;
  else if (category === "ENGINEER") hiringAuthority = 8;

  // 2. Role Relevance (Max 20)
  if (category === "HIRING_MANAGER") roleRelevance = 20;
  else if (category === "ENGINEERING_MANAGER") roleRelevance = 18;
  else if (category === "CTO" || category === "TEAM_LEAD") roleRelevance = 16;
  else if (category === "RECRUITER") roleRelevance = 14;
  else if (category === "FOUNDER") roleRelevance = 12;
  else if (category === "ENGINEER" || category === "REFERRAL_SOURCE") roleRelevance = 10;

  // 3. Engineering Relevance (Max 15)
  const isJobTech =
    jobTitleLower.includes("engineer") ||
    jobTitleLower.includes("developer") ||
    jobTitleLower.includes("cto") ||
    jobTitleLower.includes("architect") ||
    jobTitleLower.includes("tech") ||
    jobTitleLower.includes("data");

  if (isJobTech) {
    if (
      category === "CTO" ||
      category === "ENGINEERING_MANAGER" ||
      category === "TEAM_LEAD" ||
      category === "ENGINEER" ||
      category === "HIRING_MANAGER"
    ) {
      engineeringRelevance = 15;
    } else if (category === "FOUNDER") {
      engineeringRelevance = 10;
    } else if (category === "RECRUITER") {
      engineeringRelevance = 6;
    }
  } else {
    // If not a tech job, HR/Recruiting is more relevant
    if (category === "RECRUITER") {
      engineeringRelevance = 15;
    } else if (category === "FOUNDER" || category === "HIRING_MANAGER") {
      engineeringRelevance = 10;
    }
  }

  // 4. Likelihood to Respond (Max 15)
  if (category === "RECRUITER") likelihoodToRespond = 15;
  else if (isReferralSource) likelihoodToRespond = 14;
  else if (category === "ENGINEER") likelihoodToRespond = 10;
  else if (category === "TEAM_LEAD" || category === "ENGINEERING_MANAGER") likelihoodToRespond = 8;
  else if (category === "FOUNDER" || category === "CTO") likelihoodToRespond = 5;

  // 5. Seniority Score (Max 15)
  if (seniority === "FOUNDER" || seniority === "EXECUTIVE") seniorityScore = 15;
  else if (seniority === "LEAD") seniorityScore = 13;
  else if (seniority === "SENIOR") seniorityScore = 11;
  else if (seniority === "MID") seniorityScore = 8;
  else if (seniority === "JUNIOR") seniorityScore = 4;

  // 6. Connection to Position (Max 10)
  if (isReferralSource) {
    connectionToPosition = 10;
  } else if (titleLower.includes("hiring") || titleLower.includes("talent")) {
    connectionToPosition = 8;
  } else {
    connectionToPosition = 2;
  }

  const score =
    hiringAuthority +
    roleRelevance +
    engineeringRelevance +
    likelihoodToRespond +
    seniorityScore +
    connectionToPosition;

  return {
    score: Math.min(100, Math.max(0, score)),
    factors: {
      hiringAuthority,
      roleRelevance,
      engineeringRelevance,
      likelihoodToRespond,
      seniorityScore,
      connectionToPosition,
    },
  };
}
