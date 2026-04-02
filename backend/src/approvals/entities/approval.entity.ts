import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organisation } from '../../organisations/entities/organisation.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { User } from '../../users/entities/user.entity';

export enum ApprovalType {
  TOOL_EXECUTION = 'tool_execution',
  DATA_ACCESS = 'data_access',
  COST_THRESHOLD = 'cost_threshold',
  CUSTOM = 'custom',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column()
  agentId: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null;

  @Column({ type: 'enum', enum: ApprovalType })
  type: ApprovalType;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column()
  requestedBy: string;

  @Column({ nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewComment: string | null;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Organisation)
  @JoinColumn({ name: 'orgId' })
  organisation: Organisation;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;
}
