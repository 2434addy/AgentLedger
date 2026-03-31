import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('agents')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  list(
    @Req() req: AuthRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.listByOrg(req.user.orgId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(req.user.orgId, dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.findOne(req.user.orgId, id);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(req.user.orgId, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.remove(req.user.orgId, id);
  }
}
