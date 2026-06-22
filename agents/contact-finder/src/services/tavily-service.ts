import { loadConfig } from "@job-hunter/config";
import { logger } from "@job-hunter/logger";
import type { DiscoveredContact, CompanyIntelligence } from "../types/index.js";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchTavily(query: string, limit = 10): Promise<TavilySearchResult[]> {
  const config = loadConfig();
  const apiKey = config.TAVILY_API_KEY;

  if (!apiKey) {
    logger.error("Tavily API key is missing from environment config");
    throw new Error("Tavily API key is missing. Cannot run contact discovery.");
  }

  logger.info({ query, limit }, "Searching Tavily API");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      include_answer: false,
      max_results: limit,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    logger.error({ status: response.status, errorBody }, "Tavily API error response");
    throw new Error(`Tavily API responded with status ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as { results?: TavilySearchResult[] };
  return data.results || [];
}

export function parseLinkedInSearchResult(
  result: TavilySearchResult,
  companyName: string,
): DiscoveredContact | null {
  const { title, url, content } = result;

  // Ensure it's a LinkedIn profile URL
  if (!url.toLowerCase().includes("linkedin.com/in/")) {
    return null;
  }

  // Parse title: typically "Name - Job Title - Company | LinkedIn" or "Name | LinkedIn"
  const titleParts = title
    .split(/[-|:|•]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.toLowerCase().includes("linkedin"));

  if (titleParts.length === 0) {
    return null;
  }

  const fullName = titleParts[0] || "";
  // Check if Name is a common junk string or is too short
  if (fullName.split(/\s+/).length < 2 || fullName.length > 50) {
    return null;
  }

  // Attempt to parse job title
  let jobTitle = titleParts[1] || "";

  // If title was simple e.g. "John Doe | LinkedIn", search snippet for job title
  if (!jobTitle && content) {
    const titleMatch = content.match(/at\s+([A-Za-z0-9\s,&]+)\s+as\s+([A-Za-z0-9\s,&]+)/i);
    if (titleMatch && titleMatch[2]) {
      jobTitle = titleMatch[2].trim();
    }
  }

  if (!jobTitle) {
    // Default fallback if we can't extract title, search snippet
    const sentences = content.split(/[.!?]/);
    for (const sentence of sentences) {
      if (
        sentence.toLowerCase().includes("engineer") ||
        sentence.toLowerCase().includes("manager") ||
        sentence.toLowerCase().includes("recruiter") ||
        sentence.toLowerCase().includes("founder") ||
        sentence.toLowerCase().includes("lead")
      ) {
        jobTitle = sentence.trim();
        break;
      }
    }
  }

  // Final scrub of job title
  jobTitle = jobTitle || "Employee";

  // Classify seniority based on title keywords
  let seniority = "MID";
  const titleLower = jobTitle.toLowerCase();
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
    titleLower.includes("ceo") ||
    titleLower.includes("co-founder")
  )
    seniority = "FOUNDER";
  else if (
    titleLower.includes("junior") ||
    titleLower.includes("jr.") ||
    titleLower.includes("intern") ||
    titleLower.includes("associate")
  )
    seniority = "JUNIOR";

  // Classify Contact Category based on title
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

  return {
    fullName,
    jobTitle,
    linkedinUrl: url,
    companyName,
    source: "TAVILY",
    confidenceScore: 0, // Filled in by confidence engine
    contactPriority: 0, // Filled in by ranking engine
    category,
    seniority,
  };
}

export async function discoverCompanyInfo(companyName: string): Promise<CompanyIntelligence> {
  const query = `"${companyName}" headquarters funding stage industry careers website linkedin description`;
  const results = await searchTavily(query, 5);

  const intelligence: CompanyIntelligence = { companyName };

  // Parse details from content snippets
  for (const res of results) {
    const text = res.content.toLowerCase();

    // Website lookup
    if (
      res.url.includes(companyName.toLowerCase().replace(/\s/g, "")) &&
      !res.url.includes("linkedin.com") &&
      !intelligence.website
    ) {
      intelligence.website = res.url;
    }
    // LinkedIn URL
    if (res.url.includes("linkedin.com/company/") && !intelligence.linkedinUrl) {
      intelligence.linkedinUrl = res.url;
    }
    // Careers page URL
    if (
      (res.url.includes("careers") ||
        res.url.includes("jobs") ||
        res.url.includes("lever.co") ||
        res.url.includes("greenhouse.io")) &&
      !intelligence.careersUrl
    ) {
      intelligence.careersUrl = res.url;
    }

    // Try to extract funding stage
    if (!intelligence.fundingStage) {
      if (text.includes("series a")) intelligence.fundingStage = "Series A";
      else if (text.includes("series b")) intelligence.fundingStage = "Series B";
      else if (text.includes("series c")) intelligence.fundingStage = "Series C";
      else if (text.includes("series d")) intelligence.fundingStage = "Series D";
      else if (text.includes("seed")) intelligence.fundingStage = "Seed";
      else if (text.includes("ipo") || text.includes("publicly traded"))
        intelligence.fundingStage = "Public";
      else if (text.includes("bootstrapped")) intelligence.fundingStage = "Bootstrapped";
    }

    // Try to extract company size / headcount
    if (!intelligence.companySize) {
      const sizeMatch = res.content.match(
        /(\d{1,3}(?:,\d{3})*|\d+)\s*-\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:employees|people|workers)/i,
      );
      if (sizeMatch && sizeMatch[0]) {
        intelligence.companySize = sizeMatch[0].trim();
      }
    }

    // Default description if not set
    if (!intelligence.description && res.content.length > 50) {
      intelligence.description = res.content;
    }
  }

  return intelligence;
}
