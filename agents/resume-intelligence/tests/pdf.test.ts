import { Buffer } from "node:buffer";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(() => Promise.resolve(Buffer.from("mock-pdf"))),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    destroy(): Promise<void> {
      return Promise.resolve();
    }

    getText(): Promise<{ text: string }> {
      return Promise.resolve({ text: "Yash Rana\n\nTypeScript   Node.js" });
    }
  },
}));

describe("extractResumeTextFromPdf", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("extracts and normalizes PDF text", async () => {
    const { extractResumeTextFromPdf } = await import("../src/pdf.js");
    const text = await extractResumeTextFromPdf("resume/resume.pdf");

    expect(text).toBe("Yash Rana\n\nTypeScript Node.js");
  });
});
