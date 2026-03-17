'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { complianceApi, ComplianceReport } from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 42 * score / 100} ${2 * Math.PI * 42}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{score}%</div>
        <div className="text-white/40 text-xs">Score</div>
      </div>
    </div>
  );
}

function CheckCard({ check, index }: { check: ComplianceReport['checks'][0]; index: number }) {
  const icons = {
    pass: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    fail: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
  };
  const borders = {
    pass: 'rgba(16,185,129,0.2)',
    fail: 'rgba(239,68,68,0.2)',
    warning: 'rgba(245,158,11,0.2)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card p-5"
      style={{ border: `1px solid ${borders[check.status]}` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[check.status]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm mb-1">{check.name}</div>
          <div className="text-white/50 text-xs leading-relaxed">{check.description}</div>
          {check.details && (
            <div className="mt-2 text-xs p-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
              {check.details}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CompliancePage() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await complianceApi.report();
      setReport(res.data);
    } catch {
      setError('Failed to load compliance report.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  function handleExport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={loadReport} />;
  if (!report) return null;

  const checks = report?.checks ?? [];
  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warning').length;

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
          <div className="flex items-center gap-8">
            <ScoreBadge score={report?.score ?? 0} />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-bold text-xl">Compliance Report</h2>
              </div>
              <p className="text-white/50 text-sm mb-4">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </p>
              <div className="flex gap-6">
                <div>
                  <div className="text-emerald-400 font-bold text-lg">{passed}</div>
                  <div className="text-white/40 text-xs">Passed</div>
                </div>
                <div>
                  <div className="text-red-400 font-bold text-lg">{failed}</div>
                  <div className="text-white/40 text-xs">Failed</div>
                </div>
                <div>
                  <div className="text-amber-400 font-bold text-lg">{warnings}</div>
                  <div className="text-white/40 text-xs">Warnings</div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleExport} className="glass-button flex items-center gap-2 py-2.5 px-5">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </motion.div>

      {/* Checks grid */}
      <div>
        <h3 className="text-white/60 text-sm uppercase font-medium mb-4">Compliance Checks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checks.map((check, i) => (
            <CheckCard key={check.id} check={check} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
