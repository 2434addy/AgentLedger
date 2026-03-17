import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { CreateEventsDto } from './dto/create-events.dto';
import { AuthRequest } from '../common/interfaces/request.interface';

@Controller('events')
@UseGuards(CombinedAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(
    @Req() req: AuthRequest,
    @Query('sessionId') sessionId?: string,
    @Query('agentId') agentId?: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
  ) {
    return this.eventsService.listByOrg(req.user.orgId, { sessionId, agentId, category, level });
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateEventsDto) {
    return this.eventsService.bulkCreate(req.user.orgId, dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(req.user.orgId, id);
  }
}
