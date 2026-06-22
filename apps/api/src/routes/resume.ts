import { existsSync, readFileSync } from "node:fs";
import { prisma } from "@job-hunter/database";
import { optimizeAndStoreResume } from "@job-hunter/resume-agent";
import type { ApiResponse } from "@job-hunter/shared";
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";

interface VersionsQuery {
  page?: string;
  pageSize?: string;
  jobId?: string;
  variant?: string;
}

interface IdParams {
  id: string;
}

interface SuggestionsQuery {
  versionId?: string;
  jobId?: string;
}

interface GenerateBody {
  jobId?: string;
  candidateId?: string;
  variant:
    | "GENERAL"
    | "STARTUP"
    | "BACKEND"
    | "FULL_STACK"
    | "AI_ENGINEER"
    | "FOUNDING_ENGINEER"
    | "DEVOPS";
  rules?: {
    reorderSkills?: boolean;
    reorderProjects?: boolean;
    reorderExperienceBullets?: boolean;
    improveBulletClarity?: boolean;
    improveAtsFormatting?: boolean;
    highlightRelevantExperience?: boolean;
    improveTechnicalWording?: boolean;
  };
}

export function registerResumeRoutes(app: FastifyInstance): void {
  // GET /resume - Get the default candidate resume details
  app.get("/resume", async (request, reply) => {
    const candidate = await prisma.candidate.findFirst({
      include: {
        skills: true,
        projects: true,
        experiences: true,
        education: true,
      },
    });

    if (!candidate) {
      void reply.status(404);
      return {
        success: false,
        error: { code: "CANDIDATE_NOT_FOUND", message: "No candidate profile found in database" },
      };
    }

    return {
      success: true,
      data: candidate,
    };
  });

  // GET /resume/versions - Retrieve resume versions
  app.get<{ Querystring: VersionsQuery }>("/resume/versions", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "10", 10)));

    const where: Prisma.ResumeVersionWhereInput = {};
    if (query.jobId) {
      where.jobId = query.jobId;
    }
    if (query.variant) {
      where.versionName = query.variant;
    }

    const [totalItems, versions] = await Promise.all([
      prisma.resumeVersion.count({ where }),
      prisma.resumeVersion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          job: true,
          scores: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    const response: ApiResponse<typeof versions> = {
      success: true,
      data: versions,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
    return response;
  });

  // GET /resume/version/:id - Get details of a single version
  app.get<{ Params: IdParams }>("/resume/version/:id", async (request, reply) => {
    const { id } = request.params;
    const version = await prisma.resumeVersion.findUnique({
      where: { id },
      include: {
        job: true,
        optimizations: true,
        scores: true,
        keywords: true,
      },
    });

    if (!version) {
      void reply.status(404);
      return {
        success: false,
        error: { code: "VERSION_NOT_FOUND", message: `ResumeVersion with ID ${id} was not found` },
      };
    }

    return {
      success: true,
      data: version,
    };
  });

  // GET /resume/suggestions - Get suggestions and ATS improvement recommendations
  app.get<{ Querystring: SuggestionsQuery }>("/resume/suggestions", async (request, reply) => {
    const { versionId, jobId } = request.query;

    let where: Prisma.ResumeScoreWhereInput = {};
    if (versionId) {
      where = { resumeVersionId: versionId };
    } else if (jobId) {
      where = { resumeVersion: { jobId } };
    } else {
      void reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_INPUT", message: "Either versionId or jobId is required" },
      };
    }

    const score = await prisma.resumeScore.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (!score) {
      void reply.status(404);
      return {
        success: false,
        error: {
          code: "SUGGESTIONS_NOT_FOUND",
          message: "No scoring suggestions found matching query",
        },
      };
    }

    return {
      success: true,
      data: score,
    };
  });

  // GET /resume/version/:id/pdf - Stream PDF buffer
  app.get<{ Params: IdParams }>("/resume/version/:id/pdf", async (request, reply) => {
    const { id } = request.params;
    const version = await prisma.resumeVersion.findUnique({
      where: { id },
    });

    if (!version || !version.filePath || !existsSync(version.filePath)) {
      void reply.status(404);
      return reply.send({
        success: false,
        error: { code: "PDF_NOT_FOUND", message: "PDF document file not found on disk" },
      });
    }

    try {
      const buffer = readFileSync(version.filePath);
      const safeFilename = `${version.companyName.replace(/[^a-z0-9]/gi, "_")}_Resume.pdf`;

      return reply
        .header("content-type", "application/pdf")
        .header("content-disposition", `inline; filename="${safeFilename}"`)
        .send(buffer);
    } catch (err: unknown) {
      app.log.error({ err }, "Failed to read PDF file from disk");
      void reply.status(500);
      return {
        success: false,
        error: { code: "PDF_READ_ERROR", message: "Failed to load PDF file from local storage" },
      };
    }
  });

  // POST /resume/generate - Trigger resume generation (asynchronous)
  app.post<{ Body: GenerateBody }>("/resume/generate", async (request, reply) => {
    const body = request.body || {};
    let { candidateId } = body;

    // Default to the first candidate if candidateId is not provided
    if (!candidateId) {
      const firstCandidate = await prisma.candidate.findFirst({ select: { id: true } });
      if (firstCandidate) {
        candidateId = firstCandidate.id;
      }
    }

    if (!candidateId) {
      void reply.status(400);
      return {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "No candidate found in database. Create one first.",
        },
      };
    }

    // Trigger optimization asynchronously
    optimizeAndStoreResume({
      jobId: body.jobId,
      candidateId,
      variant: body.variant,
      rules: body.rules,
    })
      .then((versionId) => {
        app.log.info({ versionId }, "Background resume tailoring completed successfully");
      })
      .catch((err: unknown) => {
        app.log.error({ err }, "Background resume tailoring failed");
      });

    void reply.status(202);
    return {
      success: true,
      data: {
        message: "Resume optimization triggered in background",
        status: "RUNNING",
      },
    };
  });

  // POST /resume/optimize - Trigger resume generation (synchronous)
  app.post<{ Body: GenerateBody }>("/resume/optimize", async (request, reply) => {
    const body = request.body || {};
    let { candidateId } = body;

    if (!candidateId) {
      const firstCandidate = await prisma.candidate.findFirst({ select: { id: true } });
      if (firstCandidate) {
        candidateId = firstCandidate.id;
      }
    }

    if (!candidateId) {
      void reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_INPUT", message: "No candidate found in database" },
      };
    }

    try {
      const versionId = await optimizeAndStoreResume({
        jobId: body.jobId,
        candidateId,
        variant: body.variant,
        rules: body.rules,
      });

      const version = await prisma.resumeVersion.findUnique({
        where: { id: versionId },
        include: {
          job: true,
          optimizations: true,
          scores: true,
          keywords: true,
        },
      });

      return {
        success: true,
        data: version,
      };
    } catch (err: unknown) {
      void reply.status(500);
      return {
        success: false,
        error: {
          code: "OPTIMIZATION_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  });
}
