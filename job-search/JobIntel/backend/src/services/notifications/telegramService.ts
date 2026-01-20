import { logger } from '../../utils/logger';
import axios, { AxiosError } from 'axios';

interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

class TelegramService {
  private botToken: string;
  private apiBaseUrl: string = 'https://api.telegram.org/bot';

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';

    if (!this.botToken) {
      logger.warn('Telegram bot token not configured. Service will not send messages.');
    }
  }

  /**
   * Send Telegram message to user
   */
  async sendMessage(chatId: string | number, message: string): Promise<TelegramResult> {
    try {
      if (!this.botToken) {
        return {
          success: false,
          error: 'Telegram bot token not configured',
        };
      }

      const response = await axios.post(`${this.apiBaseUrl}${this.botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      });

      const messageId = response.data?.result?.message_id;

      logger.info(`Telegram message sent to ${chatId}`, { messageId });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error(`Error sending Telegram message: ${axiosError.message}`, {
        chatId,
        status: axiosError.response?.status,
      });

      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Send job match notification via Telegram
   */
  async sendMatchNotification(
    chatId: string | number,
    jobTitle: string,
    companyName: string,
    matchScore: number,
    matchUrl: string
  ): Promise<TelegramResult> {
    const message = `🎉 *New Job Match!*\n\n*${jobTitle}* at *${companyName}*\n\n📊 Match Score: ${matchScore}/100\n\n[View Job](${matchUrl})`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Send weekly summary via Telegram
   */
  async sendWeeklySummary(chatId: string | number, jobCount: number, dashboardUrl: string): Promise<TelegramResult> {
    const message = `📊 *Weekly Job Matches Summary*\n\nYou have *${jobCount}* new job matches this week!\n\n[View Dashboard](${dashboardUrl})`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Send skill recommendation via Telegram
   */
  async sendSkillRecommendation(
    chatId: string | number,
    skillName: string,
    jobCount: number
  ): Promise<TelegramResult> {
    const message = `💡 *Skill Recommendation*\n\nAdding *${skillName}* to your profile could open up *${jobCount}* more job opportunities!\n\nWould you like to add this skill?`;

    return this.sendMessage(chatId, message);
  }
}

export const telegramService = new TelegramService();

export async function initTelegramService(): Promise<void> {
  logger.info('Telegram Service initialized');
}
