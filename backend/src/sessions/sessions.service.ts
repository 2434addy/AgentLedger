import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { encodeCursor, decodeCursor, CursorPaginatedResponse } from '../common/dto/cursor-pagination.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
  ) {}

  async listByOrg(
    orgId: string,
    filters: { agentId?: string; limit?: number; cursor?: string } = {},
  ): Promise<CursorPaginatedResponse<Session>> {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 500);

    const qb = this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.agent', 'agent')
      .where('session.orgId = :orgId', { orgId })
      .orderBy('session.startedAt', 'DESC')
      .addOrderBy('session.id', 'DESC');

    if (filters.agentId) {
      qb.andWhere('session.agentId = :agentId', { agentId: filters.agentId });
    }

    if (filters.cursor) {
      const decoded = decodeCursor(filters.cursor);
      qb.andWhere(
        '(session.startedAt < :cursorTs OR (session.startedAt = :cursorTs AND session.id < :cursorId))',
        { cursorTs: decoded['startedAt'], cursorId: decoded['id'] },
      );
    }

    const results = await qb.take(limit + 1).getMany();
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor =
      hasMore && data.length > 0
        ? encodeCursor({ startedAt: data[data.length - 1].startedAt, id: data[data.length - 1].id })
        : null;
    return { data, nextCursor, hasMore };
  }

  async create(orgId: string, dto: CreateSessionDto) {
    return this.sessionRepo.save(this.sessionRepo.create({ ...dto, orgId }));
  }

  async findOne(orgId: string, id: string) {
    const session = await this.sessionRepo.findOne({ where: { id, orgId }, relations: ['agent'] });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async update(orgId: string, id: string, dto: UpdateSessionDto) {
    const session = await this.findOne(orgId, id);
    Object.assign(session, dto);
    return this.sessionRepo.save(session);
  }
}
