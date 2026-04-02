import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { encodeCursor, decodeCursor, CursorPaginatedResponse } from '../common/dto/cursor-pagination.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async listByOrg(
    orgId: string,
    filters: { limit?: number; cursor?: string } = {},
  ): Promise<CursorPaginatedResponse<ApiKey>> {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 500);

    const qb = this.apiKeyRepo.createQueryBuilder('apiKey')
      .select(['apiKey.id', 'apiKey.keyPrefix', 'apiKey.name', 'apiKey.lastUsedAt', 'apiKey.createdAt'])
      .where('apiKey.orgId = :orgId', { orgId })
      .andWhere('apiKey.revokedAt IS NULL')
      .orderBy('apiKey.createdAt', 'DESC')
      .addOrderBy('apiKey.id', 'DESC');

    if (filters.cursor) {
      const decoded = decodeCursor(filters.cursor);
      qb.andWhere(
        '(apiKey.createdAt < :cursorTs OR (apiKey.createdAt = :cursorTs AND apiKey.id < :cursorId))',
        { cursorTs: decoded['createdAt'], cursorId: decoded['id'] },
      );
    }

    const results = await qb.take(limit + 1).getMany();
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor =
      hasMore && data.length > 0
        ? encodeCursor({ createdAt: data[data.length - 1].createdAt, id: data[data.length - 1].id })
        : null;
    return { data, nextCursor, hasMore };
  }

  async create(orgId: string, userId: string, dto: CreateApiKeyDto) {
    const rawKey = 'al_live_sk_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 16);

    const apiKey = await this.apiKeyRepo.save(this.apiKeyRepo.create({
      orgId,
      userId,
      keyHash,
      keyPrefix,
      name: dto.name,
    }));

    return {
      id: apiKey.id,
      key: rawKey,
      keyPrefix,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
    };
  }

  async revoke(orgId: string, id: string) {
    const key = await this.apiKeyRepo.findOne({ where: { id, orgId } });
    if (!key) throw new NotFoundException('API key not found');
    key.revokedAt = new Date();
    await this.apiKeyRepo.save(key);
    return { message: 'API key revoked' };
  }
}
