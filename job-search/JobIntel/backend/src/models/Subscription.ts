import mongoose from 'mongoose';
const { Schema } = mongoose;

export interface ISubscription extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  plan: string;
  startDate: Date;
  expiresAt: Date;
  active: boolean;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, required: true },
  startDate: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
