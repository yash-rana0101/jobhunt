import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@job-hunter/database";
import { logger } from "@job-hunter/logger";
import { ProviderFactory } from "../engine/provider.js";
import { computeAtsScore } from "../engine/scoring.js";
import { generatePdfFromMarkdown } from "./pdf-service.js";
import type { OptimizeOptions } from "../types/index.js";

/**
 * Executes a full resume optimization and tailoring run for a specific job.
 */
export async function optimizeAndStoreResume(options: OptimizeOptions): Promise<string> {
  const startTime = Date.now();
  logger.info(options, "Starting resume optimization run");

  // Create ResumeGenerationRun in database
  const run = await prisma.resumeGenerationRun.create({
    data: {
      jobId: options.jobId,
      candidateId: options.candidateId,
      status: "RUNNING",
    },
  });

  try {
    // 1. Fetch Candidate and Job details
    const candidate = await prisma.candidate.findUnique({
      where: { id: options.candidateId },
      include: {
        skills: true,
        projects: true,
        experiences: true,
        education: true,
        keywords: true,
        roles: true,
      },
    });

    if (!candidate) {
      throw new Error(`Candidate with ID ${options.candidateId} not found`);
    }

    let jobDescription = "General resume optimization for standard market matches";
    let companyName = "General Market";
    let roleName: string = options.variant;

    if (options.jobId) {
      const job = await prisma.job.findUnique({
        where: { id: options.jobId },
      });
      if (job) {
        jobDescription = job.description;
        companyName = job.company;
        roleName = job.title;
      }
    }

    // 2. Format Active Optimization Rules list
    const rules = options.rules || {
      reorderSkills: true,
      reorderProjects: true,
      reorderExperienceBullets: true,
      improveBulletClarity: true,
      improveAtsFormatting: true,
      highlightRelevantExperience: true,
      improveTechnicalWording: true,
    };
    const activeRules = Object.entries(rules)
      .filter(([, active]) => active)
      .map(([ruleName]) => ruleName);

    // 3. Serialize Candidate Details for prompt
    const candidatePromptData = {
      fullName: candidate.fullName,
      summary: candidate.summary,
      skills: candidate.skills.map((s) => ({ name: s.skillName, category: s.category })),
      projects: candidate.projects.map((p) => ({
        name: p.projectName,
        desc: p.description,
        stack: p.techStack,
      })),
      experiences: candidate.experiences.map((e) => ({
        company: e.company,
        role: e.role,
        bullets: e.responsibilities,
        tech: e.technologiesUsed,
      })),
      education: candidate.education.map((edu) => ({
        degree: edu.degree,
        school: edu.university,
      })),
    };

    // 4. Invoke LLM Provider
    const provider = ProviderFactory.getProvider(options.provider || "openai");
    const llmResult = await provider.optimizeResume(
      JSON.stringify(candidatePromptData, null, 2),
      jobDescription,
      options.variant,
      activeRules,
    );

    // 5. Compute ATS Score & Compile suggestions
    const { scores, suggestions } = computeAtsScore(llmResult.keywords, llmResult.markdownContent);

    // 6. Save ResumeVersion record
    const resumeVersion = await prisma.resumeVersion.create({
      data: {
        jobId: options.jobId,
        candidateId: options.candidateId,
        companyName,
        roleName,
        versionName: options.variant,
        markdownContent: llmResult.markdownContent,
        jsonContent: {
          skills: llmResult.reorderedSkills,
          projects: llmResult.reorderedProjects,
          experiences: llmResult.optimizedExperiences,
        },
        atsScore: scores.overallScore,
        status: "SUCCESS",
      },
    });

    // 7. Save granular optimizations, keywords, and scores
    await prisma.resumeOptimization.create({
      data: {
        resumeVersionId: resumeVersion.id,
        originalContent: candidate.resumeText || "",
        optimizedContent: llmResult.markdownContent,
        rulesApplied: activeRules,
        improvements: llmResult.improvements,
      },
    });

    await prisma.resumeScore.create({
      data: {
        resumeVersionId: resumeVersion.id,
        overallScore: scores.overallScore,
        keywordMatchScore: scores.keywordMatchScore,
        roleAlignmentScore: scores.roleAlignmentScore,
        skillsMatchScore: scores.skillsMatchScore,
        projectMatchScore: scores.projectMatchScore,
        formattingScore: scores.formattingScore,
        readabilityScore: scores.readabilityScore,
        missingSkills: suggestions.missingSkills,
        missingKeywords: suggestions.missingKeywords,
        weakSections: suggestions.weakSections,
        improvementOpportunities: suggestions.improvementOpportunities,
      },
    });

    if (llmResult.keywords.length > 0) {
      await prisma.resumeKeyword.createMany({
        data: llmResult.keywords.map((k) => ({
          resumeVersionId: resumeVersion.id,
          keyword: k.keyword,
          category: k.category,
          status: k.status,
        })),
      });
    }

    // 8. Generate PDF file buffer and write to workspace
    const pdfBuffer = await generatePdfFromMarkdown(llmResult.markdownContent);
    const pdfDir = join(process.cwd(), "resume", "versions");
    await mkdir(pdfDir, { recursive: true });

    const pdfPath = join(pdfDir, `${resumeVersion.id}.pdf`);
    await writeFile(pdfPath, pdfBuffer);

    // 9. Update ResumeVersion path
    await prisma.resumeVersion.update({
      where: { id: resumeVersion.id },
      data: { filePath: pdfPath },
    });

    // Mark run as completed successfully
    await prisma.resumeGenerationRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        duration: Date.now() - startTime,
      },
    });

    return resumeVersion.id;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Error running resume optimization");

    // Mark run as failed
    await prisma.resumeGenerationRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errors: errorMsg,
        duration: Date.now() - startTime,
      },
    });

    throw err;
  }
}
