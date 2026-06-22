import type { EmailProvider, SendEmailParams, SendEmailResponse } from "./types.js";

/**
 * A testing provider that saves emails in memory.
 */
export class MockProvider implements EmailProvider {
  name = "MOCK";
  sentEmails: SendEmailParams[] = [];

  async sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    await Promise.resolve();
    this.sentEmails.push(params);
    return {
      success: true,
      providerMessageId: `mock-msg-${Math.random().toString(36).substring(2, 11)}`,
    };
  }
}
