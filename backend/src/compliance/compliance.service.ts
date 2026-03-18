import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventCategory } from '../events/entities/event.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async getReport(orgId: string) {
    const [guardrailEvents, securityEvents, totalAuditLogs] = await Promise.all([
      this.eventRepo.count({ where: { orgId, category: EventCategory.GUARDRAIL } }),
      this.eventRepo.count({ where: { orgId, category: EventCategory.SECURITY } }),
      this.auditRepo.count({ where: { orgId } }),
    ]);

    return {
      guardrailEvents,
      securityEvents,
      totalAuditLogs,
      generatedAt: new Date().toISOString(),
    };
  }

  async getChecks(orgId: string) {
    const [hasGuardrails, hasUserActions, hasSecurityEvents] = await Promise.all([
      this.eventRepo.count({ where: { orgId, category: EventCategory.GUARDRAIL } }).then(c => c > 0),
      this.eventRepo.count({ where: { orgId, category: EventCategory.USER_ACTION } }).then(c => c > 0),
      this.eventRepo.count({ where: { orgId, category: EventCategory.SECURITY } }).then(c => c > 0),
    ]);

    return [
      { name: 'Guardrail monitoring', status: hasGuardrails ? 'pass' : 'warn', description: 'Guardrail events are being logged' },
      { name: 'Audit trail', status: hasUserActions ? 'pass' : 'warn', description: 'User actions are being audited' },
      { name: 'Security monitoring', status: hasSecurityEvents ? 'pass' : 'warn', description: 'Security events are being tracked' },
    ];
  }
}
