import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getShareByToken, verifySharePassword, logShareAccess } from '@/services/shareService';
import { getSignedUrl, downloadFile } from '@/services/fileService';
import { FilePreviewModal } from '@/features/files/preview/FilePreviewModal';
import { FileIcon } from '@/components/FileIcon';
import { formatBytes, formatDate } from '@/utils';
import { Lock, Loader2, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import type { ShareItem, FileItem } from '@/types';

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<ShareItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function loadShare() {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const data = await getShareByToken(token);
        if (!data) {
          setError('This link is invalid, expired, or has been revoked.');
          setLoading(false);
          return;
        }

        setShare(data);
        if (data.password_enabled) {
          setPasswordRequired(true);
        } else {
          setAuthenticated(true);
          logShareAccess(data.id);
        }
      } catch {
        setError('Failed to load shared content.');
      }
      setLoading(false);
    }
    loadShare();
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !share) return;

    setVerifying(true);
    setPasswordError('');

    const valid = await verifySharePassword(token, password);
    if (valid) {
      setAuthenticated(true);
      setPasswordRequired(false);
      logShareAccess(share.id);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
    setVerifying(false);
  };

  const handleDownload = async () => {
    if (!share?.file) return;
    try {
      const blob = await downloadFile(share.file.storage_path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = share.file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error handled silently
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg)] px-4">
        <div className="max-w-sm text-center neu-flat p-8 rounded-3xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl neu-circle text-[var(--color-danger)]">
            <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" />
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Link unavailable</h1>
          <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg)] px-4">
        <div className="w-full max-w-sm neu-flat p-8 rounded-3xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl neu-circle text-[var(--color-primary)]">
              <ShieldCheck className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Protected File</h1>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">This share link is password protected.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            {passwordError && (
              <div className="rounded-xl neu-pressed p-3 text-xs font-semibold text-red-600 dark:text-red-400">{passwordError}</div>
            )}
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                className="w-full rounded-xl neu-input py-3 pl-10 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="flex w-full items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
            >
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              Unlock File
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (authenticated && share?.file) {
    const file = share.file as FileItem;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--neu-bg)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Shared via DM Cloud
          </div>
          <div className="rounded-3xl neu-flat p-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl neu-pressed">
              <FileIcon extension={file.extension} size="lg" className="mx-auto" />
            </div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">{file.name}</h2>
            <div className="mt-2 space-y-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              <p>{file.extension.toUpperCase()} File</p>
              <p>{formatBytes(file.size_bytes)}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)]"
              >
                Preview
              </button>
              {share.allow_download && (
                <button
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>

        {showPreview && (
          <FilePreviewModal file={file} onClose={() => setShowPreview(false)} allowDownload={share.allow_download} />
        )}
      </div>
    );
  }

  return null;
}
