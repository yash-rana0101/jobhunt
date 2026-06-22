import { readFile } from "node:fs/promises";

import { PDFParse } from "pdf-parse";

import { normalizeWhitespace } from "./text-utils.js";

export async function extractResumeTextFromPdf(resumePath: string): Promise<string> {
  const pdfBuffer = await readFile(resumePath);
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const parsed = await parser.getText();
    return normalizeWhitespace(parsed.text);
  } finally {
    await parser.destroy();
  }
}
