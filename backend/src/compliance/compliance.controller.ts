import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthRequest } from '../common/interfaces/request.interface';
import { GenerateReportDto } from './dto/generate-report.dto';

@Controller('compliance')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('report')
  getReport(@Req() req: AuthRequest) {
    return this.complianceService.getReport(req.user.orgId);
  }

  @Get('checks')
  getChecks(@Req() req: AuthRequest) {
    return this.complianceService.getChecks(req.user.orgId);
  }

  @Post('reports/generate')
  @Roles('owner', 'admin')
  generateReport(@Req() req: AuthRequest, @Body() dto: GenerateReportDto) {
    return this.complianceService.generateReport(req.user.orgId, dto.framework);
  }
}
