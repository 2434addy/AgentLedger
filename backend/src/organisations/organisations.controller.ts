import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrganisationsService } from './organisations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@ApiTags('organisations')
@ApiBearerAuth()
@Controller('organisations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganisationsController {
  constructor(private readonly orgService: OrganisationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user\'s organisation' })
  @ApiResponse({ status: 200, description: 'Organisation record.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  getMyOrg(@Req() req: AuthRequest) {
    return this.orgService.findById(req.user.orgId);
  }

  @Patch('me')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update organisation settings (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Organisation updated.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  updateMyOrg(@Req() req: AuthRequest, @Body() dto: UpdateOrgDto) {
    return this.orgService.update(req.user.orgId, dto);
  }
}
