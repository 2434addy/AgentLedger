'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, Zap, DollarSign } from 'lucide-react';
import { sessionsApi, eventsApi, Session, Event } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge, categoryVariant, levelVariant, statusVariant } from '@/components/ui/Badge';

const categoryColors: Record<string, string> = {
  llm_call: 'rgba(124,58,237,0.15)',
  tool_invocation: 'rgba(6,182,212,0.15)',
  error: 'rgba(239,68,68,0.15)',
  user_action: 'rgba(245,158,11,0.15)',
  agent_lifecycle: 'rgba(16,185,129,0.15)',
  system: 'rgba(107,114,128,0.15)',
};

const categoryBorderColors: Record<string, string> = {
  llm_call: 'rgba(124,58,237,0.3)',
  tool_invocation: 'rgba(6,182,212,0.3)',
  error: 'rgba(239,68,68,0.3)',
  user_action: 'rgba(245,158,11,0.3)',
  agent_lifecycle: 'rgba(16,185,129,0.3)',
  system: 'rgba(107,114,128,0.3)',
};

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (data === null) return <span className="text-gray-400">null</span>;
  if (typeof data === 'boolean') return <span className="text-amber-400">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-cyan-400">{data}</span>;
  if (typeof data === 'string') return <span className="text-emerald-400">&quot;{data}&quot;</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-white/40">[]</span>;
    return (
      <span>
        <button onClick={() => setExpanded(!expanded)} className="text-white/60 hover:text-white transition-colors">
          {expanded ? <ChevronDown className="inline w-3 h-3" /> : <ChevronRight className="inline w-3 h-3" />}
          <span className="text-white/40 ml-1">[{data.length}]</span>
        </button>
        {expanded && (
          <div style={{ marginLeft: '16px' }}>
            {data.map((item, i) => (
              <div key={i} className="text-white/60 text-xs">
                <span className="text-white/30">{i}: </span>
                <JsonTree data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data as Record<string, unknown>);
    if (keys.length === 0) return <span className="text-white/40">{'{}'}</span>;
    return (
      <span>
        <button onClick={() => setExpanded(!expanded)} className="text-white/60 hover:text-white transition-colors">
          {expanded ? <ChevronDown className="inline w-3 h-3" /> : <ChevronRight className="inline w-3 h-3" />}
          <span className="text-white/40 ml-1">{'{' + keys.length + '}'}</span>
        </button>
        {expanded && (
          <div style={{ marginLeft: '16px' }}>
            {keys.map((key) => (
              <div key={key} className="text-xs py-0.5">
                <span className="text-violet-300">{key}</span>
                <span className="text-white/30">: </span>
                <JsonTree data={(data as Record<string, unknown>)[key]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  return <span className="text-white/60">{String(data)}</span>;
}

export default function SessionReplayPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [sessionRes, eventsRes] = await Promise.all([
        sessionsApi.get(id),
        eventsApi.list({ sessionId: id }),
      ]);
      setSession(sessionRes.data);
      const evs = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      setEvents(evs);
      if (evs.length > 0) setSelectedEvent(evs[0]);
    } catch {
      setError('Failed to load session.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) return <TableSkeleton rows={6} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!session) return null;

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="text-white/40 text-xs mb-0.5">Session ID</div>
            <div className="text-white font-mono text-sm">{session.id}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Status</div>
            <Badge variant={statusVariant(session.status)}>{session.status}</Badge>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Agent</div>
            <div className="text-white/70 text-sm">{session.agent?.name ?? session.agentId}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Started</div>
            <div className="text-white/70 text-sm">{new Date(session.startedAt).toLocaleString()}</div>
          </div>
          {session.endedAt && (
            <div>
              <div className="text-white/40 text-xs mb-0.5">Ended</div>
              <div className="text-white/70 text-sm">{new Date(session.endedAt).toLocaleString()}</div>
            </div>
          )}
          <div>
            <div className="text-white/40 text-xs mb-0.5">Events</div>
            <div className="text-white/70 text-sm">{events.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: event timeline */}
        <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="text-white/40 text-xs uppercase font-medium px-1 mb-3">Event Timeline</div>
          {events.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">No events in this session yet</div>
          ) : (
            events.map((event, i) => (
              <motion.button
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: selectedEvent?.id === event.id
                    ? categoryColors[event.category]
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedEvent?.id === event.id
                    ? categoryBorderColors[event.category]
                    : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant={categoryVariant(event.category)} className="text-xs">
                    {event.category.replace('_', ' ')}
                  </Badge>
                  <span className="text-white/30 text-xs">
                    {new Date(event.occurredAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-white/70 text-xs truncate">{event.message}</div>
                {event.latencyMs !== null && (
                  <div className="flex items-center gap-1 mt-1.5 text-white/30 text-xs">
                    <Clock className="w-2.5 h-2.5" /> {event.latencyMs}ms
                  </div>
                )}
              </motion.button>
            ))
          )}
        </div>

        {/* Right: selected event detail */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <motion.div
                key={selectedEvent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-6 space-y-5"
                style={{
                  background: categoryColors[selectedEvent.category],
                  border: `1px solid ${categoryBorderColors[selectedEvent.category]}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={categoryVariant(selectedEvent.category)}>
                      {selectedEvent.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant={levelVariant(selectedEvent.level)}>
                      {selectedEvent.level}
                    </Badge>
                  </div>
                  <span className="text-white/40 text-xs">
                    {new Date(selectedEvent.occurredAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <div className="text-white/40 text-xs mb-1">Message</div>
                  <div className="text-white/90 text-sm leading-relaxed">{selectedEvent.message}</div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {selectedEvent.latencyMs !== null && (
                    <div>
                      <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                        <Clock className="w-3 h-3" /> Latency
                      </div>
                      <div className="text-white/80 text-sm">{selectedEvent.latencyMs}ms</div>
                    </div>
                  )}
                  {selectedEvent.tokenCount !== null && (
                    <div>
                      <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                        <Zap className="w-3 h-3" /> Tokens
                      </div>
                      <div className="text-white/80 text-sm">{selectedEvent.tokenCount}</div>
                    </div>
                  )}
                  {selectedEvent.costUsd !== null && (
                    <div>
                      <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                        <DollarSign className="w-3 h-3" /> Cost
                      </div>
                      <div className="text-white/80 text-sm">${(selectedEvent.costUsd ?? 0).toFixed(6)}</div>
                    </div>
                  )}
                </div>

                {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 && (
                  <div>
                    <div className="text-white/40 text-xs mb-2">Payload</div>
                    <div className="rounded-xl p-4 text-xs font-mono overflow-auto max-h-80"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <JsonTree data={selectedEvent.payload} />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-white/30 text-xs font-mono">ID: {selectedEvent.id}</div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-10 text-center text-white/30 text-sm">
                Select an event from the timeline to view its details
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
