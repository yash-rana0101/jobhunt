/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi } from "vitest";
import { MockProvider, ResendProvider, getProvider, setProvider } from "../src/providers/index.js";

describe("Email Provider System", () => {
  it("should allow swapping providers", () => {
    const defaultProvider = getProvider();
    expect(defaultProvider).toBeDefined();

    const mock = new MockProvider();
    setProvider(mock);
    expect(getProvider()).toBe(mock);

    // Restore
    setProvider(defaultProvider);
  });

  it("should record emails sent through MockProvider", async () => {
    const mock = new MockProvider();
    const emailParams = {
      from: "sender@example.com",
      to: ["recipient@example.com"],
      subject: "Test Subject",
      body: "Test Body",
    };

    const res = await mock.sendEmail(emailParams);
    expect(res.success).toBe(true);
    expect(res.providerMessageId).toContain("mock-msg-");
    expect(mock.sentEmails).toHaveLength(1);
    expect(mock.sentEmails[0]).toEqual(emailParams);
  });

  it("should make fetch calls in ResendProvider", async () => {
    const originalFetch = global.fetch;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "resend-id-123" }),
    });
    global.fetch = mockFetch as any;

    try {
      const resend = new ResendProvider("re_dummykey");
      const res = await resend.sendEmail({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Hello",
        body: "<p>Hello</p>",
      });

      expect(res.success).toBe(true);
      expect(res.providerMessageId).toBe("resend-id-123");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
