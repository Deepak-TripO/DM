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

export async function setupTaskPermissionsForUser(
  userId: string,
  allowedKeywords: string[] = ['tripo', 'freelance']
): Promise<void> {
  try {
    const { data: rootTasks } = await supabase
      .from('folders')
      .select('id, name')
      .is('parent_id', null)
      .is('deleted_at', null);

    if (!rootTasks) return;

    const allowedTaskIds: string[] = [];
    rootTasks.forEach((t) => {
      const nameLower = t.name.trim().toLowerCase().replace(/\s+/g, '');
      const isAllowed = allowedKeywords.some((kw) => nameLower.includes(kw));
      if (isAllowed) {
        allowedTaskIds.push(t.id);
      }
    });

    // Remove task_access entries that are NOT in allowedTaskIds for this user
    const { data: existingAccess } = await supabase
      .from('task_access')
      .select('id, task_id')
      .eq('user_id', userId);

    if (existingAccess) {
      for (const acc of existingAccess) {
        if (!allowedTaskIds.includes(acc.task_id)) {
          await supabase.from('task_access').delete().eq('id', acc.id);
        }
      }
    }

    // Insert task_access entries for allowed tasks
    for (const taskId of allowedTaskIds) {
      await supabase.from('task_access').upsert(
        { task_id: taskId, user_id: userId },
        { onConflict: 'task_id,user_id' }
      );
    }
  } catch (err) {
    console.warn('Error setting up task permissions for user:', err);
  }
}

export async function getActiveTasks(): Promise<TaskItem[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('folders')
    .select('id, name, owner_id, created_at, updated_at')
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;

  const rawTasks = (data || []).filter(
    (item: any) => item.name.trim().toLowerCase() !== 'photos'
  );

  if (!user) return [];

  // Check if current user is authorized admin
  try {
    const { data: rpcAdmin } = await supabase.rpc('is_admin', { uid: user.id });
    if (rpcAdmin === true) {
      return rawTasks as TaskItem[];
    }
  } catch {
    // Ignore RPC error
  }

  // Non-admin user: Fetch task IDs explicitly assigned in task_access table
  try {
    const { data: accessRows, error: accessErr } = await supabase
      .from('task_access')
      .select('task_id')
      .eq('user_id', user.id);

    if (!accessErr && accessRows) {
      const assignedTaskIds = new Set((accessRows || []).map((a: any) => a.task_id));
      const allowedTasks = rawTasks.filter(
        (t: any) => t.owner_id === user.id || assignedTaskIds.has(t.id)
      );
      return allowedTasks as TaskItem[];
    }
  } catch {
    // Fallback if task_access table is not created yet
  }

  return rawTasks as TaskItem[];
}

export async function getTaskById(taskId: string): Promise<TaskItem | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('folders')
    .select('id, name, owner_id, created_at, updated_at')
    .eq('id', taskId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;

  // Check if user is authorized admin
  try {
    const { data: rpcAdmin } = await supabase.rpc('is_admin', { uid: user.id });
    if (rpcAdmin === true) {
      return data as TaskItem;
    }
  } catch {
    // Ignore RPC error
  }

  // Owner check
  if (data.owner_id === user.id) {
    return data as TaskItem;
  }

  // Check task_access relationship for user ID
  try {
    const { data: accessRows, error: accessErr } = await supabase
      .from('task_access')
      .select('id, task_id')
      .eq('user_id', user.id);

    if (!accessErr && accessRows) {
      const hasAccess = accessRows.some((a: any) => a.task_id === taskId);
      if (hasAccess) {
        return data as TaskItem;
      }
      // Access Denied: task_access exists for this user, but this specific task is not assigned
      return null;
    }
  } catch {
    // Fallback if task_access table is not created yet
  }

  // Default fallback for legacy tasks if user has no task_access entries
  if (data.name.trim().toLowerCase() === 'finance') {
    return data as TaskItem;
  }

  return null;
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
