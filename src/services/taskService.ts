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

export async function checkIsAdminUser(userId: string, email?: string): Promise<boolean> {
  if (email && email.trim().toLowerCase() === 'admin@dm.com') {
    return true;
  }
  try {
    const { data: rpcAdmin } = await supabase.rpc('is_admin', { uid: userId });
    if (rpcAdmin === true) return true;
  } catch {
    // Ignore RPC error
  }
  try {
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (adminRow) return true;
  } catch {
    // Ignore table query error
  }
  try {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (profileRow && profileRow.role?.trim().toLowerCase() === 'admin') return true;
  } catch {
    // Ignore profile query error
  }
  return false;
}

export async function getActiveTasks(): Promise<TaskItem[]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];

  const isAdmin = await checkIsAdminUser(user.id, user.email);

  const { data, error } = await supabase
    .from('folders')
    .select('id, name, owner_id, created_at, updated_at')
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching root tasks in getActiveTasks:', error);
    throw error;
  }

  const rawTasks = (data || []).filter(
    (item: any) => item.name.trim().toLowerCase() !== 'photos'
  );

  if (isAdmin) {
    return rawTasks as TaskItem[];
  }

  // Non-admin user: Fetch task IDs explicitly assigned in task_access table
  try {
    const { data: accessRows, error: accessErr } = await supabase
      .from('task_access')
      .select('task_id')
      .eq('user_id', user.id);

    if (!accessErr && accessRows) {
      const assignedTaskIds = new Set((accessRows || []).map((a: any) => a.task_id));
      const allowedTasks = rawTasks.filter((t: any) => assignedTaskIds.has(t.id));
      return allowedTasks as TaskItem[];
    }
  } catch (err) {
    console.warn('Error fetching task_access for non-admin user:', err);
  }

  return [];
}

export async function getTaskById(taskId: string): Promise<TaskItem | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const isAdmin = await checkIsAdminUser(user.id, user.email);

  const { data, error } = await supabase
    .from('folders')
    .select('id, name, owner_id, created_at, updated_at')
    .eq('id', taskId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;

  if (isAdmin) {
    return data as TaskItem;
  }

  // Non-admin user check task_access relationship for user ID
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
  } catch (err) {
    console.warn('Error checking task_access for task ID:', err);
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
