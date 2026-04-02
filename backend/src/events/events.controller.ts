import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { CreateEventsDto, CreateEventItemDto } from './dto/create-events.dto';
import { EventCategory, EventLevel } from './entities/event.entity';
import { AuthRequest } from '../common/interfaces/request.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiTags('events')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('events')
@UseGuards(CombinedAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List events for the organisation with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of events.' })
  @ApiResponse({ status: 400, description: 'Invalid filter parameter.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
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
    // Validate optional UUID params to avoid 500 from malformed values
    if (sessionId && !UUID_REGEX.test(sessionId)) {
      throw new BadRequestException('sessionId must be a valid UUID');
    }
    if (agentId && !UUID_REGEX.test(agentId)) {
      throw new BadRequestException('agentId must be a valid UUID');
    }
    if (category && !Object.values(EventCategory).includes(category as EventCategory)) {
      throw new BadRequestException(`category must be one of: ${Object.values(EventCategory).join(', ')}`);
    }
    if (level && !Object.values(EventLevel).includes(level as EventLevel)) {
      throw new BadRequestException(`level must be one of: ${Object.values(EventLevel).join(', ')}`);
    }

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
  @ApiOperation({ summary: 'Ingest a single event or a batch of up to 500 events' })
  @ApiResponse({ status: 201, description: 'Event(s) created and hashed.' })
  @ApiResponse({ status: 400, description: 'Validation error or batch limit exceeded.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  create(@Req() req: AuthRequest, @Body() body: CreateEventsDto | CreateEventItemDto) {
    // Support both single event and batch format
    if ('events' in body && Array.isArray((body as CreateEventsDto).events)) {
      if ((body as CreateEventsDto).events.length > 500) {
        throw new BadRequestException('events array must not contain more than 500 items');
      }
      return this.eventsService.bulkCreate(req.user.orgId, body as CreateEventsDto);
    }
    // Single event — wrap in batch format
    return this.eventsService.bulkCreate(req.user.orgId, { events: [body as CreateEventItemDto] });
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify hash integrity of all events in the organisation' })
  @ApiResponse({ status: 200, description: 'Verification results for all events.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  verifyAll(@Req() req: AuthRequest) {
    return this.eventsService.verifyByOrg(req.user.orgId);
  }

  @Get('verify-chain')
  @ApiOperation({ summary: 'Verify the cryptographic chain linking all events' })
  @ApiResponse({ status: 200, description: 'Chain integrity report.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  verifyChain(@Req() req: AuthRequest) {
    return this.eventsService.verifyChain(req.user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID' })
  @ApiResponse({ status: 200, description: 'Event record.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(req.user.orgId, id);
  }

  @Get(':id/verify')
  @ApiOperation({ summary: 'Verify the hash integrity of a single event' })
  @ApiResponse({ status: 200, description: 'Verification result for the event.' })
  @ApiResponse({ status: 401, description: 'Unauthenticated.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  verifyOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.verifyOne(req.user.orgId, id);
  }
}
