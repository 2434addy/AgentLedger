import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('cost')
  getCost(@Req() req: AuthRequest, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getCostBreakdown(req.user.orgId, from, to);
  }

  @Get('usage')
  getUsage(@Req() req: AuthRequest, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getUsageStats(req.user.orgId, from, to);
  }

  @Get('models')
  getModels(@Req() req: AuthRequest) {
    return this.analyticsService.getModelStats(req.user.orgId);
  }
}
