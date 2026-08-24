import { supabase } from '@/lib/supabase/client';
import type { StorageQuota, Profile } from '@/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
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
    .single();

  if (error) throw error;
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
