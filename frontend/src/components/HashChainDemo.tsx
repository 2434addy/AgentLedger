'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RotateCcw, Zap, Shield, Link as LinkIcon, Terminal } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventCategory = 'agent_lifecycle' | 'llm_call' | 'tool_invocation';

interface ChainEvent {
  id: number;
  name: string;
  tamperedName: string;
  category: EventCategory;
  hash: string;
  prevHash: string;
}

// ---------------------------------------------------------------------------
// Deterministic display-only hash helpers
// ---------------------------------------------------------------------------

const ORIGINAL_EVENTS: ChainEvent[] = [
  {
    id: 1,
    name: 'Agent initialized',
    tamperedName: 'Agent initialized',
    category: 'agent_lifecycle',
    hash: 'a3f8c2e1d9b47f20',
    prevHash: '0000000000000000',
  },
  {
    id: 2,
    name: 'LLM call: GPT-4o',
    tamperedName: 'LLM call: TAMPERED',
    category: 'llm_call',
    hash: 'b2e7d1f4c8a35e91',
    prevHash: 'a3f8c2e1d9b47f20',
  },
  {
    id: 3,
    name: 'Tool: search_web',
    tamperedName: 'Tool: search_web',
    category: 'tool_invocation',
    hash: 'c9a4b3e801f265d7',
    prevHash: 'b2e7d1f4c8a35e91',
  },
  {
    id: 4,
    name: 'Response sent',
    tamperedName: 'Response sent',
    category: 'agent_lifecycle',
    hash: 'd1f5e2a7309bc84f',
    prevHash: 'c9a4b3e801f265d7',
  },
];

// After tampering event 2 its hash changes, so events 3 and 4 have wrong prevHashes.
const TAMPERED_HASH = 'ff00deadbeef1337';

function buildTamperedChain(): ChainEvent[] {
  return ORIGINAL_EVENTS.map((ev, i) => {
    if (i === 1) {
      return { ...ev, name: ev.tamperedName, hash: TAMPERED_HASH };
    }
    if (i === 2) {
      return { ...ev, prevHash: TAMPERED_HASH };
    }
    return { ...ev };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<EventCategory, { label: string; color: string; bg: string }> = {
  agent_lifecycle: { label: 'agent_lifecycle', color: '#A78BFA', bg: 'rgba(124,58,237,0.15)' },
  llm_call:        { label: 'llm_call',        color: '#06B6D4', bg: 'rgba(6,182,212,0.15)'  },
  tool_invocation: { label: 'tool_invocation', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
};

const CATEGORY_ICONS: Record<EventCategory, React.ElementType> = {
  agent_lifecycle: Shield,
  llm_call:        Zap,
  tool_invocation: Terminal,
};

interface EventCardProps {
  event: ChainEvent;
  isTampered: boolean;
  isBroken: boolean;
  isLast: boolean;
  showTamperButton: boolean;
  onTamper: () => void;
}

function EventCard({ event, isTampered, isBroken, isLast, showTamperButton, onTamper }: EventCardProps) {
  const catStyle = CATEGORY_STYLES[event.category];
  const CatIcon = CATEGORY_ICONS[event.category];

  const borderColor = isTampered
    ? 'rgba(239,68,68,0.7)'
    : isBroken
    ? 'rgba(239,68,68,0.4)'
    : 'rgba(255,255,255,0.08)';

  const glowStyle = isTampered
    ? { boxShadow: '0 0 24px rgba(239,68,68,0.35), 0 0 8px rgba(239,68,68,0.2)' }
    : isBroken
    ? { boxShadow: '0 0 12px rgba(239,68,68,0.2)' }
    : {};

  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={
          isTampered
            ? { x: [0, -6, 6, -4, 4, -2, 2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full rounded-xl p-3.5"
        style={{
          background: isTampered || isBroken
            ? 'rgba(239,68,68,0.06)'
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${borderColor}`,
          transition: 'border-color 0.4s, box-shadow 0.4s, background 0.4s',
          ...glowStyle,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CatIcon
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: isTampered || isBroken ? '#F87171' : catStyle.color }}
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={event.name}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-semibold truncate"
                style={{ color: isTampered ? '#FCA5A5' : 'rgba(255,255,255,0.9)' }}
              >
                {event.name}
              </motion.span>
            </AnimatePresence>
          </div>
          <span
            className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
            style={{
              background: isTampered || isBroken ? 'rgba(239,68,68,0.2)' : catStyle.bg,
              color: isTampered || isBroken ? '#F87171' : catStyle.color,
              border: `1px solid ${isTampered || isBroken ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
            }}
          >
            {catStyle.label}
          </span>
        </div>

        {/* Hash fields */}
        <div className="space-y-1">
          <HashField
            label="hash"
            value={event.hash}
            highlight={isTampered}
          />
          <HashField
            label="prevHash"
            value={event.prevHash}
            highlight={isBroken}
          />
        </div>

        {/* Tamper button */}
        {showTamperButton && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onTamper}
            className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'rgba(239,68,68,0.18)',
              border: '1px solid rgba(239,68,68,0.45)',
              color: '#FCA5A5',
            }}
          >
            Tamper with this event
          </motion.button>
        )}
      </motion.div>

      {/* Chain link connector */}
      {!isLast && (
        <ChainLink broken={isTampered || isBroken} />
      )}
    </div>
  );
}

interface HashFieldProps {
  label: string;
  value: string;
  highlight: boolean;
}

function HashField({ label, value, highlight }: HashFieldProps) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] leading-snug">
      <span className="text-white/25 flex-shrink-0">{label}:</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="truncate"
          style={{ color: highlight ? '#F87171' : '#4ADE80' }}
        >
          {value.slice(0, 8)}...
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

interface ChainLinkProps {
  broken: boolean;
}

function ChainLink({ broken }: ChainLinkProps) {
  return (
    <div className="flex flex-col items-center my-0.5" style={{ height: '28px' }}>
      <motion.div
        animate={{ opacity: broken ? [1, 0.3, 1] : 1 }}
        transition={{ duration: 0.6, repeat: broken ? Infinity : 0, repeatType: 'reverse' }}
        className="flex flex-col items-center gap-0.5"
      >
        {broken ? (
          // Broken dashed line
          <>
            <div className="w-px h-2.5" style={{ borderLeft: '2px dashed rgba(239,68,68,0.5)' }} />
            <LinkIcon className="w-3 h-3" style={{ color: 'rgba(239,68,68,0.6)', transform: 'rotate(45deg)' }} />
            <div className="w-px h-2.5" style={{ borderLeft: '2px dashed rgba(239,68,68,0.5)' }} />
          </>
        ) : (
          // Solid chain line
          <>
            <div className="w-px h-2.5" style={{ borderLeft: '2px solid rgba(74,222,128,0.3)' }} />
            <LinkIcon className="w-3 h-3" style={{ color: 'rgba(74,222,128,0.5)' }} />
            <div className="w-px h-2.5" style={{ borderLeft: '2px solid rgba(74,222,128,0.3)' }} />
          </>
        )}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export default function HashChainDemo() {
  const [isTampered, setIsTampered] = useState(false);
  const [chain, setChain] = useState<ChainEvent[]>(ORIGINAL_EVENTS);

  const handleTamper = useCallback(() => {
    setChain(buildTamperedChain());
    setIsTampered(true);
  }, []);

  const handleReset = useCallback(() => {
    setChain([...ORIGINAL_EVENTS]);
    setIsTampered(false);
  }, []);

  return (
    <div
      className="mt-4 rounded-xl p-4"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Live Hash Chain
        </span>
        {isTampered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
            style={{
              background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#A78BFA',
            }}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset
          </motion.button>
        )}
      </div>

      {/* Chain events */}
      <div className="flex flex-col">
        {chain.map((event, i) => {
          // Event 2 (index 1) is the one we tamper
          const isTheTamperedEvent = isTampered && i === 1;
          // Events after index 1 are broken when tampered
          const isBrokenDownstream = isTampered && i > 1;

          return (
            <EventCard
              key={event.id}
              event={event}
              isTampered={isTheTamperedEvent}
              isBroken={isBrokenDownstream}
              isLast={i === chain.length - 1}
              showTamperButton={!isTampered && i === 1}
              onTamper={handleTamper}
            />
          );
        })}
      </div>

      {/* Chain broken alert */}
      <AnimatePresence>
        {isTampered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="mt-4 flex items-start gap-2.5 rounded-xl p-3"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              boxShadow: '0 0 20px rgba(239,68,68,0.15)',
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-0.5">
                Chain Broken
              </p>
              <p className="text-[10px] text-red-300/70 leading-relaxed">
                Event 2 was modified. Events 3 and 4 have invalid{' '}
                <span className="font-mono">prevHash</span> — tampering is cryptographically
                detectable.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
