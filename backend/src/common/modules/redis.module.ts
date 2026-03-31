import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ApiKeyThrottlerService } from '../guards/api-key-throttler.guard';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url) {
          Logger.warn(
            'REDIS_URL not set — rate limiting will use in-memory fallback',
            'RedisModule',
          );
          return null;
        }
        const client = new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 200, 2000),
        });
        client.on('error', (err: Error) =>
          Logger.error(`Redis error: ${err.message}`, 'RedisModule'),
        );
        return client;
      },
      inject: [ConfigService],
    },
    ApiKeyThrottlerService,
  ],
  exports: [REDIS_CLIENT, ApiKeyThrottlerService],
})
export class RedisModule {}
