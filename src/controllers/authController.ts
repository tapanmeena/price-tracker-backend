import { Request, Response } from "express";
import { z } from "zod";
import authService from "../services/authService";
import env from "../config/env";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  nickname: z.string().min(2).max(50).optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const requestResetSchema = z.object({ email: z.email() });
const resetSchema = z.object({ email: z.email(), code: z.string().length(6), newPassword: z.string().min(8) });

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/api/auth",
    // Max-Age derived from TTL: browsers respect Expires
  });
}

export const register = async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    await authService.register(body);
    res.status(201).json({ success: true, message: "Registration successful" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    const status = message.includes("already") ? 409 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ success: true, accessToken: result.accessToken, data: result.user });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = (req.cookies?.refreshToken as string | undefined) || (req.body?.refreshToken as string | undefined);
    if (!token) return res.status(401).json({ success: false, message: "Missing refresh token" });

    const { accessToken, refreshToken } = await authService.refresh(token);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, accessToken });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = (req.cookies?.refreshToken as string | undefined) || (req.body?.refreshToken as string | undefined);
  await authService.logout(token);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(200).json({ success: true });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = requestResetSchema.parse(req.body);
    const { message, code } = await authService.requestPasswordReset(email);
    // For now, log OTP to server console for testing
    console.log(`Password reset OTP for ${email}: ${code}`);
    res.status(200).json({ success: true, message });
  } catch {
    res.status(400).json({ success: false, message: "Invalid request" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = resetSchema.parse(req.body);
    await authService.resetPassword(email, code, newPassword);
    res.status(200).json({ success: true, message: "Password has been reset" });
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid or expired code" });
  }
};
