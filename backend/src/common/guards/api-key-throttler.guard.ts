import { Injectable, HttpException, HttpStatus, Inject, Logger, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../modules/redis.module';

// Rate limits per minute by org plan
const RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 1000,
  enterprise: 5000,
};

const WINDOW_MS = 60_000; // 1 minute in milliseconds

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

// Module-scoped fallback map — shared across all instances in the process
const inMemoryCounters = new Map<string, InMemoryEntry>();

@Injectable()
export class ApiKeyThrottlerService {
  private readonly logger = new Logger(ApiKeyThrottlerService.name);

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  /**
   * Check rate limit for an org by plan. Throws HTTP 429 if the limit is exceeded.
   * Rate limit windows are per-org, not per-key, and reset every 60 seconds.
   */
  async checkRateLimit(orgId: string, plan: string): Promise<void> {
    const limit = RATE_LIMITS[plan] ?? RATE_LIMITS.free;
    const key = `rate:${orgId}`;

    if (this.redis) {
      await this.checkRedis(key, limit);
    } else {
      this.checkInMemory(key, limit);
    }
  }

  private async checkRedis(key: string, limit: number): Promise<void> {
    try {
      const multi = this.redis!.multi();
      multi.incr(key);
      multi.pttl(key);
      const results = await multi.exec();

      const count = results?.[0]?.[1] as number;
      const ttl = results?.[1]?.[1] as number;

      // Set expiry on first request in this window (ttl === -1 means no expiry set)
      if (ttl === -1) {
        await this.redis!.pexpire(key, WINDOW_MS);
      }

      if (count > limit) {
        const retryAfterMs = ttl > 0 ? ttl : WINDOW_MS;
        this.throwRateLimitError(limit, retryAfterMs);
      }
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      this.logger.warn(
        `Redis rate limit check failed, falling back to in-memory: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.checkInMemory(key, limit);
    }
  }

  private checkInMemory(key: string, limit: number): void {
    const now = Date.now();
    const entry = inMemoryCounters.get(key);

    if (!entry || now > entry.resetAt) {
      inMemoryCounters.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }

    entry.count += 1;
    if (entry.count > limit) {
      this.throwRateLimitError(limit, entry.resetAt - now);
    }
  }

  private throwRateLimitError(limit: number, remainingMs: number): never {
    const retryAfter = Math.ceil(remainingMs / 1000);
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Rate limit exceeded. Limit: ${limit}/min. Retry after ${retryAfter}s`,
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
