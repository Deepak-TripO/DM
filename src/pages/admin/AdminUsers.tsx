import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUsers,
  updateUserQuota,
  toggleUserStatus,
  getUserFilesForAdmin,
  getUserActivityForAdmin,
  type AdminUserItem,
  type AdminFileItem,
  type AdminActivityItem,
} from '@/services/adminService';
import { formatBytes, formatDate, formatDateTime } from '@/utils';
import {
  Search,
  User,
  HardDrive,
  Loader2,
  MoreVertical,
  UserCheck,
  UserX,
  FileText,
  Activity,
  Eye,
  Edit,
  X,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'custom_quota'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'used_bytes'>('created_at');

  // Active user menu dropdown ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals state
  const [editingQuotaUser, setEditingQuotaUser] = useState<AdminUserItem | null>(null);
  const [newQuotaGB, setNewQuotaGB] = useState('');
  const [savingQuota, setSavingQuota] = useState(false);

  const [viewingUser, setViewingUser] = useState<AdminUserItem | null>(null);
  const [userFilesModal, setUserFilesModal] = useState<{ user: AdminUserItem; files: AdminFileItem[] } | null>(null);
  const [userActivityModal, setUserActivityModal] = useState<{ user: AdminUserItem; logs: AdminActivityItem[] } | null>(null);
  const [loadingModalData, setLoadingModalData] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers', search, statusFilter, sortBy],
    queryFn: () => getAdminUsers({ search, statusFilter, sortBy }),
  });

  const handleSaveQuota = async () => {
    if (!editingQuotaUser) return;
    const gbVal = parseFloat(newQuotaGB);
    if (isNaN(gbVal) || gbVal <= 0) {
      toast.error('Please enter a valid positive quota size in GB');
      return;
    }

    const quotaBytes = Math.round(gbVal * 1024 * 1024 * 1024);
    setSavingQuota(true);
    try {
      await updateUserQuota(editingQuotaUser.id, quotaBytes);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
      setEditingQuotaUser(null);
      toast.success(`Updated storage quota for ${editingQuotaUser.full_name || 'User'} to ${gbVal} GB`);
    } catch {
      toast.error('Failed to update storage quota');
    }
    setSavingQuota(false);
  };

  const handleToggleStatus = async (u: AdminUserItem) => {
    const newStatus = !u.is_disabled;
    try {
      await toggleUserStatus(u.id, newStatus);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
      setActiveMenuId(null);
      toast.success(`Account for ${u.full_name || 'User'} ${newStatus ? 'disabled' : 'enabled'}`);
    } catch {
      toast.error('Failed to change user account status');
    }
  };

  const handleViewFiles = async (u: AdminUserItem) => {
    setActiveMenuId(null);
    setLoadingModalData(true);
    try {
      const files = await getUserFilesForAdmin(u.id);
      setUserFilesModal({ user: u, files });
    } catch {
      toast.error('Failed to load user files');
    }
    setLoadingModalData(false);
  };

  const handleViewActivity = async (u: AdminUserItem) => {
    setActiveMenuId(null);
    setLoadingModalData(true);
    try {
      const logs = await getUserActivityForAdmin(u.id);
      setUserActivityModal({ user: u, logs });
    } catch {
      toast.error('Failed to load user activity');
    }
    setLoadingModalData(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">User Management</h1>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Inspect accounts, manage storage quotas, and adjust user permissions</p>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or username..."
            className="w-full rounded-xl neu-input py-2.5 pl-10 pr-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl neu-btn px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
            <option value="custom_quota">Custom Quota Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl neu-btn px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
          >
            <option value="created_at">Sort by Joined</option>
            <option value="full_name">Sort by Name</option>
            <option value="used_bytes">Sort by Storage Used</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl neu-card p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-light)]/40 text-[var(--color-text-tertiary)] uppercase font-extrabold tracking-wider">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Storage Used</th>
                <th className="px-4 py-3">Storage Quota</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]/20">
              {users.map((u) => {
                const usedPercent = Math.min(Math.round((u.used_bytes / Math.max(1, u.quota_bytes)) * 100), 100);

                return (
                  <tr key={u.id} className="transition-all hover:neu-pressed">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full neu-circle">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} className="h-9 w-9 rounded-full object-cover" alt="" />
                          ) : (
                            <User className="h-4 w-4 text-[var(--color-primary)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--color-text-primary)] truncate">{u.full_name || 'User'}</p>
                          <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] truncate">@{u.username || u.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-[11px] font-semibold">
                      {u.email || `${u.username || u.id.slice(0, 8)}@user.com`}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {u.is_disabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold text-red-500">
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Storage Used */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="font-bold text-[var(--color-text-primary)]">{formatBytes(u.used_bytes)}</span>
                        <div className="h-2 w-24 neu-progress-track">
                          <div className="h-full neu-progress-bar" style={{ width: `${usedPercent}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Storage Quota */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[var(--color-text-primary)]">{formatBytes(u.quota_bytes)}</span>
                        {u.is_custom && (
                          <span className="rounded-full neu-badge px-2 py-0.5 text-[9px] font-extrabold text-[var(--color-primary)]">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Files */}
                    <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">
                      {u.file_count}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-[var(--color-text-tertiary)] font-semibold whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                        className="h-8 w-8 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === u.id && (
                        <div className="absolute right-4 top-10 z-30 w-52 rounded-2xl neu-dropdown p-2 shadow-2xl text-left space-y-1">
                          <button
                            onClick={() => { setActiveMenuId(null); setViewingUser(u); }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/10"
                          >
                            <Eye className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                            View User
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setEditingQuotaUser(u);
                              setNewQuotaGB(String(Math.round((u.quota_bytes / (1024 * 1024 * 1024)) * 10) / 10));
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/10"
                          >
                            <HardDrive className="h-4 w-4 text-[var(--color-primary)]" />
                            Change Storage Quota
                          </button>

                          <button
                            onClick={() => handleViewFiles(u)}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/10"
                          >
                            <FileText className="h-4 w-4 text-purple-500" />
                            View Files
                          </button>

                          <button
                            onClick={() => handleViewActivity(u)}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/10"
                          >
                            <Activity className="h-4 w-4 text-indigo-500" />
                            View Activity
                          </button>

                          <div className="my-1 border-t border-[var(--color-border-light)]/40" />

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold ${
                              u.is_disabled ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-red-500 hover:bg-red-500/10'
                            }`}
                          >
                            {u.is_disabled ? (
                              <>
                                <UserCheck className="h-4 w-4" />
                                Enable Account
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4" />
                                Disable Account
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-xs font-semibold text-[var(--color-text-tertiary)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)] mr-2" />
            Loading registered users...
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="py-12 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">
            No users found matching your search and filter criteria.
          </div>
        )}
      </div>

      {/* MODAL 1: Change Storage Quota */}
      {editingQuotaUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingQuotaUser(null)} />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">User Storage Quota</h3>
              <button onClick={() => setEditingQuotaUser(null)} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[var(--color-text-tertiary)] font-semibold">User:</span>
                <p className="font-extrabold text-[var(--color-text-primary)] text-sm">{editingQuotaUser.full_name || 'User'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl neu-pressed p-4">
                <div>
                  <span className="text-[var(--color-text-tertiary)] font-semibold">Current Storage</span>
                  <p className="font-bold text-[var(--color-text-primary)]">{formatBytes(editingQuotaUser.used_bytes)} used</p>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)] font-semibold">Current Quota</span>
                  <p className="font-bold text-[var(--color-text-primary)]">{formatBytes(editingQuotaUser.quota_bytes)}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-[var(--color-text-primary)]">New Storage Quota (GB):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newQuotaGB}
                    onChange={(e) => setNewQuotaGB(e.target.value)}
                    className="flex-1 rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">GB</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={() => setEditingQuotaUser(null)}
                className="rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuota}
                disabled={savingQuota}
                className="flex items-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {savingQuota && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View User Details */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setViewingUser(null)} />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">User Profile Details</h3>
              <button onClick={() => setViewingUser(null)} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="flex items-center gap-4 pb-3 border-b border-[var(--color-border-light)]/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full neu-circle">
                  {viewingUser.avatar_url ? (
                    <img src={viewingUser.avatar_url} className="h-12 w-12 rounded-full object-cover" alt="" />
                  ) : (
                    <User className="h-6 w-6 text-[var(--color-primary)]" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">{viewingUser.full_name || 'User'}</h4>
                  <p className="text-xs text-[var(--color-text-tertiary)]">@{viewingUser.username || viewingUser.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">User ID</span><span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">{viewingUser.id}</span></div>
                <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Email</span><span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">{viewingUser.email || `${viewingUser.username || viewingUser.id.slice(0, 8)}@user.com`}</span></div>
                <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Status</span><span className="font-bold text-[var(--color-text-primary)]">{viewingUser.is_disabled ? 'Disabled' : 'Active'}</span></div>
                <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Joined Date</span><span className="font-bold text-[var(--color-text-primary)]">{formatDate(viewingUser.created_at)}</span></div>
                <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Total Files</span><span className="font-bold text-[var(--color-text-primary)]">{viewingUser.file_count}</span></div>
                <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Storage Quota</span><span className="font-bold text-[var(--color-text-primary)]">{formatBytes(viewingUser.quota_bytes)}</span></div>
                <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Storage Used</span><span className="font-bold text-[var(--color-text-primary)]">{formatBytes(viewingUser.used_bytes)}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={() => setViewingUser(null)}
                className="rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: User Files View */}
      {userFilesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setUserFilesModal(null)} />
          <div className="relative w-full max-w-lg rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Files owned by {userFilesModal.user.full_name || 'User'}</h3>
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">{userFilesModal.files.length} total files</p>
              </div>
              <button onClick={() => setUserFilesModal(null)} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              {userFilesModal.files.length === 0 ? (
                <div className="py-6 text-center font-semibold text-[var(--color-text-tertiary)]">No files uploaded by this user.</div>
              ) : (
                userFilesModal.files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-xl neu-pressed p-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-[var(--color-text-primary)] truncate">{f.name}</p>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">{formatBytes(f.size_bytes)} • {formatDate(f.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={() => setUserFilesModal(null)}
                className="rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: User Activity View */}
      {userActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setUserActivityModal(null)} />
          <div className="relative w-full max-w-lg rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Activity for {userActivityModal.user.full_name || 'User'}</h3>
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">Recent user actions</p>
              </div>
              <button onClick={() => setUserActivityModal(null)} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              {userActivityModal.logs.length === 0 ? (
                <div className="py-6 text-center font-semibold text-[var(--color-text-tertiary)]">No recent activity found.</div>
              ) : (
                userActivityModal.logs.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-xl neu-pressed p-3">
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)]">{l.action}</p>
                      {l.resource_name && <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">{l.resource_name}</p>}
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">{formatDateTime(l.created_at)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={() => setUserActivityModal(null)}
                className="rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
