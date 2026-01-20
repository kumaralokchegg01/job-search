import Debug from 'debug';

const log = Debug('jobintel:rate-limiter');

interface RateLimitConfig {
  requestsPerSecond?: number;
  requestsPerMonth?: number;
  retryAttempts?: number;
}

/**
 * Rate limiter for API calls
 * Ensures: 1 request/second minimum, 3 retries with exponential backoff
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private minDelayMs: number = 1000; // 1 second
  private retryDelays: number[] = [2000, 4000, 8000]; // 2s, 4s, 8s
  private monthlyRequestCount: number = 0;
  private monthlyLimit: number = 200;
  private monthStartDate: Date = new Date();

  constructor(config?: RateLimitConfig) {
    if (config?.requestsPerSecond) {
      this.minDelayMs = 1000 / config.requestsPerSecond;
    }
    if (config?.requestsPerMonth) {
      this.monthlyLimit = config.requestsPerMonth;
    }
  }

  /**
   * Wait until it's safe to make the next request
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastRequest;
      log(`Rate limit: waiting ${waitTime}ms before next request`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Execute function with rate limiting and retry logic
   */
  async execute<T>(fn: () => Promise<T>, attempt: number = 0): Promise<T> {
    // Check monthly limit
    if (this.monthlyRequestCount >= this.monthlyLimit) {
      const error = new Error(
        `Monthly API limit exceeded: ${this.monthlyRequestCount}/${this.monthlyLimit} calls`
      );
      error.name = 'RateLimitExceededError';
      throw error;
    }

    // Wait for rate limit slot
    await this.waitForSlot();

    try {
      const result = await fn();
      this.monthlyRequestCount++;

      // Log usage at 80% threshold
      if (this.monthlyRequestCount === Math.floor(this.monthlyLimit * 0.8)) {
        log(`⚠️  API usage warning: ${this.monthlyRequestCount}/${this.monthlyLimit} calls (80%)`);
      }

      return result;
    } catch (err: any) {
      if (attempt < this.retryDelays.length) {
        const delay = this.retryDelays[attempt];
        log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/3):`, err.message);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.execute(fn, attempt + 1);
      }

      throw err;
    }
  }

  /**
   * Get current usage statistics
   */
  getUsage(): {
    callsThisMonth: number;
    monthlyLimit: number;
    remaining: number;
    percentageUsed: number;
  } {
    return {
      callsThisMonth: this.monthlyRequestCount,
      monthlyLimit: this.monthlyLimit,
      remaining: this.monthlyLimit - this.monthlyRequestCount,
      percentageUsed: Math.round((this.monthlyRequestCount / this.monthlyLimit) * 100),
    };
  }

  /**
   * Record a manual API call (for external tracking)
   */
  recordCall(): void {
    this.monthlyRequestCount++;
  }

  /**
   * Reset monthly counter (call at start of each month)
   */
  resetMonthly(): void {
    this.monthlyRequestCount = 0;
    this.monthStartDate = new Date();
    log('Monthly call counter reset');
  }

  /**
   * Set monthly limit
   */
  setMonthlyLimit(limit: number): void {
    this.monthlyLimit = limit;
    log(`Monthly limit set to ${limit}`);
  }

  /**
   * Check if at monthly limit
   */
  isAtLimit(): boolean {
    return this.monthlyRequestCount >= this.monthlyLimit;
  }

  /**
   * Get remaining calls for this month
   */
  getRemainingCalls(): number {
    return Math.max(0, this.monthlyLimit - this.monthlyRequestCount);
  }
}

export default RateLimiter;
