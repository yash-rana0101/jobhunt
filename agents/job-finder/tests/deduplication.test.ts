import { describe, it, expect } from "vitest";
import { findDuplicate, calculateJaccardSimilarity } from "../src/engine/deduplication.js";

describe("Deduplication Engine", () => {
  describe("calculateJaccardSimilarity", () => {
    it("should return 1 for identical text", () => {
      const text = "We are seeking a Backend Engineer with TypeScript and Node.js experience.";
      expect(calculateJaccardSimilarity(text, text)).toBe(1);
    });

    it("should return high score for similar descriptions", () => {
      const text1 =
        "We are seeking a Backend Engineer with TypeScript and Node.js experience. Join our team!";
      const text2 =
        "We are seeking a Backend Engineer with TypeScript and Node.js experience. Remote position.";
      expect(calculateJaccardSimilarity(text1, text2)).toBeGreaterThan(0.6);
    });

    it("should return low score for different descriptions", () => {
      const text1 = "We are seeking a Backend Engineer with TypeScript and Node.js experience.";
      const text2 =
        "We want a designer who knows Figma, Adobe Photoshop, and understands UX prototyping.";
      expect(calculateJaccardSimilarity(text1, text2)).toBeLessThan(0.2);
    });
  });

  describe("findDuplicate", () => {
    const existingJobs = [
      {
        id: "job-1",
        title: "Software Engineer",
        company: "Stripe",
        description:
          "We are seeking a Software Engineer with React and Node.js experience. Help us build payment APIs.",
        applicationUrl: "https://stripe.com/jobs/se-1",
      },
    ];

    it("should identify duplicate by Application URL", () => {
      const newJob = {
        sourceJobId: "new-1",
        source: "YC Jobs",
        title: "Full Stack Developer", // different title
        company: "Stripe",
        description: "Completely different text",
        applicationUrl: "https://stripe.com/jobs/se-1", // same URL
      };

      const dup = findDuplicate(newJob, existingJobs);
      expect(dup).not.toBeNull();
      expect(dup?.id).toBe("job-1");
    });

    it("should identify duplicate by Company, Title, and Description similarity", () => {
      const newJob = {
        sourceJobId: "new-2",
        source: "Wellfound",
        title: "Software Engineer", // same title
        company: "Stripe", // same company
        description:
          "We are seeking a Software Engineer with React and Node.js experience. Help us build payment APIs. Join our SF office.", // high similarity
        applicationUrl: "https://wellfound.com/stripe/se-1",
      };

      const dup = findDuplicate(newJob, existingJobs);
      expect(dup).not.toBeNull();
      expect(dup?.id).toBe("job-1");
    });

    it("should not mark as duplicate if description is different", () => {
      const newJob = {
        sourceJobId: "new-3",
        source: "Wellfound",
        title: "Software Engineer",
        company: "Stripe",
        description:
          "We are seeking a Systems Administrator to maintain our Linux server nodes and network firewalls.", // different desc
        applicationUrl: "https://stripe.com/jobs/sysadmin",
      };

      const dup = findDuplicate(newJob, existingJobs);
      expect(dup).toBeNull();
    });
  });
});
