'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { analyticsApi, CostAnalytics } from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

const COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const tooltipStyle = {
  background: '#0D0D1A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: 'white',
  fontSize: 12,
};

function fmtCost(v: unknown): [string, string] {
  return [`$${Number(v).toFixed(4)}`, 'Cost'];
}

export default function CostAnalyticsPage() {
  const [data, setData] = useState<CostAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await analyticsApi.cost();
      setData(res.data);
    } catch {
      setError('Failed to load cost analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!data) return null;

  const dateChartData = (data.byDate ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: d.costUsd,
  }));

  const modelChartData = (data.byModel ?? []).map((m, i) => ({
    name: m.modelId,
    value: m.costUsd,
    fill: COLORS[i % COLORS.length],
  }));

  const agentChartData = (data.byAgent ?? []).map((a) => ({
    name: a.agentName,
    cost: a.costUsd,
  }));

  return (
    <div className="space-y-6">
      {/* Total cost card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 flex items-center gap-6"
        style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <DollarSign className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <div className="text-white/50 text-sm mb-1">Total Cost (All Time)</div>
          <div className="text-4xl font-bold text-white">${(data?.totalCostUsd ?? 0).toFixed(4)}</div>
        </div>
      </motion.div>

      {/* Line chart: cost over time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-white font-semibold mb-6">Cost Over Time</h3>
        {dateChartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-white/30 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dateChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={fmtCost} />
              <Line type="monotone" dataKey="cost" stroke="#7C3AED" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart: cost by model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-white font-semibold mb-6">Cost by Model</h3>
          {modelChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={modelChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {modelChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={fmtCost} />
                <Legend
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Bar chart: cost by agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-white font-semibold mb-6">Cost by Agent</h3>
          {agentChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agentChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={fmtCost} />
                <Bar dataKey="cost" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
