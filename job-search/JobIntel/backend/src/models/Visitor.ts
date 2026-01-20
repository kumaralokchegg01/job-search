import mongoose from "mongoose";

const { Schema } = mongoose;

export interface IVisitor extends mongoose.Document {
  sessionId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  firstVisit: Date;
  lastVisit: Date;
  pageCount: number;
  clickCount: number;
  pages: string[];
}

const VisitorSchema = new Schema<IVisitor>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: String,
    ipAddress: String,
    userAgent: String,
    firstVisit: { type: Date, default: Date.now, index: true },
    lastVisit: { type: Date, default: Date.now, index: true },
    pageCount: { type: Number, default: 1 },
    clickCount: { type: Number, default: 0 },
    pages: [String],
  },
  { timestamps: true }
);

// Index for efficient querying
VisitorSchema.index({ lastVisit: -1 });
VisitorSchema.index({ firstVisit: -1 });

export const Visitor = mongoose.model<IVisitor>("Visitor", VisitorSchema);
