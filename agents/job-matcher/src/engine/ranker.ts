import { RemoteStatus } from "@prisma/client";

export function calculateRankingScore(
  matchScore: number,
  freshnessScore: number,
  remoteStatus: RemoteStatus,
  salaryMax: number | null,
): number {
  let salaryBonus = 0;
  if (salaryMax !== null) {
    if (salaryMax >= 180000) {
      salaryBonus = 15;
    } else if (salaryMax >= 150000) {
      salaryBonus = 10;
    } else if (salaryMax >= 120000) {
      salaryBonus = 5;
    }
  }

  let remoteBonus = 0;
  if (remoteStatus === RemoteStatus.REMOTE) {
    remoteBonus = 10;
  } else if (remoteStatus === RemoteStatus.HYBRID) {
    remoteBonus = 5;
  }

  // final_score = match_score + freshness_score + salary_bonus + remote_bonus
  const finalScore = matchScore + freshnessScore + salaryBonus + remoteBonus;

  // Bound it logically or return raw ranking score
  return Math.round(finalScore);
}
