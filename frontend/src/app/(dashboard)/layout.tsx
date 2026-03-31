'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  Play,
  Zap,
  DollarSign,
  AlertTriangle,
  Video,
  Shield,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/sessions', label: 'Sessions', icon: Play },
  { href: '/events', label: 'Events', icon: Zap },
  { href: '/cost-analytics', label: 'Cost Analytics', icon: DollarSign },
  { href: '/anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
  { href: '/session-replay', label: 'Session Replay', icon: Video },
  { href: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { href: '/compliance', label: 'Compliance', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, org, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl animate-pulse"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }} />
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="glass-sidebar flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }} />
            <span className="text-white font-bold text-base">AgentLedger</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative group"
                  style={{
                    background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                    borderLeft: isActive ? '2px solid #7C3AED' : '2px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="glass-card p-3 mb-2">
            <p className="text-white/80 text-sm font-medium truncate">{user?.displayName}</p>
            <p className="text-white/40 text-xs truncate">{org?.name ?? 'Loading...'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/50 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen" style={{ marginLeft: '240px' }}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between"
          style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h1 className="text-white font-semibold">
              {navItems.find((n) => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-white/40 text-sm hidden md:block">{org?.name}</div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              {user?.displayName?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
