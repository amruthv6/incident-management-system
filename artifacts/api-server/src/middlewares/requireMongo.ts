import type { Request, Response, NextFunction } from "express";
import { isMongoConnected, connectionError } from "../lib/mongodb";

export function requireMongo(req: Request, res: Response, next: NextFunction) {
  if (!isMongoConnected()) {
    const msg = connectionError?.message ?? "MongoDB not connected";
    res.status(503).json({ error: `Service unavailable: ${msg}` });
    return;
  }
  next();
}
