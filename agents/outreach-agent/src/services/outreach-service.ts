import { prisma } from "@job-hunter/database";
import { logger } from "@job-hunter/logger";
import { ProviderFactory } from "../engine/provider.js";
import { buildOutreachSystemPrompt, buildOutreachUserPrompt } from "../engine/prompt.js";
import { evaluateDraftScores } from "../engine/reviewer.js";
import type { GenerationOptions, OutreachType } from "../types/index.js";
import type { CompanyContact } from "@prisma/client";

/**
 * Maps a contact category enum to the corresponding outreach channel type.
 */
function mapContactToOutreachType(contact: CompanyContact | null): OutreachType {
  if (!contact) {
    return "HIRING_MANAGER_EMAIL";
  }
  switch (contact.category) {
    case "HIRING_MANAGER":
      return "HIRING_MANAGER_EMAIL";
    case "ENGINEERING_MANAGER":
      return "ENGINEERING_MANAGER_EMAIL";
    case "RECRUITER":
      return "RECRUITER_EMAIL";
    case "FOUNDER":
      return "FOUNDER_EMAIL";
    case "CTO":
      return "CTO_EMAIL";
    case "REFERRAL_SOURCE":
      return "REFERRAL_REQUEST";
    case "TEAM_LEAD":
    case "ENGINEER":
    case "OTHER":
    default:
      return "LINKEDIN_DM";
  }
}

/**
 * Runs a batch outreach generation for a job match.
 * Generates drafts for all contacts associated with the target job's company.
 */
export async function runOutreachGenerationBatch(options: GenerationOptions): Promise<string> {
  const { jobMatchId, contactId, provider = "openai" } = options;
  const startTime = Date.now();

  logger.info({ jobMatchId, contactId, provider }, "Starting outreach generation run");

  // Create database run record
  const run = await prisma.outreachGenerationRun.create({
    data: {
      status: "RUNNING",
    },
  });

  try {
    // Fetch JobMatch details
    const match = await prisma.jobMatch.findUnique({
      where: { id: jobMatchId },
      include: {
        job: true,
        candidate: {
          include: {
            skills: true,
            experiences: true,
            projects: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error(`JobMatch not found: ${jobMatchId}`);
    }

    const { job, candidate } = match;

    // Identify target contacts
    let contacts: CompanyContact[] = [];
    if (contactId) {
      const contact = await prisma.companyContact.findUnique({
        where: { id: contactId },
      });
      if (contact) {
        contacts.push(contact);
      }
    } else {
      contacts = await prisma.companyContact.findMany({
        where: { companyName: job.company },
      });
    }

    // If no specific contacts exist, do a general run
    const targets = contacts.length > 0 ? contacts : [null];
    let draftsCount = 0;
    let sumQuality = 0;
    let sumResponseProb = 0;
    let reviewRequiredCount = 0;

    for (const target of targets) {
      try {
        const outreachType = mapContactToOutreachType(target);
        const systemPrompt = buildOutreachSystemPrompt();
        const userPrompt = buildOutreachUserPrompt(candidate, job, target, outreachType);

        const llm = ProviderFactory.getProvider(provider);
        const result = await llm.generateOutreach(systemPrompt, userPrompt);

        const { clampedScores, status } = evaluateDraftScores(result.scores);

        await prisma.outreachDraft.create({
          data: {
            jobId: job.id,
            candidateId: candidate.id,
            contactId: target?.id || null,
            runId: run.id,
            type: outreachType,
            status,
            subjectLines: result.subjectLines,
            selectedSubject: result.subjectLines[0] || null,
            body: result.body,
            day3FollowUp: result.day3FollowUp || null,
            day7FollowUp: result.day7FollowUp || null,
            day14FollowUp: result.day14FollowUp || null,
            qualityScore: clampedScores.qualityScore,
            personalizationScore: clampedScores.personalizationScore,
            relevanceScore: clampedScores.relevanceScore,
            spamRiskScore: clampedScores.spamRiskScore,
            professionalismScore: clampedScores.professionalismScore,
            clarityScore: clampedScores.clarityScore,
            expectedResponseProbability: result.recommendation.expectedResponseProbability,
            bestContactMessage: result.recommendation.bestContactMessage,
            bestOutreachType: result.recommendation.bestOutreachType,
            outreachRecommendationReason: result.recommendation.outreachRecommendationReason,
          },
        });

        draftsCount++;
        sumQuality += clampedScores.qualityScore;
        sumResponseProb += result.recommendation.expectedResponseProbability;
        if (status === "REVIEW_REQUIRED") {
          reviewRequiredCount++;
        }
      } catch (err: unknown) {
        logger.error({ err, target: target?.id }, "Failed generating single draft");
      }
    }

    const duration = Date.now() - startTime;
    await prisma.outreachGenerationRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        draftsGenerated: draftsCount,
        averageQualityScore: draftsCount > 0 ? sumQuality / draftsCount : 0.0,
        expectedResponseRates: draftsCount > 0 ? sumResponseProb / draftsCount : 0.0,
        reviewRequiredCount,
        duration,
      },
    });

    return run.id;
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err, runId: run.id }, "Outreach generation run batch failed");

    await prisma.outreachGenerationRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errors: errorMessage,
        duration,
      },
    });

    throw err;
  }
}

/**
 * Regenerates an existing single outreach draft.
 */
export async function regenerateSingleDraft(
  draftId: string,
  providerName: "openai" | "anthropic" | "gemini" = "openai",
): Promise<void> {
  logger.info({ draftId, providerName }, "Regenerating single draft");

  const existingDraft = await prisma.outreachDraft.findUnique({
    where: { id: draftId },
    include: {
      job: true,
      contact: true,
      candidate: {
        include: {
          skills: true,
          experiences: true,
          projects: true,
        },
      },
    },
  });

  if (!existingDraft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  const { candidate, job, contact, type } = existingDraft;
  const systemPrompt = buildOutreachSystemPrompt();
  const userPrompt = buildOutreachUserPrompt(candidate, job, contact, type);

  const llm = ProviderFactory.getProvider(providerName);
  const result = await llm.generateOutreach(systemPrompt, userPrompt);

  const { clampedScores, status } = evaluateDraftScores(result.scores);

  await prisma.outreachDraft.update({
    where: { id: draftId },
    data: {
      status,
      subjectLines: result.subjectLines,
      selectedSubject: result.subjectLines[0] || null,
      body: result.body,
      day3FollowUp: result.day3FollowUp || null,
      day7FollowUp: result.day7FollowUp || null,
      day14FollowUp: result.day14FollowUp || null,
      qualityScore: clampedScores.qualityScore,
      personalizationScore: clampedScores.personalizationScore,
      relevanceScore: clampedScores.relevanceScore,
      spamRiskScore: clampedScores.spamRiskScore,
      professionalismScore: clampedScores.professionalismScore,
      clarityScore: clampedScores.clarityScore,
      expectedResponseProbability: result.recommendation.expectedResponseProbability,
      bestContactMessage: result.recommendation.bestContactMessage,
      bestOutreachType: result.recommendation.bestOutreachType,
      outreachRecommendationReason: result.recommendation.outreachRecommendationReason,
    },
  });
}
