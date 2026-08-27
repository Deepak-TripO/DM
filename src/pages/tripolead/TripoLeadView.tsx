import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTaskFiles,
  getTaskRecentFiles,
  getTaskTrashFiles,
  softDeleteFile,
  restoreFile,
  permanentDeleteFile,
  toggleStarFile,
} from '@/services/fileService';
import type { TaskItem } from '@/services/taskService';
import type { FileItem } from '@/types';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { FilePreviewModal } from '@/features/files/preview/FilePreviewModal';
import { UploadDialog } from '@/features/files/UploadDialog';
import { TripoLeadSidebar, type TripoLeadTab } from './TripoLeadSidebar';
import { formatBytes, formatRelativeTime, formatDate } from '@/utils';
import {
  Home,
  Clock,
  Trash2,
  FolderOpen,
  Plus,
  Search,
  Grid3X3,
  List,
  Star,
  CheckSquare,
  HardDrive,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';

interface TripoLeadViewProps {
  task: TaskItem;
}

export function TripoLeadView({ task }: TripoLeadViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TripoLeadTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch TripO Lead Active Files
  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['tripoLeadFiles', task.id, searchQuery],
    queryFn: () =>
      getTaskFiles(task.id, {
        search: searchQuery,
      }),
  });

  // 2. Fetch TripO Lead Recent Files
  const { data: recentFiles = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['tripoLeadRecent', task.id],
    queryFn: () => getTaskRecentFiles(task.id, 50),
  });

  // 3. Fetch TripO Lead Trash Files
  const { data: trashFiles = [], isLoading: loadingTrash } = useQuery({
    queryKey: ['tripoLeadTrash', task.id],
    queryFn: () => getTaskTrashFiles(task.id),
  });

  // Soft delete mutation
  const softDeleteMutation = useMutation({
    mutationFn: (fileId: string) => softDeleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecent', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrash', task.id] });
      toast.success('File moved to TripO Lead Trash');
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (fileId: string) => restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecent', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrash', task.id] });
      toast.success('File restored to TripO Lead');
    },
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: (file: FileItem) => permanentDeleteFile(user?.id || '', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrash', task.id] });
      toast.success('File permanently deleted');
    },
  });

  // Star mutation
  const toggleStarMutation = useMutation({
    mutationFn: ({ fileId, starred }: { fileId: string; starred: boolean }) =>
      toggleStarFile(fileId, starred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
    },
  });

  // Compute storage used for TripO Lead task
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)] relative">
      {/* Dedicated TripO Lead Sidebar */}
      <TripoLeadSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <div
        className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ${
          sidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        {/* Header */}
        <Header
          onLogoClick={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Task Banner */}
              <div className="rounded-3xl neu-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 neu-circle text-blue-500 flex items-center justify-center font-bold">
                      <CheckSquare className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full neu-pressed text-blue-500">
                      Task Workspace
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-[var(--color-text-primary)]">
                    {task.name}
                  </h1>
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Dedicated workspace for TripO Lead data, files, and updates
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="flex-1 md:flex-initial neu-btn-primary px-5 py-3 rounded-2xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
                  >
                    <Plus className="h-4 w-4" />
                    Upload File
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl neu-card p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl neu-circle flex items-center justify-center text-blue-500">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase">Total Files</p>
                    <p className="text-lg font-black text-[var(--color-text-primary)]">{files.length}</p>
                  </div>
                </div>

                <div className="rounded-2xl neu-card p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl neu-circle flex items-center justify-center text-purple-500">
                    <HardDrive className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase">Storage Used</p>
                    <p className="text-lg font-black text-[var(--color-text-primary)]">{formatBytes(totalSizeBytes)}</p>
                  </div>
                </div>

                <div className="rounded-2xl neu-card p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl neu-circle flex items-center justify-center text-amber-500">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase">Recent Activity</p>
                    <p className="text-xs font-bold text-[var(--color-text-primary)]">
                      {recentFiles[0] ? formatRelativeTime(recentFiles[0].updated_at) : 'No recent updates'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Files Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                    Recent TripO Lead Files
                  </h3>
                  <button
                    onClick={() => setActiveTab('recent')}
                    className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    View All Recent <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {loadingRecent ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <FileCardSkeleton key={i} />)}
                  </div>
                ) : recentFiles.length === 0 ? (
                  <div className="rounded-2xl neu-card p-8 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">
                    No recent files in TripO Lead
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {recentFiles.slice(0, 4).map((file) => (
                      <div
                        key={file.id}
                        onClick={() => setPreviewFile(file)}
                        className="group cursor-pointer rounded-2xl neu-card p-4 transition-all hover:scale-[1.02]"
                      >
                        <div className="mb-3 flex h-24 items-center justify-center rounded-xl neu-pressed">
                          <FileIcon extension={file.extension} size="lg" />
                        </div>
                        <p className="truncate text-xs font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                          {formatBytes(file.size_bytes)} &middot; {formatRelativeTime(file.updated_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RECENT */}
          {activeTab === 'recent' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-[var(--color-text-primary)]">
                  TripO Lead Recent
                </h1>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                  Recently updated or uploaded items inside TripO Lead
                </p>
              </div>

              {loadingRecent ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => <FileCardSkeleton key={i} />)}
                </div>
              ) : recentFiles.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No recent files in TripO Lead"
                  description="Files uploaded or updated in TripO Lead will appear here."
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {recentFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className="group cursor-pointer rounded-2xl neu-card p-4 transition-all hover:scale-[1.01]"
                    >
                      <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                        <FileIcon extension={file.extension} size="lg" />
                      </div>
                      <p className="truncate text-xs font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                        {formatBytes(file.size_bytes)} &middot; {formatRelativeTime(file.updated_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRASH */}
          {activeTab === 'trash' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-[var(--color-text-primary)]">
                  TripO Lead Trash
                </h1>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                  Deleted files belonging exclusively to TripO Lead
                </p>
              </div>

              {loadingTrash ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, i) => <FileCardSkeleton key={i} />)}
                </div>
              ) : trashFiles.length === 0 ? (
                <EmptyState
                  icon={Trash2}
                  title="TripO Lead Trash is empty"
                  description="Deleted TripO Lead files will be stored here until permanently removed."
                />
              ) : (
                <div className="rounded-2xl neu-card p-2 space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-light)]/40">
                    <span className="flex-1">Name</span>
                    <span className="hidden w-24 md:block">Size</span>
                    <span className="hidden w-32 md:block">Deleted</span>
                    <span className="w-24 text-right">Actions</span>
                  </div>

                  {trashFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all neu-pressed"
                    >
                      <FileIcon extension={file.extension} size="sm" />
                      <span className="flex-1 truncate text-xs font-extrabold text-[var(--color-text-primary)]">
                        {file.name}
                      </span>
                      <span className="hidden w-24 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">
                        {formatBytes(file.size_bytes)}
                      </span>
                      <span className="hidden w-32 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">
                        {file.deleted_at ? formatDate(file.deleted_at) : ''}
                      </span>
                      <div className="flex items-center justify-end gap-2 w-24">
                        <button
                          onClick={() => restoreMutation.mutate(file.id)}
                          className="h-8 w-8 neu-circle text-blue-500 hover:scale-105 cursor-pointer"
                          title="Restore to TripO Lead"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => permanentDeleteMutation.mutate(file)}
                          className="h-8 w-8 neu-circle text-red-500 hover:scale-105 cursor-pointer"
                          title="Permanently Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MY FILES */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-[var(--color-text-primary)]">
                    TripO Lead Files
                  </h1>
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                    All active files stored under TripO Lead
                  </p>
                </div>

                <button
                  onClick={() => setUploadOpen(true)}
                  className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Upload File
                </button>
              </div>

              {/* Toolbar: Search & View toggle */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search TripO Lead files..."
                    className="w-full rounded-xl neu-pressed pl-10 pr-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex rounded-xl neu-pressed p-1 gap-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`rounded-lg p-1.5 transition-all ${
                        viewMode === 'grid'
                          ? 'neu-active text-[var(--color-primary)]'
                          : 'text-[var(--color-text-tertiary)]'
                      }`}
                      aria-label="Grid View"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`rounded-lg p-1.5 transition-all ${
                        viewMode === 'list'
                          ? 'neu-active text-[var(--color-primary)]'
                          : 'text-[var(--color-text-tertiary)]'
                      }`}
                      aria-label="List View"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Files Grid / List */}
              {loadingFiles ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, i) => <FileCardSkeleton key={i} />)}
                </div>
              ) : files.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No files in TripO Lead"
                  description="Upload your first file to TripO Lead to get started."
                />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl neu-card p-4 transition-all hover:scale-[1.01]"
                    >
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                          <FileIcon extension={file.extension} size="lg" />
                        </div>
                        <p className="truncate text-xs font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                          {formatBytes(file.size_bytes)} &middot; {formatRelativeTime(file.updated_at)}
                        </p>
                      </button>

                      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border-light)]/40 pt-2">
                        <button
                          onClick={() =>
                            toggleStarMutation.mutate({
                              fileId: file.id,
                              starred: !file.is_starred,
                            })
                          }
                          className="h-7 w-7 neu-circle flex items-center justify-center cursor-pointer"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              file.is_starred
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-[var(--color-text-tertiary)]'
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => softDeleteMutation.mutate(file.id)}
                          className="h-7 w-7 neu-circle flex items-center justify-center text-red-500 hover:scale-105 cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl neu-card p-2 space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-light)]/40">
                    <span className="flex-1">Name</span>
                    <span className="hidden w-24 md:block">Size</span>
                    <span className="hidden w-32 md:block">Modified</span>
                    <span className="w-16 text-right">Action</span>
                  </div>

                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all neu-pressed"
                    >
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="flex flex-1 items-center gap-3 text-left min-w-0 cursor-pointer"
                      >
                        <FileIcon extension={file.extension} size="sm" />
                        <span className="flex-1 truncate text-xs font-extrabold text-[var(--color-text-primary)]">
                          {file.name}
                        </span>
                        <span className="hidden w-24 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">
                          {formatBytes(file.size_bytes)}
                        </span>
                        <span className="hidden w-32 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">
                          {formatRelativeTime(file.updated_at)}
                        </span>
                      </button>

                      <div className="flex items-center justify-end gap-2 w-16">
                        <button
                          onClick={() => softDeleteMutation.mutate(file.id)}
                          className="h-8 w-8 neu-circle text-red-500 hover:scale-105 cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Upload Dialog configured explicitly with TripO Lead task ID */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={task.id}
      />
    </div>
  );
}
