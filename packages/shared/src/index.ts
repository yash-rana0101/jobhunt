export type BaseEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  pagination?: Pagination;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiError;
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export enum JobSource {
  CompanyCareerPage = "company_career_page",
  JobBoard = "job_board",
  Referral = "referral",
  Recruiter = "recruiter",
  SearchProvider = "search_provider",
}

export enum ApplicationStatus {
  DISCOVERED = "DISCOVERED",
  SHORTLISTED = "SHORTLISTED",
  READY_TO_APPLY = "READY_TO_APPLY",
  APPLIED = "APPLIED",
  OUTREACH_SENT = "OUTREACH_SENT",
  REPLIED = "REPLIED",
  PHONE_SCREEN = "PHONE_SCREEN",
  TECHNICAL_ROUND = "TECHNICAL_ROUND",
  SYSTEM_DESIGN = "SYSTEM_DESIGN",
  TAKE_HOME = "TAKE_HOME",
  MANAGER_ROUND = "MANAGER_ROUND",
  FINAL_ROUND = "FINAL_ROUND",
  OFFER_RECEIVED = "OFFER_RECEIVED",
  OFFER_ACCEPTED = "OFFER_ACCEPTED",
  OFFER_DECLINED = "OFFER_DECLINED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
  ARCHIVED = "ARCHIVED",
}

export enum OutreachChannel {
  Email = "email",
  LinkedIn = "linkedin",
  Other = "other",
}

export enum ContactSource {
  LinkedIn = "linkedin",
  CompanyWebsite = "company_website",
  Referral = "referral",
  Manual = "manual",
}
