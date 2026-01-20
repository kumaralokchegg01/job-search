import { Router } from "express";
import {
  getVisitorAnalytics,
  getRealtimeVisitors,
  getPageAnalytics,
  trackEvent,
} from "../controllers/analyticsController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// All analytics endpoints require admin authentication
router.use(authenticateToken);
router.use(requireRole("admin"));

// Get visitor analytics with time range
router.get("/visitors", getVisitorAnalytics);

// Get real-time visitor count
router.get("/realtime", getRealtimeVisitors);

// Get page-specific analytics
router.get("/pages", getPageAnalytics);

// Track custom events
router.post("/track-event", trackEvent);

export default router;
