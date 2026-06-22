import { JobSourceAdapter } from "./base.js";

export class AshbyAdapter extends JobSourceAdapter {
  readonly sourceName = "Ashby";
  readonly baseUrl = "jobs.ashbyhq.com";
}
