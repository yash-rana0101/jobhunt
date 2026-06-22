export function cleanTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.trim().length > 2);
}

export function computeJaccardSimilarity(text1: string, text2: string): number {
  const set1 = new Set(cleanTokens(text1));
  const set2 = new Set(cleanTokens(text2));

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

export function computeCosineSimilarity(text1: string, text2: string): number {
  const tokens1 = cleanTokens(text1);
  const tokens2 = cleanTokens(text2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // 1. Build term frequency maps
  const tf1: Record<string, number> = {};
  const tf2: Record<string, number> = {};

  for (const t of tokens1) tf1[t] = (tf1[t] || 0) + 1;
  for (const t of tokens2) tf2[t] = (tf2[t] || 0) + 1;

  // 2. Build joint vocabulary
  const vocab = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);

  // 3. Compute dot product and magnitudes
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const term of vocab) {
    const val1 = tf1[term] || 0;
    const val2 = tf2[term] || 0;

    dotProduct += val1 * val2;
    mag1 += val1 * val1;
    mag2 += val2 * val2;
  }

  const mag1Sqrt = Math.sqrt(mag1);
  const mag2Sqrt = Math.sqrt(mag2);

  if (mag1Sqrt === 0 || mag2Sqrt === 0) return 0;

  return dotProduct / (mag1Sqrt * mag2Sqrt);
}

export class SimilarityEngine {
  /**
   * Calculates similarity between candidate text and job description.
   * Design allows future replacement with high-dimensional vector search.
   */
  public static async calculateSimilarity(
    text1: string,
    text2: string,
    mode: "keyword" | "semantic" = "semantic",
  ): Promise<number> {
    await Promise.resolve();
    if (mode === "keyword") {
      return computeJaccardSimilarity(text1, text2);
    }
    return computeCosineSimilarity(text1, text2);
  }
}
