'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Clock, Zap, DollarSign,
  Play, Pause, SkipForward, RotateCcw,
  Shield, ShieldAlert, Link2, Link2Off, Check, X, Loader2,
} from 'lucide-react';
import { sessionsApi, eventsApi, Session, Event } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge, categoryVariant, levelVariant, statusVariant } from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/lib/formatDate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChainVerifyResult {
  total: number;
  valid: number;
  broken: number;
  chainIntact: boolean;
  brokenLinks: { eventId: string; seqNumber: number; reason: string }[];
}

interface EventVerifyResult {
  id: string;
  valid: boolean;
  storedHash: string;
  recomputedHash: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateHash(hash: string | null, chars = 12): string {
  if (!hash) return 'N/A';
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

/** Returns true when event[i].prevHash === event[i-1].hash (client-side check). */
function clientLinkValid(events: Event[], index: number): boolean | null {
  if (index === 0) return null; // first event has no predecessor
  const prev = events[index - 1];
  const curr = events[index];
  if (prev.hash === null || curr.prevHash === null) return null;
  return curr.prevHash === prev.hash;
}

const categoryColors: Record<string, string> = {
  llm_call: 'rgba(124,58,237,0.15)',
  tool_invocation: 'rgba(6,182,212,0.15)',
  error: 'rgba(239,68,68,0.15)',
  user_action: 'rgba(245,158,11,0.15)',
  agent_lifecycle: 'rgba(16,185,129,0.15)',
  system: 'rgba(107,114,128,0.15)',
  security: 'rgba(239,68,68,0.15)',
  guardrail: 'rgba(245,158,11,0.15)',
};

const categoryBorderColors: Record<string, string> = {
  llm_call: 'rgba(124,58,237,0.3)',
  tool_invocation: 'rgba(6,182,212,0.3)',
  error: 'rgba(239,68,68,0.3)',
  user_action: 'rgba(245,158,11,0.3)',
  agent_lifecycle: 'rgba(16,185,129,0.3)',
  system: 'rgba(107,114,128,0.3)',
  security: 'rgba(239,68,68,0.3)',
  guardrail: 'rgba(245,158,11,0.3)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StatePanel({ label, state, color }: { label: string; state: Record<string, unknown> | null; color: string }) {
  if (!state || Object.keys(state).length === 0) return null;
  return (
    <div>
      <div className="text-xs mb-2" style={{ color }}>{label}</div>
      <div className="rounded-xl p-3 text-xs font-mono overflow-auto max-h-48"
        style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}33` }}>
        <JsonTree data={state} />
      </div>
    </div>
  );
}

// ─── Chain Integrity Badge ─────────────────────────────────────────────────────

function ChainIntegrityBadge({
  result,
  isVerifying,
  onVerify,
}: {
  result: ChainVerifyResult | null;
  isVerifying: boolean;
  onVerify: () => void;
}) {
  const intact = result?.chainIntact ?? null;

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
        style={
          intact === true
            ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399' }
            : intact === false
            ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
        }
      >
        {intact === true ? (
          <Shield className="w-3.5 h-3.5" />
        ) : intact === false ? (
          <ShieldAlert className="w-3.5 h-3.5" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        {intact === true
          ? 'Chain Intact'
          : intact === false
          ? `Chain Broken (${result!.broken})`
          : 'Chain Unverified'}
      </motion.div>

      <button
        onClick={onVerify}
        disabled={isVerifying}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: 'rgba(167,139,250,0.9)' }}
      >
        {isVerifying ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Shield className="w-3 h-3" />
        )}
        {isVerifying ? 'Verifying…' : 'Verify Chain'}
      </button>
    </div>
  );
}

// ─── Chain Link Connector ──────────────────────────────────────────────────────

function ChainLinkConnector({ valid }: { valid: boolean | null }) {
  if (valid === null) return null;

  return (
    <div className="flex items-center justify-center py-0.5 px-3">
      <div className="flex items-center gap-1">
        <div
          className="h-px w-4"
          style={{
            borderTop: valid ? '1px solid rgba(16,185,129,0.5)' : '1px dashed rgba(239,68,68,0.5)',
          }}
        />
        {valid ? (
          <Link2 className="w-3 h-3 text-emerald-400/60" />
        ) : (
          <Link2Off className="w-3 h-3 text-red-400/80" />
        )}
        <div
          className="h-px w-4"
          style={{
            borderTop: valid ? '1px solid rgba(16,185,129,0.5)' : '1px dashed rgba(239,68,68,0.5)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Hash Details Panel ────────────────────────────────────────────────────────

function HashDetailsPanel({ event, brokenEventIds }: { event: Event; brokenEventIds: Set<string> }) {
  const [verifyResult, setVerifyResult] = useState<EventVerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const hasHashData = event.hash !== null || event.prevHash !== null || event.seqNumber !== null;
  const isBroken = brokenEventIds.has(event.id);

  const handleVerify = useCallback(async () => {
    setIsVerifying(true);
    setVerifyError('');
    setVerifyResult(null);
    try {
      const res = await eventsApi.verifyOne(event.id);
      setVerifyResult(res.data);
    } catch {
      setVerifyError('Verification request failed.');
    } finally {
      setIsVerifying(false);
    }
  }, [event.id]);

  const hashColor = verifyResult
    ? verifyResult.valid
      ? 'rgba(52,211,153,0.9)'
      : 'rgba(248,113,113,0.9)'
    : isBroken
    ? 'rgba(248,113,113,0.9)'
    : 'rgba(255,255,255,0.55)';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <Link2 className="w-3 h-3" />
          Hash Chain
        </div>
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all disabled:opacity-50"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: 'rgba(167,139,250,0.9)' }}
        >
          {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
          {isVerifying ? 'Verifying…' : 'Verify'}
        </button>
      </div>

      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Seq number */}
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs">Seq #</span>
          <span className="text-white/70 text-xs font-mono">
            {event.seqNumber !== null ? event.seqNumber : 'N/A'}
          </span>
        </div>

        {/* Current hash */}
        <div>
          <div className="text-white/40 text-xs mb-1">Hash</div>
          {event.hash ? (
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono break-all leading-relaxed"
                style={{ color: hashColor }}
                title={event.hash}
              >
                {truncateHash(event.hash)}
              </span>
              {verifyResult && (
                <span>
                  {verifyResult.valid
                    ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    : <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                </span>
              )}
            </div>
          ) : (
            <span className="text-white/30 text-xs font-mono">N/A</span>
          )}
        </div>

        {/* Prev hash */}
        <div>
          <div className="text-white/40 text-xs mb-1">Prev Hash</div>
          {event.prevHash ? (
            <span
              className="text-xs font-mono break-all leading-relaxed text-white/50"
              title={event.prevHash}
            >
              {truncateHash(event.prevHash)}
            </span>
          ) : (
            <span className="text-white/30 text-xs font-mono">{event.seqNumber === 0 ? 'genesis' : 'N/A'}</span>
          )}
        </div>

        {/* Verify result detail */}
        {verifyResult && !verifyResult.valid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-2 border-t"
            style={{ borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <div className="text-red-400/80 text-xs mb-1">Tamper detected</div>
            <div className="text-white/40 text-xs font-mono">
              <div>Stored: <span className="text-red-400/70">{truncateHash(verifyResult.storedHash)}</span></div>
              <div>Computed: <span className="text-emerald-400/70">{truncateHash(verifyResult.recomputedHash)}</span></div>
            </div>
          </motion.div>
        )}

        {verifyError && (
          <div className="text-red-400/70 text-xs">{verifyError}</div>
        )}

        {!hasHashData && (
          <div className="text-white/25 text-xs">No hash data — legacy event</div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionReplayPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Chain verification state
  const [chainResult, setChainResult] = useState<ChainVerifyResult | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const brokenEventIds = new Set<string>(chainResult?.brokenLinks.map(l => l.eventId) ?? []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let sessionData: Session | null = null;
      try {
        const sessionRes = await sessionsApi.get(id);
        sessionData = sessionRes.data;
      } catch {
        setError('Failed to load session. Session may not exist or you lack access.');
        setIsLoading(false);
        return;
      }
      setSession(sessionData);

      try {
        const eventsRes = await eventsApi.list({ sessionId: id, limit: 500 });
        const evs = Array.isArray(eventsRes.data) ? eventsRes.data : [];
        // Sort chronologically (oldest first) for replay
        evs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setEvents(evs);
        if (evs.length > 0) setSelectedEvent(evs[0]);
      } catch {
        // Session loaded but events failed — still show the session
        setEvents([]);
      }
    } catch {
      setError('Failed to load session.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleVerifyChain = useCallback(async () => {
    setIsVerifyingChain(true);
    try {
      const res = await eventsApi.verifyChain();
      setChainResult(res.data);
    } catch {
      // Silently fail — badge stays in "unverified" state
    } finally {
      setIsVerifyingChain(false);
    }
  }, []);

  // Replay logic
  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    if (replayTimerRef.current) {
      clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, []);

  const advanceReplay = useCallback((index: number) => {
    if (index >= events.length) {
      stopReplay();
      return;
    }
    setReplayIndex(index);
    setSelectedEvent(events[index]);

    const el = document.getElementById(`event-${events[index].id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    let delay = 1000;
    if (index + 1 < events.length) {
      const gap = new Date(events[index + 1].timestamp).getTime() - new Date(events[index].timestamp).getTime();
      delay = Math.min(2000, Math.max(300, gap));
    }
    replayTimerRef.current = setTimeout(() => advanceReplay(index + 1), delay);
  }, [events, stopReplay]);

  const startReplay = useCallback(() => {
    if (events.length === 0) return;
    setIsReplaying(true);
    advanceReplay(0);
  }, [events, advanceReplay]);

  const toggleReplay = useCallback(() => {
    if (isReplaying) {
      stopReplay();
    } else if (replayIndex >= events.length - 1) {
      startReplay();
    } else {
      setIsReplaying(true);
      advanceReplay(replayIndex + 1);
    }
  }, [isReplaying, replayIndex, events, stopReplay, startReplay, advanceReplay]);

  const resetReplay = useCallback(() => {
    stopReplay();
    setReplayIndex(0);
    if (events.length > 0) setSelectedEvent(events[0]);
  }, [stopReplay, events]);

  const skipForward = useCallback(() => {
    if (replayIndex + 1 < events.length) {
      const next = replayIndex + 1;
      setReplayIndex(next);
      setSelectedEvent(events[next]);
    }
  }, [replayIndex, events]);

  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    };
  }, []);

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
            <div className="text-white/70 text-sm">{formatDate(session.startedAt)}</div>
          </div>
          {session.endedAt && (
            <div>
              <div className="text-white/40 text-xs mb-0.5">Ended</div>
              <div className="text-white/70 text-sm">{formatDate(session.endedAt)}</div>
            </div>
          )}
          <div>
            <div className="text-white/40 text-xs mb-0.5">Events</div>
            <div className="text-white/70 text-sm">{events.length}</div>
          </div>

          {/* Chain Integrity indicator */}
          <div className="ml-auto">
            <div className="text-white/40 text-xs mb-1.5">Chain Integrity</div>
            <ChainIntegrityBadge
              result={chainResult}
              isVerifying={isVerifyingChain}
              onVerify={handleVerifyChain}
            />
          </div>
        </div>
      </div>

      {/* Replay controls */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleReplay}
            disabled={events.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
            style={{
              background: isReplaying ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
              border: `1px solid ${isReplaying ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
              color: isReplaying ? '#f87171' : '#34d399',
            }}
          >
            {isReplaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isReplaying ? 'Pause' : 'Replay'}
          </button>
          <button
            onClick={skipForward}
            disabled={events.length === 0 || replayIndex >= events.length - 1}
            className="p-2 rounded-lg text-white/40 hover:text-white/80 transition-colors disabled:opacity-30"
            title="Next event"
            aria-label="Next event"
          >
            <SkipForward className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={resetReplay}
            disabled={events.length === 0}
            className="p-2 rounded-lg text-white/40 hover:text-white/80 transition-colors disabled:opacity-30"
            title="Reset to start"
            aria-label="Reset to start"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
          {/* Progress bar */}
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: events.length > 0 ? `${((replayIndex + 1) / events.length) * 100}%` : '0%',
                background: 'linear-gradient(90deg, rgba(124,58,237,0.6), rgba(6,182,212,0.6))',
              }}
            />
          </div>
          <span className="text-white/40 text-xs font-mono min-w-[4rem] text-right">
            {events.length > 0 ? `${replayIndex + 1} / ${events.length}` : '0 / 0'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: event timeline */}
        <div ref={timelineRef} className="lg:col-span-2 space-y-0 max-h-[70vh] overflow-y-auto pr-1">
          <div className="text-white/40 text-xs uppercase font-medium px-1 mb-3">Event Timeline</div>
          {events.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">No events in this session yet</div>
          ) : (
            events.map((event, i) => {
              const linkValid = clientLinkValid(events, i);
              const isServerBroken = brokenEventIds.has(event.id);

              return (
                <div key={event.id}>
                  {/* Chain link connector between events */}
                  {i > 0 && (
                    <ChainLinkConnector
                      valid={isServerBroken ? false : linkValid}
                    />
                  )}

                  <motion.button
                    id={`event-${event.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setReplayIndex(i);
                    }}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{
                      background: selectedEvent?.id === event.id
                        ? categoryColors[event.category]
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${
                        isServerBroken
                          ? 'rgba(239,68,68,0.4)'
                          : selectedEvent?.id === event.id
                          ? categoryBorderColors[event.category]
                          : 'rgba(255,255,255,0.06)'
                      }`,
                      boxShadow: isReplaying && replayIndex === i
                        ? `0 0 12px ${categoryBorderColors[event.category]}`
                        : isServerBroken
                        ? '0 0 8px rgba(239,68,68,0.15)'
                        : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant={categoryVariant(event.category)} className="text-xs">
                        {event.category.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {/* Per-event hash indicator dot */}
                        {event.hash !== null && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            title={isServerBroken ? 'Tampered' : linkValid === false ? 'Chain mismatch' : 'Hash present'}
                            style={{
                              background: isServerBroken || linkValid === false
                                ? 'rgba(248,113,113,0.8)'
                                : 'rgba(52,211,153,0.7)',
                            }}
                          />
                        )}
                        <span className="text-white/30 text-xs">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="text-white/70 text-xs truncate">{event.message}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {event.latencyMs !== null && (
                        <span className="flex items-center gap-1 text-white/30 text-xs">
                          <Clock className="w-2.5 h-2.5" /> {event.latencyMs}ms
                        </span>
                      )}
                      {(event.stateBefore || event.stateAfter) && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.2)', color: 'rgba(167,139,250,0.8)' }}>
                          state
                        </span>
                      )}
                      {isServerBroken && (
                        <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(248,113,113,0.8)' }}>
                          <ShieldAlert className="w-2.5 h-2.5" /> tampered
                        </span>
                      )}
                    </div>
                  </motion.button>
                </div>
              );
            })
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
                    {formatDate(selectedEvent.timestamp)}
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
                  {(selectedEvent.tokensInput !== null || selectedEvent.tokensOutput !== null) && (
                    <div>
                      <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                        <Zap className="w-3 h-3" /> Tokens
                      </div>
                      <div className="text-white/80 text-sm">{(selectedEvent.tokensInput ?? 0) + (selectedEvent.tokensOutput ?? 0)}</div>
                    </div>
                  )}
                  {selectedEvent.costUsd !== null && (
                    <div>
                      <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                        <DollarSign className="w-3 h-3" /> Cost
                      </div>
                      <div className="text-white/80 text-sm">${(Number(selectedEvent.costUsd) || 0).toFixed(6)}</div>
                    </div>
                  )}
                </div>

                {/* Hash Chain section */}
                <HashDetailsPanel event={selectedEvent} brokenEventIds={brokenEventIds} />

                {/* State snapshots */}
                {(selectedEvent.stateBefore || selectedEvent.stateAfter) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatePanel label="State Before" state={selectedEvent.stateBefore} color="rgba(245,158,11,0.8)" />
                    <StatePanel label="State After" state={selectedEvent.stateAfter} color="rgba(16,185,129,0.8)" />
                  </div>
                )}

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
