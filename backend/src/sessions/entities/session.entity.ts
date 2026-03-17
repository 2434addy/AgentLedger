import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Organisation } from '../../organisations/entities/organisation.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Event } from '../../events/entities/event.entity';

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column()
  agentId: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ type: 'int', default: 0 })
  totalEvents: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  totalCost: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Organisation)
  @JoinColumn({ name: 'orgId' })
  organisation: Organisation;

  @ManyToOne(() => Agent, (agent) => agent.sessions)
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @OneToMany(() => Event, (event) => event.session)
  events: Event[];
}
