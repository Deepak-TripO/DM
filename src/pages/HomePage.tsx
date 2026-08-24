import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getRecentFiles } from '@/services/fileService';
import { getStorageQuota } from '@/services/profileService';
import { formatBytes, formatRelativeTime } from '@/utils';
import { FolderOpen, Clock, Star, Upload, HardDrive, FileUp } from 'lucide-react';
import { UploadDialog } from '@/features/files/UploadDialog';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: recentFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ['recentFiles', user?.id],
    queryFn: () => getRecentFiles(user!.id, 12),
    enabled: !!user,
  });

  const { data: quota } = useQuery({
    queryKey: ['storageQuota', user?.id],
    queryFn: () => getStorageQuota(user!.id),
    enabled: !!user,
  });

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      navigate(`/files?search=${encodeURIComponent(query)}`);
    }
  }, [navigate]);

  const usedPercent = quota ? Math.min((quota.used_bytes / quota.quota_bytes) * 100, 100) : 0;

  return (
    <div className="flex flex-col">
      <Header title="Home" onUploadClick={() => setUploadOpen(true)} onSearch={handleSearch} />

      <div className="p-4 md:p-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <button
            onClick={() => navigate('/files')}
            className="flex items-center gap-3.5 rounded-2xl neu-btn p-4 text-left transition-all hover:bg-[#EAF4FF]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-[#4D94E8]">
              <FolderOpen className="h-5 w-5 text-[#4D94E8]" />
            </div>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">My Files</span>
          </button>

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-3.5 rounded-2xl neu-btn p-4 text-left transition-all hover:bg-[#E8FAFA]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-[#18AFAF]">
              <FileUp className="h-5 w-5 text-[#18AFAF]" />
            </div>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Upload</span>
          </button>

          <button
            onClick={() => navigate('/recent')}
            className="flex items-center gap-3.5 rounded-2xl neu-btn p-4 text-left transition-all hover:bg-[#FFF4E5]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-[#E59A32]">
              <Clock className="h-5 w-5 text-[#E59A32]" />
            </div>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Recent</span>
          </button>

          <button
            onClick={() => navigate('/starred')}
            className="flex items-center gap-3.5 rounded-2xl neu-btn p-4 text-left transition-all hover:bg-[#F3EDFF]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-[#8A63D2]">
              <Star className="h-5 w-5 text-[#8A63D2]" />
            </div>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Starred</span>
          </button>
        </div>

        {/* Storage */}
        {quota && (
          <div className="rounded-2xl neu-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
                  <HardDrive className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Storage Usage</span>
              </div>
              <span className="text-xs font-bold text-[var(--color-primary)]">{usedPercent.toFixed(1)}%</span>
            </div>
            <div className="mb-2 h-3 neu-progress-track">
              <div
                className="h-full neu-progress-bar"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {formatBytes(quota.used_bytes)} used of {formatBytes(quota.quota_bytes)}
            </p>
          </div>
        )}

        {/* Recent Files */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Recent Files</h2>
            <button
              onClick={() => navigate('/recent')}
              className="rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-primary)]"
            >
              View all
            </button>
          </div>

          {loadingFiles ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <FileCardSkeleton key={i} />
              ))}
            </div>
          ) : !recentFiles?.length ? (
            <EmptyState
              icon={Upload}
              title="No files yet"
              description="Upload your first file to start organizing your workspace."
              action={
                <button
                  onClick={() => setUploadOpen(true)}
                  className="rounded-xl neu-btn-primary px-5 py-2.5 text-sm font-bold text-white shadow-md"
                >
                  Upload file
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {recentFiles.map((file) => (
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
                    {formatRelativeTime(file.updated_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={null}
      />
    </div>
  );
}
