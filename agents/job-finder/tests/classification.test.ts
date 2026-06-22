import { describe, it, expect } from "vitest";
import {
  classifyRemote,
  classifyExperience,
  extractTechnologies,
} from "../src/engine/classification.js";
import { RemoteStatus } from "@prisma/client";

describe("Classification Engine", () => {
  describe("classifyRemote", () => {
    it("should classify remote jobs", () => {
      expect(classifyRemote("Backend Engineer", "This is a remote job", "USA")).toBe(
        RemoteStatus.REMOTE,
      );
      expect(classifyRemote("Remote React Developer", "Work from anywhere", "")).toBe(
        RemoteStatus.REMOTE,
      );
    });

    it("should classify hybrid jobs", () => {
      expect(
        classifyRemote(
          "Software Engineer",
          "Hybrid work format: 2 days in office",
          "San Francisco, CA",
        ),
      ).toBe(RemoteStatus.HYBRID);
    });

    it("should classify onsite jobs", () => {
      expect(classifyRemote("Systems Admin", "Must work in-office every day", "Austin, TX")).toBe(
        RemoteStatus.ONSITE,
      );
    });

    it("should fallback to unknown or default on empty details", () => {
      expect(classifyRemote("Engineer", "Description", "")).toBe(RemoteStatus.UNKNOWN);
    });
  });

  describe("classifyExperience", () => {
    it("should detect internships", () => {
      expect(classifyExperience("Looking for summer interns", "Software Engineering Intern")).toBe(
        "Internship",
      );
    });

    it("should detect senior roles", () => {
      expect(
        classifyExperience("Requires 8+ years of experience with Node", "Senior Backend Developer"),
      ).toBe("Senior");
    });

    it("should detect entry level roles", () => {
      expect(
        classifyExperience("No prior experience required, we train new grads", "Junior Engineer"),
      ).toBe("Entry Level");
    });

    it("should fall back to default", () => {
      expect(classifyExperience("Great role for building applications", "Software Developer")).toBe(
        "3-5 Years",
      );
    });
  });

  describe("extractTechnologies", () => {
    it("should parse programming languages and frameworks", () => {
      const desc =
        "We are seeking a developer proficient in TypeScript, React, and Python, deploying with Docker.";
      const tech = extractTechnologies(desc);
      expect(tech).toContain("TypeScript");
      expect(tech).toContain("React");
      expect(tech).toContain("Python");
      expect(tech).toContain("Docker");
      expect(tech).not.toContain("Rust");
    });
  });
});
