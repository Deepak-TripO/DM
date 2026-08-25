import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getRecentItems, type UnifiedRecentItem } from '@/services/fileService';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { FilePreviewModal } from '@/features/files/preview/FilePreviewModal';
import { Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppLayout } from '@/layouts/AppLayout';
import type { FileItem } from '@/types';

export default function RecentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useAppLayout();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const { data: recentItems = [], isLoading } = useQuery({
    queryKey: ['recentItems', user?.id],
    queryFn: () => getRecentItems(user!.id),
    enabled: !!user,
  });

  const handleItemClick = (item: UnifiedRecentItem) => {
    if (item.itemType === 'finance') {
      navigate('/');
    } else if (item.file) {
      setSelectedFile(item.file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Recent" onLogoClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <div className="p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <FileCardSkeleton key={i} />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No recent activity"
            description="Items or files you create or modify will appear here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative rounded-2xl neu-card p-4 text-left transition-all hover:scale-[1.01] focus:outline-none"
              >
                <div className="mb-3 flex h-28 items-center justify-center rounded-xl neu-pressed">
                  {item.itemType === 'finance' ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl neu-circle text-emerald-500">
                      <DollarSign className="h-8 w-8 text-emerald-500" />
                    </div>
                  ) : (
                    <FileIcon extension={item.extension || ''} size="lg" />
                  )}
                </div>
                <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                  {item.name}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-[var(--color-text-tertiary)]">
                  {item.subtitle}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFile && (
        <FilePreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
