/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderTemplate, resolveTemplateVariables } from "../src/services/template-engine.js";
import { prisma } from "@job-hunter/database";

vi.mock("@job-hunter/database", () => ({
  prisma: {
    application: {
      findUnique: vi.fn(),
    },
    companyContact: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Template Engine Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should replace placeholders in both subject and body", () => {
    const subjectTpl = "Hello {{ contactName }}, position at {{ companyName }}";
    const bodyTpl =
      "Hi {{ contactName }},\nThank you for considering {{ candidateName }} for {{ jobTitle }}.";
    const variables = {
      contactName: "John Doe",
      companyName: "Google",
      candidateName: "Yash Rana",
      jobTitle: "Software Engineer",
    };

    const rendered = renderTemplate(subjectTpl, bodyTpl, variables);
    expect(rendered.subject).toBe("Hello John Doe, position at Google");
    expect(rendered.body).toBe(
      "Hi John Doe,\nThank you for considering Yash Rana for Software Engineer.",
    );
  });

  it("should resolve context variables from DB records", async () => {
    const mockApp = {
      id: "app-123",
      contactId: "contact-456",
      companyId: "company-789",
      candidateId: "candidate-111",
      company: { companyName: "Stripe" },
      job: {
        title: "Staff Engineer",
        company: "Stripe",
        match: { matchScore: 92.5 },
      },
      candidate: {
        fullName: "Yash Rana",
        skills: [{ skillName: "Node.js" }],
        projects: [{ projectName: "ATS Engine" }],
      },
    };

    const mockContact = {
      id: "contact-456",
      fullName: "Jane Recruiter",
    };

    vi.mocked(prisma.application.findUnique).mockResolvedValue(mockApp as any);
    vi.mocked(prisma.companyContact.findUnique).mockResolvedValue(mockContact as any);

    const variables = await resolveTemplateVariables("app-123", undefined, { extraVar: "custom" });

    expect(variables.candidateName).toBe("Yash Rana");
    expect(variables.contactName).toBe("Jane Recruiter");
    expect(variables.companyName).toBe("Stripe");
    expect(variables.jobTitle).toBe("Staff Engineer");
    expect(variables.relevantSkill).toBe("Node.js");
    expect(variables.relevantProject).toBe("ATS Engine");
    expect(variables.matchScore).toBe("93%");
    expect(variables.extraVar).toBe("custom");

    expect(prisma.application.findUnique).toHaveBeenCalledWith({
      where: { id: "app-123" },
      include: expect.any(Object),
    });
    expect(prisma.companyContact.findUnique).toHaveBeenCalledWith({
      where: { id: "contact-456" },
    });
  });
});
