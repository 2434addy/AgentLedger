'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  complianceApi,
  ComplianceReport,
  ComplianceCheck,
  ComplianceReportGenerated,
  ComplianceReportGeneratedSection,
  ComplianceFramework,
} from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/formatDate';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'rgba(16,185,129,0.15)';
  if (score >= 50) return 'rgba(245,158,11,0.15)';
  return 'rgba(239,68,68,0.15)';
}

function scoreBorder(score: number): string {
  if (score >= 80) return 'rgba(16,185,129,0.3)';
  if (score >= 50) return 'rgba(245,158,11,0.3)';
  return 'rgba(239,68,68,0.3)';
}

function statusBadgeClass(status: 'pass' | 'warn' | 'fail'): string {
  if (status === 'pass') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  if (status === 'warn') return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  return 'bg-red-500/20 text-red-300 border border-red-500/30';
}

function statusLabel(status: 'pass' | 'warn' | 'fail'): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  return 'FAIL';
}

// ─── Framework Definitions ────────────────────────────────────────────────────

interface FrameworkOption {
  id: ComplianceFramework;
  label: string;
  description: string;
}

const FRAMEWORKS: FrameworkOption[] = [
  {
    id: 'eu-ai-act',
    label: 'EU AI Act',
    description: 'European Union Artificial Intelligence Act compliance assessment',
  },
  {
    id: 'soc2',
    label: 'SOC 2 Type II',
    description: 'Service Organization Control 2 security and availability audit',
  },
  {
    id: 'iso42001',
    label: 'ISO 42001',
    description: 'International AI management system standard certification',
  },
];

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
}: {
  section: ComplianceReportGeneratedSection;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const barColor =
    section.score >= 80
      ? 'bg-emerald-500'
      : section.score >= 50
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="glass-card overflow-hidden"
      style={{ border: `1px solid ${scoreBorder(section.score)}` }}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${statusBadgeClass(section.status)}`}>
              {statusLabel(section.status)}
            </span>
            <span className="text-white/40 text-xs font-mono">{section.id}</span>
          </div>
          <div className="text-white font-medium text-sm truncate">{section.title}</div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-4">
          {/* Score bar */}
          <div className="hidden sm:block w-28">
            <div className="flex justify-between mb-1">
              <span className={`text-xs font-bold ${scoreColor(section.score)}`}>
                {section.score}
              </span>
              <span className="text-white/30 text-xs">{section.eventCount} events</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${section.score}%` }}
              />
            </div>
          </div>

          <div className="text-white/40">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
              {/* Mobile score bar */}
              <div className="sm:hidden">
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-bold ${scoreColor(section.score)}`}>
                    Score: {section.score}/100
                  </span>
                  <span className="text-white/30 text-xs">{section.eventCount} events</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${section.score}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="text-white/40 text-xs uppercase font-medium mb-1.5">Evidence</div>
                <p className="text-white/70 text-sm leading-relaxed">{section.evidence}</p>
              </div>

              <div>
                <div className="text-white/40 text-xs uppercase font-medium mb-1.5">
                  Recommendation
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{section.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Overall Score Circle ─────────────────────────────────────────────────────

function ScoreCircle({ score, status }: { score: number; status: 'pass' | 'warn' | 'fail' }) {
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const strokeColor =
    status === 'pass' ? '#10b981' : status === 'warn' ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-white/40 text-xs">/ 100</span>
      </div>
    </div>
  );
}

// ─── Framework Report Section ─────────────────────────────────────────────────

function FrameworkReportSection() {
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework>('eu-ai-act');
  const [generatedReport, setGeneratedReport] = useState<ComplianceReportGenerated | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError('');
    setGeneratedReport(null);
    try {
      const res = await complianceApi.generate(selectedFramework);
      setGeneratedReport(res.data);
    } catch {
      setGenerateError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownloadReport() {
    if (!generatedReport) return;

    const r = generatedReport;

    const sectionRows = r.sections
      .map(
        (s) => `
        <tr>
          <td><strong>${escapeHtml(s.title)}</strong><br/><span style="color:#888;font-size:12px">${escapeHtml(s.id)}</span></td>
          <td style="color:${s.status === 'pass' ? '#10B981' : s.status === 'warn' ? '#f59e0b' : '#EF4444'};font-weight:bold">${statusLabel(s.status)}</td>
          <td style="text-align:center">${s.score}</td>
          <td style="text-align:center">${s.eventCount}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding:8px 16px;background:#fafafa">
            <em>Evidence:</em> ${escapeHtml(s.evidence)}<br/>
            <em>Recommendation:</em> ${escapeHtml(s.recommendation)}
          </td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(r.frameworkName)} Compliance Report — AgentLedger</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #7C3AED; border-bottom: 2px solid #7C3AED; padding-bottom: 10px; }
          h2 { color: #444; margin-top: 30px; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; }
          .score-wrap { text-align: center; }
          .score { font-size: 56px; font-weight: bold; color: ${r.overallStatus === 'pass' ? '#10B981' : r.overallStatus === 'warn' ? '#f59e0b' : '#EF4444'}; line-height: 1; }
          .score-label { color: #888; font-size: 13px; margin-top: 4px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: bold; font-size: 13px;
            background: ${r.overallStatus === 'pass' ? '#d1fae5' : r.overallStatus === 'warn' ? '#fef3c7' : '#fee2e2'};
            color: ${r.overallStatus === 'pass' ? '#059669' : r.overallStatus === 'warn' ? '#d97706' : '#dc2626'}; }
          .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 24px 0; }
          .summary-item { text-align: center; padding: 12px; background: #f9f9f9; border-radius: 8px; }
          .summary-item .val { font-size: 24px; font-weight: bold; color: #7C3AED; }
          .summary-item .lbl { font-size: 11px; color: #888; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #7C3AED; color: white; padding: 10px 12px; text-align: left; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
          tr:nth-child(4n+3) td { background: #f9f9f9; }
          .footer { margin-top: 40px; color: #aaa; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(r.frameworkName)} Compliance Report</h1>
        <div class="meta">
          <div>
            <p><strong>Framework:</strong> ${escapeHtml(r.framework)}</p>
            <p><strong>Organisation ID:</strong> ${escapeHtml(r.orgId)}</p>
            <p><strong>Generated:</strong> ${new Date(r.generatedAt).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="status-badge">${statusLabel(r.overallStatus)}</span></p>
          </div>
          <div class="score-wrap">
            <div class="score">${r.overallScore}</div>
            <div class="score-label">Overall Score</div>
          </div>
        </div>

        <h2>Summary</h2>
        <div class="summary-grid">
          <div class="summary-item"><div class="val">${r.summary.totalEventsAnalyzed}</div><div class="lbl">Events Analyzed</div></div>
          <div class="summary-item"><div class="val">${r.summary.totalAuditLogsAnalyzed}</div><div class="lbl">Audit Logs</div></div>
          <div class="summary-item"><div class="val" style="color:#10B981">${r.summary.sectionsPass}</div><div class="lbl">Sections Pass</div></div>
          <div class="summary-item"><div class="val" style="color:#f59e0b">${r.summary.sectionsWarn}</div><div class="lbl">Sections Warn</div></div>
          <div class="summary-item"><div class="val" style="color:#EF4444">${r.summary.sectionsFail}</div><div class="lbl">Sections Fail</div></div>
        </div>

        <h2>Section Details</h2>
        <table>
          <tr>
            <th>Section</th>
            <th>Status</th>
            <th style="text-align:center">Score</th>
            <th style="text-align:center">Events</th>
          </tr>
          ${sectionRows}
        </table>

        <div class="footer">
          <p>Generated by AgentLedger — The Black Box Recorder for AI Agents</p>
          <p>Report timestamp: ${r.generatedAt}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  }

  return (
    <div className="space-y-6">
      {/* Framework tabs + generate */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
        style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.12)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-white font-semibold text-base">Framework Report Generator</h3>
        </div>

        {/* Framework tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw.id}
              onClick={() => {
                setSelectedFramework(fw.id);
                setGeneratedReport(null);
                setGenerateError('');
              }}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                selectedFramework === fw.id
                  ? 'bg-violet-600/40 text-violet-200 border border-violet-500/50 shadow-[0_0_12px_rgba(124,58,237,0.2)]'
                  : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70',
              ].join(' ')}
            >
              {fw.label}
            </button>
          ))}
        </div>

        {/* Selected framework description */}
        <p className="text-white/40 text-xs mb-5">
          {FRAMEWORKS.find((f) => f.id === selectedFramework)?.description}
        </p>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={[
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
            isGenerating
              ? 'bg-violet-600/20 text-violet-400/50 cursor-not-allowed border border-violet-500/20'
              : 'bg-violet-600/30 text-violet-200 border border-violet-500/40 hover:bg-violet-600/50 hover:shadow-[0_0_16px_rgba(124,58,237,0.3)]',
          ].join(' ')}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>

        {generateError && (
          <p className="mt-3 text-red-400 text-sm">{generateError}</p>
        )}
      </motion.div>

      {/* Generated report display */}
      <AnimatePresence>
        {generatedReport && (
          <motion.div
            key="generated-report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
          >
            {/* Overall score card */}
            <div
              className="glass-card p-6"
              style={{
                background: scoreBg(generatedReport.overallScore),
                border: `1px solid ${scoreBorder(generatedReport.overallScore)}`,
              }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <ScoreCircle
                  score={generatedReport.overallScore}
                  status={generatedReport.overallStatus}
                />

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                    <h3 className="text-white font-bold text-lg">
                      {generatedReport.frameworkName}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadgeClass(generatedReport.overallStatus)}`}
                    >
                      {statusLabel(generatedReport.overallStatus)}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mb-4">
                    Generated {formatDate(generatedReport.generatedAt)}
                  </p>

                  {/* Summary stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="glass-card p-3 text-center">
                      <div className="text-white/80 font-bold text-base">
                        {generatedReport.summary.totalEventsAnalyzed}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">Events</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                      <div className="text-white/80 font-bold text-base">
                        {generatedReport.summary.totalAuditLogsAnalyzed}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">Audit Logs</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                      <div className="text-emerald-400 font-bold text-base">
                        {generatedReport.summary.sectionsPass}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">Passed</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                      <div className="text-amber-400 font-bold text-base">
                        {generatedReport.summary.sectionsWarn}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">Warnings</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                      <div className="text-red-400 font-bold text-base">
                        {generatedReport.summary.sectionsFail}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">Failed</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/[0.06] text-white/70 border border-white/[0.08] hover:bg-white/[0.10] hover:text-white transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>

            {/* Section cards */}
            {generatedReport.sections.length > 0 && (
              <div>
                <h4 className="text-white/50 text-xs uppercase font-medium mb-3">
                  Sections ({generatedReport.sections.length})
                </h4>
                <div className="space-y-2">
                  {generatedReport.sections.map((section, i) => (
                    <SectionCard key={section.id} section={section} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Legacy Check Card ────────────────────────────────────────────────────────

function CheckCard({ check, index }: { check: ComplianceCheck; index: number }) {
  const icons: Record<string, React.ReactNode> = {
    pass: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    fail: <XCircle className="w-5 h-5 text-red-400" />,
    warn: <AlertCircle className="w-5 h-5 text-amber-400" />,
  };
  const borders: Record<string, string> = {
    pass: 'rgba(16,185,129,0.2)',
    fail: 'rgba(239,68,68,0.2)',
    warn: 'rgba(245,158,11,0.2)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card p-5"
      style={{ border: `1px solid ${borders[check.status] ?? 'rgba(255,255,255,0.06)'}` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[check.status]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm mb-1">{check.name}</div>
          <div className="text-white/50 text-xs leading-relaxed">{check.description}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [reportRes, checksRes] = await Promise.allSettled([
        complianceApi.report(),
        complianceApi.checks(),
      ]);
      if (reportRes.status === 'fulfilled') setReport(reportRes.value.data);
      if (checksRes.status === 'fulfilled') {
        setChecks(Array.isArray(checksRes.value.data) ? checksRes.value.data : []);
      }
    } catch {
      setError('Failed to load compliance report.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const complianceScore = report
    ? Math.round(
        (checks.filter((c) => c.status === 'pass').length / Math.max(checks.length, 1)) * 100
      )
    : 0;

  const org = { name: 'My Organisation' };

  function exportReport() {
    if (!report) return;
    const passed = checks.filter((c) => c.status === 'pass').length;
    const failed = checks.filter((c) => c.status === 'fail').length;

    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AgentLedger Compliance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #7C3AED; border-bottom: 2px solid #7C3AED; padding-bottom: 10px; }
          h2 { color: #444; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .score { font-size: 48px; font-weight: bold; color: #7C3AED; }
          .check { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
          .check.pass { background: #f0fdf4; border-color: #10B981; }
          .check.fail { background: #fef2f2; border-color: #EF4444; }
          .check-title { font-weight: bold; font-size: 16px; }
          .check-desc { color: #666; margin-top: 5px; }
          .status { float: right; font-weight: bold; }
          .status.pass { color: #10B981; }
          .status.fail { color: #EF4444; }
          .footer { margin-top: 40px; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #7C3AED; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>AgentLedger Compliance Report</h1>
        <div class="header">
          <div>
            <p><strong>Organisation:</strong> ${escapeHtml(org?.name || 'My Organisation')}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Report Type:</strong> AI Agent Compliance Audit</p>
          </div>
          <div style="text-align: center;">
            <div class="score">${complianceScore}%</div>
            <div>Compliance Score</div>
          </div>
        </div>

        <h2>Compliance Checks Summary</h2>
        <table>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
          ${checks
            .map(
              (check) => `
            <tr>
              <td><strong>${escapeHtml(check.name)}</strong></td>
              <td style="color: ${check.status === 'pass' ? '#10B981' : '#EF4444'}">
                ${check.status === 'pass' ? 'PASS' : 'FAIL'}
              </td>
              <td>${escapeHtml(check.description || 'N/A')}</td>
            </tr>
          `
            )
            .join('')}
        </table>

        <h2>Detailed Results</h2>
        ${checks
          .map(
            (check) => `
          <div class="check ${check.status === 'pass' ? 'pass' : 'fail'}">
            <span class="status ${check.status === 'pass' ? 'pass' : 'fail'}">
              ${check.status === 'pass' ? 'PASS' : 'FAIL'}
            </span>
            <div class="check-title">${escapeHtml(check.name)}</div>
            <div class="check-desc">${escapeHtml(check.description || '')}</div>
          </div>
        `
          )
          .join('')}

        <p style="margin-top:20px;color:#888">Passed: ${passed} / Failed: ${failed} / Total: ${checks.length}</p>

        <div class="footer">
          <p>Generated by AgentLedger — The Black Box Recorder for AI Agents</p>
          <p>Report Date: ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  }

  function exportWord() {
    if (!report) return;
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'></head>
      <body>
        <h1>AgentLedger Compliance Report</h1>
        <p><strong>Organisation:</strong> ${escapeHtml(org?.name || 'My Organisation')}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Compliance Score:</strong> ${complianceScore}%</p>
        <h2>Compliance Checks</h2>
        <table border="1" cellpadding="8" cellspacing="0" width="100%">
          <tr style="background:#7C3AED;color:white">
            <th>Check</th><th>Status</th><th>Description</th>
          </tr>
          ${checks
            .map(
              (check) => `
            <tr>
              <td><b>${escapeHtml(check.name)}</b></td>
              <td>${check.status === 'pass' ? 'PASS' : 'FAIL'}</td>
              <td>${escapeHtml(check.description || '')}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentledger-compliance-report-${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={loadReport} />;
  if (!report) return null;

  const passed = checks.filter((c) => c.status === 'pass').length;
  const warned = checks.filter((c) => c.status === 'warn').length;
  const failed = checks.filter((c) => c.status === 'fail').length;

  return (
    <div className="space-y-8">
      {/* ── Framework Report Generator ── */}
      <section>
        <FrameworkReportSection />
      </section>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-white/25 text-xs uppercase font-medium">Audit Overview</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* ── Existing report header card ── */}
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
          style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-bold text-xl">Compliance Report</h2>
              </div>
              <p className="text-white/50 text-sm mb-4">
                Generated {formatDate(report.generatedAt)}
              </p>
              <div className="flex gap-6">
                <div>
                  <div className="text-white/70 font-bold text-lg">{report.securityEvents}</div>
                  <div className="text-white/40 text-xs">Security Events</div>
                </div>
                <div>
                  <div className="text-white/70 font-bold text-lg">{report.guardrailEvents}</div>
                  <div className="text-white/40 text-xs">Guardrail Events</div>
                </div>
                <div>
                  <div className="text-white/70 font-bold text-lg">{report.totalAuditLogs}</div>
                  <div className="text-white/40 text-xs">Audit Logs</div>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <div>
                  <div className="text-emerald-400 font-bold text-lg">{passed}</div>
                  <div className="text-white/40 text-xs">Passed</div>
                </div>
                <div>
                  <div className="text-amber-400 font-bold text-lg">{warned}</div>
                  <div className="text-white/40 text-xs">Warnings</div>
                </div>
                <div>
                  <div className="text-red-400 font-bold text-lg">{failed}</div>
                  <div className="text-white/40 text-xs">Failed</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportReport}
                className="glass-button flex items-center gap-2 py-2.5 px-5"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button
                onClick={exportWord}
                className="glass-button flex items-center gap-2 py-2.5 px-5"
              >
                <Download className="w-4 h-4" /> Export Word
              </button>
            </div>
          </div>
        </motion.div>

        {/* Checks grid */}
        <div>
          <h3 className="text-white/60 text-sm uppercase font-medium mb-4">Compliance Checks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checks.map((check, i) => (
              <CheckCard key={check.name} check={check} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
