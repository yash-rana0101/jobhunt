import { OpenAI } from "openai";
import { loadConfig } from "@job-hunter/config";
import { logger } from "@job-hunter/logger";
import type { LlmProvider } from "./provider.js";
import type { ProviderResponse } from "../types/index.js";

export class OpenAiProvider implements LlmProvider {
  private client: OpenAI | null = null;

  constructor() {
    const config = loadConfig();
    const apiKey = config.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  public async generateOutreach(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ProviderResponse> {
    if (!this.client) {
      logger.error("OpenAI API Key is missing");
      throw new Error("OpenAI API Key is not configured. Please set OPENAI_API_KEY.");
    }

    logger.info("Executing OpenAI chat completion for outreach draft");
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const text = response.choices[0]?.message.content;
    if (!text) {
      throw new Error("OpenAI returned an empty response");
    }

    try {
      const parsed = JSON.parse(text) as ProviderResponse;
      return parsed;
    } catch (err: unknown) {
      logger.error({ err, text }, "Failed to parse OpenAI JSON response");
      throw new Error(
        `OpenAI output was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
