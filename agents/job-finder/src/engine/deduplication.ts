import { logger } from "@job-hunter/logger";
import type { UnnormalizedJob } from "../types.js";

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function getWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2); // Exclude very short words
  return new Set(words);
}

export function calculateJaccardSimilarity(text1: string, text2: string): number {
  const set1 = getWords(text1);
  const set2 = getWords(text2);

  if (set1.size === 0 || set2.size === 0) {
    return 0;
  }

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

export interface MinimalJobForDeduplication {
  id: string;
  title: string;
  company: string;
  description: string;
  applicationUrl: string | null;
}

export function findDuplicate(
  newJob: UnnormalizedJob,
  existingJobs: MinimalJobForDeduplication[],
): MinimalJobForDeduplication | null {
  const newCompanyNorm = normalizeText(newJob.company);
  const newTitleNorm = normalizeText(newJob.title);

  for (const existing of existingJobs) {
    // 1. Direct App URL Match
    if (
      newJob.applicationUrl &&
      existing.applicationUrl &&
      newJob.applicationUrl.trim() !== "" &&
      newJob.applicationUrl.toLowerCase() === existing.applicationUrl.toLowerCase()
    ) {
      logger.info({ newJob, existingJobId: existing.id }, "Duplicate detected by Application URL");
      return existing;
    }

    // 2. Company & Title Match with Description Similarity
    const existingCompanyNorm = normalizeText(existing.company);
    const existingTitleNorm = normalizeText(existing.title);

    if (newCompanyNorm === existingCompanyNorm && newTitleNorm === existingTitleNorm) {
      // Calculate Jaccard similarity on description
      const similarity = calculateJaccardSimilarity(newJob.description, existing.description);
      if (similarity >= 0.75) {
        logger.info(
          { newJob, existingJobId: existing.id, similarity },
          "Duplicate detected by Company/Title & Description similarity",
        );
        return existing;
      }
    }
  }

  return null;
}
