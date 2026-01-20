import { logger } from '../../utils/logger';
import axios, { AxiosError } from 'axios';

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private apiKey: string;
  private phoneId: string;
  private apiBaseUrl: string = 'https://graph.instagram.com/v18.0';

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneId = process.env.WHATSAPP_PHONE_ID || '';

    if (!this.apiKey || !this.phoneId) {
      logger.warn('WhatsApp credentials not configured. Service will not send messages.');
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(phoneNumber: string, message: string): Promise<WhatsAppResult> {
    try {
      if (!this.apiKey || !this.phoneId) {
        return {
          success: false,
          error: 'WhatsApp credentials not configured',
        };
      }

      // Format phone number: ensure it starts with country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await axios.post(`${this.apiBaseUrl}/${this.phoneId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data?.messages?.[0]?.id;

      logger.info(`WhatsApp message sent to ${phoneNumber}`, { messageId });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error(`Error sending WhatsApp message: ${axiosError.message}`, {
        phoneNumber,
        status: axiosError.response?.status,
      });

      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Send job match notification via WhatsApp
   */
  async sendMatchNotification(phoneNumber: string, jobTitle: string, companyName: string, matchScore: number): Promise<WhatsAppResult> {
    const message = `🎉 New Job Match!\n\n*${jobTitle}* at *${companyName}*\n\nMatch Score: ${matchScore}/100\n\nCheck your dashboard for more details!`;

    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send weekly summary via WhatsApp
   */
  async sendWeeklySummary(phoneNumber: string, jobCount: number): Promise<WhatsAppResult> {
    const message = `📊 Weekly Summary\n\nYou have ${jobCount} new job matches this week!\n\nLogin to see all matches and apply now.`;

    return this.sendMessage(phoneNumber, message);
  }
}

export const whatsappService = new WhatsAppService();

export async function initWhatsAppService(): Promise<void> {
  logger.info('WhatsApp Service initialized');
}
