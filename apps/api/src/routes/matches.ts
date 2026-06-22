import { prisma } from "@job-hunter/database";
import { runJobMatchingBatch } from "@job-hunter/job-matcher";
import type { ApiResponse } from "@job-hunter/shared";
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";

interface MatchesQuery {
  page?: string;
  pageSize?: string;
  classification?: string;
  showAll?: string;
}

interface IdParams {
  id: string;
}

interface RunBody {
  batchSize?: number;
}

export function registerMatchRoutes(app: FastifyInstance): void {
  // GET /matches - Paginated matches list, sorted by rankingScore desc
  app.get<{ Querystring: MatchesQuery }>("/matches", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "10", 10)));
    const classification = query.classification || "";
    const showAll = query.showAll === "true";

    const where: Prisma.JobMatchWhereInput = {};

    if (classification) {
      where.classification = classification;
    } else if (!showAll) {
      // By default, filter out POOR and AVERAGE matches
      where.classification = { in: ["GOOD", "EXCELLENT"] };
    }

    const [totalItems, matches] = await Promise.all([
      prisma.jobMatch.count({ where }),
      prisma.jobMatch.findMany({
        where,
        orderBy: { rankingScore: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          job: {
            include: {
              salary: true,
              locations: true,
              technologies: true,
            },
          },
          reasons: true,
          recommendation: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    const response: ApiResponse<typeof matches> = {
      success: true,
      data: matches,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
    return response;
  });

  // GET /matches/excellent - Excellent matches
  app.get("/matches/excellent", async () => {
    const matches = await prisma.jobMatch.findMany({
      where: { classification: "EXCELLENT" },
      orderBy: { rankingScore: "desc" },
      include: {
        job: {
          include: {
            salary: true,
            locations: true,
            technologies: true,
          },
        },
        reasons: true,
        recommendation: true,
      },
    });

    const response: ApiResponse<typeof matches> = {
      success: true,
      data: matches,
    };
    return response;
  });

  // GET /matches/good - Good matches
  app.get("/matches/good", async () => {
    const matches = await prisma.jobMatch.findMany({
      where: { classification: "GOOD" },
      orderBy: { rankingScore: "desc" },
      include: {
        job: {
          include: {
            salary: true,
            locations: true,
            technologies: true,
          },
        },
        reasons: true,
        recommendation: true,
      },
    });

    const response: ApiResponse<typeof matches> = {
      success: true,
      data: matches,
    };
    return response;
  });

  // GET /matches/recommended - Highly recommended (rankingScore >= 95)
  app.get("/matches/recommended", async () => {
    const matches = await prisma.jobMatch.findMany({
      where: { rankingScore: { gte: 95 } },
      orderBy: { rankingScore: "desc" },
      include: {
        job: {
          include: {
            salary: true,
            locations: true,
            technologies: true,
          },
        },
        reasons: true,
        recommendation: true,
      },
    });

    const response: ApiResponse<typeof matches> = {
      success: true,
      data: matches,
    };
    return response;
  });

  // GET /matches/:id - Single match detail
  app.get<{ Params: IdParams }>("/matches/:id", async (request, reply) => {
    const params = request.params;
    const match = await prisma.jobMatch.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            salary: true,
            locations: true,
            technologies: true,
          },
        },
        reasons: true,
        recommendation: true,
      },
    });

    if (!match) {
      void reply.status(404);
      const response: ApiResponse<never> = {
        success: false,
        error: { code: "MATCH_NOT_FOUND", message: `Match with ID ${params.id} was not found` },
      };
      return response;
    }

    const response: ApiResponse<typeof match> = {
      success: true,
      data: match,
    };
    return response;
  });

  // POST /matches/run - Trigger batch job matching scoring engine
  app.post<{ Body: RunBody }>("/matches/run", (request) => {
    const body = request.body || {};
    const batchSize = body.batchSize || 100;

    // Run matching asynchronously in background
    void runJobMatchingBatch({ batchSize })
      .then((result) => {
        app.log.info(result, "Asynchronous job scoring batch run completed");
      })
      .catch((err) => {
        app.log.error(err, "Asynchronous job scoring batch run failed");
      });

    const response: ApiResponse<{ message: string; status: string }> = {
      success: true,
      data: {
        message: "Job matching batch evaluation run triggered in the background",
        status: "RUNNING",
      },
    };
    return response;
  });
}
