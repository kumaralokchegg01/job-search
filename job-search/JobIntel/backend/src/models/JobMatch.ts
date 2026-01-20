import mongoose, { Schema, Document } from 'mongoose';

export interface IJobMatch extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;

  // 6-Factor Scores (0-100 each)
  scores: {
    skill: number;
    role: number;
    level: number;
    experience: number;
    location: number;
    workMode: number;
  };

  // Derived
  totalScore: number;
  matchType: 'excellent' | 'good' | 'okay' | 'poor';

  // Detailed Breakdown (for transparency)
  breakdown: {
    skillsMatched: string[];
    skillsMissing: string[];
    roleMatch: string;
    levelMatch: string;
    locationNote: string;
  };

  // Status
  status: 'matched' | 'viewed' | 'applied' | 'rejected';
  viewedAt?: Date;
  appliedAt?: Date;

  confidence: number;

  createdAt?: Date;
  updatedAt?: Date;
}

const JobMatchSchema = new Schema<IJobMatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },

    scores: {
      skill: { type: Number, min: 0, max: 40, default: 0 },
      role: { type: Number, min: 0, max: 20, default: 0 },
      level: { type: Number, min: 0, max: 15, default: 0 },
      experience: { type: Number, min: 0, max: 10, default: 0 },
      location: { type: Number, min: 0, max: 10, default: 0 },
      workMode: { type: Number, min: 0, max: 5, default: 0 },
    },

    totalScore: { type: Number, min: 0, max: 100, default: 0, index: true },
    matchType: {
      type: String,
      enum: ['excellent', 'good', 'okay', 'poor'],
      default: 'okay',
      index: true,
    },

    breakdown: {
      skillsMatched: [String],
      skillsMissing: [String],
      roleMatch: String,
      levelMatch: String,
      locationNote: String,
    },

    status: {
      type: String,
      enum: ['matched', 'viewed', 'applied', 'rejected'],
      default: 'matched',
      index: true,
    },
    viewedAt: Date,
    appliedAt: Date,

    confidence: { type: Number, min: 0, max: 100, default: 75 },
  },
  { timestamps: true }
);

// Unique compound index for userId + jobId
JobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Index for sorting by score
JobMatchSchema.index({ userId: 1, totalScore: -1 });

export default mongoose.model<IJobMatch>('JobMatch', JobMatchSchema);
