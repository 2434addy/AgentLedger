import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalStatus } from './entities/approval.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval) private readonly approvalRepo: Repository<Approval>,
  ) {}

  async create(orgId: string, dto: CreateApprovalDto): Promise<Approval> {
    const approval = this.approvalRepo.create({
      orgId,
      agentId: dto.agentId,
      sessionId: dto.sessionId ?? null,
      type: dto.type,
      status: ApprovalStatus.PENDING,
      payload: dto.payload,
      requestedBy: dto.requestedBy,
      expiresAt: dto.expiresAt
        ? new Date(dto.expiresAt)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return this.approvalRepo.save(approval);
  }

  async listByOrg(orgId: string, status?: ApprovalStatus): Promise<Approval[]> {
    const where: { orgId: string; status?: ApprovalStatus } = { orgId };
    if (status) where.status = status;
    return this.approvalRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['agent'],
    });
  }

  async listPending(orgId: string): Promise<Approval[]> {
    return this.approvalRepo
      .createQueryBuilder('approval')
      .leftJoinAndSelect('approval.agent', 'agent')
      .where('approval.orgId = :orgId', { orgId })
      .andWhere('approval.status = :status', { status: ApprovalStatus.PENDING })
      .andWhere('approval.expiresAt > :now', { now: new Date() })
      .orderBy('approval.createdAt', 'DESC')
      .getMany();
  }

  async findOne(orgId: string, id: string): Promise<Approval> {
    const approval = await this.approvalRepo.findOne({
      where: { id, orgId },
      relations: ['agent'],
    });
    if (!approval) throw new NotFoundException('Approval not found');
    return approval;
  }

  async approve(orgId: string, id: string, userId: string, comment?: string): Promise<Approval> {
    const approval = await this.findOne(orgId, id);
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }
    if (new Date() > approval.expiresAt) {
      await this.approvalRepo.update({ id, orgId }, { status: ApprovalStatus.EXPIRED });
      throw new BadRequestException('Approval has expired');
    }
    await this.approvalRepo.update(
      { id, orgId },
      {
        status: ApprovalStatus.APPROVED,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewComment: comment ?? null,
      },
    );
    return this.findOne(orgId, id);
  }

  async reject(orgId: string, id: string, userId: string, comment?: string): Promise<Approval> {
    const approval = await this.findOne(orgId, id);
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }
    await this.approvalRepo.update(
      { id, orgId },
      {
        status: ApprovalStatus.REJECTED,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewComment: comment ?? null,
      },
    );
    return this.findOne(orgId, id);
  }
}
