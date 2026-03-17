'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, X, AlertCircle, Copy, Check, AlertOctagon } from 'lucide-react';
import { apiKeysApi, orgApi, ApiKey, ApiKeyCreated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

function NewKeyModal({ rawKey, onClose }: { rawKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-8 w-full max-w-lg"
        style={{ background: 'rgba(13,13,26,0.98)', border: '1px solid rgba(16,185,129,0.3)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-bold text-xl">API Key Created</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl mb-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              This is the only time you will see this key. Copy it now — it cannot be shown again.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <code className="flex-1 text-emerald-400 text-sm font-mono break-all">{rawKey}</code>
          <button onClick={copy} className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/50" />}
          </button>
        </div>

        <button onClick={onClose} className="w-full glass-button py-3">
          I&apos;ve saved my key
        </button>
      </motion.div>
    </div>
  );
}

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: ApiKeyCreated) => void }) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Key name is required.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await apiKeysApi.create(name);
      onCreated(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message || 'Failed to create key.';
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
          <h2 className="text-white font-bold text-xl">Generate API Key</h2>
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
            <label className="block text-white/70 text-sm mb-1.5">Key Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Agent" className="glass-input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-white/60 text-sm hover:text-white transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 glass-button py-2.5 disabled:opacity-50">
              {isLoading ? 'Generating...' : 'Generate Key'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, org, refreshOrg } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [keysError, setKeysError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile form
  const [orgName, setOrgName] = useState('');
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSaveMsg, setOrgSaveMsg] = useState('');

  useEffect(() => {
    if (org) setOrgName(org.name);
  }, [org]);

  const loadKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    setKeysError('');
    try {
      const res = await apiKeysApi.list();
      setApiKeys(Array.isArray(res.data) ? res.data : []);
    } catch {
      setKeysError('Failed to load API keys.');
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setIsSavingOrg(true);
    setOrgSaveMsg('');
    try {
      await orgApi.updateMe({ name: orgName });
      await refreshOrg();
      setOrgSaveMsg('Saved successfully');
      setTimeout(() => setOrgSaveMsg(''), 3000);
    } catch {
      setOrgSaveMsg('Failed to save.');
    } finally {
      setIsSavingOrg(false);
    }
  }

  async function handleDeleteKey(id: string) {
    if (!confirm('Revoke this API key? Any services using it will lose access immediately.')) return;
    setDeletingId(id);
    try {
      await apiKeysApi.delete(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      alert('Failed to revoke key.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleKeyCreated(key: ApiKeyCreated) {
    setApiKeys((prev) => [key, ...prev]);
    setShowCreateModal(false);
    setNewRawKey(key.rawKey);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-white font-bold text-lg mb-5">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Display Name</label>
            <input
              value={user?.displayName ?? ''}
              readOnly
              className="glass-input opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Email</label>
            <input
              value={user?.email ?? ''}
              readOnly
              className="glass-input opacity-60 cursor-not-allowed"
            />
          </div>
        </div>
      </motion.div>

      {/* Organisation section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-white font-bold text-lg mb-5">Organisation</h3>
        <form onSubmit={handleSaveOrg} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Organisation Name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="My Organisation"
              className="glass-input"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isSavingOrg} className="glass-button py-2 px-6 text-sm disabled:opacity-50">
              {isSavingOrg ? 'Saving...' : 'Save Changes'}
            </button>
            {orgSaveMsg && (
              <span className={`text-sm ${orgSaveMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
                {orgSaveMsg}
              </span>
            )}
          </div>
        </form>
      </motion.div>

      {/* API Keys section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">API Keys</h3>
          <button onClick={() => setShowCreateModal(true)} className="glass-button flex items-center gap-2 py-2 px-4 text-sm">
            <Plus className="w-4 h-4" /> Generate Key
          </button>
        </div>

        {isLoadingKeys ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : keysError ? (
          <ErrorState message={keysError} onRetry={loadKeys} />
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No API keys yet. Generate one to start using the API.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key, i) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <div>
                    <div className="text-white/80 text-sm font-medium">{key.name}</div>
                    <div className="text-white/40 text-xs font-mono">{key.prefix}••••••••••••••••</div>
                    <div className="text-white/30 text-xs mt-0.5">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  disabled={deletingId === key.id}
                  className="p-2 text-white/30 hover:text-red-400 transition-colors disabled:opacity-50 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
        style={{ border: '1px solid rgba(239,68,68,0.15)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <h3 className="text-red-400 font-bold text-lg">Danger Zone</h3>
        </div>
        <p className="text-white/50 text-sm mb-4">
          Deleting your organisation will remove all agents, sessions, events, and data. This action is irreversible.
        </p>
        <button
          className="px-5 py-2.5 rounded-xl text-red-400 text-sm font-medium border transition-colors hover:bg-red-500/10"
          style={{ borderColor: 'rgba(239,68,68,0.3)' }}
          onClick={() => alert('Please contact support to delete your organisation.')}
        >
          Delete Organisation
        </button>
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateKeyModal onClose={() => setShowCreateModal(false)} onCreated={handleKeyCreated} />
        )}
        {newRawKey && (
          <NewKeyModal rawKey={newRawKey} onClose={() => setNewRawKey(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
