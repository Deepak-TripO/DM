import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getRecentFiles } from '@/services/fileService';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { formatBytes, formatRelativeTime } from '@/utils';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['recentFiles', user?.id],
    queryFn: () => getRecentFiles(user!.id),
    enabled: !!user,
  });

  return (
    <div className="flex flex-col">
      <Header title="Recent" />
      <div className="p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <FileCardSkeleton key={i} />)}
          </div>
        ) : files.length === 0 ? (
          <EmptyState icon={Clock} title="No recent files" description="Files you open or modify will appear here." />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => navigate(`/files?preview=${file.id}`)}
                className="group rounded-2xl neu-card p-4 text-left transition-all hover:scale-[1.01]"
              >
                <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                  <FileIcon extension={file.extension} size="lg" />
                </div>
                <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{file.name}</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-tertiary)]">
                  {formatBytes(file.size_bytes)} &middot; {formatRelativeTime(file.updated_at)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
