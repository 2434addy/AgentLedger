import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { AnomalyService } from './anomaly.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { AuthRequest } from '../common/interfaces/request.interface';

@ApiTags('anomalies')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('anomalies')
@UseGuards(CombinedAuthGuard)
export class AnomalyController {
  constructor(private readonly anomalyService: AnomalyService) {}

  @Get()
  @ApiOperation({ summary: 'Detect and return anomalies in recent agent activity' })
  @ApiResponse({ status: 200, description: 'List of detected anomalies.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  getAnomalies(@Req() req: AuthRequest) {
    return this.anomalyService.detectAnomalies(req.user.orgId);
  }
}
