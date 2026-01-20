import { logger } from '../../utils/logger';
import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter(): void {
    try {
      // Using Gmail SMTP with app-specific password
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // TLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      logger.info('Email service transporter initialized');
    } catch (error) {
      logger.error(`Error initializing email transporter: ${error}`);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: 'Email transporter not initialized',
        };
      }

      const mailOptions = {
        from: options.from || process.env.ADMIN_EMAIL || 'noreply@jobintel.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${options.to}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error(`Error sending email: ${error}`, { to: options.to });

      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Send job match notification email
   */
  async sendMatchNotification(to: string, jobTitle: string, companyName: string, matchScore: number, matchReasons: string[]): Promise<EmailResult> {
    const html = `
      <h2>New Job Match: ${jobTitle}</h2>
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Match Score:</strong> ${matchScore}/100</p>
      <p><strong>Why this job matches you:</strong></p>
      <ul>
        ${matchReasons.map((reason) => `<li>${reason}</li>`).join('')}
      </ul>
      <p><a href="${process.env.API_URL || 'http://localhost:3000'}/jobs/${jobTitle.replace(/\s+/g, '-')}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Job</a></p>
      <p>Best regards,<br>JobIntel Team</p>
    `;

    return this.sendEmail({
      to,
      subject: `New Job Match: ${jobTitle} at ${companyName}`,
      html,
      text: `New job match: ${jobTitle} at ${companyName} (Score: ${matchScore}/100)`,
    });
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(to: string, jobMatches: any[], weekStartDate: string): Promise<EmailResult> {
    const matchesHtml = jobMatches
      .slice(0, 10)
      .map(
        (match) =>
          `<tr><td>${match.jobTitle}</td><td>${match.companyName}</td><td>${match.matchScore}</td></tr>`
      )
      .join('');

    const html = `
      <h2>Weekly Job Matches Summary - ${weekStartDate}</h2>
      <p>Hi there!</p>
      <p>Here are your top job matches this week:</p>
      <table border="1" cellpadding="10">
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Company</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${matchesHtml}
        </tbody>
      </table>
      <p>Total matches this week: ${jobMatches.length}</p>
      <p><a href="${process.env.API_URL || 'http://localhost:3000'}/dashboard" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View All Matches</a></p>
      <p>Best regards,<br>JobIntel Team</p>
    `;

    return this.sendEmail({
      to,
      subject: `Weekly Job Matches Summary - ${jobMatches.length} new matches`,
      html,
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(to: string, verificationLink: string): Promise<EmailResult> {
    const html = `
      <h2>Verify Your Email Address</h2>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verificationLink}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, you can ignore this email.</p>
    `;

    return this.sendEmail({
      to,
      subject: 'Verify Your JobIntel Account',
      html,
    });
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        return false;
      }

      await this.transporter.verify();
      logger.info('Email transporter verified successfully');
      return true;
    } catch (error) {
      logger.error(`Email transporter verification failed: ${error}`);
      return false;
    }
  }
}

export const emailService = new EmailService();

export async function initEmailService(): Promise<void> {
  const connected = await emailService.testConnection();
  logger.info(`Email Service initialized. Status: ${connected ? 'Connected' : 'Not Connected'}`);
}
