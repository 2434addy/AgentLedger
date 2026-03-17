import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { Session } from '../sessions/entities/session.entity';
import { CreateEventsDto } from './dto/create-events.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
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
    const events = dto.events.map(e => this.eventRepo.create({ ...e, orgId }));
    const saved = await this.eventRepo.save(events);

    // Update session totals — scoped to orgId to prevent cross-org manipulation
    const sessionIds = [...new Set(saved.map(e => e.sessionId))];
    for (const sessionId of sessionIds) {
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

    return saved;
  }

  async findOne(orgId: string, id: string) {
    const event = await this.eventRepo.findOne({ where: { id, orgId } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }
}
