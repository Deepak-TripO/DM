import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminActivity } from '@/services/adminService';
import { formatDate, formatDateTime } from '@/utils';
import { Activity as ActivityIcon, Loader2, Search, Filter } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const actionLabels: Record<string, { label: string; color: string }> = {
  file_upload: { label: 'File Uploaded', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' },
  file_delete: { label: 'File Deleted', color: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' },
  file_rename: { label: 'File Renamed', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' },
  file_move: { label: 'File Moved', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' },
  folder_create: { label: 'Folder Created', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400' },
  folder_delete: { label: 'Folder Deleted', color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' },
  share_create: { label: 'Share Link Created', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' },
  share_revoke: { label: 'Share Link Revoked', color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' },
  quota_change: { label: 'Storage Quota Changed', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400' },
  user_status: { label: 'Account Status Changed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

export default function AdminActivity() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['adminActivity'],
    queryFn: getAdminActivity,
    refetchInterval: 10000,
  });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      (log.resource_name && log.resource_name.toLowerCase().includes(search.toLowerCase())) ||
      log.action.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">System Activity Log</h1>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Audit trail of user actions, file modifications, share creations, and administrative updates</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or resource name..."
            className="w-full rounded-xl neu-input py-2.5 pl-10 pr-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl neu-btn px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="file_upload">File Uploaded</option>
            <option value="file_delete">File Deleted</option>
            <option value="folder_create">Folder Created</option>
            <option value="share_create">Share Created</option>
            <option value="share_revoke">Share Revoked</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-xs font-semibold text-[var(--color-text-tertiary)]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)] mr-2" />
          Loading activity log...
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState icon={ActivityIcon} title="No activity recorded" description="System activity logs will appear here in real time." />
      ) : (
        <div className="rounded-3xl neu-card p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border-light)]/40 text-[var(--color-text-tertiary)] uppercase font-extrabold tracking-wider">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]/20">
                {filteredLogs.map((log) => {
                  const meta = actionLabels[log.action] || {
                    label: log.action,
                    color: 'text-[var(--color-text-secondary)]',
                  };
                  const dateObj = new Date(log.created_at);

                  return (
                    <tr key={log.id} className="transition-all hover:neu-pressed">
                      {/* Action */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full neu-badge px-3 py-1 text-[10px] font-bold text-[var(--color-primary)]">
                          <ActivityIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">
                        {log.user_name}
                      </td>

                      {/* Resource */}
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-semibold max-w-xs truncate">
                        {log.resource_name || '—'}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-[var(--color-text-tertiary)] font-semibold whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-right text-[var(--color-text-tertiary)] font-mono font-semibold whitespace-nowrap">
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
