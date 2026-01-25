import { Router } from "express";
import { login, logout, refresh, register, requestPasswordReset, resetPassword } from "../controllers/authController";
import { simpleRateLimit } from "../middlewares/rateLimit";

const authRouter = Router();

// Rate limit sensitive routes
const authLimiter = simpleRateLimit({ windowMs: 60_000, max: 20 });
const strictLimiter = simpleRateLimit({ windowMs: 60_000, max: 10 });

authRouter.post("/register", authLimiter, register);
authRouter.post("/login", strictLimiter, login);
authRouter.post("/logout", authLimiter, logout);
authRouter.post("/refresh", authLimiter, refresh);

authRouter.post("/request-password-reset", strictLimiter, requestPasswordReset);
authRouter.post("/reset-password", strictLimiter, resetPassword);

export default authRouter;
