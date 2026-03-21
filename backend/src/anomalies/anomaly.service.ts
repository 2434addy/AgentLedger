import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class AnomalyService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
  ) {}

  async detectAnomalies(orgId: string) {
    const [latencySpikes, errorBursts, agentLoops] = await Promise.all([
      this.detectLatencySpikes(orgId).catch(() => []),
      this.detectErrorBursts(orgId).catch(() => []),
      this.detectAgentLoops(orgId).catch(() => []),
    ]);
    return { latencySpikes, errorBursts, agentLoops };
  }

  private async detectLatencySpikes(orgId: string) {
    const avg = await this.eventRepo.createQueryBuilder('event')
      .select('AVG(event.latencyMs)', 'avg')
      .where('event.orgId = :orgId', { orgId })
      .andWhere('event.latencyMs IS NOT NULL')
      .getRawOne();

    if (!avg?.avg) return [];

    return this.eventRepo.createQueryBuilder('event')
      .select([
        'event.id', 'event.orgId', 'event.sessionId', 'event.agentId',
        'event.category', 'event.level', 'event.message', 'event.payload',
        'event.tokensInput', 'event.tokensOutput', 'event.costUsd',
        'event.latencyMs', 'event.timestamp', 'event.hash', 'event.tampered',
        'event.stateBefore', 'event.stateAfter',
      ])
      .where('event.orgId = :orgId', { orgId })
      .andWhere('event.latencyMs > :threshold', { threshold: Math.round(parseFloat(avg.avg) * 2) })
      .orderBy('event.timestamp', 'DESC')
      .limit(20)
      .getMany();
  }

  private async detectErrorBursts(orgId: string) {
    return this.eventRepo.createQueryBuilder('event')
      .select("date_trunc('minute', event.timestamp)", 'minute')
      .addSelect('COUNT(*)', 'error_count')
      .where('event.orgId = :orgId', { orgId })
      .andWhere('event.level IN (:...levels)', { levels: ['error', 'fatal'] })
      .groupBy('minute')
      .having('COUNT(*) > :threshold', { threshold: 5 })
      .orderBy('minute', 'DESC')
      .limit(20)
      .getRawMany();
  }

  private async detectAgentLoops(orgId: string) {
    return this.eventRepo.createQueryBuilder('event')
      .select('event.sessionId', 'sessionId')
      .addSelect('event.agentId', 'agentId')
      .addSelect('event.message', 'message')
      .addSelect('COUNT(*)', 'repeat_count')
      .where('event.orgId = :orgId', { orgId })
      .andWhere('event.category = :category', { category: 'tool_invocation' })
      .groupBy('event.sessionId')
      .addGroupBy('event.agentId')
      .addGroupBy('event.message')
      .having('COUNT(*) > :threshold', { threshold: 10 })
      .orderBy('repeat_count', 'DESC')
      .limit(20)
      .getRawMany();
  }
}
