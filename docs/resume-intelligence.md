# Resume Intelligence Engine

## Purpose

The Resume Intelligence Engine converts `resume/resume.pdf` into structured candidate intelligence
for future job matching, referral discovery, outreach, and analytics agents.

This phase does not implement job search. It focuses only on resume parsing, candidate profiling,
skill extraction, ATS keyword generation, role targeting, search profile generation, strength
analysis, embeddings, and PostgreSQL persistence.

## Architecture

```mermaid
flowchart LR
  ResumePdf["resume/resume.pdf"] --> PdfReader["PDF text extraction"]
  PdfReader --> ProfileBuilder["Resume Intelligence Agent"]
  ProfileBuilder --> Skills["Skill Extraction"]
  ProfileBuilder --> Experience["Experience Extraction"]
  ProfileBuilder --> Projects["Project Extraction"]
  ProfileBuilder --> Education["Education Extraction"]
  Skills --> Keywords["ATS Keyword Generator"]
  Experience --> Keywords
  Projects --> Keywords
  Skills --> Roles["Role Prediction Engine"]
  Roles --> Searches["Search Profile Generator"]
  ProfileBuilder --> Analysis["Candidate Strength Analysis"]
  ProfileBuilder --> Embeddings["Resume Embeddings"]
  ProfileBuilder --> Database[(PostgreSQL via Prisma)]
  Database --> Api["Fastify Candidate API"]
```

## Data Flow

1. `agents/resume-intelligence` reads `resume/resume.pdf`.
2. PDF text is normalized into resume text.
3. Candidate identity, skills, experience, projects, and education are extracted.
4. ATS keywords are generated from skills, experience technologies, project tech stacks, and roles.
5. Target roles are scored from 0 to 100.
6. Search queries are generated from the strongest roles and technical signals.
7. Strength analysis scores startup, enterprise, remote, leadership, and ownership fit.
8. Embeddings are generated for the full resume, each experience, each project, and each skill.
9. The complete profile is stored in PostgreSQL through Prisma.
10. Fastify exposes read APIs for future agents and dashboards.

## Database ERD

```mermaid
erDiagram
  Candidate ||--o{ CandidateSkill : has
  Candidate ||--o{ CandidateProject : has
  Candidate ||--o{ CandidateExperience : has
  Candidate ||--o{ CandidateEducation : has
  Candidate ||--o{ CandidateKeyword : has
  Candidate ||--o{ CandidateRole : has
  Candidate ||--o{ CandidateEmbedding : has

  Candidate {
    string id PK
    string fullName
    string email
    string phone
    string location
    string linkedIn
    string github
    string portfolio
    string summary
    string resumeText
    string[] searchQueries
    string[] topStrengths
    string[] uniqueAdvantages
    string[] competitiveAdvantages
    int startupFitScore
    int enterpriseFitScore
    int remoteWorkFitScore
    int leadershipScore
    int ownershipScore
  }

  CandidateSkill {
    string id PK
    string candidateId FK
    string skillName
    SkillCategory category
    float confidenceScore
    float yearsOfExperience
  }

  CandidateExperience {
    string id PK
    string candidateId FK
    string company
    string role
    string startDate
    string endDate
    string[] responsibilities
    string[] technologiesUsed
    string[] achievements
    string[] impactMetrics
  }

  CandidateProject {
    string id PK
    string candidateId FK
    string projectName
    string description
    string[] techStack
    string projectType
    string role
    string githubLink
    string liveLink
    string businessImpact
  }

  CandidateEducation {
    string id PK
    string candidateId FK
    string degree
    string university
    int startYear
    int endYear
    string[] relevantCoursework
  }

  CandidateKeyword {
    string id PK
    string candidateId FK
    string keyword
    KeywordCategory category
    float weight
    string source
  }

  CandidateRole {
    string id PK
    string candidateId FK
    string roleName
    int confidenceScore
    string[] searchQueries
  }

  CandidateEmbedding {
    string id PK
    string candidateId FK
    EmbeddingEntityType entityType
    string entityLabel
    string sourceText
    float[] embedding
    string provider
    string model
    int dimensions
  }
```

## API Documentation

All endpoints return the latest generated candidate profile data.

- `GET /candidate/profile`: full candidate profile with skills, projects, experience, education,
  keywords, and roles.
- `GET /candidate/skills`: extracted skills grouped by skill records.
- `GET /candidate/projects`: extracted project records.
- `GET /candidate/experience`: extracted experience records.
- `GET /candidate/roles`: predicted target roles and search queries.
- `GET /candidate/analysis`: top strengths, competitive advantages, fit scores, and generated
  search profile.

If no profile exists yet, endpoints return:

```json
{
  "success": false,
  "error": {
    "code": "CANDIDATE_PROFILE_NOT_FOUND",
    "message": "No candidate profile has been generated yet."
  }
}
```

## Commands

Generate and store resume intelligence after placing the resume at `resume/resume.pdf`:

```bash
pnpm --filter @job-hunter/database db:migrate
pnpm --filter @job-hunter/resume-intelligence dev -- resume/resume.pdf --persist
```

Run without persistence:

```bash
pnpm --filter @job-hunter/resume-intelligence dev -- resume/resume.pdf
```

## Future Improvements

- Add OpenAI structured output extraction for richer profile parsing.
- Add OCR fallback for scanned resumes.
- Add resume versioning and diffing.
- Add human review workflows for low-confidence fields.
- Add vector database mirroring for `CandidateEmbedding` rows using Pinecone, Qdrant, or pgvector.
- Add background jobs for long-running parsing and embedding generation.
- Add field-level provenance from PDF page and text span locations.
