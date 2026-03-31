import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { CreateEventsDto, CreateEventItemDto } from './dto/create-events.dto';
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
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('cursor') cursor?: string,
  ) {
    const safeLimit = Math.min(Math.max(limit ?? 100, 1), 500);
    const safePage = Math.max(page ?? 1, 1);
    return this.eventsService.listByOrg(req.user.orgId, {
      sessionId,
      agentId,
      category,
      level,
      limit: safeLimit,
      page: safePage,
      cursor,
    });
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() body: CreateEventsDto | CreateEventItemDto) {
    // Support both single event and batch format
    if ('events' in body && Array.isArray((body as CreateEventsDto).events)) {
      return this.eventsService.bulkCreate(req.user.orgId, body as CreateEventsDto);
    }
    // Single event — wrap in batch format
    return this.eventsService.bulkCreate(req.user.orgId, { events: [body as CreateEventItemDto] });
  }

  @Get('verify')
  verifyAll(@Req() req: AuthRequest) {
    return this.eventsService.verifyByOrg(req.user.orgId);
  }

  @Get('verify-chain')
  verifyChain(@Req() req: AuthRequest) {
    return this.eventsService.verifyChain(req.user.orgId);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(req.user.orgId, id);
  }

  @Get(':id/verify')
  verifyOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.verifyOne(req.user.orgId, id);
  }
}
