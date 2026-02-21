import { PrismaClient } from "../generated/prisma/client";
import { env } from "../config/env";
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma || new PrismaClient({
  accelerateUrl: env.databaseUrl as string
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
