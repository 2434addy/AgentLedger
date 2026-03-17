import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('organisations')
@UseGuards(JwtAuthGuard)
export class OrganisationsController {
  constructor(private readonly orgService: OrganisationsService) {}

  @Get('me')
  getMyOrg(@Req() req: AuthRequest) {
    return this.orgService.findById(req.user.orgId);
  }

  @Patch('me')
  updateMyOrg(@Req() req: AuthRequest, @Body() dto: UpdateOrgDto) {
    return this.orgService.update(req.user.orgId, dto);
  }
}
