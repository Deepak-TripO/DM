import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFreelanceLeadEntries,
  getFreelanceLeadRecentEntries,
  getFreelanceLeadTrashEntries,
  addFreelanceLeadEntry,
  updateFreelanceLeadEntry,
  softDeleteFreelanceLeadEntry,
  restoreFreelanceLeadEntry,
  permanentDeleteFreelanceLeadEntry,
  TAMIL_NADU_DISTRICTS,
  type FreelanceLeadEntry,
  type FreelanceLeadStatus,
} from '@/services/freelanceleadService';
import {
  getTaskFiles,
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
import { FileIcon } from '@/components/FileIcon';
import { FilePreviewModal } from '@/features/files/preview/FilePreviewModal';
import { UploadDialog } from '@/features/files/UploadDialog';
import { FreelanceLeadSidebar, type FreelanceLeadTab } from './FreelanceLeadSidebar';
import { FreelanceLeadMobileBottomNav } from './FreelanceLeadMobileBottomNav';
import { FreelanceLeadEntryModal } from './FreelanceLeadEntryModal';
import { FreelanceLeadUpdateModal } from './FreelanceLeadUpdateModal';
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
  Star,
  Pencil,
  X,
  Grid3X3,
  List,
  MoreVertical,
  Phone,
  User,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

interface FreelanceLeadViewProps {
  task: TaskItem;
}

export function FreelanceLeadView({ task }: FreelanceLeadViewProps) {
  const { user } = useAuth();
  const { isAdmin: isAdminHook } = useAdmin();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FreelanceLeadTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter States (Status & District)
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  // Files View Mode (Grid vs List)
  const [filesViewMode, setFilesViewMode] = useState<'grid' | 'list'>('grid');

  // Mobile Three-Dot Action Menu Active Entry ID
  const [mobileMenuEntryId, setMobileMenuEntryId] = useState<string | null>(null);

  // Starred Entries State (Persisted locally for Freelance Lead)
  const [starredEntryIds, setStarredEntryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dm_freelancelead_starred_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleStarEntry = (entryId: string) => {
    setStarredEntryIds((prev) => {
      const next = prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId];
      try {
        localStorage.setItem('dm_freelancelead_starred_entries', JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success('Starred status updated');
  };

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<FreelanceLeadEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<FreelanceLeadEntry | null>(null);

  // File preview & upload
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const isUserAdmin = Boolean(isAdminHook || user?.role === 'admin' || user?.email?.toLowerCase() === 'admin@dm.com');

  // Queries for Freelance Lead entries & files
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['freelanceLeadEntries', task.id],
    queryFn: () => getFreelanceLeadEntries(task.id),
  });

  const { data: recentEntries = [], isLoading: loadingRecentEntries } = useQuery({
    queryKey: ['freelanceLeadRecentEntries', task.id],
    queryFn: () => getFreelanceLeadRecentEntries(task.id, 50),
  });

  const { data: trashEntries = [] } = useQuery({
    queryKey: ['freelanceLeadTrashEntries', task.id],
    queryFn: () => getFreelanceLeadTrashEntries(task.id),
  });

  const { data: files = [] } = useQuery({
    queryKey: ['freelanceLeadFiles', task.id],
    queryFn: () => getTaskFiles(task.id),
  });

  const { data: trashFiles = [] } = useQuery({
    queryKey: ['freelanceLeadTrashFiles', task.id],
    queryFn: () => getTaskTrashFiles(task.id),
  });

  // Filtered Entries Logic (Search + Status + District combined)
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
          (entry.status && entry.status.toLowerCase().includes(q)) ||
          (entry.short_notes && entry.short_notes.toLowerCase().includes(q));

        if (!matchesSearch) return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'All') {
        if (entry.status !== selectedStatus) return false;
      }

      // 3. District Filter
      if (selectedDistrict !== 'All') {
        if (entry.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedStatus, selectedDistrict]);

  // Entry Mutations
  const addEntryMutation = useMutation({
    mutationFn: (data: { hotel_name: string; district: string; area: string; location_link?: string; phone_number?: string }) =>
      addFreelanceLeadEntry(task.id, data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadRecentEntries', task.id] });
      setAddModalOpen(false);
      toast.success('Freelance Lead entry created');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create entry');
    },
  });

  const editEntryMutation = useMutation({
    mutationFn: (data: { hotel_name: string; district: string; area: string; location_link?: string; phone_number?: string }) =>
      updateFreelanceLeadEntry(task.id, editingEntry!.id, data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadRecentEntries', task.id] });
      setEditingModalOpen(false);
      setEditingEntry(null);
      toast.success('Freelance Lead entry details updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to edit entry');
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (data: { status: FreelanceLeadStatus; approach_date?: string; short_notes?: string; contact_person?: string }) =>
      updateFreelanceLeadEntry(task.id, activeEntry!.id, data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadRecentEntries', task.id] });
      setUpdateModalOpen(false);
      setActiveEntry(null);
      toast.success('Freelance Lead status updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update entry');
    },
  });

  const softDeleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => softDeleteFreelanceLeadEntry(task.id, entryId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadRecentEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadTrashEntries', task.id] });
      toast.success('Entry moved to Freelance Lead Trash');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete entry');
    },
  });

  const restoreEntryMutation = useMutation({
    mutationFn: (entryId: string) => restoreFreelanceLeadEntry(task.id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadTrashEntries', task.id] });
      toast.success('Entry restored');
    },
  });

  const permanentDeleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => permanentDeleteFreelanceLeadEntry(task.id, entryId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadTrashEntries', task.id] });
      toast.success('Entry permanently deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete entry');
    },
  });

  // File Mutations
  const toggleStarFileMutation = useMutation({
    mutationFn: ({ fileId, starred }: { fileId: string; starred: boolean }) => toggleStarFile(fileId, starred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadFiles', task.id] });
      toast.success('Starred status updated');
    },
  });

  const softDeleteFileMutation = useMutation({
    mutationFn: (fileId: string) => softDeleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadTrashFiles', task.id] });
      toast.success('File moved to Freelance Lead Trash');
    },
    onError: () => {
      toast.error('Failed to delete file');
    },
  });

  const restoreFileMutation = useMutation({
    mutationFn: (fileId: string) => restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadFiles', task.id] });
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadTrashFiles', task.id] });
      toast.success('File restored');
    },
  });

  const permanentDeleteFileMutation = useMutation({
    mutationFn: (file: FileItem) => permanentDeleteFile(user?.id || '', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelanceLeadTrashFiles', task.id] });
      toast.success('File permanently deleted');
    },
  });

  const handleOpenEditModal = (entry: FreelanceLeadEntry) => {
    if (!isUserAdmin) {
      toast.error('Access Denied: Only Administrators can edit Freelance Lead entries.');
      return;
    }
    setEditingEntry(entry);
    setEditingModalOpen(true);
  };

  const handleOpenUpdateModal = (entry: FreelanceLeadEntry) => {
    if (!isUserAdmin) {
      toast.error('Access Denied: Only Administrators can update Freelance Lead entries.');
      return;
    }
    setActiveEntry(entry);
    setUpdateModalOpen(true);
  };

  const starredEntries = entries.filter((e) => starredEntryIds.includes(e.id));
  const starredFiles = files.filter((f) => f.is_starred);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)] relative">
      {/* Freelance Lead Dedicated Desktop Sidebar */}
      <FreelanceLeadSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Container */}
      <div className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <Header onLogoClick={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />

        <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-6">
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* DESKTOP TOOLBAR (md and above) */}
              <div className="hidden md:flex flex-row items-center justify-between gap-3">
                <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Freelance Lead entries by Client Name, District, Area..."
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

                  {/* Status Filter Button */}
                  <div className="relative shrink-0">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="rounded-xl neu-pressed px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer"
                      aria-label="Filter by Status"
                    >
                      <option value="All">Status: All</option>
                      <option value="Pending">Status: Pending</option>
                      <option value="No Response">Status: No Response</option>
                      <option value="Complete">Status: Complete</option>
                    </select>
                  </div>

                  {/* District Filter Button */}
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

                  {/* Clear Filters Button */}
                  {(searchQuery || selectedStatus !== 'All' || selectedDistrict !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
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

                {/* Entry Action */}
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-md shrink-0 hover:scale-[1.02] cursor-pointer"
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
                      placeholder="Search Freelance Lead..."
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
                    onClick={() => setAddModalOpen(true)}
                    className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Entry</span>
                  </button>
                </div>

                {/* Row 2: Status Filter + District Filter in a single row */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="flex-1 rounded-xl neu-pressed px-2.5 py-2 text-[11px] font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer truncate"
                    aria-label="Filter by Status"
                  >
                    <option value="All">Status: All</option>
                    <option value="Pending">Status: Pending</option>
                    <option value="No Response">Status: No Response</option>
                    <option value="Complete">Status: Complete</option>
                  </select>

                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="flex-1 rounded-xl neu-pressed px-2.5 py-2 text-[11px] font-bold text-[var(--color-text-primary)] focus:outline-none bg-[var(--neu-bg)] cursor-pointer truncate"
                    aria-label="Filter by District"
                  >
                    <option value="All">District: All</option>
                    {TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  {(searchQuery || selectedStatus !== 'All' || selectedDistrict !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
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

              {/* Freelance Lead Entries Listing */}
              {loadingEntries ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl neu-card animate-pulse" />
                  ))}
                </div>
              ) : filteredEntries.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title={
                    searchQuery || selectedStatus !== 'All' || selectedDistrict !== 'All'
                      ? 'No matching Freelance Lead entries'
                      : 'No Freelance Lead entries yet'
                  }
                  description={
                    searchQuery || selectedStatus !== 'All' || selectedDistrict !== 'All'
                      ? 'No entries match your search and filter criteria. Try adjusting your filters.'
                      : 'Click the Entry button above to add your first Freelance Lead entry.'
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredEntries.map((entry) => {
                    const hasUpdateInfo = !!(entry.status || entry.approach_date || entry.short_notes || entry.contact_person);
                    const isStarred = starredEntryIds.includes(entry.id);

                    return (
                      <div
                        key={entry.id}
                        className="rounded-2xl neu-pressed p-3.5 md:p-5 space-y-2.5 transition-all hover:bg-[var(--color-surface-secondary)]/50"
                      >
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border-light)]/20 pb-2.5">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs md:text-base font-extrabold text-[var(--color-text-primary)] truncate">
                                {entry.hotel_name}
                              </h4>
                              {entry.status && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-black border ${
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

                            <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-[var(--color-text-secondary)] flex-wrap">
                              <span>District: <strong className="text-[var(--color-text-primary)]">{entry.district}</strong></span>
                              &middot;
                              <span>Area: <strong className="text-[var(--color-text-primary)]">{entry.area}</strong></span>
                              {entry.phone_number && (
                                <>
                                  &middot;
                                  <a
                                    href={`tel:${entry.phone_number}`}
                                    className="text-emerald-500 hover:underline flex items-center gap-1 font-bold"
                                    title="Call Phone Number"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {entry.phone_number}
                                  </a>
                                </>
                              )}
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

                          {/* DESKTOP ACTION CONTROLS (screens >= md) */}
                          <div className="hidden md:flex items-center gap-2 shrink-0 self-center">
                            <button
                              onClick={() => toggleStarEntry(entry.id)}
                              className={`h-8 w-8 neu-circle flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${
                                isStarred ? 'text-amber-500' : 'text-[var(--color-text-tertiary)]'
                              }`}
                              title={isStarred ? 'Unstar Entry' : 'Star Entry'}
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>

                            {isUserAdmin && (
                              <button
                                onClick={() => handleOpenEditModal(entry)}
                                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-extrabold text-[var(--color-text-primary)] flex items-center gap-1.5 shadow-xs hover:scale-[1.02] cursor-pointer"
                                title="Edit Entry Details"
                              >
                                <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                Edit
                              </button>
                            )}

                            {isUserAdmin && (
                              <button
                                onClick={() => handleOpenUpdateModal(entry)}
                                className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-sm hover:scale-[1.02] cursor-pointer"
                                title="Update Status & Notes"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Update
                              </button>
                            )}

                            {isUserAdmin && (
                              <button
                                onClick={() => softDeleteEntryMutation.mutate(entry.id)}
                                className="h-8 w-8 neu-circle text-red-500 hover:scale-105 cursor-pointer flex items-center justify-center"
                                title="Delete Entry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* MOBILE ACTION CONTROLS (screens < md) — Star button + Three-Dot (⋮) Menu */}
                          <div className="flex md:hidden items-center gap-1.5 shrink-0 relative">
                            <button
                              onClick={() => toggleStarEntry(entry.id)}
                              className={`h-7 w-7 neu-circle flex items-center justify-center cursor-pointer ${
                                isStarred ? 'text-amber-500' : 'text-[var(--color-text-tertiary)]'
                              }`}
                              title={isStarred ? 'Unstar Entry' : 'Star Entry'}
                            >
                              <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>

                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMobileMenuEntryId((prev) => (prev === entry.id ? null : entry.id));
                                }}
                                className="h-7 w-7 neu-circle flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                                title="Actions menu"
                                aria-label="Actions menu"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Three-Dot Popover Menu */}
                              {mobileMenuEntryId === entry.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setMobileMenuEntryId(null)}
                                  />
                                  <div className="absolute right-0 top-8 z-40 w-36 rounded-2xl neu-modal p-1.5 shadow-2xl border border-[var(--color-border-light)]/60 animate-in fade-in zoom-in-95 duration-150">
                                    {isUserAdmin ? (
                                      <div className="space-y-0.5">
                                        <button
                                          onClick={() => {
                                            setMobileMenuEntryId(null);
                                            handleOpenEditModal(entry);
                                          }}
                                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--neu-bg)] transition-colors cursor-pointer text-left"
                                        >
                                          <Pencil className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setMobileMenuEntryId(null);
                                            handleOpenUpdateModal(entry);
                                          }}
                                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--neu-bg)] transition-colors cursor-pointer text-left"
                                        >
                                          <Edit2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                          <span>Update</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setMobileMenuEntryId(null);
                                            softDeleteEntryMutation.mutate(entry.id);
                                          }}
                                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="px-3 py-2 text-[11px] font-semibold text-[var(--color-text-tertiary)] text-center">
                                        No admin actions
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Extended Update Info */}
                        {hasUpdateInfo && (
                          <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] md:text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--neu-bg)]/40 p-2.5 rounded-xl border border-[var(--color-border-light)]/30 flex-wrap">
                            {entry.contact_person && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-blue-500" />
                                <span>Contact Person: <strong className="text-[var(--color-text-primary)]">{entry.contact_person}</strong></span>
                              </div>
                            )}

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

          {/* TAB 2: MY FILES */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="hidden md:block text-2xl font-black text-[var(--color-text-primary)]">Freelance Lead Files</h1>
                  <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">Files stored under Freelance Lead</p>
                  <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">My Files</h1>
                </div>

                <div className="flex items-center gap-2">
                  {/* Grid View & List View Mode Toggle Button */}
                  <div className="flex rounded-xl neu-pressed p-1 gap-1">
                    <button
                      onClick={() => setFilesViewMode('grid')}
                      className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                        filesViewMode === 'grid'
                          ? 'neu-active text-[var(--color-primary)] font-bold'
                          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="Grid View"
                      aria-label="Grid view"
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
                      aria-label="List view"
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
                <EmptyState icon={FolderOpen} title="No files in Freelance Lead" description="Upload a file to Freelance Lead to get started." />
              ) : filesViewMode === 'grid' ? (
                /* GRID VIEW (Cards) */
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {files.map((file) => (
                    <div key={file.id} className="rounded-2xl neu-card p-4 relative group">
                      {/* Top Right Actions: Star & Delete */}
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
                          className="text-red-500 hover:text-red-600 cursor-pointer p-0.5"
                          title="Delete File"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>

                      <div onClick={() => setPreviewFile(file)} className="cursor-pointer mb-3 flex h-24 items-center justify-center rounded-xl neu-pressed">
                        <FileIcon extension={file.extension} size="lg" />
                      </div>
                      <p className="truncate text-xs font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-1">{formatBytes(file.size_bytes)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW */
                <div className="rounded-2xl neu-card p-2 space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-light)]/40">
                    <span className="w-8" />
                    <span className="flex-1">Name</span>
                    <span className="hidden w-24 md:block">Size</span>
                    <span className="hidden w-32 md:block">Modified</span>
                    <span className="w-16 text-right">Actions</span>
                  </div>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all neu-pressed"
                    >
                      <div onClick={() => setPreviewFile(file)} className="flex flex-1 items-center gap-3 text-left min-w-0 cursor-pointer">
                        <FileIcon extension={file.extension} size="sm" />
                        <span className="flex-1 truncate text-xs font-extrabold text-[var(--color-text-primary)]">
                          {file.name}
                        </span>
                        <span className="hidden w-24 text-[10px] font-semibold text-[var(--color-text-tertiary)] md:block">{formatBytes(file.size_bytes)}</span>
                        <span className="hidden w-32 text-[10px] font-semibold text-[var(--color-text-tertiary)] md:block">{formatRelativeTime(file.updated_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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
                          className="text-red-500 hover:text-red-600 cursor-pointer flex items-center justify-center h-7 w-7 neu-circle"
                          title="Delete File"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STARRED */}
          {activeTab === 'starred' && (
            <div className="space-y-6">
              <div>
                <h1 className="hidden md:block text-2xl font-black text-[var(--color-text-primary)]">
                  Freelance Lead Starred
                </h1>
                <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                  Starred entries and files in Freelance Lead
                </p>
                <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">
                  Starred
                </h1>
              </div>

              {starredEntries.length === 0 && starredFiles.length === 0 ? (
                <EmptyState icon={Star} title="No starred items in Freelance Lead" description="Star entries or files for quick access." />
              ) : (
                <div className="space-y-6">
                  {starredEntries.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-extrabold text-[var(--color-text-secondary)] uppercase">Starred Entries</h3>
                      {starredEntries.map((entry) => (
                        <div key={entry.id} className="rounded-2xl neu-pressed p-4 md:p-5 space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-border-light)]/20 pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="text-sm md:text-base font-extrabold text-[var(--color-text-primary)]">
                                  {entry.hotel_name}
                                </h4>
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
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleStarEntry(entry.id)}
                                className="h-8 w-8 neu-circle text-amber-500 flex items-center justify-center cursor-pointer"
                                title="Unstar Entry"
                              >
                                <Star className="h-3.5 w-3.5 fill-amber-500" />
                              </button>
                              {isUserAdmin && (
                                <button
                                  onClick={() => handleOpenEditModal(entry)}
                                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-extrabold text-[var(--color-text-primary)] flex items-center gap-1.5 shadow-xs hover:scale-[1.02] cursor-pointer"
                                  title="Edit Entry Details"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                  Edit
                                </button>
                              )}
                              {isUserAdmin && (
                                <button
                                  onClick={() => handleOpenUpdateModal(entry)}
                                  className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-sm hover:scale-[1.02] cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Update
                                </button>
                              )}
                              {isUserAdmin && (
                                <button
                                  onClick={() => softDeleteEntryMutation.mutate(entry.id)}
                                  className="h-8 w-8 neu-circle text-red-500 hover:scale-105 cursor-pointer flex items-center justify-center"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {starredFiles.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-extrabold text-[var(--color-text-secondary)] uppercase">Starred Files</h3>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                        {starredFiles.map((file) => (
                          <div key={file.id} className="rounded-2xl neu-card p-4 relative">
                            <button
                              onClick={() => toggleStarFileMutation.mutate({ fileId: file.id, starred: false })}
                              className="absolute top-3 right-3 text-amber-500 z-10 cursor-pointer"
                              title="Unstar File"
                            >
                              <Star className="h-4 w-4 fill-amber-500" />
                            </button>
                            <div onClick={() => setPreviewFile(file)} className="cursor-pointer mb-3 flex h-24 items-center justify-center rounded-xl neu-pressed">
                              <FileIcon extension={file.extension} size="lg" />
                            </div>
                            <p className="truncate text-xs font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                            <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-1">{formatBytes(file.size_bytes)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECENT */}
          {activeTab === 'recent' && (
            <div className="space-y-6">
              <div>
                <h1 className="hidden md:block text-2xl font-black text-[var(--color-text-primary)]">
                  Freelance Lead Recent
                </h1>
                <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                  Recently added or updated entries inside Freelance Lead
                </p>
                <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">
                  Recent
                </h1>
              </div>

              {loadingRecentEntries ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl neu-card animate-pulse" />
                  ))}
                </div>
              ) : recentEntries.length === 0 ? (
                <EmptyState icon={Clock} title="No recent entries in Freelance Lead" description="Recent entries will appear here." />
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
                      {isUserAdmin && (
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEditModal(entry)} className="h-8 w-8 neu-circle text-[var(--color-text-primary)] cursor-pointer" title="Edit Entry Details">
                            <Pencil className="h-3.5 w-3.5 text-blue-500" />
                          </button>
                          <button onClick={() => handleOpenUpdateModal(entry)} className="h-8 w-8 neu-circle text-blue-500 cursor-pointer" title="Update Status">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TRASH */}
          {activeTab === 'trash' && (
            <div className="space-y-6">
              <div>
                <h1 className="hidden md:block text-2xl font-black text-[var(--color-text-primary)]">
                  Freelance Lead Trash
                </h1>
                <p className="hidden md:block text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                  Deleted entries belonging exclusively to Freelance Lead
                </p>
                <h1 className="block md:hidden text-xl font-black text-[var(--color-text-primary)]">
                  Trash
                </h1>
              </div>

              {trashEntries.length === 0 && trashFiles.length === 0 ? (
                <EmptyState icon={Trash2} title="Freelance Lead Trash is empty" description="Deleted Freelance Lead entries and files will appear here." />
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
                          {isUserAdmin && (
                            <div className="flex gap-2">
                              <button onClick={() => restoreEntryMutation.mutate(entry.id)} className="h-8 w-8 neu-circle text-blue-500 cursor-pointer" title="Restore">
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => permanentDeleteEntryMutation.mutate(entry.id)} className="h-8 w-8 neu-circle text-red-500 cursor-pointer" title="Delete Permanently">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
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
                          {isUserAdmin && (
                            <div className="flex gap-2">
                              <button onClick={() => restoreFileMutation.mutate(file.id)} className="h-8 w-8 neu-circle text-blue-500 cursor-pointer" title="Restore">
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => permanentDeleteFileMutation.mutate(file)} className="h-8 w-8 neu-circle text-red-500 cursor-pointer" title="Delete Permanently">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Dedicated Mobile Bottom Navigation Bar for Freelance Lead */}
      <FreelanceLeadMobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Entry Modal */}
      <FreelanceLeadEntryModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(data) => addEntryMutation.mutate(data)}
        isSubmitting={addEntryMutation.isPending}
      />

      {/* Edit Entry Modal (Admin Only) */}
      {isUserAdmin && (
        <FreelanceLeadEntryModal
          open={editingModalOpen}
          onClose={() => {
            setEditingModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={(data) => editEntryMutation.mutate(data)}
          initialData={editingEntry}
          isSubmitting={editEntryMutation.isPending}
        />
      )}

      {/* Update Status/Date/Notes Modal (Admin Only) */}
      {isUserAdmin && (
        <FreelanceLeadUpdateModal
          open={updateModalOpen}
          onClose={() => {
            setUpdateModalOpen(false);
            setActiveEntry(null);
          }}
          onSave={(data) => updateEntryMutation.mutate(data)}
          entry={activeEntry}
          isSubmitting={updateEntryMutation.isPending}
        />
      )}

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={task.id} />
    </div>
  );
}
