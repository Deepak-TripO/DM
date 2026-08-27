import { useState, useEffect } from 'react';
import { X, Download, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { getSignedUrl, downloadFile } from '@/services/fileService';
import { supabase } from '@/lib/supabase/client';
import { FileIcon } from '@/components/FileIcon';
import { formatBytes, formatDate, getFileCategory, isPreviewable } from '@/utils';
import type { FileItem } from '@/types';
import { toast } from 'sonner';

interface FilePreviewModalProps {
  file: FileItem;
  onClose: () => void;
  allowDownload?: boolean;
}

export function FilePreviewModal({ file, onClose, allowDownload = true }: FilePreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const category = getFileCategory(file.extension);
  const canPreview = isPreviewable(file.extension);

  useEffect(() => {
    async function loadPreview() {
      setLoading(true);
      setImgError(false);
      const metaPreview = (file.metadata?.preview_url || file.metadata?.data_url) as string | undefined;

      if (metaPreview) {
        setUrl(metaPreview);
        setLoading(false);
        return;
      }

      try {
        const signedUrl = await getSignedUrl(file.storage_path);
        if (signedUrl) {
          setUrl(signedUrl);
        } else {
          const { data } = supabase.storage.from('files').getPublicUrl(file.storage_path);
          if (data?.publicUrl) setUrl(data.publicUrl);
        }

        // Load text content for text files
        if (['txt', 'md', 'json', 'xml', 'sql', 'log', 'yaml', 'yml', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'csv'].includes(file.extension)) {
          try {
            const blob = await downloadFile(file.storage_path);
            const text = await blob.text();
            setTextContent(text);
          } catch {}
        }
      } catch {
        const { data } = supabase.storage.from('files').getPublicUrl(file.storage_path);
        if (data?.publicUrl) {
          setUrl(data.publicUrl);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPreview();
  }, [file]);

  const handleDownload = async () => {
    try {
      const blob = await downloadFile(file.storage_path);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Failed to download');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--neu-bg)] border-b border-[var(--color-border-light)]/20 shadow-md">
        <div className="flex items-center gap-3">
          <FileIcon extension={file.extension} size="sm" />
          <div>
            <p className="text-sm font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
            <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">{formatBytes(file.size_bytes)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {category === 'image' && !imgError && (
            <>
              <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="h-9 w-9 neu-circle text-[var(--color-text-primary)]" aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-xs font-extrabold text-[var(--color-text-secondary)]">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="h-9 w-9 neu-circle text-[var(--color-text-primary)]" aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </button>
            </>
          )}
          {allowDownload && (
            <button onClick={handleDownload} className="h-9 w-9 neu-circle text-[var(--color-primary)]" aria-label="Download">
              <Download className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="h-9 w-9 neu-circle text-[var(--color-text-tertiary)]" aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6 bg-[var(--neu-bg)]">
        {loading ? (
          <div className="text-xs font-bold text-[var(--color-text-tertiary)]">Loading preview...</div>
        ) : !canPreview || imgError ? (
          /* Unsupported preview or image loading error */
          <div className="max-w-sm rounded-3xl neu-modal p-8 text-center space-y-3">
            <FileIcon extension={file.extension} size="lg" className="mx-auto mb-2" />
            <p className="text-base font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
            <div className="space-y-1.5 neu-pressed p-4 rounded-2xl text-xs font-semibold text-[var(--color-text-secondary)]">
              <p>{file.extension.toUpperCase()} file</p>
              <p>{formatBytes(file.size_bytes)}</p>
              <p>{formatDate(file.updated_at)}</p>
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">
              {imgError ? 'Image preview unavailable from storage.' : 'Preview unavailable for this file type.'}
            </p>
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="mt-2 rounded-xl neu-btn-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.02]"
              >
                Download
              </button>
            )}
          </div>
        ) : category === 'image' && url ? (
          <img
            src={url}
            alt={file.name}
            className="max-h-full max-w-full object-contain rounded-2xl neu-card transition-transform"
            style={{ transform: `scale(${zoom})` }}
            onError={() => {
              const metaPreview = (file.metadata?.preview_url || file.metadata?.data_url) as string | undefined;
              if (metaPreview && url !== metaPreview) {
                setUrl(metaPreview);
              } else {
                setImgError(true);
              }
            }}
          />
        ) : category === 'pdf' && url ? (
          <iframe src={url} className="h-full w-full max-w-4xl rounded-3xl neu-modal" title={file.name} />
        ) : category === 'video' && url ? (
          <video
            src={url}
            controls
            muted
            className="max-h-full max-w-full rounded-3xl neu-card"
            controlsList="nodownload"
          >
            Your browser does not support video playback.
          </video>
        ) : category === 'audio' && url ? (
          <div className="w-full max-w-md rounded-3xl neu-modal p-6">
            <div className="mb-4 flex items-center gap-3">
              <FileIcon extension={file.extension} size="lg" />
              <div>
                <p className="font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{formatBytes(file.size_bytes)}</p>
              </div>
            </div>
            <audio src={url} controls className="w-full" controlsList="nodownload">
              Your browser does not support audio playback.
            </audio>
          </div>
        ) : file.extension === 'csv' && textContent ? (
          <div className="max-h-full max-w-4xl overflow-auto rounded-3xl neu-modal p-4">
            <CsvTable content={textContent} />
          </div>
        ) : textContent !== null ? (
          <div className="max-h-full w-full max-w-4xl overflow-auto rounded-3xl neu-pressed p-6">
            <pre className="whitespace-pre-wrap font-mono text-xs font-semibold text-[var(--color-text-primary)]">
              {textContent}
            </pre>
          </div>
        ) : (
          <div className="text-xs font-bold text-[var(--color-text-tertiary)]">Unable to load preview</div>
        )}
      </div>
    </div>
  );
}

function CsvTable({ content }: { content: string }) {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return null;

  const rows = lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  const header = rows[0];
  const data = rows.slice(1, 100); // Limit to 100 rows

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--color-border-light)]">
          {header.map((cell, i) => (
            <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-secondary)]">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b border-[var(--color-border-light)] last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-2 text-[var(--color-text-primary)]">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
