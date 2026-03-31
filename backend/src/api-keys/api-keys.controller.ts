import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  list(
    @Req() req: AuthRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.apiKeysService.listByOrg(req.user.orgId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @Roles('owner', 'admin')
  create(@Req() req: AuthRequest, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(req.user.orgId, req.user.id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  revoke(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(req.user.orgId, id);
  }
}
