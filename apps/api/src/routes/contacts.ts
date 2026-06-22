import { prisma } from "@job-hunter/database";
import { runContactDiscovery } from "@job-hunter/contact-finder";
import type { ApiResponse } from "@job-hunter/shared";
import type { FastifyInstance } from "fastify";
import type { Prisma, ContactCategory } from "@prisma/client";

interface ContactsQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  category?: string;
  minPriority?: string;
  minConfidence?: string;
  status?: string;
}

interface IdParams {
  id: string;
}

interface CompanyParams {
  company: string;
}

interface DiscoverBody {
  jobMatchId: string;
  forceRefresh?: boolean;
}

export function registerContactRoutes(app: FastifyInstance): void {
  // GET /contacts - paginated list of contacts with filters
  app.get<{ Querystring: ContactsQuery }>("/contacts", async (request) => {
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || "20", 10)));
    const search = query.search || "";
    const category = query.category || "";
    const minPriority = parseInt(query.minPriority || "0", 10);
    const minConfidence = parseInt(query.minConfidence || "0", 10);
    const status = query.status || "";

    const where: Prisma.CompanyContactWhereInput = {
      contactPriority: { gte: minPriority },
      confidenceScore: { gte: minConfidence },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category as ContactCategory;
    }

    if (status) {
      where.status = status;
    }

    const [totalItems, contacts] = await Promise.all([
      prisma.companyContact.count({ where }),
      prisma.companyContact.findMany({
        where,
        orderBy: { contactPriority: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          company: true,
          department: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    const response: ApiResponse<typeof contacts> = {
      success: true,
      data: contacts,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
    return response;
  });

  // GET /contacts/recommended - highest priority contacts
  app.get("/contacts/recommended", async () => {
    const contacts = await prisma.companyContact.findMany({
      where: {
        contactPriority: { gte: 70 },
        confidenceScore: { gte: 60 },
      },
      orderBy: { contactPriority: "desc" },
      take: 15,
      include: {
        company: true,
        department: true,
      },
    });

    const response: ApiResponse<typeof contacts> = {
      success: true,
      data: contacts,
    };
    return response;
  });

  // GET /contacts/referrals - all referral targets
  app.get("/contacts/referrals", async () => {
    const referrals = await prisma.referralTarget.findMany({
      orderBy: { ranking: "asc" },
      include: {
        contact: {
          include: {
            company: true,
          },
        },
        candidate: true,
        job: true,
      },
    });

    const response: ApiResponse<typeof referrals> = {
      success: true,
      data: referrals,
    };
    return response;
  });

  // GET /contacts/:id - single contact detail
  app.get<{ Params: IdParams }>("/contacts/:id", async (request, reply) => {
    const params = request.params;
    const contact = await prisma.companyContact.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        department: true,
        referrals: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    });

    if (!contact) {
      void reply.status(404);
      const response: ApiResponse<never> = {
        success: false,
        error: { code: "CONTACT_NOT_FOUND", message: `Contact with ID ${params.id} was not found` },
      };
      return response;
    }

    const response: ApiResponse<typeof contact> = {
      success: true,
      data: contact,
    };
    return response;
  });

  // GET /contacts/company/:company - contacts for a specific company name
  app.get<{ Params: CompanyParams }>("/contacts/company/:company", async (request) => {
    const params = request.params;
    const contacts = await prisma.companyContact.findMany({
      where: {
        companyName: { equals: params.company, mode: "insensitive" },
      },
      orderBy: { contactPriority: "desc" },
      include: {
        company: true,
        department: true,
      },
    });

    const response: ApiResponse<typeof contacts> = {
      success: true,
      data: contacts,
    };
    return response;
  });

  // POST /contacts/discover - trigger discovery run for a job match
  app.post<{ Body: DiscoverBody }>("/contacts/discover", async (request, reply) => {
    const body = request.body || {};
    const { jobMatchId, forceRefresh } = body;

    if (!jobMatchId) {
      void reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_INPUT", message: "jobMatchId is required" },
      };
    }

    const jobMatch = await prisma.jobMatch.findUnique({
      where: { id: jobMatchId },
    });

    if (!jobMatch) {
      void reply.status(404);
      return {
        success: false,
        error: { code: "MATCH_NOT_FOUND", message: `JobMatch with ID ${jobMatchId} not found` },
      };
    }

    // Trigger run in background
    runContactDiscovery(jobMatchId, { forceRefresh })
      .then((runId: string) => {
        app.log.info({ runId, jobMatchId }, "Asynchronous contact discovery run completed");
      })
      .catch((err: unknown) => {
        app.log.error({ err, jobMatchId }, "Asynchronous contact discovery run failed");
      });

    void reply.status(202);
    const response: ApiResponse<{ message: string; status: string }> = {
      success: true,
      data: {
        message: "Contact discovery process initiated in background",
        status: "RUNNING",
      },
    };
    return response;
  });
}
