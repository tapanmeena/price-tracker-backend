import { NextFunction, Request, Response } from "express";

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

/**
 * Request logging middleware
 * Logs request/response details with timing information
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log on response finish
    res.on("finish", () => {
      const duration = Date.now() - startTime;

      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
        userId: (req as Request & { user?: { id: string } }).user?.id,
      };

      // Color-coded logging based on status
      const statusColor = getStatusColor(res.statusCode);
      const durationColor = duration > 1000 ? "\x1b[33m" : "\x1b[32m"; // Yellow if slow, green otherwise

      console.log(
        `${logEntry.timestamp} | ${statusColor}${logEntry.method.padEnd(7)}\x1b[0m ${logEntry.url} | ${statusColor}${logEntry.status}\x1b[0m | ${durationColor}${duration}ms\x1b[0m`,
      );

      // Log slow requests as warnings
      if (duration > 2000) {
        console.warn(`[Slow Request] ${req.method} ${req.url} took ${duration}ms`);
      }
    });

    next();
  };
}

function getStatusColor(status: number): string {
  if (status >= 500) return "\x1b[31m"; // Red for 5xx
  if (status >= 400) return "\x1b[33m"; // Yellow for 4xx
  if (status >= 300) return "\x1b[36m"; // Cyan for 3xx
  return "\x1b[32m"; // Green for 2xx
}

/**
 * Error logging middleware
 * Should be registered after all routes
 */
export function errorLogger() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    console.error(`  Message: ${err.message}`);
    console.error(`  Stack: ${err.stack}`);

    // Don't expose stack traces in production
    const isProduction = process.env.NODE_ENV === "production";

    res.status(500).json({
      success: false,
      message: isProduction ? "Internal server error" : err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    });
  };
}
