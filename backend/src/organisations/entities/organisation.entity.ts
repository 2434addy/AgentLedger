import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiKey } from '../../api-keys/entities/api-key.entity';
import { Agent } from '../../agents/entities/agent.entity';

export enum OrgPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('organisations')
export class Organisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'enum', enum: OrgPlan, default: OrgPlan.FREE })
  plan: OrgPlan;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => User, (user) => user.organisation)
  users: User[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.organisation)
  apiKeys: ApiKey[];

  @OneToMany(() => Agent, (agent) => agent.organisation)
  agents: Agent[];
}
