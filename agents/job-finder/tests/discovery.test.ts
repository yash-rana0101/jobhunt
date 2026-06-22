import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database package
vi.mock("@job-hunter/database", () => {
  return {
    prisma: {
      candidate: {
        findFirst: vi.fn().mockResolvedValue({
          searchQueries: ["TypeScript Engineer"],
        }),
      },
      job: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => ({
          id: "mock-job-id",
          ...args.data,
        })),
        update: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
      },
      jobSource: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => ({
          id: "mock-source-id",
          ...args.data,
        })),
        update: vi.fn().mockResolvedValue({ id: "mock-source-id" }),
      },
      jobSearchRun: {
        create: vi.fn().mockResolvedValue({ id: "mock-run-id" }),
      },
      jobTechnology: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  };
});

import { runJobDiscovery } from "../src/services/discovery.js";

describe("Job Discovery Orchestrator Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute discovery crawling using mock parameters", async () => {
    const result = await runJobDiscovery({
      useMock: true,
      sources: ["yc_jobs"],
      queries: ["React Developer"],
      limit: 2,
    });

    expect(result.jobsFound).toBe(2);
    expect(result.jobsAdded).toBe(2);
    expect(result.jobsUpdated).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});
