import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { Organisation } from './organisations/entities/organisation.entity';
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';
import { ApiKey } from './api-keys/entities/api-key.entity';
import { Agent } from './agents/entities/agent.entity';
import { Session } from './sessions/entities/session.entity';
import { Event } from './events/entities/event.entity';
import { AuditLog } from './audit-logs/entities/audit-log.entity';
import { Approval } from './approvals/entities/approval.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // Neon pooled connections (PgBouncer) require SSL but use certificates
  // that may not chain to a trusted root — accept them explicitly.
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  extra: { max: 5, idleTimeoutMillis: 30000 },
  entities: [Organisation, User, RefreshToken, PasswordResetToken, ApiKey, Agent, Session, Event, AuditLog, Approval],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
