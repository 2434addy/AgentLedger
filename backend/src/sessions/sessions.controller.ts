import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('sessions')
@UseGuards(CombinedAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
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
  create(@Req() req: AuthRequest, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(req.user.orgId, dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.findOne(req.user.orgId, id);
  }

  @Patch(':id')
  update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(req.user.orgId, id, dto);
  }
}
