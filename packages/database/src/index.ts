import { PrismaClient } from "@prisma/client";

export type DatabaseStatus = {
  ready: boolean;
  checkedAt: Date;
};

export const databasePackageName = "@job-hunter/database";

export const prisma = new PrismaClient();

export type { PrismaClient };
