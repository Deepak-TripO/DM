import { supabase } from '@/lib/supabase/client';
import type { FileItem } from '@/types';

export async function uploadFile(
  userId: string,
  file: File,
  folderId: string | null,
  onProgress?: (progress: number) => void
): Promise<FileItem> {
  const fileId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const storagePath = `users/${userId}/files/${fileId}/${file.name}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Simulate progress since Supabase JS doesn't have native progress
  onProgress?.(100);

  // Insert file metadata
  const { data, error } = await supabase
    .from('files')
    .insert({
      id: fileId,
      owner_id: userId,
      folder_id: folderId,
      name: file.name,
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      extension: ext,
      size_bytes: file.size,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    // Rollback: delete uploaded file
    await supabase.storage.from('files').remove([storagePath]);
    throw error;
  }

  // Update storage usage
  await supabase.rpc('update_storage_used', {
    target_user_id: userId,
    delta: file.size,
  });

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'file_upload',
    file_id: fileId,
    metadata: { name: file.name, size: file.size },
  });

  return data as FileItem;
}

export async function getFiles(
  userId: string,
  folderId: string | null,
  options?: {
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    category?: string;
  }
): Promise<FileItem[]> {
  let query = supabase
    .from('files')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null);

  if (folderId) {
    query = query.eq('folder_id', folderId);
  } else {
    query = query.is('folder_id', null);
  }

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  if (options?.category) {
    const extensionMap: Record<string, string[]> = {
      image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      video: ['mp4', 'webm', 'mov', 'avi'],
      audio: ['mp3', 'wav', 'ogg', 'm4a'],
      document: ['doc', 'docx', 'odt', 'txt', 'rtf'],
      pdf: ['pdf'],
      spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
      presentation: ['ppt', 'pptx', 'odp'],
      archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    };
    const exts = extensionMap[options.category];
    if (exts) {
      query = query.in('extension', exts);
    }
  }

  const sortField = options?.sortField || 'created_at';
  const sortDirection = options?.sortDirection === 'asc';
  query = query.order(sortField, { ascending: sortDirection });

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FileItem[];
}

export async function getRecentFiles(userId: string, limit = 50): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as FileItem[];
}

export async function getStarredFiles(userId: string): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_starred', true)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []) as FileItem[];
}

export async function getTrashFiles(userId: string): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('owner_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return (data || []) as FileItem[];
}

export async function renameFile(fileId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', fileId);
  if (error) throw error;
}

export async function moveFile(fileId: string, folderId: string | null): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .eq('id', fileId);
  if (error) throw error;
}

export async function toggleStarFile(fileId: string, starred: boolean): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ is_starred: starred, updated_at: new Date().toISOString() })
    .eq('id', fileId);
  if (error) throw error;
}

export async function softDeleteFile(fileId: string): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', fileId);
  if (error) throw error;
}

export async function restoreFile(fileId: string): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ deleted_at: null })
    .eq('id', fileId);
  if (error) throw error;
}

export async function permanentDeleteFile(userId: string, file: FileItem): Promise<void> {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('files')
    .remove([file.storage_path]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', file.id);

  if (dbError) throw dbError;

  // Update storage usage
  await supabase.rpc('update_storage_used', {
    target_user_id: userId,
    delta: -file.size_bytes,
  });
}

export async function getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from('files')
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

export async function downloadFile(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from('files')
    .download(storagePath);

  if (error) throw error;
  return data;
}

export async function searchFiles(userId: string, query: string): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .ilike('name', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as FileItem[];
}
