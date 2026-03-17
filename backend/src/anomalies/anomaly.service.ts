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
      this.detectLatencySpikes(orgId),
      this.detectErrorBursts(orgId),
      this.detectAgentLoops(orgId),
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
      .where('event.orgId = :orgId', { orgId })
      .andWhere('event.latencyMs > :threshold', { threshold: parseFloat(avg.avg) * 2 })
      .orderBy('event.timestamp', 'DESC')
      .limit(20)
      .getMany();
  }

  private async detectErrorBursts(orgId: string) {
    return this.eventRepo.query(`
      SELECT date_trunc('minute', timestamp) AS minute, COUNT(*) AS error_count
      FROM events
      WHERE "orgId" = $1 AND level IN ('error', 'fatal')
      GROUP BY minute
      HAVING COUNT(*) > 5
      ORDER BY minute DESC
      LIMIT 20
    `, [orgId]);
  }

  private async detectAgentLoops(orgId: string) {
    return this.eventRepo.query(`
      SELECT "sessionId", "agentId", message, COUNT(*) AS repeat_count
      FROM events
      WHERE "orgId" = $1 AND category = 'tool_invocation'
      GROUP BY "sessionId", "agentId", message
      HAVING COUNT(*) > 10
      ORDER BY repeat_count DESC
      LIMIT 20
    `, [orgId]);
  }
}
