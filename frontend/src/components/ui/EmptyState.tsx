'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="glass-card p-10 flex flex-col items-center gap-4 max-w-md w-full text-center">
        {Icon && (
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-violet-400" />
          </div>
        )}
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        {description && <p className="text-white/50 text-sm">{description}</p>}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
