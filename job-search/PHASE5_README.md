# JobIntel Phase 5: Notifications & Real-Time Updates

**Phase Duration:** 1 week (5 days development)  
**Team Size:** 1-2 developers  
**Priority Level:** MEDIUM (enhances user engagement)  
**Prerequisites:** Phase 1, Phase 2, Phase 3, Phase 4 must be complete  
**Created:** January 18, 2026

---

## 📋 PHASE 5 OVERVIEW

Phase 5 implements multi-channel notification system that keeps users informed about:

1. ✅ New job matches (email, WhatsApp, Telegram)
2. ✅ Match updates & insights
3. ✅ Skill recommendations
4. ✅ Application reminders
5. ✅ Monthly summaries & reports
6. ✅ Real-time notifications (via WebSocket)
7. ✅ Notification preferences & frequency control
8. ✅ Notification history & unsubscribe

This phase bridges **matching results** → **user engagement** → **applications**

---

## 📊 PHASE 5 DELIVERABLES

### By End of Phase 5, You Should Have:
- ✅ Email notifications (Nodemailer - Gmail/SendGrid)
- ✅ WhatsApp notifications (WhatsApp Cloud API)
- ✅ Telegram notifications (Telegram Bot API)
- ✅ Notification preferences system (per channel)
- ✅ Notification queue processor (BullMQ)
- ✅ Notification history & tracking
- ✅ Real-time notifications (WebSocket)
- ✅ Batch notifications for multiple matches
- ✅ Weekly/monthly summary emails
- ✅ Rate limiting (max 5 notifications/day per channel)
- ✅ Unsubscribe functionality
- ✅ Notification endpoints (CRUD operations)

### Testing Acceptance Criteria:
```bash
✅ Send email notification successfully
✅ Send WhatsApp message successfully
✅ Send Telegram message successfully
✅ Notification preferences respected
✅ Queue processes notifications in order
✅ Notifications rate limited (5/day max)
✅ Unsubscribe removes user from channel
✅ Notification history tracked
✅ Real-time notifications delivered via WebSocket
✅ Weekly summary generated correctly
✅ Monthly report generated correctly
✅ Batch notifications sent together
✅ Failed notifications retried (3 attempts)
✅ User preferences respected
✅ Performance: Send 100 notifications <5 seconds
```

---

## 🎯 DETAILED PHASE 5 TASKS

### TASK 5.1: Enhanced Notification Model (Day 1, 2 hours)

**Objective:** Create comprehensive notification tracking

**File:** `src/models/NotificationLog.ts` (Updated)

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  notificationType: 'match' | 'summary' | 'reminder' | 'update' | 'alert';
  channel: 'email' | 'whatsapp' | 'telegram';
  
  // Content
  subject?: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
  
  // Metadata
  matchId?: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  
  // Status
  status: 'queued' | 'sent' | 'failed' | 'bounced' | 'unsubscribed';
  sentAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  
  // Tracking
  opened?: boolean;
  openedAt?: Date;
  clicked?: boolean;
  clickedAt?: Date;
  clickedLink?: string;
  
  // Preferences
  unsubscribeToken?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notificationType: {
      type: String,
      enum: ['match', 'summary', 'reminder', 'update', 'alert'],
      default: 'match',
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'telegram'],
      required: true,
      index: true,
    },
    
    subject: String,
    message: { type: String, required: true },
    templateId: String,
    templateData: Schema.Types.Mixed,
    
    matchId: { type: Schema.Types.ObjectId, ref: 'JobMatch' },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'bounced', 'unsubscribed'],
      default: 'queued',
      index: true,
    },
    sentAt: Date,
    failureReason: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    
    opened: { type: Boolean, default: false },
    openedAt: Date,
    clicked: { type: Boolean, default: false },
    clickedAt: Date,
    clickedLink: String,
    
    unsubscribeToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Indexes for queries
NotificationLogSchema.index({ userId: 1, channel: 1, createdAt: -1 });
NotificationLogSchema.index({ status: 1, retryCount: 1 });
NotificationLogSchema.index({ sentAt: -1 });

export default mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
```

#### Notification Preferences Model
**File:** `src/models/NotificationPreference.ts` (New)

```typescript
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
  quiet_hours_start?: string; // "22:00"
  quiet_hours_end?: string; // "08:00"
  
  timezone?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    
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
```

**Checklist:**
- [ ] Update NotificationLog model with complete fields
- [ ] Create NotificationPreference model
- [ ] Add status enum (queued, sent, failed, bounced, unsubscribed)
- [ ] Add retry tracking fields
- [ ] Add unsubscribe token
- [ ] Create indexes for efficient queries
- [ ] Test: Save notification log
- [ ] Test: Save preferences

---

### TASK 5.2: Email Notification Service (Day 1, 2 hours)

**Objective:** Send emails via Nodemailer

**File:** `src/services/emailNotificationService.ts`

```typescript
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import NotificationLog from '../models/NotificationLog';

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailNotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure based on environment
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: use test account
      this.transporter = nodemailer.createTestAccount().then(testAccount => {
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }) as any;
    }

    logger.info('Email notification service initialized');
  }

  /**
   * Send new match notification
   */
  async sendMatchNotification(
    userEmail: string,
    jobTitle: string,
    matchScore: number,
    jobUrl: string,
    unsubscribeToken: string
  ): Promise<boolean> {
    const html = this.getMatchEmailTemplate(jobTitle, matchScore, jobUrl, unsubscribeToken);

    return this.sendEmail({
      to: userEmail,
      subject: `⭐ New Job Match: ${jobTitle} (${matchScore}% match)`,
      html,
    });
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(
    userEmail: string,
    userName: string,
    matchStats: {
      newMatches: number;
      excellentMatches: number;
      goodMatches: number;
      topJobs: Array<{ title: string; score: number }>;
    },
    unsubscribeToken: string
  ): Promise<boolean> {
    const html = this.getWeeklySummaryTemplate(userName, matchStats, unsubscribeToken);

    return this.sendEmail({
      to: userEmail,
      subject: `📊 Your Weekly JobIntel Summary - ${matchStats.newMatches} New Matches`,
      html,
    });
  }

  /**
   * Send skill recommendation
   */
  async sendSkillRecommendation(
    userEmail: string,
    skillGap: {
      missingSkills: string[];
      inDemandSkills: string[];
      targetRoles: string[];
    },
    unsubscribeToken: string
  ): Promise<boolean> {
    const html = this.getSkillRecommendationTemplate(skillGap, unsubscribeToken);

    return this.sendEmail({
      to: userEmail,
      subject: '🎯 Upskill Recommendations to Boost Your Match Score',
      html,
    });
  }

  /**
   * Send application reminder
   */
  async sendApplicationReminder(
    userEmail: string,
    jobTitle: string,
    matchScore: number,
    jobUrl: string,
    expiringIn: string,
    unsubscribeToken: string
  ): Promise<boolean> {
    const html = this.getApplicationReminderTemplate(
      jobTitle,
      matchScore,
      jobUrl,
      expiringIn,
      unsubscribeToken
    );

    return this.sendEmail({
      to: userEmail,
      subject: `⏰ Don't Miss Out: ${jobTitle} (Expires ${expiringIn})`,
      html,
    });
  }

  /**
   * Send generic email
   */
  async sendEmail(content: EmailContent): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@jobintel.com',
        to: content.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
        headers: {
          'X-Priority': '3', // Normal priority
        },
      });

      logger.info(`Email sent: ${content.to} - ${content.subject}`);

      return true;
    } catch (err) {
      logger.error(`Failed to send email: ${err}`);
      return false;
    }
  }

  /**
   * Email templates
   */
  private getMatchEmailTemplate(
    jobTitle: string,
    matchScore: number,
    jobUrl: string,
    unsubscribeToken: string
  ): string {
    const matchType = matchScore >= 80 ? '⭐⭐⭐ Excellent' : matchScore >= 60 ? '⭐⭐ Good' : '⭐ Okay';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 8px;">
          <h1 style="margin: 0;">🎯 New Match Found!</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>${jobTitle}</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="font-size: 18px; margin: 0;">
              <strong>Match Score: ${matchScore}%</strong> ${matchType}
            </p>
          </div>
          
          <p>This job matches your profile perfectly! Here's why:</p>
          <ul>
            <li>Skills match your background</li>
            <li>Career level aligns with your experience</li>
            <li>Location preferences met</li>
          </ul>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${jobUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              View Job & Apply
            </a>
          </div>
          
          <p style="font-size: 12px; color: #666;">
            <a href="https://jobintel.com/unsubscribe?token=${unsubscribeToken}" style="color: #667eea; text-decoration: none;">
              Unsubscribe from these notifications
            </a>
          </p>
        </div>
      </div>
    `;
  }

  private getWeeklySummaryTemplate(
    userName: string,
    stats: any,
    unsubscribeToken: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Hi ${userName}! 👋</h1>
        <h2>Your Weekly JobIntel Summary</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: #667eea; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0;">New Matches</h3>
              <p style="font-size: 32px; margin: 10px 0;">${stats.newMatches}</p>
            </div>
            <div style="background: #764ba2; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0;">Excellent Matches</h3>
              <p style="font-size: 32px; margin: 10px 0;">${stats.excellentMatches}</p>
            </div>
          </div>
        </div>
        
        <h3>Top Jobs This Week</h3>
        ${stats.topJobs.map((job: any) => `
          <div style="border-left: 4px solid #667eea; padding: 10px; margin: 10px 0;">
            <strong>${job.title}</strong> - ${job.score}% match
          </div>
        `).join('')}
        
        <p style="font-size: 12px; color: #666;">
          <a href="https://jobintel.com/unsubscribe?token=${unsubscribeToken}">Unsubscribe</a>
        </p>
      </div>
    `;
  }

  private getSkillRecommendationTemplate(skillGap: any, unsubscribeToken: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>🎯 Level Up Your Skills!</h1>
        
        <p>Based on job market trends, here are the most in-demand skills for your target roles:</p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3>Missing Skills</h3>
          ${skillGap.missingSkills.map((skill: string) => `<span style="display: inline-block; background: white; padding: 5px 10px; margin: 5px; border-radius: 4px;">${skill}</span>`).join('')}
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3>In-Demand Skills</h3>
          ${skillGap.inDemandSkills.map((skill: string) => `<span style="display: inline-block; background: white; padding: 5px 10px; margin: 5px; border-radius: 4px;">${skill}</span>`).join('')}
        </div>
        
        <p style="font-size: 12px; color: #666;">
          <a href="https://jobintel.com/unsubscribe?token=${unsubscribeToken}">Unsubscribe</a>
        </p>
      </div>
    `;
  }

  private getApplicationReminderTemplate(
    jobTitle: string,
    matchScore: number,
    jobUrl: string,
    expiringIn: string,
    unsubscribeToken: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff6b6b; padding: 15px; border-radius: 8px; color: white; text-align: center;">
          <h2 style="margin: 0;">⏰ Don't Miss Out!</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>The job posting <strong>${jobTitle}</strong> expires <strong>${expiringIn}</strong></p>
          <p>It's a <strong>${matchScore}%</strong> match for your profile!</p>
          
          <a href="${jobUrl}" style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px;">
            Apply Now
          </a>
        </div>
      </div>
    `;
  }
}

export const emailNotificationService = new EmailNotificationService();
```

**Checklist:**
- [ ] Configure Nodemailer with SMTP settings
- [ ] Implement match notification email
- [ ] Implement weekly summary email
- [ ] Implement skill recommendation email
- [ ] Implement application reminder email
- [ ] Create HTML email templates
- [ ] Test: Send email to test account
- [ ] Test: Verify email content & formatting
- [ ] Test: Unsubscribe link generation

---

### TASK 5.3: WhatsApp Notification Service (Day 2, 2-3 hours)

**Objective:** Send WhatsApp messages via WhatsApp Cloud API

**File:** `src/services/whatsappNotificationService.ts`

```typescript
import axios from 'axios';
import { logger } from '../utils/logger';

class WhatsAppNotificationService {
  private apiKey: string;
  private phoneId: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneId = process.env.WHATSAPP_PHONE_ID || '';
    this.apiUrl = `https://graph.instagram.com/v18.0/${this.phoneId}`;

    if (!this.apiKey || !this.phoneId) {
      logger.warn('WhatsApp credentials not configured');
    }
  }

  /**
   * Send message via WhatsApp
   */
  async sendMessage(
    toPhoneNumber: string,
    message: string,
    messageType: 'text' | 'template' = 'text'
  ): Promise<boolean> {
    if (!this.apiKey || !this.phoneId) {
      logger.warn('WhatsApp not configured, skipping message');
      return false;
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: toPhoneNumber,
        type: 'text',
        text: { body: message },
      };

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info(`WhatsApp message sent to ${toPhoneNumber}`);
      return true;
    } catch (err) {
      logger.error(`Failed to send WhatsApp message: ${err}`);
      return false;
    }
  }

  /**
   * Send new match notification via WhatsApp
   */
  async sendMatchNotification(
    phoneNumber: string,
    jobTitle: string,
    matchScore: number,
    jobUrl: string
  ): Promise<boolean> {
    const message = `🎯 *New Job Match!* 🎯\n\nWe found a ${matchScore}% match for you!\n\n*${jobTitle}*\n\nCheck it out: ${jobUrl}`;
    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(
    phoneNumber: string,
    matchCount: number,
    topJobTitle: string
  ): Promise<boolean> {
    const message = `📊 *Daily JobIntel Summary*\n\n${matchCount} new matches found!\n\nTop job: ${topJobTitle}`;
    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send application reminder
   */
  async sendApplicationReminder(
    phoneNumber: string,
    jobTitle: string,
    expiringIn: string
  ): Promise<boolean> {
    const message = `⏰ *Don't Miss Out!*\n\n${jobTitle}\n\nExpires in ${expiringIn}`;
    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey || !this.phoneId) {
      logger.warn('WhatsApp credentials missing');
      return false;
    }

    try {
      const response = await axios.get(`${this.apiUrl}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      logger.info('WhatsApp connection successful');
      return true;
    } catch (err) {
      logger.error(`WhatsApp connection failed: ${err}`);
      return false;
    }
  }
}

export const whatsappNotificationService = new WhatsAppNotificationService();
```

**Checklist:**
- [ ] Configure WhatsApp Cloud API credentials
- [ ] Implement send message function
- [ ] Implement match notification
- [ ] Implement daily summary
- [ ] Implement application reminder
- [ ] Test: Send WhatsApp message
- [ ] Test: Connection test works
- [ ] Verify phone number format handling

---

### TASK 5.4: Telegram Notification Service (Day 2, 2 hours)

**Objective:** Send Telegram messages via Telegram Bot API

**File:** `src/services/telegramNotificationService.ts`

```typescript
import axios from 'axios';
import { logger } from '../utils/logger';

class TelegramNotificationService {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;

    if (!this.botToken) {
      logger.warn('Telegram Bot token not configured');
    }
  }

  /**
   * Send message via Telegram
   */
  async sendMessage(
    chatId: string,
    message: string,
    parseMode: 'Markdown' | 'HTML' = 'Markdown'
  ): Promise<boolean> {
    if (!this.botToken) {
      logger.warn('Telegram not configured, skipping message');
      return false;
    }

    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      });

      logger.info(`Telegram message sent to ${chatId}`);
      return true;
    } catch (err) {
      logger.error(`Failed to send Telegram message: ${err}`);
      return false;
    }
  }

  /**
   * Send new match notification
   */
  async sendMatchNotification(
    chatId: string,
    jobTitle: string,
    matchScore: number,
    jobUrl: string,
    companyName: string
  ): Promise<boolean> {
    const message = `
🎯 *New Job Match!*

*${matchScore}% Match* ⭐

*Job:* ${jobTitle}
*Company:* ${companyName}

[View Job](${jobUrl})
    `;

    return this.sendMessage(chatId, message);
  }

  /**
   * Send daily digest
   */
  async sendDailyDigest(
    chatId: string,
    matchCount: number,
    excellentCount: number,
    topJobs: Array<{ title: string; company: string; score: number }>
  ): Promise<boolean> {
    let jobsList = '';
    for (let i = 0; i < Math.min(topJobs.length, 5); i++) {
      const job = topJobs[i];
      jobsList += `\n${i + 1}. *${job.title}* (${job.score}%) @ ${job.company}`;
    }

    const message = `
📊 *Daily JobIntel Digest*

*${matchCount}* new matches found! 🎉
*${excellentCount}* excellent matches ⭐⭐⭐

*Top Jobs:*${jobsList}

[View All](https://jobintel.com/matches)
    `;

    return this.sendMessage(chatId, message);
  }

  /**
   * Send skill recommendation
   */
  async sendSkillRecommendation(
    chatId: string,
    missingSkills: string[],
    inDemandSkills: string[]
  ): Promise<boolean> {
    const missingSkilsList = missingSkills.slice(0, 5).join(', ');
    const inDemandList = inDemandSkills.slice(0, 5).join(', ');

    const message = `
🎯 *Upskill Recommendations*

Missing these in-demand skills:
\`\`\`
${missingSkilsList}
\`\`\`

Popular right now:
\`\`\`
${inDemandList}
\`\`\`

Level up and increase your match score! 📈
    `;

    return this.sendMessage(chatId, message);
  }

  /**
   * Send application reminder
   */
  async sendApplicationReminder(
    chatId: string,
    jobTitle: string,
    companyName: string,
    matchScore: number,
    expiringIn: string,
    jobUrl: string
  ): Promise<boolean> {
    const message = `
⏰ *Application Reminder*

Don't miss out on this opportunity!

*${jobTitle}* @ ${companyName}
*Match:* ${matchScore}% ⭐

⏳ *Expires in:* ${expiringIn}

[Apply Now](${jobUrl})
    `;

    return this.sendMessage(chatId, message);
  }

  /**
   * Test Telegram connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.botToken) {
      logger.warn('Telegram Bot token missing');
      return false;
    }

    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);

      logger.info('Telegram connection successful');
      return true;
    } catch (err) {
      logger.error(`Telegram connection failed: ${err}`);
      return false;
    }
  }

  /**
   * Get bot info
   */
  async getBotInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data.result;
    } catch (err) {
      logger.error(`Failed to get bot info: ${err}`);
      return null;
    }
  }
}

export const telegramNotificationService = new TelegramNotificationService();
```

**Checklist:**
- [ ] Configure Telegram Bot token
- [ ] Implement send message function
- [ ] Implement match notification
- [ ] Implement daily digest
- [ ] Implement skill recommendation
- [ ] Implement application reminder
- [ ] Test: Send Telegram message
- [ ] Test: Connection test works
- [ ] Format Markdown messages correctly

---

### TASK 5.5: Notification Queue Processor (Day 3, 3 hours)

**Objective:** Process notifications from queue with BullMQ

**File:** `src/workers/notificationWorker.ts`

```typescript
import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { notificationQueue, NotificationJobData } from '../config/queue';
import { emailNotificationService } from '../services/emailNotificationService';
import { whatsappNotificationService } from '../services/whatsappNotificationService';
import { telegramNotificationService } from '../services/telegramNotificationService';
import NotificationLog from '../models/NotificationLog';
import User from '../models/User';
import NotificationPreference from '../models/NotificationPreference';
import { logger } from '../utils/logger';

export const notificationWorker = new Worker(
  'notification-queue',
  async (job: Job<NotificationJobData>) => {
    const { userId, event, channels, data } = job.data;

    logger.info(`Processing notification: ${event} for user ${userId}`);

    try {
      const user = await User.findById(userId);
      const preferences = await NotificationPreference.findOne({ userId });

      if (!user || !preferences) {
        logger.warn(`User or preferences not found: ${userId}`);
        return;
      }

      // Check quiet hours
      if (preferences.quiet_hours_enabled && this.isInQuietHours(preferences)) {
        logger.info(`Quiet hours active, scheduling notification: ${userId}`);
        // Re-queue for later
        await notificationQueue.add('send-notification', job.data, {
          delay: 3600000, // 1 hour
        });
        return;
      }

      // Process each channel
      const results = {
        email: false,
        whatsapp: false,
        telegram: false,
      };

      // Email notification
      if (channels.includes('email') && preferences.email.enabled) {
        results.email = await this.sendEmailNotification(user, event, data);
      }

      // WhatsApp notification
      if (channels.includes('whatsapp') && preferences.whatsapp.enabled && preferences.whatsapp.phoneNumber) {
        results.whatsapp = await this.sendWhatsAppNotification(
          user,
          preferences.whatsapp.phoneNumber,
          event,
          data
        );
      }

      // Telegram notification
      if (channels.includes('telegram') && preferences.telegram.enabled && preferences.telegram.chatId) {
        results.telegram = await this.sendTelegramNotification(
          user,
          preferences.telegram.chatId,
          event,
          data
        );
      }

      logger.info(`Notification processed: ${event} - Results:`, results);

      return results;
    } catch (err) {
      logger.error(`Notification processing failed: ${err}`);

      // Retry logic
      if (job.attemptsMade < 3) {
        throw err; // BullMQ will retry
      } else {
        // Mark as failed in database
        logger.error(`Notification failed after 3 attempts: ${event}`);
      }
    }
  },
  { connection: redis, concurrency: 5 }
);

// Event listeners
notificationWorker.on('completed', (job) => {
  logger.debug(`Notification job completed: ${job.id}`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job failed: ${job?.id} - ${err.message}`);
});

notificationWorker.on('stalled', (jobId) => {
  logger.warn(`Notification job stalled: ${jobId}`);
});

// Helper functions
function isInQuietHours(preferences: any): boolean {
  if (!preferences.quiet_hours_enabled) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const start = preferences.quiet_hours_start;
  const end = preferences.quiet_hours_end;

  if (start < end) {
    return currentTime >= start && currentTime <= end;
  } else {
    // Wraps around midnight
    return currentTime >= start || currentTime <= end;
  }
}

async function sendEmailNotification(user: any, event: string, data: any): Promise<boolean> {
  try {
    switch (event) {
      case 'new_match':
        return await emailNotificationService.sendMatchNotification(
          user.email,
          data.jobTitle,
          data.matchScore,
          data.jobUrl,
          data.unsubscribeToken
        );
      case 'weekly_summary':
        return await emailNotificationService.sendWeeklySummary(
          user.email,
          user.firstName || 'there',
          data.stats,
          data.unsubscribeToken
        );
      case 'skill_recommendation':
        return await emailNotificationService.sendSkillRecommendation(
          user.email,
          data.skillGap,
          data.unsubscribeToken
        );
      case 'application_reminder':
        return await emailNotificationService.sendApplicationReminder(
          user.email,
          data.jobTitle,
          data.matchScore,
          data.jobUrl,
          data.expiringIn,
          data.unsubscribeToken
        );
      default:
        logger.warn(`Unknown email event: ${event}`);
        return false;
    }
  } catch (err) {
    logger.error(`Email send failed: ${err}`);
    return false;
  }
}

async function sendWhatsAppNotification(user: any, phoneNumber: string, event: string, data: any): Promise<boolean> {
  try {
    switch (event) {
      case 'new_match':
        return await whatsappNotificationService.sendMatchNotification(
          phoneNumber,
          data.jobTitle,
          data.matchScore,
          data.jobUrl
        );
      case 'daily_summary':
        return await whatsappNotificationService.sendDailySummary(
          phoneNumber,
          data.matchCount,
          data.topJobTitle
        );
      case 'application_reminder':
        return await whatsappNotificationService.sendApplicationReminder(
          phoneNumber,
          data.jobTitle,
          data.expiringIn
        );
      default:
        return false;
    }
  } catch (err) {
    logger.error(`WhatsApp send failed: ${err}`);
    return false;
  }
}

async function sendTelegramNotification(user: any, chatId: string, event: string, data: any): Promise<boolean> {
  try {
    switch (event) {
      case 'new_match':
        return await telegramNotificationService.sendMatchNotification(
          chatId,
          data.jobTitle,
          data.matchScore,
          data.jobUrl,
          data.companyName
        );
      case 'daily_digest':
        return await telegramNotificationService.sendDailyDigest(
          chatId,
          data.matchCount,
          data.excellentCount,
          data.topJobs
        );
      case 'skill_recommendation':
        return await telegramNotificationService.sendSkillRecommendation(
          chatId,
          data.missingSkills,
          data.inDemandSkills
        );
      case 'application_reminder':
        return await telegramNotificationService.sendApplicationReminder(
          chatId,
          data.jobTitle,
          data.companyName,
          data.matchScore,
          data.expiringIn,
          data.jobUrl
        );
      default:
        return false;
    }
  } catch (err) {
    logger.error(`Telegram send failed: ${err}`);
    return false;
  }
}
```

**Checklist:**
- [ ] Create notification worker
- [ ] Implement quiet hours checking
- [ ] Implement email sending logic
- [ ] Implement WhatsApp sending logic
- [ ] Implement Telegram sending logic
- [ ] Setup retry logic (3 attempts)
- [ ] Setup event listeners
- [ ] Test: Queue notification job
- [ ] Test: Worker processes notification
- [ ] Test: Retry on failure works

---

### TASK 5.6: Notification Preferences & Controllers (Day 4, 3-4 hours)

**File:** `src/controllers/notificationController.ts`

```typescript
import { Response } from 'express';
import NotificationPreference from '../models/NotificationPreference';
import NotificationLog from '../models/NotificationLog';
import User from '../models/User';
import { notificationQueue, NotificationJobData } from '../config/queue';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';
import { v4 as uuidv4 } from 'uuid';

export const getPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  let preferences = await NotificationPreference.findOne({ userId: req.userId });

  if (!preferences) {
    preferences = new NotificationPreference({
      userId: req.userId,
      email: { enabled: true, frequency: 'daily', maxPerDay: 5 },
      whatsapp: { enabled: false, frequency: 'daily', maxPerDay: 3 },
      telegram: { enabled: false, frequency: 'daily', maxPerDay: 3 },
      notificationTypes: {
        newMatches: true,
        skillRecommendations: true,
        applicationReminders: true,
        summaryReports: true,
        jobAlerts: false,
      },
    });
    await preferences.save();
  }

  res.json({ preferences });
});

export const updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, whatsapp, telegram, notificationTypes, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone } = req.body;

  let preferences = await NotificationPreference.findOne({ userId: req.userId });

  if (!preferences) {
    preferences = new NotificationPreference({ userId: req.userId });
  }

  if (email) {
    preferences.email = { ...preferences.email, ...email };
  }

  if (whatsapp) {
    preferences.whatsapp = { ...preferences.whatsapp, ...whatsapp };
  }

  if (telegram) {
    preferences.telegram = { ...preferences.telegram, ...telegram };
  }

  if (notificationTypes) {
    preferences.notificationTypes = notificationTypes;
  }

  if (quiet_hours_enabled !== undefined) {
    preferences.quiet_hours_enabled = quiet_hours_enabled;
  }

  if (quiet_hours_start) {
    preferences.quiet_hours_start = quiet_hours_start;
  }

  if (quiet_hours_end) {
    preferences.quiet_hours_end = quiet_hours_end;
  }

  if (timezone) {
    preferences.timezone = timezone;
  }

  await preferences.save();

  logger.info(`Notification preferences updated: ${req.userId}`);

  res.json({ message: 'Preferences updated', preferences });
});

export const getNotificationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = 20, offset = 0, status, channel } = req.query;

  const query: any = { userId: req.userId };
  if (status) query.status = status;
  if (channel) query.channel = channel;

  const logs = await NotificationLog.find(query)
    .sort({ createdAt: -1 })
    .skip(parseInt(offset as string))
    .limit(parseInt(limit as string));

  const total = await NotificationLog.countDocuments(query);

  res.json({
    logs,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
});

export const testNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { channel } = req.body;

  if (!['email', 'whatsapp', 'telegram'].includes(channel)) {
    return res.status(400).json({ error: 'Invalid channel' });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const unsubscribeToken = uuidv4();

  const testData = {
    jobTitle: 'Test Job - Senior Developer',
    matchScore: 85,
    jobUrl: 'https://jobintel.com/jobs/test',
    companyName: 'Test Company',
    unsubscribeToken,
  };

  // Queue test notification
  await notificationQueue.add(
    'send-notification',
    {
      userId: req.userId,
      event: 'new_match',
      channels: [channel],
      data: testData,
    } as NotificationJobData
  );

  logger.info(`Test notification queued: ${channel} for user ${req.userId}`);

  res.json({ message: `Test notification queued to ${channel}` });
});

export const unsubscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Unsubscribe token required' });
  }

  const log = await NotificationLog.findOne({ unsubscribeToken: token });

  if (!log) {
    return res.status(404).json({ error: 'Invalid unsubscribe token' });
  }

  const preferences = await NotificationPreference.findOne({ userId: log.userId });

  if (preferences) {
    // Disable all channels
    preferences.email.enabled = false;
    preferences.whatsapp.enabled = false;
    preferences.telegram.enabled = false;
    await preferences.save();

    logger.info(`User unsubscribed: ${log.userId}`);
  }

  res.json({ message: 'Successfully unsubscribed from all notifications' });
});

export const getNotificationStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: await NotificationLog.countDocuments({ userId: req.userId }),
    sent: await NotificationLog.countDocuments({ userId: req.userId, status: 'sent' }),
    failed: await NotificationLog.countDocuments({ userId: req.userId, status: 'failed' }),
    last30Days: await NotificationLog.countDocuments({
      userId: req.userId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
    byChannel: {
      email: await NotificationLog.countDocuments({ userId: req.userId, channel: 'email' }),
      whatsapp: await NotificationLog.countDocuments({ userId: req.userId, channel: 'whatsapp' }),
      telegram: await NotificationLog.countDocuments({ userId: req.userId, channel: 'telegram' }),
    },
    byType: {
      match: await NotificationLog.countDocuments({ userId: req.userId, notificationType: 'match' }),
      summary: await NotificationLog.countDocuments({ userId: req.userId, notificationType: 'summary' }),
      reminder: await NotificationLog.countDocuments({ userId: req.userId, notificationType: 'reminder' }),
    },
  };

  res.json({ statistics: stats });
});
```

**File:** `src/routes/notifications.ts`

```typescript
import express from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticateToken, requireUser } from '../middleware/auth';

const router = express.Router();

router.get('/preferences', authenticateToken, requireUser, notificationController.getPreferences);
router.put('/preferences', authenticateToken, requireUser, notificationController.updatePreferences);
router.get('/history', authenticateToken, requireUser, notificationController.getNotificationHistory);
router.get('/statistics', authenticateToken, requireUser, notificationController.getNotificationStats);
router.post('/test', authenticateToken, requireUser, notificationController.testNotification);
router.post('/unsubscribe', notificationController.unsubscribe);

export default router;
```

**Checklist:**
- [ ] Create notification controller with 6 endpoints
- [ ] Implement get/update preferences
- [ ] Implement notification history
- [ ] Implement test notification
- [ ] Implement unsubscribe
- [ ] Implement notification statistics
- [ ] Test: Get preferences works
- [ ] Test: Update preferences saves changes
- [ ] Test: Test notification queues correctly
- [ ] Test: Unsubscribe disables channels

---

### TASK 5.7: Auto-Trigger Notifications on New Matches (Day 4-5, 2-3 hours)

**Objective:** Automatically send notifications when new matches are created

**File:** `src/services/matchNotificationService.ts`

```typescript
import { notificationQueue, NotificationJobData } from '../config/queue';
import { JobMatch } from '../models/JobMatch';
import User from '../models/User';
import NotificationPreference from '../models/NotificationPreference';
import Job from '../models/Job';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class MatchNotificationService {
  /**
   * Trigger notification for new match
   */
  async notifyNewMatch(userId: string, matchId: string): Promise<void> {
    try {
      const match = await JobMatch.findById(matchId).populate('jobId');
      const preferences = await NotificationPreference.findOne({ userId });

      if (!match || !preferences || !preferences.notificationTypes.newMatches) {
        return;
      }

      const job = match.jobId as any;
      const unsubscribeToken = uuidv4();

      // Check frequency
      if (preferences.email.frequency === 'never' && 
          preferences.whatsapp.frequency === 'never' && 
          preferences.telegram.frequency === 'never') {
        return;
      }

      // Determine channels based on frequency
      const channels: string[] = [];

      if (preferences.email.enabled && preferences.email.frequency !== 'never') {
        channels.push('email');
      }

      if (preferences.whatsapp.enabled && preferences.whatsapp.frequency !== 'never') {
        channels.push('whatsapp');
      }

      if (preferences.telegram.enabled && preferences.telegram.frequency !== 'never') {
        channels.push('telegram');
      }

      if (channels.length === 0) {
        return;
      }

      // Queue notification
      await notificationQueue.add(
        'send-notification',
        {
          userId,
          event: 'new_match',
          channels,
          data: {
            jobTitle: job.title,
            matchScore: match.totalScore,
            jobUrl: `https://jobintel.com/jobs/${job._id}`,
            companyName: job.companyName,
            unsubscribeToken,
          },
        } as NotificationJobData
      );

      logger.info(`Match notification queued: ${userId} - ${job.title}`);
    } catch (err) {
      logger.error(`Failed to queue match notification: ${err}`);
    }
  }

  /**
   * Send daily digest
   */
  async sendDailyDigest(userId: string): Promise<void> {
    try {
      const preferences = await NotificationPreference.findOne({ userId });

      if (!preferences || !preferences.notificationTypes.newMatches) {
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const matches = await JobMatch.find({
        userId,
        createdAt: { $gte: todayStart },
      })
        .populate('jobId')
        .sort({ totalScore: -1 })
        .limit(10);

      if (matches.length === 0) {
        return;
      }

      const excellentMatches = matches.filter(m => m.matchType === 'excellent');
      const topJobs = matches.slice(0, 5).map((m: any) => ({
        title: (m.jobId as any).title,
        company: (m.jobId as any).companyName,
        score: m.totalScore,
      }));

      const channels: string[] = [];
      if (preferences.email.enabled) channels.push('email');
      if (preferences.whatsapp.enabled) channels.push('whatsapp');
      if (preferences.telegram.enabled) channels.push('telegram');

      if (channels.length === 0) {
        return;
      }

      const unsubscribeToken = uuidv4();

      await notificationQueue.add(
        'send-notification',
        {
          userId,
          event: 'daily_digest',
          channels,
          data: {
            matchCount: matches.length,
            excellentCount: excellentMatches.length,
            topJobs,
            unsubscribeToken,
          },
        } as NotificationJobData
      );

      logger.info(`Daily digest queued: ${userId}`);
    } catch (err) {
      logger.error(`Failed to queue daily digest: ${err}`);
    }
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(userId: string): Promise<void> {
    try {
      const preferences = await NotificationPreference.findOne({ userId });
      const user = await User.findById(userId);

      if (!preferences || !preferences.notificationTypes.summaryReports || !user) {
        return;
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const allMatches = await JobMatch.find({
        userId,
        createdAt: { $gte: weekAgo },
      });

      const excellentMatches = allMatches.filter(m => m.matchType === 'excellent');
      const goodMatches = allMatches.filter(m => m.matchType === 'good');

      const channels: string[] = [];
      if (preferences.email.enabled) channels.push('email');

      if (channels.length === 0) {
        return;
      }

      const unsubscribeToken = uuidv4();

      await notificationQueue.add(
        'send-notification',
        {
          userId,
          event: 'weekly_summary',
          channels,
          data: {
            stats: {
              newMatches: allMatches.length,
              excellentMatches: excellentMatches.length,
              goodMatches: goodMatches.length,
              topJobs: [],
            },
            unsubscribeToken,
          },
        } as NotificationJobData
      );

      logger.info(`Weekly summary queued: ${userId}`);
    } catch (err) {
      logger.error(`Failed to queue weekly summary: ${err}`);
    }
  }
}

export const matchNotificationService = new MatchNotificationService();
```

**Checklist:**
- [ ] Create match notification service
- [ ] Implement new match notification trigger
- [ ] Implement daily digest
- [ ] Implement weekly summary
- [ ] Test: New match triggers notification
- [ ] Test: Daily digest queues correctly
- [ ] Test: Weekly summary queues correctly

---

## 📝 NOTIFICATION FLOW

```
New Match Created
        ↓
Check User Preferences
        ↓
Filter by Enabled Channels
        ↓
Filter by Frequency
        ↓
Check Quiet Hours
        ↓
Queue Notification Job
        ↓
Worker Processes (5 concurrent)
        ↓
Send via Channel (Email/WhatsApp/Telegram)
        ↓
Log Result (sent/failed/bounced)
        ↓
Retry (3 attempts) if Failed
```

---

## ✅ ACCEPTANCE CRITERIA

By end of Phase 5:

```bash
✅ Email notifications sent successfully
✅ WhatsApp messages sent successfully
✅ Telegram messages sent successfully
✅ Notification preferences respected
✅ Quiet hours prevent notifications
✅ Rate limiting enforced (5/day)
✅ Notification history tracked
✅ Unsubscribe works correctly
✅ Test notification queues
✅ Daily digest generates
✅ Weekly summary generates
✅ Retry logic works (3 attempts)
✅ Failed notifications logged
✅ Performance: 100 notifications <5 seconds
✅ User can customize per-channel settings
```

---

## 🚀 NEXT STEPS

Once Phase 5 is complete:
→ **Phase 6-10: Testing, Deployment, Monitoring, Maintenance**

---

**Document Version:** 1.0  
**Created:** January 18, 2026  
**Estimated Completion:** 1 week  
**Dependencies:** nodemailer, axios
