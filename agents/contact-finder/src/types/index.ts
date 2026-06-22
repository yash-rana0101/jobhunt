import type {
  CompanyContact,
  Company,
  ReferralTarget,
  ContactDiscoveryRun,
  ContactCategory,
} from "@job-hunter/database";

export type ContactCategoryType = ContactCategory;

export interface DiscoveredContact {
  fullName: string;
  jobTitle: string;
  department?: string;
  linkedinUrl?: string;
  companyName: string;
  source: string;
  confidenceScore: number;
  contactPriority: number;
  category: ContactCategoryType;
  seniority?: string;
}

export interface CompanyIntelligence {
  companyName: string;
  website?: string;
  linkedinUrl?: string;
  careersUrl?: string;
  industry?: string;
  companySize?: string;
  headquarters?: string;
  fundingStage?: string;
  description?: string;
  headcount?: number;
  hiringActivity?: string;
  recentGrowthSignals?: string;
}

export interface ContactDiscoveryResult {
  run: ContactDiscoveryRun;
  company: Company;
  contacts: CompanyContact[];
  referrals: ReferralTarget[];
}

export interface ConfidenceFactors {
  profileMatch: number; // 0 - 100
  departmentMatch: number; // 0 - 100
  roleMatch: number; // 0 - 100
  jobMatch: number; // 0 - 100
  sourceQuality: number; // 0 - 100
}

export interface PriorityFactors {
  roleRelevance: number; // 0 - 100
  hiringAuthority: number; // 0 - 100
  engineeringRelevance: number; // 0 - 100
  likelihoodToRespond: number; // 0 - 100
  seniorityScore: number; // 0 - 100
  connectionToPosition: number; // 0 - 100
}
