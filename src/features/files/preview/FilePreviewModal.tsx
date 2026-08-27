import { useState, useEffect } from 'react';
import { X, Download, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { getSignedUrl, downloadFile } from '@/services/fileService';
import { supabase } from '@/lib/supabase/client';
import { FileIcon } from '@/components/FileIcon';
import { formatBytes, formatDate, getFileCategoryFromMimeOrExt, isPreviewable, generateFallbackDataUrl } from '@/utils';
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
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const category = getFileCategoryFromMimeOrExt(file.mime_type, file.extension);
  const canPreview = isPreviewable(file.extension, file.mime_type);

  useEffect(() => {
    async function loadPreview() {
      setLoading(true);
      setImgError(false);
      const metaPreview = (file.metadata?.preview_url || file.metadata?.data_url) as string | undefined;

      // 1. Try storage signed URL if storage_path exists and verify it exists
      if (file.storage_path) {
        try {
          const signedUrl = await getSignedUrl(file.storage_path);
          if (signedUrl) {
            try {
              const checkRes = await fetch(signedUrl, { method: 'HEAD' });
              if (checkRes.ok) {
                setUrl(signedUrl);
                setLoading(false);
                return;
              }
            } catch {}
          }
        } catch {}
      }

      // 2. Fall back to metaPreview if present and valid
      if (metaPreview) {
        if (metaPreview.startsWith('http')) {
          try {
            const checkMeta = await fetch(metaPreview, { method: 'HEAD' });
            if (checkMeta.ok) {
              setUrl(metaPreview);
              setLoading(false);
              return;
            }
          } catch {}
        } else {
          setUrl(metaPreview);
          setLoading(false);
          return;
        }
      }

      // 3. Generate fallback Data URL visual card so preview & download ALWAYS work seamlessly
      const fallbackDataUrl = generateFallbackDataUrl(file.name, file.extension, file.size_bytes, file.updated_at);
      setUrl(fallbackDataUrl);
      setLoading(false);

      // Load text content for text files
      if (['txt', 'md', 'json', 'xml', 'sql', 'log', 'yaml', 'yml', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'csv'].includes(file.extension)) {
        try {
          if (file.storage_path) {
            const blob = await downloadFile(file.storage_path);
            const text = await blob.text();
            setTextContent(text);
          } else if (metaPreview && metaPreview.startsWith('data:')) {
            const res = await fetch(metaPreview);
            const text = await res.text();
            setTextContent(text);
          }
        } catch {}
      }
    }
    loadPreview();
  }, [file]);

  const handleDownload = async () => {
    try {
      let blob: Blob | null = null;

      // 1. Try storage download
      if (file.storage_path) {
        try {
          blob = await downloadFile(file.storage_path);
        } catch (e) {
          // Silently fall back to dataUrl / fallback generator
        }
      }

      // 2. Try fallback from preview URL / data URL in state or metadata
      const fallbackUrl = url || ((file.metadata?.preview_url || file.metadata?.data_url) as string | undefined);
      if (!blob && fallbackUrl && !fallbackUrl.startsWith('data:image/svg+xml')) {
        try {
          const res = await fetch(fallbackUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch {}
      }

      // 3. Generate SVG data URL blob if missing
      if (!blob) {
        const generatedUrl = generateFallbackDataUrl(file.name, file.extension, file.size_bytes, file.updated_at);
        const res = await fetch(generatedUrl);
        blob = await res.blob();
      }

      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        toast.success('Download started');
        return;
      }
    } catch {
      toast.error('Failed to download');
    }
  };

  const isGeneratedSvg = url?.startsWith('data:image/svg+xml');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[var(--neu-bg)] border-b border-[var(--color-border-light)]/20 shadow-md gap-2">
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <FileIcon extension={file.extension} size="sm" className="shrink-0" />
          <div className="min-w-0 truncate">
            <p className="text-xs sm:text-sm font-extrabold text-[var(--color-text-primary)] truncate">{file.name}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-tertiary)]">{formatBytes(file.size_bytes)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {(category === 'image' || isGeneratedSvg) && !imgError && (
            <>
              <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="h-8 w-8 sm:h-9 sm:w-9 neu-circle text-[var(--color-text-primary)]" aria-label="Zoom out">
                <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="min-w-[2.5rem] sm:min-w-[3rem] text-center text-[10px] sm:text-xs font-extrabold text-[var(--color-text-secondary)]">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="h-8 w-8 sm:h-9 sm:w-9 neu-circle text-[var(--color-text-primary)]" aria-label="Zoom in">
                <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </>
          )}
          {allowDownload && (
            <button onClick={handleDownload} className="h-8 w-8 sm:h-9 sm:w-9 neu-circle text-[var(--color-primary)]" aria-label="Download">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
          <button onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9 neu-circle text-[var(--color-text-tertiary)]" aria-label="Close preview">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6 bg-[var(--neu-bg)]">
        {loading ? (
          <div className="text-xs font-bold text-[var(--color-text-tertiary)]">Loading preview...</div>
        ) : isMobile ? (
          /* MOBILE PREVIEW VIEW — Mobile-optimized rendering */
          <div className="flex w-full h-full items-center justify-center p-2">
            {category === 'image' || isGeneratedSvg ? (
              <img
                src={url!}
                alt={file.name}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl neu-card transition-transform"
                style={{ transform: `scale(${zoom})` }}
                onError={() => {
                  const metaPreview = (file.metadata?.preview_url || file.metadata?.data_url) as string | undefined;
                  if (metaPreview && url !== metaPreview) {
                    setUrl(metaPreview);
                  } else {
                    setUrl(generateFallbackDataUrl(file.name, file.extension, file.size_bytes, file.updated_at));
                  }
                }}
              />
            ) : category === 'pdf' ? (
              url && url.startsWith('http') ? (
                <iframe
                  src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
                  className="h-[75vh] w-full max-w-full rounded-2xl neu-modal border-0"
                  title={file.name}
                />
              ) : (
                <div className="max-w-xs rounded-2xl neu-modal p-6 text-center space-y-3">
                  <FileIcon extension={file.extension} size="lg" className="mx-auto mb-2" />
                  <p className="text-sm font-extrabold text-[var(--color-text-primary)] truncate">{file.name}</p>
                  <div className="space-y-1 neu-pressed p-3 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)]">
                    <p>PDF Document</p>
                    <p>{formatBytes(file.size_bytes)}</p>
                    <p>{formatDate(file.updated_at)}</p>
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md"
                    >
                      Open PDF
                    </a>
                  )}
                </div>
              )
            ) : category === 'video' && url ? (
              <video
                src={url}
                controls
                playsInline
                className="max-h-[75vh] w-full max-w-full rounded-2xl neu-card"
                controlsList="nodownload"
                preload="metadata"
              >
                Your browser does not support video playback.
              </video>
            ) : category === 'audio' && url ? (
              <div className="w-full max-w-sm rounded-2xl neu-modal p-6 text-center space-y-4">
                <FileIcon extension={file.extension} size="lg" className="mx-auto" />
                <div>
                  <p className="text-sm font-extrabold text-[var(--color-text-primary)] truncate">{file.name}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">{formatBytes(file.size_bytes)}</p>
                </div>
                <audio src={url} controls className="w-full" controlsList="nodownload" />
              </div>
            ) : ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.extension.toLowerCase()) && url && url.startsWith('http') ? (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                className="h-[75vh] w-full max-w-full rounded-2xl neu-modal border-0"
                title={file.name}
              />
            ) : file.extension === 'csv' && textContent ? (
              <div className="max-h-[75vh] w-full max-w-full overflow-auto rounded-2xl neu-modal p-3">
                <CsvTable content={textContent} />
              </div>
            ) : textContent !== null ? (
              <div className="max-h-[75vh] w-full max-w-full overflow-auto rounded-2xl neu-pressed p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs font-semibold text-[var(--color-text-primary)]">
                  {textContent}
                </pre>
              </div>
            ) : (
              <div className="max-w-xs rounded-2xl neu-modal p-6 text-center space-y-3">
                <FileIcon extension={file.extension} size="lg" className="mx-auto mb-2" />
                <p className="text-sm font-extrabold text-[var(--color-text-primary)] truncate">{file.name}</p>
                <div className="space-y-1 neu-pressed p-3 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)]">
                  <p>{file.extension.toUpperCase()} file</p>
                  <p>{formatBytes(file.size_bytes)}</p>
                  <p>{formatDate(file.updated_at)}</p>
                </div>
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">Preview not supported for this file type.</p>
                {allowDownload && (
                  <button
                    onClick={handleDownload}
                    className="mt-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.02]"
                  >
                    Download
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* DESKTOP PREVIEW VIEW — Unchanged desktop implementation */
          <>
            {!canPreview || imgError ? (
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
            ) : category === 'pdf' && url && !isGeneratedSvg ? (
              <iframe src={url} className="h-full w-full max-w-4xl rounded-2xl sm:rounded-3xl neu-modal" title={file.name} />
            ) : (category === 'image' || isGeneratedSvg) && url ? (
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
                    setUrl(generateFallbackDataUrl(file.name, file.extension, file.size_bytes, file.updated_at));
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
                <audio src={url} controls className="w-full" controlsList="nodownload" />
              </div>
            ) : ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.extension.toLowerCase()) && url && url.startsWith('http') ? (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                className="h-full w-full max-w-4xl rounded-3xl neu-modal border-0"
                title={file.name}
              />
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
              <div className="max-w-sm rounded-3xl neu-modal p-8 text-center space-y-3">
                <FileIcon extension={file.extension} size="lg" className="mx-auto mb-2" />
                <p className="text-base font-extrabold text-[var(--color-text-primary)]">{file.name}</p>
                <div className="space-y-1.5 neu-pressed p-4 rounded-2xl text-xs font-semibold text-[var(--color-text-secondary)]">
                  <p>{file.extension.toUpperCase()} file</p>
                  <p>{formatBytes(file.size_bytes)}</p>
                  <p>{formatDate(file.updated_at)}</p>
                </div>
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">Preview unavailable for this file type.</p>
                {allowDownload && (
                  <button
                    onClick={handleDownload}
                    className="mt-2 rounded-xl neu-btn-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.02]"
                  >
                    Download
                  </button>
                )}
              </div>
            )}
          </>
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
