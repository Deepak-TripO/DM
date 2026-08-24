import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSystemSettings, updateGlobalDefaultQuota } from '@/services/adminService';
import { Settings, Shield, HardDrive, Users, Link2, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const [defaultQuotaInputGB, setDefaultQuotaInputGB] = useState('10');
  const [savingSettings, setSavingSettings] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSystemSettings'],
    queryFn: getSystemSettings,
  });

  useEffect(() => {
    if (settings?.default_quota_bytes) {
      setDefaultQuotaInputGB(String(Math.round((settings.default_quota_bytes / (1024 * 1024 * 1024)) * 10) / 10));
    }
  }, [settings]);

  const handleSaveGeneral = async () => {
    const gbVal = parseFloat(defaultQuotaInputGB);
    if (isNaN(gbVal) || gbVal <= 0) {
      toast.error('Please enter a valid positive quota in GB');
      return;
    }

    setSavingSettings(true);
    try {
      const quotaBytes = Math.round(gbVal * 1024 * 1024 * 1024);
      await updateGlobalDefaultQuota(quotaBytes, 'new');
      queryClient.invalidateQueries({ queryKey: ['adminSystemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['adminStorageUsers'] });
      toast.success('Admin system settings saved successfully');
    } catch {
      toast.error('Failed to save admin settings');
    }
    setSavingSettings(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Admin Settings</h1>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Platform configuration, storage policies, sharing security, and global administration controls</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-xs font-semibold text-[var(--color-text-tertiary)]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)] mr-2" />
          Loading admin settings...
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {/* SECTION 1: GENERAL */}
          <div className="rounded-3xl neu-card p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-blue-500">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">GENERAL</h2>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Application & system environment specifications</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl neu-pressed p-4 space-y-1">
                <span className="text-[var(--color-text-tertiary)] font-semibold">Application Name</span>
                <p className="font-extrabold text-[var(--color-text-primary)] text-sm">DM Cloud Platform</p>
              </div>

              <div className="rounded-2xl neu-pressed p-4 space-y-1">
                <span className="text-[var(--color-text-tertiary)] font-semibold">Admin Panel Version</span>
                <p className="font-extrabold text-[var(--color-text-primary)] text-sm">v2.4.0-Enterprise</p>
              </div>

              <div className="rounded-2xl neu-pressed p-4 space-y-1">
                <span className="text-[var(--color-text-tertiary)] font-semibold">Backend Provider</span>
                <p className="font-extrabold text-[var(--color-text-primary)] text-sm">Supabase PostgREST + Realtime</p>
              </div>

              <div className="rounded-2xl neu-pressed p-4 space-y-1">
                <span className="text-[var(--color-text-tertiary)] font-semibold">Authorization Guard</span>
                <p className="font-extrabold text-emerald-500 text-sm">Database-Backed (RLS + RPC)</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: USER MANAGEMENT */}
          <div className="rounded-3xl neu-card p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-purple-500">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">USER MANAGEMENT</h2>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Default user provisioning and initial quota limits</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-[var(--color-text-primary)]">Default User Storage Quota (GB):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={defaultQuotaInputGB}
                    onChange={(e) => setDefaultQuotaInputGB(e.target.value)}
                    className="w-36 rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] font-bold"
                  />
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">GB</span>
                </div>
                <p className="text-[11px] font-medium text-[var(--color-text-tertiary)]">Newly registered accounts will receive this storage quota automatically.</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: STORAGE */}
          <div className="rounded-3xl neu-card p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-indigo-500">
                <HardDrive className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">STORAGE</h2>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Global storage thresholds and file limits</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Max Upload File Size</span>
                <span className="font-bold text-[var(--color-text-primary)]">5.0 GB per file</span>
              </div>
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Trash Retention Period</span>
                <span className="font-bold text-[var(--color-text-primary)]">30 Days</span>
              </div>
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Supported MIME Types</span>
                <span className="font-bold text-[var(--color-text-primary)]">All (Documents, Images, Audio, Video, Archives)</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: SHARING */}
          <div className="rounded-3xl neu-card p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-amber-500">
                <Link2 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">SHARING</h2>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Public sharing link policies & password configurations</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Public Share Links Allowed</span>
                <span className="font-extrabold text-emerald-500">Enabled</span>
              </div>
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Password Protection Option</span>
                <span className="font-extrabold text-emerald-500">Enabled</span>
              </div>
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Admin Override Revocation</span>
                <span className="font-extrabold text-emerald-500">Instant Database Invalidation</span>
              </div>
            </div>
          </div>

          {/* SECTION 5: SECURITY */}
          <div className="rounded-3xl neu-card p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-red-500">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">SECURITY</h2>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Administrative security enforcement and RLS access control</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Admin Verification Mode</span>
                <span className="font-bold text-[var(--color-text-primary)]">admin_users table + SECURITY DEFINER RPC</span>
              </div>
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Row Level Security (RLS)</span>
                <span className="font-extrabold text-emerald-500">Enforced on all tables</span>
              </div>
              <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
                <span className="text-[var(--color-text-secondary)]">Unauthorized Route Guarding</span>
                <span className="font-bold text-[var(--color-text-primary)]">Access Denied View</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveGeneral}
              disabled={savingSettings}
              className="flex items-center gap-2 rounded-xl neu-btn-primary px-6 py-3 text-xs font-bold text-white disabled:opacity-60"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Admin Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
