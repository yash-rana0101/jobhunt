import { loadConfig } from "@job-hunter/config";
import { logger } from "@job-hunter/logger";

import { extractResumeTextFromPdf } from "./pdf.js";
import { saveCandidateProfile } from "./persistence.js";
import { buildCandidateProfile } from "./profile.js";
import type { CandidateProfile, ResumeIntelligenceOptions } from "./types.js";

export type ResumeIntelligenceResult = {
  profile: CandidateProfile;
  candidateId?: string;
};

export async function runResumeIntelligence(
  options: ResumeIntelligenceOptions,
): Promise<ResumeIntelligenceResult> {
  const config = loadConfig();
  const resumeText = await extractResumeTextFromPdf(options.resumePath);
  const profile = await buildCandidateProfile(
    resumeText,
    options.openAiApiKey ?? config.OPENAI_API_KEY,
  );

  if (!options.persist) {
    return { profile };
  }

  const candidateId = await saveCandidateProfile(profile);
  logger.info({ candidateId }, "Stored candidate resume intelligence profile");

  return { profile, candidateId };
}
