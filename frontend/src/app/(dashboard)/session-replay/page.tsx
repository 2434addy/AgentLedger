'use client';

import Link from 'next/link';
import { Video } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SessionReplayIndexPage() {
  return (
    <EmptyState
      icon={Video}
      title="Select a session to replay"
      description="Go to Sessions and click a session card to open the replay viewer."
      action={
        <Link href="/sessions">
          <button className="glass-button flex items-center gap-2">
            View Sessions
          </button>
        </Link>
      }
    />
  );
}
