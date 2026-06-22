import { RemoteStatus } from "@prisma/client";

export function classifyRemote(title: string, description: string, location: string): RemoteStatus {
  const combined = `${title} ${description} ${location}`.toLowerCase();

  if (
    combined.includes("remote") ||
    combined.includes("anywhere") ||
    combined.includes("work from home") ||
    combined.includes("wfh")
  ) {
    // Check if it's hybrid
    if (
      combined.includes("hybrid") ||
      combined.includes("partial remote") ||
      combined.includes("split remote")
    ) {
      return RemoteStatus.HYBRID;
    }
    return RemoteStatus.REMOTE;
  }

  if (
    combined.includes("hybrid") ||
    combined.includes("mix of remote") ||
    combined.includes("flexible work arrangement")
  ) {
    return RemoteStatus.HYBRID;
  }

  if (
    combined.includes("onsite") ||
    combined.includes("on-site") ||
    combined.includes("in office") ||
    combined.includes("in-office") ||
    combined.includes("physical office")
  ) {
    return RemoteStatus.ONSITE;
  }

  if (location && location.trim().length > 0) {
    if (location.toLowerCase().includes("remote")) {
      return RemoteStatus.REMOTE;
    }
    return RemoteStatus.ONSITE;
  }

  return RemoteStatus.UNKNOWN;
}

export function classifyExperience(description: string, title: string): string {
  const t = title.toLowerCase();
  const d = description.toLowerCase();

  // 1. Title Checks (High priority indicators)
  if (t.includes("intern") || t.includes("co-op") || t.includes("fellowship")) {
    return "Internship";
  }
  if (
    t.includes("principal") ||
    t.includes("staff") ||
    t.includes("architect") ||
    t.includes("distinguished")
  ) {
    return "Principal";
  }
  if (t.includes("lead") || t.includes("manager") || t.includes("head") || t.includes("director")) {
    return "Lead";
  }
  if (t.includes("senior") || t.includes("sr.") || t.includes("iii") || t.includes("iv")) {
    return "Senior";
  }
  if (t.includes("junior") || t.includes("jr.") || t.includes("entry") || t.includes("associate")) {
    return "Entry Level";
  }

  // 2. Year pattern matches in description
  const yrPatterns = [
    { regex: /(?:0-1|0-2|\b1\b|\b2\b)\+?\s*(?:years|yrs)\s+of\s+experience/i, label: "1-2 Years" },
    { regex: /(?:1-2|1-3|2-3|2-4)\s*(?:years|yrs)\s+of\s+experience/i, label: "1-2 Years" },
    {
      regex: /(?:3-5|3-6|4-6|3\+?|4\+?|5\+?)\s*(?:years|yrs)\s+of\s+experience/i,
      label: "3-5 Years",
    },
    {
      regex: /(?:6-8|5-8|8-10|6\+?|7\+?|8\+?|10\+?)\s*(?:years|yrs)\s+of\s+experience/i,
      label: "Senior",
    },
  ];

  for (const pattern of yrPatterns) {
    if (pattern.regex.test(d)) {
      return pattern.label;
    }
  }

  // 3. Fallbacks
  if (d.includes("entry level") || d.includes("new grad") || d.includes("no experience")) {
    return "Entry Level";
  }
  if (d.includes("senior") || d.includes("track record") || d.includes("deep expertise")) {
    return "Senior";
  }

  return "3-5 Years"; // Default industry standard
}

const TECH_CATALOG = [
  "TypeScript",
  "JavaScript",
  "Node.js",
  "React",
  "Next.js",
  "Python",
  "Django",
  "FastAPI",
  "Flask",
  "Go",
  "Rust",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Terraform",
  "CI/CD",
  "Kafka",
  "RabbitMQ",
  "GraphQL",
  "Java",
  "Spring Boot",
  "C++",
  "Ruby on Rails",
  "Ruby",
  "PyTorch",
  "TensorFlow",
  "OpenAI",
  "LLM",
  "Tailwind CSS",
];

export function extractTechnologies(description: string): string[] {
  const extracted: string[] = [];
  const descLower = description.toLowerCase();

  for (const tech of TECH_CATALOG) {
    // Use word boundaries or clean string matching to prevent false positives
    // e.g. Go shouldn't match django or google. Let's build a clean regex for it.
    let regex: RegExp;
    if (tech === "Go") {
      regex = /\bgo\b/i;
    } else if (tech === "C++") {
      regex = /c\+\+/i;
    } else if (tech === "C#") {
      regex = /c#/i;
    } else if (tech === "Node.js") {
      regex = /\bnode\.js\b|\bnode\b/i;
    } else if (tech === "CI/CD") {
      regex = /ci\/cd/i;
    } else if (tech === "React") {
      regex = /\breact\b|\breactjs\b/i;
    } else {
      // Escape any special regex chars in the tech name
      const escaped = tech.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      regex = new RegExp(`\\b${escaped}\\b`, "i");
    }

    if (regex.test(descLower)) {
      extracted.push(tech);
    }
  }

  return extracted;
}
