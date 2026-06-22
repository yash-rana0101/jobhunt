import { crawlUrl } from "../crawler/firecrawl.js";
import { searchJobs } from "../crawler/tavily.js";
import type { ParsedJob, SearchOptions, UnnormalizedJob } from "../types.js";
import {
  classifyRemote,
  classifyExperience,
  extractTechnologies,
} from "../engine/classification.js";

export abstract class JobSourceAdapter {
  abstract readonly sourceName: string;
  abstract readonly baseUrl?: string;

  async discover(query: string, options: SearchOptions = {}): Promise<UnnormalizedJob[]> {
    // If baseUrl is present, scope the search to the site
    const fullQuery = this.baseUrl ? `site:${this.baseUrl} ${query}` : query;
    const searchResults = await searchJobs(fullQuery, options);

    return searchResults.map((result) => {
      // Parse out company and title if in "Title at Company" format
      let title = result.title;
      let company = "Unknown Company";

      if (result.title.includes(" at ")) {
        const parts = result.title.split(" at ");
        title = parts[0] ?? title;
        company = parts[1] ?? company;
      }

      return {
        sourceJobId: Buffer.from(result.url).toString("base64").substring(0, 16),
        source: this.sourceName,
        title,
        company,
        description: result.content,
        applicationUrl: result.url,
        companyUrl: this.baseUrl,
        postedDate: new Date(),
      };
    });
  }

  async crawl(url: string): Promise<string> {
    return crawlUrl(url);
  }

  async parse(markdownContent: string, unnormalized: UnnormalizedJob): Promise<ParsedJob> {
    await Promise.resolve();
    // Generic parser combining search result meta + content heuristics
    const desc = markdownContent || unnormalized.description;
    const title = unnormalized.title;
    const company = unnormalized.company;
    const location = unnormalized.location || this.extractLocationHeuristic(desc) || "Remote";

    const remoteStatus = classifyRemote(title, desc, location);
    const experienceClassification = classifyExperience(desc, title);
    const technologies = extractTechnologies(desc);
    const { min, max } = this.extractSalaryHeuristic(desc);

    return {
      title,
      company,
      description: desc,
      applicationUrl: unnormalized.applicationUrl,
      companyUrl: unnormalized.companyUrl,
      location,
      employmentType: unnormalized.employmentType || "Full-time",
      experienceRequired: unnormalized.experienceRequired || "3+ years",
      salaryMin: unnormalized.salaryMin ?? min,
      salaryMax: unnormalized.salaryMax ?? max,
      remoteStatus,
      postedDate: unnormalized.postedDate || new Date(),
      technologies,
      experienceClassification,
      rawLocation: location,
    };
  }

  protected extractLocationHeuristic(text: string): string | null {
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.toLowerCase().includes("location:") || line.toLowerCase().includes("location**")) {
        const clean = line
          .replace(/[*#]/g, "")
          .replace(/location:/i, "")
          .trim();
        if (clean) return clean;
      }
    }
    return null;
  }

  protected extractSalaryHeuristic(text: string): { min?: number; max?: number } {
    // Regex for $120,000 - $180,000 or $120k - $180k
    const salaryRegex = /\$(\d{2,3}),?(\d{3})?\s*-\s*\$(\d{2,3}),?(\d{3})?/g;
    const match = salaryRegex.exec(text);
    if (match) {
      const minVal = parseInt(match[1]!) * (match[2] ? 1 : 1000);
      const maxVal = parseInt(match[3]!) * (match[4] ? 1 : 1000);
      return { min: minVal, max: maxVal };
    }

    const kRegex = /\$(\d{2,3})k\s*-\s*\$(\d{2,3})k/i;
    const matchK = kRegex.exec(text);
    if (matchK) {
      return { min: parseInt(matchK[1]!) * 1000, max: parseInt(matchK[2]!) * 1000 };
    }

    return {};
  }
}
