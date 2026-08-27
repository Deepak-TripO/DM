import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTripoLeadEntries,
  getTripoLeadRecentEntries,
  getTripoLeadTrashEntries,
  addTripoLeadEntry,
  updateTripoLeadEntry,
  softDeleteTripoLeadEntry,
  restoreTripoLeadEntry,
  permanentDeleteTripoLeadEntry,
  type TripoLeadEntry,
} from '@/services/tripoleadService';
import {
  getTaskFiles,
  getTaskTrashFiles,
  softDeleteFile,
  restoreFile,
  permanentDeleteFile,
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
import { TripoLeadEntryModal } from './TripoLeadEntryModal';
import { formatBytes, formatRelativeTime, formatDate } from '@/utils';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RotateCcw,
  Building2,
  MapPin,
  Navigation,
  Clock,
  FolderOpen,
  CheckSquare,
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
  
  // Entry modal states
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TripoLeadEntry | null>(null);

  // File modal & upload states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Queries for TripO Lead entries & files
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['tripoLeadEntries', task.id, searchQuery],
    queryFn: () => getTripoLeadEntries(task.id, searchQuery),
  });

  const { data: recentEntries = [], isLoading: loadingRecentEntries } = useQuery({
    queryKey: ['tripoLeadRecentEntries', task.id],
    queryFn: () => getTripoLeadRecentEntries(task.id, 50),
  });

  const { data: trashEntries = [], isLoading: loadingTrashEntries } = useQuery({
    queryKey: ['tripoLeadTrashEntries', task.id],
    queryFn: () => getTripoLeadTrashEntries(task.id),
  });

  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['tripoLeadFiles', task.id],
    queryFn: () => getTaskFiles(task.id),
  });

  const { data: trashFiles = [], isLoading: loadingTrashFiles } = useQuery({
    queryKey: ['tripoLeadTrashFiles', task.id],
    queryFn: () => getTaskTrashFiles(task.id),
  });

  // Entry Mutations
  const addEntryMutation = useMutation({
    mutationFn: (data: { hotel_name: string; district: string; area: string; location_link?: string }) =>
      addTripoLeadEntry(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      setEntryModalOpen(false);
      toast.success('TripO Lead entry created');
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (data: { hotel_name: string; district: string; area: string; location_link?: string }) =>
      updateTripoLeadEntry(task.id, editingEntry!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      setEntryModalOpen(false);
      setEditingEntry(null);
      toast.success('TripO Lead entry updated');
    },
  });

  const softDeleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => softDeleteTripoLeadEntry(task.id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashEntries', task.id] });
      toast.success('Entry moved to TripO Lead Trash');
    },
  });

  const restoreEntryMutation = useMutation({
    mutationFn: (entryId: string) => restoreTripoLeadEntry(task.id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashEntries', task.id] });
      toast.success('Entry restored');
    },
  });

  const permanentDeleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => permanentDeleteTripoLeadEntry(task.id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashEntries', task.id] });
      toast.success('Entry permanently deleted');
    },
  });

  // File Trash Mutations
  const restoreFileMutation = useMutation({
    mutationFn: (fileId: string) => restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashFiles', task.id] });
      toast.success('File restored');
    },
  });

  const permanentDeleteFileMutation = useMutation({
    mutationFn: (file: FileItem) => permanentDeleteFile(user?.id || '', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashFiles', task.id] });
      toast.success('File permanently deleted');
    },
  });

  const softDeleteFileMutation = useMutation({
    mutationFn: (fileId: string) => softDeleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashFiles', task.id] });
      toast.success('File moved to trash');
    },
  });

  const handleSaveEntry = (data: { hotel_name: string; district: string; area: string; location_link?: string }) => {
    if (editingEntry) {
      updateEntryMutation.mutate(data);
    } else {
      addEntryMutation.mutate(data);
    }
  };

  const handleOpenAddEntry = () => {
    setEditingEntry(null);
    setEntryModalOpen(true);
  };

  const handleOpenEditEntry = (entry: TripoLeadEntry) => {
    setEditingEntry(entry);
    setEntryModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)] relative">
      {/* TripO Lead Dedicated Sidebar with DM Logo */}
      <TripoLeadSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Container */}
      <div className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <Header onLogoClick={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />

        <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          {/* TAB 1: HOME (Search Bar + Entry Button + Entries List) */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Search Bar & Entry Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search TripO Lead entries by Hotel Name, District, Area..."
                    className="w-full rounded-xl neu-pressed pl-10 pr-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  onClick={handleOpenAddEntry}
                  className="neu-btn-primary px-6 py-3 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] cursor-pointer shrink-0 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                  Entry
                </button>
              </div>

              {/* TripO Lead Entries Display */}
              {loadingEntries ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl neu-card animate-pulse" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title={searchQuery ? 'No matching TripO Lead entries' : 'No TripO Lead entries yet'}
                  description={
                    searchQuery
                      ? `No entries found for "${searchQuery}". Try a different search term.`
                      : 'Click the Entry button above to add your first hotel entry.'
                  }
                />
              ) : (
                <div className="rounded-2xl neu-card p-2 space-y-1">
                  {/* Table Header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-light)]/40">
                    <span className="flex-1">Hotel Name</span>
                    <span className="w-28 md:w-36 hidden sm:block">District</span>
                    <span className="w-28 md:w-36 hidden md:block">Area</span>
                    <span className="w-28 hidden lg:block">Location</span>
                    <span className="w-24 text-right">Action</span>
                  </div>

                  {/* Entry Rows */}
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all neu-pressed hover:bg-[var(--color-surface-secondary)]/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs md:text-sm font-extrabold text-[var(--color-text-primary)]">
                          {entry.hotel_name}
                        </p>
                        <div className="flex sm:hidden items-center gap-2 text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                          <span>{entry.district}</span> &middot; <span>{entry.area}</span>
                        </div>
                      </div>

                      <div className="w-28 md:w-36 hidden sm:block truncate text-xs font-bold text-[var(--color-text-secondary)]">
                        {entry.district}
                      </div>

                      <div className="w-28 md:w-36 hidden md:block truncate text-xs font-bold text-[var(--color-text-tertiary)]">
                        {entry.area}
                      </div>

                      <div className="w-28 hidden lg:block truncate text-xs font-bold">
                        {entry.location_link ? (
                          <a
                            href={entry.location_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            Map <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[var(--color-text-tertiary)]">&mdash;</span>
                        )}
                      </div>

                      {/* Action buttons: Update & Delete */}
                      <div className="flex items-center justify-end gap-2 w-24">
                        <button
                          onClick={() => handleOpenEditEntry(entry)}
                          className="h-8 w-8 neu-circle text-blue-500 hover:scale-105 cursor-pointer flex items-center justify-center"
                          title="Update Entry"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => softDeleteEntryMutation.mutate(entry.id)}
                          className="h-8 w-8 neu-circle text-red-500 hover:scale-105 cursor-pointer flex items-center justify-center"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  Recently added or updated entries inside TripO Lead
                </p>
              </div>

              {loadingRecentEntries ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl neu-card animate-pulse" />
                  ))}
                </div>
              ) : recentEntries.length === 0 ? (
                <EmptyState icon={Clock} title="No recent entries in TripO Lead" description="Recent entries will appear here." />
              ) : (
                <div className="rounded-2xl neu-card p-2 space-y-1">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-xl px-4 py-3.5 neu-pressed">
                      <div>
                        <p className="text-xs font-extrabold text-[var(--color-text-primary)]">{entry.hotel_name}</p>
                        <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                          {entry.district} &middot; {entry.area} &middot; {formatRelativeTime(entry.updated_at)}
                        </p>
                      </div>
                      <button onClick={() => handleOpenEditEntry(entry)} className="h-8 w-8 neu-circle text-blue-500">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
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
                  Deleted entries belonging exclusively to TripO Lead
                </p>
              </div>

              {trashEntries.length === 0 && trashFiles.length === 0 ? (
                <EmptyState icon={Trash2} title="TripO Lead Trash is empty" description="Deleted TripO Lead entries and files will appear here." />
              ) : (
                <div className="space-y-4">
                  {trashEntries.length > 0 && (
                    <div className="rounded-2xl neu-card p-2 space-y-1">
                      <p className="px-4 py-2 text-xs font-extrabold text-[var(--color-text-secondary)] uppercase">Deleted Entries</p>
                      {trashEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between rounded-xl px-4 py-3 neu-pressed">
                          <div>
                            <p className="text-xs font-extrabold text-[var(--color-text-primary)]">{entry.hotel_name}</p>
                            <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">{entry.district} &middot; {entry.area}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => restoreEntryMutation.mutate(entry.id)} className="h-8 w-8 neu-circle text-blue-500" title="Restore">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => permanentDeleteEntryMutation.mutate(entry.id)} className="h-8 w-8 neu-circle text-red-500" title="Delete Permanently">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {trashFiles.length > 0 && (
                    <div className="rounded-2xl neu-card p-2 space-y-1">
                      <p className="px-4 py-2 text-xs font-extrabold text-[var(--color-text-secondary)] uppercase">Deleted Files</p>
                      {trashFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between rounded-xl px-4 py-3 neu-pressed">
                          <div className="flex items-center gap-3">
                            <FileIcon extension={file.extension} size="sm" />
                            <span className="text-xs font-extrabold text-[var(--color-text-primary)]">{file.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => restoreFileMutation.mutate(file.id)} className="h-8 w-8 neu-circle text-blue-500" title="Restore">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => permanentDeleteFileMutation.mutate(file)} className="h-8 w-8 neu-circle text-red-500" title="Delete Permanently">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MY FILES */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-[var(--color-text-primary)]">TripO Lead Files</h1>
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1">Files stored under TripO Lead</p>
                </div>
                <button onClick={() => setUploadOpen(true)} className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Upload File
                </button>
              </div>

              {files.length === 0 ? (
                <EmptyState icon={FolderOpen} title="No files in TripO Lead" description="Upload a file to TripO Lead to get started." />
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {files.map((file) => (
                    <div key={file.id} className="rounded-2xl neu-card p-4">
                      <div onClick={() => setPreviewFile(file)} className="cursor-pointer mb-3 flex h-24 items-center justify-center rounded-xl neu-pressed">
                        <FileIcon extension={file.extension} size="lg" />
                      </div>
                      <p className="truncate text-xs font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-1">{formatBytes(file.size_bytes)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <TripoLeadEntryModal
        open={entryModalOpen}
        onClose={() => {
          setEntryModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        initialData={editingEntry}
        isSubmitting={addEntryMutation.isPending || updateEntryMutation.isPending}
      />

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={task.id} />
    </div>
  );
}
