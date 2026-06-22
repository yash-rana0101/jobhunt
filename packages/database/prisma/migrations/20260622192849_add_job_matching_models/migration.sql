-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "ranking_score" DOUBLE PRECISION NOT NULL,
    "classification" TEXT NOT NULL,
    "skills_match_score" DOUBLE PRECISION NOT NULL,
    "experience_match_score" DOUBLE PRECISION NOT NULL,
    "project_match_score" DOUBLE PRECISION NOT NULL,
    "role_match_score" DOUBLE PRECISION NOT NULL,
    "startup_fit_score" DOUBLE PRECISION NOT NULL,
    "location_fit_score" DOUBLE PRECISION NOT NULL,
    "compensation_fit_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatchReason" (
    "id" TEXT NOT NULL,
    "job_match_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "is_positive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatchReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRecommendation" (
    "id" TEXT NOT NULL,
    "job_match_id" TEXT NOT NULL,
    "why_apply" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "why_not_apply" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risk_factors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preparation_tips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interview_readiness_score" INTEGER NOT NULL,
    "missing_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "present_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvement_recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_job_id_key" ON "JobMatch"("job_id");

-- CreateIndex
CREATE INDEX "JobMatch_candidate_id_idx" ON "JobMatch"("candidate_id");

-- CreateIndex
CREATE INDEX "JobMatch_classification_idx" ON "JobMatch"("classification");

-- CreateIndex
CREATE INDEX "JobMatch_match_score_idx" ON "JobMatch"("match_score");

-- CreateIndex
CREATE INDEX "JobMatch_ranking_score_idx" ON "JobMatch"("ranking_score");

-- CreateIndex
CREATE INDEX "JobMatchReason_job_match_id_idx" ON "JobMatchReason"("job_match_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobRecommendation_job_match_id_key" ON "JobRecommendation"("job_match_id");

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatchReason" ADD CONSTRAINT "JobMatchReason_job_match_id_fkey" FOREIGN KEY ("job_match_id") REFERENCES "JobMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRecommendation" ADD CONSTRAINT "JobRecommendation_job_match_id_fkey" FOREIGN KEY ("job_match_id") REFERENCES "JobMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
