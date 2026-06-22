import type { ProviderResponse } from "../types/index.js";
import { OpenAiProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";

export interface LlmProvider {
  generateOutreach(systemPrompt: string, userPrompt: string): Promise<ProviderResponse>;
}

export class ProviderFactory {
  public static getProvider(
    providerName: "openai" | "anthropic" | "gemini" = "openai",
  ): LlmProvider {
    if (providerName === "openai") {
      return new OpenAiProvider();
    }
    if (providerName === "anthropic") {
      return new AnthropicProvider();
    }
    if (providerName === "gemini") {
      return new GeminiProvider();
    }
    throw new Error(`Unsupported LLM provider: ${providerName as string}`);
  }
}
