'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Zap, BarChart3, Search, Lock, Bell, ArrowRight, Check, UserCheck, CheckCircle, Fingerprint, AlertTriangle, FileText, Download, Copy, ExternalLink } from 'lucide-react';

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
    icon: FileText,
    title: 'One-Click Compliance Reports',
    description: 'Generate audit-ready reports mapped to EU AI Act Articles 9, 13, 14 & 17, SOC 2 Type II AI controls, and ISO 42001 clauses — in one click. Hand them directly to auditors, legal, or enterprise procurement.',
    complianceBadges: [
      { label: 'EU AI Act', color: '#3B82F6' },
      { label: 'SOC 2 Type II', color: '#8B5CF6' },
      { label: 'ISO 42001', color: '#10B981' },
    ],
  },
  {
    icon: Fingerprint,
    title: 'Tamper-Proof Audit Chain',
    description: 'Every agent action is SHA-256 hashed and chained. Any attempt to alter historical records is cryptographically impossible — giving regulators and auditors a trail they can actually trust.',
    codeSnippet: true,
  },
  {
    icon: UserCheck,
    title: 'Human-in-Loop Approval Queue',
    description: 'Pause high-risk agent actions for human review before execution. Meet EU AI Act Article 14 mandates with a built-in approval workflow — approve, reject, or modify any agent decision in real time.',
    badge: 'EU AI Act Art. 14',
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
    features: ['3 agents', '10k events/month', '7-day retention', 'Basic analytics', 'Basic audit logs only', 'Community support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For teams building production AI',
    features: ['Unlimited agents', '1M events/month', '90-day retention', 'Full analytics', 'EU AI Act + SOC 2 reports included', 'Anomaly detection', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations at scale',
    features: ['Unlimited everything', 'Unlimited retention', 'SSO & SAML', 'Custom compliance frameworks + ISO 42001', 'Dedicated support', 'SLA guarantee'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const HEX = '0123456789abcdef';
function HashAnimation() {
  const [hash, setHash] = useState('a3f8c2e1d9b4f7a2');
  useEffect(() => {
    const interval = setInterval(() => {
      setHash(Array.from({ length: 16 }, () => HEX[Math.floor(Math.random() * 16)]).join(''));
    }, 200);
    return () => clearInterval(interval);
  }, []);
  return (
    <code className="text-xs font-mono tracking-wider" style={{ color: '#4ADE80' }}>
      <span className="text-white/30">action_hash: </span>
      sha256:{hash}...
    </code>
  );
}

const auditBlocks = [
  { action: 'tool_call', hash: 'a3f8c2e1', prev: '00000000', time: '10:42:08' },
  { action: 'llm_response', hash: 'b2e7d1f4', prev: 'a3f8c2e1', time: '10:42:09' },
  { action: 'api_request', hash: 'c9a4b3e8', prev: 'b2e7d1f4', time: '10:42:10' },
  { action: 'db_write', hash: 'd1f5e2a7', prev: 'c9a4b3e8', time: '10:42:11' },
];

/* ── SDK Code Snippets Data ── */
const sdkTabs = [
  {
    id: 'openai',
    label: 'OpenAI Agents',
    language: 'typescript',
    code: `import { AgentLedger } from '@agentledger/sdk';

const ledger = new AgentLedger({ apiKey: 'al_your_key' });

const agent = ledger.wrap('gpt-4o-agent', async (input) => {
  return await openai.chat.completions.create({ ... });
});

// Every call is now SHA-256 hashed, logged, and EU AI Act ready
await agent.run({ task: 'Analyze customer data' });`,
  },
  {
    id: 'langchain',
    label: 'LangChain',
    language: 'typescript',
    code: `import { AgentLedger } from '@agentledger/sdk';
import { AgentExecutor } from 'langchain/agents';

const ledger = new AgentLedger({ apiKey: 'al_your_key' });

// Drop into any existing LangChain agent — zero refactoring
const trackedExecutor = ledger.wrap('langchain-agent', executor);

await trackedExecutor.invoke({ input: 'Summarize sales report' });
// Tamper-proof audit trail generated automatically ✓`,
  },
  {
    id: 'crewai',
    label: 'CrewAI',
    language: 'typescript',
    code: `import { AgentLedger } from '@agentledger/sdk';
import { Crew } from 'crewai';

const ledger = new AgentLedger({ apiKey: 'al_your_key' });

const crew = new Crew({ agents: [...], tasks: [...] });

// Wrap your entire crew — all agents tracked in one session
const session = await ledger.session('market-research-crew', () =>
  crew.kickoff({ inputs: { topic: 'Q1 Sales' } })
);
// Human approval queue activated for high-risk actions ✓`,
  },
  {
    id: 'rest',
    label: 'Custom / REST API',
    language: 'bash',
    code: `# Works with ANY agent — curl, Python, Go, anything

curl -X POST https://api.agentledger.io/v1/events \\
  -H "Authorization: Bearer al_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "my-custom-agent",
    "action": "send_email",
    "payload": { "to": "user@co.com" },
    "risk_level": "high"
  }'

# Response includes SHA-256 hash + approval status
# { "hash": "sha256:a3f8c2...", "status": "PENDING_APPROVAL" }`,
  },
];

/* ── Competitor Comparison Data ── */
const comparisonRows = [
  { feature: 'EU AI Act Compliance Reports', agentledger: { text: 'Included', status: 'yes' }, langsmith: { text: 'Enterprise only', status: 'no' }, langfuse: { text: 'Not available', status: 'no' } },
  { feature: 'SOC 2 Type II Reports', agentledger: { text: 'Included', status: 'yes' }, langsmith: { text: 'Enterprise only', status: 'no' }, langfuse: { text: 'Not available', status: 'no' } },
  { feature: 'ISO 42001 Reports', agentledger: { text: 'Included', status: 'yes' }, langsmith: { text: 'Enterprise only', status: 'no' }, langfuse: { text: 'Not available', status: 'no' } },
  { feature: 'Human-in-Loop Approval Queue', agentledger: { text: 'Included', status: 'yes' }, langsmith: { text: 'Not available', status: 'no' }, langfuse: { text: 'Not available', status: 'no' } },
  { feature: 'Tamper-Proof SHA-256 Audit Chain', agentledger: { text: 'Included', status: 'yes' }, langsmith: { text: 'Not available', status: 'no' }, langfuse: { text: 'Not available', status: 'no' } },
  { feature: 'Agent Rollback Engine', agentledger: { text: 'Included', status: 'yes' }, langsmith: { text: 'Not available', status: 'no' }, langfuse: { text: 'Not available', status: 'no' } },
  { feature: 'One-Click Compliance Export', agentledger: { text: 'Included', status: 'yes' }, langsmith: { text: 'Enterprise only', status: 'no' }, langfuse: { text: 'Not available', status: 'no' } },
  { feature: 'Works with ANY Framework', agentledger: { text: 'Yes', status: 'yes' }, langsmith: { text: 'LangChain only', status: 'warn' }, langfuse: { text: 'Yes', status: 'yes' } },
  { feature: 'Retention (base plan)', agentledger: { text: '90 days', status: 'yes' }, langsmith: { text: '14 days only', status: 'warn' }, langfuse: { text: '60 days', status: 'yes' } },
  { feature: 'Pricing', agentledger: { text: '$29/month', status: 'yes' }, langsmith: { text: '~$100K/year', status: 'no' }, langfuse: { text: '$29/month', status: 'yes' } },
];

/* ── Syntax Highlighting Helper ── */
function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  if (language === 'bash') {
    return (
      <>
        {code.split('\n').map((line, i) => {
          if (line.trimStart().startsWith('#')) {
            return <span key={i} className="block" style={{ color: '#6A737D', fontStyle: 'italic' }}>{line}{'\n'}</span>;
          }
          // Highlight strings in quotes
          const parts = line.split(/(["'][^"']*["'])/g);
          return (
            <span key={i} className="block">
              {parts.map((part, j) => {
                if (/^["']/.test(part)) return <span key={j} style={{ color: '#A5D6FF' }}>{part}</span>;
                // Highlight flags/options
                const flagParts = part.split(/(-[A-Za-z]+)/g);
                return flagParts.map((fp, k) => {
                  if (/^-[A-Za-z]/.test(fp)) return <span key={k} style={{ color: '#D2A8FF' }}>{fp}</span>;
                  return <span key={k} style={{ color: '#E6EDF3' }}>{fp}</span>;
                });
              })}
              {'\n'}
            </span>
          );
        })}
      </>
    );
  }

  // TypeScript highlighting
  return (
    <>
      {code.split('\n').map((line, i) => {
        // Comments
        if (line.trimStart().startsWith('//')) {
          return <span key={i} className="block" style={{ color: '#6A737D', fontStyle: 'italic' }}>{line}{'\n'}</span>;
        }

        // Process tokens
        const tokens = line.split(/(\b(?:import|from|const|let|var|async|await|return|new|function)\b|'[^']*'|"[^"]*"|`[^`]*`|\{|\}|\(|\)|=>|\.\.\.)/g);
        return (
          <span key={i} className="block">
            {tokens.map((token, j) => {
              // Keywords
              if (/^(import|from|const|let|var|async|await|return|new|function)$/.test(token)) {
                return <span key={j} style={{ color: '#D2A8FF' }}>{token}</span>;
              }
              // Strings
              if (/^['"`]/.test(token)) {
                return <span key={j} style={{ color: '#A5D6FF' }}>{token}</span>;
              }
              // Default
              return <span key={j} style={{ color: '#E6EDF3' }}>{token}</span>;
            })}
            {'\n'}
          </span>
        );
      })}
    </>
  );
}

export default function LandingPage() {
  const [tamperedBlock, setTamperedBlock] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('openai');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const copyCode = useCallback((tabId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  }, []);

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
              Tamper-Proof Audit Layer
              <br />
              <span style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                for AI Agents
              </span>
            </h1>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Cryptographically immutable audit trails, human-in-loop controls, and one-click compliance reports — for every AI agent you build.
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

            {/* Trust Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              {[
                { icon: Lock, label: 'SHA-256 Tamper-Proof Audit Trail' },
                { icon: Shield, label: 'EU AI Act Ready' },
                { icon: Zap, label: '<5ms Event Latency' },
              ].map((item) => {
                const TIcon = item.icon;
                return (
                  <span key={item.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white/50"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <TIcon className="w-3 h-3" />
                    {item.label}
                  </span>
                );
              })}
            </motion.div>

            {/* Compliance Frameworks */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-4 text-xs text-white/30"
            >
              Trusted compliance coverage for{' '}
              <span className="text-blue-400/70">EU AI Act</span>
              {' · '}
              <span className="text-violet-400/70">SOC 2 Type II</span>
              {' · '}
              <span className="text-emerald-400/70">ISO 42001</span>
            </motion.p>

            {/* Live Hash Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-5"
            >
              <HashAnimation />
            </motion.div>
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

      {/* ═══════════════════════════════════════════════ */}
      {/* Framework-Agnostic SDK Code Snippets           */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Works With Every Framework.{' '}
              <span style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Not Just LangChain.
              </span>
            </h2>
            <p className="text-white/50 text-lg">5 lines of code. Any agent framework. Full compliance coverage.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(6,182,212,0.3), rgba(124,58,237,0.5))',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 4s ease infinite',
            }}
          >
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1117' }}>
              {/* Tabs */}
              <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,17,23,0.95)' }}>
                {sdkTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
                    style={{
                      color: activeTab === tab.id ? '#E6EDF3' : 'rgba(230,237,243,0.5)',
                      background: activeTab === tab.id ? 'rgba(124,58,237,0.08)' : 'transparent',
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Code Block */}
              {sdkTabs.map((tab) => (
                tab.id === activeTab && (
                  <div key={tab.id} className="relative">
                    {/* Copy button */}
                    <button
                      onClick={() => copyCode(tab.id, tab.code)}
                      className="absolute top-3 right-3 p-2 rounded-lg transition-all z-10"
                      style={{
                        background: copiedTab === tab.id ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                        border: copiedTab === tab.id ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                      title="Copy code"
                    >
                      {copiedTab === tab.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50" />
                      )}
                    </button>

                    <pre className="p-5 pr-14 overflow-x-auto text-sm leading-relaxed font-mono" style={{ background: '#0d1117' }}>
                      <code>
                        <SyntaxHighlight code={tab.code} language={tab.language} />
                      </code>
                    </pre>
                  </div>
                )
              ))}
            </div>
          </motion.div>

          {/* Bottom note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 text-center"
          >
            <p className="text-white/40 text-sm">
              Don&apos;t see your framework? AgentLedger works with any framework via REST API.{' '}
              <a href="#" className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors">
                View full SDK docs <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </motion.div>
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
                  {'complianceBadges' in feature && feature.complianceBadges && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(feature.complianceBadges as Array<{label: string; color: string}>).map((b) => (
                        <span key={b.label} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                          style={{ background: `${b.color}25`, border: `1px solid ${b.color}50` }}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {'codeSnippet' in feature && feature.codeSnippet && (
                    <pre className="mt-3 p-3 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto"
                      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <code className="text-emerald-400/80">
{`{
  action_id: "act_9f3k2m",
  hash: "sha256:a3f8c2e1...",
  prev_hash: "sha256:b2e7d1f4...",
  timestamp: "2026-03-23T10:42:11Z"
}`}
                      </code>
                    </pre>
                  )}
                  {'badge' in feature && feature.badge && (
                    <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#FBBF24' }}>
                      {feature.badge}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for Compliance / Human-in-Loop */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Built for Compliance, Not Just Observability</h2>
            <p className="text-white/50 text-lg">The only agent platform with a built-in human approval workflow</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Approval Queue Mockup */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-0 overflow-hidden"
            >
              {/* Mockup header */}
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-white font-semibold text-sm">Approval Queue</span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#FBBF24' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  3 PENDING
                </span>
              </div>

              {/* Queue item 1 */}
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245,158,11,0.03)' }}>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">finance-agent</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}>HIGH</span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: 'rgba(245,158,11,0.2)', color: '#FBBF24' }}>
                        <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                        PENDING REVIEW
                      </span>
                    </div>
                    <p className="text-white/40 text-xs">Execute wire transfer of $48,200 to vendor account</p>
                  </div>
                  <span className="text-white/20 text-xs whitespace-nowrap mt-0.5">2m ago</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.5)' }}>Approve</button>
                  <button className="px-3 py-1 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>Reject</button>
                </div>
              </div>

              {/* Queue item 2 */}
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">support-agent</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.2)', color: '#FBBF24' }}>MEDIUM</span>
                    </div>
                    <p className="text-white/40 text-xs">Send account credentials reset to user@client.com</p>
                  </div>
                  <span className="text-white/20 text-xs whitespace-nowrap mt-0.5">5m ago</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.5)' }}>Approve</button>
                  <button className="px-3 py-1 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>Reject</button>
                </div>
              </div>

              {/* Queue item 3 */}
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">data-agent</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}>HIGH</span>
                    </div>
                    <p className="text-white/40 text-xs">Delete 12,400 records from production database</p>
                  </div>
                  <span className="text-white/20 text-xs whitespace-nowrap mt-0.5">8m ago</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.5)' }}>Approve</button>
                  <button className="px-3 py-1 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>Reject</button>
                </div>
              </div>
            </motion.div>

            {/* Right: Bullet points + CTA */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-white mb-3">Human oversight where it matters most</h3>
              <p className="text-white/50 mb-8 leading-relaxed">
                High-risk AI actions shouldn&apos;t execute unchecked. AgentLedger intercepts agent decisions and routes them through a real-time approval queue.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Intercept any agent action before it executes',
                  'Approve, reject, or modify with full audit log',
                  'EU AI Act Article 14 compliant out of the box',
                  'Configurable thresholds — only review what matters',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-button text-sm px-6 py-2.5 inline-flex items-center gap-2"
                >
                  See How It Works <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How the Audit Chain Works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className="text-4xl font-bold text-white mb-4">How the Audit Chain Works</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Every action is cryptographically linked. Tamper with one block, and the entire chain breaks.
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-white/30 text-sm mb-12"
          >
            Hover any block to simulate a tamper attempt
          </motion.p>

          {/* Chain diagram */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0"
          >
            {auditBlocks.map((block, i) => {
              const isTampered = tamperedBlock !== null;
              const isTamperedBlock = tamperedBlock === i;
              const isDownstream = tamperedBlock !== null && i >= tamperedBlock;

              return (
                <div key={block.hash} className="flex flex-col md:flex-row items-center">
                  {/* Block */}
                  <motion.div
                    onHoverStart={() => setTamperedBlock(i)}
                    onHoverEnd={() => setTamperedBlock(null)}
                    className="relative rounded-xl p-4 w-56 cursor-pointer transition-all duration-300"
                    style={{
                      background: isDownstream
                        ? 'rgba(239,68,68,0.1)'
                        : 'rgba(124,58,237,0.08)',
                      border: isDownstream
                        ? '1px solid rgba(239,68,68,0.4)'
                        : '1px solid rgba(124,58,237,0.25)',
                      boxShadow: isTamperedBlock
                        ? '0 0 30px rgba(239,68,68,0.3)'
                        : isTampered
                          ? 'none'
                          : '0 0 20px rgba(124,58,237,0.08)',
                    }}
                  >
                    {/* Tamper warning */}
                    {isTamperedBlock && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                        style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        TAMPER DETECTED
                      </motion.div>
                    )}
                    {isDownstream && !isTamperedBlock && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                        style={{ background: 'rgba(239,68,68,0.7)', color: '#fff' }}
                      >
                        CHAIN BROKEN
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold ${isDownstream ? 'text-red-400' : 'text-violet-400'}`}>
                        {block.action}
                      </span>
                      <span className="text-white/20 text-[10px]">{block.time}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/25 text-[10px]">hash</span>
                        <code className={`text-[10px] font-mono ${isDownstream ? 'text-red-400/70 line-through' : 'text-emerald-400/60'}`}>
                          {block.hash}
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/25 text-[10px]">prev</span>
                        <code className={`text-[10px] font-mono ${isDownstream && i > (tamperedBlock ?? 0) ? 'text-red-400/70' : 'text-white/25'}`}>
                          {block.prev}
                        </code>
                      </div>
                    </div>
                  </motion.div>

                  {/* Arrow connector */}
                  {i < auditBlocks.length - 1 && (
                    <div className={`hidden md:flex items-center mx-1 text-lg ${
                      tamperedBlock !== null && i >= tamperedBlock ? 'text-red-500/60' : 'text-white/15'
                    } transition-colors duration-300`}>
                      &rarr;
                    </div>
                  )}
                  {i < auditBlocks.length - 1 && (
                    <div className={`md:hidden text-lg my-1 ${
                      tamperedBlock !== null && i >= tamperedBlock ? 'text-red-500/60' : 'text-white/15'
                    } transition-colors duration-300`}>
                      &darr;
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Compliance Coverage */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Built for the Regulations That Actually Matter</h2>
            <p className="text-white/50 text-lg">AgentLedger maps every agent action to the specific articles and controls auditors look for.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* EU AI Act Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 0 25px rgba(59,130,246,0.05)' }}
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-4 text-blue-300"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                Effective August 2026
              </span>
              <h3 className="text-white font-bold text-xl mb-4">EU AI Act</h3>
              <ul className="space-y-2.5 mb-5">
                {[
                  ['Article 9', 'Risk Management System'],
                  ['Article 13', 'Transparency & Logging'],
                  ['Article 14', 'Human Oversight'],
                  ['Article 17', 'Quality Management'],
                ].map(([art, desc]) => (
                  <li key={art} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span><span className="text-white/80 font-medium">{art}</span> <span className="text-white/40">— {desc}</span></span>
                  </li>
                ))}
              </ul>
              <span className="text-[10px] font-semibold text-blue-400/60 uppercase tracking-wider">High-Risk AI Systems</span>
            </motion.div>

            {/* SOC 2 Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 25px rgba(139,92,246,0.05)' }}
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-4 text-violet-300"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                Trust Service Criteria
              </span>
              <h3 className="text-white font-bold text-xl mb-4">SOC 2 Type II</h3>
              <ul className="space-y-2.5 mb-5">
                {[
                  ['CC7.2', 'System Monitoring'],
                  ['CC7.3', 'Incident Detection'],
                  ['CC9.2', 'Vendor Risk Management'],
                  ['A1.2', 'System Availability'],
                ].map(([code, desc]) => (
                  <li key={code} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span><span className="text-white/80 font-medium">{code}</span> <span className="text-white/40">— {desc}</span></span>
                  </li>
                ))}
              </ul>
              <span className="text-[10px] font-semibold text-violet-400/60 uppercase tracking-wider">AI Operations</span>
            </motion.div>

            {/* ISO 42001 Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 0 25px rgba(16,185,129,0.05)' }}
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-4 text-emerald-300"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                AI Management System
              </span>
              <h3 className="text-white font-bold text-xl mb-4">ISO 42001</h3>
              <ul className="space-y-2.5 mb-5">
                {[
                  ['Clause 6.1', 'Risk & Opportunity'],
                  ['Clause 8.4', 'AI System Logging'],
                  ['Clause 9.1', 'Monitoring & Measurement'],
                  ['Clause 10.2', 'Nonconformity & Corrective Action'],
                ].map(([clause, desc]) => (
                  <li key={clause} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><span className="text-white/80 font-medium">{clause}</span> <span className="text-white/40">— {desc}</span></span>
                  </li>
                ))}
              </ul>
              <span className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-wider">AI Governance</span>
            </motion.div>
          </div>

          {/* CTA strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center glass-card p-6 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <p className="text-white/60 text-sm">Audit coming up? Generate your compliance package in under 60 seconds.</p>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-button text-sm px-5 py-2 inline-flex items-center gap-2 whitespace-nowrap"
              >
                Generate Sample Report <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Report Preview Mockup */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
          >
            {/* SAMPLE REPORT watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
              <span className="text-6xl md:text-8xl font-black rotate-[-18deg]" style={{ color: 'rgba(0,0,0,0.04)' }}>
                SAMPLE REPORT
              </span>
            </div>

            {/* Report header */}
            <div className="px-6 md:px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }} />
                <div>
                  <h4 className="text-gray-900 font-bold text-sm">AgentLedger Compliance Report</h4>
                  <p className="text-gray-400 text-[10px]">EU AI Act — Generated Mar 23, 2026</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>

            {/* Report table */}
            <div className="relative z-20">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th className="text-left px-6 md:px-8 py-3 text-gray-500 font-medium text-xs">Article</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Requirement</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Status</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs hidden sm:table-cell">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { article: 'Article 13', req: 'Transparency Logging', pass: true, evidence: 'View 2,847 events' },
                    { article: 'Article 14', req: 'Human Oversight Controls', pass: true, evidence: 'View 12 approvals' },
                    { article: 'Article 9', req: 'Risk Management Trail', pass: true, evidence: 'View audit chain' },
                    { article: 'Article 17', req: 'Quality Management System', pass: false, evidence: '2 gaps identified' },
                  ].map((row) => (
                    <tr key={row.article} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td className="px-6 md:px-8 py-3.5 text-gray-900 font-medium text-xs">{row.article}</td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">{row.req}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.pass
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {row.pass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-blue-600 text-xs cursor-pointer hover:underline">{row.evidence}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* Competitor Comparison Table             */}
      {/* ═══════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Enterprise Compliance Shouldn&apos;t Cost{' '}
              <span style={{ background: 'linear-gradient(135deg, #EF4444, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                $100,000
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-3xl mx-auto">
              LangSmith locks compliance behind a $100K/year Enterprise plan. AgentLedger gives you full compliance coverage at $29/month.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto rounded-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th className="text-left px-5 py-4 text-white/50 font-medium text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    Feature
                  </th>
                  <th className="text-center px-5 py-4 relative" style={{ borderBottom: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.06)' }}>
                    {/* BEST VALUE badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                      BEST VALUE
                    </div>
                    <span className="text-white font-bold text-xs">AgentLedger Pro</span>
                    <br />
                    <span className="text-violet-400 text-xs font-medium">$29/mo</span>
                  </th>
                  <th className="text-center px-5 py-4 text-white/50 font-medium text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-white/60 font-bold">LangSmith Enterprise</span>
                    <br />
                    <span className="text-white/40 text-xs">$100K+/yr</span>
                  </th>
                  <th className="text-center px-5 py-4 text-white/50 font-medium text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-white/60 font-bold">Langfuse</span>
                    <br />
                    <span className="text-white/40 text-xs">$29/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => {
                  const statusIcon = (s: { text: string; status: string }) => {
                    if (s.status === 'yes') return <span style={{ color: '#10B981' }}>&#10003; {s.text}</span>;
                    if (s.status === 'warn') return <span style={{ color: '#F59E0B' }}>&#9888;&#xFE0F; {s.text}</span>;
                    return <span style={{ color: '#EF4444' }}>&#10005; {s.text}</span>;
                  };

                  return (
                    <tr
                      key={row.feature}
                      style={{
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <td className="px-5 py-3.5 text-white/70 text-sm font-medium">{row.feature}</td>
                      <td className="px-5 py-3.5 text-center text-sm" style={{ background: 'rgba(124,58,237,0.04)', borderLeft: '1px solid rgba(124,58,237,0.15)', borderRight: '1px solid rgba(124,58,237,0.15)' }}>
                        {statusIcon(row.agentledger)}
                      </td>
                      <td className="px-5 py-3.5 text-center text-sm">{statusIcon(row.langsmith)}</td>
                      <td className="px-5 py-3.5 text-center text-sm">{statusIcon(row.langfuse)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-4 text-white/25 text-xs text-center max-w-2xl mx-auto"
          >
            Competitor pricing sourced from public documentation as of March 2026. LangSmith compliance features require Enterprise plan (~$100K+ annual commitment).
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-button text-base px-8 py-3 inline-flex items-center gap-2"
                style={{ background: 'rgba(124,58,237,0.5)', borderColor: 'rgba(124,58,237,0.8)' }}
              >
                Start Free — No Credit Card Required <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <p className="mt-3 text-white/30 text-sm">Join developers who chose compliance without the enterprise price tag</p>
          </motion.div>
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
