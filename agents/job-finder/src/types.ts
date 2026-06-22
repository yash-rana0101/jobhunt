import type { RemoteStatus } from "@prisma/client";

export type UnnormalizedJob = {
  sourceJobId: string;
  source: string;
  title: string;
  company: string;
  description: string;
  applicationUrl?: string;
  companyUrl?: string;
  location?: string;
  employmentType?: string;
  experienceRequired?: string;
  salaryMin?: number;
  salaryMax?: number;
  postedDate?: Date;
  rawHtmlOrMarkdown?: string;
};

export type ParsedJob = {
  title: string;
  company: string;
  description: string;
  applicationUrl?: string;
  companyUrl?: string;
  location?: string;
  employmentType?: string;
  experienceRequired?: string;
  salaryMin?: number;
  salaryMax?: number;
  remoteStatus: RemoteStatus;
  postedDate?: Date;
  technologies: string[];
  experienceClassification?: string;
  rawLocation?: string;
};

export type SearchOptions = {
  limit?: number;
  useMock?: boolean;
};

export type DiscoveryResult = {
  jobsFound: number;
  jobsAdded: number;
  jobsUpdated: number;
  errors: string[];
  duration: number;
};
