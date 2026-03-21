import { Controller, Get, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('analytics')
@UseGuards(CombinedAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private validateDateParam(value?: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date format: ${value}. Use ISO 8601 format (e.g. 2026-01-01)`);
    }
    return date.toISOString();
  }

  @Get('cost')
  getCost(@Req() req: AuthRequest, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getCostBreakdown(req.user.orgId, this.validateDateParam(from), this.validateDateParam(to));
  }

  @Get('usage')
  getUsage(@Req() req: AuthRequest, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getUsageStats(req.user.orgId, this.validateDateParam(from), this.validateDateParam(to));
  }

  @Get('models')
  getModels(@Req() req: AuthRequest) {
    return this.analyticsService.getModelStats(req.user.orgId);
  }
}
