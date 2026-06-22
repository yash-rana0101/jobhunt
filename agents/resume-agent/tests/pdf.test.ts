import { describe, it, expect } from "vitest";
import { generatePdfFromMarkdown } from "../src/services/pdf-service.js";

describe("PDF Generation Service", () => {
  it("should output a valid PDF buffer from a markdown text input", async () => {
    const markdown = `# Yash Rana\nEmail: yash@example.com\n\n## Experience\n### Staff Engineer\n- Led development of job hunting automation platform.\n- Reduced processing time by 40%.\n\n## Education\n- B.S. in Computer Science`;

    const buffer = await generatePdfFromMarkdown(markdown);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // Standard PDF signature check
    const pdfSignature = buffer.toString("utf8", 0, 4);
    expect(pdfSignature).toBe("%PDF");
  });
});
