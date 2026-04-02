import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Event } from '../events/entities/event.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Event, ApiKey]), AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtAuthGuard, ApiKeyGuard, CombinedAuthGuard],
})
export class AnalyticsModule {}
