import { prisma } from "@job-hunter/database";
import type { ApplicationStatus, InterviewStatus, OfferStatus, Prisma } from "@prisma/client";
import { updateApplicationPriority } from "./priority-engine.js";
import { createDefaultReminders } from "./reminder-service.js";
import { logActivity, transitionApplicationStatus } from "./activity-service.js";

export type CreateAppParams = {
  jobId: string;
  candidateId: string;
  resumeVersionId?: string;
  contactId?: string;
  status?: ApplicationStatus;
  source?: string;
};

/**
 * Creates a new application, computes priority, schedules default reminders, and logs activity.
 */
export async function createApplication(params: CreateAppParams) {
  const job = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!job) throw new Error("Job not found");

  // Determine/find company record if possible
  const company = await prisma.company.findFirst({
    where: { companyName: { equals: job.company, mode: "insensitive" } },
  });

  const app = await prisma.application.create({
    data: {
      jobId: params.jobId,
      candidateId: params.candidateId,
      companyId: company?.id,
      resumeVersionId: params.resumeVersionId,
      contactId: params.contactId,
      status: params.status || "DISCOVERED",
      source: params.source || job.source,
    },
  });

  await createDefaultReminders(app.id);
  await updateApplicationPriority(app.id);
  await logActivity(
    app.id,
    "APPLICATION_CREATED",
    "Application Tracked",
    `Started tracking application for ${job.title} at ${job.company}`,
  );

  return app;
}

/**
 * Returns a single application with all details, notes, activities, reminders, etc.
 */
export async function getApplicationDetails(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      job: {
        include: {
          salary: true,
          match: true,
        },
      },
      company: true,
      resumeVersion: true,
      contact: true,
      activities: { orderBy: { createdAt: "desc" } },
      interviews: { orderBy: { scheduledAt: "asc" } },
      offers: true,
      notes: { orderBy: { createdAt: "desc" } },
      reminders: { orderBy: { dueDate: "asc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });
}

export type ApplicationFilterParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  priorityMin?: number;
  role?: string;
  source?: string;
  matchScoreMin?: number;
};

/**
 * Lists applications based on search/filter parameters.
 */
export async function listApplications(params: ApplicationFilterParams) {
  const { page, pageSize, search, status, priorityMin, role, source, matchScoreMin } = params;

  const where: Prisma.ApplicationWhereInput = {};

  if (status) {
    where.status = status as ApplicationStatus;
  }

  if (priorityMin !== undefined) {
    where.priority = { gte: priorityMin };
  }

  if (source) {
    where.source = { contains: source, mode: "insensitive" };
  }

  // Combine query criteria on job/company relations
  const jobConditions: Prisma.JobWhereInput = {};
  if (role) {
    jobConditions.title = { contains: role, mode: "insensitive" };
  }
  if (search) {
    jobConditions.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }
  if (matchScoreMin !== undefined) {
    jobConditions.match = { matchScore: { gte: matchScoreMin } };
  }

  if (Object.keys(jobConditions).length > 0) {
    where.job = jobConditions;
  }

  const [totalItems, items] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy: { priority: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        job: {
          include: {
            match: true,
          },
        },
        company: true,
      },
    }),
  ]);

  return {
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    items,
  };
}

/**
 * Maps ApplicationStatus values to Kanban columns.
 */
export function getStageFromStatus(status: ApplicationStatus): string {
  switch (status) {
    case "DISCOVERED":
      return "DISCOVERED";
    case "SHORTLISTED":
      return "SHORTLISTED";
    case "READY_TO_APPLY":
      return "READY_TO_APPLY";
    case "APPLIED":
    case "OUTREACH_SENT":
    case "REPLIED":
      return "APPLIED";
    case "PHONE_SCREEN":
    case "TECHNICAL_ROUND":
    case "SYSTEM_DESIGN":
    case "TAKE_HOME":
    case "MANAGER_ROUND":
    case "FINAL_ROUND":
      return "INTERVIEWING";
    case "OFFER_RECEIVED":
    case "OFFER_ACCEPTED":
    case "OFFER_DECLINED":
      return "OFFER";
    case "REJECTED":
    case "WITHDRAWN":
    case "ARCHIVED":
      return "REJECTED";
    default:
      return "DISCOVERED";
  }
}

/**
 * Maps a Kanban column key back to a default ApplicationStatus.
 */
export function getStatusFromStage(stage: string): ApplicationStatus {
  switch (stage) {
    case "DISCOVERED":
      return "DISCOVERED";
    case "SHORTLISTED":
      return "SHORTLISTED";
    case "READY_TO_APPLY":
      return "READY_TO_APPLY";
    case "APPLIED":
      return "APPLIED";
    case "INTERVIEWING":
      return "PHONE_SCREEN";
    case "OFFER":
      return "OFFER_RECEIVED";
    case "REJECTED":
      return "REJECTED";
    default:
      return "DISCOVERED";
  }
}

/**
 * Fetches all applications and groups them by Kanban stages.
 */
export async function getPipeline() {
  const applications = await prisma.application.findMany({
    include: {
      job: {
        include: {
          match: true,
        },
      },
      company: true,
    },
    orderBy: { priority: "desc" },
  });

  const columns: Record<string, typeof applications> = {
    DISCOVERED: [],
    SHORTLISTED: [],
    READY_TO_APPLY: [],
    APPLIED: [],
    INTERVIEWING: [],
    OFFER: [],
    REJECTED: [],
  };

  for (const app of applications) {
    const stage = getStageFromStatus(app.status);
    if (columns[stage]) {
      columns[stage].push(app);
    }
  }

  return columns;
}

/**
 * Updates application properties and logs transitions if status is updated.
 */
export async function updateApplication(
  id: string,
  data: Partial<Prisma.ApplicationUpdateInput> & { status?: ApplicationStatus; reason?: string },
) {
  const { status, reason, ...rest } = data;

  if (status) {
    await transitionApplicationStatus(id, status, reason);
  }

  if (Object.keys(rest).length > 0) {
    await prisma.application.update({
      where: { id },
      data: rest,
    });
  }

  // Final update of priority score
  await updateApplicationPriority(id);

  return getApplicationDetails(id);
}

/**
 * Schedules an interview, updates application status, and logs activity.
 */
export async function createInterview(params: {
  applicationId: string;
  roundName: string;
  interviewerName?: string;
  interviewerRole?: string;
  scheduledAt: Date;
  duration: number;
  meetingLink?: string;
  notes?: string;
  status?: InterviewStatus;
}) {
  const interview = await prisma.interview.create({
    data: params,
  });

  // Automatically transition application status to MATCHING interview stage
  let matchedStatus: ApplicationStatus = "PHONE_SCREEN";
  const nameLower = params.roundName.toLowerCase();
  if (nameLower.includes("technical") || nameLower.includes("code")) {
    matchedStatus = "TECHNICAL_ROUND";
  } else if (nameLower.includes("system") || nameLower.includes("architecture")) {
    matchedStatus = "SYSTEM_DESIGN";
  } else if (
    nameLower.includes("take") ||
    nameLower.includes("home") ||
    nameLower.includes("assignment")
  ) {
    matchedStatus = "TAKE_HOME";
  } else if (
    nameLower.includes("manager") ||
    nameLower.includes("director") ||
    nameLower.includes("hiring")
  ) {
    matchedStatus = "MANAGER_ROUND";
  } else if (
    nameLower.includes("final") ||
    nameLower.includes("onsite") ||
    nameLower.includes("loop")
  ) {
    matchedStatus = "FINAL_ROUND";
  }

  await transitionApplicationStatus(
    params.applicationId,
    matchedStatus,
    `Scheduled ${params.roundName}`,
  );
  await logActivity(
    params.applicationId,
    "INTERVIEW_SCHEDULED",
    "Interview Scheduled",
    `Scheduled ${params.roundName} with ${params.interviewerName || "interviewer"} on ${new Date(params.scheduledAt).toLocaleDateString()}`,
  );

  return interview;
}

/**
 * Creates or updates an offer, updates application status, and logs activity.
 */
export async function createOrUpdateOffer(params: {
  applicationId: string;
  baseSalary?: number;
  bonus?: number;
  equity?: string;
  joiningBonus?: number;
  benefits?: string;
  location?: string;
  employmentType?: string;
  offerDate?: Date;
  deadline?: Date;
  status: OfferStatus;
}) {
  const existing = await prisma.offer.findFirst({
    where: { applicationId: params.applicationId },
  });

  let offer;
  if (existing) {
    offer = await prisma.offer.update({
      where: { id: existing.id },
      data: params,
    });
  } else {
    offer = await prisma.offer.create({
      data: params,
    });
  }

  // Update status based on offer status
  let matchedStatus: ApplicationStatus = "OFFER_RECEIVED";
  if (params.status === "ACCEPTED") {
    matchedStatus = "OFFER_ACCEPTED";
  } else if (params.status === "DECLINED") {
    matchedStatus = "OFFER_DECLINED";
  }

  await transitionApplicationStatus(
    params.applicationId,
    matchedStatus,
    `Offer updated status to ${params.status}`,
  );
  await logActivity(
    params.applicationId,
    "OFFER_RECEIVED",
    `Offer ${params.status}`,
    `Offer salary base: $${params.baseSalary || 0}. Status is ${params.status}.`,
  );

  return offer;
}
