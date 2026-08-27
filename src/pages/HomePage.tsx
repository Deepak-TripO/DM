import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { Header } from '@/components/Header';
import { getActiveTasks, type TaskItem } from '@/services/taskService';
import { getRecentItems, type UnifiedRecentItem } from '@/services/fileService';
import { FileIcon } from '@/components/FileIcon';
import { FilePreviewModal } from '@/features/files/preview/FilePreviewModal';
import { useAppLayout } from '@/layouts/AppLayout';
import { formatBytes, formatRelativeTime } from '@/utils';
import { CheckSquare, Clock, DollarSign, ArrowRight, FolderOpen } from 'lucide-react';
import type { FileItem } from '@/types';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useAppLayout();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Fetch active tasks for Quick Access
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['activeTasks'],
    queryFn: getActiveTasks,
  });

  // Fetch recent activity
  const { data: recentItems = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['recentItems', user?.id],
    queryFn: () => (user ? getRecentItems(user.id, 8) : Promise.resolve([])),
    enabled: !!user,
  });

  const handleRecentClick = (item: UnifiedRecentItem) => {
    if (item.itemType === 'finance') {
      const financeTask = tasks.find((t) => t.name.trim().toLowerCase() === 'finance');
      if (financeTask) {
        navigate(`/tasks/${financeTask.id}`);
      } else {
        navigate('/tasks/finance');
      }
    } else if (item.file) {
      setSelectedFile(item.file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogoClick={toggleSidebar} sidebarOpen={sidebarOpen} />

      <div className="flex-1 space-y-8 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="rounded-3xl neu-card p-6 md:p-8 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[var(--color-text-primary)]">
                Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
              </h1>
              <p className="text-xs md:text-sm font-semibold text-[var(--color-text-secondary)] mt-1">
                Access your administrative tasks, financial entries, and cloud documents
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.02] transition-transform"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Select Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <span>Administrative Tasks</span>
            </h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingTasks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl neu-card animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl neu-pressed p-6 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">
              No tasks currently available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tasks.map((task: TaskItem) => (
                <button
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="group flex flex-col justify-between rounded-2xl neu-card p-5 text-left transition-all hover:scale-[1.02] hover:neu-pressed"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
                      <CheckSquare className="h-5.5 w-5.5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-extrabold text-[var(--color-text-primary)]">{task.name}</h3>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                        {formatRelativeTime(task.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border-light)]/40 text-xs font-bold text-[var(--color-primary)]">
                    <span>Open Task</span>
                    <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>Recent Activity</span>
            </h2>
            <button
              onClick={() => navigate('/recent')}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              <span>View Recent</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingRecent ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl neu-card animate-pulse" />
              ))}
            </div>
          ) : recentItems.length === 0 ? (
            <div className="rounded-2xl neu-pressed p-6 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">
              No recent activity found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
              {recentItems.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRecentClick(item)}
                  className="group relative rounded-2xl neu-card p-4 text-left transition-all hover:scale-[1.01]"
                >
                  <div className="mb-2.5 flex h-20 items-center justify-center rounded-xl neu-pressed">
                    {item.itemType === 'finance' ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-circle text-emerald-500">
                        <DollarSign className="h-6 w-6 text-emerald-500" />
                      </div>
                    ) : (
                      <FileIcon extension={item.extension || ''} size="md" />
                    )}
                  </div>
                  <p className="truncate text-xs font-bold text-[var(--color-text-primary)]">{item.name}</p>
                  <p className="truncate text-[10px] font-semibold text-[var(--color-text-tertiary)] mt-0.5">{item.subtitle}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
}
