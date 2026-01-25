import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

let prisma: PrismaClient;
let pool: pg.Pool;

export const getPrismaClient = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  if (!prisma) {
    // Create a pg pool
    pool = new pg.Pool({
      connectionString: databaseUrl,
    });

    const adapter = new PrismaPg(pool, {
      schema: "pricetracker",
    });

    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    });

    // Log connection pool events in development
    if (process.env.NODE_ENV === "development") {
      prisma.$on("query" as never, (e: { query: string; duration: number }) => {
        if (e.duration > 1000) {
          console.warn(`[Prisma] Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
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
    if (pool) {
      await pool.end();
      console.log("PostgreSQL pool has ended");
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
