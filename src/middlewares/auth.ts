import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";

export interface AuthPayload {
  sub: string; // userId
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }

    const payload = jwt.verify(token, env.jwtAccessSecret) as AuthPayload;
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}
