import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { Session } from '../sessions/entities/session.entity';
import { Agent, AgentStatus } from '../agents/entities/agent.entity';
import { CreateEventsDto } from './dto/create-events.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Agent) private agentRepo: Repository<Agent>,
  ) {}

  async listByOrg(orgId: string, filters: { sessionId?: string; agentId?: string; category?: string; level?: string }) {
    const qb = this.eventRepo.createQueryBuilder('event')
      .where('event.orgId = :orgId', { orgId })
      .orderBy('event.timestamp', 'DESC');

    if (filters.sessionId) qb.andWhere('event.sessionId = :sessionId', { sessionId: filters.sessionId });
    if (filters.agentId) qb.andWhere('event.agentId = :agentId', { agentId: filters.agentId });
    if (filters.category) qb.andWhere('event.category = :category', { category: filters.category });
    if (filters.level) qb.andWhere('event.level = :level', { level: filters.level });

    return qb.limit(100).getMany();
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
      const { occurredAt, ...rest } = e;
      return this.eventRepo.create({
        ...rest,
        orgId,
        timestamp: occurredAt ? new Date(occurredAt) : new Date(),
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
}
