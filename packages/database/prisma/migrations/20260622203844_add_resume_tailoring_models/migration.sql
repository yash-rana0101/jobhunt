-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "job_id" TEXT,
    "candidate_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "version_name" TEXT NOT NULL,
    "file_path" TEXT,
    "markdown_content" TEXT NOT NULL,
    "json_content" JSONB,
    "ats_score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeOptimization" (
    "id" TEXT NOT NULL,
    "resume_version_id" TEXT NOT NULL,
    "original_content" TEXT NOT NULL,
    "optimized_content" TEXT NOT NULL,
    "rules_applied" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeKeyword" (
    "id" TEXT NOT NULL,
    "resume_version_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeScore" (
    "id" TEXT NOT NULL,
    "resume_version_id" TEXT NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "keyword_match_score" DOUBLE PRECISION NOT NULL,
    "role_alignment_score" DOUBLE PRECISION NOT NULL,
    "skills_match_score" DOUBLE PRECISION NOT NULL,
    "project_match_score" DOUBLE PRECISION NOT NULL,
    "formatting_score" DOUBLE PRECISION NOT NULL,
    "readability_score" DOUBLE PRECISION NOT NULL,
    "missing_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missing_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weak_sections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvement_opportunities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeGenerationRun" (
    "id" TEXT NOT NULL,
    "job_id" TEXT,
    "candidate_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "errors" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeVersion_job_id_idx" ON "ResumeVersion"("job_id");

-- CreateIndex
CREATE INDEX "ResumeVersion_candidate_id_idx" ON "ResumeVersion"("candidate_id");

-- CreateIndex
CREATE INDEX "ResumeVersion_version_name_idx" ON "ResumeVersion"("version_name");

-- CreateIndex
CREATE INDEX "ResumeOptimization_resume_version_id_idx" ON "ResumeOptimization"("resume_version_id");

-- CreateIndex
CREATE INDEX "ResumeKeyword_resume_version_id_idx" ON "ResumeKeyword"("resume_version_id");

-- CreateIndex
CREATE INDEX "ResumeKeyword_keyword_idx" ON "ResumeKeyword"("keyword");

-- CreateIndex
CREATE INDEX "ResumeKeyword_category_idx" ON "ResumeKeyword"("category");

-- CreateIndex
CREATE INDEX "ResumeKeyword_status_idx" ON "ResumeKeyword"("status");

-- CreateIndex
CREATE INDEX "ResumeScore_resume_version_id_idx" ON "ResumeScore"("resume_version_id");

-- CreateIndex
CREATE INDEX "ResumeGenerationRun_job_id_idx" ON "ResumeGenerationRun"("job_id");

-- CreateIndex
CREATE INDEX "ResumeGenerationRun_candidate_id_idx" ON "ResumeGenerationRun"("candidate_id");

-- CreateIndex
CREATE INDEX "ResumeGenerationRun_status_idx" ON "ResumeGenerationRun"("status");

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeOptimization" ADD CONSTRAINT "ResumeOptimization_resume_version_id_fkey" FOREIGN KEY ("resume_version_id") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeKeyword" ADD CONSTRAINT "ResumeKeyword_resume_version_id_fkey" FOREIGN KEY ("resume_version_id") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeScore" ADD CONSTRAINT "ResumeScore_resume_version_id_fkey" FOREIGN KEY ("resume_version_id") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeGenerationRun" ADD CONSTRAINT "ResumeGenerationRun_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeGenerationRun" ADD CONSTRAINT "ResumeGenerationRun_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
