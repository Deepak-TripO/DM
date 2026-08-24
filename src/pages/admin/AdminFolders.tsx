import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { getAdminFolders, createAdminFolder, deleteAdminFolder } from '@/services/adminService';
import type { AdminFolderItem } from '@/services/adminService';
import { formatDate } from '@/utils';
import { Folder, Plus, Search, Trash2, Loader2, X, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFolders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['adminFolders'],
    queryFn: getAdminFolders,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createAdminFolder(user!.id, name),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: ['adminFolders'] });
      toast.success(`Folder "${newFolder.name}" created successfully`);
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Unable to create folder. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFolders'] });
      toast.success('Folder deleted successfully');
    },
    onError: () => {
      toast.error('Unable to delete folder. Permission denied.');
    },
  });

  const openCreateModal = () => {
    setFolderName('');
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFolderName('');
    setValidationError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    
    // 1. Empty check
    if (!trimmed) {
      setValidationError('Folder name cannot be empty');
      return;
    }

    // 2. Invalid character check
    const invalidCharsRegex = /[\\/:*?"<>|]/;
    if (invalidCharsRegex.test(trimmed)) {
      setValidationError('Folder name contains invalid characters (\\ / : * ? " < > |)');
      return;
    }

    // 3. Duplicate check
    const duplicate = folders.find(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setValidationError('A folder with this name already exists');
      return;
    }

    if (!user) {
      toast.error('Authentication required');
      return;
    }

    createMutation.mutate(trimmed);
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-[#4D94E8]">
              <Folder className="h-5 w-5 text-[#4D94E8]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Folder</h1>
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Manage administrative system folders and directory organization
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white transition-all shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Folder</span>
        </button>
      </div>

      {isLoading ? (
        <div className="neu-card p-12 text-center text-xs font-semibold text-[var(--color-text-tertiary)] flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
          Loading folders...
        </div>
      ) : folders.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl neu-card p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full neu-circle text-[#4D94E8]">
            <Folder className="h-10 w-10 text-[#4D94E8]" />
          </div>
          
          <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">
            No folders created yet
          </h2>
          
          <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)] max-w-sm">
            Folders created by the administrator will appear here.
          </p>

          <button
            onClick={openCreateModal}
            className="mt-6 flex items-center justify-center gap-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Folder</span>
          </button>
        </div>
      ) : (
        /* Folder List Table */
        <div className="space-y-4">
          {/* Search Filter */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search folders..."
              className="w-full rounded-xl neu-input py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>

          <div className="neu-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm neu-table">
                <thead>
                  <tr className="border-b border-[var(--color-border-light)] text-xs font-extrabold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    <th className="px-6 py-4">Folder Name</th>
                    <th className="px-6 py-4">Created By</th>
                    <th className="px-6 py-4">Storage Path</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]/40">
                  {filteredFolders.map((f: AdminFolderItem) => (
                    <tr key={f.id} className="transition-colors">
                      <td className="px-6 py-4 font-bold text-[var(--color-text-primary)]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-[#4D94E8]">
                            <Folder className="h-4 w-4 text-[#4D94E8]" />
                          </div>
                          <span>{f.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--color-text-secondary)]">
                        {f.owner_name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-tertiary)]">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
                          <span className="truncate max-w-xs">{f.storage_path}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--color-text-tertiary)]">
                        {formatDate(f.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Delete folder "${f.name}"?`)) {
                              deleteMutation.mutate(f.id);
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg neu-circle text-[var(--color-danger)] hover:text-red-700 transition-all ml-auto"
                          title="Delete Folder"
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
        </div>
      )}

      {/* Create Folder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl neu-modal p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[#4D94E8]">
                  <Folder className="h-4 w-4 text-[#4D94E8]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Create Folder
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-full neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1.5">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => {
                    setFolderName(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="e.g. Financial Reports"
                  className="w-full rounded-xl neu-input py-2.5 px-3.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                  autoFocus
                />
                {validationError && (
                  <p className="mt-1 text-xs font-semibold text-red-500">{validationError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-light)] mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Create Folder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
