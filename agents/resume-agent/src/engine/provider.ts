import type { LlmOptimizationResult } from "../types/index.js";
import { OpenAiProvider } from "./openai.js";

export interface LlmProvider {
  optimizeResume(
    candidateProfile: string,
    jobDescription: string,
    variant: string,
    rules: string[],
  ): Promise<LlmOptimizationResult>;
}

export class ProviderFactory {
  public static getProvider(
    providerName: "openai" | "anthropic" | "gemini" = "openai",
  ): LlmProvider {
    if (providerName === "openai") {
      return new OpenAiProvider();
    }
    // Future expansion for anthropic / gemini can be easily added here
    throw new Error(`Unsupported LLM provider: ${providerName}`);
  }
}
