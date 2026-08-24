import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFiles, renameFile, toggleStarFile, softDeleteFile, getSignedUrl } from '@/services/fileService';
import { getFolders, createFolder, renameFolder, toggleStarFolder, softDeleteFolder, getFolderBreadcrumbs, getFolderById } from '@/services/folderService';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UploadDialog } from '@/features/files/UploadDialog';
import { ShareDialog } from '@/features/sharing/ShareDialog';
import { FilePreviewModal } from '@/features/files/preview/FilePreviewModal';
import { formatBytes, formatRelativeTime, getFileNameWithoutExtension } from '@/utils';
import {
  FolderPlus, Grid3X3, List, ChevronRight, Folder,
  MoreVertical, Eye, Download, Pencil, Share2, Star, Trash2, StarOff,
  SortAsc, ExternalLink, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FileItem, FolderItem, SortField, SortDirection } from '@/types';

const SORT_OPTIONS = [
  { label: 'Newest', field: 'created_at' as SortField, direction: 'desc' as SortDirection },
  { label: 'Oldest', field: 'created_at' as SortField, direction: 'asc' as SortDirection },
  { label: 'Name A-Z', field: 'name' as SortField, direction: 'asc' as SortDirection },
  { label: 'Name Z-A', field: 'name' as SortField, direction: 'desc' as SortDirection },
  { label: 'Largest', field: 'size_bytes' as SortField, direction: 'desc' as SortDirection },
  { label: 'Smallest', field: 'size_bytes' as SortField, direction: 'asc' as SortDirection },
  { label: 'Type', field: 'extension' as SortField, direction: 'asc' as SortDirection },
];

const FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Images', value: 'image' },
  { label: 'Videos', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Documents', value: 'document' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Spreadsheets', value: 'spreadsheet' },
  { label: 'Presentations', value: 'presentation' },
  { label: 'Archives', value: 'archive' },
];

export default function FilesPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams<{ folderId?: string }>();

  const folderId = routeParams.folderId || searchParams.get('folder') || null;
  const searchQuery = searchParams.get('search') || '';
  const previewFileId = searchParams.get('preview');

  const { data: currentFolder, isLoading: loadingCurrentFolder } = useQuery({
    queryKey: ['currentFolder', user?.id, folderId],
    queryFn: () => getFolderById(folderId!, user!.id),
    enabled: !!user && !!folderId,
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('dm-view-mode') as 'grid' | 'list') || 'grid';
  });
  const [sortIndex, setSortIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeMenu, setActiveMenu] = useState<{ item: FileItem | FolderItem; type: 'file' | 'folder' } | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const sort = SORT_OPTIONS[sortIndex];

  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['files', user?.id, folderId, sort.field, sort.direction, searchQuery, filterCategory],
    queryFn: () => getFiles(user!.id, folderId, {
      sortField: sort.field,
      sortDirection: sort.direction,
      search: searchQuery,
      category: filterCategory,
    }),
    enabled: !!user,
  });

  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['folders', user?.id, folderId],
    queryFn: () => getFolders(user!.id, folderId),
    enabled: !!user,
  });

  const { data: breadcrumbs = [] } = useQuery({
    queryKey: ['breadcrumbs', folderId],
    queryFn: () => getFolderBreadcrumbs(folderId!),
    enabled: !!folderId,
  });

  const previewFile = previewFileId ? files.find((f) => f.id === previewFileId) : null;

  const createFolderMutation = useMutation({
    mutationFn: () => createFolder(user!.id, newFolderName.trim(), folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setCreateFolderOpen(false);
      setNewFolderName('');
      toast.success('Folder created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleView = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('dm-view-mode', mode);
  };

  const openFolder = (id: string) => {
    navigate(`/folders/${id}`);
  };

  const goBackToFolders = () => {
    navigate('/files');
  };

  const openPreview = (fileId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('preview', fileId);
    setSearchParams(params);
  };

  const closePreview = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('preview');
    setSearchParams(params);
  };

  const handleSearch = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleItemAction = async (action: string) => {
    if (!activeMenu) return;
    const { item, type } = activeMenu;
    setActiveMenu(null);

    switch (action) {
      case 'open':
        if (type === 'folder') openFolder(item.id);
        else openPreview(item.id);
        break;

      case 'preview':
        if (type === 'file') openPreview(item.id);
        break;

      case 'download': {
        if (type === 'file') {
          try {
            const url = await getSignedUrl((item as FileItem).storage_path);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name;
            a.click();
          } catch {
            toast.error('Failed to download file');
          }
        }
        break;
      }

      case 'share':
        setShareTarget({ id: item.id, name: item.name, type });
        break;

      case 'rename':
        setRenameItem({
          id: item.id,
          name: type === 'file' ? getFileNameWithoutExtension(item.name) : item.name,
          type,
        });
        break;

      case 'star':
        try {
          if (type === 'file') {
            await toggleStarFile(item.id, !item.is_starred);
            queryClient.invalidateQueries({ queryKey: ['files'] });
          } else {
            await toggleStarFolder(item.id, !item.is_starred);
            queryClient.invalidateQueries({ queryKey: ['folders'] });
          }
          toast.success(item.is_starred ? 'Removed from starred' : 'Added to starred');
        } catch {
          toast.error('Failed to update starred status');
        }
        break;

      case 'delete':
        setDeleteItem({ id: item.id, name: item.name, type });
        break;
    }
  };

  const handleRename = async () => {
    if (!renameItem) return;
    try {
      if (renameItem.type === 'file') {
        const file = files.find((f) => f.id === renameItem.id);
        const ext = file?.extension ? `.${file.extension}` : '';
        await renameFile(renameItem.id, renameItem.name + ext);
      } else {
        await renameFolder(renameItem.id, renameItem.name);
      }
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setRenameItem(null);
      toast.success('Renamed successfully');
    } catch {
      toast.error('Failed to rename');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === 'file') {
        await softDeleteFile(deleteItem.id);
      } else {
        await softDeleteFolder(deleteItem.id);
      }
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setDeleteItem(null);
      toast.success('Moved to trash');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const showContextMenu = (e: React.MouseEvent, item: FileItem | FolderItem, type: 'file' | 'folder') => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu({ item, type });
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const isLoading = loadingFiles || loadingFolders;
  const isEmpty = !isLoading && folders.length === 0 && files.length === 0;

  return (
    <div className="flex flex-col">
      <Header
        title={folderId ? (currentFolder?.name || 'Folder') : 'My Files'}
        onUploadClick={() => setUploadOpen(true)}
        onSearch={handleSearch}
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center gap-3 flex-wrap">
          {folderId && (
            <button
              onClick={goBackToFolders}
              className="flex items-center gap-2 rounded-xl neu-btn px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <ArrowLeft className="h-4 w-4 text-[var(--color-primary)]" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={goBackToFolders}
              className={`rounded-lg neu-btn px-3 py-1.5 text-[var(--color-primary)] ${!folderId ? 'font-extrabold neu-active' : 'font-bold'}`}
            >
              My Files
            </button>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                <button
                  onClick={() => openFolder(crumb.id)}
                  className="rounded-lg neu-btn px-3 py-1.5 text-[var(--color-primary)] font-bold"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setCreateFolderOpen(true)}
              className="flex items-center gap-2 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)]"
            >
              <FolderPlus className="h-4 w-4 text-[var(--color-primary)]" />
              <span className="hidden sm:inline">New Folder</span>
            </button>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterCategory(opt.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    filterCategory === opt.value
                      ? 'neu-active text-[var(--color-primary)] font-extrabold'
                      : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)]"
              >
                <SortAsc className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                {sort.label}
              </button>
              {sortMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-2xl neu-dropdown p-1.5 shadow-xl">
                  {SORT_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => { setSortIndex(i); setSortMenuOpen(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-all ${
                        i === sortIndex ? 'neu-active text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl neu-pressed p-1 gap-1">
              <button
                onClick={() => toggleView('grid')}
                className={`rounded-lg p-1.5 transition-all ${viewMode === 'grid' ? 'neu-active text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleView('list')}
                className={`rounded-lg p-1.5 transition-all ${viewMode === 'list' ? 'neu-active text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {folderId && !loadingCurrentFolder && !currentFolder ? (
          <div className="rounded-3xl neu-card p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full neu-circle text-[var(--color-danger)]">
              <Folder className="h-8 w-8 text-[var(--color-danger)]" />
            </div>
            <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">Folder Not Found or Access Denied</h2>
            <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)] max-w-sm">
              This folder does not exist or you do not have permission to access it.
            </p>
            <button
              onClick={goBackToFolders}
              className="mt-6 flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to My Files</span>
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <FileCardSkeleton key={i} />)}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={Folder}
            title="This folder is empty"
            description="Upload files to this folder to see them here."
            action={
              <div className="flex gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setCreateFolderOpen(true)}
                    className="rounded-xl neu-btn px-4 py-2 text-sm font-bold text-[var(--color-text-primary)]"
                  >
                    New folder
                  </button>
                )}
                <button
                  onClick={() => setUploadOpen(true)}
                  className="rounded-xl neu-btn-primary px-4 py-2 text-sm font-bold text-white shadow-md"
                >
                  Upload file
                </button>
              </div>
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* Folders */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group relative rounded-2xl neu-card p-4 transition-all hover:scale-[1.01]"
              >
                <button
                  onClick={() => openFolder(folder.id)}
                  className="w-full text-left"
                >
                  <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                    <Folder className="h-12 w-12 text-blue-500" />
                  </div>
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{folder.name}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-tertiary)]">{formatRelativeTime(folder.updated_at)}</p>
                </button>
                <button
                  onClick={(e) => showContextMenu(e, folder, 'folder')}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full neu-circle opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Folder actions"
                >
                  <MoreVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>
                {folder.is_starred && (
                  <Star className="absolute left-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" />
                )}
              </div>
            ))}

            {/* Files */}
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-2xl neu-card p-4 transition-all hover:scale-[1.01]"
              >
                <button
                  onClick={() => openPreview(file.id)}
                  className="w-full text-left"
                >
                  <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                    <FileIcon extension={file.extension} size="lg" />
                  </div>
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{file.name}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-tertiary)]">
                    {formatBytes(file.size_bytes)} &middot; {formatRelativeTime(file.updated_at)}
                  </p>
                </button>
                <button
                  onClick={(e) => showContextMenu(e, file, 'file')}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full neu-circle opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="File actions"
                >
                  <MoreVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>
                {file.is_starred && (
                  <Star className="absolute left-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="rounded-2xl neu-card p-2 space-y-1">
            <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-light)]/40">
              <span className="w-8" />
              <span className="flex-1">Name</span>
              <span className="hidden w-24 md:block">Size</span>
              <span className="hidden w-32 md:block">Modified</span>
              <span className="w-8" />
            </div>
            {folders.map((folder) => (
              <div key={folder.id} className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:neu-pressed">
                <button onClick={() => openFolder(folder.id)} className="flex flex-1 items-center gap-3 text-left min-w-0">
                  <Folder className="h-5 w-5 shrink-0 text-blue-500" />
                  <span className="flex-1 truncate text-sm font-bold text-[var(--color-text-primary)]">
                    {folder.is_starred && <Star className="mr-1.5 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    {folder.name}
                  </span>
                  <span className="hidden w-24 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">--</span>
                  <span className="hidden w-32 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">{formatRelativeTime(folder.updated_at)}</span>
                </button>
                <button
                  onClick={(e) => showContextMenu(e, folder, 'folder')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full neu-circle opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Folder actions"
                >
                  <MoreVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>
              </div>
            ))}
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:neu-pressed"
              >
                <button onClick={() => openPreview(file.id)} className="flex flex-1 items-center gap-3 text-left min-w-0">
                  <FileIcon extension={file.extension} size="sm" />
                  <span className="flex-1 truncate text-sm font-bold text-[var(--color-text-primary)]">
                    {file.is_starred && <Star className="mr-1.5 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    {file.name}
                  </span>
                  <span className="hidden w-24 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">{formatBytes(file.size_bytes)}</span>
                  <span className="hidden w-32 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">{formatRelativeTime(file.updated_at)}</span>
                </button>
                <button
                  onClick={(e) => showContextMenu(e, file, 'file')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full neu-circle opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="File actions"
                >
                  <MoreVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {activeMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
          <div
            className="fixed z-50 w-52 rounded-2xl neu-dropdown p-2 shadow-2xl"
            style={{ left: Math.min(menuPos.x, window.innerWidth - 220), top: Math.min(menuPos.y, window.innerHeight - 300) }}
          >
            {(activeMenu.type === 'file'
              ? [
                  { action: 'preview', icon: Eye, label: 'Preview' },
                  { action: 'download', icon: Download, label: 'Download' },
                  { action: 'share', icon: Share2, label: 'Share' },
                  { action: 'rename', icon: Pencil, label: 'Rename' },
                  { action: 'star', icon: activeMenu.item.is_starred ? StarOff : Star, label: activeMenu.item.is_starred ? 'Unstar' : 'Star' },
                  { action: 'delete', icon: Trash2, label: 'Move to trash', danger: true },
                ]
              : isAdmin
              ? [
                  { action: 'open', icon: ExternalLink, label: 'Open' },
                  { action: 'share', icon: Share2, label: 'Share' },
                  { action: 'rename', icon: Pencil, label: 'Rename' },
                  { action: 'star', icon: activeMenu.item.is_starred ? StarOff : Star, label: activeMenu.item.is_starred ? 'Unstar' : 'Star' },
                  { action: 'delete', icon: Trash2, label: 'Move to trash', danger: true },
                ]
              : [
                  { action: 'open', icon: ExternalLink, label: 'Open' },
                ]
            ).map(({ action, icon: Icon, label, danger }: any) => (
              <button
                key={action}
                onClick={() => handleItemAction(action)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  danger ? 'text-[var(--color-danger)] hover:bg-red-500/10' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Create Folder Dialog */}
      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCreateFolderOpen(false)} />
          <div className="relative w-full max-w-sm rounded-3xl neu-modal p-7 shadow-2xl">
            <h3 className="mb-4 text-base font-extrabold text-[var(--color-text-primary)]">New Folder</h3>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              className="mb-5 w-full rounded-xl neu-input px-3.5 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              onKeyDown={(e) => e.key === 'Enter' && newFolderName.trim() && createFolderMutation.mutate()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCreateFolderOpen(false)}
                className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => createFolderMutation.mutate()}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="flex-1 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setRenameItem(null)} />
          <div className="relative w-full max-w-sm rounded-3xl neu-modal p-7 shadow-2xl">
            <h3 className="mb-4 text-base font-extrabold text-[var(--color-text-primary)]">Rename</h3>
            <input
              value={renameItem.name}
              onChange={(e) => setRenameItem({ ...renameItem, name: e.target.value })}
              autoFocus
              className="mb-5 w-full rounded-xl neu-input px-3.5 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <div className="flex gap-3">
              <button onClick={() => setRenameItem(null)} className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)]">Cancel</button>
              <button onClick={handleRename} disabled={!renameItem.name.trim()} className="flex-1 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteItem?.type || 'item'}?`}
        description={`"${deleteItem?.name}" will be moved to Trash.`}
        confirmLabel="Move to Trash"
      />

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={folderId} />

      {/* Share Dialog */}
      {shareTarget && (
        <ShareDialog
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          item={shareTarget}
        />
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={closePreview} />
      )}
    </div>
  );
}
