import type { Candidate, Job, CompanyContact, CandidateProject } from "@prisma/client";

/**
 * Filter and rank candidate projects based on relevance to the job description and title.
 * Focuses on AI vs DevOps vs Trading vs SaaS categorization.
 */
export function selectRelevantProjects(
  projects: CandidateProject[],
  jobTitle: string,
  jobDescription: string,
): CandidateProject[] {
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();

  let primaryCategory: "AI" | "DEVOPS" | "TRADING" | "SAAS" = "SAAS";
  if (
    /\b(ai|ml|machine learning|deep learning|nlp|llm|gpt|neural|vision|openai|claude|gemini)\b/.test(
      text,
    )
  ) {
    primaryCategory = "AI";
  } else if (
    /\b(devops|infra|kubernetes|aws|docker|ci\/cd|terraform|cloud|pipelines|reliability|sre)\b/.test(
      text,
    )
  ) {
    primaryCategory = "DEVOPS";
  } else if (
    /\b(trading|quant|finance|hft|crypto|blockchain|ledger|arbitrage|market)\b/.test(text)
  ) {
    primaryCategory = "TRADING";
  }

  return projects
    .map((project) => {
      let score = 0;
      const desc =
        `${project.projectName} ${project.description || ""} ${project.techStack.join(" ")}`.toLowerCase();

      // Match primary category keywords
      if (
        primaryCategory === "AI" &&
        /\b(ai|ml|machine learning|deep learning|nlp|llm|gpt|neural|openai|inference|training)\b/.test(
          desc,
        )
      ) {
        score += 10;
      } else if (
        primaryCategory === "DEVOPS" &&
        /\b(devops|infra|kubernetes|aws|docker|ci\/cd|terraform|cloud|ansible)\b/.test(desc)
      ) {
        score += 10;
      } else if (
        primaryCategory === "TRADING" &&
        /\b(trading|quant|finance|hft|crypto|ledger|exchange|market)\b/.test(desc)
      ) {
        score += 10;
      } else if (
        primaryCategory === "SAAS" &&
        /\b(saas|web|app|frontend|backend|api|database|react|node|typescript)\b/.test(desc)
      ) {
        score += 5;
      }

      // Check tech stack intersections
      const words = text.split(/\W+/);
      project.techStack.forEach((tech) => {
        if (words.includes(tech.toLowerCase())) {
          score += 2;
        }
      });

      return { project, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0 || primaryCategory === "SAAS")
    .map((item) => item.project)
    .slice(0, 3);
}

/**
 * Filter candidate strengths that align best with the job context.
 */
export function selectRelevantStrengths(
  strengths: string[],
  jobTitle: string,
  jobDescription: string,
): string[] {
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();
  return strengths
    .map((strength) => {
      let score = 0;
      const words = strength.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 2 && text.includes(word)) {
          score += 3;
        }
      });
      return { strength, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.strength)
    .slice(0, 4);
}

/**
 * Returns the system prompt instructing the model to generate the outreach response.
 */
export function buildOutreachSystemPrompt(): string {
  return `You are an expert recruiter and career agent specializing in drafting highly personalized, high-converting outreach messages.
You write professional, direct, non-generic outreach messages that highlight the candidate's achievements and alignment with the role.

Your response must be a single, valid JSON object matching this schema:
{
  "subjectLines": ["Subject Option 1", "Subject Option 2", "Subject Option 3"],
  "body": "The main outreach message (email body or DM body). Do not use placeholders like [Your Name] or [Company Name]. Replace them with the actual candidate and target info.",
  "day3FollowUp": "Optional follow up message for day 3.",
  "day7FollowUp": "Optional follow up message for day 7.",
  "day14FollowUp": "Optional follow up message for day 14.",
  "scores": {
    "qualityScore": 0-100 score,
    "personalizationScore": 0-100 score,
    "relevanceScore": 0-100 score,
    "spamRiskScore": 0-100 score,
    "professionalismScore": 0-100 score,
    "clarityScore": 0-100 score
  },
  "recommendation": {
    "bestContactMessage": "A short advice note about why to reach this person.",
    "bestOutreachType": "The type of outreach best suited, e.g., 'HIRING_MANAGER_EMAIL', 'LINKEDIN_DM', etc.",
    "expectedResponseProbability": 0.0 to 1.0 expected probability of response,
    "outreachRecommendationReason": "A brief explanation for the channel and strategy selection."
  }
}`;
}

/**
 * Builds the user prompt integrating Candidate, Job, and Contact details.
 */
export function buildOutreachUserPrompt(
  candidate: Candidate & {
    skills: { skillName: string; confidenceScore: number }[];
    experiences: { company: string; role: string; achievements: string[] }[];
    projects: CandidateProject[];
  },
  job: Job,
  contact: CompanyContact | null,
  outreachType: string,
): string {
  const relevantProjects = selectRelevantProjects(candidate.projects, job.title, job.description);
  const relevantStrengths = selectRelevantStrengths(
    candidate.topStrengths,
    job.title,
    job.description,
  );

  const contactSection = contact
    ? `Target Contact:
Name: ${contact.fullName}
Job Title: ${contact.jobTitle}
Category: ${contact.category}
Linkedin URL: ${contact.linkedinUrl || "N/A"}`
    : "Target Contact: General/Recruiting Inbox (no specific individual identified).";

  const skillsText = candidate.skills.map((s) => s.skillName).join(", ");
  const strengthsText = relevantStrengths.join(", ");

  const projectsText = relevantProjects
    .map((p) => `- ${p.projectName}: ${p.description || ""} (Tech: ${p.techStack.join(", ")})`)
    .join("\n");

  const experienceText = candidate.experiences
    .map((e) => `- ${e.role} at ${e.company}: ${e.achievements.slice(0, 2).join("; ")}`)
    .join("\n");

  return `Draft a personalized outreach message of type: ${outreachType}.

${contactSection}

Target Opportunity:
Company: ${job.company}
Job Title: ${job.title}
Job Description Summary: ${job.description.slice(0, 1000)}

Candidate Profile:
Name: ${candidate.fullName}
Email: ${candidate.email || ""}
Location: ${candidate.location || ""}
Summary: ${candidate.summary || ""}
Skills: ${skillsText}
Relevant Strengths: ${strengthsText}
Relevant Projects:
${projectsText || "None specified."}
Recent Experience:
${experienceText || "None specified."}

Requirements for drafting:
1. Replace all placeholders. Do not use "[Candidate Name]" or "[Hiring Manager]". Use "${candidate.fullName}" and "${contact ? contact.fullName.split(" ")[0] : "hiring team"}".
2. Tailor the tone of the message to the outreach type and contact category.
3. Make it brief, impactful, and focus on mutual interest.
4. Ensure the body does not exceed 300 words.`;
}
