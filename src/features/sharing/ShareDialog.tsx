import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { createShare, revokeShare } from '@/services/shareService';
import { generateSharePassword } from '@/utils';
import { X, Copy, Eye, EyeOff, RefreshCw, ShieldCheck, Calendar, Download, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ShareItem } from '@/types';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  item: { id: string; name: string; type: 'file' | 'folder' };
  existingShare?: ShareItem | null;
}

export function ShareDialog({ open, onClose, item, existingShare }: ShareDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [share, setShare] = useState<ShareItem | null>(existingShare || null);
  const [loading, setLoading] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [revoking, setRevoking] = useState(false);

  if (!open) return null;

  const shareUrl = share ? `${window.location.origin}/share/${share.token}` : '';

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const newShare = await createShare({
        ownerId: user.id,
        fileId: item.type === 'file' ? item.id : undefined,
        folderId: item.type === 'folder' ? item.id : undefined,
        passwordEnabled,
        password: passwordEnabled ? password : undefined,
        allowDownload,
        expiresAt: expiresAt || undefined,
      });
      setShare(newShare);
      queryClient.invalidateQueries({ queryKey: ['userShares'] });
      toast.success('Share link created');
    } catch {
      toast.error('Failed to create share link');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  };

  const handleGeneratePassword = () => {
    const pwd = generateSharePassword();
    setPassword(pwd);
    setPasswordEnabled(true);
    setShowPassword(true);
  };

  const handleRevoke = async () => {
    if (!share) return;
    setRevoking(true);
    try {
      await revokeShare(share.id);
      setShare(null);
      queryClient.invalidateQueries({ queryKey: ['userShares'] });
      toast.success('Share link revoked');
      onClose();
    } catch {
      toast.error('Failed to revoke');
    }
    setRevoking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">
            Share {item.type === 'folder' ? 'folder' : 'file'}
          </h2>
          <button onClick={onClose} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="truncate text-xs font-bold text-[var(--color-text-secondary)] neu-pressed p-3 rounded-xl">{item.name}</p>

        {share ? (
          <div className="space-y-4">
            {/* Share link */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                <Link2 className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Link
              </label>
              <div className="flex gap-2.5">
                <input value={shareUrl} readOnly className="flex-1 rounded-xl neu-input px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-primary)]" />
                <button onClick={handleCopy} className="rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white" aria-label="Copy link">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Revoke */}
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="flex w-full items-center justify-center gap-2 rounded-xl neu-btn-danger px-4 py-2.5 text-xs font-bold text-red-500 disabled:opacity-60"
            >
              {revoking && <Loader2 className="h-4 w-4 animate-spin" />}
              Revoke link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Password protection
                </label>
                <button
                  onClick={() => setPasswordEnabled(!passwordEnabled)}
                  className={`relative h-6 w-11 rounded-full neu-pressed transition-colors ${passwordEnabled ? 'bg-[var(--color-primary)]/20' : ''}`}
                  aria-label="Toggle password"
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full neu-circle transition-all ${passwordEnabled ? 'left-[22px] bg-[var(--color-primary)]' : 'left-0.5 bg-[var(--color-text-tertiary)]'}`} />
                </button>
              </div>
              {passwordEnabled && (
                <div className="space-y-2 pt-1">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full rounded-xl neu-input px-3.5 py-2.5 pr-16 text-xs font-bold text-[var(--color-text-primary)]"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-label={showPassword ? 'Hide' : 'Show'}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button onClick={handleGeneratePassword} className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)]">
                    <RefreshCw className="h-3 w-3" /> Generate password
                  </button>
                </div>
              )}
            </div>

            {/* Expiration */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                <Calendar className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Expiration
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-xl neu-input px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-primary)]"
              />
            </div>

            {/* Download permission */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                <Download className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Allow download
              </label>
              <button
                onClick={() => setAllowDownload(!allowDownload)}
                className={`relative h-6 w-11 rounded-full neu-pressed transition-colors ${allowDownload ? 'bg-[var(--color-primary)]/20' : ''}`}
                aria-label="Toggle download"
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full neu-circle transition-all ${allowDownload ? 'left-[22px] bg-[var(--color-primary)]' : 'left-0.5 bg-[var(--color-text-tertiary)]'}`} />
              </button>
            </div>

            {/* Create */}
            <button
              onClick={handleCreate}
              disabled={loading || (passwordEnabled && !password)}
              className="flex w-full items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-3 text-xs font-bold text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create share link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
