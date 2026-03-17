import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async listByOrg(orgId: string) {
    return this.apiKeyRepo.find({
      where: { orgId, revokedAt: IsNull() },
      select: ['id', 'keyPrefix', 'name', 'lastUsedAt', 'createdAt'],
    });
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
