import { supabase } from '@/lib/supabase/client';

export interface ProofFolder {
  id: string;
  task_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

const PROOF_FOLDERS_LOCAL_STORAGE_PREFIX = 'dm_proof_folders_';

function getLocalFolders(taskId: string): ProofFolder[] {
  try {
    const data = localStorage.getItem(`${PROOF_FOLDERS_LOCAL_STORAGE_PREFIX}${taskId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalFolders(taskId: string, folders: ProofFolder[]) {
  try {
    localStorage.setItem(`${PROOF_FOLDERS_LOCAL_STORAGE_PREFIX}${taskId}`, JSON.stringify(folders));
  } catch {}
}

export async function getProofFolders(taskId: string, search?: string): Promise<ProofFolder[]> {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('parent_id', taskId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const dbFolders: ProofFolder[] = data.map((d: any) => ({
        id: d.id,
        task_id: taskId,
        name: d.name,
        created_at: d.created_at,
        updated_at: d.updated_at,
        deleted_at: d.deleted_at,
      }));

      const dbIds = new Set(dbFolders.map((f) => f.id));
      const localOnly = getLocalFolders(taskId).filter((f) => !dbIds.has(f.id) && !f.deleted_at);
      const merged = [...localOnly, ...dbFolders];

      if (!search || !search.trim()) return merged;
      const s = search.trim().toLowerCase();
      return merged.filter((f) => f.name.toLowerCase().includes(s));
    }
  } catch {}

  const local = getLocalFolders(taskId).filter((f) => !f.deleted_at);
  if (!search || !search.trim()) return local;
  const s = search.trim().toLowerCase();
  return local.filter((f) => f.name.toLowerCase().includes(s));
}

export async function createProofFolder(taskId: string, name: string, userId?: string): Promise<ProofFolder> {
  const newFolder: ProofFolder = {
    id: crypto.randomUUID(),
    task_id: taskId,
    name: name.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  const local = getLocalFolders(taskId);
  local.unshift(newFolder);
  saveLocalFolders(taskId, local);

  try {
    const { data, error } = await supabase
      .from('folders')
      .insert({
        id: newFolder.id,
        owner_id: userId || null,
        parent_id: taskId,
        name: newFolder.name,
      })
      .select()
      .single();

    if (!error && data) {
      const updatedLocal = getLocalFolders(taskId).map((f) => (f.id === newFolder.id ? { ...newFolder, id: data.id } : f));
      saveLocalFolders(taskId, updatedLocal);
      return {
        id: data.id,
        task_id: taskId,
        name: data.name,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch {}

  return newFolder;
}

export async function deleteProofFolder(taskId: string, folderId: string): Promise<void> {
  const local = getLocalFolders(taskId).filter((f) => f.id !== folderId);
  saveLocalFolders(taskId, local);

  try {
    await supabase.from('folders').delete().eq('id', folderId);
  } catch {}
}
