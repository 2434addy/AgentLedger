import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent) private agentRepo: Repository<Agent>,
  ) {}

  async listByOrg(orgId: string) {
    return this.agentRepo.find({ where: { orgId } });
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
    const agent = await this.findOne(orgId, id);
    Object.assign(agent, dto);
    return this.agentRepo.save(agent);
  }

  async remove(orgId: string, id: string) {
    const agent = await this.findOne(orgId, id);
    await this.agentRepo.remove(agent);
    return { message: 'Agent deleted' };
  }
}
