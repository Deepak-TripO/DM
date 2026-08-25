import { useQuery } from '@tanstack/react-query';
import { getAdminOverviewStats, getAdminActivity } from '@/services/adminService';
import { formatBytes, formatDate } from '@/utils';
import { Users, FileText, HardDrive, Link2, UserCheck, Database, Activity, ArrowRight } from 'lucide-react';
import { StatCardSkeleton } from '@/components/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';

export default function AdminOverview() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminOverviewStats'],
    queryFn: getAdminOverviewStats,
    refetchInterval: 15000,
  });

  const { data: activityList = [], isLoading: activityLoading } = useQuery({
    queryKey: ['adminOverviewActivity'],
    queryFn: getAdminActivity,
  });

  if (statsLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Admin Overview</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">System statistics and overall metrics</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'TOTAL USERS',
      value: stats?.totalUsers ?? 0,
      subtext: 'Registered accounts',
      icon: Users,
      color: '#4D94E8',
      link: '/admin/users',
    },
    {
      label: 'ACTIVE USERS',
      value: stats?.activeUsers ?? 0,
      subtext: 'Non-disabled users',
      icon: UserCheck,
      color: '#22A06B',
      link: '/admin/users',
    },
    {
      label: 'TOTAL FILES',
      value: stats?.totalFiles ?? 0,
      subtext: 'Stored documents & media',
      icon: FileText,
      color: '#8A63D2',
      link: '/admin/files',
    },
    {
      label: 'STORAGE USED',
      value: formatBytes(stats?.totalUsed ?? 0),
      subtext: 'Actual disk space used',
      icon: HardDrive,
      color: '#18AFAF',
      link: '/admin/storage',
    },
    {
      label: 'STORAGE ALLOCATED',
      value: formatBytes(stats?.totalAllocated ?? 0),
      subtext: 'Total assigned capacity',
      icon: Database,
      color: '#6675D9',
      link: '/admin/storage',
    },
    {
      label: 'ACTIVE SHARED LINKS',
      value: stats?.activeShares ?? 0,
      subtext: 'Public shared links',
      icon: Link2,
      color: '#159A8A',
      link: '/admin/shared-links',
    },
  ];

  const usagePercent = stats && stats.totalAllocated > 0
    ? Math.min(Math.round((stats.totalUsed / stats.totalAllocated) * 1000) / 10, 100)
    : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">System Overview</h1>
          <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)]">Real-time SaaS administrative metrics and performance</p>
        </div>
      </div>

      {/* 6 Core Stat Cards — Compact 2-column grid on mobile view */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, idx) => (
          <div
            key={card.label}
            onClick={() => navigate(card.link)}
            className={`group relative cursor-pointer rounded-2xl neu-card p-3 md:p-5 transition-all hover:scale-[1.01] ${
              idx === statCards.length - 1 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 md:mb-3">
              <span className="text-[9px] md:text-[10px] font-extrabold tracking-wider text-[var(--color-text-tertiary)] uppercase truncate">
                {card.label}
              </span>
              <div className="flex h-7 w-7 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl neu-circle">
                <card.icon className="h-3.5 w-3.5 md:h-5 md:w-5" style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-lg md:text-2xl font-extrabold text-[var(--color-text-primary)] mb-0.5">
              {card.value}
            </div>
            <p className="hidden md:block text-xs font-medium text-[var(--color-text-tertiary)]">{card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Storage Allocation Visualization */}
      {stats && (
        <div className="rounded-3xl neu-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Overall Storage Utilization</h2>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {formatBytes(stats.totalUsed)} used out of {formatBytes(stats.totalAllocated)} total allocated
              </p>
            </div>
            <span className="text-lg font-black text-[var(--color-primary)]">{usagePercent}%</span>
          </div>

          <div className="h-4 neu-progress-track">
            <div
              className="h-full neu-progress-bar"
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border-light)]/40 text-xs">
            <div className="neu-pressed p-3 rounded-xl">
              <span className="text-[var(--color-text-tertiary)] font-semibold">Storage Used</span>
              <p className="font-extrabold text-[var(--color-text-primary)] mt-0.5">{formatBytes(stats.totalUsed)}</p>
            </div>
            <div className="neu-pressed p-3 rounded-xl">
              <span className="text-[var(--color-text-tertiary)] font-semibold">Available Allocated</span>
              <p className="font-extrabold text-[var(--color-text-primary)] mt-0.5">
                {formatBytes(Math.max(0, stats.totalAllocated - stats.totalUsed))}
              </p>
            </div>
            <div className="neu-pressed p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[var(--color-text-tertiary)] font-semibold">Total Capacity</span>
              <p className="font-extrabold text-[var(--color-text-primary)] mt-0.5">{formatBytes(stats.totalAllocated)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent System Activity Preview */}
      <div className="rounded-3xl neu-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
              <Activity className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Recent System Activity</h2>
          </div>
          <button
            onClick={() => navigate('/admin/activity')}
            className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-primary)]"
          >
            View All Activity
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {activityLoading ? (
          <div className="py-6 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">Loading activity...</div>
        ) : activityList.length === 0 ? (
          <div className="py-6 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">No recent system activity recorded.</div>
        ) : (
          <div className="space-y-2">
            {activityList.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl neu-pressed p-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)] uppercase">
                    {log.action}
                  </span>
                  <span className="font-bold text-[var(--color-text-primary)] truncate">{log.user_name}</span>
                  {log.resource_name && (
                    <span className="text-[var(--color-text-tertiary)] font-medium truncate">({log.resource_name})</span>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
