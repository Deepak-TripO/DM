import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { getAdminTasks, createAdminTask, deleteAdminTask } from '@/services/adminService';
import type { AdminTaskItem } from '@/services/adminService';
import { formatDate } from '@/utils';
import { CheckSquare, Plus, Search, Trash2, Loader2, X, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['adminTasks'],
    queryFn: getAdminTasks,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createAdminTask(user!.id, name),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['adminTasks'] });
      toast.success(`Task "${newTask.name}" created successfully`);
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Unable to create task. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTasks'] });
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Unable to delete task. Permission denied.');
    },
  });

  const openCreateModal = () => {
    setTaskName('');
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTaskName('');
    setValidationError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = taskName.trim();
    
    // 1. Empty check
    if (!trimmed) {
      setValidationError('Task name cannot be empty');
      return;
    }

    // 2. Invalid character check
    const invalidCharsRegex = /[\\/:*?"<>|]/;
    if (invalidCharsRegex.test(trimmed)) {
      setValidationError('Task name contains invalid characters (\\ / : * ? " < > |)');
      return;
    }

    // 3. Duplicate check
    const duplicate = tasks.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setValidationError('A task with this name already exists');
      return;
    }

    if (!user) {
      toast.error('Authentication required');
      return;
    }

    createMutation.mutate(trimmed);
  };

  const filteredTasks = tasks.filter((t) =>
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
              Manage administrative system tasks and organization
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-2xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all"
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
              className="mt-5 flex items-center gap-2 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-3xl neu-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-[var(--neu-bg)] text-[var(--color-text-tertiary)] uppercase tracking-wider text-[10px] border-b border-[var(--color-border-light)]/40">
                <tr>
                  <th className="px-6 py-4">Task Name</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Storage Path</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]/30 text-[var(--color-text-primary)]">
                {filteredTasks.map((t: AdminTaskItem) => (
                  <tr key={t.id} className="hover:bg-[var(--color-primary)]/5 transition-colors">
                    <td className="px-6 py-4 font-bold flex items-center gap-3">
                      <CheckSquare className="h-5 w-5 text-blue-500 shrink-0" />
                      <span className="truncate max-w-xs">{t.name}</span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{t.owner_name}</td>
                    <td className="px-6 py-4 font-mono text-[10px] text-[var(--color-text-tertiary)] max-w-xs truncate">
                      <span className="inline-flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-blue-400" />
                        {t.storage_path}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">{formatDate(t.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete task "${t.name}"?`)) {
                            deleteMutation.mutate(t.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-xl neu-btn text-[var(--color-danger)] hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl neu-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-pressed text-[var(--color-primary)]">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Create Task</h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
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
                  className="rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Task</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
