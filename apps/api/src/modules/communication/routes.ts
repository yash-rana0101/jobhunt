import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@job-hunter/shared";
import { prisma } from "@job-hunter/database";
import type { Prisma, CommunicationType, CommunicationStatus } from "@prisma/client";
import {
  scheduleCommunication,
  approveCommunication,
  cancelFollowUpsForThread,
  receiveInboundReply,
} from "@job-hunter/communication-agent";

interface CommsQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
}

interface IdParams {
  id: string;
}

interface SendCommBody {
  applicationId: string;
  contactId?: string;
  templateId: string;
  customVars?: Record<string, string>;
  type: string;
}

interface ScheduleCommBody extends SendCommBody {
  scheduledAt: string;
}

interface TemplateCreateBody {
  name: string;
  description?: string;
  category: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables?: string[];
}

interface SimulateReplyBody {
  threadId: string;
  subject: string;
  body: string;
}

export function registerCommunicationRoutes(app: FastifyInstance): void {
  // GET /communications - List logs
  app.get<{ Querystring: CommsQuery }>("/communications", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "10", 10)));

    const where: Prisma.CommunicationWhereInput = {};
    if (query.status) {
      where.status = query.status as CommunicationStatus;
    }
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: "insensitive" } },
        { provider: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [totalItems, items] = await Promise.all([
      prisma.communication.count({ where }),
      prisma.communication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          application: { include: { job: true } },
          contact: true,
          recipients: true,
          replies: true,
        },
      }),
    ]);

    const response: ApiResponse<typeof items> = {
      success: true,
      data: items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
    return response;
  });

  // GET /communications/:id - Single details
  app.get<{ Params: IdParams }>("/communications/:id", async (request, reply) => {
    const item = await prisma.communication.findUnique({
      where: { id: request.params.id },
      include: {
        application: { include: { job: true } },
        contact: true,
        recipients: true,
        deliveries: true,
        replies: true,
      },
    });

    if (!item) {
      void reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Outreach record not found" } };
    }

    return { success: true, data: item };
  });

  // GET /threads - Conversations listing
  app.get("/threads", async () => {
    const threads = await prisma.communicationThread.findMany({
      include: {
        application: { include: { job: true } },
        contact: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: threads };
  });

  // GET /threads/:id - Conversation messages timeline
  app.get<{ Params: IdParams }>("/threads/:id", async (request, reply) => {
    const thread = await prisma.communicationThread.findUnique({
      where: { id: request.params.id },
      include: {
        application: { include: { job: true } },
        contact: true,
        messages: { orderBy: { createdAt: "asc" } },
        communications: {
          include: {
            deliveries: true,
            replies: true,
          },
        },
        followUps: { orderBy: { sequence: "asc" } },
      },
    });

    if (!thread) {
      void reply.status(404);
      return {
        success: false,
        error: { code: "THREAD_NOT_FOUND", message: "Conversation thread not found" },
      };
    }

    return { success: true, data: thread };
  });

  // POST /communications/send - Direct/Immediate send
  app.post<{ Body: SendCommBody }>("/communications/send", async (request, reply) => {
    const body = request.body;
    try {
      const comm = await scheduleCommunication({
        applicationId: body.applicationId,
        contactId: body.contactId,
        templateId: body.templateId,
        customVars: body.customVars,
        type: body.type as CommunicationType,
      });

      return { success: true, data: comm };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: { code: "SEND_FAILED", message: err instanceof Error ? err.message : String(err) },
      };
    }
  });

  // POST /communications/schedule - Schedule for future execution
  app.post<{ Body: ScheduleCommBody }>("/communications/schedule", async (request, reply) => {
    const body = request.body;
    try {
      const comm = await scheduleCommunication({
        applicationId: body.applicationId,
        contactId: body.contactId,
        templateId: body.templateId,
        customVars: body.customVars,
        scheduledAt: new Date(body.scheduledAt),
        type: body.type as CommunicationType,
      });

      return { success: true, data: comm };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: {
          code: "SCHEDULE_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  });

  // POST /communications/approve - Manual approval of draft
  app.post<{ Body: { id: string } }>("/communications/approve", async (request, reply) => {
    try {
      await approveCommunication(request.body.id);
      return { success: true, data: { message: "Communication approved and queued for sending" } };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: {
          code: "APPROVAL_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  });

  // POST /communications/cancel - Cancel thread follow-ups
  app.post<{ Body: { threadId: string } }>("/communications/cancel", async (request, reply) => {
    try {
      await cancelFollowUpsForThread(request.body.threadId);
      return {
        success: true,
        data: { message: "Scheduled follow-up sequence cancelled successfully" },
      };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: {
          code: "CANCELLATION_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  });

  // GET /templates - Retrieve template collection
  app.get("/templates", async () => {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { category: "asc" },
    });
    return { success: true, data: templates };
  });

  // POST /templates - Create email template
  app.post<{ Body: TemplateCreateBody }>("/templates", async (request) => {
    const body = request.body;
    const template = await prisma.emailTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        subjectTemplate: body.subjectTemplate,
        bodyTemplate: body.bodyTemplate,
        variables: body.variables || [],
      },
    });
    return { success: true, data: template };
  });

  // POST /communications/simulate-reply - Simulate receiving an inbound email reply
  app.post<{ Body: SimulateReplyBody }>(
    "/communications/simulate-reply",
    async (request, reply) => {
      const body = request.body;
      try {
        const msg = await receiveInboundReply({
          threadId: body.threadId,
          subject: body.subject,
          body: body.body,
          receivedAt: new Date(),
        });
        return { success: true, data: msg };
      } catch (err: unknown) {
        void reply.status(500);
        return {
          success: false,
          error: {
            code: "SIMULATION_FAILED",
            message: err instanceof Error ? err.message : String(err),
          },
        };
      }
    },
  );
}
