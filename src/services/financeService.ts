import { supabase } from '@/lib/supabase/client';
import { getLocalUserFinanceAccessMap } from '@/services/adminService';

export interface FinanceEntry {
  id: string;
  task_id: string;
  date: string;
  item: string;
  category: string;
  description: string;
  person: string;
  amount: number;
  elumugam_amount?: number | null;
  deepak_amount?: number | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_FINANCE_CATEGORIES = [
  'Software',
  'Document',
  'ID Card',
  'Seal',
  'PAN',
  'Workshop',
];

export const DEFAULT_CATEGORY_ITEMS: Record<string, string[]> = {
  Software: [
    'Renewal (KVM1) VPS',
    'Organisation Gmail',
    'Supabase',
    'Claude',
  ],
  Document: ['Agreement', 'Invoice', 'Report'],
  'ID Card': ['Employee ID', 'Company ID'],
  Seal: ['Company Seal', 'Office Seal'],
  PAN: ['PAN Document'],
};

export const ITEM_NAME_MAPPINGS: Record<string, string> = {
  'Microsoft 365': 'Renewal (KVM1) VPS',
  Adobe: 'Organisation Gmail',
  Antivirus: 'Supabase',
  'Cloud Storage': 'Claude',
};

export function mapLegacyItemName(name: string): string {
  return ITEM_NAME_MAPPINGS[name] || name;
}

const CATEGORIES_STORAGE_KEY = 'dm_finance_categories';
const ITEMS_STORAGE_KEY = 'dm_finance_items';

export async function getFinanceCategories(): Promise<string[]> {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    const custom: string[] = stored ? JSON.parse(stored) : [];
    
    // Combine defaults and custom categories uniquely
    const all = Array.from(new Set([...DEFAULT_FINANCE_CATEGORIES, ...custom]));
    return all;
  } catch {
    return DEFAULT_FINANCE_CATEGORIES;
  }
}

export async function addFinanceCategory(name: string): Promise<string[]> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name cannot be empty');
  }

  const existing = await getFinanceCategories();
  const isDuplicate = existing.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    throw new Error('Category already exists.');
  }

  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    const custom: string[] = stored ? JSON.parse(stored) : [];
    const updatedCustom = [...custom, trimmed];
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCustom));

    return Array.from(new Set([...DEFAULT_FINANCE_CATEGORIES, ...updatedCustom]));
  } catch {
    return [...existing, trimmed];
  }
}

export async function deleteFinanceCategory(categoryName: string): Promise<string[]> {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    const custom: string[] = stored ? JSON.parse(stored) : [];
    const updatedCustom = custom.filter(
      (c) => c.toLowerCase() !== categoryName.toLowerCase()
    );
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCustom));
    return Array.from(new Set([...DEFAULT_FINANCE_CATEGORIES.filter(c => c !== categoryName), ...updatedCustom]));
  } catch {
    return DEFAULT_FINANCE_CATEGORIES;
  }
}

export async function getFinanceItems(category: string): Promise<string[]> {
  if (!category) return [];
  try {
    const stored = localStorage.getItem(ITEMS_STORAGE_KEY);
    const customMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    const defaults = DEFAULT_CATEGORY_ITEMS[category] || [];
    const custom = customMap[category] || [];
    return Array.from(new Set([...defaults, ...custom]));
  } catch {
    return DEFAULT_CATEGORY_ITEMS[category] || [];
  }
}

export async function addFinanceItem(category: string, itemName: string): Promise<string[]> {
  const trimmed = itemName.trim();
  if (!trimmed) {
    throw new Error('Item name cannot be empty');
  }
  if (!category) {
    throw new Error('Category must be selected');
  }

  const existing = await getFinanceItems(category);
  const isDuplicate = existing.some((i) => i.toLowerCase() === trimmed.toLowerCase());
  if (isDuplicate) {
    throw new Error('Item already exists in this category.');
  }

  try {
    const stored = localStorage.getItem(ITEMS_STORAGE_KEY);
    const customMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    const categoryCustom = customMap[category] || [];
    const updatedCustom = [...categoryCustom, trimmed];
    customMap[category] = updatedCustom;
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(customMap));

    const defaults = DEFAULT_CATEGORY_ITEMS[category] || [];
    return Array.from(new Set([...defaults, ...updatedCustom]));
  } catch {
    return [...existing, trimmed];
  }
}

export async function deleteFinanceItem(category: string, itemName: string): Promise<string[]> {
  try {
    const stored = localStorage.getItem(ITEMS_STORAGE_KEY);
    const customMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    const categoryCustom = customMap[category] || [];
    const updatedCustom = categoryCustom.filter((i) => i !== itemName);
    customMap[category] = updatedCustom;
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(customMap));

    const defaults = (DEFAULT_CATEGORY_ITEMS[category] || []).filter((i) => i !== itemName);
    return Array.from(new Set([...defaults, ...updatedCustom]));
  } catch {
    return (DEFAULT_CATEGORY_ITEMS[category] || []).filter((i) => i !== itemName);
  }
}

export const INITIAL_FINANCE_ENTRIES: FinanceEntry[] = [
  { id: 'seed-01', task_id: 'default', date: '2026-03-02', item: 'Domain name', category: 'Software', description: 'Domain name for hosting', person: 'Elumugam', amount: 650, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-02', task_id: 'default', date: '2026-03-02', item: 'VPS (KVM 1)', category: 'Software', description: 'Server for hosting', person: 'Elumugam + Deepak', amount: 567, elumugam_amount: 283, deepak_amount: 283, is_deleted: false },
  { id: 'seed-03', task_id: 'default', date: '2026-03-08', item: 'Claude', category: 'Software', description: 'Coding assistant AI tool', person: 'Elumugam + Deepak', amount: 2000, elumugam_amount: 1000, deepak_amount: 1000, is_deleted: false },
  { id: 'seed-04', task_id: 'default', date: '2026-03-19', item: 'Partnership firm', category: 'Document', description: 'Document printing for partnership firm', person: 'Elumugam + Deepak', amount: 650, elumugam_amount: 325, deepak_amount: 325, is_deleted: false },
  { id: 'seed-05', task_id: 'default', date: '2026-04-01', item: 'Renewal (KVM1) VPS', category: 'Software', description: 'Server for hosting', person: 'Elumugam', amount: 1651, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-06', task_id: 'default', date: '2026-04-12', item: 'Claude', category: 'Software', description: 'Coding assistant AI tool', person: 'Deepak', amount: 2000, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-07', task_id: 'default', date: '2026-04-13', item: 'ID Card pre cost', category: 'ID Card', description: 'TripO ID Card for 3', person: 'Deepak', amount: 500, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-08', task_id: 'default', date: '2026-04-16', item: 'ID Card pending payment', category: 'ID Card', description: 'Pending ID card payment', person: 'Elumugam', amount: 220, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-09', task_id: 'default', date: '2026-04-17', item: 'playstore developer account', category: 'Software', description: 'Devoper account for playstore', person: 'Deepak', amount: 2500, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-10', task_id: 'default', date: '2026-04-25', item: 'supabase', category: 'Software', description: 'Renewal of supabase storage', person: 'Deepak', amount: 2500, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-11', task_id: 'default', date: '2026-05-01', item: 'Partnership firm', category: 'Document', description: 'Partnership firm registration', person: 'Elumugam', amount: 200, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-12', task_id: 'default', date: '2026-05-02', item: 'Renewal (KVM1) VPS', category: 'Software', description: 'Server for hosting', person: 'Elumugam', amount: 1651, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-13', task_id: 'default', date: '2026-05-16', item: 'Organisation Gmail', category: 'Software', description: 'Gmail for Organaisation', person: 'Elumugam', amount: 500, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-14', task_id: 'default', date: '2026-05-25', item: 'supabase', category: 'Software', description: 'Renewal of supabase storage', person: 'Elumugam + Deepak', amount: 2500, elumugam_amount: 1500, deepak_amount: 1000, is_deleted: false },
  { id: 'seed-15', task_id: 'default', date: '2026-06-02', item: 'Renewal (KVM1) VPS', category: 'Software', description: 'Server for hosting', person: 'Elumugam + Deepak', amount: 1651, elumugam_amount: 851, deepak_amount: 800, is_deleted: false },
  { id: 'seed-16', task_id: 'default', date: '2026-06-05', item: 'Organisation Gmail', category: 'Software', description: 'Organaisation Gmail renewal', person: 'Elumugam', amount: 140, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-17', task_id: 'default', date: '2026-06-16', item: 'Claude', category: 'Software', description: 'Coding assistant AI tool', person: 'Elumugam + Deepak', amount: 2000, elumugam_amount: 900, deepak_amount: 1100, is_deleted: false },
  { id: 'seed-18', task_id: 'default', date: '2026-06-26', item: 'supabase', category: 'Software', description: 'Renewal of supabase storage', person: 'Elumugam + Deepak', amount: 2500, elumugam_amount: 1500, deepak_amount: 1000, is_deleted: false },
  { id: 'seed-19', task_id: 'default', date: '2026-07-01', item: 'Organisation Gmail', category: 'Software', description: 'Organaisation Gmail renewal', person: 'Elumugam', amount: 524, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-20', task_id: 'default', date: '2026-07-04', item: 'Renewal (KVM1) VPS', category: 'Software', description: 'Server for hosting', person: 'Deepak', amount: 1651, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-21', task_id: 'default', date: '2026-07-26', item: 'supabase', category: 'Software', description: 'Renewal of supabase storage', person: 'Elumugam + Deepak', amount: 2527, elumugam_amount: 1500, deepak_amount: 1027, is_deleted: false },
  { id: 'seed-22', task_id: 'default', date: '2026-08-03', item: 'Organisation Gmail', category: 'Software', description: 'Organaisation Gmail renewal', person: 'Elumugam', amount: 850, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-23', task_id: 'default', date: '2026-08-04', item: 'Renewal (KVM1) VPS', category: 'Software', description: 'Server for hosting', person: 'Elumugam + Deepak', amount: 1850, elumugam_amount: 1550, deepak_amount: 300, is_deleted: false },
  { id: 'seed-24', task_id: 'default', date: '2026-08-10', item: 'Claude', category: 'Software', description: 'Coding assistant AI tool', person: 'Elumugam', amount: 2000, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-25', task_id: 'default', date: '2026-08-17', item: 'Company Seal', category: 'Seal', description: 'Authorized signature seal', person: 'Deepak', amount: 185, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-26', task_id: 'default', date: '2026-08-17', item: 'Company PAN card', category: 'PAN', description: 'Company PAN apply', person: 'Deepak', amount: 250, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-27', task_id: 'default', date: '2026-08-23', item: 'Workshop Expense', category: 'Workshop', description: 'EgaleAI Workshop', person: 'Deepak', amount: 100, elumugam_amount: null, deepak_amount: null, is_deleted: false },
  { id: 'seed-28', task_id: 'default', date: '2026-08-25', item: 'supabase', category: 'Software', description: 'Renewal of supabase storage', person: 'Elumugam + Deepak', amount: 2950, elumugam_amount: 2300, deepak_amount: 650, is_deleted: false },
];

const ENTRIES_STORAGE_KEY = 'dm_finance_entries_data';

function loadStoredFinanceEntries(): FinanceEntry[] {
  try {
    const stored = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (stored) {
      const parsed: FinanceEntry[] = JSON.parse(stored);
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_FINANCE_ENTRIES;
}

let memoryFinanceEntries: FinanceEntry[] = loadStoredFinanceEntries();

function saveMemoryEntries() {
  try {
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(memoryFinanceEntries));
  } catch {}
}

function isUUID(val: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
}

export async function getFinanceEntries(
  taskId: string,
  search?: string,
  categoryFilter?: string
): Promise<FinanceEntry[]> {
  try {
    let query = supabase
      .from('finance_entries')
      .select('*')
      .order('date', { ascending: false });

    if (isUUID(taskId)) {
      query = query.eq('task_id', taskId);
    }

    if (categoryFilter && categoryFilter !== 'All') {
      query = query.eq('category', categoryFilter);
    }

    if (search) {
      query = query.or(
        `item.ilike.%${search}%,description.ilike.%${search}%,person.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error || !data) {
      return filterMemoryEntries(taskId, search, categoryFilter);
    }

    const activeRows = (data || []).filter((row: any) => !row.is_deleted);

    // If database returned fewer rows than initial seed, merge missing seed entries without duplicates
    if (activeRows.length < 28) {
      const dbKeys = new Set(activeRows.map((r: any) => `${r.date}_${r.item}_${r.amount}`));
      const missingSeeds = INITIAL_FINANCE_ENTRIES.filter(
        (s) => !dbKeys.has(`${s.date}_${s.item}_${s.amount}`)
      );
      const combined = [...activeRows, ...missingSeeds].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return combined.map((row: any) => ({
        ...row,
        item: mapLegacyItemName(row.item),
        amount: Number(row.amount || 0),
        elumugam_amount: row.elumugam_amount != null ? Number(row.elumugam_amount) : null,
        deepak_amount: row.deepak_amount != null ? Number(row.deepak_amount) : null,
      })) as FinanceEntry[];
    }

    return activeRows.map((row: any) => ({
      ...row,
      item: mapLegacyItemName(row.item),
      amount: Number(row.amount || 0),
      elumugam_amount: row.elumugam_amount != null ? Number(row.elumugam_amount) : null,
      deepak_amount: row.deepak_amount != null ? Number(row.deepak_amount) : null,
    })) as FinanceEntry[];
  } catch {
    return filterMemoryEntries(taskId, search, categoryFilter);
  }
}

function filterMemoryEntries(
  taskId: string,
  search?: string,
  categoryFilter?: string
): FinanceEntry[] {
  let list = memoryFinanceEntries
    .filter((e) => !e.is_deleted)
    .map((e) => ({
      ...e,
      item: mapLegacyItemName(e.item),
    }));

  if (isUUID(taskId)) {
    list = list.filter((e) => e.task_id === taskId);
  }

  if (categoryFilter && categoryFilter !== 'All') {
    list = list.filter((e) => e.category === categoryFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (e) =>
        e.item.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.person.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.date.includes(q)
    );
  }

  return list;
}

export async function createFinanceEntry(
  entry: Omit<FinanceEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<FinanceEntry> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { data: { user } } = await supabase.auth.getUser();
  const createdBy = entry.created_by || user?.id || 'anonymous';
  const targetTaskId = isUUID(entry.task_id) ? entry.task_id : null;

  // Server-side / Service-level check: Verify admin permission or user finance entry lock
  if (user) {
    const isDefaultAdmin = user.email?.toLowerCase() === 'admin@dm.com';
    if (!isDefaultAdmin) {
      const { data: rpcAdmin } = await supabase.rpc('is_admin', { uid: user.id });
      if (rpcAdmin === false) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!adminData) {
          // Check if user finance_entry_access is locked (Supabase DB or local storage)
          let isLocked = false;
          try {
            const { data: permData, error: permError } = await supabase
              .from('user_permissions')
              .select('finance_entry_access')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!permError && permData) {
              isLocked = permData.finance_entry_access === 'locked';
            } else {
              const localMap = getLocalUserFinanceAccessMap();
              isLocked = localMap[user.id] === 'locked';
            }
          } catch {
            const localMap = getLocalUserFinanceAccessMap();
            isLocked = localMap[user.id] === 'locked';
          }

          if (isLocked) {
            throw new Error('Finance entry access is locked by administrator.');
          }
        }
      }
    }
  }

  const newRecord: FinanceEntry = {
    ...entry,
    id: newId,
    task_id: targetTaskId || entry.task_id,
    amount: Number(entry.amount),
    elumugam_amount: entry.elumugam_amount != null ? Number(entry.elumugam_amount) : null,
    deepak_amount: entry.deepak_amount != null ? Number(entry.deepak_amount) : null,
    is_deleted: false,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('finance_entries')
      .insert({
        id: newId,
        task_id: targetTaskId,
        date: entry.date,
        item: entry.item,
        category: entry.category,
        description: entry.description,
        person: entry.person,
        amount: entry.amount,
        elumugam_amount: entry.elumugam_amount,
        deepak_amount: entry.deepak_amount,
        is_deleted: false,
        created_by: createdBy,
      })
      .select('*')
      .single();

    if (error) {
      if (
        error.code === '42501' ||
        (error as any).status === 403 ||
        error.status === 403 ||
        error.message?.includes('policy') ||
        error.message?.includes('permission')
      ) {
        throw new Error('Finance entry access is locked by administrator.');
      }
      memoryFinanceEntries.unshift(newRecord);
      saveMemoryEntries();
      return newRecord;
    }

    if (!data) {
      memoryFinanceEntries.unshift(newRecord);
      saveMemoryEntries();
      return newRecord;
    }

    return {
      ...data,
      amount: Number(data.amount || 0),
      elumugam_amount: data.elumugam_amount != null ? Number(data.elumugam_amount) : null,
      deepak_amount: data.deepak_amount != null ? Number(data.deepak_amount) : null,
    } as FinanceEntry;
  } catch (err: any) {
    if (
      err.message === 'Finance entry access is locked by administrator.' ||
      err.message === 'Only administrators can add finance entries.'
    ) {
      throw err;
    }
    memoryFinanceEntries.unshift(newRecord);
    saveMemoryEntries();
    return newRecord;
  }
}

export async function updateFinanceEntry(
  id: string,
  updates: Partial<Omit<FinanceEntry, 'id' | 'task_id'>>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('finance_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      updateMemoryEntry(id, updates);
    }
  } catch {
    updateMemoryEntry(id, updates);
  }
}

function updateMemoryEntry(
  id: string,
  updates: Partial<Omit<FinanceEntry, 'id' | 'task_id'>>
) {
  memoryFinanceEntries = memoryFinanceEntries.map((e) =>
    e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
  );
  saveMemoryEntries();
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('finance_entries')
      .update({
        is_deleted: true,
        deleted_at: now,
      })
      .eq('id', id);

    if (error) {
      memoryFinanceEntries = memoryFinanceEntries.map((e) =>
        e.id === id ? { ...e, is_deleted: true, deleted_at: now } : e
      );
      saveMemoryEntries();
    }
  } catch {
    memoryFinanceEntries = memoryFinanceEntries.map((e) =>
      e.id === id ? { ...e, is_deleted: true, deleted_at: now } : e
    );
    saveMemoryEntries();
  }
}

export async function getTrashFinanceEntries(): Promise<FinanceEntry[]> {
  try {
    const { data, error } = await supabase
      .from('finance_entries')
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });

    if (error || !data) {
      return memoryFinanceEntries
        .filter((e) => e.is_deleted)
        .map((e) => ({ ...e, item: mapLegacyItemName(e.item) }));
    }

    return (data || []).map((row: any) => ({
      ...row,
      item: mapLegacyItemName(row.item),
      amount: Number(row.amount || 0),
      elumugam_amount: row.elumugam_amount != null ? Number(row.elumugam_amount) : null,
      deepak_amount: row.deepak_amount != null ? Number(row.deepak_amount) : null,
    })) as FinanceEntry[];
  } catch {
    return memoryFinanceEntries
      .filter((e) => e.is_deleted)
      .map((e) => ({ ...e, item: mapLegacyItemName(e.item) }));
  }
}

export async function restoreFinanceEntry(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('finance_entries')
      .update({
        is_deleted: false,
        deleted_at: null,
      })
      .eq('id', id);

    if (error) {
      memoryFinanceEntries = memoryFinanceEntries.map((e) =>
        e.id === id ? { ...e, is_deleted: false, deleted_at: null } : e
      );
      saveMemoryEntries();
    }
  } catch {
    memoryFinanceEntries = memoryFinanceEntries.map((e) =>
      e.id === id ? { ...e, is_deleted: false, deleted_at: null } : e
    );
    saveMemoryEntries();
  }
}

export async function permanentDeleteFinanceEntry(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('finance_entries')
      .delete()
      .eq('id', id);

    if (error) {
      memoryFinanceEntries = memoryFinanceEntries.filter((e) => e.id !== id);
      saveMemoryEntries();
    }
  } catch {
    memoryFinanceEntries = memoryFinanceEntries.filter((e) => e.id !== id);
    saveMemoryEntries();
  }
}

export function subscribeToFinanceChange(onUpdate: () => void) {
  const channel = supabase
    .channel('global-finance-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'finance_entries' },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
