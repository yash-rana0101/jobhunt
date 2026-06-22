import { logger } from "@job-hunter/logger";
import type { LlmProvider } from "./provider.js";
import type { ProviderResponse } from "../types/index.js";

export class GeminiProvider implements LlmProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  public async generateOutreach(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ProviderResponse> {
    if (!this.apiKey) {
      logger.error("Gemini API Key is missing");
      throw new Error("Gemini API Key is not configured. Please set GEMINI_API_KEY.");
    }

    logger.info("Executing Gemini content generation for outreach draft");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text:
                systemPrompt +
                " Output your response strictly as a single JSON object matching the JSON schema. Do not enclose in markdown blocks.",
            },
          ],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      logger.error({ status: response.status, errorText }, "Gemini API error");
      throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned empty content");
    }

    try {
      const parsed = JSON.parse(text.trim()) as ProviderResponse;
      return parsed;
    } catch (err: unknown) {
      logger.error({ err, text }, "Failed to parse Gemini JSON response");
      throw new Error(
        `Gemini output was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
