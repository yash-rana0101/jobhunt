import { JobSourceAdapter } from "./base.js";

export class LeverAdapter extends JobSourceAdapter {
  readonly sourceName = "Lever";
  readonly baseUrl = "jobs.lever.co";
}
