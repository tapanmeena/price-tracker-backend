import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Validate required environment variables in production
function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || "";
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,

  // JWT secrets - required in production
  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET", isProduction ? undefined : "dev-access-secret-change-in-production"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET", isProduction ? undefined : "dev-refresh-secret-change-in-production"),

  // Token TTL
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "1h",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "30d",

  // Password reset
  passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15),

  // CORS
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean),

  // Database
  databaseUrl: requireEnv("DATABASE_URL", isProduction ? undefined : "postgresql://localhost:5432/pricetracker"),

  // Redis (optional - for distributed rate limiting)
  redisUrl: process.env.REDIS_URL,

  // Server
  port: parseInt(process.env.PORT || "3001", 10),
};

// Log warning for insecure defaults in development
if (!isProduction) {
  if (env.jwtAccessSecret.includes("dev-")) {
    console.warn("⚠️  Using development JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production.");
  }
}

export default env;
