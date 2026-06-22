import type { QualityScores, DraftStatus } from "../types/index.js";

/**
 * Clamp a number to be between min and max inclusive.
 */
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Validates, clamps, and evaluates the generated draft scores.
 * Determines if the draft is READY or requires human REVIEW_REQUIRED.
 */
export function evaluateDraftScores(scores: QualityScores): {
  clampedScores: QualityScores;
  status: DraftStatus;
} {
  const clampedScores: QualityScores = {
    qualityScore: clamp(scores.qualityScore),
    personalizationScore: clamp(scores.personalizationScore),
    relevanceScore: clamp(scores.relevanceScore),
    spamRiskScore: clamp(scores.spamRiskScore),
    professionalismScore: clamp(scores.professionalismScore),
    clarityScore: clamp(scores.clarityScore),
  };

  // Threshold rule: S_quality >= 75 AND S_spam <= 30 => READY
  // Otherwise => REVIEW_REQUIRED
  const isReady = clampedScores.qualityScore >= 75 && clampedScores.spamRiskScore <= 30;

  return {
    clampedScores,
    status: isReady ? "READY" : "REVIEW_REQUIRED",
  };
}
