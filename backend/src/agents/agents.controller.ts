import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('agents')
@UseGuards(CombinedAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.agentsService.listByOrg(req.user.orgId);
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
  update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(req.user.orgId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.remove(req.user.orgId, id);
  }
}
