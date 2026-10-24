import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMidFinanceProjects,
  createMidFinanceProject,
  deleteMidFinanceProject,
  type MidFinanceProject,
} from '@/services/midFinanceProjectService';
import { formatDate } from '@/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  FolderPlus,
  Plus,
  Search,
  Trash2,
  FolderKanban,
  Upload,
  X,
  Loader2,
  ArrowRight,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface MidFinanceProjectsViewProps {
  taskId?: string;
  onOpenProject: (project: MidFinanceProject) => void;
}

export function MidFinanceProjectsView({
  taskId,
  onOpenProject,
}: MidFinanceProjectsViewProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<MidFinanceProject | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | undefined>(undefined);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Query Project Folders
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['midFinanceProjects', taskId, searchQuery],
    queryFn: () => getMidFinanceProjects(taskId, searchQuery),
  });

  // Create Project Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      createMidFinanceProject({
        company_name: companyName,
        project_name: projectName,
        company_logo: companyLogo,
        task_id: taskId,
      }),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceProjects'] });
      setCreateModalOpen(false);
      resetForm();
      toast.success(`Project "${newProject.project_name}" created successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create project folder');
    },
  });

  // Delete Project Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMidFinanceProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceProjects'] });
      setDeletingProject(null);
      toast.success('Project folder deleted successfully');
    },
    onError: () => toast.error('Failed to delete project folder'),
  });

  const resetForm = () => {
    setCompanyName('');
    setProjectName('');
    setCompanyLogo(undefined);
    setLogoPreview(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCompanyLogo(result);
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }
    if (!projectName.trim()) {
      toast.error('Project Name is required');
      return;
    }
    createMutation.mutate();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
            Projects
          </h1>
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-0.5">
            Manage project folders, financial details, payment schedules & invoices
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.02] transition-all cursor-pointer"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Create Project Folder</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by company or project name..."
          className="w-full rounded-xl neu-input py-2 pl-9 pr-3 text-xs font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
        />
      </div>

      {/* Projects Grid / List */}
      {isLoading ? (
        <div className="flex h-48 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-3xl neu-card p-12 text-center flex flex-col items-center justify-center min-h-[280px]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl neu-circle text-[var(--color-primary)]">
            <FolderKanban className="h-8 w-8 text-[#8B5CF6]" />
          </div>
          <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
            No project folders yet
          </h3>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)] max-w-md">
            Create your first project folder to track total project amounts, payment schedules, documents, invoices, and expenses.
          </p>
          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="mt-5 flex items-center gap-1.5 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Project Folder</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenProject(project)}
              className="group relative flex flex-col justify-between rounded-3xl neu-card p-5 text-left transition-all hover:scale-[1.01] hover:neu-pressed cursor-pointer border border-transparent hover:border-[#8B5CF6]/30 shadow-md"
            >
              {/* Card Top: Logo & Delete Action */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  {project.company_logo ? (
                    <img
                      src={project.company_logo}
                      alt={project.company_name}
                      className="h-12 w-12 rounded-2xl object-cover neu-flat border border-[var(--color-border-light)]/40 p-1 bg-white shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl neu-circle bg-[#F3E8FF] text-[#8B5CF6] font-black text-sm shrink-0">
                      {project.company_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider truncate">
                      {project.company_name}
                    </p>
                    <h3 className="truncate text-base font-black text-[var(--color-text-primary)]">
                      {project.project_name}
                    </h3>
                  </div>
                </div>

                {/* Delete button (stop click propagation) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingProject(project);
                  }}
                  className="rounded-xl p-2 neu-btn text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Delete project folder"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Card Middle: Financial Preview & Date */}
              <div className="space-y-2 py-2 border-t border-[var(--color-border-light)]/40">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
                  <span>Project Amount</span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]">
                    {formatCurrency(project.total_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                  <span>Created</span>
                  <span>{formatDate(project.created_at)}</span>
                </div>
              </div>

              {/* Card Bottom: Open Folder Link */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-light)]/40 text-xs font-bold text-[#8B5CF6]">
                <span>Open Project Folder</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Folder Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => !createMutation.isPending && setCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-[#8B5CF6]">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                  Create Project Folder
                </h3>
              </div>
              {!createMutation.isPending && (
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">
              {/* Company Name */}
              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  required
                  autoFocus
                  className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Mobile App Redesign"
                  required
                  className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>

              {/* Company Logo Upload & Preview */}
              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Company Logo (Optional)
                </label>
                {logoPreview ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl neu-pressed">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-12 w-12 rounded-xl object-contain bg-white p-1 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-[var(--color-text-primary)]">Logo uploaded</p>
                      <label className="text-[11px] font-bold text-[#8B5CF6] hover:underline cursor-pointer">
                        Change logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyLogo(undefined);
                        setLogoPreview(null);
                      }}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                      title="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl neu-pressed border-2 border-dashed border-[var(--color-border-light)]/60 cursor-pointer hover:border-[#8B5CF6]/50 transition-colors">
                    <Upload className="h-6 w-6 text-[#8B5CF6] mb-1.5" />
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      Click to upload company logo
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                      PNG, JPG, SVG or WebP (max 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !companyName.trim() || !projectName.trim()}
                  className="flex-1 rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => deletingProject && deleteMutation.mutate(deletingProject.id)}
        title="Delete project folder?"
        description={`Are you sure you want to delete "${deletingProject?.project_name}" (${deletingProject?.company_name})? All payment schedules, uploaded documents, invoices, and expenses for this project will be permanently removed.`}
        confirmLabel="Delete Project"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
