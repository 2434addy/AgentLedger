'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bot, X, AlertCircle, Trash2 } from 'lucide-react';
import { agentsApi, Agent } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge, statusVariant } from '@/components/ui/Badge';

function RegisterAgentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [modelProvider, setModelProvider] = useState('openai');
  const [modelId, setModelId] = useState('gpt-4o');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Agent name is required.'); return; }
    if (!modelProvider.trim()) { setError('Model provider is required.'); return; }
    if (!modelId.trim()) { setError('Model ID is required.'); return; }
    setError('');
    setIsLoading(true);
    try {
      await agentsApi.create({ name, modelProvider, modelId, description: description || undefined });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message || 'Failed to create agent.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-8 w-full max-w-md"
        style={{ background: 'rgba(13,13,26,0.95)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">Register Agent</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-red-400 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1.5">Agent Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Assistant" className="glass-input" />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1.5">Model Provider</label>
            <select value={modelProvider} onChange={(e) => setModelProvider(e.target.value)}
              className="glass-input" style={{ appearance: 'none' }}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="cohere">Cohere</option>
              <option value="mistral">Mistral</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1.5">Model ID</label>
            <input value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="gpt-4o" className="glass-input" />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?" rows={3}
              className="glass-input resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-white/60 hover:text-white text-sm transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 glass-button py-2.5 disabled:opacity-50">
              {isLoading ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await agentsApi.list();
      setAgents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load agents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this agent? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await agentsApi.delete(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete agent.');
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <TableSkeleton rows={5} />;
  if (error) return <ErrorState message={error} onRetry={loadAgents} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Agents</h2>
          <p className="text-white/40 text-sm mt-0.5">{agents.length} registered {agents.length === 1 ? 'agent' : 'agents'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2 py-2.5 px-5">
          <Plus className="w-4 h-4" /> Register Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Register your first AI agent to start tracking its activity, costs, and behaviour."
          action={
            <button onClick={() => setShowModal(true)} className="glass-button flex items-center gap-2">
              <Plus className="w-4 h-4" /> Register Agent
            </button>
          }
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
                  <th className="text-left px-6 py-4 font-medium">Name</th>
                  <th className="text-left px-6 py-4 font-medium">Model</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Last Seen</th>
                  <th className="text-left px-6 py-4 font-medium">Provider</th>
                  <th className="text-right px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, i) => (
                  <motion.tr
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                          <Bot className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{agent.name}</div>
                          {agent.description && (
                            <div className="text-white/40 text-xs truncate max-w-xs">{agent.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/70 text-sm">{agent.modelId}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant(agent.status)}>{agent.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-white/50 text-sm">
                      {agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-white/50 text-sm capitalize">{agent.modelProvider}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(agent.id)}
                        disabled={deletingId === agent.id}
                        className="text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <RegisterAgentModal onClose={() => setShowModal(false)} onCreated={loadAgents} />
        )}
      </AnimatePresence>
    </div>
  );
}
