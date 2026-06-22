const sectionHeadings = [
  "summary",
  "profile",
  "experience",
  "work experience",
  "professional experience",
  "projects",
  "technical projects",
  "education",
  "skills",
  "technical skills",
  "certifications",
] as const;

export function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function lines(value: string): string[] {
  return normalizeWhitespace(value)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function stripBullet(value: string): string {
  return value.replace(/^[-*\u2022]\s*/, "").trim();
}

export function extractSection(text: string, headings: readonly string[]): string {
  const allLines = lines(text);
  const lowerHeadings = headings.map((heading) => heading.toLowerCase());
  const startIndex = allLines.findIndex((line) => lowerHeadings.includes(cleanHeading(line)));

  if (startIndex < 0) {
    return "";
  }

  const sectionLines: string[] = [];

  for (const line of allLines.slice(startIndex + 1)) {
    const normalized = cleanHeading(line);

    if (sectionHeadings.includes(normalized as (typeof sectionHeadings)[number])) {
      break;
    }

    sectionLines.push(line);
  }

  return sectionLines.join("\n").trim();
}

export function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();

    if (normalized.length > 0 && !seen.has(key)) {
      seen.add(key);
      results.push(normalized);
    }
  }

  return results;
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function includesTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i").test(text);
}

function cleanHeading(value: string): string {
  return value.replace(/[:|]/g, "").trim().toLowerCase();
}
