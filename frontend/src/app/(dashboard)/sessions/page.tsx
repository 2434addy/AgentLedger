'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Clock, Zap, DollarSign, ChevronRight } from 'lucide-react';
import { sessionsApi, Session } from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge, statusVariant } from '@/components/ui/Badge';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await sessionsApi.list();
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load sessions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={loadSessions} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl">Sessions</h2>
        <p className="text-white/40 text-sm mt-0.5">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} total</p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No sessions yet"
          description="Sessions are created when your agents start working. Start sending events to see sessions here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-6 group cursor-pointer"
            >
              <Link href={`/session-replay/${session.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
                      <Play className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {session.agent?.name ?? `Agent ${session.agentId.slice(0, 8)}`}
                      </div>
                      <div className="text-white/40 text-xs font-mono">{session.id.slice(0, 16)}...</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(session.status)}>{session.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                      <Clock className="w-3 h-3" /> Started
                    </div>
                    <div className="text-white/70 text-xs">
                      {new Date(session.startedAt).toLocaleString()}
                    </div>
                  </div>
                  {session.eventCount !== undefined && (
                    <div>
                      <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                        <Zap className="w-3 h-3" /> Events
                      </div>
                      <div className="text-white/70 text-xs">{session.eventCount}</div>
                    </div>
                  )}
                  {session.totalCost !== undefined && (
                    <div>
                      <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                        <DollarSign className="w-3 h-3" /> Cost
                      </div>
                      <div className="text-white/70 text-xs">${(session.totalCost ?? 0).toFixed(4)}</div>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
