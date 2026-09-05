import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTripoLeadEntries,
  getTripoLeadRecentEntries,
  getTripoLeadTrashEntries,
  getTripoLeadFolders,
  createTripoLeadFolder,
  deleteTripoLeadFolder,
  addTripoLeadEntry,
  updateTripoLeadEntry,
  softDeleteTripoLeadEntry,
  restoreTripoLeadEntry,
  permanentDeleteTripoLeadEntry,
  TAMIL_NADU_DISTRICTS,
  TRIPO_LEAD_PROFESSIONAL_OPTIONS,
  type TripoLeadEntry,
  type TripoLeadStatus,
  type TripoLeadFolder,
} from '@/services/tripoleadService';
import {
  getTaskFiles,
  getTaskTrashFiles,
  getFiles,
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
import { TripoLeadMobileBottomNav } from './TripoLeadMobileBottomNav';
import { TripoLeadCreateFolderModal } from './TripoLeadCreateFolderModal';
import { TripoLeadEntryModal } from './TripoLeadEntryModal';
import { TripoLeadUpdateModal } from './TripoLeadUpdateModal';
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
  Building2,
  MapPin,
  Navigation,
  ExternalLink,
  Edit2,
  RotateCcw,
  Phone,
  Pencil,
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

  // Filter States (Profession, Status & District)
  const [selectedProfession, setSelectedProfession] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  // Modals
  const [addEntryModalOpen, setAddEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TripoLeadEntry | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TripoLeadEntry | null>(null);

  // Folder states for TripO Home
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [openedFolder, setOpenedFolder] = useState<TripoLeadFolder | null>(null);

  // Files View Mode (Grid vs List)
  const [filesViewMode, setFilesViewMode] = useState<'grid' | 'list'>('grid');

  // File preview & upload
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Queries for TripO Lead entries, folders & files
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['tripoLeadEntries', task.id],
    queryFn: () => getTripoLeadEntries(task.id),
  });

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

  // Filtered Entries Logic (Search + Profession + Status + District combined)
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 1. Search Query filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          entry.hotel_name.toLowerCase().includes(q) ||
          entry.district.toLowerCase().includes(q) ||
          entry.area.toLowerCase().includes(q) ||
          (entry.location_link && entry.location_link.toLowerCase().includes(q)) ||
          (entry.professional && entry.professional.toLowerCase().includes(q)) ||
          (entry.mobile_number && entry.mobile_number.toLowerCase().includes(q)) ||
          (entry.status && entry.status.toLowerCase().includes(q)) ||
          (entry.short_notes && entry.short_notes.toLowerCase().includes(q));

        if (!matchesSearch) return false;
      }

      // 2. Profession Filter
      if (selectedProfession !== 'All') {
        if (!entry.professional || entry.professional !== selectedProfession) return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'All') {
        if (entry.status !== selectedStatus) return false;
      }

      // 4. District Filter
      if (selectedDistrict !== 'All') {
        if (entry.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedProfession, selectedStatus, selectedDistrict]);

  // Mutations for TripO Lead entries
  const addEntryMutation = useMutation({
    mutationFn: (data: { hotel_name: string; district: string; area: string; location_link?: string; professional?: string; mobile_number?: string; state?: string }) =>
      addTripoLeadEntry(task.id, data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      setAddEntryModalOpen(false);
      setEditingEntry(null);
      toast.success('TripO Lead entry created successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create entry');
    },
  });

  const updateEntryDetailsMutation = useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: any }) =>
      updateTripoLeadEntry(task.id, entryId, data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      setAddEntryModalOpen(false);
      setEditingEntry(null);
      toast.success('TripO Lead entry updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update entry');
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (data: { status: TripoLeadStatus; approach_date?: string; short_notes?: string; professional?: string; mobile_number?: string }) =>
      updateTripoLeadEntry(task.id, activeEntry!.id, data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      setUpdateModalOpen(false);
      setActiveEntry(null);
      toast.success('TripO Lead entry updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update entry');
    },
  });

  // Permanent Delete Target State
  const [permDeleteTarget, setPermDeleteTarget] = useState<{
    type: 'entry' | 'file';
    id: string;
    name: string;
    item: any;
  } | null>(null);

  const softDeleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => softDeleteTripoLeadEntry(task.id, entryId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashEntries', task.id] });
      toast.success('Entry moved to TripO Lead Trash');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete entry');
    },
  });

  const restoreEntryMutation = useMutation({
    mutationFn: (entryId: string) => restoreTripoLeadEntry(task.id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashEntries', task.id] });
      toast.success('Entry restored successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to restore entry');
    },
  });

  const permanentDeleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => permanentDeleteTripoLeadEntry(task.id, entryId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadRecentEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashEntries', task.id] });
      toast.success('Entry permanently deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to permanently delete entry');
    },
  });

  const permanentDeleteFileMutation = useMutation({
    mutationFn: (file: FileItem) => permanentDeleteFile(user?.id || '', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFolderFiles', task.id, openedFolder?.id] });
      queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashFiles', task.id] });
      toast.success('File permanently deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to permanently delete file');
    },
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
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* IF NO FOLDER IS OPENED: SHOW TRIPO LEAD HOME */}
              {!openedFolder ? (
                <div className="space-y-6">
                  {/* DESKTOP TOOLBAR (screens >= md) */}
                  <div className="hidden md:flex flex-row items-center justify-between gap-3">
                    <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
                      {/* Search Bar */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search TripO Lead entries..."
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

                      {/* Profession Filter Control */}
                      <div className="relative shrink-0">
                        <select
                          value={selectedProfession}
                          onChange={(e) => setSelectedProfession(e.target.value)}
                          className="rounded-xl neu-pressed px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer"
                          aria-label="Filter by Profession"
                        >
                          <option value="All">Profession: All</option>
                          {TRIPO_LEAD_PROFESSIONAL_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* District Filter Control */}
                      <div className="relative shrink-0">
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="rounded-xl neu-pressed px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer max-w-[180px] truncate"
                          aria-label="Filter by District"
                        >
                          <option value="All">District: All</option>
                          {TAMIL_NADU_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter Control */}
                      <div className="relative shrink-0">
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="rounded-xl neu-pressed px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer"
                          aria-label="Filter by Status"
                        >
                          <option value="All">Status: All</option>
                          <option value="No Response">Status: No Response</option>
                          <option value="Pending">Status: Pending</option>
                          <option value="Complete">Status: Complete</option>
                          <option value="Follow up">Status: Follow up</option>
                        </select>
                      </div>

                      {/* Clear Filters Button */}
                      {(searchQuery || selectedProfession !== 'All' || selectedStatus !== 'All' || selectedDistrict !== 'All') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedProfession('All');
                            setSelectedStatus('All');
                            setSelectedDistrict('All');
                          }}
                          className="px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                          title="Clear all filters"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    {/* Entry Action Button (Replaces Create Folder) */}
                    <button
                      onClick={() => setAddEntryModalOpen(true)}
                      className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 hover:scale-[1.02] transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Entry</span>
                    </button>
                  </div>

                  {/* MOBILE TOOLBAR (screens < md) */}
                  <div className="flex md:hidden flex-col gap-2.5">
                    {/* Row 1: Search Bar + Entry Button */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search TripO Lead..."
                          className="w-full rounded-xl neu-pressed pl-8 pr-7 py-2 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-tertiary)]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setAddEntryModalOpen(true)}
                        className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Entry</span>
                      </button>
                    </div>

                    {/* Row 2: Profession Filter + District Filter + Status Filter */}
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedProfession}
                        onChange={(e) => setSelectedProfession(e.target.value)}
                        className="flex-1 rounded-xl neu-pressed px-2.5 py-2 text-[11px] font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer truncate"
                        aria-label="Filter by Profession"
                      >
                        <option value="All">Profession: All</option>
                        {TRIPO_LEAD_PROFESSIONAL_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="flex-1 rounded-xl neu-pressed px-1.5 py-1.5 text-[10px] font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer truncate max-w-[105px]"
                        aria-label="Filter by District"
                      >
                        <option value="All">District: All</option>
                        {TAMIL_NADU_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="flex-1 rounded-xl neu-pressed px-2.5 py-2 text-[11px] font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer truncate"
                        aria-label="Filter by Status"
                      >
                        <option value="All">Status: All</option>
                        <option value="No Response">Status: No Response</option>
                        <option value="Pending">Status: Pending</option>
                        <option value="Complete">Status: Complete</option>
                        <option value="Follow up">Status: Follow up</option>
                      </select>

                      {(searchQuery || selectedProfession !== 'All' || selectedStatus !== 'All' || selectedDistrict !== 'All') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedProfession('All');
                            setSelectedStatus('All');
                            setSelectedDistrict('All');
                          }}
                          className="px-2 py-2 rounded-xl text-[11px] font-extrabold text-red-500 hover:bg-red-500/10 shrink-0 cursor-pointer"
                          title="Clear filters"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TripO Lead Entries List */}
                  {loadingEntries ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-20 rounded-2xl neu-card animate-pulse" />
                      ))}
                    </div>
                  ) : filteredEntries.length === 0 ? (
                    <EmptyState
                      icon={Building2}
                      title={
                        searchQuery || selectedStatus !== 'All' || selectedDistrict !== 'All'
                          ? 'No matching TripO Lead entries'
                          : 'No TripO Lead entries created yet'
                      }
                      description={
                        searchQuery || selectedStatus !== 'All' || selectedDistrict !== 'All'
                          ? 'Try adjusting your search query or filters.'
                          : 'Click "Entry" to create your first TripO Lead entry.'
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-2xl neu-card p-4 md:p-5 relative group hover:border-[var(--color-primary)]/40 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm md:text-base font-extrabold text-[var(--color-text-primary)] truncate">
                                  {entry.hotel_name}
                                </h3>
                                {entry.professional && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
                                    {entry.professional}
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                    entry.status === 'No Response'
                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                      : entry.status === 'Pending'
                                      ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                      : entry.status === 'Complete'
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                      : entry.status === 'Follow up'
                                      ? 'bg-pink-500/10 text-pink-500 border-pink-500/30'
                                      : 'bg-gray-500/10 text-[var(--color-text-tertiary)] border-gray-500/20'
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      entry.status === 'No Response'
                                        ? 'bg-amber-500'
                                        : entry.status === 'Pending'
                                        ? 'bg-red-500'
                                        : entry.status === 'Complete'
                                        ? 'bg-emerald-500'
                                        : entry.status === 'Follow up'
                                        ? 'bg-pink-500'
                                        : 'bg-gray-400'
                                    }`}
                                  />
                                  {entry.status || 'No Status'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs font-semibold text-[var(--color-text-secondary)] flex-wrap">
                                {entry.state && (
                                  <>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      {entry.state}
                                    </span>
                                    <span>•</span>
                                  </>
                                )}
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                  {entry.district}
                                </span>
                                {entry.area && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Navigation className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                      {entry.area}
                                    </span>
                                  </>
                                )}
                                {entry.mobile_number && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-[var(--color-text-primary)] font-bold">
                                      <Phone className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                      {entry.mobile_number}
                                    </span>
                                  </>
                                )}
                                {entry.approach_date && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
                                      <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                      {entry.approach_date}
                                    </span>
                                  </>
                                )}
                              </div>

                              {entry.short_notes && (
                                <p className="text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-2 bg-[var(--color-surface-secondary)]/50 p-2 rounded-lg border border-[var(--color-border-light)]/20">
                                  <span className="font-bold">Notes:</span> {entry.short_notes}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {entry.location_link && (
                                <a
                                  href={entry.location_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl neu-btn text-emerald-500 hover:text-emerald-600 transition-colors"
                                  title="Open Link"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}

                              <button
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setAddEntryModalOpen(true);
                                }}
                                className="p-2 rounded-xl neu-btn text-[var(--color-text-secondary)] hover:text-indigo-500 transition-colors cursor-pointer"
                                title="Edit Entry Details"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setActiveEntry(entry);
                                  setUpdateModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[var(--color-text-primary)] hover:text-blue-500 flex items-center gap-1.5 cursor-pointer"
                                title="Update Status"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                                <span>Status</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete entry "${entry.hotel_name}"?`)) {
                                    softDeleteEntryMutation.mutate(entry.id);
                                  }
                                }}
                                className="p-2 rounded-xl neu-btn text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete Entry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Folders Display Grid (Preserved if folders exist) */}
                  {tripoLeadFolders.length > 0 && (
                    <div className="pt-4 border-t border-[var(--color-border-light)]/40 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                        TripO Folders
                      </h4>
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
                <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">Deleted items in TripO Lead</p>
                <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">Trash</h1>
              </div>

              {trashFiles.length === 0 && trashEntries.length === 0 ? (
                <EmptyState icon={Trash2} title="Trash is empty" description="Deleted items in TripO Lead will appear here." />
              ) : (
                <div className="space-y-6">
                  {/* Deleted Entries Section */}
                  {trashEntries.length > 0 && (
                    <div className="neu-card rounded-2xl overflow-hidden border border-[var(--color-border-light)]/40">
                      <div className="p-3 bg-[var(--neu-bg)] border-b border-[var(--color-border-light)]/40 font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                        Deleted Entries ({trashEntries.length})
                      </div>
                      <div className="divide-y divide-[var(--color-border-light)]/40">
                        {trashEntries.map((entry) => (
                          <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-primary)]/5 transition-colors">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-[var(--color-text-primary)] truncate">{entry.hotel_name}</h4>
                                {entry.professional && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
                                    {entry.professional}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] font-semibold">
                                {entry.district} &middot; {entry.area} {entry.mobile_number ? `· ${entry.mobile_number}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => restoreEntryMutation.mutate(entry.id)}
                                className="p-2 rounded-xl neu-btn text-[var(--color-text-primary)] hover:text-emerald-500 flex items-center justify-center cursor-pointer transition-colors"
                                title="Restore"
                                aria-label="Restore"
                              >
                                <RotateCcw className="h-4 w-4 text-emerald-500" />
                              </button>
                              <button
                                onClick={() => setPermDeleteTarget({ type: 'entry', id: entry.id, name: entry.hotel_name, item: entry })}
                                className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                                title="Permanent Delete"
                                aria-label="Permanent Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deleted Files Section */}
                  {trashFiles.length > 0 && (
                    <div className="neu-card rounded-2xl overflow-hidden border border-[var(--color-border-light)]/40">
                      <div className="p-3 bg-[var(--neu-bg)] border-b border-[var(--color-border-light)]/40 font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                        Deleted Files ({trashFiles.length})
                      </div>
                      <div className="divide-y divide-[var(--color-border-light)]/40">
                        {trashFiles.map((file) => (
                          <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-primary)]/5 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-9 w-9 neu-circle flex items-center justify-center shrink-0">
                                <FileIcon extension={file.extension} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-[var(--color-text-primary)] truncate block" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                                  {formatBytes(file.size_bytes)} &middot; {formatDate(file.updated_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => restoreFile(file.id).then(() => queryClient.invalidateQueries({ queryKey: ['tripoLeadTrashFiles', task.id] }))}
                                className="p-2 rounded-xl neu-btn text-[var(--color-text-primary)] hover:text-emerald-500 flex items-center justify-center cursor-pointer transition-colors"
                                title="Restore"
                                aria-label="Restore"
                              >
                                <RotateCcw className="h-4 w-4 text-emerald-500" />
                              </button>
                              <button
                                onClick={() => setPermDeleteTarget({ type: 'file', id: file.id, name: file.name, item: file })}
                                className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                                title="Permanent Delete"
                                aria-label="Permanent Delete"
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

      {/* TripO Lead Entry Creation / Edit Modal */}
      <TripoLeadEntryModal
        open={addEntryModalOpen}
        onClose={() => {
          setAddEntryModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={(data) => {
          if (editingEntry) {
            updateEntryDetailsMutation.mutate({ entryId: editingEntry.id, data });
          } else {
            addEntryMutation.mutate(data);
          }
        }}
        initialData={editingEntry}
        isSubmitting={addEntryMutation.isPending || updateEntryDetailsMutation.isPending}
      />

      {/* TripO Lead Entry Status Update Modal */}
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

      {/* Permanent Delete Confirmation Modal */}
      {permDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setPermDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                Permanent Delete Confirmation
              </h3>
              <button
                onClick={() => setPermDeleteTarget(null)}
                className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[var(--color-text-secondary)] font-semibold leading-relaxed">
                Are you sure you want to permanently delete this item?
              </p>
              <div className="p-3 rounded-xl neu-pressed bg-[var(--neu-bg)] border border-red-500/30">
                <span className="text-xs font-extrabold text-[var(--color-text-primary)] break-all">
                  "{permDeleteTarget.name}"
                </span>
              </div>
              <p className="text-[11px] font-bold text-red-500">
                This item will be permanently removed and cannot be recovered.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]/40">
              <button
                type="button"
                onClick={() => setPermDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl neu-btn text-xs font-extrabold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permDeleteTarget.type === 'entry') {
                    permanentDeleteEntryMutation.mutate(permDeleteTarget.id);
                  } else {
                    permanentDeleteFileMutation.mutate(permDeleteTarget.item);
                  }
                  setPermDeleteTarget(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-extrabold text-white shadow-md cursor-pointer transition-colors"
              >
                Permanent Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

