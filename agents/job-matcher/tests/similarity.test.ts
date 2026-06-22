import { describe, it, expect } from "vitest";
import {
  cleanTokens,
  computeJaccardSimilarity,
  computeCosineSimilarity,
  SimilarityEngine,
} from "../src/engine/similarity.js";

describe("Similarity Engine Utilities", () => {
  describe("cleanTokens", () => {
    it("should lowercase and split words by spaces and punctuation", () => {
      const text = "TypeScript, Node.js! and React-Redux.";
      const tokens = cleanTokens(text);
      expect(tokens).toContain("typescript");
      expect(tokens).toContain("node");
      expect(tokens).toContain("react");
      expect(tokens).toContain("redux");
    });

    it("should filter out short tokens less than or equal to 2 characters", () => {
      const text = "Go is a language developed by Google";
      const tokens = cleanTokens(text);
      expect(tokens).not.toContain("go");
      expect(tokens).not.toContain("is");
      expect(tokens).not.toContain("by");
      expect(tokens).toContain("language");
      expect(tokens).toContain("developed");
      expect(tokens).toContain("google");
    });
  });

  describe("computeJaccardSimilarity", () => {
    it("should return 1 for identical sets of tokens", () => {
      const text1 = "React TypeScript Node Tailwind";
      const text2 = "tailwind node react typescript";
      expect(computeJaccardSimilarity(text1, text2)).toBe(1.0);
    });

    it("should return 0 for completely disjoint tokens", () => {
      const text1 = "react typescript";
      const text2 = "python django flask";
      expect(computeJaccardSimilarity(text1, text2)).toBe(0.0);
    });

    it("should calculate correct overlap ratio for partial overlap", () => {
      // Tokens text1: ['react', 'typescript'] (size 2)
      // Tokens text2: ['react', 'javascript', 'html'] (size 3)
      // Intersection: ['react'] (size 1)
      // Union: ['react', 'typescript', 'javascript', 'html'] (size 4)
      // Jaccard: 1 / 4 = 0.25
      const text1 = "React TypeScript";
      const text2 = "React JavaScript HTML";
      expect(computeJaccardSimilarity(text1, text2)).toBe(0.25);
    });

    it("should return 0 if one of the texts is empty", () => {
      expect(computeJaccardSimilarity("", "react")).toBe(0.0);
      expect(computeJaccardSimilarity("react", "")).toBe(0.0);
      expect(computeJaccardSimilarity("", "")).toBe(0.0);
    });
  });

  describe("computeCosineSimilarity", () => {
    it("should return 1 for identical texts", () => {
      const text = "NodeJS Backend Developer with AWS Cloud experience";
      expect(computeCosineSimilarity(text, text)).toBeCloseTo(1.0, 5);
    });

    it("should return 0 for disjoint texts", () => {
      const text1 = "NodeJS Backend";
      const text2 = "Python Django";
      expect(computeCosineSimilarity(text1, text2)).toBe(0.0);
    });

    it("should compute accurate cosine similarity matching vector overlap", () => {
      const text1 = "React Developer React Developer";
      const text2 = "React Developer";
      // tf1: {'react': 2, 'developer': 2}
      // tf2: {'react': 1, 'developer': 1}
      // dot product: 2*1 + 2*1 = 4
      // mag1: sqrt(2^2 + 2^2) = sqrt(8)
      // mag2: sqrt(1^2 + 1^2) = sqrt(2)
      // similarity: 4 / (sqrt(8) * sqrt(2)) = 4 / sqrt(16) = 4 / 4 = 1
      expect(computeCosineSimilarity(text1, text2)).toBeCloseTo(1.0, 5);
    });
  });

  describe("SimilarityEngine.calculateSimilarity", () => {
    it("should invoke keyword mode (Jaccard) when specified", async () => {
      const score = await SimilarityEngine.calculateSimilarity(
        "React TypeScript",
        "React JavaScript HTML",
        "keyword",
      );
      expect(score).toBe(0.25);
    });

    it("should invoke semantic mode (Cosine TF-IDF) by default or when specified", async () => {
      const scoreDefault = await SimilarityEngine.calculateSimilarity(
        "React TypeScript",
        "React JavaScript HTML",
      );
      const scoreSemantic = await SimilarityEngine.calculateSimilarity(
        "React TypeScript",
        "React JavaScript HTML",
        "semantic",
      );
      expect(scoreDefault).toBe(scoreSemantic);
      expect(scoreSemantic).toBeGreaterThan(0);
    });
  });
});
