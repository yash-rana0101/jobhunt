import type { RecommendationDetails, MatchSubScores } from "../types.js";
import { RemoteStatus } from "@prisma/client";

export function generateRecommendation(
  subScores: MatchSubScores,
  missingSkills: string[],
  presentSkills: string[],
  remoteStatus: RemoteStatus,
  company: string,
): RecommendationDetails {
  const whyApply: string[] = [];
  const whyNotApply: string[] = [];
  const riskFactors: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const preparationTips: string[] = [];

  // 1. Evaluate Strengths and Why Apply
  if (subScores.skills >= 80) {
    whyApply.push("Strong alignment with your core technical stack.");
    strengths.push("High tech stack matching coverage.");
  }
  if (subScores.experience >= 80) {
    whyApply.push("The required seniority level fits your professional track record.");
    strengths.push("Meets experience seniority requirements.");
  }
  if (subScores.projects >= 70) {
    whyApply.push(`Your past projects closely match the domain of ${company}.`);
  }
  if (remoteStatus === RemoteStatus.REMOTE) {
    whyApply.push("Fully remote flexibility helps work-life balance.");
  }

  // 2. Evaluate Weaknesses and Why Not Apply
  if (missingSkills.length > 0) {
    whyNotApply.push(
      `Requires technologies you haven't mastered: ${missingSkills.slice(0, 3).join(", ")}.`,
    );
    weaknesses.push(`Missing core skills: ${missingSkills.join(", ")}.`);
  }
  if (subScores.experience < 60) {
    whyNotApply.push("Seniority mismatch; you might be under-experienced for this role.");
    riskFactors.push("High probability of strict technical screenings.");
  }
  if (remoteStatus === RemoteStatus.ONSITE) {
    whyNotApply.push("On-site requirements; limits geographical flexibility.");
    riskFactors.push("Commute and relocation requirements.");
  }

  // 3. Risk Factors
  if (subScores.compensation < 70) {
    riskFactors.push("Estimated compensation is below premium benchmarks.");
  }
  if (subScores.startup > 85 && subScores.skills < 70) {
    riskFactors.push("High-paced startup environment with a significant technical skill gap.");
  }

  // 4. Preparation Tips
  if (presentSkills.length > 0) {
    preparationTips.push(
      `Prepare stories showcasing your experience with ${presentSkills.slice(0, 3).join(" and ")}.`,
    );
  }
  if (missingSkills.length > 0) {
    preparationTips.push(
      `Review basic concepts and architecture of ${missingSkills.slice(0, 2).join(" and ")}.`,
    );
  }
  preparationTips.push(
    "Prepare questions about the team structure, deployment pipeline, and target customer demographic.",
  );

  // 5. Interview Readiness Score
  // Calculated from skills, experience, and role scores
  const readiness = Math.round(
    subScores.skills * 0.4 + subScores.experience * 0.4 + subScores.role * 0.2,
  );

  return {
    whyApply:
      whyApply.length > 0 ? whyApply : ["Great opportunity to expand your engineering portfolio."],
    whyNotApply: whyNotApply.length > 0 ? whyNotApply : ["No significant warning flags detected."],
    riskFactors:
      riskFactors.length > 0 ? riskFactors : ["Minimal organizational or role risk detected."],
    strengths:
      strengths.length > 0 ? strengths : ["Generic software development capabilities match."],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["No severe technical skill gaps detected."],
    preparationTips,
    interviewReadinessScore: Math.min(100, Math.max(10, readiness)),
  };
}
