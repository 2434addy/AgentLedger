'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { complianceApi, ComplianceReport, ComplianceCheck } from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDate } from '@/lib/formatDate';

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

  useEffect(() => { loadReport(); }, [loadReport]);

  const complianceScore = report ? Math.round((checks.filter(c => c.status === 'pass').length / Math.max(checks.length, 1)) * 100) : 0;
  const org = { name: 'My Organisation' };

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function exportReport() {
    if (!report) return;
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
            <p><strong>Organisation:</strong> ${org?.name || 'My Organisation'}</p>
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
          ${checks.map(check => `
            <tr>
              <td><strong>${escapeHtml(check.name)}</strong></td>
              <td style="color: ${check.status === 'pass' ? '#10B981' : '#EF4444'}">
                ${check.status === 'pass' ? 'PASS' : 'FAIL'}
              </td>
              <td>${escapeHtml(check.description || 'N/A')}</td>
            </tr>
          `).join('')}
        </table>

        <h2>Detailed Results</h2>
        ${checks.map(check => `
          <div class="check ${check.status === 'pass' ? 'pass' : 'fail'}">
            <span class="status ${check.status === 'pass' ? 'pass' : 'fail'}">
              ${check.status === 'pass' ? 'PASS' : 'FAIL'}
            </span>
            <div class="check-title">${escapeHtml(check.name)}</div>
            <div class="check-desc">${escapeHtml(check.description || '')}</div>
          </div>
        `).join('')}

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
      setTimeout(() => {
        printWindow.print();
      }, 500);
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
        <p><strong>Organisation:</strong> ${org?.name || 'My Organisation'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Compliance Score:</strong> ${complianceScore}%</p>
        <h2>Compliance Checks</h2>
        <table border="1" cellpadding="8" cellspacing="0" width="100%">
          <tr style="background:#7C3AED;color:white">
            <th>Check</th><th>Status</th><th>Description</th>
          </tr>
          ${checks.map(check => `
            <tr>
              <td><b>${escapeHtml(check.name)}</b></td>
              <td>${check.status === 'pass' ? 'PASS' : 'FAIL'}</td>
              <td>${escapeHtml(check.description || '')}</td>
            </tr>
          `).join('')}
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
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
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
    <div className="space-y-6">
      {/* Header card */}
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
            <button onClick={exportReport} className="glass-button flex items-center gap-2 py-2.5 px-5">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={exportWord} className="glass-button flex items-center gap-2 py-2.5 px-5">
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
    </div>
  );
}
