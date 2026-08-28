import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getActiveTasks, getTaskById, getTaskFiles } from '@/services/taskService';
import type { TaskItem } from '@/services/taskService';
import type { FileItem } from '@/types';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileCardSkeleton } from '@/components/LoadingSkeleton';
import { FileIcon } from '@/components/FileIcon';
import { FilePreviewModal } from '@/features/files/preview/FilePreviewModal';
import { FinanceView } from '@/pages/finance/FinanceView';
import { TripoLeadView } from '@/pages/tripolead/TripoLeadView';
import { FreelanceLeadView } from '@/pages/freelancelead/FreelanceLeadView';
import { formatBytes, formatRelativeTime } from '@/utils';
import { CheckSquare, Grid3X3, List, Eye, Download, MoreVertical, HardDrive } from 'lucide-react';
import { getSignedUrl } from '@/services/fileService';
import { toast } from 'sonner';
import { useAppLayout } from '@/layouts/AppLayout';

export default function TasksPage() {
  const { taskId } = useParams<{ taskId?: string }>();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar, hasSidebar, setHideSidebarOverride } = useAppLayout();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Query active tasks for selection
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['activeTasks'],
    queryFn: getActiveTasks,
    enabled: !taskId,
  });

  // Query selected task details & files
  const { data: selectedTask, isLoading: loadingTask } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTaskById(taskId!),
    enabled: !!taskId,
  });

  const isFinanceTask = !!selectedTask && selectedTask.name.trim().toLowerCase() === 'finance';
  const isTripoLeadTask = !!selectedTask && (
    selectedTask.name.trim().toLowerCase().replace(/\s+/g, '').includes('tripolead') ||
    selectedTask.name.trim().toLowerCase().includes('tripo')
  );
  const isFreelanceLeadTask = !!selectedTask && (
    selectedTask.name.trim().toLowerCase().replace(/\s+/g, '').includes('freelancelead') ||
    selectedTask.name.trim().toLowerCase().includes('freelance')
  );

  useEffect(() => {
    if (isTripoLeadTask || isFreelanceLeadTask) {
      setHideSidebarOverride?.(true);
    } else {
      setHideSidebarOverride?.(false);
    }
    return () => {
      setHideSidebarOverride?.(false);
    };
  }, [isTripoLeadTask, isFreelanceLeadTask, setHideSidebarOverride]);

  const { data: taskFiles = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['taskFiles', taskId],
    queryFn: () => getTaskFiles(taskId!),
    enabled: !!taskId && !!selectedTask && !isFinanceTask && !isTripoLeadTask && !isFreelanceLeadTask,
  });

  const handleDownload = async (file: FileItem) => {
    try {
      const url = await getSignedUrl(file.storage_path);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('Failed to download file');
    }
  };

  if (selectedTask && isFinanceTask) {
    return <FinanceView task={selectedTask} />;
  }

  if (selectedTask && isTripoLeadTask) {
    return <TripoLeadView task={selectedTask} />;
  }

  if (selectedTask && isFreelanceLeadTask) {
    return <FreelanceLeadView task={selectedTask} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogoClick={hasSidebar ? toggleSidebar : undefined} sidebarOpen={sidebarOpen} />

      <div className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Task Detail View */}
        {taskId ? (
          loadingTask ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <FileCardSkeleton key={i} />)}
            </div>
          ) : !selectedTask ? (
            <div className="rounded-3xl neu-card p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full neu-circle text-[var(--color-danger)]">
                <CheckSquare className="h-8 w-8 text-[var(--color-danger)]" />
              </div>
              <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">Task Not Found or Access Denied</h2>
              <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)] max-w-sm">
                This task does not exist or is no longer active.
              </p>
            </div>
          ) : isFinanceTask ? (
            <FinanceView task={selectedTask} />
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-end gap-4">
                <div className="flex rounded-xl neu-pressed p-1 gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg p-1.5 transition-all ${viewMode === 'grid' ? 'neu-active text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg p-1.5 transition-all ${viewMode === 'list' ? 'neu-active text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Task Content Listing */}
              {loadingFiles ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, i) => <FileCardSkeleton key={i} />)}
                </div>
              ) : taskFiles.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title={`No files in ${selectedTask.name}`}
                  description="There are currently no files assigned to this task."
                />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {taskFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-2xl neu-card p-4 transition-all hover:scale-[1.01]"
                    >
                      <button
                        onClick={() => setPreviewFile(file)}
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl neu-card p-2 space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b border-[var(--color-border-light)]/40">
                    <span className="w-8" />
                    <span className="flex-1">Name</span>
                    <span className="hidden w-24 md:block">Size</span>
                    <span className="hidden w-32 md:block">Modified</span>
                  </div>
                  {taskFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:neu-pressed"
                    >
                      <button onClick={() => setPreviewFile(file)} className="flex flex-1 items-center gap-3 text-left min-w-0">
                        <FileIcon extension={file.extension} size="sm" />
                        <span className="flex-1 truncate text-sm font-bold text-[var(--color-text-primary)]">
                          {file.name}
                        </span>
                        <span className="hidden w-24 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">{formatBytes(file.size_bytes)}</span>
                        <span className="hidden w-32 text-xs font-semibold text-[var(--color-text-tertiary)] md:block">{formatRelativeTime(file.updated_at)}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          /* Task Selection Grid */
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">Select Task</h2>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                Choose an administrative task to view its assigned items and content
              </p>
            </div>

            {loadingTasks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl neu-card animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks are currently available"
                description="Administrative tasks will appear here once created by the administrator."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {tasks.map((task: TaskItem) => (
                  <button
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="group flex flex-col justify-between rounded-2xl neu-card p-5 text-left transition-all hover:scale-[1.02] hover:neu-pressed"
                  >
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl neu-circle text-[var(--color-primary)] transition-transform group-hover:scale-105">
                        <CheckSquare className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-extrabold text-[var(--color-text-primary)]">{task.name}</h3>
                        <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                          {formatRelativeTime(task.updated_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-light)]/40 text-xs font-bold text-[var(--color-primary)]">
                      <span>View Task</span>
                      <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
