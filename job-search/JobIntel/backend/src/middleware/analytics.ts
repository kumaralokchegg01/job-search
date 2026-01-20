import { Request, Response, NextFunction } from "express";
import { PageView } from "../models/PageView";
import { Visitor } from "../models/Visitor";
import crypto from "crypto";

// Generate or retrieve session ID from cookies
export function getOrCreateSessionId(req: Request, res: Response): string {
  let sessionId = req.cookies?.sessionId;
  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString("hex");
    res.cookie("sessionId", sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return sessionId;
}

// Middleware to track page views
export async function trackPageView(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = getOrCreateSessionId(req, res);
    const page = req.path;
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;
    const userId = (req as any).user?.id;
    const referrer = req.headers.referer || undefined;

    // Record page view
    await PageView.create({
      userId,
      page,
      referrer,
      userAgent,
      ipAddress,
      sessionId,
      timestamp: new Date(),
    });

    // Update or create visitor record
    const visitor = await Visitor.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          lastVisit: new Date(),
          userId,
          userAgent,
          ipAddress,
        },
        $inc: { pageCount: 1 },
        $addToSet: { pages: page },
      },
      { upsert: true, new: true }
    );

    // Attach visitor info to request for use in other middleware
    (req as any).visitorId = visitor._id;
    (req as any).sessionId = sessionId;

    res.on("finish", () => {
      // Track on response finish to capture status codes etc
      console.debug(`[Analytics] ${req.method} ${page} - Visitor: ${sessionId.slice(0, 8)}`);
    });
  } catch (error) {
    console.warn("Failed to track page view:", error);
  }

  next();
}

// Track user clicks
export async function trackClick(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = (req as any).sessionId;
    const clickData = req.body;

    if (sessionId) {
      // Update visitor click count
      await Visitor.findOneAndUpdate(
        { sessionId },
        { $inc: { clickCount: 1 } },
        { upsert: true }
      );

      console.debug(`[Analytics] Click tracked for session: ${sessionId.slice(0, 8)}`);
    }
  } catch (error) {
    console.warn("Failed to track click:", error);
  }

  next();
}
