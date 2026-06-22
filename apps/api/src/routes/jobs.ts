import { prisma } from "@job-hunter/database";
import { runJobDiscovery, getDashboardAnalytics } from "@job-hunter/job-finder";
import type { ApiResponse } from "@job-hunter/shared";
import type { FastifyInstance } from "fastify";
import { RemoteStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

interface JobsQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  remote?: string;
  source?: string;
  experience?: string;
}

interface RecentQuery {
  limit?: string;
}

interface RemoteQuery {
  page?: string;
  pageSize?: string;
}

interface CompanyParams {
  name: string;
}

interface SourceParams {
  source: string;
}

interface IdParams {
  id: string;
}

interface DiscoverBody {
  sources?: string[];
  queries?: string[];
  limit?: number;
}

export function registerJobRoutes(app: FastifyInstance): void {
  // GET /jobs - paginated with filters
  app.get<{ Querystring: JobsQuery }>("/jobs", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "10", 10)));
    const search = query.search || "";
    const remote = query.remote || "";
    const source = query.source || "";
    const experience = query.experience || "";

    const where: Prisma.JobWhereInput = { status: "ACTIVE" };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (remote) {
      where.remoteStatus = remote as RemoteStatus;
    }
    if (source) {
      where.source = source;
    }
    if (experience) {
      where.experienceClassification = experience;
    }

    const [totalItems, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: [{ postedDate: "desc" }, { crawlTimestamp: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          salary: true,
          locations: true,
          technologies: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
    return response;
  });

  // GET /jobs/analytics - Dashboard metrics
  app.get("/jobs/analytics", async () => {
    const analytics = await getDashboardAnalytics();
    const response: ApiResponse<typeof analytics> = {
      success: true,
      data: analytics,
    };
    return response;
  });

  // GET /jobs/recent - Most recently crawled jobs
  app.get<{ Querystring: RecentQuery }>("/jobs/recent", async (request) => {
    const query = request.query;
    const limit = Math.max(1, Math.min(50, parseInt(query.limit || "10", 10)));

    const jobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      orderBy: { crawlTimestamp: "desc" },
      take: limit,
      include: {
        salary: true,
        locations: true,
        technologies: true,
      },
    });

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs,
    };
    return response;
  });

  // GET /jobs/remote - Remote only jobs
  app.get<{ Querystring: RemoteQuery }>("/jobs/remote", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "10", 10)));

    const [totalItems, jobs] = await Promise.all([
      prisma.job.count({ where: { status: "ACTIVE", remoteStatus: RemoteStatus.REMOTE } }),
      prisma.job.findMany({
        where: { status: "ACTIVE", remoteStatus: RemoteStatus.REMOTE },
        orderBy: [{ postedDate: "desc" }, { crawlTimestamp: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          salary: true,
          locations: true,
          technologies: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs,
      pagination: { page, pageSize, totalItems, totalPages },
    };
    return response;
  });

  // GET /jobs/company/:name - Search by company
  app.get<{ Params: CompanyParams }>("/jobs/company/:name", async (request) => {
    const params = request.params;
    const jobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        company: { equals: params.name, mode: "insensitive" },
      },
      orderBy: { postedDate: "desc" },
      include: {
        salary: true,
        locations: true,
        technologies: true,
      },
    });

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs,
    };
    return response;
  });

  // GET /jobs/source/:source - Search by job board source
  app.get<{ Params: SourceParams }>("/jobs/source/:source", async (request) => {
    const params = request.params;
    const jobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        source: { equals: params.source, mode: "insensitive" },
      },
      orderBy: { postedDate: "desc" },
      include: {
        salary: true,
        locations: true,
        technologies: true,
      },
    });

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs,
    };
    return response;
  });

  // GET /jobs/:id - Single job details
  app.get<{ Params: IdParams }>("/jobs/:id", async (request, reply) => {
    const params = request.params;
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        salary: true,
        locations: true,
        technologies: true,
      },
    });

    if (!job) {
      void reply.status(404);
      const response: ApiResponse<never> = {
        success: false,
        error: { code: "JOB_NOT_FOUND", message: `Job with ID ${params.id} was not found` },
      };
      return response;
    }

    const response: ApiResponse<typeof job> = {
      success: true,
      data: job,
    };
    return response;
  });

  // POST /jobs/discover - Trigger job search run
  app.post<{ Body: DiscoverBody }>("/jobs/discover", (request) => {
    const body = request.body || {};
    const sources = body.sources || [];
    const queries = body.queries || [];
    const limit = body.limit || 5;

    // Run discovery asynchronously in background
    void runJobDiscovery({ sources, queries, limit })
      .then((result) => {
        app.log.info(result, "Asynchronous manual job discovery completed");
      })
      .catch((err) => {
        app.log.error(err, "Asynchronous manual job discovery failed");
      });

    const response: ApiResponse<{ message: string; status: string }> = {
      success: true,
      data: {
        message: "Job discovery run triggered successfully in the background",
        status: "RUNNING",
      },
    };
    return response;
  });
}
