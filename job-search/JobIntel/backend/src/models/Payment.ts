import mongoose from 'mongoose';
const { Schema } = mongoose;

export interface IPayment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  amount: number; // in paise
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed';
  notes?: any;
}

const PaymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: Number,
  currency: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  notes: Schema.Types.Mixed,
}, { timestamps: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
