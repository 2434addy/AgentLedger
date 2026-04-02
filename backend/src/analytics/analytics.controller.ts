import { Controller, Get, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { AuthRequest } from '../common/interfaces/request.interface';

@ApiTags('analytics')
@ApiBearerAuth()
@ApiSecurity('api-key')
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
  @ApiOperation({ summary: 'Get token cost breakdown for the organisation over a date range' })
  @ApiResponse({ status: 200, description: 'Cost breakdown by model and agent.' })
  @ApiResponse({ status: 400, description: 'Invalid date format.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  getCost(@Req() req: AuthRequest, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getCostBreakdown(req.user.orgId, this.validateDateParam(from), this.validateDateParam(to));
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get event and token usage statistics over a date range' })
  @ApiResponse({ status: 200, description: 'Usage statistics.' })
  @ApiResponse({ status: 400, description: 'Invalid date format.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  getUsage(@Req() req: AuthRequest, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getUsageStats(req.user.orgId, this.validateDateParam(from), this.validateDateParam(to));
  }

  @Get('models')
  @ApiOperation({ summary: 'Get aggregated statistics broken down by model' })
  @ApiResponse({ status: 200, description: 'Per-model statistics.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  getModels(@Req() req: AuthRequest) {
    return this.analyticsService.getModelStats(req.user.orgId);
  }
}
