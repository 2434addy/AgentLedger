import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Organisation } from '../../organisations/entities/organisation.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { ApiKey } from '../../api-keys/entities/api-key.entity';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  displayName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Organisation, (org) => org.users)
  @JoinColumn({ name: 'orgId' })
  organisation: Organisation;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];
}
