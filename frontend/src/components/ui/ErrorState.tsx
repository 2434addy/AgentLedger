'use client';

import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="glass-card p-8 flex flex-col items-center gap-4 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-white/70 text-sm">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="glass-button text-sm px-6 py-2">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
