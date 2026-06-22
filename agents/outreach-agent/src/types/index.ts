export type OutreachType =
  | "REFERRAL_REQUEST"
  | "HIRING_MANAGER_EMAIL"
  | "RECRUITER_EMAIL"
  | "FOUNDER_EMAIL"
  | "CTO_EMAIL"
  | "ENGINEERING_MANAGER_EMAIL"
  | "THANK_YOU_MESSAGE"
  | "FOLLOW_UP_MESSAGE"
  | "LINKEDIN_DM";

export type DraftStatus = "READY" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED";

export interface GenerationOptions {
  jobMatchId: string;
  contactId?: string;
  provider?: "openai" | "anthropic" | "gemini";
  model?: string;
  forceRefresh?: boolean;
}

export interface QualityScores {
  qualityScore: number;
  personalizationScore: number;
  relevanceScore: number;
  spamRiskScore: number;
  professionalismScore: number;
  clarityScore: number;
}

export interface OutreachRecommendation {
  bestContactMessage: string | null;
  bestOutreachType: string | null;
  expectedResponseProbability: number;
  outreachRecommendationReason: string | null;
}

export interface GeneratedDraftDetails {
  type: OutreachType;
  subjectLines: string[];
  body: string;
  day3FollowUp?: string;
  day7FollowUp?: string;
  day14FollowUp?: string;
  qualityScores: QualityScores;
  recommendation: OutreachRecommendation;
}

export interface ProviderResponse {
  subjectLines: string[];
  body: string;
  day3FollowUp?: string;
  day7FollowUp?: string;
  day14FollowUp?: string;
  scores: QualityScores;
  recommendation: OutreachRecommendation;
}
