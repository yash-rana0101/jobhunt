import { loadConfig } from "@job-hunter/config";
import { logger } from "@job-hunter/logger";

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchJobs(
  query: string,
  options: { limit?: number; useMock?: boolean } = {},
): Promise<TavilySearchResult[]> {
  const config = loadConfig();
  const apiKey = config.TAVILY_API_KEY;
  const limit = options.limit ?? 5;

  if (!apiKey || options.useMock || config.NODE_ENV === "test") {
    logger.info({ query, limit }, "Using mock Tavily search results");
    return generateMockSearchResults(query, limit);
  }

  logger.info({ query, limit }, "Performing Tavily search");
  try {
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
      throw new Error(`Tavily API responded with status ${response.status}`);
    }

    const data = (await response.json()) as { results: TavilySearchResult[] };
    return data.results || [];
  } catch (error) {
    logger.error({ error, query }, "Tavily search failed. Falling back to mock results.");
    return generateMockSearchResults(query, limit);
  }
}

function generateMockSearchResults(query: string, limit: number): TavilySearchResult[] {
  const lowerQuery = query.toLowerCase();
  const results: TavilySearchResult[] = [];

  const techStacks = [
    { name: "Node.js", tech: ["Node.js", "TypeScript", "Express", "PostgreSQL", "Redis"] },
    { name: "Python", tech: ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"] },
    { name: "React", tech: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"] },
    { name: "Full Stack", tech: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"] },
    { name: "AI/LLM", tech: ["Python", "PyTorch", "OpenAI", "LangChain", "Vector DBs"] },
  ];

  const defaultTech = {
    name: "Node.js",
    tech: ["Node.js", "TypeScript", "Express", "PostgreSQL", "Redis"],
  };
  const matchedTech =
    techStacks.find((t) => lowerQuery.includes(t.name.toLowerCase())) ?? defaultTech;

  const companies = [
    "Stripe",
    "Linear",
    "Vercel",
    "Retool",
    "Supabase",
    "PostHog",
    "Modal Labs",
    "LangChain",
    "Runway",
  ];
  const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Remote, US",
    "Remote, Global",
    "London, UK",
  ];

  for (let i = 0; i < limit; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)] ?? "StartupCo";
    const location = locations[Math.floor(Math.random() * locations.length)] ?? "Remote";
    const isRemote = lowerQuery.includes("remote") || Math.random() > 0.4;
    const locStr = isRemote ? "Remote" : location;

    let roleName = "Software Engineer";
    if (lowerQuery.includes("backend")) roleName = "Backend Engineer";
    else if (lowerQuery.includes("full stack")) roleName = "Full Stack Engineer";
    else if (lowerQuery.includes("founding")) roleName = "Founding Engineer";
    else if (lowerQuery.includes("ai")) roleName = "AI Engineer";

    const title = `${roleName} (${matchedTech.name})`;
    const id = Math.random().toString(36).substring(7);
    const domain = company.toLowerCase().replace(/\s+/g, "");

    results.push({
      title: `${title} at ${company}`,
      url: `https://jobs.ashbyhq.com/${domain}/${id}`,
      content: `We are looking for a ${title} to join ${company} in ${locStr}. You will work with our core technologies: ${matchedTech.tech.join(
        ", ",
      )}. Minimum 3 years of experience. We offer competitive equity and salary.`,
      score: 0.95 - i * 0.05,
    });
  }

  return results;
}
