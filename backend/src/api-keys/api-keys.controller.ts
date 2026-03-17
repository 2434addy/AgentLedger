import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.apiKeysService.listByOrg(req.user.orgId);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(req.user.orgId, req.user.id, dto);
  }

  @Delete(':id')
  revoke(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(req.user.orgId, id);
  }
}
