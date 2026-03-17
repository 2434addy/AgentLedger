import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
  ) {}

  async getCostBreakdown(orgId: string, from?: string, to?: string) {
    const qb = this.eventRepo.createQueryBuilder('event')
      .select('event.agentId', 'agentId')
      .addSelect('SUM(event.costUsd)', 'totalCost')
      .addSelect('COUNT(*)', 'eventCount')
      .where('event.orgId = :orgId', { orgId })
      .andWhere('event.costUsd IS NOT NULL');

    if (from) qb.andWhere('event.timestamp >= :from', { from });
    if (to) qb.andWhere('event.timestamp <= :to', { to });

    return qb.groupBy('event.agentId').getRawMany();
  }

  async getUsageStats(orgId: string, from?: string, to?: string) {
    const qb = this.eventRepo.createQueryBuilder('event')
      .select('event.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('event.orgId = :orgId', { orgId });

    if (from) qb.andWhere('event.timestamp >= :from', { from });
    if (to) qb.andWhere('event.timestamp <= :to', { to });

    return qb.groupBy('event.category').getRawMany();
  }

  async getModelStats(orgId: string) {
    return this.eventRepo.createQueryBuilder('event')
      .innerJoin('event.agent', 'agent')
      .select('agent.modelProvider', 'modelProvider')
      .addSelect('agent.modelId', 'modelId')
      .addSelect('SUM(event.tokensInput)', 'totalTokensInput')
      .addSelect('SUM(event.tokensOutput)', 'totalTokensOutput')
      .addSelect('SUM(event.costUsd)', 'totalCost')
      .addSelect('COUNT(*)', 'eventCount')
      .where('event.orgId = :orgId', { orgId })
      .groupBy('agent.modelProvider')
      .addGroupBy('agent.modelId')
      .getRawMany();
  }
}
