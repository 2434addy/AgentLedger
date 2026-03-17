'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Zap, DollarSign, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { agentsApi, sessionsApi, eventsApi, analyticsApi, anomaliesApi, UsageAnalytics, CostAnalytics, Event, Anomaly } from '@/lib/api';
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge, categoryVariant, levelVariant } from '@/components/ui/Badge';

interface DashboardData {
  agentCount: number;
  sessionCount: number;
  eventCount: number;
  totalCost: number;
  usageByDate: UsageAnalytics['byDate'];
  costByDate: CostAnalytics['byDate'];
  recentEvents: Event[];
  anomalies: Anomaly[];
}

const tooltipStyle = { background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' };

function fmtCost(v: unknown): [string, string] {
  return [`$${Number(v).toFixed(4)}`, 'Cost'];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [agents, sessions, usage, cost, events, anomalies] = await Promise.all([
        agentsApi.list(),
        sessionsApi.list({ limit: 1 }),
        analyticsApi.usage(),
        analyticsApi.cost(),
        eventsApi.list({ limit: 10 }),
        anomaliesApi.list({ resolved: false }),
      ]);
      setData({
        agentCount: agents.data.length,
        sessionCount: Array.isArray(sessions.data) ? sessions.data.length : 0,
        eventCount: usage.data.totalEvents,
        totalCost: cost.data.totalCostUsd,
        usageByDate: usage.data.byDate ?? [],
        costByDate: cost.data.byDate ?? [],
        recentEvents: Array.isArray(events.data) ? events.data : [],
        anomalies: Array.isArray(anomalies.data) ? anomalies.data : [],
      });
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!data) return null;

  const metrics = [
    { label: 'Total Agents', value: (data?.agentCount ?? 0), icon: Bot, color: '#7C3AED' },
    { label: 'Total Sessions', value: (data?.sessionCount ?? 0), icon: Play, color: '#06B6D4' },
    { label: 'Total Events', value: (data?.eventCount ?? 0).toLocaleString(), icon: Zap, color: '#10B981' },
    { label: 'Total Cost', value: `${(data?.totalCost ?? 0).toFixed(4)}`, icon: DollarSign, color: '#F59E0B' },
  ];

  const chartData = (data?.usageByDate ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    events: d.events,
  }));

  return (
    <div className="space-y-6">
      {/* Anomaly strip */}
      {(data?.anomalies ?? []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm font-medium">
            {(data?.anomalies ?? []).length} active {(data?.anomalies ?? []).length === 1 ? 'anomaly' : 'anomalies'} detected
          </span>
          <a href="/anomalies" className="ml-auto text-red-400 text-sm hover:text-red-300 underline">
            View all
          </a>
        </motion.div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${m.color}20`, border: `1px solid ${m.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{m.value}</div>
              <div className="text-white/50 text-sm">{m.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-white font-semibold mb-6">Events (Last 7 Days)</h3>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="events" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-white font-semibold mb-6">Cost Over Time</h3>
          {(data?.costByDate ?? []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">No cost data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={(data?.costByDate ?? []).map((d) => ({
                date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                cost: d.costUsd,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={fmtCost} />
                <Line type="monotone" dataKey="cost" stroke="#06B6D4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Recent events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-white font-semibold mb-4">Recent Events</h3>
        {(data?.recentEvents ?? []).length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">No events yet. Start sending events from your agents.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/40 text-xs uppercase text-left">
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Level</th>
                  <th className="pb-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {(data?.recentEvents ?? []).map((event) => (
                  <tr key={event.id} className="text-sm">
                    <td className="py-3 text-white/40 whitespace-nowrap">
                      {new Date(event.occurredAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={categoryVariant(event.category)}>{event.category.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={levelVariant(event.level)}>{event.level}</Badge>
                    </td>
                    <td className="py-3 text-white/70 truncate max-w-xs">{event.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
