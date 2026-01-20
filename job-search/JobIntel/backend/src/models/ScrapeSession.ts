import mongoose, { Schema, Document } from 'mongoose';

export interface IScrapeSession extends Document {
  sessionId: string; // UUID for tracking
  bucketsRequested: string[]; // All 11 buckets
  bucketsCompleted: string[];
  bucketsFailed: string[];

  // Status
  status: 'in_progress' | 'completed' | 'failed' | 'partial';

  // Statistics
  totalApiCalls: number;
  totalJobsFound: number;
  countryJobsFound: number;
  countryJobsAdded: number;
  newJobsAdded: number;
  jobsUpdated: number;

  // Timing
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;

  // Context
  triggeredBy: string; // 'admin' or 'scheduler' or 'user'
  triggeredByUserId?: string;
  filterIndianJobs?: boolean;
  country?: string; // ISO country code used for API (e.g., 'in')
  originalCountry?: string; // Original user-friendly country name (e.g., 'India')
  location?: string;

  // Error tracking
  errorMessage?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const ScrapeSessionSchema = new Schema<IScrapeSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },

    bucketsRequested: [{ type: String }],
    bucketsCompleted: [{ type: String }],
    bucketsFailed: [{ type: String }],

    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed', 'partial'],
      default: 'in_progress',
      index: true,
    },

    totalApiCalls: { type: Number, default: 0 },
    totalJobsFound: { type: Number, default: 0 },
    countryJobsFound: { type: Number, default: 0 },
    countryJobsAdded: { type: Number, default: 0 },
    newJobsAdded: { type: Number, default: 0 },
    jobsUpdated: { type: Number, default: 0 },

    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    durationMs: Number,

    triggeredBy: { type: String, enum: ['admin', 'scheduler', 'user'], default: 'admin' },
    triggeredByUserId: String,
    filterIndianJobs: { type: Boolean, default: true },
    country: { type: String, default: 'in' }, // ISO country code (e.g., 'in' for India)
    originalCountry: { type: String, default: 'India' }, // User-friendly name
    location: { type: String, default: 'India' },

    errorMessage: String,
  },
  { timestamps: true }
);

// Indexes for querying
ScrapeSessionSchema.index({ startedAt: -1 });
ScrapeSessionSchema.index({ status: 1, startedAt: -1 });
ScrapeSessionSchema.index({ triggeredBy: 1, startedAt: -1 });
ScrapeSessionSchema.index({ filterIndianJobs: 1 });

export default mongoose.model<IScrapeSession>('ScrapeSession', ScrapeSessionSchema);
