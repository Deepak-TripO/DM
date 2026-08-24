import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminShares, revokeAdminShare, type AdminShareItem } from '@/services/adminService';
import { formatDate } from '@/utils';
import { Link2, ShieldCheck, Download, Calendar, Loader2, X, Eye } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function AdminShares() {
  const queryClient = useQueryClient();
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [viewingShare, setViewingShare] = useState<AdminShareItem | null>(null);

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['adminShares'],
    queryFn: getAdminShares,
  });

  const handleRevoke = async () => {
    if (!revokeId) return;
    try {
      await revokeAdminShare(revokeId);
      queryClient.invalidateQueries({ queryKey: ['adminShares'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
      setRevokeId(null);
      toast.success('Shared link revoked immediately');
    } catch {
      toast.error('Failed to revoke shared link');
    }
  };

  const getStatus = (s: AdminShareItem) => {
    if (s.revoked_at) return { label: 'Revoked', cls: 'text-red-600 bg-red-50 dark:bg-red-950/30' };
    if (s.expires_at && new Date(s.expires_at) < new Date()) return { label: 'Expired', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' };
    return { label: 'Active', cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' };
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Shared Links Administration</h1>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Manage active and revoked public share links, password protections, and expirations</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-xs font-semibold text-[var(--color-text-tertiary)]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)] mr-2" />
          Loading shared links...
        </div>
      ) : shares.length === 0 ? (
        <EmptyState icon={Link2} title="No shared links found" description="Public shared links created by users will be listed here." />
      ) : (
        <div className="rounded-3xl neu-card p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border-light)]/40 text-[var(--color-text-tertiary)] uppercase font-extrabold tracking-wider">
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Protection Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]/20">
                {shares.map((s) => {
                  const status = getStatus(s);

                  return (
                    <tr key={s.id} className="transition-all hover:neu-pressed">
                      {/* Resource */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)] shrink-0">
                            <Link2 className="h-4 w-4 text-[var(--color-primary)]" />
                          </div>
                          <span className="font-bold text-[var(--color-text-primary)] truncate max-w-xs">{s.resource_name}</span>
                          <span className="rounded-full neu-badge px-2 py-0.5 text-[9px] font-extrabold text-[var(--color-text-secondary)] uppercase">
                            {s.resource_type}
                          </span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-bold">
                        {s.owner_name}
                      </td>

                      {/* Protection Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {s.password_enabled ? (
                            <span className="inline-flex items-center gap-1 rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold text-indigo-500">
                              <ShieldCheck className="h-3 w-3" />
                              Password
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-tertiary)] font-semibold text-[11px]">Public Link</span>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-[var(--color-text-tertiary)] font-semibold whitespace-nowrap">
                        {formatDate(s.created_at)}
                      </td>

                      {/* Expiration */}
                      <td className="px-4 py-3 text-[var(--color-text-tertiary)] font-semibold whitespace-nowrap">
                        {s.expires_at ? formatDate(s.expires_at) : 'Never'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`rounded-full neu-badge px-2.5 py-0.5 text-[10px] font-bold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingShare(s)}
                            className="h-8 w-8 neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                            title="View Share Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {!s.revoked_at && (
                            <button
                              onClick={() => setRevokeId(s.id)}
                              className="rounded-xl neu-btn-danger px-3 py-1 text-xs font-bold text-red-500"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Share Details Modal */}
      {viewingShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setViewingShare(null)} />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Share Link Details</h3>
              <button onClick={() => setViewingShare(null)} className="h-8 w-8 neu-circle text-[var(--color-text-tertiary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Share Token</span><span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">{viewingShare.token}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Resource</span><span className="font-bold text-[var(--color-text-primary)]">{viewingShare.resource_name}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Resource Type</span><span className="font-bold text-[var(--color-text-primary)] uppercase">{viewingShare.resource_type}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Owner</span><span className="font-bold text-[var(--color-text-primary)]">{viewingShare.owner_name}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Password Protected</span><span className="font-bold text-[var(--color-text-primary)]">{viewingShare.password_enabled ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Allow Download</span><span className="font-bold text-[var(--color-text-primary)]">{viewingShare.allow_download ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Created Date</span><span className="font-bold text-[var(--color-text-primary)]">{formatDate(viewingShare.created_at)}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Expiration Date</span><span className="font-bold text-[var(--color-text-primary)]">{viewingShare.expires_at ? formatDate(viewingShare.expires_at) : 'None'}</span></div>
              <div className="flex justify-between neu-pressed p-2.5 rounded-xl"><span className="text-[var(--color-text-tertiary)]">Revoked Date</span><span className="font-bold text-[var(--color-text-primary)]">{viewingShare.revoked_at ? formatDate(viewingShare.revoked_at) : 'Not Revoked'}</span></div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--color-border-light)]/40">
              <button
                onClick={() => setViewingShare(null)}
                className="rounded-xl neu-btn px-4 py-2 font-bold text-[var(--color-text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        onConfirm={handleRevoke}
        title="Revoke shared link?"
        description="Anyone holding this link will immediately lose access."
        confirmLabel="Revoke link"
      />
    </div>
  );
}
