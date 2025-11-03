import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "1h",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "30d",
  passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
};

export default env;
