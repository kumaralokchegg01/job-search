import mongoose, { Schema, Document } from 'mongoose';

export interface IScrapingLog extends Document {
  taskId?: mongoose.Types.ObjectId;
  bucket: string;

  // Execution
  startTime: Date;
  endTime?: Date;
  duration?: number;

  // Results
  jobsFound: number;
  jobsAdded: number;
  jobsUpdated: number;
  duplicates: number;

  // Status
  status: 'in_progress' | 'completed' | 'failed';
  errorMessage?: string;

  // API Usage
  apiCallsUsed: number;
  remainingBudget: number;

  // Details
  details?: {
    keywords: string[];
    filters?: Record<string, any>;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

const ScrapingLogSchema = new Schema<IScrapingLog>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'ScrapeTask' },
    bucket: { type: String, required: true, index: true },

    startTime: { type: Date, default: Date.now },
    endTime: Date,
    duration: Number,

    jobsFound: { type: Number, default: 0 },
    jobsAdded: { type: Number, default: 0 },
    jobsUpdated: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress',
      index: true,
    },
    errorMessage: String,

    apiCallsUsed: { type: Number, default: 1 },
    remainingBudget: { type: Number, default: 200 },

    details: {
      keywords: [String],
      filters: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Index for queries
ScrapingLogSchema.index({ bucket: 1, createdAt: -1 });

export default mongoose.model<IScrapingLog>('ScrapingLog', ScrapingLogSchema);
