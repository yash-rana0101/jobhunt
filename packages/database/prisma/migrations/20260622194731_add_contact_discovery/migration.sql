-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('HIRING_MANAGER', 'ENGINEERING_MANAGER', 'TEAM_LEAD', 'RECRUITER', 'FOUNDER', 'CTO', 'ENGINEER', 'REFERRAL_SOURCE', 'OTHER');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "website" TEXT,
    "linkedin_url" TEXT,
    "careers_url" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "headquarters" TEXT,
    "funding_stage" TEXT,
    "description" TEXT,
    "headcount" INTEGER,
    "hiring_activity" TEXT,
    "recent_growth_signals" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDepartment" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headcount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyContact" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "department_id" TEXT,
    "department_name" TEXT,
    "seniority" TEXT,
    "linkedin_url" TEXT,
    "company_name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "contact_priority" DOUBLE PRECISION NOT NULL,
    "category" "ContactCategory" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCOVERED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "discovery_run_id" TEXT,

    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralTarget" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "ranking" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactDiscoveryRun" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "job_id" TEXT,
    "company_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "contacts_found" INTEGER NOT NULL DEFAULT 0,
    "contacts_ranked" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactDiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_company_name_key" ON "Company"("company_name");

-- CreateIndex
CREATE INDEX "Company_company_name_idx" ON "Company"("company_name");

-- CreateIndex
CREATE INDEX "CompanyDepartment_company_id_idx" ON "CompanyDepartment"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDepartment_company_id_name_key" ON "CompanyDepartment"("company_id", "name");

-- CreateIndex
CREATE INDEX "CompanyContact_company_id_idx" ON "CompanyContact"("company_id");

-- CreateIndex
CREATE INDEX "CompanyContact_department_id_idx" ON "CompanyContact"("department_id");

-- CreateIndex
CREATE INDEX "CompanyContact_discovery_run_id_idx" ON "CompanyContact"("discovery_run_id");

-- CreateIndex
CREATE INDEX "CompanyContact_category_idx" ON "CompanyContact"("category");

-- CreateIndex
CREATE INDEX "CompanyContact_contact_priority_idx" ON "CompanyContact"("contact_priority");

-- CreateIndex
CREATE INDEX "ReferralTarget_contact_id_idx" ON "ReferralTarget"("contact_id");

-- CreateIndex
CREATE INDEX "ReferralTarget_candidate_id_idx" ON "ReferralTarget"("candidate_id");

-- CreateIndex
CREATE INDEX "ReferralTarget_job_id_idx" ON "ReferralTarget"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralTarget_contact_id_candidate_id_job_id_key" ON "ReferralTarget"("contact_id", "candidate_id", "job_id");

-- CreateIndex
CREATE INDEX "ContactDiscoveryRun_company_id_idx" ON "ContactDiscoveryRun"("company_id");

-- CreateIndex
CREATE INDEX "ContactDiscoveryRun_job_id_idx" ON "ContactDiscoveryRun"("job_id");

-- AddForeignKey
ALTER TABLE "CompanyDepartment" ADD CONSTRAINT "CompanyDepartment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "CompanyDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_discovery_run_id_fkey" FOREIGN KEY ("discovery_run_id") REFERENCES "ContactDiscoveryRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralTarget" ADD CONSTRAINT "ReferralTarget_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "CompanyContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralTarget" ADD CONSTRAINT "ReferralTarget_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralTarget" ADD CONSTRAINT "ReferralTarget_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactDiscoveryRun" ADD CONSTRAINT "ContactDiscoveryRun_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactDiscoveryRun" ADD CONSTRAINT "ContactDiscoveryRun_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
