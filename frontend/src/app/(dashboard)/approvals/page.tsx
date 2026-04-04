'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle, XCircle, Clock, AlertTriangle, X, Bot } from 'lucide-react';
import { approvalsApi, Approval } from '@/lib/api';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatDate';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';
type ModalMode = 'approve' | 'reject';

interface ModalState {
  mode: ModalMode;
  approval: Approval;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeBadgeVariant(type: Approval['type']) {
  switch (type) {
    case 'tool_execution': return 'info' as const;
    case 'data_access': return 'violet' as const;
    case 'cost_threshold': return 'warning' as const;
    case 'custom': return 'gray' as const;
  }
}

function typeLabel(type: Approval['type']) {
  switch (type) {
    case 'tool_execution': return 'Tool Execution';
    case 'data_access': return 'Data Access';
    case 'cost_threshold': return 'Cost Threshold';
    case 'custom': return 'Custom';
  }
}

function statusBadgeVariant(status: Approval['status']) {
  switch (status) {
    case 'pending': return 'warning' as const;
    case 'approved': return 'success' as const;
    case 'rejected': return 'error' as const;
    case 'expired': return 'gray' as const;
  }
}

function timeRemaining(expiresAt: string): string {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diff = exp - now;
  if (diff <= 0) return 'Expired';
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
  return `${minutes}m remaining`;
}

function truncatePayload(payload: Record<string, unknown>): string {
  const str = JSON.stringify(payload, null, 0);
  return str.length > 120 ? str.slice(0, 120) + '...' : str;
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

interface ConfirmModalProps {
  modal: ModalState;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

function ConfirmModal({ modal, onClose, onConfirm }: ConfirmModalProps) {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isApprove = modal.mode === 'approve';
  const agentName = modal.approval.agent?.name ?? modal.approval.requestedBy;

  async function handleConfirm() {
    setIsLoading(true);
    setError('');
    try {
      await onConfirm(comment.trim());
      onClose();
    } catch {
      setError(`Failed to ${modal.mode} the request. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="glass-card p-8 w-full max-w-md"
        style={{ background: 'rgba(13,13,26,0.97)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: isApprove ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${isApprove ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              {isApprove
                ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                : <XCircle className="w-5 h-5 text-red-400" />}
            </div>
            <h2 className="text-white font-bold text-lg">
              {isApprove ? 'Approve Request' : 'Reject Request'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors" aria-label="Close dialog">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="rounded-xl p-4 mb-5 space-y-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Bot className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-medium">{agentName}</span>
          </div>
          <div className="text-white/40 text-xs">{typeLabel(modal.approval.type)}</div>
        </div>

        {error && (
          <div
            className="mb-4 flex items-center gap-2 p-3 rounded-xl text-red-400 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-white/60 text-sm mb-1.5">
            Comment <span className="text-white/30">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isApprove ? 'Add approval note...' : 'Reason for rejection...'}
            rows={3}
            className="glass-input resize-none w-full"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-white/60 hover:text-white text-sm transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
            style={{
              background: isApprove
                ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.15))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
              border: `1px solid ${isApprove ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: isApprove ? '#34d399' : '#f87171',
            }}
          >
            {isLoading
              ? (isApprove ? 'Approving...' : 'Rejecting...')
              : (isApprove ? 'Approve' : 'Reject')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Card Skeleton ────────────────────────────────────────────────────────────

function ApprovalCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Approval Card ────────────────────────────────────────────────────────────

interface ApprovalCardProps {
  approval: Approval;
  index: number;
  onAction: (mode: ModalMode, approval: Approval) => void;
}

function ApprovalCard({ approval, index, onAction }: ApprovalCardProps) {
  const agentName = approval.agent?.name ?? approval.requestedBy;
  const isPending = approval.status === 'pending';
  const expiry = timeRemaining(approval.expiresAt);
  const isAlmostExpired = isPending && !expiry.startsWith('Expired') && expiry.startsWith('0') === false
    && parseInt(expiry) < 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="glass-card p-5 flex flex-col gap-4"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-medium text-sm truncate">{agentName}</div>
            <div className="text-white/40 text-xs truncate">
              {formatDate(approval.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={typeBadgeVariant(approval.type)}>{typeLabel(approval.type)}</Badge>
          <Badge variant={statusBadgeVariant(approval.status)}>{approval.status}</Badge>
        </div>
      </div>

      {/* Payload preview */}
      <div
        className="rounded-xl p-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-white/30 text-xs mb-1 font-mono uppercase tracking-wide">Payload</div>
        <pre className="text-white/60 text-xs font-mono break-all whitespace-pre-wrap leading-relaxed">
          {truncatePayload(approval.payload)}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        {isPending ? (
          <div className={`flex items-center gap-1.5 text-xs ${
            expiry === 'Expired' ? 'text-red-400' : isAlmostExpired ? 'text-amber-400' : 'text-white/40'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {expiry}
          </div>
        ) : (
          <div className="text-white/30 text-xs">
            {approval.reviewedAt ? `Reviewed ${formatDate(approval.reviewedAt)}` : ''}
            {approval.reviewComment && (
              <span className="ml-1 text-white/40 italic">"{approval.reviewComment}"</span>
            )}
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction('approve', approval)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399',
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={() => onAction('reject', approval)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
              }}
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}

function TabButton({ active, onClick, children, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
        color: active ? 'white' : 'rgba(255,255,255,0.45)',
        border: active ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
      }}
    >
      {children}
      {count !== undefined && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-md"
          style={{
            background: active ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)',
            color: active ? 'white' : 'rgba(255,255,255,0.4)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [modal, setModal] = useState<ModalState | null>(null);

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await approvalsApi.list();
      setApprovals(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load approvals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadApprovals(); }, [loadApprovals]);

  const filtered = approvals.filter((a) => {
    if (activeTab === 'all') return true;
    return a.status === activeTab;
  });

  const counts: Record<TabFilter, number> = {
    pending: approvals.filter((a) => a.status === 'pending').length,
    approved: approvals.filter((a) => a.status === 'approved').length,
    rejected: approvals.filter((a) => a.status === 'rejected').length,
    all: approvals.length,
  };

  function openModal(mode: ModalMode, approval: Approval) {
    setModal({ mode, approval });
  }

  async function handleConfirm(comment: string) {
    if (!modal) return;
    if (modal.mode === 'approve') {
      await approvalsApi.approve(modal.approval.id, comment || undefined);
    } else {
      await approvalsApi.reject(modal.approval.id, comment || undefined);
    }
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === modal.approval.id
          ? {
              ...a,
              status: modal.mode === 'approve' ? 'approved' : 'rejected',
              reviewComment: comment || null,
              reviewedAt: new Date().toISOString(),
            }
          : a
      )
    );
  }

  if (error) return <ErrorState message={error} onRetry={loadApprovals} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-xl">Approval Queue</h2>
          <p className="text-white/40 text-sm mt-0.5">
            Review and action pending agent requests before they proceed.
          </p>
        </div>
        {counts.pending > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#fbbf24',
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            {counts.pending} pending
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} count={counts.pending}>
          <Clock className="w-3.5 h-3.5" />
          Pending
        </TabButton>
        <TabButton active={activeTab === 'approved'} onClick={() => setActiveTab('approved')} count={counts.approved}>
          <CheckCircle className="w-3.5 h-3.5" />
          Approved
        </TabButton>
        <TabButton active={activeTab === 'rejected'} onClick={() => setActiveTab('rejected')} count={counts.rejected}>
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </TabButton>
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} count={counts.all}>
          All
        </TabButton>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ApprovalCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={
            activeTab === 'pending'
              ? 'No pending approvals'
              : activeTab === 'approved'
              ? 'No approved requests'
              : activeTab === 'rejected'
              ? 'No rejected requests'
              : 'No approvals yet'
          }
          description={
            activeTab === 'pending'
              ? 'All agent requests have been reviewed. New requests will appear here.'
              : 'Requests matching this filter will appear here.'
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((approval, i) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              index={i}
              onAction={openModal}
            />
          ))}
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {modal && (
          <ConfirmModal
            modal={modal}
            onClose={() => setModal(null)}
            onConfirm={handleConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
