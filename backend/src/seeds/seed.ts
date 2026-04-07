import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

import { Organisation, OrgPlan } from '../organisations/entities/organisation.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { Agent, AgentStatus } from '../agents/entities/agent.entity';
import { Session, SessionStatus } from '../sessions/entities/session.entity';
import { Event, EventCategory, EventLevel } from '../events/entities/event.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { computeEventHash } from '../events/event-hash.util';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,
  extra: { max: 5, idleTimeoutMillis: 30000 },
  entities: [Organisation, User, RefreshToken, ApiKey, Agent, Session, Event, AuditLog],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  const orgRepo = dataSource.getRepository(Organisation);
  const userRepo = dataSource.getRepository(User);
  const agentRepo = dataSource.getRepository(Agent);
  const sessionRepo = dataSource.getRepository(Session);
  const eventRepo = dataSource.getRepository(Event);

  // 1. Organisation
  let org = await orgRepo.findOne({ where: { slug: 'demo-org' } });
  if (!org) {
    org = orgRepo.create({ name: 'Demo Org', slug: 'demo-org', plan: OrgPlan.FREE });
    org = await orgRepo.save(org);
    console.log('Created organisation:', org.name);
  } else {
    console.log('Organisation already exists:', org.name);
  }

  // 2. User
  let user = await userRepo.findOne({ where: { email: 'demo@agentledger.io' } });
  if (!user) {
    const demoPassword = process.env.DEMO_PASSWORD;
    if (!demoPassword) {
      console.error('DEMO_PASSWORD env var is required for seeding');
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(demoPassword, 12);
    user = userRepo.create({
      orgId: org.id,
      email: 'demo@agentledger.io',
      passwordHash,
      displayName: 'Demo User',
      role: UserRole.OWNER,
    });
    user = await userRepo.save(user);
    console.log('Created user:', user.email);
  } else {
    console.log('User already exists:', user.email);
  }

  // 3. Agents
  const agentDefs = [
    { name: 'CodeReview-GPT', description: 'Automated code review agent', modelProvider: 'openai', modelId: 'gpt-4-turbo', status: AgentStatus.ACTIVE },
    { name: 'DataPipeline-Claude', description: 'ETL pipeline orchestrator', modelProvider: 'anthropic', modelId: 'claude-sonnet-4-20250514', status: AgentStatus.IDLE },
    { name: 'SupportBot-Gemini', description: 'Customer support chatbot', modelProvider: 'google', modelId: 'gemini-1.5-pro', status: AgentStatus.OFFLINE },
  ];

  const agents: Agent[] = [];
  for (const def of agentDefs) {
    let agent = await agentRepo.findOne({ where: { name: def.name, orgId: org.id } });
    if (!agent) {
      agent = agentRepo.create({ ...def, orgId: org.id });
      agent = await agentRepo.save(agent);
      console.log('Created agent:', agent.name);
    } else {
      console.log('Agent already exists:', agent.name);
    }
    agents.push(agent);
  }

  // 4. Sessions
  const sessionDefs = [
    { agentIdx: 0, status: SessionStatus.COMPLETED },
    { agentIdx: 0, status: SessionStatus.ACTIVE },
    { agentIdx: 1, status: SessionStatus.COMPLETED },
    { agentIdx: 1, status: SessionStatus.FAILED },
    { agentIdx: 2, status: SessionStatus.ACTIVE },
  ];

  const sessions: Session[] = [];
  const existingSessions = await sessionRepo.find({ where: { orgId: org.id } });
  if (existingSessions.length >= 5) {
    console.log('Sessions already exist, skipping');
    sessions.push(...existingSessions.slice(0, 5));
  } else {
    for (const def of sessionDefs) {
      const session = sessionRepo.create({
        orgId: org.id,
        agentId: agents[def.agentIdx].id,
        status: def.status,
        endedAt: def.status !== SessionStatus.ACTIVE ? new Date() : undefined,
      });
      sessions.push(await sessionRepo.save(session));
    }
    console.log('Created 5 sessions');
  }

  // 5. Events
  const existingEvents = await eventRepo.find({ where: { orgId: org.id }, take: 1 });
  if (existingEvents.length > 0) {
    console.log('Events already exist, skipping');
  } else {
    const categories = Object.values(EventCategory);
    const levels = Object.values(EventLevel);
    const events: Partial<Event>[] = [];

    // Sample state shapes for seed data
    const sampleStates = [
      { status: 'idle', memory: { context: [] }, toolsAvailable: ['search', 'read', 'write'] },
      { status: 'thinking', memory: { context: ['user asked a question'] }, toolsAvailable: ['search', 'read', 'write'] },
      { status: 'executing', memory: { context: ['user asked a question', 'found relevant docs'] }, currentTool: 'search', toolsAvailable: ['search', 'read', 'write'] },
      { status: 'responding', memory: { context: ['user asked a question', 'found relevant docs', 'composed answer'] }, tokensUsed: 1234, toolsAvailable: ['search', 'read', 'write'] },
      { status: 'idle', memory: { context: ['user asked a question', 'found relevant docs', 'composed answer', 'delivered response'] }, tokensUsed: 1580, toolsAvailable: ['search', 'read', 'write'] },
    ];

    for (let i = 0; i < 20; i++) {
      const sessionIdx = i % 5;
      const session = sessions[sessionIdx];
      const agentIdx = sessionDefs[sessionIdx].agentIdx;
      const category = categories[i % categories.length];
      const level = levels[i % levels.length];
      const message = `Event ${i + 1}: ${category} at ${level} level`;
      const timestamp = new Date();
      const payload = null;
      const stateBefore = sampleStates[i % sampleStates.length];
      const stateAfter = sampleStates[(i + 1) % sampleStates.length];
      const hash = computeEventHash({
        agentId: agents[agentIdx].id,
        category,
        level,
        message,
        timestamp,
        payload,
        stateBefore,
        stateAfter,
      });
      events.push({
        orgId: org.id,
        sessionId: session.id,
        agentId: agents[agentIdx].id,
        category,
        level,
        message,
        tokensInput: Math.floor(Math.random() * 2000) + 100,
        tokensOutput: Math.floor(Math.random() * 1000) + 50,
        costUsd: parseFloat((Math.random() * 0.05).toFixed(6)),
        latencyMs: Math.floor(Math.random() * 5000) + 100,
        timestamp,
        stateBefore,
        stateAfter,
        hash,
        tampered: false,
      });
    }

    await eventRepo.save(events.map(e => eventRepo.create(e as Event)));
    console.log('Created 20 events');

    // Update session totals
    for (const session of sessions) {
      const result = await eventRepo
        .createQueryBuilder('event')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(event.costUsd), 0)', 'cost')
        .where('event.sessionId = :sessionId', { sessionId: session.id })
        .getRawOne();
      await sessionRepo.update(session.id, {
        totalEvents: parseInt(result.count),
        totalCost: parseFloat(result.cost),
      });
    }
    console.log('Updated session totals');
  }

  await dataSource.destroy();
  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
