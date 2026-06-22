import { prisma } from "@job-hunter/database";

/**
 * Resolves context variables from Application, Candidate, and Contact records.
 */
export async function resolveTemplateVariables(
  applicationId: string,
  contactId?: string,
  customVars?: Record<string, string>,
): Promise<Record<string, string>> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          match: true,
        },
      },
      company: true,
      candidate: {
        include: {
          skills: { take: 1 },
          projects: { take: 1 },
        },
      },
      contact: true,
    },
  });

  if (!application) {
    throw new Error(`Application with ID ${applicationId} not found`);
  }

  const candidate = application.candidate;
  const job = application.job;

  // Use contact on application or fallback to contactId parameter
  const targetContactId = application.contactId || contactId;
  const contact = targetContactId
    ? await prisma.companyContact.findUnique({ where: { id: targetContactId } })
    : null;

  const variables: Record<string, string> = {
    candidateName: candidate.fullName,
    contactName: contact?.fullName || "Hiring Manager",
    companyName: application.company?.companyName || job.company,
    jobTitle: job.title,
    relevantProject: candidate.projects[0]?.projectName || "Job Hunter Agent System",
    relevantSkill: candidate.skills[0]?.skillName || "TypeScript & Node.js",
    matchScore: job.match?.matchScore ? `${Math.round(job.match.matchScore)}%` : "High Match",
    ...customVars,
  };

  return variables;
}

/**
 * Renders subject and body templates replacing {{variable}} placeholders with values.
 */
export function renderTemplate(
  subjectTemplate: string,
  bodyTemplate: string,
  variables: Record<string, string>,
): { subject: string; body: string } {
  let subject = subjectTemplate;
  let body = bodyTemplate;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    subject = subject.replace(placeholder, value);
    body = body.replace(placeholder, value);
  }

  return { subject, body };
}
