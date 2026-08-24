import { supabase } from '@/lib/supabase/client';
import type { ShareItem } from '@/types';
import { generateShareToken } from '@/utils';

export async function createShare(params: {
  ownerId: string;
  fileId?: string;
  folderId?: string;
  passwordEnabled: boolean;
  password?: string;
  allowDownload: boolean;
  expiresAt?: string;
}): Promise<ShareItem> {
  const token = generateShareToken();

  const insertData: Record<string, unknown> = {
    owner_id: params.ownerId,
    token,
    password_enabled: params.passwordEnabled,
    allow_download: params.allowDownload,
    expires_at: params.expiresAt || null,
  };

  if (params.fileId) insertData.file_id = params.fileId;
  if (params.folderId) insertData.folder_id = params.folderId;

  // Hash password if provided
  if (params.passwordEnabled && params.password) {
    // Use pgcrypto via RPC or store hashed
    insertData.password_hash = params.password; // Will be hashed by DB trigger
  }

  const { data, error } = await supabase
    .from('shares')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('activity_logs').insert({
    user_id: params.ownerId,
    action: 'share_create',
    file_id: params.fileId || null,
    folder_id: params.folderId || null,
    metadata: { token: token.slice(0, 8) + '...' },
  });

  return data as ShareItem;
}

export async function getUserShares(userId: string): Promise<ShareItem[]> {
  const { data, error } = await supabase
    .from('shares')
    .select('*, file:files(*), folder:folders(*)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ShareItem[];
}

export async function getShareByToken(token: string): Promise<ShareItem | null> {
  const { data, error } = await supabase
    .from('shares')
    .select('*, file:files(*), folder:folders(*)')
    .eq('token', token)
    .is('revoked_at', null)
    .single();

  if (error) return null;

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data as ShareItem;
}

export async function revokeShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from('shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', shareId);
  if (error) throw error;
}

export async function updateSharePassword(shareId: string, password: string | null): Promise<void> {
  const { error } = await supabase
    .from('shares')
    .update({
      password_hash: password,
      password_enabled: !!password,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shareId);
  if (error) throw error;
}

export async function updateShareSettings(
  shareId: string,
  updates: {
    allowDownload?: boolean;
    expiresAt?: string | null;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.allowDownload !== undefined) updateData.allow_download = updates.allowDownload;
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;

  const { error } = await supabase
    .from('shares')
    .update(updateData)
    .eq('id', shareId);
  if (error) throw error;
}

export async function verifySharePassword(token: string, password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('verify_share_password', {
      share_token: token,
      password,
    });
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

export async function logShareAccess(shareId: string): Promise<void> {
  await supabase.from('share_access_logs').insert({
    share_id: shareId,
    metadata: {
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getFileShareByFileId(fileId: string): Promise<ShareItem | null> {
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('file_id', fileId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as ShareItem | null;
}
