import { describe, it, expect } from "vitest";
import { buildUserPrompt } from "../src/engine/prompt.js";
import { ProviderFactory } from "../src/engine/provider.js";

describe("Resume Tailoring and Optimization Setup", () => {
  it("should successfully build the user optimization prompt", () => {
    const candidateJson = JSON.stringify({ name: "Yash Rana", skills: ["Go"] });
    const jobDescription = "Looking for a Go developer";
    const variant = "BACKEND";
    const rules = ["reorderSkills", "improveBulletClarity"];

    const promptText = buildUserPrompt(candidateJson, jobDescription, variant, rules);

    expect(promptText).toContain("Yash Rana");
    expect(promptText).toContain("Go developer");
    expect(promptText).toContain("BACKEND");
    expect(promptText).toContain("- reorderSkills");
    expect(promptText).toContain("- improveBulletClarity");
  });

  it("should resolve the OpenAI LLM provider successfully", () => {
    const provider = ProviderFactory.getProvider("openai");
    expect(provider).toBeDefined();
    expect(provider.constructor.name).toBe("OpenAiProvider");
  });

  it("should fail gracefully for unsupported providers", () => {
    expect(() => {
      ProviderFactory.getProvider("anthropic");
    }).toThrow("Unsupported LLM provider: anthropic");
  });
});
