import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: string; // Email of user who performed action
  action: string; // Type of action
  meta?: any; // Additional metadata
  ipAddress?: string; // IP address of requester
  userAgent?: string; // User agent
  status?: 'success' | 'failed' | 'pending'; // Action status
  errorMessage?: string; // Error message if failed
  duration?: number; // Duration in milliseconds
  createdAt?: Date;
  updatedAt?: Date;
}

const AuditSchema: Schema = new Schema(
  {
    actor: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Auth actions
        'login',
        'logout',
        'login_failed',
        'password_change',
        'password_reset',
        
        // Job actions
        'create_job',
        'update_job',
        'delete_job',
        'publish_job',
        'unpublish_job',
        'approve_job',
        'reject_job',
        
        // Admin actions
        'admin_login',
        'admin_logout',
        'admin_create_user',
        'admin_delete_user',
        'admin_update_user',
        
        // Scraping actions
        'scrape_started',
        'scrape_completed',
        'scrape_failed',
        
        // Search actions
        'search_executed',
        'search_saved',
        'search_exported',
        
        // Salary actions
        'salary_query',
        'salary_estimate_requested',
        'company_salary_requested',
        
        // GDPR actions
        'gdpr_delete',
        'gdpr_export',
        
        // Notification actions
        'notification_sent',
        'notification_failed',
        
        // Payment actions
        'payment_initiated',
        'payment_completed',
        'payment_failed',
        
        // System actions
        'system_backup',
        'system_restore',
        'config_changed',
      ],
      index: true,
    },
    meta: { 
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success',
      index: true,
    },
    errorMessage: String,
    duration: Number, // milliseconds
  },
  { 
    timestamps: true,
    collection: 'auditlogs',
  }
);

// Create indexes for common queries
AuditSchema.index({ createdAt: -1 });
AuditSchema.index({ action: 1, createdAt: -1 });
AuditSchema.index({ actor: 1, createdAt: -1 });
AuditSchema.index({ status: 1, createdAt: -1 });
AuditSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 } // Auto-delete after 90 days
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditSchema);

export default AuditLog;
