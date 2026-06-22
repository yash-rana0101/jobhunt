import { logger } from "@job-hunter/logger";
import type { LlmProvider } from "./provider.js";
import type { ProviderResponse } from "../types/index.js";

export class AnthropicProvider implements LlmProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  public async generateOutreach(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ProviderResponse> {
    if (!this.apiKey) {
      logger.error("Anthropic API Key is missing");
      throw new Error("Anthropic API Key is not configured. Please set ANTHROPIC_API_KEY.");
    }

    logger.info("Executing Anthropic Claude Messages request for outreach draft");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system:
          systemPrompt +
          " Output your response strictly as a single JSON object matching the JSON schema. Do not enclose in markdown blocks.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      logger.error({ status: response.status, errorText }, "Anthropic API error");
      throw new Error(`Anthropic API responded with status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as { content?: { text?: string }[] };
    const text = data.content?.[0]?.text;
    if (!text) {
      throw new Error("Anthropic returned an empty message content");
    }

    try {
      const parsed = JSON.parse(text.trim()) as ProviderResponse;
      return parsed;
    } catch (err: unknown) {
      logger.error({ err, text }, "Failed to parse Anthropic JSON response");
      throw new Error(
        `Anthropic output was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
