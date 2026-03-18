import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Organisation } from '../../organisations/entities/organisation.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Agent } from '../../agents/entities/agent.entity';

export enum EventCategory {
  AGENT_LIFECYCLE = 'agent_lifecycle',
  LLM_CALL = 'llm_call',
  TOOL_INVOCATION = 'tool_invocation',
  USER_ACTION = 'user_action',
  SYSTEM = 'system',
  SECURITY = 'security',
  GUARDRAIL = 'guardrail',
}

export enum EventLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column({ nullable: true })
  sessionId: string | null;

  @Column()
  agentId: string;

  @Column({ type: 'enum', enum: EventCategory })
  category: EventCategory;

  @Column({ type: 'enum', enum: EventLevel })
  level: EventLevel;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  tokensInput: number;

  @Column({ type: 'int', nullable: true })
  tokensOutput: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  costUsd: number;

  @Column({ type: 'int', nullable: true })
  latencyMs: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  timestamp: Date;

  @ManyToOne(() => Organisation)
  @JoinColumn({ name: 'orgId' })
  organisation: Organisation;

  @ManyToOne(() => Session, (session) => session.events, { nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agentId' })
  agent: Agent;
}

