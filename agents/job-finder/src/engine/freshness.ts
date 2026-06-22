export function calculateFreshnessScore(
  postedDate: Date | null | undefined,
  crawlDate: Date,
  source: string,
): number {
  const referenceDate = postedDate || crawlDate;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let score = 100;

  // 1. Decaying by age
  if (diffDays <= 1) {
    score = 100;
  } else if (diffDays <= 3) {
    score = 90;
  } else if (diffDays <= 7) {
    score = 80;
  } else if (diffDays <= 14) {
    score = 65;
  } else if (diffDays <= 30) {
    score = 45;
  } else {
    score = Math.max(10, 30 - (diffDays - 30));
  }

  // 2. Penalty for estimated dates
  if (!postedDate) {
    score -= 15; // Penalty since we don't know the exact post date and it is estimated from crawl date
  }

  // 3. Source weight adjustments
  const lowercaseSource = source.toLowerCase();
  if (lowercaseSource.includes("yc") || lowercaseSource.includes("wellfound")) {
    score += 5; // Premium job source bonus
  } else if (lowercaseSource.includes("career")) {
    score += 2; // Direct company career page bonus
  }

  // Bound score between 0 and 100
  return Math.min(100, Math.max(0, Math.round(score)));
}
