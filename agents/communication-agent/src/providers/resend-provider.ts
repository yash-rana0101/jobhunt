import type { EmailProvider, SendEmailParams, SendEmailResponse } from "./types.js";

/**
 * Concrete implementation of Resend email delivery provider.
 */
export class ResendProvider implements EmailProvider {
  name = "RESEND";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || "";
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        errorMessage: "Resend API key is not configured in environment variables",
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: params.from,
          to: params.to,
          cc: params.cc,
          bcc: params.bcc,
          subject: params.subject,
          html: params.body,
        }),
      });

      const data = (await response.json()) as {
        id?: string;
        message?: string;
        statusCode?: number;
      };

      if (response.ok && data.id) {
        return {
          success: true,
          providerMessageId: data.id,
        };
      } else {
        return {
          success: false,
          errorMessage: data.message || `Resend API returned status code ${response.status}`,
        };
      }
    } catch (err: unknown) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
