import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from '../../api-keys/entities/api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    if (!apiKey) return false;

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const stored = await this.apiKeyRepo.findOne({ where: { keyHash, revokedAt: IsNull() } });
    if (!stored) return false;

    stored.lastUsedAt = new Date();
    await this.apiKeyRepo.save(stored);

    request.user = { orgId: stored.orgId, userId: stored.userId, isApiKey: true };
    return true;
  }
}
