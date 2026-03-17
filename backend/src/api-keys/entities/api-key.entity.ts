import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organisation } from '../../organisations/entities/organisation.entity';
import { User } from '../../users/entities/user.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column()
  userId: string;

  @Column()
  keyHash: string;

  @Column()
  keyPrefix: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  lastUsedAt: Date;

  @Column({ nullable: true })
  revokedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Organisation, (org) => org.apiKeys)
  @JoinColumn({ name: 'orgId' })
  organisation: Organisation;

  @ManyToOne(() => User, (user) => user.apiKeys)
  @JoinColumn({ name: 'userId' })
  user: User;
}
