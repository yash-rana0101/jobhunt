import { analyzeCandidateStrengths } from "./analysis.js";
import { generateCandidateEmbeddings } from "./embeddings.js";
import { generateAtsKeywords } from "./keywords.js";
import { extractCandidateIdentity, extractCandidateSections } from "./profile-parser.js";
import { predictTargetRoles, generateSearchProfile } from "./roles.js";
import type { CandidateProfile } from "./types.js";

export async function buildCandidateProfile(
  resumeText: string,
  openAiApiKey?: string,
): Promise<CandidateProfile> {
  const candidate = extractCandidateIdentity(resumeText);
  const { skills, experiences, projects, education } = extractCandidateSections(resumeText);
  const roles = predictTargetRoles(skills, resumeText);
  const keywords = generateAtsKeywords({ skills, experiences, projects, roles });
  const searchQueries = generateSearchProfile(roles, skills);
  const analysis = analyzeCandidateStrengths({ resumeText, skills, experiences, projects });
  const embeddings = await generateCandidateEmbeddings({
    resumeText,
    skills,
    experiences,
    projects,
    openAiApiKey,
  });

  return {
    candidate,
    resumeText,
    skills,
    experiences,
    projects,
    education,
    keywords,
    roles,
    searchQueries,
    analysis,
    embeddings,
  };
}
