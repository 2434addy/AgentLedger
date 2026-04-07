import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisModule } from './common/modules/redis.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AgentsModule } from './agents/agents.module';
import { SessionsModule } from './sessions/sessions.module';
import { EventsModule } from './events/events.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnomalyModule } from './anomalies/anomaly.module';
import { ComplianceModule } from './compliance/compliance.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { HealthModule } from './health/health.module';
import { GatewaysModule } from './gateways/gateways.module';
import { CsrfGuard } from './common/guards/csrf.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        ssl: (() => {
          const env = config.get<string>('NODE_ENV');
          const caCert = config.get<string>('DATABASE_CA_CERT');
          if (env !== 'production') return false;
          if (caCert) {
            return { rejectUnauthorized: true, ca: caCert };
          }
          // No CA cert provided — use system CA pool (validates Neon's Let's Encrypt cert)
          return { rejectUnauthorized: true };
        })(),
        extra: { max: 5, idleTimeoutMillis: 30000 },
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    RedisModule,
    AuthModule,
    OrganisationsModule,
    ApiKeysModule,
    AgentsModule,
    SessionsModule,
    EventsModule,
    AnalyticsModule,
    AnomalyModule,
    ComplianceModule,
    ApprovalsModule,
    HealthModule,
    GatewaysModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}
