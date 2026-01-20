import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedJob extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;

  // User note
  userNote?: string;

  // Status
  savedAt: Date;
  appliedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const SavedJobSchema = new Schema<ISavedJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },

    userNote: String,

    savedAt: { type: Date, default: Date.now },
    appliedAt: Date,
  },
  { timestamps: true }
);

// Unique compound index for userId + jobId
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Index for queries
SavedJobSchema.index({ userId: 1, savedAt: -1 });

export default mongoose.model<ISavedJob>('SavedJob', SavedJobSchema);
