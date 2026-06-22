import { isAbsolute, resolve } from "node:path";

import { runResumeIntelligence } from "./service.js";

export { runResumeIntelligence } from "./service.js";
export { buildCandidateProfile } from "./profile.js";
export { saveCandidateProfile } from "./persistence.js";
export type {
  CandidateEmbeddingInput,
  CandidateProfile,
  CandidateStrengthAnalysis,
  ExtractedEducation,
  ExtractedExperience,
  ExtractedKeyword,
  ExtractedProject,
  ExtractedSkill,
  PredictedRole,
  ResumeIntelligenceOptions,
} from "./types.js";

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  const commandArgs = process.argv.slice(2).filter((arg) => arg !== "--");
  const resumeArg = commandArgs.find((arg) => !arg.startsWith("--"));
  const commandRoot = process.env.INIT_CWD ?? process.cwd();
  const resumePath = resolveResumePath(resumeArg ?? "resume/resume.pdf", commandRoot);
  const persist = process.argv.includes("--persist");

  const result = await runResumeIntelligence({ resumePath, persist });
  const output = {
    candidateId: result.candidateId,
    candidate: result.profile.candidate,
    skills: result.profile.skills.slice(0, 20),
    keywords: result.profile.keywords.slice(0, 30),
    roles: result.profile.roles.slice(0, 10),
    searchQueries: result.profile.searchQueries,
    analysis: result.profile.analysis,
  };

  console.log(JSON.stringify(output, null, 2));
}

function resolveResumePath(resumePath: string, commandRoot: string): string {
  return isAbsolute(resumePath) ? resumePath : resolve(commandRoot, resumePath);
}
