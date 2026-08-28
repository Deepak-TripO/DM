import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTripoLeadRecentEntries,
  getTripoLeadTrashEntries,
  getTripoLeadFolders,
  createTripoLeadFolder,
  deleteTripoLeadFolder,
  type TripoLeadFolder,
} from '@/services/tripoleadService';
import {
  getTaskFiles,
  getTaskTrashFiles,
  getFiles,
  softDeleteFile,
  restoreFile,
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
import { TripoLeadMobileBottomNav } from './TripoLeadMobileBottomNav';
import { TripoLeadCreateFolderModal } from './TripoLeadCreateFolderModal';
import { formatBytes, formatDate } from '@/utils';
import {
  Search,
  Plus,
  Trash2,
  FolderOpen,
  FolderPlus,
  Folder,
  ArrowLeft,
  Calendar,
  FileText,
  Star,
  X,
  Grid3X3,
  List,
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
  const [searchQuery, setSearchQuery] = useState('');

  // Folder states for TripO Home
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [openedFolder, setOpenedFolder] = useState<TripoLeadFolder | null>(null);

  // Files View Mode (Grid vs List)
  const [filesViewMode, setFilesViewMode] = useState<'grid' | 'list'>('grid');

  // File preview & upload
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Queries for folders & files
  const { data: tripoLeadFolders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['tripoLeadFolders', task.id, searchQuery],
    queryFn: () => getTripoLeadFolders(task.id, searchQuery),
  });

  const { data: folderFiles = [], isLoading: loadingFolderFiles } = useQuery({
    queryKey: ['tripoLeadFolderFiles', task.id, openedFolder?.id, searchQuery],
    queryFn: () => getFiles(user?.id || '', openedFolder?.id || null, { search: searchQuery }),
    enabled: !!openedFolder,
  });

  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['tripoLeadFiles', task.id],
    queryFn: () => getTaskFiles(task.id),
  });

  const { data: trashFiles = [] } = useQuery({
    queryKey: ['tripoLeadTrashFiles', task.id],
    queryFn: () => getTaskTrashFiles(task.id),
  });

  const { data: recentEntries = [] } = useQuery({
    queryKey: ['tripoLeadRecentEntries', task.id],
    queryFn: () => getTripoLeadRecentEntries(task.id, 50),
  });

  const { data: trashEntries = [] } = useQuery({
    queryKey: ['tripoLeadTrashEntries', task.id],
    queryFn: () => getTripoLeadTrashEntries(task.id),
  });

  // Create Folder Mutation
  const createFolderMutation = useMutation({
    mutationFn: (folderName: string) => createTripoLeadFolder(task.id, folderName, user?.id),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFolders', task.id] });
      setCreateFolderModalOpen(false);
      toast.success(`Folder "${newFolder.name}" created successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create folder');
    },
  });

  // Delete Folder Mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => deleteTripoLeadFolder(task.id, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFolders', task.id] });
      toast.success('Folder deleted');
    },
  });

  // File Star Toggle Mutation
  const toggleStarFileMutation = useMutation({
    mutationFn: ({ fileId, starred }: { fileId: string; starred: boolean }) =>
      toggleStarFile(fileId, starred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFolderFiles', task.id, openedFolder?.id] });
      toast.success('Starred status updated');
    },
  });

  // File Soft Delete Mutation
  const softDeleteFileMutation = useMutation({
    mutationFn: (fileId: string) => softDeleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFolderFiles', task.id, openedFolder?.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashFiles', task.id] });
      toast.success('File moved to trash');
    },
  });

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)] relative">
      {/* TripO Lead Dedicated Desktop Sidebar */}
      <TripoLeadSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setOpenedFolder(null);
        }}
      />

      {/* Main Container */}
      <div className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <Header onLogoClick={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />

        <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-6">
          {/* TAB 1: HOME (Folders Management) */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* IF NO FOLDER IS OPENED: SHOW FOLDERS LIST */}
              {!openedFolder ? (
                <div className="space-y-6">
                  {/* Top Bar: Search & Create Folder Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search TripO folders..."
                        className="w-full rounded-xl neu-pressed pl-10 pr-8 py-2.5 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                          title="Clear search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setCreateFolderModalOpen(true)}
                      className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 hover:scale-[1.02] transition-transform"
                    >
                      <FolderPlus className="h-4 w-4" />
                      <span>Create Folder</span>
                    </button>
                  </div>

                  {/* Folders Display Grid */}
                  {loadingFolders ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                      {[1, 2, 3, 4].map((n) => (
                        <FileCardSkeleton key={n} />
                      ))}
                    </div>
                  ) : tripoLeadFolders.length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title="No folders created yet"
                      description="Click 'Create Folder' to organize your TripO files."
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                      {tripoLeadFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => setOpenedFolder(folder)}
                          className="rounded-2xl neu-card p-4 relative group cursor-pointer hover:border-[var(--color-primary)]/40 transition-all hover:scale-[1.02]"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete folder "${folder.name}"?`)) {
                                deleteFolderMutation.mutate(folder.id);
                              }
                            }}
                            className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-tertiary)] hover:text-red-500 p-1"
                            title="Delete Folder"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="flex flex-col items-center text-center space-y-3 py-2">
                            <div className="h-14 w-14 rounded-2xl neu-circle flex items-center justify-center text-amber-500 bg-amber-500/10">
                              <Folder className="h-7 w-7 fill-amber-500/20" />
                            </div>
                            <div className="w-full">
                              <h4 className="text-xs md:text-sm font-extrabold text-[var(--color-text-primary)] truncate">
                                {folder.name}
                              </h4>
                              <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-1">
                                {formatDate(folder.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* IF A FOLDER IS OPENED: SHOW FOLDER DETAILS & FILE UPLOAD */
                <div className="space-y-6">
                  {/* Folder Breadcrumb / Header */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[var(--color-border-light)]/40 pb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setOpenedFolder(null)}
                        className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Folders</span>
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <Folder className="h-5 w-5 text-amber-500" />
                          <h1 className="text-lg md:text-xl font-black text-[var(--color-text-primary)]">
                            {openedFolder.name}
                          </h1>
                        </div>
                        <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-0.5">
                          Files inside {openedFolder.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Grid/List View Toggle */}
                      <div className="flex rounded-xl neu-pressed p-1 gap-1">
                        <button
                          onClick={() => setFilesViewMode('grid')}
                          className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                            filesViewMode === 'grid'
                              ? 'neu-active text-[var(--color-primary)] font-bold'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                          }`}
                          title="Grid View"
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setFilesViewMode('list')}
                          className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                            filesViewMode === 'list'
                              ? 'neu-active text-[var(--color-primary)] font-bold'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                          }`}
                          title="List View"
                        >
                          <List className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => setUploadOpen(true)}
                        className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 cursor-pointer shadow-md shrink-0 hover:scale-[1.02] transition-transform"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  </div>

                  {/* Search inside folder */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search files in ${openedFolder.name}...`}
                      className="w-full rounded-xl neu-pressed pl-10 pr-8 py-2.5 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Folder Files List */}
                  {loadingFolderFiles ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                      {[1, 2, 3, 4].map((n) => (
                        <FileCardSkeleton key={n} />
                      ))}
                    </div>
                  ) : folderFiles.length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title={`No files in ${openedFolder.name}`}
                      description="Click 'Upload File' to add files to this folder."
                    />
                  ) : filesViewMode === 'grid' ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                      {folderFiles.map((file) => (
                        <div key={file.id} className="rounded-2xl neu-card p-4 relative group">
                          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                            <button
                              onClick={() => toggleStarFileMutation.mutate({ fileId: file.id, starred: !file.is_starred })}
                              className={`cursor-pointer ${
                                file.is_starred ? 'text-amber-500' : 'text-[var(--color-text-tertiary)] hover:text-amber-500'
                              }`}
                              title={file.is_starred ? 'Unstar File' : 'Star File'}
                            >
                              <Star className={`h-4 w-4 ${file.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>
                            <button
                              onClick={() => softDeleteFileMutation.mutate(file.id)}
                              className="text-[var(--color-text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete File"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div onClick={() => setPreviewFile(file)} className="cursor-pointer space-y-3">
                            <div className="h-24 w-full neu-pressed rounded-xl flex items-center justify-center overflow-hidden">
                              <FileIcon extension={file.extension} />
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-[var(--color-text-primary)] truncate" title={file.name}>
                                {file.name}
                              </h4>
                              <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                                {formatBytes(file.size_bytes)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="neu-card rounded-2xl overflow-hidden border border-[var(--color-border-light)]/40">
                      <div className="divide-y divide-[var(--color-border-light)]/40">
                        {folderFiles.map((file) => (
                          <div key={file.id} className="p-3 md:p-4 flex items-center justify-between gap-3 hover:bg-[var(--color-primary)]/5 transition-colors">
                            <div onClick={() => setPreviewFile(file)} className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                              <div className="h-10 w-10 neu-circle flex items-center justify-center shrink-0">
                                <FileIcon extension={file.extension} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs md:text-sm font-bold text-[var(--color-text-primary)] truncate">{file.name}</h4>
                                <div className="flex items-center gap-3 text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                                  <span>{formatBytes(file.size_bytes)}</span>
                                  <span>•</span>
                                  <span>{formatDate(file.created_at)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleStarFileMutation.mutate({ fileId: file.id, starred: !file.is_starred })}
                                className={`cursor-pointer ${file.is_starred ? 'text-amber-500' : 'text-[var(--color-text-tertiary)] hover:text-amber-500'}`}
                              >
                                <Star className={`h-4 w-4 ${file.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                              </button>
                              <button
                                onClick={() => softDeleteFileMutation.mutate(file.id)}
                                className="text-[var(--color-text-tertiary)] hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY FILES */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="hidden md:block text-2xl font-black text-[var(--color-text-primary)]">TripO Lead Files</h1>
                  <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">Files stored under TripO Lead</p>
                  <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">My Files</h1>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl neu-pressed p-1 gap-1">
                    <button
                      onClick={() => setFilesViewMode('grid')}
                      className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                        filesViewMode === 'grid' ? 'neu-active text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="Grid View"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setFilesViewMode('list')}
                      className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                        filesViewMode === 'list' ? 'neu-active text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setUploadOpen(true)}
                    className="neu-btn-primary px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 md:gap-2 cursor-pointer shadow-md shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>

              {files.length === 0 ? (
                <EmptyState icon={FolderOpen} title="No files in TripO Lead" description="Upload a file to TripO Lead to get started." />
              ) : filesViewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {files.map((file) => (
                    <div key={file.id} className="rounded-2xl neu-card p-4 relative group">
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          onClick={() => toggleStarFileMutation.mutate({ fileId: file.id, starred: !file.is_starred })}
                          className={`cursor-pointer ${file.is_starred ? 'text-amber-500' : 'text-[var(--color-text-tertiary)] hover:text-amber-500'}`}
                          title={file.is_starred ? 'Unstar File' : 'Star File'}
                        >
                          <Star className={`h-4 w-4 ${file.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => softDeleteFileMutation.mutate(file.id)}
                          className="text-[var(--color-text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div onClick={() => setPreviewFile(file)} className="cursor-pointer space-y-3">
                        <div className="h-24 w-full neu-pressed rounded-xl flex items-center justify-center overflow-hidden">
                          <FileIcon extension={file.extension} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--color-text-primary)] truncate" title={file.name}>
                            {file.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                            {formatBytes(file.size_bytes)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="neu-card rounded-2xl overflow-hidden border border-[var(--color-border-light)]/40">
                  <div className="divide-y divide-[var(--color-border-light)]/40">
                    {files.map((file) => (
                      <div key={file.id} className="p-3 md:p-4 flex items-center justify-between gap-3 hover:bg-[var(--color-primary)]/5 transition-colors">
                        <div onClick={() => setPreviewFile(file)} className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                          <div className="h-10 w-10 neu-circle flex items-center justify-center shrink-0">
                            <FileIcon extension={file.extension} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs md:text-sm font-bold text-[var(--color-text-primary)] truncate">{file.name}</h4>
                            <div className="flex items-center gap-3 text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                              <span>{formatBytes(file.size_bytes)}</span>
                              <span>•</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStarFileMutation.mutate({ fileId: file.id, starred: !file.is_starred })}
                            className={`cursor-pointer ${file.is_starred ? 'text-amber-500' : 'text-[var(--color-text-tertiary)] hover:text-amber-500'}`}
                          >
                            <Star className={`h-4 w-4 ${file.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => softDeleteFileMutation.mutate(file.id)}
                            className="text-[var(--color-text-tertiary)] hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECENT */}
          {activeTab === 'recent' && (
            <div className="space-y-6">
              <div>
                <h1 className="hidden md:block text-2xl font-black text-[var(--color-text-primary)]">TripO Lead Recent</h1>
                <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">Recent activity and entries</p>
                <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">Recent</h1>
              </div>

              {recentEntries.length === 0 ? (
                <EmptyState icon={Calendar} title="No recent activity" description="Activity will appear here as entries are added." />
              ) : (
                <div className="neu-card rounded-2xl overflow-hidden border border-[var(--color-border-light)]/40">
                  <div className="divide-y divide-[var(--color-border-light)]/40">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[var(--color-text-primary)] truncate">{entry.hotel_name}</h4>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{entry.district} • {entry.area}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">{formatDate(entry.updated_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRASH */}
          {activeTab === 'trash' && (
            <div className="space-y-6">
              <div>
                <h1 className="hidden md:block text-2xl font-black text-[var(--color-text-primary)]">TripO Lead Trash</h1>
                <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">Deleted files in TripO Lead</p>
                <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">Trash</h1>
              </div>

              {trashFiles.length === 0 && trashEntries.length === 0 ? (
                <EmptyState icon={Trash2} title="Trash is empty" description="Deleted items in TripO Lead will appear here." />
              ) : (
                <div className="space-y-6">
                  {trashFiles.length > 0 && (
                    <div className="neu-card rounded-2xl overflow-hidden border border-[var(--color-border-light)]/40">
                      <div className="p-3 bg-[var(--neu-bg)] border-b border-[var(--color-border-light)]/40 font-bold text-xs">Deleted Files</div>
                      <div className="divide-y divide-[var(--color-border-light)]/40">
                        {trashFiles.map((file) => (
                          <div key={file.id} className="p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FileText className="h-5 w-5 text-red-400" />
                              <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">{file.name}</span>
                            </div>
                            <button
                              onClick={() => restoreFile(file.id).then(() => queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashFiles', task.id] }))}
                              className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* TripO Lead Mobile Bottom Navigation */}
      <TripoLeadMobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setOpenedFolder(null);
        }}
      />

      {/* Create Folder Modal */}
      <TripoLeadCreateFolderModal
        open={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        onSave={(name) => createFolderMutation.mutate(name)}
        isSubmitting={createFolderMutation.isPending}
      />

      {/* File Upload Modal */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: ['tripoLeadFolderFiles', task.id, openedFolder?.id] });
          queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
        }}
        folderId={openedFolder ? openedFolder.id : null}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
