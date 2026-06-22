import type { EmailProvider } from "./types.js";
import { ResendProvider } from "./resend-provider.js";

export * from "./types.js";
export { ResendProvider } from "./resend-provider.js";
export { MockProvider } from "./mock-provider.js";

let currentProvider: EmailProvider = new ResendProvider();

export function getProvider(): EmailProvider {
  return currentProvider;
}

export function setProvider(provider: EmailProvider): void {
  currentProvider = provider;
}
