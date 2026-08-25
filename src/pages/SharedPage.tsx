import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserShares, revokeShare } from '@/services/shareService';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { FileIcon } from '@/components/FileIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import { Share2, Link2, Copy, ShieldCheck, Calendar, Download, XCircle, Folder } from 'lucide-react';
import { toast } from 'sonner';
import type { ShareItem } from '@/types';
import { useAppLayout } from '@/layouts/AppLayout';

const TABS = ['All', 'Files', 'Image', 'Video', 'Audio', 'Revoked'] as const;

export default function SharedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sidebarOpen, toggleSidebar } = useAppLayout();
  const [tab, setTab] = useState<typeof TABS[number]>('All');
  const [revokeItem, setRevokeItem] = useState<ShareItem | null>(null);

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['userShares', user?.id],
    queryFn: () => getUserShares(user!.id),
    enabled: !!user,
  });

  const filteredShares = shares.filter((s) => {
    const isRevoked = !!s.revoked_at;
    const ext = (s.file?.extension || '').toLowerCase();

    switch (tab) {
      case 'Files':
        return ['pdf', 'jpg', 'jpeg', 'docx', 'doc', 'txt'].includes(ext) || !!s.file_id;
      case 'Image':
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
      case 'Video':
        return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
      case 'Audio':
        return ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext);
      case 'Revoked':
        return isRevoked;
      default:
        return true;
    }
  });

  const handleCopyLink = (share: ShareItem) => {
    const url = `${window.location.origin}/share/${share.token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleRevoke = async () => {
    if (!revokeItem) return;
    try {
      await revokeShare(revokeItem.id);
      queryClient.invalidateQueries({ queryKey: ['userShares'] });
      setRevokeItem(null);
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke');
    }
  };

  const getStatus = (share: ShareItem) => {
    if (share.revoked_at) return { label: 'Revoked', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    if (share.expires_at && new Date(share.expires_at) < new Date()) return { label: 'Expired', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
    return { label: 'Active', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' };
  };

  return (
    <div className="flex flex-col">
      <Header title="Shared" onLogoClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <div className="p-4 md:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === t
                  ? 'neu-active text-[var(--color-primary)] font-extrabold'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl neu-pressed opacity-50" />
            ))}
          </div>
        ) : filteredShares.length === 0 ? (
          <EmptyState icon={Share2} title="No shared items" description="Share files or folders to see them here." />
        ) : (
          <div className="space-y-3">
            {filteredShares.map((share) => {
              const status = getStatus(share);
              const name = share.file?.name || share.folder?.name || 'Unknown';
              const ext = share.file?.extension || '';

              return (
                <div key={share.id} className="flex items-center gap-4 rounded-2xl neu-card p-4">
                  {share.file_id ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-pressed shrink-0">
                      <FileIcon extension={ext} size="md" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-circle shrink-0 text-blue-500">
                      <Folder className="h-6 w-6 text-blue-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[var(--color-text-tertiary)]">
                      <span className={`inline-flex rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold ${status.color}`}>{status.label}</span>
                      {share.password_enabled && <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Password</span>}
                      {share.expires_at && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(share.expires_at)}</span>}
                      {share.allow_download && <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> Download</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCopyLink(share)} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]" aria-label="Copy link">
                      <Copy className="h-4 w-4" />
                    </button>
                    {!share.revoked_at && (
                      <button onClick={() => setRevokeItem(share)} className="h-9 w-9 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]" aria-label="Revoke link">
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!revokeItem}
        onClose={() => setRevokeItem(null)}
        onConfirm={handleRevoke}
        title="Revoke shared link?"
        description="Anyone using this link will immediately lose access."
        confirmLabel="Revoke link"
      />
    </div>
  );
}
