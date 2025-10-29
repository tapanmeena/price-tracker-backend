import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return prisma;
};

export const connectPostgres = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error);
    process.exit(1);
  }
};

export const disconnectPostgres = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      console.log("PostgreSQL connection closed");
    }
  } catch (error) {
    console.error("Error during PostgreSQL shutdown:", error);
  }
};

// Handle application termination
process.on("SIGINT", async () => {
  await disconnectPostgres();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectPostgres();
  process.exit(0);
});

export default getPrismaClient;
