import { supabase } from '@/lib/supabase/client';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalUsed: number;
  totalAllocated: number;
  activeShares: number;
}

export interface AdminUserItem {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_disabled: boolean;
  created_at: string;
  used_bytes: number;
  quota_bytes: number;
  is_custom: boolean;
  file_count: number;
  email?: string;
  role?: string;
}

export interface AdminFileItem {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  created_at: string;
  deleted_at: string | null;
  owner_id: string;
  owner_name: string;
  is_starred: boolean;
}

export interface AdminShareItem {
  id: string;
  owner_id: string;
  owner_name: string;
  file_id: string | null;
  folder_id: string | null;
  resource_name: string;
  resource_type: 'file' | 'folder';
  token: string;
  password_enabled: boolean;
  allow_download: boolean;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface AdminActivityItem {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_name?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface SystemSettings {
  default_quota_bytes: number;
  app_name?: string;
  max_upload_size_mb?: number;
}

// 1. Fetch Overview Statistics
export async function getAdminOverviewStats(): Promise<AdminStats> {
  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('get_admin_overview_stats');
    if (!error && data) {
      return {
        totalUsers: Number(data.totalUsers || 0),
        activeUsers: Number(data.activeUsers || 0),
        totalFiles: Number(data.totalFiles || 0),
        totalUsed: Number(data.totalUsed || 0),
        totalAllocated: Number(data.totalAllocated || 0),
        activeShares: Number(data.activeShares || 0),
      };
    }
  } catch {
    // Fallback below
  }

  // Fallback direct queries
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalFiles },
    { data: storageData },
    { count: activeShares },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_disabled', false),
    supabase.from('files').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('storage_quotas').select('used_bytes, quota_bytes'),
    supabase.from('shares').select('*', { count: 'exact', head: true }).is('revoked_at', null),
  ]);

  const totalUsed = storageData?.reduce((sum, q) => sum + (q.used_bytes || 0), 0) || 0;
  const totalAllocated = storageData?.reduce((sum, q) => sum + (q.quota_bytes || 0), 0) || 0;

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers ?? totalUsers ?? 0,
    totalFiles: totalFiles || 0,
    totalUsed,
    totalAllocated,
    activeShares: activeShares || 0,
  };
}

// 2. User Management
export async function getAdminUsers(options?: {
  search?: string;
  statusFilter?: 'all' | 'active' | 'disabled' | 'custom_quota';
  sortBy?: 'created_at' | 'full_name' | 'used_bytes';
  sortOrder?: 'asc' | 'desc';
}): Promise<AdminUserItem[]> {
  const search = options?.search?.trim() || '';
  const statusFilter = options?.statusFilter || 'all';
  const sortBy = options?.sortBy || 'created_at';
  const sortOrder = options?.sortOrder || 'desc';

  let query = supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, is_disabled, created_at');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
  }

  if (statusFilter === 'active') {
    query = query.eq('is_disabled', false);
  } else if (statusFilter === 'disabled') {
    query = query.eq('is_disabled', true);
  }

  if (sortBy === 'created_at' || sortBy === 'full_name') {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  }

  const [{ data: profilesData, error: profileErr }, { data: quotasData }, { data: filesData }] = await Promise.all([
    query.limit(200),
    supabase.from('storage_quotas').select('user_id, quota_bytes, used_bytes, is_custom'),
    supabase.from('files').select('owner_id').is('deleted_at', null),
  ]);

  if (profileErr) throw profileErr;

  const quotaMap = new Map<string, { quota_bytes: number; used_bytes: number; is_custom: boolean }>();
  (quotasData || []).forEach((q: any) => {
    quotaMap.set(q.user_id, q);
  });

  const fileCountMap = new Map<string, number>();
  (filesData || []).forEach((f: any) => {
    if (f.owner_id) {
      fileCountMap.set(f.owner_id, (fileCountMap.get(f.owner_id) || 0) + 1);
    }
  });

  let result: AdminUserItem[] = (profilesData || []).map((p: any) => {
    const quotaObj = quotaMap.get(p.id);
    const fileCount = fileCountMap.get(p.id) || 0;

    return {
      id: p.id,
      full_name: p.full_name,
      username: p.username,
      avatar_url: p.avatar_url,
      is_disabled: !!p.is_disabled,
      created_at: p.created_at,
      used_bytes: quotaObj?.used_bytes || 0,
      quota_bytes: quotaObj?.quota_bytes || 10737418240,
      is_custom: !!quotaObj?.is_custom,
      file_count: fileCount,
      email: p.username ? `${p.username}@user.com` : undefined,
    };
  });

  if (statusFilter === 'custom_quota') {
    result = result.filter((u) => u.is_custom);
  }

  if (sortBy === 'used_bytes') {
    result.sort((a, b) => (sortOrder === 'asc' ? a.used_bytes - b.used_bytes : b.used_bytes - a.used_bytes));
  }

  return result;
}

// Update User Quota
export async function updateUserQuota(userId: string, quotaBytes: number): Promise<void> {
  const { error } = await supabase
    .from('storage_quotas')
    .upsert({
      user_id: userId,
      quota_bytes: quotaBytes,
      is_custom: true,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

// Toggle User Disabled Status
export async function toggleUserStatus(userId: string, disabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_disabled: disabled })
    .eq('id', userId);

  if (error) throw error;
}

// Fetch User Files for Admin Modal
export async function getUserFilesForAdmin(userId: string): Promise<AdminFileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('id, name, original_name, mime_type, extension, size_bytes, created_at, deleted_at, owner_id, is_starred')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((f: any) => ({
    ...f,
    owner_name: 'User',
  }));
}

// Fetch User Activity for Admin Modal
export async function getUserActivityForAdmin(userId: string): Promise<AdminActivityItem[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, user_id, action, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((l: any) => ({
    id: l.id,
    user_id: l.user_id,
    user_name: 'User',
    action: l.action,
    resource_name: l.metadata?.name || l.metadata?.filename,
    created_at: l.created_at,
    metadata: l.metadata || {},
  }));
}

// 3. Storage Control
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (!error && data) {
      const quotaSetting = data.find((s) => s.key === 'default_quota_bytes');
      return {
        default_quota_bytes: quotaSetting ? Number(quotaSetting.value) : 10737418240,
      };
    }
  } catch {
    // ignore
  }

  return { default_quota_bytes: 10737418240 };
}

export async function updateGlobalDefaultQuota(quotaBytes: number, scope: 'new' | 'no_custom' | 'all'): Promise<void> {
  try {
    const { error: rpcErr } = await supabase.rpc('update_default_quota', {
      new_quota: quotaBytes,
      scope,
    });
    if (!rpcErr) return;
  } catch {
    // fallback
  }

  // Fallback database updates
  await supabase
    .from('system_settings')
    .upsert({ key: 'default_quota_bytes', value: JSON.stringify(quotaBytes), updated_at: new Date().toISOString() });

  if (scope === 'all') {
    await supabase
      .from('storage_quotas')
      .update({ quota_bytes: quotaBytes, updated_at: new Date().toISOString() })
      .neq('user_id', '');
  } else if (scope === 'no_custom') {
    await supabase
      .from('storage_quotas')
      .update({ quota_bytes: quotaBytes, updated_at: new Date().toISOString() })
      .eq('is_custom', false);
  }
}

// Helper to load profile names map
async function fetchProfilesMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data } = await supabase.from('profiles').select('id, full_name');
    (data || []).forEach((p: any) => {
      if (p.id && p.full_name) {
        map.set(p.id, p.full_name);
      }
    });
  } catch {
    // ignore profile map errors
  }
  return map;
}

// 4. File Management
export async function getAdminFiles(): Promise<{
  files: AdminFileItem[];
  totalFiles: number;
  totalStorage: number;
  typeDistribution: { extension: string; count: number }[];
  largestFiles: AdminFileItem[];
  recentUploads: AdminFileItem[];
}> {
  const [{ data: filesData, error }, profileMap] = await Promise.all([
    supabase
      .from('files')
      .select('id, name, original_name, mime_type, extension, size_bytes, created_at, deleted_at, owner_id, is_starred')
      .order('created_at', { ascending: false })
      .limit(300),
    fetchProfilesMap(),
  ]);

  if (error) throw error;

  const files: AdminFileItem[] = (filesData || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    original_name: f.original_name,
    mime_type: f.mime_type,
    extension: f.extension,
    size_bytes: Number(f.size_bytes || 0),
    created_at: f.created_at,
    deleted_at: f.deleted_at,
    owner_id: f.owner_id,
    owner_name: profileMap.get(f.owner_id) || 'System User',
    is_starred: !!f.is_starred,
  }));

  const totalFiles = files.filter((f) => !f.deleted_at).length;
  const totalStorage = files.reduce((sum, f) => sum + f.size_bytes, 0);

  const counts: Record<string, number> = {};
  files.forEach((f) => {
    const ext = (f.extension || 'other').toLowerCase();
    counts[ext] = (counts[ext] || 0) + 1;
  });

  const typeDistribution = Object.entries(counts)
    .map(([extension, count]) => ({ extension, count }))
    .sort((a, b) => b.count - a.count);

  const largestFiles = [...files].sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 10);
  const recentUploads = [...files].slice(0, 10);

  return {
    files,
    totalFiles,
    totalStorage,
    typeDistribution,
    largestFiles,
    recentUploads,
  };
}

export async function deleteAdminFile(fileId: string): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', fileId);

  if (error) throw error;
}

// 5. Shared Links
export async function getAdminShares(): Promise<AdminShareItem[]> {
  const [{ data, error }, profileMap] = await Promise.all([
    supabase
      .from('shares')
      .select('*, file:files(name), folder:folders(name)')
      .order('created_at', { ascending: false })
      .limit(200),
    fetchProfilesMap(),
  ]);

  if (error) throw error;

  return (data || []).map((s: any) => ({
    id: s.id,
    owner_id: s.owner_id,
    owner_name: profileMap.get(s.owner_id) || 'System User',
    file_id: s.file_id,
    folder_id: s.folder_id,
    resource_name: s.file?.name || s.folder?.name || 'Shared Resource',
    resource_type: s.file_id ? 'file' : 'folder',
    token: s.token,
    password_enabled: !!s.password_enabled,
    allow_download: s.allow_download ?? true,
    created_at: s.created_at,
    expires_at: s.expires_at,
    revoked_at: s.revoked_at,
  }));
}

export async function revokeAdminShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from('shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', shareId);

  if (error) throw error;
}

// 6. Admin Activity
export async function getAdminActivity(): Promise<AdminActivityItem[]> {
  const [{ data, error }, profileMap] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('id, user_id, action, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    fetchProfilesMap(),
  ]);

  if (error) throw error;

  return (data || []).map((l: any) => ({
    id: l.id,
    user_id: l.user_id,
    user_name: profileMap.get(l.user_id) || 'System User',
    action: l.action,
    resource_name: l.metadata?.name || l.metadata?.filename || l.metadata?.resource,
    created_at: l.created_at,
    metadata: l.metadata || {},
  }));
}

// 7. Admin Folder Management
export interface AdminFolderItem {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  storage_path: string;
}

export async function getAdminFolders(): Promise<AdminFolderItem[]> {
  const [{ data, error }, profileMap] = await Promise.all([
    supabase
      .from('folders')
      .select('id, name, owner_id, parent_id, created_at, updated_at, deleted_at')
      .is('parent_id', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    fetchProfilesMap(),
  ]);

  if (error) throw error;

  return (data || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    owner_id: f.owner_id,
    owner_name: profileMap.get(f.owner_id) || 'Administrator',
    parent_id: f.parent_id,
    created_at: f.created_at,
    updated_at: f.updated_at,
    storage_path: `users/${f.owner_id}/folders/${f.id}/`,
  }));
}

export async function createAdminFolder(adminUserId: string, name: string): Promise<AdminFolderItem> {
  const folderName = name.trim();
  if (!folderName) {
    throw new Error('Folder name cannot be empty');
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({
      owner_id: adminUserId,
      name: folderName,
      parent_id: null,
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: adminUserId,
    action: 'folder_create',
    folder_id: data.id,
    metadata: { name: folderName, created_by_admin: true },
  });

  return {
    id: data.id,
    name: data.name,
    owner_id: data.owner_id,
    owner_name: 'Administrator',
    parent_id: data.parent_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    storage_path: `users/${data.owner_id}/folders/${data.id}/`,
  };
}

export async function deleteAdminFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);

  if (error) throw error;
}

export async function updateAdminTask(taskId: string, name: string): Promise<void> {
  const taskName = name.trim();
  if (!taskName) {
    throw new Error('Task name cannot be empty');
  }

  const { error } = await supabase
    .from('folders')
    .update({ name: taskName, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw error;
}

// 8. Task Access Control Methods
export interface TaskAccessItem {
  id: string;
  task_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  granted_by: string;
  created_at: string;
}

export async function getTaskAccessList(taskId: string): Promise<TaskAccessItem[]> {
  try {
    const [{ data: accessData, error }, profileMap] = await Promise.all([
      supabase
        .from('task_access')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false }),
      fetchProfilesMap(),
    ]);

    if (error) return [];

    return (accessData || []).map((a: any) => ({
      id: a.id,
      task_id: a.task_id,
      user_id: a.user_id,
      user_name: profileMap.get(a.user_id) || 'System User',
      granted_by: a.granted_by,
      created_at: a.created_at,
    }));
  } catch {
    return [];
  }
}

export async function assignTaskAccess(taskId: string, targetUserId: string, grantedByAdminId: string): Promise<TaskAccessItem> {
  const cleanUserId = targetUserId.trim();
  if (!cleanUserId) {
    throw new Error('User ID cannot be empty');
  }

  // Validate UUID format
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanUserId);
  if (!isUUID) {
    throw new Error('Invalid User ID format. User ID must be a valid UUID.');
  }

  // Validate that user exists in profiles table
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', cleanUserId)
    .maybeSingle();

  if (profileErr || !profileData) {
    throw new Error(`User ID "${cleanUserId}" does not exist in the database.`);
  }

  const { data, error } = await supabase
    .from('task_access')
    .insert({
      task_id: taskId,
      user_id: cleanUserId,
      granted_by: grantedByAdminId,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
      throw new Error('User already has access permission for this task.');
    }
    throw new Error(error.message || 'Failed to grant task access permission.');
  }

  return {
    id: data.id,
    task_id: data.task_id,
    user_id: data.user_id,
    user_name: profileData.full_name || profileData.username || 'System User',
    granted_by: data.granted_by,
    created_at: data.created_at,
  };
}

export async function revokeTaskAccess(taskId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('task_access')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', targetUserId);

  if (error) throw error;
}

export async function getTaskAccessCountsMap(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('task_access')
      .select('task_id');

    if (error || !data) return {};

    const counts: Record<string, number> = {};
    data.forEach((row: any) => {
      if (row.task_id) {
        counts[row.task_id] = (counts[row.task_id] || 0) + 1;
      }
    });
    return counts;
  } catch {
    return {};
  }
}

// Task Aliases & Service Methods
export type AdminTaskItem = AdminFolderItem;
export const getAdminTasks = getAdminFolders;
export const createAdminTask = createAdminFolder;
export const deleteAdminTask = deleteAdminFolder;

// 10. User Finance Entry Access Management
export interface UserPermissionItem {
  user_id: string;
  finance_entry_access?: 'unlocked' | 'locked';
  tripolead_entry_access?: 'unlocked' | 'locked';
}

const USER_PERMISSIONS_KEY = 'dm_user_permissions';
const USER_TRIPOLEAD_PERMISSIONS_KEY = 'dm_user_tripolead_permissions';

export function getLocalUserFinanceAccessMap(): Record<string, 'unlocked' | 'locked'> {
  try {
    const stored = localStorage.getItem(USER_PERMISSIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveLocalUserFinanceAccess(targetUserId: string, accessStatus: 'unlocked' | 'locked') {
  try {
    const current = getLocalUserFinanceAccessMap();
    current[targetUserId] = accessStatus;
    localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export async function getUserFinanceAccessMap(): Promise<Record<string, 'unlocked' | 'locked'>> {
  const localMap = getLocalUserFinanceAccessMap();
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('user_id, finance_entry_access');

    if (error || !data) {
      return localMap;
    }

    const map: Record<string, 'unlocked' | 'locked'> = {};
    data.forEach((row: any) => {
      if (row.user_id) {
        map[row.user_id] = row.finance_entry_access === 'locked' ? 'locked' : 'unlocked';
      }
    });
    return { ...localMap, ...map };
  } catch {
    return localMap;
  }
}

export async function setUserFinanceAccess(
  targetUserId: string,
  accessStatus: 'unlocked' | 'locked'
): Promise<void> {
  // Update local memory fallback first for instant state update
  saveLocalUserFinanceAccess(targetUserId, accessStatus);

  try {
    const { error } = await supabase
      .from('user_permissions')
      .upsert(
        {
          user_id: targetUserId,
          finance_entry_access: accessStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.warn('Supabase user_permissions notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase user_permissions catch notice:', err);
  }
}

/* TRIPO LEAD ACCESS CONTROL */

export function getLocalUserTripoLeadAccessMap(): Record<string, 'unlocked' | 'locked'> {
  try {
    const stored = localStorage.getItem(USER_TRIPOLEAD_PERMISSIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveLocalUserTripoLeadAccess(targetUserId: string, accessStatus: 'unlocked' | 'locked') {
  try {
    const current = getLocalUserTripoLeadAccessMap();
    current[targetUserId] = accessStatus;
    localStorage.setItem(USER_TRIPOLEAD_PERMISSIONS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export async function getUserTripoLeadAccessMap(): Promise<Record<string, 'unlocked' | 'locked'>> {
  const localMap = getLocalUserTripoLeadAccessMap();
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('user_id, tripolead_entry_access');

    if (error || !data) {
      return localMap;
    }

    const map: Record<string, 'unlocked' | 'locked'> = {};
    data.forEach((row: any) => {
      if (row.user_id) {
        map[row.user_id] = row.tripolead_entry_access === 'locked' ? 'locked' : 'unlocked';
      }
    });
    return { ...localMap, ...map };
  } catch {
    return localMap;
  }
}

export async function setUserTripoLeadAccess(
  targetUserId: string,
  accessStatus: 'unlocked' | 'locked'
): Promise<void> {
  saveLocalUserTripoLeadAccess(targetUserId, accessStatus);

  try {
    const { error } = await supabase
      .from('user_permissions')
      .upsert(
        {
          user_id: targetUserId,
          tripolead_entry_access: accessStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.warn('Supabase tripolead user_permissions notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase tripolead user_permissions catch notice:', err);
  }
}
