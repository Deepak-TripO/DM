import { supabase } from '@/lib/supabase/client';
import type { StorageQuota, Profile } from '@/types';

export async function getUserAccountState(userId: string): Promise<{ isDisabled: boolean; approvalStatus: 'pending' | 'approved' }> {
  if (!userId) return { isDisabled: false, approvalStatus: 'approved' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_disabled, approval_status')
      .eq('id', userId);

    if (error || !data || data.length === 0) {
      return { isDisabled: false, approvalStatus: 'approved' };
    }

    const row = data[0];
    return {
      isDisabled: !!row.is_disabled,
      approvalStatus: row.approval_status === 'pending' ? 'pending' : 'approved',
    };
  } catch {
    return { isDisabled: false, approvalStatus: 'approved' };
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as Profile;
    }
  } catch {
    // Ignore fetch error
  }

  // Auto-create default profile if missing to prevent 406 / null crashes
  try {
    const { data: userData } = await supabase.auth.getUser();
    const defaultProfile = {
      id: userId,
      full_name: userData.user?.user_metadata?.full_name || 'User',
      username: userData.user?.email?.split('@')[0] || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .upsert(defaultProfile)
      .select()
      .maybeSingle();

    if (!insertErr && newProfile) {
      return newProfile as Profile;
    }
  } catch {
    // Ignore upsert fallback error
  }

  return null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'username' | 'bio' | 'avatar_url'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error || !data) throw error || new Error('Failed to update profile');
  return data as Profile;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function getStorageQuota(userId: string): Promise<StorageQuota | null> {
  const { data, error } = await supabase
    .from('storage_quotas')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return null;

  if (!data) {
    // Auto-create default 10GB quota if missing for existing user
    const defaultQuota = {
      user_id: userId,
      quota_bytes: 10737418240, // 10 GB
      used_bytes: 0,
      is_custom: false,
    };
    const { data: inserted } = await supabase
      .from('storage_quotas')
      .upsert(defaultQuota)
      .select()
      .maybeSingle();

    return (inserted as StorageQuota) || (defaultQuota as StorageQuota);
  }

  return data as StorageQuota;
}

export async function checkStorageAvailable(userId: string, fileSize: number): Promise<boolean> {
  const quota = await getStorageQuota(userId);
  if (!quota) return true; // Allow if fallback
  return (quota.used_bytes + fileSize) <= quota.quota_bytes;
}
