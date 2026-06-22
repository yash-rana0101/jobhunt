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
  Saved = "saved",
  Applied = "applied",
  Interviewing = "interviewing",
  Offer = "offer",
  Rejected = "rejected",
  Withdrawn = "withdrawn",
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
