import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@ApiTags('api-keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys for the organisation' })
  @ApiResponse({ status: 200, description: 'Paginated list of API key metadata (plaintext key is never returned).' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
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
  @ApiOperation({ summary: 'Create a new API key (owner/admin only) — plaintext shown once' })
  @ApiResponse({ status: 201, description: 'API key created; plaintext returned in this response only.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  create(@Req() req: AuthRequest, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(req.user.orgId, req.user.id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Revoke an API key by ID (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'API key revoked.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  @ApiResponse({ status: 404, description: 'API key not found.' })
  revoke(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(req.user.orgId, id);
  }
}
