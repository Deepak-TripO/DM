import { Header } from '@/components/Header';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getStorageQuota } from '@/services/profileService';
import { formatBytes } from '@/utils';
import { Sun, Moon, Monitor, HardDrive, Info } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const { data: quota } = useQuery({
    queryKey: ['storageQuota', user?.id],
    queryFn: () => getStorageQuota(user!.id),
    enabled: !!user,
  });

  const usedPercent = quota ? Math.min((quota.used_bytes / quota.quota_bytes) * 100, 100) : 0;

  return (
    <div className="flex flex-col">
      <Header title="Settings" />
      <div className="mx-auto w-full max-w-lg p-4 md:p-6 space-y-6">
        {/* Appearance */}
        <div className="rounded-3xl neu-card p-6">
          <h3 className="mb-4 text-sm font-bold text-[var(--color-text-primary)]">Appearance Theme</h3>
          <div className="flex gap-3">
            {([
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ] as const).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-2xl py-3.5 text-xs font-bold transition-all ${
                  theme === value
                    ? 'neu-active text-[var(--color-primary)] font-extrabold'
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Storage */}
        {quota && (
          <div className="rounded-3xl neu-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
                  <HardDrive className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Storage Quota</h3>
              </div>
              <span className="text-xs font-bold text-[var(--color-primary)]">{usedPercent.toFixed(1)}%</span>
            </div>
            <div className="mb-2 h-3 neu-progress-track">
              <div className="h-full neu-progress-bar" style={{ width: `${usedPercent}%` }} />
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {formatBytes(quota.used_bytes)} used of {formatBytes(quota.quota_bytes)}
            </p>
          </div>
        )}

        {/* About */}
        <div className="rounded-3xl neu-card p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
              <Info className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Application Info</h3>
          </div>
          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
              <span className="text-[var(--color-text-secondary)]">Application Name</span>
              <span className="text-[var(--color-text-primary)] font-bold">DM Cloud Storage</span>
            </div>
            <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
              <span className="text-[var(--color-text-secondary)]">Version</span>
              <span className="text-[var(--color-text-primary)] font-bold">1.0.0</span>
            </div>
            <div className="flex justify-between items-center neu-pressed p-3 rounded-xl">
              <span className="text-[var(--color-text-secondary)]">Architecture</span>
              <span className="text-[var(--color-text-primary)] font-bold">Progressive Web App</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
