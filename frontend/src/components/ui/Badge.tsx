'use client';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'violet' | 'cyan' | 'gray';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/80 border-white/20',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active': return 'success';
    case 'idle': return 'warning';
    case 'error': return 'error';
    case 'offline': return 'gray';
    case 'completed': return 'success';
    case 'aborted': return 'error';
    default: return 'default';
  }
}

export function categoryVariant(category: string): BadgeVariant {
  switch (category) {
    case 'llm_call': return 'violet';
    case 'tool_invocation': return 'cyan';
    case 'error': return 'error';
    case 'user_action': return 'warning';
    case 'agent_lifecycle': return 'success';
    case 'system': return 'gray';
    default: return 'default';
  }
}

export function levelVariant(level: string): BadgeVariant {
  switch (level) {
    case 'debug': return 'gray';
    case 'info': return 'info';
    case 'warn': return 'warning';
    case 'error': return 'error';
    case 'critical': return 'error';
    default: return 'default';
  }
}

export function severityVariant(severity: string): BadgeVariant {
  switch (severity) {
    case 'low': return 'info';
    case 'medium': return 'warning';
    case 'high': return 'error';
    case 'critical': return 'error';
    default: return 'default';
  }
}
