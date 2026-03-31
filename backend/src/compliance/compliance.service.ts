import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventCategory, EventLevel } from '../events/entities/event.entity';
import { AuditLog, AuditAction } from '../audit-logs/entities/audit-log.entity';
import { ComplianceFramework } from './dto/generate-report.dto';

type SectionStatus = 'pass' | 'warn' | 'fail';

interface ReportSection {
  id: string;
  title: string;
  status: SectionStatus;
  score: number;
  evidence: string;
  recommendation: string;
  eventCount: number;
}

interface ReportSummary {
  totalEventsAnalyzed: number;
  totalAuditLogsAnalyzed: number;
  sectionsPass: number;
  sectionsWarn: number;
  sectionsFail: number;
}

export interface ComplianceReport {
  framework: string;
  frameworkName: string;
  orgId: string;
  generatedAt: string;
  overallScore: number;
  overallStatus: SectionStatus;
  sections: ReportSection[];
  summary: ReportSummary;
}

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

  async generateReport(orgId: string, framework: ComplianceFramework): Promise<ComplianceReport> {
    switch (framework) {
      case ComplianceFramework.EU_AI_ACT:
        return this.generateEuAiActReport(orgId);
      case ComplianceFramework.SOC2:
        return this.generateSoc2Report(orgId);
      case ComplianceFramework.ISO_42001:
        return this.generateIso42001Report(orgId);
    }
  }

  // ─── EU AI Act ─────────────────────────────────────────────────────────────

  private async generateEuAiActReport(orgId: string): Promise<ComplianceReport> {
    const [
      guardrailCount,
      agentLifecycleCount,
      userActionCount,
      totalEventCount,
      totalAuditCount,
      tamperedCount,
    ] = await Promise.all([
      this.eventRepo.count({ where: { orgId, category: EventCategory.GUARDRAIL } }),
      this.eventRepo.count({ where: { orgId, category: EventCategory.AGENT_LIFECYCLE } }),
      this.eventRepo.count({ where: { orgId, category: EventCategory.USER_ACTION } }),
      this.eventRepo.count({ where: { orgId } }),
      this.auditRepo.count({ where: { orgId } }),
      this.eventRepo.count({ where: { orgId, tampered: true } }),
    ]);

    const sections: ReportSection[] = [
      this.scoreSection({
        id: 'article-9',
        title: 'Article 9 — Risk Management',
        count: guardrailCount,
        lowThreshold: 1,
        highThreshold: 10,
        evidence: guardrailCount > 0
          ? `${guardrailCount} guardrail event(s) recorded, indicating active risk controls are in place.`
          : 'No guardrail events found. Risk management controls may not be active.',
        recommendation: guardrailCount >= 10
          ? 'Guardrail coverage is strong. Continue monitoring and document risk assessment procedures.'
          : 'Increase guardrail event coverage. Implement automated risk checks on all agent actions.',
      }),
      this.scoreSection({
        id: 'article-13',
        title: 'Article 13 — Transparency',
        count: agentLifecycleCount,
        lowThreshold: 1,
        highThreshold: 5,
        evidence: agentLifecycleCount > 0
          ? `${agentLifecycleCount} agent lifecycle event(s) recorded, showing agent registration and model disclosure activity.`
          : 'No agent lifecycle events found. Agent registration and model disclosure may not be logged.',
        recommendation: agentLifecycleCount >= 5
          ? 'Transparency logging is active. Ensure model names and versions are included in lifecycle payloads.'
          : 'Log agent registration, model type, and version on every agent start. Add model disclosure fields to event payloads.',
      }),
      this.scoreSection({
        id: 'article-14',
        title: 'Article 14 — Human Oversight',
        count: userActionCount,
        lowThreshold: 1,
        highThreshold: 10,
        evidence: userActionCount > 0
          ? `${userActionCount} user action event(s) recorded, indicating human-in-the-loop controls are active.`
          : 'No user action events found. Human oversight integration may be missing.',
        recommendation: userActionCount >= 10
          ? 'Human oversight is being logged. Verify approval workflows are enforced for high-risk decisions.'
          : 'Implement human approval events for high-risk agent actions and log them as USER_ACTION events.',
      }),
      this.scoreQualitySection({
        id: 'article-17',
        title: 'Article 17 — Quality Management',
        totalEvents: totalEventCount,
        totalAuditLogs: totalAuditCount,
        tamperedCount,
      }),
    ];

    return this.buildReport({
      framework: ComplianceFramework.EU_AI_ACT,
      frameworkName: 'EU AI Act',
      orgId,
      sections,
      totalEventsAnalyzed: totalEventCount,
      totalAuditLogsAnalyzed: totalAuditCount,
    });
  }

  // ─── SOC 2 ─────────────────────────────────────────────────────────────────

  private async generateSoc2Report(orgId: string): Promise<ComplianceReport> {
    const [
      securityCount,
      loginLogoutCount,
      systemCount,
      tamperedCount,
      apiKeyLogCount,
      readLogCount,
      totalEventCount,
      totalAuditCount,
    ] = await Promise.all([
      this.eventRepo.count({ where: { orgId, category: EventCategory.SECURITY } }),
      this.auditRepo.createQueryBuilder('a')
        .where('a.orgId = :orgId', { orgId })
        .andWhere('a.action IN (:...actions)', { actions: [AuditAction.LOGIN, AuditAction.LOGOUT] })
        .getCount(),
      this.eventRepo.count({ where: { orgId, category: EventCategory.SYSTEM } }),
      this.eventRepo.count({ where: { orgId, tampered: true } }),
      this.auditRepo.createQueryBuilder('a')
        .where('a.orgId = :orgId', { orgId })
        .andWhere('a.action IN (:...actions)', { actions: [AuditAction.GENERATE_KEY, AuditAction.REVOKE_KEY] })
        .getCount(),
      this.auditRepo.count({ where: { orgId, action: AuditAction.READ } }),
      this.eventRepo.count({ where: { orgId } }),
      this.auditRepo.count({ where: { orgId } }),
    ]);

    const sections: ReportSection[] = [
      this.scoreSection({
        id: 'cc6',
        title: 'CC6 — Logical and Physical Access (Security)',
        count: securityCount + loginLogoutCount,
        lowThreshold: 1,
        highThreshold: 20,
        evidence: `${securityCount} security event(s) and ${loginLogoutCount} authentication audit log(s) recorded.`,
        recommendation: (securityCount + loginLogoutCount) >= 20
          ? 'Security and access logging is thorough. Review security events for anomalies regularly.'
          : 'Increase security event coverage. Ensure all authentication attempts and access control decisions are logged.',
      }),
      this.scoreSection({
        id: 'a1',
        title: 'A1 — Availability',
        count: systemCount,
        lowThreshold: 1,
        highThreshold: 5,
        evidence: systemCount > 0
          ? `${systemCount} system event(s) recorded, providing uptime and health indicators.`
          : 'No system events found. Availability monitoring may not be active.',
        recommendation: systemCount >= 5
          ? 'Availability logging is active. Ensure system health checks emit SYSTEM events on startup and shutdown.'
          : 'Add SYSTEM events for service start, stop, and health checks to demonstrate availability monitoring.',
      }),
      this.scoreIntegritySection({
        id: 'pi1',
        title: 'PI1 — Processing Integrity',
        totalEvents: totalEventCount,
        tamperedCount,
      }),
      this.scoreSection({
        id: 'c1',
        title: 'C1 — Confidentiality (API Key Management)',
        count: apiKeyLogCount,
        lowThreshold: 1,
        highThreshold: 5,
        evidence: apiKeyLogCount > 0
          ? `${apiKeyLogCount} API key management audit log(s) recorded (key generation and revocation).`
          : 'No API key management audit logs found. Key lifecycle may not be tracked.',
        recommendation: apiKeyLogCount >= 5
          ? 'API key management is being audited. Ensure key rotation policies are enforced.'
          : 'Ensure all API key generation and revocation actions are captured as audit logs.',
      }),
      this.scoreSection({
        id: 'p1',
        title: 'P1 — Privacy (Data Access Logging)',
        count: readLogCount,
        lowThreshold: 0,
        highThreshold: 1,
        evidence: readLogCount > 0
          ? `${readLogCount} data read audit log(s) recorded, demonstrating access tracking.`
          : 'No READ audit logs found. Data access may not be tracked.',
        recommendation: readLogCount >= 1
          ? 'Data access is being logged. Review READ logs regularly for unusual access patterns.'
          : 'Log all sensitive data access operations as READ audit entries to support privacy controls.',
      }),
    ];

    return this.buildReport({
      framework: ComplianceFramework.SOC2,
      frameworkName: 'SOC 2 Type II',
      orgId,
      sections,
      totalEventsAnalyzed: totalEventCount,
      totalAuditLogsAnalyzed: totalAuditCount,
    });
  }

  // ─── ISO 42001 ──────────────────────────────────────────────────────────────

  private async generateIso42001Report(orgId: string): Promise<ComplianceReport> {
    const [
      guardrailCount,
      securityCount,
      agentLifecycleCount,
      llmCallCount,
      toolInvocationCount,
      totalEventCount,
      totalAuditCount,
      errorFatalCount,
    ] = await Promise.all([
      this.eventRepo.count({ where: { orgId, category: EventCategory.GUARDRAIL } }),
      this.eventRepo.count({ where: { orgId, category: EventCategory.SECURITY } }),
      this.eventRepo.count({ where: { orgId, category: EventCategory.AGENT_LIFECYCLE } }),
      this.eventRepo.count({ where: { orgId, category: EventCategory.LLM_CALL } }),
      this.eventRepo.count({ where: { orgId, category: EventCategory.TOOL_INVOCATION } }),
      this.eventRepo.count({ where: { orgId } }),
      this.auditRepo.count({ where: { orgId } }),
      this.eventRepo.createQueryBuilder('e')
        .where('e.orgId = :orgId', { orgId })
        .andWhere('e.level IN (:...levels)', { levels: [EventLevel.ERROR, EventLevel.FATAL] })
        .getCount(),
    ]);

    const sections: ReportSection[] = [
      this.scoreSection({
        id: '6.1',
        title: '6.1 — AI Risk Assessment',
        count: guardrailCount + securityCount,
        lowThreshold: 1,
        highThreshold: 15,
        evidence: `${guardrailCount} guardrail event(s) and ${securityCount} security event(s) recorded for risk assessment.`,
        recommendation: (guardrailCount + securityCount) >= 15
          ? 'Risk assessment coverage is strong. Document risk treatment decisions in event payloads.'
          : 'Expand guardrail and security event logging to cover more risk scenarios. Define risk thresholds in policy.',
      }),
      this.scoreSection({
        id: '7.2',
        title: '7.2 — AI Competence',
        count: agentLifecycleCount,
        lowThreshold: 1,
        highThreshold: 5,
        evidence: agentLifecycleCount > 0
          ? `${agentLifecycleCount} agent lifecycle event(s) recorded, demonstrating model configuration tracking.`
          : 'No agent lifecycle events found. AI competence and model configuration may not be documented.',
        recommendation: agentLifecycleCount >= 5
          ? 'Agent lifecycle logging is active. Ensure model versions, capabilities, and limitations are captured.'
          : 'Log agent registration with model name, version, and capability scope in every AGENT_LIFECYCLE event.',
      }),
      this.scoreSection({
        id: '8.2',
        title: '8.2 — AI System Development',
        count: llmCallCount + toolInvocationCount,
        lowThreshold: 1,
        highThreshold: 20,
        evidence: `${llmCallCount} LLM call(s) and ${toolInvocationCount} tool invocation(s) recorded.`,
        recommendation: (llmCallCount + toolInvocationCount) >= 20
          ? 'AI system activity is well logged. Review LLM and tool event payloads for completeness.'
          : 'Ensure all LLM calls and tool invocations are logged with input/output tokens, latency, and cost.',
      }),
      this.scoreCoverageSection({
        id: '9.1',
        title: '9.1 — Monitoring & Measurement',
        totalEvents: totalEventCount,
        totalAuditLogs: totalAuditCount,
      }),
      this.scoreNonconformitySection({
        id: '10.1',
        title: '10.1 — Nonconformity & Corrective Action',
        errorFatalCount,
        totalEvents: totalEventCount,
      }),
    ];

    return this.buildReport({
      framework: ComplianceFramework.ISO_42001,
      frameworkName: 'ISO/IEC 42001:2023',
      orgId,
      sections,
      totalEventsAnalyzed: totalEventCount,
      totalAuditLogsAnalyzed: totalAuditCount,
    });
  }

  // ─── Scoring helpers ────────────────────────────────────────────────────────

  private scoreSection(params: {
    id: string;
    title: string;
    count: number;
    lowThreshold: number;
    highThreshold: number;
    evidence: string;
    recommendation: string;
  }): ReportSection {
    const { id, title, count, lowThreshold, highThreshold, evidence, recommendation } = params;
    let score: number;

    if (count === 0 && lowThreshold > 0) {
      score = 0;
    } else if (count >= highThreshold) {
      score = 100;
    } else if (count >= lowThreshold) {
      score = Math.round(50 + ((count - lowThreshold) / (highThreshold - lowThreshold)) * 50);
    } else {
      score = 0;
    }

    return { id, title, status: this.statusFromScore(score), score, evidence, recommendation, eventCount: count };
  }

  private scoreQualitySection(params: {
    id: string;
    title: string;
    totalEvents: number;
    totalAuditLogs: number;
    tamperedCount: number;
  }): ReportSection {
    const { id, title, totalEvents, totalAuditLogs, tamperedCount } = params;
    const combined = totalEvents + totalAuditLogs;
    const integrityPenalty = combined > 0 ? (tamperedCount / combined) * 100 : 0;
    const baseScore = combined >= 10 ? 100 : combined >= 1 ? 60 : 20;
    const score = Math.max(0, Math.round(baseScore - integrityPenalty));

    return {
      id,
      title,
      status: this.statusFromScore(score),
      score,
      evidence: `${totalEvents} event(s) and ${totalAuditLogs} audit log(s) found. ${tamperedCount} tampered record(s) detected.`,
      recommendation: tamperedCount > 0
        ? 'Investigate tampered events immediately. Strengthen hash verification and access controls on the events table.'
        : combined >= 10
          ? 'Audit trail coverage is good. Maintain comprehensive logging across all agent operations.'
          : 'Increase event and audit log volume. Ensure all agent actions generate at least one event.',
      eventCount: combined,
    };
  }

  private scoreIntegritySection(params: {
    id: string;
    title: string;
    totalEvents: number;
    tamperedCount: number;
  }): ReportSection {
    const { id, title, totalEvents, tamperedCount } = params;
    const integrityRate = totalEvents > 0 ? ((totalEvents - tamperedCount) / totalEvents) * 100 : 0;
    const score = totalEvents === 0 ? 30 : Math.round(integrityRate);

    return {
      id,
      title,
      status: this.statusFromScore(score),
      score,
      evidence: totalEvents > 0
        ? `${totalEvents} event(s) checked. ${tamperedCount} tampered record(s) found (${(100 - integrityRate).toFixed(1)}% integrity failure rate).`
        : 'No events found to verify integrity.',
      recommendation: tamperedCount > 0
        ? 'CRITICAL: Tampered events detected. Investigate source, rotate API keys, and audit database access.'
        : totalEvents === 0
          ? 'No events to verify. Begin logging agent events to establish an integrity baseline.'
          : 'Processing integrity is intact. Continue hash verification on all ingested events.',
      eventCount: totalEvents,
    };
  }

  private scoreCoverageSection(params: {
    id: string;
    title: string;
    totalEvents: number;
    totalAuditLogs: number;
  }): ReportSection {
    const { id, title, totalEvents, totalAuditLogs } = params;
    const combined = totalEvents + totalAuditLogs;
    let score: number;

    if (combined >= 50) {
      score = 100;
    } else if (combined >= 10) {
      score = 80;
    } else if (combined >= 1) {
      score = 50;
    } else {
      score = 0;
    }

    return {
      id,
      title,
      status: this.statusFromScore(score),
      score,
      evidence: `${totalEvents} event(s) and ${totalAuditLogs} audit log(s) available for monitoring analysis.`,
      recommendation: combined >= 50
        ? 'Monitoring coverage is comprehensive. Set up alerts on anomalous event rates.'
        : combined >= 10
          ? 'Monitoring coverage is adequate. Consider adding automated dashboards and threshold alerts.'
          : 'Event volume is low. Ensure agents emit events for all significant operations.',
      eventCount: combined,
    };
  }

  private scoreNonconformitySection(params: {
    id: string;
    title: string;
    errorFatalCount: number;
    totalEvents: number;
  }): ReportSection {
    const { id, title, errorFatalCount, totalEvents } = params;
    const errorRate = totalEvents > 0 ? (errorFatalCount / totalEvents) * 100 : 0;

    let score: number;
    if (totalEvents === 0) {
      score = 30;
    } else if (errorRate === 0) {
      score = 100;
    } else if (errorRate <= 5) {
      score = 80;
    } else if (errorRate <= 15) {
      score = 50;
    } else {
      score = 20;
    }

    return {
      id,
      title,
      status: this.statusFromScore(score),
      score,
      evidence: `${errorFatalCount} ERROR/FATAL event(s) out of ${totalEvents} total (${errorRate.toFixed(1)}% error rate).`,
      recommendation: errorRate === 0 && totalEvents > 0
        ? 'No nonconformities detected. Maintain error monitoring and document corrective action procedures.'
        : errorRate <= 5
          ? 'Low error rate observed. Investigate root causes and document corrective actions for each ERROR/FATAL event.'
          : 'Elevated error rate detected. Prioritise corrective action, document each nonconformity, and track resolution.',
      eventCount: errorFatalCount,
    };
  }

  // ─── Report assembly ────────────────────────────────────────────────────────

  private statusFromScore(score: number): SectionStatus {
    if (score >= 80) return 'pass';
    if (score >= 50) return 'warn';
    return 'fail';
  }

  private buildReport(params: {
    framework: ComplianceFramework;
    frameworkName: string;
    orgId: string;
    sections: ReportSection[];
    totalEventsAnalyzed: number;
    totalAuditLogsAnalyzed: number;
  }): ComplianceReport {
    const { framework, frameworkName, orgId, sections, totalEventsAnalyzed, totalAuditLogsAnalyzed } = params;

    const overallScore = sections.length > 0
      ? Math.round(sections.reduce((sum, s) => sum + s.score, 0) / sections.length)
      : 0;

    const sectionsPass = sections.filter(s => s.status === 'pass').length;
    const sectionsWarn = sections.filter(s => s.status === 'warn').length;
    const sectionsFail = sections.filter(s => s.status === 'fail').length;

    let overallStatus: SectionStatus;
    if (sectionsFail > 0) {
      overallStatus = 'fail';
    } else if (sectionsWarn > 0) {
      overallStatus = 'warn';
    } else {
      overallStatus = 'pass';
    }

    return {
      framework,
      frameworkName,
      orgId,
      generatedAt: new Date().toISOString(),
      overallScore,
      overallStatus,
      sections,
      summary: {
        totalEventsAnalyzed,
        totalAuditLogsAnalyzed,
        sectionsPass,
        sectionsWarn,
        sectionsFail,
      },
    };
  }
}
