import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar, getStorageQuota } from '@/services/profileService';
import { Header } from '@/components/Header';
import { ProfileSkeleton } from '@/components/LoadingSkeleton';
import { formatBytes, formatDate } from '@/utils';
import { Camera, Loader2, HardDrive, User, Calendar, Mail, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updatePassword, updateEmail } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile && !editing) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile, editing]);

  const { data: quota } = useQuery({
    queryKey: ['storageQuota', user?.id],
    queryFn: () => getStorageQuota(user!.id),
    enabled: !!user,
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { avatar_url: url });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { full_name: fullName, username, bio });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully');
      setChangingPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setPasswordLoading(false);
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setEmailLoading(true);
    const { error } = await updateEmail(newEmail);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email update request sent');
      setChangingEmail(false);
      setNewEmail('');
    }
    setEmailLoading(false);
  };

  const usedPercent = quota ? Math.min((quota.used_bytes / quota.quota_bytes) * 100, 100) : 0;

  if (loadingProfile) {
    return <div className="flex flex-col"><Header title="Profile" /><ProfileSkeleton /></div>;
  }

  return (
    <div className="flex flex-col">
      <Header title="Profile" />
      <div className="mx-auto w-full max-w-lg p-4 md:p-6 space-y-6">
        {/* Avatar */}
        <div className="mb-2 flex items-center gap-5 neu-card p-6 rounded-3xl">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full neu-circle">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-[var(--color-primary)]" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full neu-circle bg-[var(--color-primary)] text-white hover:scale-105"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">{profile?.full_name || 'User'}</h2>
            <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">{user?.email}</p>
          </div>
        </div>

        {/* Profile fields */}
        <div className="space-y-4 rounded-3xl neu-card p-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setEditing(true); }}
              className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Username</label>
            <input
              value={username}
              onChange={(e) => { setUsername(e.target.value); setEditing(true); }}
              className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => { setBio(e.target.value); setEditing(true); }}
              rows={3}
              className="w-full resize-none rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
            />
          </div>

          {editing && (
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setEditing(false); setFullName(profile?.full_name || ''); setUsername(profile?.username || ''); setBio(profile?.bio || ''); }} className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)]">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
            <Calendar className="h-3.5 w-3.5" />
            Joined {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
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
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Storage Quota</span>
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

        {/* Admin ID / Login Email */}
        <div className="rounded-3xl neu-card p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
              <Mail className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Account Email</h3>
          </div>
          {changingEmail ? (
            <div className="space-y-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New login email"
                className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
              />
              <div className="flex gap-3">
                <button onClick={() => setChangingEmail(false)} className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)]">Cancel</button>
                <button onClick={handleEmailChange} disabled={emailLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {emailLoading && <Loader2 className="h-4 w-4 animate-spin" />} Update Email
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{user?.email}</span>
              <button onClick={() => setChangingEmail(true)} className="rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-text-primary)]">Change Email</button>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="rounded-3xl neu-card p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)]">
              <Key className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Security & Password</h3>
          </div>
          {changingPassword ? (
            <div className="space-y-3">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]" />
              <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]" />
              <div className="flex gap-3">
                <button onClick={() => setChangingPassword(false)} className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-sm font-bold text-[var(--color-text-primary)]">Cancel</button>
                <button onClick={handlePasswordChange} disabled={passwordLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />} Update Password
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setChangingPassword(true)} className="rounded-xl neu-btn px-3.5 py-2 text-xs font-bold text-[var(--color-text-primary)]">Change Password</button>
          )}
        </div>
      </div>
    </div>
  );
}
