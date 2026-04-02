import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@ApiTags('sessions')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('sessions')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List sessions in the organisation, optionally filtered by agent' })
  @ApiResponse({ status: 200, description: 'Paginated list of sessions.' })
  @ApiResponse({ status: 400, description: 'Invalid agentId format.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  list(
    @Req() req: AuthRequest,
    @Query('agentId') agentId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    if (agentId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId)) {
      throw new BadRequestException('agentId must be a valid UUID');
    }
    return this.sessionsService.listByOrg(req.user.orgId, {
      agentId,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new session for an agent' })
  @ApiResponse({ status: 201, description: 'Session created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  create(@Req() req: AuthRequest, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(req.user.orgId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single session by ID' })
  @ApiResponse({ status: 200, description: 'Session record.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.findOne(req.user.orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update session metadata or status' })
  @ApiResponse({ status: 200, description: 'Session updated.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(req.user.orgId, id, dto);
  }
}
