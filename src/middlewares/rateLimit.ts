import { NextFunction, Request, Response } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  increment(key: string, windowMs: number): Promise<RateLimitEntry>;
}

/**
 * In-memory rate limit store (default fallback)
 * Note: Not suitable for multi-instance deployments
 */
class MemoryRateLimitStore implements RateLimitStore {
  private hits: Record<string, RateLimitEntry> = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();
        for (const key of Object.keys(this.hits)) {
          if (now > this.hits[key].resetAt) {
            delete this.hits[key];
          }
        }
      },
      5 * 60 * 1000,
    );
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.hits[key] || null;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.hits[key] = entry;
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const entry = this.hits[key] || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    this.hits[key] = entry;
    return entry;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton store instance
let store: RateLimitStore = new MemoryRateLimitStore();

/**
 * Set a custom rate limit store (e.g., Redis-backed store)
 */
export function setRateLimitStore(customStore: RateLimitStore): void {
  store = customStore;
}

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Rate limiter middleware with configurable store
 * Defaults to in-memory store, can be configured to use Redis for multi-instance deployments
 */
export function simpleRateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60_000,
    max = 20,
    keyGenerator = (req: Request) => `${req.ip}:${req.path}`,
    message = "Too many requests. Please try again later.",
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const entry = await store.increment(key, windowMs);

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count));
      res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

      if (entry.count > max) {
        res.setHeader("Retry-After", Math.ceil((entry.resetAt - Date.now()) / 1000));
        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000),
        });
      }

      return next();
    } catch (error) {
      // If rate limiting fails, allow the request (fail open)
      console.error("[RateLimit] Error:", error);
      return next();
    }
  };
}

/**
 * Stricter rate limiter for sensitive endpoints (login, register, password reset)
 */
export function strictRateLimit() {
  return simpleRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: "Too many attempts. Please try again in 15 minutes.",
  });
}

/**
 * Rate limiter for API endpoints
 */
export function apiRateLimit() {
  return simpleRateLimit({
    windowMs: 60_000, // 1 minute
    max: 100, // 100 requests per minute
    message: "API rate limit exceeded. Please slow down.",
  });
}

export { RateLimitEntry, RateLimitStore };
