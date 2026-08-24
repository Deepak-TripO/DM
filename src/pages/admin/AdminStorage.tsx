import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUsers,
  getSystemSettings,
  updateGlobalDefaultQuota,
  updateUserQuota,
  type AdminUserItem,
} from '@/services/adminService';
import { formatBytes } from '@/utils';
import { HardDrive, Loader2, Save, Users, Award, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStorage() {
  const queryClient = useQueryClient();

  // Scope: 'new' | 'no_custom' | 'all'
  const [applyScope, setApplyScope] = useState<'new' | 'no_custom' | 'all'>('new');
  const [defaultQuotaGB, setDefaultQuotaGB] = useState('10');
  const [savingDefault, setSavingDefault] = useState(false);

  // Individual user edit state
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [userQuotaGBInput, setUserQuotaGBInput] = useState('');
  const [savingUserQuota, setSavingUserQuota] = useState(false);

  // Fetch users & settings
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['adminStorageUsers'],
    queryFn: () => getAdminUsers({ sortBy: 'used_bytes', sortOrder: 'desc' }),
  });

  const { data: settings } = useQuery({
    queryKey: ['adminSystemSettings'],
    queryFn: getSystemSettings,
  });

  useEffect(() => {
    if (settings?.default_quota_bytes) {
      setDefaultQuotaGB(String(Math.round((settings.default_quota_bytes / (1024 * 1024 * 1024)) * 10) / 10));
    }
  }, [settings]);

  const totalUsed = users.reduce((sum, u) => sum + (u.used_bytes || 0), 0);
  const totalAllocated = users.reduce((sum, u) => sum + (u.quota_bytes || 0), 0);
  const availableStorage = Math.max(0, totalAllocated - totalUsed);
  const largestConsumers = [...users].sort((a, b) => b.used_bytes - a.used_bytes).slice(0, 5);

  const handleSaveDefault = async () => {
    const gbVal = parseFloat(defaultQuotaGB);
    if (isNaN(gbVal) || gbVal <= 0) {
      toast.error('Please enter a valid positive quota in GB');
      return;
    }

    const quotaBytes = Math.round(gbVal * 1024 * 1024 * 1024);
    setSavingDefault(true);

    try {
      await updateGlobalDefaultQuota(quotaBytes, applyScope);
      queryClient.invalidateQueries({ queryKey: ['adminStorageUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminSystemSettings'] });
      toast.success(`Default quota updated to ${gbVal} GB (${applyScope.replace('_', ' ')})`);
    } catch {
      toast.error('Failed to update global default quota');
    }
    setSavingDefault(false);
  };

  const handleSaveUserQuota = async () => {
    if (!editingUser) return;
    const gbVal = parseFloat(userQuotaGBInput);
    if (isNaN(gbVal) || gbVal <= 0) {
      toast.error('Please enter a valid positive quota size in GB');
      return;
    }

    const quotaBytes = Math.round(gbVal * 1024 * 1024 * 1024);
    setSavingUserQuota(true);

    try {
      await updateUserQuota(editingUser.id, quotaBytes);
      queryClient.invalidateQueries({ queryKey: ['adminStorageUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
      setEditingUser(null);
      toast.success(`Storage quota updated for ${editingUser.full_name || 'User'}`);
    } catch {
      toast.error('Failed to update user quota');
    }
    setSavingUserQuota(false);
  };

  const currentDefaultGB = settings?.default_quota_bytes
    ? Math.round((settings.default_quota_bytes / (1024 * 1024 * 1024)) * 10) / 10
    : 10;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Storage Management</h1>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Global default quota controls, total system capacity, and individual user storage limits</p>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl neu-card p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total Allocated</span>
          <p className="text-xl font-black text-[var(--color-text-primary)] mt-1">{formatBytes(totalAllocated)}</p>
        </div>

        <div className="rounded-2xl neu-card p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total Storage Used</span>
          <p className="text-xl font-black text-[var(--color-primary)] mt-1">{formatBytes(totalUsed)}</p>
        </div>

        <div className="rounded-2xl neu-card p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Available Storage</span>
          <p className="text-xl font-black text-emerald-500 mt-1">{formatBytes(availableStorage)}</p>
        </div>

        <div className="rounded-2xl neu-card p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Number of Users</span>
          <p className="text-xl font-black text-[var(--color-text-primary)] mt-1">{users.length}</p>
        </div>

        <div className="rounded-2xl neu-card p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Current Default</span>
          <p className="text-xl font-black text-purple-500 mt-1">{currentDefaultGB} GB</p>
        </div>
      </div>

      {/* Grid: Global Storage Control & Top Consumers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Global Storage Control Card */}
        <div className="rounded-3xl neu-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">DEFAULT USER STORAGE</h2>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Set system-wide storage allocation for registered users</p>
          </div>

          <div className="rounded-2xl neu-pressed p-3.5 text-xs flex justify-between items-center">
            <span className="text-[var(--color-text-tertiary)] font-semibold">Current Default:</span>
            <span className="font-extrabold text-[var(--color-text-primary)] text-sm">{currentDefaultGB} GB</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-text-primary)]">New Default Quota (GB):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                min="1"
                value={defaultQuotaGB}
                onChange={(e) => setDefaultQuotaGB(e.target.value)}
                className="w-36 rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] font-bold"
              />
              <span className="text-xs font-bold text-[var(--color-text-secondary)]">GB</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--color-border-light)]/40 text-xs">
            <p className="font-bold text-[var(--color-text-primary)]">Apply default quota to:</p>
            {[
              { value: 'new' as const, label: 'New users only' },
              { value: 'no_custom' as const, label: 'Users without custom quotas' },
              { value: 'all' as const, label: 'All users' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2.5 cursor-pointer font-semibold text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="scope"
                  checked={applyScope === value}
                  onChange={() => setApplyScope(value)}
                  className="accent-[var(--color-primary)] h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveDefault}
              disabled={savingDefault}
              className="flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
            >
              {savingDefault ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Default
            </button>
          </div>
        </div>

        {/* Largest Storage Consumers */}
        <div className="rounded-3xl neu-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-circle text-amber-500">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Largest Storage Consumers</h2>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Top accounts using the most storage space</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {largestConsumers.map((u, i) => {
              const uPercent = Math.min(Math.round((u.used_bytes / Math.max(1, u.quota_bytes)) * 100), 100);

              return (
                <div key={u.id} className="flex items-center justify-between rounded-xl neu-pressed p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full neu-circle font-extrabold text-[10px] text-[var(--color-primary)]">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--color-text-primary)] truncate">{u.full_name || 'User'}</p>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">{formatBytes(u.used_bytes)} / {formatBytes(u.quota_bytes)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-[var(--color-primary)]">{uPercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Storage Table */}
      <div className="rounded-3xl neu-card p-2">
        <div className="p-4 border-b border-[var(--color-border-light)]/40">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">User Storage Allocations</h2>
          <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Direct user quota modifications and current consumption</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-light)]/40 text-[var(--color-text-tertiary)] uppercase font-extrabold tracking-wider">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Quota</th>
                <th className="px-4 py-3">Usage %</th>
                <th className="px-4 py-3">Custom Quota</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]/20">
              {users.map((u) => {
                const percent = Math.min(Math.round((u.used_bytes / Math.max(1, u.quota_bytes)) * 1000) / 10, 100);

                return (
                  <tr key={u.id} className="transition-all hover:neu-pressed">
                    <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">
                      {u.full_name || 'User'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] font-semibold">
                      {formatBytes(u.used_bytes)}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">
                      {formatBytes(u.quota_bytes)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 neu-progress-track">
                          <div className="h-full neu-progress-bar" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="font-bold text-[11px] text-[var(--color-text-secondary)]">{percent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_custom ? (
                        <span className="rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                          Yes
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)] font-semibold text-[11px]">No (Default)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setUserQuotaGBInput(String(Math.round((u.quota_bytes / (1024 * 1024 * 1024)) * 10) / 10));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-primary)]"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit Quota
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {usersLoading && (
          <div className="py-12 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">Loading storage table...</div>
        )}
      </div>

      {/* Edit Individual Quota Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">USER STORAGE</h3>
              <button onClick={() => setEditingUser(null)} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[var(--color-text-tertiary)] font-semibold">User:</span>
                <p className="font-extrabold text-[var(--color-text-primary)] text-sm">{editingUser.full_name || 'User'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl neu-pressed p-4">
                <div>
                  <span className="text-[var(--color-text-tertiary)] font-semibold">Current Storage:</span>
                  <p className="font-bold text-[var(--color-text-primary)]">{formatBytes(editingUser.used_bytes)} used</p>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)] font-semibold">Current Quota:</span>
                  <p className="font-bold text-[var(--color-text-primary)]">{formatBytes(editingUser.quota_bytes)}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-[var(--color-text-primary)]">New Quota (GB):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={userQuotaGBInput}
                    onChange={(e) => setUserQuotaGBInput(e.target.value)}
                    className="flex-1 rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] font-bold"
                  />
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">GB</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserQuota}
                disabled={savingUserQuota}
                className="flex items-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {savingUserQuota && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
