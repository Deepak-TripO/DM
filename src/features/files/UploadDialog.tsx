import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFile } from '@/services/fileService';
import { checkStorageAvailable } from '@/services/profileService';
import { formatBytes } from '@/utils';
import { Upload, X, File, Loader2, CheckCircle, AlertCircle, CloudUpload } from 'lucide-react';
import { toast } from 'sonner';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function UploadDialog({ open, onClose, folderId }: UploadDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    const fileArray = Array.from(files);
    const newUploads: UploadItem[] = fileArray.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Upload sequentially
    for (const upload of newUploads) {
      try {
        // Check storage quota
        const available = await checkStorageAvailable(user.id, upload.file.size);
        if (!available) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id ? { ...u, status: 'error', error: 'Storage quota exceeded' } : u
            )
          );
          continue;
        }

        setUploads((prev) =>
          prev.map((u) => (u.id === upload.id ? { ...u, status: 'uploading' } : u))
        );

        await uploadFile(user.id, upload.file, folderId, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
          );
        });

        setUploads((prev) =>
          prev.map((u) => (u.id === upload.id ? { ...u, status: 'done', progress: 100 } : u))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'error', error: message } : u
          )
        );
      }
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['files'] });
    queryClient.invalidateQueries({ queryKey: ['recentFiles'] });
    queryClient.invalidateQueries({ queryKey: ['storageQuota'] });
    if (folderId) {
      queryClient.invalidateQueries({ queryKey: ['tripoLeadFiles', folderId] });
      queryClient.invalidateQueries({ queryKey: ['taskFiles', folderId] });
    }
    toast.success(`${fileArray.length} file${fileArray.length > 1 ? 's' : ''} uploaded`);

    // Automatically return to My Files after successful upload
    setTimeout(() => {
      setUploads([]);
      onClose();
    }, 600);
  }, [user, folderId, queryClient, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleClose = () => {
    setUploads([]);
    onClose();
  };

  if (!open) return null;

  const uploading = uploads.some((u) => u.status === 'uploading');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={!uploading ? handleClose : undefined} />
      <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">Upload files</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl p-8 transition-all ${
            isDragOver
              ? 'neu-pressed border-2 border-[var(--color-primary)]'
              : 'neu-pressed border-2 border-transparent hover:border-[var(--color-primary)]/40'
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full neu-circle text-[var(--color-primary)] mb-3">
            <CloudUpload className="h-7 w-7 text-[var(--color-primary)]" />
          </div>
          <p className="text-sm font-extrabold text-[var(--color-text-primary)]">
            Drop files here or click to browse
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-tertiary)]">
            Any file type supported
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
          aria-label="Select files"
        />

        {/* Upload queue */}
        {uploads.length > 0 && (
          <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 rounded-2xl neu-pressed p-3">
                <File className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[var(--color-text-primary)]">{upload.file.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2 flex-1 neu-progress-track">
                      <div
                        className={`h-full neu-progress-bar transition-all ${
                          upload.status === 'error' ? 'bg-red-500' : ''
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">
                      {formatBytes(upload.file.size)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {upload.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />}
                  {upload.status === 'done' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  {upload.status === 'error' && (
                    <span title={upload.error}>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
