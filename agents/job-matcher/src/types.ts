export interface MatchSubScores {
  skills: number;
  experience: number;
  projects: number;
  role: number;
  startup: number;
  location: number;
  compensation: number;
}

export interface RecommendationDetails {
  whyApply: string[];
  whyNotApply: string[];
  riskFactors: string[];
  strengths: string[];
  weaknesses: string[];
  preparationTips: string[];
  interviewReadinessScore: number;
}

export interface GapAnalysisDetails {
  missingSkills: string[];
  presentSkills: string[];
  improvementRecommendations: string[];
}

export interface JobMatchResult {
  matchScore: number;
  rankingScore: number;
  classification: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
  subScores: MatchSubScores;
  reasons: string[];
  recommendation: RecommendationDetails;
  gapAnalysis: GapAnalysisDetails;
}
