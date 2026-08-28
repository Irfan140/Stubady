import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient;
};

const createPrismaClient = (): PrismaClient => {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl });
  return new PrismaClient({ adapter });
};

export const prisma: PrismaClient =
  globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
