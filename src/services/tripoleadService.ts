import { supabase } from '@/lib/supabase/client';

export interface TripoLeadEntry {
  id: string;
  task_id: string;
  hotel_name: string;
  district: string;
  area: string;
  location_link?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_PREFIX = 'dm_tripolead_entries_';

function getLocalEntries(taskId: string): TripoLeadEntry[] {
  try {
    const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${taskId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(taskId: string, entries: TripoLeadEntry[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${taskId}`, JSON.stringify(entries));
  } catch {}
}

export async function getTripoLeadEntries(
  taskId: string,
  search?: string
): Promise<TripoLeadEntry[]> {
  try {
    let query = supabase
      .from('tripolead_entries')
      .select('*')
      .eq('task_id', taskId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query = query.or(`hotel_name.ilike.${s},district.ilike.${s},area.ilike.${s}`);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as TripoLeadEntry[];
    }
  } catch {}

  // Fallback to localStorage
  let local = getLocalEntries(taskId).filter((e) => !e.deleted_at);
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    local = local.filter(
      (e) =>
        e.hotel_name.toLowerCase().includes(q) ||
        e.district.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q) ||
        (e.location_link && e.location_link.toLowerCase().includes(q))
    );
  }
  return local;
}

export async function getTripoLeadRecentEntries(taskId: string, limit = 50): Promise<TripoLeadEntry[]> {
  try {
    const { data, error } = await supabase
      .from('tripolead_entries')
      .select('*')
      .eq('task_id', taskId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data as TripoLeadEntry[];
    }
  } catch {}

  const local = getLocalEntries(taskId)
    .filter((e) => !e.deleted_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return local.slice(0, limit);
}

export async function getTripoLeadTrashEntries(taskId: string): Promise<TripoLeadEntry[]> {
  try {
    const { data, error } = await supabase
      .from('tripolead_entries')
      .select('*')
      .eq('task_id', taskId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (!error && data) {
      return data as TripoLeadEntry[];
    }
  } catch {}

  return getLocalEntries(taskId)
    .filter((e) => !!e.deleted_at)
    .sort((a, b) => new Date(b.deleted_at!).getTime() - new Date(a.deleted_at!).getTime());
}

export async function addTripoLeadEntry(
  taskId: string,
  entry: {
    hotel_name: string;
    district: string;
    area: string;
    location_link?: string;
  }
): Promise<TripoLeadEntry> {
  const newEntry: TripoLeadEntry = {
    id: crypto.randomUUID(),
    task_id: taskId,
    hotel_name: entry.hotel_name.trim(),
    district: entry.district.trim(),
    area: entry.area.trim(),
    location_link: entry.location_link?.trim() || null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('tripolead_entries')
      .insert({
        id: newEntry.id,
        task_id: taskId,
        hotel_name: newEntry.hotel_name,
        district: newEntry.district,
        area: newEntry.area,
        location_link: newEntry.location_link,
      })
      .select()
      .single();

    if (!error && data) {
      const local = getLocalEntries(taskId);
      saveLocalEntries(taskId, [data as TripoLeadEntry, ...local]);
      return data as TripoLeadEntry;
    }
  } catch {}

  const local = getLocalEntries(taskId);
  const updated = [newEntry, ...local];
  saveLocalEntries(taskId, updated);
  return newEntry;
}

export async function updateTripoLeadEntry(
  taskId: string,
  entryId: string,
  updates: {
    hotel_name: string;
    district: string;
    area: string;
    location_link?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const cleanUpdates = {
    hotel_name: updates.hotel_name.trim(),
    district: updates.district.trim(),
    area: updates.area.trim(),
    location_link: updates.location_link?.trim() || null,
    updated_at: now,
  };

  try {
    const { error } = await supabase
      .from('tripolead_entries')
      .update(cleanUpdates)
      .eq('id', entryId);

    if (!error) {
      const local = getLocalEntries(taskId).map((e) =>
        e.id === entryId ? { ...e, ...cleanUpdates } : e
      );
      saveLocalEntries(taskId, local);
      return;
    }
  } catch {}

  const local = getLocalEntries(taskId).map((e) =>
    e.id === entryId ? { ...e, ...cleanUpdates } : e
  );
  saveLocalEntries(taskId, local);
}

export async function softDeleteTripoLeadEntry(taskId: string, entryId: string): Promise<void> {
  const now = new Date().toISOString();

  try {
    const { error } = await supabase
      .from('tripolead_entries')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', entryId);

    if (!error) {
      const local = getLocalEntries(taskId).map((e) =>
        e.id === entryId ? { ...e, deleted_at: now, updated_at: now } : e
      );
      saveLocalEntries(taskId, local);
      return;
    }
  } catch {}

  const local = getLocalEntries(taskId).map((e) =>
    e.id === entryId ? { ...e, deleted_at: now, updated_at: now } : e
  );
  saveLocalEntries(taskId, local);
}

export async function restoreTripoLeadEntry(taskId: string, entryId: string): Promise<void> {
  const now = new Date().toISOString();

  try {
    const { error } = await supabase
      .from('tripolead_entries')
      .update({ deleted_at: null, updated_at: now })
      .eq('id', entryId);

    if (!error) {
      const local = getLocalEntries(taskId).map((e) =>
        e.id === entryId ? { ...e, deleted_at: null, updated_at: now } : e
      );
      saveLocalEntries(taskId, local);
      return;
    }
  } catch {}

  const local = getLocalEntries(taskId).map((e) =>
    e.id === entryId ? { ...e, deleted_at: null, updated_at: now } : e
  );
  saveLocalEntries(taskId, local);
}

export async function permanentDeleteTripoLeadEntry(taskId: string, entryId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tripolead_entries')
      .delete()
      .eq('id', entryId);

    if (!error) {
      const local = getLocalEntries(taskId).filter((e) => e.id !== entryId);
      saveLocalEntries(taskId, local);
      return;
    }
  } catch {}

  const local = getLocalEntries(taskId).filter((e) => e.id !== entryId);
  saveLocalEntries(taskId, local);
}
