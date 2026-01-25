import { Request, Response, Router } from "express";
import getPrismaClient from "../config/postgresConfig";
import { fetchProducts } from "../controllers/fetcherController";

const miscRouter = Router();

// Product fetcher endpoint
miscRouter.get("/product-fetcher", fetchProducts);

/**
 * Health check endpoint for container orchestration (K8s, Docker, etc.)
 * Returns basic health status
 */
miscRouter.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Readiness check - verifies all dependencies are available
 * Use this for K8s readiness probes
 */
miscRouter.get("/ready", async (req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Check database connectivity
  const dbStart = Date.now();
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "healthy",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Determine overall status
  const isReady = Object.values(checks).every((check) => check.status === "healthy");

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    checks,
  });
});

/**
 * Detailed system info (protected in production)
 */
miscRouter.get("/info", (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";

  const info = {
    version: process.env.npm_package_version || "unknown",
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ...(isProduction
      ? {}
      : {
          memory: process.memoryUsage(),
          pid: process.pid,
          platform: process.platform,
          arch: process.arch,
        }),
  };

  res.json(info);
});

export default miscRouter;
