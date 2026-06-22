import { extractSkills } from "./skills.js";
import { extractSection, lines, stripBullet, uniqueStrings } from "./text-utils.js";
import type {
  CandidateIdentity,
  ExtractedEducation,
  ExtractedExperience,
  ExtractedProject,
  ExtractedSkill,
} from "./types.js";

export function extractCandidateIdentity(resumeText: string): CandidateIdentity {
  const resumeLines = lines(resumeText);
  const email = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = resumeText.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  const linkedIn = normalizeUrl(
    resumeText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)|]+/i)?.[0],
  );
  const github = normalizeUrl(
    resumeText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)|]+/i)?.[0],
  );
  const portfolio = resumeText.match(/https?:\/\/(?!.*(?:linkedin|github))[^\s)]+/i)?.[0];

  const fullName =
    resumeLines.find((line) => {
      const lower = line.toLowerCase();
      return (
        !line.includes("@") &&
        !/\d{4,}/.test(line) &&
        !lower.includes("resume") &&
        !lower.includes("linkedin") &&
        !lower.includes("github")
      );
    }) ?? "Unknown Candidate";

  return {
    fullName,
    email,
    phone,
    location: extractLocation(resumeLines),
    linkedIn,
    github,
    portfolio,
    summary: extractSummary(resumeText),
  };
}

export function extractCandidateSections(resumeText: string): {
  skills: ExtractedSkill[];
  experiences: ExtractedExperience[];
  projects: ExtractedProject[];
  education: ExtractedEducation[];
} {
  const skills = extractSkills(resumeText);

  return {
    skills,
    experiences: extractExperiences(resumeText, skills),
    projects: extractProjects(resumeText, skills),
    education: extractEducation(resumeText),
  };
}

function extractLocation(resumeLines: readonly string[]): string | undefined {
  const candidates = resumeLines
    .slice(0, 8)
    .flatMap((line) => line.split("|"))
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return candidates.find((candidate) => {
    const lower = candidate.toLowerCase();
    const isContactField =
      !lower.includes("@") &&
      !lower.includes("linkedin") &&
      !lower.includes("github") &&
      !/^\+?\d/.test(candidate);

    return (
      isContactField &&
      (lower.includes("remote") ||
        /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(candidate) ||
        /\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b/.test(candidate))
    );
  });
}

function extractSummary(resumeText: string): string | undefined {
  const section = extractSection(resumeText, ["summary", "profile"]);

  if (section.length > 0) {
    return lines(section).slice(0, 4).join(" ");
  }

  return lines(resumeText)
    .find((line) => line.length > 80 && !line.includes("@"))
    ?.trim();
}

function extractExperiences(
  resumeText: string,
  skills: readonly ExtractedSkill[],
): ExtractedExperience[] {
  const section = extractSection(resumeText, [
    "experience",
    "work experience",
    "professional experience",
  ]);

  if (section.length === 0) {
    return [];
  }

  const sectionLines = lines(section);
  const experiences: ExtractedExperience[] = [];
  let current: ExtractedExperience | undefined;

  for (const line of sectionLines) {
    const parsedHeader = parseExperienceHeader(line);

    if (parsedHeader) {
      if (current) {
        experiences.push(current);
      }

      current = {
        ...parsedHeader,
        responsibilities: [],
        technologiesUsed: [],
        achievements: [],
        impactMetrics: [],
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const cleanLine = stripBullet(line);

    if (cleanLine.length === 0) {
      continue;
    }

    current.responsibilities.push(cleanLine);

    if (
      /\b(improved|increased|reduced|launched|built|led|owned|optimized|scaled)\b/i.test(cleanLine)
    ) {
      current.achievements.push(cleanLine);
    }

    const metrics = cleanLine.match(
      /\b\d+(?:\.\d+)?%|\b\d+x\b|\b\d+\+?\s*(?:users|requests|services|teams|engineers|projects)\b/gi,
    );

    if (metrics) {
      current.impactMetrics.push(...metrics);
    }
  }

  if (current) {
    experiences.push(current);
  }

  return experiences.map((experience) => ({
    ...experience,
    responsibilities: uniqueStrings(experience.responsibilities),
    technologiesUsed: skillsUsedInText(experience.responsibilities.join(" "), skills),
    achievements: uniqueStrings(experience.achievements),
    impactMetrics: uniqueStrings(experience.impactMetrics),
  }));
}

function parseExperienceHeader(
  line: string,
): Pick<ExtractedExperience, "company" | "role" | "startDate" | "endDate"> | undefined {
  const normalized = stripBullet(line);
  const datePattern =
    "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)?\\s*\\d{4}\\s*(?:-|to)\\s*(Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)?\\s*\\d{4})";
  const dateMatch = normalized.match(new RegExp(datePattern, "i"));

  if (!dateMatch) {
    return undefined;
  }

  const dateText = dateMatch[0];
  const [startDate, endDate] = dateText.split(/\s*(?:-|to)\s*/i);
  const headerText = normalized
    .replace(dateText, "")
    .replace(/[|,]+$/, "")
    .trim();
  const parts = headerText.split(/\s+(?:at|@|-|,|\|)\s+/i).filter(Boolean);

  if (parts.length < 2) {
    return undefined;
  }

  return {
    role: parts[0] ?? "Unknown Role",
    company: parts.slice(1).join(" "),
    startDate: startDate?.trim(),
    endDate: endDate?.trim(),
  };
}

function extractProjects(
  resumeText: string,
  skills: readonly ExtractedSkill[],
): ExtractedProject[] {
  const section = extractSection(resumeText, ["projects", "technical projects"]);

  if (section.length === 0) {
    return [];
  }

  const projectLines = lines(section);
  const projects: ExtractedProject[] = [];
  let current: ExtractedProject | undefined;

  for (const line of projectLines) {
    const cleanLine = stripBullet(line);
    const looksLikeTitle = cleanLine.length < 90 && !/[.!?]$/.test(cleanLine);

    if (looksLikeTitle) {
      if (current) {
        projects.push(current);
      }

      current = {
        projectName: cleanLine.replace(/[:|]$/, ""),
        techStack: skillsUsedInText(cleanLine, skills),
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const links = cleanLine.match(/https?:\/\/[^\s)]+/gi) ?? [];

    current.description = [current.description, cleanLine].filter(Boolean).join(" ");
    current.techStack = uniqueStrings([
      ...current.techStack,
      ...skillsUsedInText(cleanLine, skills),
    ]);
    current.githubLink = current.githubLink ?? links.find((link) => link.includes("github.com"));
    current.liveLink = current.liveLink ?? links.find((link) => !link.includes("github.com"));

    if (
      /\b(revenue|users|latency|cost|conversion|retention|growth|automation|productivity)\b/i.test(
        cleanLine,
      )
    ) {
      current.businessImpact = cleanLine;
    }
  }

  if (current) {
    projects.push(current);
  }

  return projects;
}

function extractEducation(resumeText: string): ExtractedEducation[] {
  const section = extractSection(resumeText, ["education"]);

  if (section.length === 0) {
    return [];
  }

  const educationRecords: ExtractedEducation[] = [];

  for (const line of lines(section)) {
    const years = line.match(/\b(19|20)\d{2}\b/g)?.map((year) => Number.parseInt(year, 10)) ?? [];
    const parts = line.split(/\s+-\s+|\s+\|\s+|,\s+/).filter(Boolean);
    const degree = parts.find((part) =>
      /\b(Bachelor|Master|B\.?S\.?|M\.?S\.?|PhD|Degree)\b/i.test(part),
    );
    const university = parts.find((part) =>
      /\b(University|College|Institute|School)\b/i.test(part),
    );

    if (!degree && !university) {
      continue;
    }

    educationRecords.push({
      degree: degree ?? parts[0] ?? "Degree",
      university: university ?? parts[1] ?? "University",
      startYear: years[0],
      endYear: years[1] ?? years[0],
      relevantCoursework: extractCoursework(line),
    });
  }

  return educationRecords;
}

function extractCoursework(line: string): string[] {
  const courseworkMatch = line.match(/coursework[:\s]+(.+)$/i);

  if (!courseworkMatch?.[1]) {
    return [];
  }

  return uniqueStrings(courseworkMatch[1].split(/,\s*/));
}

function skillsUsedInText(text: string, skills: readonly ExtractedSkill[]): string[] {
  return skills
    .filter((skill) => text.toLowerCase().includes(skill.skillName.toLowerCase()))
    .map((skill) => skill.skillName);
}

function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.startsWith("http") ? value : `https://${value}`;
}
