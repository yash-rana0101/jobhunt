-- CreateTable
CREATE TABLE "OutreachTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "subject_template" TEXT,
    "body_template" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachGenerationRun" (
    "id" TEXT NOT NULL,
    "job_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "drafts_generated" INTEGER NOT NULL DEFAULT 0,
    "average_quality_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "expected_response_rates" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "review_required_count" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachDraft" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "candidate_id" TEXT NOT NULL,
    "run_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "subject_lines" TEXT[],
    "selected_subject" TEXT,
    "body" TEXT NOT NULL,
    "day3_follow_up" TEXT,
    "day7_follow_up" TEXT,
    "day14_follow_up" TEXT,
    "quality_score" INTEGER NOT NULL,
    "personalization_score" INTEGER NOT NULL,
    "relevance_score" INTEGER NOT NULL,
    "spam_risk_score" INTEGER NOT NULL,
    "professionalism_score" INTEGER NOT NULL,
    "clarity_score" INTEGER NOT NULL,
    "expected_response_probability" DOUBLE PRECISION NOT NULL,
    "best_contact_message" TEXT,
    "best_outreach_type" TEXT,
    "outreach_recommendation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachFeedback" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachTemplate_name_key" ON "OutreachTemplate"("name");

-- CreateIndex
CREATE INDEX "OutreachTemplate_type_idx" ON "OutreachTemplate"("type");

-- CreateIndex
CREATE INDEX "OutreachGenerationRun_status_idx" ON "OutreachGenerationRun"("status");

-- CreateIndex
CREATE INDEX "OutreachDraft_job_id_idx" ON "OutreachDraft"("job_id");

-- CreateIndex
CREATE INDEX "OutreachDraft_contact_id_idx" ON "OutreachDraft"("contact_id");

-- CreateIndex
CREATE INDEX "OutreachDraft_candidate_id_idx" ON "OutreachDraft"("candidate_id");

-- CreateIndex
CREATE INDEX "OutreachDraft_run_id_idx" ON "OutreachDraft"("run_id");

-- CreateIndex
CREATE INDEX "OutreachDraft_status_idx" ON "OutreachDraft"("status");

-- CreateIndex
CREATE INDEX "OutreachFeedback_draft_id_idx" ON "OutreachFeedback"("draft_id");

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "CompanyContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "OutreachGenerationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachFeedback" ADD CONSTRAINT "OutreachFeedback_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "OutreachDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
