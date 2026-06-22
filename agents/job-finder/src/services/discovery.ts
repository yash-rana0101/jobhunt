import { prisma } from "@job-hunter/database";
import { logger } from "@job-hunter/logger";
import { getAdapter, getAllSupportedSources } from "../adapters/factory.js";
import { findDuplicate } from "../engine/deduplication.js";
import { calculateFreshnessScore } from "../engine/freshness.js";
import type { DiscoveryResult, SearchOptions } from "../types.js";

export async function runJobDiscovery(
  options: SearchOptions & { sources?: string[]; queries?: string[] } = {},
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalJobsFound = 0;
  let totalJobsAdded = 0;
  let totalJobsUpdated = 0;

  const targetSources =
    options.sources && options.sources.length > 0 ? options.sources : getAllSupportedSources();
  const queries =
    options.queries && options.queries.length > 0 ? options.queries : await resolveSearchQueries();

  logger.info({ targetSources, queries }, "Starting job discovery run");

  // Load existing jobs for deduplication check
  const existingJobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      company: true,
      description: true,
      applicationUrl: true,
    },
  });

  for (const source of targetSources) {
    let adapter;
    try {
      adapter = getAdapter(source);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Adapter resolve error for source ${source}: ${errMsg}`);
      continue;
    }

    // Ensure JobSource record exists in database
    let dbSource = await prisma.jobSource.findUnique({ where: { name: adapter.sourceName } });
    if (!dbSource) {
      dbSource = await prisma.jobSource.create({
        data: { name: adapter.sourceName, baseUrl: adapter.baseUrl },
      });
    }

    for (const query of queries) {
      const queryStartTime = Date.now();
      let jobsFoundInQuery = 0;
      let jobsAddedInQuery = 0;
      let jobsUpdatedInQuery = 0;
      let queryError: string | null = null;

      try {
        logger.info({ source, query }, "Searching opportunities");
        const discovered = await adapter.discover(query, options);
        jobsFoundInQuery = discovered.length;
        totalJobsFound += jobsFoundInQuery;

        for (const rawJob of discovered) {
          try {
            // Crawl description detail
            const rawContent = rawJob.applicationUrl
              ? await adapter.crawl(rawJob.applicationUrl)
              : "";
            const parsed = await adapter.parse(rawContent, rawJob);

            // Deduplication
            const duplicate = findDuplicate(rawJob, existingJobs);

            const freshnessScore = calculateFreshnessScore(parsed.postedDate, new Date(), source);

            if (duplicate) {
              // Update existing record
              await prisma.job.update({
                where: { id: duplicate.id },
                data: {
                  crawlTimestamp: new Date(),
                  status: "ACTIVE",
                  freshnessScore,
                },
              });
              jobsUpdatedInQuery++;
              totalJobsUpdated++;
            } else {
              // Insert new canonical record
              const newJob = await prisma.job.create({
                data: {
                  title: parsed.title,
                  company: parsed.company,
                  description: parsed.description,
                  applicationUrl: parsed.applicationUrl,
                  companyUrl: parsed.companyUrl,
                  location: parsed.location,
                  employmentType: parsed.employmentType,
                  experienceRequired: parsed.experienceRequired,
                  experienceClassification: parsed.experienceClassification,
                  salaryMin: parsed.salaryMin,
                  salaryMax: parsed.salaryMax,
                  remoteStatus: parsed.remoteStatus,
                  postedDate: parsed.postedDate,
                  source: adapter.sourceName,
                  sourceJobId: rawJob.sourceJobId,
                  status: "ACTIVE",
                  freshnessScore,
                  jobSourceId: dbSource.id,
                  salary:
                    parsed.salaryMin || parsed.salaryMax
                      ? {
                          create: {
                            min: parsed.salaryMin,
                            max: parsed.salaryMax,
                            currency: "USD",
                            interval: "YEAR",
                          },
                        }
                      : undefined,
                  locations: parsed.location
                    ? {
                        create: {
                          rawLocation: parsed.location,
                          remoteStatus: parsed.remoteStatus,
                        },
                      }
                    : undefined,
                  technologies: {
                    connectOrCreate: parsed.technologies.map((tech) => ({
                      where: { name: tech },
                      create: { name: tech },
                    })),
                  },
                },
              });

              // Track in local list for subsequent inner loop deduplication checks
              existingJobs.push({
                id: newJob.id,
                title: newJob.title,
                company: newJob.company,
                description: newJob.description,
                applicationUrl: newJob.applicationUrl,
              });

              jobsAddedInQuery++;
              totalJobsAdded++;
            }
          } catch (jobErr: unknown) {
            logger.error({ jobErr, rawJob }, "Failed to process discovered job item");
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        queryError = errMsg;
        errors.push(`Crawl execution error for source ${source} query "${query}": ${errMsg}`);
      } finally {
        // Track Search Run record in database
        await prisma.jobSearchRun.create({
          data: {
            searchQuery: query,
            source: adapter.sourceName,
            jobsFound: jobsFoundInQuery,
            jobsAdded: jobsAddedInQuery,
            jobsUpdated: jobsUpdatedInQuery,
            errors: queryError,
            duration: Date.now() - queryStartTime,
            status: queryError ? "FAILED" : "SUCCESS",
          },
        });
      }
    }

    // Update freshness score and last crawled timestamp on JobSource
    await prisma.jobSource.update({
      where: { id: dbSource.id },
      data: {
        lastCrawledAt: new Date(),
        freshnessScore: calculateSourceFreshness(adapter.sourceName),
      },
    });
  }

  return {
    jobsFound: totalJobsFound,
    jobsAdded: totalJobsAdded,
    jobsUpdated: totalJobsUpdated,
    errors,
    duration: Date.now() - startTime,
  };
}

async function resolveSearchQueries(): Promise<string[]> {
  const latestCandidate = await prisma.candidate.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { searchQueries: true },
  });

  if (
    latestCandidate &&
    latestCandidate.searchQueries &&
    latestCandidate.searchQueries.length > 0
  ) {
    return latestCandidate.searchQueries;
  }

  // Fallback default search combinations if no profile exists yet
  return [
    "Backend Engineer Node.js",
    "TypeScript Software Engineer",
    "Full Stack Engineer React Node",
    "Founding Engineer Startup",
    "AI Engineer LLM",
  ];
}

function calculateSourceFreshness(source: string): number {
  // Simple score heuristic based on source reliability
  const lower = source.toLowerCase();
  if (lower.includes("yc") || lower.includes("wellfound")) return 95;
  if (lower.includes("greenhouse") || lower.includes("lever") || lower.includes("ashby")) return 90;
  return 75;
}
