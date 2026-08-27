import { supabase } from '@/lib/supabase/client';
import { getLocalUserTripoLeadAccessMap } from '@/services/adminService';

export type TripoLeadStatus = 'Pending' | 'No Response' | 'Complete';

export interface TripoLeadEntry {
  id: string;
  task_id: string;
  hotel_name: string;
  district: string;
  area: string;
  location_link?: string | null;
  status?: TripoLeadStatus | null;
  approach_date?: string | null;
  short_notes?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivagangai',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi (Tuticorin)',
  'Tiruchirappalli (Trichy)',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
];

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
      // Merge with local storage status updates
      const localMap = new Map(getLocalEntries(taskId).map((e) => [e.id, e]));
      const merged = (data as TripoLeadEntry[]).map((dbEntry) => {
        const localEntry = localMap.get(dbEntry.id);
        if (localEntry) {
          return {
            ...dbEntry,
            status: localEntry.status ?? dbEntry.status,
            approach_date: localEntry.approach_date ?? dbEntry.approach_date,
            short_notes: localEntry.short_notes ?? dbEntry.short_notes,
          };
        }
        return dbEntry;
      });
      return merged;
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
        (e.location_link && e.location_link.toLowerCase().includes(q)) ||
        (e.status && e.status.toLowerCase().includes(q)) ||
        (e.short_notes && e.short_notes.toLowerCase().includes(q))
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
      const localMap = new Map(getLocalEntries(taskId).map((e) => [e.id, e]));
      return (data as TripoLeadEntry[]).map((dbEntry) => {
        const localEntry = localMap.get(dbEntry.id);
        return localEntry ? { ...dbEntry, ...localEntry } : dbEntry;
      });
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
  },
  userId?: string
): Promise<TripoLeadEntry> {
  if (userId) {
    const lockMap = getLocalUserTripoLeadAccessMap();
    if (lockMap[userId] === 'locked') {
      throw new Error('Access Denied: Your TripO Lead Entry permission is locked by Administrator.');
    }
  }

  const newEntry: TripoLeadEntry = {
    id: crypto.randomUUID(),
    task_id: taskId,
    hotel_name: entry.hotel_name.trim(),
    district: entry.district.trim(),
    area: entry.area.trim(),
    location_link: entry.location_link?.trim() || null,
    status: null,
    approach_date: null,
    short_notes: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Always save local first
  const local = getLocalEntries(taskId);
  saveLocalEntries(taskId, [newEntry, ...local]);

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
      return data as TripoLeadEntry;
    }
  } catch {}

  return newEntry;
}

export async function updateTripoLeadEntry(
  taskId: string,
  entryId: string,
  updates: {
    hotel_name?: string;
    district?: string;
    area?: string;
    location_link?: string;
    status?: TripoLeadStatus | null;
    approach_date?: string | null;
    short_notes?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const cleanUpdates: Record<string, any> = {
    updated_at: now,
  };

  if (updates.hotel_name !== undefined) cleanUpdates.hotel_name = updates.hotel_name.trim();
  if (updates.district !== undefined) cleanUpdates.district = updates.district.trim();
  if (updates.area !== undefined) cleanUpdates.area = updates.area.trim();
  if (updates.location_link !== undefined) cleanUpdates.location_link = updates.location_link?.trim() || null;
  if (updates.status !== undefined) cleanUpdates.status = updates.status;
  if (updates.approach_date !== undefined) cleanUpdates.approach_date = updates.approach_date || null;
  if (updates.short_notes !== undefined) cleanUpdates.short_notes = updates.short_notes?.trim() || null;

  // Always save to local storage immediately
  const local = getLocalEntries(taskId).map((e) =>
    e.id === entryId ? { ...e, ...cleanUpdates } : e
  );
  saveLocalEntries(taskId, local);

  try {
    const { error } = await supabase
      .from('tripolead_entries')
      .update(cleanUpdates)
      .eq('id', entryId);

    if (error) {
      // Fallback: update base columns if status/approach_date/short_notes don't exist yet on remote table
      const baseUpdates: Record<string, any> = { updated_at: now };
      if (updates.hotel_name !== undefined) baseUpdates.hotel_name = updates.hotel_name.trim();
      if (updates.district !== undefined) baseUpdates.district = updates.district.trim();
      if (updates.area !== undefined) baseUpdates.area = updates.area.trim();
      if (updates.location_link !== undefined) baseUpdates.location_link = updates.location_link?.trim() || null;

      await supabase
        .from('tripolead_entries')
        .update(baseUpdates)
        .eq('id', entryId);
    }
  } catch {}
}

export async function softDeleteTripoLeadEntry(taskId: string, entryId: string): Promise<void> {
  const now = new Date().toISOString();

  const local = getLocalEntries(taskId).map((e) =>
    e.id === entryId ? { ...e, deleted_at: now, updated_at: now } : e
  );
  saveLocalEntries(taskId, local);

  try {
    await supabase
      .from('tripolead_entries')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', entryId);
  } catch {}
}

export async function restoreTripoLeadEntry(taskId: string, entryId: string): Promise<void> {
  const now = new Date().toISOString();

  const local = getLocalEntries(taskId).map((e) =>
    e.id === entryId ? { ...e, deleted_at: null, updated_at: now } : e
  );
  saveLocalEntries(taskId, local);

  try {
    await supabase
      .from('tripolead_entries')
      .update({ deleted_at: null, updated_at: now })
      .eq('id', entryId);
  } catch {}
}

export async function permanentDeleteTripoLeadEntry(taskId: string, entryId: string): Promise<void> {
  const local = getLocalEntries(taskId).filter((e) => e.id !== entryId);
  saveLocalEntries(taskId, local);

  try {
    await supabase
      .from('tripolead_entries')
      .delete()
      .eq('id', entryId);
  } catch {}
}
