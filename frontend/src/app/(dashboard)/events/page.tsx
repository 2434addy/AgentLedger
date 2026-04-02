'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, Zap } from 'lucide-react';
import { eventsApi, agentsApi, Event, Agent } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge, categoryVariant, levelVariant } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatDate';

const CATEGORIES = ['', 'llm_call', 'tool_invocation', 'user_action', 'agent_lifecycle', 'system', 'security', 'guardrail'];
const LEVELS = ['', 'debug', 'info', 'warn', 'error', 'fatal'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Parameters<typeof eventsApi.list>[0] = { limit: 100 };
      if (filterCategory) params.category = filterCategory;
      if (filterLevel) params.level = filterLevel;
      if (filterAgent) params.agentId = filterAgent;
      const [eventsRes, agentsRes] = await Promise.all([
        eventsApi.list(params),
        agentsApi.list(),
      ]);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
    } catch {
      setError('Failed to load events.');
    } finally {
      setIsLoading(false);
    }
  }, [filterCategory, filterLevel, filterAgent]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    padding: '8px 12px',
    outline: 'none',
    fontSize: '13px',
    appearance: 'none' as const,
    cursor: 'pointer',
  };

  if (isLoading) return <TableSkeleton rows={8} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-white font-bold text-xl">Events</h2>
          <p className="text-white/40 text-sm mt-0.5">{events.length} events</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-white/40">
            <Filter className="w-4 h-4" />
            <span className="text-xs">Filters</span>
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={selectStyle}>
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={selectStyle}>
            <option value="">All Levels</option>
            {LEVELS.filter(Boolean).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} style={selectStyle}>
            <option value="">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No events found"
          description="No events match your current filters. Try adjusting the filters or send events from your agents."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <tr className="text-white/40 text-xs uppercase">
                  <th className="text-left px-5 py-4 font-medium">Timestamp</th>
                  <th className="text-left px-5 py-4 font-medium">Category</th>
                  <th className="text-left px-5 py-4 font-medium">Level</th>
                  <th className="text-left px-5 py-4 font-medium">Message</th>
                  <th className="text-left px-5 py-4 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3 text-white/50 text-xs whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={categoryVariant(event.category)}>
                        {event.category.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={levelVariant(event.level)}>{event.level}</Badge>
                    </td>
                    <td className="px-5 py-3 text-white/70 text-sm max-w-xs truncate">{event.message}</td>
                    <td className="px-5 py-3 text-white/50 text-sm">
                      {event.latencyMs !== null ? `${event.latencyMs}ms` : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
