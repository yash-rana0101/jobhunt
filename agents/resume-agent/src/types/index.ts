export type ResumeVariant =
  | "GENERAL"
  | "STARTUP"
  | "BACKEND"
  | "FULL_STACK"
  | "AI_ENGINEER"
  | "FOUNDING_ENGINEER"
  | "DEVOPS";

export interface OptimizeOptions {
  jobId?: string;
  candidateId: string;
  variant: ResumeVariant;
  provider?: "openai" | "anthropic" | "gemini";
  rules?: {
    reorderSkills?: boolean;
    reorderProjects?: boolean;
    reorderExperienceBullets?: boolean;
    improveBulletClarity?: boolean;
    improveAtsFormatting?: boolean;
    highlightRelevantExperience?: boolean;
    improveTechnicalWording?: boolean;
  };
}

export interface ExtractedKeywords {
  primary: string[];
  secondary: string[];
  industry: string[];
  role: string[];
  technology: string[];
}

export interface KeywordAlignment {
  missing: string[];
  matched: string[];
  highImpact: string[];
}

export interface AtsScores {
  overallScore: number;
  keywordMatchScore: number;
  roleAlignmentScore: number;
  skillsMatchScore: number;
  projectMatchScore: number;
  formattingScore: number;
  readabilityScore: number;
}

export interface ImprovementSuggestions {
  missingSkills: string[];
  missingKeywords: string[];
  weakSections: string[];
  improvementOpportunities: string[];
}

export interface OptimizedResumeData {
  markdownContent: string;
  jsonContent: {
    skills: string[];
    projects: Array<{
      projectName: string;
      description: string;
      techStack: string[];
    }>;
    experiences: Array<{
      company: string;
      role: string;
      responsibilities: string[];
    }>;
  };
  keywords: {
    keyword: string;
    category: string;
    status: "MATCHED" | "MISSING" | "HIGH_IMPACT";
  }[];
  scores: AtsScores;
  suggestions: ImprovementSuggestions;
  rulesApplied: string[];
  improvements: string[];
}

export interface LlmOptimizationResult {
  markdownContent: string;
  reorderedSkills: string[];
  reorderedProjects: string[];
  optimizedExperiences: Array<{
    company: string;
    role: string;
    responsibilities: string[];
  }>;
  keywords: {
    keyword: string;
    category: "PRIMARY" | "SECONDARY" | "INDUSTRY" | "ROLE" | "TECHNOLOGY";
    status: "MATCHED" | "MISSING" | "HIGH_IMPACT";
  }[];
  improvements: string[];
}
