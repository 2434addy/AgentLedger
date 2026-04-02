import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@ApiTags('agents')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('agents')
@UseGuards(CombinedAuthGuard, RolesGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all agents in the organisation' })
  @ApiResponse({ status: 200, description: 'Paginated list of agents.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
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
  @ApiOperation({ summary: 'Register a new agent in the organisation' })
  @ApiResponse({ status: 201, description: 'Agent created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  create(@Req() req: AuthRequest, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(req.user.orgId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent record.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.findOne(req.user.orgId, id);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update an agent (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Agent updated.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  update(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(req.user.orgId, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Delete an agent (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Agent deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient role.' })
  @ApiResponse({ status: 404, description: 'Agent not found.' })
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.remove(req.user.orgId, id);
  }
}
