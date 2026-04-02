'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Show success regardless to prevent email enumeration
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

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
              Secure password recovery. Your account is protected with SHA-256 hashed tokens.
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
          <div className="glass-card p-8">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Check your inbox</h2>
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  If an account exists for{' '}
                  <span className="text-white/70">{email}</span>, a password reset link has been
                  sent. The link expires in 1 hour.
                </p>
                <Link
                  href="/login"
                  className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
                >
                  Back to sign in
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Reset your password</h2>
                  <p className="text-white/50">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

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
                    <label className="block text-white/70 text-sm mb-1.5">Email address</label>
                    <input
                      suppressHydrationWarning
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="glass-input"
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full glass-button py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <p className="mt-6 text-center text-white/50 text-sm">
                  Remember your password?{' '}
                  <Link
                    href="/login"
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
