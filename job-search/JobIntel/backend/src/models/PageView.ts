import mongoose from "mongoose";

const { Schema } = mongoose;

export interface IPageView extends mongoose.Document {
  userId?: string;
  page: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  sessionId?: string;
}

const PageViewSchema = new Schema<IPageView>(
  {
    userId: { type: String, index: true },
    page: { type: String, required: true, index: true },
    referrer: String,
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Index for efficient querying
PageViewSchema.index({ timestamp: -1 });
PageViewSchema.index({ page: 1, timestamp: -1 });

export const PageView = mongoose.model<IPageView>("PageView", PageViewSchema);
