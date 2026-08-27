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
  _userId: string,
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
    const cat = options.category.toLowerCase();
    const extensionMap: Record<string, string[]> = {
      files: ['pdf', 'jpg', 'jpeg', 'docx', 'doc', 'txt'],
      file: ['pdf', 'jpg', 'jpeg', 'docx', 'doc', 'txt'],
      image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      images: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      video: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
      videos: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
      audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
      document: ['doc', 'docx', 'odt', 'txt', 'rtf'],
      pdf: ['pdf'],
    };
    const exts = extensionMap[cat];
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

export async function getFileById(fileId: string): Promise<FileItem | null> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return data as FileItem;
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

export interface UnifiedRecentItem {
  id: string;
  itemType: 'file' | 'finance';
  name: string;
  subtitle: string;
  extension?: string;
  mimeType?: string;
  sizeBytes?: number;
  updatedAt: string;
  file?: FileItem;
  financeEntry?: any;
}

export async function getRecentItems(_userId: string, limit = 50): Promise<UnifiedRecentItem[]> {
  // Fetch global files created by any user
  const { data: filesData } = await supabase
    .from('files')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(limit);

  // Fetch global finance entries
  const { data: financeData } = await supabase
    .from('finance_entries')
    .select('*')
    .is('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  const fileItems: UnifiedRecentItem[] = (filesData || []).map((f: FileItem) => ({
    id: `file-${f.id}`,
    itemType: 'file',
    name: f.name,
    subtitle: `${f.extension.toUpperCase()} · ${new Date(f.updated_at || f.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    extension: f.extension,
    mimeType: f.mime_type,
    sizeBytes: f.size_bytes,
    updatedAt: f.updated_at || f.created_at,
    file: f,
  }));

  const financeItems: UnifiedRecentItem[] = (financeData || []).map((fe: any) => ({
    id: `fin-${fe.id}`,
    itemType: 'finance',
    name: fe.item || 'Finance Entry',
    subtitle: `Finance · ${fe.category || 'Expense'} · ${fe.date || ''}`,
    updatedAt: fe.updated_at || fe.created_at || new Date().toISOString(),
    financeEntry: fe,
  }));

  // Merge and sort latest updated first
  const combined = [...fileItems, ...financeItems].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Deduplicate by ID
  const seen = new Set<string>();
  const deduplicated: UnifiedRecentItem[] = [];

  for (const item of combined) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduplicated.push(item);
    }
  }

  return deduplicated.slice(0, limit);
}

export async function saveExportedFileToShared(
  filename: string,
  blob: Blob,
  mimeType: string,
  previewUrl?: string
): Promise<FileItem | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileId = crypto.randomUUID();
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const storagePath = `users/${user.id}/files/${fileId}/${filename}`;
    const metaData = { is_export: true, preview_url: previewUrl || undefined };

    // Upload to 'files' bucket
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, blob, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Storage upload notice:', uploadError);
    }

    // Check existing
    const { data: existing } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', user.id)
      .eq('name', filename)
      .is('deleted_at', null)
      .maybeSingle();

    let targetFile: FileItem | null = null;

    if (existing) {
      const { data: updated } = await supabase
        .from('files')
        .update({
          storage_path: storagePath,
          mime_type: mimeType,
          extension: ext,
          size_bytes: blob.size,
          metadata: metaData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      targetFile = updated as FileItem;
    } else {
      const { data: inserted } = await supabase
        .from('files')
        .insert({
          id: fileId,
          owner_id: user.id,
          folder_id: null,
          name: filename,
          original_name: filename,
          storage_path: storagePath,
          mime_type: mimeType,
          extension: ext,
          size_bytes: blob.size,
          metadata: metaData,
        })
        .select()
        .single();
      targetFile = inserted as FileItem;
    }

    // Create share record so it automatically appears in Shared section
    if (targetFile) {
      const { createShare, getFileShareByFileId } = await import('./shareService');
      const existingShare = await getFileShareByFileId(targetFile.id);
      if (!existingShare) {
        await createShare({
          ownerId: user.id,
          fileId: targetFile.id,
          passwordEnabled: false,
          allowDownload: true,
        });
      }
    }

    return targetFile;
  } catch (err) {
    console.error('Error saving export to shared:', err);
    return null;
  }
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
  try {
    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUrl(storagePath, expiresIn);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch {}

  const { data: pubData } = supabase.storage
    .from('files')
    .getPublicUrl(storagePath);

  return pubData?.publicUrl || '';
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

export function subscribeToFilesChange(onUpdate: () => void) {
  const channel = supabase
    .channel('global-files-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'files' },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
