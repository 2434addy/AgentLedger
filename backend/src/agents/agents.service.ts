import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { encodeCursor, decodeCursor, CursorPaginatedResponse } from '../common/dto/cursor-pagination.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent) private agentRepo: Repository<Agent>,
  ) {}

  async listByOrg(
    orgId: string,
    filters: { limit?: number; cursor?: string } = {},
  ): Promise<CursorPaginatedResponse<Agent>> {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 500);

    const qb = this.agentRepo.createQueryBuilder('agent')
      .where('agent.orgId = :orgId', { orgId })
      .orderBy('agent.createdAt', 'DESC')
      .addOrderBy('agent.id', 'DESC');

    if (filters.cursor) {
      const decoded = decodeCursor(filters.cursor);
      qb.andWhere(
        '(agent.createdAt < :cursorTs OR (agent.createdAt = :cursorTs AND agent.id < :cursorId))',
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

  async create(orgId: string, dto: CreateAgentDto) {
    return this.agentRepo.save(this.agentRepo.create({ ...dto, orgId }));
  }

  async findOne(orgId: string, id: string) {
    const agent = await this.agentRepo.findOne({ where: { id, orgId } });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async update(orgId: string, id: string, dto: UpdateAgentDto) {
    await this.findOne(orgId, id); // verify exists and belongs to org
    await this.agentRepo.update(
      { id, orgId },
      {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.modelProvider !== undefined && { modelProvider: dto.modelProvider }),
        ...(dto.modelId !== undefined && { modelId: dto.modelId }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as Record<string, any> }),
      },
    );
    return this.findOne(orgId, id);
  }

  async remove(orgId: string, id: string) {
    const agent = await this.findOne(orgId, id);
    await this.agentRepo.remove(agent);
    return { message: 'Agent deleted' };
  }
}
