import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { Approval } from './entities/approval.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Approval, ApiKey]), AuthModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, JwtAuthGuard, ApiKeyGuard, CombinedAuthGuard],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
