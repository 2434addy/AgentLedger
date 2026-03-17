'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Zap, BarChart3, Search, Lock, Bell, ArrowRight, Check } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Full Audit Trail',
    description: 'Every LLM call, tool use, and decision is recorded immutably. No event is ever lost or altered.',
  },
  {
    icon: Zap,
    title: 'Real-Time Streaming',
    description: 'Events flow in milliseconds. Watch your agents think in real time with zero latency.',
  },
  {
    icon: BarChart3,
    title: 'Cost Analytics',
    description: 'Break down spend by agent, model, and session. Eliminate runaway costs before they happen.',
  },
  {
    icon: Search,
    title: 'Session Replay',
    description: 'Step through any agent session like a debugger. Inspect every payload, every decision.',
  },
  {
    icon: Bell,
    title: 'Anomaly Detection',
    description: 'Automatic alerts when agents behave unexpectedly — cost spikes, loops, or silent failures.',
  },
  {
    icon: Lock,
    title: 'Compliance Reports',
    description: 'One-click compliance reports. Prove your AI systems behave as intended to any auditor.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Register Your Agent',
    description: 'Add your AI agent to AgentLedger in seconds. Get an API key and a unique agent ID.',
  },
  {
    step: '02',
    title: 'Emit Events',
    description: 'Send events from your agent using our SDK or REST API. Works with any LLM or framework.',
  },
  {
    step: '03',
    title: 'Full Observability',
    description: 'View sessions, replay decisions, track costs, and get alerts — all in one dashboard.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individuals and small projects',
    features: ['3 agents', '10k events/month', '7-day retention', 'Basic analytics', 'Community support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For teams building production AI',
    features: ['Unlimited agents', '1M events/month', '90-day retention', 'Full analytics', 'Anomaly detection', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations at scale',
    features: ['Unlimited everything', 'Unlimited retention', 'SSO & SAML', 'Custom compliance', 'Dedicated support', 'SLA guarantee'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }} />
            <span className="text-white font-bold text-lg">AgentLedger</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/70 hover:text-white text-sm transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="glass-button text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Floating orbs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Now in Public Beta
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Black Box Recorder
              <br />
              <span style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                for AI Agents
              </span>
            </h1>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Full observability for every AI agent you build. Record every decision, track every cost,
              and replay every session — so you always know what your agents are doing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-button text-base px-8 py-3 flex items-center gap-2"
                >
                  Start for Free <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-white/80 hover:text-white text-base px-8 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-white/50 text-lg">Up and running in under 5 minutes</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-8 relative"
              >
                <div className="text-5xl font-black mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(6,182,212,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {step.step}
                </div>
                <h3 className="text-white font-semibold text-xl mb-3">{step.title}</h3>
                <p className="text-white/50 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-white/50 text-lg">One platform for complete AI agent observability</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 group cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-white/50 text-lg">No hidden fees. Cancel anytime.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-8 relative"
                style={plan.highlight ? { border: '1px solid rgba(124,58,237,0.4)', boxShadow: '0 0 30px rgba(124,58,237,0.1)' } : {}}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-white/40 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    {plan.period && <span className="text-white/40 mb-1">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-white/70 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <button className="w-full glass-button py-3"
                    style={plan.highlight ? { background: 'rgba(124,58,237,0.5)', borderColor: 'rgba(124,58,237,0.8)' } : {}}>
                    {plan.cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-16"
            style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Ready to see inside your agents?</h2>
            <p className="text-white/50 mb-8 text-lg">
              Join developers who trust AgentLedger to keep their AI systems accountable.
            </p>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-button text-base px-10 py-3 inline-flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }} />
            <span className="text-white font-semibold">AgentLedger</span>
          </div>
          <div className="flex gap-6 text-white/40 text-sm">
            <Link href="/login" className="hover:text-white/70 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white/70 transition-colors">Sign Up</Link>
            <a href="https://github.com/2434addy/AgentLedger" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">GitHub</a>
          </div>
          <p className="text-white/30 text-sm">2024 AgentLedger. Open source.</p>
        </div>
      </footer>
    </div>
  );
}
