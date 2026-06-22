import type {
  Candidate,
  CandidateExperience,
  CandidateEducation,
  Job,
  CompanyContact,
} from "@job-hunter/database";

export interface ReferralScore {
  isReferral: boolean;
  ranking: number; // 1-5 (1 being highest)
  type: string; // SAME_TEAM, SAME_DEPARTMENT, TECHNICAL, STARTUP, ALUMNI
  reason: string;
}

export function evaluateReferralTarget(
  contact: CompanyContact,
  candidate: Candidate & {
    experiences?: CandidateExperience[];
    education?: CandidateEducation[];
  },
  job: Job,
): ReferralScore {
  const contactTitleLower = contact.jobTitle.toLowerCase();
  const jobTitleLower = job.title.toLowerCase();

  // 1. Alumni Connection (Priority 5)
  // Check shared past companies (from experiences)
  if (candidate.experiences && candidate.experiences.length > 0) {
    for (const exp of candidate.experiences) {
      const companyNameLower = exp.company.toLowerCase();
      // Skip very short company names or generic placeholders
      if (companyNameLower.length > 2 && contactTitleLower.includes(`ex-${companyNameLower}`)) {
        return {
          isReferral: true,
          ranking: 5,
          type: "ALUMNI",
          reason: `Shared past employer: ${exp.company} (Contact is ex-${exp.company})`,
        };
      }
    }
  }

  // Check shared universities (from education)
  if (candidate.education && candidate.education.length > 0) {
    for (const edu of candidate.education) {
      const uniLower = edu.university.toLowerCase();
      // Check if contact's title/details contains school name or similar (if we scraped it)
      if (uniLower.length > 5 && contactTitleLower.includes(uniLower)) {
        return {
          isReferral: true,
          ranking: 5,
          type: "ALUMNI",
          reason: `Alumni connection: Shared university (${edu.university})`,
        };
      }
    }
  }

  // 2. Same Engineering Team (Priority 1)
  // Check if contact has matching specialty in the same department
  const isSameSpecialty =
    (contactTitleLower.includes("backend") && jobTitleLower.includes("backend")) ||
    (contactTitleLower.includes("frontend") && jobTitleLower.includes("frontend")) ||
    (contactTitleLower.includes("fullstack") && jobTitleLower.includes("fullstack")) ||
    (contactTitleLower.includes("mobile") && jobTitleLower.includes("mobile")) ||
    (contactTitleLower.includes("ai") && jobTitleLower.includes("ai")) ||
    (contactTitleLower.includes("devops") && jobTitleLower.includes("devops"));

  if (
    isSameSpecialty &&
    ((contact.category as string) === "ENGINEER" || (contact.category as string) === "TEAM_LEAD")
  ) {
    return {
      isReferral: true,
      ranking: 1,
      type: "SAME_TEAM",
      reason: `Direct engineering team alignment: Both work in ${contact.jobTitle.split("Engineer")[0]?.trim() || "similar"} specialty`,
    };
  }

  // 3. Same Department (Priority 2)
  const isContactTech =
    (contact.category as string) === "ENGINEER" ||
    (contact.category as string) === "TEAM_LEAD" ||
    (contact.category as string) === "ENGINEERING_MANAGER" ||
    (contact.category as string) === "CTO";

  const isJobTech =
    jobTitleLower.includes("engineer") ||
    jobTitleLower.includes("developer") ||
    jobTitleLower.includes("cto") ||
    jobTitleLower.includes("architect") ||
    jobTitleLower.includes("tech") ||
    jobTitleLower.includes("data");

  if (isContactTech && isJobTech) {
    return {
      isReferral: true,
      ranking: 2,
      type: "SAME_DEPARTMENT",
      reason: `Shared engineering department: Both are part of engineering/product`,
    };
  }

  // 4. Technical Employees (Priority 3)
  if ((contact.category as string) === "ENGINEER") {
    return {
      isReferral: true,
      ranking: 3,
      type: "TECHNICAL",
      reason: `Technical employee reference: Contact is a ${contact.jobTitle} and can provide peer evaluation`,
    };
  }

  // 5. Startup Employees (Priority 4)
  const isStartupSize =
    job.experienceClassification === "STARTUP" ||
    contactTitleLower.includes("founder") ||
    contactTitleLower.includes("co-founder");

  if (
    isStartupSize &&
    ((contact.category as string) === "ENGINEER" ||
      (contact.category as string) === "FOUNDER" ||
      (contact.category as string) === "CTO")
  ) {
    return {
      isReferral: true,
      ranking: 4,
      type: "STARTUP",
      reason: `Startup environment match: Reference works in startup team structure`,
    };
  }

  return {
    isReferral: false,
    ranking: 99,
    type: "OTHER",
    reason: "",
  };
}
