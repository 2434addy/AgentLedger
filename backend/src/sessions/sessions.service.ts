import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
  ) {}

  async listByOrg(orgId: string, agentId?: string) {
    const where: any = { orgId };
    if (agentId) where.agentId = agentId;
    return this.sessionRepo.find({ where, relations: ['agent'], order: { startedAt: 'DESC' } });
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
