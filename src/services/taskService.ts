import { supabase } from '@/lib/supabase/client';
import type { FileItem } from '@/types';

export interface TaskItem {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  status?: 'active' | 'inactive';
}

export async function getActiveTasks(): Promise<TaskItem[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('id, name, owner_id, created_at, updated_at')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as TaskItem[];
}

export async function getTaskById(taskId: string): Promise<TaskItem | null> {
  const { data, error } = await supabase
    .from('folders')
    .select('id, name, owner_id, created_at, updated_at')
    .eq('id', taskId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return data as TaskItem;
}

export async function getTaskFiles(taskId: string): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('folder_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as FileItem[];
}
