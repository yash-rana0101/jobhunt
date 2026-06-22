import OpenAI from "openai";

import type {
  CandidateEmbeddingInput,
  ExtractedExperience,
  ExtractedProject,
  ExtractedSkill,
} from "./types.js";

type EmbeddingProvider = {
  provider: string;
  model: string;
  dimensions: number;
  embed(text: string): Promise<number[]>;
};

export function createEmbeddingProvider(openAiApiKey?: string): EmbeddingProvider {
  if (openAiApiKey) {
    const client = new OpenAI({ apiKey: openAiApiKey });

    return {
      provider: "openai",
      model: "text-embedding-3-small",
      dimensions: 1536,
      async embed(text: string): Promise<number[]> {
        const response = await client.embeddings.create({
          model: "text-embedding-3-small",
          input: text.slice(0, 24000),
        });
        const vector = response.data[0]?.embedding;

        if (!vector) {
          throw new Error("OpenAI embedding response did not include a vector.");
        }

        return vector;
      },
    };
  }

  return {
    provider: "deterministic-local",
    model: "hash-bow-v1",
    dimensions: 64,
    embed(text: string): Promise<number[]> {
      return Promise.resolve(hashTextToEmbedding(text, 64));
    },
  };
}

export async function generateCandidateEmbeddings(input: {
  resumeText: string;
  skills: readonly ExtractedSkill[];
  experiences: readonly ExtractedExperience[];
  projects: readonly ExtractedProject[];
  openAiApiKey?: string;
}): Promise<CandidateEmbeddingInput[]> {
  const provider = createEmbeddingProvider(input.openAiApiKey);
  const embeddingInputs = [
    { entityType: "RESUME" as const, entityLabel: "Entire Resume", sourceText: input.resumeText },
    ...input.experiences.map((experience) => ({
      entityType: "EXPERIENCE" as const,
      entityLabel: `${experience.role} at ${experience.company}`,
      sourceText: [
        experience.role,
        experience.company,
        ...experience.responsibilities,
        ...experience.achievements,
      ].join("\n"),
    })),
    ...input.projects.map((project) => ({
      entityType: "PROJECT" as const,
      entityLabel: project.projectName,
      sourceText: [
        project.projectName,
        project.description,
        project.businessImpact,
        ...project.techStack,
      ]
        .filter(Boolean)
        .join("\n"),
    })),
    ...input.skills.map((skill) => ({
      entityType: "SKILL" as const,
      entityLabel: skill.skillName,
      sourceText: `${skill.skillName} ${skill.category}`,
    })),
  ];

  const embeddings: CandidateEmbeddingInput[] = [];

  for (const inputItem of embeddingInputs) {
    const embedding = await provider.embed(inputItem.sourceText);

    embeddings.push({
      ...inputItem,
      embedding,
      provider: provider.provider,
      model: provider.model,
      dimensions: provider.dimensions,
    });
  }

  return embeddings;
}

function hashTextToEmbedding(text: string, dimensions: number): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = text.toLowerCase().match(/[a-z0-9.+#-]+/g) ?? [];

  for (const token of tokens) {
    const index = Math.abs(hashString(token)) % dimensions;
    vector[index] = (vector[index] ?? 0) + 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;

  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
