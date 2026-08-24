import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTrashFiles,
  restoreFile,
  permanentDeleteFile,
} from '@/services/fileService';
import {
  getTrashFolders,
  restoreFolder,
  permanentDeleteFolder,
} from '@/services/folderService';
import {
  getTrashFinanceEntries,
  restoreFinanceEntry,
  permanentDeleteFinanceEntry,
} from '@/services/financeService';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatBytes, formatRelativeTime } from '@/utils';
import { Trash2, RotateCcw, AlertTriangle, Folder, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { useAppLayout } from '@/layouts/AppLayout';
import type { FinanceEntry } from '@/services/financeService';
import type { FileItem, FolderItem } from '@/types';

type DeleteTarget =
  | { type: 'file'; item: FileItem }
  | { type: 'folder'; item: FolderItem }
  | { type: 'finance'; item: FinanceEntry };

export default function TrashPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sidebarOpen, toggleSidebar } = useAppLayout();
  const [deleteItem, setDeleteItem] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);

  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['trashFiles', user?.id],
    queryFn: () => getTrashFiles(user!.id),
    enabled: !!user,
  });

  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['trashFolders', user?.id],
    queryFn: () => getTrashFolders(user!.id),
    enabled: !!user,
  });

  const { data: financeEntries = [], isLoading: loadingFinance } = useQuery({
    queryKey: ['trashFinanceEntries'],
    queryFn: () => getTrashFinanceEntries(),
  });



  const handleRestore = async (id: string, type: 'file' | 'folder' | 'finance') => {
    try {
      if (type === 'file') {
        await restoreFile(id);
      } else if (type === 'folder') {
        await restoreFolder(id);
      } else {
        await restoreFinanceEntry(id);
      }
      queryClient.invalidateQueries({ queryKey: ['trashFiles'] });
      queryClient.invalidateQueries({ queryKey: ['trashFolders'] });
      queryClient.invalidateQueries({ queryKey: ['trashFinanceEntries'] });
      queryClient.invalidateQueries({ queryKey: ['financeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Restored successfully');
    } catch {
      toast.error('Failed to restore');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      if (deleteItem.type === 'file') {
        if (user) await permanentDeleteFile(user.id, deleteItem.item as FileItem);
      } else if (deleteItem.type === 'folder') {
        await permanentDeleteFolder(deleteItem.item.id);
      } else {
        await permanentDeleteFinanceEntry(deleteItem.item.id);
      }
      queryClient.invalidateQueries({ queryKey: ['trashFiles'] });
      queryClient.invalidateQueries({ queryKey: ['trashFolders'] });
      queryClient.invalidateQueries({ queryKey: ['trashFinanceEntries'] });
      queryClient.invalidateQueries({ queryKey: ['storageQuota'] });
      setDeleteItem(null);
      toast.success('Permanently deleted');
    } catch {
      toast.error('Failed to delete');
    }
    setDeleting(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const isLoading = loadingFiles || loadingFolders || loadingFinance;
  const isEmpty =
    !isLoading &&
    files.length === 0 &&
    folders.length === 0 &&
    financeEntries.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Trash" onLogoClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <div className="p-4 md:p-6 space-y-4">
        {!isEmpty && (
          <div className="flex items-center gap-3 rounded-2xl neu-pressed p-4 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            Items in trash can be restored or permanently deleted.
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <FileCardSkeleton key={i} />)}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={Trash2}
            title="Trash is empty"
            description="Deleted files, folders, and finance entries will appear here."
          />
        ) : (
          <div className="space-y-3">
            {/* Trashed Folders */}
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center gap-4 rounded-2xl neu-card p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-blue-500 shrink-0">
                  <Folder className="h-5 w-5 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{folder.name}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">Folder &middot; Deleted {formatRelativeTime(folder.deleted_at!)}</p>
                </div>
                <button onClick={() => handleRestore(folder.id, 'folder')} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center justify-center" aria-label="Restore folder">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteItem({ item: folder, type: 'folder' })} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] flex items-center justify-center" aria-label="Delete permanently">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Trashed Files */}
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 rounded-2xl neu-card p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-pressed shrink-0">
                  <FileIcon extension={file.extension} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{file.name}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">{formatBytes(file.size_bytes)} &middot; Deleted {formatRelativeTime(file.deleted_at!)}</p>
                </div>
                <button onClick={() => handleRestore(file.id, 'file')} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center justify-center" aria-label="Restore file">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteItem({ item: file, type: 'file' })} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] flex items-center justify-center" aria-label="Delete permanently">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Trashed Finance Entries */}
            {financeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 rounded-2xl neu-card p-4 border border-emerald-500/10">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-emerald-600 shrink-0">
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{entry.item}</p>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">{entry.category}</span>
                  </div>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">
                    Finance Entry &middot; {entry.person} &middot; <span className="font-bold text-[var(--color-primary)]">{formatCurrency(entry.amount)}</span>
                    {entry.deleted_at && ` · Deleted ${formatRelativeTime(entry.deleted_at)}`}
                  </p>
                </div>
                <button onClick={() => handleRestore(entry.id, 'finance')} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center justify-center" aria-label="Restore finance entry">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteItem({ item: entry, type: 'finance' })} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] flex items-center justify-center" aria-label="Delete permanently">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently delete?"
        description="This action cannot be undone. The item will be permanently removed."
        confirmLabel="Delete permanently"
        loading={deleting}
      />
    </div>
  );
}
