import { supabase } from '@/lib/supabase/client';
import type { FolderItem } from '@/types';

export async function getFolders(
  userId: string,
  parentId: string | null
): Promise<FolderItem[]> {
  let query = supabase
    .from('folders')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FolderItem[];
}

export async function getFolderById(
  folderId: string,
  userId: string
): Promise<FolderItem | null> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', folderId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return data as FolderItem;
}

export async function getAllFolders(userId: string): Promise<FolderItem[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as FolderItem[];
}

export async function createFolder(
  userId: string,
  name: string,
  parentId: string | null
): Promise<FolderItem> {
  const { data, error } = await supabase
    .from('folders')
    .insert({
      owner_id: userId,
      parent_id: parentId,
      name,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'folder_create',
    folder_id: data.id,
    metadata: { name },
  });

  return data as FolderItem;
}

export async function renameFolder(folderId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function moveFolder(folderId: string, parentId: string | null): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ parent_id: parentId, updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function toggleStarFolder(folderId: string, starred: boolean): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ is_starred: starred, updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function softDeleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function restoreFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ deleted_at: null })
    .eq('id', folderId);
  if (error) throw error;
}

export async function permanentDeleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);
  if (error) throw error;
}

export async function getTrashFolders(userId: string): Promise<FolderItem[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('owner_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return (data || []) as FolderItem[];
}

export async function getStarredFolders(userId: string): Promise<FolderItem[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_starred', true)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as FolderItem[];
}

export async function getFolderBreadcrumbs(folderId: string): Promise<{ id: string; name: string }[]> {
  const breadcrumbs: { id: string; name: string }[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const { data: folderData, error } = await supabase
      .from('folders')
      .select('id, name, parent_id')
      .eq('id', currentId)
      .single();

    if (error || !folderData) break;
    const f = folderData as { id: string; name: string; parent_id: string | null };
    breadcrumbs.unshift({ id: f.id, name: f.name });
    currentId = f.parent_id;
  }

  return breadcrumbs;
}

export async function searchFolders(userId: string, query: string): Promise<FolderItem[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) throw error;
  return (data || []) as FolderItem[];
}
