import { loadConfig } from "@job-hunter/config";
import { logger } from "@job-hunter/logger";
import type { DiscoveredContact } from "../types/index.js";

export async function scrapeUrlWithFirecrawl(url: string): Promise<string> {
  const config = loadConfig();
  const apiKey = config.FIRECRAWL_API_KEY;

  if (!apiKey) {
    logger.error("Firecrawl API key is missing from environment config");
    throw new Error("Firecrawl API key is missing. Cannot scrape team pages.");
  }

  logger.info({ url }, "Scraping URL with Firecrawl");
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    logger.error({ status: response.status, errorBody }, "Firecrawl API error response");
    throw new Error(`Firecrawl API responded with status ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as { success: boolean; data?: { markdown?: string } };
  if (data.success && data.data?.markdown) {
    return data.data.markdown;
  }
  throw new Error("Firecrawl scrape did not return markdown format");
}

export function parseContactsFromMarkdown(
  markdown: string,
  companyName: string,
): DiscoveredContact[] {
  const contacts: DiscoveredContact[] = [];

  // Match markdown links that look like LinkedIn profiles
  // e.g. [LinkedIn](https://linkedin.com/in/john-doe) or just the URL
  const linkedinRegex =
    /\[([^\]]+)\]\((https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s)]+)\)|(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s)]+)/gi;
  let match;

  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  while ((match = linkedinRegex.exec(markdown)) !== null) {
    const url = match[2] || match[3];
    if (!url) continue;

    // Scan nearby lines in the markdown to find a name and job title
    // Let's locate the line index that contains this URL
    const lineIndex = lines.findIndex((l) => l.includes(url));
    if (lineIndex === -1) continue;

    let fullName = "";
    let jobTitle = "";

    // Search 3 lines above and 1 line below the link for name/title
    const startScan = Math.max(0, lineIndex - 3);
    const endScan = Math.min(lines.length - 1, lineIndex + 1);

    for (let i = startScan; i <= endScan; i++) {
      const line = lines[i] || "";

      // Clean line from markdown formatting e.g. *, #, [, ]
      const cleanLine = line.replace(/[*#[\]()]/g, "").trim();

      // Skip lines that are just urls or labels
      if (cleanLine.toLowerCase().includes("http") || cleanLine.toLowerCase() === "linkedin") {
        continue;
      }

      // Check if it looks like a name (e.g. 2-3 words capitalized)
      const words = cleanLine.split(/\s+/);
      const isCapName =
        words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z]/.test(w));

      if (isCapName && !fullName) {
        fullName = cleanLine;
      } else if (
        (cleanLine.toLowerCase().includes("engineer") ||
          cleanLine.toLowerCase().includes("manager") ||
          cleanLine.toLowerCase().includes("recruiter") ||
          cleanLine.toLowerCase().includes("founder") ||
          cleanLine.toLowerCase().includes("lead") ||
          cleanLine.toLowerCase().includes("director") ||
          cleanLine.toLowerCase().includes("officer") ||
          cleanLine.toLowerCase().includes("cto") ||
          cleanLine.toLowerCase().includes("ceo") ||
          cleanLine.toLowerCase().includes("vp")) &&
        !jobTitle
      ) {
        jobTitle = cleanLine;
      }
    }

    // Try to extract name from URL slug if name not found in text
    if (!fullName) {
      const slugParts = url.split("/in/")[1]?.split("/")[0]?.split("-");
      if (slugParts && slugParts.length >= 2) {
        fullName = slugParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      }
    }

    if (fullName) {
      jobTitle = jobTitle || "Employee";

      const titleLower = jobTitle.toLowerCase();
      let seniority = "MID";
      if (titleLower.includes("senior") || titleLower.includes("sr.")) seniority = "SENIOR";
      else if (titleLower.includes("lead") || titleLower.includes("principal")) seniority = "LEAD";
      else if (
        titleLower.includes("manager") ||
        titleLower.includes("director") ||
        titleLower.includes("head")
      )
        seniority = "EXECUTIVE";
      else if (
        titleLower.includes("founder") ||
        titleLower.includes("c-") ||
        titleLower.includes("cto") ||
        titleLower.includes("ceo")
      )
        seniority = "FOUNDER";

      let category: DiscoveredContact["category"] = "OTHER";
      if (titleLower.includes("hiring manager")) category = "HIRING_MANAGER";
      else if (titleLower.includes("engineering manager") || titleLower.includes("em"))
        category = "ENGINEERING_MANAGER";
      else if (titleLower.includes("team lead") || titleLower.includes("tech lead"))
        category = "TEAM_LEAD";
      else if (
        titleLower.includes("recruiter") ||
        titleLower.includes("talent acquisition") ||
        titleLower.includes("hr")
      )
        category = "RECRUITER";
      else if (titleLower.includes("cto") || titleLower.includes("chief technology officer"))
        category = "CTO";
      else if (
        titleLower.includes("founder") ||
        titleLower.includes("ceo") ||
        titleLower.includes("chief executive")
      )
        category = "FOUNDER";
      else if (
        titleLower.includes("engineer") ||
        titleLower.includes("developer") ||
        titleLower.includes("programmer") ||
        titleLower.includes("architect")
      )
        category = "ENGINEER";

      contacts.push({
        fullName,
        jobTitle,
        linkedinUrl: url,
        companyName,
        source: "FIRECRAWL",
        confidenceScore: 0,
        contactPriority: 0,
        category,
        seniority,
      });
    }
  }

  // Deduplicate found contacts within this single crawl
  const seenUrls = new Set<string>();
  return contacts.filter((c) => {
    if (!c.linkedinUrl) return true;
    if (seenUrls.has(c.linkedinUrl)) return false;
    seenUrls.add(c.linkedinUrl);
    return true;
  });
}
