import mongoose, { Schema, Document } from 'mongoose';

export interface IApiUsage extends Document {
  userId: mongoose.Types.ObjectId;

  // Monthly Tracking
  callsThisMonth: number;
  monthStartDate: Date;
  lastCallDate?: Date;

  // Budget
  hardLimit: number;
  warningThreshold: number;

  // History
  callHistory: Array<{
    timestamp: Date;
    endpoint: string;
    buckets: string[];
    jobsReturned: number;
  }>;

  // Status
  limitExceeded: boolean;
  lastWarningDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const ApiUsageSchema = new Schema<IApiUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    callsThisMonth: { type: Number, default: 0 },
    monthStartDate: { type: Date, default: () => new Date() },
    lastCallDate: Date,

    hardLimit: { type: Number, default: 200 },
    warningThreshold: { type: Number, default: 160 }, // 80% of 200

    callHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        endpoint: String,
        buckets: [String],
        jobsReturned: { type: Number, default: 0 },
      },
    ],

    limitExceeded: { type: Boolean, default: false, index: true },
    lastWarningDate: Date,
  },
  { timestamps: true }
);

// Index for queries
ApiUsageSchema.index({ limitExceeded: 1 });

export default mongoose.model<IApiUsage>('ApiUsage', ApiUsageSchema);
