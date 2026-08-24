import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminFiles, deleteAdminFile, type AdminFileItem } from '@/services/adminService';
import { formatBytes, formatDate } from '@/utils';
import { FileIcon } from '@/components/FileIcon';
import { FileText, HardDrive, Trash2, Eye, X, Loader2, Info } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function AdminFiles() {
  const queryClient = useQueryClient();
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [viewingFileDetails, setViewingFileDetails] = useState<AdminFileItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminFiles'],
    queryFn: getAdminFiles,
  });

  const handleDelete = async () => {
    if (!deletingFileId) return;
    try {
      await deleteAdminFile(deletingFileId);
      queryClient.invalidateQueries({ queryKey: ['adminFiles'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
      setDeletingFileId(null);
      toast.success('File deleted from system');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">System File Management</h1>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Administrative overview of stored files across all users, type breakdown, and system-wide storage distribution</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-xs font-semibold text-[var(--color-text-tertiary)]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)] mr-2" />
          Loading system files telemetry...
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl neu-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-circle text-blue-500">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total Files</span>
              </div>
              <p className="text-2xl font-black text-[var(--color-text-primary)]">{data.totalFiles}</p>
            </div>

            <div className="rounded-2xl neu-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-circle text-purple-500">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total File Storage</span>
              </div>
              <p className="text-2xl font-black text-[var(--color-text-primary)]">{formatBytes(data.totalStorage)}</p>
            </div>

            <div className="rounded-2xl neu-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-circle text-emerald-500">
                  <FileIcon extension="pdf" size="sm" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Unique Extensions</span>
              </div>
              <p className="text-2xl font-black text-[var(--color-text-primary)]">{data.typeDistribution.length}</p>
            </div>

            <div className="rounded-2xl neu-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-circle text-amber-500">
                  <Info className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-tertiary)]">Recent Uploads</span>
              </div>
              <p className="text-2xl font-black text-[var(--color-text-primary)]">{data.recentUploads.length}</p>
            </div>
          </div>

          {/* Grid: Type Distribution & Largest Files */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* File Type Distribution */}
            <div className="rounded-3xl neu-card p-6 space-y-4">
              <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">File Type Distribution</h2>
              <div className="space-y-3">
                {data.typeDistribution.slice(0, 7).map(({ extension, count }) => {
                  const percent = Math.round((count / Math.max(1, data.totalFiles)) * 100);

                  return (
                    <div key={extension} className="flex items-center gap-3 text-xs">
                      <FileIcon extension={extension} size="sm" />
                      <span className="w-16 font-mono font-bold text-[var(--color-text-primary)]">.{extension}</span>
                      <div className="flex-1 h-2.5 neu-progress-track">
                        <div className="h-full neu-progress-bar" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-16 text-right font-bold text-[var(--color-text-secondary)]">{count} ({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Largest Files */}
            <div className="rounded-3xl neu-card p-6 space-y-4">
              <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">Largest Files in System</h2>
              <div className="space-y-2.5 text-xs">
                {data.largestFiles.slice(0, 6).map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-xl neu-pressed p-3">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <FileIcon extension={f.extension} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--color-text-primary)] truncate">{f.name}</p>
                        <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">Owner: {f.owner_name}</p>
                      </div>
                    </div>
                    <span className="shrink-0 font-extrabold text-[var(--color-primary)]">{formatBytes(f.size_bytes)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Files Table */}
          <div className="rounded-3xl neu-card p-2">
            <div className="p-4 border-b border-[var(--color-border-light)]/40">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">All System Files</h2>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Administrative index of active stored files</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-light)]/40 text-[var(--color-text-tertiary)] uppercase font-extrabold tracking-wider">
                    <th className="px-4 py-3">Filename</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]/20">
                  {data.files.map((f) => (
                    <tr key={f.id} className="transition-all hover:neu-pressed">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon extension={f.extension} size="sm" />
                          <span className="font-bold text-[var(--color-text-primary)] truncate max-w-xs">{f.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-bold">
                        {f.owner_name}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] uppercase font-bold text-[var(--color-text-tertiary)]">
                        {f.extension || 'file'}
                      </td>

                      <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">
                        {formatBytes(f.size_bytes)}
                      </td>

                      <td className="px-4 py-3 text-[var(--color-text-tertiary)] font-semibold whitespace-nowrap">
                        {formatDate(f.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        {f.deleted_at ? (
                          <span className="rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold text-red-500">
                            Deleted
                          </span>
                        ) : (
                          <span className="rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingFileDetails(f)}
                            className="h-8 w-8 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                            title="View File Metadata"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {!f.deleted_at && (
                            <button
                              onClick={() => setDeletingFileId(f.id)}
                              className="h-8 w-8 neu-circle text-[var(--color-danger)]"
                              title="Delete File"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* File Details Modal */}
      {viewingFileDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setViewingFileDetails(null)} />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Administrative File Metadata</h3>
              <button onClick={() => setViewingFileDetails(null)} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">File ID</span><span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">{viewingFileDetails.id}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Filename</span><span className="font-bold text-[var(--color-text-primary)]">{viewingFileDetails.name}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Original Name</span><span className="font-bold text-[var(--color-text-primary)]">{viewingFileDetails.original_name}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">MIME Type</span><span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">{viewingFileDetails.mime_type}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Size</span><span className="font-bold text-[var(--color-text-primary)]">{formatBytes(viewingFileDetails.size_bytes)}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Owner</span><span className="font-bold text-[var(--color-text-primary)]">{viewingFileDetails.owner_name}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Created Date</span><span className="font-bold text-[var(--color-text-primary)]">{formatDate(viewingFileDetails.created_at)}</span></div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={() => setViewingFileDetails(null)}
                className="rounded-xl neu-btn px-4 py-2 font-bold text-[var(--color-text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingFileId}
        onClose={() => setDeletingFileId(null)}
        onConfirm={handleDelete}
        title="Delete file from system?"
        description="This action will mark the file as deleted in the administration index."
        confirmLabel="Delete file"
      />
    </div>
  );
}
