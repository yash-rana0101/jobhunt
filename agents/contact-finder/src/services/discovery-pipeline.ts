import { prisma } from "@job-hunter/database";
import { logger } from "@job-hunter/logger";
import { discoverCompanyInfo, searchTavily, parseLinkedInSearchResult } from "./tavily-service.js";
import { calculateConfidenceScore } from "./confidence-engine.js";
import { calculatePriorityScore } from "./ranking-engine.js";
import { evaluateReferralTarget } from "./referral-discovery.js";
import type { DiscoveredContact } from "../types/index.js";

// Cache freshness check (7 days)
const CACHE_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

export interface PipelineOptions {
  forceRefresh?: boolean;
}

export async function runContactDiscovery(
  jobMatchId: string,
  options: PipelineOptions = {},
): Promise<string> {
  const startTime = Date.now();

  // Find job match details
  const jobMatch = await prisma.jobMatch.findUnique({
    where: { id: jobMatchId },
    include: {
      job: true,
      candidate: {
        include: {
          experiences: true,
          education: true,
        },
      },
    },
  });

  if (!jobMatch) {
    throw new Error(`JobMatch with ID ${jobMatchId} not found`);
  }

  const job = jobMatch.job;
  const candidate = jobMatch.candidate;
  const companyName = job.company;

  logger.info({ companyName, jobId: job.id }, "Starting contact discovery run");

  // Create discovery run record
  const run = await prisma.contactDiscoveryRun.create({
    data: {
      jobId: job.id,
      companyName,
      status: "RUNNING",
    },
  });

  try {
    // Step 1: Identify and Enrich Company Data (with caching)
    let company = await prisma.company.findUnique({
      where: { companyName },
    });

    const isCacheExpired = company
      ? Date.now() - new Date(company.updatedAt).getTime() > CACHE_FRESHNESS_MS
      : true;

    if (!company || isCacheExpired || options.forceRefresh) {
      logger.info({ companyName }, "Company cache expired or missing, fetching info");
      const enrichedInfo = await discoverCompanyInfo(companyName);

      company = await prisma.company.upsert({
        where: { companyName },
        update: {
          website: enrichedInfo.website,
          linkedinUrl: enrichedInfo.linkedinUrl,
          careersUrl: enrichedInfo.careersUrl,
          industry: enrichedInfo.industry,
          companySize: enrichedInfo.companySize,
          fundingStage: enrichedInfo.fundingStage,
          description: enrichedInfo.description,
        },
        create: {
          companyName,
          website: enrichedInfo.website,
          linkedinUrl: enrichedInfo.linkedinUrl,
          careersUrl: enrichedInfo.careersUrl,
          industry: enrichedInfo.industry,
          companySize: enrichedInfo.companySize,
          fundingStage: enrichedInfo.fundingStage,
          description: enrichedInfo.description,
        },
      });
    }

    // Step 2: Find Relevant Contacts via Tavily Searches
    const searchQueries = [
      `site:linkedin.com/in "${companyName}" ("hiring manager" OR "talent acquisition" OR "recruiter")`,
      `site:linkedin.com/in "${companyName}" ("engineering manager" OR "em" OR "tech lead" OR "team lead")`,
      `site:linkedin.com/in "${companyName}" ("founder" OR "ceo" OR "cto")`,
    ];

    const rawResults = await Promise.all(
      searchQueries.map((q) => searchTavily(q, 4).catch(() => [])),
    );
    const results = rawResults.flat();

    const parsedContacts: DiscoveredContact[] = [];
    const seenUrls = new Set<string>();

    for (const res of results) {
      const parsed = parseLinkedInSearchResult(res, companyName);
      if (parsed && parsed.linkedinUrl && !seenUrls.has(parsed.linkedinUrl)) {
        seenUrls.add(parsed.linkedinUrl);
        parsedContacts.push(parsed);
      }
    }

    let contactsSaved = 0;
    let contactsRanked = 0;

    // Step 3 & 4: Deduplicate, Score, Rank, and Store Results
    for (const rawContact of parsedContacts) {
      // Confidence score calculation
      const { score: confidenceScore } = calculateConfidenceScore(rawContact, job);
      // Filter out low confidence contacts (< 50)
      if (confidenceScore < 50) continue;

      // Priority ranking calculation
      const { score: contactPriority } = calculatePriorityScore(rawContact, job);

      // Check duplicate matching (exact LinkedIn URL match, or Name + CompanyId)
      let contactRecord = await prisma.companyContact.findFirst({
        where: {
          OR: [
            { linkedinUrl: rawContact.linkedinUrl },
            { fullName: rawContact.fullName, companyId: company.id },
          ],
        },
      });

      if (contactRecord) {
        // Update canonical record
        contactRecord = await prisma.companyContact.update({
          where: { id: contactRecord.id },
          data: {
            jobTitle: rawContact.jobTitle,
            category: rawContact.category,
            confidenceScore,
            contactPriority,
            source: rawContact.source,
            status: "DISCOVERED",
            discoveryRunId: run.id,
          },
        });
      } else {
        // Create new contact record
        contactRecord = await prisma.companyContact.create({
          data: {
            companyId: company.id,
            fullName: rawContact.fullName,
            jobTitle: rawContact.jobTitle,
            linkedinUrl: rawContact.linkedinUrl,
            companyName: rawContact.companyName,
            source: rawContact.source,
            confidenceScore,
            contactPriority,
            category: rawContact.category,
            seniority: rawContact.seniority,
            status: "DISCOVERED",
            discoveryRunId: run.id,
          },
        });
      }
      contactsSaved++;
      contactsRanked++;

      // Step 5: Referral target evaluation & storage
      const refScore = evaluateReferralTarget(contactRecord, candidate, job);
      if (refScore.isReferral) {
        await prisma.referralTarget.upsert({
          where: {
            contactId_candidateId_jobId: {
              contactId: contactRecord.id,
              candidateId: candidate.id,
              jobId: job.id,
            },
          },
          update: {
            ranking: refScore.ranking,
            type: refScore.type,
            reason: refScore.reason,
          },
          create: {
            contactId: contactRecord.id,
            candidateId: candidate.id,
            jobId: job.id,
            ranking: refScore.ranking,
            type: refScore.type,
            reason: refScore.reason,
          },
        });
      }
    }

    const duration = Date.now() - startTime;
    const successRate =
      parsedContacts.length > 0 ? (contactsSaved / parsedContacts.length) * 100 : 100.0;

    // Update discovery run as COMPLETED
    await prisma.contactDiscoveryRun.update({
      where: { id: run.id },
      data: {
        companyId: company.id,
        status: "COMPLETED",
        contactsFound: parsedContacts.length,
        contactsRanked,
        duration,
        successRate,
      },
    });

    logger.info({ runId: run.id, contactsSaved }, "Contact discovery run finished successfully");
    return run.id;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errMessage = error instanceof Error ? error.message : String(error);

    logger.error({ error, runId: run.id }, "Contact discovery run failed");

    await prisma.contactDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errors: errMessage,
        duration,
        successRate: 0.0,
      },
    });

    throw error;
  }
}
