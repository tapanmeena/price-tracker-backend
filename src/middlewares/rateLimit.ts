import { NextFunction, Request, Response } from "express";

// Simple in-memory rate limiter (per-IP per-route). Not suitable for multi-instance.
export function simpleRateLimit({ windowMs = 60_000, max = 20 }: { windowMs?: number; max?: number }) {
  const hits: Record<string, { count: number; resetAt: number }> = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = hits[key] || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits[key] = entry;

    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    }

    return next();
  };
}
