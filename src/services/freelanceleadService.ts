import { supabase } from '@/lib/supabase/client';

export type FreelanceLeadStatus = 'Pending' | 'No Response' | 'Complete' | 'Follow up';

export interface FreelanceLeadEntry {
  id: string;
  task_id: string;
  hotel_name: string;
  district: string;
  area: string;
  location_link?: string | null;
  phone_number?: string | null;
  contact_person?: string | null;
  status?: FreelanceLeadStatus | null;
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

const LOCAL_STORAGE_PREFIX = 'dm_freelancelead_entries_';

function getLocalEntries(taskId: string): FreelanceLeadEntry[] {
  try {
    const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${taskId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(taskId: string, entries: FreelanceLeadEntry[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${taskId}`, JSON.stringify(entries));
  } catch {}
}

export async function getFreelanceLeadEntries(
  taskId: string,
  search?: string
): Promise<FreelanceLeadEntry[]> {
  try {
    let query = supabase
      .from('freelancelead_entries')
      .select('*')
      .eq('task_id', taskId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query = query.or(`hotel_name.ilike.${s},district.ilike.${s},area.ilike.${s},phone_number.ilike.${s},contact_person.ilike.${s}`);
    }

    const { data, error } = await query;
    if (!error && data) {
      const localMap = new Map(getLocalEntries(taskId).map((e) => [e.id, e]));
      const merged = (data as FreelanceLeadEntry[]).map((dbEntry) => {
        const local = localMap.get(dbEntry.id);
        if (local && local.updated_at > dbEntry.updated_at) {
          return local;
        }
        return dbEntry;
      });

      // Add local-only entries that don't exist in DB yet
      const dbIds = new Set(data.map((d: any) => d.id));
      getLocalEntries(taskId).forEach((loc) => {
        if (!dbIds.has(loc.id) && !loc.deleted_at) {
          merged.unshift(loc);
        }
      });

      return merged;
    }
  } catch {
    // Fall back to local storage
  }

  const local = getLocalEntries(taskId).filter((e) => !e.deleted_at);
  if (!search || !search.trim()) return local;
  const s = search.trim().toLowerCase();
  return local.filter(
    (e) =>
      e.hotel_name.toLowerCase().includes(s) ||
      e.district.toLowerCase().includes(s) ||
      e.area.toLowerCase().includes(s) ||
      (e.phone_number && e.phone_number.toLowerCase().includes(s)) ||
      (e.contact_person && e.contact_person.toLowerCase().includes(s))
  );
}

export async function getFreelanceLeadRecentEntries(
  taskId: string,
  limit: number = 20
): Promise<FreelanceLeadEntry[]> {
  const all = await getFreelanceLeadEntries(taskId);
  return all
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
}

export async function getFreelanceLeadTrashEntries(
  taskId: string
): Promise<FreelanceLeadEntry[]> {
  try {
    const { data, error } = await supabase
      .from('freelancelead_entries')
      .select('*')
      .eq('task_id', taskId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (!error && data) {
      return data as FreelanceLeadEntry[];
    }
  } catch {}

  return getLocalEntries(taskId).filter((e) => Boolean(e.deleted_at));
}

export async function addFreelanceLeadEntry(
  taskId: string,
  entry: {
    hotel_name: string;
    district: string;
    area: string;
    location_link?: string;
    phone_number?: string;
  },
  userId?: string
): Promise<FreelanceLeadEntry> {
  const newEntry: FreelanceLeadEntry = {
    id: crypto.randomUUID(),
    task_id: taskId,
    hotel_name: entry.hotel_name,
    district: entry.district,
    area: entry.area,
    location_link: entry.location_link || null,
    phone_number: entry.phone_number || null,
    contact_person: null,
    status: null,
    approach_date: null,
    short_notes: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Always save locally first for instantaneous UX & offline support
  const local = getLocalEntries(taskId);
  local.unshift(newEntry);
  saveLocalEntries(taskId, local);

  try {
    const { data, error } = await supabase
      .from('freelancelead_entries')
      .insert({
        id: newEntry.id,
        task_id: taskId,
        hotel_name: newEntry.hotel_name,
        district: newEntry.district,
        area: newEntry.area,
        location_link: newEntry.location_link,
        phone_number: newEntry.phone_number,
        created_by: userId || null,
      })
      .select()
      .single();

    if (!error && data) {
      const updatedLocal = getLocalEntries(taskId).map((e) => (e.id === newEntry.id ? data : e));
      saveLocalEntries(taskId, updatedLocal);
      return data as FreelanceLeadEntry;
    }
  } catch {}

  return newEntry;
}

/**
 * Check if user is authorized to modify Freelance Lead entries (Admin or vishal@gmail.com)
 */
async function checkCanModifyFreelanceLead(userId?: string): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.email?.trim().toLowerCase() === 'vishal@gmail.com') {
      return true;
    }
    if (!userId && userData?.user) {
      userId = userData.user.id;
    }
  } catch {}

  if (!userId) return false;

  try {
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) return true;
  } catch {}

  try {
    const { data: isAdminRpc } = await supabase.rpc('is_admin', { uid: userId });
    if (isAdminRpc === true) return true;
  } catch {}

  return false;
}

export async function updateFreelanceLeadEntry(
  taskId: string,
  entryId: string,
  updates: {
    hotel_name?: string;
    district?: string;
    area?: string;
    location_link?: string;
    phone_number?: string | null;
    contact_person?: string | null;
    status?: FreelanceLeadStatus | null;
    approach_date?: string | null;
    short_notes?: string | null;
  },
  userId?: string
): Promise<void> {
  const canModify = await checkCanModifyFreelanceLead(userId);
  if (!canModify) {
    throw new Error('Access Denied: You do not have permission to modify Freelance Lead entries.');
  }

  const now = new Date().toISOString();

  // Update local storage immediately
  const local = getLocalEntries(taskId);
  const updatedLocal = local.map((item) => {
    if (item.id === entryId) {
      return {
        ...item,
        ...updates,
        updated_at: now,
      };
    }
    return item;
  });
  saveLocalEntries(taskId, updatedLocal);

  try {
    await supabase
      .from('freelancelead_entries')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', entryId);
  } catch {}
}

export async function softDeleteFreelanceLeadEntry(
  taskId: string,
  entryId: string,
  userId?: string
): Promise<void> {
  const canModify = await checkCanModifyFreelanceLead(userId);
  if (!canModify) {
    throw new Error('Access Denied: You do not have permission to delete Freelance Lead entries.');
  }

  const now = new Date().toISOString();

  const local = getLocalEntries(taskId);
  const updatedLocal = local.map((item) => {
    if (item.id === entryId) {
      return { ...item, deleted_at: now, updated_at: now };
    }
    return item;
  });
  saveLocalEntries(taskId, updatedLocal);

  try {
    await supabase
      .from('freelancelead_entries')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', entryId);
  } catch {}
}

export async function restoreFreelanceLeadEntry(
  taskId: string,
  entryId: string
): Promise<void> {
  const now = new Date().toISOString();

  const local = getLocalEntries(taskId);
  const updatedLocal = local.map((item) => {
    if (item.id === entryId) {
      return { ...item, deleted_at: null, updated_at: now };
    }
    return item;
  });
  saveLocalEntries(taskId, updatedLocal);

  try {
    await supabase
      .from('freelancelead_entries')
      .update({ deleted_at: null, updated_at: now })
      .eq('id', entryId);
  } catch {}
}

export async function permanentDeleteFreelanceLeadEntry(
  taskId: string,
  entryId: string,
  userId?: string
): Promise<void> {
  const canModify = await checkCanModifyFreelanceLead(userId);
  if (!canModify) {
    throw new Error('Access Denied: You do not have permission to delete Freelance Lead entries.');
  }

  const local = getLocalEntries(taskId).filter((item) => item.id !== entryId);
  saveLocalEntries(taskId, local);

  try {
    await supabase
      .from('freelancelead_entries')
      .delete()
      .eq('id', entryId);
  } catch {}
}
