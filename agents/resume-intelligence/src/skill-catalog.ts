import type { SkillCategoryName } from "./types.js";

export type SkillDefinition = {
  name: string;
  category: SkillCategoryName;
  aliases?: string[];
};

export const skillCatalog: readonly SkillDefinition[] = [
  { name: "JavaScript", category: "PROGRAMMING_LANGUAGES", aliases: ["JS"] },
  { name: "TypeScript", category: "PROGRAMMING_LANGUAGES", aliases: ["TS"] },
  { name: "Python", category: "PROGRAMMING_LANGUAGES" },
  { name: "Java", category: "PROGRAMMING_LANGUAGES" },
  { name: "Go", category: "PROGRAMMING_LANGUAGES", aliases: ["Golang"] },
  { name: "Node.js", category: "BACKEND", aliases: ["Node", "NodeJS"] },
  { name: "Express", category: "BACKEND" },
  { name: "Fastify", category: "BACKEND" },
  { name: "NestJS", category: "BACKEND" },
  { name: "REST APIs", category: "BACKEND", aliases: ["REST API", "REST"] },
  { name: "GraphQL", category: "BACKEND" },
  { name: "Microservices", category: "ARCHITECTURE" },
  { name: "System Design", category: "ARCHITECTURE" },
  { name: "Distributed Systems", category: "ARCHITECTURE" },
  { name: "React", category: "FRONTEND" },
  { name: "Next.js", category: "FRONTEND", aliases: ["NextJS", "Next"] },
  { name: "Tailwind CSS", category: "FRONTEND", aliases: ["Tailwind"] },
  { name: "HTML", category: "FRONTEND" },
  { name: "CSS", category: "FRONTEND" },
  { name: "PostgreSQL", category: "DATABASES", aliases: ["Postgres"] },
  { name: "MySQL", category: "DATABASES" },
  { name: "MongoDB", category: "DATABASES" },
  { name: "Redis", category: "DATABASES" },
  { name: "Prisma", category: "DATABASES" },
  { name: "AWS", category: "CLOUD", aliases: ["Amazon Web Services"] },
  { name: "GCP", category: "CLOUD", aliases: ["Google Cloud"] },
  { name: "Azure", category: "CLOUD" },
  { name: "Docker", category: "DEVOPS" },
  { name: "Kubernetes", category: "DEVOPS", aliases: ["K8s"] },
  { name: "CI/CD", category: "DEVOPS", aliases: ["CI", "CD"] },
  { name: "GitHub Actions", category: "DEVOPS" },
  { name: "OpenAI", category: "AI" },
  { name: "LLMs", category: "AI", aliases: ["Large Language Models", "GPT"] },
  { name: "LangChain", category: "AI" },
  { name: "Vector Databases", category: "AI", aliases: ["Vector DB", "Embeddings"] },
  { name: "ETL", category: "DATA_ENGINEERING" },
  { name: "Kafka", category: "DATA_ENGINEERING" },
  { name: "Airflow", category: "DATA_ENGINEERING" },
  { name: "Jest", category: "TESTING" },
  { name: "Vitest", category: "TESTING" },
  { name: "Playwright", category: "TESTING" },
  { name: "Cypress", category: "TESTING" },
  { name: "Git", category: "TOOLS" },
  { name: "Linux", category: "TOOLS" },
  { name: "Jira", category: "TOOLS" },
];

export function skillSearchTerms(definition: SkillDefinition): string[] {
  return [definition.name, ...(definition.aliases ?? [])];
}
