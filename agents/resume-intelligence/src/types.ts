export const skillCategories = [
  "PROGRAMMING_LANGUAGES",
  "BACKEND",
  "FRONTEND",
  "DATABASES",
  "CLOUD",
  "DEVOPS",
  "AI",
  "DATA_ENGINEERING",
  "TESTING",
  "ARCHITECTURE",
  "TOOLS",
] as const;

export type SkillCategoryName = (typeof skillCategories)[number];

export type CandidateIdentity = {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
};

export type ExtractedSkill = {
  skillName: string;
  category: SkillCategoryName;
  confidenceScore: number;
  yearsOfExperience?: number;
};

export type ExtractedExperience = {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  responsibilities: string[];
  technologiesUsed: string[];
  achievements: string[];
  impactMetrics: string[];
};

export type ExtractedProject = {
  projectName: string;
  description?: string;
  techStack: string[];
  projectType?: string;
  role?: string;
  githubLink?: string;
  liveLink?: string;
  businessImpact?: string;
};

export type ExtractedEducation = {
  degree: string;
  university: string;
  startYear?: number;
  endYear?: number;
  relevantCoursework: string[];
};

export type ExtractedKeyword = {
  keyword: string;
  category: "SKILL" | "EXPERIENCE" | "PROJECT" | "ROLE" | "DOMAIN" | "TOOL";
  weight: number;
  source: string;
};

export type PredictedRole = {
  roleName: string;
  confidenceScore: number;
  searchQueries: string[];
};

export type CandidateStrengthAnalysis = {
  topStrengths: string[];
  uniqueAdvantages: string[];
  competitiveAdvantages: string[];
  startupFitScore: number;
  enterpriseFitScore: number;
  remoteWorkFitScore: number;
  leadershipScore: number;
  ownershipScore: number;
};

export type CandidateEmbeddingInput = {
  entityType: "RESUME" | "EXPERIENCE" | "PROJECT" | "SKILL";
  entityLabel: string;
  sourceText: string;
  embedding: number[];
  provider: string;
  model: string;
  dimensions: number;
};

export type CandidateProfile = {
  candidate: CandidateIdentity;
  resumeText: string;
  skills: ExtractedSkill[];
  experiences: ExtractedExperience[];
  projects: ExtractedProject[];
  education: ExtractedEducation[];
  keywords: ExtractedKeyword[];
  roles: PredictedRole[];
  searchQueries: string[];
  analysis: CandidateStrengthAnalysis;
  embeddings: CandidateEmbeddingInput[];
};

export type ResumeIntelligenceOptions = {
  resumePath: string;
  openAiApiKey?: string;
  persist?: boolean;
};
