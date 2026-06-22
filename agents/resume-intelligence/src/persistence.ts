import { prisma, type PrismaClient } from "@job-hunter/database";

import type { CandidateProfile } from "./types.js";

export async function saveCandidateProfile(
  profile: CandidateProfile,
  database: PrismaClient = prisma,
): Promise<string> {
  const candidate = await database.candidate.create({
    data: {
      fullName: profile.candidate.fullName,
      email: profile.candidate.email,
      phone: profile.candidate.phone,
      location: profile.candidate.location,
      linkedIn: profile.candidate.linkedIn,
      github: profile.candidate.github,
      portfolio: profile.candidate.portfolio,
      summary: profile.candidate.summary,
      resumeText: profile.resumeText,
      searchQueries: profile.searchQueries,
      topStrengths: profile.analysis.topStrengths,
      uniqueAdvantages: profile.analysis.uniqueAdvantages,
      competitiveAdvantages: profile.analysis.competitiveAdvantages,
      startupFitScore: profile.analysis.startupFitScore,
      enterpriseFitScore: profile.analysis.enterpriseFitScore,
      remoteWorkFitScore: profile.analysis.remoteWorkFitScore,
      leadershipScore: profile.analysis.leadershipScore,
      ownershipScore: profile.analysis.ownershipScore,
      skills: {
        create: profile.skills.map((skill) => ({
          skillName: skill.skillName,
          category: skill.category,
          confidenceScore: skill.confidenceScore,
          yearsOfExperience: skill.yearsOfExperience,
        })),
      },
      experiences: {
        create: profile.experiences.map((experience) => ({
          company: experience.company,
          role: experience.role,
          startDate: experience.startDate,
          endDate: experience.endDate,
          responsibilities: experience.responsibilities,
          technologiesUsed: experience.technologiesUsed,
          achievements: experience.achievements,
          impactMetrics: experience.impactMetrics,
        })),
      },
      projects: {
        create: profile.projects.map((project) => ({
          projectName: project.projectName,
          description: project.description,
          techStack: project.techStack,
          projectType: project.projectType,
          role: project.role,
          githubLink: project.githubLink,
          liveLink: project.liveLink,
          businessImpact: project.businessImpact,
        })),
      },
      education: {
        create: profile.education.map((education) => ({
          degree: education.degree,
          university: education.university,
          startYear: education.startYear,
          endYear: education.endYear,
          relevantCoursework: education.relevantCoursework,
        })),
      },
      keywords: {
        create: profile.keywords.map((keyword) => ({
          keyword: keyword.keyword,
          category: keyword.category,
          weight: keyword.weight,
          source: keyword.source,
        })),
      },
      roles: {
        create: profile.roles.map((role) => ({
          roleName: role.roleName,
          confidenceScore: role.confidenceScore,
          searchQueries: role.searchQueries,
        })),
      },
      embeddings: {
        create: profile.embeddings.map((embedding) => ({
          entityType: embedding.entityType,
          entityLabel: embedding.entityLabel,
          sourceText: embedding.sourceText,
          embedding: embedding.embedding,
          provider: embedding.provider,
          model: embedding.model,
          dimensions: embedding.dimensions,
        })),
      },
    },
  });

  return candidate.id;
}
