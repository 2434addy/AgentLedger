import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AnomalyService } from './anomaly.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('anomalies')
@UseGuards(JwtAuthGuard)
export class AnomalyController {
  constructor(private readonly anomalyService: AnomalyService) {}

  @Get()
  getAnomalies(@Req() req: AuthRequest) {
    return this.anomalyService.detectAnomalies(req.user.orgId);
  }
}
