import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;

  // Channel preferences
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly' | 'never';
    maxPerDay: number;
  };
  whatsapp: {
    enabled: boolean;
    phoneNumber?: string;
    frequency: 'instant' | 'daily' | 'weekly' | 'never';
    maxPerDay: number;
  };
  telegram: {
    enabled: boolean;
    chatId?: string;
    frequency: 'instant' | 'daily' | 'weekly' | 'never';
    maxPerDay: number;
  };

  // Notification type preferences
  notificationTypes: {
    newMatches: boolean;
    skillRecommendations: boolean;
    applicationReminders: boolean;
    summaryReports: boolean;
    jobAlerts: boolean;
  };

  // Additional settings
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;

  timezone?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    email: {
      enabled: { type: Boolean, default: true },
      frequency: { type: String, enum: ['instant', 'daily', 'weekly', 'never'], default: 'daily' },
      maxPerDay: { type: Number, default: 5 },
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      phoneNumber: String,
      frequency: { type: String, enum: ['instant', 'daily', 'weekly', 'never'], default: 'daily' },
      maxPerDay: { type: Number, default: 3 },
    },
    telegram: {
      enabled: { type: Boolean, default: false },
      chatId: String,
      frequency: { type: String, enum: ['instant', 'daily', 'weekly', 'never'], default: 'daily' },
      maxPerDay: { type: Number, default: 3 },
    },

    notificationTypes: {
      newMatches: { type: Boolean, default: true },
      skillRecommendations: { type: Boolean, default: true },
      applicationReminders: { type: Boolean, default: true },
      summaryReports: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: false },
    },

    quiet_hours_enabled: { type: Boolean, default: false },
    quiet_hours_start: String,
    quiet_hours_end: String,

    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

export default mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);
