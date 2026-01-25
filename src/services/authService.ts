import argon2 from "argon2";
import { randomBytes } from "crypto";
import * as jwt from "jsonwebtoken";
import env from "../config/env";
import getPrismaClient from "../config/postgresConfig";

const prisma = getPrismaClient();

export interface RegisterInput {
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; nickname: string };
}

function signAccessToken(userId: string): string {
  const token = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + durationMs(env.accessTokenTtl) / 1000,
  };
  return jwt.sign(token, env.jwtAccessSecret);
}

function signRefreshToken(userId: string): string {
  const token = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + durationMs(env.refreshTokenTtl) / 1000,
  };
  return jwt.sign(token, env.jwtRefreshSecret);
}

export const authService = {
  async register({ email, password, nickname }: RegisterInput) {
    const existing = await (prisma as any).user.findFirst({ where: { email } });
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        email,
        nickname: nickname || email.split("@")[0],
        passwordHash,
      },
    });
    return { id: user.id, email: user.email, nickname: user.nickname };
  },

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await (prisma as any).user.findFirst({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new Error("Invalid credentials");

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Store hashed refresh token for revocation/rotation detection
    const tokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(Date.now() + durationMs(env.refreshTokenTtl));
    await (prisma as any).refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, nickname: user.nickname } };
  },

  async refresh(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify signature
    let payload: any;
    try {
      payload = jwt.verify(oldRefreshToken, env.jwtRefreshSecret) as { sub: string };
    } catch {
      throw new Error("Invalid refresh token");
    }

    const userId = payload.sub;
    // Find any valid stored token that matches via hash
    const tokens = await (prisma as any).refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let valid = false;
    for (const t of tokens) {
      if (await argon2.verify(t.tokenHash, oldRefreshToken)) {
        valid = true;
        // revoke the old token
        await (prisma as any).refreshToken.update({ where: { id: t.id }, data: { revokedAt: new Date() } });
        break;
      }
    }
    if (!valid) throw new Error("Invalid refresh token");

    const accessToken = signAccessToken(userId);
    const newRefreshToken = signRefreshToken(userId);
    const tokenHash = await argon2.hash(newRefreshToken);
    const expiresAt = new Date(Date.now() + durationMs(env.refreshTokenTtl));
    await (prisma as any).refreshToken.create({ data: { userId, tokenHash, expiresAt } });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    try {
      const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { sub: string };
      const tokens = await (prisma as any).refreshToken.findMany({ where: { userId: payload.sub, revokedAt: null } });
      for (const t of tokens) {
        if (await argon2.verify(t.tokenHash, refreshToken)) {
          await (prisma as any).refreshToken.update({ where: { id: t.id }, data: { revokedAt: new Date() } });
          break;
        }
      }
    } catch {
      // ignore
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string; code: string }> {
    const user = await (prisma as any).user.findFirst({ where: { email } });
    // Always act as if success (to avoid enumeration)
    const code = generateOtp();
    if (user) {
      const codeHash = await argon2.hash(code);
      const expiresAt = new Date(Date.now() + env.passwordResetTtlMinutes * 60 * 1000);
      await (prisma as any).passwordResetToken.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt,
        },
      });
    }
    return { message: "If the email exists, a reset code has been generated.", code };
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await (prisma as any).user.findFirst({ where: { email } });
    if (!user) return; // generic

    const tokens = await (prisma as any).passwordResetToken.findMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { requestedAt: "desc" },
      take: 5,
    });

    let matched: string | null = null;
    for (const t of tokens) {
      // limit attempts
      if (t.attemptCount >= 5) continue;
      const ok = await argon2.verify(t.codeHash, code);
      await (prisma as any).passwordResetToken.update({ where: { id: t.id }, data: { attemptCount: { increment: 1 } } });
      if (ok) {
        matched = t.id;
        break;
      }
    }
    if (!matched) throw new Error("Invalid or expired code");

    const passwordHash = await argon2.hash(newPassword);
    await (prisma as any).user.update({ where: { id: user.id }, data: { passwordHash } });

    // mark used and revoke all refresh tokens
    await (prisma as any).passwordResetToken.update({ where: { id: matched }, data: { usedAt: new Date() } });
    await (prisma as any).refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  },
};

function generateOtp(): string {
  // 6-digit numeric code
  const n = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return n.toString().padStart(6, "0");
}

function durationMs(input: string): number {
  const m = input.match(/^(\d+)([smhdw])$/);
  if (!m) return 60 * 60 * 1000; // default 1h
  const value = Number(m[1]);
  const unit = m[2];
  const mult: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return value * (mult[unit] ?? 60 * 60 * 1000);
}

export default authService;
