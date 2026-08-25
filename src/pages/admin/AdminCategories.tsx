import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categoryService';
import { formatDate } from '@/utils';
import type { CategoryItem, FileCategory } from '@/types';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  FileText,
  Image,
  Video,
  Music,
  FileType,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  FileCode,
  File,
} from 'lucide-react';
import { toast } from 'sonner';

const categoryTypeOptions: { value: FileCategory; label: string; icon: typeof File }[] = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'pdf', label: 'PDF Document', icon: FileType },
  { value: 'spreadsheet', label: 'Spreadsheet', icon: FileSpreadsheet },
  { value: 'presentation', label: 'Presentation', icon: Presentation },
  { value: 'archive', label: 'Archive & ZIP', icon: FileArchive },
  { value: 'code', label: 'Source Code', icon: FileCode },
  { value: 'other', label: 'Other', icon: File },
];

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<FileCategory>('document');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [nameError, setNameError] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast.success('Category created successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; updates: Partial<CategoryItem> }) =>
      updateCategory(vars.id, vars.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast.success('Category updated successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast.success('Category deleted');
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setType('document');
    setStatus('Active');
    setNameError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setStatus(cat.status);
    setNameError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setName('');
    setNameError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Category name cannot be empty');
      return;
    }

    // Check duplicate name
    const duplicate = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editingCategory?.id
    );
    if (duplicate) {
      setNameError('A category with this name already exists');
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        updates: { name: trimmed, type, status },
      });
    } else {
      createMutation.mutate({ name: trimmed, type, status });
    }
  };

  const toggleStatus = (cat: CategoryItem) => {
    const nextStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    updateMutation.mutate({
      id: cat.id,
      updates: { status: nextStatus },
    });
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-[#18AFAF]">
              <FolderTree className="h-5 w-5 text-[#18AFAF]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Category Management</h1>
          </div>
          <p className="hidden md:block mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Manage file classification categories and application taxonomy
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white transition-all shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or type..."
            className="w-full rounded-xl neu-input py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'Active', 'Inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'neu-pressed text-[var(--color-primary)] font-bold'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Table */}
      <div className="neu-table-container">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-semibold text-[var(--color-text-tertiary)] flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">
            No categories found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm neu-table">
              <thead>
                <tr className="border-b border-[var(--color-border-light)] text-xs font-extrabold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]/40">
                {filteredCategories.map((cat) => {
                  const typeOpt = categoryTypeOptions.find((t) => t.value === cat.type);
                  const Icon = typeOpt?.icon || File;

                  return (
                    <tr key={cat.id} className="transition-colors">
                      <td className="px-6 py-4 font-bold text-[var(--color-text-primary)]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
                            <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg neu-badge text-xs font-semibold text-[var(--color-text-secondary)] capitalize">
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                            cat.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                          title="Click to toggle status"
                        >
                          {cat.status === 'Active' ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          <span>{cat.status}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--color-text-tertiary)]">
                        {formatDate(cat.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-all"
                            title="Edit Category"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                deleteMutation.mutate(cat.id);
                              }
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg neu-circle text-[var(--color-danger)] hover:text-red-700 transition-all"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl neu-modal p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
                  <FolderTree className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-full neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g. Legal Documents"
                  className="w-full rounded-xl neu-input py-2.5 px-3.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                  autoFocus
                />
                {nameError && (
                  <p className="mt-1 text-xs font-semibold text-red-500">{nameError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1.5">
                  Category Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FileCategory)}
                  className="w-full rounded-xl neu-input py-2.5 px-3.5 text-sm text-[var(--color-text-primary)] bg-[var(--neu-bg)]"
                >
                  {categoryTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full rounded-xl neu-input py-2.5 px-3.5 text-sm text-[var(--color-text-primary)] bg-[var(--neu-bg)]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>{editingCategory ? 'Save Changes' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
