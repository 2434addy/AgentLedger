'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function validate(): string | null {
    if (!token) return 'Reset token is missing. Please use the link from your email.';
    if (!newPassword) return 'Password is required.';
    if (newPassword.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(newPassword)) return 'Password must include an uppercase letter.';
    if (!/[a-z]/.test(newPassword)) return 'Password must include a lowercase letter.';
    if (!/[0-9]/.test(newPassword)) return 'Password must include a number.';
    if (!/[^A-Za-z0-9]/.test(newPassword)) return 'Password must include a special character.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message || 'Failed to reset password. The link may have expired.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass-card p-8">
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Password updated</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Your password has been reset successfully. All existing sessions have been signed out
            for your security.
          </p>
          <Link
            href="/login"
            className="inline-block glass-button px-6 py-2.5 text-sm"
          >
            Sign in with new password
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Set a new password</h2>
            <p className="text-white/50">Choose a strong password for your account.</p>
          </div>

          {!token && (
            <div
              className="mb-4 flex items-center gap-2 p-3 rounded-xl text-amber-400 text-sm"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No reset token found. Please use the link from your email.
            </div>
          )}

          {error && (
            <div
              className="mb-4 flex items-center gap-2 p-3 rounded-xl text-red-400 text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">New password</label>
              <div className="relative">
                <input
                  suppressHydrationWarning
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="glass-input pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-white/30 text-xs mt-1">
                Must include uppercase, lowercase, number, and special character.
              </p>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-1.5">Confirm new password</label>
              <div className="relative">
                <input
                  suppressHydrationWarning
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="glass-input pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full glass-button py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="mt-6 text-center text-white/50 text-sm">
            <Link
              href="/forgot-password"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Request a new link
            </Link>
            {' '}or{' '}
            <Link
              href="/login"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #0A0A0F 100%)' }}
      >
        <motion.div
          animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                boxShadow: '0 0 40px rgba(124,58,237,0.3)',
              }}
            >
              <div className="w-8 h-8 border-2 border-white/80 rounded-lg" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">AgentLedger</h1>
            <p className="text-white/50 text-lg leading-relaxed max-w-xs mx-auto">
              Reset tokens are single-use and expire in 1 hour. All sessions are revoked on reset.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'radial-gradient(ellipse at 70% 50%, #0D0D1A 0%, #0A0A0F 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Suspense
            fallback={
              <div className="glass-card p-8 text-center text-white/50">Loading...</div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
