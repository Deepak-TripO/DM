import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTrashFiles, restoreFile, permanentDeleteFile } from '@/services/fileService';
import { getTrashFolders, restoreFolder, permanentDeleteFolder } from '@/services/folderService';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatBytes, formatRelativeTime } from '@/utils';
import { Trash2, RotateCcw, Folder, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { FileItem, FolderItem } from '@/types';

export default function TrashPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteItem, setDeleteItem] = useState<{ item: FileItem | FolderItem; type: 'file' | 'folder' } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleRestore = async (id: string, type: 'file' | 'folder') => {
    try {
      if (type === 'file') await restoreFile(id);
      else await restoreFolder(id);
      queryClient.invalidateQueries({ queryKey: ['trashFiles'] });
      queryClient.invalidateQueries({ queryKey: ['trashFolders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Restored successfully');
    } catch {
      toast.error('Failed to restore');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteItem || !user) return;
    setDeleting(true);
    try {
      if (deleteItem.type === 'file') {
        await permanentDeleteFile(user.id, deleteItem.item as FileItem);
      } else {
        await permanentDeleteFolder(deleteItem.item.id);
      }
      queryClient.invalidateQueries({ queryKey: ['trashFiles'] });
      queryClient.invalidateQueries({ queryKey: ['trashFolders'] });
      queryClient.invalidateQueries({ queryKey: ['storageQuota'] });
      setDeleteItem(null);
      toast.success('Permanently deleted');
    } catch {
      toast.error('Failed to delete');
    }
    setDeleting(false);
  };

  const isLoading = loadingFiles || loadingFolders;
  const isEmpty = !isLoading && files.length === 0 && folders.length === 0;

  return (
    <div className="flex flex-col">
      <Header title="Trash" />
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
          <EmptyState icon={Trash2} title="Trash is empty" description="Deleted files and folders will appear here." />
        ) : (
          <div className="space-y-3">
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center gap-4 rounded-2xl neu-card p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-blue-500 shrink-0">
                  <Folder className="h-5 w-5 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{folder.name}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">Deleted {formatRelativeTime(folder.deleted_at!)}</p>
                </div>
                <button onClick={() => handleRestore(folder.id, 'folder')} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]" aria-label="Restore folder">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteItem({ item: folder, type: 'folder' })} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]" aria-label="Delete permanently">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 rounded-2xl neu-card p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-pressed shrink-0">
                  <FileIcon extension={file.extension} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{file.name}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">{formatBytes(file.size_bytes)} &middot; Deleted {formatRelativeTime(file.deleted_at!)}</p>
                </div>
                <button onClick={() => handleRestore(file.id, 'file')} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]" aria-label="Restore file">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteItem({ item: file, type: 'file' })} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]" aria-label="Delete permanently">
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
