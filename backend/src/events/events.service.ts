import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { Session } from '../sessions/entities/session.entity';
import { Agent, AgentStatus } from '../agents/entities/agent.entity';
import { CreateEventsDto } from './dto/create-events.dto';
import { computeEventHash } from './event-hash.util';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Agent) private agentRepo: Repository<Agent>,
  ) {}

  async listByOrg(orgId: string, filters: { sessionId?: string; agentId?: string; category?: string; level?: string; limit?: number; page?: number }) {
    const limit = filters.limit ?? 100;
    const page = filters.page ?? 1;
    const qb = this.eventRepo.createQueryBuilder('event')
      .where('event.orgId = :orgId', { orgId })
      .orderBy('event.timestamp', 'DESC');

    if (filters.sessionId) qb.andWhere('event.sessionId = :sessionId', { sessionId: filters.sessionId });
    if (filters.agentId) qb.andWhere('event.agentId = :agentId', { agentId: filters.agentId });
    if (filters.category) qb.andWhere('event.category = :category', { category: filters.category });
    if (filters.level) qb.andWhere('event.level = :level', { level: filters.level });

    return qb.skip((page - 1) * limit).take(limit).getMany();
  }

  async bulkCreate(orgId: string, dto: CreateEventsDto) {
    // Auto-create any sessions that don't exist yet
    const sessionIds = [...new Set(dto.events.map(e => e.sessionId).filter(Boolean))] as string[];
    if (sessionIds.length > 0) {
      const existing = await this.sessionRepo
        .createQueryBuilder('s')
        .select('s.id')
        .where('s.id IN (:...ids)', { ids: sessionIds })
        .andWhere('s.orgId = :orgId', { orgId })
        .getMany();
      const existingIds = new Set(existing.map(s => s.id));
      const missing = sessionIds.filter(id => !existingIds.has(id));
      if (missing.length > 0) {
        // Resolve agentId for each missing session from the event that references it
        const sessionsToCreate = missing.map(sid => {
          const event = dto.events.find(e => e.sessionId === sid)!;
          return this.sessionRepo.create({ id: sid, orgId, agentId: event.agentId });
        });
        await this.sessionRepo.save(sessionsToCreate);
      }
    }

    const events = dto.events.map(e => {
      const { occurredAt, stateBefore, stateAfter, ...rest } = e;
      const timestamp = occurredAt ? new Date(occurredAt) : new Date();
      const hash = computeEventHash({
        agentId: rest.agentId,
        category: rest.category,
        level: rest.level,
        message: rest.message,
        timestamp,
        payload: rest.payload ?? null,
        stateBefore: stateBefore ?? null,
        stateAfter: stateAfter ?? null,
      });
      return this.eventRepo.create({
        ...rest,
        orgId,
        timestamp,
        stateBefore: stateBefore ?? null,
        stateAfter: stateAfter ?? null,
        hash,
        tampered: false,
      });
    });
    const saved = await this.eventRepo.save(events);

    // Update session totals — scoped to orgId to prevent cross-org manipulation
    const savedSessionIds = [...new Set(saved.map(e => e.sessionId).filter(Boolean))];
    for (const sessionId of savedSessionIds) {
      const result = await this.eventRepo
        .createQueryBuilder('event')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(event.costUsd), 0)', 'cost')
        .where('event.sessionId = :sessionId', { sessionId })
        .andWhere('event.orgId = :orgId', { orgId })
        .getRawOne();
      await this.sessionRepo
        .createQueryBuilder()
        .update()
        .set({
          totalEvents: parseInt(result.count),
          totalCost: parseFloat(result.cost),
        })
        .where('id = :sessionId AND "orgId" = :orgId', { sessionId, orgId })
        .execute();
    }

    // Update agent lastSeenAt and status
    const agentIds = [...new Set(saved.map(e => e.agentId))];
    for (const agentId of agentIds) {
      await this.agentRepo
        .createQueryBuilder()
        .update()
        .set({
          lastSeenAt: new Date(),
          status: AgentStatus.ACTIVE,
        })
        .where('id = :agentId AND "orgId" = :orgId', { agentId, orgId })
        .execute();
    }

    return saved;
  }

  async findOne(orgId: string, id: string) {
    const event = await this.eventRepo.findOne({ where: { id, orgId } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /**
   * Verify integrity of a single event by recomputing its hash.
   * If tampered, flags the event in the database.
   */
  async verifyOne(orgId: string, id: string) {
    const event = await this.findOne(orgId, id);
    const recomputed = computeEventHash({
      agentId: event.agentId,
      category: event.category,
      level: event.level,
      message: event.message,
      timestamp: event.timestamp,
      payload: event.payload,
      stateBefore: event.stateBefore,
      stateAfter: event.stateAfter,
    });
    const valid = event.hash === recomputed;
    if (!valid && !event.tampered) {
      await this.eventRepo.update({ id, orgId }, { tampered: true });
      event.tampered = true;
    }
    return { id: event.id, valid, storedHash: event.hash, recomputedHash: recomputed };
  }

  /**
   * Batch-verify all events for an org. Returns summary + list of tampered event IDs.
   */
  async verifyByOrg(orgId: string) {
    const events = await this.eventRepo.find({ where: { orgId } });
    const tampered: string[] = [];
    const idsToFlag: string[] = [];

    for (const event of events) {
      const recomputed = computeEventHash({
        agentId: event.agentId,
        category: event.category,
        level: event.level,
        message: event.message,
        timestamp: event.timestamp,
        payload: event.payload,
        stateBefore: event.stateBefore,
        stateAfter: event.stateAfter,
      });
      if (event.hash !== recomputed) {
        tampered.push(event.id);
        if (!event.tampered) idsToFlag.push(event.id);
      }
    }

    if (idsToFlag.length > 0) {
      await this.eventRepo
        .createQueryBuilder()
        .update()
        .set({ tampered: true })
        .where('id IN (:...ids) AND "orgId" = :orgId', { ids: idsToFlag, orgId })
        .execute();
    }

    return { total: events.length, valid: events.length - tampered.length, tampered: tampered.length, tamperedIds: tampered };
  }
}
