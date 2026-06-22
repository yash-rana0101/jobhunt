import { prisma } from "@job-hunter/database";

/**
 * Calculates priority score (0-100) based on weighted factors:
 * - Match Score (30%)
 * - Company Quality (20%)
 * - Salary (15%)
 * - Remote Status (15%)
 * - Activity / Interview Stage (20%)
 */
export async function calculateApplicationPriority(applicationId: string): Promise<number> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          salary: true,
          match: true,
        },
      },
      company: true,
    },
  });

  if (!application) {
    throw new Error(`Application with ID ${applicationId} not found`);
  }

  // 1. Match Score (30%)
  const matchScore = application.job.match?.matchScore ?? 60.0;
  const matchFactor = matchScore * 0.3;

  // 2. Company Quality (20%)
  let companyScore = 60.0;
  if (application.company) {
    const headcount = application.company.headcount ?? 0;
    const funding = application.company.fundingStage || "";

    if (headcount > 5000) companyScore = 95.0;
    else if (headcount > 1000) companyScore = 90.0;
    else if (headcount > 200) companyScore = 85.0;
    else if (headcount > 50) companyScore = 80.0;
    else if (headcount > 10) companyScore = 70.0;

    const fLower = funding.toLowerCase();
    if (fLower.includes("ipo") || fLower.includes("public")) {
      companyScore = Math.max(companyScore, 95.0);
    } else if (fLower.includes("series c") || fLower.includes("series d")) {
      companyScore = Math.max(companyScore, 88.0);
    } else if (fLower.includes("series a") || fLower.includes("series b")) {
      companyScore = Math.max(companyScore, 82.0);
    }
  }
  const companyFactor = companyScore * 0.2;

  // 3. Salary (15%)
  let salaryScore = 60.0;
  const salary = application.job.salary;
  if (salary) {
    const maxVal = salary.max ?? salary.min ?? 0;
    if (maxVal >= 200000) salaryScore = 100.0;
    else if (maxVal >= 160000) salaryScore = 90.0;
    else if (maxVal >= 130000) salaryScore = 80.0;
    else if (maxVal >= 100000) salaryScore = 70.0;
    else if (maxVal >= 70000) salaryScore = 55.0;
    else if (maxVal > 0) salaryScore = 40.0;
  } else {
    const maxVal = application.job.salaryMax ?? application.job.salaryMin ?? 0;
    if (maxVal >= 200000) salaryScore = 100.0;
    else if (maxVal >= 160000) salaryScore = 90.0;
    else if (maxVal >= 130000) salaryScore = 80.0;
    else if (maxVal >= 100000) salaryScore = 70.0;
  }
  const salaryFactor = salaryScore * 0.15;

  // 4. Remote status (15%)
  let remoteScore = 50.0;
  const status = application.job.remoteStatus;
  if (status === "REMOTE") remoteScore = 100.0;
  else if (status === "HYBRID") remoteScore = 80.0;
  else if (status === "ONSITE") remoteScore = 50.0;
  const remoteFactor = remoteScore * 0.15;

  // 5. Activity / Stage Progress (20%)
  let activityScore = 50.0;
  switch (application.status) {
    case "OFFER_ACCEPTED":
    case "OFFER_RECEIVED":
      activityScore = 100.0;
      break;
    case "FINAL_ROUND":
      activityScore = 95.0;
      break;
    case "MANAGER_ROUND":
    case "SYSTEM_DESIGN":
    case "TECHNICAL_ROUND":
    case "TAKE_HOME":
      activityScore = 85.0;
      break;
    case "PHONE_SCREEN":
    case "REPLIED":
      activityScore = 75.0;
      break;
    case "OUTREACH_SENT":
      activityScore = 65.0;
      break;
    case "APPLIED":
      activityScore = 60.0;
      break;
    case "READY_TO_APPLY":
    case "SHORTLISTED":
    case "DISCOVERED":
      activityScore = 50.0;
      break;
    case "OFFER_DECLINED":
    case "WITHDRAWN":
    case "REJECTED":
    case "ARCHIVED":
      activityScore = 10.0;
      break;
  }
  const activityFactor = activityScore * 0.2;

  const totalScore = matchFactor + companyFactor + salaryFactor + remoteFactor + activityFactor;
  return Math.round(totalScore);
}

/**
 * Calculates priority and updates it in the database for the given application.
 */
export async function updateApplicationPriority(applicationId: string): Promise<number> {
  const score = await calculateApplicationPriority(applicationId);
  await prisma.application.update({
    where: { id: applicationId },
    data: { priority: score },
  });
  return score;
}
