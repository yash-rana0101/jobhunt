import { OpenAI } from "openai";
import { loadConfig } from "@job-hunter/config";
import { logger } from "@job-hunter/logger";
import type { LlmProvider } from "./provider.js";
import type { LlmOptimizationResult } from "../types/index.js";
import { RESUME_OPTIMIZATION_SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";

export class OpenAiProvider implements LlmProvider {
  private client: OpenAI | null = null;

  constructor() {
    const config = loadConfig();
    const apiKey = config.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      logger.warn("OpenAI API Key is missing in resume-agent config");
    }
  }

  public async optimizeResume(
    candidateProfile: string,
    jobDescription: string,
    variant: string,
    rules: string[],
  ): Promise<LlmOptimizationResult> {
    if (!this.client) {
      logger.error("OpenAI client not configured");
      throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY.");
    }

    const userPrompt = buildUserPrompt(candidateProfile, jobDescription, variant, rules);

    logger.info({ variant }, "Executing OpenAI chat completion for resume optimization");

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: RESUME_OPTIMIZATION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more factual, conservative modifications
    });

    const text = response.choices[0]?.message.content;
    if (!text) {
      throw new Error("OpenAI returned empty response for resume tailoring");
    }

    try {
      const parsed = JSON.parse(text) as LlmOptimizationResult;
      return parsed;
    } catch (err: unknown) {
      logger.error({ err, text }, "Failed to parse resume optimization JSON response");
      throw new Error(
        `OpenAI resume output was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
