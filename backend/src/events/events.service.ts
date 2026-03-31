import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Event } from './entities/event.entity';
import { Session } from '../sessions/entities/session.entity';
import { Agent, AgentStatus } from '../agents/entities/agent.entity';
import { CreateEventsDto } from './dto/create-events.dto';
import { computeEventHash, computeChainedHash } from './event-hash.util';
import { EventsGateway } from '../gateways/events.gateway';
import { encodeCursor, decodeCursor, CursorPaginatedResponse } from '../common/dto/cursor-pagination.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Agent) private agentRepo: Repository<Agent>,
    private dataSource: DataSource,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async listByOrg(
    orgId: string,
    filters: {
      sessionId?: string;
      agentId?: string;
      category?: string;
      level?: string;
      limit?: number;
      page?: number;
      cursor?: string;
    },
  ): Promise<Event[] | CursorPaginatedResponse<Event>> {
    const limit = filters.limit ?? 100;

    const qb = this.eventRepo.createQueryBuilder('event')
      .where('event.orgId = :orgId', { orgId })
      .orderBy('event.timestamp', 'DESC')
      .addOrderBy('event.id', 'DESC');

    if (filters.sessionId) qb.andWhere('event.sessionId = :sessionId', { sessionId: filters.sessionId });
    if (filters.agentId) qb.andWhere('event.agentId = :agentId', { agentId: filters.agentId });
    if (filters.category) qb.andWhere('event.category = :category', { category: filters.category });
    if (filters.level) qb.andWhere('event.level = :level', { level: filters.level });

    if (filters.cursor) {
      const decoded = decodeCursor(filters.cursor);
      qb.andWhere(
        '(event.timestamp < :cursorTs OR (event.timestamp = :cursorTs AND event.id < :cursorId))',
        { cursorTs: decoded['timestamp'], cursorId: decoded['id'] },
      );

      const results = await qb.take(limit + 1).getMany();
      const hasMore = results.length > limit;
      const data = hasMore ? results.slice(0, limit) : results;
      const nextCursor =
        hasMore && data.length > 0
          ? encodeCursor({ timestamp: data[data.length - 1].timestamp, id: data[data.length - 1].id })
          : null;
      return { data, nextCursor, hasMore };
    }

    // Offset-based (backward-compatible)
    const page = filters.page ?? 1;
    return qb.skip((page - 1) * limit).take(limit).getMany();
  }

  /**
   * Bulk-create events with SHA-256 hash chaining.
   * Uses a transaction with advisory lock to prevent concurrent chain forks.
   * Each event's hash = SHA256(canonical_data + prev_event_hash).
   */
  async bulkCreate(orgId: string, dto: CreateEventsDto) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(Event);
      const sessionRepo = manager.getRepository(Session);
      const agentRepo = manager.getRepository(Agent);

      // Advisory lock scoped to this org to prevent concurrent chain forks.
      // Use a hash of the orgId as the lock key (PostgreSQL advisory locks take bigint).
      const lockKey = this.orgIdToLockKey(orgId);
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

      // Auto-create any sessions that don't exist yet
      const sessionIds = [...new Set(dto.events.map(e => e.sessionId).filter(Boolean))] as string[];
      if (sessionIds.length > 0) {
        const existing = await sessionRepo
          .createQueryBuilder('s')
          .select('s.id')
          .where('s.id IN (:...ids)', { ids: sessionIds })
          .andWhere('s.orgId = :orgId', { orgId })
          .getMany();
        const existingIds = new Set(existing.map(s => s.id));
        const missing = sessionIds.filter(id => !existingIds.has(id));
        if (missing.length > 0) {
          const sessionsToCreate = missing.map(sid => {
            const event = dto.events.find(e => e.sessionId === sid)!;
            return sessionRepo.create({ id: sid, orgId, agentId: event.agentId });
          });
          await sessionRepo.save(sessionsToCreate);
        }
      }

      // Fetch the last event in the chain for this org
      const lastEvent = await eventRepo
        .createQueryBuilder('event')
        .where('event.orgId = :orgId', { orgId })
        .andWhere('event.seqNumber IS NOT NULL')
        .orderBy('event.seqNumber', 'DESC')
        .limit(1)
        .getOne();

      let prevHash = lastEvent?.hash ?? '';
      let seqNumber = lastEvent?.seqNumber ? Number(lastEvent.seqNumber) : 0;

      // Sort incoming events by their occurredAt (or creation order) for deterministic chaining
      const sortedItems = [...dto.events].sort((a, b) => {
        const ta = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
        const tb = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
        return ta - tb;
      });

      const events = sortedItems.map(e => {
        const { occurredAt, stateBefore, stateAfter, ...rest } = e;
        const timestamp = occurredAt ? new Date(occurredAt) : new Date();

        seqNumber += 1;
        const hash = computeChainedHash({
          agentId: rest.agentId,
          category: rest.category,
          level: rest.level,
          message: rest.message,
          timestamp,
          payload: rest.payload ?? null,
          stateBefore: stateBefore ?? null,
          stateAfter: stateAfter ?? null,
        }, prevHash);

        const event = eventRepo.create({
          ...rest,
          orgId,
          timestamp,
          stateBefore: stateBefore ?? null,
          stateAfter: stateAfter ?? null,
          hash,
          prevHash: prevHash || null, // null for genesis event (empty string becomes null)
          seqNumber,
          tampered: false,
        });

        prevHash = hash;
        return event;
      });

      const result = await eventRepo.save(events);

      // Update session totals — scoped to orgId to prevent cross-org manipulation
      const savedSessionIds = [...new Set(result.map(e => e.sessionId).filter(Boolean))];
      for (const sessionId of savedSessionIds) {
        const totals = await eventRepo
          .createQueryBuilder('event')
          .select('COUNT(*)', 'count')
          .addSelect('COALESCE(SUM(event.costUsd), 0)', 'cost')
          .where('event.sessionId = :sessionId', { sessionId })
          .andWhere('event.orgId = :orgId', { orgId })
          .getRawOne();
        await sessionRepo
          .createQueryBuilder()
          .update()
          .set({
            totalEvents: parseInt(totals.count),
            totalCost: parseFloat(totals.cost),
          })
          .where('id = :sessionId AND "orgId" = :orgId', { sessionId, orgId })
          .execute();
      }

      // Update agent lastSeenAt and status
      const agentIds = [...new Set(result.map(e => e.agentId))];
      for (const agentId of agentIds) {
        await agentRepo
          .createQueryBuilder()
          .update()
          .set({
            lastSeenAt: new Date(),
            status: AgentStatus.ACTIVE,
          })
          .where('id = :agentId AND "orgId" = :orgId', { agentId, orgId })
          .execute();
      }

      return result;
    });

    // Emit real-time events to connected WebSocket clients
    this.eventsGateway.emitEventsCreated(orgId, saved as unknown as Record<string, unknown>[]);

    return saved;
  }

  async findOne(orgId: string, id: string) {
    const event = await this.eventRepo.findOne({ where: { id, orgId } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /**
   * Verify integrity of a single event by recomputing its hash.
   * Supports both chained (has prevHash) and legacy (standalone) events.
   */
  async verifyOne(orgId: string, id: string) {
    const event = await this.findOne(orgId, id);

    const hashData = {
      agentId: event.agentId,
      category: event.category,
      level: event.level,
      message: event.message,
      timestamp: event.timestamp,
      payload: event.payload,
      stateBefore: event.stateBefore,
      stateAfter: event.stateAfter,
    };

    // Use chained hash if event has prevHash or seqNumber, otherwise legacy
    const recomputed = event.seqNumber != null
      ? computeChainedHash(hashData, event.prevHash ?? '')
      : computeEventHash(hashData);

    const valid = event.hash === recomputed;
    if (!valid && !event.tampered) {
      await this.eventRepo.update({ id, orgId }, { tampered: true });
      event.tampered = true;
    }
    return { id: event.id, valid, storedHash: event.hash, recomputedHash: recomputed };
  }

  /**
   * Batch-verify all events for an org using cursor-based pagination.
   * Checks per-event hash integrity (both chained and legacy).
   */
  async verifyByOrg(orgId: string) {
    const BATCH_SIZE = 1000;
    const tampered: string[] = [];
    let total = 0;
    let lastId: string | null = null;

    for (;;) {
      const qb = this.eventRepo.createQueryBuilder('event')
        .where('event.orgId = :orgId', { orgId })
        .orderBy('event.id', 'ASC')
        .take(BATCH_SIZE);

      if (lastId) {
        qb.andWhere('event.id > :lastId', { lastId });
      }

      const batch = await qb.getMany();
      if (batch.length === 0) break;

      total += batch.length;
      const idsToFlag: string[] = [];

      for (const event of batch) {
        const hashData = {
          agentId: event.agentId,
          category: event.category,
          level: event.level,
          message: event.message,
          timestamp: event.timestamp,
          payload: event.payload,
          stateBefore: event.stateBefore,
          stateAfter: event.stateAfter,
        };

        const recomputed = event.seqNumber != null
          ? computeChainedHash(hashData, event.prevHash ?? '')
          : computeEventHash(hashData);

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

      lastId = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) break;
    }

    return { total, valid: total - tampered.length, tampered: tampered.length, tamperedIds: tampered };
  }

  /**
   * Verify the CHAIN integrity: walk events in sequence order
   * and verify each event's prevHash matches the preceding event's hash.
   */
  async verifyChain(orgId: string) {
    const BATCH_SIZE = 1000;
    let lastSeq = 0;
    let expectedPrevHash = '';
    let total = 0;
    let valid = 0;
    const broken: Array<{ eventId: string; seqNumber: number; reason: string }> = [];

    for (;;) {
      const batch = await this.eventRepo
        .createQueryBuilder('event')
        .where('event.orgId = :orgId', { orgId })
        .andWhere('event.seqNumber IS NOT NULL')
        .andWhere('event.seqNumber > :lastSeq', { lastSeq })
        .orderBy('event.seqNumber', 'ASC')
        .take(BATCH_SIZE)
        .getMany();

      if (batch.length === 0) break;

      for (const event of batch) {
        total += 1;
        const seq = Number(event.seqNumber);

        // Check chain linkage: prevHash should match the hash of the previous event
        const actualPrevHash = event.prevHash ?? '';
        if (actualPrevHash !== expectedPrevHash) {
          broken.push({
            eventId: event.id,
            seqNumber: seq,
            reason: `prevHash mismatch: expected ${expectedPrevHash.slice(0, 16)}..., got ${actualPrevHash.slice(0, 16)}...`,
          });
        } else {
          // Also verify the hash itself is correct
          const recomputed = computeChainedHash({
            agentId: event.agentId,
            category: event.category,
            level: event.level,
            message: event.message,
            timestamp: event.timestamp,
            payload: event.payload,
            stateBefore: event.stateBefore,
            stateAfter: event.stateAfter,
          }, actualPrevHash);

          if (event.hash !== recomputed) {
            broken.push({
              eventId: event.id,
              seqNumber: seq,
              reason: 'hash mismatch: event data was modified',
            });
          } else {
            valid += 1;
          }
        }

        expectedPrevHash = event.hash ?? '';
        lastSeq = seq;
      }

      if (batch.length < BATCH_SIZE) break;
    }

    return {
      total,
      valid,
      broken: broken.length,
      chainIntact: broken.length === 0,
      brokenLinks: broken.slice(0, 100), // Limit response size
    };
  }

  /**
   * Convert orgId (UUID) to a bigint for PostgreSQL advisory lock.
   * Uses first 16 hex chars (64 bits) to minimize collision risk across orgs.
   */
  private orgIdToLockKey(orgId: string): string {
    const hex = orgId.replace(/-/g, '').slice(0, 16);
    return BigInt('0x' + hex).toString();
  }
}
