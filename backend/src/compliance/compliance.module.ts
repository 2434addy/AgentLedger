import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { Event } from '../events/entities/event.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Event, AuditLog, ApiKey]), AuthModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, JwtAuthGuard, ApiKeyGuard, CombinedAuthGuard],
})
export class ComplianceModule {}
