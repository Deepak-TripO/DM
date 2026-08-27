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
  type TripoLeadStatus,
} from '@/services/tripoleadService';
import { getUserTripoLeadAccessMap } from '@/services/adminService';
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
import { TripoLeadUpdateModal } from './TripoLeadUpdateModal';
import { formatBytes, formatRelativeTime, formatDate } from '@/utils';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RotateCcw,
  Building2,
  Clock,
  FolderOpen,
  Calendar,
  FileText,
  Lock,
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

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TripoLeadEntry | null>(null);

  // File preview & upload
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // User Lock Permission Query
  const { data: tripoLeadAccessMap = {} } = useQuery({
    queryKey: ['userTripoLeadAccessMap'],
    queryFn: getUserTripoLeadAccessMap,
  });

  const isUserAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'admin@dm.com';
  const isEntryLocked = !isUserAdmin && user?.id && tripoLeadAccessMap[user.id] === 'locked';

  // Queries for entries & files
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

  const { data: files = [] } = useQuery({
    queryKey: ['tripoLeadFiles', task.id],
    queryFn: () => getTaskFiles(task.id),
  });

  const { data: trashFiles = [] } = useQuery({
    queryKey: ['tripoLeadTrashFiles', task.id],
    queryFn: () => getTaskTrashFiles(task.id),
  });

  // Entry Mutations
  const addEntryMutation = useMutation({
    mutationFn: (data: { hotel_name: string; district: string; area: string; location_link?: string }) =>
      addTripoLeadEntry(task.id, data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      setAddModalOpen(false);
      toast.success('TripO Lead entry created');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create entry');
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (data: { status: TripoLeadStatus; approach_date?: string; short_notes?: string }) =>
      updateTripoLeadEntry(task.id, activeEntry!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      setUpdateModalOpen(false);
      setActiveEntry(null);
      toast.success('TripO Lead entry updated successfully');
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

  const handleOpenUpdateModal = (entry: TripoLeadEntry) => {
    setActiveEntry(entry);
    setUpdateModalOpen(true);
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
                    placeholder="Search TripO Lead entries by Hotel Name, District, Area, Status..."
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
                  onClick={() => {
                    if (isEntryLocked) {
                      toast.error('Access Denied: Your TripO Lead Entry permission is locked by Administrator.');
                      return;
                    }
                    setAddModalOpen(true);
                  }}
                  disabled={isEntryLocked}
                  title={isEntryLocked ? 'Entry access locked by Administrator' : 'Create new TripO Lead Entry'}
                  className={`px-6 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shrink-0 transition-transform ${
                    isEntryLocked
                      ? 'neu-pressed text-[var(--color-text-tertiary)] opacity-60 cursor-not-allowed'
                      : 'neu-btn-primary text-white hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  {isEntryLocked ? <Lock className="h-4 w-4 text-red-500" /> : <Plus className="h-4 w-4" />}
                  <span>Entry</span>
                  {isEntryLocked && <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">(Locked)</span>}
                </button>
              </div>

              {/* TripO Lead Entries Listing */}
              {loadingEntries ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl neu-card animate-pulse" />
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
                <div className="space-y-3">
                  {entries.map((entry) => {
                    const hasUpdateInfo = !!(entry.status || entry.approach_date || entry.short_notes);

                    return (
                      <div
                        key={entry.id}
                        className="rounded-2xl neu-pressed p-4 md:p-5 space-y-3 transition-all hover:bg-[var(--color-surface-secondary)]/50"
                      >
                        {/* Header Row: Hotel Name, District, Area, Status badge, Update & Delete buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-border-light)]/20 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-sm md:text-base font-extrabold text-[var(--color-text-primary)]">
                                {entry.hotel_name}
                              </h4>
                              {/* Status Badge (ONLY shown after update!) */}
                              {entry.status && (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                                    entry.status === 'Pending'
                                      ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                      : entry.status === 'No Response'
                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      entry.status === 'Pending'
                                        ? 'bg-red-500'
                                        : entry.status === 'No Response'
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                  />
                                  {entry.status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs font-bold text-[var(--color-text-secondary)] flex-wrap">
                              <span>District: <strong className="text-[var(--color-text-primary)]">{entry.district}</strong></span>
                              &middot;
                              <span>Area: <strong className="text-[var(--color-text-primary)]">{entry.area}</strong></span>
                              {entry.location_link && (
                                <>
                                  &middot;
                                  <a
                                    href={entry.location_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline flex items-center gap-1 font-bold"
                                  >
                                    Map <ExternalLink className="h-3 w-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Controls: Update & Delete */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleOpenUpdateModal(entry)}
                              className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-sm hover:scale-[1.02] cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Update
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

                        {/* Extended Update Info: Approach Date & Short Notes (ONLY shown after update!) */}
                        {hasUpdateInfo && (
                          <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--neu-bg)]/40 p-3 rounded-xl border border-[var(--color-border-light)]/30">
                            {entry.approach_date && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-purple-500" />
                                <span>Approach Date: <strong className="text-[var(--color-text-primary)]">{formatDate(entry.approach_date)}</strong></span>
                              </div>
                            )}

                            {entry.short_notes && (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span className="truncate">Notes: <strong className="text-[var(--color-text-primary)]">{entry.short_notes}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-[var(--color-text-primary)]">{entry.hotel_name}</p>
                          {entry.status && (
                            <span className="text-[10px] font-extrabold text-blue-500 px-2 py-0.5 rounded-full neu-pressed">
                              {entry.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">
                          {entry.district} &middot; {entry.area} &middot; {formatRelativeTime(entry.updated_at)}
                        </p>
                      </div>
                      <button onClick={() => handleOpenUpdateModal(entry)} className="h-8 w-8 neu-circle text-blue-500">
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

      {/* Add Entry Modal */}
      <TripoLeadEntryModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(data) => addEntryMutation.mutate(data)}
        isSubmitting={addEntryMutation.isPending}
      />

      {/* Update Entry Modal */}
      <TripoLeadUpdateModal
        open={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setActiveEntry(null);
        }}
        onSave={(data) => updateEntryMutation.mutate(data)}
        entry={activeEntry}
        isSubmitting={updateEntryMutation.isPending}
      />

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={task.id} />
    </div>
  );
}
