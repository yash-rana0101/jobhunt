import type { JobSourceAdapter } from "./base.js";
import { YCJobsAdapter } from "./yc.js";
import { WellfoundAdapter } from "./wellfound.js";
import { GreenhouseAdapter } from "./greenhouse.js";
import { LeverAdapter } from "./lever.js";
import { AshbyAdapter } from "./ashby.js";

const ADAPTERS: Record<string, JobSourceAdapter> = {
  yc_jobs: new YCJobsAdapter(),
  wellfound: new WellfoundAdapter(),
  greenhouse: new GreenhouseAdapter(),
  lever: new LeverAdapter(),
  ashby: new AshbyAdapter(),
};

export function getAdapter(sourceName: string): JobSourceAdapter {
  const normalized = sourceName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const adapter = ADAPTERS[normalized];
  if (!adapter) {
    throw new Error(`Unsupported job source adapter: ${sourceName}`);
  }
  return adapter;
}

export function getAllSupportedSources(): string[] {
  return Object.values(ADAPTERS).map((adapter) => {
    return adapter.sourceName;
  });
}
