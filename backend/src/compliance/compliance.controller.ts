import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthRequest } from '../common/interfaces/request.interface';
import { GenerateReportDto } from './dto/generate-report.dto';

@ApiTags('compliance')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('compliance')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('report')
  @ApiOperation({ summary: 'Get the latest compliance report for the organisation' })
  @ApiResponse({ status: 200, description: 'Compliance report.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  getReport(@Req() req: AuthRequest) {
    return this.complianceService.getReport(req.user.orgId);
  }

  @Get('checks')
  @ApiOperation({ summary: 'Get the list of individual compliance checks and their status' })
  @ApiResponse({ status: 200, description: 'Compliance check results.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  getChecks(@Req() req: AuthRequest) {
    return this.complianceService.getChecks(req.user.orgId);
  }

  @Post('reports/generate')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Generate a compliance report for a given framework (owner/admin only)' })
  @ApiResponse({ status: 201, description: 'Report generated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid framework value.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  generateReport(@Req() req: AuthRequest, @Body() dto: GenerateReportDto) {
    return this.complianceService.generateReport(req.user.orgId, dto.framework);
  }
}
