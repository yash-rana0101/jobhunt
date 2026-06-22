import { prisma } from "@job-hunter/database";

export interface DashboardAnalytics {
  totalJobs: number;
  bySource: Record<string, number>;
  byLocation: Record<string, number>;
  byExperience: Record<string, number>;
  byTechnology: Record<string, number>;
  byRemoteStatus: Record<string, number>;
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const [totalJobs, sourceCounts, remoteCounts, expCounts, locCounts, techCounts] =
    await Promise.all([
      // 1. Total Jobs
      prisma.job.count({ where: { status: "ACTIVE" } }),

      // 2. Jobs by Source
      prisma.job.groupBy({
        by: ["source"],
        _count: { id: true },
        where: { status: "ACTIVE" },
      }),

      // 3. Jobs by Remote Status
      prisma.job.groupBy({
        by: ["remoteStatus"],
        _count: { id: true },
        where: { status: "ACTIVE" },
      }),

      // 4. Jobs by Experience Level
      prisma.job.groupBy({
        by: ["experienceClassification"],
        _count: { id: true },
        where: { status: "ACTIVE" },
      }),

      // 5. Jobs by Location (Top 10)
      prisma.job.groupBy({
        by: ["location"],
        _count: { id: true },
        where: {
          status: "ACTIVE",
          AND: [{ location: { not: null } }, { location: { not: "" } }],
        },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // 6. Jobs by Technology (Top 15)
      prisma.jobTechnology.findMany({
        select: {
          name: true,
          _count: {
            select: { jobs: { where: { status: "ACTIVE" } } },
          },
        },
        orderBy: {
          jobs: { _count: "desc" },
        },
        take: 15,
      }),
    ]);

  // Format groupings into simple Record<string, number> mappings
  const bySource: Record<string, number> = {};
  for (const item of sourceCounts) {
    bySource[item.source] = item._count.id;
  }

  const byRemoteStatus: Record<string, number> = {};
  for (const item of remoteCounts) {
    byRemoteStatus[item.remoteStatus] = item._count.id;
  }

  const byExperience: Record<string, number> = {};
  for (const item of expCounts) {
    const key = item.experienceClassification || "Unknown";
    byExperience[key] = item._count.id;
  }

  const byLocation: Record<string, number> = {};
  for (const item of locCounts) {
    if (item.location) {
      byLocation[item.location] = item._count.id;
    }
  }

  const byTechnology: Record<string, number> = {};
  for (const item of techCounts) {
    if (item._count.jobs > 0) {
      byTechnology[item.name] = item._count.jobs;
    }
  }

  return {
    totalJobs,
    bySource,
    byLocation,
    byExperience,
    byTechnology,
    byRemoteStatus,
  };
}
