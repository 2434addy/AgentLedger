import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AnomalyService } from './anomaly.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('anomalies')
@UseGuards(CombinedAuthGuard)
export class AnomalyController {
  constructor(private readonly anomalyService: AnomalyService) {}

  @Get()
  getAnomalies(@Req() req: AuthRequest) {
    return this.anomalyService.detectAnomalies(req.user.orgId);
  }
}
