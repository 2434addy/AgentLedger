import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Organisation } from '../../organisations/entities/organisation.entity';
import { Session } from '../../sessions/entities/session.entity';

export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  ERROR = 'error',
  OFFLINE = 'offline',
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  modelProvider: string;

  @Column()
  modelId: string;

  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.OFFLINE })
  status: AgentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organisation, (org) => org.agents)
  @JoinColumn({ name: 'orgId' })
  organisation: Organisation;

  @OneToMany(() => Session, (session) => session.agent)
  sessions: Session[];
}
