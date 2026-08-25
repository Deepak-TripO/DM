import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getAdminTasks,
  createAdminTask,
  deleteAdminTask,
  updateAdminTask,
  getTaskAccessList,
  assignTaskAccess,
  revokeTaskAccess,
  getTaskAccessCountsMap,
  getAdminUsers,
} from '@/services/adminService';
import type { AdminTaskItem, TaskAccessItem, AdminUserItem } from '@/services/adminService';
import { formatDate } from '@/utils';
import { CheckSquare, Plus, Search, Trash2, Pencil, Loader2, X, HardDrive, Users, UserPlus, UserMinus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AdminTaskItem | null>(null);
  const [taskName, setTaskName] = useState('');
  const [validationError, setValidationError] = useState('');

  // Manage Access Modal State
  const [accessModalTask, setAccessModalTask] = useState<AdminTaskItem | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignError, setAssignError] = useState('');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['adminTasks'],
    queryFn: getAdminTasks,
  });

  const { data: accessCounts = {} } = useQuery({
    queryKey: ['taskAccessCounts'],
    queryFn: getTaskAccessCountsMap,
  });

  const { data: adminUsers = [] } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: () => getAdminUsers({ statusFilter: 'all' }),
  });

  const { data: accessList = [], isLoading: loadingAccessList } = useQuery({
    queryKey: ['taskAccessList', accessModalTask?.id],
    queryFn: () => (accessModalTask ? getTaskAccessList(accessModalTask.id) : Promise.resolve([])),
    enabled: !!accessModalTask,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createAdminTask(user!.id, name),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['adminTasks'] });
      queryClient.invalidateQueries({ queryKey: ['activeTasks'] });
      toast.success(`Task "${newTask.name}" created successfully`);
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Unable to create task. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateAdminTask(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTasks'] });
      queryClient.invalidateQueries({ queryKey: ['activeTasks'] });
      toast.success('Task updated successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Unable to update task. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTasks'] });
      queryClient.invalidateQueries({ queryKey: ['activeTasks'] });
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Unable to delete task. Permission denied.');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, targetUserId }: { taskId: string; targetUserId: string }) =>
      assignTaskAccess(taskId, targetUserId, user!.id),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['taskAccessList', accessModalTask?.id] });
      queryClient.invalidateQueries({ queryKey: ['taskAccessCounts'] });
      queryClient.invalidateQueries({ queryKey: ['activeTasks'] });
      toast.success(`Access granted to user ${newItem.user_name}`);
      setSelectedUserId('');
      setAssignError('');
    },
    onError: (err: any) => {
      setAssignError(err?.message || 'Failed to assign task access.');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ taskId, targetUserId }: { taskId: string; targetUserId: string }) =>
      revokeTaskAccess(taskId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskAccessList', accessModalTask?.id] });
      queryClient.invalidateQueries({ queryKey: ['taskAccessCounts'] });
      queryClient.invalidateQueries({ queryKey: ['activeTasks'] });
      toast.success('Task access revoked');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to revoke task access.');
    },
  });

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskName('');
    setValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: AdminTaskItem) => {
    setEditingTask(task);
    setTaskName(task.name);
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setTaskName('');
    setValidationError('');
  };

  const openAccessModal = (task: AdminTaskItem) => {
    setAccessModalTask(task);
    setSelectedUserId('');
    setAssignError('');
  };

  const closeAccessModal = () => {
    setAccessModalTask(null);
    setSelectedUserId('');
    setAssignError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = taskName.trim();

    if (!trimmed) {
      setValidationError('Task name cannot be empty');
      return;
    }

    const invalidCharsRegex = /[\\/:*?"<>|]/;
    if (invalidCharsRegex.test(trimmed)) {
      setValidationError('Task name contains invalid characters (\\ / : * ? " < > |)');
      return;
    }

    const duplicate = tasks.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase() && t.id !== editingTask?.id
    );
    if (duplicate) {
      setValidationError('A task with this name already exists');
      return;
    }

    if (!user) {
      toast.error('Authentication required');
      return;
    }

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, name: trimmed });
    } else {
      createMutation.mutate(trimmed);
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedUserId.trim();
    if (!targetId) {
      setAssignError('Please select or enter a User ID');
      return;
    }
    if (!accessModalTask || !user) return;

    setAssignError('');
    assignMutation.mutate({ taskId: accessModalTask.id, targetUserId: targetId });
  };

  const filteredTasks = tasks.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl neu-pressed text-[var(--color-primary)]">
            <CheckSquare className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--color-text-primary)]">Task</h1>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Manage administrative system tasks, user assignments, and access control
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-2xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          className="w-full rounded-2xl neu-input py-2.5 pl-10 pr-4 text-xs font-semibold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Task List Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl neu-card">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl neu-card p-12 text-center min-h-[300px]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full neu-circle text-[var(--color-primary)]">
            <CheckSquare className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">No tasks found</h2>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)] max-w-xs">
            {searchQuery ? 'No tasks match your search filter.' : 'No administrative tasks have been created yet.'}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="mt-5 flex items-center gap-2 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Task Table */}
          <div className="hidden md:block rounded-3xl neu-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-[var(--neu-bg)] text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px] border-b border-[var(--color-border-light)]/40">
                  <tr>
                    <th className="px-6 py-4">Task Name</th>
                    <th className="px-6 py-4">Assigned Users</th>
                    <th className="px-6 py-4">Created By</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]/30 text-[var(--color-text-primary)]">
                  {filteredTasks.map((t: AdminTaskItem) => {
                    const count = accessCounts[t.id] || 0;
                    return (
                      <tr key={t.id} className="hover:bg-[var(--color-primary)]/5 transition-colors">
                        <td className="px-6 py-4 font-bold flex items-center gap-3">
                          <CheckSquare className="h-5 w-5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-xs">{t.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-xl neu-pressed px-2.5 py-1 text-[11px] font-bold text-[var(--color-primary)]">
                            <Users className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                            <span>{count} User{count === 1 ? '' : 's'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--color-text-secondary)]">{t.owner_name}</td>
                        <td className="px-6 py-4 text-[var(--color-text-secondary)]">{formatDate(t.created_at)}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openAccessModal(t)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all cursor-pointer"
                            title="Manage Task Access & User Assignments"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Manage Access</span>
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-2 rounded-xl neu-btn text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all cursor-pointer"
                            title="Edit / Rename Task"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete task "${t.name}"?`)) {
                                deleteMutation.mutate(t.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-2 rounded-xl neu-btn text-[var(--color-danger)] hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Task Compact Cards */}
          <div className="block md:hidden space-y-3">
            {filteredTasks.map((t: AdminTaskItem) => {
              const count = accessCounts[t.id] || 0;
              return (
                <div key={t.id} className="rounded-2xl neu-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl neu-pressed text-blue-500">
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <h3 className="font-extrabold text-sm text-[var(--color-text-primary)] truncate">{t.name}</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl neu-pressed px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                      <Users className="h-3 w-3" />
                      <span>{count} User{count === 1 ? '' : 's'}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border-light)]/40 text-[var(--color-text-tertiary)]">
                    <span>Created: {formatDate(t.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => openAccessModal(t)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[var(--color-primary)] cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Manage Access</span>
                    </button>
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 rounded-xl neu-btn text-[var(--color-primary)] cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete task "${t.name}"?`)) {
                          deleteMutation.mutate(t.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-xl neu-btn text-[var(--color-danger)] cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create / Edit Task Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl neu-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-pressed text-[var(--color-primary)]">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5">
                  Task Name
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => {
                    setTaskName(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="e.g. Finance, TripO Leads..."
                  autoFocus
                  className="w-full rounded-2xl neu-input px-4 py-2.5 text-xs font-semibold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                {validationError && (
                  <p className="mt-1.5 text-[11px] font-semibold text-[var(--color-danger)]">
                    {validationError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{editingTask ? 'Saving...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE TASK ACCESS MODAL DIALOG */}
      {accessModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl neu-card p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl neu-pressed text-[var(--color-primary)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                    Manage Access
                  </h3>
                  <p className="text-xs font-bold text-[var(--color-primary)] truncate max-w-xs">
                    Task: {accessModalTask.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAccessModal}
                className="p-1.5 rounded-full neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Assign User Form */}
            <form onSubmit={handleAssignSubmit} className="rounded-2xl neu-card p-4 space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Grant Task Access to User
              </h4>
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  Select User or Enter User ID (UUID)
                </label>

                {/* Dropdown Selection from system users */}
                {adminUsers.length > 0 && (
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      if (assignError) setAssignError('');
                    }}
                    className="w-full rounded-xl neu-input px-3.5 py-2 text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-2"
                  >
                    <option value="">-- Select Existing User --</option>
                    {adminUsers.map((u: AdminUserItem) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username || 'User'} ({u.id})
                      </option>
                    ))}
                  </select>
                )}

                {/* Manual User ID Input */}
                <input
                  type="text"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    if (assignError) setAssignError('');
                  }}
                  placeholder="Or enter User ID (e.g. 12345678-1234-1234-1234-123456789abc)"
                  className="w-full rounded-xl neu-input px-3.5 py-2 text-xs font-mono text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />

                {assignError && (
                  <p className="text-[11px] font-bold text-[var(--color-danger)] pt-1">
                    {assignError}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {assignMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  <span>Allow Access</span>
                </button>
              </div>
            </form>

            {/* Currently Assigned Users List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Assigned Users ({accessList.length})
                </h4>
              </div>

              {loadingAccessList ? (
                <div className="flex h-24 items-center justify-center neu-card rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
                </div>
              ) : accessList.length === 0 ? (
                <div className="p-6 text-center neu-card rounded-2xl">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    No specific user permissions assigned yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {accessList.map((item: TaskAccessItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl neu-card hover:bg-[var(--color-primary)]/5 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                          <span className="text-xs font-extrabold text-[var(--color-text-primary)] truncate">
                            {item.user_name}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[var(--color-text-tertiary)] truncate mt-0.5">
                          ID: {item.user_id}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Revoke task access for user "${item.user_name}" (${item.user_id})?`)) {
                            revokeMutation.mutate({
                              taskId: accessModalTask.id,
                              targetUserId: item.user_id,
                            });
                          }
                        }}
                        disabled={revokeMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl neu-btn text-[11px] font-bold text-[var(--color-danger)] hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                        title="Revoke Task Access"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        <span>Revoke</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={closeAccessModal}
                className="rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
