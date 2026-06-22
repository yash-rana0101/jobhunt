-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DISCOVERED', 'SHORTLISTED', 'READY_TO_APPLY', 'APPLIED', 'OUTREACH_SENT', 'REPLIED', 'PHONE_SCREEN', 'TECHNICAL_ROUND', 'SYSTEM_DESIGN', 'TAKE_HOME', 'MANAGER_ROUND', 'FINAL_ROUND', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'NEGOTIATING');

-- CreateTable
CREATE TABLE "ApplicationStage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "company_id" TEXT,
    "resume_version_id" TEXT,
    "contact_id" TEXT,
    "candidate_id" TEXT NOT NULL,
    "applied_date" TIMESTAMP(3),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DISCOVERED',
    "source" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stage_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "old_status" "ApplicationStatus",
    "new_status" "ApplicationStatus" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT NOT NULL DEFAULT 'USER',
    "reason" TEXT,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationActivity" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRound" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "round_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "round_id" TEXT,
    "round_name" TEXT NOT NULL,
    "interviewer_name" TEXT,
    "interviewer_role" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "meeting_link" TEXT,
    "notes" TEXT,
    "feedback" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "base_salary" DOUBLE PRECISION,
    "bonus" DOUBLE PRECISION,
    "equity" TEXT,
    "joining_bonus" DOUBLE PRECISION,
    "benefits" TEXT,
    "location" TEXT,
    "employment_type" TEXT,
    "offer_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "offer_status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_path" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "note_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationReminder" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationStage_key_key" ON "ApplicationStage"("key");

-- CreateIndex
CREATE INDEX "Application_job_id_idx" ON "Application"("job_id");

-- CreateIndex
CREATE INDEX "Application_company_id_idx" ON "Application"("company_id");

-- CreateIndex
CREATE INDEX "Application_resume_version_id_idx" ON "Application"("resume_version_id");

-- CreateIndex
CREATE INDEX "Application_contact_id_idx" ON "Application"("contact_id");

-- CreateIndex
CREATE INDEX "Application_candidate_id_idx" ON "Application"("candidate_id");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_priority_idx" ON "Application"("priority");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_application_id_idx" ON "ApplicationStatusHistory"("application_id");

-- CreateIndex
CREATE INDEX "ApplicationActivity_application_id_idx" ON "ApplicationActivity"("application_id");

-- CreateIndex
CREATE INDEX "ApplicationActivity_created_at_idx" ON "ApplicationActivity"("created_at");

-- CreateIndex
CREATE INDEX "InterviewRound_application_id_idx" ON "InterviewRound"("application_id");

-- CreateIndex
CREATE INDEX "Interview_application_id_idx" ON "Interview"("application_id");

-- CreateIndex
CREATE INDEX "Interview_round_id_idx" ON "Interview"("round_id");

-- CreateIndex
CREATE INDEX "Offer_application_id_idx" ON "Offer"("application_id");

-- CreateIndex
CREATE INDEX "ApplicationDocument_application_id_idx" ON "ApplicationDocument"("application_id");

-- CreateIndex
CREATE INDEX "ApplicationNote_application_id_idx" ON "ApplicationNote"("application_id");

-- CreateIndex
CREATE INDEX "ApplicationReminder_application_id_idx" ON "ApplicationReminder"("application_id");

-- CreateIndex
CREATE INDEX "ApplicationReminder_due_date_idx" ON "ApplicationReminder"("due_date");

-- CreateIndex
CREATE INDEX "ApplicationReminder_status_idx" ON "ApplicationReminder"("status");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_resume_version_id_fkey" FOREIGN KEY ("resume_version_id") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "CompanyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "ApplicationStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "InterviewRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationReminder" ADD CONSTRAINT "ApplicationReminder_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
