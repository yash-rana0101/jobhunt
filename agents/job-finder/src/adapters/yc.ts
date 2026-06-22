import { JobSourceAdapter } from "./base.js";
import type { ParsedJob, UnnormalizedJob } from "../types.js";

export class YCJobsAdapter extends JobSourceAdapter {
  readonly sourceName = "YC Jobs";
  readonly baseUrl = "workatastartup.com";

  override async parse(markdownContent: string, unnormalized: UnnormalizedJob): Promise<ParsedJob> {
    const baseParsed = await super.parse(markdownContent, unnormalized);

    // Look for YC batch markers like W23, S22, etc. in content
    const batchRegex = /\b[WS](?:1[0-9]|2[0-7])\b/g;
    const match = markdownContent.match(batchRegex);
    const tags = baseParsed.technologies || [];

    if (match) {
      match.forEach((batch) => {
        if (!tags.includes(`YC ${batch}`)) {
          tags.push(`YC ${batch}`);
        }
      });
    }

    return {
      ...baseParsed,
      technologies: tags,
    };
  }
}
