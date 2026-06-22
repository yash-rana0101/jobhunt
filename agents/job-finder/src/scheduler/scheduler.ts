import { logger } from "@job-hunter/logger";
import { runJobDiscovery } from "../services/discovery.js";
import type { DiscoveryResult } from "../types.js";

export type ExecutionMode = "hourly" | "daily" | "manual";

export class JobDiscoveryScheduler {
  private timer: NodeJS.Timeout | null = null;
  private currentMode: ExecutionMode = "manual";
  private isRunning = false;

  get mode(): ExecutionMode {
    return this.currentMode;
  }

  get active(): boolean {
    return this.timer !== null;
  }

  /**
   * Set scheduler mode.
   * Note: The instruction specifies "Do not schedule automatically yet", so we configure but do not auto-run.
   */
  public configure(mode: ExecutionMode): void {
    this.stop();
    this.currentMode = mode;
    logger.info({ mode }, "JobDiscoveryScheduler mode configured");

    if (mode === "hourly") {
      // Set interval for 1 hour (3600000 ms)
      this.timer = setInterval(
        () => {
          void this.triggerRun();
        },
        60 * 60 * 1000,
      );
      logger.info("Hourly scheduling configured");
    } else if (mode === "daily") {
      // Set interval for 24 hours (86400000 ms)
      this.timer = setInterval(
        () => {
          void this.triggerRun();
        },
        24 * 60 * 60 * 1000,
      );
      logger.info("Daily scheduling configured");
    }
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info("Discovery scheduler stopped");
    }
  }

  public async triggerManual(): Promise<DiscoveryResult> {
    logger.info("Manual job discovery triggered");
    return this.triggerRun();
  }

  private async triggerRun(): Promise<DiscoveryResult> {
    if (this.isRunning) {
      logger.warn("Job discovery is already running, skipping trigger");
      return {
        jobsFound: 0,
        jobsAdded: 0,
        jobsUpdated: 0,
        errors: ["Discovery is already in progress"],
        duration: 0,
      };
    }

    this.isRunning = true;
    try {
      const result = await runJobDiscovery();
      logger.info(result, "Discovery execution completed successfully");
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(err, "Discovery execution encountered unhandled exception");
      return {
        jobsFound: 0,
        jobsAdded: 0,
        jobsUpdated: 0,
        errors: [errMsg],
        duration: 0,
      };
    } finally {
      this.isRunning = false;
    }
  }
}

export const jobDiscoveryScheduler = new JobDiscoveryScheduler();
