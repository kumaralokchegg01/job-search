import { logger } from '../../utils/logger';

interface ApiUsageRecord {
  callCount: number;
  limitPerMonth: number;
  currentMonth: string; // YYYY-MM format
  warningThreshold: number; // 80% = 160 calls
  lastResetAt: Date;
  lastCallAt?: Date;
}

const MONTHLY_LIMIT = 200; // Hard limit from OpenWeb Ninja
const WARNING_THRESHOLD_PERCENT = 0.8; // Warn at 80%

class ApiUsageService {
  private usage: ApiUsageRecord = {
    callCount: 0,
    limitPerMonth: MONTHLY_LIMIT,
    currentMonth: this.getCurrentMonth(),
    warningThreshold: Math.round(MONTHLY_LIMIT * WARNING_THRESHOLD_PERCENT),
    lastResetAt: new Date(),
  };

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Check if we should reset monthly counter
   */
  private checkAndResetIfNewMonth(): void {
    const currentMonth = this.getCurrentMonth();

    if (currentMonth !== this.usage.currentMonth) {
      logger.info(`Resetting API usage counter for new month: ${currentMonth}`);
      this.usage.callCount = 0;
      this.usage.currentMonth = currentMonth;
      this.usage.lastResetAt = new Date();
    }
  }

  /**
   * Can we make an API call?
   */
  canMakeCall(): {
    allowed: boolean;
    remainingCalls: number;
    isWarning: boolean;
    message: string;
  } {
    this.checkAndResetIfNewMonth();

    if (this.usage.callCount >= this.usage.limitPerMonth) {
      return {
        allowed: false,
        remainingCalls: 0,
        isWarning: false,
        message: `API usage limit reached for month ${this.usage.currentMonth}. Hard limit: ${this.usage.limitPerMonth}`,
      };
    }

    const remaining = this.usage.limitPerMonth - this.usage.callCount;
    const isWarning = this.usage.callCount >= this.usage.warningThreshold;

    if (isWarning) {
      return {
        allowed: true,
        remainingCalls: remaining,
        isWarning: true,
        message: `Warning: API usage at 80% (${this.usage.callCount}/${this.usage.limitPerMonth}). ${remaining} calls remaining.`,
      };
    }

    return {
      allowed: true,
      remainingCalls: remaining,
      isWarning: false,
      message: `OK. ${remaining} API calls remaining for month.`,
    };
  }

  /**
   * Record an API call
   */
  recordCall(source: string = 'openwebninja'): void {
    this.checkAndResetIfNewMonth();

    if (this.usage.callCount < this.usage.limitPerMonth) {
      this.usage.callCount++;
      this.usage.lastCallAt = new Date();

      logger.debug(`API call recorded for ${source}. Total: ${this.usage.callCount}/${this.usage.limitPerMonth}`);
    } else {
      logger.warn(`API call attempted when limit reached. Source: ${source}`);
    }
  }

  /**
   * Get current usage statistics
   */
  getUsage(): {
    callsUsed: number;
    callsRemaining: number;
    limitPerMonth: number;
    currentMonth: string;
    percentageUsed: number;
    isWarning: boolean;
    isLimitReached: boolean;
    lastResetAt: Date;
    lastCallAt?: Date;
  } {
    this.checkAndResetIfNewMonth();

    const remaining = this.usage.limitPerMonth - this.usage.callCount;
    const percentageUsed = Math.round((this.usage.callCount / this.usage.limitPerMonth) * 100);
    const isWarning = this.usage.callCount >= this.usage.warningThreshold;
    const isLimitReached = this.usage.callCount >= this.usage.limitPerMonth;

    return {
      callsUsed: this.usage.callCount,
      callsRemaining: remaining,
      limitPerMonth: this.usage.limitPerMonth,
      currentMonth: this.usage.currentMonth,
      percentageUsed,
      isWarning,
      isLimitReached,
      lastResetAt: this.usage.lastResetAt,
      lastCallAt: this.usage.lastCallAt,
    };
  }

  /**
   * Get remaining calls
   */
  getRemaining(): number {
    this.checkAndResetIfNewMonth();
    return Math.max(0, this.usage.limitPerMonth - this.usage.callCount);
  }

  /**
   * Reset usage (admin only)
   */
  resetUsage(reason?: string): void {
    logger.warn(`API usage reset. Reason: ${reason || 'admin command'}`);
    this.usage.callCount = 0;
    this.usage.currentMonth = this.getCurrentMonth();
    this.usage.lastResetAt = new Date();
  }

  /**
   * Set custom monthly limit (admin only)
   */
  setMonthlyLimit(limit: number): void {
    if (limit < 0) {
      throw new Error('Monthly limit cannot be negative');
    }

    logger.warn(`API monthly limit changed from ${this.usage.limitPerMonth} to ${limit}`);
    this.usage.limitPerMonth = limit;
    this.usage.warningThreshold = Math.round(limit * WARNING_THRESHOLD_PERCENT);
  }
}

export const apiUsageService = new ApiUsageService();

export async function initApiUsageService(): Promise<void> {
  logger.info(`API Usage Service initialized. Monthly limit: ${MONTHLY_LIMIT} calls`);
}
