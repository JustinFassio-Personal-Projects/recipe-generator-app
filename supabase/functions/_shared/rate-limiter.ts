/**
 * Rate Limiter for Email Sending
 * Prevents exceeding Resend API rate limits
 */

interface RateLimitConfig {
  maxPerSecond: number;
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
}

/**
 * Default rate limits for Resend free tier
 */
export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxPerSecond: 10,
  maxPerMinute: 60,
  maxPerHour: 100,
  maxPerDay: 100,
};

/**
 * Simple in-memory rate limiter
 * Note: For production with multiple Edge Function instances,
 * consider using Redis or a distributed rate limiter
 */
export class RateLimiter {
  private secondCounter: Map<number, number> = new Map();
  private minuteCounter: Map<number, number> = new Map();
  private hourCounter: Map<number, number> = new Map();
  private dayCounter: Map<number, number> = new Map();

  constructor(private config: RateLimitConfig = DEFAULT_RATE_LIMITS) {}

  /**
   * Check if we can send an email now
   */
  canSend(): boolean {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);
    const currentDay = Math.floor(now / 86400000);

    // Check all time windows
    const secondCount = this.secondCounter.get(currentSecond) || 0;
    const minuteCount = this.minuteCounter.get(currentMinute) || 0;
    const hourCount = this.hourCounter.get(currentHour) || 0;
    const dayCount = this.dayCounter.get(currentDay) || 0;

    return (
      secondCount < this.config.maxPerSecond &&
      minuteCount < this.config.maxPerMinute &&
      hourCount < this.config.maxPerHour &&
      dayCount < this.config.maxPerDay
    );
  }

  /**
   * Record that an email was sent
   */
  recordSent(): void {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);
    const currentDay = Math.floor(now / 86400000);

    // Increment counters
    this.secondCounter.set(
      currentSecond,
      (this.secondCounter.get(currentSecond) || 0) + 1
    );
    this.minuteCounter.set(
      currentMinute,
      (this.minuteCounter.get(currentMinute) || 0) + 1
    );
    this.hourCounter.set(
      currentHour,
      (this.hourCounter.get(currentHour) || 0) + 1
    );
    this.dayCounter.set(currentDay, (this.dayCounter.get(currentDay) || 0) + 1);

    // Clean up old entries (keep last 2 periods of each)
    this.cleanup(this.secondCounter, currentSecond, 2);
    this.cleanup(this.minuteCounter, currentMinute, 2);
    this.cleanup(this.hourCounter, currentHour, 2);
    this.cleanup(this.dayCounter, currentDay, 2);
  }

  /**
   * Clean up old counter entries
   */
  private cleanup(
    counter: Map<number, number>,
    current: number,
    keep: number
  ): void {
    const threshold = current - keep;
    for (const key of counter.keys()) {
      if (key < threshold) {
        counter.delete(key);
      }
    }
  }

  /**
   * Get current usage stats
   */
  getStats(): {
    second: number;
    minute: number;
    hour: number;
    day: number;
  } {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);
    const currentDay = Math.floor(now / 86400000);

    return {
      second: this.secondCounter.get(currentSecond) || 0,
      minute: this.minuteCounter.get(currentMinute) || 0,
      hour: this.hourCounter.get(currentHour) || 0,
      day: this.dayCounter.get(currentDay) || 0,
    };
  }

  /**
   * Calculate how long to wait before sending next email
   */
  getWaitTime(): number {
    if (this.canSend()) {
      return 0;
    }

    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const secondCount = this.secondCounter.get(currentSecond) || 0;

    // If we've hit the per-second limit, wait until next second
    if (secondCount >= this.config.maxPerSecond) {
      return 1000 - (now % 1000);
    }

    // Otherwise, wait a bit longer (minute boundary)
    return 60000 - (now % 60000);
  }

  /**
   * Wait if necessary before sending
   */
  async waitIfNeeded(): Promise<void> {
    const waitTime = this.getWaitTime();
    if (waitTime > 0) {
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// Global rate limiter instance
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get the global rate limiter instance
 */
export function getRateLimiter(config?: RateLimitConfig): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter(config);
  }
  return globalRateLimiter;
}
