import { prisma } from "@job-hunter/database";
import type { ApiResponse } from "@job-hunter/shared";
import type { FastifyInstance } from "fastify";

export function registerCandidateRoutes(app: FastifyInstance): void {
  app.get("/candidate/profile", async () => {
    const candidate = await getLatestCandidate();
    return candidateResponse(candidate);
  });

  app.get("/candidate/skills", async () => {
    const candidate = await getLatestCandidate();
    return candidateResponse(candidate?.skills);
  });

  app.get("/candidate/projects", async () => {
    const candidate = await getLatestCandidate();
    return candidateResponse(candidate?.projects);
  });

  app.get("/candidate/experience", async () => {
    const candidate = await getLatestCandidate();
    return candidateResponse(candidate?.experiences);
  });

  app.get("/candidate/roles", async () => {
    const candidate = await getLatestCandidate();
    return candidateResponse(candidate?.roles);
  });

  app.get("/candidate/analysis", async () => {
    const candidate = await getLatestCandidate();
    return candidateResponse(
      candidate
        ? {
            candidateId: candidate.id,
            topStrengths: candidate.topStrengths,
            uniqueAdvantages: candidate.uniqueAdvantages,
            competitiveAdvantages: candidate.competitiveAdvantages,
            startupFitScore: candidate.startupFitScore,
            enterpriseFitScore: candidate.enterpriseFitScore,
            remoteWorkFitScore: candidate.remoteWorkFitScore,
            leadershipScore: candidate.leadershipScore,
            ownershipScore: candidate.ownershipScore,
            searchQueries: candidate.searchQueries,
          }
        : undefined,
    );
  });
}

async function getLatestCandidate() {
  return prisma.candidate.findFirst({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      skills: {
        orderBy: [{ confidenceScore: "desc" }, { skillName: "asc" }],
      },
      projects: {
        orderBy: { createdAt: "asc" },
      },
      experiences: {
        orderBy: { createdAt: "asc" },
      },
      education: {
        orderBy: { createdAt: "asc" },
      },
      keywords: {
        orderBy: [{ weight: "desc" }, { keyword: "asc" }],
      },
      roles: {
        orderBy: [{ confidenceScore: "desc" }, { roleName: "asc" }],
      },
    },
  });
}

function candidateResponse<TData>(data: TData | null | undefined): ApiResponse<TData> {
  if (!data) {
    return {
      success: false,
      error: {
        code: "CANDIDATE_PROFILE_NOT_FOUND",
        message: "No candidate profile has been generated yet.",
      },
    };
  }

  return {
    success: true,
    data,
  };
}
