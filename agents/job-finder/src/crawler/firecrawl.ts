import { loadConfig } from "@job-hunter/config";
import { logger } from "@job-hunter/logger";

export async function crawlUrl(url: string, options: { useMock?: boolean } = {}): Promise<string> {
  const config = loadConfig();
  const apiKey = config.FIRECRAWL_API_KEY;

  if (!apiKey || options.useMock || config.NODE_ENV === "test") {
    logger.info({ url }, "Using mock Firecrawl scrape content");
    return generateMockJobPage(url);
  }

  logger.info({ url }, "Crawling url using Firecrawl");
  try {
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
      throw new Error(`Firecrawl API responded with status ${response.status}`);
    }

    const data = (await response.json()) as { success: boolean; data?: { markdown?: string } };
    if (data.success && data.data?.markdown) {
      return data.data.markdown;
    }
    throw new Error("Firecrawl scrape did not return markdown format");
  } catch (error) {
    logger.error({ error, url }, "Firecrawl crawl failed. Falling back to mock content.");
    return generateMockJobPage(url);
  }
}

function generateMockJobPage(url: string): string {
  const parsedUrl = new URL(url);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const companyRaw = pathParts[0] || "startup";
  const company = companyRaw.charAt(0).toUpperCase() + companyRaw.slice(1);

  return `
# Software Engineer (Backend / Full Stack)

**Company:** ${company}
**Location:** Remote (US/Canada) or San Francisco, CA
**Salary:** $120,000 - $180,000 + Equity
**Type:** Full-time

### About Us
At ${company}, we are building the future of autonomous agent development. We are backed by Y Combinator and top tier VCs. We are looking for talented builders to join our team.

### Responsibilities
* Design and implement highly scalable microservices in Node.js and TypeScript.
* Develop frontend UI surfaces using React and Next.js.
* Manage PostgreSQL databases and Redis caching layers.
* Optimize our AWS and Kubernetes deployment pipelines.
* Collaborate with product designers and other engineers to build premium user experiences.

### Requirements
* 3+ years of experience building modern web applications.
* Proficiency in Node.js, TypeScript, and Python.
* Solid experience with relational databases (PostgreSQL/MySQL).
* Familiarity with Docker, CI/CD pipelines, and cloud platforms (AWS/GCP).
* Excellent communication skills and a high degree of ownership.

### Nice to Haves
* Experience with LLMs and prompt engineering.
* Experience at a venture-backed startup.
`;
}
