import { prisma } from "@job-hunter/database";
import { logger } from "@job-hunter/logger";
import { calculateMatchScore } from "../engine/scorer.js";
import { calculateRankingScore } from "../engine/ranker.js";
import { analyzeGap } from "../engine/gap-analysis.js";
import { generateRecommendation } from "../engine/recommendation.js";
import type { CandidateData, JobData } from "../engine/scorer.js";

export interface MatchBatchResult {
  processed: number;
  matched: number;
  skipped: number;
  averageScore: number;
  duration: number;
  errors: string[];
}

export async function runJobMatchingBatch(
  options: { batchSize?: number } = {},
): Promise<MatchBatchResult> {
  const startTime = Date.now();
  const batchSize = options.batchSize ?? 100;
  const errors: string[] = [];
  let processed = 0;
  let matched = 0;
  let totalScoreSum = 0;

  logger.info({ batchSize }, "Job matching batch started");

  try {
    // 1. Load latest candidate profile
    const candidate = await prisma.candidate.findFirst({
      orderBy: { updatedAt: "desc" },
      include: {
        skills: true,
        experiences: true,
        projects: true,
        roles: true,
      },
    });

    if (!candidate) {
      throw new Error("No candidate profile found. Please run resume parser first.");
    }

    const candidateData: CandidateData = {
      id: candidate.id,
      fullName: candidate.fullName,
      skills: candidate.skills.map((s) => ({
        skillName: s.skillName,
        confidenceScore: s.confidenceScore,
        yearsOfExperience: s.yearsOfExperience,
      })),
      experiences: candidate.experiences.map((e) => ({
        role: e.role,
        company: e.company,
        responsibilities: e.responsibilities,
      })),
      projects: candidate.projects.map((p) => ({
        projectName: p.projectName,
        description: p.description,
        techStack: p.techStack,
      })),
      roles: candidate.roles.map((r) => ({
        roleName: r.roleName,
        confidenceScore: r.confidenceScore,
      })),
      startupFitScore: candidate.startupFitScore,
      remoteWorkFitScore: candidate.remoteWorkFitScore,
    };

    // 2. Fetch jobs that have not been scored/matched yet
    const jobs = await prisma.job.findMany({
      where: { match: null, status: "ACTIVE" },
      take: batchSize,
      include: {
        technologies: true,
      },
    });

    processed = jobs.length;

    for (const job of jobs) {
      try {
        const jobData: JobData = {
          id: job.id,
          title: job.title,
          company: job.company,
          description: job.description,
          experienceClassification: job.experienceClassification,
          remoteStatus: job.remoteStatus,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          source: job.source,
          technologies: job.technologies.map((t) => ({ name: t.name })),
        };

        // Compute scores
        const { score: matchScore, subScores } = calculateMatchScore(candidateData, jobData);
        const rankingScore = calculateRankingScore(
          matchScore,
          job.freshnessScore,
          job.remoteStatus,
          job.salaryMax,
        );

        // Classify
        let classification: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" = "POOR";
        if (matchScore >= 90) classification = "EXCELLENT";
        else if (matchScore >= 75) classification = "GOOD";
        else if (matchScore >= 60) classification = "AVERAGE";

        // Gap analysis
        const candSkillNames = candidateData.skills.map((s) => s.skillName);
        const jobTechNames = jobData.technologies.map((t) => t.name);
        const gap = analyzeGap(candSkillNames, jobTechNames);

        // Recommendation
        const rec = generateRecommendation(
          subScores,
          gap.missingSkills,
          gap.presentSkills,
          job.remoteStatus,
          job.company,
        );

        // Explanations/Reasons list
        const reasons: { reason: string; isPositive: boolean }[] = [];
        if (subScores.skills >= 80)
          reasons.push({ reason: "Strong Skills Alignment", isPositive: true });
        if (subScores.experience >= 85)
          reasons.push({ reason: "Relevant Experience Level", isPositive: true });
        if (subScores.projects >= 70)
          reasons.push({ reason: "Matching Project Background", isPositive: true });
        if (subScores.startup >= 80 && job.source.toLowerCase().includes("yc")) {
          reasons.push({ reason: "High Startup Fit", isPositive: true });
        }
        if (gap.missingSkills.length > 3) {
          reasons.push({
            reason: `Skill Gap (Missing ${gap.missingSkills.length} techs)`,
            isPositive: false,
          });
        }

        // Save match
        await prisma.jobMatch.create({
          data: {
            jobId: job.id,
            candidateId: candidate.id,
            matchScore,
            rankingScore,
            classification,
            skillsMatchScore: subScores.skills,
            experienceMatchScore: subScores.experience,
            projectMatchScore: subScores.projects,
            roleMatchScore: subScores.role,
            startupFitScore: subScores.startup,
            locationFitScore: subScores.location,
            compensationFitScore: subScores.compensation,
            reasons: {
              create: reasons.map((r) => ({
                reason: r.reason,
                isPositive: r.isPositive,
              })),
            },
            recommendation: {
              create: {
                whyApply: rec.whyApply,
                whyNotApply: rec.whyNotApply,
                riskFactors: rec.riskFactors,
                strengths: rec.strengths,
                weaknesses: rec.weaknesses,
                preparationTips: rec.preparationTips,
                interviewReadinessScore: rec.interviewReadinessScore,
                missingSkills: gap.missingSkills,
                presentSkills: gap.presentSkills,
                improvementRecommendations: gap.improvementRecommendations,
              },
            },
          },
        });

        matched++;
        totalScoreSum += matchScore;
      } catch (jobErr: unknown) {
        logger.error({ jobErr, jobId: job.id }, "Failed to match job");
        const errMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
        errors.push(`Job ${job.id} scoring error: ${errMsg}`);
      }
    }
  } catch (err: unknown) {
    logger.error(err, "Job matching batch failed");
    const errMsg = err instanceof Error ? err.message : String(err);
    errors.push(`Batch execution error: ${errMsg}`);
  }

  const duration = Date.now() - startTime;
  const avg = matched > 0 ? Math.round(totalScoreSum / matched) : 0;
  logger.info(
    { processed, matched, averageScore: avg, duration, errorsCount: errors.length },
    "Job matching batch completed",
  );

  return {
    processed,
    matched,
    skipped: processed - matched,
    averageScore: avg,
    duration,
    errors,
  };
}
