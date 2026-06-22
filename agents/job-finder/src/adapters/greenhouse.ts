import { JobSourceAdapter } from "./base.js";

export class GreenhouseAdapter extends JobSourceAdapter {
  readonly sourceName = "Greenhouse";
  readonly baseUrl = "boards.greenhouse.io";
}
