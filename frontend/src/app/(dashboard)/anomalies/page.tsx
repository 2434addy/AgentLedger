'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { anomaliesApi, Anomaly } from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge, severityVariant } from '@/components/ui/Badge';

const severityIcon: Record<string, string> = {
  low: '●',
  medium: '●',
  high: '●',
  critical: '●',
};

const severityColor: Record<string, string> = {
  low: '#06B6D4',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#EF4444',
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const loadAnomalies = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await anomaliesApi.list({ resolved: showResolved ? undefined : false });
      setAnomalies(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load anomalies.');
    } finally {
      setIsLoading(false);
    }
  }, [showResolved]);

  useEffect(() => { loadAnomalies(); }, [loadAnomalies]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={loadAnomalies} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-white font-bold text-xl">Anomaly Detection</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {anomalies.length} {showResolved ? '' : 'active '}
            {anomalies.length === 1 ? 'anomaly' : 'anomalies'}
          </p>
        </div>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="text-sm px-4 py-2 rounded-xl border transition-colors"
          style={{
            borderColor: 'rgba(255,255,255,0.1)',
            color: showResolved ? 'rgba(124,58,237,1)' : 'rgba(255,255,255,0.5)',
            background: showResolved ? 'rgba(124,58,237,0.1)' : 'transparent',
          }}
        >
          {showResolved ? 'Showing All' : 'Show Resolved'}
        </button>
      </div>

      {anomalies.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No anomalies detected"
          description={showResolved
            ? 'No anomalies have been detected for your agents.'
            : 'All clear! No active anomalies. Your agents are behaving normally.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anomalies.map((anomaly, i) => (
            <motion.div
              key={anomaly.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card p-6"
              style={
                !anomaly.resolved
                  ? { border: `1px solid ${severityColor[anomaly.severity]}30` }
                  : {}
              }
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ color: severityColor[anomaly.severity], fontSize: 8 }}>
                    {severityIcon[anomaly.severity]}
                  </span>
                  <div className="text-white font-semibold text-sm capitalize">
                    {anomaly.type.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={severityVariant(anomaly.severity)}>{anomaly.severity}</Badge>
                  {anomaly.resolved && (
                    <Badge variant="success">resolved</Badge>
                  )}
                </div>
              </div>

              <p className="text-white/60 text-sm leading-relaxed mb-4">{anomaly.description}</p>

              <div className="grid grid-cols-2 gap-3">
                {anomaly.agentName && (
                  <div>
                    <div className="text-white/40 text-xs mb-0.5">Affected Agent</div>
                    <div className="text-white/70 text-sm">{anomaly.agentName}</div>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1 text-white/40 text-xs mb-0.5">
                    <Clock className="w-3 h-3" /> Detected
                  </div>
                  <div className="text-white/70 text-sm">
                    {new Date(anomaly.detectedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
