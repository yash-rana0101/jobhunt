import { prisma } from "@job-hunter/database";
import { runOutreachGenerationBatch, regenerateSingleDraft } from "@job-hunter/outreach-agent";
import type { ApiResponse } from "@job-hunter/shared";
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";

interface OutreachQuery {
  page?: string;
  pageSize?: string;
  status?: string;
  type?: string;
}

interface IdParams {
  id: string;
}

interface JobIdParams {
  jobId: string;
}

interface ContactIdParams {
  contactId: string;
}

interface GenerateBody {
  jobMatchId: string;
  contactId?: string;
  provider?: "openai" | "anthropic" | "gemini";
}

interface RegenerateBody {
  draftId: string;
  provider?: "openai" | "anthropic" | "gemini";
}

export function registerOutreachRoutes(app: FastifyInstance): void {
  // GET /outreach - Paginated list of outreach drafts
  app.get<{ Querystring: OutreachQuery }>("/outreach", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "10", 10)));
    const status = query.status || "";
    const type = query.type || "";

    const where: Prisma.OutreachDraftWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const [totalItems, drafts] = await Promise.all([
      prisma.outreachDraft.count({ where }),
      prisma.outreachDraft.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          job: true,
          contact: true,
          feedback: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    const response: ApiResponse<typeof drafts> = {
      success: true,
      data: drafts,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
    return response;
  });

  // GET /outreach/:id - Single draft detail
  app.get<{ Params: IdParams }>("/outreach/:id", async (request, reply) => {
    const params = request.params;
    const draft = await prisma.outreachDraft.findUnique({
      where: { id: params.id },
      include: {
        job: true,
        contact: true,
        feedback: true,
      },
    });

    if (!draft) {
      void reply.status(404);
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: "DRAFT_NOT_FOUND",
          message: `OutreachDraft with ID ${params.id} was not found`,
        },
      };
      return response;
    }

    const response: ApiResponse<typeof draft> = {
      success: true,
      data: draft,
    };
    return response;
  });

  // GET /outreach/job/:jobId - Drafts for a specific job
  app.get<{ Params: JobIdParams }>("/outreach/job/:jobId", async (request) => {
    const params = request.params;
    const drafts = await prisma.outreachDraft.findMany({
      where: { jobId: params.jobId },
      include: {
        contact: true,
        feedback: true,
      },
    });

    const response: ApiResponse<typeof drafts> = {
      success: true,
      data: drafts,
    };
    return response;
  });

  // GET /outreach/contact/:contactId - Drafts for a specific contact
  app.get<{ Params: ContactIdParams }>("/outreach/contact/:contactId", async (request) => {
    const params = request.params;
    const drafts = await prisma.outreachDraft.findMany({
      where: { contactId: params.contactId },
      include: {
        job: true,
        feedback: true,
      },
    });

    const response: ApiResponse<typeof drafts> = {
      success: true,
      data: drafts,
    };
    return response;
  });

  // POST /outreach/generate - Trigger batch outreach generation run
  app.post<{ Body: GenerateBody }>("/outreach/generate", async (request, reply) => {
    const body = request.body || {};
    const { jobMatchId, contactId, provider } = body;

    if (!jobMatchId) {
      void reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_INPUT", message: "jobMatchId is required" },
      };
    }

    // Run asynchronously in background
    runOutreachGenerationBatch({
      jobMatchId,
      contactId,
      provider,
    })
      .then((runId) => {
        app.log.info({ runId }, "Asynchronous outreach generation completed");
      })
      .catch((err: unknown) => {
        app.log.error({ err }, "Asynchronous outreach generation failed");
      });

    void reply.status(202);
    const response: ApiResponse<{ message: string; status: string }> = {
      success: true,
      data: {
        message: "Outreach generation triggered in background",
        status: "RUNNING",
      },
    };
    return response;
  });

  // POST /outreach/regenerate - Trigger single draft regeneration
  app.post<{ Body: RegenerateBody }>("/outreach/regenerate", async (request, reply) => {
    const body = request.body || {};
    const { draftId, provider } = body;

    if (!draftId) {
      void reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_INPUT", message: "draftId is required" },
      };
    }

    try {
      await regenerateSingleDraft(draftId, provider);
      const updatedDraft = await prisma.outreachDraft.findUnique({
        where: { id: draftId },
        include: { job: true, contact: true },
      });

      const response: ApiResponse<typeof updatedDraft> = {
        success: true,
        data: updatedDraft,
      };
      return response;
    } catch (err: unknown) {
      void reply.status(500);
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: "REGENERATION_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
      return response;
    }
  });
}
