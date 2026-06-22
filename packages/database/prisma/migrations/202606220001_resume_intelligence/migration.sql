CREATE TYPE "SkillCategory" AS ENUM (
  'PROGRAMMING_LANGUAGES',
  'BACKEND',
  'FRONTEND',
  'DATABASES',
  'CLOUD',
  'DEVOPS',
  'AI',
  'DATA_ENGINEERING',
  'TESTING',
  'ARCHITECTURE',
  'TOOLS'
);

CREATE TYPE "KeywordCategory" AS ENUM (
  'SKILL',
  'EXPERIENCE',
  'PROJECT',
  'ROLE',
  'DOMAIN',
  'TOOL'
);

CREATE TYPE "EmbeddingEntityType" AS ENUM (
  'RESUME',
  'EXPERIENCE',
  'PROJECT',
  'SKILL'
);

CREATE TABLE "Candidate" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "location" TEXT,
  "linkedIn" TEXT,
  "github" TEXT,
  "portfolio" TEXT,
  "summary" TEXT,
  "resumeText" TEXT,
  "searchQueries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "topStrengths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "uniqueAdvantages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "competitiveAdvantages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "startupFitScore" INTEGER NOT NULL DEFAULT 0,
  "enterpriseFitScore" INTEGER NOT NULL DEFAULT 0,
  "remoteWorkFitScore" INTEGER NOT NULL DEFAULT 0,
  "leadershipScore" INTEGER NOT NULL DEFAULT 0,
  "ownershipScore" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateSkill" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "skillName" TEXT NOT NULL,
  "category" "SkillCategory" NOT NULL,
  "confidenceScore" DOUBLE PRECISION NOT NULL,
  "yearsOfExperience" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateProject" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "projectName" TEXT NOT NULL,
  "description" TEXT,
  "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "projectType" TEXT,
  "role" TEXT,
  "githubLink" TEXT,
  "liveLink" TEXT,
  "businessImpact" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateExperience" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "startDate" TEXT,
  "endDate" TEXT,
  "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "technologiesUsed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "achievements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "impactMetrics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateEducation" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "degree" TEXT NOT NULL,
  "university" TEXT NOT NULL,
  "startYear" INTEGER,
  "endYear" INTEGER,
  "relevantCoursework" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateEducation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateKeyword" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "category" "KeywordCategory" NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateKeyword_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateRole" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "roleName" TEXT NOT NULL,
  "confidenceScore" INTEGER NOT NULL,
  "searchQueries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateEmbedding" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "entityType" "EmbeddingEntityType" NOT NULL,
  "entityLabel" TEXT NOT NULL,
  "sourceText" TEXT NOT NULL,
  "embedding" DOUBLE PRECISION[] NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "dimensions" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CandidateEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Candidate_email_idx" ON "Candidate"("email");
CREATE INDEX "Candidate_fullName_idx" ON "Candidate"("fullName");
CREATE INDEX "CandidateSkill_candidateId_idx" ON "CandidateSkill"("candidateId");
CREATE INDEX "CandidateSkill_skillName_idx" ON "CandidateSkill"("skillName");
CREATE INDEX "CandidateSkill_category_idx" ON "CandidateSkill"("category");
CREATE INDEX "CandidateProject_candidateId_idx" ON "CandidateProject"("candidateId");
CREATE INDEX "CandidateProject_projectName_idx" ON "CandidateProject"("projectName");
CREATE INDEX "CandidateExperience_candidateId_idx" ON "CandidateExperience"("candidateId");
CREATE INDEX "CandidateExperience_company_idx" ON "CandidateExperience"("company");
CREATE INDEX "CandidateExperience_role_idx" ON "CandidateExperience"("role");
CREATE INDEX "CandidateEducation_candidateId_idx" ON "CandidateEducation"("candidateId");
CREATE INDEX "CandidateEducation_university_idx" ON "CandidateEducation"("university");
CREATE INDEX "CandidateKeyword_candidateId_idx" ON "CandidateKeyword"("candidateId");
CREATE INDEX "CandidateKeyword_keyword_idx" ON "CandidateKeyword"("keyword");
CREATE INDEX "CandidateKeyword_category_idx" ON "CandidateKeyword"("category");
CREATE INDEX "CandidateRole_candidateId_idx" ON "CandidateRole"("candidateId");
CREATE INDEX "CandidateRole_roleName_idx" ON "CandidateRole"("roleName");
CREATE INDEX "CandidateEmbedding_candidateId_idx" ON "CandidateEmbedding"("candidateId");
CREATE INDEX "CandidateEmbedding_entityType_idx" ON "CandidateEmbedding"("entityType");

ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateProject" ADD CONSTRAINT "CandidateProject_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateExperience" ADD CONSTRAINT "CandidateExperience_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateEducation" ADD CONSTRAINT "CandidateEducation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateKeyword" ADD CONSTRAINT "CandidateKeyword_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateRole" ADD CONSTRAINT "CandidateRole_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateEmbedding" ADD CONSTRAINT "CandidateEmbedding_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
