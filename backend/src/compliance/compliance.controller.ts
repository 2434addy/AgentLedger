import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { AuthRequest } from '../common/interfaces/request.interface';
import { GenerateReportDto } from './dto/generate-report.dto';

@Controller('compliance')
@UseGuards(CombinedAuthGuard)
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
  generateReport(@Req() req: AuthRequest, @Body() dto: GenerateReportDto) {
    return this.complianceService.generateReport(req.user.orgId, dto.framework);
  }
}
