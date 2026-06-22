-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('REFERRAL_REQUEST', 'HIRING_MANAGER_OUTREACH', 'RECRUITER_OUTREACH', 'FOUNDER_OUTREACH', 'CTO_OUTREACH', 'FOLLOW_UP', 'THANK_YOU', 'INTERVIEW_CONFIRMATION', 'INTERVIEW_FOLLOW_UP', 'GENERAL');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('DRAFT', 'APPROVED', 'SCHEDULED', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ResponseCategory" AS ENUM ('POSITIVE', 'INTERESTED', 'REFERRAL_PROVIDED', 'INTERVIEW_REQUEST', 'FOLLOW_UP_REQUEST', 'NOT_INTERESTED', 'REJECTED', 'OUT_OF_OFFICE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "CommunicationThread" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "contact_id" TEXT,
    "company_id" TEXT,
    "subject" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT,
    "application_id" TEXT,
    "contact_id" TEXT,
    "company_id" TEXT,
    "candidate_id" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'DRAFT',
    "provider" TEXT NOT NULL DEFAULT 'RESEND',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationRecipient" (
    "id" TEXT NOT NULL,
    "communication_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "sent_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "provider_message_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subject_template" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "communication_id" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "status" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailReply" (
    "id" TEXT NOT NULL,
    "communication_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reply_timestamp" TIMESTAMP(3) NOT NULL,
    "sentiment" TEXT,
    "response_category" "ResponseCategory" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpSchedule" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "application_id" TEXT,
    "contact_id" TEXT,
    "sequence" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAnalytics" (
    "id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationThread_application_id_idx" ON "CommunicationThread"("application_id");

-- CreateIndex
CREATE INDEX "CommunicationThread_contact_id_idx" ON "CommunicationThread"("contact_id");

-- CreateIndex
CREATE INDEX "CommunicationThread_company_id_idx" ON "CommunicationThread"("company_id");

-- CreateIndex
CREATE INDEX "Communication_thread_id_idx" ON "Communication"("thread_id");

-- CreateIndex
CREATE INDEX "Communication_application_id_idx" ON "Communication"("application_id");

-- CreateIndex
CREATE INDEX "Communication_contact_id_idx" ON "Communication"("contact_id");

-- CreateIndex
CREATE INDEX "Communication_company_id_idx" ON "Communication"("company_id");

-- CreateIndex
CREATE INDEX "Communication_candidate_id_idx" ON "Communication"("candidate_id");

-- CreateIndex
CREATE INDEX "Communication_status_idx" ON "Communication"("status");

-- CreateIndex
CREATE INDEX "CommunicationRecipient_communication_id_idx" ON "CommunicationRecipient"("communication_id");

-- CreateIndex
CREATE INDEX "CommunicationMessage_thread_id_idx" ON "CommunicationMessage"("thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndex
CREATE INDEX "EmailDelivery_communication_id_idx" ON "EmailDelivery"("communication_id");

-- CreateIndex
CREATE INDEX "EmailReply_communication_id_idx" ON "EmailReply"("communication_id");

-- CreateIndex
CREATE INDEX "FollowUpSchedule_thread_id_idx" ON "FollowUpSchedule"("thread_id");

-- CreateIndex
CREATE INDEX "FollowUpSchedule_application_id_idx" ON "FollowUpSchedule"("application_id");

-- CreateIndex
CREATE INDEX "FollowUpSchedule_contact_id_idx" ON "FollowUpSchedule"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationAnalytics_metric_name_key" ON "CommunicationAnalytics"("metric_name");

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "CompanyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "CommunicationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "CompanyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRecipient" ADD CONSTRAINT "CommunicationRecipient_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "CommunicationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailReply" ADD CONSTRAINT "EmailReply_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpSchedule" ADD CONSTRAINT "FollowUpSchedule_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "CommunicationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpSchedule" ADD CONSTRAINT "FollowUpSchedule_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpSchedule" ADD CONSTRAINT "FollowUpSchedule_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "CompanyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
