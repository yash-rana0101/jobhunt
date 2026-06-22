import { JobSourceAdapter } from "./base.js";

export class WellfoundAdapter extends JobSourceAdapter {
  readonly sourceName = "Wellfound";
  readonly baseUrl = "wellfound.com";
}
