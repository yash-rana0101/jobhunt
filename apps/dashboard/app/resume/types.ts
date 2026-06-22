export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
}

export interface ResumeOptimization {
  id: string;
  originalContent: string;
  optimizedContent: string;
  rulesApplied: string[];
  improvements: string[];
}

export interface ResumeScore {
  id: string;
  overallScore: number;
  keywordMatchScore: number;
  roleAlignmentScore: number;
  skillsMatchScore: number;
  projectMatchScore: number;
  formattingScore: number;
  readabilityScore: number;
  missingSkills: string[];
  missingKeywords: string[];
  weakSections: string[];
  improvementOpportunities: string[];
}

export interface ResumeKeyword {
  id: string;
  keyword: string;
  category: string;
  status: "MATCHED" | "MISSING" | "HIGH_IMPACT";
}

export interface ResumeVersion {
  id: string;
  jobId: string | null;
  companyName: string;
  roleName: string;
  versionName: string;
  filePath: string | null;
  markdownContent: string;
  atsScore: number | null;
  createdAt: string;
  job?: Job | null;
  optimizations?: ResumeOptimization[];
  scores?: ResumeScore[];
  keywords?: ResumeKeyword[];
}
