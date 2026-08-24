import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStarredFiles, toggleStarFile } from '@/services/fileService';
import { getStarredFolders, toggleStarFolder } from '@/services/folderService';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { formatBytes, formatRelativeTime } from '@/utils';
import { Star, Folder, StarOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function StarredPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['starredFiles', user?.id],
    queryFn: () => getStarredFiles(user!.id),
    enabled: !!user,
  });

  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['starredFolders', user?.id],
    queryFn: () => getStarredFolders(user!.id),
    enabled: !!user,
  });

  const unstarFile = async (fileId: string) => {
    await toggleStarFile(fileId, false);
    queryClient.invalidateQueries({ queryKey: ['starredFiles'] });
    toast.success('Removed from starred');
  };

  const unstarFolder = async (folderId: string) => {
    await toggleStarFolder(folderId, false);
    queryClient.invalidateQueries({ queryKey: ['starredFolders'] });
    toast.success('Removed from starred');
  };

  const isLoading = loadingFiles || loadingFolders;
  const isEmpty = !isLoading && files.length === 0 && folders.length === 0;

  return (
    <div className="flex flex-col">
      <Header title="Starred" />
      <div className="p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <FileCardSkeleton key={i} />)}
          </div>
        ) : isEmpty ? (
          <EmptyState icon={Star} title="No starred items" description="Star files and folders for quick access." />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {folders.map((folder) => (
              <div key={folder.id} className="group relative rounded-2xl neu-card p-4 transition-all hover:scale-[1.01]">
                <button onClick={() => navigate(`/files?folder=${folder.id}`)} className="w-full text-left">
                  <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                    <Folder className="h-12 w-12 text-blue-500" />
                  </div>
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{folder.name}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-tertiary)]">Folder</p>
                </button>
                <button
                  onClick={() => unstarFolder(folder.id)}
                  className="absolute right-3 top-3 rounded-full p-2 neu-circle opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Unstar folder"
                >
                  <StarOff className="h-3.5 w-3.5 text-amber-500" />
                </button>
              </div>
            ))}
            {files.map((file) => (
              <div key={file.id} className="group relative rounded-2xl neu-card p-4 transition-all hover:scale-[1.01]">
                <button onClick={() => navigate(`/files?preview=${file.id}`)} className="w-full text-left">
                  <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                    <FileIcon extension={file.extension} size="lg" />
                  </div>
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{file.name}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-text-tertiary)]">{formatBytes(file.size_bytes)}</p>
                </button>
                <button
                  onClick={() => unstarFile(file.id)}
                  className="absolute right-3 top-3 rounded-full p-2 neu-circle opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Unstar file"
                >
                  <StarOff className="h-3.5 w-3.5 text-amber-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
