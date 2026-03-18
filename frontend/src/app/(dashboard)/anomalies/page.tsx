'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Zap, RotateCcw } from 'lucide-react';
import { anomaliesApi, AnomalyResponse, Event } from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatDate';

interface NormalizedAnomaly {
  id: string;
  type: 'latency_spike' | 'error_burst' | 'agent_loop';
  severity: 'medium' | 'high';
  description: string;
  detectedAt: string;
}

function normalizeAnomalies(data: AnomalyResponse): NormalizedAnomaly[] {
  const result: NormalizedAnomaly[] = [];

  (data.latencySpikes ?? []).forEach((e: Event) => {
    result.push({
      id: e.id,
      type: 'latency_spike',
      severity: 'medium',
      description: `High latency (${e.latencyMs}ms) on "${e.message}"`,
      detectedAt: e.timestamp,
    });
  });

  (data.errorBursts ?? []).forEach((e, i) => {
    result.push({
      id: `burst-${i}`,
      type: 'error_burst',
      severity: 'high',
      description: `${e.error_count} errors in one minute`,
      detectedAt: e.minute,
    });
  });

  (data.agentLoops ?? []).forEach((e, i) => {
    result.push({
      id: `loop-${i}`,
      type: 'agent_loop',
      severity: 'high',
      description: `Tool "${e.message}" repeated ${e.repeat_count} times`,
      detectedAt: '',
    });
  });

  return result;
}

const severityColor: Record<string, string> = {
  medium: '#F59E0B',
  high: '#EF4444',
};

const typeIcons: Record<string, typeof AlertTriangle> = {
  latency_spike: Zap,
  error_burst: AlertTriangle,
  agent_loop: RotateCcw,
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<NormalizedAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnomalies = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await anomaliesApi.list();
      const data = res.data as AnomalyResponse;
      setAnomalies(normalizeAnomalies(data));
    } catch {
      setError('Failed to load anomalies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      <div>
        <h2 className="text-white font-bold text-xl">Anomaly Detection</h2>
        <p className="text-white/40 text-sm mt-0.5">
          {anomalies.length} {anomalies.length === 1 ? 'anomaly' : 'anomalies'} detected
        </p>
      </div>

      {anomalies.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No anomalies detected"
          description="All clear! No anomalies detected. Your agents are behaving normally."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anomalies.map((anomaly, i) => {
            const Icon = typeIcons[anomaly.type] ?? AlertTriangle;
            return (
              <motion.div
                key={anomaly.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card p-6"
                style={{ border: `1px solid ${severityColor[anomaly.severity]}30` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: severityColor[anomaly.severity] }} />
                    <div className="text-white font-semibold text-sm capitalize">
                      {anomaly.type.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <Badge variant={anomaly.severity === 'high' ? 'error' : 'warning'}>{anomaly.severity}</Badge>
                </div>

                <p className="text-white/60 text-sm leading-relaxed mb-4">{anomaly.description}</p>

                {anomaly.detectedAt && (
                  <div className="flex items-center gap-1 text-white/40 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatDate(anomaly.detectedAt)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
