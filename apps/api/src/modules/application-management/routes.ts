import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@job-hunter/shared";
import { prisma } from "@job-hunter/database";
import type { ApplicationStatus, InterviewStatus, OfferStatus } from "@prisma/client";
import {
  createApplication,
  getApplicationDetails,
  listApplications,
  getPipeline,
  updateApplication,
  createInterview,
  createOrUpdateOffer,
} from "@job-hunter/application-manager";

interface ApplicationsQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
  priorityMin?: string;
  role?: string;
  source?: string;
  matchScoreMin?: string;
}

interface IdParams {
  id: string;
}

interface CreateAppBody {
  jobId: string;
  candidateId?: string;
  resumeVersionId?: string;
  contactId?: string;
  status?: string;
  source?: string;
}

interface UpdateAppBody {
  status?: string;
  reason?: string;
  appliedDate?: string;
  source?: string;
}

interface CreateInterviewBody {
  applicationId: string;
  roundName: string;
  interviewerName?: string;
  interviewerRole?: string;
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
  notes?: string;
  status?: string;
}

interface CreateOfferBody {
  applicationId: string;
  baseSalary?: number;
  bonus?: number;
  equity?: string;
  joiningBonus?: number;
  benefits?: string;
  location?: string;
  employmentType?: string;
  offerDate?: string;
  deadline?: string;
  status: string;
}

interface CreateNoteBody {
  noteType: string;
  content: string;
}

interface CreateReminderBody {
  reminderType?: string;
  title: string;
  description?: string;
  dueDate: string;
}

export function registerApplicationRoutes(app: FastifyInstance): void {
  // GET /applications - Filtered application list
  app.get<{ Querystring: ApplicationsQuery }>("/applications", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "10", 10)));

    const result = await listApplications({
      page,
      pageSize,
      search: query.search,
      status: query.status,
      priorityMin: query.priorityMin ? parseInt(query.priorityMin, 10) : undefined,
      role: query.role,
      source: query.source,
      matchScoreMin: query.matchScoreMin ? parseFloat(query.matchScoreMin) : undefined,
    });

    const response: ApiResponse<typeof result.items> = {
      success: true,
      data: result.items,
      pagination: {
        page,
        pageSize,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      },
    };
    return response;
  });

  // GET /applications/:id - Detailed application info
  app.get<{ Params: IdParams }>("/applications/:id", async (request, reply) => {
    const appDetail = await getApplicationDetails(request.params.id);
    if (!appDetail) {
      void reply.status(404);
      return {
        success: false,
        error: { code: "APPLICATION_NOT_FOUND", message: "Application not found" },
      };
    }
    return { success: true, data: appDetail };
  });

  // POST /applications - Create/Track an application
  app.post<{ Body: CreateAppBody }>("/applications", async (request, reply) => {
    const body = request.body;
    let candidateId = body.candidateId;

    if (!candidateId) {
      const candidate = await prisma.candidate.findFirst({ select: { id: true } });
      if (!candidate) {
        void reply.status(400);
        return {
          success: false,
          error: {
            code: "CANDIDATE_REQUIRED",
            message: "No candidate found. Please seed a profile.",
          },
        };
      }
      candidateId = candidate.id;
    }

    try {
      const appRecord = await createApplication({
        jobId: body.jobId,
        candidateId,
        resumeVersionId: body.resumeVersionId,
        contactId: body.contactId,
        status: body.status as ApplicationStatus,
        source: body.source,
      });

      void reply.status(210);
      return { success: true, data: appRecord };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: {
          code: "CREATION_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  });

  // PATCH /applications/:id - Update application status/details
  app.patch<{ Params: IdParams; Body: UpdateAppBody }>(
    "/applications/:id",
    async (request, reply) => {
      const { status, reason, appliedDate, source } = request.body;

      try {
        const updated = await updateApplication(request.params.id, {
          status: status as ApplicationStatus,
          reason,
          appliedDate: appliedDate ? new Date(appliedDate) : undefined,
          source,
        });

        return { success: true, data: updated };
      } catch (err: unknown) {
        void reply.status(500);
        return {
          success: false,
          error: {
            code: "UPDATE_FAILED",
            message: err instanceof Error ? err.message : String(err),
          },
        };
      }
    },
  );

  // GET /pipeline - Grouped stages pipeline
  app.get("/pipeline", async () => {
    const pipeline = await getPipeline();
    return { success: true, data: pipeline };
  });

  // GET /interviews - List scheduled interviews
  app.get("/interviews", async () => {
    const interviews = await prisma.interview.findMany({
      include: {
        application: {
          include: {
            job: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
    return { success: true, data: interviews };
  });

  // POST /interviews - Schedule interview
  app.post<{ Body: CreateInterviewBody }>("/interviews", async (request, reply) => {
    const body = request.body;
    try {
      const interview = await createInterview({
        applicationId: body.applicationId,
        roundName: body.roundName,
        interviewerName: body.interviewerName,
        interviewerRole: body.interviewerRole,
        scheduledAt: new Date(body.scheduledAt),
        duration: body.duration,
        meetingLink: body.meetingLink,
        notes: body.notes,
        status: body.status as InterviewStatus,
      });

      return { success: true, data: interview };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: {
          code: "INTERVIEW_SCHEDULING_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  });

  // GET /offers - List offers
  app.get("/offers", async () => {
    const offers = await prisma.offer.findMany({
      include: {
        application: {
          include: {
            job: true,
          },
        },
      },
      orderBy: { offerDate: "desc" },
    });
    return { success: true, data: offers };
  });

  // POST /offers - Log offer details
  app.post<{ Body: CreateOfferBody }>("/offers", async (request, reply) => {
    const body = request.body;
    try {
      const offer = await createOrUpdateOffer({
        applicationId: body.applicationId,
        baseSalary: body.baseSalary,
        bonus: body.bonus,
        equity: body.equity,
        joiningBonus: body.joiningBonus,
        benefits: body.benefits,
        location: body.location,
        employmentType: body.employmentType,
        offerDate: body.offerDate ? new Date(body.offerDate) : undefined,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        status: body.status as OfferStatus,
      });

      return { success: true, data: offer };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: {
          code: "OFFER_SAVING_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  });

  // POST /applications/:id/notes - Add note
  app.post<{ Params: IdParams; Body: CreateNoteBody }>(
    "/applications/:id/notes",
    async (request, reply) => {
      const { noteType, content } = request.body;
      try {
        const note = await prisma.applicationNote.create({
          data: {
            applicationId: request.params.id,
            noteType,
            content,
          },
        });

        // Log note added activity
        await prisma.applicationActivity.create({
          data: {
            applicationId: request.params.id,
            activityType: "NOTE_ADDED",
            title: "Note Added",
            description: `Added a new ${noteType.toLowerCase()} note.`,
          },
        });

        return { success: true, data: note };
      } catch (err: unknown) {
        void reply.status(500);
        return {
          success: false,
          error: {
            code: "NOTE_CREATION_FAILED",
            message: err instanceof Error ? err.message : String(err),
          },
        };
      }
    },
  );

  // POST /applications/:id/reminders - Add reminder
  app.post<{ Params: IdParams; Body: CreateReminderBody }>(
    "/applications/:id/reminders",
    async (request, reply) => {
      const { reminderType, title, description, dueDate } = request.body;
      try {
        const reminder = await prisma.applicationReminder.create({
          data: {
            applicationId: request.params.id,
            reminderType: reminderType || "CUSTOM",
            title,
            description,
            dueDate: new Date(dueDate),
            status: "PENDING",
          },
        });

        // Log reminder created activity
        await prisma.applicationActivity.create({
          data: {
            applicationId: request.params.id,
            activityType: "REMINDER_CREATED",
            title: "Reminder Scheduled",
            description: `Scheduled reminder: "${title}" for ${new Date(dueDate).toLocaleDateString()}`,
          },
        });

        return { success: true, data: reminder };
      } catch (err: unknown) {
        void reply.status(500);
        return {
          success: false,
          error: {
            code: "REMINDER_CREATION_FAILED",
            message: err instanceof Error ? err.message : String(err),
          },
        };
      }
    },
  );
}
